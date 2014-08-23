"""
Code to proxy logs from the narrative, over a socket, to a DB.
The proxy will have root permissions so it can read protected
configuration files.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '8/22/14'

import asyncore
import json
import logging
import pymongo
import pickle
import signal
import socket
import struct
import sys
import time

log = None #  global logger

# Handle ^C and other signals
m_fwd = None


def on_signal(signo, frame):
    if signo in (signal.SIGHUP, signal.SIGKILL, signal.SIGABRT):
        log.warn("Stop on signal {:d}".format(signo))
        m_fwd.close()
        time.sleep(1)
        sys.exit(0)

class DBAuthError(Exception):
    def __init__(self, host, port, db):
        msg = "Authorization failed to {host}:{port:d}/{db}".format(
            host=host, port=port, db=db)
        Exception.__init__(self, msg)


class Configuration(object):
    def __init__(self, input_file):
        """
        Read and parse configuration from input file.

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
                self._obj = json.load(input_file)
            except (IOError, ValueError):
                raise
            except Exception as err:
                raise ValueError("Unknown error while parsing JSON file '{}': {}"
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
    DEFAULT_DB_HOST = 'localhost'
    DEFAULT_DB_PORT = 27017

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
        return self._obj.get('db',
                             self._obj['database'])

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
            log.error("Log message size ({:d}) > 64K, possibly corrupt header"
                      .format(size))
            return
        print("read {:d} bytes".format(size))
        chunk = self.recv(size)
        while len(chunk) < size:
            chunk = chunk + self.recv(size - len(chunk))
        obj = pickle.loads(chunk)

        # Add dict to DB
        self._coll.insert(obj)


def main():
    global m_fwd, log

    log = logging.getLogger("log_proxy")
    log.addHandler(logging.StreamHandler())
    log.setLevel(logging.INFO)

    try:
        config = DBConfiguration("/tmp/kbase_logforward.conf")
    except (IOError, ValueError) as err:
        log.critical("Configuration failed: {}".format(err))
        return 1

    m_fwd = LogForwarder(config)

    asyncore.loop()

    return 0

if __name__ == '__main__':
    sys.exit(main())
