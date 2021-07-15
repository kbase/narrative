"""
Tests for job management
"""
import unittest
import copy
from unittest import mock
import biokbase.narrative.jobs.jobmanager
from biokbase.narrative.jobs.job import Job
from .util import ConfigTests
import os
from IPython.display import HTML
from .narrative_mock.mockclients import (
    get_mock_client,
    get_failing_mock_client,
    assert_obj_method_called,
    MockClients,
)
from biokbase.narrative.exception_util import NarrativeException

__author__ = "Bill Riehl <wjriehl@lbl.gov>"

config = ConfigTests()
test_jobs = config.load_json_file(config.get("jobs", "ee2_job_info_file"))
# test_jobs contains jobs in the following states
JOB_COMPLETED = "5d64935ab215ad4128de94d6"
JOB_CREATED = "5d64935cb215ad4128de94d7"
JOB_RUNNING = "5d64935cb215ad4128de94d8"
JOB_TERMINATED = "5d64935cb215ad4128de94d9"
JOB_ERROR = "5d64935cb215ad4128de94e0"
JOB_NOT_FOUND = "job_not_found"

no_id_err_str = r"No job id\(s\) supplied"
ERR_STR = "Some error occurred"


def create_jm_message(r_type, job_id=None, data=None):
    if data is None:
        data = {}
    data["request_type"] = r_type
    data["job_id"] = job_id
    return {"content": {"data": data}}


def get_retry_job_state(orig_id, status="unmocked"):
    return {
        "state": {
            "job_id": orig_id[::-1],
            "status": status,
            "batch_id": None,
            "job_output": {},
            "cell_id": None,
            "run_id": None,
            "child_jobs": [],
        },
        "widget_info": None,
        "owner": None,
    }


def get_dne_job_state(job_id):
    return {"state": {"job_id": job_id, "status": "does_not_exist"}}


def get_test_job_states():
    # generate full job state objects
    job_states = {}
    for job_id in test_jobs.keys():
        state = copy.deepcopy(test_jobs[job_id])
        job_input = state.get("job_input", {})
        narr_cell_info = job_input.get("narrative_cell_info", {})
        state.update(
            {
                "batch_id": state.get("batch_id", None),
                "cell_id": narr_cell_info.get("cell_id", None),
                "run_id": narr_cell_info.get("run_id", None),
                "job_output": state.get("job_output", {}),
                "child_jobs": [],
            }
        )
        widget_info = (
            Job.from_state(state).get_viewer_params(state)
            if state.get("finished")
            else None
        )
        for f in biokbase.narrative.jobs.job.EXCLUDED_JOB_STATE_FIELDS:
            if f in state:
                del state[f]
        job_states[job_id] = {
            "state": state,
            "widget_info": widget_info,
            "owner": state.get("user"),
        }
    return job_states


class JobManagerTest(unittest.TestCase):
    @classmethod
    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def setUpClass(cls):
        cls.job_ids = list(test_jobs.keys())
        os.environ["KB_WORKSPACE_ID"] = config.get("jobs", "job_test_wsname")
        cls.maxDiff = None
        cls.job_states = {}
        cls.job_states_inited = False

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def setUp(self) -> None:
        self.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        self.jm.initialize_jobs()
        if self.job_states == {}:
            self.job_states = get_test_job_states()

    def validate_status_message(self, msg):
        core_keys = set(["widget_info", "owner", "state", "spec"])
        state_keys = set(
            ["user", "authstrat", "wsid", "status", "updated", "job_input"]
        )
        if not core_keys.issubset(set(msg.keys())):
            print(
                "Missing core key(s) - [{}]".format(
                    ", ".join(core_keys.difference(set(msg.keys())))
                )
            )
            return False
        if not state_keys.issubset(set(msg["state"].keys())):
            print(
                "Missing status key(s) - [{}]".format(
                    ", ".join(state_keys.difference(set(msg["state"].keys())))
                )
            )
            return False
        return True

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_initialise_jobs(self):
        # all jobs have been removed from the JobManager
        self.jm._running_jobs = {}
        self.jm = biokbase.narrative.jobs.jobmanager.JobManager()

        self.assertEqual(self.jm._running_jobs, {})

        # redo the initialise to make sure it worked correctly
        self.jm.initialize_jobs()
        terminal_ids = [
            job_id
            for job_id, d in self.jm._running_jobs.items()
            if d["job"].terminal_state
        ]
        self.assertCountEqual(terminal_ids, [JOB_COMPLETED, JOB_TERMINATED, JOB_ERROR])
        self.assertEqual(set(self.job_ids), set(self.jm._running_jobs.keys()))

    def test__check_job_list_fail(self):
        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm._check_job_list()

        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm._check_job_list([])

        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm._check_job_list(["", "", None])

    def test__check_job_list(self):
        """job list checker"""

        job_a = JOB_CREATED
        job_b = JOB_COMPLETED
        job_c = "job_c"
        job_d = "job_d"
        self.assertEqual(
            self.jm._check_job_list([job_c]),
            {
                "error": [job_c],
                "job_id_list": [],
            },
        )

        self.assertEqual(
            self.jm._check_job_list([job_c, None, "", job_c, job_c, None, job_d]),
            {
                "error": [job_c, job_d],
                "job_id_list": [],
            },
        )

        self.assertEqual(
            self.jm._check_job_list([job_c, None, "", None, job_a, job_a, job_a]),
            {
                "error": [job_c],
                "job_id_list": [job_a],
            },
        )

        self.assertEqual(
            self.jm._check_job_list([None, job_a, None, "", None, job_b]),
            {
                "error": [],
                "job_id_list": [job_a, job_b],
            },
        )

    def test_get_job_good(self):
        job_id = self.job_ids[0]
        job = self.jm.get_job(job_id)
        self.assertEqual(job_id, job.job_id)
        self.assertIsInstance(job, Job)

    def test_get_job_bad(self):
        with self.assertRaisesRegex(ValueError, "No job present with id not_a_job_id"):
            self.jm.get_job("not_a_job_id")

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_list_jobs_html(self):
        jobs_html = self.jm.list_jobs()
        self.assertIsInstance(jobs_html, HTML)
        html = jobs_html.data
        self.assertIn("<td>5d64935ab215ad4128de94d6</td>", html)
        self.assertIn("<td>NarrativeTest/test_editor</td>", html)
        self.assertIn("<td>2019-08-26 ", html)
        self.assertIn(":54:48</td>", html)
        self.assertIn("<td>fake_test_user</td>", html)
        self.assertIn("<td>completed</td>", html)
        self.assertIn("<td>Not started</td>", html)
        self.assertIn("<td>Incomplete</td>", html)

    def test_list_jobs_twice(self):
        # with no jobs
        with mock.patch.object(self.jm, "_running_jobs", {}):
            expected = "No running jobs!"
            self.assertEqual(self.jm.list_jobs(), expected)
            self.assertEqual(self.jm.list_jobs(), expected)

        # with some jobs
        with mock.patch(
            "biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client
        ):
            jobs_html_0 = self.jm.list_jobs()
            jobs_html_1 = self.jm.list_jobs()
            self.assertEqual(jobs_html_0.data, jobs_html_1.data)

    def test_cancel_job__bad_input(self):
        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm.cancel_job(None)

        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm.cancel_job("")

    def test_cancel_jobs__bad_inputs(self):
        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm.cancel_jobs()

        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm.cancel_jobs([])

        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm.cancel_jobs(["", "", None])

    def test_cancel_job__job_already_finished(self):
        self.assertEqual(test_jobs[JOB_COMPLETED]["status"], "completed")
        self.assertEqual(test_jobs[JOB_TERMINATED]["status"], "terminated")
        self.assertTrue(self.jm.get_job(JOB_COMPLETED).terminal_state)
        self.assertTrue(self.jm.get_job(JOB_TERMINATED).terminal_state)

        with mock.patch(
            "biokbase.narrative.jobs.jobmanager.JobManager._cancel_job"
        ) as mock_cancel_job:
            self.assertTrue(self.jm.cancel_job(JOB_COMPLETED))
            mock_cancel_job.assert_not_called()

            self.assertTrue(self.jm.cancel_job(JOB_TERMINATED))
            mock_cancel_job.assert_not_called()

            # multiple jobs
            canceled_jobs = self.jm.cancel_jobs([JOB_COMPLETED, JOB_TERMINATED])
            mock_cancel_job.assert_not_called()
            self.assertEqual(
                {
                    JOB_COMPLETED: self.job_states[JOB_COMPLETED],
                    JOB_TERMINATED: self.job_states[JOB_TERMINATED],
                },
                canceled_jobs,
            )

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_cancel_job__run_ee2_cancel_job(self):
        """cancel a job that runs cancel_job on ee2"""
        self.assertIn(JOB_RUNNING, self.jm._running_jobs)
        self.assertFalse(self.jm.get_job(JOB_RUNNING).terminal_state)
        # set the job refresh to 1
        self.jm._running_jobs[JOB_RUNNING]["refresh"] = 1

        def check_state(arg):
            self.assertEqual(self.jm._running_jobs[arg["job_id"]]["refresh"], 0)
            self.assertEqual(self.jm._running_jobs[arg["job_id"]]["canceling"], True)

        # patch MockClients.cancel_job so we can test the input
        with mock.patch.object(
            MockClients,
            "cancel_job",
            mock.Mock(return_value={}, side_effect=check_state),
        ) as mock_cancel_job:
            self.jm.cancel_job(JOB_RUNNING)
            mock_cancel_job.assert_called_once_with({"job_id": JOB_RUNNING})
            self.assertNotIn("canceling", self.jm._running_jobs[JOB_RUNNING])
            self.assertEqual(self.jm._running_jobs[JOB_RUNNING]["refresh"], 1)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_cancel_jobs__run_ee2_cancel_job(self):
        """cancel a set of jobs that run cancel_job on ee2"""
        # jobs list:
        jobs = [
            None,
            JOB_CREATED,
            JOB_RUNNING,
            "",
            JOB_TERMINATED,
            JOB_COMPLETED,
            JOB_TERMINATED,
            None,
            JOB_NOT_FOUND,
        ]

        expected = {
            JOB_CREATED: self.job_states[JOB_CREATED],
            JOB_RUNNING: self.job_states[JOB_RUNNING],
            JOB_COMPLETED: self.job_states[JOB_COMPLETED],
            JOB_TERMINATED: self.job_states[JOB_TERMINATED],
            JOB_NOT_FOUND: {
                "job_id": JOB_NOT_FOUND,
                "status": "does_not_exist",
            },
        }

        def check_state(arg):
            self.assertEqual(self.jm._running_jobs[arg["job_id"]]["refresh"], 0)
            self.assertEqual(self.jm._running_jobs[arg["job_id"]]["canceling"], True)

        # patch MockClients.cancel_job so we can test the input
        with mock.patch.object(
            MockClients,
            "cancel_job",
            mock.Mock(return_value={}, side_effect=check_state),
        ) as mock_cancel_job:
            results = self.jm.cancel_jobs(jobs)
            self.assertNotIn("canceling", self.jm._running_jobs[JOB_RUNNING])
            self.assertNotIn("canceling", self.jm._running_jobs[JOB_CREATED])
            self.assertEqual(results.keys(), expected.keys())
            self.assertEqual(results, expected)
            mock_cancel_job.assert_has_calls(
                [
                    mock.call({"job_id": JOB_CREATED}),
                ],
                any_order=True,
            )

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_cancel_jobs(self):

        with assert_obj_method_called(self.jm, "cancel_jobs", True):
            self.jm.cancel_jobs([JOB_COMPLETED])

        with assert_obj_method_called(self.jm, "cancel_jobs", False):
            self.jm.cancel_job(JOB_COMPLETED)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__success(self):
        job_ids = [JOB_TERMINATED]
        retry_results = self.jm.retry_jobs(job_ids)

        orig_state = retry_results[0]["job_id"]
        retry_state = retry_results[0]["retry_id"]
        orig_id = orig_state["state"]["job_id"]
        retry_id = retry_state["state"]["job_id"]

        self.assertEqual(orig_id, JOB_TERMINATED)
        self.assertEqual(retry_id, JOB_TERMINATED[::-1])
        self.assertEqual(orig_state, self.job_states[JOB_TERMINATED])
        self.assertEqual(retry_state, get_retry_job_state(JOB_TERMINATED))
        self.assertTrue(len(retry_results) == 1)
        self.assertEqual(
            retry_results,
            [
                {
                    "job_id": self.job_states[JOB_TERMINATED],
                    "retry_id": get_retry_job_state(JOB_TERMINATED),
                }
            ],
        )

        self.assertIn(JOB_TERMINATED, self.jm._running_jobs)
        self.assertIn(retry_id, self.jm._running_jobs)

        self.assertIsNone(self.jm.get_job(orig_id)._last_state)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__multi_success(self):
        job_ids = [JOB_TERMINATED, JOB_ERROR]
        retry_results = self.jm.retry_jobs(job_ids)
        exp = [
            {
                "job_id": self.job_states[JOB_TERMINATED],
                "retry_id": get_retry_job_state(JOB_TERMINATED),
            },
            {
                "job_id": self.job_states[JOB_ERROR],
                "retry_id": get_retry_job_state(JOB_ERROR),
            },
        ]
        retry_ids = [result["retry_id"]["state"]["job_id"] for result in retry_results]
        self.assertEqual(exp, retry_results)
        for job_id in job_ids:
            self.assertIn(job_id, self.jm._running_jobs)
            self.assertIsNone(self.jm.get_job(job_id)._last_state)
        for job_id in retry_ids:
            self.assertIn(job_id, self.jm._running_jobs)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__success_error_dne(self):
        job_ids = [JOB_NOT_FOUND, JOB_TERMINATED, JOB_COMPLETED]
        retry_id = JOB_TERMINATED[::-1]
        ee2_ret = [
            {"job_id": JOB_TERMINATED, "retry_id": JOB_TERMINATED[::-1]},
            {"job_id": JOB_COMPLETED, "error": ERR_STR},
        ]
        with mock.patch.object(
            MockClients,
            "retry_jobs",
            mock.Mock(return_value=ee2_ret),
        ):
            retry_results = self.jm.retry_jobs(job_ids)

        self.assertTrue(len(retry_results) == 3)
        exp = [
            {
                "job_id": self.job_states[JOB_TERMINATED],
                "retry_id": get_retry_job_state(JOB_TERMINATED),
            },
            {
                "job_id": self.job_states[JOB_COMPLETED],
                "error": ERR_STR,
            },
            {
                "job_id": get_dne_job_state(JOB_NOT_FOUND),
                "error": "does_not_exist",
            },
        ]
        self.assertEqual(exp, retry_results)

        for job_id in job_ids[1:]:
            self.assertIn(job_id, self.jm._running_jobs)
            self.assertIsNone(self.jm.get_job(job_id)._last_state)
        self.assertIn(retry_id, self.jm._running_jobs)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__all_error(self):
        job_ids = [JOB_TERMINATED, JOB_CREATED, JOB_RUNNING]
        ee2_ret = [
            {"job_id": JOB_TERMINATED, "error": ERR_STR},
            {"job_id": JOB_CREATED, "error": ERR_STR},
            {"job_id": JOB_RUNNING, "error": ERR_STR},
        ]
        with mock.patch.object(
            MockClients,
            "retry_jobs",
            mock.Mock(return_value=ee2_ret),
        ):
            retry_results = self.jm.retry_jobs(job_ids)

        self.assertTrue(len(retry_results) == 3)
        exp = [
            {"job_id": self.job_states[JOB_TERMINATED], "error": ERR_STR},
            {"job_id": self.job_states[JOB_CREATED], "error": ERR_STR},
            {"job_id": self.job_states[JOB_RUNNING], "error": ERR_STR},
        ]
        self.assertEqual(exp, retry_results)

        for job_id in job_ids:
            self.assertIn(job_id, self.jm._running_jobs)
            self.assertIsNone(self.jm.get_job(job_id)._last_state)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__retry_already_terminal(self):
        job_id = JOB_TERMINATED
        retry_id = JOB_TERMINATED[::-1]
        retry_status = "error"
        retry_state = get_retry_job_state(JOB_TERMINATED, status=retry_status)
        test_jobs_ = copy.deepcopy(test_jobs)
        test_jobs_[retry_id] = {"job_id": retry_id, "status": retry_status}
        with mock.patch.object(
            MockClients,
            "ee2_job_info",
            test_jobs_,
        ):
            retry_results = self.jm.retry_jobs([job_id])

        self.assertTrue(len(retry_results) == 1)
        exp = [{"job_id": self.job_states[JOB_TERMINATED], "retry_id": retry_state}]
        self.assertEqual(exp, retry_results)
        self.assertIn(job_id, self.jm._running_jobs)
        self.assertIn(retry_id, self.jm._running_jobs)
        self.assertIsNone(self.jm.get_job(job_id)._last_state)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__none_exist(self):
        fake_id = "nope"
        retry_results = self.jm.retry_jobs(["", "", None, fake_id])
        exp = [
            {
                "job_id": get_dne_job_state(fake_id),
                "error": "does_not_exist",
            }
        ]
        self.assertEqual(exp, retry_results)
        self.assertNotIn(fake_id, self.jm._running_jobs)

    def test_retry_jobs__bad_inputs(self):
        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm.retry_jobs([])

        with self.assertRaisesRegex(ValueError, no_id_err_str):
            self.jm.retry_jobs(["", "", None])

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_lookup_all_job_states(self):
        states = self.jm.lookup_all_job_states()
        self.assertEqual({JOB_CREATED, JOB_RUNNING}, set(states.keys()))
        self.assertEqual(
            states,
            {
                JOB_CREATED: self.job_states[JOB_CREATED],
                JOB_RUNNING: self.job_states[JOB_RUNNING],
            },
        )

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_lookup_all_job_states__ignore_refresh_flag(self):
        states = self.jm.lookup_all_job_states(ignore_refresh_flag=True)
        self.assertEqual(set(self.job_ids), set(states.keys()))
        self.assertEqual(
            states,
            {
                JOB_CREATED: self.job_states[JOB_CREATED],
                JOB_RUNNING: self.job_states[JOB_RUNNING],
                JOB_COMPLETED: self.job_states[JOB_COMPLETED],
                JOB_TERMINATED: self.job_states[JOB_TERMINATED],
                JOB_ERROR: self.job_states[JOB_ERROR],
            },
        )

    # @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    # def test_job_status_fetching(self):
    #     self.jm._handle_comm_message(create_jm_message("all_status"))
    #     msg = self.jm._comm.last_message
    #     job_data = msg.get('data', {}).get('content', {})
    #     job_ids = list(job_data.keys())
    #     # assert that each job info that's flagged for lookup gets returned
    #     jobs_to_lookup = [j for j in self.jm._running_jobs.keys()]
    #     self.assertCountEqual(job_ids, jobs_to_lookup)
    #     for job_id in job_ids:
    #         self.assertTrue(self.validate_status_message(job_data[job_id]))
    #     self.jm._comm.clear_message_cache()

    # @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    # def test_single_job_status_fetch(self):
    #     new_job = phony_job()
    #     self.jm.register_new_job(new_job)
    #     self.jm._handle_comm_message(create_jm_message("job_status", new_job.job_id))
    #     msg = self.jm._comm.last_message
    #     self.assertEqual(msg['data']['msg_type'], "job_status")
    #     # self.assertTrue(self.validate_status_message(msg['data']['content']))
    #     self.jm._comm.clear_message_cache()

    # Should "fail" based on sent message.
    # def test_job_message_bad_id(self):
    #     self.jm._handle_comm_message(create_jm_message("foo", job_id="not_a_real_job"))
    #     msg = self.jm._comm.last_message
    #     self.assertEqual(msg['data']['msg_type'], 'job_does_not_exist')

    def test_cancel_job_lookup(self):
        pass

    # @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    # def test_stop_single_job_lookup(self):
    #     # Set up and make sure the job gets returned correctly.
    #     new_job = phony_job()
    #     phony_id = new_job.job_id
    #     self.jm.register_new_job(new_job)
    #     self.jm._handle_comm_message(create_jm_message("start_job_update", job_id=phony_id))
    #     self.jm._handle_comm_message(create_jm_message("stop_update_loop"))

    #     self.jm._lookup_all_job_status()
    #     msg = self.jm._comm.last_message
    #     self.assertTrue(phony_id in msg['data']['content'])
    #     self.assertEqual(msg['data']['content'][phony_id].get('listener_count', 0), 1)
    #     self.jm._comm.clear_message_cache()
    #     self.jm._handle_comm_message(create_jm_message("stop_job_update", job_id=phony_id))
    #     self.jm._lookup_all_job_status()
    #     msg = self.jm._comm.last_message
    #     self.assertTrue(self.jm._running_jobs[phony_id]['refresh'] == 0)
    #     self.assertIsNone(msg)

    @mock.patch(
        "biokbase.narrative.jobs.jobmanager.clients.get", get_failing_mock_client
    )
    def test_initialize_jobs_ee2_fail(self):
        # init jobs should fail. specifically, ee2.check_workspace_jobs should error.
        with self.assertRaises(NarrativeException) as e:
            self.jm.initialize_jobs()
        self.assertIn("Job lookup failed", str(e.exception))


if __name__ == "__main__":
    unittest.main()
