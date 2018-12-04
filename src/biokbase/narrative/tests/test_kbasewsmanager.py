import unittest
from biokbase.narrative.contents.kbasewsmanager import KBaseWSManager

class KBWSManagerTestCase(unittest.TestCase):
    def test__parse_path(self):
        manager = KBaseWSManager()
        cases = [
            ("123", {"wsid": "123", "objid": None, "ver": None}),
            ("ws.123", {"wsid": "123", "objid": None, "ver": None}),
            ("foo", None),
            ("ws.123.obj.456", {"wsid": "123", "objid": "456", "ver": None}),
            ("ws.123.obj.456.ver.7", {"wsid": "123", "objid": "456", "ver": "7"}),
            ("ws.asdf.obj.sdf.ver.1", None),
            ("ws.123.obj.f", None),
            ("ws.obj.ver", None),
            ("ws.1.obj.ver", None),
            ("ws.1.obj.a", None),
            ("ws.1.2", None)
        ]
        for c in cases:
            self.assertEqual(c[1], manager._parse_path(c[0]))