"""
Tests for the method_util module
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

import unittest
from biokbase.narrative.jobmanager.method_util import *

class MethodUtilTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.good_tag = "release"
        self.bad_tag = "notATag"

    def test_check_tag_good(self):
        self.assertTrue(check_tag(self.good_tag))

    def test_check_tag_bad(self):
        self.assertFalse(check_tag(self.bad_tag))

    def test_check_tag_bad_except(self):
        with self.assertRaises(ValueError) as err:
            check_tag(self.bad_tag, raise_exception=True)

if __name__ == '__main__':
    unittest.main()