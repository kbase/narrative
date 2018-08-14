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
    list_files,
    get_input_scaffold,
    _generate_vals,
    _is_singleton
)
import biokbase.narrative.jobs.specmanager
from pprint import pprint

class BatchTestCase(unittest.TestCase):

    @mock.patch('biokbase.narrative.jobs.batch.clients.get', get_mock_client)
    def test_list_objects(self):
        test_inputs = [{
            'type': None,
            'count': 7
        }, {
            'type': "ModuleA.TypeA",
            'count': 3
        }, {
            'type': 'ModuleB.TypeB',
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
            'type': 'NotAModule.NotAType',
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

    @mock.patch('biokbase.narrative.jobs.batch.clients.get', get_mock_client)
    def test_list_objects_bad_type(self):
        with self.assertRaises(ValueError) as e:
            list_objects(obj_type="NotAType")
        self.assertIn("is not a valid type.", str(e.exception))

    @mock.patch('biokbase.narrative.jobs.batch.specmanager.clients.get', get_mock_client)
    @mock.patch('biokbase.narrative.jobs.specmanager.clients.get', get_mock_client)
    def test_get_input_scaffold(self):
        # basic test. includes group stuff.
        # Something, somewhere, isn't mocking the specmanager right.
        # This forces it to work.
        biokbase.narrative.jobs.specmanager.SpecManager().reload()
        scaffold = get_input_scaffold("kb_trimmomatic/run_trimmomatic")
        scaffold_standard = {
            u'adapter_clip': [{
                u'adapterFa': None,
                u'palindrome_clip_threshold': None,
                u'seed_mismatches': None,
                u'simple_clip_threshold': None
            }],
            u'crop_length': None,
            u'head_crop_length': None,
            u'input_reads_ref': None,
            u'leading_min_quality': None,
            u'min_length': None,
            u'output_reads_name': None,
            u'sliding_window': {
                u'sliding_window_min_quality': None,
                u'sliding_window_size': None
            },
            u'trailing_min_quality': None,
            u'translate_to_phred33': None
        }
        self.assertEqual(scaffold_standard, scaffold)

    @mock.patch('biokbase.narrative.jobs.specmanager.clients.get', get_mock_client)
    def test_get_input_scaffold_bad_id(self):
        with self.assertRaises(ValueError) as e:
            get_input_scaffold('foo')
        self.assertIn('Unknown app id "foo" tagged as "release"', str(e.exception))

    @mock.patch('biokbase.narrative.jobs.specmanager.clients.get', get_mock_client)
    def test_get_input_scaffold_bad_tag(self):
        with self.assertRaises(ValueError) as e:
            get_input_scaffold("foo", tag="bar")
        self.assertIn("Can't find tag bar - allowed tags are release, beta, dev", str(e.exception))

    @mock.patch('biokbase.narrative.jobs.batch.specmanager.clients.get', get_mock_client)
    def test_get_input_scaffold_defaults(self):
        # Do standard, group params, lists, etc.
        biokbase.narrative.jobs.specmanager.SpecManager().reload()
        scaffold = get_input_scaffold("kb_trimmomatic/run_trimmomatic", use_defaults=True)
        scaffold_standard = {
            u'adapter_clip': [{
                u'adapterFa': None,
                u'palindrome_clip_threshold': u'30',
                u'seed_mismatches': u'2',
                u'simple_clip_threshold': u'10'
            }],
            u'crop_length': None,
            u'head_crop_length': u'0',
            u'input_reads_ref': None,
            u'leading_min_quality': u'3',
            u'min_length': u'36',
            u'output_reads_name': None,
            u'sliding_window': {
                u'sliding_window_min_quality': u'15',
                u'sliding_window_size': u'4'
            },
            u'trailing_min_quality': u'3',
            u'translate_to_phred33': u'1'
        }
        self.assertEqual(scaffold_standard, scaffold)

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

    def test__generate_vals(self):
        good_inputs = [{
            'tuple': (0, 5, 20),
            'vals': [0, 5, 10, 15, 20]
        }, {
            'tuple': (5, 10, 50),
            'vals': [5, 15, 25, 35, 45]
        }, {
            'tuple': (10, -1, 5),
            'vals': [10, 9, 8, 7, 6, 5]
        }, {
            'tuple': (1, 0.1, 2),
            'vals': [1.00, 1.10, 1.20, 1.30, 1.40, 1.50, 1.60, 1.70, 1.80, 1.90, 2.00],
            'is_float': True
        }, {
            'tuple': (-10, 1, -5),
            'vals': [-10, -9, -8, -7, -6, -5]
        }, {
            'tuple': (-1, -1, -5),
            'vals': [-1, -2, -3, -4, -5]
        }]
        for i in good_inputs:
            ret_val = _generate_vals(i['tuple'])
            if 'is_float' in i:
                ret_val = [round(x, 2) for x in ret_val]
            self.assertEqual(ret_val, i['vals'])

        unreachable_inputs = [
            (-1, -1, 5),
            (0, -1, 10),
            (-20, 5, -30),
            (10, -1, 20)
        ]
        for t in unreachable_inputs:
            with self.assertRaises(ValueError) as e:
                _generate_vals(t)
            self.assertIn('The maximum value of this tuple will never be reached based on the interval value', str(e.exception))
        with self.assertRaises(ValueError) as e:
            _generate_vals(('a', -1, 1))
        self.assertIn('The input tuple must be entirely numeric', str(e.exception))
        with self.assertRaises(ValueError) as e:
            _generate_vals((10, 0, 1))
        self.assertIn('The interval value must not be 0', str(e.exception))

    def test__is_singleton(self):
        scalar_param = {
            "allow_multiple": 0,
            "id": "scalar_param",
            "is_group": False,
            "is_output": 0,
            "type": "int"
        }
        self.assertTrue(_is_singleton(1, scalar_param))
        self.assertTrue(_is_singleton("foo", scalar_param))
        self.assertFalse(_is_singleton([1, 2, 3], scalar_param))
        self.assertFalse(_is_singleton([1], scalar_param))

        group_param = {
            "allow_multiple": 0,
            "id": "group_param",
            "is_group": True,
            "parameter_ids": ["first", "second"],
            "type": "group"
        }
        self.assertTrue(_is_singleton({"first": 1, "second": 2}, group_param))
        self.assertFalse(_is_singleton([{"first": 1, "second": 2}], group_param))

        list_param = {
            "allow_multiple": 1,
            "id": "list_param",
            "is_group": False,
            "type": "int"
        }
        self.assertTrue(_is_singleton(['foo'], list_param))
        self.assertFalse(_is_singleton([['a', 'b'], ['c', 'd']], list_param))
        self.assertFalse(_is_singleton([['a']], list_param))
