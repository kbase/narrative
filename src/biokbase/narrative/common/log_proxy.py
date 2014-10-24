"""
Code to proxy logs from the narrative, over a socket, to a DB.
The proxy will tend to have root permissions so it can read protected
configuration files.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '8/22/14'

import argparse
import asyncore
from datetime import datetime
from dateutil.tz import tzlocal
import logging
import os
import pymongo
import pickle
import re
import signal
import socket
import struct
import sys
import yaml
# Local
from biokbase.narrative.common.util import parse_kvp
from biokbase.narrative.common.url_config import URLS

g_log = None #  global logger

# Constants
EVENT_MSG_SEP = ';'  # separates event name from msg in log

# Handle ^C and other signals
m_fwd = None
CATCH_SIGNALS = (signal.SIGHUP, signal.SIGINT, signal.SIGUSR1,
                 signal.SIGUSR2)

def on_signal(signo, frame):
    g_log.warn("Caught signal {:d}".format(signo))
    if signo in CATCH_SIGNALS:
        g_log.warn("Stop on signal {:d}".format(signo))
        m_fwd.close()


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
                raise ValueError("Unknown error while parsing YAML file '{}': {}"
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
    def __init__(self, urls):
        ProxyConfiguration.__init__(self, None)
        self._obj['host'] = urls.log_proxy_host
        self._obj['port'] = urls.log_proxy_port

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

    @classmethod
    def get_sample(cls):
        """Get a sample configuration.
        """
        fields = [
            '# proxy listen host and port',
            'host: {}'.format(ProxyConfiguration.DEFAULT_HOST),
            'port: {}'.format(ProxyConfiguration.DEFAULT_PORT),
            '# mongodb server host and port',
            'db_host: {}'.format(cls.DEFAULT_DB_HOST),
            'db_port: {}'.format(cls.DEFAULT_DB_PORT),
            '# mongodb server user/pass and database',
            'user: joeschmoe',
            'password: letmein',
            'db: mymongodb',
            'collection: kbaselogs'
        ]
        return '\n'.join(fields)

class LogForwarder(asyncore.dispatcher):
    def __init__(self, config, pconfig):
        asyncore.dispatcher.__init__(self)
        self._coll = self.connect_mongo(config)
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.set_reuse_addr()
        self.bind((pconfig.host, pconfig.port))
        self.listen(5)

    def handle_accept(self):
        pair = self.accept()
        if pair is not None:
            sock, addr = pair
            g_log.info('Accepted connection from {}'.format(addr))
            LogStreamForwarder(sock, self._coll)

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
    def __init__(self, sock, collection):
        asyncore.dispatcher.__init__(self, sock)
        self._coll = collection
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

        try:
            kbrec = KBaseLogRecord(record, strict=True)
        except ValueError as err:
            g_log.error("Bad input to 'handle_read': {}".format(err))
            return

        # Add dict to DB
        self._coll.insert(kbrec.record)

class KBaseLogRecord(object):
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
        self.record = record
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
        message = rec.get('message', None)
        if message is None:
            return  # Stop!
        # Split out event name
        try:
            event, msg = message.split(EVENT_MSG_SEP, 1)
        except ValueError:
            event, msg = 'event', message  # assign generic event name
            if self.strict:
                raise ValueError("Cannot split event/msg in '{}'"
                                 .format(message))
        # Break into key=value pairs
        text = parse_kvp(msg, rec)
        # Anything not parsed goes back into message
        rec['message'] = text
        # Event gets its own field, too
        rec['event'] = event

    def _strip_logging_junk(self):
        """Get rid of unneeded fields from logging library."""
        rec = self.record  # alias
        # not needed at all
        for k in ('msg', 'threadName', 'thread', 'pathname',
                  'levelno', 'asctime', 'relativeCreated'):
            if k in rec:
                del rec[k]
        # junk for service writes
        if rec.get('filename', '') == 'service.py':
            for k in 'processName', 'module', 'lineno', 'funcName':
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
        dt = datetime.fromtimestamp(rec.get('created', 0), tzlocal())
        rec['created_date'] = dt
        rec['created_tz'] = dt.tzname()

def parse_args():
    program_name = os.path.basename(sys.argv[0])
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", "--config", dest="conf", metavar="FILE",
                        help="Config file. To create a new config file,"
                             "try running: {} -S > my_file.conf"
                             .format(program_name))
    parser.add_argument("-S", "--sample-config", dest="smpcfg",
                        action="store_true",
                        help="Print a sample config file and exit")
    parser.add_argument("-v", "--verbose", dest="vb", action="count",
                        default=0, help="Increase verbosity")
    args = parser.parse_args()
    return args


def main(args):
    global m_fwd, g_log

    if args.smpcfg:
        print(DBConfiguration.get_sample())
        return 0

    for signo in CATCH_SIGNALS:
        signal.signal(signo, on_signal)

    g_log = logging.getLogger("log_proxy")
    _hnd = logging.StreamHandler()
    _hnd.setFormatter(logging.Formatter(
        "%(levelname)-8s  %(asctime)s %(message)s"))
    g_log.addHandler(_hnd)
    level = (logging.WARN, logging.INFO, logging.DEBUG)[min(args.vb, 2)]
    g_log.setLevel(level)

    try:
        config = DBConfiguration(args.conf)
    except (IOError, ValueError, KeyError) as err:
        g_log.critical("Database configuration failed: {}".format(err))
        return 1

    pconfig = ProxyConfigurationWrapper(URLS)
    #try:
    #    pconfig = ProxyConfiguration(args.conf)
    #except (IOError, ValueError, KeyError) as err:
    #    g_log.critical("Proxy configuration failed: {}".format(err))
    #    return 2

    try:
        m_fwd = LogForwarder(config, pconfig)
    except pymongo.errors.ConnectionFailure as err:
        g_log.fatal("Could not connect to MongoDB server at '{}:{:d}': {}"
                   .format(config.db_host, config.db_port, err))
        return 3

    g_log.info("Listening on {}:{:d}".format(pconfig.host, pconfig.port))
    g_log.info("Connected to MongoDB server at {}:{:d}"
              .format(config.db_host, config.db_port))

    g_log.debug("Start main loop")
    asyncore.loop()
    g_log.debug("Stop main loop")

    return 0

if __name__ == '__main__':
    sys.exit(main(parse_args()))
