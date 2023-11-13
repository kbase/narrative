import unittest
from unittest import mock

import pytest
from biokbase.narrative.jobs.specmanager import SpecManager

from .narrative_mock.mockclients import get_mock_client


class SpecManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sm = SpecManager()
        cls.good_app_id = "NarrativeTest/test_input_params"
        cls.good_tag = "dev"
        cls.bad_app_id = "NotARealApp"
        cls.bad_tag = "NotARealTag"

    @classmethod
    def tearDownClass(cls):
        cls.sm.reload()

    def test_apps_present(self):
        # on startup, should have app_specs
        assert self.good_tag in self.sm.app_specs

    def test_check_app(self):
        # good id and good tag
        assert self.sm.check_app(self.good_app_id, self.good_tag)

        # good id and bad tag no raise
        assert self.sm.check_app(self.good_app_id, self.bad_tag) is False

        # bad id and good tag no raise
        assert self.sm.check_app(self.bad_app_id, self.good_tag) is False

        # bad id with raise
        with pytest.raises(ValueError):
            self.sm.check_app(self.bad_app_id, raise_exception=True)

    @mock.patch("biokbase.narrative.jobs.specmanager.clients.get", get_mock_client)
    def test_get_type_spec(self):
        self.sm.reload()
        assert "export_functions" in list(self.sm.get_type_spec("KBaseFBA.FBA").keys())
        assert "export_functions" in list(
            self.sm.get_type_spec("KBaseFBA.NU_FBA").keys()
        )
        with pytest.raises(ValueError, match="Unknown type"):
            assert "export_functions" in list(
                self.sm.get_type_spec("KBaseExpression.NU_FBA").keys()
            )


if __name__ == "__main__":
    unittest.main()
