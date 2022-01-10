import unittest
from unittest import mock
import os
import itertools
import re

from biokbase.narrative.exception_util import transform_job_exception
from biokbase.narrative.jobs.jobcomm import exc_to_msg
import biokbase.narrative.jobs.jobcomm
import biokbase.narrative.jobs.jobmanager
from biokbase.narrative.jobs.jobmanager import (
    JOB_NOT_REG_ERR,
    JOB_NOT_BATCH_ERR,
    JOBS_TYPE_ERR,
    JOBS_MISSING_ERR,
    get_error_output_state,
)
from biokbase.narrative.jobs.jobcomm import (
    JobRequest,
    JobComm,
    JOB_NOT_PROVIDED_ERR,
    JOBS_NOT_PROVIDED_ERR,
    BATCH_NOT_PROVIDED_ERR,
    CELLS_NOT_PROVIDED_ERR,
    ONE_INPUT_TYPE_ONLY_ERR,
    INVALID_REQUEST_ERR,
    MISSING_REQUEST_TYPE_ERR,
    BATCH_ID,
    JOB_ID,
    JOB_ID_LIST,
    CELL_ID_LIST,
    CANCEL,
    CELL_JOB_STATUS,
    ERROR,
    INFO,
    LOGS,
    NEW,
    RETRY,
    START_UPDATE,
    STATUS,
    STATUS_ALL,
    STOP_UPDATE,
)
from biokbase.narrative.exception_util import (
    NarrativeException,
    JobRequestException,
)

from src.biokbase.narrative.jobs.jobmanager import DOES_NOT_EXIST

from .util import ConfigTests, validate_job_state
from .narrative_mock.mockcomm import MockComm
from .narrative_mock.mockclients import (
    get_mock_client,
    get_failing_mock_client,
    generate_ee2_error,
    MockClients,
)

from biokbase.narrative.tests.job_test_constants import (
    CLIENTS,
    JOB_COMPLETED,
    JOB_CREATED,
    JOB_RUNNING,
    JOB_TERMINATED,
    JOB_ERROR,
    BATCH_PARENT,
    BATCH_COMPLETED,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    BATCH_ERROR_RETRIED,
    BATCH_RETRY_COMPLETED,
    BATCH_RETRY_RUNNING,
    BATCH_RETRY_ERROR,
    JOB_NOT_FOUND,
    BAD_JOB_ID,
    BAD_JOB_ID_2,
    TEST_CELL_ID_LIST,
    TEST_CELL_IDs,
    JOBS_TERMINALITY,
    ALL_JOBS,
    ACTIVE_JOBS,
    BATCH_PARENT_CHILDREN,
    BATCH_CHILDREN,
    TEST_JOBS,
)

from .test_job import (
    get_test_job_states,
    get_cell_2_jobs,
)

from .test_jobmanager import get_test_job_info, get_test_job_infos

APP_NAME = "The Best App in the World"

NO_JOBS_MAPPING = {
    "jobs": {},
    "mapping": {
        "a": set(),
        "b": set(),
        "c": set(),
    },
}


def make_comm_msg(
    msg_type: str, job_id_like, as_job_request: bool, content: dict = None
):
    job_arguments = {}
    if type(job_id_like) is dict:
        job_arguments = job_id_like
    elif type(job_id_like) is list:
        job_arguments[JOB_ID_LIST] = job_id_like
    elif job_id_like:
        job_arguments[JOB_ID] = job_id_like

    msg = {
        "msg_id": "some_id",
        "content": {"data": {"request_type": msg_type, **job_arguments}},
    }
    if content is not None:
        msg["content"]["data"].update(content)
    if as_job_request:
        return JobRequest(msg)
    else:
        return msg


def get_app_data(*args):
    return {"info": {"name": APP_NAME}}


def get_retried_job(job_id):
    return {
        "jobState": {
            "job_id": job_id[::-1],
            "status": "unmocked",
            "job_output": {},
            "batch_id": None,
            "cell_id": None,
            "run_id": None,
            "child_jobs": [],
        },
        "outputWidgetInfo": None,
    }


class JobCommTestCase(unittest.TestCase):
    maxDiff = None

    @classmethod
    @mock.patch("biokbase.narrative.jobs.jobcomm.Comm", MockComm)
    @mock.patch(CLIENTS, get_mock_client)
    def setUpClass(cls):
        cls.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        config = ConfigTests()
        os.environ["KB_WORKSPACE_ID"] = config.get("jobs", "job_test_wsname")

        cls.jc = biokbase.narrative.jobs.jobcomm.JobComm()
        cls.jc._comm = MockComm()

    @mock.patch(CLIENTS, get_mock_client)
    def setUp(self):
        self.jc._comm.clear_message_cache()
        self.jc._jm.initialize_jobs()
        self.jc.stop_job_status_loop()
        self.job_states = get_test_job_states()

    def check_error_message(self, req, err, extra_params={}):
        """
        response when no input was submitted with a query
        args:
            req: the JobRequest, dictionary, or string passed when throwing the error
            extra_params: any extra content
            err: the error object produced

        error message produced will contain:
            raw_request: the input that generated the error
            source: the request that was called
            extra_params
            name: the type of exception
            message: the error message
        """
        if isinstance(req, JobRequest):
            raw_request = req.raw_request
            source = req.request_type
        elif isinstance(req, dict):
            raw_request = req
            source = req["content"]["data"]["request_type"]
        elif isinstance(req, str):
            raw_request = req
            source = req

        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "raw_request": raw_request,
                    "source": source,
                    **extra_params,
                    "name": type(err).__name__,
                    "message": str(err),
                },
            },
            msg,
        )

    def check_job_id_list__no_jobs(self, request_type):
        job_id_list = [None, ""]
        req_dict = make_comm_msg(request_type, job_id_list, False)
        req = make_comm_msg(request_type, job_id_list, True)
        err = JobRequestException(JOBS_MISSING_ERR, job_id_list)

        # using handler
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

        # run directly
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._msg_map[request_type](req)

    def check_job_id_list__dne_jobs(self, request_type, response_type=None):
        job_id_list = [None, "", JOB_NOT_FOUND, JOB_NOT_FOUND, BAD_JOB_ID]
        expected_output = {
            JOB_NOT_FOUND: get_error_output_state(JOB_NOT_FOUND),
            BAD_JOB_ID: get_error_output_state(BAD_JOB_ID),
        }
        req_dict = make_comm_msg(request_type, job_id_list, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": response_type if response_type else request_type,
                "content": expected_output,
            },
            msg,
        )

    def check_id_error(self, req_dict, err):
        self.jc._comm.clear_message_cache()
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
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
            with self.assertRaisesRegex(type(err), re.escape(str(err))):
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
        self.assertEqual(
            msg,
            {
                "msg_type": "some_msg",
                "content": {"foo": "bar"},
            },
        )
        self.jc._comm.clear_message_cache()

    def test_send_error_msg__JobRequest(self):
        req = make_comm_msg("bar", "aeaeae", True)
        self.jc.send_error_message(req, {"extra": "field"})
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "source": "bar",
                    "extra": "field",
                    "raw_request": req.raw_request,
                },
            },
            msg,
        )

    def test_send_error_msg__dict(self):
        req_dict = make_comm_msg("bar", "aeaeae", False)
        self.jc.send_error_message(req_dict, {"extra": "field"})
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "source": "bar",
                    "extra": "field",
                    "raw_request": req_dict,
                },
            },
            msg,
        )

    def test_send_error_msg__None(self):
        self.jc.send_error_message(None, {"extra": "field"})
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "source": None,
                    "extra": "field",
                    "raw_request": None,
                },
            },
            msg,
        )

    def test_send_error_msg__str(self):
        source = "test_jobcomm"
        self.jc.send_error_message(source, {"extra": "field"})
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "source": source,
                    "extra": "field",
                    "raw_request": source,
                },
            },
            msg,
        )

    # ---------------------
    # Requests
    # ---------------------
    @mock.patch(CLIENTS, get_mock_client)
    def test_req_no_inputs__succeed(self):
        req_dict = make_comm_msg(STATUS_ALL, None, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(STATUS_ALL, msg["msg_type"])

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
            with self.assertRaisesRegex(type(err), str(err)):
                self.jc._handle_comm_message(req_dict)
            self.check_error_message(req_dict, err)

    # ---------------------
    # Start job status loop
    # ---------------------
    @mock.patch(CLIENTS, get_mock_client)
    def test_start_stop_job_status_loop(self):
        self.assertFalse(self.jc._running_lookup_loop)
        self.assertIsNone(self.jc._lookup_timer)

        self.jc.start_job_status_loop()
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": STATUS_ALL,
                "content": get_test_job_states(ALL_JOBS),
            },
            msg,
        )
        self.assertTrue(self.jc._running_lookup_loop)
        self.assertIsNotNone(self.jc._lookup_timer)

        self.jc.stop_job_status_loop()
        self.assertFalse(self.jc._running_lookup_loop)
        self.assertIsNone(self.jc._lookup_timer)

    @mock.patch(CLIENTS, get_mock_client)
    def test_start_job_status_loop__cell_ids(self):
        cell_2_jobs = get_cell_2_jobs()
        cell_ids = list(cell_2_jobs.keys())
        # Iterate through all combinations of cell IDs
        for combo_len in range(len(cell_ids) + 1):
            for combo in itertools.combinations(cell_ids, combo_len):
                combo = list(combo)

                self.jm._running_jobs = {}
                self.assertFalse(self.jc._running_lookup_loop)
                self.assertIsNone(self.jc._lookup_timer)

                self.jc.start_job_status_loop(init_jobs=True, cell_list=combo)
                msg = self.jc._comm.last_message
                self.assertEqual(
                    {
                        "msg_type": STATUS_ALL,
                        "content": get_test_job_states(ALL_JOBS),
                    },
                    msg,
                )

                self.assertTrue(self.jc._running_lookup_loop)
                self.assertTrue(self.jc._lookup_timer)

                self.jc.stop_job_status_loop()
                self.assertFalse(self.jc._running_lookup_loop)
                self.assertIsNone(self.jc._lookup_timer)

    # ---------------------
    # Lookup all job states
    # ---------------------

    @mock.patch(CLIENTS, get_mock_client)
    def check_job_output_states(
        self,
        output_states=None,
        params={},
        request_type=STATUS,
        response_type=STATUS,
        ok_states=[],
        error_states=[],
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
        if output_states is None:
            req_dict = make_comm_msg(request_type, params, False)
            output_states = self.jc._handle_comm_message(req_dict)

        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": response_type,
                "content": output_states,
            },
            msg,
        )

        for job_id, state in output_states.items():
            if job_id in ok_states:
                self.assertEqual(self.job_states[job_id], state)
                validate_job_state(state)
            elif job_id in error_states:
                self.assertEqual(get_error_output_state(job_id), state)
            else:
                # every valid job ID should be in either error_states or ok_states
                self.assertIn(job_id, error_states + ok_states)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_all_job_states__ok(self):
        self.check_job_output_states(
            request_type=STATUS_ALL, response_type=STATUS_ALL, ok_states=ALL_JOBS
        )

    # -----------------------
    # Lookup single job state
    # -----------------------
    def test_lookup_job_state__1_ok(self):
        output_states = self.jc.lookup_job_state(JOB_COMPLETED)
        self.check_job_output_states(
            output_states=output_states, ok_states=[JOB_COMPLETED]
        )

    def test_lookup_job_state__no_job(self):
        with self.assertRaisesRegex(
            JobRequestException, re.escape(f"{JOBS_MISSING_ERR}: {[None]}")
        ):
            self.jc.lookup_job_state(None)

    # -----------------------
    # Lookup select job states
    # -----------------------

    def test_lookup_job_states__job_id__ok(self):
        self.check_job_output_states(
            params={JOB_ID: JOB_COMPLETED}, ok_states=[JOB_COMPLETED]
        )

    def test_lookup_job_states__job_id__dne(self):
        self.check_job_output_states(
            params={JOB_ID: JOB_NOT_FOUND}, error_states=[JOB_NOT_FOUND]
        )

    def test_lookup_job_states__job_id__invalid(self):
        self.check_job_id__no_job_test(STATUS)

    def test_lookup_job_states__job_id_list__1_ok(self):
        job_id_list = [JOB_COMPLETED]
        self.check_job_output_states(
            params={JOB_ID_LIST: job_id_list}, ok_states=job_id_list
        )

    def test_lookup_job_states__job_id_list__2_ok(self):
        job_id_list = [JOB_COMPLETED, BATCH_PARENT]
        self.check_job_output_states(
            params={JOB_ID_LIST: job_id_list}, ok_states=job_id_list
        )

    def test_lookup_job_states__job_id_list__ok_bad(self):
        job_id_list = [BAD_JOB_ID, JOB_COMPLETED]
        self.check_job_output_states(
            params={JOB_ID_LIST: job_id_list},
            ok_states=[JOB_COMPLETED],
            error_states=[BAD_JOB_ID],
        )

    def test_lookup_job_states__job_id_list__no_jobs(self):
        self.check_job_id_list__no_jobs(STATUS)

    def test_lookup_job_states__batch_id__ok(self):
        self.check_job_output_states(
            request_type=STATUS,
            params={BATCH_ID: BATCH_PARENT},
            ok_states=BATCH_PARENT_CHILDREN,
        )

    def test_lookup_job_states__batch_id__dne(self):
        self.check_batch_id__dne_test(STATUS)

    def test_lookup_job_states__batch_id__no_job(self):
        self.check_batch_id__no_job_test(STATUS)

    def test_lookup_job_states__batch_id__not_batch(self):
        self.check_batch_id__not_batch_test(STATUS)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states__job_id_list__ee2_error(self):
        def mock_check_jobs(self, params):
            raise Exception("Test exception")

        job_id_list = ALL_JOBS
        req_dict = make_comm_msg(STATUS, job_id_list, False)

        TIME_NOW = 987654321
        with mock.patch("time.time") as fake_time:
            fake_time.return_value = TIME_NOW
            with mock.patch.object(
                MockClients, "check_jobs", side_effect=mock_check_jobs
            ):
                self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message

        expected = get_test_job_states(ALL_JOBS)
        for job_id in ACTIVE_JOBS:
            # add in the ee2_error status and updated timestamp
            expected[job_id]["jobState"]["status"] = "ee2_error"
            expected[job_id]["jobState"]["updated"] = TIME_NOW

        self.assertEqual(
            {
                "msg_type": STATUS,
                "content": expected,
            },
            msg,
        )

    # -----------------------
    # lookup cell job states
    # -----------------------

    def test_lookup_job_states_by_cell_id__job_req_none(self):
        cell_id_list = None
        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        err = JobRequestException(CELLS_NOT_PROVIDED_ERR)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    def test_lookup_job_states_by_cell_id__empty_cell_id_list(self):
        cell_id_list = []
        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        err = JobRequestException(CELLS_NOT_PROVIDED_ERR)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__invalid_cell_id_list(self):
        cell_id_list = ["a", "b", "c"]
        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": CELL_JOB_STATUS,
                "content": NO_JOBS_MAPPING,
            },
            msg,
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__invalid_cell_id_list_req(self):
        cell_id_list = ["a", "b", "c"]
        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        result = self.jc._handle_comm_message(req_dict)
        self.assertEqual(result, NO_JOBS_MAPPING)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": CELL_JOB_STATUS,
                "content": NO_JOBS_MAPPING,
            },
            msg,
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__all_results(self):
        cell_id_list = TEST_CELL_ID_LIST
        expected_ids = list(TEST_JOBS.keys())
        job_states = get_test_job_states()
        expected_states = {
            id: job_states[id] for id in job_states.keys() if id in expected_ids
        }

        req_dict = make_comm_msg(CELL_JOB_STATUS, {CELL_ID_LIST: cell_id_list}, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(set(msg.keys()), set(["msg_type", "content"]))
        self.assertEqual(msg["msg_type"], CELL_JOB_STATUS)
        self.assertEqual(msg["content"]["jobs"], expected_states)
        self.assertEqual(set(cell_id_list), set(msg["content"]["mapping"].keys()))
        for key in msg["content"]["mapping"].keys():
            self.assertEqual(
                set(TEST_CELL_IDs[key]), set(msg["content"]["mapping"][key])
            )

    # -----------------------
    # Lookup job info
    # -----------------------
    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_info__job_id__ok(self):
        req_dict = make_comm_msg(INFO, {JOB_ID: JOB_COMPLETED}, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": INFO,
                "content": {
                    JOB_COMPLETED: get_test_job_info(JOB_COMPLETED),
                },
            },
            msg,
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_info__job_id__dne(self):
        req_dict = make_comm_msg(INFO, {JOB_ID: JOB_NOT_FOUND}, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": INFO,
                "content": {
                    JOB_NOT_FOUND: {
                        "job_id": JOB_NOT_FOUND,
                        "error": DOES_NOT_EXIST,
                    },
                },
            },
            msg,
        )

    def test_lookup_job_info__job_id__invalid(self):
        self.check_job_id__no_job_test(INFO)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_info__job_id_list__ok(self):
        job_id_list = ALL_JOBS
        req_dict = make_comm_msg(INFO, job_id_list, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": INFO,
                "content": get_test_job_infos(job_id_list),
            },
            msg,
        )

    def test_lookup_job_info__job_id_list__no_jobs(self):
        self.check_job_id_list__no_jobs(INFO)

    def test_lookup_job_info__job_id_list__ok_bad(self):
        job_id_list = [JOB_COMPLETED, JOB_NOT_FOUND]
        req_dict = make_comm_msg(INFO, job_id_list, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": INFO,
                "content": {
                    JOB_COMPLETED: get_test_job_info(JOB_COMPLETED),
                    JOB_NOT_FOUND: {
                        "job_id": JOB_NOT_FOUND,
                        "error": DOES_NOT_EXIST,
                    },
                },
            },
            msg,
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_info__batch_id__ok(self):
        job_id = BATCH_PARENT
        req_dict = make_comm_msg(INFO, {BATCH_ID: job_id}, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": INFO,
                "content": get_test_job_infos(BATCH_PARENT_CHILDREN),
            },
            msg,
        )

    def test_lookup_job_info__batch_id__no_job(self):
        self.check_batch_id__no_job_test(INFO)

    def test_lookup_job_info__batch_id__dne(self):
        self.check_batch_id__dne_test(INFO)

    def test_lookup_job_info__batch_id__not_batch(self):
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
            with self.assertRaisesRegex(type(err), re.escape(str(err))):
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
        err = JobRequestException(JOBS_TYPE_ERR)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req_dict)

        job_id_list = [None, ""]
        req_dict = make_comm_msg(CANCEL, job_id_list, False)
        err = JobRequestException(JOBS_MISSING_ERR, job_id_list)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
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
        print(output)
        expected = {
            JOB_RUNNING: self.job_states[JOB_RUNNING],
            BATCH_RETRY_RUNNING: {
                **self.job_states[BATCH_RETRY_RUNNING],
                "error": CANCEL + " failed",
            },
        }

        self.assertEqual(output, expected)
        self.assertEqual(
            self.jc._comm.last_message,
            {
                "msg_type": STATUS,
                "content": expected,
            },
        )

    # ------------
    # Retry list of jobs
    # ------------
    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__job_id__ok(self):
        req_dict = make_comm_msg(RETRY, {JOB_ID: JOB_TERMINATED}, False)
        expected = {
            JOB_TERMINATED: {
                "job_id": JOB_TERMINATED,
                "job": self.job_states[JOB_TERMINATED],
                "retry": get_retried_job(JOB_TERMINATED),
            },
        }
        retry_data = self.jc._handle_comm_message(req_dict)
        self.assertEqual(expected, retry_data)
        new_msg = self.jc._comm.pop_message()
        self.assertEqual(
            {"msg_type": NEW, "content": {JOB_ID_LIST: [JOB_TERMINATED[::-1]]}},
            new_msg,
        )
        retry_msg = self.jc._comm.pop_message()
        self.assertEqual(
            {
                "msg_type": RETRY,
                "content": expected,
            },
            retry_msg,
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__job_id__dne(self):
        req_dict = make_comm_msg(RETRY, {JOB_ID: BAD_JOB_ID}, False)
        expected = {
            BAD_JOB_ID: {
                "job_id": BAD_JOB_ID,
                "job": get_error_output_state(BAD_JOB_ID),
                "error": DOES_NOT_EXIST,
            },
        }
        retry_data = self.jc._handle_comm_message(req_dict)
        self.assertEqual(expected, retry_data)
        # no NEW message as there are no new IDs
        retry_msg = self.jc._comm.pop_message()
        self.assertEqual(
            {"msg_type": RETRY, "content": expected},
            retry_msg,
        )

    def test_retry_jobs__job_id__invalid(self):
        self.check_job_id__no_job_test(RETRY)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__job_id_list__2_ok(self):
        job_id_list = [JOB_TERMINATED, JOB_ERROR, None]
        req_dict = make_comm_msg(RETRY, job_id_list, False)
        expected = {
            JOB_TERMINATED: {
                "job_id": JOB_TERMINATED,
                "job": self.job_states[JOB_TERMINATED],
                "retry": get_retried_job(JOB_TERMINATED),
            },
            JOB_ERROR: {
                "job_id": JOB_ERROR,
                "job": self.job_states[JOB_ERROR],
                "retry": get_retried_job(JOB_ERROR),
            },
        }
        retry_data = self.jc._handle_comm_message(req_dict)
        self.assertEqual(expected, retry_data)
        new_msg = self.jc._comm.pop_message()
        self.assertEqual(
            {
                "msg_type": NEW,
                "content": {JOB_ID_LIST: [JOB_TERMINATED[::-1], JOB_ERROR[::-1]]},
            },
            new_msg,
        )
        retry_msg = self.jc._comm.pop_message()
        self.assertEqual(
            {"msg_type": RETRY, "content": expected},
            retry_msg,
        )

    def test_retry_jobs__job_id_list__no_jobs(self):
        self.check_job_id_list__no_jobs(RETRY)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__job_id_list__ok_bad(self):
        job_id_list = [JOB_TERMINATED, BAD_JOB_ID, BAD_JOB_ID_2]
        req_dict = make_comm_msg(RETRY, job_id_list, False)
        expected = {
            JOB_TERMINATED: {
                "job_id": JOB_TERMINATED,
                "job": self.job_states[JOB_TERMINATED],
                "retry": get_retried_job(JOB_TERMINATED),
            },
            BAD_JOB_ID: {
                "job_id": BAD_JOB_ID,
                "job": get_error_output_state(BAD_JOB_ID),
                "error": DOES_NOT_EXIST,
            },
            BAD_JOB_ID_2: {
                "job_id": BAD_JOB_ID_2,
                "job": get_error_output_state(BAD_JOB_ID_2),
                "error": DOES_NOT_EXIST,
            },
        }
        retry_data = self.jc._handle_comm_message(req_dict)
        self.assertEqual(expected, retry_data)
        new_msg = self.jc._comm.pop_message()
        self.assertEqual(
            {"msg_type": NEW, "content": {JOB_ID_LIST: [JOB_TERMINATED[::-1]]}},
            new_msg,
        )
        retry_msg = self.jc._comm.pop_message()
        self.assertEqual(
            {
                "msg_type": RETRY,
                "content": expected,
            },
            retry_msg,
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__job_id_list__all_bad_jobs(self):
        job_id_list = [BAD_JOB_ID, BAD_JOB_ID_2]
        req_dict = make_comm_msg(RETRY, job_id_list, False)
        expected = {
            BAD_JOB_ID: {
                "job_id": BAD_JOB_ID,
                "job": get_error_output_state(BAD_JOB_ID),
                "error": DOES_NOT_EXIST,
            },
            BAD_JOB_ID_2: {
                "job_id": BAD_JOB_ID_2,
                "job": get_error_output_state(BAD_JOB_ID_2),
                "error": DOES_NOT_EXIST,
            },
        }
        retry_data = self.jc._handle_comm_message(req_dict)
        self.assertEqual(expected, retry_data)
        # no NEW message as there are no new IDs
        retry_msg = self.jc._comm.pop_message()
        self.assertEqual(
            {"msg_type": RETRY, "content": expected},
            retry_msg,
        )

    @mock.patch(CLIENTS, get_failing_mock_client)
    def test_retry_jobs__job_id_list__failure(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED, JOB_TERMINATED]
        req_dict = make_comm_msg(RETRY, job_id_list, False)
        err = transform_job_exception(
            generate_ee2_error(RETRY), "Unable to retry job(s)"
        )

        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)

        msg = self.jc._comm.last_message
        self.assertEqual(
            msg,
            {
                "msg_type": ERROR,
                "content": {
                    "raw_request": req_dict,
                    "source": RETRY,
                    "name": "JSONRPCError",
                    "error": "Unable to retry job(s)",
                    "code": -32000,
                    "message": RETRY + " failed",
                },
            },
        )

    # -----------------
    # Fetching job logs
    # -----------------
    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_logs__job_id__ok(self):
        job_id = JOB_COMPLETED
        lines_available = 100  # just for convenience if the mock changes
        # first_line, num_lines, latest, number of lines in output
        cases = [
            (0, 10, False, 10),
            (-100, 10, False, 10),
            (50, 20, False, 20),
            (0, 5000, False, lines_available),
            (0, None, False, lines_available),
            (80, None, False, 20),
            (0, 10, True, 10),
            (-100, 10, True, 10),
            (50, 20, True, 20),
            (0, 5000, True, lines_available),
            (0, None, True, lines_available),
            (80, None, True, lines_available),
        ]
        for c in cases:
            content = {"first_line": c[0], "num_lines": c[1], "latest": c[2]}
            req_dict = make_comm_msg(LOGS, [job_id], False, content)
            self.jc._handle_comm_message(req_dict)
            msg = self.jc._comm.last_message
            self.assertEqual(LOGS, msg["msg_type"])
            msg_content = msg["content"][job_id]
            self.assertEqual(job_id, msg_content["job_id"])
            self.assertEqual(None, msg_content["batch_id"])
            self.assertEqual(lines_available, msg_content["max_lines"])
            self.assertEqual(c[3], len(msg_content["lines"]))
            self.assertEqual(c[2], msg_content["latest"])
            first = 0 if c[1] is None and c[2] is True else c[0]
            n_lines = c[1] if c[1] else lines_available
            if first < 0:
                first = 0
            if c[2]:
                first = lines_available - min(n_lines, lines_available)

            self.assertEqual(first, msg_content["first"])
            for idx, line in enumerate(msg_content["lines"]):
                self.assertIn(str(first + idx), line["line"])
                self.assertEqual(0, line["is_error"])

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_logs__job_id__failure(self):
        job_id = JOB_CREATED
        req_dict = make_comm_msg(LOGS, job_id, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            msg,
            {
                "msg_type": LOGS,
                "content": {
                    JOB_CREATED: {
                        "job_id": JOB_CREATED,
                        "batch_id": None,
                        "error": "Cannot find job log with id: " + JOB_CREATED,
                    }
                },
            },
        )

    def test_get_job_logs__job_id__no_job(self):
        job_id = None
        req_dict = make_comm_msg(LOGS, {JOB_ID: job_id}, False)
        err = JobRequestException(JOBS_MISSING_ERR, [job_id])
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req_dict)
        self.check_error_message(req_dict, err)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_logs__job_id__bad_job(self):
        job_id = "bad_job"
        req_dict = make_comm_msg(LOGS, job_id, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            msg,
            {
                "msg_type": LOGS,
                "content": {
                    job_id: {
                        "job_id": job_id,
                        "error": DOES_NOT_EXIST,
                    }
                },
            },
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_logs__job_id__job_dne(self):
        req_dict = make_comm_msg(LOGS, JOB_NOT_FOUND, False)
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(
            msg,
            {
                "msg_type": LOGS,
                "content": {
                    JOB_NOT_FOUND: {
                        "job_id": JOB_NOT_FOUND,
                        "error": DOES_NOT_EXIST,
                    }
                },
            },
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_logs__job_id_list__one_ok_one_bad_one_fetch_fail(self):
        req_dict = make_comm_msg(
            LOGS, [JOB_COMPLETED, JOB_CREATED, JOB_NOT_FOUND], False
        )
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        self.assertEqual(LOGS, msg["msg_type"])

        self.assertEqual(
            set(list(msg["content"][JOB_COMPLETED].keys())),
            set(["job_id", "batch_id", "first", "latest", "max_lines", "lines"]),
        )
        self.assertEqual(
            {
                "job_id": JOB_CREATED,
                "batch_id": None,
                "error": "Cannot find job log with id: " + JOB_CREATED,
            },
            msg["content"][JOB_CREATED],
        )
        self.assertEqual(
            {
                "job_id": JOB_NOT_FOUND,
                "error": DOES_NOT_EXIST,
            },
            msg["content"][JOB_NOT_FOUND],
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_logs__job_id__latest(self):
        job_id = JOB_COMPLETED
        req_dict = make_comm_msg(
            LOGS, job_id, False, content={"num_lines": 10, "latest": True}
        )
        self.jc._handle_comm_message(req_dict)
        msg = self.jc._comm.last_message
        msg_content = msg["content"][job_id]
        self.assertEqual(msg["msg_type"], LOGS)
        self.assertEqual(msg_content["job_id"], job_id)
        self.assertTrue(msg_content["latest"])
        self.assertEqual(msg_content["first"], 90)
        self.assertEqual(msg_content["max_lines"], 100)
        self.assertEqual(len(msg_content["lines"]), 10)

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
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    int(not JOBS_TERMINALITY[job_id]) + 1,
                )
            else:
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    int(not JOBS_TERMINALITY[job_id]),
                )
        self.assertTrue(self.jc._lookup_timer)
        self.assertTrue(self.jc._running_lookup_loop)

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
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    max(int(not JOBS_TERMINALITY[job_id]) - 1, 0),
                )
            else:
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    int(not JOBS_TERMINALITY[job_id]),
                )
        self.assertIsNone(self.jc._lookup_timer)
        self.assertFalse(self.jc._running_lookup_loop)

    def test_modify_job_update__job_id_list__no_jobs(self):
        job_id_list = [None]
        req_dict = make_comm_msg(START_UPDATE, job_id_list, False)
        err = JobRequestException(JOBS_MISSING_ERR, job_id_list)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
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
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    max(int(not JOBS_TERMINALITY[job_id]) - 1, 0),
                )
            else:
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    int(not JOBS_TERMINALITY[job_id]),
                )
        self.assertIsNone(self.jc._lookup_timer)
        self.assertFalse(self.jc._running_lookup_loop)

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
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    max(int(not JOBS_TERMINALITY[job_id]) - 1, 0),
                )
            else:
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    int(not JOBS_TERMINALITY[job_id]),
                )
        self.assertTrue(self.jc._lookup_timer)
        self.assertTrue(self.jc._running_lookup_loop)

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
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    int(not JOBS_TERMINALITY[job_id]) + 1,
                )
            else:
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    int(not JOBS_TERMINALITY[job_id]),
                )
        self.assertTrue(self.jc._lookup_timer)
        self.assertTrue(self.jc._running_lookup_loop)

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
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    max(int(not JOBS_TERMINALITY[job_id]) - 1, 0),
                )
            else:
                self.assertEqual(
                    self.jm._running_jobs[job_id]["refresh"],
                    int(not JOBS_TERMINALITY[job_id]),
                )
        self.assertIsNone(self.jc._lookup_timer)
        self.assertFalse(self.jc._running_lookup_loop)

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
        with self.assertRaisesRegex(JobRequestException, INVALID_REQUEST_ERR):
            self.jc._handle_comm_message({"foo": "bar"})

        with self.assertRaisesRegex(JobRequestException, MISSING_REQUEST_TYPE_ERR):
            self.jc._handle_comm_message({"content": {"data": {"request_type": None}}})

    def test_handle_comm_message_unknown(self):
        unknown = "NotAJobRequest"
        with self.assertRaisesRegex(
            JobRequestException, re.escape(f"Unknown KBaseJobs message '{unknown}'")
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
        self.assertEqual(rq.msg_id, "some_id")
        self.assertEqual(rq.request_type, "a_request")
        self.assertEqual(rq.raw_request, rq_msg)
        self.assertEqual(rq.rq_data, {"request_type": "a_request"})
        with self.assertRaisesRegex(JobRequestException, JOB_NOT_PROVIDED_ERR):
            rq.job_id
        with self.assertRaisesRegex(JobRequestException, JOBS_NOT_PROVIDED_ERR):
            rq.job_id_list

    def test_request_no_data(self):
        rq_msg = {"msg_id": "some_id", "content": {}}
        with self.assertRaisesRegex(JobRequestException, INVALID_REQUEST_ERR):
            JobRequest(rq_msg)

    def test_request_no_req(self):
        rq_msg = {"msg_id": "some_id", "content": {"data": {"request_type": None}}}
        rq_msg2 = {"msg_id": "some_other_id", "content": {"data": {}}}
        for msg in [rq_msg, rq_msg2]:
            with self.assertRaisesRegex(JobRequestException, MISSING_REQUEST_TYPE_ERR):
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
            with self.assertRaisesRegex(JobRequestException, ONE_INPUT_TYPE_ONLY_ERR):
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
        with self.assertRaisesRegex(JobRequestException, ONE_INPUT_TYPE_ONLY_ERR):
            JobRequest(msg)

    def test_request__no_input(self):
        msg = make_comm_msg(STATUS, {}, False)
        req = JobRequest(msg)

        with self.assertRaisesRegex(JobRequestException, JOB_NOT_PROVIDED_ERR):
            req.job_id
        with self.assertRaisesRegex(JobRequestException, JOBS_NOT_PROVIDED_ERR):
            req.job_id_list
        with self.assertRaisesRegex(JobRequestException, BATCH_NOT_PROVIDED_ERR):
            req.batch_id
        with self.assertRaisesRegex(JobRequestException, CELLS_NOT_PROVIDED_ERR):
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

        with self.assertRaisesRegex(RuntimeError, message):
            f_var = []
            self.bar(req, f, f_var)
        self.assertEqual(["A"], f_var)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "source": req_type,
                    "name": "RuntimeError",
                    "message": message,
                    "raw_request": req.raw_request,
                },
            },
            msg,
        )

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

        self.assertEqual(["B", "C"], f_var)
        msg = self.jc._comm.last_message
        self.assertIsNone(msg)

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

        with self.assertRaisesRegex(NarrativeException, message):
            self.foo(req, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "raw_request": req.raw_request,
                    "source": req_type,
                    # Below are from transform_job_exception
                    "name": "Exception",
                    "message": message,
                    "error": error,
                    "code": -1,
                },
            },
            msg,
        )

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

        with self.assertRaisesRegex(JobRequestException, f"{message}: a0a0a0"):
            self.foo(req, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "raw_request": req.raw_request,
                    "source": req_type,
                    "name": "JobRequestException",
                    "message": f"{message}: a0a0a0",
                },
            },
            msg,
        )

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

        with self.assertRaisesRegex(ValueError, message):
            self.foo(req, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "raw_request": req.raw_request,
                    "source": req_type,
                    "name": "ValueError",
                    "message": message,
                },
            },
            msg,
        )

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
        self.assertIsNone(msg)

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
            else:
                f(i - 1)

        with self.assertRaisesRegex(ValueError, message):
            self.foo(req_dict, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "raw_request": req_dict,
                    "source": req_type,
                    "name": "ValueError",
                    "message": message,
                },
            },
            msg,
        )

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

        with self.assertRaisesRegex(ValueError, message):
            self.foo(req_dict, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "raw_request": req_dict,
                    "source": req_type,
                    "name": "ValueError",
                    "message": message,
                },
            },
            msg,
        )

    def test_None_req(self):
        source = None
        message = "Hi"
        err = ValueError(message)

        def f():
            raise err

        with self.assertRaisesRegex(type(err), str(err)):
            self.foo(source, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "source": source,
                    "name": "ValueError",
                    "message": message,
                    "raw_request": None,
                },
            },
            msg,
        )

    def test_str_req(self):
        source = "test_jobcomm"
        message = "Hi"
        err = ValueError(message)

        def f():
            raise err

        with self.assertRaisesRegex(type(err), str(err)):
            self.foo(source, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": ERROR,
                "content": {
                    "source": source,
                    "name": "ValueError",
                    "message": message,
                    "raw_request": source,
                },
            },
            msg,
        )
