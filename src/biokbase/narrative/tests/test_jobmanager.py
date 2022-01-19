"""
Tests for job management
"""
import unittest
import copy
import itertools
from unittest import mock
import re
import os
from IPython.display import HTML

from biokbase.narrative.jobs.jobmanager import (
    JobManager,
    JOB_NOT_REG_ERR,
    JOB_NOT_BATCH_ERR,
    JOBS_TYPE_ERR,
    JOBS_MISSING_ERR,
    CELLS_NOT_PROVIDED_ERR,
)
from biokbase.narrative.jobs.job import (
    Job,
    EXCLUDED_JOB_STATE_FIELDS,
    JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
)
from biokbase.narrative.jobs.jobcomm import (
    INFO,
    RETRY,
    STATUS,
)
from biokbase.narrative.exception_util import (
    NarrativeException,
    JobRequestException,
)

from .util import ConfigTests

from biokbase.narrative.tests.job_test_constants import (
    CLIENTS,
    JOB_COMPLETED,
    JOB_CREATED,
    JOB_RUNNING,
    JOB_TERMINATED,
    JOB_ERROR,
    BATCH_PARENT,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    BATCH_ERROR_RETRIED,
    JOB_NOT_FOUND,
    BAD_JOB_ID,
    JOBS_TERMINALITY,
    ALL_JOBS,
    BAD_JOBS,
    TERMINAL_JOBS,
    ACTIVE_JOBS,
    BATCH_CHILDREN,
    TEST_JOBS,
    get_test_job,
    generate_error,
)

from biokbase.narrative.tests.generate_test_results import (
    ALL_RESPONSE_DATA,
    JOBS_BY_CELL_ID,
    TEST_CELL_ID_LIST,
    TEST_CELL_IDs,
)

from .narrative_mock.mockclients import (
    get_mock_client,
    get_failing_mock_client,
    assert_obj_method_called,
    MockClients,
)

__author__ = "Bill Riehl <wjriehl@lbl.gov>"


TERMINAL_IDS = [JOB_COMPLETED, JOB_TERMINATED, JOB_ERROR]
NON_TERMINAL_IDS = [JOB_CREATED, JOB_RUNNING]


class JobManagerTest(unittest.TestCase):
    @classmethod
    @mock.patch(CLIENTS, get_mock_client)
    def setUpClass(cls):
        config = ConfigTests()
        os.environ["KB_WORKSPACE_ID"] = config.get("jobs", "job_test_wsname")
        cls.maxDiff = None

    @mock.patch(CLIENTS, get_mock_client)
    def setUp(self) -> None:
        self.jm = JobManager()
        self.jm.initialize_jobs()

    def reset_job_manager(self):
        # all jobs have been removed from the JobManager
        self.jm._running_jobs = {}
        self.jm._jobs_by_cell_id = {}
        self.jm = JobManager()

        self.assertEqual(self.jm._running_jobs, {})
        self.assertEqual(self.jm._jobs_by_cell_id, {})

    @mock.patch(CLIENTS, get_failing_mock_client)
    def test_initialize_jobs_ee2_fail(self):
        # init jobs should fail. specifically, ee2.check_workspace_jobs should error.
        with self.assertRaisesRegex(NarrativeException, re.escape("Job lookup failed")):
            self.jm.initialize_jobs()

    @mock.patch(CLIENTS, get_mock_client)
    def test_initialize_jobs(self):
        self.reset_job_manager()

        # redo the initialise to make sure it worked correctly
        self.jm.initialize_jobs()
        terminal_ids = [
            job_id
            for job_id, d in self.jm._running_jobs.items()
            if d["job"].was_terminal()
        ]
        self.assertEqual(
            set(TERMINAL_JOBS),
            set(terminal_ids),
        )
        self.assertEqual(set(ALL_JOBS), set(self.jm._running_jobs.keys()))

        for job_id in TERMINAL_IDS:
            self.assertFalse(self.jm._running_jobs[job_id]["refresh"])
        for job_id in NON_TERMINAL_IDS:
            self.assertTrue(self.jm._running_jobs[job_id]["refresh"])

        self.assertEqual(self.jm._jobs_by_cell_id, JOBS_BY_CELL_ID)

    @mock.patch(CLIENTS, get_mock_client)
    def test_initialize_jobs__cell_ids(self):
        """
        Invoke initialize_jobs with cell_ids
        """
        cell_ids = list(JOBS_BY_CELL_ID.keys())
        # Iterate through all combinations of cell IDs
        for combo_len in range(len(cell_ids) + 1):
            for combo in itertools.combinations(cell_ids, combo_len):
                combo = list(combo)
                # Get jobs expected to be associated with the cell IDs
                exp_job_ids = [
                    job_id
                    for cell_id, job_ids in JOBS_BY_CELL_ID.items()
                    for job_id in job_ids
                    if cell_id in combo
                ]
                self.reset_job_manager()
                self.jm.initialize_jobs(cell_ids=combo)

                for job_id, d in self.jm._running_jobs.items():
                    refresh = d["refresh"]

                    self.assertEqual(
                        int(job_id in exp_job_ids and not JOBS_TERMINALITY[job_id]),
                        refresh,
                    )

    def test__check_job_list_fail(self):
        with self.assertRaisesRegex(JobRequestException, f"{JOBS_TYPE_ERR}: {None}"):
            self.jm._check_job_list(None)

        with self.assertRaisesRegex(
            JobRequestException, re.escape(f"{JOBS_MISSING_ERR}: {[]}")
        ):
            self.jm._check_job_list([])

        with self.assertRaisesRegex(
            JobRequestException, re.escape(f'{JOBS_MISSING_ERR}: {["", "", None]}')
        ):
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

    @mock.patch(CLIENTS, get_mock_client)
    def test__construct_job_output_state_set(self):
        self.assertEqual(
            self.jm._construct_job_output_state_set(ALL_JOBS),
            {job_id: ALL_RESPONSE_DATA[STATUS][job_id] for job_id in ALL_JOBS},
        )

    def test__construct_job_output_state_set__empty_list(self):
        self.assertEqual(self.jm._construct_job_output_state_set([]), {})

    @mock.patch(CLIENTS, get_mock_client)
    def test__construct_job_output_state_set__ee2_error(self):
        def mock_check_jobs(self, params):
            raise Exception("Test exception")

        TIME_NOW = 987654321
        with mock.patch("time.time") as fake_time:
            fake_time.return_value = TIME_NOW
            with mock.patch.object(
                MockClients, "check_jobs", side_effect=mock_check_jobs
            ):
                job_states = self.jm._construct_job_output_state_set(ALL_JOBS)

        expected = {
            job_id: copy.deepcopy(ALL_RESPONSE_DATA[STATUS][job_id])
            for job_id in ALL_JOBS
        }

        for job_id in ACTIVE_JOBS:
            # add in the ee2_error status and updated timestamp
            expected[job_id]["jobState"]["status"] = "ee2_error"
            expected[job_id]["jobState"]["updated"] = TIME_NOW

        self.assertEqual(
            expected,
            job_states,
        )

    def test__create_jobs__empty_list(self):
        self.assertEqual(self.jm._create_jobs([]), {})

    def test__create_jobs__jobs_already_exist(self):
        job_list = self.jm._running_jobs.keys()
        self.assertEqual(self.jm._create_jobs(job_list), {})

    def test__get_job_good(self):
        job_id = ALL_JOBS[0]
        job = self.jm.get_job(job_id)
        self.assertEqual(job_id, job.job_id)
        self.assertIsInstance(job, Job)

    def test__get_job_fail(self):

        inputs = [None, "", JOB_NOT_FOUND]

        for input in inputs:
            with self.assertRaisesRegex(
                JobRequestException, f"{JOB_NOT_REG_ERR}: {input}"
            ):
                self.jm.get_job(input)

    @mock.patch(CLIENTS, get_mock_client)
    def test_list_jobs_html(self):
        jobs_html = self.jm.list_jobs()
        self.assertIsInstance(jobs_html, HTML)
        html = jobs_html.data

        counts = {
            "status": {},
            "app_id": {},
            "batch_id": {},
            "user": {},
        }

        n_not_started = 0
        n_incomplete = 0
        for job in TEST_JOBS.values():
            for param in ["status", "user"]:
                if param in job:
                    value = job[param]
                    if value not in counts[param]:
                        counts[param][value] = 0
                    counts[param][value] += 1

            app_id = job["job_input"]["app_id"]
            if app_id not in counts["app_id"]:
                counts["app_id"][app_id] = 0
            counts["app_id"][app_id] += 1

            if "finished" not in job:
                n_incomplete += 1
            if "running" not in job:
                n_not_started += 1

        for job_id in ALL_JOBS:
            self.assertIn(f"<td>{job_id}</td>", html)

        for param in counts:
            for value in counts[param]:
                self.assertIn("<td>" + str(value) + "</td>", html)
                value_count = html.count("<td>" + str(value) + "</td>")

                self.assertEqual(counts[param][value], value_count)

        if n_incomplete:
            incomplete_count = html.count("<td>Incomplete</td>")
            self.assertEqual(incomplete_count, n_incomplete)
        if n_not_started:
            not_started_count = html.count("<td>Not started</td>")
            self.assertEqual(not_started_count, n_not_started)

    def test_list_jobs_twice(self):
        # with no jobs
        with mock.patch.object(self.jm, "_running_jobs", {}):
            expected = "No running jobs!"
            self.assertEqual(self.jm.list_jobs(), expected)
            self.assertEqual(self.jm.list_jobs(), expected)

        # with some jobs
        with mock.patch(CLIENTS, get_mock_client):
            jobs_html_0 = self.jm.list_jobs().data
            jobs_html_1 = self.jm.list_jobs().data

            try:
                self.assertEqual(jobs_html_0, jobs_html_1)
            except AssertionError:
                # Sometimes the time is off by a second
                # This will still fail if on the hour
                pattern = r"(\d\d:)\d\d:\d\d"
                sub = r"\1"
                jobs_html_0 = re.sub(pattern, sub, jobs_html_0)
                jobs_html_1 = re.sub(pattern, sub, jobs_html_1)
                self.assertEqual(jobs_html_0, jobs_html_1)

    def test_cancel_jobs__bad_inputs(self):
        with self.assertRaisesRegex(
            JobRequestException, re.escape(f"{JOBS_MISSING_ERR}: {[]}")
        ):
            self.jm.cancel_jobs([])

        with self.assertRaisesRegex(
            JobRequestException, re.escape(f'{JOBS_MISSING_ERR}: {["", "", None]}')
        ):
            self.jm.cancel_jobs(["", "", None])

        job_states = self.jm.cancel_jobs([JOB_NOT_FOUND])
        self.assertEqual({JOB_NOT_FOUND: ALL_RESPONSE_DATA[STATUS][JOB_NOT_FOUND]}, job_states)

    def test_cancel_jobs__job_already_finished(self):
        self.assertEqual(get_test_job(JOB_COMPLETED)["status"], "completed")
        self.assertEqual(get_test_job(JOB_TERMINATED)["status"], "terminated")
        self.assertTrue(self.jm.get_job(JOB_COMPLETED).was_terminal())
        self.assertTrue(self.jm.get_job(JOB_TERMINATED).was_terminal())
        job_id_list = [JOB_COMPLETED, JOB_TERMINATED]
        with mock.patch(
            "biokbase.narrative.jobs.jobmanager.JobManager._cancel_job"
        ) as mock_cancel_job:
            canceled_jobs = self.jm.cancel_jobs(job_id_list)
            mock_cancel_job.assert_not_called()
            self.assertEqual(
                {id: ALL_RESPONSE_DATA[STATUS][id] for id in job_id_list},
                canceled_jobs,
            )

    @mock.patch(CLIENTS, get_mock_client)
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

        expected = {id: ALL_RESPONSE_DATA[STATUS][id] for id in jobs if id}
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
            for job in [JOB_RUNNING, JOB_CREATED]:
                self.assertNotIn("canceling", self.jm._running_jobs[job])
                self.assertEqual(self.jm._running_jobs[job]["refresh"], 1)
            self.assertEqual(results.keys(), expected.keys())
            self.assertEqual(results, expected)
            mock_cancel_job.assert_has_calls(
                [
                    mock.call({"job_id": JOB_RUNNING}),
                    mock.call({"job_id": JOB_CREATED}),
                ],
                any_order=True,
            )

    @mock.patch(CLIENTS, get_mock_client)
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
            result["job"]["jobState"]["job_id"]
            for result in retry_results.values()
            if "error" not in result
        ]
        retry_ids = [
            result["retry"]["jobState"]["job_id"]
            for result in retry_results.values()
            if "error" not in result
        ]
        dne_ids = [
            result["job_id"]
            for result in retry_results.values()
            if result["job_id"] in BAD_JOBS
        ]

        for job_id in orig_ids + retry_ids:
            job = self.jm.get_job(job_id)
            self.assertIn(job_id, self.jm._running_jobs)
            self.assertIsNotNone(job._acc_state)

        for job_id in dne_ids:
            self.assertNotIn(job_id, self.jm._running_jobs)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__success(self):
        job_ids = [BATCH_TERMINATED_RETRIED]
        expected = {id: ALL_RESPONSE_DATA[RETRY][id] for id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__multi_success(self):
        job_ids = [BATCH_TERMINATED_RETRIED, BATCH_ERROR_RETRIED]
        expected = {id: ALL_RESPONSE_DATA[RETRY][id] for id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__success_error_dne(self):
        job_ids = [JOB_NOT_FOUND, BATCH_TERMINATED_RETRIED, JOB_COMPLETED]
        expected = {id: ALL_RESPONSE_DATA[RETRY][id] for id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__all_error(self):
        job_ids = [JOB_COMPLETED, JOB_CREATED, JOB_RUNNING]
        expected = {id: ALL_RESPONSE_DATA[RETRY][id] for id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__retry_already_terminal(self):
        job_ids = [JOB_COMPLETED]
        expected = {id: ALL_RESPONSE_DATA[RETRY][id] for id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__none_exist(self):
        job_ids = ["", "", None, BAD_JOB_ID]
        expected = {id: ALL_RESPONSE_DATA[RETRY][id] for id in job_ids if id}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    def test_retry_jobs__bad_inputs(self):
        with self.assertRaisesRegex(
            JobRequestException, re.escape(f"{JOBS_MISSING_ERR}: {[]}")
        ):
            self.jm.retry_jobs([])

        with self.assertRaisesRegex(
            JobRequestException, re.escape(f'{JOBS_MISSING_ERR}: {["", "", None]}')
        ):
            self.jm.retry_jobs(["", "", None])

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_all_job_states(self):
        states = self.jm.lookup_all_job_states()
        self.assertEqual(set(ACTIVE_JOBS), set(states.keys()))
        self.assertEqual(
            states,
            {id: ALL_RESPONSE_DATA[STATUS][id] for id in ACTIVE_JOBS},
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_all_job_states__ignore_refresh_flag(self):
        states = self.jm.lookup_all_job_states(ignore_refresh_flag=True)
        self.assertEqual(set(ALL_JOBS), set(states.keys()))
        self.assertEqual({id: ALL_RESPONSE_DATA[STATUS][id] for id in ALL_JOBS}, states)

    ## lookup_job_states_by_cell_id
    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list_None(self):
        with self.assertRaisesRegex(JobRequestException, CELLS_NOT_PROVIDED_ERR):
            self.jm.lookup_job_states_by_cell_id(cell_id_list=None)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list_empty(self):
        with self.assertRaisesRegex(JobRequestException, CELLS_NOT_PROVIDED_ERR):
            self.jm.lookup_job_states_by_cell_id(cell_id_list=[])

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list_no_results(self):
        result = self.jm.lookup_job_states_by_cell_id(cell_id_list=["a", "b", "c"])
        self.assertEqual(
            {"jobs": {}, "mapping": {"a": set(), "b": set(), "c": set()}}, result
        )

    def check_lookup_job_states_by_cell_id_results(self, cell_ids, expected_ids):
        expected_states = {
            id: ALL_RESPONSE_DATA[STATUS][id]
            for id in ALL_RESPONSE_DATA[STATUS].keys()
            if id in expected_ids
        }
        result = self.jm.lookup_job_states_by_cell_id(cell_id_list=cell_ids)
        self.assertEqual(set(expected_ids), set(result["jobs"].keys()))
        self.assertEqual(expected_states, result["jobs"])
        self.assertEqual(set(cell_ids), set(result["mapping"].keys()))
        for key in result["mapping"].keys():
            self.assertEqual(set(TEST_CELL_IDs[key]), set(result["mapping"][key]))

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list_all_results(self):
        cell_ids = TEST_CELL_ID_LIST
        self.check_lookup_job_states_by_cell_id_results(cell_ids, ALL_JOBS)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list__batch_job__one_cell(self):
        cell_ids = [TEST_CELL_ID_LIST[2]]
        expected_ids = TEST_CELL_IDs[TEST_CELL_ID_LIST[2]]
        self.check_lookup_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list__batch_job__two_cells(self):
        cell_ids = [TEST_CELL_ID_LIST[2], TEST_CELL_ID_LIST[3]]
        expected_ids = (
            TEST_CELL_IDs[TEST_CELL_ID_LIST[2]] + TEST_CELL_IDs[TEST_CELL_ID_LIST[3]]
        )
        self.check_lookup_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list__batch_job__one_ok_one_invalid(
        self,
    ):
        cell_ids = [TEST_CELL_ID_LIST[1], TEST_CELL_ID_LIST[4]]
        expected_ids = TEST_CELL_IDs[TEST_CELL_ID_LIST[1]]
        self.check_lookup_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list__batch_and_other_job(self):
        cell_ids = [TEST_CELL_ID_LIST[0], TEST_CELL_ID_LIST[2]]
        expected_ids = (
            TEST_CELL_IDs[TEST_CELL_ID_LIST[0]] + TEST_CELL_IDs[TEST_CELL_ID_LIST[2]]
        )
        self.check_lookup_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
    def test_lookup_job_states_by_cell_id__cell_id_list__batch_in_many_cells(self):
        cell_ids = [TEST_CELL_ID_LIST[0], TEST_CELL_ID_LIST[2], TEST_CELL_ID_LIST[3]]
        expected_ids = (
            TEST_CELL_IDs[TEST_CELL_ID_LIST[0]]
            + TEST_CELL_IDs[TEST_CELL_ID_LIST[2]]
            + TEST_CELL_IDs[TEST_CELL_ID_LIST[3]]
        )
        self.check_lookup_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
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

        exp = {id: ALL_RESPONSE_DATA[STATUS][id] for id in job_ids if id}

        res = self.jm.get_job_states(job_ids)
        self.assertEqual(exp, res)

    def test_get_job_states__empty(self):
        with self.assertRaisesRegex(
            JobRequestException, re.escape(f"{JOBS_MISSING_ERR}: {[]}")
        ):
            self.jm.get_job_states([])

    def test_update_batch_job__dne(self):
        with self.assertRaisesRegex(
            JobRequestException, f"{JOB_NOT_REG_ERR}: {JOB_NOT_FOUND}"
        ):
            self.jm.update_batch_job(JOB_NOT_FOUND)

    def test_update_batch_job__not_batch(self):
        with self.assertRaisesRegex(
            JobRequestException, f"{JOB_NOT_BATCH_ERR}: {JOB_CREATED}"
        ):
            self.jm.update_batch_job(JOB_CREATED)

        with self.assertRaisesRegex(
            JobRequestException, f"{JOB_NOT_BATCH_ERR}: {BATCH_TERMINATED}"
        ):
            self.jm.update_batch_job(BATCH_TERMINATED)

    @mock.patch(CLIENTS, get_mock_client)
    def test_update_batch_job__no_change(self):
        job_ids = self.jm.update_batch_job(BATCH_PARENT)
        self.assertEqual(BATCH_PARENT, job_ids[0])
        self.assertCountEqual(BATCH_CHILDREN, job_ids[1:])

    @mock.patch(CLIENTS, get_mock_client)
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
                return {"job_id": job_id, "status": generate_error(job_id, "not_found")}
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

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_info(self):
        infos = self.jm.get_job_info(ALL_JOBS)
        self.assertCountEqual(ALL_JOBS, infos.keys())
        self.assertEqual(infos, {id: ALL_RESPONSE_DATA[INFO][id] for id in ALL_JOBS})


if __name__ == "__main__":
    unittest.main()
