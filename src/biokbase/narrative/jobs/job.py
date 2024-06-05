import copy
import json
import uuid
from pprint import pprint
from typing import Any

from biokbase.narrative import clients
from biokbase.narrative.app_util import map_inputs_from_job, map_outputs_from_state
from biokbase.narrative.exception_util import transform_job_exception
from biokbase.narrative.jobs.specmanager import SpecManager
from jinja2 import Template

"""
KBase job class
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

COMPLETED_STATUS = "completed"
TERMINAL_STATUSES = [COMPLETED_STATUS, "terminated", "error"]

JOB_INIT_EXCLUDED_JOB_STATE_FIELDS = [
    "authstrat",
    "condor_job_ads",
    "retry_saved_toggle",
    "scheduler_type",
    "scheduler_id",
    "updated",
]

EXCLUDED_JOB_STATE_FIELDS = [*JOB_INIT_EXCLUDED_JOB_STATE_FIELDS, "job_input"]

OUTPUT_STATE_EXCLUDED_JOB_STATE_FIELDS = [*EXCLUDED_JOB_STATE_FIELDS, "user"]

EXTRA_JOB_STATE_FIELDS = ["batch_id", "child_jobs"]


# The app_id and app_version should both align with what's available in
# the Narrative Method Store service.
#
# app_id (str): identifier for the app
# app_version (str): service version string
# batch_id (str): for batch jobs, the ID of the parent job
# batch_job (bool): whether or not this is a batch job
# child_jobs (list[str]): IDs of child jobs in a batch
# cell_id (str): ID of the cell that initiated the job (if applicable)
# job_id (str): the ID of the job
# params (dict): input parameters
# run_id (str): unique run ID for the job
# status (str): EE2 job status
# tag (str): the application tag (dev/beta/release)
# user (str): the user who started the job
# wsid (str): the workspace ID for the job
JOB_ATTR_DEFAULTS = {
    "app_id": None,
    "app_version": None,
    "batch_id": None,
    "batch_job": False,
    "child_jobs": [],
    "cell_id": None,
    "params": None,
    "retry_ids": [],
    "retry_parent": None,
    "run_id": None,
    "status": "created",
    "tag": "release",
    "user": None,
    "wsid": None,
}

JOB_ATTRS = list(JOB_ATTR_DEFAULTS.keys())
JOB_ATTRS.append("job_id")

# Group attributes by place in nested dict state
NARR_CELL_INFO_ATTRS = [
    "cell_id",
    "run_id",
    "tag",
]
JOB_INPUT_ATTRS = [
    "app_id",
    "app_version",
    "params",
]
ALL_ATTRS = list(set(JOB_ATTRS + JOB_INPUT_ATTRS + NARR_CELL_INFO_ATTRS))


class Job:
    _job_logs: list[dict[str, Any]] | None = None
    _acc_state: dict[str, Any] | None = None  # accumulates state

    def __init__(
        self: "Job",
        ee2_state: dict[str, Any],
        extra_data: dict[str, Any] | None = None,
        children: list["Job"] | None = None,
    ):
        """Parameters:
        -----------
        job_state - dict
            the job information returned from ee2.check_job, or something in that format
        extra_data (dict): currently only used by the legacy batch job interface;
            format:
                batch_app: ID of app being run,
                batch_tag: app tag
                batch_size: number of jobs being run
        children (list): applies to batch parent jobs, Job instances of this Job's child jobs
        """
        # verify job_id ... TODO validate ee2_state
        self._job_logs = []
        self._acc_state = {}
        if ee2_state.get("job_id") is None:
            raise ValueError("Cannot create a job without a job ID!")

        self.update_state(ee2_state)
        self.extra_data = extra_data

        # verify parent-children relationship
        if ee2_state.get("batch_job"):
            self._verify_children(children)
        self.children = children

    @classmethod
    def from_job_id(
        cls,
        job_id: str,
        extra_data: dict[str, Any] | None = None,
        children: list["Job"] | None = None,
    ) -> "Job":
        state = cls.query_ee2_states([job_id], init=True)
        return cls(state[job_id], extra_data=extra_data, children=children)

    @classmethod
    def from_job_ids(cls, job_ids: list[str]) -> list["Job"]:
        states = cls.query_ee2_states(job_ids, init=True)
        return [cls(state) for state in states.values()]

    @staticmethod
    def query_ee2_states(
        job_ids: list[str],
        init: bool = True,
    ) -> dict[str, dict]:
        if not job_ids:
            return {}

        return clients.get("execution_engine2").check_jobs(
            {
                "job_ids": job_ids,
                "exclude_fields": (
                    JOB_INIT_EXCLUDED_JOB_STATE_FIELDS if init else EXCLUDED_JOB_STATE_FIELDS
                ),
                "return_list": 0,
            }
        )

    @staticmethod
    def _trim_ee2_state(state: dict[str, Any], exclude_fields: list[str] | None) -> None:
        if exclude_fields:
            for field in exclude_fields:
                if field in state:
                    del state[field]

    def __getattr__(self: "Job", name: str) -> None | str | int | list | dict:
        """Map expected job attributes to paths in stored ee2 state"""
        attr = {
            "app_id": lambda: self._acc_state.get("job_input", {}).get(
                "app_id", JOB_ATTR_DEFAULTS["app_id"]
            ),
            "app_version": lambda: self._acc_state.get("job_input", {}).get(
                "service_ver", JOB_ATTR_DEFAULTS["app_version"]
            ),
            "batch_id": lambda: (
                self.job_id
                if self.batch_job
                else self._acc_state.get("batch_id", JOB_ATTR_DEFAULTS["batch_id"])
            ),
            "batch_job": lambda: self._acc_state.get("batch_job", JOB_ATTR_DEFAULTS["batch_job"]),
            "cell_id": lambda: self._acc_state.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("cell_id", JOB_ATTR_DEFAULTS["cell_id"]),
            "job_id": lambda: self._acc_state.get("job_id"),
            "params": lambda: copy.deepcopy(
                self._acc_state.get("job_input", {}).get("params", JOB_ATTR_DEFAULTS["params"])
            ),
            "retry_parent": lambda: self._acc_state.get(
                "retry_parent", JOB_ATTR_DEFAULTS["retry_parent"]
            ),
            "run_id": lambda: self._acc_state.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("run_id", JOB_ATTR_DEFAULTS["run_id"]),
            "tag": lambda: self._acc_state.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("tag", JOB_ATTR_DEFAULTS["tag"]),
            "user": lambda: self._acc_state.get("user", JOB_ATTR_DEFAULTS["user"]),
            "wsid": lambda: self._acc_state.get("wsid", JOB_ATTR_DEFAULTS["wsid"]),
            # the following properties can change whilst a job is in progress
            "child_jobs": lambda force_refresh=True: copy.deepcopy(
                # N.b. only batch container jobs have a child_jobs field
                # and need the state refresh.
                # But KBParallel/KB Batch App jobs do not have the
                # batch_job field
                self.refresh_state(force_refresh=force_refresh).get(
                    "child_jobs", JOB_ATTR_DEFAULTS["child_jobs"]
                )
                if self.batch_job
                else self._acc_state.get("child_jobs", JOB_ATTR_DEFAULTS["child_jobs"])
            ),
            "retry_ids": lambda force_refresh=True: copy.deepcopy(
                # Batch container and retry jobs don't have a
                # retry_ids field so skip the state refresh
                self._acc_state.get("retry_ids", JOB_ATTR_DEFAULTS["retry_ids"])
                if self.batch_job or self.retry_parent
                else self.refresh_state(force_refresh=force_refresh).get(
                    "retry_ids", JOB_ATTR_DEFAULTS["retry_ids"]
                )
            ),
            "status": lambda force_refresh=True: copy.deepcopy(
                self.refresh_state(force_refresh=force_refresh).get(
                    "status", JOB_ATTR_DEFAULTS["status"]
                )
                if self.in_terminal_state()
                else self._acc_state.get("status", JOB_ATTR_DEFAULTS["status"])
            ),
        }

        if name not in attr:
            raise AttributeError(f"'Job' object has no attribute '{name}'")

        return attr[name]()

    def __setattr__(self: "Job", name: str, value: None | str | int | list | dict):
        if name in ALL_ATTRS:
            raise AttributeError("Job attributes must be updated using the `update_state` method")

        object.__setattr__(self, name, value)

    @property
    def app_name(self: "Job") -> str:
        return "batch" if self.batch_job else self.app_spec()["info"]["name"]

    def in_terminal_state(self: "Job") -> bool:
        """Checks if last queried ee2 state (or those of its children) was terminal."""
        # add in a check for the case where this is a batch parent job
        # batch parent jobs with where all children have status "completed" are in a terminal state
        # otherwise, child jobs may be retried
        if self._acc_state.get("batch_job"):
            return all(
                child_job._acc_state.get("status") == COMPLETED_STATUS
                for child_job in self.children
            )

        return self._acc_state.get("status") in TERMINAL_STATUSES

    def in_cells(self: "Job", cell_ids: list[str]) -> bool:
        """For job initialization.
        See if job is associated with present cells

        A batch job technically can have children in different cells,
        so consider it in any cell a child is in
        """
        if cell_ids is None:
            raise ValueError("cell_ids cannot be None")

        if self.batch_job and self.children:
            return any(child_job.cell_id in cell_ids for child_job in self.children)
        return self.cell_id in cell_ids

    def app_spec(self: "Job"):
        return SpecManager().get_spec(self.app_id, self.tag)

    def parameters(self: "Job") -> dict[str, Any]:
        """Returns the parameters used to start the job. Job tries to use its params field, but
        if that's None, then it makes a call to EE2.

        If no exception is raised, this only returns the list of parameters, NOT the whole
        object fetched from ee2.check_job
        """
        if self.params is None:
            try:
                state = self.query_ee2_states([self.job_id], init=True)
                self.update_state(state[self.job_id])
            except Exception as e:
                raise Exception(f"Unable to fetch parameters for job {self.job_id} - {e}") from e

        return self.params

    def update_state(self: "Job", state: dict[str, Any]) -> None:
        """Given a state data structure (as emitted by ee2), update the stored state in the job object.
        All updates to the job state should go through this function.
        """
        if not isinstance(state, dict):
            raise TypeError("state must be a dict")

        # Check job_id match
        if self._acc_state and "job_id" in state and state["job_id"] != self.job_id:
            raise ValueError(
                "Job ID mismatch in update_state: "
                + f"job ID: {self.job_id}; state ID: {state['job_id']}"
            )

        self._acc_state = {**self._acc_state, **state}

    def refresh_state(
        self: "Job",
        force_refresh: bool = False,
        exclude_fields: list[str] | None = JOB_INIT_EXCLUDED_JOB_STATE_FIELDS,
    ):
        """Queries the job service to see the state of the current job."""
        if force_refresh or not self.in_terminal_state():
            state = self.query_ee2_states([self.job_id], init=False)
            self.update_state(state[self.job_id])

        return self.cached_state(exclude_fields)

    def cached_state(self: "Job", exclude_fields: list[str] | None = None) -> dict[str, Any]:
        """Wrapper for self._acc_state"""
        state = copy.deepcopy(self._acc_state)
        self._trim_ee2_state(state, exclude_fields)
        return state

    def output_state(self: "Job") -> dict[str, str | dict[str, Any]]:
        """Request the current job state in a format suitable for sending to the front end.
        N.b. this method does not perform a data update.

        :return:        dict, with structure

        {
            "job_id": string,
            "jobState": {
                "job_id": string,
                "status": string - enum,
                "batch_id": string or None,
                "batch_job": bool,
                "child_jobs": list,
                "created": epoch ms,
                "queued": epoch ms,
                "running": epoch ms,
                "finished": epoch ms,
                "tag": string (release, beta, dev),
                "run_id": string,
                "cell_id": string,
                "job_output": {     # completed jobs only
                    "version": string,
                    "result": [
                        {
                            # result params, e.g.
                            "report_name": string,
                            "report_ref": string,
                        }
                    ],
                    "id": string
                },
                "terminated_code": terminated jobs only; optional - int,
                "error": {  # jobs that did not complete successfully
                    "code": int,
                    "name": string,
                    "message": string (should be for the user to read),
                    "error": string, (likely a stacktrace)
                },
                "errormsg": optional - string,
                "error_code": optional - int
            },
            "outputWidgetInfo": {  # None if job does not have status "completed"
                "name": string,
                "tag": string - (release, beta, dev),
                "params": {
                    # output widget params, e.g.
                    "report_name": string,
                    "report_ref": string
                }
            }

        }
        :rtype: dict
        """
        state = self.cached_state()
        self._trim_ee2_state(state, OUTPUT_STATE_EXCLUDED_JOB_STATE_FIELDS)

        if "job_output" not in state:
            state["job_output"] = {}

        if "batch_id" not in state:
            state["batch_id"] = self.batch_id

        if "child_jobs" not in state:
            state["child_jobs"] = JOB_ATTR_DEFAULTS["child_jobs"]

        widget_info = None
        if state.get("finished"):
            try:
                widget_info = self.get_viewer_params(state)
            except Exception as e:
                # Can't get viewer params
                new_e = transform_job_exception(e)
                widget_info = {
                    "status": "error",
                    "errormsg": "Unable to build output viewer parameters!",
                    "error": {
                        "code": getattr(new_e, "code", -1),
                        "source": getattr(new_e, "source", "JobManager"),
                        "name": "App Error",
                        "message": "Unable to build output viewer parameters",
                        "error": (
                            "Unable to generate App output viewer!\nThe App appears to have "
                            "completed successfully,\nbut we cannot construct its output "
                            "viewer.\nPlease contact https://kbase.us/support for assistance."
                        ),
                    },
                }

        return {
            "job_id": self.job_id,
            "jobState": state,
            "outputWidgetInfo": widget_info,
        }

    def show_output_widget(self: "Job", state: dict[str, Any] | None = None) -> str | None:
        """For a complete job, returns the job results.
        An incomplete job throws an exception
        """
        from biokbase.narrative.widgetmanager import WidgetManager

        if not state:
            state = self.refresh_state()
        else:
            self.update_state(state)
            state = self.cached_state()

        if state["status"] == COMPLETED_STATUS and "job_output" in state:
            (output_widget, widget_params) = self._get_output_info(state)
            return WidgetManager().show_output_widget(output_widget, widget_params, tag=self.tag)
        return f"Job is incomplete! It has status '{state['status']}'"

    def get_viewer_params(self: "Job", state: dict[str, Any]) -> dict[str, Any] | None:
        """Maps job state 'result' onto the inputs for a viewer."""
        if state is None or state["status"] != COMPLETED_STATUS:
            return None
        (output_widget, widget_params) = self._get_output_info(state)
        return {"name": output_widget, "tag": self.tag, "params": widget_params}

    def _get_output_info(self: "Job", state: dict[str, Any]):
        spec = self.app_spec()
        return map_outputs_from_state(state, map_inputs_from_job(self.parameters(), spec), spec)

    def log(
        self: "Job", first_line: int = 0, num_lines: int | None = None
    ) -> tuple[int, list[dict[str, Any]]]:
        """Fetch a list of Job logs from the Job Service.
        This returns a 2-tuple (number of available log lines, list of log lines)
        Each log 'line' is a dict with two properties:
        is_error - boolean
            True if the line reflects an error returned by the method (e.g. stdout)
        line - string
            The actual log line
        Parameters:
        -----------
        first_line - int
            First line of log to return (0-indexed). If < 0, starts at the beginning. If > total
            lines, returns an empty list.
        num_lines - int or None
            Limit on the number of lines to return (if None, return everything). If <= 0,
            returns no lines.
        Usage:
        ------
        The parameters are kwargs, so the following cases can be true:
        log() - returns all available log lines
        log(first_line=5) - returns every line available starting with line 5
        log(num_lines=100) - returns the first 100 lines (or all lines available if < 100)
        """
        self._update_log()
        num_available_lines = len(self._job_logs)

        if first_line < 0:
            first_line = 0
        if num_lines is None:
            num_lines = num_available_lines - first_line
        if num_lines < 0:
            num_lines = 0

        if first_line >= num_available_lines or num_lines <= 0:
            return (num_available_lines, [])
        return (
            num_available_lines,
            self._job_logs[first_line : first_line + num_lines],
        )

    def _update_log(self: "Job") -> None:
        log_update: dict[str, Any] = clients.get("execution_engine2").get_job_logs(
            {"job_id": self.job_id, "skip_lines": len(self._job_logs)}
        )
        if log_update["lines"]:
            self._job_logs = self._job_logs + log_update["lines"]

    def _verify_children(self: "Job", children: list["Job"] | None) -> None:
        if not self.batch_job:
            raise ValueError("Not a batch container job")

        if children is None:
            raise ValueError("Must supply children when setting children of batch job parent")

        inst_child_ids = [job.job_id for job in children]
        if sorted(inst_child_ids) != sorted(self._acc_state.get("child_jobs")):
            raise ValueError("Child job id mismatch")

    def update_children(self: "Job", children: list["Job"]) -> None:
        self._verify_children(children)
        self.children = children

    def _create_error_state(
        self: "Job",
        error: str,
        error_msg: str,
        code: int,
    ) -> dict[str, Any]:
        """Creates an error state to return if
        1. the state is missing or unretrievable
        2. Job is none
        This creates the whole state dictionary to return, as described in
        _construct_cache_job_state.
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
            "job_id": self.job_id,
            "cell_id": self.cell_id,
            "run_id": self.run_id,
            "created": 0,
        }

    def __repr__(self: "Job") -> str:
        return "KBase Narrative Job - " + str(self.job_id)

    def info(self: "Job") -> None:
        """Printed job info"""
        spec = self.app_spec()
        print(f"App name (id): {spec['info']['name']} ({self.app_id})")
        print(f"Version: {spec['info']['ver']}")

        try:
            state = self.refresh_state()
            print(f"Status: {state['status']}")
            print("Inputs:\n------")
            pprint(self.params)
        except BaseException:
            print("Unable to retrieve current running state!")

    def _repr_javascript_(self: "Job") -> str:
        """Called by Jupyter when a Job object is entered into a code cell"""
        tmpl = """
        element.html("<div id='{{elem_id}}' class='kb-vis-area'></div>");

        require(['jquery', 'kbaseNarrativeJobStatus'], function($, KBaseNarrativeJobStatus) {
            var w = new KBaseNarrativeJobStatus($('#{{elem_id}}'), {'jobId': '{{job_id}}', 'state': {{state}}, 'info': {{info}}, 'outputWidgetInfo': {{output_widget_info}}});
        });
        """
        output_widget_info = None
        try:
            state = self.refresh_state()
            spec = self.app_spec()
            if state.get("status", "") == COMPLETED_STATUS:
                (output_widget, widget_params) = self._get_output_info(state)
                output_widget_info = {"name": output_widget, "params": widget_params}

            info = {
                "app_id": spec["info"]["id"],
                "version": spec["info"].get("ver"),
                "name": spec["info"]["name"],
            }
        except Exception:
            state = {}
            info = {"app_id": None, "version": None, "name": "Unknown App"}
        return Template(tmpl).render(
            job_id=self.job_id,
            elem_id=f"kb-job-{self.job_id}-{uuid.uuid4()}",
            state=json.dumps(state),
            info=json.dumps(info),
            output_widget_info=json.dumps(output_widget_info),
        )

    def dump(self: "Job") -> dict[str, Any]:
        """Display job info without having to iterate through the attributes"""
        return {attr: getattr(self, attr) for attr in [*JOB_ATTRS, "_acc_state"]}
