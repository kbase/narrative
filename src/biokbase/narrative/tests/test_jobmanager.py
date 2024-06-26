import copy
import itertools
import os
import re
import unittest
from datetime import datetime
from unittest import mock

import pytest
from biokbase.narrative.exception_util import JobRequestException, NarrativeException
from biokbase.narrative.jobs.job import (
    EXCLUDED_JOB_STATE_FIELDS,
    JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
    Job,
)
from biokbase.narrative.jobs.jobcomm import MESSAGE_TYPE
from biokbase.narrative.jobs.jobmanager import (
    CELLS_NOT_PROVIDED_ERR,
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
    BAD_JOBS,
    BATCH_CHILDREN,
    BATCH_ERROR_RETRIED,
    BATCH_PARENT,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    CLIENTS,
    JOB_COMPLETED,
    JOB_CREATED,
    JOB_ERROR,
    JOB_NOT_FOUND,
    JOB_RUNNING,
    JOB_TERMINATED,
    REFRESH_STATE,
    TERMINAL_JOBS,
    TEST_JOBS,
    generate_error,
    get_test_job,
)
from biokbase.narrative.tests.narrative_mock.mockclients import (
    MockClients,
    assert_obj_method_called,
    get_failing_mock_client,
    get_mock_client,
)
from biokbase.narrative.tests.util import ConfigTests
from IPython.display import HTML

TERMINAL_IDS = [JOB_COMPLETED, JOB_TERMINATED, JOB_ERROR]
NON_TERMINAL_IDS = [JOB_CREATED, JOB_RUNNING]


class JobManagerTest(unittest.TestCase):
    """Tests for job management"""

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

        assert self.jm._running_jobs == {}
        assert self.jm._jobs_by_cell_id == {}

    @mock.patch(CLIENTS, get_failing_mock_client)
    def test_initialize_jobs_ee2_fail(self):
        # init jobs should fail. specifically, ee2.check_workspace_jobs should error.
        with pytest.raises(NarrativeException, match=re.escape("check_workspace_jobs failed")):
            self.jm.initialize_jobs()

    @mock.patch(CLIENTS, get_mock_client)
    def test_initialize_jobs(self):
        self.reset_job_manager()

        # redo the initialise to make sure it worked correctly
        self.jm.initialize_jobs()
        terminal_ids = [
            job_id for job_id, d in self.jm._running_jobs.items() if d["job"].in_terminal_state()
        ]
        assert set(TERMINAL_JOBS) == set(terminal_ids)
        assert set(ALL_JOBS) == set(self.jm._running_jobs.keys())

        for job_id in TERMINAL_IDS:
            assert self.jm._running_jobs[job_id]["refresh"] is False
        for job_id in NON_TERMINAL_IDS:
            assert self.jm._running_jobs[job_id]["refresh"] is True

        assert self.jm._jobs_by_cell_id == JOBS_BY_CELL_ID

    @mock.patch(CLIENTS, get_mock_client)
    def test_initialize_jobs__cell_ids(self):
        """Invoke initialize_jobs with cell_ids"""
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

                self.reset_job_manager()
                self.jm.initialize_jobs(cell_ids=combo_list)

                for job_id, d in self.jm._running_jobs.items():
                    expected_refresh_state = job_id in exp_job_ids and REFRESH_STATE[job_id]
                    assert expected_refresh_state == d["refresh"]

    def test__check_job_list_fail__wrong_type(self):
        with pytest.raises(JobRequestException, match=f"{JOBS_MISSING_ERR}: {{}}"):
            self.jm._check_job_list({})

    def test__check_job_list_fail__none(self):
        with pytest.raises(JobRequestException, match=f"{JOBS_MISSING_ERR}: {None}"):
            self.jm._check_job_list(None)

    def test__check_job_list_fail__no_args(self):
        with pytest.raises(JobRequestException, match=re.escape(f"{JOBS_MISSING_ERR}: {None}")):
            self.jm._check_job_list()

    def test__check_job_list_fail__empty(self):
        with pytest.raises(JobRequestException, match=re.escape(f"{JOBS_MISSING_ERR}: {[]}")):
            self.jm._check_job_list([])

    def test__check_job_list_fail__nonsense_list_items(self):
        with pytest.raises(
            JobRequestException,
            match=re.escape(f'{JOBS_MISSING_ERR}: {["", "", None]}'),
        ):
            self.jm._check_job_list(["", "", None])

    def test__check_job_list(self):
        """Job list checker"""
        job_a = JOB_CREATED
        job_b = JOB_COMPLETED
        job_c = "job_c"
        job_d = "job_d"
        assert self.jm._check_job_list([job_c]) == (
            [],
            [job_c],
        )

        assert self.jm._check_job_list([job_c, None, "", job_c, job_c, None, job_d]) == (
            [],
            [job_c, job_d],
        )

        assert self.jm._check_job_list([job_c, None, "", None, job_a, job_a, job_a]) == (
            [job_a],
            [job_c],
        )

        assert self.jm._check_job_list([None, job_a, None, "", None, job_b]) == (
            [job_a, job_b],
            [],
        )

    @mock.patch(CLIENTS, get_mock_client)
    def test__construct_job_output_state_set(self):
        assert self.jm._construct_job_output_state_set(ALL_JOBS) == {
            job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][job_id] for job_id in ALL_JOBS
        }

    def test__construct_job_output_state_set__empty_list(self):
        assert self.jm._construct_job_output_state_set([]) == {}

    @mock.patch(CLIENTS, get_mock_client)
    def test__construct_job_output_state_set__ee2_error(self):
        exc = Exception("Test exception")
        exc_msg = str(exc)

        expected = {
            job_id: copy.deepcopy(ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][job_id])
            for job_id in ALL_JOBS
        }

        for job_id in ACTIVE_JOBS:
            # expect there to be an error message added
            expected[job_id]["error"] = exc_msg

        def mock_check_jobs(params):
            raise exc

        with mock.patch.object(MockClients, "check_jobs", side_effect=mock_check_jobs):
            job_states = self.jm._construct_job_output_state_set(ALL_JOBS)

        assert expected == job_states

    def test__create_jobs__empty_list(self):
        assert self.jm._create_jobs([]) == {}

    def test__create_jobs__jobs_already_exist(self):
        job_list = self.jm._running_jobs.keys()
        assert self.jm._create_jobs(job_list) == {}

    def test__get_job_good(self):
        job_id = ALL_JOBS[0]
        job = self.jm.get_job(job_id)
        assert job_id == job.job_id
        assert isinstance(job, Job)

    def test__get_job_fail(self):
        inputs = [None, "", JOB_NOT_FOUND]

        for bad_input in inputs:
            with pytest.raises(JobRequestException, match=f"{JOB_NOT_REG_ERR}: {bad_input}"):
                self.jm.get_job(bad_input)

    @mock.patch(CLIENTS, get_mock_client)
    def test_list_jobs_html(self):
        jobs_html = self.jm.list_jobs()
        assert isinstance(jobs_html, HTML)
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
            assert f'<td class="job_id">{job_id}</td>' in html

        for param in counts:
            for value in counts[param]:
                assert f'<td class="{param}">{value!s}</td>' in html
                value_count = html.count(f'<td class="{param}">{value!s}</td>')

                assert counts[param][value] == value_count

        if n_incomplete:
            incomplete_count = html.count('<td class="finish_time">Incomplete</td>')
            assert incomplete_count == n_incomplete
        if n_not_started:
            not_started_count = html.count('<td class="run_time">Not started</td>')
            assert not_started_count == n_not_started

    def test_list_jobs_twice__no_jobs(self):
        # with no jobs
        with mock.patch.object(self.jm, "_running_jobs", {}):
            expected = "No running jobs!"
            assert self.jm.list_jobs() == expected
            assert self.jm.list_jobs() == expected

    def test_list_jobs_twice__jobs(self):
        """The trick is to adapt to timestamps that might be off by 1s
        Each block in jm.list_jobs().data looks like:
                <tr>
                    <td class="job_id">61a6b44b2ace7e90ad6dc48f</td>
                    <td class="app_id">kb_uploadmethods/import_fasta_as_assembly_from_staging</td>
                    <td class="created">2021-11-30 23:31:23</td>
                    <td class="batch_id">61a6b44b2ace7e90ad6dc48c</td>
                    <td class="user">swwang</td>
                    <td class="status">error</td>
                    <td class="run_time">0:00:42</td>
                    <td class="finish_time">2021-11-30 23:32:22</td>
                </tr>
        """
        with mock.patch(CLIENTS, get_mock_client):
            jobs_html_0 = self.jm.list_jobs().data
            jobs_html_1 = self.jm.list_jobs().data

        sub = ""  # when stripping out date-times or delta-times

        # collect date-times
        date_time_re_pattern = r"\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d"
        date_time_fmt_pattern = "%Y-%m-%d %H:%M:%S"
        date_times_0 = [
            datetime.strptime(s, date_time_fmt_pattern)
            for s in re.findall(date_time_re_pattern, jobs_html_0)
        ]
        date_times_1 = [
            datetime.strptime(s, date_time_fmt_pattern)
            for s in re.findall(date_time_re_pattern, jobs_html_1)
        ]

        # strip date-times
        jobs_html_0 = re.sub(date_time_re_pattern, sub, jobs_html_0)
        jobs_html_1 = re.sub(date_time_re_pattern, sub, jobs_html_1)

        # compare date-times
        for dt0, dt1 in zip(date_times_0, date_times_1, strict=False):
            assert (dt1 - dt0).total_seconds() <= 5  # usually 1s suffices

        # just strip delta-times (don't compare)
        # delta-times are difficult to parse into date-times
        # and are computed from the aforetested datetimes anyway
        time_re_pattern = r"(\d+ days?, )?\d+:\d\d:\d\d"
        jobs_html_0 = re.sub(time_re_pattern, sub, jobs_html_0)
        jobs_html_1 = re.sub(time_re_pattern, sub, jobs_html_1)

        # compare stripped
        assert jobs_html_0 == jobs_html_1

    def test_cancel_jobs__bad_inputs(self):
        with pytest.raises(JobRequestException, match=re.escape(f"{JOBS_MISSING_ERR}: {[]}")):
            self.jm.cancel_jobs([])

        with pytest.raises(
            JobRequestException,
            match=re.escape(f'{JOBS_MISSING_ERR}: {["", "", None]}'),
        ):
            self.jm.cancel_jobs(["", "", None])

        job_states = self.jm.cancel_jobs([JOB_NOT_FOUND])
        assert {
            JOB_NOT_FOUND: ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][JOB_NOT_FOUND]
        } == job_states

    def test_cancel_jobs__job_already_finished(self):
        assert get_test_job(JOB_COMPLETED)["status"] == "completed"
        assert get_test_job(JOB_TERMINATED)["status"] == "terminated"
        assert self.jm.get_job(JOB_COMPLETED).in_terminal_state() is True
        assert self.jm.get_job(JOB_TERMINATED).in_terminal_state() is True
        job_id_list = [JOB_COMPLETED, JOB_TERMINATED]
        with mock.patch(
            "biokbase.narrative.jobs.jobmanager.JobManager._cancel_job"
        ) as mock_cancel_job:
            canceled_jobs = self.jm.cancel_jobs(job_id_list)
            mock_cancel_job.assert_not_called()
            assert {
                job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][job_id] for job_id in job_id_list
            } == canceled_jobs

    @mock.patch(CLIENTS, get_mock_client)
    def test_cancel_jobs__run_ee2_cancel_job(self):
        """Cancel a set of jobs that run cancel_job on ee2"""
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
            job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][job_id] for job_id in jobs if job_id
        }
        self.jm._running_jobs[JOB_RUNNING]["refresh"] = 1
        self.jm._running_jobs[JOB_CREATED]["refresh"] = 1

        def check_state(arg):
            assert self.jm._running_jobs[arg["job_id"]]["refresh"] is False
            assert self.jm._running_jobs[arg["job_id"]]["canceling"] is True

        # patch MockClients.cancel_job so we can test the input
        with mock.patch.object(
            MockClients,
            "cancel_job",
            mock.Mock(return_value={}, side_effect=check_state),
        ) as mock_cancel_job:
            results = self.jm.cancel_jobs(jobs)
            for job in [JOB_RUNNING, JOB_CREATED]:
                assert "canceling" not in self.jm._running_jobs[job]
                assert self.jm._running_jobs[job]["refresh"] == 1
            assert results.keys() == expected.keys()
            assert results == expected
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
        assert expected == retry_results
        orig_ids = [result["job_id"] for result in retry_results.values() if "error" not in result]
        retry_ids = [
            result["retry_id"] for result in retry_results.values() if "error" not in result
        ]
        dne_ids = [
            result["job_id"] for result in retry_results.values() if result["job_id"] in BAD_JOBS
        ]

        for job_id in orig_ids + retry_ids:
            job = self.jm.get_job(job_id)
            assert job_id in self.jm._running_jobs
            assert job._acc_state is not None

        for job_id in dne_ids:
            assert job_id not in self.jm._running_jobs

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__success(self):
        job_ids = [BATCH_TERMINATED_RETRIED]
        expected = {job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["RETRY"]][job_id] for job_id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__multi_success(self):
        job_ids = [BATCH_TERMINATED_RETRIED, BATCH_ERROR_RETRIED]
        expected = {job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["RETRY"]][job_id] for job_id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__success_error_dne(self):
        job_ids = [JOB_NOT_FOUND, BATCH_TERMINATED_RETRIED, JOB_COMPLETED]
        expected = {job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["RETRY"]][job_id] for job_id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__all_error(self):
        job_ids = [JOB_COMPLETED, JOB_CREATED, JOB_RUNNING]
        expected = {job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["RETRY"]][job_id] for job_id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__retry_already_terminal(self):
        job_ids = [JOB_COMPLETED]
        expected = {job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["RETRY"]][job_id] for job_id in job_ids}
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    @mock.patch(CLIENTS, get_mock_client)
    def test_retry_jobs__none_exist(self):
        job_ids = ["", "", None, BAD_JOB_ID]
        expected = {
            job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["RETRY"]][job_id] for job_id in job_ids if job_id
        }
        retry_results = self.jm.retry_jobs(job_ids)
        self._check_retry_jobs(expected, retry_results)

    def test_retry_jobs__bad_inputs(self):
        with pytest.raises(JobRequestException, match=re.escape(f"{JOBS_MISSING_ERR}: {[]}")):
            self.jm.retry_jobs([])

        with pytest.raises(
            JobRequestException,
            match=re.escape(f'{JOBS_MISSING_ERR}: {["", "", None]}'),
        ):
            self.jm.retry_jobs(["", "", None])

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_all_job_states(self):
        states = self.jm.get_all_job_states()
        refreshing_jobs = [job_id for job_id, state in REFRESH_STATE.items() if state]
        assert set(refreshing_jobs) == set(states.keys())
        assert states == {
            job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][job_id] for job_id in refreshing_jobs
        }

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_all_job_states__ignore_refresh_flag(self):
        states = self.jm.get_all_job_states(ignore_refresh_flag=True)
        assert set(ALL_JOBS) == set(states.keys())
        assert states == {
            job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][job_id] for job_id in ALL_JOBS
        }

    # get_job_states_by_cell_id
    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list_None(self):
        with pytest.raises(JobRequestException, match=CELLS_NOT_PROVIDED_ERR):
            self.jm.get_job_states_by_cell_id(cell_id_list=None)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list_empty(self):
        with pytest.raises(JobRequestException, match=CELLS_NOT_PROVIDED_ERR):
            self.jm.get_job_states_by_cell_id(cell_id_list=[])

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list_no_results(self):
        result = self.jm.get_job_states_by_cell_id(cell_id_list=["a", "b", "c"])
        assert {"jobs": {}, "mapping": {"a": set(), "b": set(), "c": set()}} == result

    def check_get_job_states_by_cell_id_results(self, cell_ids, expected_ids):
        expected_states = {
            job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][job_id]
            for job_id in ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]].keys()
            if job_id in expected_ids
        }
        result = self.jm.get_job_states_by_cell_id(cell_id_list=cell_ids)
        assert set(expected_ids) == set(result["jobs"].keys())
        assert expected_states == result["jobs"]
        assert set(cell_ids) == set(result["mapping"].keys())
        for key in result["mapping"].keys():
            assert set(TEST_CELL_IDs[key]) == set(result["mapping"][key])

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list_all_results(self):
        cell_ids = TEST_CELL_ID_LIST
        self.check_get_job_states_by_cell_id_results(cell_ids, ALL_JOBS)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list__batch_job__one_cell(self):
        cell_ids = [TEST_CELL_ID_LIST[2]]
        expected_ids = TEST_CELL_IDs[TEST_CELL_ID_LIST[2]]
        self.check_get_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list__batch_job__two_cells(self):
        cell_ids = [TEST_CELL_ID_LIST[2], TEST_CELL_ID_LIST[3]]
        expected_ids = TEST_CELL_IDs[TEST_CELL_ID_LIST[2]] + TEST_CELL_IDs[TEST_CELL_ID_LIST[3]]
        self.check_get_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list__batch_job__one_ok_one_invalid(
        self,
    ):
        cell_ids = [TEST_CELL_ID_LIST[1], TEST_CELL_ID_LIST[4]]
        expected_ids = TEST_CELL_IDs[TEST_CELL_ID_LIST[1]]
        self.check_get_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list__batch_and_other_job(self):
        cell_ids = [TEST_CELL_ID_LIST[0], TEST_CELL_ID_LIST[2]]
        expected_ids = TEST_CELL_IDs[TEST_CELL_ID_LIST[0]] + TEST_CELL_IDs[TEST_CELL_ID_LIST[2]]
        self.check_get_job_states_by_cell_id_results(cell_ids, expected_ids)

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_states_by_cell_id__cell_id_list__batch_in_many_cells(self):
        cell_ids = [TEST_CELL_ID_LIST[0], TEST_CELL_ID_LIST[2], TEST_CELL_ID_LIST[3]]
        expected_ids = (
            TEST_CELL_IDs[TEST_CELL_ID_LIST[0]]
            + TEST_CELL_IDs[TEST_CELL_ID_LIST[2]]
            + TEST_CELL_IDs[TEST_CELL_ID_LIST[3]]
        )
        self.check_get_job_states_by_cell_id_results(cell_ids, expected_ids)

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

        exp = {
            job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["STATUS"]][job_id]
            for job_id in job_ids
            if job_id
        }

        res = self.jm.get_job_states(job_ids)
        assert exp == res

    def test_get_job_states__empty(self):
        with pytest.raises(JobRequestException, match=re.escape(f"{JOBS_MISSING_ERR}: {[]}")):
            self.jm.get_job_states([])

    def test_update_batch_job__dne(self):
        with pytest.raises(JobRequestException, match=f"{JOB_NOT_REG_ERR}: {JOB_NOT_FOUND}"):
            self.jm.update_batch_job(JOB_NOT_FOUND)

    def test_update_batch_job__not_batch(self):
        with pytest.raises(JobRequestException, match=f"{JOB_NOT_BATCH_ERR}: {JOB_CREATED}"):
            self.jm.update_batch_job(JOB_CREATED)

        with pytest.raises(JobRequestException, match=f"{JOB_NOT_BATCH_ERR}: {BATCH_TERMINATED}"):
            self.jm.update_batch_job(BATCH_TERMINATED)

    @mock.patch(CLIENTS, get_mock_client)
    def test_update_batch_job__no_change(self):
        job_ids = self.jm.update_batch_job(BATCH_PARENT)
        assert job_ids[0] == BATCH_PARENT
        assert len(BATCH_CHILDREN) == len(job_ids[1:])

    @mock.patch(CLIENTS, get_mock_client)
    def test_update_batch_job__change(self):
        """Test child ids having changed"""
        new_child_ids = BATCH_CHILDREN[1:] + [JOB_CREATED, JOB_NOT_FOUND]

        def mock_check_job(params):
            """Called from job.refresh_state()"""
            job_id = params["job_id"]
            if job_id == BATCH_PARENT:
                return {"child_jobs": new_child_ids}
            if job_id in TEST_JOBS:
                return get_test_job(job_id)
            if job_id == JOB_NOT_FOUND:
                return {"job_id": job_id, "status": generate_error(job_id, "not_found")}
            raise ValueError(f"Invalid job id: {job_id}")

        with mock.patch.object(MockClients, "check_job", side_effect=mock_check_job) as m:
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

        assert job_ids[0] == BATCH_PARENT
        assert len(new_child_ids) == len(job_ids[1:])

        batch_job = self.jm.get_job(BATCH_PARENT)
        reg_child_jobs = [self.jm.get_job(job_id) for job_id in batch_job._acc_state["child_jobs"]]

        assert len(batch_job.children) == len(reg_child_jobs)
        assert len(batch_job._acc_state["child_jobs"]) == len(new_child_ids)

        with mock.patch.object(MockClients, "check_job", side_effect=mock_check_job) as m:
            assert len(batch_job.child_jobs) == len(new_child_ids)

    def test_modify_job_refresh(self):
        for job_id, refreshing in REFRESH_STATE.items():
            assert self.jm._running_jobs[job_id]["refresh"] == refreshing
            self.jm.modify_job_refresh([job_id], False)  # stop
            assert self.jm._running_jobs[job_id]["refresh"] is False
            self.jm.modify_job_refresh([job_id], False)  # stop harder
            assert self.jm._running_jobs[job_id]["refresh"] is False
            self.jm.modify_job_refresh([job_id], True)  # start
            assert self.jm._running_jobs[job_id]["refresh"] is True
            self.jm.modify_job_refresh([job_id], True)  # start some more
            assert self.jm._running_jobs[job_id]["refresh"] is True
            self.jm.modify_job_refresh([job_id], False)  # stop
            assert self.jm._running_jobs[job_id]["refresh"] is False

    @mock.patch(CLIENTS, get_mock_client)
    def test_get_job_info(self):
        infos = self.jm.get_job_info(ALL_JOBS)
        assert len(ALL_JOBS) == len(infos.keys())
        assert infos == {
            job_id: ALL_RESPONSE_DATA[MESSAGE_TYPE["INFO"]][job_id] for job_id in ALL_JOBS
        }


if __name__ == "__main__":
    unittest.main()
