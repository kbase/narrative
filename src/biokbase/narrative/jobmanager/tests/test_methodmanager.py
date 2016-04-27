"""
Tests for the method manager.
"""
from biokbase.narrative.jobmanager.methodmanager import MethodManager
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

if __name__ == "__main__":
    unittest.main()