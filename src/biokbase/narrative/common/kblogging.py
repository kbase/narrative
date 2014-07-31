"""
Common narrative logging functions
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '1/30/14'

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


class Mongo(object):
    """MongoDB settings.
    """
    host = 'localhost'
    port = 27017
    #user = 'narrative'
    #password = 'letm3in'
    user, password = None, None
    db = 'logging'
    collection = 'narrative'

KBASE_TMP_DIR = "/tmp"
KBASE_TMP_LOGFILE = os.path.join(KBASE_TMP_DIR, "kbase-narrative.log")


def get_logger(name=""):
    """Get a given KBase log obj.

    :param name: name (a.b.c) of the logging namespace
    :return: Log object
    :rtype: logging.Logger
    """
    if not name:
        return logging.getLogger("biokbase")  # root of hierarchy
    return logging.getLogger("biokbase." + name)

_log = get_logger()
_log_meta = LogMeta()

# Turn on debugging by setting environment variable KBASE_DEBUG.
if os.environ.get("KBASE_DEBUG", None):
    _log.setLevel(logging.DEBUG)
else:
    _log.setLevel(logging.WARN)


class KBLoggingFormatter(logging.Formatter):
    def format(self, record):
        s = logging.Formatter.format(self, record)
        return "{} {}".format(s, ' '.join(["{}={}".format(k, v)
                                           for k, v in os.environ.items()
                                           if k.startswith('KB_')]))

# Add log handler.
_h = logging.FileHandler(KBASE_TMP_LOGFILE)


_h.setFormatter(logging.Formatter(
    "%(levelname)s %(asctime)s %(name)s user={} narr={} event=%(message)s"
    .format(_log_meta.user, _log_meta.notebook)))
_log.addHandler(_h)


# If mongo is available, add that one too

class MongoHandler(logging.Handler):
    DEFAULT_FIELDS = ('asctime', 'name')

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
        msg_parts = record.message.split()
        doc = {'event': msg_parts[0],
               'user': _log_meta.user,
               'narr': _log_meta.notebook,
               'sess': _log_meta.session_id}
        text = []
        for part in msg_parts[1:]:
            if '=' in part:
                name, value = part.split('=')
                if name == 'asctime':
                    name = 'time'
                doc[name] = value
            else:
                text.append(part)
        if text:
            doc['message'] = ' '.join(text)

        # Extract rest of fields from record into output doc
        for k in self._fields:
            doc[k] = getattr(record, k)

        self._coll.insert(doc)

if log_to_mongo:
    # Connect
    try:
        client = pymongo.MongoClient(host=Mongo.host, port=Mongo.port)
        db = client[Mongo.db]
        if Mongo.user is not None:
            db.authenticate(Mongo.user, Mongo.password)
    except pymongo.errors.PyMongoError, err:
        _log.info("Could not connect to to MongoDB for logging: {}".format(err))
    # Add handler
    handler = MongoHandler(coll=db[Mongo.collection])
    _log.addHandler(handler)



