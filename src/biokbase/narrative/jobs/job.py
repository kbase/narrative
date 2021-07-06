import biokbase.narrative.clients as clients
from .specmanager import SpecManager
from biokbase.narrative.app_util import map_inputs_from_job, map_outputs_from_state
from biokbase.narrative.exception_util import transform_job_exception
import copy
import json
import uuid
from jinja2 import Template
from pprint import pprint

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
# EXTRA_JOB_STATE_FIELDS = ["batch_id", "cell_id", "run_id", "token_id"]
EXTRA_JOB_STATE_FIELDS = ["cell_id", "parent_job_id", "run_id", "token_id"]


class Job(object):
    app_id = None
    app_version = None
    cell_id = None
    inputs = None
    job_id = None
    parent_job_id = None
    run_id = None
    token_id = None
    _job_logs = list()
    _last_state = None

    def __init__(
        self,
        job_id,
        app_id,
        inputs,
        owner,
        app_version=None,
        cell_id=None,
        meta=dict(),
        parent_job_id=None,
        run_id=None,
        tag="release",
        token_id=None,
        state=None
    ):
        """
        Initializes a new Job with a given id, app id, and app app_version.
        The app_id and app_version should both align with what's available in
        the Narrative Method Store service.

        Parameters:
        -----------
        job_id - string
            The job's unique identifier as returned at job start time.
        owner - string
            The owner of the job (username of person who started it)
        app_id - string
            Used in place of job_info.method. This is the actual method spec that was used to
            start the job. Can be None, but Bad Things might happen.
        cell_id - the cell associated with the job (optional)
        parent_job_id - the ID of the parent batch container (batch jobs only)
        run_id - the front-end id associated with the job (optional)
        tag - string
            The Tag (release, beta, dev) used to start the job.
        token_id - the id of the authentication token used to start the job (optional)
        state - the job state as returned by execution_engine2
        """
        self.app_id = app_id
        self.app_version = app_version
        self.cell_id = cell_id
        self.inputs = inputs
        self.job_id = job_id
        self.meta = meta
        self.owner = owner
        self.parent_job_id = parent_job_id
        self.run_id = run_id
        self.tag = tag
        self.token_id = token_id

        if state:
            state = self._exclude_from_ee2_state(state)
            state = self._augment_ee2_state(state)
            self._cache_state(state)

    @classmethod
    def from_state(cls, state: dict):
        """
        Variables:
        -----------
        state - expected to be in the format that comes straight from execution_engine2
        job_info - dict
            The job information returned from njs.get_job_params, just the first
            element of that list (not the extra list with URLs). Should have the following keys:
            'params': The set of parameters sent to that job.
            'service_ver': The version of the service that was run.
        """
        job_info = state.get("job_input", {})
        job_meta = job_info.get("narrative_cell_info", {})

        return cls(
            job_id=state.get("job_id"),
            app_id=job_info.get("app_id", job_info.get("method")),
            inputs=job_info.get("params", {}),
            owner=state.get("user"),
            app_version=job_info.get("service_ver", None),
            cell_id=job_meta.get("cell_id", None),
            meta=job_meta,
            parent_job_id=job_info.get("parent_job_id", None),
            run_id=job_meta.get("run_id", None),
            tag=job_meta.get("tag", "release"),
            token_id=job_meta.get("token_id", None),
            state=state,
        )

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

    def info(self):
        spec = self.app_spec()
        print(f"App name (id): {spec['info']['name']} ({self.app_id})")
        print(f"Version: {spec['info']['ver']}")

        try:
            state = self.state()
            print(f"Status: {state['status']}")
            print("Inputs:\n------")
            pprint(self.inputs)
        except BaseException:
            print("Unable to retrieve current running state!")

    def app_spec(self):
        return SpecManager().get_spec(self.app_id, self.tag)

    def parameters(self):
        """
        Returns the parameters used to start the job. Job tries to use its inputs field, but
        if that's None, then it makes a call to njs.

        If no exception is raised, this only returns the list of parameters, NOT the whole
        object fetched from NJS.get_job_params
        """
        if self.inputs is not None:
            return self.inputs
        else:
            try:
                self.inputs = clients.get("execution_engine2").get_job_params(
                    self.job_id
                )["params"]
                return self.inputs
            except Exception as e:
                raise Exception(
                    f"Unable to fetch parameters for job {self.job_id} - {e}"
                )

    def _exclude_from_ee2_state(self, state):
        state = copy.deepcopy(state)
        for field in EXCLUDED_JOB_STATE_FIELDS:
            if field in state:
                del state[field]
        return state

    def _augment_ee2_state(self, state):
        state = copy.deepcopy(state)
        state["job_output"] = state.get("job_output", {})
        for arg in EXTRA_JOB_STATE_FIELDS:
            state[arg] = getattr(self, arg)
        return state

    def _cache_state(self, state):
        if state.get("status") in TERMINAL_STATUSES:
            self._last_state = state
        else:
            self._last_state = None

    def state(self):
        """
        Queries the job service to see the state of the current job.
        """
        if self._last_state is not None and self._last_state.get("status") in TERMINAL_STATUSES:
            return copy.deepcopy(self._last_state)
        try:
            state = clients.get("execution_engine2").check_job(
                {"job_id": self.job_id, "exclude_fields": EXCLUDED_JOB_STATE_FIELDS}
            )
            state = self._augment_ee2_state(state)
            self._cache_state(state)
            return copy.deepcopy(state)
        except Exception as e:
            raise Exception(f"Unable to fetch info for job {self.job_id} - {e}")

    def revised_state(self, state=None) -> dict:
        """
        :param state: can be queried individually from ee2/cache with self.state(),
            but sometimes want it to be queried in bulk from ee2 upstream
        :return: dict, with structure

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
        """
        if not state:
            state = self.state()
        else:
            state = self._augment_ee2_state(state)  # diff: adds extra fields

        widget_info = None
        app_spec = {}

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
                            "error": "Unable to generate App output viewer!\nThe App appears to have completed successfully,\nbut we cannot construct its output viewer.\nPlease contact the developer of this App for assistance.",
                        },
                    }
                )

        state["child_jobs"] = []
        if "batch_size" in self.meta:
            state.update({"batch_size": self.meta["batch_size"]})
        job_state = {
            "state": state,
            "spec": app_spec,
            "widget_info": widget_info,
            "owner": self.owner,
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

    def has_state_cached(self):
        return self._last_state is not None

    def clear_cache(self):
        self._last_state = None

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

    # def _create_error_state(
    #     self,
    #     error: str,
    #     error_msg: str,
    #     code: int,
    # ) -> dict:
    #     """
    #     Creates an error state to return if
    #     1. the state is missing or unretrievable
    #     2. Job is none
    #     This creates the whole state dictionary to return, as described in
    #     _construct_cache_job_state.
    #     :param error: the full, detailed error (not necessarily human-readable, maybe a stacktrace)
    #     :param error_msg: a shortened error string, meant to be human-readable
    #     :param code: int, an error code
    #     """
    #     return {
    #         "status": "error",
    #         "error": {
    #             "code": code,
    #             "name": "Job Error",
    #             "message": error_msg,
    #             "error": error,
    #         },
    #         "errormsg": error_msg,
    #         "error_code": code,
    #         "job_id": self.job_id,
    #         "cell_id": self.cell_id,
    #         "run_id": self.run_id,
    #         "created": 0,
    #         "updated": 0,
    #     }

    # def _child_states(self, sub_job_list):
    #     """
    #     Fetches state for all jobs in the list. These are expected to be child jobs, with no actual Job object associated.
    #     So if they're done, we need to do the output mapping out of band.
    #     But the check_jobs call with params will return the app id. So that helps.
    #     app_id = the id of the app that all the child jobs are running (format: module/method, like "MEGAHIT/run_megahit")
    #     app_tag = one of "release", "beta", "dev"
    #     (the above two aren't stored with the subjob metadata, and won't until we back some more on KBParallel - I want to
    #     lobby for pushing toward just starting everything up at once from here and letting HTCondor deal with allocation)
    #     sub_job_list = list of ids of jobs to look up
    #     """

    #     # TODO
    #     # THIS IS A DRAFT METHOD
    #     # NEEDS TO BE RUN/VERIFIED

    #     if not sub_job_list:
    #         return []
    #     sub_job_list = sorted(sub_job_list)
    #     app_id = self.meta.get("batch_app")
    #     app_tag = self.meta.get("batch_tag")

    #     states = clients.get("execution_engine2").check_jobs(
    #         {
    #             "job_ids": sub_job_list,
    #             "exclude_fields": EXCLUDED_JOB_STATE_FIELDS,
    #             "return_list": 0,
    #         }
    #     )

    #     for job_id in sub_job_list:
    #         state = states.get(job_id, {})
    #         params = state.get("job_input", {}).get("params", [])
    #         # if it's error, get the error.
    #         if state.get("errormsg"):
    #             continue
    #         # if it's done, get the output mapping.
    #         if state.get("status") == COMPLETED_STATUS:
    #             try:
    #                 widget_info = Job.map_viewer_params(state, params, app_id, app_tag)
    #             except ValueError:
    #                 widget_info = {}
    #             state.update({"widget_info": widget_info})
    #         states.append(state)
    #     return states
