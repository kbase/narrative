"""
Tests for the app manager.
"""
from biokbase.narrative.jobs.appmanager import AppManager
from biokbase.narrative.jobs.specmanager import SpecManager
from IPython.display import HTML
import unittest
import mock
from traitlets import Instance
import os
import json


class AppManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.mm = AppManager()
        self.good_app_id = 'NarrativeTest/test_input_params'
        self.good_tag = 'dev'
        self.bad_app_id = 'NotARealApp'
        self.bad_tag = 'NotARealTag'

    def test_reload(self):
        self.mm.reload()
        info = self.mm.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(info)

    def test_app_usage(self):
        # good id and good tag
        usage = self.mm.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(usage)

        # bad id
        with self.assertRaises(ValueError):
            self.mm.app_usage(self.bad_app_id)

        # bad tag
        with self.assertRaises(ValueError):
            self.mm.app_usage(self.good_app_id, self.bad_tag)

    def test_app_usage_html(self):
        usage = self.mm.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(usage._repr_html_())

    def test_app_usage_str(self):
        usage = self.mm.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(str(usage))

    def test_available_apps_good(self):
        apps = self.mm.available_apps(self.good_tag)
        self.assertIsInstance(apps, HTML)

    def test_available_apps_bad(self):
        with self.assertRaises(ValueError):
            self.mm.available_apps(self.bad_tag)

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_good_inputs(self, m):
        m.return_value._send_comm_message.return_value = None
        pass
        # TODO: self.assertFalse("this test and code with mocking")

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_id(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.mm.run_app(self.bad_app_id, None))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_tag(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.mm.run_app(self.good_app_id,
                                          None,
                                          tag=self.bad_tag))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_version_match(self, m):
        # fails because a non-release tag can't be versioned
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.mm.run_app(self.good_app_id,
                                          None,
                                          tag=self.good_tag,
                                          version=">0.0.1"))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_missing_inputs(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.mm.run_app(self.good_app_id,
                                          None,
                                          tag=self.good_tag))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_version(self, m):
        m.return_value._send_comm_message.return_value = None
        print('here')
        self.assertIsNone(self.mm.run_app(self.good_app_id,
                                          None,
                                          tag="dev",
                                          version="1.0.0"))


    def test_app_description(self):
        desc = self.mm.app_description(self.good_app_id, tag=self.good_tag)
        self.assertIsInstance(desc, HTML)

    def test_app_description_bad_tag(self):
        with self.assertRaises(ValueError):
            self.mm.app_description(self.good_app_id, tag=self.bad_tag)

    def test_app_description_bad_name(self):
        with self.assertRaises(ValueError):
            self.mm.app_description(self.bad_app_id)

    def test_validate_params(self):
        inputs = {
            "reads_tuple": [
                {
                    "input_reads_label": "reads file 1",
                    "input_reads_obj": "rhodobacterium.art.q20.int.PE.reads",
                    "input_reads_metadata": {
                        "key1": "value1"
                    }
                },
                {
                    "input_reads_label": "reads file 2",
                    "input_reads_obj": "rhodobacterium.art.q10.PE.reads",
                    "input_reads_metadata": {
                        "key2": "value2"
                    }
                }
            ],
            "output_object": "MyReadsSet",
            "description": "New Reads Set"
        }
        app_id = "NarrativeTest/test_create_set"
        tag = "dev"
        prev_ws_id = os.environ.get('KB_WORKSPACE_ID', None)
        os.environ['KB_WORKSPACE_ID'] = 'wjriehl:1475006266615'
        sm = SpecManager()
        spec = sm.get_spec(app_id, tag=tag)
        (params, ws_inputs) = self.mm._validate_parameters(app_id,
                                                           tag,
                                                           sm.app_params(spec),
                                                           inputs)
        self.assertDictEqual(params, inputs)
        self.assertIn('11635/9/1', ws_inputs)
        self.assertIn('11635/10/1', ws_inputs)
        if prev_ws_id is None:
            del(os.environ['KB_WORKSPACE_ID'])
        else:
            os.environ['KB_WORKSPACE_ID'] = prev_ws_id

    def test_input_mapping(self):
        inputs = {
            "reads_tuple": [
                {
                    "input_reads_label": "reads file 1",
                    "input_reads_obj": "rhodobacterium.art.q20.int.PE.reads",
                    "input_reads_metadata": {
                        "key1": "value1"
                    }
                },
                {
                    "input_reads_label": "reads file 2",
                    "input_reads_obj": "rhodobacterium.art.q10.PE.reads",
                    "input_reads_metadata": {
                        "key2": "value2"
                    }
                }
            ],
            "output_object": "MyReadsSet",
            "description": "New Reads Set"
        }
        app_id = "NarrativeTest/test_create_set"
        tag = "dev"
        ws_name = 'wjriehl:1475006266615'
        prev_ws_id = os.environ.get('KB_WORKSPACE_ID', None)
        os.environ['KB_WORKSPACE_ID'] = ws_name
        from biokbase.narrative.jobs.specmanager import SpecManager
        sm = SpecManager()
        spec = sm.get_spec(app_id, tag=tag)
        spec_params = sm.app_params(spec)
        spec_params_map = dict(
            (spec_params[i]['id'], spec_params[i])
            for i in range(len(spec_params))
        )
        mapped_inputs = self.mm._map_inputs(
            spec['behavior']['kb_service_input_mapping'],
            inputs,
            spec_params_map
        )
        expected = [{
            u'output_object_name': 'MyReadsSet',
            u'data': {
                u'items': [{
                    u'label': 'reads file 1',
                    u'metadata': {'key1': 'value1'},
                    u'ref': '11635/9/1'
                }, {
                    u'label': 'reads file 2',
                    u'metadata': {'key2': 'value2'},
                    u'ref': '11635/10/1'
                }],
                u'description': 'New Reads Set'
            },
            u'workspace': ws_name
        }]
        self.assertDictEqual(expected[0], mapped_inputs[0])
        if prev_ws_id is None:
            del(os.environ['KB_WORKSPACE_ID'])
        else:
            os.environ['KB_WORKSPACE_ID'] = prev_ws_id

    def test_generate_input(self):
        prefix = 'pre'
        suffix = 'suf'
        num_symbols = 8
        generator = {
            'symbols': num_symbols,
            'prefix': prefix,
            'suffix': suffix
        }
        rand_str = self.mm._generate_input(generator)
        self.assertTrue(rand_str.startswith(prefix))
        self.assertTrue(rand_str.endswith(suffix))
        self.assertEqual(len(rand_str), len(prefix)+len(suffix)+num_symbols)

    def test_generate_input_bad(self):
        with self.assertRaises(ValueError):
            self.mm._generate_input({'symbols': 'foo'})
        with self.assertRaises(ValueError):
            self.mm._generate_input({'symbols': -1})

    def test_transform_input_good(self):
        ws_name = 'wjriehl:1475006266615'
        os.environ['KB_WORKSPACE_ID'] = ws_name
        test_data = [
            {
                'value': 'input_value',
                'type': 'unresolved-ref',
                'expected': ws_name + '/' + 'input_value'
            },
            {
                'value': 'rhodobacterium.art.q20.int.PE.reads',
                'type': 'ref',
                'expected': '11635/9/1'
            },
            {
                'value': None,
                'type': 'int',
                'expected': None
            },
            {
                'value': '5',
                'type': 'int',
                'expected': 5
            },
            {
                'value': ['rhodobacterium.art.q20.int.PE.reads',
                          'rhodobacterium.art.q10.PE.reads'],
                'type': 'list<ref>',
                'expected': ['11635/9/1', '11635/10/1']
            },
            {
                'value': 'rhodobacterium.art.q20.int.PE.reads',
                'type': 'list<ref>',
                'expected': ['11635/9/1']
            },
            {
                'value': ['1', '2', 3],
                'type': 'list<int>',
                'expected': [1, 2, 3]
            },
            {
                'value': 'bar',
                'type': None,
                'expected': 'bar'
            },
            {
                'value': 'rhodobacterium.art.q20.int.PE.reads',
                'type': None,
                'spec': {'is_output': 0, 'allowed_types': ["Some.KnownType"]},
                'expected': '11635/9/1'
            }
        ]
        for test in test_data:
            spec = test.get('spec', None)
            ret = self.mm._transform_input(test['type'], test['value'], spec)
            self.assertEqual(ret, test['expected'])
        del(os.environ['KB_WORKSPACE_ID'])

    def test_transform_input_bad(self):
        with self.assertRaises(ValueError):
            self.mm._transform_input('foo', 'bar', None)

if __name__ == "__main__":
    unittest.main()
