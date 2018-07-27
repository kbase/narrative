import unittest

import mock

from biokbase.narrative.jobs.specmanager import SpecManager
from narrative_mock.mockclients import get_mock_client


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
        with self.assertRaises(ValueError):
            self.sm.check_app(self.bad_app_id, raise_exception=True)

    @mock.patch('biokbase.narrative.jobs.specmanager.clients.get', get_mock_client)
    def test_get_type_spec(self):
        self.assertIn("view_method_ids", self.sm.get_type_spec("KBaseFBA.FBA").keys())
        self.assertIn("view_method_ids", self.sm.get_type_spec("KBaseFBA.NU_FBA").keys())
        with self.assertRaisesRegexp(ValueError, "Unknown type"):
            self.assertIn("view_method_ids", self.sm.get_type_spec("KBaseExpression.NU_FBA").keys())


if __name__ == "__main__":
    unittest.main()
