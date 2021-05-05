"""
Tests for the app manager.
"""
from biokbase.narrative.jobs.appmanager import AppManager
import biokbase.narrative.jobs.specmanager as specmanager
import biokbase.narrative.app_util as app_util
from biokbase.narrative.jobs.job import Job
from IPython.display import HTML, Javascript
import unittest
import mock
from mock import MagicMock
from .narrative_mock.mockclients import get_mock_client
import os
from .util import TestConfig
from typing import List
import sys
import io
import copy


def mock_agent_token(*args, **kwargs):
    return dict({"user": "testuser", "id": "12345", "token": "abcde"})


class AppManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config = TestConfig()
        cls.am = AppManager()
        cls.good_app_id = config.get("app_tests", "good_app_id")
        cls.good_tag = config.get("app_tests", "good_app_tag")
        cls.bad_app_id = config.get("app_tests", "bad_app_id")
        cls.bad_tag = config.get("app_tests", "bad_app_tag")
        cls.test_app_id = config.get("app_tests", "test_app_id")
        cls.test_viewer_app_id = config.get("app_tests", "test_viewer_app_id")
        cls.test_app_params = {
            "read_library_names": ["rhodo.art.jgi.reads"],
            "output_contigset_name": "rhodo_contigs",
            "recipe": "auto",
            "assembler": "",
            "pipeline": "",
            "min_contig_len": None,
        }
        cls.test_job_id = config.get("app_tests", "test_job_id")
        cls.test_tag = config.get("app_tests", "test_app_tag")
        cls.public_ws = config.get("app_tests", "public_ws_name")
        cls.ws_id = int(config.get("app_tests", "public_ws_id"))
        cls.app_input_ref = config.get("app_tests", "test_input_ref")
        cls.batch_app_id = config.get("app_tests", "batch_app_id")
        cls.bulk_run_good_inputs = [
            {
                "app_id": "kb_uploadmethods/import_fastq_sra_as_reads_from_staging",
                "tag": "release",
                "version": "1.0.46",
                "params": [
                    {
                        "fastq_fwd_staging_file_name": "file1.fastq",
                        "fastq_rev_staging_file_name": "",
                        "sra_staging_file_name": "",
                        "name": "reads_object_1",
                        "import_type": "FASTQ/FASTA",
                        "insert_size_mean": 0,
                        "insert_size_std_dev": 0,
                        "interleaved": 1,
                        "read_orientation_outward": "0",
                        "sequencing_tech": "Illumina",
                        "single_genome": 1,
                    },
                    {
                        "fastq_fwd_staging_file_name": "file2.fastq",
                        "fastq_rev_staging_file_name": "",
                        "sra_staging_file_name": "",
                        "name": "reads_object_2",
                        "import_type": "FASTQ/FASTA",
                        "insert_size_mean": 0,
                        "insert_size_std_dev": 0,
                        "interleaved": 1,
                        "read_orientation_outward": "0",
                        "sequencing_tech": "Illumina",
                        "single_genome": 1,
                    }
                ],
            },
            {
                "app_id": "kb_uploadmethods/import_sra_as_reads_from_staging",
                "tag": "release",
                "version": "1.0.46",
                "params": [
                    {
                        "sra_staging_file_name": "reads.sra",
                        "name": "sra_reads_object",
                        "insert_size_mean": 1,
                        "insert_size_std_dev": 1,
                        "read_orientation_outward": "0",
                        "sequencing_tech": "Illumina",
                        "single_genome": "1",
                    }
                ],
            },
        ]

    def setUp(self):
        os.environ["KB_WORKSPACE_ID"] = self.public_ws

    def tearDown(self):
        try:
            del os.environ["KB_WORKSPACE_ID"]
        except:
            pass

    def run_app_expect_error(self, comm_mock, run_func, func_name, print_error):
        """
        A wrapper for various versions of run_app* that'll test and verify that errors get
        1. printed to stdout and
        2. sent over the (mocked) comm channel as expected
        The stdout prints and the comm channel responses are both side effects that get
        captured by re-routing stdout, and by capturing mock calls, respectively.
        """
        output = io.StringIO()
        sys.stdout = output
        self.assertIsNone(run_func())
        sys.stdout = sys.__stdout__
        output_str = output.getvalue()
        self.assertIn(
            f"Error while trying to start your app ({func_name})!", output_str
        )
        self.assertIn(print_error, output_str)
        self._verify_comm_error(comm_mock)

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

    ############# Testing run_app #############

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_dry_run(self, auth, c):
        mock_comm = MagicMock()
        c.return_value.send_comm_message = mock_comm
        output = self.am.run_app(
            self.test_app_id, self.test_app_params, tag=self.test_tag, dry_run=True
        )
        self.assertIsInstance(output, dict)
        self.assertEqual(output["app_id"], self.test_app_id)
        self.assertIsInstance(output["params"], list)
        self.assertIn("method", output)
        self.assertIn("service_ver", output)
        self.assertIn("meta", output)
        self.assertIn("tag", output["meta"])
        self.assertIn("wsid", output)
        self.assertEqual(mock_comm.call_count, 0)

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_good_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        new_job = self.am.run_app(
            self.test_app_id, self.test_app_params, tag=self.test_tag
        )
        self.assertIsInstance(new_job, Job)
        self.assertEqual(new_job.job_id, self.test_job_id)
        self.assertEqual(new_job.app_id, self.test_app_id)
        self.assertEqual(new_job.tag, self.test_tag)
        self.assertIsNone(new_job.cell_id)
        self._verify_comm_success(c.return_value.send_comm_message, False)

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_from_gui_cell(self, auth, c):
        cell_id = "12345"
        c.return_value.send_comm_message = MagicMock()
        self.assertIsNone(
            self.am.run_app(
                self.test_app_id,
                self.test_app_params,
                tag=self.test_tag,
                cell_id=cell_id,
            )
        )
        self._verify_comm_success(c.return_value.send_comm_message, False, cell_id=cell_id)

    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    def test_run_app_bad_id(self, c):
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app(self.bad_app_id, None)

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app",
            f'Unknown app id "{self.bad_app_id}" tagged as "release"',
        )

    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    def test_run_app_bad_tag(self, c):
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app(self.good_app_id, None, tag=self.bad_tag)

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app",
            f"Can't find tag {self.bad_tag} - allowed tags are release, beta, dev",
        )

    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    def test_run_app_bad_version_match(self, c):
        # fails because a non-release tag can't be versioned
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app(self.good_app_id, None, tag="dev", version="0.0.1")

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app",
            "Semantic versions only apply to released app modules.",
        )

    # Running an app with missing inputs is now allowed. The app can
    # crash if it wants to, it can leave its process behind.
    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_missing_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        self.assertIsNotNone(self.am.run_app(self.good_app_id, None, tag=self.good_tag))
        self._verify_comm_success(c.return_value.send_comm_message, False)

    ############# End tests for run_app #############

    ############# Test run_app_batch #############

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_batch_good_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        new_job = self.am.run_app_batch(
            self.test_app_id,
            [self.test_app_params, self.test_app_params],
            tag=self.test_tag,
        )
        self.assertIsInstance(new_job, Job)
        self.assertEqual(new_job.job_id, self.test_job_id)
        self.assertEqual(new_job.app_id, self.batch_app_id)
        self.assertEqual(new_job.tag, self.test_tag)
        self.assertIsNone(new_job.cell_id)
        self._verify_comm_success(c.return_value.send_comm_message, False)

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_batch_gui_cell(self, auth, c):
        cell_id = "12345"
        c.return_value.send_comm_message = MagicMock()
        self.assertIsNone(
            self.am.run_app_batch(
                self.test_app_id,
                [self.test_app_params, self.test_app_params],
                tag=self.test_tag,
                cell_id=cell_id,
            )
        )
        self._verify_comm_success(c.return_value.send_comm_message, False, cell_id=cell_id)

    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    def test_run_app_batch_bad_id(self, c):
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app_batch(self.bad_app_id, None)

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app_batch",
            f'Unknown app id "{self.bad_app_id}" tagged as "release"',
        )

    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    def test_run_app_batch_bad_tag(self, c):
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app_batch(self.good_app_id, None, tag=self.bad_tag)

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app_batch",
            f"Can't find tag {self.bad_tag} - allowed tags are release, beta, dev",
        )

    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    def test_run_app_batch_bad_version_match(self, c):
        # fails because a non-release tag can't be versioned
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app_batch(
                self.good_app_id, None, tag="dev", version="0.0.1"
            )

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app_batch",
            "Semantic versions only apply to released app modules.",
        )

    # Running an app with missing inputs is now allowed. The app can
    # crash if it wants to, it can leave its process behind.
    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_batch_missing_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        self.assertIsNotNone(
            self.am.run_app_batch(self.good_app_id, None, tag=self.good_tag)
        )
        self._verify_comm_success(c.return_value.send_comm_message, False)

    ############# End tests for run_app_batch #############

    ############# Test run_local_app #############
    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_local_app_ok(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        result = self.am.run_local_app(
            self.test_viewer_app_id,
            {"param0": "fakegenome"},
            tag="release",
        )
        self.assertIsInstance(result, Javascript)
        self.assertIn("KBaseNarrativeOutputCell", result.data)

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_local_app_fail_cases(self, auth, c):
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock
        cases = [{
            "inputs": {
                "args": [self.bad_app_id, {}],
                "kwargs": {}
            },
            "expected_error": f'Unknown app id "{self.bad_app_id}" tagged as "release"',
        }, {
            "inputs": {
                "args": [self.test_viewer_app_id, {}],
                "kwargs": {"tag": "dev"}
            },
            "expected_error": "Missing required parameters"
        }, {
            "inputs": {
                "args": [self.good_app_id, {}],
                "kwargs": {"tag": self.bad_tag}
            },
            "expected_error": f"Can't find tag {self.bad_tag} - allowed tags are release, beta, dev"
        }, {
            "inputs": {
                "args": [self.good_app_id, {}],
                "kwargs": {"tag": "dev", "version": "1.0.0"}
            },
            "expected_error": "Semantic versions only apply to released app modules.",
        }]
        for test_case in cases:
            inputs = test_case["inputs"]
            def run_func():
                return self.am.run_local_app(*inputs["args"], **inputs["kwargs"])
            comm_mock.reset_mock()
            self.run_app_expect_error(
                comm_mock,
                run_func,
                "run_local_app",
                test_case["expected_error"],
            )

    ############# End tests for run_local_app #############

    ############# Test run_app_bulk #############

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_bulk_good_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        new_jobs = self.am.run_app_bulk(self.bulk_run_good_inputs)
        self.assertIsInstance(new_jobs, dict)
        self.assertIn("parent_job", new_jobs)
        self.assertIsInstance(new_jobs["parent_job"], Job)
        self.assertIn("child_jobs", new_jobs)
        self.assertIsInstance(new_jobs["child_jobs"], list)
        self.assertEqual(len(new_jobs["child_jobs"]), 3)
        for child in new_jobs["child_jobs"]:
            self.assertIsInstance(child, Job)
        self._verify_comm_success(c.return_value.send_comm_message, True, num_jobs=4)

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_bulk_from_gui_cell(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        cell_id = "a_cell_id"
        run_id = "a_run_id"
        # test with / w/o run_id
        # should return None, fire a couple of messages
        self.assertIsNone(self.am.run_app_bulk(self.bulk_run_good_inputs, cell_id=cell_id))
        self._verify_comm_success(c.return_value.send_comm_message, True, num_jobs=4, cell_id=cell_id)

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    @mock.patch(
        "biokbase.narrative.jobs.appmanager.auth.get_agent_token",
        side_effect=mock_agent_token,
    )
    def test_run_app_bulk_dry_run(self, auth, c):
        mock_comm = MagicMock()
        c.return_value.send_comm_message = mock_comm
        new_job = self.am.run_app_bulk(self.bulk_run_good_inputs, dry_run=True)
        self.assertIsInstance(new_job, dict)
        self.assertEqual(mock_comm.call_count, 0)

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    def test_run_app_bulk_bad_inputs(self, c):
        no_info_error = "app_info must be a list with at least one set of app information"
        missing_key_error = "app info must contain keys app_id, tag, params"
        bad_id_error = "an app_id must be of the format module_name/app_name"
        bad_params_error = "params must be a list of dicts of app parameters"
        bad_tag_error = "tag must be one of release, beta, dev, not "
        bad_version_error = "an app version must be a string, not "

        app_info_cases = [{ # tests for bad app_id keys, malformed or not strings
            "key": "app_id",
            "bad_values": ["module.app", "moduleapp", None],
            "error": bad_id_error
        }, { # tests for bad params structure - empty list or not a list
            "key": "params",
            "bad_values": [{}, "nope", None, []],
            "error": bad_params_error
        }, { # tests for bad tag key
            "key": "tag",
            "bad_values": [None, "bad", {}, []],
            "error": bad_tag_error
        }, { # tests for bad version key
            "key": "version",
            "bad_values": [None, 123, {}, []],
            "error": bad_version_error
        }]
        cases = list()
        for bad in [None, [], {}]:
            cases.append({
                "arg": bad,
                "expected_error": no_info_error
            })
        for bad_key in ["app_id", "tag", "params"]:
            app_info = copy.deepcopy(self.bulk_run_good_inputs)
            del app_info[0][bad_key]
            cases.append({
                "arg": app_info,
                "expected_error": missing_key_error
            })
        for app_info_case in app_info_cases:
            for bad_value in app_info_case["bad_values"]:
                app_info = copy.deepcopy(self.bulk_run_good_inputs)
                app_info[0][app_info_case["key"]] = bad_value
                cases.append({
                    "arg": app_info,
                    "expected_error": app_info_case["error"]
                })
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock
        for test_case in cases:
            def run_func():
                return self.am.run_app_bulk(test_case["arg"])
            comm_mock.reset_mock()
            self.run_app_expect_error(
                comm_mock,
                run_func,
                "run_app_bulk",
                test_case["expected_error"],
            )

    @mock.patch("biokbase.narrative.jobs.appmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.jobs.appmanager.JobComm")
    def test_bulk_app_no_wsid(self, c):
        del os.environ["KB_WORKSPACE_ID"]
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock
        self.run_app_expect_error(
            comm_mock,
            lambda: self.am.run_app_bulk(self.bulk_run_good_inputs),
            "run_app_bulk",
            'Unable to retrieve system variable: "workspace_id"'
        )

    ############# End tests for run_app_bulk #############

    @mock.patch(
        "biokbase.narrative.jobs.appmanager.specmanager.clients.get", get_mock_client
    )
    def test_app_description(self):
        desc = self.am.app_description(self.good_app_id, tag=self.good_tag)
        self.assertIsInstance(desc, HTML)

    @mock.patch(
        "biokbase.narrative.jobs.appmanager.specmanager.clients.get", get_mock_client
    )
    def test_app_description_bad_tag(self):
        with self.assertRaises(ValueError):
            self.am.app_description(self.good_app_id, tag=self.bad_tag)

    @mock.patch(
        "biokbase.narrative.jobs.appmanager.specmanager.clients.get", get_mock_client
    )
    def test_app_description_bad_name(self):
        with self.assertRaises(ValueError):
            self.am.app_description(self.bad_app_id)

    @mock.patch(
        "biokbase.narrative.jobs.appmanager.specmanager.clients.get", get_mock_client
    )
    @mock.patch("biokbase.narrative.jobs.specmanager.clients.get", get_mock_client)
    def test_validate_params(self):
        inputs = {
            "reads_tuple": [
                {
                    "input_reads_label": "reads file 1",
                    "input_reads_obj": "rhodobacterium.art.q20.int.PE.reads",
                    "input_reads_metadata": {"key1": "value1"},
                },
                {
                    "input_reads_label": "reads file 2",
                    "input_reads_obj": "rhodobacterium.art.q10.PE.reads",
                    "input_reads_metadata": {"key2": "value2"},
                },
            ],
            "output_object": "MyReadsSet",
            "description": "New Reads Set",
        }
        app_id = "NarrativeTest/test_create_set"
        tag = "dev"
        sm = specmanager.SpecManager()
        spec = sm.get_spec(app_id, tag=tag)
        (params, ws_inputs) = app_util.validate_parameters(
            app_id, tag, sm.app_params(spec), inputs
        )
        self.assertDictEqual(params, inputs)
        self.assertIn("12345/8/1", ws_inputs)
        self.assertIn("12345/7/1", ws_inputs)

    @mock.patch(
        "biokbase.narrative.jobs.appmanager.specmanager.clients.get", get_mock_client
    )
    @mock.patch("biokbase.narrative.jobs.specmanager.clients.get", get_mock_client)
    @mock.patch("biokbase.narrative.clients.get", get_mock_client)
    def test_input_mapping(self):
        self.maxDiff = None
        inputs = {
            "reads_tuple": [
                {
                    "input_reads_label": "reads file 1",
                    "input_reads_obj": "rhodobacterium.art.q20.int.PE.reads",
                    "input_reads_metadata": {"key1": "value1"},
                },
                {
                    "input_reads_label": "reads file 2",
                    "input_reads_obj": "rhodobacterium.art.q10.PE.reads",
                    "input_reads_metadata": {"key2": "value2"},
                },
            ],
            "output_object": "MyReadsSet",
            "description": "New Reads Set",
        }
        app_id = "NarrativeTest/test_create_set"
        tag = "dev"
        ws_name = self.public_ws
        sm = specmanager.SpecManager()
        spec = sm.get_spec(app_id, tag=tag)
        spec_params = sm.app_params(spec)
        spec_params_map = dict(
            (spec_params[i]["id"], spec_params[i]) for i in range(len(spec_params))
        )
        mapped_inputs = self.am._map_inputs(
            spec["behavior"]["kb_service_input_mapping"], inputs, spec_params_map
        )
        expected = [
            {
                "output_object_name": "MyReadsSet",
                "data": {
                    "items": [
                        {
                            "label": "reads file 1",
                            "metadata": {"key1": "value1"},
                            "ref": "12345/7/1",
                        },
                        {
                            "label": "reads file 2",
                            "metadata": {"key2": "value2"},
                            "ref": "12345/8/1",
                        },
                    ],
                    "description": "New Reads Set",
                },
                "workspace": ws_name,
            }
        ]
        self.assertDictEqual(expected[0], mapped_inputs[0])
        ref_path = (
            ws_name + "/MyReadsSet; " + ws_name + "/rhodobacterium.art.q10.PE.reads"
        )
        ret = app_util.transform_param_value("resolved-ref", ref_path, None)
        self.assertEqual(ret, ws_name + "/MyReadsSet;18836/5/1")

    @mock.patch(
        "biokbase.narrative.jobs.appmanager.specmanager.clients.get", get_mock_client
    )
    def test_generate_input(self):
        prefix = "pre"
        suffix = "suf"
        num_symbols = 8
        generator = {"symbols": num_symbols, "prefix": prefix, "suffix": suffix}
        rand_str = self.am._generate_input(generator)
        self.assertTrue(rand_str.startswith(prefix))
        self.assertTrue(rand_str.endswith(suffix))
        self.assertEqual(len(rand_str), len(prefix) + len(suffix) + num_symbols)

    def test_generate_input_bad(self):
        with self.assertRaises(ValueError):
            self.am._generate_input({"symbols": "foo"})
        with self.assertRaises(ValueError):
            self.am._generate_input({"symbols": -1})

    def test_transform_input_good(self):
        ws_name = self.public_ws
        test_data = [
            {
                "value": "input_value",
                "type": "ref",
                "expected": ws_name + "/" + "input_value",
            },
            {
                "value": ws_name + "/input_value",
                "type": "ref",
                "expected": ws_name + "/" + "input_value",
            },
            {
                "value": "input_value",
                "type": "unresolved-ref",
                "expected": ws_name + "/" + "input_value",
            },
            {
                "value": "rhodobacterium.art.q20.int.PE.reads",
                "type": "resolved-ref",
                "expected": "11635/9/1",
            },
            {
                "value": ws_name + "/rhodobacterium.art.q20.int.PE.reads",
                "type": "resolved-ref",
                "expected": "11635/9/1",
            },
            {"value": None, "type": "int", "expected": None},
            {"value": "5", "type": "int", "expected": 5},
            {
                "value": ["a", "b", "c"],
                "type": "list<ref>",
                "expected": [ws_name + "/a", ws_name + "/b", ws_name + "/c"],
            },
            {
                "value": [
                    "rhodobacterium.art.q20.int.PE.reads",
                    "rhodobacterium.art.q10.PE.reads",
                ],
                "type": "list<resolved-ref>",
                "expected": ["11635/9/1", "11635/10/1"],
            },
            {"value": "foo", "type": "list<ref>", "expected": [ws_name + "/foo"]},
            {"value": ["1", "2", 3], "type": "list<int>", "expected": [1, 2, 3]},
            {"value": "bar", "type": None, "expected": "bar"},
            {
                "value": "rhodobacterium.art.q20.int.PE.reads",
                "type": "future-default",
                "spec": {"is_output": 0, "allowed_types": ["Some.KnownType"]},
                "expected": "11635/9/1",
            },
            {"value": [123, 456], "type": None, "expected": [123, 456]},
            {"value": 123, "type": "string", "expected": "123"},
            {
                "value": ["one", "two"],
                "type": None,
                "spec": {"type": "textsubdata"},
                "expected": "one,two",
            },
            {
                "value": ["one", "two"],
                "type": "list<string>",
                "spec": {"type": "textsubdata"},
                "expected": ["one", "two"],
            },
            {"value": {"one": 1}, "type": "string", "expected": "one=1"},
        ]
        for test in test_data:
            spec = test.get("spec", None)
            ret = app_util.transform_param_value(test["type"], test["value"], spec)
            self.assertEqual(ret, test["expected"])

    def test_transform_input_bad(self):
        with self.assertRaises(ValueError):
            app_util.transform_param_value("foo", "bar", None)

    def _verify_comm_mock(
        self,
        send_comm_mock: MagicMock,
        num_calls: int,
        expected_messages: List[str] = None,
        expected_keys: List[List[str]] = None,
        expected_values: List[List[dict]] = None,
    ) -> None:
        """
        Validates the usage of the MagicMock used instead of sending a comm message to the
        front end. This is expected to mock any calls to JobComm.mock_comm_channel. Each of
        the "expected_*" kwargs are given as a list - each element represents which time the
        call was made, in order.

        This is done through a series of asserts. If they all pass and None is returned, then
        the mock was used as expected.

        num_calls - the number of times the call was expected (>= 0)
        expected_messages - the send message types
        expected_keys - the list of keys used in each message (may not all be given inspected
          values, but all should be present)
        expected_values - the set of values used in each message (there may be more keys, but
          these are known key-value pairs)
        """
        self.assertEqual(send_comm_mock.call_count, num_calls)
        for i in range(num_calls):
            [message_name, message_dict] = send_comm_mock.call_args_list[i][0]
            if expected_messages is not None:
                self.assertEqual(message_name, expected_messages[i])
            if expected_keys is not None:
                for key in expected_keys[i]:
                    self.assertIn(key, message_dict)
            if expected_values is not None:
                for key in expected_values[i]:
                    self.assertEqual(message_dict.get(key), expected_values[i][key])

    def _verify_comm_error(self, comm_mock, cell_id=None, run_id=None) -> None:
        """
        a wrapper around self._verify_comm_mock that just looks for the error message, and
        ONLY the error message, to have been sent, so we can make these tests a little more
        DRY.

        This is really for app running cases that are expected to fail before trying to start
        the app with EE2. Other cases should run _verify_comm_mock directly.
        """
        expected_keys = [
            [
                "event",
                "event_at",
                "error_message",
                "error_code",
                "error_source",
                "error_stacktrace",
                "error_type",
            ]
        ]
        expected_values = [
            {
                "run_id": run_id,
                "cell_id": cell_id,
                "event": "error",
                "error_code": -1,
                "error_source": "appmanager",
            }
        ]
        self._verify_comm_mock(
            comm_mock,
            1,
            expected_messages=["run_status"],
            expected_keys=expected_keys,
            expected_values=expected_values,
        )

    def _verify_comm_success(self, comm_mock, is_batch, num_jobs=1, cell_id=None, run_id=None) -> None:
        expected_messages = ["run_status"]
        expected_keys = [
            ["event", "event_at", "cell_id", "run_id"],
        ]
        event = "launched_job_batch" if is_batch else "launched_job"
        expected_values = [
            {
                "event": event,
                "cell_id": cell_id,
                "run_id": run_id,
            },
        ]
        if is_batch:
            expected_keys[0].append("parent_job_id")
            expected_keys[0].append("child_job_ids")
            expected_values[0]["parent_job_id"] = self.test_job_id
        else:
            expected_keys[0].append("job_id")
            expected_values[0]["job_id"] = self.test_job_id
        for i in range(num_jobs):
            expected_messages.append("new_job")
            expected_keys.append(["job_id"])
            expected_values.append({"job_id": self.test_job_id})
        self._verify_comm_mock(
            comm_mock,
            1 + num_jobs,
            expected_messages=expected_messages,
            expected_keys=expected_keys,
            expected_values=expected_values,
        )


if __name__ == "__main__":
    unittest.main()
