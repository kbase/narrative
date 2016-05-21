"""
Tests for the app manager.
"""
from biokbase.narrative.jobs.appmanager import AppManager
from IPython.display import HTML
import unittest
import mock

class DummyComm(object):
    def __init__(self):
        pass
    def send(self):
        pass

class AppManagerTestCase(unittest.TestCase):
    @classmethod
    @mock.patch('biokbase.narrative.jobs.appmanager.Comm', new_callable=DummyComm, spec=DummyComm)
    def setUpClass(self, MockComm):

        # mock_thing.return_value._send_comm_message.return_value = None
        self.mm = AppManager()
        self.good_app_id = 'NarrativeTest/test_input_params'
        self.good_tag = 'dev'
        self.bad_app_id = 'NotARealApp'
        self.bad_tag = 'NotARealTag'

    def test_reload(self):
        self.mm.reload()
        info = self.mm.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(info)

    def test_app_usage(self):
        # good id and good tag
        usage = self.mm.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(usage)

        # bad id
        with self.assertRaises(ValueError) as err:
            self.mm.app_usage(self.bad_app_id)

        # bad tag
        with self.assertRaises(ValueError) as err:
            self.mm.app_usage(self.good_app_id, self.bad_tag)

    def test_app_usage_html(self):
        usage = self.mm.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(usage._repr_html_())

    def test_app_usage_str(self):
        usage = self.mm.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(str(usage))

    def test_available_apps_good(self):
        apps = self.mm.available_apps(self.good_tag)
        self.assertIsInstance(apps, HTML)

    def test_available_apps_bad(self):
        with self.assertRaises(ValueError) as err:
            self.mm.available_apps(self.bad_tag)

    def test_run_app_good_inputs(self):
        self.assertFalse("TODO: this test and code with mocking")

    def test_run_app_bad_id(self):
        with self.assertRaises(ValueError) as err:
            self.mm.run_app(self.bad_app_id)

    def test_run_app_bad_tag(self):
        with self.assertRaises(ValueError) as err:
            self.mm.run_app(self.good_app_id, tag=self.bad_tag)

    def test_run_app_bad_version_match(self):
        # fails because a non-release tag can't be versioned
        with self.assertRaises(ValueError) as err:
            self.mm.run_app(self.good_app_id, tag=self.good_tag, version=">0.0.1")

    def test_run_app_missing_inputs(self):
        with self.assertRaises(ValueError) as err:
            self.mm.run_app(self.good_app_id, tag=self.good_tag)

    def test_app_description(self):
        desc = self.mm.app_description(self.good_app_id, tag=self.good_tag)
        self.assertIsInstance(desc, HTML)

    def test_app_description_bad_tag(self):
        with self.assertRaises(ValueError) as err:
            self.mm.app_description(self.good_app_id, tag=self.bad_tag)

    def test_app_description_bad_name(self):
        with self.assertRaises(ValueError) as err:
            self.mm.app_description(self.bad_app_id)


if __name__ == "__main__":
    unittest.main()