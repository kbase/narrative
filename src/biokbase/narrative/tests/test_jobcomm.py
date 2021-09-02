import unittest
from unittest import mock
import os

from biokbase.narrative.jobs.job import get_dne_job_state, JOB_ATTR_DEFAULTS
import biokbase.narrative.jobs.jobcomm
import biokbase.narrative.jobs.jobmanager
from biokbase.narrative.jobs.jobcomm import (
    JobRequest,
    NO_JOB_ERR,
)
from biokbase.narrative.exception_util import (
    NarrativeException,
    NoJobException,
    NotBatchException,
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
    FINISHED_JOBS,
    ACTIVE_JOBS,
    BATCH_CHILDREN,
    get_test_job,
    get_test_spec,
    TEST_SPECS,
    get_test_job_states,
)


APP_NAME = "The Best App in the World"


def get_test_job_infos(job_ids):
    return {job_id: get_test_job_info(job_id) for job_id in job_ids}


def get_test_job_info(job_id):
    test_job = get_test_job(job_id)
    app_id = test_job.get("job_input", {}).get("app_id", None)
    tag = (
        test_job.get("job_input", {})
        .get("narrative_cell_info", {})
        .get("tag", "release")
    )
    test_spec = get_test_spec(tag, app_id)
    params = test_job.get("job_input", {}).get("params", {})
    batch_id = test_job.get("batch_id", JOB_ATTR_DEFAULTS["batch_id"])
    return {
        "app_id": app_id,
        "app_name": test_spec["info"]["name"],
        "job_id": job_id,
        "job_params": params,
        "batch_id": batch_id,
    }


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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
    )
    def setUpClass(cls):
        cls.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        config = ConfigTests()
        os.environ["KB_WORKSPACE_ID"] = config.get("jobs", "job_test_wsname")

        cls.jc = biokbase.narrative.jobs.jobcomm.JobComm()
        cls.jc._comm = MockComm()

    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
    )
    def setUp(self):
        self.jc._comm.clear_message_cache()
        self.jc._jm.initialize_jobs()
        self.jc.stop_job_status_loop()
        self.job_states = get_test_job_states()

    # response when no input was submitted with a query
    # args:
    #   msg: the response message object
    #   input: the specified job_id
    #   source: the request that was called
    def check_no_input_error_job_id(self, msg, input, source):
        self.assertEqual(
            {
                "msg_type": "job_comm_error",
                "content": {
                    "message": "No job ID supplied",
                    "source": source,
                    "job_id": input,
                },
            },
            msg["data"],
        )

    def check_no_input_error_job_id_list(self, msg, input, source):
        self.assertEqual(
            {
                "msg_type": "job_comm_error",
                "content": {
                    "message": "No job IDs supplied",
                    "source": source,
                    "job_id_list": input,
                },
            },
            msg["data"],
        )

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

    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
    )
    def test_start_stop_job_status_loop(self):
        self.assertFalse(self.jc._running_lookup_loop)
        self.assertIsNone(self.jc._lookup_timer)

        self.jc.start_job_status_loop()
        msg = self.jc._comm.last_message
        self.assertIsNotNone(msg)
        self.assertTrue(self.jc._running_lookup_loop)
        self.assertIsNotNone(self.jc._lookup_timer)

        self.jc.stop_job_status_loop()
        self.assertFalse(self.jc._running_lookup_loop)
        self.assertIsNone(self.jc._lookup_timer)

    # ---------------------
    # Lookup all job states
    # ---------------------
    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
    )
    def test_lookup_all_job_states_ok(self):
        req = make_comm_msg("all_status", None, True)
        states = self.jc._lookup_all_job_states(req)
        msg = self.jc._comm.last_message
        self.assertEqual(states, msg["data"]["content"])
        self.assertEqual("job_status_all", msg["data"]["msg_type"])
        self.assertIsInstance(states, dict)
        self.assertEqual(set(states.keys()), set(ALL_JOBS))
        for job_id in states:
            self.assertIsInstance(job_id, str)
            validate_job_state(states[job_id])

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

    def test_lookup_job_states__no_job(self):
        with self.assertRaisesRegex(NoJobException, NO_JOB_ERR):
            self.jc.lookup_job_state(None)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id(msg, None, "job_status")

    # -----------------------
    # Lookup single job state
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        req = make_comm_msg("job_status", job_id_list, True)
        with self.assertRaisesRegex(NoJobException, NO_JOB_ERR):
            self.jc._lookup_job_states(req)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id_list(msg, job_id_list, "job_status")

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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        req = make_comm_msg("job_status_batch", job_id, True)
        with self.assertRaisesRegex(NoJobException, f"No job present with id {job_id}"):
            self.jc._lookup_job_states_batch(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_status",
                "content": {JOB_NOT_FOUND: get_dne_job_state(JOB_NOT_FOUND)},
            },
            msg["data"],
        )

    def test_lookup_job_states_batch__no_job(self):
        job_id = None
        req = make_comm_msg("job_status_batch", job_id, True)
        with self.assertRaises(ValueError):
            self.jc._lookup_job_states_batch(req)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id(msg, job_id, "job_status_batch")

    def test_lookup_job_states_batch__not_batch(self):
        job_id = JOB_CREATED
        req = make_comm_msg("job_status_batch", job_id, True)
        with self.assertRaises(NotBatchException):
            self.jc._lookup_job_states_batch(req)

    # -----------------------
    # Lookup job info
    # -----------------------
    def test_lookup_job_info__ok(self):
        job_id_list = [JOB_COMPLETED]
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

    def test_lookup_job_info__batch__ok(self):
        job_id_list = [BATCH_ERROR_RETRIED, BATCH_RETRY_COMPLETED]
        req = make_comm_msg("job_info", job_id_list + [BATCH_PARENT], True)
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
        req = make_comm_msg("job_info", job_id_list, True)
        with self.assertRaisesRegex(NoJobException, NO_JOB_ERR):
            self.jc._lookup_job_info(req)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id_list(msg, job_id_list, "job_info")

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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
    )
    def test_lookup_job_info_batch__ok(self):
        job_id = BATCH_PARENT
        req = make_comm_msg("job_info_batch", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_info",
                "content": {
                    job_id: get_test_job_info(job_id) for job_id in BATCH_CHILDREN
                },
            },
            msg["data"],
        )

    def test_lookup_job_info_batch__no_job(self):
        job_id = None
        req = make_comm_msg("job_info_batch", job_id, True)
        with self.assertRaisesRegex(
            NoJobException, "Job id required to process job_info_batch request"
        ):
            self.jc._lookup_job_info_batch(req)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id(msg, job_id, "job_info_batch")

    def test_lookup_job_info_batch__dne(self):
        job_id = JOB_NOT_FOUND
        req = make_comm_msg("job_info_batch", job_id, True)
        with self.assertRaisesRegex(NoJobException, f"No job present with id {job_id}"):
            self.jc._lookup_job_info_batch(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_does_not_exist",
                "content": {
                    "source": "job_info_batch",
                    "job_id": job_id,
                },
            },
            msg["data"],
        )

    def test_lookup_job_info_batch__not_batch(self):
        job_id = BATCH_COMPLETED
        req = make_comm_msg("job_info_batch", job_id, True)
        with self.assertRaisesRegex(NotBatchException, "Not a batch job"):
            self.jc._lookup_job_info_batch(req)

    # ------------
    # Cancel list of jobs
    # ------------
    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        req = make_comm_msg("cancel_job", job_id_list, True)
        with self.assertRaisesRegex(TypeError, "List expected for job_id_list"):
            self.jc._cancel_jobs(req)

        job_id_list = [None, ""]
        req = make_comm_msg("cancel_job", job_id_list, True)
        with self.assertRaisesRegex(NoJobException, NO_JOB_ERR):
            self.jc._cancel_jobs(req)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id_list(msg, job_id_list, "cancel_job")

    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get",
        get_failing_mock_client,
    )
    def test_cancel_jobs__failure(self):
        job_id_list = [JOB_RUNNING]
        req = make_comm_msg("cancel_job", job_id_list, True)
        with self.assertRaises(NarrativeException) as e:
            self.jc._cancel_jobs(req)
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        req = make_comm_msg("retry_job", job_id_list, True)
        with self.assertRaisesRegex(ValueError, NO_JOB_ERR):
            self.jc._retry_jobs(req)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id_list(msg, [], "retry_job")

    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
    )
    def test_retry_jobs_all_bad_jobs(self):
        job_id_list = ["nope", "no"]
        req = make_comm_msg("retry_job", job_id_list, True)
        self.jc._retry_jobs(req)
        msg = self.jc._comm.last_message
        self.assertEqual({"job_id_list": []}, msg["data"]["content"])
        self.assertEqual("new_job", msg["data"]["msg_type"])

    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get",
        get_failing_mock_client,
    )
    def test_retry_jobs_failure(self):
        job_id_list = [JOB_COMPLETED, JOB_CREATED, JOB_TERMINATED]
        req = make_comm_msg("retry_job", job_id_list, True)
        with self.assertRaises(NarrativeException) as e:
            self.jc._retry_jobs(req)
        self.assertIn("Jobs retry failed", str(e.exception))
        msg = self.jc._comm.last_message
        self.assertEqual("job_comm_error", msg["data"]["msg_type"])
        self.assertEqual(job_id_list, msg["data"]["content"]["job_id_list"])
        self.assertEqual("Unable to retry job(s)", msg["data"]["content"]["error"])

    # -----------------
    # Fetching job logs
    # -----------------
    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get",
        get_failing_mock_client,
    )
    def test_get_job_logs_failure(self):
        job_id = JOB_COMPLETED
        req = make_comm_msg("job_logs", job_id, True)
        with self.assertRaises(NarrativeException) as e:
            self.jc._get_job_logs(req)
        self.assertIn("Can't get job logs", str(e.exception))
        msg = self.jc._comm.last_message
        self.assertEqual("job_comm_error", msg["data"]["msg_type"])
        self.assertEqual("Unable to retrieve job logs", msg["data"]["content"]["error"])

    def test_get_job_logs_no_job(self):
        job_id = None
        req = make_comm_msg("job_logs", job_id, True)
        with self.assertRaises(ValueError) as e:
            self.jc._get_job_logs(req)
        self.assertIn("Job id required to process job_logs request", str(e.exception))
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id(msg, job_id, "job_logs")

    def test_get_job_logs_bad_job(self):
        job_id = "bad_job"
        req = make_comm_msg("job_logs", job_id, True)
        with self.assertRaisesRegex(NoJobException, f"No job present with id {job_id}"):
            self.jc._get_job_logs(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {"job_id": job_id, "source": "job_logs"}, msg["data"]["content"]
        )
        self.assertEqual("job_does_not_exist", msg["data"]["msg_type"])

    # ------------------------
    # Modify job update
    # ------------------------
    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        req = make_comm_msg("start_job_update", job_id_list, True)
        with self.assertRaisesRegex(NoJobException, NO_JOB_ERR):
            self.jc._modify_job_updates(req)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id_list(msg, job_id_list, "start_job_update")

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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        req = make_comm_msg("start_job_update_batch", job_id, True)
        with self.assertRaisesRegex(
            NoJobException, f"Job id required to process {req.request} request"
        ):
            self.jc._modify_job_updates_batch(req)
        msg = self.jc._comm.last_message
        self.check_no_input_error_job_id(msg, job_id, "start_job_update_batch")

    def test_modify_job_update_batch__bad_job(self):
        job_id = JOB_NOT_FOUND
        req = make_comm_msg("start_job_update_batch", job_id, True)
        with self.assertRaisesRegex(NoJobException, f"No job present with id {job_id}"):
            self.jc._modify_job_updates_batch(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_does_not_exist",
                "content": {
                    "source": "start_job_update_batch",
                    "job_id": job_id,
                },
            },
            msg["data"],
        )

    def test_modify_job_update_batch__not_batch(self):
        job_id = JOB_RUNNING
        req = make_comm_msg("start_job_update_batch", job_id, True)
        with self.assertRaisesRegex(NotBatchException, "Not a batch job"):
            self.jc._modify_job_updates_batch(req)

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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
    )
    def test_handle_job_info_batch_msg(self):
        job_id = BATCH_PARENT
        req = make_comm_msg("job_info_batch", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(
            {
                "msg_type": "job_info",
                "content": {
                    job_id: get_test_job_info(job_id) for job_id in BATCH_CHILDREN
                },
            },
            msg["data"],
        )

    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
    )
    def test_handle_cancel_job_msg(self):
        job_id = JOB_COMPLETED
        req = make_comm_msg("cancel_job", job_id, False)
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(msg["data"]["msg_type"], "job_status")

    @mock.patch(
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        "biokbase.narrative.jobs.jobcomm.jobmanager.clients.get", get_mock_client
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
        self.assertIsNone(rq.job_id)

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

    def _check_rq_equal(self, rq0, rq1):
        self.assertEqual(rq0.msg_id, rq1.msg_id)
        self.assertEqual(rq0.rq_data, rq1.rq_data)
        self.assertEqual(rq0.request, rq1.request)
        self.assertEqual(rq0.job_id, rq1.job_id)

    def test_convert_to_using_job_id_list(self):
        rq_msg = make_comm_msg("a_request", "a", False)
        rq = JobRequest._convert_to_using_job_id_list(rq_msg)
        self.assertEqual(rq.request, "a_request")
        self.assertEqual(rq.job_id, None)
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
        self.assertEqual(rqs[0].job_id_list, None)

        rq_msg = make_comm_msg(JobRequest.REQUIRE_JOB_ID[0], ["a", "b"], False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 2)
        self.assertEqual(rqs[0].job_id, "a")
        self.assertEqual(rqs[0].job_id_list, None)
        self.assertEqual(rqs[1].job_id, "b")
        self.assertEqual(rqs[1].job_id_list, None)

    def test_translate_require_job_id_list(self):
        rq_msg = make_comm_msg(JobRequest.REQUIRE_JOB_ID_LIST[0], "a", False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 1)
        self.assertEqual(rqs[0].job_id, None)
        self.assertEqual(rqs[0].job_id_list, ["a"])

        rq_msg = make_comm_msg(JobRequest.REQUIRE_JOB_ID_LIST[0], ["a", "b"], False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 1)
        self.assertEqual(rqs[0].job_id, None)
        self.assertEqual(rqs[0].job_id_list, ["a", "b"])

    def test_translate_doesnt_require_any_job_ids(self):
        rq_msg = make_comm_msg("all_status", None, False)
        rqs = JobRequest.translate(rq_msg)
        self.assertEqual(len(rqs), 1)
