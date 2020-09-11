import biokbase.narrative.clients as clients
from .job import Job

# from ipykernel.comm import Comm
from biokbase.narrative.common import kblogging
from IPython.display import HTML
from jinja2 import Template
from datetime import datetime, timezone, timedelta
from biokbase.narrative.app_util import system_variable
from biokbase.narrative.exception_util import transform_job_exception

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

TERMINAL_STATES = ["completed", "terminated", "error"]
EXCLUDED_JOB_STATE_FIELDS = ["authstrat", "job_input", "condor_job_ads"]


class JobManager(object):
    """
    The KBase Job Manager class. This handles all jobs and makes their status available.
    On status lookups, it feeds the results to the KBaseJobs channel that the front end
    listens to.
    """

    __instance = None

    # keys = job_id, values = { refresh = T/F, job = Job object }
    _running_jobs = dict()
    # keys = job_id, values = state from either Job object or NJS (these are identical)
    _completed_job_states = dict()

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
        2. get list of jobs with that ws id from UJS (also gets tag, cell_id, run_id)
        3. initialize the Job objects by running NJS.get_job_params (also gets app_id)
        4. start the status lookup loop.
        """
        ws_id = system_variable("workspace_id")
        job_states = dict()
        kblogging.log_event(self._log, "JobManager.initialize_jobs", {"ws_id": ws_id})
        try:
            job_states = clients.get("execution_engine2").check_workspace_jobs(
                {"workspace_id": ws_id, "return_list": 0}
            )
            self._running_jobs = dict()
        except Exception as e:
            kblogging.log_event(self._log, "init_error", {"err": str(e)})
            new_e = transform_job_exception(e)
            raise new_e

        for job_id, job_state in job_states.items():
            job_input = job_state.get("job_input", {})
            job_meta = job_input.get("narrative_cell_info", {})
            status = job_state.get("status")
            job = Job.from_state(
                job_id,
                job_input,
                job_state.get("user"),
                app_id=job_input.get("app_id"),
                tag=job_meta.get("tag", "release"),
                cell_id=job_meta.get("cell_id", None),
                run_id=job_meta.get("run_id", None),
                token_id=job_meta.get("token_id", None),
                meta=job_meta,
            )
            self._running_jobs[job_id] = {
                "refresh": 1
                if status not in ["completed", "errored", "terminated"]
                else 0,
                "job": job,
            }

    def _create_jobs(self, job_ids):
        """
        TODO: error handling
        Makes a bunch of Job objects from job_ids.
        Initially used to make Child jobs from some parent, but will eventually be adapted to all jobs on startup.
        Just slaps them all into _running_jobs
        """
        job_states = clients.get("execution_engine2").check_jobs(
            {"job_ids": job_ids, "return_list": 0}
        )
        for job_id in job_ids:
            if job_id in job_ids and job_id not in self._running_jobs:
                job_state = job_states.get(job_id, {})
                user = job_state.get("user")
                job_info = job_state.get("job_input", {})
                job_meta = job_info.get("narrative_cell_info", {})
                job = Job.from_state(
                    job_id,  # the id
                    job_info,  # params, etc.
                    user,  # owner id
                    app_id=job_info.get("app_id", job_info.get("method")),
                    tag=job_meta.get("tag", "release"),
                    cell_id=job_meta.get("cell_id", None),
                    run_id=job_meta.get("run_id", None),
                    token_id=job_meta.get("token_id", None),
                    meta=job_meta,
                )

                # Note that when jobs for this narrative are initially loaded,
                # they are set to not be refreshed. Rather, if a client requests
                # updates via the start_job_update message, the refresh flag will
                # be set to True.
                self._running_jobs[job_id] = {"refresh": 0, "job": job}

    def list_jobs(self):
        """
        List all job ids, their info, and status in a quick HTML format.
        """
        try:
            all_statuses = self.lookup_all_job_states(ignore_refresh_flag=True)
            state_list = [s["state"] for s in all_statuses.values()]

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

    def _create_error_state(
        self,
        error: str,
        error_msg: str,
        code: int,
        cell_id=None,
        run_id=None,
        job_id=None,
    ) -> dict:
        """
        Creates an error state to return if
        1. the state is missing or unretrievable
        2. Job is none
        This creates the whole state dictionary to return, as described in
        _construct_job_status.
        :param error: the full, detailed error (not necessarily human-readable, maybe a stacktrace)
        :param error_msg: a shortened error string, meant to be human-readable
        :param code: int, an error code
        """
        return {
            "status": "error",
            "error": {
                "code": code,
                "name": "Job Error",
                "message": error_msg,
                "error": error,
            },
            "errormsg": error_msg,
            "error_code": code,
            "job_id": job_id,
            "cell_id": cell_id,
            "run_id": run_id,
            "created": 0,
            "updated": 0,
        }

    def _construct_job_status(self, job: Job, state: dict) -> dict:
        """
        Creates a Job status dictionary with structure:
        {
            owner: string (username, who started the job),
            spec: app spec (optional)
            widget_info: (if not finished, None, else...) job.get_viewer_params result
            state: {
                job_id: string,
                status: string,
                created: epoch ms,
                updated: epoch ms,
                queued: optional - epoch ms,
                finished: optional - epoc ms,
                terminated_code: optional - int,
                tag: string (release, beta, dev),
                parent_job_id: optional - string or null,
                run_id: string,
                cell_id: string,
                errormsg: optional - string,
                error (optional): {
                    code: int,
                    name: string,
                    message: string (should be for the user to read),
                    error: string, (likely a stacktrace)
                },
                error_code: optional - int
            }
        }
        :param job: a Job object
        :param state: dict, expected to be in the format that comes straight from the
            Execution Engine 2 service
        """
        widget_info = None
        app_spec = {}

        # If there's no job, but the state is valid, then that (likely) means the job was started
        # by either running AppManager.run_app directly without cell_id or run_id info, or that
        # it was started outside of the biokbase.narrative.jobs setup. This could be done through
        # direct calls to EE2.
        #
        # This could also be triggered by manually looking up job state for some job that doesn't
        # exist in the Narrative. Which is borderline, but still probably ok.
        if job is None and state is not None:
            state.update(
                {
                    "cell_id": None,
                    "run_id": None,
                }
            )
            return {
                "state": state,
                "app_spec": app_spec,
                "widget_info": widget_info,
                "owner": None,
            }

        if state is None:
            kblogging.log_event(
                self._log,
                "lookup_job_status.error",
                {"err": "Unable to get job state for job {}".format(job.job_id)},
            )
            state = self._create_error_state(
                "Unable to find current job state. Please try again later, or contact KBase.",
                "Unable to return job state",
                -1,
                cell_id=job.cell_id,
                run_id=job.run_id,
                job_id=job.job_id,
            )

        if state.get("finished"):
            try:
                widget_info = job.get_viewer_params(state)
            except Exception as e:
                # Can't get viewer params
                new_e = transform_job_exception(e)
                kblogging.log_event(
                    self._log, "lookup_job_status.error", {"err": str(e)}
                )
                state.update(
                    {
                        "status": "error",
                        "errormsg": "Unable to build output viewer parameters!",
                        "error": {
                            "code": getattr(new_e, "code", -1),
                            "source": getattr(new_e, "source", "JobManager"),
                            "name": "App Error",
                            "message": "Unable to build output viewer parameters",
                            "error": "Unable to generate App output viewer!\nThe App appears to have completed successfully,\nbut we cannot construct its output viewer.\nPlease contact the developer of this App for assistance.",
                        },
                    }
                )

        state.update(
            {
                "child_jobs": self._child_job_states(
                    state.get("sub_jobs", []),
                    job.meta.get("batch_app"),
                    job.meta.get("batch_tag"),
                ),
                "run_id": job.cell_id,
                "cell_id": job.cell_id,
            }
        )
        if "batch_size" in job.meta:
            state.update({"batch_size": job.meta["batch_size"]})
        return {
            "state": state,
            "spec": app_spec,
            "widget_info": widget_info,
            "owner": job.owner,
            "listener_count": self._running_jobs[job.job_id]["refresh"],
        }

    def _child_job_states(self, sub_job_list, app_id, app_tag):
        """
        Fetches state for all jobs in the list. These are expected to be child jobs, with no actual Job object associated.
        So if they're done, we need to do the output mapping out of band.
        But the check_jobs call with params will return the app id. So that helps.

        app_id = the id of the app that all the child jobs are running (format: module/method, like "MEGAHIT/run_megahit")
        app_tag = one of "release", "beta", "dev"
        (the above two aren't stored with the subjob metadata, and won't until we back some more on KBParallel - I want to
        lobby for pushing toward just starting everything up at once from here and letting HTCondor deal with allocation)
        sub_job_list = list of ids of jobs to look up
        """
        if not sub_job_list:
            return []

        sub_job_list = sorted(sub_job_list)

        job_states = clients.get("execution_engine2").check_jobs(
            {
                "job_ids": sub_job_list,
                "exclude_fields": EXCLUDED_JOB_STATE_FIELDS,
                "return_list": 0,
            }
        )
        child_job_states = list()

        for job_id in sub_job_list:
            job_state = job_states.get(job_id, {})
            params = job_state.get("job_input", {}).get("params", [])
            # if it's error, get the error.
            if job_state.get("errormsg"):
                error = job_state
                error.update({"job_id": job_id})
                child_job_states.append(error)
                continue
            # if it's done, get the output mapping.
            state = job_state.get("status")
            if state == "completed":
                try:
                    widget_info = Job.map_viewer_params(state, params, app_id, app_tag)
                except ValueError:
                    widget_info = {}
                state.update({"widget_info": widget_info})
            child_job_states.append(state)
        return child_job_states

    def _construct_job_status_set(self, job_ids: list) -> dict:
        """
        Builds a set of job states for the list of job ids.
        """
        # if cached, use 'em.
        # otherwise, lookup.
        # do transform
        # cache terminal ones.
        # return all.
        if not isinstance(job_ids, list):
            raise ValueError("job_ids must be a list")
        if job_ids is None:
            job_ids = self._running_jobs.keys()

        job_states = dict()
        jobs_to_lookup = list()

        # Fetch from cache of terminated jobs, where available.
        # These are already post-processed and ready to return.
        for job_id in job_ids:
            if job_id in self._completed_job_states:
                job_states[job_id] = self._completed_job_states[job_id]
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
                    self._log, "construct_job_status_set", {"err": str(e)}
                )
        for job_id, state in fetched_states.items():
            revised_state = self._construct_job_status(self.get_job(job_id), state)
            if revised_state["state"]["status"] in TERMINAL_STATES:
                self._completed_job_states[job_id] = revised_state
            job_states[job_id] = revised_state
        return job_states

    def _verify_job_parentage(self, parent_job_id, child_job_id):
        """
        Validate job relationships.
        1. Make sure parent exists, and the child id is in its list of sub jobs.
        2. If child doesn't exist, create it and add it to the list.
        If parent doesn't exist, or child isn't an actual child, raise an exception
        """
        if parent_job_id not in self._running_jobs:
            raise ValueError(
                "Parent job id {} not found, cannot validate child job {}.".format(
                    parent_job_id, child_job_id
                )
            )
        if child_job_id not in self._running_jobs:
            parent_job = self.get_job(parent_job_id)
            parent_state = parent_job.state()
            if child_job_id not in parent_state.get("sub_jobs", []):
                raise ValueError(
                    "Child job id {} is not a child of parent job {}".format(
                        child_job_id, parent_job_id
                    )
                )
            else:
                self._create_jobs([child_job_id])
                # injects its app id and version
                child_job = self.get_job(child_job_id)
                child_job.app_id = parent_job.meta.get("batch_app")
                child_job.tag = parent_job.meta.get("batch_tag", "release")

    def lookup_job_info(self, job_id, parent_job_id=None):
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
        # if parent_job is real, and job_id (the child) is not, just add it to the
        # list of running jobs and work as normal.
        if parent_job_id is not None:
            self._verify_job_parentage(parent_job_id, job_id)
        job = self.get_job(job_id)
        info = {
            "app_id": job.app_id,
            "app_name": job.app_spec()["info"]["name"],
            "job_id": job_id,
            "job_params": job.inputs,
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
            return self._construct_job_status_set(jobs_to_lookup)
        else:
            return dict()

    def register_new_job(self, job: Job) -> None:
        """
        Registers a new Job with the manager - should only be invoked when a new Job gets
        started. This stores the Job locally and pushes it over the comm channel to the
        Narrative where it gets serialized.

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
        parent_job_id: str = None,
        first_line: int = 0,
        num_lines: int = None,
        latest_only: bool = False,
    ) -> tuple:
        """
        Raises a Value error if the job_id doesn't exist or is not present.
        :param job_id: str - the job id from the execution engine
        :param parent_job_id: if the job is a child job, this is its parent (optional)
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

    def cancel_job(self, job_id: str, parent_job_id: str = None) -> None:
        """
        Cancels a running job, placing it in a canceled state.
        Does NOT delete the job.
        if the job_id is None or not found in this Narrative, a ValueError is raised.
        This then checks the job to see if it is already canceled/finished,
        then attempts to cancel it.
        If either of those steps fail, a NarrativeException is raised.
        """

        if job_id is None:
            raise ValueError("Job id required for cancellation!")
        if not parent_job_id and job_id not in self._running_jobs:
            raise ValueError(f"No job present with id {job_id}")

        try:
            cancel_status = clients.get("execution_engine2").check_job_canceled(
                {"job_id": job_id}
            )
            if (
                cancel_status.get("finished", 0) == 1
                or cancel_status.get("canceled", 0) == 1
            ):
                # It's already finished, don't try to cancel it again.
                return
        except Exception as e:
            raise transform_job_exception(e)

        # Stop updating the job status while we try to cancel.
        # Also, set it to have a special state of 'canceling' while we're doing the cancel
        if not parent_job_id:
            is_refreshing = self._running_jobs[job_id].get("refresh", 0)
            self._running_jobs[job_id]["refresh"] = 0
            self._running_jobs[job_id]["canceling"] = True
        try:
            clients.get("execution_engine2").cancel_job({"job_id": job_id})
        except Exception as e:
            raise transform_job_exception(e)
        finally:
            if not parent_job_id:
                self._running_jobs[job_id]["refresh"] = is_refreshing
                del self._running_jobs[job_id]["canceling"]

    def get_job_state(self, job_id: str, parent_job_id: str = None) -> dict:
        if parent_job_id is not None:
            self._verify_job_parentage(parent_job_id, job_id)
        if job_id is None or job_id not in self._running_jobs:
            raise ValueError(f"No job present with id {job_id}")
        if job_id in self._completed_job_states:
            return self._completed_job_states[job_id]
        job = self.get_job(job_id)
        state = self._construct_job_status(job, job.state())
        if state.get("status") == "completed":
            self._completed_job_states[job_id] = state
        return state

    def modify_job_refresh(
        self, job_id: str, update_adjust: int, parent_job_id: str = None
    ) -> None:
        """
        Modifies how many things want to get the job updated.
        If this sets the current "refresh" key to be less than 0, it gets reset to 0.
        If the job isn't present or None, a ValueError is raised.
        """
        if parent_job_id is not None:
            self._verify_job_parentage(parent_job_id, job_id)
        if job_id is None or job_id not in self._running_jobs:
            raise ValueError(f"No job present with id {job_id}")
        self._running_jobs[job_id]["refresh"] += update_adjust
        if self._running_jobs[job_id]["refresh"] < 0:
            self._running_jobs[job_id]["refresh"] = 0
