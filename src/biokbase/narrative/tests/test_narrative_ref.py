import unittest
import mock
from biokbase.narrative.contents.kbasewsmanager import KBaseWSManager
from .narrative_mock.mockclients import get_mock_client
from biokbase.narrative.common.narrative_ref import NarrativeRef
from tornado.web import HTTPError
from biokbase.narrative.common.exceptions import WorkspaceError

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
        self.assertIn("Couldn't find Narrative object id in Workspace metadata", str(e.exception))

    @mock.patch('biokbase.narrative.common.narrative_ref.clients.get', get_mock_client)
    def test_ref_init_fail(self):
        with self.assertRaises(ValueError) as e:
            NarrativeRef({"wsid": "x", "objid": None, "ver": None})
        self.assertIn("A numerical Workspace id is required for a Narrative ref, not x", str(e.exception))

        with self.assertRaises(ValueError) as e:
            NarrativeRef({"wsid": 678, "objid": "x", "ver": None})
        self.assertIn("objid must be numerical, not x", str(e.exception))

        with self.assertRaises(ValueError) as e:
            NarrativeRef({"wsid": 678, "objid": 1, "ver": "x"})
        self.assertIn("If ver is present in the ref, it must be numerical, not x", str(e.exception))


    @mock.patch('biokbase.narrative.common.narrative_ref.clients.get', get_mock_client)
    def test_no_ws_perm(self):
        with self.assertRaises(WorkspaceError) as e:
            NarrativeRef({"wsid": 789, "objid": None, "ver": None})
        self.assertEqual(403, e.exception.http_code)
        self.assertIn("You do not have access to this workspace", e.exception.message)
