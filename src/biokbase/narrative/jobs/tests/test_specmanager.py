from biokbase.narrative.jobs.specmanager import SpecManager
import unittest
import mock

class SpecManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.sm = SpecManager()
        self.good_app_id = 'NarrativeTest/test_input_params'
        self.good_tag = 'dev'
        self.bad_app_id = 'NotARealApp'
        self.bad_tag = 'NotARealTag'

    def test_apps_present(self):
        # on startup, should have app_specs
        self.assertTrue(self.good_tag in self.sm.app_specs)

    def test_check_app(self):
        # good id and good tag
        self.assertTrue(self.sm.check_app(self.good_app_id, self.good_tag))

        # good id and bad tag no raise
        self.assertFalse(self.sm.check_app(self.good_app_id, self.bad_tag))

        # bad id and good tag no raise
        self.assertFalse(self.sm.check_app(self.bad_app_id, self.good_tag))

        # bad id with raise
        with self.assertRaises(ValueError) as err:
            self.sm.check_app(self.bad_app_id, raise_exception=True)


if __name__ == "__main__":
    unittest.main()