"""
Tests for the app_util module
"""
import unittest
from .narrative_mock.mockclients import (
    get_mock_client,
    MockStagingHelper
)
import os
import mock
from . import util
from biokbase.narrative.jobs.batch import (
    list_objects,
    list_files,
    get_input_scaffold,
    _generate_vals,
    _is_singleton,
    generate_input_batch,
    _prepare_output_vals
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
            'adapter_clip': [{
                'adapterFa': None,
                'palindrome_clip_threshold': None,
                'seed_mismatches': None,
                'simple_clip_threshold': None
            }],
            'crop_length': None,
            'head_crop_length': None,
            'input_reads_ref': None,
            'leading_min_quality': None,
            'min_length': None,
            'output_reads_name': None,
            'sliding_window': {
                'sliding_window_min_quality': None,
                'sliding_window_size': None
            },
            'trailing_min_quality': None,
            'translate_to_phred33': None
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
            'adapter_clip': [{
                'adapterFa': None,
                'palindrome_clip_threshold': '30',
                'seed_mismatches': '2',
                'simple_clip_threshold': '10'
            }],
            'crop_length': None,
            'head_crop_length': '0',
            'input_reads_ref': None,
            'leading_min_quality': '3',
            'min_length': '36',
            'output_reads_name': None,
            'sliding_window': {
                'sliding_window_min_quality': '15',
                'sliding_window_size': '4'
            },
            'trailing_min_quality': '3',
            'translate_to_phred33': '1'
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

        wrong_size = [(1,), (1, 2), (1, 2, 3, 4), ()]
        for s in wrong_size:
            with self.assertRaises(ValueError) as e:
                _generate_vals(s)
            self.assertIn('The input tuple must have 3 values', str(e.exception))

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

    @mock.patch('biokbase.narrative.jobs.batch.specmanager.clients.get', get_mock_client)
    @mock.patch('biokbase.narrative.jobs.specmanager.clients.get', get_mock_client)
    def test_generate_input_batch(self):
        biokbase.narrative.jobs.specmanager.SpecManager().reload()
        app_id = "kb_trimmomatic/run_trimmomatic"
        # fail with no inputs
        with self.assertRaises(ValueError) as e:
            generate_input_batch(app_id)
        self.assertIn("No inputs were given! If you just want to build an empty input set, try get_input_scaffold.", str(e.exception))
        # fail with bad app id
        with self.assertRaises(ValueError) as e:
            generate_input_batch("nope")
        self.assertIn("Unknown app id", str(e.exception))
        # fail with bad tag, and good app id
        with self.assertRaises(ValueError) as e:
            generate_input_batch(app_id, tag="foo")
        self.assertIn("Can't find tag foo", str(e.exception))
        # fail with no output template and no default
        with self.assertRaises(ValueError) as e:
            generate_input_batch(app_id, input_reads_ref="abcde")
        self.assertIn("No output template provided", str(e.exception))
        # fail with incorrect input
        with self.assertRaises(ValueError) as e:
            generate_input_batch(app_id, not_an_input="something")
        self.assertIn("is not a parameter", str(e.exception))

        # a simple test, should make 4, all with same input and output strings.
        inputs = {
            "input_reads_ref": "abcde",
            "output_reads_name": "foo",
            "palindrome_clip_threshold": [5, 7],
            "translate_to_phred33": [0, 1]
        }
        input_batch = generate_input_batch(app_id, **inputs)
        self.assertEqual(len(input_batch), 4)
        for b in input_batch:
            self.assertEqual(b['input_reads_ref'], inputs['input_reads_ref'])
            self.assertEqual(b['output_reads_name'], inputs['output_reads_name'])
            self.assertIn(b['adapter_clip'][0]['palindrome_clip_threshold'], inputs['palindrome_clip_threshold'])
            self.assertIn(b['translate_to_phred33'], inputs['translate_to_phred33'])

        # more complex test, should make several, uses ranges.
        inputs = {
            "output_reads_name": "foo_${run_number}",
            "palindrome_clip_threshold": [5, 7],
            "min_length": (0, 10, 100)
        }
        input_batch = generate_input_batch(app_id, **inputs)
        self.assertEqual(len(input_batch), 22) # product of [0,10,20,30,40,50,60,70,80,90,100] and [5,7]
        len_ranges = dict()
        for i in range(0, 101, 10):
            len_ranges[i] = 0
        palindrome_ranges = {5: 0, 7: 0}

        # test for templated outputs in above
        out_strs = dict.fromkeys(["foo_{}".format(i) for i in range(22)], 0)

        for b in input_batch:
            palindrome_ranges[b['adapter_clip'][0]['palindrome_clip_threshold']] += 1
            self.assertIn(b['adapter_clip'][0]['palindrome_clip_threshold'], inputs['palindrome_clip_threshold'])
            len_ranges[b['min_length']] += 1
            self.assertIn(b['min_length'], len_ranges)
            self.assertIn(b['output_reads_name'], out_strs)
            out_strs[b['output_reads_name']] += 1
        # make sure each value is used the right number of times.
        self.assertEqual(len(len_ranges.keys()), 11)
        for v in len_ranges.values():
            self.assertEqual(v, 2)
        self.assertEqual(len(palindrome_ranges.keys()), 2)
        for v in palindrome_ranges.values():
            self.assertEqual(v, 11)
        self.assertEqual(len(out_strs.keys()), 22)
        for v in out_strs.values():
            self.assertEqual(v, 1)

    def test__prepare_output_vals(self):
        basic_params_dict = {
            'output': {
                'default': None,
                'is_output': True
            },
            'some_param': {
                'default': 'value'
            },
            'other_param': {
                'default': "default_output",
                'is_output': True
            }
        }

        # simple pass cases with list of outputs.
        output_val_set = [{
            'output': ['a', 'b', 'c'],
        }, {
            'output': "some_str"
        }, {
            'output': "some_str_${some_param}_${run_number}"
        }]
        for o in output_val_set:
            out_vals = _prepare_output_vals(o, basic_params_dict, 3)
            o2 = o.copy()
            o2.update({'other_param': 'default_output${run_number}'})
            self.assertEqual(o2, out_vals)

        # check default output value
        out_vals = _prepare_output_vals({'output': 'foo', 'other_param': None}, basic_params_dict, 3)
        self.assertEqual(out_vals['other_param'], basic_params_dict['other_param']['default'] + '${run_number}')


        # some fails
        with self.assertRaises(ValueError) as e:
            _prepare_output_vals({'output': ['a', 'b', 'c']}, basic_params_dict, 5)
        self.assertIn("The output parameter output must have 5 values if it's a list", str(e.exception))

        with self.assertRaises(ValueError) as e:
            _prepare_output_vals({'output': None}, basic_params_dict, 3)
        self.assertIn('No output template provided for parameter "output" and no default value found!', str(e.exception))

        with self.assertRaises(ValueError) as e:
            _prepare_output_vals({'output': "foo_${not_a_param}"}, basic_params_dict, 3)
        self.assertIn("Output template field not_a_param doesn't match a parameter id or 'run_number'", str(e.exception))
