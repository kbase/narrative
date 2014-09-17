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

_log = None #  global logger

# Constants
EVENT_MSG_SEP = ';'  # separates event name from msg in log

# Handle ^C and other signals
m_fwd = None
CATCH_SIGNALS = (signal.SIGHUP, signal.SIGINT, signal.SIGUSR1,
                 signal.SIGUSR2)

def on_signal(signo, frame):
    _log.warn("Caught signal {:d}".format(signo))
    if signo in CATCH_SIGNALS:
        _log.warn("Stop on signal {:d}".format(signo))
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
    DEFAULT_PORT = 8899

    def __init__(self):
        Configuration.__init__(self, None)

    @property
    def host(self):
        return self.DEFAULT_HOST

    @property
    def port(self):
        return self.DEFAULT_PORT


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


class LogForwarder(asyncore.dispatcher):
    def __init__(self, config):
        asyncore.dispatcher.__init__(self)
        self._coll = self.connect_mongo(config)
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.set_reuse_addr()
        pconfig = ProxyConfiguration()
        self.bind((pconfig.host, pconfig.port))
        self.listen(5)

    def handle_accept(self):
        pair = self.accept()
        if pair is not None:
            sock, addr = pair
            _log.info('Accepted connection from {}'.format(addr))
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
            _log.error("Log message size ({:d}) > 64K, possibly corrupt header"
                       ": <{}>"
                      .format(size, self._hdr))
            self._hdr = ''
            return
        self._hdr = ''
        chunk = self.recv(size)
        while len(chunk) < size:
            chunk = chunk + self.recv(size - len(chunk))
        record = pickle.loads(chunk)

        if _log.isEnabledFor(logging.DEBUG):
            _log.debug("Got record: {}".format(record))

        try:
            self._extract_info(record)
            self._strip_logging_junk(record)
            self._fix_types(record)
        except ValueError as err:
            _log.error("Bad input to 'handle_read': {}".format(err))
            return

        # Add dict to DB
        self._coll.insert(record)

    def _extract_info(self, record):
        """
        Dissect the 'message' contents to extract event name and any
        embedded key-value pairs.

        :param record: Object to modify in-place
        """
        message = record.get('message', None)
        if message is None:
            return  # Stop!
        # Split out event name
        try:
            event, msg = message.split(EVENT_MSG_SEP, 1)
        except ValueError:
            raise ValueError("Cannot split event/msg in '{}'".format(message))
        # Break into key=value pairs
        text = parse_kvp(msg, record)
        # Anything not parsed goes back into message
        record['message'] = text
        # Event gets its own field, too
        record['event'] = event

    @staticmethod
    def _strip_logging_junk(record):
        """
        Get rid of unneeded fields from logging library.

        :param record: Raw record, modified in-place
        """
        # not needed at all
        for k in ('msg', 'threadName', 'thread', 'pathname',
                  'levelno', 'asctime', 'relativeCreated'):
            del record[k]
        # junk for service writes
        if record['filename'] == 'service.py':
            for k in 'processName', 'module', 'lineno', 'funcName':
                del record[k]
        # remove exception stuff if empty
        if record['exc_info'] is None:
            for k in 'exc_info', 'exc_text':
                del record[k]
        # remove args if empty
        if not record['args']:
            del record['args']

    @staticmethod
    def _fix_types(record):
        """
        Fix types, mainly of fields that were parsed out of the message.
        :param record: Record, modified in-place
        """
        # duration
        if 'dur' in record:
            record['dur'] = float(record['dur'])
        # convert created to datetime type (converted on insert by pymongo)
        dt = datetime.fromtimestamp(record['created'], tzlocal())
        record['created_date'] = dt
        record['created_tz'] = dt.tzname()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", "--config", dest="conf", help="Config file")
    parser.add_argument("-v", "--verbose", dest="vb", action="count",
                        default=0, help="Increase verbosity")
    args = parser.parse_args()
    return args


def main(args):
    global m_fwd, _log

    for signo in CATCH_SIGNALS:
        signal.signal(signo, on_signal)

    _log = logging.getLogger("log_proxy")
    _hnd = logging.StreamHandler()
    _hnd.setFormatter(logging.Formatter(
        "%(levelname)-8s  %(asctime)s %(message)s"))
    _log.addHandler(_hnd)
    level = (logging.WARN, logging.INFO, logging.DEBUG)[min(args.vb, 2)]
    _log.setLevel(level)

    try:
        config = DBConfiguration(args.conf)
    except (IOError, ValueError, KeyError) as err:
        _log.critical("Configuration failed: {}".format(err))
        return 1

    try:
        m_fwd = LogForwarder(config)
    except pymongo.errors.ConnectionFailure as err:
        _log.fatal("Could not connect to MongoDB server at '{}:{:d}': {}"
                   .format(config.db_host, config.db_port, err))
        return 2

    pconfig = ProxyConfiguration()
    _log.info("Listening on {}:{:d}".format(pconfig.host, pconfig.port))

    _log.info("Connected to MongoDB server at {}:{:d}"
              .format(config.db_host, config.db_port))

    _log.debug("Start main loop")
    asyncore.loop()
    _log.debug("Stop main loop")

    return 0

if __name__ == '__main__':
    sys.exit(main(parse_args()))
