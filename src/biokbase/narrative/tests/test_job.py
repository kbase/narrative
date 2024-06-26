"""Tests of the Job object."""

import copy
import itertools
import re
import sys
import unittest
from contextlib import contextmanager
from io import StringIO
from unittest import mock

import pytest
from biokbase.narrative.app_util import map_inputs_from_job, map_outputs_from_state
from biokbase.narrative.common.exceptions import ServerError
from biokbase.narrative.jobs.job import (
    ALL_ATTRS,
    COMPLETED_STATUS,
    EXCLUDED_JOB_STATE_FIELDS,
    JOB_ATTR_DEFAULTS,
    JOB_ATTRS,
    Job,
)
from biokbase.narrative.jobs.jobmanager import JOB_INIT_EXCLUDED_JOB_STATE_FIELDS
from biokbase.narrative.jobs.specmanager import SpecManager
from biokbase.narrative.tests.generate_test_results import JOBS_BY_CELL_ID
from biokbase.narrative.tests.job_test_constants import (
    ACTIVE_JOBS,
    ALL_JOBS,
    BATCH_CHILDREN,
    BATCH_PARENT,
    BATCH_RETRY_RUNNING,
    CLIENTS,
    JOB_COMPLETED,
    JOB_CREATED,
    JOB_RUNNING,
    JOB_TERMINAL_STATE,
    JOB_TERMINATED,
    MAX_LOG_LINES,
    TERMINAL_JOBS,
    get_test_job,
)
from biokbase.narrative.tests.narrative_mock.mockclients import (
    MockClients,
    assert_obj_method_called,
    get_failing_mock_client,
    get_mock_client,
)


@contextmanager
def capture_stdout():
    new_out, new_err = StringIO(), StringIO()
    old_out, old_err = sys.stdout, sys.stderr
    try:
        sys.stdout, sys.stderr = new_out, new_err
        yield sys.stdout, sys.stderr
    finally:
        sys.stdout, sys.stderr = old_out, old_err


with mock.patch(CLIENTS, get_mock_client):
    sm = SpecManager()
    TEST_SPECS = copy.deepcopy(sm.app_specs)


def get_test_spec(tag, app_id):
    return copy.deepcopy(TEST_SPECS[tag][app_id])


CLIENTS = "biokbase.narrative.jobs.job.clients.get"
CHILD_ID_MISMATCH = "Child job id mismatch"


def create_job_from_ee2(job_id, extra_data=None, children=None):
    state = get_test_job(job_id)
    return Job(state, extra_data=extra_data, children=children)


def create_state_from_ee2(job_id, exclude_fields=JOB_INIT_EXCLUDED_JOB_STATE_FIELDS):
    """Create the output of job.refresh_state() from raw job data"""
    state = get_test_job(job_id)

    for attr in exclude_fields:
        if attr in state:
            del state[attr]

    return state


def create_attrs_from_ee2(job_id):
    state = get_test_job(job_id)

    job_input = state.get("job_input", {})
    narr_cell_info = job_input.get("narrative_cell_info", {})
    return {
        "app_id": job_input.get("app_id", JOB_ATTR_DEFAULTS["app_id"]),
        "app_version": job_input.get("service_ver", JOB_ATTR_DEFAULTS["app_version"]),
        "batch_id": (
            state.get("job_id")
            if state.get("batch_job", JOB_ATTR_DEFAULTS["batch_job"])
            else state.get("batch_id", JOB_ATTR_DEFAULTS["batch_id"])
        ),
        "batch_job": state.get("batch_job", JOB_ATTR_DEFAULTS["batch_job"]),
        "cell_id": narr_cell_info.get("cell_id", JOB_ATTR_DEFAULTS["cell_id"]),
        "child_jobs": state.get("child_jobs", JOB_ATTR_DEFAULTS["child_jobs"]),
        "job_id": state.get("job_id"),
        "params": job_input.get("params", JOB_ATTR_DEFAULTS["params"]),
        "retry_ids": state.get("retry_ids", JOB_ATTR_DEFAULTS["retry_ids"]),
        "retry_parent": state.get("retry_parent", JOB_ATTR_DEFAULTS["retry_parent"]),
        "run_id": narr_cell_info.get("run_id", JOB_ATTR_DEFAULTS["run_id"]),
        "tag": narr_cell_info.get("tag", JOB_ATTR_DEFAULTS["tag"]),
        "user": state.get("user", JOB_ATTR_DEFAULTS["user"]),
        "wsid": state.get("wsid", JOB_ATTR_DEFAULTS["wsid"]),
    }


def get_widget_info(job_id):
    state = get_test_job(job_id)
    if state.get("status") != COMPLETED_STATUS:
        return None
    job_input = state.get("job_input", {})
    app_id = job_input.get("app_id", JOB_ATTR_DEFAULTS["app_id"])
    params = job_input.get("params", JOB_ATTR_DEFAULTS["params"])
    tag = job_input.get("narrative_cell_info", {}).get("tag", JOB_ATTR_DEFAULTS["tag"])
    spec = get_test_spec(tag, app_id)
    with mock.patch("biokbase.narrative.app_util.clients.get", get_mock_client):
        output_widget, widget_params = map_outputs_from_state(
            state,
            map_inputs_from_job(params, spec),
            spec,
        )
    return {
        "name": output_widget,
        "tag": tag,
        "params": widget_params,
    }


@mock.patch(CLIENTS, get_mock_client)
def get_batch_family_jobs(return_list=False):
    """As invoked in appmanager's run_app_batch, i.e.,
    with from_job_id(s)
    """
    child_jobs = Job.from_job_ids(BATCH_CHILDREN)
    batch_job = Job.from_job_id(BATCH_PARENT, children=child_jobs)

    if return_list:
        return [batch_job, *child_jobs]
    return {
        BATCH_PARENT: batch_job,
        **{job.job_id: job for job in child_jobs},
    }


def get_all_jobs(return_list=False):
    # do batch family because
    # batch container job needs to be
    # instantiated with child instances
    jobs = get_batch_family_jobs()
    for job_id in ALL_JOBS:
        if job_id not in jobs:
            jobs[job_id] = create_job_from_ee2(job_id)
    if return_list:
        return [jobs.values()]
    return jobs


class JobTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None
        cls.NEW_RETRY_IDS = ["hello", "goodbye"]
        cls.NEW_CHILD_JOBS = ["cerulean", "magenta"]

    def check_jobs_equal(self, jobl, jobr):
        assert jobl._acc_state == jobr._acc_state

        with mock.patch(CLIENTS, get_mock_client):
            assert jobl.refresh_state() == jobr.refresh_state()

        for attr in JOB_ATTRS:
            assert getattr(jobl, attr), getattr(jobr == attr)

    def check_job_attrs_custom(self, job, exp_attr=None):
        if not exp_attr:
            exp_attr = {}
        attr = copy.deepcopy(JOB_ATTR_DEFAULTS)
        attr.update(exp_attr)
        with mock.patch(CLIENTS, get_mock_client):
            for name, value in attr.items():
                assert value == getattr(job, name)

    def check_job_attrs(self, job, job_id, exp_attrs=None, skip_state=False):
        # TODO check _acc_state full vs pruned, extra_data
        if not exp_attrs:
            exp_attrs = {}

        # Check state() if no special values expected
        if not exp_attrs and not skip_state:
            state = create_state_from_ee2(job_id)
            with mock.patch(CLIENTS, get_mock_client):
                assert state == job.refresh_state()

        attrs = create_attrs_from_ee2(job_id)
        attrs.update(exp_attrs)

        for name, value in attrs.items():
            if name in ["child_jobs", "retry_ids"]:
                # job.child_jobs and job.retry_ids may query EE2
                with mock.patch(CLIENTS, get_mock_client):
                    assert value == getattr(job, name)
            else:
                with assert_obj_method_called(MockClients, "check_job", call_status=False):
                    assert value == getattr(job, name)

    def test_job_init__error_no_job_id(self):
        with pytest.raises(ValueError, match="Cannot create a job without a job ID!"):
            Job({"params": {}, "app_id": "this/that"})

    def test_job_init__from_job_id(self):
        """Test job initialisation, as is done by run_app"""
        for job_id in ALL_JOBS:
            if job_id == BATCH_PARENT:
                continue

            with mock.patch(CLIENTS, get_mock_client):
                job = Job.from_job_id(job_id)
            self.check_job_attrs(job, job_id)

    def test_job_init__from_job_ids(self):
        job_ids = ALL_JOBS.copy()
        job_ids.remove(BATCH_PARENT)

        with mock.patch(CLIENTS, get_mock_client):
            jobs = Job.from_job_ids(job_ids)

        for job in jobs:
            self.check_job_attrs(job, job.job_id)

    def test_job_init__extra_state(self):
        """Test job initialisation as is done by run_legacy_batch_app"""
        app_id = "kb_BatchApp/run_batch"
        extra_data = {
            "batch_app": app_id,
            "batch_tag": None,
            "batch_size": 300,
        }

        for job_id in ALL_JOBS:
            if job_id == BATCH_PARENT:
                continue

            with mock.patch(CLIENTS, get_mock_client):
                batch_job = Job.from_job_id(
                    job_id,
                    extra_data=extra_data,
                )

            self.check_job_attrs(batch_job, job_id, {"extra_data": extra_data})

    def test_job_init__batch_family(self):
        """Test job initialization, as is done by run_app_batch"""
        batch_jobs = get_batch_family_jobs(return_list=False)

        for job_id, job in batch_jobs.items():
            self.check_job_attrs(job, job_id)

        batch_job = batch_jobs[BATCH_PARENT]
        assert batch_job.job_id == batch_job.batch_id

    def test_job_from_state__custom(self):
        """Test job initialisation with defaults being filled in
        TODO do a non-default?
        """
        params = [
            {
                "import_type": "FASTQ/FASTA",
                "name": "small.forward.fq",
            }
        ]
        test_job = {
            "user": "the_user",
            "job_input": {
                "params": params,
                "service_ver": "42",
                "app_id": "This/app",
            },
            "job_id": "0123456789abcdef",
        }

        expected = {
            "app_id": "This/app",
            "app_version": "42",
            "batch_id": JOB_ATTR_DEFAULTS["batch_id"],
            "cell_id": JOB_ATTR_DEFAULTS["cell_id"],
            "extra_data": None,
            "job_id": "0123456789abcdef",
            "params": params,
            "run_id": JOB_ATTR_DEFAULTS["run_id"],
            "status": JOB_ATTR_DEFAULTS["status"],
            "tag": JOB_ATTR_DEFAULTS["tag"],
            "user": "the_user",
        }

        job = Job(test_job)
        self.check_job_attrs_custom(job, expected)

    def test_set_job_attrs(self):
        """Test that job attributes cannot be set directly"""
        job = create_job_from_ee2(JOB_COMPLETED)
        expected = create_state_from_ee2(JOB_COMPLETED)
        # job is completed so refresh_state will do nothing
        assert job.refresh_state() == expected

        for attr in ALL_ATTRS:
            with pytest.raises(
                AttributeError,
                match="Job attributes must be updated using the `update_state` method",
            ):
                setattr(job, attr, "BLAM!")

        # ensure nothing has changed
        assert job.refresh_state() == expected

    @mock.patch(CLIENTS, get_mock_client)
    def test_refresh_state__non_terminal(self):
        """Test that a job outputs the correct state"""
        # ee2_state is fully populated (includes job_input, no job_output)
        job = create_job_from_ee2(JOB_CREATED)
        assert not job.in_terminal_state()
        state = job.refresh_state()
        assert not job.in_terminal_state()
        assert state["status"] == "created"
        expected_state = create_state_from_ee2(JOB_CREATED)
        assert state == expected_state

    def test_refresh_state__terminal(self):
        """Test that a completed job emits its state without calling check_job"""
        job = create_job_from_ee2(JOB_COMPLETED)
        assert job.in_terminal_state()
        expected = create_state_from_ee2(JOB_COMPLETED)

        with assert_obj_method_called(MockClients, "check_job", call_status=False):
            state = job.refresh_state()
            assert state["status"] == "completed"
            assert state == expected

    @mock.patch(CLIENTS, get_failing_mock_client)
    def test_refresh_state__raise_exception(self):
        """Test that the correct exception is thrown if check_jobs cannot be called"""
        job = create_job_from_ee2(JOB_CREATED)
        assert not job.in_terminal_state()
        with pytest.raises(ServerError, match="check_jobs failed"):
            job.refresh_state()

    # TODO: improve this test
    def test_job_update__no_state(self):
        """Test that without a state object supplied, the job state is unchanged"""
        job = create_job_from_ee2(JOB_CREATED)
        job_copy = copy.deepcopy(job)
        assert job.cached_state() == job_copy.cached_state()

        # should fail with error 'state must be a dict'
        with pytest.raises(TypeError, match="state must be a dict"):
            job.update_state(None)
        assert job.cached_state() == job_copy.cached_state()

        job.update_state({})
        assert job.cached_state() == job_copy.cached_state()

        job.update_state({"wsid": "something or other"})
        assert job.cached_state() != job_copy.cached_state()
        assert job.wsid == "something or other"

    @mock.patch(CLIENTS, get_mock_client)
    def test_job_update__invalid_job_id(self):
        """Ensure that an ee2 state with a different job ID cannot be used to update a job"""
        job = create_job_from_ee2(JOB_RUNNING)
        expected = create_state_from_ee2(JOB_RUNNING)
        assert job.refresh_state() == expected

        # try to update it with the job state from a different job
        with pytest.raises(ValueError, match="Job ID mismatch in update_state"):
            job.update_state(get_test_job(JOB_COMPLETED))

    @mock.patch(CLIENTS, get_mock_client)
    def test_job_info(self):
        job = create_job_from_ee2(JOB_COMPLETED)

        job_data = get_test_job(JOB_COMPLETED)
        app_id = job_data.get("job_input", {}).get("app_id")
        tag = job_data.get("job_input", {}).get("narrative_cell_info", {}).get("tag")
        status = job_data["status"]
        job_spec = get_test_spec(tag, app_id)
        app_name = job_spec.get("info", {}).get("name")
        version = job_spec.get("info", {}).get("ver")
        info_str = (
            f"App name (id): {app_name} ({app_id})\n"
            + f"Version: {version}\n"
            + f"Status: {status}\nInputs:\n------\n"
        )
        with capture_stdout() as (out, err):
            job.info()
            assert info_str in out.getvalue().strip()

    def test_repr(self):
        job = create_job_from_ee2(JOB_COMPLETED)
        job_str = job.__repr__()
        assert re.search(job_str, "KBase Narrative Job - " + job.job_id)

    @mock.patch(CLIENTS, get_mock_client)
    def test_repr_js(self):
        job = create_job_from_ee2(JOB_COMPLETED)
        js_out = job._repr_javascript_()
        assert isinstance(js_out, str)
        # spot check to make sure the core pieces are present. needs the
        # element.html part, job_id, and widget
        assert "element.html" in js_out
        assert job.job_id in js_out
        assert "kbaseNarrativeJobStatus" in js_out

    @mock.patch("biokbase.narrative.widgetmanager.WidgetManager.show_output_widget")
    @mock.patch(CLIENTS, get_mock_client)
    def test_show_output_widget(self, mock_method):
        mock_method.return_value = True
        job = Job(get_test_job(JOB_COMPLETED))
        assert job.show_output_widget()
        mock_method.assert_called_once()

    @mock.patch(CLIENTS, get_mock_client)
    def test_show_output_widget__incomplete_state(self):
        job = Job(get_test_job(JOB_CREATED))
        assert re.search("Job is incomplete! It has status 'created'", job.show_output_widget())

    @mock.patch(CLIENTS, get_mock_client)
    def test_log(self):
        # Things set up by the mock:
        # 1. There's 100 total log lines
        # 2. Each line has its line number embedded in it
        total_lines = MAX_LOG_LINES
        job = create_job_from_ee2(JOB_COMPLETED)
        logs = job.log()
        # we know there's MAX_LOG_LINES lines total, so roll with it that way.
        assert logs[0] == total_lines
        assert len(logs[1]) == total_lines
        for i in range(len(logs[1])):
            line = logs[1][i]
            assert "is_error" in line
            assert "line" in line
            assert str(i) in line["line"]
        # grab the last half
        offset = int(MAX_LOG_LINES / 2)
        logs = job.log(first_line=offset)
        assert logs[0] == total_lines
        assert len(logs[1]) == offset
        for i in range(total_lines - offset):
            assert str(i + offset) in logs[1][i]["line"]
        # grab a bite from the middle
        num_fetch = int(MAX_LOG_LINES / 5)
        logs = job.log(first_line=offset, num_lines=num_fetch)
        assert logs[0] == total_lines
        assert len(logs[1]) == num_fetch
        for i in range(num_fetch):
            assert str(i + offset) in logs[1][i]["line"]
        # should normalize negative numbers properly
        logs = job.log(first_line=-5)
        assert logs[0] == total_lines
        assert len(logs[1]) == total_lines
        logs = job.log(num_lines=-5)
        assert logs[0] == total_lines
        assert len(logs[1]) == 0

    @mock.patch(CLIENTS, get_mock_client)
    def test_parameters(self):
        """Test that a job returns the correct parameters"""
        job_state = get_test_job(JOB_COMPLETED)
        job_params = job_state.get("job_input", {}).get("params")
        assert job_params is not None
        job = Job(job_state)
        assert job.params is not None

        with assert_obj_method_called(MockClients, "check_job", call_status=False):
            params = job.parameters()
            assert params is not None
            assert params == job_params

    @mock.patch(CLIENTS, get_mock_client)
    def test_parameters__param_fetch_ok(self):
        """Test that a job can successfully retrieve parameters from ee2
        if they do not exist
        """
        job_state = get_test_job(JOB_CREATED)
        job_params = job_state.get("job_input", {}).get("params")
        assert job_params is not None

        # delete the job params from the input
        del job_state["job_input"]["params"]
        job = Job(job_state)
        assert job.params == JOB_ATTR_DEFAULTS["params"]

        with assert_obj_method_called(MockClients, "check_job", call_status=True):
            params = job.parameters()
            assert params == job_params

    @mock.patch(CLIENTS, get_failing_mock_client)
    def test_parameters__param_fetch_fail(self):
        """Test failure to retrieve job params data"""
        job_state = get_test_job(JOB_TERMINATED)
        del job_state["job_input"]["params"]
        job = Job(job_state)
        assert job.params == JOB_ATTR_DEFAULTS["params"]

        with pytest.raises(Exception, match="Unable to fetch parameters for job"):
            job.parameters()

    @mock.patch(CLIENTS, get_mock_client)
    def test_parent_children__ok(self):
        child_jobs = [Job.from_job_id(job_id) for job_id in BATCH_CHILDREN]
        parent_job = Job(
            create_state_from_ee2(BATCH_PARENT),
            children=child_jobs,
        )
        assert not parent_job.in_terminal_state()

        # Make all child jobs completed
        with mock.patch.object(
            MockClients,
            "check_job",
            mock.Mock(return_value={"status": COMPLETED_STATUS}),
        ):
            for child_job in child_jobs:
                child_job.refresh_state(force_refresh=True)
        assert parent_job.in_terminal_state()

    def test_parent_children__fail(self):
        parent_state = create_state_from_ee2(BATCH_PARENT)
        child_states = [create_state_from_ee2(job_id) for job_id in BATCH_CHILDREN]
        with pytest.raises(
            ValueError,
            match="Must supply children when setting children of batch job parent",
        ):
            Job(parent_state)

        child_jobs = [Job(child_state) for child_state in child_states]
        with pytest.raises(ValueError, match=CHILD_ID_MISMATCH):
            Job(
                parent_state,
                children=child_jobs[1:],
            )

        with pytest.raises(ValueError, match=CHILD_ID_MISMATCH):
            Job(
                parent_state,
                children=child_jobs * 2,
            )

        with pytest.raises(ValueError, match=CHILD_ID_MISMATCH):
            Job(
                parent_state,
                children=[*child_jobs, create_job_from_ee2(JOB_COMPLETED)],
            )

    def test_get_viewer_params__active(self):
        for job_id in ACTIVE_JOBS:
            if job_id == BATCH_PARENT:
                continue
            job = create_job_from_ee2(job_id)
            state = create_state_from_ee2(job_id)
            out = job.get_viewer_params(state)
            assert out is None

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_viewer_params__finished(self):
        for job_id in TERMINAL_JOBS:
            job = create_job_from_ee2(job_id)
            state = create_state_from_ee2(job_id)
            exp = get_widget_info(job_id)
            got = job.get_viewer_params(state)
            assert exp == got

    def test_get_viewer_params__batch_parent(self):
        """Do batch parent separately
        since it requires passing in child jobs
        """
        state = create_state_from_ee2(BATCH_PARENT)
        batch_children = [create_job_from_ee2(job_id) for job_id in BATCH_CHILDREN]

        job = create_job_from_ee2(BATCH_PARENT, children=batch_children)
        out = job.get_viewer_params(state)
        assert out is None

    @mock.patch(CLIENTS, get_mock_client)
    def test_query_job_states_single_job(self):
        for job_id in ALL_JOBS:
            exp = create_state_from_ee2(job_id, exclude_fields=JOB_INIT_EXCLUDED_JOB_STATE_FIELDS)
            got = Job.query_ee2_states([job_id], init=True)
            assert exp == got[job_id]

            exp = create_state_from_ee2(job_id, exclude_fields=EXCLUDED_JOB_STATE_FIELDS)
            got = Job.query_ee2_states([job_id], init=False)
            assert exp == got[job_id]

    @mock.patch(CLIENTS, get_mock_client)
    def test_query_job_states(self):
        states = Job.query_ee2_states(ALL_JOBS, init=True)
        for job_id, got in states.items():
            exp = create_state_from_ee2(job_id, exclude_fields=JOB_INIT_EXCLUDED_JOB_STATE_FIELDS)
            assert exp == got

        states = Job.query_ee2_states(ALL_JOBS, init=False)
        for job_id, got in states.items():
            exp = create_state_from_ee2(job_id, exclude_fields=EXCLUDED_JOB_STATE_FIELDS)
            assert exp == got

    def test_refresh_attrs__non_batch_active(self):
        """retry_ids should be refreshed"""
        job_id = JOB_CREATED
        job = create_job_from_ee2(job_id)
        self.check_job_attrs(job, job_id)

        def mock_check_job(self_, params):
            assert params["job_id"] == job_id
            return {"retry_ids": self.NEW_RETRY_IDS}

        with mock.patch.object(MockClients, "check_job", mock_check_job):
            self.check_job_attrs(job, job_id, {"retry_ids": self.NEW_RETRY_IDS})

    def test_refresh_attrs__non_batch_terminal(self):
        """retry_ids should be refreshed"""
        job_id = JOB_TERMINATED
        job = create_job_from_ee2(job_id)
        self.check_job_attrs(job, job_id)

        def mock_check_job(self_, params):
            assert params["job_id"] == job_id
            return {"retry_ids": self.NEW_RETRY_IDS}

        with mock.patch.object(MockClients, "check_job", mock_check_job):
            self.check_job_attrs(job, job_id, {"retry_ids": self.NEW_RETRY_IDS})

    def test_refresh_attrs__non_batch__is_retry(self):
        """Neither retry_ids/child_jobs should be refreshed"""
        job_id = BATCH_RETRY_RUNNING
        job = create_job_from_ee2(job_id)
        self.check_job_attrs(job, job_id)

        with assert_obj_method_called(MockClients, "check_job", call_status=False):
            self.check_job_attrs(job, job_id, skip_state=True)

    def test_refresh_attrs__batch(self):
        """child_jobs should be refreshed"""
        job_id = BATCH_PARENT
        job = get_batch_family_jobs()[job_id]
        self.check_job_attrs(job, job_id)

        def mock_check_job(self_, params):
            assert params["job_id"] == job_id
            return {"child_jobs": self.NEW_CHILD_JOBS}

        with mock.patch.object(MockClients, "check_job", mock_check_job):
            self.check_job_attrs(job, job_id, {"child_jobs": self.NEW_CHILD_JOBS})

    def test_in_terminal_state(self):
        all_jobs = get_all_jobs()

        for job_id, job in all_jobs.items():
            assert JOB_TERMINAL_STATE[job_id] == job.in_terminal_state()

    @mock.patch(CLIENTS, get_mock_client)
    def test_in_terminal_state__batch(self):
        batch_fam = get_batch_family_jobs(return_list=True)
        batch_job, child_jobs = batch_fam[0], batch_fam[1:]
        assert not batch_job.in_terminal_state()

        def mock_check_job(self_, params):
            assert params["job_id"] in BATCH_CHILDREN
            return {"status": COMPLETED_STATUS}

        with mock.patch.object(MockClients, "check_job", mock_check_job):
            for job in child_jobs:
                job.refresh_state(force_refresh=True)
        assert batch_job.in_terminal_state()

    def test_in_cells(self):
        all_jobs = get_all_jobs()
        cell_ids = list(JOBS_BY_CELL_ID.keys())
        # Iterate through all combinations of cell IDs
        for combo_len in range(len(cell_ids) + 1):
            for combo in itertools.combinations(cell_ids, combo_len):
                combo_list = list(combo)
                # Get jobs expected to be associated with the cell IDs
                exp_job_ids = [
                    job_id
                    for cell_id, job_ids in JOBS_BY_CELL_ID.items()
                    for job_id in job_ids
                    if cell_id in combo_list
                ]
                for job_id, job in all_jobs.items():
                    expected = job_id in exp_job_ids
                    assert job.in_cells(combo_list) == expected

    def test_in_cells__none(self):
        job = create_job_from_ee2(JOB_COMPLETED)
        with pytest.raises(ValueError, match="cell_ids cannot be None"):
            job.in_cells(None)

    def test_in_cells__batch__same_cell(self):
        batch_fam = get_batch_family_jobs(return_list=True)
        batch_job, child_jobs = batch_fam[0], batch_fam[1:]

        for job in child_jobs:
            job._acc_state["job_input"]["narrative_cell_info"]["cell_id"] = "hello"

        assert batch_job.in_cells(["hi", "hello"])

        assert not batch_job.in_cells(["goodbye", "hasta manana"])

    def test_in_cells__batch__diff_cells(self):
        batch_fam = get_batch_family_jobs(return_list=True)
        batch_job, child_jobs = batch_fam[0], batch_fam[1:]

        children_cell_ids = ["hi", "hello", "greetings"]
        for job, cell_id in zip(child_jobs, itertools.cycle(children_cell_ids)):
            job._acc_state["job_input"]["narrative_cell_info"]["cell_id"] = cell_id

        for cell_id in children_cell_ids:
            assert batch_job.in_cells([cell_id])
            assert batch_job.in_cells(["A", cell_id, "B"])
            assert batch_job.in_cells([cell_id, "B", "A"])
            assert batch_job.in_cells(["B", "A", cell_id])

        assert not batch_job.in_cells(["goodbye", "hasta manana"])

    def test_app_name(self):
        for job in get_all_jobs().values():
            if job.batch_job:
                assert job.app_name == "batch"
            else:
                test_spec = get_test_spec(job.tag, job.app_id)
                assert test_spec["info"]["name"] == job.app_name
