"""
Tests for the app_util module
"""
import unittest
from narrative_mock.mockclients import (
    get_mock_client,
    MockStagingHelper
)
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
        test_inputs = [{
            'type': None,
            'count': 7
        }, {
            'type': "Module1.Type1",
            'count': 3
        }, {
            'type': 'Module2.Type2',
            'count': 1
        }, {
            'type': None,
            'name': 'obj',
            'fuzzy_name': True,
            'count': 7
        }, {
            'type': None,
            'name': 'blah',
            'count': 0
        }, {
            'type': 'NotAType',
            'count': 0
        }, {
            'type': None,
            'name': 'obj',
            'count': 0,
            'fuzzy_name': False
        }]
        req_keys = ['type', 'name', 'upa']
        for t in test_inputs:
            objs = list_objects(obj_type=t.get('type'), name=t.get('name'), fuzzy_name=t.get('fuzzy_name', True))
            self.assertEqual(len(objs), t['count'])
            for o in objs:
                if t.get('type'):
                    self.assertTrue(o['type'].startswith(t.get('type')))
                [self.assertIn(k, o) for k in req_keys]

    def test_list_objects_bad_type(self):
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

    @mock.patch('biokbase.narrative.jobs.batch.StagingHelper', MockStagingHelper)
    def test_list_files(self):
        name_filters = [{
            'name': None,
            'count': 7
        }, {
            'name': 'file',
            'count': 6
        }, {
            'name': 'no_way_this_exists_as_a_file_anywhere',
            'count': 0
        }]
        for f in name_filters:
            files = list_files(name=f.get('name'))
            self.assertEqual(len(files), f.get('count'))
