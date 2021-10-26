import unittest
from unittest import mock
import os
import itertools
import re

from biokbase.narrative.exception_util import transform_job_exception
from biokbase.narrative.jobs.jobcomm import exc_to_msg
from biokbase.narrative.jobs.job import get_dne_job_state
import biokbase.narrative.jobs.jobcomm
import biokbase.narrative.jobs.jobmanager
from biokbase.narrative.jobs.jobmanager import (
    JOB_NOT_REG_ERR,
    JOB_NOT_BATCH_ERR,
    JOBS_TYPE_ERR,
    JOBS_MISSING_FALSY_ERR,
)
from biokbase.narrative.jobs.jobcomm import (
    JobRequest,
    JobComm,
    JOB_NOT_PROVIDED_ERR,
    JOBS_NOT_PROVIDED_ERR,
)
from biokbase.narrative.exception_util import (
    NarrativeException,
    JobIDException,
)

from .util import ConfigTests, validate_job_state
from .narrative_mock.mockcomm import MockComm
from .narrative_mock.mockclients import get_mock_client, get_failing_mock_client
from .test_job import (
    JOB_COMPLETED,
    JOB_CREATED,
    JOB_RUNNING,
    JOB_TERMINATED,
    JOB_ERROR,
    JOB_NOT_FOUND,
    BATCH_PARENT,
    BATCH_COMPLETED,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    BATCH_ERROR_RETRIED,
    BATCH_RETRY_COMPLETED,
    BATCH_RETRY_RUNNING,
    BATCH_RETRY_ERROR,
    ALL_JOBS,
    JOBS_TERMINALITY,
    TERMINAL_JOBS,
    ACTIVE_JOBS,
    BATCH_CHILDREN,
    get_test_job,
    get_test_spec,
    TEST_SPECS,
    get_test_job_states,
    get_cell_2_jobs,
)
from .test_jobmanager import get_test_job_info, get_test_job_infos


APP_NAME = "The Best App in the World"
EXP_ALL_STATE_IDS = ALL_JOBS  # or ACTIVE_JOBS


def make_comm_msg(
    msg_type: str, job_id_like, as_job_request: bool, content: dict = None
):
    if type(job_id_like) is list:
        job_id_key = "job_id_list"
    else:
        job_id_key = "job_id"
    msg = {
        "msg_id": "some_id",
        "content": {"data": {"request_type": msg_type, job_id_key: job_id_like}},
    }
    if content is not None:
        msg["content"]["data"].update(content)
    if as_job_request:
        return JobRequest(msg)
    else:
        return msg


def get_app_data(*args):
    return {"info": {"name": APP_NAME}}


class JobCommTestCase(unittest.TestCase):
    maxDiff = None

    @classmethod
    @mock.patch("biokbase.narrative.jobs.jobcomm.Comm", MockComm)
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def setUpClass(cls):
        cls.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        config = ConfigTests()
        os.environ["KB_WORKSPACE_ID"] = config.get("jobs", "job_test_wsname")

        cls.jc = biokbase.narrative.jobs.jobcomm.JobComm()
        cls.jc._comm = MockComm()

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def setUp(self):
        self.jc._comm.clear_message_cache()
        self.jc._jm.initialize_jobs()
        self.jc.stop_job_status_loop()
        self.job_states = get_test_job_states()

    def check_error_message(self, source, input_, err):
        """
        response when no input was submitted with a query
        args:
          input: the dict with job_id/job_id_list key and value
          source: the request that was called
          name: the type of exception
          message: the error message
        """
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_comm_error",
                "content": {
                    "source": source,
                    **input_,
                    "name": type(err).__name__,
                    "message": str(err),
                },
            },
            msg["data"],
        )

    # ---------------------
    # Send comms methods
    # ---------------------
    def test_send_comm_msg_ok(self):
        self.jc.send_comm_message("some_msg", {"foo": "bar"})
        msg = self.jc._comm.last_message
        self.assertDictEqual(
            msg,
            {
                "content": None,
                "data": {"content": {"foo": "bar"}, "msg_type": "some_msg"},
            },
        )
        self.jc._comm.clear_message_cache()

    def test_send_error_msg__JobRequest(self):
        msg = make_comm_msg("bar", "aeaeae", True)
        self.jc.send_error_message("foo", msg, {"extra": "field"})
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "foo",
                "content": {
                    "source": "bar",
                    "job_id": "aeaeae",
                    "extra": "field"
                }
            },
            msg["data"]
        )

    def test_send_error_msg__dict(self):
        msg = make_comm_msg("bar", "aeaeae", False)
        self.jc.send_error_message("foo", msg, {"extra": "field"})
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "foo",
                "content": {
                    "source": "bar",
                    "job_id": "aeaeae",
                    "extra": "field"
                }
            },
            msg["data"]
        )

    def test_send_error_msg__None(self):
        self.jc.send_error_message("foo", None, {"extra": "field"})
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "foo",
                "content": {
                    "source": None,
                    "extra": "field"
                }
            },
            msg["data"]
        )

    def test_send_error_msg__str(self):
        source = "test_jobcomm"
        self.jc.send_error_message("foo", source, {"extra": "field"})
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "foo",
                "content": {
                    "source": source,
                    "extra": "field"
                }
            },
            msg["data"]
        )

    # ---------------------
    # Requests
    # ---------------------
    def test_req_no_inputs__succeed(self):
        msg = {
            "msg_id": "some_id",
            "content": {"data": {
                "request_type": "all_status",
            }},
        }
        self.jc._handle_comm_message(msg)
        msg = self.jc._comm.last_message
        self.assertEqual("job_status_all", msg["data"]["msg_type"])

    def test_req_no_inputs__fail(self):
        msg = {
            "msg_id": "some_id",
            "content": {"data": {
                "request_type": "job_status_batch",
            }},
        }
        err = JobIDException(JOB_NOT_PROVIDED_ERR)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(msg)
        self.check_error_message("job_status_batch", {}, err)

        msg = {
            "msg_id": "some_id",
            "content": {"data": {
                "request_type": "retry_job",
            }},
        }
        err = JobIDException(JOBS_NOT_PROVIDED_ERR)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(msg)
        self.check_error_message("retry_job", {}, err)

    # ---------------------
    # Start job status loop
    # ---------------------
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_start_stop_job_status_loop(self):
        self.assertFalse(self.jc._running_lookup_loop)
        self.assertIsNone(self.jc._lookup_timer)

        self.jc.start_job_status_loop()
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status_all",
                "content": get_test_job_states(EXP_ALL_STATE_IDS),
            },
            msg["data"],
        )
        self.assertTrue(self.jc._running_lookup_loop)
        self.assertIsNotNone(self.jc._lookup_timer)

        self.jc.stop_job_status_loop()
        self.assertFalse(self.jc._running_lookup_loop)
        self.assertIsNone(self.jc._lookup_timer)

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
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
                        "msg_type": "job_status_all",
                        "content": get_test_job_states(
                            EXP_ALL_STATE_IDS
                        ),  # consult version history for when this was exp_job_ids
                    },
                    msg["data"],
                )

                self.assertTrue(self.jc._running_lookup_loop)
                self.assertTrue(self.jc._lookup_timer)

                self.jc.stop_job_status_loop()
                self.assertFalse(self.jc._running_lookup_loop)
                self.assertIsNone(self.jc._lookup_timer)

    # ---------------------
    # Lookup all job states
    # ---------------------
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_lookup_all_job_states__ok(self):
        req = make_comm_msg("all_status", None, True)
        states = self.jc._lookup_all_job_states(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status_all",
                "content": get_test_job_states(EXP_ALL_STATE_IDS),
            },
            msg["data"],
        )
        for job_id, state in states.items():
            self.assertIsInstance(job_id, str)
            validate_job_state(state)

    # -----------------------
    # Lookup single job state
    # -----------------------
    def test_lookup_job_state__1_ok(self):
        output_states = self.jc.lookup_job_state(JOB_COMPLETED)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": output_states,
            },
            msg["data"],
        )
        for job_id, state in output_states.items():
            self.assertEqual(self.job_states[job_id], state)
            validate_job_state(state)

    def test_lookup_job_state__no_job(self):
        with self.assertRaisesRegex(JobIDException, re.escape(f"{JOBS_MISSING_FALSY_ERR}: {[None]}")):
            self.jc.lookup_job_state(None)

    # -----------------------
    # Lookup select job states
    # -----------------------
    def test_lookup_job_states__1_ok(self):
        job_id_list = [JOB_COMPLETED]
        req = make_comm_msg("job_status", job_id_list, True)
        output_states = self.jc._lookup_job_states(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": output_states,
            },
            msg["data"],
        )
        for job_id, state in output_states.items():
            self.assertEqual(self.job_states[job_id], state)
            validate_job_state(state)

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_lookup_job_states__2_ok(self):
        job_id_list = [JOB_COMPLETED, BATCH_PARENT]
        req = make_comm_msg("job_status", job_id_list, True)
        output_states = self.jc._lookup_job_states(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": output_states,
            },
            msg["data"],
        )
        for job_id, state in output_states.items():
            self.assertEqual(self.job_states[job_id], state)
            validate_job_state(state)

    def test_lookup_job_states__no_job(self):
        job_id_list = [None]
        req = make_comm_msg("job_status", job_id_list, False)
        err = JobIDException(JOBS_MISSING_FALSY_ERR, job_id_list)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req)
        self.check_error_message(
            "job_status", {"job_id_list": job_id_list}, err
        )

    def test_lookup_job_states__ok_bad(self):
        job_id_list = ["nope", JOB_COMPLETED]
        req = make_comm_msg("job_status", job_id_list, True)
        output_states = self.jc._lookup_job_states(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"msg_type": "job_status", "content": output_states},
            msg["data"],
        )
        for job_id, state in output_states.items():
            if job_id in self.job_states:
                self.assertEqual(self.job_states[job_id], state)
                validate_job_state(state)
            else:
                self.assertEqual(get_dne_job_state(job_id), state)

    # -----------------------
    # Lookup batch job states
    # -----------------------
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_lookup_job_states_batch__ok(self):
        job_id = BATCH_PARENT
        req = make_comm_msg("job_status_batch", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": {
                    job_id: self.job_states[job_id]
                    for job_id in [BATCH_PARENT] + BATCH_CHILDREN
                },
            },
            msg["data"],
        )

    def test_lookup_job_states_batch__dne(self):
        job_id = JOB_NOT_FOUND
        req = make_comm_msg("job_status_batch", job_id, False)
        err = JobIDException(JOB_NOT_REG_ERR, job_id)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req)
        msg = self.jc._comm.peek_message(-2)
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": {JOB_NOT_FOUND: get_dne_job_state(JOB_NOT_FOUND)},
            },
            msg["data"],
        )
        self.check_error_message(
            "job_status_batch", {"job_id": job_id}, err
        )

    def test_lookup_job_states_batch__no_job(self):
        job_id = None
        req = make_comm_msg("job_status_batch", job_id, False)
        err = JobIDException(JOB_NOT_REG_ERR, job_id)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req)
        self.check_error_message(
            "job_status_batch", {"job_id": job_id}, err
        )

    def test_lookup_job_states_batch__not_batch(self):
        job_id = JOB_CREATED
        req = make_comm_msg("job_status_batch", job_id, False)
        err = JobIDException(JOB_NOT_BATCH_ERR, job_id)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req)
        self.check_error_message(
            "job_status_batch", {"job_id": job_id}, err
        )

    # -----------------------
    # Lookup job info
    # -----------------------
    def test_lookup_job_info__ok(self):
        job_id_list = ALL_JOBS
        req = make_comm_msg("job_info", job_id_list, True)
        self.jc._lookup_job_info(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_info",
                "content": get_test_job_infos(job_id_list),
            },
            msg["data"],
        )

    def test_lookup_job_info__no_job(self):
        job_id_list = [None]
        req = make_comm_msg("job_info", job_id_list, False)
        err = JobIDException(JOBS_MISSING_FALSY_ERR, job_id_list)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req)
        self.check_error_message(
            "job_info", {"job_id_list": job_id_list}, err
        )

    def test_lookup_job_info__ok_bad(self):
        job_id_list = [JOB_COMPLETED, JOB_NOT_FOUND]
        req = make_comm_msg("job_info", job_id_list, True)
        self.jc._lookup_job_info(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_info",
                "content": {
                    JOB_COMPLETED: get_test_job_info(JOB_COMPLETED),
                    JOB_NOT_FOUND: "does_not_exist",
                },
            },
            msg["data"],
        )

    # ------------
    # Lookup batch job infos
    # ------------
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_lookup_job_info_batch__ok(self):
        job_id = BATCH_PARENT
        req = make_comm_msg("job_info_batch", job_id, True)
        self.jc._lookup_job_info_batch(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_info",
                "content": get_test_job_infos([BATCH_PARENT] + BATCH_CHILDREN),
            },
            msg["data"],
        )

    def test_lookup_job_info_batch__no_job(self):
        job_id = None
        req = make_comm_msg("job_info_batch", job_id, False)
        err = JobIDException(JOB_NOT_REG_ERR, job_id)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)
        self.check_error_message("job_info_batch", {"job_id": job_id}, err)

    def test_lookup_job_info_batch__dne(self):
        job_id = JOB_NOT_FOUND
        req = make_comm_msg("job_info_batch", job_id, False)
        err = JobIDException(JOB_NOT_REG_ERR, job_id)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)
        self.check_error_message("job_info_batch", {"job_id": job_id}, err)

    def test_lookup_job_info_batch__not_batch(self):
        job_id = BATCH_COMPLETED
        req = make_comm_msg("job_info_batch", job_id, False)
        err = JobIDException(JOB_NOT_BATCH_ERR, job_id)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)
        self.check_error_message("job_info_batch", {"job_id": job_id}, err)

    # ------------
    # Cancel list of jobs
    # ------------
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_cancel_jobs__single_job_id_in(self):
        job_id = JOB_RUNNING
        req = make_comm_msg("cancel_job", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": {
                    JOB_RUNNING: self.job_states[JOB_RUNNING],
                },
            },
            msg["data"],
        )

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_cancel_jobs__1_ok(self):
        job_id_list = [JOB_RUNNING]
        req = make_comm_msg("cancel_job", job_id_list, True)
        self.jc._cancel_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": {
                    JOB_RUNNING: self.job_states[JOB_RUNNING],
                },
            },
            msg["data"],
        )

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_cancel_jobs__2_ok(self):
        job_id_list = [JOB_CREATED, JOB_RUNNING, None]
        req = make_comm_msg("cancel_job", job_id_list, True)
        self.jc._cancel_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": {
                    JOB_CREATED: self.job_states[JOB_CREATED],
                    JOB_RUNNING: self.job_states[JOB_RUNNING],
                },
            },
            msg["data"],
        )

    def test_cancel_jobs__no_job(self):
        job_id_list = None
        # Create req manually because want job_id_list to be not list
        req = {
            "msg_id": "some_id",
            "content": {"data": {"request_type": "cancel_job", "job_id_list": job_id_list}},
        }
        err = TypeError(JOBS_TYPE_ERR)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)

        job_id_list = [None, ""]
        req = make_comm_msg("cancel_job", job_id_list, False)
        err = JobIDException(JOBS_MISSING_FALSY_ERR, job_id_list)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req)
        self.check_error_message("cancel_job", {"job_id_list": job_id_list}, err)

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_cancel_jobs__some_bad_jobs(self):
        FAKE_JOB = "fake_job_id"
        job_id_list = [
            None,
            JOB_NOT_FOUND,
            JOB_NOT_FOUND,
            "",
            JOB_RUNNING,
            JOB_CREATED,
            FAKE_JOB,
        ]
        req = make_comm_msg("cancel_job", job_id_list, True)
        self.jc._cancel_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": {
                    JOB_RUNNING: self.job_states[JOB_RUNNING],
                    JOB_CREATED: self.job_states[JOB_CREATED],
                    JOB_NOT_FOUND: get_dne_job_state(JOB_NOT_FOUND),
                    FAKE_JOB: get_dne_job_state(FAKE_JOB),
                },
            },
            msg["data"],
        )

    def test_cancel_jobs__all_bad_jobs(self):
        FAKE_JOB = "fake_job_id"
        job_id_list = [None, "", JOB_NOT_FOUND, JOB_NOT_FOUND, FAKE_JOB]
        req = make_comm_msg("cancel_job", job_id_list, True)
        self.jc._cancel_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": {
                    JOB_NOT_FOUND: get_dne_job_state(JOB_NOT_FOUND),
                    FAKE_JOB: get_dne_job_state(FAKE_JOB),
                },
            },
            msg["data"],
        )

    @mock.patch(
        "biokbase.narrative.clients.get",
        get_failing_mock_client,
    )
    def test_cancel_jobs__failure(self):
        job_id_list = [JOB_RUNNING]
        req = make_comm_msg("cancel_job", job_id_list, False)
        with self.assertRaises(NarrativeException) as e:
            self.jc._handle_comm_message(req)
        self.assertIn("Can't cancel job", str(e.exception))
        msg = self.jc._comm.last_message
        self.assertEqual("job_comm_error", msg["data"]["msg_type"])
        self.assertEqual("cancel_job", msg["data"]["content"]["source"])
        self.assertEqual(job_id_list, msg["data"]["content"]["job_id_list"])
        self.assertEqual("Unable to cancel job", msg["data"]["content"]["error"])

    # ------------
    # Retry list of jobs
    # ------------
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_retry_jobs_1_ok(self):
        job_id_list = [JOB_TERMINATED]
        req = make_comm_msg("retry_job", job_id_list, True)
        self.jc._retry_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"job_id_list": [JOB_TERMINATED[::-1]]}, msg["data"]["content"]
        )
        self.assertEqual("new_job", msg["data"]["msg_type"])

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_retry_jobs_2_ok(self):
        job_id_list = [JOB_TERMINATED, JOB_ERROR, None]
        req = make_comm_msg("retry_job", job_id_list, True)
        self.jc._retry_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"job_id_list": [JOB_TERMINATED[::-1], JOB_ERROR[::-1]]},
            msg["data"]["content"],
        )
        self.assertEqual("new_job", msg["data"]["msg_type"])

    def test_retry_jobs_no_job(self):
        job_id_list = [None, ""]
        req = make_comm_msg("retry_job", job_id_list, False)
        err = JobIDException(JOBS_MISSING_FALSY_ERR, job_id_list)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req)
        self.check_error_message("retry_job", {"job_id_list": job_id_list}, err)

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_retry_jobs_some_bad_jobs(self):
        job_id_list = [JOB_TERMINATED, "nope", "no"]
        req = make_comm_msg("retry_job", job_id_list, True)
        self.jc._retry_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"job_id_list": [JOB_TERMINATED[::-1]]}, msg["data"]["content"]
        )
        self.assertEqual("new_job", msg["data"]["msg_type"])

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_retry_jobs_all_bad_jobs(self):
        job_id_list = ["nope", "no"]
        req = make_comm_msg("retry_job", job_id_list, True)
        self.jc._retry_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual({"job_id_list": []}, msg["data"]["content"])
        self.assertEqual("new_job", msg["data"]["msg_type"])

    @mock.patch(
        "biokbase.narrative.clients.get",
        get_failing_mock_client,
    )
    def test_retry_jobs_failure(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED, JOB_TERMINATED]
        req = make_comm_msg("retry_job", job_id_list, False)
        with self.assertRaises(NarrativeException) as e:
            self.jc._handle_comm_message(req)
        self.assertIn("Jobs retry failed", str(e.exception))
        msg = self.jc._comm.last_message
        self.assertEqual("job_comm_error", msg["data"]["msg_type"])
        self.assertEqual(job_id_list, msg["data"]["content"]["job_id_list"])
        self.assertEqual("Unable to retry job(s)", msg["data"]["content"]["error"])

    # -----------------
    # Fetching job logs
    # -----------------
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_get_job_logs_ok(self):
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
            req = make_comm_msg("job_logs", job_id, True, content)
            self.jc._get_job_logs(req)
            msg = self.jc._comm.last_message
            self.assertEqual(job_id, msg["data"]["content"]["job_id"])
            self.assertEqual(None, msg["data"]["content"]["batch_id"])
            self.assertEqual("job_logs", msg["data"]["msg_type"])
            self.assertEqual(lines_available, msg["data"]["content"]["max_lines"])
            self.assertEqual(c[3], len(msg["data"]["content"]["lines"]))
            self.assertEqual(c[2], msg["data"]["content"]["latest"])
            first = 0 if c[1] is None and c[2] is True else c[0]
            n_lines = c[1] if c[1] else lines_available
            if first < 0:
                first = 0
            if c[2]:
                first = lines_available - min(n_lines, lines_available)

            self.assertEqual(first, msg["data"]["content"]["first"])
            for idx, line in enumerate(msg["data"]["content"]["lines"]):
                self.assertIn(str(first + idx), line["line"])
                self.assertEqual(0, line["is_error"])

    @mock.patch(
        "biokbase.narrative.clients.get",
        get_failing_mock_client,
    )
    def test_get_job_logs_failure(self):
        job_id = JOB_COMPLETED
        req = make_comm_msg("job_logs", job_id, False)
        with self.assertRaises(NarrativeException) as e:
            self.jc._handle_comm_message(req)
        self.assertIn("Can't get job logs", str(e.exception))
        msg = self.jc._comm.last_message
        self.assertEqual("job_comm_error", msg["data"]["msg_type"])
        self.assertEqual("Unable to retrieve job logs", msg["data"]["content"]["error"])

    def test_get_job_logs_no_job(self):
        job_id = None
        req = make_comm_msg("job_logs", job_id, False)
        err = JobIDException(JOB_NOT_REG_ERR, job_id)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)
        self.check_error_message("job_logs", {"job_id": job_id}, err)

    def test_get_job_logs_bad_job(self):
        job_id = "bad_job"
        req = make_comm_msg("job_logs", job_id, False)
        err = JobIDException(JOB_NOT_REG_ERR, job_id)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)
        self.check_error_message("job_logs", {"job_id": job_id}, err)

    # ------------------------
    # Modify job update
    # ------------------------
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_modify_job_update__start__ok(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED, BATCH_PARENT]
        req = make_comm_msg("start_job_update", job_id_list, True)
        self.jc._modify_job_updates(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"msg_type": "job_status", "content": get_test_job_states(job_id_list)},
            msg["data"],
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

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_modify_job_update__stop__ok(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED, BATCH_PARENT]
        req = make_comm_msg("stop_job_update", job_id_list, True)
        self.jc._modify_job_updates(req)
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

    def test_modify_job_update__no_job(self):
        job_id_list = [None]
        req = make_comm_msg("start_job_update", job_id_list, False)
        err = JobIDException(JOBS_MISSING_FALSY_ERR, job_id_list)
        with self.assertRaisesRegex(type(err), re.escape(str(err))):
            self.jc._handle_comm_message(req)
        self.check_error_message("start_job_update", {"job_id_list": job_id_list}, err)

    def test_modify_job_update__stop__ok_bad_job(self):
        job_id_list = [JOB_COMPLETED]
        req = make_comm_msg("stop_job_update", job_id_list + [JOB_NOT_FOUND], True)
        self.jc._modify_job_updates(req)
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

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_modify_job_update__stop__loop_still_running(self):
        """Lookup loop should not get stopped"""
        self.jc.start_job_status_loop()

        job_id_list = [JOB_COMPLETED, BATCH_PARENT, JOB_RUNNING]
        req = make_comm_msg("stop_job_update", job_id_list, True)
        self.jc._modify_job_updates(req)
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
    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_modify_job_update_batch__start__ok(self):
        job_id = BATCH_PARENT
        job_id_list = [BATCH_PARENT] + BATCH_CHILDREN
        req = make_comm_msg("start_job_update_batch", job_id, True)
        self.jc._modify_job_updates_batch(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"msg_type": "job_status", "content": get_test_job_states(job_id_list)},
            msg["data"],
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

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_modify_job_update_batch__stop__ok(self):
        job_id = BATCH_PARENT
        job_id_list = [BATCH_PARENT] + BATCH_CHILDREN
        req = make_comm_msg("stop_job_update_batch", job_id, True)
        self.jc._modify_job_updates_batch(req)
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

    def test_modify_job_update_batch__no_job(self):
        job_id = None
        req = make_comm_msg("start_job_update_batch", job_id, False)
        err = JobIDException(JOB_NOT_REG_ERR, job_id)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)
        self.check_error_message("start_job_update_batch", {"job_id": job_id}, err)

    def test_modify_job_update_batch__bad_job(self):
        job_id = JOB_NOT_FOUND
        req = make_comm_msg("start_job_update_batch", job_id, False)
        err = JobIDException(JOB_NOT_REG_ERR, job_id)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)
        self.check_error_message("start_job_update_batch", {"job_id": job_id}, err)

    def test_modify_job_update_batch__not_batch(self):
        job_id = JOB_RUNNING
        req = make_comm_msg("start_job_update_batch", job_id, False)
        err = JobIDException(JOB_NOT_BATCH_ERR, job_id)
        with self.assertRaisesRegex(type(err), str(err)):
            self.jc._handle_comm_message(req)
        self.check_error_message("start_job_update_batch", {"job_id": job_id}, err)

    # ------------------------
    # Handle bad comm messages
    # ------------------------
    def test_handle_comm_message_bad(self):
        with self.assertRaises(ValueError) as e:
            self.jc._handle_comm_message({"foo": "bar"})
        self.assertIn("Improperly formatted job channel message!", str(e.exception))
        with self.assertRaises(ValueError) as e:
            self.jc._handle_comm_message({"content": {"data": {"request_type": None}}})
        self.assertIn("Missing request type in job channel message!", str(e.exception))

    def test_handle_comm_message_unknown(self):
        unknown = "NotAJobRequest"
        with self.assertRaises(ValueError) as e:
            self.jc._handle_comm_message(
                {"content": {"data": {"request_type": unknown}}}
            )
        self.assertIn(f"Unknown KBaseJobs message '{unknown}'", str(e.exception))

    # From here, this test the ability for the _handle_comm_message function to
    # deal with the various types of messages that will get passed to it. While
    # the majority of the tests above are sent directly to the function to be
    # tested, these just craft the message and pass it to the message handler.
    def test_handle_all_states_msg(self):
        req = make_comm_msg("all_status", None, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(msg["data"]["msg_type"], "job_status_all")
        states = msg["data"]["content"]
        self.assertIsInstance(states, dict)
        for job_id in states:
            print("ALL JOB STATE TESTING")
            print(states[job_id])
            validate_job_state(states[job_id])

    def test_handle_job_status_msg(self):
        job_id = JOB_COMPLETED
        req = make_comm_msg("job_status", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(msg["data"]["msg_type"], "job_status")
        validate_job_state(msg["data"]["content"][JOB_COMPLETED])

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_job_info_msg(self):
        job_id = JOB_COMPLETED
        req = make_comm_msg("job_info", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"msg_type": "job_info", "content": {job_id: get_test_job_info(job_id)}},
            msg["data"],
        )

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_job_status_batch_msg(self):
        job_id = BATCH_PARENT
        req = make_comm_msg("job_status_batch", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": get_test_job_states([BATCH_PARENT] + BATCH_CHILDREN),
            },
            msg["data"],
        )

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_job_info_batch_msg(self):
        job_id = BATCH_PARENT
        req = make_comm_msg("job_info_batch", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_info",
                "content": get_test_job_infos([BATCH_PARENT] + BATCH_CHILDREN),
            },
            msg["data"],
        )

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_cancel_job_msg(self):
        job_id = JOB_COMPLETED
        req = make_comm_msg("cancel_job", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(msg["data"]["msg_type"], "job_status")

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_start_job_update_msg(self):
        job_id_list = [JOB_CREATED, JOB_COMPLETED, BATCH_PARENT]
        req = make_comm_msg("start_job_update", job_id_list, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"msg_type": "job_status", "content": get_test_job_states(job_id_list)},
            msg["data"],
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

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_stop_job_update_msg(self):
        job_id_list = [JOB_CREATED, JOB_COMPLETED, BATCH_PARENT]
        req = make_comm_msg("stop_job_update", job_id_list, False)
        self.jc._handle_comm_message(req)
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

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_start_job_update_batch_msg(self):
        job_id = BATCH_PARENT
        job_id_list = [BATCH_PARENT] + BATCH_CHILDREN
        req = make_comm_msg("start_job_update_batch", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"msg_type": "job_status", "content": get_test_job_states(job_id_list)},
            msg["data"],
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

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_stop_job_update_batch_msg(self):
        job_id = BATCH_PARENT
        job_id_list = [BATCH_PARENT] + BATCH_CHILDREN
        req = make_comm_msg("stop_job_update_batch", job_id, False)
        self.jc._handle_comm_message(req)
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

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_latest_job_logs_msg(self):
        job_id = JOB_COMPLETED
        req = make_comm_msg(
            "job_logs", job_id, False, content={"num_lines": 10, "latest": True}
        )
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(msg["data"]["msg_type"], "job_logs")
        self.assertEqual(msg["data"]["content"]["job_id"], job_id)
        self.assertTrue(msg["data"]["content"]["latest"])
        self.assertEqual(msg["data"]["content"]["first"], 90)
        self.assertEqual(msg["data"]["content"]["max_lines"], 100)
        self.assertEqual(len(msg["data"]["content"]["lines"]), 10)

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_job_logs_msg(self):
        job_id = JOB_COMPLETED
        req = make_comm_msg(
            "job_logs", job_id, False, content={"num_lines": 10, "first_line": 0}
        )
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(msg["data"]["msg_type"], "job_logs")
        self.assertEqual(msg["data"]["content"]["job_id"], job_id)
        self.assertFalse(msg["data"]["content"]["latest"])
        self.assertEqual(msg["data"]["content"]["first"], 0)
        self.assertEqual(msg["data"]["content"]["max_lines"], 100)
        self.assertEqual(len(msg["data"]["content"]["lines"]), 10)

    @mock.patch(
        "biokbase.narrative.clients.get", get_mock_client
    )
    def test_handle_cancel_job_msg_with_job_id_list(self):
        job_id_list = [JOB_COMPLETED]
        req = make_comm_msg("cancel_job", job_id_list, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(msg["data"]["msg_type"], "job_status")


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
        self.assertEqual(rq.request, "a_request")
        with self.assertRaisesRegex(JobIDException, JOB_NOT_PROVIDED_ERR):
            rq.job_id
        with self.assertRaisesRegex(JobIDException, JOBS_NOT_PROVIDED_ERR):
            rq.job_id_list

    def test_request_no_data(self):
        rq_msg = {"msg_id": "some_id", "content": {}}
        with self.assertRaises(ValueError) as e:
            JobRequest(rq_msg)
        self.assertIn("Improperly formatted job channel message!", str(e.exception))

    def test_request_no_req(self):
        rq_msg = {"msg_id": "some_id", "content": {"data": {"request_type": None}}}
        rq_msg2 = {"msg_id": "some_other_id", "content": {"data": {}}}
        for msg in [rq_msg, rq_msg2]:
            with self.assertRaises(ValueError) as e:
                JobRequest(msg)
            self.assertIn(
                "Missing request type in job channel message!", str(e.exception)
            )

    def test_request_both_inputs(self):
        msg = {
            "msg_id": "some_id",
            "content": {"data": {
                "request_type": "job_status",
                "job_id": "ababab",
                "job_id_list": []
            }},
        }
        with self.assertRaisesRegex(ValueError, "Both job_id and job_id_list present"):
            JobRequest(msg)

    def test_request__no_input(self):
        msg = {
            "msg_id": "some_id",
            "content": {"data": {
                "request_type": "job_status",
            }},
        }
        req = JobRequest(msg)

        with self.assertRaisesRegex(JobIDException, JOB_NOT_PROVIDED_ERR):
            req.job_id
        with self.assertRaisesRegex(JobIDException, JOBS_NOT_PROVIDED_ERR):
            req.job_id_list

    def _check_rq_equal(self, rq0, rq1):
        self.assertEqual(rq0.msg_id, rq1.msg_id)
        self.assertEqual(rq0.rq_data, rq1.rq_data)
        self.assertEqual(rq0.request, rq1.request)
        self.assertEqual(rq0.job_id, rq1.job_id)

    def test_convert_to_using_job_id_list(self):
        rq_msg = make_comm_msg("a_request", "a", False)
        rq = JobRequest._convert_to_using_job_id_list(rq_msg)
        self.assertEqual(rq.request, "a_request")
        with self.assertRaisesRegex(JobIDException, JOB_NOT_PROVIDED_ERR):
            rq.job_id
        self.assertEqual(rq.job_id_list, ["a"])

    def test_split_request_by_job_id(self):
        rq_msg = make_comm_msg("a_request", ["a", "b", "c"], False)
        rqa0 = make_comm_msg("a_request", "a", True)
        rqb0 = make_comm_msg("a_request", "b", True)
        rqc0 = make_comm_msg("a_request", "c", True)
        rqa1, rqb1, rqc1 = JobRequest._split_request_by_job_id(rq_msg)
        self._check_rq_equal(rqa0, rqa1)
        self._check_rq_equal(rqb0, rqb1)
        self._check_rq_equal(rqc0, rqc1)

    def test_translate_require_job_id(self):
        rq_msg = make_comm_msg(JobRequest.REQUIRE_JOB_ID[0], "a", False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 1)
        self.assertEqual(rqs[0].job_id, "a")
        with self.assertRaisesRegex(JobIDException, JOBS_NOT_PROVIDED_ERR):
            rqs[0].job_id_list

        rq_msg = make_comm_msg(JobRequest.REQUIRE_JOB_ID[0], ["a", "b"], False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 2)
        self.assertEqual(rqs[0].job_id, "a")
        with self.assertRaisesRegex(JobIDException, JOBS_NOT_PROVIDED_ERR):
            rqs[0].job_id_list
        self.assertEqual(rqs[1].job_id, "b")
        with self.assertRaisesRegex(JobIDException, JOBS_NOT_PROVIDED_ERR):
            rqs[1].job_id_list

    def test_translate_require_job_id_list(self):
        rq_msg = make_comm_msg(JobRequest.REQUIRE_JOB_ID_LIST[0], "a", False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 1)
        with self.assertRaisesRegex(JobIDException, JOB_NOT_PROVIDED_ERR):
            rqs[0].job_id
        self.assertEqual(rqs[0].job_id_list, ["a"])

        rq_msg = make_comm_msg(JobRequest.REQUIRE_JOB_ID_LIST[0], ["a", "b"], False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 1)
        with self.assertRaisesRegex(JobIDException, JOB_NOT_PROVIDED_ERR):
            rqs[0].job_id
        self.assertEqual(rqs[0].job_id_list, ["a", "b"])

    def test_translate_doesnt_require_any_job_ids(self):
        rq_msg = make_comm_msg("all_status", None, False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 1)

    def test_translate_both_inputs(self):
        msg = {
            "msg_id": "some_id",
            "content": {"data": {
                "request_type": "job_status",
                "job_id": "ababab",
                "job_id_list": []
            }},
        }
        with self.assertRaisesRegex(ValueError, "Both job_id and job_id_list present"):
            JobRequest.translate(msg)


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
                "msg_type": "job_comm_error",
                "content": {
                    "source": req_type,
                    "job_id_list": job_id_list,
                    "name": "RuntimeError",
                    "message": message,
                }
            },
            msg["data"]
        )

    def test_with_nested_try__succeed(self):
        job_id_list = [BATCH_ERROR_RETRIED, JOB_RUNNING]
        req_type = "cancel_job"
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
                "msg_type": "job_comm_error",
                "content": {
                    "source": req_type,
                    "job_id_list": job_id_list,
                    # Below are from transform_job_exception
                    "name": "Exception",
                    "message": message,
                    "error": error,
                    "code": -1,
                }
            },
            msg["data"]
        )

    def test_JobIDException(self):
        job_id = BATCH_PARENT
        req_type = "job_info_all"
        req = make_comm_msg(req_type, job_id, True)
        message = (
            "Because even if I should speak, "
            "no one would believe me. "
            "And they would not believe me precisely because "
            "they would know that what I said was true."
        )

        def f():
            raise JobIDException(message, "a0a0a0")

        with self.assertRaisesRegex(JobIDException, f"{message}: a0a0a0"):
            self.foo(req, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_comm_error",
                "content": {
                    "source": req_type,
                    "job_id": job_id,
                    "name": "JobIDException",
                    "message": f"{message}: a0a0a0",
                }
            },
            msg["data"]
        )

    def test_ValueError(self):
        job_id_list = [JOB_RUNNING, JOB_COMPLETED]
        req_type = "job_status"
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
                "msg_type": "job_comm_error",
                "content": {
                    "source": req_type,
                    "job_id_list": job_id_list,
                    "name": "ValueError",
                    "message": message,
                }
            },
            msg["data"]
        )

    def test_dict_req__no_err(self):
        job_id = JOB_ERROR
        req_type = "retry_job"
        req = make_comm_msg(req_type, job_id, False)
        message = (
            "Casteism can mean seeking to keep those on your "
            "disfavored rung from gaining on you, to curry the "
            "favor and remain in the good graces of the dominant "
            "caste, all of which serve to keep the structure intact."
        )

        def f():
            print(message)

        self.foo(req, f)
        msg = self.jc._comm.last_message
        self.assertIsNone(msg)

    def test_dict_req__error_down_the_stack(self):
        job_id = JOB_CREATED
        req_type = "job_status"
        req = make_comm_msg(req_type, job_id, False)
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
            self.foo(req, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_comm_error",
                "content": {
                    "source": req_type,
                    "job_id": job_id,
                    "name": "ValueError",
                    "message": message,
                }
            },
            msg["data"]
        )

    def test_dict_req__both_inputs(self):
        job_id = JOB_CREATED
        job_id_list = []
        req_type = "job_status"
        # can give it both job_id and job_id_list since it's not a JobRequest
        req = make_comm_msg(req_type, job_id, False)
        req["content"]["data"]["job_id_list"] = job_id_list
        message = (
            "What some people call racism could be seen as merely "
            "one manifestation of the degree to which we have internalized "
            "the larger American caste system."
        )

        def f():
            raise ValueError(message)

        with self.assertRaisesRegex(ValueError, message):
            self.foo(req, f)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_comm_error",
                "content": {
                    "source": req_type,
                    "job_id": job_id,
                    "job_id_list": job_id_list,
                    "name": "ValueError",
                    "message": message,
                }
            },
            msg["data"]
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
                "msg_type": "job_comm_error",
                "content": {
                    "source": source,
                    "name": "ValueError",
                    "message": message,
                }
            },
            msg["data"]
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
                "msg_type": "job_comm_error",
                "content": {
                    "source": source,
                    "name": "ValueError",
                    "message": message,
                }
            },
            msg["data"]
        )
