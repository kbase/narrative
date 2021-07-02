import biokbase.narrative.clients as clients
from .job import Job, TERMINAL_STATUSES, EXCLUDED_JOB_STATE_FIELDS
from biokbase.narrative.common import kblogging
from IPython.display import HTML
from jinja2 import Template
from datetime import datetime, timezone, timedelta
from biokbase.narrative.app_util import system_variable
from biokbase.narrative.exception_util import transform_job_exception
import copy
from typing import List

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

JOB_INIT_EXCLUDED_JOB_STATE_FIELDS = [
    f for f in EXCLUDED_JOB_STATE_FIELDS if f != "job_input"
]


class JobManager(object):
    """
    The KBase Job Manager class. This handles all jobs and makes their status available.
    On status lookups, it feeds the results to the KBaseJobs channel that the front end
    listens to.
    """

    __instance = None

    # keys = job_id, values = { refresh = T/F, job = Job object }
    _running_jobs = dict()

    _log = kblogging.get_logger(__name__)

    def __new__(cls):
        if JobManager.__instance is None:
            JobManager.__instance = object.__new__(cls)
        return JobManager.__instance

    def initialize_jobs(self):
        """
        Initializes this JobManager.
        This is expected to be run by a running Narrative, and naturally linked to a workspace.
        So it does the following steps.
        1. app_util.system_variable('workspace_id')
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
                    "return_list": 0,
                    "exclude_fields": JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
                }
            )
            self._running_jobs = dict()
        except Exception as e:
            kblogging.log_event(self._log, "init_error", {"err": str(e)})
            new_e = transform_job_exception(e)
            raise new_e

        for job_id, job_state in job_states.items():
            job = Job.from_state(job_state)
            status = job_state.get("status")
            refresh_state = 1 if status not in TERMINAL_STATUSES else 0
            self._running_jobs[job_id] = {
                "refresh": refresh_state,
                "job": job,
            }

    def _create_jobs(self, job_ids, job_states=None):
        """
        TODO: error handling
        Given a list of job IDs, populates the _running_jobs dictionary
        """
        job_ids = [job_id for job_id in job_ids if job_id not in self._running_jobs]
        if not job_states:
            job_states = clients.get("execution_engine2").check_jobs(
                {"job_ids": job_ids, "return_list": 0}
            )
        for job_id in job_ids:
            job_state = job_states.get(job_id, {})
            job = Job.from_state(job_state)

            # Note that when jobs for this narrative are initially loaded,
            # they are set to not be refreshed. Rather, if a client requests
            # updates via the start_job_update message, the refresh flag will
            # be set to True.
            self._running_jobs[job_id] = {"refresh": 0, "job": job}

        return job_states

    def _check_job_list(self, job_id_list: List[str] = []):
        """
        Deduplicates the input job list, maintaining insertion order
        Any jobs not present in self._running_jobs are added to an error list

        :param job_id_list: a list of job IDs
        :return results: dict with keys "job_id_list", containing valid IDs,
        and "error" for jobs that the narrative backend does not know about
        """
        seen = {}
        results = {
            "error": [],
            "job_id_list": [],
        }

        for job_id in job_id_list:
            if job_id is not None and job_id != "" and job_id not in seen:
                seen[job_id] = True
                if job_id in self._running_jobs:
                    results["job_id_list"].append(job_id)
                else:
                    results["error"].append(job_id)

        if not len(results["job_id_list"]) and not len(results["error"]):
            raise ValueError("No job id(s) supplied")

        return results

    def list_jobs(self):
        """
        List all job ids, their info, and status in a quick HTML format.
        """
        try:
            all_states = self.lookup_all_job_states(ignore_refresh_flag=True)
            state_list = [copy.deepcopy(s["state"]) for s in all_states.values()]

            if not len(state_list):
                return "No running jobs!"

            state_list = sorted(state_list, key=lambda s: s.get("created", 0))
            for state in state_list:
                job = self.get_job(state["job_id"])
                state["created"] = datetime.fromtimestamp(
                    state["created"] / 1000.0
                ).strftime("%Y-%m-%d %H:%M:%S")
                state["run_time"] = "Not started"
                state["owner"] = job.owner
                state["app_id"] = job.app_id
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
                    <td>{{ j.owner|e }}</td>
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

    def _construct_job_state_set(self, job_ids: list, states: dict = None) -> dict:
        """
        Builds a set of job states for the list of job ids.
        :param states: list, where each state is from EE2
        """
        # if cached, use 'em.
        # otherwise, lookup.
        # do transform
        # cache terminal ones.
        # return all.
        if not isinstance(job_ids, list):
            raise ValueError("job_ids must be a list")

        job_states = dict()
        jobs_to_lookup = list()

        # Fetch from cache of terminated jobs, where available.
        # These are already post-processed and ready to return.
        for job_id in job_ids:
            job = self.get_job(job_id)
            if job.has_state_cached():
                job_states[job_id] = job.revised_state()
            elif states and job_id in states:
                state = states[job_id]
                job_states[job_id] = job.revised_state(state)
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
                    self._log, "construct_job_state_set", {"err": str(e)}
                )

        for job_id, state in fetched_states.items():
            job_states[job_id] = self.get_job(job_id).revised_state(state)
        return job_states

    def lookup_job_info(self, job_id):
        """
        Will raise a ValueError if job_id doesn't exist.
        Sends the info over the comm channel as this packet:
        {
            app_id: module/name,
            app_name: random string,
            job_id: string,
            job_params: dictionary
        }
        """
        job = self.get_job(job_id)
        info = {
            "app_id": job.app_id,
            "app_name": job.app_spec()["info"]["name"],
            "job_id": job_id,
            "job_params": job.params,
        }
        return info

    def lookup_all_job_states(self, ignore_refresh_flag=False):
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
            return self._construct_job_state_set(jobs_to_lookup)
        else:
            return dict()

    def register_new_job(self, job: Job) -> None:
        """
        Registers a new Job with the manager and stores the job locally.
        This should only be invoked when a new Job gets started.

        Parameters:
        -----------
        job : biokbase.narrative.jobs.job.Job object
            The new Job that was started.
        """
        kblogging.log_event(self._log, "register_new_job", {"job_id": job.job_id})
        self._running_jobs[job.job_id] = {"job": job, "refresh": 0}

    def get_job(self, job_id):
        """
        Returns a Job with the given job_id.
        Raises a ValueError if not found.
        """
        if job_id in self._running_jobs:
            return self._running_jobs[job_id]["job"]
        else:
            raise ValueError(f"No job present with id {job_id}")

    def get_job_logs(
        self,
        job_id: str,
        first_line: int = 0,
        num_lines: int = None,
        latest_only: bool = False,
    ) -> tuple:
        """
        Raises a Value error if the job_id doesn't exist or is not present.
        :param job_id: str - the job id from the execution engine
        :param first_line: int - the first line to be requested by the log. 0-indexed. If < 0,
            this will be set to 0
        :param max_lines: int - the maximum number of lines to return.
            if < 0, will be reset to 0.
            if None, then will not be considered, and just return all the lines.
        :param latest_only: bool - if True, will only return the most recent max_lines
            of logs. This overrides the first_line parameter if set to True. So if the call made
            is get_job_logs(id, first_line=0, num_lines=5, latest_only=True), and there are 100
            log lines available, then lines 96-100 will be returned.
        :returns: 3-tuple. elements in order:
            int - the first line returned
            int - the number of logs lines currently available for that job
            list - the lines themselves, fresh from the server. These are all tiny dicts
                with key "is_error" (either 0 or 1) and "line" - the log line string

        """
        job = self.get_job(job_id)

        if first_line < 0:
            first_line = 0
        if num_lines is not None and num_lines < 0:
            num_lines = 0

        try:
            if latest_only:
                (max_lines, logs) = job.log()
                if num_lines is not None and max_lines > num_lines:
                    first_line = max_lines - num_lines
                    logs = logs[first_line:]
            else:
                (max_lines, logs) = job.log(first_line=first_line, num_lines=num_lines)

            return (first_line, max_lines, logs)
        except Exception as e:
            raise transform_job_exception(e)

    def cancel_job(self, job_id: str) -> bool:
        """
        Cancels a running job, placing it in a canceled state.
        Does NOT delete the job.
        if the job_id is None or not found in this Narrative, a ValueError is raised.
        This then checks the job to see if it is already canceled/finished,
        then attempts to cancel it.
        If either of those steps fail, a NarrativeException is raised.
        """
        checked_jobs = self._check_job_list([job_id])

        if len(checked_jobs["error"]):
            raise ValueError(f"No job present with id {job_id}")

        # otherwise, our job ID is fine
        if self.get_job(job_id).has_state_cached():
            return True

        return self._cancel_job(job_id)

    def cancel_jobs(self, job_id_list: List[str] = []):
        """
        Cancel a list of jobs

        Results are returned as a dict of job status objects keyed by job id

        :param job_id_list: list of strs
        :return job_states: dict with keys job IDs and values job state objects

        """
        checked_jobs = self._check_job_list(job_id_list)

        for job_id in checked_jobs["job_id_list"]:
            if not self.get_job(job_id).has_state_cached():
                self._cancel_job(job_id)

        job_states = self._construct_job_state_set(checked_jobs["job_id_list"])

        for job_id in checked_jobs["error"]:
            job_states[job_id] = {"job_id": job_id, "status": "does_not_exist"}

        return job_states

    def _cancel_job(self, job_id: str) -> None:
        # Stop updating the job status while we try to cancel.
        # Set the job to a special state of 'canceling' while we're doing the cancel
        is_refreshing = self._running_jobs[job_id].get("refresh", 0)
        self._running_jobs[job_id]["refresh"] = 0
        self._running_jobs[job_id]["canceling"] = True

        try:
            clients.get("execution_engine2").cancel_job({"job_id": job_id})
        except Exception as e:
            raise transform_job_exception(e)
        finally:
            self._running_jobs[job_id]["refresh"] = is_refreshing
            del self._running_jobs[job_id]["canceling"]

    def retry_jobs(self, job_id_list: List[str]) -> List[dict]:
        """
        Returns
        [
            {
                "job_id": {"job_id": job_id, "status": status, ...}},
                "retry_id": {"job_id": job_id, "status": status, ...}}
            },
            ...
        ]
        where the innermost dictionaries are job states from job._revised_state()
        """
        checked_jobs = self._check_job_list(job_id_list)
        try:
            retry_results = clients.get("execution_engine2").retry_jobs(
                {"job_ids": checked_jobs["job_id_list"]}
            )
        except Exception as e:
            raise transform_job_exception(e)
        # for each retry result, refresh the state of the retried and new jobs
        orig_ids = [result["job_id"] for result in retry_results]
        retry_ids = [result["retry_id"] for result in retry_results if "retry_id" in result]
        for job_id in orig_ids:
            self.get_job(job_id).clear_cache()
        orig_states = self._construct_job_state_set(orig_ids)
        retry_states = self._construct_job_state_set(
            retry_ids,
            self._create_jobs(retry_ids)  # add to self._running_jobs index
        )
        job_states = {**orig_states, **retry_states}
        # fill in the job state details
        for result in retry_results:
            result["job_id"] = job_states[result["job_id"]]
            if "retry_id" in result:
                result["retry_id"] = job_states[result["retry_id"]]
        for job_id in checked_jobs["error"]:
            retry_results.append({
                "job_id": {"job_id": job_id, "status": "does_not_exist"},  # not the "revised state" unlike other items in retry_results?
                "error": "does_not_exist"
            })

        return retry_results

    def get_job_state(self, job_id: str) -> dict:
        if job_id is None or job_id not in self._running_jobs:
            raise ValueError(f"No job present with id {job_id}")
        state = self._running_jobs[job_id]["job"].revised_state()
        return state

    def modify_job_refresh(self, job_id: str, update_adjust: int) -> None:
        """
        Modifies how many things want to get the job updated.
        If this sets the current "refresh" key to be less than 0, it gets reset to 0.
        If the job isn't present or None, a ValueError is raised.
        """
        if job_id is None or job_id not in self._running_jobs:
            raise ValueError(f"No job present with id {job_id}")
        self._running_jobs[job_id]["refresh"] += update_adjust
        if self._running_jobs[job_id]["refresh"] < 0:
            self._running_jobs[job_id]["refresh"] = 0
