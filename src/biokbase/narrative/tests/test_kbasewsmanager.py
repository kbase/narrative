"""
Tests for Narrative notebook manager
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

import unittest
from getpass import getpass
from biokbase.narrative.kbasewsmanager import KBaseWSNotebookManager
from biokbase.workspace.client import Workspace
import biokbase.auth
import os
import re
from tornado import web

# matches valid names of Narratives = "workspace id"/"narrative name"
# e.g. complicated stuff like:
# wjriehl:my_complicated_workspace123/Here is a new narrative!
name_regex = re.compile('[\w:-]+/[\w:-]+')

# matches a valid Narrative reference name, eg:
# ws.768.obj.1234
obj_regex = re.compile('^ws\.\d+\.obj\.\d+')

bad_narrative_id = "Not a real Narrative id!"
test_user_id = "kbasetest"

class NarrBaseTestCase(unittest.TestCase):
    # Before test:
    # - Log in (for tests that require login)
    # also sets the token in the environment variable so the manager can get to it.
    @classmethod
    def setUpClass(self):
        self.user_id = test_user_id
        self.pwd = getpass("Password for {}: ".format(test_user_id))
        self.token = biokbase.auth.Token(user_id=self.user_id, password=self.pwd)
        # by default, user's left logged out

    @classmethod
    def setUp(self):
        self.mgr = KBaseWSNotebookManager()

    @classmethod
    def tearDown(self):
        self.logout()
        pass

    @classmethod
    def tearDownClass(self):
        pass

    @classmethod
    def login(self):
        biokbase.auth.set_environ_token(self.token.token)

    @classmethod
    def logout(self):
        biokbase.auth.set_environ_token(None)

    def test_manager_instantiated(self):
        self.assertIsInstance(self.mgr, biokbase.narrative.kbasewsmanager.KBaseWSNotebookManager)

    # test get_userid()
    def test_user_id_loggedin(self):
        self.login()
        self.assertEquals(self.mgr.get_userid(), self.user_id)

    # test get_userid()
    def test_user_id_loggedout(self):
        self.assertEquals(self.mgr.get_userid(), None)

    # test wsclient()
    def test_wsclient(self):
        self.assertIsInstance(self.mgr.wsclient(), Workspace)

    # test info_string (just make sure it's a string)
    def test_info_string(self):
        self.assertIsInstance(self.mgr.info_string(), basestring)

    # test list notebooks while logged in returns a list of strings
    def test_list_notebooks_loggedin(self):
        self.login()
        self.test_list_notebooks()

    def test_list_notebooks_loggedout(self):
        self.test_list_notebooks()

    def test_list_notebooks(self):
        nb_list = self.mgr.list_notebooks()
        # assert we actually get something
        self.assertIsInstance(nb_list, list)
        # assert it's a list of formatted dicts
        format_failure = self.check_nb_list_format(nb_list)
        self.assertIsNone(format_failure)

    def check_nb_list_format(self, nb_list):
        for nb_info in nb_list:
            if not 'name' in nb_info:
                return 'Missing a "name" key!'
            if not 'notebook_id' in nb_info:
                return 'Missing a "notebook_id key!'
            if not name_regex.match(nb_info['name']):
                return 'Incorrect format for "name" key: {}'.format(nb_info['name'])
            if not obj_regex.match(nb_info['notebook_id']):
                return 'Incorrect format for "notebook_id" key: {}'.format(nb_info['notebook_id'])
        # If we make it this far, don't return anything! Hooray!
        return None

    def test_clean_id(self):
        spacey_str = 'test test  test test   test'
        unspacey_str = 'test_test__test_test___test'
        self.assertEquals(self.mgr._clean_id(spacey_str), unspacey_str)

class NarrDocumentTestCase(NarrBaseTestCase):
    @classmethod
    def setUpClass(self):
        try:
            self.login()
            # id for test notebook that'll get twiddled in this test case
            self.nb_id = self.mgr.new_notebook()
            self.logout()
        except:
            print "Unable to create a new Narrative for testing manipulation methods against. Exiting..."
            raise

    @classmethod
    def tearDownClass(self):
        try:
            self.login()
            self.mgr.delete_notebook(self.nb_id)
            self.logout()
        except:
            print "Unable to delete test Narrative with id {} after testing was completed!".format(self.nb_id)
            raise


    # test that we can create and destroy a new Narrative while logged in
    def test_create_delete_new_nb_loggedin(self):
        self.login()
        try:
            test_id = self.mgr.new_notebook()
            self.assertIsNotNone(test_id)
        except:
            raise
        try:
            self.mgr.delete_notebook(test_id)
        except:
            raise

    # test that trying to create a new Narrative while not logged in fails properly
    def test_create_new_nb_loggedout(self):
        with self.assertRaises(web.HTTPError) as err:
            self.mgr.new_notebook()
        self.assertEquals(err.exception.status_code, 401)

    def test_notebook_exists_valid(self):
        self.login()
        self.assertTrue(self.mgr.notebook_exists(self.nb_id))

    def test_notebook_exists_invalid(self):
        self.login()
        self.assertFalse(self.mgr.notebook_exists(bad_narrative_id))

    def test_notebook_exists_loggedout(self):
        with self.assertRaises(web.HTTPError) as err:
            self.mgr.notebook_exists(self.nb_id)
        self.assertEquals(err.exception.status_code, 400)

    def test_get_name_valid(self):
        self.login()
        self.assertIsNotNone(self.mgr.get_name(self.nb_id))

    def test_get_name_invalid(self):
        with self.assertRaises(web.HTTPError) as err:
            self.mgr.get_name(bad_narrative_id)
        self.assertEquals(err.exception.status_code, 404)

    def test_get_name_loggedout(self):
        with self.assertRaises(web.HTTPError) as err:
            self.mgr.get_name(self.nb_id)
        self.assertEquals(err.exception.status_code, 404)

    # create_checkpoint is a no-op for now, but leave in blank tests
    def test_create_checkpoint_valid(self):
        pass

    def test_create_checkpoint_invalid(self):
        pass

    def test_create_checkpoint_loggedout(self):
        pass

    # list_checkpoints is a no-op for now, but leave in blank tests
    def test_list_checkpoints_valid(self):
        pass

    def test_list_checkpoints_invalid(self):
        pass

    def test_list_checkpoints_loggedout(self):
        pass

    # restore_checkpoint is a no-op for now, but leave in blank tests
    def test_restore_checkpoint_valid(self):
        pass

    def test_restore_checkpoint_invalid(self):
        pass

    def test_restore_checkpoint_loggedout(self):
        pass

    # delete_checkpoint is a no-op for now, but leave in blank tests
    def test_delete_checkpoint_valid(self):
        pass

    def test_delete_checkpoint_invalid(self):
        pass

    def test_delete_checkpoint_loggedout(self):
        pass

    def test_read_notebook_valid(self):
        self.login()
        (last_modified, nb) = self.mgr.read_notebook_object(self.nb_id)
        self.assertIsNone(self.validate_nb(last_modified, nb))

    def test_read_notebook_invalid(self):
        self.login()
        with self.assertRaises(web.HTTPError) as err:
            self.mgr.read_notebook_object(bad_narrative_id)
        self.assertEquals(err.exception.status_code, 500)

    def test_read_notebook_loggedout(self):
        with self.assertRaises(web.HTTPError) as err:
            self.mgr.read_notebook_object(bad_narrative_id)
        self.assertEquals(err.exception.status_code, 400)

    def validate_nb(self, last_modified, nb):
        if last_modified is None:
            return "Missing 'last modified' field!"
        if nb is None:
            return "Missing nb field!"

        keylist = ['nbformat', 'nbformat_minor', 'worksheets', 'metadata']
        for key in keylist:
            if not key in nb:
                return 'Required key "{}" missing from Narrative object'.format(key)

        metadata_check = {
            'description': '',
            'format': 'ipynb',
            'creator': self.user_id,
            'data_dependencies': [],
            'ws_name': '',
            'type': 'KBaseNarrative.Narrative',
            'name': ''
        }
        for key in metadata_check.keys():
            if key in nb['metadata']:
                test_val = metadata_check[key]
                if len(test_val) > 0:
                    if test_val != nb['metadata'][key]:
                        return 'Metadata key "{}" should have value "{}", but has value "{}"'.format(key, test_val, nb['metadata'][key])
            else:
                return 'Required metadata key "{}" missing from Narrative object'.format(key)
        return None

    def test_write_notebook_object_valid(self):
        self.login()
        (last_modified, nb) = self.mgr.read_notebook_object(self.nb_id)
        ret_id = self.mgr.write_notebook_object(nb, notebook_id=self.nb_id)
        self.assertEquals(ret_id, self.nb_id)

    # Without an id, we would expect it to create a new narrative object in the
    # same workspace that Notebook knows about from its metadata
    def test_write_notebook_object_valid_without_id(self):
        self.login()
        (last_modified, nb) = self.mgr.read_notebook_object(self.nb_id)
        ret_id = self.mgr.write_notebook_object(nb)
        # we haven't changed the notebook's name, so it should be the same
        self.assertNotEquals(ret_id, self.nb_id)
        # Do a little specific cleanup here.
        if (ret_id is not self.nb_id):
            self.mgr.delete_notebook(ret_id)

    def test_write_notebook_object_invalid(self):
        self.login()
        with self.assertRaises(web.HTTPError) as err:
            self.mgr.write_notebook_object({})
        self.assertEquals(err.exception.status_code, 400) # should be 500?

    def test_write_notebook_object_loggedout(self):
        with self.assertRaises(web.HTTPError) as err:
            self.mgr.write_notebook_object({})
        self.assertEquals(err.exception.status_code, 400)

    # not sure the best way to test this, and it's not very relevant for KBase, since we
    # don't expose the mapping to users (this is for the typical IPython loading screen)
    def test_delete_notebook_id(self):
        pass


    # cases left to test!
    # new notebook name
    # new nb name with funky characters
    # reading a deleted Narrative
    # reading/writing with creds, but unauthorized (e.g. kbasetest trying to write to wjriehl:home)


if __name__ == '__main__':
    unittest.main()