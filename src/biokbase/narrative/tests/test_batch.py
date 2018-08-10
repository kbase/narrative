"""
Tests for the app_util module
"""
import unittest
import biokbase.auth
from biokbase.narrative.app_util import (
    check_tag,
    system_variable,
    get_result_sub_path,
    map_inputs_from_job,
    map_outputs_from_state
)
from narrative_mock.mockclients import get_mock_client
import os
import mock
import util

class BatchTestCase(unittest.TestCase):
    def test_list_objects(self):
        pass

    def test_list_objects_no_permission(self):
        pass

    def test_list_objects_bad_type(self):
        pass

    def test_list_objects_type(self):
        pass

    def test_list_objects_name(self):
        pass

    def test_get_input_scaffold(self):
        # Do standard, group params, lists, etc.
        pass

    def test_get_input_scaffold_bad_id(self):
        pass

    def test_get_input_scaffold_bad_tag(self):
        pass

    def test_get_input_scaffold_defaults(self):
        # Do standard, group params, lists, etc.
        pass

    def test_list_files(self):
        pass

    def test_list_files_filter(self):
        # include returning no results
        pass

