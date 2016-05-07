"""
Tests for the method manager.
"""
from biokbase.narrative.jobs.methodmanager import MethodManager
import unittest
from IPython.display import HTML

class MethodManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.mm = MethodManager()
        self.good_method_id = 'NarrativeTest/input_test'
        self.good_tag = 'dev'
        self.bad_method_id = 'NotARealMethod'
        self.bad_tag = 'NotARealTag'

    def test_methods_present(self):
        # on startup, should have method_specs
        self.assertTrue(self.good_tag in self.mm.method_specs)

    def test_check_method(self):
        # good id and good tag
        self.assertTrue(self.mm.check_method(self.good_method_id, self.good_tag))

        # good id and bad tag no raise
        self.assertFalse(self.mm.check_method(self.good_method_id, self.bad_tag))

        # bad id and good tag no raise
        self.assertFalse(self.mm.check_method(self.bad_method_id, self.good_tag))

        # bad id with raise
        with self.assertRaises(ValueError) as err:
            self.mm.check_method(self.bad_method_id, raise_exception=True)

    def test_reload_methods(self):
        self.mm.reload_methods()
        info = self.mm.method_usage(self.good_method_id, self.good_tag)
        self.assertTrue(info)

    def test_method_usage(self):
        # good id and good tag
        usage = self.mm.method_usage(self.good_method_id, self.good_tag)
        self.assertTrue(usage)

        # bad id
        with self.assertRaises(ValueError) as err:
            self.mm.method_usage(self.bad_method_id)

        # bad tag
        with self.assertRaises(ValueError) as err:
            self.mm.method_usage(self.good_method_id, self.bad_tag)

    def test_method_usage_html(self):
        usage = self.mm.method_usage(self.good_method_id, self.good_tag)
        self.assertTrue(usage._repr_html_())

    def test_method_usage_str(self):
        usage = self.mm.method_usage(self.good_method_id, self.good_tag)
        self.assertTrue(str(usage))

    def test_list_available_methods_good(self):
        methods = self.mm.list_available_methods(self.good_tag)
        self.assertIsInstance(methods, HTML)

    def test_list_available_methods_bad(self):
        with self.assertRaises(ValueError) as err:
            self.mm.list_available_methods(self.bad_tag)

    def test_run_method_good_inputs(self):
        self.assertFalse("TODO: this test and code")

    def test_run_method_bad_id(self):
        with self.assertRaises(ValueError) as err:
            self.mm.run_method(self.bad_method_id)

    def test_run_method_bad_tag(self):
        with self.assertRaises(ValueError) as err:
            self.mm.run_method(self.good_method_id, tag=self.bad_tag)

    def test_run_method_bad_version_match(self):
        # fails because a non-release tag can't be versioned
        with self.assertRaises(ValueError) as err:
            self.mm.run_method(self.good_method_id, tag=self.good_tag, version=">0.0.1")

    def test_run_method_missing_inputs(self):
        # with self.assertRaises(ValueError) as err:
        self.mm.run_method(self.good_method_id, tag=self.good_tag)

    def test_method_description(self):
        self.assertFalse("TODO: this test and code")



if __name__ == "__main__":
    unittest.main()