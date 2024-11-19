import unittest
from unittest import mock

import pytest
from biokbase.narrative.common.exceptions import WorkspaceError
from biokbase.narrative.common.narrative_ref import NarrativeRef
from biokbase.narrative.tests.narrative_mock.mockclients import get_mock_client


class NarrativeRefTestCase(unittest.TestCase):
    @mock.patch("biokbase.narrative.common.narrative_ref.clients.get", get_mock_client)
    def test_no_objid_ok(self):
        ref = NarrativeRef({"wsid": 123, "objid": None, "ver": None})
        assert ref.wsid == 123
        assert ref.objid == 1
        assert ref.ver is None

    def test_ok(self):
        ref = NarrativeRef({"wsid": 123, "objid": 456, "ver": 7})
        assert ref.wsid == 123
        assert ref.objid == 456
        assert ref.ver == 7

    @mock.patch("biokbase.narrative.common.narrative_ref.clients.get", get_mock_client)
    def test_no_objid_fail(self):
        with pytest.raises(
            RuntimeError,
            match="Couldn't find Narrative object id in Workspace metadata",
        ):
            NarrativeRef({"wsid": 678, "objid": None, "ver": None})

    @mock.patch("biokbase.narrative.common.narrative_ref.clients.get", get_mock_client)
    def test_ref_init_fail(self):
        with pytest.raises(
            ValueError,
            match="A numerical Workspace id is required for a Narrative ref, not x",
        ):
            NarrativeRef({"wsid": "x", "objid": None, "ver": None})

        with pytest.raises(ValueError, match="objid must be numerical, not x"):
            NarrativeRef({"wsid": 678, "objid": "x", "ver": None})

        with pytest.raises(
            ValueError,
            match="If ver is present in the ref, it must be numerical, not x",
        ):
            NarrativeRef({"wsid": 678, "objid": 1, "ver": "x"})

    @mock.patch("biokbase.narrative.common.narrative_ref.clients.get", get_mock_client)
    def test_no_ws_perm(self):
        with pytest.raises(WorkspaceError, match="You do not have access to this workspace") as e:
            NarrativeRef({"wsid": 789, "objid": None, "ver": None})
        assert e._excinfo[1].http_code == 403
