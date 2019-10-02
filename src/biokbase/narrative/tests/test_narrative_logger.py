import unittest
import util
import time
import json

from biokbase.narrative.common.narrative_logger import NarrativeLogger
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.util import kbase_env


class NarrativeLoggerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.log_host = 'localhost'
        self.log_port = 34567
        self.poll_interval = 0.5
        self.real_log_host = URLS.log_host
        self.real_log_port = URLS.log_port
        URLS.log_host = self.log_host
        URLS.log_port = self.log_port
        self.logger = NarrativeLogger()

    @classmethod
    def tearDownClass(self):
        URLS.log_host = self.real_log_host
        URLS.log_port = self.real_log_port

    @classmethod
    def start_log_stack(self):
        # start up a dummy listener on the (hopefully dev) host and port, etc.
        self.log_recv, self.log_recv_thread = util.start_tcp_server(
            self.log_host, self.log_port, self.poll_interval, bufferer=util.NarrativeMessageBufferer
        )

    @classmethod
    def stop_log_stack(self):
        # shut down docker compose, etc.
        util.stop_tcp_server(self.log_recv, self.log_recv_thread)

    def test_logger_init(self):
        self.assertEqual(self.logger.host, URLS.log_host)
        self.assertEqual(self.logger.port, URLS.log_port)
        self.assertEqual(self.logger.env, kbase_env.env)

    def test_null_logger(self):
        URLS.log_host = None
        URLS.log_port = None
        null_logger = NarrativeLogger()
        self.start_log_stack()
        null_logger.narrative_open("12345/67", 8)
        time.sleep(self.poll_interval * 4)
        data = self.log_recv.get_data()
        self.stop_log_stack()
        self.assertFalse(data)
        URLS.log_host = self.log_host
        URLS.log_port = self.log_port

    def test_open_narr(self):
        narrative = "12345/67"
        version = 8
        self.start_log_stack()
        self.logger.narrative_open(narrative, version)
        time.sleep(self.poll_interval * 4)
        self.assert_log_msg(self.log_recv.get_data(), "open", narrative, version)
        self.stop_log_stack()

    def test_save_narr(self):
        narrative = "67890/12"
        version = 3
        self.start_log_stack()
        self.logger.narrative_save(narrative, version)
        time.sleep(self.poll_interval * 4)
        self.assert_log_msg(self.log_recv.get_data(), "save", narrative, version)
        self.stop_log_stack()

    def test_failed_message(self):
        """
        Test that we don't throw an exception if we try to write a log without a receiving server.
        i.e. - don't start the log stack.
        """
        try:
            self.logger.narrative_save("12345/67", 8)
        except:
            self.fail('Log writing threw an unexpected exception without a live socket!')

    def assert_log_msg(self, msg, event, narrative, version):
        data = json.loads(msg)
        self.assertEqual(data["type"], "narrative")
        self.assertEqual(data["user"], "anonymous")
        self.assertEqual(data["env"], "dev")
        self.assertEqual(data["narr_ver"], version)
        self.assertEqual(data["narrative"], narrative)
        self.assertEqual(data["operation"], event)


if __name__ == "__main__":
    unittest.main()
