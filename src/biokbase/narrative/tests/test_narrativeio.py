"""
Tests for Mixin class that handles IO between the
Narrative and workspace service.
"""
import unittest
from biokbase.narrative.contents.narrativeio import KBaseWSManagerMixin
from biokbase.narrative.common.exceptions import WorkspaceError
import biokbase.auth
from tornado.web import HTTPError
from . import util
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.narrative_ref import NarrativeRef
import biokbase.narrative.clients as clients

__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

metadata_fields = set(['objid', 'name', 'type', 'save_date', 'ver',
                       'saved_by', 'wsid', 'workspace', 'chsum',
                       'size', 'meta'])
HAS_TEST_TOKEN = False


def skipUnlessToken():
    global HAS_TEST_TOKEN
    if not HAS_TEST_TOKEN:
        return unittest.skip("No auth token")

def str_to_ref(s):
    """ Takes a ref string, returns a NarrativeRef object """
    vals = s.split("/")
    ref = {
        "wsid": vals[0],
        "objid": vals[1]
    }
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
        config = util.TestConfig()

        self.test_user = config.get('users', 'test_user')
        self.private_user = config.get('users', 'private_user')

        self.test_token = util.read_token_file(config.get_path('token_files', 'test_user', from_root=True))
        self.private_token = util.read_token_file(config.get_path('token_files', 'private_user', from_root=True))

        if self.test_token is None or self.private_token is None:
            print("Skipping most narrativeio.py tests due to missing tokens.")
            print("To enable these, place a valid auth token in files\n{}\nand\n{}".format(
                config.get_path('token_files', 'test_user'),
                config.get_path('token_files', 'private_user')))
            print("Note that these should belong to different users.")

        if self.test_token is not None:
            global HAS_TEST_TOKEN
            HAS_TEST_TOKEN = True

        self.ws_uri = URLS.workspace

        self.invalid_nar_ref_str = config.get('strings', 'invalid_nar_ref')
        self.invalid_nar_ref = str_to_ref(self.invalid_nar_ref_str)
        self.bad_nar_ref = config.get('strings', 'bad_nar_ref')
        self.invalid_ws_id = config.get('strings', 'invalid_ws_id')
        self.bad_ws_id = config.get('strings', 'bad_ws_id')

        if self.test_token is not None:
            # Now we need to inject some data!
            # To avoid cross-contamination (we're testing the new_narrative() code here,
            # so we shouldn't use it, right?) this will be done manually using the Workspace
            # client.
            self.public_nar = util.upload_narrative(
                config.get_path('narratives', 'public_file'), self.test_token, self.test_user,
                set_public=True, url=self.ws_uri)
            self.private_nar = util.upload_narrative(
                config.get_path('narratives', 'private_file'), self.test_token, self.test_user,
                url=self.ws_uri)
        if self.private_token is not None:
            self.unauth_nar = util.upload_narrative(
                config.get_path('narratives', 'unauth_file'), self.private_token, self.private_user,
                url=self.ws_uri)

    @classmethod
    def tearDownClass(self):
        if self.test_token is not None:
            util.delete_narrative(self.public_nar['ws'], self.test_token, url=self.ws_uri)
            util.delete_narrative(self.private_nar['ws'], self.test_token, url=self.ws_uri)
        if self.private_token is not None:
            util.delete_narrative(self.unauth_nar['ws'], self.private_token, url=self.ws_uri)

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
        self.assertIsInstance(self.mixin, biokbase.narrative.contents.narrativeio.KBaseWSManagerMixin)

    ##### test KBaseWSManagerMixin.narrative_exists #####

    def test_narrative_exists_valid(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.assertTrue(self.mixin.narrative_exists(self.public_nar['ref']))

    def test_narrative_exists_invalid(self):
        self.assertFalse(self.mixin.narrative_exists(self.invalid_nar_ref))

    def test_narrative_exists_bad(self):
        with self.assertRaises(AssertionError) as err:
            self.mixin.narrative_exists(self.bad_nar_ref)
        self.assertEqual("read_narrative must use a NarrativeRef as input!", str(err.exception))

    def test_narrative_exists_noauth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.narrative_exists(self.private_nar['ref'])
        self.assertIsNotNone(err)

    ##### test KBaseWSManagerMixin.read_narrative #####

    def validate_narrative(self, nar, with_content, with_meta):
        """
        Validates a narrative object's overall structure.
        We're just making sure that the right elements are expected
        to be here - we leave the Jupyter Notebook validation part to
        the Jupyter test suite.
        """
        if nar is None:
            return "Unable to validate null Narrative!"
        if not isinstance(nar, dict):
            return "Narrative needs to be a dict to be valid."

        # expected keys:
        exp_keys = set(['info'])
        if with_content:
            exp_keys.update(['created', 'refs', 'provenance', 'creator',
                             'copy_source_inaccessible', 'data', 'extracted_ids'])
        missing_keys = exp_keys - set(nar.keys())
        if missing_keys:
            return "Narrative object is missing the following keys: {}".format(', '.join(missing_keys))

        if len(nar['info']) != 11:
            return "Narrative info is incorrect: expected 11 elements, saw {}".format(len(nar['info']))

        if with_meta:
            if not nar['info'][10]:
                return "Narrative metadata not returned when expected"
            meta_keys = set(['creator', 'data_dependencies', 'description', 'format', 'job_info', 'name', 'type', 'ws_name'])
            missing_keys = meta_keys - set(nar['info'][10])
            if missing_keys:
                return "Narrative metadata is missing the following keys: {}".format(', '.join(missing_keys))
        return None

    def validate_metadata(self, std_meta, meta):
        """
        Validates a Narrative's typed object metadata.
        """
        pass

    def test_read_narrative_valid_content_metadata(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(self.public_nar['ref'], content=True, include_metadata=False)
        self.assertIsNone(self.validate_narrative(nar, True, True))

    def test_read_narrative_valid_content_no_metadata(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(self.public_nar['ref'], content=True, include_metadata=True)
        self.assertIsNone(self.validate_narrative(nar, True, False))

    def test_read_narrative_valid_no_content_metadata(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(self.public_nar['ref'], content=False, include_metadata=True)
        self.assertIsNone(self.validate_narrative(nar, False, True))

    def test_read_narrative_valid_no_content_no_metadata(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(self.public_nar['ref'], content=False, include_metadata=False)
        self.assertIsNone(self.validate_narrative(nar, False, False))

    def test_read_narrative_private_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.read_narrative(self.private_nar['ref'])
        self.assertIsNotNone(err)

    def test_read_narrative_unauth_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.read_narrative(self.unauth_nar['ref'])
        self.assertIsNotNone(err)
        self.logout()

    def test_read_narrative_invalid(self):
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.read_narrative(self.invalid_nar_ref)
        self.assertIsNotNone(err)

    def test_read_narrative_bad(self):
        with self.assertRaises(AssertionError) as err:
            self.mixin.read_narrative(self.bad_nar_ref)
        self.assertEqual("read_narrative must use a NarrativeRef as input!", str(err.exception))

    ##### test KBaseWSManagerMixin.write_narrative #####

    def test_write_narrative_valid_auth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        # fetch a narrative and just write it back again.
        # should return (nar, wsid, objid)
        self.login()
        nar = self.mixin.read_narrative(self.private_nar['ref'])['data']
        result = self.mixin.write_narrative(self.private_nar['ref'], nar, self.test_user)
        self.assertTrue(result[1] == self.private_nar['ws'] and result[2] == self.private_nar['obj'])
        self.assertEquals(result[0]['metadata']['is_temporary'], 'false')

        ws = Workspace(url=URLS.workspace, token=self.test_token)
        ws_info = ws.get_workspace_info({'id': result[1]})
        self.assertEquals(ws_info[8]['searchtags'], 'narrative')
        self.assertEquals(ws_info[8]['cell_count'], str(len(nar['cells'])))
        self.logout()

    def test_write_narrative_valid_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        nar = self.mixin.read_narrative(self.public_nar['ref'])['data']
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.write_narrative(self.public_nar['ref'], nar, 'Anonymous')
        self.assertIsNotNone(err)

    def test_write_narrative_valid_unauth(self):
        pass

    def test_write_narrative_invalid_ref(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        nar = self.mixin.read_narrative(self.public_nar['ref'])['data']
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.write_narrative(self.invalid_nar_ref, nar, self.test_user)
        self.assertIsNotNone(err)
        self.logout()

    def test_write_narrative_shared_write_access(self):
        if self.test_token is None or self.private_token is None:
            self.skipTest("Missing auth token(s)")
        # login as private_user
        # set unauth_nar perms to allow test_user w access
        # logout
        self.login(token=self.private_token)
        ws_client = clients.get('workspace')
        ws_client.set_permissions({'id': self.unauth_nar['ws'], 'new_permission': 'w', 'users': [self.test_user]})
        self.logout()
        # login as test_user
        # re-save unauth_nar
        # should succeed
        # logout
        self.login(token=self.test_token)
        nar = self.mixin.read_narrative(self.unauth_nar['ref'])['data']
        self.mixin.write_narrative(self.unauth_nar['ref'], nar, self.test_user)
        self.logout()
        # log back in as private_user
        # remove perms from test_user
        # log back out
        self.login(token=self.private_token)
        ws_client = clients.get('workspace')
        ws_client.set_permissions({'id': self.unauth_nar['ws'], 'new_permission': 'n', 'users': [self.test_user]})
        self.logout()

    # @unittest.skipIf(test_token is None, "No test user credentials available")
    def test_write_narrative_bad_ref(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        nar = self.mixin.read_narrative(self.public_nar['ref'])['data']
        with self.assertRaises(AssertionError) as err:
            self.mixin.write_narrative(self.bad_nar_ref, nar, self.test_user)
        self.assertEqual("write_narrative must use a NarrativeRef as input!", str(err.exception))
        self.logout()

    def test_write_narrative_bad_file(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with self.assertRaises(HTTPError) as err:
            self.mixin.write_narrative(self.private_nar['ref'], {'not':'a narrative'}, self.test_user)
        self.assertEqual(err.exception.status_code, 400)
        self.logout()


    ##### test KBaseWSManagerMixin.rename_narrative #####

    def test_rename_narrative_valid_auth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        new_name = "new_narrative_name"
        self.login()
        nar = self.mixin.read_narrative(self.private_nar['ref'], content=False, include_metadata=True)
        cur_name = nar['info'][10]['name']
        self.mixin.rename_narrative(self.private_nar['ref'], self.test_user, new_name)
        nar = self.mixin.read_narrative(self.private_nar['ref'], content=False, include_metadata=True)
        self.assertEqual(new_name, nar['info'][10]['name'])

        ### now, put it back to the old name, so it doesn't break other tests...
        self.mixin.rename_narrative(self.private_nar['ref'], self.test_user, cur_name)
        self.logout()

    def test_rename_narrative_valid_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.rename_narrative(self.public_nar['ref'], self.test_user, 'new_name')
        self.assertIsNotNone(err)

    def test_rename_narrative_unauth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.rename_narrative(self.unauth_nar['ref'], self.test_user, 'new_name')
        self.assertIsNotNone(err)
        self.logout()

    def test_rename_narrative_invalid(self):
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.rename_narrative(self.invalid_nar_ref, self.test_user, 'new_name')
        self.assertIsNotNone(err)

    def test_rename_narrative_bad(self):
        with self.assertRaises(AssertionError) as err:
            self.mixin.rename_narrative(self.bad_nar_ref, self.test_user, 'new_name')
        self.assertEqual("read_narrative must use a NarrativeRef as input!", str(err.exception))

    ##### test KBaseWSManagerMixin.copy_narrative #####

    def test_copy_narrative_valid(self):
        # no op for now
        pass

    def test_copy_narrative_invalid(self):
        # no op for now
        pass


    ##### test KBaseWSManagerMixin.list_narratives #####

    def validate_narrative_list(self, nar_list):
        self.assertIsInstance(nar_list, list)
        for nar in nar_list:
            self.assertIsInstance(nar, dict)
            self.assertTrue(set(nar.keys()).issubset(metadata_fields))

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
        res = self.mixin.list_narratives(ws_id=self.public_nar['ws'])
        self.validate_narrative_list(res)

    def test_list_narrative_ws_valid_noperm_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.list_narratives(ws_id=self.private_nar['ws'])
        self.assertIsNotNone(err)

    def test_list_narrative_ws_valid_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        res = self.mixin.list_narratives(ws_id=self.private_nar['ws'])
        self.validate_narrative_list(res)
        self.logout()

    def test_list_narrative_ws_invalid(self):
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.list_narratives(ws_id=self.invalid_ws_id)
        self.assertIsNotNone(err)

    def test_list_narrative_ws_valid_noperm_auth(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.list_narratives(ws_id=self.unauth_nar['ws'])
        self.assertIsNotNone(err)
        self.logout()

    def test_list_narrative_ws_bad(self):
        with self.assertRaises(ValueError) as err:
            self.mixin.list_narratives(ws_id=self.bad_nar_ref)
        self.assertIsNotNone(err)


    ##### test KBaseWSManagerMixin.narrative_permissions #####
    # params:
    #    narrative ref == valid, invalid, bad/malformed
    # user:
    #    None, specific
    # login state
    def test_narrative_permissions_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        ret = self.mixin.narrative_permissions(self.public_nar['ref'])
        self.assertTrue(isinstance(ret, dict) and ret['*'] == 'r')

    def test_narrative_permissions_valid_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        ret = self.mixin.narrative_permissions(self.public_nar['ref'])
        self.assertTrue(isinstance(ret, dict) and ret['*'] == 'r')
        self.logout()

    def test_narrative_permissions_invalid_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.narrative_permissions(self.invalid_nar_ref)
        self.logout()

    def test_narrative_permissions_inaccessible_login(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        ret = self.mixin.narrative_permissions(self.unauth_nar['ref'])
        self.assertTrue(isinstance(ret, dict) and ret[self.test_user] == 'n')
        self.logout()

    def test_narrative_permissions_bad(self):
        with self.assertRaises(AssertionError) as err:
            self.mixin.narrative_permissions(self.bad_nar_ref)
        self.assertEqual("narrative_permissions must use a NarrativeRef as input!", str(err.exception))


    ##### test KBaseWSManagerMixin.narrative_writable #####

    def test_narrative_writable_anon(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        ret = self.mixin.narrative_writable(self.public_nar['ref'], self.test_user)
        self.assertFalse(ret)

    def test_narrative_writable_valid_login_nouser(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with self.assertRaises(ValueError) as err:
            self.mixin.narrative_writable(self.public_nar['ref'], None)
        self.assertIsNotNone(err)
        self.logout()

    def test_narrative_writable_valid_login_user(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        ret = self.mixin.narrative_writable(self.public_nar['ref'], self.test_user)
        self.assertTrue(ret)
        self.logout()

    def test_narrative_writable_invalid_login_user(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with self.assertRaises(WorkspaceError) as err:
            self.mixin.narrative_writable(self.invalid_nar_ref, self.test_user)
        self.assertIsNotNone(err)
        self.logout()

    def test_narrative_writable_inaccessible_login_user(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        ret = self.mixin.narrative_writable(self.unauth_nar['ref'], self.test_user)
        self.assertFalse(ret)
        self.logout()

    def test_narrative_writable_bad_login_user(self):
        if self.test_token is None:
            self.skipTest("No auth token")
        self.login()
        with self.assertRaises(AssertionError) as err:
            self.mixin.narrative_writable(self.bad_nar_ref, self.test_user)
        self.assertEqual("narrative_permissions must use a NarrativeRef as input!", str(err.exception))
        self.logout()

    ##### test KBaseWSManagerMixin._validate_nar_type #####
    def test__validate_nar_type_ok(self):
        self.assertIsNone(self.mixin._validate_nar_type("KBaseNarrative.Narrative-123.45", None))
        self.assertIsNone(self.mixin._validate_nar_type("KBaseNarrative.Narrative", None))

    def test__validate_nar_type_fail(self):
        bad_type = "NotANarrative"
        ref = "123/45"
        with self.assertRaises(HTTPError) as err:
            self.mixin._validate_nar_type(bad_type, None)
        self.assertIn("Expected a Narrative object, got a {}".format(bad_type), str(err.exception))

        with self.assertRaises(HTTPError) as err:
            self.mixin._validate_nar_type(bad_type, ref)
        self.assertIn("Expected a Narrative object with reference {}, got a {}".format(ref, bad_type), str(err.exception))

if __name__ == '__main__':
    unittest.main()
