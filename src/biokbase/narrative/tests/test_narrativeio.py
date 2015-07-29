"""
Tests for Mixin class that handles IO between the 
Narrative and workspace service.
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

import unittest
from getpass import getpass
from biokbase.narrative.narrativeio import (
    KBaseWSManagerMixin, 
    PermissionsError
)
from biokbase.workspace.client import (
    Workspace, 
    ServerError
)
import biokbase.auth
import os
import re
from tornado.web import HTTPError
import biokbase.narrative.common.service as service
import ConfigParser
import narrative_test_helper as test_util

metadata_fields = set(['objid', 'name', 'type', 'save_date', 'ver', 
                       'saved_by', 'wsid', 'workspace', 'chsum', 
                       'size', 'meta'])

class NarrIOTestCase(unittest.TestCase):
    # Before test:
    # - Log in (for tests that need a valid login)
    # also sets the token in the environment variable.

    @classmethod
    def setUpClass(self):
        config = ConfigParser.ConfigParser()
        config.read('test.cfg')

        self.test_user = config.get('users', 'test_user')
        self.test_pwd = getpass('Password for {}: '.format(self.test_user))
        self.test_token = biokbase.auth.Token(user_id=self.test_user, password=self.test_pwd)

        self.private_user = config.get('users', 'private_user')
        self.private_pwd = getpass('Password for {}: '.format(self.private_user))
        self.private_token = biokbase.auth.Token(user_id=self.private_user, password=self.private_pwd)

        self.ws_uri = config.get('urls', 'workspace')

        self.invalid_nar_ref = config.get('strings', 'invalid_nar_ref')
        self.bad_nar_ref = config.get('strings', 'bad_nar_ref')
        self.invalid_ws_id = config.get('strings', 'invalid_ws_id')
        self.bad_ws_id = config.get('strings', 'bad_ws_id')

        # Now we need to inject some data!
        # To avoid cross-contamination (we're testing the new_narrative() code here,
        # so we shouldn't use it, right?) this will be done manually using the Workspace
        # client.
        self.public_nar = test_util.upload_narrative(config.get('narratives', 'public_file'), self.test_token, set_public=True, url=self.ws_uri)
        self.private_nar = test_util.upload_narrative(config.get('narratives', 'private_file'), self.test_token, url=self.ws_uri)
        self.unauth_nar = test_util.upload_narrative(config.get('narratives', 'unauth_file'), self.private_token, url=self.ws_uri)

    @classmethod
    def tearDownClass(self):
        test_util.delete_narrative(self.public_nar['ws'], self.test_token, url=self.ws_uri)
        test_util.delete_narrative(self.private_nar['ws'], self.test_token, url=self.ws_uri)
        test_util.delete_narrative(self.unauth_nar['ws'], self.private_token, url=self.ws_uri)

    @classmethod
    def setUp(self):
        self.mixin = KBaseWSManagerMixin()
        # monkeypatch the ws url so it doesn't go to the auto-configured one
        self.mixin.ws_uri = self.ws_uri

    @classmethod
    def login(self):
        biokbase.auth.set_environ_token(self.test_token.token)

    @classmethod
    def logout(self):
        biokbase.auth.set_environ_token(None)

    def test_mixin_instantiated(self):
        self.assertIsInstance(self.mixin, biokbase.narrative.narrativeio.KBaseWSManagerMixin)

    # test we can get a workspace client while logged out, and it's anonymous
    def test_get_wsclient_anon(self):
        ws_client = self.mixin.ws_client()
        # it's anon if the header doesn't have an AUTHORIZATION field, or
        # that has a None value
        self.assertTrue('AUTHORIZATION' not in ws_client._headers or 
                        ws_client._headers['AUTHORIZATION'] is None)

    # test we get a ws client when logged in, and it's authorized
    def test_get_wsclient_auth(self):
        self.login()
        ws_client = self.mixin.ws_client()
        self.assertTrue('AUTHORIZATION' in ws_client._headers and 
                        ws_client._headers['AUTHORIZATION'] is not None)
        self.logout()

    # test we know what a narrative ref looks like with ws and obj ids
    def test_obj_ref_ws_obj(self):
        self.mixin._test_obj_ref(self.public_nar['ref'])

    # test as above, but include version
    def test_obj_ref_ws_obj_ver(self):
        ref = self.public_nar['ref'] + '/1'
        self.mixin._test_obj_ref(ref) # this can ONLY fail, has no return value

    # test as above, but make sure it fails right
    def test_obj_ref_fail(self):
        with self.assertRaises(ValueError) as err:
            self.mixin._test_obj_ref(self.bad_nar_ref)
        self.assertIsNotNone(err)


    ##### test KBaseWSManagerMixin.narrative_exists #####

    def test_narrative_exists_valid(self):
        self.assertTrue(self.mixin.narrative_exists(self.public_nar['ref']))

    def test_narrative_exists_invalid(self):
        self.assertFalse(self.mixin.narrative_exists(self.invalid_nar_ref))

    def test_narrative_exists_bad(self):
        with self.assertRaises(ValueError) as err:
            self.mixin.narrative_exists(self.bad_nar_ref)
        self.assertIsNotNone(err)

    def test_narrative_exists_noauth(self):
        with self.assertRaises(PermissionsError) as err:
            self.mixin.narrative_exists(self.private_nar['ref'])
        self.assertIsNotNone(err)

    ##### test KBaseWSManagerMixin.read_narrative #####
 
    def validate_narrative(self, nar, with_content, with_meta):
        """
        Validates a narrative object's overall structure.
        We're just making sure that the right elements are expected 
        to be here - we leave the IPython Notebook validation part to
        the IPython test suite.
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
            meta_keys = set(['creator', 'data_dependencies', 'description', 'format', 'job_info', 'methods', 'name', 'type', 'ws_name'])
            missing_keys = meta_keys - set(nar['info'][10])
            if missing_keys:
                return "Narrative metadata is missing the following keys: {}".format(', '.join(missing_keys))
        return None

    def test_read_narrative_valid_content_metadata(self):
        nar = self.mixin.read_narrative(self.public_nar['ref'], content=True, include_metadata=False)
        self.assertIsNone(self.validate_narrative(nar, True, True))

    def test_read_narrative_valid_content_no_metadata(self):
        nar = self.mixin.read_narrative(self.public_nar['ref'], content=True, include_metadata=True)
        self.assertIsNone(self.validate_narrative(nar, True, False))

    def test_read_narrative_valid_no_content_metadata(self):
        nar = self.mixin.read_narrative(self.public_nar['ref'], content=False, include_metadata=True)
        self.assertIsNone(self.validate_narrative(nar, False, True))

    def test_read_narrative_valid_no_content_no_metadata(self):
        nar = self.mixin.read_narrative(self.public_nar['ref'], content=False, include_metadata=False)
        self.assertIsNone(self.validate_narrative(nar, False, False))

    def test_read_narrative_private_anon(self):
        with self.assertRaises(PermissionsError) as err:
            self.mixin.read_narrative(self.private_nar['ref'])
        self.assertIsNotNone(err)

    def test_read_narrative_unauth_login(self):
        self.login()
        with self.assertRaises(PermissionsError) as err:
            self.mixin.read_narrative(self.unauth_nar['ref'])
        self.assertIsNotNone(err)
        self.logout()

    def test_read_narrative_invalid(self):
        with self.assertRaises(ServerError) as err:
            self.mixin.read_narrative(self.invalid_nar_ref)
        self.assertIsNotNone(err)

    def test_read_narrative_bad(self):
        with self.assertRaises(ValueError) as err:
            self.mixin.read_narrative(self.bad_nar_ref)
        self.assertIsNotNone(err)

    ##### test KBaseWSManagerMixin.write_narrative #####

    def test_write_narrative_valid_auth(self):
        # fetch a narrative and just write it back again.
        # should return (nar, wsid, objid)
        self.login()
        nar = self.mixin.read_narrative(self.private_nar['ref'])['data']
        result = self.mixin.write_narrative(self.private_nar['ref'], nar, self.test_user)
        self.assertTrue(result[1] == self.private_nar['ws'] and result[2] == self.private_nar['obj'])
        self.logout()

    def test_write_narrative_valid_anon(self):
        nar = self.mixin.read_narrative(self.public_nar['ref'])['data']
        with self.assertRaises(PermissionsError) as err:
            self.mixin.write_narrative(self.public_nar['ref'], nar, 'Anonymous')
        self.assertIsNotNone(err)

    def test_write_narrative_valid_unauth(self):
        pass

    def test_write_narrative_invalid_ref(self):
        self.login()
        nar = self.mixin.read_narrative(self.public_nar['ref'])['data']
        with self.assertRaises(ServerError) as err:
            self.mixin.write_narrative(self.invalid_nar_ref, nar, self.test_user)
        self.assertIsNotNone(err)
        self.logout()

    def test_write_narrative_bad_ref(self):
        self.login()
        nar = self.mixin.read_narrative(self.public_nar['ref'])['data']
        with self.assertRaises(HTTPError) as err:
            self.mixin.write_narrative(self.bad_nar_ref, nar, self.test_user)
        self.assertEquals(err.exception.status_code, 500)
        self.logout()

    def test_write_narrative_bad_file(self):
        self.login()
        with self.assertRaises(HTTPError) as err:
            self.mixin.write_narrative(self.private_nar['ref'], {'not':'a narrative'}, self.test_user)
        self.assertEquals(err.exception.status_code, 400)
        self.logout()
        

    ##### test KBaseWSManagerMixin.rename_narrative #####

    def test_rename_narrative_valid_auth(self):
        new_name = "new_narrative_name"
        self.login()
        nar = self.mixin.read_narrative(self.private_nar['ref'], content=False, include_metadata=True)
        cur_name = nar['info'][10]['name']
        self.mixin.rename_narrative(self.private_nar['ref'], self.test_user, new_name)
        nar = self.mixin.read_narrative(self.private_nar['ref'], content=False, include_metadata=True)
        self.assertEquals(new_name, nar['info'][10]['name'])

        ### now, put it back to the old name, so it doesn't break other tests...
        self.mixin.rename_narrative(self.private_nar['ref'], self.test_user, cur_name)
        self.logout()

    def test_rename_narrative_valid_anon(self):
        with self.assertRaises(PermissionsError) as err:
            self.mixin.rename_narrative(self.public_nar['ref'], self.test_user, 'new_name')
        self.assertIsNotNone(err)

    def test_rename_narrative_unauth(self):
        self.login()
        with self.assertRaises(PermissionsError) as err:
            self.mixin.rename_narrative(self.unauth_nar['ref'], self.test_user, 'new_name')
        self.assertIsNotNone(err)
        self.logout() 

    def test_rename_narrative_invalid(self):
        with self.assertRaises(ServerError) as err:
            self.mixin.rename_narrative(self.invalid_nar_ref, self.test_user, 'new_name')
        self.assertIsNotNone(err)

    def test_rename_narrative_bad(self):
        with self.assertRaises(ValueError) as err:
            self.mixin.rename_narrative(self.bad_nar_ref, self.test_user, 'new_name')
        self.assertIsNotNone(err)

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
        self.login()
        res = self.mixin.list_narratives()
        self.validate_narrative_list(res)
        self.logout()

    def test_list_narrative_ws_valid_anon(self):
        res = self.mixin.list_narratives(ws_id=self.public_nar['ws'])
        self.validate_narrative_list(res)

    def test_list_narrative_ws_valid_noperm_anon(self):
        with self.assertRaises(PermissionsError) as err:
            self.mixin.list_narratives(ws_id=self.private_nar['ws'])
        self.assertIsNotNone(err)

    def test_list_narrative_ws_valid_login(self):
        self.login()
        res = self.mixin.list_narratives(ws_id=self.private_nar['ws'])
        self.validate_narrative_list(res)
        self.logout()

    def test_list_narrative_ws_invalid(self):
        with self.assertRaises(ServerError) as err:
            self.mixin.list_narratives(ws_id=self.invalid_ws_id)
        self.assertIsNotNone(err)

    def test_list_narrative_ws_valid_noperm_auth(self):
        self.login()
        with self.assertRaises(PermissionsError) as err:
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
        with self.assertRaises(ServerError) as err:
            self.mixin.narrative_permissions(self.public_nar['ref'])
        self.assertIsNotNone(err)

    def test_narrative_permissions_valid_login(self):
        self.login()
        ret = self.mixin.narrative_permissions(self.public_nar['ref'])
        self.assertTrue(isinstance(ret, dict) and ret['*'] == 'r')
        self.logout()

    def test_narrative_permissions_invalid_login(self):
        self.login()
        with self.assertRaises(ServerError) as err:
            self.mixin.narrative_permissions(self.invalid_nar_ref)
        self.logout()

    def test_narrative_permissions_inaccessible_login(self):
        self.login()
        ret = self.mixin.narrative_permissions(self.unauth_nar['ref'])
        self.assertTrue(isinstance(ret, dict) and ret[self.test_user] == 'n')
        self.logout()

    def test_narrative_permissions_bad(self):
        with self.assertRaises(ValueError) as err:
            self.mixin.narrative_permissions(self.bad_nar_ref)
        self.assertIsNotNone(err)


    ##### test KBaseWSManagerMixin.narrative_writable #####

    def test_narrative_writable_anon(self):
        with self.assertRaises(ServerError) as err:
            self.mixin.narrative_writable(self.public_nar['ref'], self.test_user)
        self.assertIsNotNone(err)

    def test_narrative_writable_valid_login_nouser(self):
        self.login()
        with self.assertRaises(ValueError) as err:
            self.mixin.narrative_writable(self.public_nar['ref'], None)
        self.assertIsNotNone(err)
        self.logout()

    def test_narrative_writable_valid_login_user(self):
        self.login()
        ret = self.mixin.narrative_writable(self.public_nar['ref'], self.test_user)
        self.assertTrue(ret)
        self.logout()

    def test_narrative_writable_invalid_login_user(self):
        self.login()
        with self.assertRaises(ServerError) as err:
            self.mixin.narrative_writable(self.invalid_nar_ref, self.test_user)
        self.assertIsNotNone(err)
        self.logout()

    def test_narrative_writable_inaccessible_login_user(self):
        self.login()
        ret = self.mixin.narrative_writable(self.unauth_nar['ref'], self.test_user)
        self.assertFalse(ret)
        self.logout()

    def test_narrative_writable_bad_login_user(self):
        self.login()
        with self.assertRaises(ValueError) as err:
            self.mixin.narrative_writable(self.bad_nar_ref, self.test_user)
        self.assertIsNotNone(err)
        self.logout()

if __name__ == '__main__':
    unittest.main()