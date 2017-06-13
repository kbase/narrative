"""
Test log proxy and kblogging
"""
import logging
import os
import time
import unittest
import util
from biokbase.narrative.common import kblogging

__author__ = 'Dan Gunter <dkgunter@lbl.gov>'

_log = util.test_logger('test_log_client')


class TestClient(unittest.TestCase):

    poll_sec = 0.5
    recv, recv_thread = None, None

    def setUp(self):
        config = util.TestConfig()
        tlog = logging.getLogger("tornado.application")
        tlog.setLevel(logging.INFO)
        tlog.addHandler(logging.StreamHandler())
        os.environ[kblogging.KBASE_PROXY_ENV] = config.file_path('logproxy.conf')

    def start_receiver(self):
        proxy_config = kblogging.get_proxy_config()
        self.recv, self.recv_thread = util.start_tcp_server(
            proxy_config.host, proxy_config.port, self.poll_sec)

    def stop_receiver(self, kblog):
        kblogging.reset_handlers()
        util.stop_tcp_server(self.recv, self.recv_thread)

    def test_simple(self):
        self.start_receiver()

        # create logger and send messages
        _log.info("create logger, send messages")
        kblog = kblogging.get_logger("test", init=True)
        kblog.info("hello")
        kblog.info("world")

        # wait for the poll
        time.sleep(self.poll_sec * 4)

        # fetch whatever the receiver got
        data = self.recv.get_data()

        self.stop_receiver(kblog)

        # check that receiver got the (buffered) messages
        self.assertEqual(data, "helloworld")

    @unittest.skip("Skipping buffering test for now")
    def test_buffering(self):
        # create logger and send messages
        kblog = kblogging.get_logger("test")
        kblog.info("hello")
        kblog.info("world")

        self.start_receiver()

        # wait for the poll
        time.sleep(self.poll_sec * 4)

        # fetch whatever the receiver got
        data = self.recv.get_data()

        self.stop_receiver(kblog)

        # check that receiver got the (buffered) messages
        self.assertEqual(data, "helloworld")

if __name__ == '__main__':
    unittest.main()
