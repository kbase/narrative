import unittest

from biokbase.narrative.common.url_config import URLS


class UrlConfigTest(unittest.TestCase):
    def test_getter(self):
        url = URLS.workspace
        assert url.endswith("/services/ws")

    def test_get_url(self):
        url = URLS.get_url("workspace")
        assert url.endswith("/services/ws")

    def test_missing_url(self):
        assert URLS.nope is None


if __name__ == "__main__":
    unittest.main()
