"""
Code to proxy logs from the narrative, over a socket, to a DB.
The proxy will tend to have root permissions so it can read protected
configuration files.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '8/22/14'

import asyncore
from datetime import datetime
from dateutil.tz import tzlocal
import logging
from logging import handlers
import pymongo
import pickle
import re
import socket
import struct
import time
import yaml
# Local
from biokbase import narrative
from biokbase.narrative.common.util import parse_kvp
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common import log_common

g_log = None #  global logger
LOGGER_NAME = "log_proxy"  # use this name for logger

m_fwd = None  # global forwarder object


class DBAuthError(Exception):
    def __init__(self, host, port, db):
        msg = "Authorization failed to {host}:{port:d}/{db}".format(
            host=host, port=port, db=db)
        Exception.__init__(self, msg)


class Configuration(object):
    def __init__(self, input_file):
        """
        Read and parse configuration from input file.
        Format is any valid YAML variant, which includes JSON.
        But the basic thing to know is that "name: value" is supported.

        :param input_file: Name or object to read from
        :type input_file: str or file or None
        :return: Configuration data
        :rtype: dict
        :raises: IOError, ValueError
        """
        self._obj = {}
        if input_file:
            if not isinstance(input_file, file):
                input_file = open(str(input_file), 'r')
            try:
                self._obj = yaml.load(input_file)
                if self._obj is None:
                    raise ValueError("Empty configuration file")
            except (IOError, ValueError):
                raise
            except Exception as err:
                raise ValueError("Unknown error while parsing '{}': {}"
                                 .format(input_file, err))


class ProxyConfiguration(Configuration):
    DEFAULT_HOST = 'localhost'
    DEFAULT_PORT = 32001

    def __init__(self, conf):
        Configuration.__init__(self, conf)

    @property
    def host(self):
        return self._obj.get('host', self.DEFAULT_HOST)

    @property
    def port(self):
        return self._obj.get('port', self.DEFAULT_PORT)

class ProxyConfigurationWrapper(ProxyConfiguration):
    def __init__(self, conf):
        ProxyConfiguration.__init__(self, conf)
        if conf is None:
            self._obj['host'] = URLS.log_proxy_host
            self._obj['port'] = URLS.log_proxy_port

class DBConfiguration(Configuration):
    """
    Parameters controlling connection to remote database server.
    Use superclass to parse YAML file.
    Spurious/unknown fields and sections are ignored.
    `db_host` and `db_port` are set to `DEFAULT_DB_HOST` and `DEFAULT_DB_PORT`
    if not given.
    If `user` is omitted then no authentication will be attempted. If `user`
    is given then `password` is required.
    The `db` and `collection` are required to specify where data is inserted.

    Example::

        db_host: <database server listen addr>
        db_port: <database server listen port>
        user: <database user name>
        password: <database password>
        db: <MongoDB database name>
        collection: <MongoDB collection name>

    """
    DEFAULT_DB_HOST = 'localhost'
    DEFAULT_DB_PORT = 27017

    def __init__(self, *a, **k):
        """
        Call superclass to parse configuration file, then perform some
        sanity checks on the data.

        :param a: Positional arguments for superclass constructor
        :param k: Keyword arguments for superclass constructor
        :raises: KeyError if required field is missing from configuration,
                 ValueError if the type/form of other values makes no sense.
        """
        Configuration.__init__(self, *a, **k)
        self._check_db_collection()
        self._check_auth_keys()

    def _check_db_collection(self):
        d, c = 'db', 'collection'
        for k in d, c:
            if k not in self._obj:
                raise KeyError('Missing {k} from configuration'.format(k=k))
        d, c = self._obj[d], self._obj[c]  # replace key with value
        total_len = len(d) + len(c) + 1
        if total_len > 123:
            raise ValueError("Database + collection name is too long, "
                             "{:d} > 123: '{}.{}'".format(total_len, d, c))
        # Check DB name for illegal chars
        m = re.match('^[a-zA-Z][_a-zA-Z0-9]*', d)
        if m is None:
            raise ValueError("Initial character not a letter in database '{}'"
                             .format(d))
        if m.end() < len(d):
            raise ValueError("Bad character at {:d}: '{}' in database '{}'"
                             .format(m.end() + 1, d[m.end()], d))
        # Check collection name for illegal chars
        m = re.match('^[a-zA-Z][_.a-zA-Z0-9]*', c)
        if m is None:
            raise ValueError("Initial character not a letter in collection '{}'"
                             .format(c))
        if m.end() < len(d):
            raise ValueError("Bad character at {:d}: '{}' in collection '{}'"
                             .format(m.end() + 1, c[m.end()], c))

    def _check_auth_keys(self):
        u, p = 'user', 'password'
        if u in self._obj:
            if not p in self._obj:
                raise KeyError('Key "{}" given but "{}" missing'.format(u, p))
        elif p in self._obj:
            del self._obj[p]  # just delete unused password

    ## Expose configuration values as class properties
    @property
    def db_host(self):
        return self._obj.get('db_host', self.DEFAULT_DB_HOST)

    @property
    def db_port(self):
        return self._obj.get('db_port', self.DEFAULT_DB_PORT)

    @property
    def user(self):
        return self._obj.get('user', None)

    @property
    def password(self):
        return self._obj.get('password', None)

    @property
    def db(self):
        return self._obj.get('db', None)

    @property
    def collection(self):
        return self._obj['collection']

class SyslogConfiguration(Configuration):
    DEFAULT_HOST = 'localhost'
    DEFAULT_PORT = 514
    DEFAULT_FACILITY = 'user'
    DEFAULT_PROTO = 'udp'

    def __init__(self, *a, **k):
        Configuration.__init__(self, *a, **k)
        self.host, self.port, self.facility, self.proto = None, None, None, None
        for default in filter(lambda x: x.startswith('DEFAULT_'),
                              vars(SyslogConfiguration).keys()):
            # transform name to corresponding property in config file
            prop = default.replace('DEFAULT_', 'syslog_').lower()
            name = prop[7:]  # strip 'syslog_' prefix
            # set attr to value in config, or default
            value = self._obj.get(prop, getattr(self, default))
            setattr(self, name, value)
        self.port = int(self.port)
        self.proto = self.proto.lower()
        # validation
        h = handlers.SysLogHandler()
        try:
            h.encodePriority(self.facility, 'info')
        except KeyError:
            raise ValueError("Invalid syslog facility '{}', must be one of: {}"
                             .format(self.facility,
                                     ', '.join(h.facility_names)))
        if not self.proto in ('tcp', 'udp'):
            raise ValueError("Invalid syslog protocol '{}', must be either "
                             "'udp' or 'tcp'")
        # keyword args for logging.SysLogHandler constructor
        self.handler_args = {
            'address': (self.host, self.port),
            'facility': self.facility,
            'socktype': {'tcp': socket.SOCK_STREAM,
                         'udp': socket.SOCK_DGRAM}[self.proto]}

def get_sample_config():
    """Get a sample configuration."""
    fields = [
        '# proxy listen host and port',
        'host: {}'.format(ProxyConfiguration.DEFAULT_HOST),
        'port: {}'.format(ProxyConfiguration.DEFAULT_PORT),
        '# mongodb server host and port',
        'db_host: {}'.format(DBConfiguration.DEFAULT_DB_HOST),
        'db_port: {}'.format(DBConfiguration.DEFAULT_DB_PORT),
        '# mongodb server user/pass and database',
        'user: joeschmoe',
        'password: letmein',
        'db: mymongodb',
        'collection: kbaselogs',
        '# syslog destination',
        'syslog_facility: {}'.format(SyslogConfiguration.DEFAULT_FACILITY),
        'syslog_host: {}'.format(SyslogConfiguration.DEFAULT_HOST),
        'syslog_port: {}'.format(SyslogConfiguration.DEFAULT_PORT),
        'syslog_proto: {}'.format(SyslogConfiguration.DEFAULT_PROTO)
    ]
    return '\n'.join(fields)

class LogForwarder(asyncore.dispatcher):
    __host, __ip = None, None

    def __init__(self, pconfig, meta=None, db=None, syslog=None):
        asyncore.dispatcher.__init__(self)
        self._meta = meta
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.set_reuse_addr()
        self.bind((pconfig.host, pconfig.port))
        self.listen(5)

        # only do this once; it takes ~5 sec
        if self.__host is None:
            g_log.info(
                "Getting fully qualified domain name (may take a few seconds)")
            self.__host = socket.getfqdn()
            try:
                self.__ip = socket.gethostbyname(self.__host)
            except socket.gaierror:
                self.__ip = '0.0.0.0'
            g_log.info(
                "Done getting fully qualified domain name: {}".format(self.__host))
        ver = narrative.version()
        self._meta.update({'host': {'name': self.__host, 'ip': self.__ip},
                           'ver': {'str': str(ver), 'major': ver.major,
                                   'minor': ver.minor, 'patch': ver.patch}})
        # handlers
        self._hnd = []
        if db:
            coll = self.connect_mongo(db)
            self._hnd.append(MongoDBHandler(coll))
        if syslog:
            h = logging.handlers.SysLogHandler(**syslog.handler_args)
            self._hnd.append(SyslogHandler(h))

    def handle_accept(self):
        pair = self.accept()
        if pair is not None:
            sock, addr = pair
            g_log.info('Accepted connection from {}'.format(addr))
            LogStreamForwarder(sock, self._hnd, self._meta)

    @staticmethod
    def connect_mongo(config):
        """
        Connect to configured MongoDB collection.

        :param config: Params for connecting
        :type config: Configuration
        :return: The collection object
        :rtype: pymongo.Collection
        :raise: DBAuthError if auth fails
        """
        client = pymongo.MongoClient(host=config.db_host, port=config.db_port)
        database = client[config.db]
        if config.user is not None:
            if not database.authenticate(config.user, password=config.password):
                raise DBAuthError(config.db_host, config.db_port, config.db)
        collection = database[config.collection]
        return collection


class LogStreamForwarder(asyncore.dispatcher):

    def __init__(self, sock, hnd, meta):
        """Forward logs coming in on socket `sock` to pymongo.Collection
        `collection`, augmenting each record with dict of values in `meta`.
        """
        asyncore.dispatcher.__init__(self, sock)
        self._meta, self._hnd = meta, hnd
        self._hdr = ''

    def handle_read(self):
        # Read header
        chunk = self.recv(4 - len(self._hdr))
        self._hdr += chunk
        if len(self._hdr) < 4:
            return
        # Parse data
        size = struct.unpack('>L', self._hdr)[0]
        if size > 65536:
            g_log.error("Log message size ({:d}) > 64K, possibly corrupt header"
                        ": <{}>".format(size, self._hdr))
            self._hdr = ''
            return
        self._hdr = ''
        chunk = self.recv(size)
        while len(chunk) < size:
            chunk = chunk + self.recv(size - len(chunk))
        record = pickle.loads(chunk)

        if g_log.isEnabledFor(logging.DEBUG):
            g_log.debug("Got record: {}".format(record))

        meta = self._meta or {}
        # Dispatch to handlers
        g_log.info("Dispatch to {:d} handlers".format(len(self._hnd)))
        for h in self._hnd:
            h.handle(record, meta)

# Handlers

class Handler(object):
    pass

class MongoDBHandler(Handler):
    def __init__(self, coll):
        self._coll = coll

    def handle(self, record, meta):
        try:
            kbrec = DBRecord(record, strict=True)
        except ValueError as err:
            g_log.error("Bad input to 'handle_read': {}".format(err))
            return
        kbrec.record.update(meta)
        self._coll.insert(kbrec.record)

class SyslogHandler(Handler):
    def __init__(self, log_handler):
        f = logging.Formatter("%(levelname)s %(asctime)s %(name)s %(message)s")
        f.converter = time.gmtime
        log_handler.setFormatter(f)
        log_handler.setLevel(logging.DEBUG - 1)  # everything!
        self._hnd = log_handler

    def handle(self, record, meta):
        if meta:
            message = record.get('message', record.get('msg', ''))
            record['msg'] = message + ' ' + log_common.format_kvps(meta)
        logrec = logging.makeLogRecord(record)
        self._hnd.emit(logrec)

# Log record

class DBRecord(object):
    """Convert logged record (dict) to object that we can store in a DB.
    """
    def __init__(self, record, strict=False):
        """Process input record. Results are stored in `record` attribute.

        Anything should parse unless `strict` is passed in, which is still
        pretty lenient but requires the "event;message" format.

        :param record: Input record which is *modified in-place*
        :type record: dict
        """
        self.strict = strict
        self.record = record.copy()
        try:
            self._extract_info()
            self._strip_logging_junk()
            self._fix_types()
        except ValueError:
            self.record = None
            raise

    def _extract_info(self):
        """Dissect the 'message' contents to extract event name and any
        embedded key-value pairs.
        """
        rec = self.record  # alias
        message = rec.get('message', rec.get('msg', None))
        if message is None:
            g_log.error("No 'message' or 'msg' field found in record: {}"
                        .format(rec))
            message = "unknown;Message field not found"
        # Split out event name
        try:
            event, msg = message.split(log_common.EVENT_MSG_SEP, 1)
        except ValueError:
            event, msg = 'event', message  # assign generic event name
            if self.strict:
                raise ValueError("Cannot split event/msg in '{}'"
                                 .format(message))
        # Break into key=value pairs
        text = parse_kvp(msg, rec)
        # Anything not parsed goes back into message
        rec['msg'] = text
        # Event gets its own field, too
        rec['event'] = event
        # Levelname is too long
        rec['level'] = rec['levelname']
        del rec['levelname']

    def _strip_logging_junk(self):
        """Get rid of unneeded fields from logging library."""
        rec = self.record  # alias
        # not needed at all
        for k in ('msg', 'threadName', 'thread', 'pathname', 'msecs', 'name',
                  'levelno', 'asctime', 'relativeCreated', 'filename',
                  'processName', 'process', 'module', 'lineno', 'funcName'):
            if k in rec:
                del rec[k]
        # remove exception stuff if empty
        if rec.get('exc_info', None) is None:
            for k in 'exc_info', 'exc_text':
                if k in rec:
                    del rec[k]
        # remove args if empty
        if 'args' in rec:
            if not rec['args']:
                del rec['args']
        elif self.strict:
            raise ValueError("missing 'args'")

    def _fix_types(self):
        """Fix types, mainly of fields that were parsed out of the message."""
        rec = self.record  # alias
        # duration
        if 'dur' in rec:
            rec['dur'] = float(rec['dur'])
        # convert created to datetime type (converted on insert by pymongo)
        if 'created' in rec:
            ts = rec.get('created')
            del rec['created']
        else:
            ts = 0
        date = datetime.fromtimestamp(ts, tzlocal())
        rec['ts'] = {'sec': ts, 'date': date, 'tz': date.tzname()}

def run(args):
    """
    Run the proxy
    :param args: Object with the following attributes
       conf - Configuration filename

    :return:
    """
    global m_fwd, g_log

    g_log = logging.getLogger(LOGGER_NAME)

    # Read configuration for destinations
    try:
        db_config = DBConfiguration(args.conf)
    except (IOError, ValueError, KeyError) as err:
        g_log.warn("Database configuration failed: {}".format(err))
        db_config = None
    try:
        syslog_config = SyslogConfiguration(args.conf)
    except (IOError, ValueError, KeyError) as err:
        g_log.warn("Syslog configuration failed: {}".format(err))
        syslog_config = None

    # Read configuration for proxy
    try:
        pconfig = ProxyConfiguration(args.conf)
    except (IOError, ValueError, KeyError) as err:
        g_log.critical("Proxy configuration failed: {}".format(err))
        return 2

    # Create LogForwarder
    try:
        metadata = dict(args.meta) if args.meta else {}
        m_fwd = LogForwarder(pconfig, db=db_config, syslog=syslog_config,
                             meta=metadata)
    except pymongo.errors.ConnectionFailure as err:
        g_log.warn("Could not connect to MongoDB server at '{}:{:d}': {}"
                   .format(db_config.db_host, db_config.db_port, err))

    # Let user know what's up
    g_log.info("Listening on {}:{:d}".format(pconfig.host, pconfig.port))
    if db_config:
        g_log.info("Connected to MongoDB server at {}:{:d}"
                   .format(db_config.db_host, db_config.db_port))
    if syslog_config:
        g_log.info("Connected to syslog at {}:{:d} ({})"
                   .format(syslog_config.host, syslog_config.port,
                           syslog_config.proto.upper()))

    # Main loop
    g_log.debug("Start main loop")
    asyncore.loop()
    g_log.debug("Stop main loop")

    return 0

