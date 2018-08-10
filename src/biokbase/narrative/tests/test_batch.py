"""
Tests for the app_util module
"""
import unittest
from narrative_mock.mockclients import get_mock_client
import os
import mock
import util
from biokbase.narrative.jobs.batch import (
    list_objects,
    list_files
)
from pprint import pprint

class BatchTestCase(unittest.TestCase):

    @mock.patch('biokbase.narrative.jobs.appmanager.clients.get', get_mock_client)
    def test_list_objects(self):
        obj_type = "Module1.Type1"
        req_keys = ['type', 'name', 'upa']
        objs = list_objects(obj_type=obj_type)
        self.assertEqual(len(objs), 1)
        self.assertTrue(objs[0]['type'].startswith(obj_type))
        [self.assertIn(k, objs[0]) for k in req_keys]

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

