"""
Unit tests for kbtypes module.
"""
__author__ = "Dan Gunter <dkgunter@lbl.gov>"
__date__ = "2013-12-09"

import unittest
from ..kbtypes import *
from IPython.utils.traitlets import HasTraits

## helper values


class VersionedThing(HasTraits):
    version = VersionNumber


class TestKbaseTypes(unittest.TestCase):
    """Test basic behavior of KBase types.
    """
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_name(self):
        """Test type name.
        """
        g = Genome()
        self.assert_(str(g) == 'Genome')

    def test_version(self):
        """Test Version type.
        """
        v = VersionNumber()
        self.failUnlessEqual(v.get_default_value(), (0, 0, 0))
        for bad_input in ("Mr. Robinson", "a.b.c", "1-2-3", "0.1.-1", (0, 1, -1)):
            msg = "bad input {} passed validation".format(bad_input)
            self.shouldRaise(KBTypeError, msg, lambda x: VersionedThing(version=x), bad_input)
        for good_input, value in (("0.1.1", (0, 1, '1')), ("13.14.97", (13, 14, '97')),):
            self.assertEqual(value, VersionedThing(version=good_input).version)

    def shouldRaise(self, exc, msg, fn, *arg, **kwargs):
        try:
            fn(*arg, **kwargs)
            if msg is None:
                msg = "{}{} did not raise {}".format(fn.__name__, arg, str(exc))
            self.assert_(False, msg)
        except exc:
            pass


if __name__ == '__main__':
    unittest.main()