"""
Common narrative logging functions.

Other biokbase modules can use the logging like this:

    from biokbase.narrative.common.kblogging import get_logger
    _log = get_logger(__name__)

Log messages are free-form, *but* the MongoDB handler will break any
parts of the message in the form '<key>=<value>' into their own fields
in the MongoDB record.

Logging to MongoDB will be enabled if the file KBASE_TMP_CFGFILE
(see defn. below) is present and readable as a JSON file with the
keys given by the MongoSettings class, e.g.:
    {
        "host": "localhost",
        "port": 27017,
        "user": "joe",
        "password": "schmoe",
        "db": "mydb",
        "collection": "mylogs"
    }
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '2014-07-31'

import json
import logging
import os
import re
# Guarded import of MongoDB
log_to_mongo = False
try:
    import pymongo
    log_to_mongo = True
except ImportError:
    pymongo = None
# Local
from .util import kbase_env


## Constants


KBASE_TMP_DIR = "/tmp"
KBASE_TMP_LOGFILE = os.path.join(KBASE_TMP_DIR, "kbase-narrative.log")
KBASE_TMP_CFGFILE = os.path.join(KBASE_TMP_DIR, "kbase-logdb.conf")


## Functions


def get_logger(name=""):
    """Get a given KBase log obj.

    :param name: name (a.b.c) of the logging namespace, which may be
                 relative or absolute (starting with 'biokbase.'), or
                 empty in which case the root logger is returned
    :return: Log object
    :rtype: logging.Logger
    """
    # no name => root
    if not name:
        log = logging.getLogger("biokbase")
    # absolute name
    elif name.startswith("biokbase."):
        log = logging.getLogger(name)
    # relative name
    else:
        log = logging.getLogger("biokbase." + name)
    return log

## Classes

class LogMeta(object):
    """Static metadata providing context for logs.
    """
    _unk = '?'

    @property
    def user(self):
        result, token = self._unk, kbase_env.auth_token
        if token:
            m = re.search('un=([^|]+)', token)
            if m is not None:
                result = m.group(1)
        return result

    @property
    def notebook(self):
        result = kbase_env.narrative or self._unk
        return result

    @property
    def session_id(self):
        result, token = self._unk, kbase_env.auth_token
        if token:
            m = re.search('tokenid=([^|]+)', token)
            if m is not None:
                result = m.group(1)
        return result


class MongoSettings(object):
    """MongoDB settings.
    """
    host, port = 'localhost', 27017
    user, password = None, None
    db, collection = 'test', None

    def __init__(self, config_file):
        d = json.load(open(config_file))
        for key in d:
            if hasattr(self, key):
                setattr(self, key, d[key])


class KBLoggingFormatter(logging.Formatter):
    def format(self, record):
        s = logging.Formatter.format(self, record)
        return "{} {}".format(s, ' '.join(["{}={}".format(k, v)
                                           for k, v in os.environ.items()
                                           if k.startswith('KB_')]))


class MongoHandler(logging.Handler):
    """MongoDB logging handler.
    """
    DEFAULT_FIELDS = ('asctime', 'name')
    PARSE_EXPR = re.compile(r"""
        (?:
            \s*                        # leading whitespace
            ([0-9a-zA-Z_.\-]+)         # Name
            =
            (?:                        # Value:
              ([^"\s]+) |              # - simple value
              "((?:[^"] | (?<=\\)")*)" # - quoted string
            )
            \s*
        ) |
        ([^= ]+)                        # Text w/o key=value
        """, flags=re.X)

    def __init__(self, level=logging.NOTSET, coll=None, fields=None):
        """Make a new handler.

        :param level: Log level
        :param coll: MongoDB Collection instance
        :param fields: List of LogRecord attrs, or None. Do NOT use 'message'.
        """
        logging.Handler.__init__(self, level)
        self._coll = coll
        self._fields = self.DEFAULT_FIELDS if fields is None else fields

    def emit(self, record):
        """Put a record in MongoDB

        :param record: LogRecord instance
        """
        # Parse message; format is "event name=value name=value .." and
        # any name=value pair without '=' is added to the overall msg.
        event, msg = record.message.split(None, 1)
        doc = {'event': event,
               'user': _log_meta.user,
               'narr': _log_meta.notebook,
               'sess': _log_meta.session_id}
        text = []
        for n, v, vq, txt in self.PARSE_EXPR.findall(msg):
            if n:
                if vq:
                    v = vq.replace('\\"', '"')
                doc[n] = v
            else:
                text.append(txt)
        if text:
            doc['message'] = ' '.join(text)

        # Extract rest of fields from record into output doc
        for k in self._fields:
            if k == 'asctime':
                doc['time'] = getattr(record, 'asctime')
            else:
                doc[k] = getattr(record, k)

        self._coll.insert(doc)


def init_handlers():
    """Initialize and add the log handlers.
    """
    # Turn on debugging by setting environment variable KBASE_DEBUG.
    if os.environ.get("KBASE_DEBUG", None):
        _log.setLevel(logging.DEBUG)
    else:
        _log.setLevel(logging.INFO)

    # Add log handler.
    hndlr = logging.FileHandler(KBASE_TMP_LOGFILE)

    hndlr.setFormatter(logging.Formatter(
        "%(levelname)s %(asctime)s %(name)s user={} narr={} %(message)s"
        .format(_log_meta.user, _log_meta.notebook)))
    _log.addHandler(hndlr)

    # If mongo is available, add that one too

    if log_to_mongo:
        # Load settings from a special configuration file
        cfg = KBASE_TMP_CFGFILE
        try:
            mgo = MongoSettings(cfg)
        except IOError, err:
            _log.error("Cannot read MongoDB config from {}: {}".format(cfg, err))
            _log.warn("Logging to MongoDB skipped")
            mgo = None
        # Try to connect to MongoDB
        if mgo is not None:
            try:
                client = pymongo.MongoClient(host=mgo.host, port=mgo.port)
                db = client[mgo.db]
                if mgo.user is not None:
                    db.authenticate(mgo.user, mgo.password)
            except pymongo.errors.PyMongoError, err:
                _log.error("Could not connect to to MongoDB for logging: {}"
                           .format(err))
                _log.warn("Logging to MongoDB skipped")
                db = None
            # If connection succeeded, add handler
            _log.info("Connected to MongoDB")
            if db is not None:
                # Add handler
                handler = MongoHandler(coll=db[mgo.collection])
                _log.addHandler(handler)

## Run on import

# Get root log obj.
_log = get_logger()
_log_meta = LogMeta()

# If no handlers, initialize them
if not _log.handlers:
    init_handlers()
