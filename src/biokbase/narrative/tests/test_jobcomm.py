import copy
import itertools
import os
import re
import unittest
from unittest import mock

import pytest

from biokbase.narrative.exception_util import (
    JobRequestException,
    NarrativeException,
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
    exc_to_msg,
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
    ACTIVE_JOBS,
    ALL_JOBS,
    BAD_JOB_ID,
    BAD_JOB_ID_2,
    BAD_JOBS,
    BATCH_CHILDREN,
    BATCH_COMPLETED,
    BATCH_ERROR_RETRIED,
    BATCH_PARENT,
    BATCH_PARENT_CHILDREN,
    BATCH_RETRY_RUNNING,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    CLIENTS,
    JOB_COMPLETED,
    JOB_CREATED,
    JOB_ERROR,
    JOB_NOT_FOUND,
    JOB_RUNNING,
    JOB_TERMINATED,
    MAX_LOG_LINES,
    REFRESH_STATE,
    generate_error,
)

from .narrative_mock.mockclients import (
    MockClients,
    generate_ee2_error,
    get_failing_mock_client,
    get_mock_client,
)
from .narrative_mock.mockcomm import MockComm
from .util import ConfigTests, validate_job_state

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


def make_comm_msg(
    msg_type: str, job_id_like, as_job_request: bool, content: dict = None
):
    if content is None:
        content = {}
    job_arguments = {}
    if isinstance(job_id_like, dict):
        job_arguments = job_id_like
    elif isinstance(job_id_like, list):
        job_arguments[JOB_ID_LIST] = job_id_like
    elif job_id_like:
        job_arguments[JOB_ID] = job_id_like

    msg = {
        "msg_id": "some_id",
        "content": {"data": {"request_type": msg_type, **job_arguments, **content}},
    }

    if as_job_request:
        return JobRequest(msg)
    return msg


class JobCommTestCase(unittest.TestCase):
    maxDiff = None

    @classmethod
    @mock.patch("biokbase.narrative.jobs.jobcomm.Comm", MockComm)
    @mock.patch(CLIENTS, get_mock_client)
    def setUpClass(cls):
        config = ConfigTests()
        os.environ["KB_WORKSPACE_ID"] = config.get("jobs", "job_test_wsname")
        cls.jm = JobManager()
        cls.jc = JobComm()
        cls.jc._comm = MockComm()

    @mock.patch(CLIENTS, get_mock_client)
    def setUp(self):
        self.jc._comm.clear_message_cache()
        self.jc._jm.initialize_jobs()
        self.jc.stop_job_status_loop()

    def check_error_message(self, req, err, extra_params=None):
        """
        response when no input was submitted with a query
        args:
            req: the JobRequest, dictionary, or string passed when throwing the error
            extra_params: any extra content
            err: the error object produced

        error message produced will contain:
            request: the input that generated the error
            source: the request that was called
            extra_params
            name: the type of exception
            message: the error message
        """
        if not extra_params:
            extra_params = {}

        if isinstance(req, JobRequest):
            request = req.rq_data
            source = req.request_type
        elif isinstance(req, dict):
            request = req["content"]["data"]
            source = req["content"]["data"]["request_type"]
        elif isinstance(req, str):
            request = req
            source = req

        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "request": request,
                "source": source,
                **extra_params,
                "name": type(err).__name__,
                "message": str(err),
            },
        }

    def check_job_id_list__no_jobs(self, request_type):
        job_id_list = [None, ""]
        req_dict = make_comm_msg(request_type, job_id_list, False)
        req = make_comm_msg(request_type, job_id_list, True)
        err = JobRequestException(JOBS_MISSING_ERR, job_id_list)

        # using handler
        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

        # run directly
        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._msg_map[request_type](req)

    def check_job_id_list__dne_jobs(self, request_type, response_type=None):
        job_id_list = [None, "", JOB_NOT_FOUND, JOB_NOT_FOUND, BAD_JOB_ID]
        expected_output = {
            {"job_id": job_id, "error": generate_error(job_id, "not_found")}
            for job_id in job_id_list
            if job_id
        }
        req_dict = make_comm_msg(request_type, job_id_list, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": response_type if response_type else request_type,
            "content": expected_output,
        }

    def check_id_error(self, req_dict, err):
        self.jc._comm.clear_message_cache()
        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    def check_job_id__no_job_test(self, request_type):
        for job_id in [None, ""]:
            self.jc._comm.clear_message_cache()
            req_dict = make_comm_msg(request_type, {JOB_ID: job_id}, False)
            req = make_comm_msg(request_type, {JOB_ID: job_id}, True)
            err = JobRequestException(JOBS_MISSING_ERR, [job_id])
            self.check_id_error(req_dict, err)

            # run directly
            with pytest.raises(type(err), match=re.escape(str(err))):
                self.jc._msg_map[request_type](req)

    def check_job_id__dne_test(self, request_type):
        req_dict = make_comm_msg(request_type, {JOB_ID: JOB_NOT_FOUND}, False)
        err = JobRequestException(JOB_NOT_REG_ERR, JOB_NOT_FOUND)
        self.check_id_error(req_dict, err)

    def check_batch_id__no_job_test(self, request_type):
        for job_id in [None, ""]:
            req_dict = make_comm_msg(request_type, {BATCH_ID: job_id}, False)
            err = JobRequestException(JOB_NOT_REG_ERR, job_id)
            self.check_id_error(req_dict, err)

    def check_batch_id__dne_test(self, request_type):
        req_dict = make_comm_msg(request_type, {BATCH_ID: JOB_NOT_FOUND}, False)
        err = JobRequestException(JOB_NOT_REG_ERR, JOB_NOT_FOUND)
        self.check_id_error(req_dict, err)

    def check_batch_id__not_batch_test(self, request_type):
        req_dict = make_comm_msg(request_type, {BATCH_ID: BATCH_COMPLETED}, False)
        err = JobRequestException(JOB_NOT_BATCH_ERR, BATCH_COMPLETED)
        self.check_id_error(req_dict, err)

    # ---------------------
    # Send comms methods
    # ---------------------
    def test_send_comm_msg_ok(self):
        self.jc.send_comm_message("some_msg", {"foo": "bar"})
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": "some_msg",
            "content": {"foo": "bar"},
        }
        self.jc._comm.clear_message_cache()

    def test_send_error_msg__JobRequest(self):
        req = make_comm_msg("bar", "aeaeae", True)
        self.jc.send_error_message(req, {"extra": "field"})
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "source": "bar",
                "extra": "field",
                "request": req.rq_data,
            },
        }

    def test_send_error_msg__dict(self):
        req_dict = make_comm_msg("bar", "aeaeae", False)
        self.jc.send_error_message(req_dict, {"extra": "field"})
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "source": "bar",
                "extra": "field",
                "request": req_dict["content"]["data"],
            },
        }

    def test_send_error_msg__None(self):
        self.jc.send_error_message(None, {"extra": "field"})
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "source": None,
                "extra": "field",
                "request": None,
            },
        }

    def test_send_error_msg__str(self):
        source = "test_jobcomm"
        self.jc.send_error_message(source, {"extra": "field"})
        msg = self.jc._comm.last_message
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
    def test_req_no_inputs__succeed(self):
        req_dict = make_comm_msg(STATUS_ALL, None, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        assert STATUS_ALL == msg["msg_type"]

    def test_req_no_inputs__fail(self):
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
            req_dict = make_comm_msg(msg_type, None, False)
            err = JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)
            with pytest.raises(type(err), match=str(err)):
                self.jc._handle_comm_message(req_dict)
            self.check_error_message(req_dict, err)

    def test_req_multiple_inputs__fail(self):
        functions = [
            CANCEL,
            INFO,
            LOGS,
            RETRY,
            STATUS,
        ]

        for msg_type in functions:
            req_dict = make_comm_msg(
                msg_type, {"job_id": "something", "batch_id": "another_thing"}, False
            )
            err = JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)
            with pytest.raises(type(err), match=str(err)):
                self.jc._handle_comm_message(req_dict)
            self.check_error_message(req_dict, err)

    # ---------------------
    # Start job status loop
    # ---------------------
    @mock.patch(CLIENTS, get_mock_client)
    def test_start_stop_job_status_loop(self):
        assert self.jc._running_lookup_loop is False
        assert self.jc._lookup_timer is None

        self.jc.start_job_status_loop()
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": STATUS_ALL,
            "content": {
                job_id: ALL_RESPONSE_DATA[STATUS][job_id]
                for job_id in REFRESH_STATE
                if REFRESH_STATE[job_id]
            },
        }

        assert self.jc._running_lookup_loop is True
        assert self.jc._lookup_timer is not None

        self.jc.stop_job_status_loop()
        assert self.jc._running_lookup_loop is False
        assert self.jc._lookup_timer is None

    @mock.patch(CLIENTS, get_mock_client)
    def test_start_job_status_loop__cell_ids(self):
        cell_ids = list(JOBS_BY_CELL_ID.keys())
        # Iterate through all combinations of cell IDs
        for combo_len in range(len(cell_ids) + 1):
            for combo in itertools.combinations(cell_ids, combo_len):
                self.jm._running_jobs = {}
                assert self.jc._running_lookup_loop is False
                assert self.jc._lookup_timer is None

                self.jc.start_job_status_loop(init_jobs=True, cell_list=list(combo))
                msg = self.jc._comm.last_message

                exp_job_ids = [
                    job_id
                    for cell_id, job_ids in JOBS_BY_CELL_ID.items()
                    for job_id in job_ids
                    if cell_id in list(combo) and REFRESH_STATE[job_id]
                ]
                exp_msg = {
                    "msg_type": "job_status_all",
                    "content": {
                        job_id: ALL_RESPONSE_DATA[STATUS][job_id]
                        for job_id in exp_job_ids
                    },
                }
                assert exp_msg == msg

                if exp_job_ids:
                    assert self.jc._running_lookup_loop
                    assert self.jc._lookup_timer

                    self.jc.stop_job_status_loop()

                    assert self.jc._running_lookup_loop is False
                    assert self.jc._lookup_timer is None

    @mock.patch(CLIENTS, get_failing_mock_client)
    def test_start_job_status_loop__initialise_jobs_error(self):
        # check_workspace_jobs throws an EEServerError
        self.jc.start_job_status_loop(init_jobs=True)
        assert self.jc._comm.last_message == {
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
        assert self.jc._running_lookup_loop is False

    @mock.patch(CLIENTS, get_mock_client)
    def test_start_job_status_loop__no_jobs_stop_loop(self):
        # reset the job manager so there are no jobs
        self.jm._running_jobs = {}
        self.jm._jobs_by_cell_id = {}
        self.jm = JobManager()
        assert self.jm._running_jobs == {}
        # this will trigger a call to get_all_job_states
        # a message containing all jobs (i.e. {}) will be sent out
        # when it returns 0 jobs, the JobComm will run stop_job_status_loop
        self.jc.start_job_status_loop()
        assert self.jc._running_lookup_loop is False
        assert self.jc._lookup_timer is None
        assert self.jc._comm.last_message == {"msg_type": STATUS_ALL, "content": {}}

    # ---------------------
    # Lookup all job states
    # ---------------------

    @mock.patch(CLIENTS, get_mock_client)
    def check_job_output_states(
        self,
        output_states=None,
        params=None,
        request_type=STATUS,
        response_type=STATUS,
        ok_states=None,
        error_states=None,
    ):
        """
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
            req_dict = make_comm_msg(request_type, params, False)
            output_states = self.jc._handle_comm_message(req_dict)

        msg = self.jc._comm.last_message
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
    def test_get_all_job_states__ok(self):
        self.check_job_output_states(
            request_type=STATUS_ALL, response_type=STATUS_ALL, ok_states=ALL_JOBS
        )

    # -----------------------
    # Lookup single job state
    # -----------------------
    def test_get_job_state__1_ok(self):
        output_states = self.jc.get_job_state(JOB_COMPLETED)
        self.check_job_output_states(
            output_states=output_states, ok_states=[JOB_COMPLETED]
        )

    def test_get_job_state__no_job(self):
        with pytest.raises(
            JobRequestException, match=re.escape(f"{JOBS_MISSING_ERR}: {[None]}")
        ):
            self.jc.get_job_state(None)

    # -----------------------
    # Lookup select job states
    # -----------------------
    def test_get_job_states__job_id__ok(self):
        self.check_job_output_states(
            params={JOB_ID: JOB_COMPLETED}, ok_states=[JOB_COMPLETED]
        )

    def test_get_job_states__job_id__dne(self):
        self.check_job_output_states(
            params={JOB_ID: JOB_NOT_FOUND}, error_states=[JOB_NOT_FOUND]
        )

    def test_get_job_states__job_id__invalid(self):
        self.check_job_id__no_job_test(STATUS)

    def test_get_job_states__job_id_list__1_ok(self):
        job_id_list = [JOB_COMPLETED]
        self.check_job_output_states(
            params={JOB_ID_LIST: job_id_list}, ok_states=job_id_list
        )

    def test_get_job_states__job_id_list__2_ok(self):
        job_id_list = [JOB_COMPLETED, BATCH_PARENT]
        self.check_job_output_states(
            params={JOB_ID_LIST: job_id_list}, ok_states=job_id_list
        )

    def test_get_job_states__job_id_list__ok_bad(self):
        job_id_list = [BAD_JOB_ID, JOB_COMPLETED]
        self.check_job_output_states(
            params={JOB_ID_LIST: job_id_list},
            ok_states=[JOB_COMPLETED],
            error_states=[BAD_JOB_ID],
        )

    def test_get_job_states__job_id_list__no_jobs(self):
        self.check_job_id_list__no_jobs(STATUS)

    def test_get_job_states__batch_id__ok(self):
        self.check_job_output_states(
            request_type=STATUS,
            params={BATCH_ID: BATCH_PARENT},
            ok_states=BATCH_PARENT_CHILDREN,
        )

    def test_get_job_states__batch_id__dne(self):
        self.check_batch_id__dne_test(STATUS)

    def test_get_job_states__batch_id__no_job(self):
        self.check_batch_id__no_job_test(STATUS)

    def test_get_job_states__batch_id__not_batch(self):
        self.check_batch_id__not_batch_test(STATUS)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states__job_id_list__ee2_error(self):
        exc = Exception("Test exception")
        exc_message = str(exc)

        expected = {
            job_id: copy.deepcopy(ALL_RESPONSE_DATA[STATUS][job_id])
            for job_id in ALL_JOBS
        }
        for job_id in ACTIVE_JOBS:
            # add in the ee2_error message
            expected[job_id]["error"] = exc_message

        def mock_check_jobs(params):
            raise exc

        job_id_list = ALL_JOBS
        req_dict = make_comm_msg(STATUS, job_id_list, False)

        with mock.patch.object(MockClients, "check_jobs", side_effect=mock_check_jobs):
            self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message

        assert msg == {
            "msg_type": STATUS,
            "content": expected,
        }

    # -----------------------
    # get cell job states
    # -----------------------
    def test_get_job_states_by_cell_id__cell_id_list_none(self):
        cell_id_list = None
        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        err = JobRequestException(CELLS_NOT_PROVIDED_ERR)
        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    def test_get_job_states_by_cell_id__empty_cell_id_list(self):
        cell_id_list = []
        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        err = JobRequestException(CELLS_NOT_PROVIDED_ERR)
        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__invalid_cell_id_list(self):
        cell_id_list = ["a", "b", "c"]
        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": CELL_JOB_STATUS,
            "content": NO_JOBS_MAPPING,
        }

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__invalid_cell_id_list_req(self):
        cell_id_list = ["a", "b", "c"]
        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        result = self.jc._handle_comm_message(req_dict)
        assert result == NO_JOBS_MAPPING
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": CELL_JOB_STATUS,
            "content": NO_JOBS_MAPPING,
        }

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__all_results(self):
        cell_id_list = TEST_CELL_ID_LIST
        expected_ids = ALL_JOBS
        expected_states = {
            job_id: ALL_RESPONSE_DATA[STATUS][job_id] for job_id in expected_ids
        }

        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        assert set(msg.keys()), set(["msg_type" == "content"])
        assert msg["msg_type"] == CELL_JOB_STATUS
        assert msg["content"]["jobs"] == expected_states
        assert set(cell_id_list) == set(msg["content"]["mapping"].keys())
        for key in msg["content"]["mapping"]:
            assert set(TEST_CELL_IDs[key]) == set(msg["content"]["mapping"][key])

    # -----------------------
    # Lookup job info
    # -----------------------

    @mock.patch(CLIENTS, get_mock_client)
    def check_job_info_results(self, job_args, job_id_list):
        req_dict = make_comm_msg(INFO, job_args, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        expected = {job_id: ALL_RESPONSE_DATA[INFO][job_id] for job_id in job_id_list}
        assert msg == {
            "msg_type": INFO,
            "content": expected,
        }

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_info__job_id__ok(self):
        self.check_job_info_results({JOB_ID: JOB_COMPLETED}, [JOB_COMPLETED])

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_info__job_id__dne(self):
        self.check_job_info_results({JOB_ID: JOB_NOT_FOUND}, [JOB_NOT_FOUND])

    def test_get_job_info__job_id__invalid(self):
        self.check_job_id__no_job_test(INFO)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_info__job_id_list__ok(self):
        self.check_job_info_results(ALL_JOBS, ALL_JOBS)

    def test_get_job_info__job_id_list__no_jobs(self):
        self.check_job_id_list__no_jobs(INFO)

    def test_get_job_info__job_id_list__ok_bad(self):
        job_id_list = [JOB_COMPLETED, JOB_NOT_FOUND]
        self.check_job_info_results(job_id_list, job_id_list)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_info__batch_id__ok(self):
        job_id = BATCH_PARENT
        self.check_job_info_results({BATCH_ID: job_id}, BATCH_PARENT_CHILDREN)

    def test_get_job_info__batch_id__no_job(self):
        self.check_batch_id__no_job_test(INFO)

    def test_get_job_info__batch_id__dne(self):
        self.check_batch_id__dne_test(INFO)

    def test_get_job_info__batch_id__not_batch(self):
        self.check_batch_id__not_batch_test(INFO)

    # ------------
    # Cancel list of jobs
    # ------------
    def test_cancel_jobs__job_id__ok(self):
        self.check_job_output_states(
            request_type=CANCEL, params={JOB_ID: JOB_RUNNING}, ok_states=[JOB_RUNNING]
        )

    def test_cancel_jobs__job_id__dne(self):
        self.check_job_output_states(
            request_type=CANCEL,
            params={JOB_ID: JOB_NOT_FOUND},
            error_states=[JOB_NOT_FOUND],
        )

    def test_cancel_jobs__job_id__invalid(self):
        self.check_job_id__no_job_test(CANCEL)
        job_id_list = [None, ""]
        for job_id in job_id_list:
            req_dict = make_comm_msg(CANCEL, {JOB_ID: job_id}, False)
            err = JobRequestException(JOBS_MISSING_ERR, [job_id])
            with pytest.raises(type(err), match=re.escape(str(err))):
                self.jc._handle_comm_message(req_dict)
            self.check_error_message(req_dict, err)

    def test_cancel_jobs__job_id_list__1_ok(self):
        job_id_list = [JOB_RUNNING]
        self.check_job_output_states(
            request_type=CANCEL,
            params={JOB_ID_LIST: job_id_list},
            ok_states=job_id_list,
        )

    def test_cancel_jobs__job_id_list__2_ok(self):
        job_id_list = [JOB_CREATED, JOB_RUNNING, None]
        self.check_job_output_states(
            request_type=CANCEL,
            params={JOB_ID_LIST: job_id_list},
            ok_states=[JOB_CREATED, JOB_RUNNING],
        )

    def test_cancel_jobs__job_id_list__no_jobs(self):
        job_id_list = None
        req_dict = make_comm_msg(CANCEL, {JOB_ID_LIST: job_id_list}, False)
        err = JobRequestException(JOBS_MISSING_ERR, job_id_list)
        with pytest.raises(type(err), match=str(err)):
            self.jc._handle_comm_message(req_dict)

        job_id_list = [None, ""]
        req_dict = make_comm_msg(CANCEL, job_id_list, False)
        err = JobRequestException(JOBS_MISSING_ERR, job_id_list)
        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    def test_cancel_jobs__job_id_list__ok_bad(self):
        job_id_list = [
            None,
            JOB_NOT_FOUND,
            JOB_NOT_FOUND,
            "",
            JOB_RUNNING,
            JOB_CREATED,
            BAD_JOB_ID,
        ]
        self.check_job_output_states(
            request_type=CANCEL,
            params={JOB_ID_LIST: job_id_list},
            ok_states=[JOB_CREATED, JOB_RUNNING],
            error_states=[JOB_NOT_FOUND, BAD_JOB_ID],
        )

    def test_cancel_jobs__job_id_list__all_bad_jobs(self):
        job_id_list = [None, "", JOB_NOT_FOUND, JOB_NOT_FOUND, BAD_JOB_ID]
        self.check_job_output_states(
            request_type=CANCEL,
            params={JOB_ID_LIST: job_id_list},
            error_states=[JOB_NOT_FOUND, BAD_JOB_ID],
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_cancel_jobs__job_id_list__failure(self):
        # the mock client will throw an error with BATCH_RETRY_RUNNING
        job_id_list = [JOB_RUNNING, BATCH_RETRY_RUNNING]
        req_dict = make_comm_msg(CANCEL, job_id_list, False)
        output = self.jc._handle_comm_message(req_dict)

        expected = {
            JOB_RUNNING: ALL_RESPONSE_DATA[STATUS][JOB_RUNNING],
            BATCH_RETRY_RUNNING: {
                **ALL_RESPONSE_DATA[STATUS][BATCH_RETRY_RUNNING],
                "error": CANCEL + " failed",
            },
        }

        assert output == expected
        assert self.jc._comm.last_message == {
            "msg_type": STATUS,
            "content": expected,
        }

    # ------------
    # Retry list of jobs
    # ------------

    @mock.patch(CLIENTS, get_mock_client)
    def check_retry_jobs(self, job_args, job_id_list):
        req_dict = make_comm_msg(RETRY, job_args, False)
        expected = {
            job_id: ALL_RESPONSE_DATA[RETRY][job_id] for job_id in job_id_list if job_id
        }
        retry_data = self.jc._handle_comm_message(req_dict)
        assert expected == retry_data
        retry_msg = self.jc._comm.pop_message()
        assert retry_msg == {
            "msg_type": RETRY,
            "content": expected,
        }

    def test_retry_jobs__job_id__ok(self):
        job_id_list = [BATCH_TERMINATED_RETRIED]
        self.check_retry_jobs({JOB_ID: BATCH_TERMINATED_RETRIED}, job_id_list)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__job_id__dne(self):
        job_id_list = [JOB_NOT_FOUND]
        self.check_retry_jobs({JOB_ID: JOB_NOT_FOUND}, job_id_list)

    def test_retry_jobs__job_id__invalid(self):
        self.check_job_id__no_job_test(RETRY)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__job_id_list__2_ok(self):
        job_id_list = [BATCH_TERMINATED_RETRIED, BATCH_ERROR_RETRIED, None]
        self.check_retry_jobs(job_id_list, job_id_list)

    def test_retry_jobs__job_id_list__no_jobs(self):
        self.check_job_id_list__no_jobs(RETRY)

    def test_retry_jobs__job_id_list__ok_bad(self):
        job_id_list = [BATCH_TERMINATED_RETRIED, BAD_JOB_ID, BAD_JOB_ID_2]
        self.check_retry_jobs(job_id_list, job_id_list)

    def test_retry_jobs__job_id_list__all_jobs(self):
        job_id_list = ALL_JOBS + BAD_JOBS
        for job_id in job_id_list:
            self.check_retry_jobs({JOB_ID: job_id}, [job_id])
        self.check_retry_jobs(job_id_list, job_id_list)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__job_id_list__all_bad_jobs(self):
        job_id_list = [BAD_JOB_ID, BAD_JOB_ID_2]
        self.check_retry_jobs(job_id_list, job_id_list)

    @mock.patch(CLIENTS, get_failing_mock_client)
    def test_retry_jobs__job_id_list__failure(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED, JOB_TERMINATED]
        req_dict = make_comm_msg(RETRY, job_id_list, False)
        err = transform_job_exception(
            generate_ee2_error(RETRY), "Unable to retry job(s)"
        )

        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)

        msg = self.jc._comm.last_message
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
    def test_get_job_logs__job_id__ok(self):
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
            req_dict = make_comm_msg(LOGS, [job_id], False, content)
            self.jc._handle_comm_message(req_dict)
            msg = self.jc._comm.last_message
            assert LOGS == msg["msg_type"]
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
                assert 0 == line["is_error"]

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_logs__job_id__failure(self):
        job_id = JOB_CREATED
        req_dict = make_comm_msg(LOGS, job_id, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
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

    def test_get_job_logs__job_id__no_job(self):
        job_id = None
        req_dict = make_comm_msg(LOGS, {JOB_ID: job_id}, False)
        err = JobRequestException(JOBS_MISSING_ERR, [job_id])
        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_logs__job_id__job_dne(self):
        req_dict = make_comm_msg(LOGS, JOB_NOT_FOUND, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
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
    def test_get_job_logs__job_id_list__one_ok_one_bad_one_fetch_fail(self):
        req_dict = make_comm_msg(
            LOGS, [JOB_COMPLETED, JOB_CREATED, JOB_NOT_FOUND], False
        )
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        assert LOGS == msg["msg_type"]

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
        self,
    ):
        num_lines = int(MAX_LOG_LINES / 5)
        first = MAX_LOG_LINES - num_lines
        lines = LOG_LINES[-num_lines::]

        req_dict = make_comm_msg(
            LOGS,
            [JOB_COMPLETED, JOB_CREATED, JOB_NOT_FOUND],
            False,
            content={"num_lines": num_lines, "latest": True},
        )
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        assert LOGS == msg["msg_type"]

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
    def test_modify_job_update__job_id_list__start__ok(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED, BATCH_PARENT]
        self.check_job_output_states(
            request_type=START_UPDATE,
            params={JOB_ID_LIST: job_id_list},
            ok_states=[JOB_COMPLETED, JOB_CREATED, BATCH_PARENT],
        )
        for job_id in ALL_JOBS:
            if job_id in job_id_list:
                assert self.jm._running_jobs[job_id]["refresh"]
            else:
                assert self.jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
        assert self.jc._lookup_timer
        assert self.jc._running_lookup_loop

    @mock.patch(CLIENTS, get_mock_client)
    def test_modify_job_update__job_id_list__stop__ok(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED, BATCH_PARENT]
        self.check_job_output_states(
            request_type=STOP_UPDATE,
            params={JOB_ID_LIST: job_id_list},
            ok_states=[JOB_COMPLETED, JOB_CREATED, BATCH_PARENT],
        )
        for job_id in ALL_JOBS:
            if job_id in job_id_list:
                assert self.jm._running_jobs[job_id]["refresh"] is False
            else:
                assert self.jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
        assert self.jc._lookup_timer is None
        assert self.jc._running_lookup_loop is False

    def test_modify_job_update__job_id_list__no_jobs(self):
        job_id_list = [None]
        req_dict = make_comm_msg(START_UPDATE, job_id_list, False)
        err = JobRequestException(JOBS_MISSING_ERR, job_id_list)
        with pytest.raises(type(err), match=re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    def test_modify_job_update__job_id_list__stop__ok_bad_job(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED]
        self.check_job_output_states(
            request_type=STOP_UPDATE,
            params={JOB_ID_LIST: [JOB_COMPLETED, JOB_CREATED, JOB_NOT_FOUND]},
            ok_states=[JOB_COMPLETED, JOB_CREATED],
            error_states=[JOB_NOT_FOUND],
        )

        for job_id in ALL_JOBS:
            if job_id in job_id_list:
                assert self.jm._running_jobs[job_id]["refresh"] is False
            else:
                assert self.jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
        assert self.jc._lookup_timer is None
        assert self.jc._running_lookup_loop is False

    @mock.patch(CLIENTS, get_mock_client)
    def test_modify_job_update__job_id_list__stop__loop_still_running(self):
        """Lookup loop should not get stopped"""
        self.jc.start_job_status_loop()

        job_id_list = [JOB_COMPLETED, BATCH_PARENT, JOB_RUNNING]
        self.check_job_output_states(
            request_type=STOP_UPDATE,
            params={JOB_ID_LIST: job_id_list},
            ok_states=job_id_list,
        )
        for job_id in ALL_JOBS:
            if job_id in job_id_list:
                assert self.jm._running_jobs[job_id]["refresh"] is False
            else:
                assert self.jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
        assert self.jc._lookup_timer
        assert self.jc._running_lookup_loop

    # ------------------------
    # Modify job update batch
    # ------------------------
    @mock.patch(CLIENTS, get_mock_client)
    def test_modify_job_update__batch_id__start__ok(self):
        batch_id = BATCH_PARENT
        job_id_list = BATCH_PARENT_CHILDREN
        self.check_job_output_states(
            request_type=START_UPDATE,
            params={BATCH_ID: batch_id},
            ok_states=job_id_list,
        )
        for job_id in ALL_JOBS:
            if job_id in job_id_list:
                assert self.jm._running_jobs[job_id]["refresh"]
            else:
                assert self.jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
        assert self.jc._lookup_timer
        assert self.jc._running_lookup_loop

    @mock.patch(CLIENTS, get_mock_client)
    def test_modify_job_update__batch_id__stop__ok(self):
        batch_id = BATCH_PARENT
        job_id_list = BATCH_PARENT_CHILDREN
        self.check_job_output_states(
            request_type=STOP_UPDATE,
            params={BATCH_ID: batch_id},
            ok_states=job_id_list,
        )
        for job_id in ALL_JOBS:
            if job_id in job_id_list:
                assert self.jm._running_jobs[job_id]["refresh"] is False
            else:
                assert self.jm._running_jobs[job_id]["refresh"] == REFRESH_STATE[job_id]
        assert self.jc._lookup_timer is None
        assert self.jc._running_lookup_loop is False

    def test_modify_job_update__batch_id__no_job(self):
        self.check_batch_id__no_job_test(START_UPDATE)
        self.check_batch_id__no_job_test(STOP_UPDATE)

    def test_modify_job_update__batch_id__bad_job(self):
        self.check_batch_id__dne_test(START_UPDATE)
        self.check_batch_id__dne_test(STOP_UPDATE)

    def test_modify_job_update__batch_id__not_batch(self):
        self.check_batch_id__not_batch_test(START_UPDATE)
        self.check_batch_id__not_batch_test(STOP_UPDATE)

    # ------------------------
    # Handle bad comm messages
    # ------------------------
    def test_handle_comm_message_bad(self):
        with pytest.raises(JobRequestException, match=INVALID_REQUEST_ERR):
            self.jc._handle_comm_message({"foo": "bar"})

        with pytest.raises(JobRequestException, match=MISSING_REQUEST_TYPE_ERR):
            self.jc._handle_comm_message({"content": {"data": {"request_type": None}}})

    def test_handle_comm_message_unknown(self):
        unknown = "NotAJobRequest"
        with pytest.raises(
            JobRequestException,
            match=re.escape(f"Unknown KBaseJobs message '{unknown}'"),
        ):
            self.jc._handle_comm_message(
                {"content": {"data": {"request_type": unknown}}}
            )


class JobRequestTestCase(unittest.TestCase):
    """
    Test the JobRequest module.
    This makes sure that it knows what to do with ok requests, bad requests,
    etc.
    """

    def test_request_ok(self):
        rq_msg = {
            "msg_id": "some_id",
            "content": {"data": {"request_type": "a_request"}},
        }
        rq = JobRequest(rq_msg)
        assert rq.msg_id == "some_id"
        assert rq.request_type == "a_request"
        assert rq.raw_request == rq_msg
        assert rq.rq_data == {"request_type": "a_request"}
        with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
            rq.job_id
        with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
            rq.job_id_list

    def test_request_no_data(self):
        rq_msg1 = {"msg_id": "some_id", "content": {}}
        rq_msg2 = {"msg_id": "some_id", "content": {"data": {}}}
        rq_msg3 = {"msg_id": "some_id", "content": {"data": None}}
        rq_msg4 = {"msg_id": "some_id", "content": {"what": "?"}}
        for msg in [rq_msg1, rq_msg2, rq_msg3, rq_msg4]:
            with pytest.raises(JobRequestException, match=INVALID_REQUEST_ERR):
                JobRequest(msg)

    def test_request_no_req(self):
        rq_msg1 = {"msg_id": "some_id", "content": {"data": {"request_type": None}}}
        rq_msg2 = {"msg_id": "some_id", "content": {"data": {"request_type": ""}}}
        rq_msg3 = {"msg_id": "some_id", "content": {"data": {"what": {}}}}
        for msg in [rq_msg1, rq_msg2, rq_msg3]:
            with pytest.raises(JobRequestException, match=MISSING_REQUEST_TYPE_ERR):
                JobRequest(msg)

    def test_request_more_than_one_input(self):
        """Ensure that supplying more than one job ID-like input raises an error"""
        combos = itertools.combinations(
            [
                {JOB_ID: "job_id"},
                {JOB_ID_LIST: ["job_1_id", "job_2_id"]},
                {BATCH_ID: "batch_id"},
            ],
            2,
        )
        for co in combos:
            msg = make_comm_msg(STATUS, {**co[0], **co[1]}, False)
            with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
                JobRequest(msg)

        # all three
        msg = make_comm_msg(
            STATUS,
            {
                JOB_ID: "job_id",
                BATCH_ID: "batch_id",
                JOB_ID_LIST: [],
            },
            False,
        )
        with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
            JobRequest(msg)

    def test_request__no_input(self):
        msg = make_comm_msg(STATUS, {}, False)
        req = JobRequest(msg)

        with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
            req.job_id
        with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
            req.job_id_list
        with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
            req.batch_id
        with pytest.raises(JobRequestException, match=CELLS_NOT_PROVIDED_ERR):
            req.cell_id_list


class exc_to_msgTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None
        cls.jc = JobComm()
        cls.jc._comm = MockComm()

    def setUp(self):
        self.jc._comm.clear_message_cache()

    @staticmethod
    def foo(req, f):
        with exc_to_msg(req):
            f()

    @staticmethod
    def bar(req, f, indic):
        with exc_to_msg(req):
            try:
                f()
            except Exception:
                indic += ["A"]
                raise
            indic += ["B"]
        indic += ["C"]

    def test_with_nested_try__raise(self):
        job_id_list = [BATCH_TERMINATED, JOB_TERMINATED]
        req_type = "stop_job_status_loop"
        req = make_comm_msg(req_type, job_id_list, True)
        message = (
            "Casteism is the investment in keeping the hierarchy "
            "as it is in order to maintain your own ranking, advantage, "
            "privelige, or to elevate yourself above others or keep "
            "others beneath you"
        )

        def f():
            raise RuntimeError(message)

        with pytest.raises(RuntimeError, match=message):
            f_var = []
            self.bar(req, f, f_var)
        assert ["A"] == f_var
        msg = self.jc._comm.last_message
        assert {
            "msg_type": ERROR,
            "content": {
                "source": req_type,
                "name": "RuntimeError",
                "message": message,
                "request": req.rq_data,
            },
        } == msg

    def test_with_nested_try__succeed(self):
        job_id_list = [BATCH_ERROR_RETRIED, JOB_RUNNING]
        req_type = CANCEL
        req = make_comm_msg(req_type, job_id_list, True)
        message = (
            "If the majority knew of the root of this evil, "
            "then the road to its cure would not be long."
        )

        def f():
            print(message)

        f_var = []
        self.bar(req, f, f_var)

        assert ["B", "C"] == f_var
        msg = self.jc._comm.last_message
        assert msg is None

    def test_NarrativeException(self):
        job_id_list = BATCH_CHILDREN
        req_type = "start_job_status_loop"
        req = make_comm_msg(req_type, job_id_list, True)
        message = (
            "In a similar experiment, conducted in Stanford in 1975 ... "
            "Participants gave the dehumanized people twice the punishment "
            "of the humanized ones and significantly more than the ones "
            "they knew nothing about"
        )
        error = "Unable to perform this request"

        def f():
            raise transform_job_exception(Exception(message), error)

        with pytest.raises(NarrativeException, match=message):
            self.foo(req, f)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "request": req.rq_data,
                "source": req_type,
                # Below are from transform_job_exception
                "name": "Exception",
                "message": message,
                "error": error,
                "code": -1,
            },
        }

    def test_JobRequestException(self):
        job_id = BATCH_PARENT
        req_type = INFO
        req = make_comm_msg(req_type, job_id, True)
        message = (
            "Because even if I should speak, "
            "no one would believe me. "
            "And they would not believe me precisely because "
            "they would know that what I said was true."
        )

        def f():
            raise JobRequestException(message, "a0a0a0")

        with pytest.raises(JobRequestException, match=f"{message}: a0a0a0"):
            self.foo(req, f)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "request": req.rq_data,
                "source": req_type,
                "name": "JobRequestException",
                "message": f"{message}: a0a0a0",
            },
        }

    def test_ValueError(self):
        job_id_list = [JOB_RUNNING, JOB_COMPLETED]
        req_type = STATUS
        req = make_comm_msg(req_type, job_id_list, True)
        message = (
            "Caste is the granting or withholding of respect, status, "
            "honor, attention, privileges, resources, benefit of the "
            "doubt, and human kindness to someone on the basis of their "
            "perceived rank or standing in the hierarchy"
        )

        def f():
            raise ValueError(message)

        with pytest.raises(ValueError, match=message):
            self.foo(req, f)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "request": req.rq_data,
                "source": req_type,
                "name": "ValueError",
                "message": message,
            },
        }

    def test_dict_req__no_err(self):
        job_id = JOB_ERROR
        req_type = RETRY
        req_dict = make_comm_msg(req_type, job_id, False)
        message = (
            "Casteism can mean seeking to keep those on your "
            "disfavored rung from gaining on you, to curry the "
            "favor and remain in the good graces of the dominant "
            "caste, all of which serve to keep the structure intact."
        )

        def f():
            print(message)

        self.foo(req_dict, f)
        msg = self.jc._comm.last_message
        assert msg is None

    def test_dict_req__error_down_the_stack(self):
        job_id = JOB_CREATED
        req_type = STATUS
        req_dict = make_comm_msg(req_type, job_id, False)
        message = (
            "Caste is the granting or witholding of "
            "respect, status, honor, attention, priveliges, "
            "resources, benefit of the doubt, and human "
            "kindness to someone on the basis of their "
            "perceived rank or standing in the hierarchy."
        )

        # Throw a few frames into stack
        def f(i=5):
            if i == 0:
                raise ValueError(message)
            f(i - 1)

        with pytest.raises(ValueError, match=message):
            self.foo(req_dict, f)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "request": req_dict["content"]["data"],
                "source": req_type,
                "name": "ValueError",
                "message": message,
            },
        }

    def test_dict_req__both_inputs(self):
        req_type = STATUS
        # can give it both job_id and job_id_list since it's not a JobRequest
        req_dict = make_comm_msg(
            req_type, {JOB_ID: JOB_CREATED, JOB_ID_LIST: []}, False
        )
        message = (
            "What some people call racism could be seen as merely "
            "one manifestation of the degree to which we have internalized "
            "the larger American caste system."
        )

        def f():
            raise ValueError(message)

        with pytest.raises(ValueError, match=message):
            self.foo(req_dict, f)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "request": req_dict["content"]["data"],
                "source": req_type,
                "name": "ValueError",
                "message": message,
            },
        }

    def test_None_req(self):
        source = None
        message = "Hi"
        err = ValueError(message)

        def f():
            raise err

        with pytest.raises(type(err), match=str(err)):
            self.foo(source, f)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "source": source,
                "name": "ValueError",
                "message": message,
                "request": None,
            },
        }

    def test_str_req(self):
        source = "test_jobcomm"
        message = "Hi"
        err = ValueError(message)

        def f():
            raise err

        with pytest.raises(type(err), match=str(err)):
            self.foo(source, f)
        msg = self.jc._comm.last_message
        assert msg == {
            "msg_type": ERROR,
            "content": {
                "source": source,
                "name": "ValueError",
                "message": message,
                "request": source,
            },
        }
