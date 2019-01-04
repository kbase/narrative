import unittest
import mock
from biokbase.narrative.contents.kbasewsmanager import KBaseWSManager
from narrative_mock.mockclients import get_mock_client
from biokbase.narrative.common.narrative_ref import NarrativeRef
from tornado.web import HTTPError
from biokbase.narrative.common.exceptions import PermissionsError

class NarrativeRefTestCase(unittest.TestCase):
    @mock.patch('biokbase.narrative.common.narrative_ref.clients.get', get_mock_client)
    def test_no_objid_ok(self):
        ref = NarrativeRef({"wsid": 123, "objid": None, "ver": None})
        self.assertEqual(ref.wsid, 123)
        self.assertEqual(ref.objid, 1)
        self.assertIsNone(ref.ver)

    def test_ok(self):
        ref = NarrativeRef({"wsid": 123, "objid": 456, "ver": 7})
        self.assertEqual(ref.wsid, 123)
        self.assertEqual(ref.objid, 456)
        self.assertEqual(ref.ver, 7)

    @mock.patch('biokbase.narrative.common.narrative_ref.clients.get', get_mock_client)
    def test_no_objid_fail(self):
        with self.assertRaises(RuntimeError) as e:
            NarrativeRef({"wsid": 678, "objid": None, "ver": None})
        self.assertIn("Expected an integer while looking up the Narrative id", str(e.exception))

    @mock.patch('biokbase.narrative.common.narrative_ref.clients.get', get_mock_client)
    def test_no_ws_perm(self):
        with self.assertRaises(PermissionsError) as e:
            NarrativeRef({"wsid": 789, "objid": None, "ver": None})