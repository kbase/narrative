import unittest
import mock
from biokbase.narrative.contents.kbasewsmanager import KBaseWSManager
from .narrative_mock.mockclients import get_mock_client
from biokbase.narrative.common.narrative_ref import NarrativeRef
from tornado.web import HTTPError


class KBWSManagerTestCase(unittest.TestCase):

    @mock.patch('biokbase.narrative.common.narrative_ref.clients.get', get_mock_client)
    def test__parse_path(self):
        manager = KBaseWSManager()
        cases = [
            ("123", NarrativeRef({"wsid": "123", "objid": None, "ver": None})),
            ("ws.123", NarrativeRef({"wsid": "123", "objid": None, "ver": None})),
            ("ws.123.obj.456", NarrativeRef({"wsid": "123", "objid": "456", "ver": None})),
            ("ws.123.obj.456.ver.7", NarrativeRef({"wsid": "123", "objid": "456", "ver": "7"}))
        ]
        for c in cases:
            self.assertEqual(c[1], manager._parse_path(c[0]))

    def test__parse_path_bad(self):
        manager = KBaseWSManager()
        cases = [
            "foo",
            "ws.asdf.obj.sdf.ver.1",
            "ws.123.obj.f",
            "ws.obj.ver",
            "ws.1.obj.ver",
            "ws.1.obj.a",
            "ws.1.2"
        ]
        for c in cases:
            with self.assertRaises(HTTPError) as e:
                manager._parse_path(c)
            self.assertIn("Invalid Narrative path {}".format(c), str(e.exception))
