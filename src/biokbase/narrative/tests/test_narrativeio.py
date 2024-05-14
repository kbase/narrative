"""Tests for Mixin class that handles IO between the
Narrative and workspace service.
"""

import unittest
from unittest.mock import patch

import biokbase.auth
import pytest
from biokbase.narrative import clients
from biokbase.narrative.common.exceptions import WorkspaceError
from biokbase.narrative.common.narrative_ref import NarrativeRef
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.contents.narrativeio import (
    LIST_OBJECTS_FIELDS,
    KBaseWSManagerMixin,
)
from tornado.web import HTTPError

from . import util
from .narrative_mock.mockclients import MockClients, get_mock_client, get_nar_obj

__author__ = "Bill Riehl <wjriehl@lbl.gov>"

metadata_fields = {
    "objid",
    "name",
    "type",
    "save_date",
    "ver",
    "saved_by",
    "wsid",
    "workspace",
    "chsum",
    "size",
    "meta",
}
HAS_TEST_TOKEN = False

READ_NARRATIVE_REF_WARNING = "read_narrative must use a NarrativeRef as input!"


def get_exp_nar(i):
    return dict(zip(LIST_OBJECTS_FIELDS, get_nar_obj(i), strict=False))


def skipUnlessToken():
    global HAS_TEST_TOKEN
    if not HAS_TEST_TOKEN:
        return unittest.skip("No auth token")
    return None


def str_to_ref(s):
    """Takes a ref string, returns a NarrativeRef object"""
    vals = s.split("/")
    ref = {"wsid": vals[0], "objid": vals[1]}
    if len(vals) == 3:
        ref["ver"] = vals[2]
    return NarrativeRef(ref)


class NarrIOTestCase(unittest.TestCase):
    # Before test:
    # - Log in (for tests that need a valid login)
    # also sets the token in the environment variable.
    test_token = None
    private_token = None

    @classmethod
    def setUpClass(self):
        config = util.ConfigTests()

        self.test_user = config.get("users", "test_user")
        self.private_user = config.get("users", "private_user")

        self.test_token = util.read_token_file(
            config.get_path("token_files", "test_user", from_root=True)
        )
        self.private_token = util.read_token_file(
            config.get_path("token_files", "private_user", from_root=True)
        )

        if self.test_token is None or self.private_token is None:
            print("Skipping most narrativeio.py tests due to missing tokens.")
            print(
                "To enable these, update {} and place a valid auth token in files\n{}\nand\n{}".format(
                    config.config_file_path,
                    config.get_path("token_files", "test_user", from_root=True),
                    config.get_path("token_files", "private_user", from_root=True),
                )
            )
            print("Note that these should belong to different users.")

        if self.test_token is not None:
            global HAS_TEST_TOKEN
            HAS_TEST_TOKEN = True

        self.ws_uri = URLS.workspace

        self.invalid_nar_ref_str = config.get("strings", "invalid_nar_ref")
        self.invalid_nar_ref = str_to_ref(self.invalid_nar_ref_str)
        self.bad_nar_ref = config.get("strings", "bad_nar_ref")
        self.invalid_ws_id = config.get("strings", "invalid_ws_id")
        self.bad_ws_id = config.get("strings", "bad_ws_id")

        if self.test_token is not None:
            # Now we need to inject some data!
            # To avoid cross-contamination (we're testing the new_narrative() code here,
            # so we shouldn't use it, right?) this will be done manually using the Workspace
            # client.
            self.public_nar = util.upload_narrative(
                config.get_path("narratives", "public_file"),
                self.test_token,
                self.test_user,
                set_public=True,
                url=self.ws_uri,
            )
            self.private_nar = util.upload_narrative(
                config.get_path("narratives", "private_file"),
                self.test_token,
                self.test_user,
                url=self.ws_uri,
            )
        if self.private_token is not None:
            self.unauth_nar = util.upload_narrative(
                config.get_path("narratives", "unauth_file"),
                self.private_token,
                self.private_user,
                url=self.ws_uri,
            )

    @classmethod
    def tearDownClass(self):
        if self.test_token is not None:
            util.delete_narrative(self.public_nar["ws"], self.test_token, url=self.ws_uri)
            util.delete_narrative(self.private_nar["ws"], self.test_token, url=self.ws_uri)
        if self.private_token is not None:
            util.delete_narrative(self.unauth_nar["ws"], self.private_token, url=self.ws_uri)

    @classmethod
    def setUp(self):
        self.mixin = KBaseWSManagerMixin()
        # monkeypatch the ws url so it doesn't go to the auto-configured one
        self.mixin.ws_uri = self.ws_uri

    @classmethod
    def login(self, token=None):
        if token is None:
            token = self.test_token
        biokbase.auth.set_environ_token(token)

    @classmethod
    def logout(self):
        biokbase.auth.set_environ_token(None)

    def test_mixin_instantiated(self):
        assert isinstance(self.mixin, biokbase.narrative.contents.narrativeio.KBaseWSManagerMixin)

    # test KBaseWSManagerMixin.narrative_exists #####

    def test_narrative_exists_valid(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        assert self.mixin.narrative_exists(self.public_nar["ref"])

    def test_narrative_exists_invalid(self):
        assert not self.mixin.narrative_exists(self.invalid_nar_ref)

    def test_narrative_exists_bad(self):
        with pytest.raises(AssertionError, match=READ_NARRATIVE_REF_WARNING):
            self.mixin.narrative_exists(self.bad_nar_ref)

    def test_narrative_exists_noauth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        with pytest.raises(WorkspaceError):
            self.mixin.narrative_exists(self.private_nar["ref"])

    # test KBaseWSManagerMixin.read_narrative #####

    def validate_narrative(self, nar, with_content, with_meta):
        """Validates a narrative object's overall structure.
        We're just making sure that the right elements are expected
        to be here - we leave the Jupyter Notebook validation part to
        the Jupyter test suite.
        """
        if nar is None:
            return "Unable to validate null Narrative!"
        if not isinstance(nar, dict):
            return "Narrative needs to be a dict to be valid."

        # expected keys:
        exp_keys = {"info"}
        if with_content:
            exp_keys.update(
                [
                    "created",
                    "refs",
                    "provenance",
                    "creator",
                    "copy_source_inaccessible",
                    "data",
                    "extracted_ids",
                ]
            )
        missing_keys = exp_keys - set(nar.keys())
        if missing_keys:
            return "Narrative object is missing the following keys: {}".format(
                ", ".join(missing_keys)
            )

        if len(nar["info"]) != 11:
            return "Narrative info is incorrect: expected 11 elements, saw {}".format(
                len(nar["info"])
            )

        if with_meta:
            if not nar["info"][10]:
                return "Narrative metadata not returned when expected"
            meta_keys = {
                "creator",
                "data_dependencies",
                "description",
                "format",
                "job_info",
                "name",
                "type",
                "ws_name",
            }
            missing_keys = meta_keys - set(nar["info"][10])
            if missing_keys:
                return "Narrative metadata is missing the following keys: {}".format(
                    ", ".join(missing_keys)
                )
        return None

    def test_read_narrative_valid_content_metadata(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(
            self.public_nar["ref"], content=True, include_metadata=False
        )
        assert self.validate_narrative(nar, True, True) is None

    def test_read_narrative_valid_content_no_metadata(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(self.public_nar["ref"], content=True, include_metadata=True)
        assert self.validate_narrative(nar, True, False) is None

    def test_read_narrative_valid_no_content_metadata(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(
            self.public_nar["ref"], content=False, include_metadata=True
        )
        assert self.validate_narrative(nar, False, True) is None

    def test_read_narrative_valid_no_content_no_metadata(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(
            self.public_nar["ref"], content=False, include_metadata=False
        )
        assert self.validate_narrative(nar, False, False) is None

    def test_read_narrative_private_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        with pytest.raises(WorkspaceError):
            self.mixin.read_narrative(self.private_nar["ref"])

    def test_read_narrative_unauth_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with pytest.raises(WorkspaceError):
            self.mixin.read_narrative(self.unauth_nar["ref"])
        self.logout()

    def test_read_narrative_invalid(self):
        with pytest.raises(WorkspaceError):
            self.mixin.read_narrative(self.invalid_nar_ref)

    def test_read_narrative_bad(self):
        with pytest.raises(AssertionError, match=READ_NARRATIVE_REF_WARNING):
            self.mixin.read_narrative(self.bad_nar_ref)

    # test KBaseWSManagerMixin.write_narrative #####

    def test_write_narrative_valid_auth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        # fetch a narrative and just write it back again.
        # should return (nar, wsid, objid)
        self.login()
        nar = self.mixin.read_narrative(self.private_nar["ref"])["data"]
        result = self.mixin.write_narrative(self.private_nar["ref"], nar, self.test_user)
        assert result[1] == self.private_nar["ws"]
        assert result[2] == self.private_nar["obj"]
        assert result[0]["metadata"]["is_temporary"] == "false"

        ws = clients.get("workspace")
        ws_info = ws.get_workspace_info({"id": result[1]})
        assert ws_info[8]["searchtags"] == "narrative"
        self.logout()

    def test_write_narrative_valid_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(self.public_nar["ref"])["data"]
        with pytest.raises(WorkspaceError):
            self.mixin.write_narrative(self.public_nar["ref"], nar, "Anonymous")

    def test_write_narrative_valid_unauth(self):
        pass

    def test_write_narrative_invalid_ref(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        nar = self.mixin.read_narrative(self.public_nar["ref"])["data"]
        with pytest.raises(WorkspaceError):
            self.mixin.write_narrative(self.invalid_nar_ref, nar, self.test_user)
        self.logout()

    def test_write_narrative_shared_write_access(self):
        if self.test_token is None or self.private_token is None:
            self.skipTest("Missing auth token(s)")
        # login as private_user
        # set unauth_nar perms to allow test_user w access
        # logout
        self.login(token=self.private_token)
        ws_client = clients.get("workspace")
        ws_client.set_permissions(
            {
                "id": self.unauth_nar["ws"],
                "new_permission": "w",
                "users": [self.test_user],
            }
        )
        self.logout()
        # login as test_user
        # re-save unauth_nar
        # should succeed
        # logout
        self.login(token=self.test_token)
        nar = self.mixin.read_narrative(self.unauth_nar["ref"])["data"]
        self.mixin.write_narrative(self.unauth_nar["ref"], nar, self.test_user)
        self.logout()
        # log back in as private_user
        # remove perms from test_user
        # log back out
        self.login(token=self.private_token)
        ws_client = clients.get("workspace")
        ws_client.set_permissions(
            {
                "id": self.unauth_nar["ws"],
                "new_permission": "n",
                "users": [self.test_user],
            }
        )
        self.logout()

    # @unittest.skipIf(test_token is None, "No test user credentials available")
    def test_write_narrative_bad_ref(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        nar = self.mixin.read_narrative(self.public_nar["ref"])["data"]
        with pytest.raises(
            AssertionError, match="write_narrative must use a NarrativeRef as input!"
        ):
            self.mixin.write_narrative(self.bad_nar_ref, nar, self.test_user)
        self.logout()

    def test_write_narrative_bad_file(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with pytest.raises(HTTPError) as err:
            self.mixin.write_narrative(
                self.private_nar["ref"], {"not": "a narrative"}, self.test_user
            )
        assert err._excinfo[1].status_code == 400
        self.logout()

    # test KBaseWSManagerMixin.rename_narrative #####

    def test_rename_narrative_valid_auth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        new_name = "new_narrative_name"
        self.login()
        nar = self.mixin.read_narrative(
            self.private_nar["ref"], content=False, include_metadata=True
        )
        cur_name = nar["info"][10]["name"]
        self.mixin.rename_narrative(self.private_nar["ref"], self.test_user, new_name)
        nar = self.mixin.read_narrative(
            self.private_nar["ref"], content=False, include_metadata=True
        )
        assert new_name == nar["info"][10]["name"]

        # now, put it back to the old name, so it doesn't break other tests...
        self.mixin.rename_narrative(self.private_nar["ref"], self.test_user, cur_name)
        self.logout()

    def test_rename_narrative_valid_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        with pytest.raises(WorkspaceError):
            self.mixin.rename_narrative(self.public_nar["ref"], self.test_user, "new_name")

    def test_rename_narrative_unauth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with pytest.raises(WorkspaceError):
            self.mixin.rename_narrative(self.unauth_nar["ref"], self.test_user, "new_name")
        self.logout()

    def test_rename_narrative_invalid(self):
        with pytest.raises(WorkspaceError):
            self.mixin.rename_narrative(self.invalid_nar_ref, self.test_user, "new_name")

    def test_rename_narrative_bad(self):
        with pytest.raises(AssertionError, match=READ_NARRATIVE_REF_WARNING):
            self.mixin.rename_narrative(self.bad_nar_ref, self.test_user, "new_name")

    # test KBaseWSManagerMixin.copy_narrative #####

    def test_copy_narrative_valid(self):
        # no op for now
        pass

    def test_copy_narrative_invalid(self):
        # no op for now
        pass

    # test KBaseWSManagerMixin.list_narratives #####

    def validate_narrative_list(self, nar_list):
        assert isinstance(nar_list, list)
        for nar in nar_list:
            assert isinstance(nar, dict)
            assert set(nar.keys()).issubset(metadata_fields)

    def test_list_all_narratives_anon(self):
        res = self.mixin.list_narratives()
        self.validate_narrative_list(res)

    def test_list_all_narratives_auth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        res = self.mixin.list_narratives()
        self.validate_narrative_list(res)
        self.logout()

    def test_list_narrative_ws_valid_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        res = self.mixin.list_narratives(ws_id=self.public_nar["ws"])
        self.validate_narrative_list(res)

    def test_list_narrative_ws_valid_noperm_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        with pytest.raises(WorkspaceError):
            self.mixin.list_narratives(ws_id=self.private_nar["ws"])

    def test_list_narrative_ws_valid_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        res = self.mixin.list_narratives(ws_id=self.private_nar["ws"])
        self.validate_narrative_list(res)
        self.logout()

    @patch("biokbase.narrative.clients.get", get_mock_client)
    def test_list_narratives__no_ws_id__0_ws_ids(self):
        ws_ids = {"workspaces": [], "pub": []}

        with patch.object(MockClients, "list_workspace_ids", create=True, return_value=ws_ids):
            nar_l = self.mixin.list_narratives()

        assert [] == nar_l
        self.validate_narrative_list(nar_l)

    @patch("biokbase.narrative.clients.get", get_mock_client)
    def test_list_narratives__no_ws_id__9999_ws_ids(self):
        ws_ids = {"workspaces": list(range(9999)), "pub": []}

        with patch.object(MockClients, "list_workspace_ids", create=True, return_value=ws_ids):
            nar_l = self.mixin.list_narratives()

        assert [get_exp_nar(i) for i in range(9999)] == nar_l
        self.validate_narrative_list(nar_l)

    @patch("biokbase.narrative.clients.get", get_mock_client)
    def test_list_narratives__no_ws_id__10000_ws_ids(self):
        ws_ids = {"workspaces": list(range(10000)), "pub": []}

        with patch.object(MockClients, "list_workspace_ids", create=True, return_value=ws_ids):
            nar_l = self.mixin.list_narratives()

        assert [get_exp_nar(i) for i in range(10000)] == nar_l
        self.validate_narrative_list(nar_l)

    @patch("biokbase.narrative.clients.get", get_mock_client)
    def test_list_narratives__no_ws_id__10001_ws_ids(self):
        ws_ids = {"workspaces": list(range(10000)), "pub": [10000]}

        with patch.object(MockClients, "list_workspace_ids", create=True, return_value=ws_ids):
            nar_l = self.mixin.list_narratives()

        assert [get_exp_nar(i) for i in range(10001)] == nar_l
        self.validate_narrative_list(nar_l)

    def test_list_narrative_ws_invalid(self):
        with pytest.raises(WorkspaceError):
            self.mixin.list_narratives(ws_id=self.invalid_ws_id)

    def test_list_narrative_ws_valid_noperm_auth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with pytest.raises(WorkspaceError):
            self.mixin.list_narratives(ws_id=self.unauth_nar["ws"])
        self.logout()

    def test_list_narrative_ws_bad(self):
        with pytest.raises(ValueError):
            self.mixin.list_narratives(ws_id=self.bad_nar_ref)

    # test KBaseWSManagerMixin.narrative_permissions #####
    # params:
    #    narrative ref == valid, invalid, bad/malformed
    # user:
    #    None, specific
    # login state
    def test_narrative_permissions_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        ret = self.mixin.narrative_permissions(self.public_nar["ref"])
        assert isinstance(ret, dict)
        assert ret["*"] == "r"

    def test_narrative_permissions_valid_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        ret = self.mixin.narrative_permissions(self.public_nar["ref"])
        assert isinstance(ret, dict)
        assert ret["*"] == "r"
        self.logout()

    def test_narrative_permissions_invalid_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with pytest.raises(WorkspaceError):
            self.mixin.narrative_permissions(self.invalid_nar_ref)
        self.logout()

    def test_narrative_permissions_inaccessible_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        ret = self.mixin.narrative_permissions(self.unauth_nar["ref"])
        assert isinstance(ret, dict)
        assert ret[self.test_user] == "n"
        self.logout()

    def test_narrative_permissions_bad(self):
        with pytest.raises(
            AssertionError,
            match="narrative_permissions must use a NarrativeRef as input!",
        ):
            self.mixin.narrative_permissions(self.bad_nar_ref)

    # test KBaseWSManagerMixin.narrative_writable #####

    def test_narrative_writable_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        ret = self.mixin.narrative_writable(self.public_nar["ref"], self.test_user)
        assert not ret

    def test_narrative_writable_valid_login_nouser(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with pytest.raises(ValueError):
            self.mixin.narrative_writable(self.public_nar["ref"], None)
        self.logout()

    def test_narrative_writable_valid_login_user(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        ret = self.mixin.narrative_writable(self.public_nar["ref"], self.test_user)
        assert ret
        self.logout()

    def test_narrative_writable_invalid_login_user(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with pytest.raises(WorkspaceError):
            self.mixin.narrative_writable(self.invalid_nar_ref, self.test_user)
        self.logout()

    def test_narrative_writable_inaccessible_login_user(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        ret = self.mixin.narrative_writable(self.unauth_nar["ref"], self.test_user)
        assert not ret
        self.logout()

    def test_narrative_writable_bad_login_user(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with pytest.raises(
            AssertionError,
            match="narrative_permissions must use a NarrativeRef as input!",
        ):
            self.mixin.narrative_writable(self.bad_nar_ref, self.test_user)
        self.logout()

    # test KBaseWSManagerMixin._validate_nar_type #####
    def test__validate_nar_type_ok(self):
        assert self.mixin._validate_nar_type("KBaseNarrative.Narrative-123.45", None) is None
        assert self.mixin._validate_nar_type("KBaseNarrative.Narrative", None) is None

    def test__validate_nar_type_fail(self):
        bad_type = "NotANarrative"
        ref = "123/45"

        with pytest.raises(HTTPError, match=f"Expected a Narrative object, got a {bad_type}"):
            self.mixin._validate_nar_type(bad_type, None)

        with pytest.raises(
            HTTPError,
            match=f"Expected a Narrative object with reference {ref}, got a {bad_type}",
        ):
            self.mixin._validate_nar_type(bad_type, ref)


if __name__ == "__main__":
    unittest.main()
