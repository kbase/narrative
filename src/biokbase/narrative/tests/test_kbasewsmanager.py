"""
Tests for Narrative notebook manager
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

import unittest
from biokbase.narrative.kbasewsmanager import KBaseWSNotebookManager

class NarrTestCase(unittest.TestCase):
    # Before test:
    # Log in (tests require login)
    #
    # Tests
    # 1. Instantiate the NB manager
    # 2. Create New NB
    # -- Logged in vs. logged out
    # 3. Test get_userid
    # -- logged in vs. logged out
    # methods to test in kbasewsmanager.KBaseWSNotebookManager:
    # get_userid
    # wsclient
    # _clean_id
    # list_notebooks
    # new_notebook
    # delete_notebook_id
    # notebook_exists
    # get_name
    # read_notebook_object
    # extract_data_dependencies
    # write_notebook_object
    # delete_notebook_id
    # create_checkpoint
    # list_checkpoints
    # restore_checkpoint
    # delete_checkpoint
    # log_info
    # info_string

    