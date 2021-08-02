import unittest
import mock
import copy
from biokbase.narrative.app_util import map_inputs_from_job, map_outputs_from_state
from biokbase.narrative.jobs.job import (
    Job,
    COMPLETED_STATUS,
    EXCLUDED_JOB_STATE_FIELDS,
    JOB_ATTRS,
    JOB_ATTR_DEFAULTS,
)
from biokbase.narrative.jobs.jobmanager import JOB_INIT_EXCLUDED_JOB_STATE_FIELDS
from biokbase.narrative.jobs.specmanager import SpecManager
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
    return self._augment_ee2_state(self._acc_state)


config = ConfigTests()
TEST_JOBS = config.load_json_file(config.get("jobs", "ee2_job_info_file"))
with mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client):
    sm = SpecManager()
    sm.reload()
    TEST_SPECS = copy.deepcopy(sm.app_specs)


def get_test_spec(tag, app_id):
    return copy.deepcopy(TEST_SPECS[tag][app_id])


def get_test_job(job_id):
    return copy.deepcopy(TEST_JOBS[job_id])


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
JOB_NOT_FOUND = "job_not_found"

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


def create_job_from_ee2(job_id, mode, children=None):
    """
    create a job object from raw job data
    """
    state = get_test_job(job_id)

    if mode == "attributes":
        kwargs = state_2_kwargs(state)
        job = Job.from_attributes(**kwargs, children=children)
    elif mode == "state":
        job = Job.from_state(state, children=children)

    return job


def create_state_from_ee2(job_id, mode):
    """
    create the output of job.state() from raw job data
    """
    state = get_test_job(job_id)

    for attr in JOB_INIT_EXCLUDED_JOB_STATE_FIELDS:
        if attr in state:
            del state[attr]

    # Depending on if the job was initialized with kwargs
    # or has been populated with actual ee2 state info,
    # the tested state() may come out with limited fields.
    # Restrict to JOB_ATTR fields here if needed
    if mode == "attributes":
        for k, v in state.copy().items():
            if k not in JOB_ATTRS:
                del state[k]

    return state


def get_widget_info(job_id):
    state = get_test_job(job_id)
    if state.get("status") != COMPLETED_STATUS:
        return None
    job_input = state.get("job_input", {})
    narr_cell_info = job_input.get("narrative_cell_info", {})
    params = job_input.get("params", JOB_ATTR_DEFAULTS["params"])
    tag = narr_cell_info.get("tag", JOB_ATTR_DEFAULTS["tag"])
    app_id = job_input.get("app_id", JOB_ATTR_DEFAULTS["app_id"])
    spec = get_test_spec(tag, app_id)
    output_widget, widget_params = map_outputs_from_state(
        state,
        map_inputs_from_job(params, spec),
        spec,
    )
    return {
        "name": output_widget,
        "tag": narr_cell_info.get("tag", "release"),
        "params": widget_params,
    }


def get_test_job_states():
    # generate full job state objects
    job_states = {}
    for job_id in TEST_JOBS.keys():
        state = get_test_job(job_id)
        job_input = state.get("job_input", {})
        narr_cell_info = job_input.get("narrative_cell_info", {})

        state.update(
            {
                "batch_id": state.get(
                    "batch_id", job_id if state.get("batch_job", False) else None
                ),
                "cell_id": narr_cell_info.get("cell_id", None),
                "run_id": narr_cell_info.get("run_id", None),
                "job_output": state.get("job_output", {}),
                "child_jobs": state.get("child_jobs", []),
            }
        )
        for f in EXCLUDED_JOB_STATE_FIELDS:
            if f in state:
                del state[f]
        job_states[job_id] = {
            "state": state,
            "widget_info": get_widget_info(job_id),
            "user": state.get("user"),
        }

    return job_states


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

        # load mock specs
        with mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client):
            SpecManager().reload()

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

        with self.assertRaisesRegex(
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
        test_job = get_test_job(JOB_COMPLETED)
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
            "_acc_state": test_job,
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

        job = Job.from_state(get_test_job(JOB_COMPLETED))
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
    def test_state__no_final_state__non_terminal(self):
        """
        test that a job outputs the correct state and that the update is not cached
        """
        # ee2_state is fully populated (includes job_input, no job_output)
        job = create_job_from_ee2(JOB_CREATED, mode="state")
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job.final_state)
        state = job.state()
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job.final_state)
        self.assertEqual(state["status"], "created")

        expected_state = create_state_from_ee2(JOB_CREATED, mode="state")
        self.assertEqual(state, expected_state)

    def test_state__final_state_exists__terminal(self):
        """
        test that a completed job emits its state without calling check_job
        """
        job = create_job_from_ee2(JOB_COMPLETED, mode="state")
        self.assertTrue(job.was_terminal)
        self.assertIsNotNone(job.final_state)
        expected = create_state_from_ee2(JOB_COMPLETED, mode="state")
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
        job = create_job_from_ee2(JOB_CREATED, mode="attributes")
        self.assertFalse(job.was_terminal)
        self.assertIsNone(job.final_state)
        with self.assertRaisesRegex(Exception, "Unable to fetch info for job"):
            job.state()

    def test_state__returns_none(self):
        def mock_state(self, state=None):
            return None

        job = create_job_from_ee2(JOB_CREATED, mode="attributes")
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
        job = create_job_from_ee2(JOB_CREATED, mode="attributes")
        self.assertFalse(job.was_terminal)
        job.update_state(None)
        self.assertFalse(job.was_terminal)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_job_update__invalid_job_id(self):
        """
        ensure that an ee2 state with a different job ID cannot be used to update a job
        """
        job = create_job_from_ee2(JOB_RUNNING, mode="state")
        expected = create_state_from_ee2(JOB_RUNNING, mode="state")
        self.assertEqual(job.state(), expected)

        # try to update it with the job state from a different job
        with self.assertRaisesRegex(ValueError, "Job ID mismatch in update_state"):
            job.update_state(get_test_job(JOB_COMPLETED))

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
            job = create_job_from_ee2(job_id, mode="attributes")
            self.assertEqual(job.is_finished(), is_finished[job_id])

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
        self.assertRegex(
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

        with self.assertRaisesRegex(Exception, "Unable to fetch parameters for job"):
            job.parameters()

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_parent_children__ok(self):
        child_jobs = [
            create_job_from_ee2(job_id, mode="attributes") for job_id in BATCH_CHILDREN
        ]
        parent_job = Job.from_state(
            create_state_from_ee2(BATCH_PARENT, mode="state"),
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
        parent_state = create_state_from_ee2(BATCH_PARENT, mode="state")
        with self.assertRaisesRegex(
            ValueError,
            "Must supply children when setting children of batch job parent"
        ):
            Job.from_state(parent_state)

        child_jobs = [create_job_from_ee2(job_id, mode="attributes") for job_id in BATCH_CHILDREN][1:]
        with self.assertRaisesRegex(ValueError, "Child job id mismatch"):
            Job.from_state(
                parent_state,
                children=child_jobs,
            )

    def test_get_viewer_params__active(self):
        for job_id in ACTIVE_JOBS:
            if job_id == BATCH_PARENT:
                continue
            job = create_job_from_ee2(job_id, mode="attributes")
            state = create_state_from_ee2(job_id, mode="state")
            out = job.get_viewer_params(state)
            self.assertIsNone(out)

    def test_get_viewer_params__finished(self):
        for job_id in FINISHED_JOBS:
            job = create_job_from_ee2(job_id, mode="attributes")
            state = create_state_from_ee2(job_id, mode="state")
            out = job.get_viewer_params(state)
            self.assertEqual(get_widget_info(job_id), out)

    def test_get_viewer_params__batch_parent(self):
        """
        do batch parent separately
        since it requires passing in child jobs
        """
        state = create_state_from_ee2(BATCH_PARENT, mode="state")
        batch_children = [
            create_job_from_ee2(job_id, mode="state") for job_id in BATCH_CHILDREN
        ]

        job = create_job_from_ee2(
            BATCH_PARENT, mode="attributes", children=batch_children
        )
        out = job.get_viewer_params(state)
        self.assertIsNone(out)
