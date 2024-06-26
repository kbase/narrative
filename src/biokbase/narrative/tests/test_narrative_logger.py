import json
import time
import unittest

from biokbase.narrative.common.narrative_logger import NarrativeLogger
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.util import kbase_env
from biokbase.narrative.tests import util


def assert_log_msg(msg, event, narrative, version):
    data = json.loads(msg)
    assert data["type"] == "narrative"
    assert data["user"] == "anonymous"
    assert data["env"] == "ci"
    assert data["narr_ver"] == version
    assert data["narrative"] == narrative
    assert data["operation"] == event


class NarrativeLoggerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.log_host = "localhost"
        cls.poll_interval = 0.5
        cls.real_log_host = URLS.log_host
        cls.real_log_port = URLS.log_port
        URLS.log_host = cls.log_host

    @classmethod
    def tearDownClass(cls):
        URLS.log_host = cls.real_log_host
        URLS.log_port = cls.real_log_port

    @classmethod
    def start_log_stack(cls):
        # start up a dummy listener on the (hopefully dev) host and port, etc.
        log_port = util.find_free_port()
        URLS.log_port = log_port
        cls.log_recv, cls.log_recv_thread = util.start_tcp_server(
            cls.log_host,
            log_port,
            cls.poll_interval,
            bufferer=util.NarrativeMessageBufferer,
        )

    @classmethod
    def stop_log_stack(cls):
        # shut down docker compose, etc.
        util.stop_tcp_server(cls.log_recv, cls.log_recv_thread)

    def test_logger_init(self):
        logger = NarrativeLogger()
        assert logger.host == URLS.log_host
        assert logger.port == URLS.log_port
        assert logger.env == kbase_env.env

    def test_null_logger(self):
        URLS.log_host = None
        URLS.log_port = None
        null_logger = NarrativeLogger()
        self.start_log_stack()
        null_logger.narrative_open("12345/67", 8)
        time.sleep(self.poll_interval * 4)
        data = self.log_recv.get_data()
        self.stop_log_stack()
        assert not data
        URLS.log_host = self.log_host

    def test_open_narr(self):
        narrative = "12345/67"
        version = 8
        self.start_log_stack()
        logger = NarrativeLogger()
        logger.narrative_open(narrative, version)
        time.sleep(self.poll_interval * 4)
        assert_log_msg(self.log_recv.get_data(), "open", narrative, version)
        self.stop_log_stack()

    def test_save_narr(self):
        narrative = "67890/12"
        version = 3
        self.start_log_stack()
        logger = NarrativeLogger()
        logger.narrative_save(narrative, version)
        time.sleep(self.poll_interval * 4)
        assert_log_msg(self.log_recv.get_data(), "save", narrative, version)
        self.stop_log_stack()

    def test_failed_message(self):
        """Test that we don't throw an exception if we try to write a log without a receiving server.
        i.e. - don't start the log stack.
        """
        try:
            logger = NarrativeLogger()
            logger.narrative_save("12345/67", 8)
        except BaseException:
            self.fail("Log writing threw an unexpected exception without a live socket!")


if __name__ == "__main__":
    unittest.main()
