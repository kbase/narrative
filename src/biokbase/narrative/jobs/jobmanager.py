from IPython.display import HTML
from jinja2 import Template
from datetime import datetime, timezone, timedelta
import copy
import time
from typing import List, Tuple
import biokbase.narrative.clients as clients
from .job import (
    Job,
    EXCLUDED_JOB_STATE_FIELDS,
    JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
)
from biokbase.narrative.common import kblogging
from biokbase.narrative.app_util import system_variable
from biokbase.narrative.exception_util import (
    transform_job_exception,
    JobRequestException,
)

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
JOB_NOT_BATCH_ERR = "Job ID is not for a batch job"

JOBS_TYPE_ERR = "List expected for job_id_list"
JOBS_MISSING_ERR = "No valid job IDs provided"

CELLS_NOT_PROVIDED_ERR = "cell_id_list not provided"
DOES_NOT_EXIST = "does_not_exist"


def get_error_output_state(job_id, error=DOES_NOT_EXIST):
    if error not in [DOES_NOT_EXIST, "ee2_error"]:
        raise ValueError(f"Unknown error type: {error}")
    return {"jobState": {"job_id": job_id, "status": error}}


class JobManager(object):
    """
    The KBase Job Manager class. This handles all jobs and makes their status available.
    On status lookups, it feeds the results to the KBaseJobs channel that the front end
    listens to.
    """

    __instance = None

    # keys: job_id, values: { refresh = 1/0, job = Job object }
    _running_jobs = dict()
    # keys: cell_id, values: set(job_1_id, job_2_id, job_3_id)
    _jobs_by_cell_id = dict()

    _log = kblogging.get_logger(__name__)

    def __new__(cls):
        if JobManager.__instance is None:
            JobManager.__instance = object.__new__(cls)
        return JobManager.__instance

    @staticmethod
    def _reorder_parents_children(states: dict) -> dict:
        ordering = []
        for job_id, state in states.items():
            if state.get("batch_job"):
                ordering.append(job_id)
            else:
                ordering.insert(0, job_id)
        states = {job_id: states[job_id] for job_id in ordering}

        return states

    def register_new_job(self, job: Job, refresh: int = None) -> None:
        """
        Registers a new Job with the manager and stores the job locally.
        This should only be invoked when a new Job gets started.

        Parameters:
        -----------
        job : biokbase.narrative.jobs.job.Job object
            The new Job that was started.
        """
        kblogging.log_event(self._log, "register_new_job", {"job_id": job.job_id})

        if refresh is None:
            refresh = int(not job.was_terminal())
        self._running_jobs[job.job_id] = {"job": job, "refresh": refresh}

        # add the new job to the _jobs_by_cell_id mapping if there is a cell_id present
        if job.cell_id:
            if job.cell_id not in self._jobs_by_cell_id.keys():
                self._jobs_by_cell_id[job.cell_id] = set()

            self._jobs_by_cell_id[job.cell_id].add(job.job_id)
            if job.batch_id:
                self._jobs_by_cell_id[job.cell_id].add(job.batch_id)

    def initialize_jobs(self, cell_ids: List[str] = None) -> None:
        """
        Initializes this JobManager.
        This is expected to be run by a running Narrative, and naturally linked to a workspace.
        So it does the following steps.
        1. gets the current workspace ID from app_util.system_variable('workspace_id')
        2. get list of jobs with that ws id from ee2 (also gets tag, cell_id, run_id)
        3. initialize the Job objects and add them to the running jobs list
        4. start the status lookup loop.
        """
        ws_id = system_variable("workspace_id")
        job_states = dict()
        kblogging.log_event(self._log, "JobManager.initialize_jobs", {"ws_id": ws_id})
        try:
            job_states = clients.get("execution_engine2").check_workspace_jobs(
                {
                    "workspace_id": ws_id,
                    "return_list": 0,  # do not remove
                    "exclude_fields": JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
                }
            )
        except Exception as e:
            kblogging.log_event(self._log, "init_error", {"err": str(e)})
            new_e = transform_job_exception(e, "Unable to initialize jobs")
            raise new_e

        self._running_jobs = dict()
        job_states = self._reorder_parents_children(job_states)
        for job_state in job_states.values():
            child_jobs = None
            if job_state.get("batch_job"):
                child_jobs = [
                    self.get_job(child_id)
                    for child_id in job_state.get("child_jobs", [])
                ]

            job = Job(job_state, children=child_jobs)

            # Set to refresh when job is not in terminal state
            # and when job is present in cells (if given)
            refresh = not job.was_terminal()
            if cell_ids is not None:
                refresh = refresh and job.in_cells(cell_ids)

            self.register_new_job(job, int(refresh))

    def get_job(self, job_id):
        """
        Returns a Job with the given job_id.
        Raises a JobRequestException if not found.
        """
        if job_id not in self._running_jobs:
            raise JobRequestException(JOB_NOT_REG_ERR, job_id)
        return self._running_jobs[job_id]["job"]

    def _create_jobs(self, job_ids) -> dict:
        """
        TODO: error handling
        Given a list of job IDs, creates job objects for them and populates the _running_jobs dictionary
        """
        job_ids = [job_id for job_id in job_ids if job_id not in self._running_jobs]
        if not len(job_ids):
            return {}

        job_states = clients.get("execution_engine2").check_jobs(
            {
                "job_ids": job_ids,
                "exclude_fields": JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
                "return_list": 0,
            }
        )
        for job_state in job_states.values():
            # set new jobs to be automatically refreshed
            self.register_new_job(job=Job(job_state), refresh=1)

        return job_states

    def _check_job_list(self, input_ids: List[str] = []) -> Tuple[List[str], List[str]]:
        """
        Deduplicates the input job list, maintaining insertion order
        Any jobs not present in self._running_jobs are added to an error list

        :param input_ids: a list of putative job IDs
        :return results: tuple with items "job_ids", containing valid IDs;
        and "error_ids", for jobs that the narrative backend does not know about
        """
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

    def _construct_job_output_state_set(
        self, job_ids: List[str], states: dict = None
    ) -> dict:
        """
        Builds a set of job states for the list of job ids.
        :param job_ids: list of job IDs (may be empty)
        :param states: dict, where each value is a state is from EE2
        """
        if not isinstance(job_ids, list):
            raise JobRequestException("job_ids must be a list")

        if not len(job_ids):
            return {}

        output_states = dict()
        jobs_to_lookup = list()

        # Fetch from cache of terminated jobs, where available.
        # These are already post-processed and ready to return.
        for job_id in job_ids:
            job = self.get_job(job_id)
            if job.was_terminal():
                output_states[job_id] = job.output_state()
            elif states and job_id in states:
                state = states[job_id]
                output_states[job_id] = job.output_state(state)
            else:
                jobs_to_lookup.append(job_id)

        fetched_states = dict()
        # Get the rest of states direct from EE2.
        if len(jobs_to_lookup):
            try:
                fetched_states = clients.get("execution_engine2").check_jobs(
                    {
                        "job_ids": jobs_to_lookup,
                        "exclude_fields": EXCLUDED_JOB_STATE_FIELDS,
                        "return_list": 0,
                    }
                )
            except Exception as e:
                kblogging.log_event(
                    self._log, "_construct_job_output_state_set", {"exception": str(e)}
                )

            # fill in the output states for the missing jobs
            # if the job fetch failed, set the job status to "ee2_error"
            # without altering the cached job data
            for job_id in jobs_to_lookup:
                job = self.get_job(job_id)
                if job_id in fetched_states:
                    output_states[job_id] = job.output_state(fetched_states[job_id])
                else:
                    # fetch the current state without updating it
                    output_states[job_id] = job.output_state({})
                    # set the status to 'ee2_error' and the 'updated' timestamp to now
                    output_states[job_id]["jobState"]["status"] = "ee2_error"
                    output_states[job_id]["jobState"]["updated"] = int(time.time())

        return output_states

    def lookup_job_info(self, job_ids: List[str]) -> dict:
        """
        Sends the info over the comm channel as these packets:
        {
            app_id: module/name,
            app_name: random string,
            job_id: string,
            job_params: dictionary,
            batch_id: string,
        }
        Will set packet to DOES_NOT_EXIST if job_id doesn't exist.
        """
        job_ids, error_ids = self._check_job_list(job_ids)

        infos = dict()
        for job_id in job_ids:
            job = self.get_job(job_id)
            infos[job_id] = {
                "app_id": job.app_id,
                "app_name": job.app_name,
                "batch_id": job.batch_id,
                "job_id": job_id,
                "job_params": job.params,
            }
        for error_id in error_ids:
            infos[error_id] = {
                "job_id": error_id,
                "error": DOES_NOT_EXIST,
            }
        return infos

    def _get_job_ids_by_cell_id(self, cell_id_list: List[str] = None) -> tuple:
        """
        Finds jobs with a cell_id in cell_id_list
        Mappings of job ID to cell ID are added when new jobs are registered
        Returns a list of job IDs and a mapping of cell IDs to the list of
        job IDs associated with the cell.
        """
        if not cell_id_list:
            raise JobRequestException(CELLS_NOT_PROVIDED_ERR)

        cell_to_job_mapping = {
            id: self._jobs_by_cell_id[id] if id in self._jobs_by_cell_id else set()
            for id in cell_id_list
        }
        # union of all the job_ids in the cell_to_job_mapping
        job_id_list = set().union(*cell_to_job_mapping.values())
        return (job_id_list, cell_to_job_mapping)

    def lookup_job_states_by_cell_id(self, cell_id_list: List[str] = None) -> dict:
        """
        Fetch job states for jobs with a cell_id in cell_id_list
        Returns a dictionary of job states keyed by job ID and a mapping of
        cell IDs to the list of job IDs associated with the cell.
        """
        (jobs_to_lookup, cell_to_job_mapping) = self._get_job_ids_by_cell_id(
            cell_id_list
        )
        job_states = {}
        if len(jobs_to_lookup) > 0:
            job_states = self._construct_job_output_state_set(list(jobs_to_lookup))

        return {"jobs": job_states, "mapping": cell_to_job_mapping}

    def lookup_all_job_states(self, ignore_refresh_flag=False) -> dict:
        """
        Fetches states for all running jobs.
        If ignore_refresh_flag is True, then returns states for all jobs this
        JobManager knows about (i.e. all jobs associated with the workspace).

        This returns them all as a dictionary, keyed on the job id.
        :param ignore_refresh_flag: boolean - if True, ignore the usual refresh state of the job.
            Even if the job is stopped, or completed, fetch and return its state from the service.
        """
        jobs_to_lookup = list()

        # grab the list of running job ids, so we don't run into update-while-iterating problems.
        for job_id in self._running_jobs.keys():
            if self._running_jobs[job_id]["refresh"] > 0 or ignore_refresh_flag:
                jobs_to_lookup.append(job_id)
        if len(jobs_to_lookup) > 0:
            return self._construct_job_output_state_set(jobs_to_lookup)
        return dict()

    def get_job_logs(
        self,
        job_id: str,
        first_line: int = 0,
        num_lines: int = None,
        latest: bool = False,
    ) -> dict:
        """
        :param job_id: str - the job id from the execution engine
        :param first_line: int - the first line to be requested by the log. 0-indexed. If < 0,
            this will be set to 0
        :param num_lines: int - the maximum number of lines to return.
            if < 0, will be reset to 0.
            if None, then will not be considered, and just return all the lines.
        :param latest: bool - if True, will only return the most recent max_lines
            of logs. This overrides the first_line parameter if set to True. If the call made is
            get_job_logs(id, first_line=0, num_lines=5, latest=True), and there are 100
            log lines available, then lines 96-100 will be returned.
        :returns: dict with keys:
            job_id:     string
            batch_id:   string | None
            first:      int - the first line returned
            latest:     bool - whether the latest lines were returned
            max_lines:  int - the number of logs lines currently available for that job
            lines:      list - the lines themselves, fresh from the server. These are all tiny dicts with keys
                "line" - the log line string
                "is_error" - either 0 or 1

            If there is an error when retrieving logs (e.g. the job
            has yet to start or it is a batch job and does not generate
            logs), the return structure will be:
                job_id:     string
                batch_id:   string | None
                error:      string - error message
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

            return {
                "job_id": job.job_id,
                "batch_id": job.batch_id,
                "first": first_line,
                "latest": True if latest else False,
                "max_lines": max_lines,
                "lines": logs,
            }
        except Exception as e:
            return {
                "job_id": job.job_id,
                "batch_id": job.batch_id,
                "error": e.message,
            }

    def get_job_logs_for_list(
        self,
        job_id_list: List[str],
        first_line: int = 0,
        num_lines: int = None,
        latest: bool = False,
    ) -> dict:
        """
        Fetch the logs for a list of jobs. Note that the parameters supplied are applied to all jobs.
        """
        job_ids, error_ids = self._check_job_list(job_id_list)

        output = {}
        for job_id in job_ids:
            output[job_id] = self.get_job_logs(job_id, first_line, num_lines, latest)

        for error_id in error_ids:
            output[error_id] = {
                "job_id": error_id,
                "error": DOES_NOT_EXIST,
            }

        return output

    def cancel_jobs(self, job_id_list: List[str]) -> dict:
        """
        Cancel a list of running jobs, placing them in a canceled state
        Does NOT delete the jobs.
        If the job_ids are not present or are not found in the Narrative,
        a JobRequestException is raised.

        Results are returned as a dict of job status objects keyed by job id

        :param job_id_list: list of strs
        :return job_states: dict with keys job IDs and values job state objects

        """
        job_ids, error_ids = self._check_job_list(job_id_list)
        error_states = dict()
        for job_id in job_ids:
            if not self.get_job(job_id).was_terminal():
                error = self._cancel_job(job_id)
                if error:
                    error_states[job_id] = error.message

        job_states = self._construct_job_output_state_set(job_ids)

        for job_id in error_ids:
            job_states[job_id] = get_error_output_state(job_id)

        for job_id in error_states:
            job_states[job_id]["error"] = error_states[job_id]

        return job_states

    def _cancel_job(self, job_id: str) -> None:
        # Stop updating the job status while we try to cancel.
        # Set the job to a special state of 'canceling' while we're doing the cancel
        is_refreshing = self._running_jobs[job_id].get("refresh", 0)
        self._running_jobs[job_id]["refresh"] = 0
        self._running_jobs[job_id]["canceling"] = True
        error = None
        try:
            clients.get("execution_engine2").cancel_job({"job_id": job_id})
        except Exception as e:
            error = transform_job_exception(e, "Unable to cancel job")
        self._running_jobs[job_id]["refresh"] = is_refreshing
        del self._running_jobs[job_id]["canceling"]
        return error

    def retry_jobs(self, job_id_list: List[str]) -> dict:
        """
        Returns
        [
            {
                "job": {"state": {"job_id": job_id, "status": status, ...} ...},
                "retry": {"state": {"job_id": job_id, "status": status, ...} ...}
            },
            {
                "job": {"state": {"job_id": job_id, "status": status, ...} ...},
                "error": "..."
            }
            ...
            {
                "job": {"state": {"job_id": job_id, "status": DOES_NOT_EXIST}},
                "error": DOES_NOT_EXIST
            }
        ]
        where the innermost dictionaries are job states from ee2 and are within the
        job states from job.output_state()
        """
        job_ids, error_ids = self._check_job_list(job_id_list)
        try:
            retry_results = clients.get("execution_engine2").retry_jobs(
                {"job_ids": job_ids}
            )
        except Exception as e:
            raise transform_job_exception(e, "Unable to retry job(s)")
        # for each retry result, refresh the state of the retried and new jobs
        orig_ids = [result["job_id"] for result in retry_results]
        retry_ids = [
            result["retry_id"] for result in retry_results if "retry_id" in result
        ]
        orig_states = self._construct_job_output_state_set(orig_ids)
        retry_states = self._construct_job_output_state_set(
            retry_ids, self._create_jobs(retry_ids)  # add to self._running_jobs index
        )
        job_states = {**orig_states, **retry_states}

        results_by_job_id = {}
        # fill in the job state details
        for result in retry_results:
            job_id = result["job_id"]
            results_by_job_id[job_id] = {"job_id": job_id, "job": job_states[job_id]}
            if "retry_id" in result:
                retry_id = result["retry_id"]
                results_by_job_id[job_id]["retry"] = job_states[retry_id]
            if "error" in result:
                results_by_job_id[job_id]["error"] = result["error"]
        for job_id in error_ids:
            results_by_job_id[job_id] = {
                "job_id": job_id,
                "job": get_error_output_state(job_id),
                "error": DOES_NOT_EXIST,
            }
        return results_by_job_id

    def get_job_states(self, job_ids: List[str]) -> dict:
        job_ids, error_ids = self._check_job_list(job_ids)
        output_states = self._construct_job_output_state_set(job_ids)
        for error_id in error_ids:
            output_states[error_id] = get_error_output_state(error_id)
        return output_states

    def modify_job_refresh(self, job_ids: List[str], update_adjust: int) -> None:
        """
        Modifies how many things want to get the job updated.
        If this sets the current "refresh" key to be less than 0, it gets reset to 0.
        Jobs that are not present in the _running_jobs dictionary are ignored.
        """
        job_ids, _ = self._check_job_list(job_ids)

        for job_id in job_ids:
            self._running_jobs[job_id]["refresh"] += update_adjust
            if self._running_jobs[job_id]["refresh"] < 0:
                self._running_jobs[job_id]["refresh"] = 0

    def update_batch_job(self, batch_id: str) -> List[str]:
        """
        Update a batch job and create child jobs if necessary
        """
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

        unreg_child_jobs = []
        if unreg_child_ids:
            unreg_child_jobs = Job.from_job_ids(unreg_child_ids)
            for job in unreg_child_jobs:
                self.register_new_job(
                    job=job,
                    refresh=int(not job.was_terminal()),
                )

        batch_job.update_children(reg_child_jobs + unreg_child_jobs)

        return [batch_id] + child_ids

    def list_jobs(self):
        """
        List all job ids, their info, and status in a quick HTML format.
        """
        try:
            all_states = self.lookup_all_job_states(ignore_refresh_flag=True)
            state_list = [copy.deepcopy(s["jobState"]) for s in all_states.values()]

            if not len(state_list):
                return "No running jobs!"

            state_list = sorted(state_list, key=lambda s: s.get("created", 0))
            for state in state_list:
                job = self.get_job(state["job_id"])
                state["created"] = datetime.fromtimestamp(
                    state["created"] / 1000.0
                ).strftime("%Y-%m-%d %H:%M:%S")
                state["run_time"] = "Not started"
                state["owner"] = job.user
                state["app_id"] = job.app_id
                state["batch_id"] = job.batch_id
                exec_start = state.get("running", None)

                if state.get("finished"):
                    finished_time = datetime.fromtimestamp(
                        state.get("finished") / 1000.0
                    )
                    state["finish_time"] = finished_time.strftime("%Y-%m-%d %H:%M:%S")
                    if exec_start:
                        exec_start_time = datetime.fromtimestamp(exec_start / 1000.0)
                        delta = finished_time - exec_start_time
                        delta = delta - timedelta(microseconds=delta.microseconds)
                        state["run_time"] = str(delta)
                elif exec_start:
                    exec_start_time = datetime.fromtimestamp(
                        exec_start / 1000.0
                    ).replace(tzinfo=timezone.utc)
                    delta = datetime.now(timezone.utc) - exec_start_time
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
                    <td>{{ j.job_id|e }}</td>
                    <td>{{ j.app_id|e }}</td>
                    <td>{{ j.created|e }}</td>
                    <td>{{ j.batch_id|e }}</td>
                    <td>{{ j.user|e }}</td>
                    <td>{{ j.status|e }}</td>
                    <td>{{ j.run_time|e }}</td>
                    <td>{% if j.finish_time %}{{ j.finish_time|e }}{% else %}Incomplete{% endif %}</td>
                </tr>
                {% endfor %}
            </table>
            """
            return HTML(Template(tmpl).render(jobs=state_list))

        except Exception as e:
            kblogging.log_event(self._log, "list_jobs.error", {"err": str(e)})
            raise
