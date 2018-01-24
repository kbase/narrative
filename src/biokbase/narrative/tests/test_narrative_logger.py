import unittest
from biokbase.narrative.common.narrative_logger import NarrativeLogger
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.util import kbase_env

class NarrativeLoggerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.logger = NarrativeLogger()

    @classmethod
    def start_log_stack(self):
        # start up docker compose, etc.
        pass

    @classmethod
    def stop_log_stack(self):
        # shut down docker compose, etc.
        pass

    def test_logger_init(self):
        self.assertEqual(self.logger.host, URLS.log_host)
        self.assertEqual(self.logger.host, URLS.log_port)
        self.assertEqual(self.logger.env, kbase_env.env)

    def test_log

if __name__ == "__main__":
    unittest.main()
