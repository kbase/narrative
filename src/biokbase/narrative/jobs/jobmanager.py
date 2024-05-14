import copy
from datetime import UTC, datetime, timedelta
from typing import Any

from biokbase.narrative import clients
from biokbase.narrative.common import kblogging
from biokbase.narrative.exception_util import (
    JobRequestException,
    transform_job_exception,
)
from biokbase.narrative.system import system_variable
from IPython.display import HTML
from jinja2 import Template

from .job import JOB_INIT_EXCLUDED_JOB_STATE_FIELDS, Job

"""
KBase Job Manager

The main class here defines a manager for running jobs (as Job objects).
This class knows how to fetch job status, kill jobs, etc.
It also communicates with the front end over the KBaseJobs channel.

This is a singleton - instantiating a new JobManager will return the existing
instance in its current state.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"
__version__ = "0.0.1"

JOB_NOT_REG_ERR = "Job ID is not registered"
JOB_NOT_REG_2_ERR = "Cannot find job with ID %s"  # TODO unify these
JOB_NOT_BATCH_ERR = "Job ID is not for a batch job"

JOBS_TYPE_ERR = "List expected for job_id_list"
JOBS_MISSING_ERR = "No valid job IDs provided"

CELLS_NOT_PROVIDED_ERR = "cell_id_list not provided"


class JobManager:
    """The KBase Job Manager class. This handles all jobs and makes their status available.
    It sends the results to the KBaseJobs channel that the front end
    listens to.
    """

    __instance = None

    # keys: job_id, values: { refresh = 1/0, job = Job object }
    _running_jobs = {}
    # keys: cell_id, values: set(job_1_id, job_2_id, job_3_id)
    _jobs_by_cell_id = {}

    _log = kblogging.get_logger(__name__)

    def __new__(cls) -> "JobManager":
        if JobManager.__instance is None:
            JobManager.__instance = object.__new__(cls)
        return JobManager.__instance

    @staticmethod
    def _reorder_parents_children(states: dict[str, Any]) -> dict[str, Any]:
        ordering = []
        for job_id, state in states.items():
            if state.get("batch_job"):
                ordering.append(job_id)
            else:
                ordering.insert(0, job_id)
        return {job_id: states[job_id] for job_id in ordering}

    def _check_job_list(
        self: "JobManager", input_ids: list[str] | None = None
    ) -> tuple[list[str], list[str]]:
        """Deduplicates the input job list, maintaining insertion order.
        Any jobs not present in self._running_jobs are added to an error list

        :param input_ids: list of putative job IDs, defaults to []
        :type input_ids: list[str], optional

        :raises JobRequestException: if the input_ids parameter is not a list or
        or if there are no valid job IDs supplied

        :return: tuple with items
            job_ids - valid job IDs
            error_ids - jobs that the narrative backend does not know about
        :rtype: tuple[list[str], list[str]]
        """
        if not input_ids:
            raise JobRequestException(JOBS_MISSING_ERR, input_ids)

        if not isinstance(input_ids, list):
            raise JobRequestException(f"{JOBS_TYPE_ERR}: {input_ids}")

        job_ids = []
        error_ids = []
        for input_id in input_ids:
            if input_id and input_id not in job_ids + error_ids:
                if input_id in self._running_jobs:
                    job_ids.append(input_id)
                else:
                    error_ids.append(input_id)

        if not len(job_ids) + len(error_ids):
            raise JobRequestException(JOBS_MISSING_ERR, input_ids)

        return job_ids, error_ids

    def register_new_job(self: "JobManager", job: Job, refresh: bool | None = None) -> None:
        """Registers a new Job with the manager and stores the job locally.
        This should only be invoked when a new Job gets started.

        :param job: a Job object for the new job that was started
        :type job: Job
        :param refresh: whether or not the job should be refreshed, defaults to None
        :type refresh: bool, optional
        """
        kblogging.log_event(self._log, "register_new_job", {"job_id": job.job_id})

        if refresh is None:
            refresh = not job.in_terminal_state()
        self._running_jobs[job.job_id] = {"job": job, "refresh": refresh}

        # add the new job to the _jobs_by_cell_id mapping if there is a cell_id present
        if job.cell_id:
            if job.cell_id not in self._jobs_by_cell_id:
                self._jobs_by_cell_id[job.cell_id] = set()

            self._jobs_by_cell_id[job.cell_id].add(job.job_id)
            if job.batch_id:
                self._jobs_by_cell_id[job.cell_id].add(job.batch_id)

    def initialize_jobs(self: "JobManager", cell_ids: list[str] | None = None) -> None:
        """Initializes this JobManager.
        This is expected to be run by a running Narrative, and naturally linked to a workspace.
        It runs the following steps:
        1. gets the current workspace ID from app_util.system_variable('workspace_id')
        2. get job state data on all jobs with that ws id from ee2
        3. initialize the Job objects and add them to the running jobs list
        4. start the status lookup loop.

        :param cell_ids: list of cell IDs to filter the existing jobs for, defaults to None
        :type cell_ids: list[str], optional

        :raises NarrativeException: if the call to ee2 fails
        """
        ws_id = system_variable("workspace_id")
        job_states = {}
        kblogging.log_event(self._log, "JobManager.initialize_jobs", {"ws_id": ws_id})
        try:
            job_states = clients.get("execution_engine2").check_workspace_jobs(
                {
                    "workspace_id": ws_id,
                    "return_list": 0,
                    "exclude_fields": JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
                }
            )
        except Exception as e:
            kblogging.log_event(self._log, "init_error", {"err": str(e)})
            new_e = transform_job_exception(e, "Unable to initialize jobs")
            raise new_e from e

        self._running_jobs = {}
        job_states: dict[str, Any] = self._reorder_parents_children(job_states)
        for job_state in job_states.values():
            child_jobs = None
            if job_state.get("batch_job"):
                child_jobs = [
                    self.get_job(child_id) for child_id in job_state.get("child_jobs", [])
                ]

            job = Job(job_state, children=child_jobs)

            # Set to refresh when job is not in terminal state
            # and when job is present in cells (if given)
            # and when it is not part of a batch
            refresh = not job.in_terminal_state() and not job.batch_id
            if cell_ids is not None:
                refresh = refresh and job.in_cells(cell_ids)

            self.register_new_job(job, refresh)

    def _create_jobs(self: "JobManager", job_ids: list[str]) -> dict[str, Any]:
        """Given a list of job IDs, creates job objects for them and populates the _running_jobs dictionary.
        TODO: error handling

        :param job_ids: job IDs to create job objects for
        :type job_ids: list[str]

        :return: dictionary of job states indexed by job ID
        :rtype: dict
        """
        job_ids = [job_id for job_id in job_ids if job_id not in self._running_jobs]
        if not job_ids:
            return {}

        job_states = Job.query_ee2_states(job_ids, init=True)
        for job_state in job_states.values():
            # do not set new jobs to be automatically refreshed - if the front end wants them
            # refreshed, it'll make a request.
            self.register_new_job(job=Job(job_state), refresh=False)

        return job_states

    def get_job(self: "JobManager", job_id: str) -> Job:
        """Retrieve a job from the Job Manager's _running_jobs index.

        :param job_id: the job ID to be retrieved
        :type job_id: str

        :raises JobRequestException: if the job cannot be found

        :return: Job object corresponding to that job ID
        :rtype: Job
        """
        if job_id not in self._running_jobs:
            raise JobRequestException(JOB_NOT_REG_ERR, job_id)
        return self._running_jobs[job_id]["job"]

    def _construct_job_output_state_set(
        self: "JobManager", job_ids: list[str], states: dict[str, Any] | None = None
    ) -> dict[str, dict[str, Any]]:
        """Builds a set of job states for the list of job ids.

        Precondition: job_ids already validated

        The job output state for a given job ID is generated by job.output_state() and
        has the basic form:
        {
            "job_id_0": {  # dict generated by job.output_state()
                "job_id": "job_id_0":
                "jobState": {  # modified job state from EE2
                    ...
                },
                "outputWidgetInfo": {
                    ...
                }
            },
            "job_id_1": {  # dict generated by job.output_state()
                "job_id": "job_id_1":
                "jobState": {  # modified job state from EE2
                    ...
                },
                "outputWidgetInfo": None
            },
            ...,
            "job_id_2": {  # dict generated by job.output_state() with EE2 error message added
                "job_id": "job_id_2",
                "jobState": {  # modified job state from EE2
                    ...
                },
                "outputWidgetInfo": ...,
                "error": <EE2 error message>
            },
            ...
        }

        :param job_ids: list of job IDs
        :type job_ids: list[str]
        :param states: dict of job state data from EE2, indexed by job ID, defaults to None
        :type states: dict, optional

        :raises JobRequestException: if job_ids is not a list

        :return: dict containing the output_state for each job, indexed by job ID.
        :rtype: dict
        """
        if not isinstance(job_ids, list):
            raise JobRequestException("job_ids must be a list")

        if not job_ids:
            return {}

        # ensure states is initialised
        if not states:
            states = {}
        output_states = {}
        jobs_to_lookup = []

        # Fetch from cache of terminated jobs, where available.
        # These are already post-processed and ready to return.
        for job_id in job_ids:
            job = self.get_job(job_id)
            if job.in_terminal_state():
                # job is already finished, will not change
                output_states[job_id] = job.output_state()
            elif job_id in states:
                job.update_state(states[job_id])
                output_states[job_id] = job.output_state()
            else:
                jobs_to_lookup.append(job_id)

        fetched_states = {}
        # Get the rest of states direct from EE2.
        if jobs_to_lookup:
            error_message = ""
            try:
                fetched_states = Job.query_ee2_states(jobs_to_lookup, init=False)
            except Exception as e:
                error_message = str(e)
                kblogging.log_event(
                    self._log,
                    "_construct_job_output_state_set",
                    {"exception": error_message},
                )

            # fill in the output states for the missing jobs
            # if the job fetch failed, add an error message to the output
            # and return the cached job state
            for job_id in jobs_to_lookup:
                job = self.get_job(job_id)
                if job_id in fetched_states:
                    job.update_state(fetched_states[job_id])
                    output_states[job_id] = job.output_state()
                else:
                    # fetch the current state without updating it
                    output_states[job_id] = job.output_state()
                    # add an error field with the error message from the failed look up
                    output_states[job_id]["error"] = error_message

        return output_states

    def get_job_states(self: "JobManager", job_ids: list[str], ts: int | None = None) -> dict:
        """Retrieves the job states for the supplied job_ids.

        Jobs that cannot be found in the `_running_jobs` index will return
        {
            "job_id": string,
            "error": "Cannot find job with ID <job_id>"
        }

        :param job_ids: job IDs to retrieve job state data for
        :type job_ids: list[str]
        :param ts: timestamp (as generated by time.time_ns()) to filter the jobs, defaults to None
        :type ts: int, optional

        :return: dictionary of job states, indexed by job ID
        :rtype: dict
        """
        job_ids, error_ids = self._check_job_list(job_ids)
        output_states = self._construct_job_output_state_set(job_ids)
        return self.add_errors_to_results(output_states, error_ids)

    def get_all_job_states(self: "JobManager", ignore_refresh_flag: bool = False) -> dict[str, Any]:
        """Fetches states for all running jobs.
        If ignore_refresh_flag is True, then returns states for all jobs this
        JobManager knows about (i.e. all jobs associated with the workspace).

        :param ignore_refresh_flag: if True, ignore the refresh state of the job -- return the state
        regardless of whether the job is stopped or completed. Defaults to False.
        :type ignore_refresh_flag: bool, optional

        :return: dictionary of job states, indexed by job ID
        :rtype: dict
        """
        # grab the list of running job ids, so we don't run into update-while-iterating problems.
        jobs_to_lookup = [
            job_id
            for job_id in self._running_jobs
            if self._running_jobs[job_id]["refresh"] or ignore_refresh_flag
        ]

        if jobs_to_lookup:
            return self._construct_job_output_state_set(jobs_to_lookup)
        return {}

    def _get_job_ids_by_cell_id(self: "JobManager", cell_id_list: list[str] | None = None) -> tuple:
        """Finds jobs with a cell_id in cell_id_list.
        Mappings of job ID to cell ID are added when new jobs are registered.

        :param cell_id_list: cell IDs to retrieve job state data for
        :type cell_id_list: list[str]

        :return: tuple with two components:
            job_id_list: list of job IDs associated with the cell IDs supplied
            cell_to_job_mapping: mapping of cell IDs to the list of job IDs associated with the cell
        :rtype: tuple
        """
        if not cell_id_list:
            raise JobRequestException(CELLS_NOT_PROVIDED_ERR)

        cell_to_job_mapping = {
            cell_id: (self._jobs_by_cell_id[cell_id] if cell_id in self._jobs_by_cell_id else set())
            for cell_id in cell_id_list
        }
        # union of all the job_ids in the cell_to_job_mapping
        job_id_list = set().union(*cell_to_job_mapping.values())
        return (job_id_list, cell_to_job_mapping)

    def get_job_states_by_cell_id(
        self: "JobManager", cell_id_list: list[str] | None = None
    ) -> dict[str, Any]:
        """Retrieves the job states for jobs associated with the cell_id_list supplied.

        :param cell_id_list: cell IDs to retrieve job state data for
        :type cell_id_list: list[str]

        :return: dictionary with two keys:
            'jobs': job states, indexed by job ID
            'mapping': mapping of cell IDs to the list of job IDs associated with the cell
        :rtype: dict
        """
        (jobs_to_lookup, cell_to_job_mapping) = self._get_job_ids_by_cell_id(cell_id_list)
        job_states = {}
        if len(jobs_to_lookup) > 0:
            job_states = self._construct_job_output_state_set(list(jobs_to_lookup))

        return {"jobs": job_states, "mapping": cell_to_job_mapping}

    def get_job_info(self: "JobManager", job_ids: list[str]) -> dict[str, Any]:
        """Gets job information for a list of job IDs.

        Job info for a given job ID is in the form:
        {
            "app_id": string in the form "<module>/<name>",
            "app_name": string,
            "job_id": string,
            "job_params": dictionary,
            "batch_id": string | None,
        }

        Jobs that cannot be found in the `_running_jobs` index will return
        {
            "job_id": string,
            "error": "Cannot find job with ID <job_id>"
        }

        :param job_ids: job IDs to retrieve job info for
        :type job_ids: list[str]
        :return: job info for each job, indexed by job ID
        :rtype: dict
        """
        job_ids, error_ids = self._check_job_list(job_ids)

        infos = {}
        for job_id in job_ids:
            job = self.get_job(job_id)
            infos[job_id] = {
                "app_id": job.app_id,
                "app_name": job.app_name,
                "batch_id": job.batch_id,
                "job_id": job_id,
                "job_params": job.params,
            }
        return self.add_errors_to_results(infos, error_ids)

    def get_job_logs(
        self: "JobManager",
        job_id: str,
        first_line: int = 0,
        num_lines: int | None = None,
        latest: bool = False,
    ) -> dict[str, Any]:
        """Retrieves job logs for the job ID supplied.

        Jobs logs for a given job ID are in the form:
        {
            "job_id":     string,
            "batch_id":   string | None,
            "first":      int - the first line returned,
            "latest":     bool - whether the latest lines were returned,
            "max_lines":  int - the number of logs lines currently available for that job,
            "lines":      list - the lines themselves, fresh from the server; these are dicts in the form
                "line" - the log line string
                "is_error" - either 0 or 1
        }

        If there is an error when retrieving logs (e.g. the job has yet to start or
        it is a batch job and does not generate logs), the return structure will be:
        {
            "job_id":     string
            "batch_id":   string | None
            "error":      string - error message
        }

        :param job_id: the job id from the execution engine
        :type job_id: str
        :param first_line: the first line to be requested by the log. 0-indexed. If < 0,
            this will be set to 0
        :type first_line: int, defaults to 0
        :param num_lines: int - the maximum number of lines to return.
            if < 0, will be reset to 0.
            if None, then will not be considered, and just return all the lines.
        :type num_lines: int, defaults to None.
        :param latest: if True, will only return the most recent num_lines
            of logs. If set to True, overrides the first_line parameter; e.g. for the call

            get_job_logs(id, first_line=0, num_lines=5, latest=True)

            if there are 100 log lines available, then lines 96-100 will be returned.
        :type latest: boolean, defaults to False.

        :return: job log data for each job, indexed by job ID
        :rtype: dict
        """
        job = self.get_job(job_id)

        if first_line < 0:
            first_line = 0
        if num_lines is not None and num_lines < 0:
            num_lines = 0

        try:
            if latest:
                (max_lines, logs) = job.log()
                if num_lines is None or max_lines <= num_lines:
                    first_line = 0
                else:
                    first_line = max_lines - num_lines
                    logs = logs[first_line:]
            else:
                (max_lines, logs) = job.log(first_line=first_line, num_lines=num_lines)
        except Exception as e:
            return {
                "job_id": job.job_id,
                "batch_id": job.batch_id,
                "error": e.message,
            }
        else:
            return {
                "job_id": job.job_id,
                "batch_id": job.batch_id,
                "first": first_line,
                "latest": latest,
                "max_lines": max_lines,
                "lines": logs,
            }

    def get_job_logs_for_list(
        self: "JobManager",
        job_id_list: list[str],
        first_line: int = 0,
        num_lines: int | None = None,
        latest: bool = False,
    ) -> dict[str, Any]:
        """Fetch the logs for a list of jobs. Note that the parameters supplied are applied to all jobs.

        Jobs that cannot be found in the `_running_jobs` index will return
        {
            "job_id": string,
            "error": "Cannot find job with ID <job_id>"
        }

        :param job_id_list: list of jobs to fetch logs for
        :type job_id_list: list[str]
        :param first_line: the first line to be returned, defaults to 0
        :type first_line: int, optional
        :param num_lines: number of lines to be returned, defaults to None
        :type num_lines: int, optional
        :param latest: whether to return the latest log lines; only relevant if num_lines is set. Defaults to False
        :type latest: bool, optional

        :return: job log data indexed by job ID; see get_job_logs for details
        :rtype: dict
        """
        job_ids, error_ids = self._check_job_list(job_id_list)

        output = {}
        for job_id in job_ids:
            output[job_id] = self.get_job_logs(job_id, first_line, num_lines, latest)

        return self.add_errors_to_results(output, error_ids)

    def cancel_jobs(self: "JobManager", job_id_list: list[str]) -> dict[str, Any]:
        """Cancel a list of jobs and return their new state. After sending the cancellation
        request, the job states are refreshed and their new output states returned.

        Jobs that trigger an error when cancelled will return
        {
            "job_id": string,
            "error": <error message from attempted cancellation>
        }

        Jobs that cannot be found in the `_running_jobs` index will return
        {
            "job_id": string,
            "error": "Cannot find job with ID <job_id>"
        }

        :param job_id_list: job IDs to cancel
        :type job_id_list: list[str]

        :return: job output states, indexed by job ID
        :rtype: dict
        """
        job_ids, error_ids = self._check_job_list(job_id_list)
        error_states = {}
        for job_id in job_ids:
            if not self.get_job(job_id).in_terminal_state():
                error = self._cancel_job(job_id)
                if error:
                    error_states[job_id] = error.message

        job_states = self._construct_job_output_state_set(job_ids)

        for job_id in error_states:
            job_states[job_id]["error"] = error_states[job_id]

        return self.add_errors_to_results(job_states, error_ids)

    def _cancel_job(self: "JobManager", job_id: str) -> Exception | None:
        """Cancel a single job. If an error occurs during cancellation, that error is converted
        into a NarrativeException and returned to the caller.

        :param job_id: job ID to be cancelled
        :type job_id: str
        :return: if present, the exception raised when trying to cancel the job
        :rtype: NarrativeException | None
        """
        # Stop updating the job status while we try to cancel.
        # Set the job to a special state of 'canceling' while we're doing the cancel
        is_refreshing = self._running_jobs[job_id].get("refresh", False)
        self._running_jobs[job_id]["refresh"] = False
        self._running_jobs[job_id]["canceling"] = True
        error = None
        try:
            clients.get("execution_engine2").cancel_job({"job_id": job_id})
        except Exception as e:
            error = transform_job_exception(e, "Unable to cancel job")

        self._running_jobs[job_id]["refresh"] = is_refreshing
        del self._running_jobs[job_id]["canceling"]
        return error

    def retry_jobs(self: "JobManager", job_id_list: list[str]) -> dict[str, Any]:
        """Retry a list of job IDs, returning job output states for the jobs to be retried
        and the new jobs created by the retry command.

        Retry data for a given job ID is in the form:
        {
            "job_id": "job_id_1",
            "job": { # i.e. a job.output_state() object
                "jobState": {"job_id": "job_id_1", "status": status, ...}
                ...
            },
            "retry_id": "retry_id_1",
            "retry": { # i.e. a job.output_state() object
                "jobState": {"job_id": "retry_id_1", "status": status, ...}
                ...
            }
        }

        If the job cannot be retried (e.g. it is a batch job or the user doesn't have permissions),
        the error message from ee2 will be returned:
        {
            "job_id": string,
            "job": { "jobState": { ... }, ... },
            "error": "Cannot retry a batch parent job", # from ee2
        }

        Jobs that cannot be found in the `_running_jobs` index will return
        {
            "job_id": string,
            "error": "Cannot find job with ID <job_id>"
        }

        :param job_id_list: list of job IDs
        :type job_id_list: list[str]

        :raises NarrativeException: if EE2 returns an error from the retry request

        :return: job retry data indexed by job ID
        :rtype: dict
        """
        job_ids, error_ids = self._check_job_list(job_id_list)
        try:
            retry_results: list[dict[str, Any]] = clients.get("execution_engine2").retry_jobs(
                {"job_ids": job_ids}
            )
        except Exception as e:
            raise transform_job_exception(e, "Unable to retry job(s)") from e

        # for each retry result, refresh the state of the retried and new jobs
        orig_ids = [result["job_id"] for result in retry_results]
        retry_ids = [result["retry_id"] for result in retry_results if "retry_id" in result]
        orig_states = self._construct_job_output_state_set(orig_ids)
        retry_states = self._construct_job_output_state_set(
            retry_ids,
            self._create_jobs(retry_ids),  # add to self._running_jobs index
        )

        results_by_job_id = {}
        # fill in the job state details
        for result in retry_results:
            job_id = result["job_id"]
            results_by_job_id[job_id] = {"job_id": job_id, "job": orig_states[job_id]}
            if "retry_id" in result:
                retry_id = result["retry_id"]
                results_by_job_id[job_id].update(
                    {"retry_id": retry_id, "retry": retry_states[retry_id]}
                )
            if "error" in result:
                results_by_job_id[job_id]["error"] = result["error"]
        return self.add_errors_to_results(results_by_job_id, error_ids)

    def add_errors_to_results(
        self: "JobManager", results: dict, error_ids: list[str]
    ) -> dict[str, Any]:
        """Add the generic "not found" error for each job_id in error_ids.

        :param results: dictionary of job data (output state, info, retry, etc.) indexed by job ID
        :type results: dict
        :param error_ids: list of IDs that could not be found
        :type error_ids: list[str]

        :return: input results dictionary augmented by a dictionary containing job ID and a short
        not found error message for every ID in the error_ids list
        :rtype: dict
        """
        for error_id in error_ids:
            results[error_id] = {
                "job_id": error_id,
                "error": JOB_NOT_REG_2_ERR % error_id,
            }
        return results

    def modify_job_refresh(self: "JobManager", job_ids: list[str], update_refresh: bool) -> None:
        """Modifies how many things want to get the job updated.
        If this sets the current "refresh" key to be less than 0, it gets reset to 0.
        Jobs that are not present in the _running_jobs dictionary are ignored.
        """
        job_ids, _ = self._check_job_list(job_ids)

        for job_id in job_ids:
            self._running_jobs[job_id]["refresh"] = update_refresh

    def update_batch_job(self: "JobManager", batch_id: str) -> list[str]:
        """Update a batch job and create child jobs if necessary"""
        batch_job = self.get_job(batch_id)
        if not batch_job.batch_job:
            raise JobRequestException(JOB_NOT_BATCH_ERR, batch_id)

        child_ids = batch_job.child_jobs

        reg_child_jobs = []
        unreg_child_ids = []
        for job_id in child_ids:
            if job_id in self._running_jobs:
                reg_child_jobs.append(self.get_job(job_id))
            else:
                unreg_child_ids.append(job_id)

        unreg_child_jobs: list[Job] = []
        if unreg_child_ids:
            unreg_child_jobs = Job.from_job_ids(unreg_child_ids)
            for job in unreg_child_jobs:
                self.register_new_job(
                    job=job,
                    refresh=not job.in_terminal_state(),
                )

        batch_job.update_children(reg_child_jobs + unreg_child_jobs)

        return [batch_id] + child_ids

    def list_jobs(self: "JobManager") -> HTML | str:
        """List all job ids, their info, and status in a quick HTML format."""
        try:
            all_states = self.get_all_job_states(ignore_refresh_flag=True)
            state_list = [copy.deepcopy(s["jobState"]) for s in all_states.values()]

            if not state_list:
                return "No running jobs!"

            state_list = sorted(state_list, key=lambda s: s.get("created", 0))
            for state in state_list:
                job = self.get_job(state["job_id"])
                state["created"] = datetime.fromtimestamp(state["created"] / 1000.0).strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                state["run_time"] = "Not started"
                state["user"] = job.user
                state["app_id"] = job.app_id
                state["batch_id"] = job.batch_id
                exec_start = state.get("running")

                if state.get("finished"):
                    finished_time = datetime.fromtimestamp(state.get("finished") / 1000.0)
                    state["finish_time"] = finished_time.strftime("%Y-%m-%d %H:%M:%S")
                    if exec_start:
                        exec_start_time = datetime.fromtimestamp(exec_start / 1000.0)
                        delta = finished_time - exec_start_time
                        delta = delta - timedelta(microseconds=delta.microseconds)
                        state["run_time"] = str(delta)
                elif exec_start:
                    exec_start_time = datetime.fromtimestamp(exec_start / 1000.0).replace(
                        tzinfo=UTC
                    )
                    delta = datetime.now(UTC) - exec_start_time
                    delta = delta - timedelta(microseconds=delta.microseconds)
                    state["run_time"] = str(delta)

            tmpl = """
            <table class="table table-bordered table-striped table-condensed">
                <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Submitted</th>
                    <th>Batch ID</th>
                    <th>Submitted By</th>
                    <th>Status</th>
                    <th>Run Time</th>
                    <th>Complete Time</th>
                </tr>
                {% for j in jobs %}
                <tr>
                    <td class="job_id">{{ j.job_id|e }}</td>
                    <td class="app_id">{{ j.app_id|e }}</td>
                    <td class="created">{{ j.created|e }}</td>
                    <td class="batch_id">{{ j.batch_id|e }}</td>
                    <td class="user">{{ j.user|e }}</td>
                    <td class="status">{{ j.status|e }}</td>
                    <td class="run_time">{{ j.run_time|e }}</td>
                    <td class="finish_time">{% if j.finish_time %}{{ j.finish_time|e }}{% else %}Incomplete{% endif %}</td>
                </tr>
                {% endfor %}
            </table>
            """
            return HTML(Template(tmpl).render(jobs=state_list))

        except Exception as e:
            kblogging.log_event(self._log, "list_jobs.error", {"err": str(e)})
            raise
