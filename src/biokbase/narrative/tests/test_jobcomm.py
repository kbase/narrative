"""Tests of the JobComm class."""

# disable warnings about accessing the JobComm's _comm and _jm attributes
# ruff: noqa: SLF001

import copy
import itertools
import re
from threading import Timer
from typing import Any
from unittest import mock

import pytest
from biokbase.narrative.exception_util import (
    JobRequestException,
    transform_job_exception,
)
from biokbase.narrative.jobs.jobcomm import (
    CELLS_NOT_PROVIDED_ERR,
    INVALID_REQUEST_ERR,
    MESSAGE_TYPE,
    MISSING_REQUEST_TYPE_ERR,
    ONE_INPUT_TYPE_ONLY_ERR,
    PARAM,
    JobComm,
    JobRequest,
)
from biokbase.narrative.jobs.jobmanager import (
    JOB_NOT_BATCH_ERR,
    JOB_NOT_REG_ERR,
    JOBS_MISSING_ERR,
    JobManager,
)
from biokbase.narrative.tests.generate_test_results import (
    ALL_RESPONSE_DATA,
    JOBS_BY_CELL_ID,
    TEST_CELL_ID_LIST,
    TEST_CELL_IDs,
)
from biokbase.narrative.tests.job_test_constants import (
    ALL_JOBS,
    BAD_JOB_ID,
    BAD_JOB_ID_2,
    BAD_JOBS,
    BATCH_COMPLETED,
    BATCH_ERROR_RETRIED,
    BATCH_PARENT,
    BATCH_PARENT_CHILDREN,
    BATCH_RETRY_RUNNING,
    BATCH_TERMINATED_RETRIED,
    CLIENTS,
    JOB_COMPLETED,
    JOB_CREATED,
    JOB_NOT_FOUND,
    JOB_RUNNING,
    JOB_TERMINATED,
    MAX_LOG_LINES,
    REFRESH_STATE,
    generate_error,
)
from biokbase.narrative.tests.narrative_mock.mockclients import (
    MockClients,
    generate_ee2_error,
    get_failing_mock_client,
    get_mock_client,
)
from biokbase.narrative.tests.util import make_comm_msg, make_job_request, validate_job_state

APP_NAME = "The Best App in the World"

NO_JOBS_MAPPING = {
    "jobs": {},
    "mapping": {
        "a": set(),
        "b": set(),
        "c": set(),
    },
}

BATCH_ID = PARAM["BATCH_ID"]
JOB_ID = PARAM["JOB_ID"]
JOB_ID_LIST = PARAM["JOB_ID_LIST"]
CELL_ID_LIST = PARAM["CELL_ID_LIST"]

CANCEL = MESSAGE_TYPE["CANCEL"]
CELL_JOB_STATUS = MESSAGE_TYPE["CELL_JOB_STATUS"]
ERROR = MESSAGE_TYPE["ERROR"]
INFO = MESSAGE_TYPE["INFO"]
LOGS = MESSAGE_TYPE["LOGS"]
RETRY = MESSAGE_TYPE["RETRY"]
START_UPDATE = MESSAGE_TYPE["START_UPDATE"]
STATUS = MESSAGE_TYPE["STATUS"]
STATUS_ALL = MESSAGE_TYPE["STATUS_ALL"]
STOP_UPDATE = MESSAGE_TYPE["STOP_UPDATE"]

LOG_LINES = [{"is_error": 0, "line": f"This is line {i}"} for i in range(MAX_LOG_LINES)]


# Fixture to set and unset environment variable
@pytest.fixture(autouse=True)
def _set_env_var(monkeypatch, job_test_wsname: str) -> None:
    """Set the KB_WORKSPACE_ID env var for all job comm tests."""
    # Set the environment variable; monkey patch automatically removes it afterwards
    monkeypatch.setenv("KB_WORKSPACE_ID", job_test_wsname)


def check_error_message(
    job_comm: JobComm, req: JobRequest | dict[str, Any] | str, err: Exception
) -> None:
    """Check the response when no input was submitted with a query.

    :param job_comm: job comm object
    :type job_comm: JobComm
    :param req: the JobRequest, dictionary, or string passed when throwing the error
    :type req: JobRequest | dict[str, Any] | str
    :param err: the error object produced; it will contain
        request: the input that generated the error
        source: the request that was called
        extra_params
        name: the type of exception
        message: the error message
    :type err: Exception
    """
    if isinstance(req, JobRequest):
        request = req.rq_data
        source = req.request_type
    elif isinstance(req, dict):
        request = req["content"]["data"]
        source = req["content"]["data"]["request_type"]
    elif isinstance(req, str):
        request = req
        source = req

    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "request": request,
            "source": source,
            "name": type(err).__name__,
            "message": str(err),
        },
    }


def check_job_id_list__no_jobs(job_comm: JobComm, request_type: str) -> None:
    """Check a JobComm function with a job_id_list containing no jobs."""
    job_id_list = [None, ""]
    req_dict = make_comm_msg(request_type, job_id_list)
    req = make_job_request(request_type, job_id_list)
    err = JobRequestException(JOBS_MISSING_ERR, job_id_list)

    # using handler
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._handle_comm_message(req_dict)
    check_error_message(job_comm, req_dict, err)

    # run directly
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._msg_map[request_type](req)


def check_job_id_list__dne_jobs(
    job_comm: JobComm, request_type: str, response_type: str | None = None
) -> None:
    """Check a JobComm function with a job_id_list containing invalid jobs."""
    job_id_list = [None, "", JOB_NOT_FOUND, JOB_NOT_FOUND, BAD_JOB_ID]
    expected_output = {
        {"job_id": job_id, "error": generate_error(job_id, "not_found")}
        for job_id in job_id_list
        if job_id
    }
    req_dict = make_comm_msg(request_type, job_id_list)
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": response_type if response_type else request_type,
        "content": expected_output,
    }


def check_id_error(job_comm: JobComm, req_dict: dict[str, Any], err: Exception) -> None:
    """Check that the correct error is raised by handling a message."""
    job_comm._comm.clear_message_cache()
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._handle_comm_message(req_dict)
    check_error_message(job_comm, req_dict, err)


def check_job_id__no_job_test(job_comm: JobComm, request_type: str, job_id: str | None) -> None:
    """Check that the correct error is raised with no job provided."""
    job_comm._comm.clear_message_cache()
    req_dict = make_comm_msg(request_type, {JOB_ID: job_id})
    req = make_job_request(request_type, {JOB_ID: job_id})
    err = JobRequestException(JOBS_MISSING_ERR, [job_id])
    check_id_error(job_comm, req_dict, err)

    # run directly
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._msg_map[request_type](req)


def check_job_id__dne_test(job_comm: JobComm, request_type: str) -> None:
    """Check that the correct error is raised with a job that does not exist."""
    req_dict = make_comm_msg(request_type, {JOB_ID: JOB_NOT_FOUND})
    err = JobRequestException(JOB_NOT_REG_ERR, JOB_NOT_FOUND)
    check_id_error(job_comm, req_dict, err)


def check_batch_id__no_job_test(job_comm: JobComm, request_type: str, job_id: str | None) -> None:
    """Check that the correct error is raised with no batch job provided."""
    req_dict = make_comm_msg(request_type, {BATCH_ID: job_id})
    err = JobRequestException(JOB_NOT_REG_ERR, job_id)
    check_id_error(job_comm, req_dict, err)


def check_batch_id__dne_test(job_comm: JobComm, request_type: str) -> None:
    """Check that the correct error is raised with a batch job that does not exist."""
    req_dict = make_comm_msg(request_type, {BATCH_ID: JOB_NOT_FOUND})
    err = JobRequestException(JOB_NOT_REG_ERR, JOB_NOT_FOUND)
    check_id_error(job_comm, req_dict, err)


def check_batch_id__not_batch_test(job_comm: JobComm, request_type: str) -> None:
    """Check that the correct error is raised with a batch job that is not a batch job."""
    req_dict = make_comm_msg(request_type, {BATCH_ID: BATCH_COMPLETED})
    err = JobRequestException(JOB_NOT_BATCH_ERR, BATCH_COMPLETED)
    check_id_error(job_comm, req_dict, err)


@mock.patch(CLIENTS, get_mock_client)
def check_job_info_results(
    job_comm: JobComm, job_args: dict[str, Any] | list[str], job_id_list: list[str]
) -> None:
    req_dict = make_comm_msg(INFO, job_args)
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    expected = {job_id: ALL_RESPONSE_DATA[INFO][job_id] for job_id in job_id_list}
    assert msg == {
        "msg_type": INFO,
        "content": expected,
    }


@mock.patch(CLIENTS, get_mock_client)
def check_job_output_states(
    job_comm: JobComm,
    output_states: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
    request_type: str = STATUS,
    response_type: str = STATUS,
    ok_states: list[str] | None = None,
    error_states: list[str] | None = None,
) -> None:
    """Check the job output states are correct.

    Handle any request that returns a dictionary of job state objects; this
    includes STATUS, CANCEL, START_UPDATE, STOP_UPDATE, and more.
    The output of the query is verified against the stored job states.

    :param output_states: output [if query has already been run] (opt)
    :param request_type: (opt) defaults to STATUS
    :param response_type: (opt) defaults to STATUS
    :param params: params for the comm message (opt)
    :param ok_states: list of job IDs expected to be in the output
    :param error_states: list of job IDs expected to return a not found error
    """
    if not params:
        params = {}
    if not ok_states:
        ok_states = []
    if not error_states:
        error_states = []

    if output_states is None:
        req_dict = make_comm_msg(request_type, params)
        output_states = job_comm._handle_comm_message(req_dict)

    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": response_type,
        "content": output_states,
    }

    for job_id, state in output_states.items():
        assert ALL_RESPONSE_DATA[STATUS][job_id] == state
        if job_id in ok_states:
            validate_job_state(state)
        else:
            # every valid job ID should be in either error_states or ok_states
            assert job_id in error_states


@mock.patch(CLIENTS, get_mock_client)
def check_retry_jobs(
    job_comm: JobComm, job_args: dict[str, Any] | list[str], job_id_list: list[str]
) -> None:
    """Check the result of running a 'retry_jobs' command."""
    req_dict = make_comm_msg(RETRY, job_args)
    expected = {job_id: ALL_RESPONSE_DATA[RETRY][job_id] for job_id in job_id_list if job_id}
    retry_data = job_comm._handle_comm_message(req_dict)
    assert expected == retry_data
    retry_msg = job_comm._comm.last_message
    assert retry_msg == {
        "msg_type": RETRY,
        "content": expected,
    }


# ---------------------
# Send comms methods
# ---------------------


def test_send_comm_msg_ok(job_comm: JobComm) -> None:
    job_comm.send_comm_message("some_msg", {"foo": "bar"})
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": "some_msg",
        "content": {"foo": "bar"},
    }


def test_send_error_msg__JobRequest(job_comm: JobComm) -> None:
    req = make_job_request("bar", "aeaeae")
    job_comm.send_error_message(req, {"extra": "field"})
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "source": "bar",
            "extra": "field",
            "request": req.rq_data,
        },
    }


def test_send_error_msg__dict(job_comm: JobComm) -> None:
    req_dict = make_comm_msg("bar", "aeaeae")
    job_comm.send_error_message(req_dict, {"extra": "field"})
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "source": "bar",
            "extra": "field",
            "request": req_dict["content"]["data"],
        },
    }


def test_send_error_msg__None(job_comm: JobComm) -> None:
    job_comm.send_error_message(None, {"extra": "field"})
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "source": None,
            "extra": "field",
            "request": None,
        },
    }


def test_send_error_msg__str(job_comm: JobComm) -> None:
    source = "test_jobcomm"
    job_comm.send_error_message(source, {"extra": "field"})
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "source": source,
            "extra": "field",
            "request": source,
        },
    }


# ---------------------
# Requests
# ---------------------


@mock.patch(CLIENTS, get_mock_client)
def test_req_no_inputs__succeed(job_comm: JobComm) -> None:
    req_dict = make_comm_msg(STATUS_ALL, None)
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    assert msg["msg_type"] == STATUS_ALL


def test_req_no_inputs__fail(job_comm: JobComm) -> None:
    functions = [
        CANCEL,
        INFO,
        LOGS,
        RETRY,
        START_UPDATE,
        STATUS,
        STOP_UPDATE,
    ]

    for msg_type in functions:
        req_dict = make_comm_msg(msg_type, None)
        err = JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)
        with pytest.raises(type(err), match=str(err)):
            job_comm._handle_comm_message(req_dict)
        check_error_message(job_comm, req_dict, err)


def test_req_multiple_inputs__fail(job_comm: JobComm) -> None:
    functions = [
        CANCEL,
        INFO,
        LOGS,
        RETRY,
        STATUS,
    ]

    for msg_type in functions:
        req_dict = make_comm_msg(msg_type, {"job_id": "something", "batch_id": "another_thing"})
        err = JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)
        with pytest.raises(type(err), match=str(err)):
            job_comm._handle_comm_message(req_dict)
        check_error_message(job_comm, req_dict, err)


# ---------------------
# Start job status loop
# ---------------------


@mock.patch(CLIENTS, get_mock_client)
def test_start_stop_job_status_loop(job_comm: JobComm) -> None:
    assert job_comm._running_lookup_loop is False
    assert job_comm._lookup_timer is None

    job_comm.start_job_status_loop()
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": STATUS_ALL,
        "content": {
            job_id: ALL_RESPONSE_DATA[STATUS][job_id]
            for job_id in REFRESH_STATE
            if REFRESH_STATE[job_id]
        },
    }

    assert job_comm._running_lookup_loop is True
    assert isinstance(job_comm._lookup_timer, Timer)

    job_comm.stop_job_status_loop()
    assert job_comm._running_lookup_loop is False
    assert job_comm._lookup_timer is None


@mock.patch(CLIENTS, get_mock_client)
def test_start_job_status_loop__cell_ids(job_comm: JobComm) -> None:
    cell_ids = list(JOBS_BY_CELL_ID.keys())
    # Iterate through all combinations of cell IDs
    for combo_len in range(len(cell_ids) + 1):
        for combo in itertools.combinations(cell_ids, combo_len):
            job_comm._jm._running_jobs = {}
            assert job_comm._running_lookup_loop is False
            assert job_comm._lookup_timer is None

            job_comm.start_job_status_loop(init_jobs=True, cell_list=list(combo))
            msg = job_comm._comm.last_message

            exp_job_ids = [
                job_id
                for cell_id, job_ids in JOBS_BY_CELL_ID.items()
                for job_id in job_ids
                if cell_id in list(combo) and REFRESH_STATE[job_id]
            ]
            exp_msg = {
                "msg_type": "job_status_all",
                "content": {job_id: ALL_RESPONSE_DATA[STATUS][job_id] for job_id in exp_job_ids},
            }
            assert exp_msg == msg

            if exp_job_ids:
                assert job_comm._running_lookup_loop
                assert isinstance(job_comm._lookup_timer, Timer)

                job_comm.stop_job_status_loop()

                assert job_comm._running_lookup_loop is False
                assert job_comm._lookup_timer is None


@mock.patch(CLIENTS, get_mock_client)
def test_start_job_status_loop__initialise_jobs_error(job_comm: JobComm) -> None:
    # patch all client calls to return clients that return errors
    with mock.patch(CLIENTS, side_effect=get_failing_mock_client):
        # check_workspace_jobs throws an EEServerError
        job_comm.start_job_status_loop(init_jobs=True)
        assert job_comm._comm.last_message == {
            "msg_type": ERROR,
            "content": {
                "code": -32000,
                "error": "Unable to get initial jobs list",
                "message": "check_workspace_jobs failed",
                "name": "JSONRPCError",
                "request": "jc.start_job_status_loop",
                "source": "ee2",
            },
        }
        assert job_comm._running_lookup_loop is False


@mock.patch(CLIENTS, get_mock_client)
def test_start_job_status_loop__no_jobs_stop_loop(job_comm: JobComm) -> None:
    # reset the job manager so there are no jobs
    job_comm._jm._running_jobs = {}
    job_comm._jm._jobs_by_cell_id = {}
    job_comm._jm = JobManager()
    assert job_comm._jm._running_jobs == {}
    # this will trigger a call to get_all_job_states
    # a message containing all jobs (i.e. {}) will be sent out
    # when it returns 0 jobs, the JobComm will run stop_job_status_loop
    job_comm.start_job_status_loop()
    assert job_comm._running_lookup_loop is False
    assert job_comm._lookup_timer is None
    assert job_comm._comm.last_message == {"msg_type": STATUS_ALL, "content": {}}


# ---------------------
# Lookup all job states
# ---------------------


def test_get_all_job_states__ok(job_comm: JobComm) -> None:
    check_job_output_states(
        job_comm, request_type=STATUS_ALL, response_type=STATUS_ALL, ok_states=ALL_JOBS
    )


# -----------------------
# Lookup single job state
# -----------------------


def test_get_job_state__1_ok(job_comm: JobComm) -> None:
    output_states = job_comm.get_job_state(JOB_COMPLETED)
    check_job_output_states(job_comm, output_states=output_states, ok_states=[JOB_COMPLETED])


def test_get_job_state__no_job(job_comm: JobComm) -> None:
    with pytest.raises(JobRequestException, match=re.escape(f"{JOBS_MISSING_ERR}: {[None]}")):
        job_comm.get_job_state(None)  # type: ignore[arg-type]


# -----------------------
# Lookup select job states
# -----------------------


def test_get_job_states__job_id__ok(job_comm: JobComm) -> None:
    check_job_output_states(job_comm, params={JOB_ID: JOB_COMPLETED}, ok_states=[JOB_COMPLETED])


def test_get_job_states__job_id__dne(job_comm: JobComm) -> None:
    check_job_output_states(job_comm, params={JOB_ID: JOB_NOT_FOUND}, error_states=[JOB_NOT_FOUND])


@pytest.mark.parametrize("job_id", [None, ""])
def test_get_job_states__job_id__invalid(job_comm: JobComm, job_id: str | None) -> None:
    check_job_id__no_job_test(job_comm, STATUS, job_id)


def test_get_job_states__job_id_list__1_ok(job_comm: JobComm) -> None:
    job_id_list = [JOB_COMPLETED]
    check_job_output_states(job_comm, params={JOB_ID_LIST: job_id_list}, ok_states=job_id_list)


def test_get_job_states__job_id_list__2_ok(job_comm: JobComm) -> None:
    job_id_list = [JOB_COMPLETED, BATCH_PARENT]
    check_job_output_states(job_comm, params={JOB_ID_LIST: job_id_list}, ok_states=job_id_list)


def test_get_job_states__job_id_list__ok_bad(job_comm: JobComm) -> None:
    job_id_list = [BAD_JOB_ID, JOB_COMPLETED]
    check_job_output_states(
        job_comm,
        params={JOB_ID_LIST: job_id_list},
        ok_states=[JOB_COMPLETED],
        error_states=[BAD_JOB_ID],
    )


def test_get_job_states__job_id_list__no_jobs(job_comm: JobComm) -> None:
    check_job_id_list__no_jobs(job_comm, STATUS)


def test_get_job_states__batch_id__ok(job_comm: JobComm) -> None:
    check_job_output_states(
        job_comm,
        request_type=STATUS,
        params={BATCH_ID: BATCH_PARENT},
        ok_states=BATCH_PARENT_CHILDREN,
    )


def test_get_job_states__batch_id__dne(job_comm: JobComm) -> None:
    check_batch_id__dne_test(job_comm, STATUS)


@pytest.mark.parametrize("job_id", [None, ""])
def test_get_job_states__batch_id__no_job(job_comm: JobComm, job_id: str | None) -> None:
    check_batch_id__no_job_test(job_comm, STATUS, job_id)


def test_get_job_states__batch_id__not_batch(job_comm: JobComm) -> None:
    check_batch_id__not_batch_test(job_comm, STATUS)


def test_get_job_states__job_id_list__ee2_error(job_comm: JobComm, active_jobs: list[str]) -> None:
    exc = Exception("Test exception")
    exc_message = str(exc)

    expected = {job_id: copy.deepcopy(ALL_RESPONSE_DATA[STATUS][job_id]) for job_id in ALL_JOBS}
    for job_id in active_jobs:
        # add in the ee2_error message
        expected[job_id]["error"] = exc_message

    def mock_check_jobs(params):
        raise exc

    job_id_list = ALL_JOBS
    req_dict = make_comm_msg(STATUS, job_id_list)

    with mock.patch.object(MockClients, "check_jobs", side_effect=mock_check_jobs):
        job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message

    assert msg == {
        "msg_type": STATUS,
        "content": expected,
    }


# -----------------------
# get cell job states
# -----------------------


def test_get_job_states_by_cell_id__cell_id_list_none(job_comm: JobComm) -> None:
    cell_id_list = None
    req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list})
    err = JobRequestException(CELLS_NOT_PROVIDED_ERR)
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._handle_comm_message(req_dict)
    check_error_message(job_comm, req_dict, err)


def test_get_job_states_by_cell_id__empty_cell_id_list(job_comm: JobComm) -> None:
    cell_id_list = []
    req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list})
    err = JobRequestException(CELLS_NOT_PROVIDED_ERR)
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._handle_comm_message(req_dict)
    check_error_message(job_comm, req_dict, err)


@mock.patch(CLIENTS, get_mock_client)
def test_get_job_states_by_cell_id__invalid_cell_id_list(job_comm: JobComm) -> None:
    cell_id_list = ["a", "b", "c"]
    req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list})
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": CELL_JOB_STATUS,
        "content": NO_JOBS_MAPPING,
    }


@mock.patch(CLIENTS, get_mock_client)
def test_get_job_states_by_cell_id__invalid_cell_id_list_req(job_comm: JobComm) -> None:
    cell_id_list = ["a", "b", "c"]
    req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list})
    result = job_comm._handle_comm_message(req_dict)
    assert result == NO_JOBS_MAPPING
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": CELL_JOB_STATUS,
        "content": NO_JOBS_MAPPING,
    }


@mock.patch(CLIENTS, get_mock_client)
def test_get_job_states_by_cell_id__all_results(job_comm: JobComm) -> None:
    cell_id_list = TEST_CELL_ID_LIST
    expected_ids = ALL_JOBS
    expected_states = {job_id: ALL_RESPONSE_DATA[STATUS][job_id] for job_id in expected_ids}

    req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list})
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    assert set(msg.keys()) == {"msg_type", "content"}
    assert msg["msg_type"] == CELL_JOB_STATUS
    assert msg["content"]["jobs"] == expected_states
    assert set(cell_id_list) == set(msg["content"]["mapping"].keys())
    for key in msg["content"]["mapping"]:
        assert set(TEST_CELL_IDs[key]) == set(msg["content"]["mapping"][key])


# -----------------------
# Lookup job info
# -----------------------


def test_get_job_info__job_id__ok(job_comm: JobComm) -> None:
    check_job_info_results(job_comm, {JOB_ID: JOB_COMPLETED}, [JOB_COMPLETED])


def test_get_job_info__job_id__dne(job_comm: JobComm) -> None:
    check_job_info_results(job_comm, {JOB_ID: JOB_NOT_FOUND}, [JOB_NOT_FOUND])


@pytest.mark.parametrize("job_id", [None, ""])
def test_get_job_info__job_id__invalid(job_comm: JobComm, job_id: str | None) -> None:
    check_job_id__no_job_test(job_comm, INFO, job_id)


def test_get_job_info__job_id_list__ok(job_comm: JobComm) -> None:
    check_job_info_results(job_comm, ALL_JOBS, ALL_JOBS)


def test_get_job_info__job_id_list__no_jobs(job_comm: JobComm) -> None:
    check_job_id_list__no_jobs(job_comm, INFO)


def test_get_job_info__job_id_list__ok_bad(job_comm: JobComm) -> None:
    job_id_list = [JOB_COMPLETED, JOB_NOT_FOUND]
    check_job_info_results(job_comm, job_id_list, job_id_list)


def test_get_job_info__batch_id__ok(job_comm: JobComm) -> None:
    job_id = BATCH_PARENT
    check_job_info_results(job_comm, {BATCH_ID: job_id}, BATCH_PARENT_CHILDREN)


@pytest.mark.parametrize("job_id", [None, ""])
def test_get_job_info__batch_id__no_job(job_comm: JobComm, job_id: str | None) -> None:
    check_batch_id__no_job_test(job_comm, INFO, job_id)


def test_get_job_info__batch_id__dne(job_comm: JobComm) -> None:
    check_batch_id__dne_test(job_comm, INFO)


def test_get_job_info__batch_id__not_batch(job_comm: JobComm) -> None:
    check_batch_id__not_batch_test(job_comm, INFO)


# ------------
# Cancel list of jobs
# ------------


def test_cancel_jobs__job_id__ok(job_comm: JobComm) -> None:
    check_job_output_states(
        job_comm, request_type=CANCEL, params={JOB_ID: JOB_RUNNING}, ok_states=[JOB_RUNNING]
    )


def test_cancel_jobs__job_id__dne(job_comm: JobComm) -> None:
    check_job_output_states(
        job_comm,
        request_type=CANCEL,
        params={JOB_ID: JOB_NOT_FOUND},
        error_states=[JOB_NOT_FOUND],
    )


@pytest.mark.parametrize("job_id", [None, ""])
def test_cancel_jobs__job_id__invalid(job_comm: JobComm, job_id: str | None) -> None:
    check_job_id__no_job_test(job_comm, CANCEL, job_id)

    req_dict = make_comm_msg(CANCEL, {JOB_ID: job_id})
    err = JobRequestException(JOBS_MISSING_ERR, [job_id])
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._handle_comm_message(req_dict)
    check_error_message(job_comm, req_dict, err)


def test_cancel_jobs__job_id_list__1_ok(job_comm: JobComm) -> None:
    job_id_list = [JOB_RUNNING]
    check_job_output_states(
        job_comm,
        request_type=CANCEL,
        params={JOB_ID_LIST: job_id_list},
        ok_states=job_id_list,
    )


def test_cancel_jobs__job_id_list__2_ok(job_comm: JobComm) -> None:
    job_id_list = [JOB_CREATED, JOB_RUNNING, None]
    check_job_output_states(
        job_comm,
        request_type=CANCEL,
        params={JOB_ID_LIST: job_id_list},
        ok_states=[JOB_CREATED, JOB_RUNNING],
    )


def test_cancel_jobs__job_id_list__no_jobs(job_comm: JobComm) -> None:
    job_id_list = None
    req_dict = make_comm_msg(CANCEL, {JOB_ID_LIST: job_id_list})
    err = JobRequestException(JOBS_MISSING_ERR, job_id_list)
    with pytest.raises(type(err), match=str(err)):
        job_comm._handle_comm_message(req_dict)

    job_id_list = [None, ""]
    req_dict = make_comm_msg(CANCEL, job_id_list)
    err = JobRequestException(JOBS_MISSING_ERR, job_id_list)
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._handle_comm_message(req_dict)
    check_error_message(job_comm, req_dict, err)


def test_cancel_jobs__job_id_list__ok_bad(job_comm: JobComm) -> None:
    job_id_list = [
        None,
        JOB_NOT_FOUND,
        JOB_NOT_FOUND,
        "",
        JOB_RUNNING,
        JOB_CREATED,
        BAD_JOB_ID,
    ]
    check_job_output_states(
        job_comm,
        request_type=CANCEL,
        params={JOB_ID_LIST: job_id_list},
        ok_states=[JOB_CREATED, JOB_RUNNING],
        error_states=[JOB_NOT_FOUND, BAD_JOB_ID],
    )


def test_cancel_jobs__job_id_list__all_bad_jobs(job_comm: JobComm) -> None:
    job_id_list = [None, "", JOB_NOT_FOUND, JOB_NOT_FOUND, BAD_JOB_ID]
    check_job_output_states(
        job_comm,
        request_type=CANCEL,
        params={JOB_ID_LIST: job_id_list},
        error_states=[JOB_NOT_FOUND, BAD_JOB_ID],
    )


@mock.patch(CLIENTS, get_mock_client)
def test_cancel_jobs__job_id_list__failure(job_comm: JobComm) -> None:
    # the mock client will throw an error with BATCH_RETRY_RUNNING
    job_id_list = [JOB_RUNNING, BATCH_RETRY_RUNNING]
    req_dict = make_comm_msg(CANCEL, job_id_list)
    output = job_comm._handle_comm_message(req_dict)

    expected = {
        JOB_RUNNING: ALL_RESPONSE_DATA[STATUS][JOB_RUNNING],
        BATCH_RETRY_RUNNING: {
            **ALL_RESPONSE_DATA[STATUS][BATCH_RETRY_RUNNING],
            "error": CANCEL + " failed",
        },
    }

    assert output == expected
    assert job_comm._comm.last_message == {
        "msg_type": STATUS,
        "content": expected,
    }


# ------------
# Retry list of jobs
# ------------


def test_retry_jobs__job_id__ok(job_comm: JobComm) -> None:
    job_id_list = [BATCH_TERMINATED_RETRIED]
    check_retry_jobs(job_comm, {JOB_ID: BATCH_TERMINATED_RETRIED}, job_id_list)


def test_retry_jobs__job_id__dne(job_comm: JobComm) -> None:
    job_id_list = [JOB_NOT_FOUND]
    check_retry_jobs(job_comm, {JOB_ID: JOB_NOT_FOUND}, job_id_list)


@pytest.mark.parametrize("job_id", [None, ""])
def test_retry_jobs__job_id__invalid(job_comm: JobComm, job_id: str | None) -> None:
    check_job_id__no_job_test(job_comm, RETRY, job_id)


def test_retry_jobs__job_id_list__2_ok(job_comm: JobComm) -> None:
    job_id_list = [BATCH_TERMINATED_RETRIED, BATCH_ERROR_RETRIED, None]
    check_retry_jobs(job_comm, job_id_list, job_id_list)


def test_retry_jobs__job_id_list__no_jobs(job_comm: JobComm) -> None:
    check_job_id_list__no_jobs(job_comm, RETRY)


def test_retry_jobs__job_id_list__ok_bad(job_comm: JobComm) -> None:
    job_id_list = [BATCH_TERMINATED_RETRIED, BAD_JOB_ID, BAD_JOB_ID_2]
    check_retry_jobs(job_comm, job_id_list, job_id_list)


def test_retry_jobs__job_id_list__all_jobs(job_comm: JobComm) -> None:
    job_id_list = ALL_JOBS + BAD_JOBS
    for job_id in job_id_list:
        check_retry_jobs(job_comm, {JOB_ID: job_id}, [job_id])
    check_retry_jobs(job_comm, job_id_list, job_id_list)


def test_retry_jobs__job_id_list__all_bad_jobs(job_comm: JobComm) -> None:
    job_id_list = [BAD_JOB_ID, BAD_JOB_ID_2]
    check_retry_jobs(job_comm, job_id_list, job_id_list)


def test_retry_jobs__job_id_list__failure(job_comm: JobComm) -> None:
    job_id_list = [JOB_COMPLETED, JOB_CREATED, JOB_TERMINATED]
    req_dict = make_comm_msg(RETRY, job_id_list)
    err = transform_job_exception(generate_ee2_error(RETRY), "Unable to retry job(s)")

    # patch all client calls to return clients that return errors
    with mock.patch(CLIENTS, side_effect=get_failing_mock_client):
        with pytest.raises(type(err), match=re.escape(str(err))):
            job_comm._handle_comm_message(req_dict)

        msg = job_comm._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "request": req_dict["content"]["data"],
                "source": RETRY,
                "name": "JSONRPCError",
                "error": "Unable to retry job(s)",
                "code": -32000,
                "message": RETRY + " failed",
            },
        }


# -----------------
# Fetching job logs
# -----------------


@mock.patch(CLIENTS, get_mock_client)
def test_get_job_logs__job_id__ok(job_comm: JobComm) -> None:
    job_id = JOB_COMPLETED
    lines_available = MAX_LOG_LINES  # just for convenience if the mock changes
    # first_line, num_lines, latest, number of lines in output
    cases = [
        (0, 1, False, 1),
        (-100, 1, False, 1),
        (5, 2, False, 2),
        (0, 5000, False, lines_available),
        (0, None, False, lines_available),
        (8, None, False, 2),
        (0, 1, True, 1),
        (-100, 1, True, 1),
        (5, 2, True, 2),
        (0, 5000, True, lines_available),
        (0, None, True, lines_available),
        (8, None, True, lines_available),
    ]
    for c in cases:
        content = {
            PARAM["FIRST_LINE"]: c[0],
            PARAM["NUM_LINES"]: c[1],
            PARAM["LATEST"]: c[2],
        }
        req_dict = make_comm_msg(LOGS, [job_id], content)
        job_comm._handle_comm_message(req_dict)
        msg = job_comm._comm.last_message
        assert msg["msg_type"] == LOGS
        msg_content = msg["content"][job_id]
        assert job_id == msg_content["job_id"]
        assert msg_content["batch_id"] is None
        assert lines_available == msg_content["max_lines"]
        assert c[3] == len(msg_content["lines"])
        assert c[2] == msg_content["latest"]
        first = 0 if c[1] is None and c[2] is True else c[0]
        n_lines = c[1] if c[1] else lines_available
        if first < 0:
            first = 0
        if c[2]:
            first = lines_available - min(n_lines, lines_available)

        assert first == msg_content["first"]
        for idx, line in enumerate(msg_content["lines"]):
            assert str(first + idx) in line["line"]
            assert line["is_error"] == 0


@mock.patch(CLIENTS, get_mock_client)
def test_get_job_logs__job_id__failure(job_comm: JobComm) -> None:
    job_id = JOB_CREATED
    req_dict = make_comm_msg(LOGS, job_id)
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": LOGS,
        "content": {
            JOB_CREATED: {
                "job_id": JOB_CREATED,
                "batch_id": None,
                "error": "Cannot find job log with id: " + JOB_CREATED,
            }
        },
    }


def test_get_job_logs__job_id__no_job(job_comm: JobComm) -> None:
    job_id = None
    req_dict = make_comm_msg(LOGS, {JOB_ID: job_id})
    err = JobRequestException(JOBS_MISSING_ERR, [job_id])
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._handle_comm_message(req_dict)
    check_error_message(job_comm, req_dict, err)


@mock.patch(CLIENTS, get_mock_client)
def test_get_job_logs__job_id__job_dne(job_comm: JobComm) -> None:
    req_dict = make_comm_msg(LOGS, JOB_NOT_FOUND)
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": LOGS,
        "content": {
            JOB_NOT_FOUND: {
                "job_id": JOB_NOT_FOUND,
                "error": generate_error(JOB_NOT_FOUND, "not_found"),
            }
        },
    }


@mock.patch(CLIENTS, get_mock_client)
def test_get_job_logs__job_id_list__one_ok_one_bad_one_fetch_fail(job_comm: JobComm) -> None:
    req_dict = make_comm_msg(LOGS, [JOB_COMPLETED, JOB_CREATED, JOB_NOT_FOUND])
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    assert msg["msg_type"] == LOGS

    assert msg["content"] == {
        JOB_COMPLETED: {
            "job_id": JOB_COMPLETED,
            "first": 0,
            "max_lines": MAX_LOG_LINES,
            "latest": False,
            "batch_id": None,
            "lines": LOG_LINES,
        },
        JOB_CREATED: {
            "job_id": JOB_CREATED,
            "batch_id": None,
            "error": generate_error(JOB_CREATED, "no_logs"),
        },
        JOB_NOT_FOUND: {
            "job_id": JOB_NOT_FOUND,
            "error": generate_error(JOB_NOT_FOUND, "not_found"),
        },
    }


@mock.patch(CLIENTS, get_mock_client)
def test_get_job_logs__job_id_list__one_ok_one_bad_one_fetch_fail__with_params(
    job_comm: JobComm,
) -> None:
    num_lines = int(MAX_LOG_LINES / 5)
    first = MAX_LOG_LINES - num_lines
    lines = LOG_LINES[-num_lines::]

    req_dict = make_comm_msg(
        LOGS,
        [JOB_COMPLETED, JOB_CREATED, JOB_NOT_FOUND],
        content={"num_lines": num_lines, "latest": True},
    )
    job_comm._handle_comm_message(req_dict)
    msg = job_comm._comm.last_message
    assert msg["msg_type"] == LOGS

    assert msg["content"] == {
        JOB_COMPLETED: {
            "job_id": JOB_COMPLETED,
            "first": first,
            "max_lines": MAX_LOG_LINES,
            "latest": True,
            "batch_id": None,
            "lines": lines,
        },
        JOB_CREATED: {
            "job_id": JOB_CREATED,
            "batch_id": None,
            "error": generate_error(JOB_CREATED, "no_logs"),
        },
        JOB_NOT_FOUND: {
            "job_id": JOB_NOT_FOUND,
            "error": generate_error(JOB_NOT_FOUND, "not_found"),
        },
    }


# ------------------------
# Modify job update
# ------------------------


@mock.patch(CLIENTS, get_mock_client)
def test_modify_job_update__job_id_list__start__ok(job_comm: JobComm) -> None:
    job_id_list = [JOB_COMPLETED, JOB_CREATED, BATCH_PARENT]
    check_job_output_states(
        job_comm,
        request_type=START_UPDATE,
        params={JOB_ID_LIST: job_id_list},
        ok_states=[JOB_COMPLETED, JOB_CREATED, BATCH_PARENT],
    )
    for job_id in ALL_JOBS:
        if job_id in job_id_list:
            assert job_comm._jm._running_jobs[job_id]["refresh"]
        else:
            assert job_comm._jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
    assert isinstance(job_comm._lookup_timer, Timer)
    assert job_comm._running_lookup_loop


@mock.patch(CLIENTS, get_mock_client)
def test_modify_job_update__job_id_list__stop__ok(job_comm: JobComm) -> None:
    job_id_list = [JOB_COMPLETED, JOB_CREATED, BATCH_PARENT]
    check_job_output_states(
        job_comm,
        request_type=STOP_UPDATE,
        params={JOB_ID_LIST: job_id_list},
        ok_states=[JOB_COMPLETED, JOB_CREATED, BATCH_PARENT],
    )
    for job_id in ALL_JOBS:
        if job_id in job_id_list:
            assert job_comm._jm._running_jobs[job_id]["refresh"] is False
        else:
            assert job_comm._jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
    assert job_comm._lookup_timer is None
    assert job_comm._running_lookup_loop is False


def test_modify_job_update__job_id_list__no_jobs(job_comm: JobComm) -> None:
    job_id_list = [None]
    req_dict = make_comm_msg(START_UPDATE, job_id_list)  # type: ignore[arg-type]
    err = JobRequestException(JOBS_MISSING_ERR, job_id_list)
    with pytest.raises(type(err), match=re.escape(str(err))):
        job_comm._handle_comm_message(req_dict)
    check_error_message(job_comm, req_dict, err)


def test_modify_job_update__job_id_list__stop__ok_bad_job(job_comm: JobComm) -> None:
    job_id_list = [JOB_COMPLETED, JOB_CREATED]
    check_job_output_states(
        job_comm,
        request_type=STOP_UPDATE,
        params={JOB_ID_LIST: [JOB_COMPLETED, JOB_CREATED, JOB_NOT_FOUND]},
        ok_states=[JOB_COMPLETED, JOB_CREATED],
        error_states=[JOB_NOT_FOUND],
    )

    for job_id in ALL_JOBS:
        if job_id in job_id_list:
            assert job_comm._jm._running_jobs[job_id]["refresh"] is False
        else:
            assert job_comm._jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
    assert job_comm._lookup_timer is None
    assert job_comm._running_lookup_loop is False


@mock.patch(CLIENTS, get_mock_client)
def test_modify_job_update__job_id_list__stop__loop_still_running(job_comm: JobComm) -> None:
    """Lookup loop should not get stopped."""
    job_comm.start_job_status_loop()

    job_id_list = [JOB_COMPLETED, BATCH_PARENT, JOB_RUNNING]
    check_job_output_states(
        job_comm,
        request_type=STOP_UPDATE,
        params={JOB_ID_LIST: job_id_list},
        ok_states=job_id_list,
    )
    for job_id in ALL_JOBS:
        if job_id in job_id_list:
            assert job_comm._jm._running_jobs[job_id]["refresh"] is False
        else:
            assert job_comm._jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
    assert isinstance(job_comm._lookup_timer, Timer)
    assert job_comm._running_lookup_loop


# ------------------------
# Modify job update batch
# ------------------------


def test_modify_job_update__batch_id__start__ok(job_comm: JobComm) -> None:
    batch_id = BATCH_PARENT
    job_id_list = BATCH_PARENT_CHILDREN
    check_job_output_states(
        job_comm,
        request_type=START_UPDATE,
        params={BATCH_ID: batch_id},
        ok_states=job_id_list,
    )
    for job_id in ALL_JOBS:
        if job_id in job_id_list:
            assert job_comm._jm._running_jobs[job_id]["refresh"]
        else:
            assert job_comm._jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
    assert isinstance(job_comm._lookup_timer, Timer)
    assert job_comm._running_lookup_loop


def test_modify_job_update__batch_id__stop__ok(job_comm: JobComm) -> None:
    batch_id = BATCH_PARENT
    job_id_list = BATCH_PARENT_CHILDREN
    check_job_output_states(
        job_comm,
        request_type=STOP_UPDATE,
        params={BATCH_ID: batch_id},
        ok_states=job_id_list,
    )
    for job_id in ALL_JOBS:
        if job_id in job_id_list:
            assert job_comm._jm._running_jobs[job_id]["refresh"] is False
        else:
            assert job_comm._jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
    assert job_comm._lookup_timer is None
    assert job_comm._running_lookup_loop is False


@pytest.mark.parametrize("job_id", [None, ""])
@pytest.mark.parametrize("cmd", [START_UPDATE, STOP_UPDATE])
def test_modify_job_update__batch_id__no_job(
    job_comm: JobComm, job_id: str | None, cmd: str
) -> None:
    check_batch_id__no_job_test(job_comm, cmd, job_id)


@pytest.mark.parametrize("cmd", [START_UPDATE, STOP_UPDATE])
def test_modify_job_update__batch_id__bad_job(job_comm: JobComm, cmd: str) -> None:
    check_batch_id__dne_test(job_comm, cmd)


@pytest.mark.parametrize("cmd", [START_UPDATE, STOP_UPDATE])
def test_modify_job_update__batch_id__not_batch(job_comm: JobComm, cmd: str) -> None:
    check_batch_id__not_batch_test(job_comm, cmd)


# ------------------------
# Handle bad comm messages
# ------------------------


def test_handle_comm_message_invalid_request(job_comm: JobComm) -> None:
    with pytest.raises(JobRequestException, match=INVALID_REQUEST_ERR):
        job_comm._handle_comm_message({"foo": "bar"})


def test_handle_comm_message_missing_request(job_comm: JobComm) -> None:
    with pytest.raises(JobRequestException, match=MISSING_REQUEST_TYPE_ERR):
        job_comm._handle_comm_message({"content": {"data": {"request_type": None}}})


def test_handle_comm_message_unknown(job_comm: JobComm) -> None:
    unknown = "NotAJobRequest"
    with pytest.raises(
        JobRequestException,
        match=re.escape(f"Unknown KBaseJobs message '{unknown}'"),
    ):
        job_comm._handle_comm_message({"content": {"data": {"request_type": unknown}}})
