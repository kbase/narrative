"""
Tests for the app manager.
"""
from biokbase.narrative.jobs.appmanager import AppManager
from IPython.display import HTML
import unittest
import mock
from traitlets import Instance
import os

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
        with self.assertRaises(ValueError) as err:
            self.mm.app_usage(self.bad_app_id)

        # bad tag
        with self.assertRaises(ValueError) as err:
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
        with self.assertRaises(ValueError) as err:
            self.mm.available_apps(self.bad_tag)

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_good_inputs(self, m):
        m.return_value._send_comm_message.return_value = None
        pass
        # self.assertFalse("TODO: this test and code with mocking")

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_id(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.mm.run_app(self.bad_app_id, None))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_tag(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.mm.run_app(self.good_app_id, None, tag=self.bad_tag))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_bad_version_match(self, m):
        # fails because a non-release tag can't be versioned
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.mm.run_app(self.good_app_id, None, tag=self.good_tag, version=">0.0.1"))

    @mock.patch('biokbase.narrative.jobs.appmanager.JobManager')
    def test_run_app_missing_inputs(self, m):
        m.return_value._send_comm_message.return_value = None
        self.assertIsNone(self.mm.run_app(self.good_app_id, None, tag=self.good_tag))

    def test_app_description(self):
        desc = self.mm.app_description(self.good_app_id, tag=self.good_tag)
        self.assertIsInstance(desc, HTML)

    def test_app_description_bad_tag(self):
        with self.assertRaises(ValueError) as err:
            self.mm.app_description(self.good_app_id, tag=self.bad_tag)

    def test_app_description_bad_name(self):
        with self.assertRaises(ValueError) as err:
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
        os.environ['KB_WORKSPACE_ID'] = 'wjriehl:1475006266615'
        from biokbase.narrative.jobs.specmanager import SpecManager
        sm = SpecManager()
        spec = sm.get_spec(app_id, tag=tag)
        (params, ws_inputs) = self.mm._validate_parameters(app_id, tag, sm.app_params(spec), inputs)
        self.assertDictEqual(params, inputs)
        self.assertIn('11635/9/1', ws_inputs)
        self.assertIn('11635/10/1', ws_inputs)

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
        from biokbase.narrative.jobs.specmanager import SpecManager
        sm = SpecManager()
        spec = sm.get_spec(app_id, tag=tag)
        spec_params = sm.app_params(spec)
        spec_params_map = dict((spec_params[i]['id'],spec_params[i]) for i in range(len(spec_params)))
        mapped_inputs = self.mm._map_inputs(spec['behavior']['kb_service_input_mapping'], inputs, spec_params_map)
        expected = [{
            u'output_object_name': 'MyReadsSet',
            u'set_data': [{
                u'label': 'reads file 1',
                u'metadata': {'key1': 'value1'},
                u'obj': 'rhodobacterium.art.q20.int.PE.reads'
            }, {
                u'label': 'reads file 2',
                u'metadata': {'key2': 'value2'},
                u'obj': 'rhodobacterium.art.q10.PE.reads'
            }],
            u'workspace': None
        }]
        self.assertListEqual(expected, mapped_inputs)


if __name__ == "__main__":
    unittest.main()
