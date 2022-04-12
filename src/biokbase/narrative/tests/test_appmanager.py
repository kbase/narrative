"""
Tests for the app manager.
"""
import unittest
from unittest import mock
from unittest.mock import MagicMock
from biokbase.narrative.jobs.specmanager import SpecManager
from biokbase.narrative.jobs.appmanager import AppManager, BATCH_APP
from biokbase.narrative.jobs.jobmanager import JobManager
from biokbase.narrative.jobs.jobcomm import MESSAGE_TYPE
import biokbase.narrative.app_util as app_util
from biokbase.narrative.jobs.job import Job
from IPython.display import HTML, Javascript
from .narrative_mock.mockclients import (
    get_mock_client,
    WSID_STANDARD,
)
import os
import sys
import io
import copy
from .util import ConfigTests
from biokbase.narrative.tests.job_test_constants import (
    CLIENTS,
    READS_OBJ_1,
    READS_OBJ_2,
)

CONFIG = ConfigTests()
WS_NAME = CONFIG.get("app_tests", "public_ws_name")
SEMANTIC_VER_ERROR = "Semantic versions only apply to released app modules."
TOKEN_ID = "ABCDE12345"
UNKNOWN_APP_ID = "Unknown app id"
READS_FILE_1 = "reads file 1"
READS_FILE_2 = "reads file 2"
NEW_READS_SET = "New Reads Set"

JOB_COMM_MOCK = "biokbase.narrative.jobs.appmanager.JobComm"
GET_AGENT_TOKEN = "biokbase.narrative.jobs.appmanager.auth.get_agent_token"
CLIENTS_AM = "biokbase.narrative.jobs.appmanager.clients.get"
CLIENTS_AM_SM = "biokbase.narrative.jobs.appmanager.specmanager.clients.get"
CLIENTS_SM = "biokbase.narrative.jobs.specmanager.clients.get"


with mock.patch(CLIENTS, get_mock_client):
    sm = SpecManager()
    sm.reload()
    TEST_SPECS = copy.deepcopy(sm.app_specs)


def get_method(tag, app_id):
    spec = copy.deepcopy(TEST_SPECS[tag][app_id])
    return (
        spec["behavior"]["kb_service_name"]
        + "."
        + spec["behavior"]["kb_service_method"]
    )


def mock_agent_token(*args, **kwargs):
    return dict({"user": "testuser", "id": TOKEN_ID, "token": "abcde"})


def get_timestamp():
    return "any old time"


def get_bulk_run_good_inputs():
    """This DS is meant to be mutated"""
    return [
        {
            "app_id": "kb_uploadmethods/import_fastq_sra_as_reads_from_staging",
            "tag": "release",
            "version": "1.0.46",
            "shared_params": {
                "import_type": "FASTQ/FASTA",
                "insert_size_mean": 0,
                "insert_size_std_dev": 0,
                "interleaved": 1,
                "read_orientation_outward": "0",
                "sequencing_tech": "Illumina",
                "single_genome": 1,
            },
            "params": [
                {
                    "fastq_fwd_staging_file_name": "file1.fastq",
                    "fastq_rev_staging_file_name": "file2.fastq",
                    "sra_staging_file_name": "",
                    "name": "reads_object_1",
                },
                {
                    "fastq_fwd_staging_file_name": "file2.fastq",
                    "fastq_rev_staging_file_name": "file3.fastq",
                    "sra_staging_file_name": "",
                    "name": "reads_object_2",
                },
            ],
        },
        {
            "app_id": "kb_uploadmethods/import_sra_as_reads_from_staging",
            "tag": "release",
            "version": "1.0.46",
            "shared_params": {
                "import_type": "SRA",
                "insert_size_mean": 1,
                "insert_size_std_dev": 1,
                "interleaved": "1",
                "read_orientation_outward": "0",
                "sequencing_tech": "Illumina",
                "single_genome": "1",
            },
            "params": [
                {
                    "name": "sra_reads_object",
                    "sra_staging_file_name": "reads.sra",
                }
            ],
        },
    ]


def iter_bulk_run_good_inputs_param_sets(spec_mapped=False):
    """
    Return generator of param_sets
    These test param_sets get spec mapped in am._build_run_job_params
    TODO are these tests hardcoded against the deployed app?
    """
    for app_info_el in get_bulk_run_good_inputs():
        shared_params = app_info_el["shared_params"]
        for param_set in app_info_el["params"]:
            param_set.update(shared_params)
            if spec_mapped:
                for k, v in param_set.items():
                    if v == "":
                        param_set[k] = None
                param_set["workspace_name"] = WS_NAME
            yield param_set


@mock.patch("biokbase.narrative.jobs.appmanager.timestamp", get_timestamp)
class AppManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None
        cls.am = AppManager()
        cls.am.reload()  # class uses non-mocked data
        cls.jm = JobManager()
        cls.good_app_id = CONFIG.get("app_tests", "good_app_id")
        cls.good_tag = CONFIG.get("app_tests", "good_app_tag")
        cls.bad_app_id = CONFIG.get("app_tests", "bad_app_id")
        cls.bad_tag = CONFIG.get("app_tests", "bad_app_tag")
        cls.test_app_id = CONFIG.get("app_tests", "test_app_id")
        cls.test_app_version = (
            "056582c691c4df190110b059600d2dc2a3a8b80a"  # where is this coming from?
        )
        cls.test_app_module_name = CONFIG.get("app_tests", "test_app_module_name")
        cls.test_app_method_name = CONFIG.get("app_tests", "test_app_method_name")
        cls.test_job_id = CONFIG.get("app_tests", "test_job_id")
        cls.test_tag = CONFIG.get("app_tests", "test_app_tag")
        cls.public_ws = CONFIG.get("app_tests", "public_ws_name")
        cls.ws_id = int(CONFIG.get("app_tests", "public_ws_id"))
        cls.app_input_ref = CONFIG.get("app_tests", "test_input_ref")
        cls.batch_app_id = CONFIG.get("app_tests", "batch_app_id")
        cls.test_viewer_app_id = CONFIG.get("app_tests", "test_viewer_app_id")
        cls.test_app_params = {
            "read_library_names": ["rhodo.art.jgi.reads"],
            "output_contigset_name": "rhodo_contigs",
            "recipe": "auto",
            "assembler": "",
            "pipeline": "",
            "min_contig_len": None,
        }

        cls.expected_app_params = {
            "read_library_refs": ["18836/5/1"],
            "output_contigset_name": "rhodo_contigs",
            "recipe": "auto",
            "assembler": None,
            "pipeline": None,
            "min_contig_len": None,
            "workspace_name": cls.public_ws,
        }

    def setUp(self):
        os.environ["KB_WORKSPACE_ID"] = self.public_ws
        self.jm._running_jobs = {}

    def tearDown(self):
        try:
            del os.environ["KB_WORKSPACE_ID"]
        except Exception:
            pass

    def run_app_expect_error(
        self, comm_mock, run_func, func_name, print_error, cell_id=None
    ):
        """
        A wrapper for various versions of run_app* that'll test and verify that errors get
        1. printed to stdout and
        2. sent over the (mocked) comm channel as expected
        The stdout prints and the comm channel responses are both side effects that get
        captured by re-routing stdout, and by capturing mock calls, respectively.

        If print_error is None, assume that there should be no output to stdout
        """
        output = io.StringIO()
        sys.stdout = output
        self.assertIsNone(run_func())
        sys.stdout = sys.__stdout__  # reset to normal
        output_str = output.getvalue()
        if print_error is not None and len(print_error):
            self.assertIn(
                f"Error while trying to start your app ({func_name})!", output_str
            )
            self.assertIn(print_error, output_str)
        else:
            self.assertEqual(
                "", output_str
            )  # if nothing gets written to a StringIO, getvalue returns an empty string
        self._verify_comm_error(comm_mock, cell_id=cell_id)

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

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_app__dry_run(self, auth, c):
        mock_comm = MagicMock()
        c.return_value.send_comm_message = mock_comm
        expected = {
            "method": self.test_app_id.replace("/", "."),
            "service_ver": self.test_app_version,
            "params": [self.expected_app_params],
            "app_id": self.test_app_id,
            "meta": {"tag": self.test_tag},
            "wsid": WSID_STANDARD,
        }
        output = self.am.run_app(
            self.test_app_id, self.test_app_params, tag=self.test_tag, dry_run=True
        )
        self.assertEqual(expected, output)
        self.assertEqual(mock_comm.call_count, 0)

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_app__good_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        new_job = self.am.run_app(
            self.test_app_id, self.test_app_params, tag=self.test_tag
        )
        self.assertIsInstance(new_job, Job)
        self.assertEqual(self.jm.get_job(self.test_job_id), new_job)
        self._verify_comm_success(c.return_value.send_comm_message, False)

        self.assertEqual(False, self.jm._running_jobs[new_job.job_id]["refresh"])

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_app__from_gui_cell(self, auth, c):
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
        self._verify_comm_success(
            c.return_value.send_comm_message, False, cell_id=cell_id
        )

    @mock.patch(JOB_COMM_MOCK)
    def test_run_app__bad_id(self, c):
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app(self.bad_app_id, None)

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app",
            f'Unknown app id "{self.bad_app_id}" tagged as "release"',
        )

    @mock.patch(JOB_COMM_MOCK)
    def test_run_app__bad_tag(self, c):
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app(self.good_app_id, None, tag=self.bad_tag)

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app",
            f"Can't find tag {self.bad_tag} - allowed tags are release, beta, dev",
        )

    @mock.patch(JOB_COMM_MOCK)
    def test_run_app__bad_version_match(self, c):
        # fails because a non-release tag can't be versioned
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_app(self.good_app_id, None, tag="dev", version="0.0.1")

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_app",
            SEMANTIC_VER_ERROR,
        )

    # Running an app with missing inputs is now allowed. The app can
    # crash if it wants to, it can leave its process behind.
    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_app__missing_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        self.assertIsNotNone(self.am.run_app(self.good_app_id, None, tag=self.good_tag))
        self._verify_comm_success(c.return_value.send_comm_message, False)

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    def test_run_app__print_error(self, c):
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock

        # should print an error if there is no cell id
        self.run_app_expect_error(
            comm_mock,
            lambda: self.am.run_app(
                self.bad_app_id, self.test_app_params, tag=self.test_tag
            ),
            "run_app",
            UNKNOWN_APP_ID,
        )

        comm_mock2 = MagicMock()
        c.return_value.send_comm_message = comm_mock2

        # should not print an error if there is a cell id
        cell_id = "some_app_cell"
        self.run_app_expect_error(
            comm_mock2,
            lambda: self.am.run_app(
                self.bad_app_id,
                self.test_app_params,
                tag=self.test_tag,
                cell_id=cell_id,
            ),
            "run_app",
            None,
            cell_id=cell_id,
        )

    ############# End tests for run_app #############

    ############# Test run_legacy_batch_app #############

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_legacy_batch_app__dry_run_good_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        params = [self.test_app_params, self.test_app_params]
        job_runner_inputs = self.am.run_legacy_batch_app(
            self.test_app_id,
            params,
            cell_id="abcdefghi",
            run_id="the_final_countdown",
            version=self.test_app_version,
            tag=self.test_tag,
            dry_run=True,
        )

        job_meta = {
            "batch_app": self.test_app_id,
            "batch_size": len(params),
            "batch_tag": self.test_tag,
            "cell_id": "abcdefghi",
            "run_id": "the_final_countdown",
            "tag": BATCH_APP["TAG"],
            "token_id": TOKEN_ID,
        }

        expected = {
            "app_id": BATCH_APP["APP_ID"],
            "meta": job_meta,
            "method": BATCH_APP["METHOD"],
            "params": [
                {
                    "batch_params": [
                        {
                            "params": [self.expected_app_params],
                            "source_ws_objects": [],
                        }
                        for _ in range(len(params))
                    ],
                    "meta": job_meta,
                    "method_name": self.test_app_method_name,
                    "module_name": self.test_app_module_name,
                    "service_ver": self.test_app_version,
                    "wsid": WSID_STANDARD,
                }
            ],
            "service_ver": BATCH_APP["VERSION"],
            "wsid": WSID_STANDARD,
        }

        self.assertEqual(job_runner_inputs, expected)

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_legacy_batch_app__good_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        params = [self.test_app_params, self.test_app_params]
        new_job = self.am.run_legacy_batch_app(
            self.test_app_id,
            params,
            version=self.test_app_version,
            tag=self.test_tag,
        )
        self.assertIsInstance(new_job, Job)
        self.assertEqual(self.jm.get_job(self.test_job_id), new_job)
        self._verify_comm_success(c.return_value.send_comm_message, False)

        self.assertEqual(False, self.jm._running_jobs[new_job.job_id]["refresh"])

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_legacy_batch_app__gui_cell(self, auth, c):
        cell_id = "12345"
        c.return_value.send_comm_message = MagicMock()
        self.assertIsNone(
            self.am.run_legacy_batch_app(
                self.test_app_id,
                [self.test_app_params, self.test_app_params],
                tag=self.test_tag,
                cell_id=cell_id,
            )
        )
        self._verify_comm_success(
            c.return_value.send_comm_message, False, cell_id=cell_id
        )

    @mock.patch(JOB_COMM_MOCK)
    def test_run_legacy_batch_app__bad_id(self, c):
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_legacy_batch_app(self.bad_app_id, None)

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_legacy_batch_app",
            f'Unknown app id "{self.bad_app_id}" tagged as "release"',
        )

    @mock.patch(JOB_COMM_MOCK)
    def test_run_legacy_batch_app__bad_tag(self, c):
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_legacy_batch_app(
                self.good_app_id, None, tag=self.bad_tag
            )

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_legacy_batch_app",
            f"Can't find tag {self.bad_tag} - allowed tags are release, beta, dev",
        )

    @mock.patch(JOB_COMM_MOCK)
    def test_run_legacy_batch_app__bad_version_match(self, c):
        # fails because a non-release tag can't be versioned
        c.return_value.send_comm_message = MagicMock()

        def run_func():
            return self.am.run_legacy_batch_app(
                self.good_app_id, None, tag="dev", version="0.0.1"
            )

        self.run_app_expect_error(
            c.return_value.send_comm_message,
            run_func,
            "run_legacy_batch_app",
            SEMANTIC_VER_ERROR,
        )

    # Running an app with missing inputs is now allowed. The app can
    # crash if it wants to, it can leave its process behind.
    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_legacy_batch_app__missing_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        self.assertIsNotNone(
            self.am.run_legacy_batch_app(self.good_app_id, None, tag=self.good_tag)
        )
        self._verify_comm_success(c.return_value.send_comm_message, False)

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    def test_run_legacy_batch_app__print_error(self, c):
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock

        # should print an error if there is no cell id
        self.run_app_expect_error(
            comm_mock,
            lambda: self.am.run_legacy_batch_app(
                self.bad_app_id, [self.test_app_params], tag=self.test_tag
            ),
            "run_legacy_batch_app",
            UNKNOWN_APP_ID,
        )

        comm_mock2 = MagicMock()
        c.return_value.send_comm_message = comm_mock2

        # should not print an error if there is a cell id
        cell_id = "some_batch_cell"
        self.run_app_expect_error(
            comm_mock2,
            lambda: self.am.run_legacy_batch_app(
                self.bad_app_id,
                [self.test_app_params],
                tag=self.test_tag,
                cell_id=cell_id,
            ),
            "run_legacy_batch_app",
            None,
            cell_id=cell_id,
        )

    ############# End tests for run_legacy_batch_app #############

    ############# Test run_local_app #############
    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
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

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_local_app_fail_cases(self, auth, c):
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock
        cases = [
            {
                "inputs": {"args": [self.bad_app_id, {}], "kwargs": {}},
                "expected_error": f'Unknown app id "{self.bad_app_id}" tagged as "release"',
            },
            {
                "inputs": {
                    "args": [self.test_viewer_app_id, {}],
                    "kwargs": {"tag": "dev"},
                },
                "expected_error": "Missing required parameters",
            },
            {
                "inputs": {
                    "args": [self.good_app_id, {}],
                    "kwargs": {"tag": self.bad_tag},
                },
                "expected_error": f"Can't find tag {self.bad_tag} - allowed tags are release, beta, dev",
            },
            {
                "inputs": {
                    "args": [self.good_app_id, {}],
                    "kwargs": {"tag": "dev", "version": "1.0.0"},
                },
                "expected_error": SEMANTIC_VER_ERROR,
            },
        ]
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

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    def test_run_local_app__print_error(self, c):
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock

        # should print an error if there is no cell id
        self.run_app_expect_error(
            comm_mock,
            lambda: self.am.run_local_app(
                self.bad_app_id, self.test_app_params, tag=self.test_tag
            ),
            "run_local_app",
            UNKNOWN_APP_ID,
        )

        comm_mock2 = MagicMock()
        c.return_value.send_comm_message = comm_mock2

        # should not print an error if there is a cell id
        cell_id = "some_local_app_cell"
        self.run_app_expect_error(
            comm_mock2,
            lambda: self.am.run_local_app(
                self.bad_app_id,
                self.test_app_params,
                tag=self.test_tag,
                cell_id=cell_id,
            ),
            "run_local_app",
            None,
            cell_id=cell_id,
        )

    ############# End tests for run_local_app #############

    ############# Test run_app_batch #############

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_app_batch__dry_run(self, auth, c):
        mock_comm = MagicMock()
        c.return_value.send_comm_message = mock_comm

        test_input = get_bulk_run_good_inputs()

        dry_run_results = self.am.run_app_batch(test_input, dry_run=True)
        batch_run_params = dry_run_results["batch_run_params"]
        batch_params = dry_run_results["batch_params"]

        expected_batch_run_keys = set(
            ["method", "service_ver", "params", "app_id", "meta"]
        )
        # expect only the above keys in each batch run params (note the missing wsid key)
        for param_set in batch_run_params:
            self.assertTrue(expected_batch_run_keys == set(param_set.keys()))
        self.assertEqual(["wsid"], list(batch_params.keys()))

        # expect shared_params to have been merged into respective param_sets
        for exp, outp in zip(
            iter_bulk_run_good_inputs_param_sets(spec_mapped=True), batch_run_params
        ):
            got = outp["params"][0]
            self.assertDictEqual({**got, **exp}, got)  # assert exp_params <= got_params

        def mod(param_set):
            for key, value in param_set.items():
                if value == "":
                    param_set[key] = None
            param_set["workspace_name"] = self.public_ws
            return param_set

        exp_batch_run_params = [
            {
                "method": get_method(test_input[i]["tag"], test_input[i]["app_id"]),
                "service_ver": test_input[i]["version"],
                "params": [mod(test_input[i]["params"][j])],
                "app_id": test_input[i]["app_id"],
                "meta": {"tag": test_input[i]["tag"]},
            }
            for i, j in [
                (0, 0),
                (0, 1),
                (1, 0),
            ]  # i is idx in test_input, j is idx of params
        ]
        exp_batch_params = {"wsid": WSID_STANDARD}

        self.assertEqual(exp_batch_run_params, batch_run_params)
        self.assertEqual(exp_batch_params, batch_params)

        self.assertEqual(mock_comm.call_count, 0)

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_app_batch__good_inputs(self, auth, c):
        c.return_value.send_comm_message = MagicMock()
        test_input = get_bulk_run_good_inputs()

        new_jobs = self.am.run_app_batch(test_input)
        self.assertIsInstance(new_jobs, dict)
        self.assertIn("parent_job", new_jobs)
        self.assertIn("child_jobs", new_jobs)
        self.assertTrue(new_jobs["parent_job"])
        parent_job = new_jobs["parent_job"]
        child_jobs = new_jobs["child_jobs"]
        self.assertIsInstance(parent_job, Job)
        self.assertIsInstance(child_jobs, list)
        self.assertEqual(len(child_jobs), 3)
        self.assertEqual(
            [job.job_id for job in child_jobs],
            [f"{self.test_job_id}_child_{i}" for i in range(len(child_jobs))],
        )
        self._verify_comm_success(c.return_value.send_comm_message, True, num_jobs=4)

        for job in [parent_job] + child_jobs:
            self.assertEqual(False, self.jm._running_jobs[job.job_id]["refresh"])

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    @mock.patch(
        GET_AGENT_TOKEN,
        side_effect=mock_agent_token,
    )
    def test_run_app_batch__from_gui_cell(self, auth, c):
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock
        cell_id = "a_cell_id"
        run_ids = [None, "a_run_id"]
        # test with / w/o run_id
        # should return None, fire a couple of messages
        for run_id in run_ids:
            self.assertIsNone(
                self.am.run_app_batch(
                    get_bulk_run_good_inputs(), cell_id=cell_id, run_id=run_id
                )
            )

            self._verify_comm_success(
                c.return_value.send_comm_message,
                True,
                num_jobs=4,
                cell_id=cell_id,
                run_id=run_id,
            )
            comm_mock.reset_mock()

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    def test_run_app_batch__bad_inputs(self, c):
        no_info_error = (
            "app_info must be a list with at least one set of app information"
        )
        missing_key_error = "app info must contain keys app_id, tag, params"
        bad_id_error = "an app_id must be of the format module_name/app_name"
        bad_params_error = "params must be a list of dicts of app parameters"
        bad_tag_error = "tag must be one of release, beta, dev, not "
        bad_version_error = "an app version must be a string, not "

        app_info_cases = [
            {  # tests for bad app_id keys, malformed or not strings
                "key": "app_id",
                "bad_values": ["module.app", "moduleapp", None],
                "error": bad_id_error,
            },
            {  # tests for bad params structure - empty list or not a list
                "key": "params",
                "bad_values": [{}, "nope", None, []],
                "error": bad_params_error,
            },
            {  # tests for bad tag key
                "key": "tag",
                "bad_values": [None, "bad", {}, []],
                "error": bad_tag_error,
            },
            {  # tests for bad version key
                "key": "version",
                "bad_values": [None, 123, {}, []],
                "error": bad_version_error,
            },
        ]
        cases = []
        for bad in [None, [], {}]:
            cases.append({"arg": bad, "expected_error": no_info_error})
        for bad_key in ["app_id", "tag", "params"]:
            app_info = get_bulk_run_good_inputs()
            del app_info[0][bad_key]
            cases.append({"arg": app_info, "expected_error": missing_key_error})
        for app_info_case in app_info_cases:
            for bad_value in app_info_case["bad_values"]:
                app_info = get_bulk_run_good_inputs()
                app_info[0][app_info_case["key"]] = bad_value
                cases.append(
                    {"arg": app_info, "expected_error": app_info_case["error"]}
                )
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock
        for test_case in cases:

            def run_func():
                return self.am.run_app_batch(test_case["arg"])

            comm_mock.reset_mock()
            self.run_app_expect_error(
                comm_mock,
                run_func,
                "run_app_batch",
                test_case["expected_error"],
            )

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    def test_run_app_batch__print_error(self, c):
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock

        test_case = get_bulk_run_good_inputs()
        test_case[0]["app_id"] = self.bad_app_id

        # should print an error if there is no cell id
        self.run_app_expect_error(
            comm_mock,
            lambda: self.am.run_app_batch(test_case),
            "run_app_batch",
            "an app_id must be of the format module_name/app_name",
        )

        comm_mock2 = MagicMock()
        c.return_value.send_comm_message = comm_mock2

        # should not print an error if there is a cell id
        cell_id = "some_cell_or_another"
        self.run_app_expect_error(
            comm_mock2,
            lambda: self.am.run_app_batch(test_case, cell_id=cell_id),
            "run_app_batch",
            None,
            cell_id=cell_id,
        )

    @mock.patch(CLIENTS_AM, get_mock_client)
    @mock.patch(JOB_COMM_MOCK)
    def test_bulk_app_no_wsid(self, c):
        del os.environ["KB_WORKSPACE_ID"]
        comm_mock = MagicMock()
        c.return_value.send_comm_message = comm_mock
        self.run_app_expect_error(
            comm_mock,
            lambda: self.am.run_app_batch(get_bulk_run_good_inputs()),
            "run_app_batch",
            'Unable to retrieve system variable: "workspace_id"',
        )

    ############# End tests for run_app_batch #############

    def test_reconstitute_shared_params(self):
        app_info_el = {
            "shared_params": {
                "shared_param_key0": "shared_param_val0",
                "shared_param_key1": "shared_param_val1",
            },
            "params": [
                {"param_key00": "param_val00", "param_key01": "param_val01"},
                {"param_key10": "param_val10", "param_key11": "param_val11"},
            ],
            "other_key": "other_val",
        }
        expected = {
            "params": [
                {
                    "param_key00": "param_val00",
                    "param_key01": "param_val01",
                    "shared_param_key0": "shared_param_val0",
                    "shared_param_key1": "shared_param_val1",
                },
                {
                    "param_key10": "param_val10",
                    "param_key11": "param_val11",
                    "shared_param_key0": "shared_param_val0",
                    "shared_param_key1": "shared_param_val1",
                },
            ],
            "other_key": "other_val",
        }

        # Merge shared_params into each params dict
        self.am._reconstitute_shared_params(app_info_el)
        self.assertEqual(expected, app_info_el)

        # No shared_params means no change
        self.am._reconstitute_shared_params(app_info_el)
        self.assertEqual(expected, app_info_el)

    @mock.patch(CLIENTS_AM_SM, get_mock_client)
    def test_app_description(self):
        desc = self.am.app_description(self.good_app_id, tag=self.good_tag)
        self.assertIsInstance(desc, HTML)

    @mock.patch(CLIENTS_AM_SM, get_mock_client)
    def test_app_description_bad_tag(self):
        with self.assertRaises(ValueError):
            self.am.app_description(self.good_app_id, tag=self.bad_tag)

    @mock.patch(CLIENTS_AM_SM, get_mock_client)
    def test_app_description_bad_name(self):
        with self.assertRaises(ValueError):
            self.am.app_description(self.bad_app_id)

    @mock.patch(CLIENTS_AM_SM, get_mock_client)
    @mock.patch(CLIENTS_SM, get_mock_client)
    def test_validate_params(self):
        inputs = {
            "reads_tuple": [
                {
                    "input_reads_label": READS_FILE_1,
                    "input_reads_obj": READS_OBJ_1,
                    "input_reads_metadata": {"key1": "value1"},
                },
                {
                    "input_reads_label": READS_FILE_2,
                    "input_reads_obj": READS_OBJ_2,
                    "input_reads_metadata": {"key2": "value2"},
                },
            ],
            "output_object": "MyReadsSet",
            "description": NEW_READS_SET,
        }
        app_id = "NarrativeTest/test_create_set"
        tag = "dev"
        spec = self.am.spec_manager.get_spec(app_id, tag=tag)
        spec_params = self.am.spec_manager.app_params(spec)
        (params, ws_inputs) = app_util.validate_parameters(
            app_id, tag, spec_params, inputs
        )
        self.assertDictEqual(params, inputs)
        self.assertIn("12345/8/1", ws_inputs)
        self.assertIn("12345/7/1", ws_inputs)

    @mock.patch(CLIENTS_AM_SM, get_mock_client)
    @mock.patch(CLIENTS_SM, get_mock_client)
    @mock.patch(CLIENTS, get_mock_client)
    def test_input_mapping(self):
        self.maxDiff = None
        inputs = {
            "reads_tuple": [
                {
                    "input_reads_label": READS_FILE_1,
                    "input_reads_obj": READS_OBJ_1,
                    "input_reads_metadata": {"key1": "value1"},
                },
                {
                    "input_reads_label": READS_FILE_2,
                    "input_reads_obj": READS_OBJ_2,
                    "input_reads_metadata": {"key2": "value2"},
                },
            ],
            "output_object": "MyReadsSet",
            "description": NEW_READS_SET,
        }
        app_id = "NarrativeTest/test_create_set"
        tag = "dev"
        ws_name = self.public_ws
        spec = self.am.spec_manager.get_spec(app_id, tag=tag)
        spec_params = self.am.spec_manager.app_params(spec)
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
                            "label": READS_FILE_1,
                            "metadata": {"key1": "value1"},
                            "ref": "12345/7/1",
                        },
                        {
                            "label": READS_FILE_2,
                            "metadata": {"key2": "value2"},
                            "ref": "12345/8/1",
                        },
                    ],
                    "description": NEW_READS_SET,
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

    @mock.patch(CLIENTS_AM_SM, get_mock_client)
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
                "value": READS_OBJ_1,
                "type": "resolved-ref",
                "expected": "11635/9/1",
            },
            {
                "value": ws_name + "/" + READS_OBJ_1,
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
                    READS_OBJ_1,
                    READS_OBJ_2,
                ],
                "type": "list<resolved-ref>",
                "expected": ["11635/9/1", "11635/10/1"],
            },
            {"value": "foo", "type": "list<ref>", "expected": [ws_name + "/foo"]},
            {"value": ["1", "2", 3], "type": "list<int>", "expected": [1, 2, 3]},
            {"value": "bar", "type": None, "expected": "bar"},
            {
                "value": READS_OBJ_1,
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

    def _transform_comm_messages(self, comm_mock):
        transformed_call_args_list = []
        for call in comm_mock.call_args_list:
            [msg_type, content] = call[0]
            transformed_call_args_list.append(
                {"msg_type": msg_type, "content": content}
            )
        return transformed_call_args_list

    def _verify_comm_error(self, comm_mock, cell_id=None, run_id=None) -> None:
        """
        Generates standard error messages and tests it against stored comm messages.
        """
        transformed_call_args_list = self._transform_comm_messages(comm_mock)
        expected_message = {
            "msg_type": MESSAGE_TYPE["RUN_STATUS"],
            "content": {
                "event": "error",
                "event_at": get_timestamp(),
                "error_code": -1,
                "error_source": "appmanager",
                "error_type": "ValueError",
            },
        }
        if run_id:
            expected_message["content"]["run_id"] = run_id
        if cell_id:
            expected_message["content"]["cell_id"] = cell_id

        for key in ["error_message", "error_stacktrace"]:
            self.assertTrue(key in transformed_call_args_list[0]["content"])
            del transformed_call_args_list[0]["content"][key]

        self.assertEqual(transformed_call_args_list, [expected_message])

    def _single_messages(self, cell_id=None, run_id=None):

        return [
            {
                "msg_type": MESSAGE_TYPE["RUN_STATUS"],
                "content": {
                    "event": "launched_job",
                    "event_at": get_timestamp(),
                    "cell_id": cell_id,
                    "run_id": run_id,
                    "job_id": self.test_job_id,
                },
            }
        ]

    def _bulk_messages(self, cell_id=None, run_id=None, num_jobs=1):

        child_ids = []
        n_child_jobs = num_jobs - 1
        for i in range(n_child_jobs):
            child_ids.append(self.test_job_id + f"_child_{i}")

        return [
            {
                "msg_type": MESSAGE_TYPE["RUN_STATUS"],
                "content": {
                    "event": "launched_job_batch",
                    "event_at": get_timestamp(),
                    "cell_id": cell_id,
                    "run_id": run_id,
                    "batch_id": self.test_job_id,
                    "child_job_ids": child_ids,
                },
            }
        ]

    def _verify_comm_success(
        self, comm_mock, is_bulk, num_jobs=1, cell_id=None, run_id=None
    ) -> None:
        transformed_call_args_list = self._transform_comm_messages(comm_mock)

        if is_bulk:
            expected = self._bulk_messages(cell_id, run_id, num_jobs)
        else:
            expected = self._single_messages(cell_id, run_id)

        self.assertEqual(transformed_call_args_list, expected)


if __name__ == "__main__":
    unittest.main()
