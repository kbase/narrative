import biokbase.narrative.clients as clients
from .specmanager import SpecManager
from biokbase.narrative.app_util import map_inputs_from_job, map_outputs_from_state
from biokbase.narrative.exception_util import transform_job_exception
import copy
import json
import uuid
from jinja2 import Template
from pprint import pprint
from typing import List

"""
KBase job class
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

COMPLETED_STATUS = "completed"
TERMINAL_STATUSES = [COMPLETED_STATUS, "terminated", "error"]

EXCLUDED_JOB_STATE_FIELDS = [
    "authstrat",
    "condor_job_ads",
    "job_input",
    "scheduler_type",
    "scheduler_id",
]

EXTRA_JOB_STATE_FIELDS = ["batch_id", "cell_id", "run_id"]

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
    "tag": "release",
    "user": None,
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
STATE_ATTRS = list(set(JOB_ATTRS) - set(JOB_INPUT_ATTRS) - set(NARR_CELL_INFO_ATTRS))


def _attr_to_ee2(attr):
    mapping = {"app_version": "service_ver"}
    if attr in mapping:
        return mapping[attr]
    else:
        return attr


class Job(object):
    _job_logs = list()
    _const_state = None  # for original/constant attributes
    _last_state = None  # for changing attributes

    def __init__(self, ee2_state, extra_data=None, children=None):
        # verify job_id
        if ee2_state.get("job_id") is None:
            raise ValueError("Cannot create a job without a job ID!")

        # verify parent-children relationship
        if ee2_state.get("batch_job") is True:
            if children is None or len(children) == 0:
                raise ValueError(
                    "Job with `batch_job=True` must be instantiated with child job instances"
                )
            state_child_ids = ee2_state.get("child_jobs", [])
            inst_child_ids = [job.job_id for job in children]
            if sorted(state_child_ids) != sorted(inst_child_ids):
                raise ValueError("Child job id mismatch")

        self._const_state = ee2_state
        self._last_state = ee2_state
        self.extra_data = extra_data
        self.children = children

    @classmethod
    def from_state(cls, ee2_state, children=None):
        """
        Parameters:
        -----------
        job_state - dict
            the job information returned from ee2.check_job, or something in that format
        """
        return cls(ee2_state=ee2_state, children=children)

    @classmethod
    def from_attributes(cls, **kwargs):
        """
        Initializes a new Job with the attributes supplied in the kwargs.
        The app_id and app_version should both align with what's available in
        the Narrative Method Store service.

        required args:
        job_id (str): the ID of the job

        optional args:
        app_id (str): identifier for the app
        app_version (str): service version string
        batch_id (str): for batch jobs, the ID of the parent job
        batch_job (bool): whether or not this is a batch job
        child_jobs (list[str]): IDs of child jobs in a batch
        cell_id (str): ID of the cell that initiated the job (if applicable)
        extra_data (dict): currently only used by the legacy batch job interface;
            format:
                batch_app: ID of app being run,
                batch_tag: app tag
                batch_size: number of jobs being run
        params (dict): input parameters
        user (str): the user who started the job
        run_id (str): unique run ID for the job
        tag (str): the application tag (dev/beta/release)
        children (list): applies to batch parent jobs, Job instances of this Job's child jobs
        """
        # reconstruct the ee2 job state object
        ee2_state = kwargs.get("ee2_state", {})
        job_input = ee2_state.get("job_input", {})
        narr_cell_info = job_input.get("narrative_cell_info", {})

        narr_cell_info.update(
            {
                key: kwargs[key]
                for key in NARR_CELL_INFO_ATTRS
                if key in kwargs and key not in narr_cell_info
            }
        )
        job_input.update(
            {
                **{
                    _attr_to_ee2(key): kwargs[key]
                    for key in JOB_INPUT_ATTRS
                    if key in kwargs and key not in job_input
                },
                "narrative_cell_info": narr_cell_info,
            }
        )
        ee2_state.update(
            {
                **{
                    key: kwargs[key]
                    for key in STATE_ATTRS
                    if key in kwargs and key not in ee2_state
                },
                "job_input": job_input,
            }
        )

        return cls(
            ee2_state=ee2_state,
            extra_data=kwargs.get("extra_data"),
            children=kwargs.get("children"),
        )

    def __getattr__(self, name):
        """
        Map expected job attributes to paths in stored ee2 state
        """
        attr = dict(
            app_id=lambda: self._const_state.get("job_input", {}).get(
                "app_id", JOB_ATTR_DEFAULTS["app_id"]
            ),
            app_version=lambda: self._const_state.get("job_input", {}).get(
                "service_ver", JOB_ATTR_DEFAULTS["app_version"]
            ),
            batch_id=lambda: (
                self.job_id
                if self.batch_job
                else self._const_state.get("batch_id", JOB_ATTR_DEFAULTS["batch_id"])
            ),
            batch_job=lambda: self._const_state.get(
                "batch_job", JOB_ATTR_DEFAULTS["batch_job"]
            ),
            cell_id=lambda: self._const_state.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("cell_id", JOB_ATTR_DEFAULTS["cell_id"]),
            child_jobs=lambda: self.state().get(
                "child_jobs", JOB_ATTR_DEFAULTS["child_jobs"]
            ),
            job_id=lambda: self._const_state.get("job_id"),
            params=lambda: self._const_state.get("job_input", {}).get(
                "params", JOB_ATTR_DEFAULTS["params"]
            ),
            retry_ids=lambda: self.state().get(
                "retry_ids", JOB_ATTR_DEFAULTS["retry_ids"]
            ),
            retry_parent=lambda: self._const_state.get(
                "retry_parent", JOB_ATTR_DEFAULTS["retry_parent"]
            ),
            run_id=lambda: self._const_state.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("run_id", JOB_ATTR_DEFAULTS["run_id"]),
            tag=lambda: self._const_state.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("tag", JOB_ATTR_DEFAULTS["tag"]),
            user=lambda: self._const_state.get("user", JOB_ATTR_DEFAULTS["user"]),
        )

        if name not in attr:
            raise AttributeError(f"'Job' object has no attribute '{name}'")

        return attr[name]()

    def __setattr__(self, name, value):
        if name in STATE_ATTRS:
            self._const_state[name] = value
        elif name in JOB_INPUT_ATTRS:
            self._const_state["job_input"] = self._const_state.get("job_input", {})
            self._const_state["job_input"][name] = value
        elif name in NARR_CELL_INFO_ATTRS:
            self._const_state["job_input"] = self._const_state.get("job_input", {})
            self._const_state["job_input"]["narrative_cell_info"] = self._const_state[
                "job_input"
            ].get("narrative_cell_info", {})
            self._const_state["job_input"]["narrative_cell_info"] = value
        else:
            object.__setattr__(self, name, value)

    @property
    def was_terminal(self):
        """
        Checks if last queried ee2 state (or those of its children) was terminal.
        """
        # add in a check for the case where this is a batch parent job
        # batch parent jobs with where all children have status "completed" are in a terminal state
        # otherwise, child jobs may be retried
        if self._const_state.get("batch_job"):
            for child_job in self.children:
                if (
                    child_job._last_state
                    and child_job._last_state.get("status") != COMPLETED_STATUS
                ):
                    return False
            return True

        else:
            return (
                self._last_state and self._last_state.get("status") in TERMINAL_STATUSES
            )

    @property
    def final_state(self):
        if self.was_terminal is True:
            return self.state()
        # refresh?
        return None

    def info(self):
        spec = self.app_spec()
        print(f"App name (id): {spec['info']['name']} ({self.app_id})")
        print(f"Version: {spec['info']['ver']}")

        try:
            state = self.state()
            print(f"Status: {state['status']}")
            print("Inputs:\n------")
            pprint(self.params)
        except BaseException:
            print("Unable to retrieve current running state!")

    def app_spec(self):
        return SpecManager().get_spec(self.app_id, self.tag)

    def parameters(self):
        """
        Returns the parameters used to start the job. Job tries to use its params field, but
        if that's None, then it makes a call to njs.

        If no exception is raised, this only returns the list of parameters, NOT the whole
        object fetched from ee2.get_job_params
        """
        if self.params is not None:
            return self.params
        else:
            try:
                self.params = clients.get("execution_engine2").get_job_params(
                    self.job_id
                )["params"]
                return self.params
            except Exception as e:
                raise Exception(
                    f"Unable to fetch parameters for job {self.job_id} - {e}"
                )

    def update_state(self, state):
        """
        given a state data structure (as emitted by ee2), update the stored state in the job object
        """
        if not state:
            return

        if "job_id" in state and state["job_id"] != self.job_id:
            raise ValueError(
                f"Job ID mismatch in update_state: job ID: {self.job_id}; state ID: {state['job_id']}"
            )

        state = copy.deepcopy(state)
        if self._last_state is None:
            self._last_state = state
        else:
            # TODO: implement batch job code updates here
            # TODO: update state structure-wise
            self._last_state.update(state)

        return copy.deepcopy(self._last_state)

    def clear_state(self):
        """
        reset the internal job state by removing the stored state
        """
        self._last_state = None

    def _augment_ee2_state(self, state):
        output_state = copy.deepcopy(state)
        for field in EXCLUDED_JOB_STATE_FIELDS:
            if field in output_state:
                del output_state[field]
        if "job_output" not in output_state:
            output_state["job_output"] = {}
        for arg in EXTRA_JOB_STATE_FIELDS:
            output_state[arg] = getattr(self, arg)
        return output_state

    def state(self, force_refresh=False):
        """
        Queries the job service to see the state of the current job.
        """

        if self.was_terminal and not force_refresh:
            state = copy.deepcopy(self._last_state)
        else:
            try:
                state = clients.get("execution_engine2").check_job(
                    {"job_id": self.job_id, "exclude_fields": EXCLUDED_JOB_STATE_FIELDS}
                )
                state = self.update_state(state)

            except Exception as e:
                raise Exception(f"Unable to fetch info for job {self.job_id} - {e}")

        for field in EXCLUDED_JOB_STATE_FIELDS:
            if field in state and field != "job_input":
                del state[field]

        return state

    def output_state(self, state=None) -> dict:
        """
        :param state: can be queried individually from ee2/cache with self.state(),
            but sometimes want it to be queried in bulk from ee2 upstream
        :return: dict, with structure

        {
            user: string (username, who started the job),
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
        """
        if not state:
            state = self.state()
        else:
            state = self.update_state(state)

        if state is None:
            return self._create_error_state(
                "Unable to find current job state. Please try again later, or contact KBase.",
                "Unable to return job state",
                -1,
            )

        state = self._augment_ee2_state(state)

        if "child_jobs" not in state:
            state["child_jobs"] = []

        widget_info = None
        if state.get("finished"):
            try:
                widget_info = self.get_viewer_params(state)
            except Exception as e:
                # Can't get viewer params
                new_e = transform_job_exception(e)
                state.update(
                    {
                        "status": "error",
                        "errormsg": "Unable to build output viewer parameters!",
                        "error": {
                            "code": getattr(new_e, "code", -1),
                            "source": getattr(new_e, "source", "JobManager"),
                            "name": "App Error",
                            "message": "Unable to build output viewer parameters",
                            "error": "Unable to generate App output viewer!\nThe App appears to have completed successfully,\nbut we cannot construct its output viewer.\nPlease contact https://kbase.us/support for assistance.",
                        },
                    }
                )

        job_state = {
            "state": state,
            "widget_info": widget_info,
            "user": self.user,
        }
        return job_state

    def show_output_widget(self, state=None):
        """
        For a complete job, returns the job results.
        An incomplete job throws an exception
        """
        from biokbase.narrative.widgetmanager import WidgetManager

        if state is None:
            state = self.state()

        state = self._augment_ee2_state(state)
        if state["status"] == COMPLETED_STATUS and "job_output" in state:
            (output_widget, widget_params) = self._get_output_info(state)
            return WidgetManager().show_output_widget(
                output_widget, widget_params, tag=self.tag
            )
        else:
            return f"Job is incomplete! It has status '{state['status']}'"

    def get_viewer_params(self, state):
        """
        Maps job state 'result' onto the inputs for a viewer.
        """
        if state is None or state["status"] != COMPLETED_STATUS:
            return None
        (output_widget, widget_params) = self._get_output_info(state)
        return {"name": output_widget, "tag": self.tag, "params": widget_params}

    def _get_output_info(self, state):
        spec = self.app_spec()
        return map_outputs_from_state(
            state, map_inputs_from_job(self.parameters(), spec), spec
        )

    def log(self, first_line=0, num_lines=None):
        """
        Fetch a list of Job logs from the Job Service.
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
            return (num_available_lines, list())
        return (
            num_available_lines,
            self._job_logs[first_line : first_line + num_lines],
        )

    def _update_log(self):
        log_update = clients.get("execution_engine2").get_job_logs(
            {"job_id": self.job_id, "skip_lines": len(self._job_logs)}
        )
        if log_update["lines"]:
            self._job_logs = self._job_logs + log_update["lines"]

    def is_finished(self):
        """
        Returns True if the job is finished (in any state, including errors or canceled),
        False if its running/queued.
        """
        return self.state().get("status") in TERMINAL_STATUSES

    def __repr__(self):
        return "KBase Narrative Job - " + str(self.job_id)

    def _repr_javascript_(self):
        tmpl = """
        element.html("<div id='{{elem_id}}' class='kb-vis-area'></div>");

        require(['jquery', 'kbaseNarrativeJobStatus'], function($, KBaseNarrativeJobStatus) {
            var w = new KBaseNarrativeJobStatus($('#{{elem_id}}'), {'jobId': '{{job_id}}', 'state': {{state}}, 'info': {{info}}, 'outputWidgetInfo': {{output_widget_info}}});
        });
        """
        output_widget_info = None
        try:
            state = self._augment_ee2_state(self.state())
            spec = self.app_spec()
            if state.get("status", "") == COMPLETED_STATUS:
                (output_widget, widget_params) = self._get_output_info(state)
                output_widget_info = {"name": output_widget, "params": widget_params}

            info = {
                "app_id": spec["info"]["id"],
                "version": spec["info"].get("ver", None),
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

    def dump(self):
        """
        Display job info without having to iterate through the attributes
        """

        return {attr: getattr(self, attr) for attr in [*JOB_ATTRS, "_last_state"]}

    def _create_error_state(
        self,
        error: str,
        error_msg: str,
        code: int,
    ) -> dict:
        """
        Creates an error state to return if
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
            "updated": 0,
        }
