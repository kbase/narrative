from biokbase.narrative.common.url_config import URLS
import unittest


class UrlConfigTest(unittest.TestCase):
    def test_getter(self):
        url = URLS.workspace
        self.assertTrue(url.endswith('/services/ws'))

    def test_get_url(self):
        url = URLS.get_url('workspace')
        self.assertTrue(url.endswith('/services/ws'))

    def test_missing_url(self):
        self.assertIsNone(URLS.nope)

if __name__ == "__main__":
    unittest.main()
