"""
Code to proxy logs from the narrative, over a socket, to a DB.
The proxy will have root permissions so it can read protected
configuration files.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '8/22/14'

import argparse
import asyncore
import logging
import pymongo
import pickle
import re
import signal
import socket
import struct
import sys
import yaml

_log = None #  global logger

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
    DEFAULT_PORT = 8888

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
            #print 'Incoming connection from %s' % repr(addr)
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
        self._hdr = ''
        if size > 65536:
            _log.error("Log message size ({:d}) > 64K, possibly corrupt header"
                      .format(size))
            return
        print("read {:d} bytes".format(size))
        chunk = self.recv(size)
        while len(chunk) < size:
            chunk = chunk + self.recv(size - len(chunk))
        obj = pickle.loads(chunk)

        # Add dict to DB
        self._coll.insert(obj)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", "--config", dest="conf", help="Config file")
    args = parser.parse_args()
    return args


def main(args):
    global m_fwd, _log

    for signo in CATCH_SIGNALS:
        signal.signal(signo, on_signal)

    _log = logging.getLogger("log_proxy")
    _log.addHandler(logging.StreamHandler())
    _log.setLevel(logging.INFO)

    try:
        config = DBConfiguration(args.conf)
    except (IOError, ValueError, KeyError) as err:
        _log.critical("Configuration failed: {}".format(err))
        return 1

    _log.info("Create forwarder")
    m_fwd = LogForwarder(config)

    _log.info("Start forwarding loop")
    asyncore.loop()
    _log.info("Stop forwarding loop")

    return 0

if __name__ == '__main__':
    sys.exit(main(parse_args()))
