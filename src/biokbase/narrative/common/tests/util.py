"""
Test utility functions
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'

import logging
import pickle
import struct
import threading
import time
import unittest
import SocketServer
from biokbase.narrative.common import util

_log = logging.getLogger('kbtest')
_hnd = logging.StreamHandler()
_hnd.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s %(name)s: %(message)s"))
_log.addHandler(_hnd)
_log.setLevel(logging.DEBUG)

def test_logger(name):
    return logging.getLogger('kbtest.' + name)

class MyTestCase(unittest.TestCase):
    def test_kvparse(self):
        for input, text, kvp in (
                ("foo", "foo", {}),
                ("name=val", "", {"name": "val"}),
                ("a name=val boy", "a boy", {"name": "val"})
        ):
            rkvp = {}
            rtext = util.parse_kvp(input, rkvp)
            self.assertEqual(text, rtext, "Text '{}' does not match "
                                          "result '{}' "
                                          "from input '{}'".format(
                text, rtext, input))
            self.assertEqual(text, rtext, "Dict '{}' does not match "
                                          "result '{}' "
                                          "from input '{}'".format(
                kvp, rkvp, input))


class SocketServerBuf(SocketServer.TCPServer):

    allow_reuse_address = True

    def __init__(self, addr, handler):
        SocketServer.TCPServer.__init__(self, addr, handler)
        self.buf = ""

    def get_data(self):
        """Get current buffer and clear it."""
        data, self.buf = self.buf, ""
        return data

    def server_close(self):
        self.socket.close()

def recvall(socket, n, timeout=0):
    buf, m, t = '', 0, time.time()
    while m < n:
        if timeout > 0 and (time.time() - t > timeout):
            raise RuntimeError("Timeout")
        b = socket.recv(n - m)
        if b:
            buf += b
            m += len(b)
            #print("@@ recv {}".format(len(b)))
        else:
            time.sleep(0.1)
            #print("@@ recv 0/{}".format(n - m))
    return buf

class MessageBufferer(SocketServer.BaseRequestHandler):

    def handle(self):
        self.request.settimeout(1)
        while 1:
            try:
                hdr = self.request.recv(4)
            except Exception as err:
                return
            if not hdr:
                return
            size = struct.unpack('>L', hdr)[0]
            #print("@@ body {}".format(size))
            if size < 65536:
                chunk = recvall(self.request, size, timeout=1)
                record = pickle.loads(chunk)
                #print("@@ message <{}>".format(record['message']))
                self.server.buf += record['message']


def start_tcp_server(host, port, poll_interval):
    _log.info("Starting server on {}:{}".format(host, port))
    server = SocketServerBuf((host, port), MessageBufferer)
    thr = threading.Thread(target=server.serve_forever,
                           args=[poll_interval])
    thr.daemon = True
    thr.start()
    return server, thr

def stop_tcp_server(server, thr):
    _log.info("Stopping server")
    server.shutdown()
    thr.join()
    _log.info("Stopped server")
    server.server_close()
    _log.info("Closed server")

if __name__ == '__main__':
    unittest.main()
