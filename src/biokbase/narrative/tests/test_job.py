from src.biokbase.narrative.jobs.job import EXCLUDED_JOB_STATE_FIELDS
from src.biokbase.narrative.jobs.appmanager import BATCH_ID_KEY
import unittest
import mock
import copy
from biokbase.narrative.jobs.job import Job, EXTRA_JOB_STATE_FIELDS, ALL_JOB_ATTRS
from .util import ConfigTests
from .narrative_mock.mockclients import (
    get_mock_client,
    get_failing_mock_client,
    MockClients,
    assert_obj_method_called,
)
from contextlib import contextmanager
from io import StringIO
import sys


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

JOB_KWARGS = [
    "app_version",
    "batch_id",
    "cell_id",
    "run_id",
    "tag",
    "token_id",
]

# test_jobs contains jobs in the following states
JOB_COMPLETED = "5d64935ab215ad4128de94d6"
JOB_CREATED = "5d64935cb215ad4128de94d7"
JOB_RUNNING = "5d64935cb215ad4128de94d8"
JOB_TERMINATED = "5d64935cb215ad4128de94d9"


def get_test_job(job_id):
    return copy.deepcopy(test_jobs[job_id])


def transform_job(job_data, transform_list=ALL_JOB_ATTRS):
    """
    transform job data into suitable input for creating a job object

    params:

    job_data        - raw job data, as emitted by ee2's check_job function
    transform_list  - attributes to generate from the raw data.
                        defaults to using ALL_JOB_ATTRS

    """

    job_input = job_data.get("job_input")
    mapping = {
        "app_id": job_input.get("app_id"),
        "app_version": job_input.get("service_ver", None),
        "batch_id": job_data.get("batch_id", None),
        "cell_id": job_input.get("narrative_cell_info", {}).get("cell_id", None),
        "job_id": job_data.get("job_id"),
        "meta": dict(),
        "owner": job_data["user"],
        "params": job_input.get("params", {}),
        "run_id": job_input.get("narrative_cell_info", {}).get("run_id", None),
        "tag": job_input.get("narrative_cell_info", {}).get("tag", "release"),
        "token_id": job_input.get("narrative_cell_info", {}).get("token_id", None),
    }

    job_out = {}
    for key in transform_list:
        job_out[key] = mapping[key]

    return job_out


def create_job_from_ee2(job_id):
    """
    create a job object from raw job data
    """
    job_data = get_test_job(job_id)
    job_out = transform_job(job_data)
    existing_args = []
    for arg in ["job_id", "app_id", "params", "owner"]:
        existing_args.append(job_out[arg])
        del job_out[arg]

    return Job(*existing_args, **job_out, ee2_state=get_test_job(job_id))


def create_state_from_ee2(job_id):
    """
    create the output of job.state() from raw job data
    """
    job_data = get_test_job(job_id)

    # populate the extra fields
    transformed_data = transform_job(job_data, EXTRA_JOB_STATE_FIELDS)
    job_data.update(transformed_data)

    # remove unnecessary fields
    for field in EXCLUDED_JOB_STATE_FIELDS:
        if field in job_data:
            del job_data[field]

    # add in the job output if it is not defined
    job_data["job_output"] = job_data.get("job_output", {})

    return job_data


class JobTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        job_state = get_test_job(JOB_COMPLETED)
        job_input = job_state["job_input"]
        cls.job_id = job_state["job_id"]
        cls.app_id = job_input["app_id"]
        cls.app_version = job_input.get("service_ver", "0.0.1")
        cls.batch_id = None
        cls.cell_id = job_input.get("narrative_cell_info", {}).get("cell_id")
        cls.meta = dict()
        cls.owner = job_state["user"]
        cls.params = None
        cls.run_id = job_input.get("narrative_cell_info", {}).get("run_id")
        cls.tag = job_input.get("narrative_cell_info", {}).get("tag", "dev")
        cls.token_id = "temp_token"

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def _mocked_job(self, job_attrs=[]):
        job_kwargs = {}

        for arg in JOB_KWARGS:
            if not len(job_attrs) or arg not in job_attrs:
                job_kwargs[arg] = getattr(self, arg)

        job = Job(self.job_id, self.app_id, self.params, self.owner, **job_kwargs)

        return job

    def check_job_attrs(self, job, expected={}):
        for attr in ALL_JOB_ATTRS:
            if attr in expected:
                self.assertEqual(getattr(job, attr), expected[attr])
            else:
                self.assertEqual(getattr(job, attr), getattr(self, attr))

    def check_state(self, job_id, job_state):
        expected = create_state_from_ee2(job_id)
        self.assertEqual(job_state, expected)

    def test_job_init(self):
        """
        test job initialisation, no defaults used
        """
        job = self._mocked_job()
        self.check_job_attrs(job)

    def test_job_init_defaults(self):
        """
        test job initialisation using defaults
        """
        job = self._mocked_job(JOB_KWARGS)
        expected = {
            "app_version": None,
            "batch_id": None,
            "cell_id": None,
            "run_id": None,
            "tag": "release",
            "token_id": None,
        }

        self.check_job_attrs(job, expected)

    def test_job_init__run_app_batch__input(self):
        """
        test job initialisation as is done by run_app_batch
        """

        app_id = "kb_BatchApp/run_batch"
        batch_method_tag = "tag"
        batch_method_ver = "ver"
        job_meta = {
            "tag": batch_method_tag,
            "batch_app": app_id,
            "batch_tag": None,
            "batch_size": 300,
            "cell_id": self.cell_id,
            "run_id": self.run_id,
            "token_id": self.token_id,
        }

        batch_params = [
            {"service_ver": batch_method_ver, "meta": job_meta, "batch_params": []}
        ]

        batch_job = Job(
            self.job_id,
            app_id,
            batch_params,
            self.owner,
            batch_method_ver,
            cell_id=self.cell_id,
            meta=job_meta,
            run_id=self.run_id,
            tag=batch_method_tag,
            token_id=self.token_id,
        )

        expected = {
            "app_id": app_id,
            "app_version": batch_method_ver,
            "batch_id": None,
            "meta": job_meta,
            "params": batch_params,
            "tag": batch_method_tag,
        }

        self.check_job_attrs(batch_job, expected)

    def test_job_init__run_app(self):
        """
        test job initialisation as is done by run_app
        """
        job_runner_inputs = {"params": {}, "service_ver": "the best ever"}

        job = Job(
            self.job_id,
            self.app_id,
            job_runner_inputs["params"],
            self.owner,
            app_version=job_runner_inputs["service_ver"],
            cell_id=self.cell_id,
            run_id=self.run_id,
            tag=self.tag,
            token_id=self.token_id,
        )
        expected = {
            "app_version": job_runner_inputs["service_ver"],
            "params": job_runner_inputs["params"],
        }

        self.check_job_attrs(job, expected)

    # def test_job_init__run_app_bulk__input(self):
    #     """
    #     test job initialisation as is done by run_app_bulk
    #     """
    #     batch_submission = {BATCH_ID_KEY: 'my_batch_id'}

    #     # child job
    #     child_job = Job(
    #         child_job_id,
    #         job_info["app_id"],
    #         job_info["params"],
    #         self.owner,
    #         app_version=job_info["service_ver"],
    #         batch_id=batch_submission[BATCH_ID_KEY],
    #         cell_id=cell_id,
    #         run_id=run_id,
    #         tag=job_info["meta"].get("tag"),
    #         token_id=self.token_id,
    #     )

    #     for attr in ALL_JOB_ATTRS:

    #     # parent job
    #     parent_job = Job(
    #         batch_submission[BATCH_ID_KEY],
    #         "bulk_app_submission",
    #         {},
    #         self.owner,
    #         batch_id=batch_submission[BATCH_ID_KEY],
    #     )

    def test_job_from_state(self):
        """
        test that a completed job is correctly initialised
        """
        test_job = test_jobs[JOB_COMPLETED]
        expected = {
            "job_id": JOB_COMPLETED,
            "app_id": test_job.get("job_input", {}).get(
                "app_id", test_job.get("job_input", {}).get("method")
            ),
            "app_version": test_job.get("job_input", {}).get("service_ver", None),
            "batch_id": test_job.get("batch_id", None),
            "cell_id": test_job.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("cell_id", None),
            "_last_state": test_job,
            "meta": test_job.get("job_input", {}).get("narrative_cell_info", {}),
            "owner": test_job.get("user", None),
            "params": test_job.get("job_input", {}).get("params", {}),
            "run_id": test_job.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("run_id", None),
            "tag": test_job.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("tag", "release"),
            "token_id": test_job.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("token_id", None),
        }

        job = Job.from_state(test_jobs[JOB_COMPLETED])
        self.check_job_attrs(job, expected)

    def test_job_from_state_defaults(self):
        """
        test job initialisation with defaults being filled in
        """
        params = [
            {
                "import_type": "FASTQ/FASTA",
                "name": "small.forward.fq",
            }
        ]
        test_job = {
            "user": self.owner,
            "job_input": {
                "params": params,
                "service_ver": self.app_version,
                "app_id": self.app_id,
            },
            "job_id": self.job_id,
        }

        expected = {
            "batch_id": None,
            "cell_id": None,
            "meta": {},
            "params": params,
            "run_id": None,
            "tag": "release",
            "token_id": None,
        }

        job = Job.from_state(test_job)
        self.check_job_attrs(job, expected)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_state__no_last_state__terminal(self):
        """
        test that a job outputs the correct state and that the update is cached
        """
        job = create_job_from_ee2(JOB_TERMINATED)
        # when the field is first populated, it will have all the ee2 data
        self.assertEqual(job._last_state, get_test_job(JOB_TERMINATED))

        # get rid of the cached job state
        job._last_state = None
        self.assertIsNone(job._last_state)

        state = job.state()
        self.assertEqual(state["status"], "terminated")
        self.check_state(JOB_TERMINATED, state)

        # when the field is repopulated, the EXCLUDED_JOB_STATE_FIELDS filter
        # will be on
        expected_last_state = get_test_job(JOB_TERMINATED)
        for field in EXCLUDED_JOB_STATE_FIELDS:
            if field in expected_last_state:
                del expected_last_state[field]
        self.assertEqual(job._last_state, expected_last_state)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_state__no_last_state__non_terminal(self):
        """
        test that a job outputs the correct state and that the update is not cached
        """
        job = create_job_from_ee2(JOB_CREATED)
        self.assertIsNone(job._last_state)
        state = job.state()
        self.check_state(JOB_CREATED, state)
        self.assertIsNone(job._last_state)
        self.assertEqual(state["status"], "created")

    def test_state__last_state_exists__terminal(self):
        """
        test that a completed job emits its state without calling check_job
        """
        job = create_job_from_ee2(JOB_COMPLETED)
        self.assertIsNotNone(job._last_state)
        self.assertEqual(job._last_state, get_test_job(JOB_COMPLETED))

        with assert_obj_method_called(MockClients, "check_job", call_status=False):
            state = job.state()
            self.assertEqual(state["status"], "completed")
            self.check_state(JOB_COMPLETED, state)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_failing_mock_client)
    def test_state__raise_exception(self):
        """
        test that the correct exception is thrown if check_job cannot be called
        """
        job = create_job_from_ee2(JOB_CREATED)
        self.assertIsNone(job._last_state)
        with self.assertRaisesRegex(Exception, "Unable to fetch info for job"):
            job.state()

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

        is_finished = {
            JOB_CREATED: False,
            JOB_RUNNING: False,
            JOB_COMPLETED: True,
            JOB_TERMINATED: True,
        }

        for job_id in is_finished.keys():
            job = create_job_from_ee2(job_id)
            self.assertEqual(job.is_finished(), is_finished[job_id])

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_show_output_widget(self):
        # TODO: Improve this test
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
        # TODO: Improve this test
        job = self._mocked_job()
        params = job.parameters()
        self.assertIsNotNone(params)

        job.params = None
        params2 = job.parameters()
        self.assertIsNotNone(params2)
        self.assertEqual(params, params2)

        job.job_id = "not_a_job_id"
        job.params = None
        with self.assertRaises(Exception) as e:
            job.parameters()
        self.assertIn("Unable to fetch parameters for job", str(e.exception))
