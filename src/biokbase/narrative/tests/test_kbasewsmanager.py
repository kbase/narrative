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

class NarrTestCase(unittest.TestCase):
    # Before test:
    # - Log in (for tests that require login)
    # also sets the token in the environment variable so the manager can get to it.
    @classmethod
    def setUpClass(self):
        self.user_id = "kbasetest"
        self.pwd = getpass("Password for kbasetest: ")
        self.token = biokbase.auth.Token(user_id=self.user_id, password=self.pwd)
        # by default, user's left logged out

    def setUp(self):
        self.mgr = KBaseWSNotebookManager()

    def tearDown(self):
        self.logout()
        pass

    @classmethod
    def tearDownClass(self):
        pass

    def login(self):
        biokbase.auth.set_environ_token(self.token.token)

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

    def test_create_new_nb_loggedin(self):
        self.login()
        pass

    def test_create_new_nb_loggedout(self):
        pass


    # methods to test in kbasewsmanager.KBaseWSNotebookManager:
    # _clean_id
    # list_notebooks
    # new_notebook
    # delete_notebook_id
    # notebook_exists
    # get_name
    # read_notebook_object
    # write_notebook_object
    # delete_notebook_id
    # create_checkpoint
    # list_checkpoints
    # restore_checkpoint
    # delete_checkpoint
    # log_info

if __name__ == '__main__':
    unittest.main()