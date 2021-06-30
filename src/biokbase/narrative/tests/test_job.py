import unittest
import mock
from biokbase.narrative.jobs.job import Job, EXTRA_JOB_STATE_FIELDS
from .util import ConfigTests
from .narrative_mock.mockclients import (
    get_mock_client,
    get_failing_mock_client,
    MockClients,
    assert_obj_method_called
)
from contextlib import contextmanager
from io import StringIO
import sys

# job_info = job_state.get("job_input", {})
# job_meta = job_info.get("narrative_cell_info", {})

# return Job.from_state(
#     job_id,  # the id
#     job_info.get("app_id"), # the app ID
#     job_info,  # params, etc.
#     job_state.get("user"),  # owner id
#     cell_id=job_meta.get("cell_id", None),
#     meta=job_meta,
#     parent_job_id=job_info.get("parent_job_id", None),
#     run_id=job_meta.get("run_id", None),
#     tag=job_meta.get("tag", "release"),
#     token_id=job_meta.get("token_id", None),
# )


@contextmanager
def capture_stdout():
    new_out, new_err = StringIO(), StringIO()
    old_out, old_err = sys.stdout, sys.stderr
    try:
        sys.stdout, sys.stderr = new_out, new_err
        yield sys.stdout, sys.stderr
    finally:
        sys.stdout, sys.stderr = old_out, old_err


config = ConfigTests()
test_jobs = config.load_json_file(config.get("jobs", "ee2_job_info_file"))

ALL_JOB_ATTRS = [
    "job_id",
    "app_id",
    "inputs",
    "owner",
    "app_version",
    "batch_id",
    "cell_id",
    "meta",
    "parent_job_id",
    "run_id",
    "tag",
    "token_id",
]

# test_jobs contains jobs in the following states
JOB_COMPLETED = "5d64935ab215ad4128de94d6"
JOB_CREATED = "5d64935cb215ad4128de94d7"
JOB_RUNNING = "5d64935cb215ad4128de94d8"
JOB_TERMINATED = "5d64935cb215ad4128de94d9"


# {'user': 'ialarmedalien',
#  'authstrat': 'kbaseworkspace',
#  'wsid': 62425,
#  'status': 'running',
#  'updated': 1624750813682,
#  'queued': 1624750803639,
#  'running': 1624750813679,
#  'batch_job': False,
#  'job_input': {'wsid': 62425,
#   'method': 'kb_uploadmethods.import_reads_from_staging',
#   'params': [{'workspace_name': 'ialarmedalien:narrative_1623776017922',
#     'import_type': 'FASTQ/FASTA',
#     'fastq_fwd_staging_file_name': 'small.forward.fq',
#     'sequencing_tech': 'Illumina',
#     'name': 'small.forward.fq',
#     'single_genome': 1,
#     'interleaved': '1',
#     'insert_size_mean': None,
#     'insert_size_std_dev': None,
#     'read_orientation_outward': 0}],
#   'service_ver': '72eab31ed0b068fbe659973256c36aa40786964b',
#   'app_id': 'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging',
#   'source_ws_objects': [],
#   'parent_job_id': '60d7bad3bc25fe6d0f133c7e',
#   'requirements': {'clientgroup': 'kb_upload',
#    'cpu': 2,
#    'memory': 4500,
#    'disk': 50},
#   'narrative_cell_info': {'run_id': 'de4b15eb-a1c9-4a77-a697-de0ed13a6a53',
#    'token_id': 'bf1a6ae7-d52d-47d9-976a-71e5fb88e08f',
#    'tag': 'release',
#    'cell_id': 'c8f3845c-3e34-412c-a1b2-e465f12ce9f4'}},
#  'child_jobs': [],
#  'retry_ids': [],
#  'retry_saved_toggle': False,
#  'retry_count': 0,
#  'job_id': '60d7bad3bc25fe6d0f133c7f',
#  'parent_job_id': '60d7bad3bc25fe6d0f133c7e',
#  'created': 1624750803000}
# mapping check_job data to job object:

def transform_job(output):
    job_input = output.get("job_input")
    mapping = {
        "app_id": job_input.get("app_id"),
        "app_version": job_input.get("service_ver", None),
        "batch_id": output.get("batch_id", None),
        "cell_id": job_input.get("narrative_cell_info", {}).get("cell_id", None),
        "inputs": job_input,
        "job_id": output.get("job_id"),
        "meta": dict(),
        "owner": output["user"],
        "parent_job_id": output.get("parent_job_id", None),
        "run_id": job_input.get("narrative_cell_info", {}).get("run_id", None),
        "tag": job_input.get("narrative_cell_info", {}).get("tag", "release"),
        "token_id": job_input.get("narrative_cell_info", {}).get("token_id", None),
    }

    job_out = {}
    for key in mapping.keys():
        job_out[key] = mapping[key]

    return job_out


class JobTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        info = next(iter(test_jobs.values()))

        cls.job_id = info["job_id"]
        param_info = info["job_input"]

        cls.app_id = param_info["app_id"]
        cls.app_version = param_info.get("service_ver", "0.0.1")
        cls.batch_id = None
        cls.cell_id = param_info.get("narrative_cell_info", {}).get("cell_id")
        cls.inputs = None
        cls.meta = dict()
        cls.owner = info["user"]
        cls.parent_job_id = "parent_job"
        cls.run_id = param_info.get("narrative_cell_info", {}).get("run_id")
        cls.tag = param_info.get("narrative_cell_info", {}).get("tag", "dev")
        cls.token_id = "temp_token"

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def _mocked_job(self, job_attrs=[]):
        job_kwargs = {}

        for arg in [
            "app_version",
            "batch_id",
            "cell_id",
            "parent_job_id",
            "run_id",
            "tag",
            "token_id",
        ]:
            if not len(job_attrs) or "no_" + arg not in job_attrs:
                job_kwargs[arg] = getattr(self, arg)

        job = Job(self.job_id, self.app_id, self.inputs, self.owner, **job_kwargs)

        return job

    def test_job_init(self):
        job = self._mocked_job()

        for attr in ALL_JOB_ATTRS:
            self.assertEqual(getattr(job, attr), getattr(self, attr))

    def test_job_init_defaults(self):
        job = self._mocked_job(
            [
                "no_app_version",
                "no_batch_id",
                "no_cell_id",
                "no_parent_job_id",
                "no_run_id",
                "no_tag",
                "no_token_id",
            ]
        )

        for attr in ["app_id", "inputs", "job_id", "meta", "owner"]:
            self.assertEqual(getattr(job, attr), getattr(self, attr))

        for attr in ["app_version", "batch_id", "cell_id", "parent_job_id", "run_id", "token_id"]:
            self.assertEqual(getattr(job, attr), None)

        self.assertEqual(job.tag, "release")

    def test_job_from_state(self):
        job_info = {"params": self.inputs, "service_ver": self.app_version}
        job = Job.from_state(
            self.job_id,
            job_info,
            self.owner,
            self.app_id,
            batch_id=self.batch_id,
            cell_id=self.cell_id,
            parent_job_id=self.parent_job_id,
            run_id=self.run_id,
            token_id=self.token_id,
            tag=self.tag,
        )

        for attr in ALL_JOB_ATTRS:
            self.assertEqual(getattr(job, attr), getattr(self, attr))

    def test_job_from_state_defaults(self):
        job_info = {"params": self.inputs, "service_ver": self.app_version}
        job = Job.from_state(
            "another_job",
            job_info,
            self.owner,
            self.app_id,
        )
        for attr in ["app_id", "app_version", "inputs", "meta", "owner"]:
            self.assertEqual(getattr(job, attr), getattr(self, attr))

        for attr in ["cell_id", "batch_id", "parent_job_id", "run_id", "token_id"]:
            self.assertEqual(getattr(job, attr), None)

        self.assertEqual(job.job_id, "another_job")
        self.assertEqual(job.tag, "release")

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_job_info(self):
        job = self._mocked_job()
        info_str = "App name (id): Test Editor (NarrativeTest/test_editor)\nVersion: 0.0.1\nStatus: completed\nInputs:\n------\n"
        with capture_stdout() as (out, err):
            job.info()
            self.assertIn(info_str, out.getvalue().strip())

    def test_repr(self):
        job = self._mocked_job()
        job_str = job.__repr__()
        self.assertIn(job.job_id, job_str)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_repr_js(self):
        job = self._mocked_job()
        js_out = job._repr_javascript_()
        self.assertIsInstance(js_out, str)
        # spot check to make sure the core pieces are present. needs the
        # element.html part, job_id, and widget
        self.assertIn("element.html", js_out)
        self.assertIn(job.job_id, js_out)
        self.assertIn("kbaseNarrativeJobStatus", js_out)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_job_finished(self):
        job = self._mocked_job()
        self.assertTrue(job.is_finished())

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_state__run_check_job(self):
        import json
        print(json.dumps(test_jobs, indent=2, sort_keys=True))

        job = self._mocked_job()
        print(job)
        with assert_obj_method_called(MockClients, "check_job", True):
            state = job.state()

        self.assertEqual(state["job_id"], job.job_id)
        self.assertIn("status", state)
        self.assertIn("updated", state)
        for arg in EXTRA_JOB_STATE_FIELDS:
            self.assertEqual(state[arg], getattr(self, arg))
        self.assertNotIn("job_input", state)

        # to do - add a test to only fetch from _last_state if it's populated and in a final state
        print(job.state())

        job.job_id = "not_a_job_id"
        job._last_state = None  # force it to look up.
        # with self.assertRaises(Exception) as e:
        #     job.state()
        # self.assertIn("Unable to fetch info for job", str(e.exception))

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_state__last_state_exists__non_terminal(self):
        job = self._mocked_job()

        self.assertTrue(hasattr(job, "_last_state"))


        with assert_obj_method_called(MockClients, "check_job", False):
            state = job.state()

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_state__last_state_exists__terminal(self):
        # job = create_from_test_job(JOB_COMPLETED)
        pass

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_failing_mock_client)
    def test_state__raise_exception(self):
        # job = create_from_test_job(JOB_COMPLETED)
        # create the job
        job = self._mocked_job()
        self.assertIsNone(job._last_state)
        with self.assertRaisesRegex(Exception, "Unable to fetch info for job"):
            job.state()

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_show_output_widget(self):
        job = self._mocked_job()
        job.show_output_widget()

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_log(self):
        # Things set up by the mock:
        # 1. There's 100 total log lines
        # 2. Each line has its line number embedded in it
        total_lines = 100
        job = self._mocked_job()
        logs = job.log()
        # we know there's 100 lines total, so roll with it that way.
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), total_lines)
        for i in range(len(logs[1])):
            line = logs[1][i]
            self.assertIn("is_error", line)
            self.assertIn("line", line)
            self.assertIn(str(i), line["line"])
        # grab the last half
        offset = 50
        logs = job.log(first_line=offset)
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), offset)
        for i in range(total_lines - offset):
            self.assertIn(str(i + offset), logs[1][i]["line"])
        # grab a bite from the middle
        num_fetch = 20
        logs = job.log(first_line=offset, num_lines=num_fetch)
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), num_fetch)
        for i in range(num_fetch):
            self.assertIn(str(i + offset), logs[1][i]["line"])
        # should normalize negative numbers properly
        logs = job.log(first_line=-5)
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), total_lines)
        logs = job.log(num_lines=-5)
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), 0)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_parameters(self):
        job = self._mocked_job()
        params = job.parameters()
        self.assertIsNotNone(params)

        job.inputs = None
        params2 = job.parameters()
        self.assertIsNotNone(params2)
        self.assertEqual(params, params2)

        job.job_id = "not_a_job_id"
        job.inputs = None
        with self.assertRaises(Exception) as e:
            job.parameters()
        self.assertIn("Unable to fetch parameters for job", str(e.exception))
