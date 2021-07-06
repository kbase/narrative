import biokbase.narrative.clients as clients
from .specmanager import SpecManager
from biokbase.narrative.app_util import map_inputs_from_job, map_outputs_from_state
import json
import uuid
from jinja2 import Template
from pprint import pprint

"""
KBase job class
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

COMPLETED_STATUS = "completed"
TERMINAL_STATES = [COMPLETED_STATUS, "terminated", "error"]

EXCLUDED_JOB_STATE_FIELDS = [
    "authstrat",
    "condor_job_ads",
    "job_input",
    "scheduler_type",
    "scheduler_id",
]

EXTRA_JOB_STATE_FIELDS = ["batch_id", "cell_id", "run_id", "token_id"]

JOB_DEFAULTS = {
    "app_id": None,
    "app_version": None,
    "batch_id": None,
    "batch_job": False,
    "child_jobs": [],
    "cell_id": None,
    "params": None,
    "meta": {},
    "owner": None,
    "run_id": None,
    "tag": "release",
    "token_id": None,
}

ALL_JOB_ATTRS = list(JOB_DEFAULTS.keys())
ALL_JOB_ATTRS.append("job_id")


class Job(object):
    app_id = None
    app_version = None
    batch_id = None
    cell_id = None
    job_id = None
    params = None
    run_id = None
    token_id = None
    _job_logs = list()
    _last_state = None

    def __init__(self, **kwargs):
        """
        Initializes a new Job with the attributes supplied in the kwargs.
        The app_id and app_version should both align with what's available in
        the Narrative Method Store service.
        """
        if kwargs.get("job_id", None) is None:
            raise ValueError("Cannot create a job without a job ID!")
        else:
            self.job_id = kwargs.get("job_id")

        # parent job: set the batch_id
        if kwargs.get("batch_job", False) is True:
            kwargs["batch_id"] = self.job_id

        for key, value in JOB_DEFAULTS.items():
            setattr(self, key, kwargs.get(key, value))

        ee2_state = kwargs.get("ee2_state", None)
        if not ee2_state:
            ee2_state = {
                "batch_id": self.batch_id,  # optional
                "batch_job": self.batch_job,  # optional
                "child_jobs": self.child_jobs,  # optional
                "job_id": self.job_id,
                "user": self.owner,
            }

        self.update_state(ee2_state)

    @classmethod
    def from_state(cls, job_state):
        """
        Parameters:
        -----------
        job_state - dict
            the job information returned from ee2.check_job
        """
        job_input = job_state.get("job_input", {})
        job_meta = job_input.get("narrative_cell_info", JOB_DEFAULTS["meta"])
        return cls(
            app_id=job_input.get("app_id", JOB_DEFAULTS["app_id"]),
            app_version=job_input.get("service_ver", JOB_DEFAULTS["app_version"]),
            batch_id=job_state.get("batch_id", JOB_DEFAULTS["batch_id"]),
            batch_job=job_state.get("batch_job", JOB_DEFAULTS["batch_job"]),
            cell_id=job_meta.get("cell_id", JOB_DEFAULTS["cell_id"]),
            child_jobs=job_state.get("child_jobs", JOB_DEFAULTS["child_jobs"]),
            ee2_state=job_state,
            job_id=job_state.get("job_id"),
            meta=job_meta,
            owner=job_state.get("user", JOB_DEFAULTS["owner"]),
            params=job_input.get("params", JOB_DEFAULTS["params"]),
            run_id=job_meta.get("run_id", JOB_DEFAULTS["run_id"]),
            tag=job_meta.get("tag", JOB_DEFAULTS["tag"]),
            token_id=job_meta.get("token_id", JOB_DEFAULTS["token_id"]),
        )

    # can be removed -- unused
    @classmethod
    def map_viewer_params(cls, job_state, job_inputs, app_id, app_tag):
        # get app spec.
        if job_state is None or job_state.get("status", "") != COMPLETED_STATUS:
            return None

        spec = SpecManager().get_spec(app_id, app_tag)
        (output_widget, widget_params) = map_outputs_from_state(
            job_state, map_inputs_from_job(job_inputs, spec), spec
        )
        return {"name": output_widget, "tag": app_tag, "params": widget_params}

    @property
    def final_state(self):
        if self.terminal_state is True:
            return self._last_state
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

    def status(self):
        return self.state().get("status", "unknown")

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

    def update_state(self, state=None):
        """
        given a state data structure (as emitted by ee2), update the stored state in the job object
        """
        if not state:
            return

        self.terminal_state = (
            True if state.get("status", "unknown") in TERMINAL_STATES else False
        )

        if self._last_state is None:
            self._last_state = state
        else:
            self._last_state.update(state)

    def reset_state(self):
        """
        reset the internal job state by removing the stored state and resetting self.terminal_state
        """
        self._last_state = None
        self.terminal_state = False

    def _augment_ee2_state(self, state):
        output_state = {key: value for key, value in state.items()}
        for field in EXCLUDED_JOB_STATE_FIELDS:
            if field in output_state:
                del output_state[field]
        if "job_output" not in output_state:
            output_state["job_output"] = {}
        for arg in EXTRA_JOB_STATE_FIELDS:
            output_state[arg] = getattr(self, arg)
        return dict(output_state)

    def state(self):
        """
        Queries the job service to see the status of the current job.
        Returns a <something> stating its status. (string? enum type? different traitlet?)
        """

        if self.terminal_state:
            return self._augment_ee2_state(self._last_state)

        try:
            state = clients.get("execution_engine2").check_job(
                {"job_id": self.job_id, "exclude_fields": EXCLUDED_JOB_STATE_FIELDS}
            )
            self.update_state(state)
            return self._augment_ee2_state(state)

        except Exception as e:
            raise Exception(f"Unable to fetch info for job {self.job_id} - {e}")

    def show_output_widget(self, state=None):
        """
        For a complete job, returns the job results.
        An incomplete job throws an exception
        """
        from biokbase.narrative.widgetmanager import WidgetManager

        if state is None:
            state = self.state()
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
        status = self.status()
        return status.lower() in TERMINAL_STATES

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
            state = self.state()
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

        return {attr: getattr(self, attr) for attr in [*ALL_JOB_ATTRS, "_last_state"]}
