"""
Tests for job management
"""
from src.biokbase.narrative.jobs.job import (
    COMPLETED_STATUS,
    EXCLUDED_JOB_STATE_FIELDS,
    JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
    JOB_ATTR_DEFAULTS,
    get_dne_job_state,
)
import unittest
import copy
import itertools
from unittest import mock
import biokbase.narrative.jobs.jobmanager
from biokbase.narrative.jobs.job import Job
from .util import ConfigTests
from .test_job import (
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
    JOBS_TERMINALITY,
    ALL_JOBS,
    TERMINAL_JOBS,
    ACTIVE_JOBS,
    BATCH_CHILDREN,
    get_test_job,
    get_test_spec,
    TEST_JOBS,
    get_test_job_states,
    get_cell_2_jobs,
)
import os
from IPython.display import HTML
from .narrative_mock.mockclients import (
    get_mock_client,
    get_failing_mock_client,
    assert_obj_method_called,
    MockClients,
)
from biokbase.narrative.exception_util import (
    NarrativeException,
    NoJobException,
    NotBatchException,
)


__author__ = "Bill Riehl <wjriehl@lbl.gov>"


TERMINAL_IDS = [JOB_COMPLETED, JOB_TERMINATED, JOB_ERROR]
NON_TERMINAL_IDS = [JOB_CREATED, JOB_RUNNING]

NO_ID_ERR_STR = r"No job id\(s\) supplied"
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
        "user": None,
    }


class JobManagerTest(unittest.TestCase):
    @classmethod
    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def setUpClass(cls):
        cls.job_ids = list(TEST_JOBS.keys())
        config = ConfigTests()
        os.environ["KB_WORKSPACE_ID"] = config.get("jobs", "job_test_wsname")
        cls.maxDiff = None

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def setUp(self) -> None:
        self.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        self.jm.initialize_jobs()
        self.job_states = get_test_job_states()

    def validate_status_message(self, msg):
        core_keys = set(["widget_info", "user", "state"])
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

    @mock.patch(
        "biokbase.narrative.jobs.jobmanager.clients.get", get_failing_mock_client
    )
    def test_initialize_jobs_ee2_fail(self):
        # init jobs should fail. specifically, ee2.check_workspace_jobs should error.
        with self.assertRaises(NarrativeException) as e:
            self.jm.initialize_jobs()
        self.assertIn("Job lookup failed", str(e.exception))

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_initialize_jobs(self):
        # all jobs have been removed from the JobManager
        self.jm._running_jobs = {}
        self.jm = biokbase.narrative.jobs.jobmanager.JobManager()

        self.assertEqual(self.jm._running_jobs, {})

        # redo the initialise to make sure it worked correctly
        self.jm.initialize_jobs()
        terminal_ids = [
            job_id
            for job_id, d in self.jm._running_jobs.items()
            if d["job"].was_terminal
        ]
        self.assertEqual(
            set(TERMINAL_JOBS),
            set(terminal_ids),
        )
        self.assertEqual(set(self.job_ids), set(self.jm._running_jobs.keys()))

        for job_id in TERMINAL_IDS:
            self.assertFalse(self.jm._running_jobs[job_id]["refresh"])
        for job_id in NON_TERMINAL_IDS:
            self.assertTrue(self.jm._running_jobs[job_id]["refresh"])

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_initialize_jobs__cell_ids(self):
        """
        Invoke initialize_jobs with cell_ids
        """
        cell_2_jobs = get_cell_2_jobs(instance=False)
        cell_ids = list(cell_2_jobs.keys())
        # Iterate through all combinations of cell IDs
        for combo_len in range(len(cell_ids) + 1):
            for combo in itertools.combinations(cell_ids, combo_len):
                combo = list(combo)
                # Get jobs expected to be associated with the cell IDs
                exp_job_ids = [
                    job_id
                    for cell_id, job_ids in cell_2_jobs.items()
                    for job_id in job_ids
                    if cell_id in combo
                ]
                self.jm._running_jobs = {}
                self.jm.initialize_jobs(cell_ids=combo)

                for job_id, d in self.jm._running_jobs.items():
                    refresh = d["refresh"]

                    self.assertEqual(
                        int(job_id in exp_job_ids and not JOBS_TERMINALITY[job_id]),
                        refresh
                    )

    def test__check_job_list_fail(self):
        with self.assertRaisesRegex(ValueError, NO_ID_ERR_STR):
            self.jm._check_job_list()

        with self.assertRaisesRegex(ValueError, NO_ID_ERR_STR):
            self.jm._check_job_list([])

        with self.assertRaisesRegex(ValueError, NO_ID_ERR_STR):
            self.jm._check_job_list(["", "", None])

    def test__check_job_list(self):
        """job list checker"""

        job_a = JOB_CREATED
        job_b = JOB_COMPLETED
        job_c = "job_c"
        job_d = "job_d"
        self.assertEqual(
            self.jm._check_job_list([job_c]),
            (
                [],
                [job_c],
            ),
        )

        self.assertEqual(
            self.jm._check_job_list([job_c, None, "", job_c, job_c, None, job_d]),
            (
                [],
                [job_c, job_d],
            ),
        )

        self.assertEqual(
            self.jm._check_job_list([job_c, None, "", None, job_a, job_a, job_a]),
            (
                [job_a],
                [job_c],
            ),
        )

        self.assertEqual(
            self.jm._check_job_list([None, job_a, None, "", None, job_b]),
            (
                [job_a, job_b],
                [],
            ),
        )

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test__construct_job_state_set(self):
        self.assertEqual(
            self.jm._construct_job_state_set(ALL_JOBS), get_test_job_states()
        )

    def test__construct_job_state_set__empty_list(self):
        self.assertEqual(self.jm._construct_job_state_set([]), {})

    def test__create_jobs__empty_list(self):
        self.assertEqual(self.jm._create_jobs([]), {})

    def test__create_jobs__jobs_already_exist(self):
        job_list = self.jm._running_jobs.keys()
        self.assertEqual(self.jm._create_jobs(job_list), {})

    def test_get_job_good(self):
        job_id = self.job_ids[0]
        job = self.jm.get_job(job_id)
        self.assertEqual(job_id, job.job_id)
        self.assertIsInstance(job, Job)

    def test_get_job_bad(self):
        with self.assertRaisesRegex(
            NoJobException, "No job present with id not_a_job_id"
        ):
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

    def test_cancel_jobs__bad_inputs(self):
        with self.assertRaisesRegex(ValueError, NO_ID_ERR_STR):
            self.jm.cancel_jobs()

        with self.assertRaisesRegex(ValueError, NO_ID_ERR_STR):
            self.jm.cancel_jobs([])

        with self.assertRaisesRegex(ValueError, NO_ID_ERR_STR):
            self.jm.cancel_jobs(["", "", None])

        job_states = self.jm.cancel_jobs([JOB_NOT_FOUND])
        self.assertEqual({JOB_NOT_FOUND: get_dne_job_state(JOB_NOT_FOUND)}, job_states)

    def test_cancel_jobs__job_already_finished(self):
        self.assertEqual(get_test_job(JOB_COMPLETED)["status"], "completed")
        self.assertEqual(get_test_job(JOB_TERMINATED)["status"], "terminated")
        self.assertTrue(self.jm.get_job(JOB_COMPLETED).was_terminal)
        self.assertTrue(self.jm.get_job(JOB_TERMINATED).was_terminal)

        with mock.patch(
            "biokbase.narrative.jobs.jobmanager.JobManager._cancel_job"
        ) as mock_cancel_job:
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
                "state": {
                    "job_id": JOB_NOT_FOUND,
                    "status": "does_not_exist",
                }
            },
        }

        self.jm._running_jobs[JOB_RUNNING]["refresh"] = 1
        self.jm._running_jobs[JOB_CREATED]["refresh"] = 1

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
            self.assertEqual(self.jm._running_jobs[JOB_RUNNING]["refresh"], 1)
            self.assertEqual(self.jm._running_jobs[JOB_CREATED]["refresh"], 1)
            self.assertEqual(results.keys(), expected.keys())
            self.assertEqual(results, expected)
            mock_cancel_job.assert_has_calls(
                [
                    mock.call({"job_id": JOB_RUNNING}),
                    mock.call({"job_id": JOB_CREATED}),
                ],
                any_order=True,
            )

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_cancel_jobs(self):
        with assert_obj_method_called(self.jm, "cancel_jobs", True):
            self.jm.cancel_jobs([JOB_COMPLETED])

    def _check_retry_jobs(
        self,
        expected,
        retry_results,
    ):
        self.assertEqual(expected, retry_results)

        orig_ids = [
            result["job"]["state"]["job_id"]
            for result in retry_results
            if "error" not in result
        ]
        retry_ids = [
            result["retry"]["state"]["job_id"]
            for result in retry_results
            if "error" not in result
        ]
        dne_ids = [
            result["job"]["state"]["job_id"]
            for result in retry_results
            if result["job"]["state"]["status"] == "does_not_exist"
        ]

        for job_id in orig_ids + retry_ids:
            job = self.jm.get_job(job_id)
            self.assertIn(job_id, self.jm._running_jobs)
            self.assertIsNotNone(job._acc_state)

        for job_id in dne_ids:
            self.assertNotIn(job_id, self.jm._running_jobs)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__success(self):
        job_ids = [JOB_TERMINATED]
        expected = [
            {
                "job": self.job_states[JOB_TERMINATED],
                "retry": get_retry_job_state(JOB_TERMINATED),
            }
        ]

        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__multi_success(self):
        job_ids = [JOB_TERMINATED, JOB_ERROR]
        expected = [
            {
                "job": self.job_states[JOB_TERMINATED],
                "retry": get_retry_job_state(JOB_TERMINATED),
            },
            {
                "job": self.job_states[JOB_ERROR],
                "retry": get_retry_job_state(JOB_ERROR),
            },
        ]

        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__success_error_dne(self):
        job_ids = [JOB_NOT_FOUND, JOB_TERMINATED, JOB_COMPLETED]
        expected = [
            {
                "job": self.job_states[JOB_TERMINATED],
                "retry": get_retry_job_state(JOB_TERMINATED),
            },
            {
                "job": self.job_states[JOB_COMPLETED],
                "error": ERR_STR,
            },
            {
                "job": get_dne_job_state(JOB_NOT_FOUND),
                "error": "does_not_exist",
            },
        ]

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

        self._check_retry_jobs(expected, retry_results)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__all_error(self):
        job_ids = [JOB_TERMINATED, JOB_CREATED, JOB_RUNNING]
        expected = [
            {"job": self.job_states[JOB_TERMINATED], "error": ERR_STR},
            {"job": self.job_states[JOB_CREATED], "error": ERR_STR},
            {"job": self.job_states[JOB_RUNNING], "error": ERR_STR},
        ]

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

        self._check_retry_jobs(expected, retry_results)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__retry_already_terminal(self):
        job_id = JOB_TERMINATED
        retry_id = JOB_TERMINATED[::-1]
        retry_status = "error"

        expected = [
            {
                "job": self.job_states[JOB_TERMINATED],
                "retry": get_retry_job_state(JOB_TERMINATED, status=retry_status),
            }
        ]

        test_jobs_ = copy.deepcopy(TEST_JOBS)
        test_jobs_[retry_id] = {"job_id": retry_id, "status": retry_status}
        with mock.patch.object(
            MockClients,
            "ee2_job_info",
            test_jobs_,
        ):
            retry_results = self.jm.retry_jobs([job_id])

        self._check_retry_jobs(expected, retry_results)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_retry_jobs__none_exist(self):
        dne_id = "nope"
        job_ids = ["", "", None, dne_id]
        expected = [
            {
                "job": get_dne_job_state(dne_id),
                "error": "does_not_exist",
            }
        ]

        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    def test_retry_jobs__bad_inputs(self):
        with self.assertRaisesRegex(ValueError, NO_ID_ERR_STR):
            self.jm.retry_jobs([])

        with self.assertRaisesRegex(ValueError, NO_ID_ERR_STR):
            self.jm.retry_jobs(["", "", None])

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_lookup_all_job_states(self):
        states = self.jm.lookup_all_job_states()
        self.assertEqual(set(ACTIVE_JOBS), set(states.keys()))
        self.assertEqual(
            states,
            {id: self.job_states[id] for id in ACTIVE_JOBS},
        )

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_lookup_all_job_states__ignore_refresh_flag(self):
        states = self.jm.lookup_all_job_states(ignore_refresh_flag=True)
        self.assertEqual(set(self.job_ids), set(states.keys()))
        self.assertEqual(states, self.job_states)

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

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_get_job_states(self):
        job_ids = [
            None,
            None,
            JOB_CREATED,
            JOB_NOT_FOUND,
            JOB_CREATED,
            JOB_RUNNING,
            JOB_TERMINATED,
            JOB_COMPLETED,
            BATCH_PARENT,
            "",
            JOB_NOT_FOUND,
        ]

        exp = {
            **{
                job_id: self.job_states[job_id]
                for job_id in [
                    JOB_CREATED,
                    JOB_RUNNING,
                    JOB_TERMINATED,
                    JOB_COMPLETED,
                    BATCH_PARENT,
                ]
            },
            JOB_NOT_FOUND: get_dne_job_state(JOB_NOT_FOUND),
        }

        res = self.jm.get_job_states(job_ids)
        self.assertEqual(exp, res)

    def test_get_job_states__empty(self):
        with self.assertRaisesRegex(NoJobException, r"No job id\(s\) supplied"):
            self.jm.get_job_states([])

    def test_update_batch_job__dne(self):
        with self.assertRaisesRegex(
            NoJobException, f"No job present with id {JOB_NOT_FOUND}"
        ):
            self.jm.update_batch_job(JOB_NOT_FOUND)

    def test_update_batch_job__not_batch(self):
        with self.assertRaisesRegex(NotBatchException, "Not a batch job"):
            self.jm.update_batch_job(JOB_CREATED)

        with self.assertRaisesRegex(NotBatchException, "Not a batch job"):
            self.jm.update_batch_job(BATCH_TERMINATED)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_update_batch_job__no_change(self):
        job_ids = self.jm.update_batch_job(BATCH_PARENT)
        self.assertEqual(BATCH_PARENT, job_ids[0])
        self.assertCountEqual(BATCH_CHILDREN, job_ids[1:])

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_update_batch_job__change(self):
        """test child ids having changed"""
        new_child_ids = BATCH_CHILDREN[1:] + [JOB_CREATED, JOB_NOT_FOUND]

        def mock_check_job(params):
            """Called from job.state()"""
            job_id = params["job_id"]
            if job_id == BATCH_PARENT:
                return {"child_jobs": new_child_ids}
            elif job_id in TEST_JOBS:
                return get_test_job(job_id)
            elif job_id == JOB_NOT_FOUND:
                return {"job_id": job_id, "status": "does_not_exist"}
            else:
                raise Exception()

        with mock.patch.object(
            MockClients, "check_job", side_effect=mock_check_job
        ) as m:
            job_ids = self.jm.update_batch_job(BATCH_PARENT)

        m.assert_has_calls(
            [
                mock.call(
                    {
                        "job_id": BATCH_PARENT,
                        "exclude_fields": EXCLUDED_JOB_STATE_FIELDS,
                    }
                ),
                mock.call(
                    {
                        "job_id": JOB_NOT_FOUND,
                        "exclude_fields": JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
                    }
                ),
            ]
        )

        self.assertEqual(BATCH_PARENT, job_ids[0])
        self.assertCountEqual(new_child_ids, job_ids[1:])

        batch_job = self.jm.get_job(BATCH_PARENT)
        reg_child_jobs = [
            self.jm.get_job(job_id) for job_id in batch_job._acc_state["child_jobs"]
        ]

        self.assertCountEqual(batch_job.children, reg_child_jobs)
        self.assertCountEqual(batch_job._acc_state["child_jobs"], new_child_ids)

        with mock.patch.object(
            MockClients, "check_job", side_effect=mock_check_job
        ) as m:
            self.assertCountEqual(batch_job.child_jobs, new_child_ids)

    def test_modify_job_refresh(self):
        for job_id, terminality in JOBS_TERMINALITY.items():
            self.assertEqual(
                self.jm._running_jobs[job_id]["refresh"], int(not terminality)
            )
            self.jm.modify_job_refresh([job_id], -1)  # stop
            self.assertEqual(self.jm._running_jobs[job_id]["refresh"], 0)
            self.jm.modify_job_refresh([job_id], -1)  # stop
            self.assertEqual(self.jm._running_jobs[job_id]["refresh"], 0)
            self.jm.modify_job_refresh([job_id], 1)  # start
            self.assertEqual(self.jm._running_jobs[job_id]["refresh"], 1)
            self.jm.modify_job_refresh([job_id], 1)  # start
            self.assertEqual(self.jm._running_jobs[job_id]["refresh"], 2)
            self.jm.modify_job_refresh([job_id], -1)  # stop
            self.assertEqual(self.jm._running_jobs[job_id]["refresh"], 1)


if __name__ == "__main__":
    unittest.main()
