from src.biokbase.narrative.jobs.job import COMPLETED_STATUS, EXCLUDED_JOB_STATE_FIELDS
import unittest
import mock
import copy
from biokbase.narrative.jobs.job import (
    Job,
    EXTRA_JOB_STATE_FIELDS,
    JOB_ATTRS,
    JOB_ATTR_DEFAULTS,
)
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


def mock_job_state(self, force_refresh=False):
    """Mock job.state() to avoid ee2 calls"""
    return self._augment_ee2_state(self._last_state)


config = ConfigTests()
test_jobs = config.load_json_file(config.get("jobs", "ee2_job_info_file"))
test_specs = config.load_json_file(config.get("specs", "app_specs_file"))

# test_jobs contains jobs in the following states
JOB_COMPLETED = "5d64935ab215ad4128de94d6"
JOB_CREATED = "5d64935cb215ad4128de94d7"
JOB_RUNNING = "5d64935cb215ad4128de94d8"
JOB_TERMINATED = "5d64935cb215ad4128de94d9"
JOB_ERROR = "5d64935cb215ad4128de94e0"
BATCH_PARENT = "60e7112887b7e512a899c8f1"
BATCH_COMPLETED = "60e7112887b7e512a899c8f2"
BATCH_TERMINATED = "60e7112887b7e512a899c8f3"
BATCH_TERMINATED_RETRIED = "60e7112887b7e512a899c8f4"
BATCH_ERROR_RETRIED = "60e7112887b7e512a899c8f5"
BATCH_RETRY_COMPLETED = "60e71159fce9347f2adeaac6"
BATCH_RETRY_RUNNING = "60e7165f3e91121969554d82"
BATCH_RETRY_ERROR = "60e717d78ac80701062efe63"

BATCH_CHILDREN = [
    BATCH_COMPLETED,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    BATCH_ERROR_RETRIED,
    BATCH_RETRY_COMPLETED,
    BATCH_RETRY_RUNNING,
    BATCH_RETRY_ERROR,
]

saved_jobs = {
    JOB_COMPLETED: True,
    JOB_CREATED: False,
    JOB_RUNNING: False,
    JOB_TERMINATED: True,
    JOB_ERROR: True,
    BATCH_PARENT: False,
    BATCH_COMPLETED: True,
    BATCH_TERMINATED: True,
    BATCH_TERMINATED_RETRIED: True,
    BATCH_ERROR_RETRIED: True,
    BATCH_RETRY_COMPLETED: True,
    BATCH_RETRY_RUNNING: False,
    BATCH_RETRY_ERROR: True,
}

ALL_JOBS = saved_jobs.keys()
FINISHED_JOBS = []
ACTIVE_JOBS = []
for key, value in saved_jobs.items():
    if value:
        FINISHED_JOBS.append(key)
    else:
        ACTIVE_JOBS.append(key)


JOB_KWARGS = [
    "app_version",
    "batch_id",
    "batch_job",
    "child_jobs",
    "cell_id",
    "run_id",
    "tag",
]


def get_app_data(*args):
    return test_specs[1]


def get_test_job(job_id):
    return copy.deepcopy(test_jobs[job_id])


def state_2_kwargs(state, transform_list=JOB_ATTRS):
    """
    transform job data into suitable input for creating a job object

    params:

    state           - raw job data, as emitted by ee2's check_job function
    transform_list  - attributes to generate from the raw data.
                        defaults to using JOB_ATTRS

    """

    job_input = state.get("job_input")
    mapping = {
        "app_id": job_input.get("app_id"),
        "app_version": job_input.get("service_ver", None),
        "batch_id": state.get("batch_id", None),
        "batch_job": state.get("batch_job", False),
        "cell_id": job_input.get("narrative_cell_info", {}).get("cell_id", None),
        "child_jobs": state.get("child_jobs", []),
        "extra_data": None,
        "job_id": state.get("job_id"),
        "params": job_input.get("params", {}),
        "retry_ids": state.get("retry_ids", []),
        "retry_parent": state.get("retry_parent", None),
        "run_id": job_input.get("narrative_cell_info", {}).get("run_id", None),
        "tag": job_input.get("narrative_cell_info", {}).get("tag", "release"),
        "user": state["user"],
    }

    kwargs = {}
    for key in transform_list:
        kwargs[key] = mapping[key]

    return kwargs


def create_job_from_ee2(job_id):
    """
    create a job object from raw job data
    """
    state = get_test_job(job_id)
    kwargs = state_2_kwargs(state)

    return Job.from_attributes(**kwargs, ee2_state=get_test_job(job_id))


def create_state_from_ee2(job_id, with_job_input=False, with_job_output=False):
    """
    create the output of job.state() from raw job data
    """
    state = get_test_job(job_id)
    omitted_fields = EXCLUDED_JOB_STATE_FIELDS.copy()

    if not with_job_output:
        omitted_fields.append("job_output")

    if with_job_input:
        omitted_fields.remove("job_input")

    # remove unnecessary fields
    for field in omitted_fields:
        if field in state:
            del state[field]

    return state


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
        cls.batch_job = False
        cls.child_jobs = []
        cls.cell_id = job_input.get("narrative_cell_info", {}).get("cell_id")
        cls.extra_data = None
        cls.user = job_state["user"]
        cls.params = job_input["params"]
        cls.retry_ids = job_state.get("retry_ids", [])
        cls.retry_parent = job_state.get("retry_parent")
        cls.run_id = job_input.get("narrative_cell_info", {}).get("run_id")
        cls.tag = job_input.get("narrative_cell_info", {}).get("tag", "dev")

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def _mocked_job(self, job_attrs=[]):
        """
        create a mock job; any fields included in job_attrs will be omitted from the job params
        """
        job_args = {
            "job_id": self.job_id,
            "app_id": self.app_id,
            "params": self.params,
            "user": self.user,
        }

        for arg in JOB_KWARGS:
            if not len(job_attrs) or arg not in job_attrs:
                job_args[arg] = getattr(self, arg)

        job = Job.from_attributes(**job_args)

        return job

    def check_job_attrs(self, job, expected={}):
        """
        Check the attributes of a job against a dictionary of expected attributes
        If the expected attribute is not supplied, the defaults set on this test object are used
        """
        with mock.patch.object(Job, "state", autospec=True) as m:
            m.side_effect = mock_job_state
            for attr in JOB_ATTRS:
                if attr in expected:
                    self.assertEqual(getattr(job, attr), expected[attr])
                else:
                    self.assertEqual(getattr(job, attr), getattr(self, attr))

    def test_job_init__id_only(self):
        job = Job.from_attributes(job_id=JOB_COMPLETED)
        with mock.patch.object(Job, "state", autospec=True) as m:
            m.side_effect = mock_job_state
            for attr in JOB_ATTRS:
                if attr == "job_id":
                    self.assertEqual(job.job_id, JOB_COMPLETED)
                else:
                    self.assertEqual(getattr(job, attr), JOB_ATTR_DEFAULTS[attr])

    def test_job_init__error_no_job_id(self):

        with self.assertRaisesRegexp(
            ValueError, "Cannot create a job without a job ID!"
        ):
            Job.from_attributes(params={}, app_id="this/that")

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
        }

        self.check_job_attrs(job, expected)

    def test_job_init__run_app_batch__input(self):
        """
        test job initialisation as is done by run_app_batch
        """

        app_id = "kb_BatchApp/run_batch"
        batch_method_tag = "tag"
        batch_method_ver = "ver"
        extra_data = {
            "batch_app": app_id,
            "batch_tag": None,
            "batch_size": 300,
        }
        job_meta = {
            **extra_data,
            "cell_id": self.cell_id,
            "run_id": self.run_id,
            "tag": batch_method_tag,
        }

        batch_params = [
            {"service_ver": batch_method_ver, "meta": job_meta, "batch_params": []}
        ]

        batch_job = Job.from_attributes(
            app_id=app_id,
            app_version=batch_method_ver,
            cell_id=self.cell_id,
            job_id=self.job_id,
            extra_data=extra_data,
            user=self.user,
            params=batch_params,
            run_id=self.run_id,
            tag=batch_method_tag,
        )

        expected = {
            "app_id": app_id,
            "app_version": batch_method_ver,
            "batch_id": None,
            "extra_data": extra_data,
            "params": batch_params,
            "tag": batch_method_tag,
        }

        self.check_job_attrs(batch_job, expected)

    def test_job_init__run_app(self):
        """
        test job initialisation as is done by run_app
        """
        job_runner_inputs = {"params": {}, "service_ver": "the best ever"}

        job = Job.from_attributes(
            app_id=self.app_id,
            app_version=job_runner_inputs["service_ver"],
            cell_id=self.cell_id,
            job_id=self.job_id,
            user=self.user,
            params=job_runner_inputs["params"],
            run_id=self.run_id,
            tag=self.tag,
        )
        expected = {
            "app_version": job_runner_inputs["service_ver"],
            "params": job_runner_inputs["params"],
        }

        self.check_job_attrs(job, expected)

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
            "extra_data": None,
            "user": test_job.get("user", None),
            "params": test_job.get("job_input", {}).get("params", {}),
            "run_id": test_job.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("run_id", None),
            "tag": test_job.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("tag", "release"),
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
            "user": self.user,
            "job_input": {
                "params": params,
                "service_ver": self.app_version,
                "app_id": self.app_id,
            },
            "job_id": self.job_id,
        }

        expected = {
            "batch_id": JOB_ATTR_DEFAULTS["batch_id"],
            "cell_id": JOB_ATTR_DEFAULTS["cell_id"],
            "extra_data": None,
            "params": params,
            "run_id": JOB_ATTR_DEFAULTS["run_id"],
            "tag": JOB_ATTR_DEFAULTS["tag"],
        }

        job = Job.from_state(test_job)
        self.check_job_attrs(job, expected)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_state__no_final_state__terminal(self):
        """
        test that a job outputs the correct state and that the update is cached
        """
        # ee2_state is fully populated
        job = create_job_from_ee2(JOB_TERMINATED)
        # when the field is first populated, it will have all the ee2 data
        self.assertEqual(
            job.final_state, create_state_from_ee2(JOB_TERMINATED, True, True)
        )

        # get rid of the cached job state
        job.clear_state()
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job.final_state)

        # when the field is repopulated, the EXCLUDED_JOB_STATE_FIELDS filter
        # will be on, so there will be no job_input
        state = job.state()
        self.assertEqual(state["status"], "terminated")
        self.assertTrue(job.was_terminal)
        expected_state = create_state_from_ee2(JOB_TERMINATED, False, True)
        self.assertEqual(state, expected_state)
        self.assertEqual(job.final_state, expected_state)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_state__no_final_state__non_terminal(self):
        """
        test that a job outputs the correct state and that the update is not cached
        """
        # ee2_state is fully populated (includes job_input, no job_output)
        job = create_job_from_ee2(JOB_CREATED)
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job.final_state)
        state = job.state()
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job.final_state)
        self.assertEqual(state["status"], "created")

        expected_state = create_state_from_ee2(JOB_CREATED, True)
        self.assertEqual(state, expected_state)

    def test_state__final_state_exists__terminal(self):
        """
        test that a completed job emits its state without calling check_job
        """
        job = create_job_from_ee2(JOB_COMPLETED)
        self.assertTrue(job.was_terminal)
        self.assertIsNotNone(job.final_state)
        expected = create_state_from_ee2(JOB_COMPLETED, True, True)
        self.assertEqual(job.final_state, expected)

        with assert_obj_method_called(MockClients, "check_job", call_status=False):
            state = job.state()
            self.assertEqual(state["status"], "completed")
            self.assertEqual(state, expected)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_failing_mock_client)
    def test_state__raise_exception(self):
        """
        test that the correct exception is thrown if check_job cannot be called
        """
        job = create_job_from_ee2(JOB_CREATED)
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job.final_state)
        with self.assertRaisesRegex(Exception, "Unable to fetch info for job"):
            job.state()

    def test_state__returns_none(self):
        def mock_state(self, state=None):
            return None

        job = create_job_from_ee2(JOB_CREATED)
        expected = {
            "status": "error",
            "error": {
                "code": -1,
                "name": "Job Error",
                "message": "Unable to return job state",
                "error": "Unable to find current job state. Please try again later, or contact KBase.",
            },
            "errormsg": "Unable to return job state",
            "error_code": -1,
            "job_id": job.job_id,
            "cell_id": job.cell_id,
            "run_id": job.run_id,
            "created": 0,
            "updated": 0,
        }

        with mock.patch.object(Job, "state", mock_state):
            state = job.output_state()
        self.assertEqual(expected, state)

    def test_job_update__no_state(self):
        """
        test that without a state object supplied, the job state is unchanged
        """
        job = create_job_from_ee2(JOB_CREATED)
        job.clear_state()
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job._last_state)
        job.update_state(None)
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job._last_state)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_job_update__invalid_job_id(self):
        """
        ensure that an ee2 state with a different job ID cannot be used to update a job
        """
        job = create_job_from_ee2(JOB_RUNNING)
        expected = create_state_from_ee2(
            JOB_RUNNING, with_job_input=True, with_job_output=False
        )
        self.assertEqual(job.state(), expected)

        # try to update it with the job state from a different job
        with self.assertRaisesRegexp(ValueError, "Job ID mismatch in update_state"):
            job.update_state(get_test_job(JOB_COMPLETED))

    @mock.patch(
        "biokbase.narrative.jobs.specmanager.SpecManager.get_spec", get_app_data
    )
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
        self.assertRegex("KBase Narrative Job - " + job.job_id, job_str)

    @mock.patch(
        "biokbase.narrative.jobs.specmanager.SpecManager.get_spec", get_app_data
    )
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

    @mock.patch(
        "biokbase.narrative.jobs.specmanager.SpecManager.get_spec", get_app_data
    )
    @mock.patch("biokbase.narrative.widgetmanager.WidgetManager.show_output_widget")
    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_show_output_widget(self, mock_method):
        mock_method.return_value = True
        job = Job.from_state(get_test_job(JOB_COMPLETED))
        self.assertTrue(job.show_output_widget())
        mock_method.assert_called_once()

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_show_output_widget__incomplete_state(self):
        job = Job.from_state(get_test_job(JOB_CREATED))
        self.assertRegexpMatches(
            job.show_output_widget(), "Job is incomplete! It has status 'created'"
        )

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
        """
        test that a job returns the correct parameters
        """
        job_state = get_test_job(JOB_COMPLETED)
        job_params = job_state.get("job_input", {}).get("params", None)
        self.assertIsNotNone(job_params)
        job = Job.from_state(job_state)
        self.assertIsNotNone(job.params)

        with assert_obj_method_called(MockClients, "get_job_params", call_status=False):
            params = job.parameters()
            self.assertIsNotNone(params)
            self.assertEqual(params, job_params)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_parameters__param_fetch_ok(self):
        """
        test that a job can successfully retrieve parameters from ee2
        if they do not exist
        """
        job_state = get_test_job(JOB_CREATED)
        job_params = job_state.get("job_input", {}).get("params", None)
        self.assertIsNotNone(job_params)

        # delete the job params from the input
        del job_state["job_input"]["params"]
        job = Job.from_state(job_state)
        self.assertEqual(job.params, JOB_ATTR_DEFAULTS["params"])

        params = job.parameters()
        self.assertEqual(params, job_params)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_failing_mock_client)
    def test_parameters__param_fetch_fail(self):
        """
        test failure to retrieve job params data
        """
        job_state = get_test_job(JOB_TERMINATED)
        del job_state["job_input"]["params"]
        job = Job.from_state(job_state)
        self.assertEqual(job.params, JOB_ATTR_DEFAULTS["params"])

        with self.assertRaisesRegexp(Exception, "Unable to fetch parameters for job"):
            job.parameters()

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_parent_children__ok(self):
        child_jobs = [create_job_from_ee2(job_id) for job_id in BATCH_CHILDREN]
        parent_job = Job.from_state(
            create_state_from_ee2(BATCH_PARENT),
            children=child_jobs,
        )

        self.assertFalse(parent_job.was_terminal)

        # Make all child jobs completed
        with mock.patch.object(
            MockClients,
            "check_job",
            mock.Mock(return_value={"status": COMPLETED_STATUS}),
        ):
            for child_job in child_jobs:
                child_job.state(force_refresh=True)

        self.assertTrue(parent_job.was_terminal)

    def test_parent_children__fail(self):
        parent_state = create_state_from_ee2(BATCH_PARENT)
        with self.assertRaisesRegex(
            ValueError,
            "Job with `batch_job=True` must be instantiated with child job instances",
        ):
            Job.from_state(parent_state)

        child_jobs = [create_job_from_ee2(job_id) for job_id in BATCH_CHILDREN][1:]
        with self.assertRaisesRegex(ValueError, "Child job id mismatch"):
            Job.from_state(
                parent_state,
                children=child_jobs,
            )
