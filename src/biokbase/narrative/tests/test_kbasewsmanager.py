import unittest
from unittest import mock

import pytest
from biokbase.narrative.common.narrative_ref import NarrativeRef
from biokbase.narrative.contents.kbasewsmanager import KBaseWSManager
from biokbase.narrative.tests.narrative_mock.mockclients import get_mock_client
from tornado.web import HTTPError


class KBWSManagerTestCase(unittest.TestCase):
    @mock.patch("biokbase.narrative.common.narrative_ref.clients.get", get_mock_client)
    def test__parse_path(self):
        manager = KBaseWSManager()
        cases = [
            ("123", NarrativeRef({"wsid": "123", "objid": None, "ver": None})),
            ("ws.123", NarrativeRef({"wsid": "123", "objid": None, "ver": None})),
            (
                "ws.123.obj.456",
                NarrativeRef({"wsid": "123", "objid": "456", "ver": None}),
            ),
            (
                "ws.123.obj.456.ver.7",
                NarrativeRef({"wsid": "123", "objid": "456", "ver": "7"}),
            ),
        ]
        for c in cases:
            assert c[1] == manager._parse_path(c[0])

    def test__parse_path_bad(self):
        manager = KBaseWSManager()
        cases = [
            "foo",
            "ws.asdf.obj.sdf.ver.1",
            "ws.123.obj.f",
            "ws.obj.ver",
            "ws.1.obj.ver",
            "ws.1.obj.a",
            "ws.1.2",
        ]
        for c in cases:
            with pytest.raises(HTTPError, match=f"Invalid Narrative path {c}"):
                manager._parse_path(c)
