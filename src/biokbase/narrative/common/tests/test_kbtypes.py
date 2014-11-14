"""
Unit tests for kbtypes module.
"""
__author__ = "Dan Gunter <dkgunter@lbl.gov>"
__date__ = "2013-12-09"

import unittest
import argparse
import StringIO
import os
from biokbase.narrative.common import kbtypes
from IPython.utils.traitlets import HasTraits

class HasVersion(HasTraits):
    ver = kbtypes.VersionNumber('0.0.0')

def skipUnlessCreds(fn):
    def wrapper(*a, **k):
        if 'KBASE_CREDS' in os.environ:
            return fn(*a, **k)
        else:
            raise unittest.SkipTest("Environment doesn't have KBASE_CREDS=<user>:<pass>")
    return wrapper

class TestKbaseTypes(unittest.TestCase):
    """Test basic behavior of KBase types.
    """
    user, password = None, None

    def setUp(self):
        self.args = argparse.Namespace(url=None, vb=0, bfile=None)
        self.args.user = self.user
        setattr(self.args, 'pass', self.password)

    @classmethod
    def setUpClass(cls):
        cls._types = None
        if 'KBASE_CREDS' in os.environ:
            cls.user, cls.password = os.environ['KBASE_CREDS'].split(':')

    @classmethod
    def tearDownClass(cls):
        cls._types = None

    def _get_types(self, r):
        """Limit overhead of fetching types to once per test run.
        """
        if self._types is None:
            TestKbaseTypes._types = r.get_types()
        return self._types

    def tearDown(self):
        pass

    def test_name(self):
        """Test type name.
        """
        g = kbtypes.KBaseGenome1()
        self.assertEqual(str(g), 'KBaseGenomes.Genome-1.0')
        g = kbtypes.KBaseGenome3()
        self.assertEqual(str(g), 'KBaseGenomes.Genome-3.0')

    def test_version_bad(self):
        for bad_input in ("Mr. Robinson", "a.b.c", "1-2-3", "0.1.-1", (0, 1, -1)):
            msg = "bad input {} passed validation".format(bad_input)
            self.shouldRaise(kbtypes.KBTypeError, msg,
                             HasVersion, ver=bad_input)

    def test_version_good(self):
        for good_input, value in (("0.1.1", ('0', '1', '1')),
                                  ("13.14.97", ('13', '14', '97')),
                                  ("2.7.7-a+foo", ('2', '7', '7-a+foo'))):
            self.assertEqual(value, HasVersion(ver=good_input).ver)

    def shouldRaise(self, exc, msg, fn, *arg, **kwargs):
        try:
            fn(*arg, **kwargs)
            if msg is None:
                msg = "{}{} did not raise {}".format(fn.__name__, arg, str(exc))
            self.assert_(False, msg)
        except exc:
            pass

    @skipUnlessCreds
    def test_get_types(self):
        """Regenerator.get_types
        """
        r = kbtypes.Regenerator(self.args)
        t = self._get_types(r)
        self.assert_(t)

    @skipUnlessCreds
    def test_multiple_versions(self):
        """Test multiple versions of the same type.
        """
        r = kbtypes.Regenerator(self.args)
        t = self._get_types(r)

        # Insert extra version.
        for modname in t.keys():
            for typename in t[modname].keys():
                t[modname][typename]["9_9"] = {'description': "TEST99"}

        # Capture output classes
        w = StringIO.StringIO()
        r.write_types(w, t)

        # Check if versions are recorded properly
        # by looking at the output
        buf, prev_depth, num_ver, cur_mod = w.getvalue(), 0, 0, "?"
        #print("@@ BUF: {}".format(buf))
        for line in buf.split("\n"):
            match = re.search("\S", line)
            if match is None:
                continue   # blank line
            depth = match.span()[0] / 4  # calc. depth by #leading spaces
            if depth == 0:
                match = re.match("class (\w+)", line)
                if match is None:
                    self.fail("junk on line: {}".format(line))
                cur_mod = match.group(1)
            if depth == 2 and re.search("class v\d+_\d+\(.*\):", line):
                num_ver += 1
            # when we finish a class, check that we found at least 2 versions
            if depth == 0 and prev_depth > 0:
                self.assertGreaterEqual(num_ver, 2,
                                        "{}: Expected >=2 versions, got {:d}"
                                        .format(cur_mod, num_ver))
                num_ver = 0
            prev_depth = depth

if __name__ == '__main__':
    unittest.main()