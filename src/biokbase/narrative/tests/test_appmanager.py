"""
Tests for the app manager.
"""
from biokbase.narrative.jobs.appmanager import AppManager
from biokbase.narrative.jobs.specmanager import SpecManager
from biokbase.narrative.jobs.job import Job
from IPython.display import HTML
import unittest
import mock
import os


class AppManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.am = AppManager()
        self.good_app_id = 'NarrativeTest/test_input_params'
        self.good_tag = 'dev'
        self.bad_app_id = 'NotARealApp'
        self.bad_tag = 'NotARealTag'
        self.test_app_id = "AssemblyRAST/run_arast"
        self.test_app_params = {
            "read_library_names": ["rhodo.art.jgi.reads"],
            "output_contigset_name": "rhodo_contigs",
            "recipe": "auto",
            "assembler": "",
            "pipeline": "",
            "min_contig_len": None
        }
        self.test_job_id = "new_job_id"
        self.test_tag = "dev"
        self.public_ws = "wjriehl:1475006266615"
        self.ws_id = 11635
        self.app_input_ref = "11635/19/4"

    def test_reload(self):
        self.am.reload()
        info = self.am.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(info)

    def test_app_usage(self):
        # good id and good tag
        usage = self.am.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(usage)

        # bad id
        with self.assertRaises(ValueError):
            self.am.app_usage(self.bad_app_id)

        # bad tag
        with self.assertRaises(ValueError):
            self.am.app_usage(self.good_app_id, self.bad_tag)

    def test_app_usage_html(self):
        usage = self.am.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(usage._repr_html_())

    def test_app_usage_str(self):
        usage = self.am.app_usage(self.good_app_id, self.good_tag)
        self.assertTrue(str(usage))

    def test_available_apps_good(self):
        apps = self.am.available_apps(self.good_tag)
        self.assertIsInstance(apps, HTML)

    def test_available_apps_bad(self):
        with self.assertRaises(ValueError):
            self.am.available_apps(self.bad_tag)

    @mock.patch('biokbase.narrative.jobs.appmanager.clients.NarrativeJobService')
    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_good_inputs(self, m, njs):
        m.return_value._send_comm_message.return_value = None
        njs.run_job.return_value = self.test_job_id
        self.am.njs = njs
        os.environ['KB_WORKSPACE_ID'] = self.public_ws
        new_job = self.am.run_app(
            self.test_app_id,
            self.test_app_params,
            tag=self.test_tag
        )
        self.assertIsInstance(new_job, Job)
        self.assertEquals(new_job.job_id, self.test_job_id)
        self.assertEquals(new_job.app_id, self.test_app_id)
        self.assertEquals(new_job.tag, self.test_tag)
        self.assertIsNone(new_job.cell_id)

        job_run_input, kwargs = njs.run_job.call_args
        self.assertTrue(job_run_input[0]['wsid'] == self.ws_id)
        self.assertTrue(job_run_input[0]['source_ws_objects'] == [self.app_input_ref])

    @mock.patch('biokbase.narrative.jobs.appmanager.clients.NarrativeJobService')
    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_from_gui_cell(self, m, njs):
        m.return_value._send_comm_message.return_value = None
        njs.run_job.return_value = self.test_job_id
        self.am.njs = njs
        os.environ['KB_WORKSPACE_ID'] = self.public_ws
        self.assertIsNone(self.am.run_app(
            self.test_app_id,
            self.test_app_params,
            tag=self.test_tag,
            cell_id="12345"
        ))
        job_run_input, kwargs = njs.run_job.call_args
        self.assertTrue(job_run_input[0]['meta']['cell_id'] == "12345")
        self.assertTrue(job_run_input[0]['wsid'] == self.ws_id)
        self.assertTrue(job_run_input[0]['source_ws_objects'] == [self.app_input_ref])

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_id(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.am.run_app(self.bad_app_id, None))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_tag(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.am.run_app(self.good_app_id,
                                          None,
                                          tag=self.bad_tag))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_version_match(self, m):
        # fails because a non-release tag can't be versioned
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.am.run_app(self.good_app_id,
                                          None,
                                          tag=self.good_tag,
                                          version=">0.0.1"))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_missing_inputs(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.am.run_app(self.good_app_id,
                                          None,
                                          tag=self.good_tag))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_version(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.am.run_app(self.good_app_id,
                                          None,
                                          tag="dev",
                                          version="1.0.0"))

    def test_app_description(self):
        desc = self.am.app_description(self.good_app_id, tag=self.good_tag)
        self.assertIsInstance(desc, HTML)

    def test_app_description_bad_tag(self):
        with self.assertRaises(ValueError):
            self.am.app_description(self.good_app_id, tag=self.bad_tag)

    def test_app_description_bad_name(self):
        with self.assertRaises(ValueError):
            self.am.app_description(self.bad_app_id)

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
        os.environ['KB_WORKSPACE_ID'] = self.public_ws
        sm = SpecManager()
        spec = sm.get_spec(app_id, tag=tag)
        (params, ws_inputs) = self.am._validate_parameters(app_id,
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
        ws_name = self.public_ws
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
        mapped_inputs = self.am._map_inputs(
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
        rand_str = self.am._generate_input(generator)
        self.assertTrue(rand_str.startswith(prefix))
        self.assertTrue(rand_str.endswith(suffix))
        self.assertEqual(len(rand_str), len(prefix)+len(suffix)+num_symbols)

    def test_generate_input_bad(self):
        with self.assertRaises(ValueError):
            self.am._generate_input({'symbols': 'foo'})
        with self.assertRaises(ValueError):
            self.am._generate_input({'symbols': -1})

    def test_transform_input_good(self):
        ws_name = self.public_ws
        os.environ['KB_WORKSPACE_ID'] = ws_name
        test_data = [
            {
                'value': 'input_value',
                'type': 'ref',
                'expected': ws_name + '/' + 'input_value'
            },
            {
                'value': 'input_value',
                'type': 'unresolved-ref',
                'expected': ws_name + '/' + 'input_value'
            },
            {
                'value': 'rhodobacterium.art.q20.int.PE.reads',
                'type': 'resolved-ref',
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
                'value': ['a', 'b', 'c'],
                'type': 'list<ref>',
                'expected': [ws_name + '/a', ws_name + '/b', ws_name + '/c']
            },
            {
                'value': ['rhodobacterium.art.q20.int.PE.reads',
                          'rhodobacterium.art.q10.PE.reads'],
                'type': 'list<resolved-ref>',
                'expected': ['11635/9/1', '11635/10/1']
            },
            {
                'value': 'foo',
                'type': 'list<ref>',
                'expected': [ws_name + '/foo']
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
                'type': 'future-default',
                'spec': {'is_output': 0, 'allowed_types': ["Some.KnownType"]},
                'expected': '11635/9/1'
            }
        ]
        for test in test_data:
            spec = test.get('spec', None)
            ret = self.am._transform_input(test['type'], test['value'], spec)
            self.assertEqual(ret, test['expected'])
        del(os.environ['KB_WORKSPACE_ID'])

    def test_transform_input_bad(self):
        with self.assertRaises(ValueError):
            self.am._transform_input('foo', 'bar', None)

if __name__ == "__main__":
    unittest.main()
