import unittest
import mock
from biokbase.narrative.contents.kbasewsmanager import KBaseWSManager
from narrative_mock.mockclients import get_mock_client
from biokbase.narrative.common.narrative_ref import NarrativeRef
from tornado.web import HTTPError

class NarrativeRefTestCase(unittest.TestCase):
    @mock.patch('biokbase.narrative.common.narrative_ref.clients.get', get_mock_client)
    def test_no_objid_ok(self):
        ref = NarrativeRef({"wsid": 123, "objid": None, "ver": None})
        self.assertEqual(ref.wsid, 123)
        self.assertEqual(ref.objid, 1)
        self.assertIsNone(ref.ver)