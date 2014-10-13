"""
Test utility functions
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'

import unittest
from biokbase.narrative.common import util

class MyTestCase(unittest.TestCase):
    def test_kvparse(self):
        for input, text, kvp in (
                ("foo", "foo", {}),
                ("name=val", "", {"name": "val"}),
                ("a name=val boy", "a boy", {"name": "val"})
        ):
            rkvp = {}
            rtext = util.parse_kvp(input, rkvp)
            self.assertEqual(text, rtext, "Text '{}' does not match "
                                          "result '{}' "
                                          "from input '{}'".format(
                text, rtext, input))
            self.assertEqual(text, rtext, "Dict '{}' does not match "
                                          "result '{}' "
                                          "from input '{}'".format(
                kvp, rkvp, input))

if __name__ == '__main__':
    unittest.main()
