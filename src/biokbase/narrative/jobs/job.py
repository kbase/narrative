import biokbase.narrative.clients as clients
from .specmanager import SpecManager
from biokbase.narrative.app_util import (
    map_inputs_from_job,
    map_outputs_from_state
)
import json
import uuid
from jinja2 import Template
from pprint import pprint

"""
KBase job class
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"


class Job(object):
    job_id = None
    app_id = None
    app_version = None
    cell_id = None
    run_id = None
    inputs = None
    token_id = None
    _job_logs = list()
    _last_state = None

    def __init__(self, job_id, app_id, inputs, owner, tag='release', app_version=None,
                 cell_id=None, run_id=None, token_id=None, meta=dict()):
        """
        Initializes a new Job with a given id, app id, and app app_version.
        The app_id and app_version should both align with what's available in
        the Narrative Method Store service.
        """
        self.job_id = job_id
        self.app_id = app_id
        self.app_version = app_version
        self.tag = tag
        self.cell_id = cell_id
        self.run_id = run_id
        self.inputs = inputs
        self.owner = owner
        self.token_id = token_id
        self.meta = meta

    @classmethod
    def from_state(Job, job_id, job_info, owner, app_id, tag='release',
                   cell_id=None, run_id=None, token_id=None, meta=dict()):
        """
        Parameters:
        -----------
        job_id - string
            The job's unique identifier as returned at job start time.
        job_info - dict
            The job information returned from njs.get_job_params, just the first
            element of that list (not the extra list with URLs). Should have the following keys:
            'params': The set of parameters sent to that job.
            'service_ver': The version of the service that was run.
        owner - string
            The owner of the job (username of person who started it)
        app_id - string
            Used in place of job_info.method. This is the actual method spec that was used to
            start the job. Can be None, but Bad Things might happen.
        tag - string
            The Tag (release, beta, dev) used to start the job.
        cell_id - the cell associated with the job (optional)
        run_id - the front-end id associated with the job (optional)
        token_id - the id of the authentication token used to start the job (optional)
        """
        return Job(job_id,
                   app_id,
                   job_info['params'],
                   owner,
                   tag=tag,
                   app_version=job_info.get('service_ver', None),
                   cell_id=cell_id,
                   run_id=run_id,
                   token_id=token_id,
                   meta=meta)

    @classmethod
    def map_viewer_params(Job, job_state, job_inputs, app_id, app_tag):
        # get app spec.
        if job_state is None or job_state['job_state'] != 'completed':
            return None

        spec = SpecManager().get_spec(app_id, app_tag)
        (output_widget, widget_params) = map_outputs_from_state(job_state, map_inputs_from_job(job_inputs, spec), spec)
        return {
            'name': output_widget,
            'tag': app_tag,
            'params': widget_params
        }


    def info(self):
        spec = self.app_spec()
        print("App name (id): {}".format(spec['info']['name'], self.app_id))
        print("Version: {}".format(spec['info']['ver']))

        try:
            state = self.state()
            print("Status: {}".format(state['job_state']))
            # inputs = map_inputs_from_state(state, spec)
            print("Inputs:\n------")
            pprint(self.inputs)
        except:
            print("Unable to retrieve current running state!")

    def app_spec(self):
        return SpecManager().get_spec(self.app_id, self.tag)

    def status(self):
        return self.state().get('job_state', 'unknown')

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
                self.inputs = clients.get("job_service").get_job_params(self.job_id)[0]['params']
                return self.inputs
            except Exception as e:
                raise Exception("Unable to fetch parameters for job {} - {}".format(self.job_id, e))

    def state(self):
        """
        Queries the job service to see the status of the current job.
        Returns a <something> stating its status. (string? enum type? different traitlet?)
        """
        if self._last_state is not None and self._last_state.get('finished', 0) == 1:
            return self._last_state
        try:
            state = clients.get("job_service").check_job(self.job_id)
            if 'cancelled' in state:
                state[u'canceled'] = state.get('cancelled', 0)
                del state['cancelled']
            if state.get('job_state', '') == 'cancelled':
                state[u'job_state'] = 'canceled'
            state[u'cell_id'] = self.cell_id
            state[u'run_id'] = self.run_id
            state[u'token_id'] = self.token_id
            self._last_state = state
            return dict(state)
        except Exception as e:
            raise Exception("Unable to fetch info for job {} - {}".format(self.job_id, e))

    def show_output_widget(self, state=None):
        """
        For a complete job, returns the job results.
        An incomplete job throws an exception
        """
        from biokbase.narrative.widgetmanager import WidgetManager
        if state is None:
            state = self.state()
        if state['job_state'] == 'completed' and 'result' in state:
            (output_widget, widget_params) = self._get_output_info(state)
            return WidgetManager().show_output_widget(output_widget, widget_params, tag=self.tag)
        else:
            return "Job is incomplete! It has status '{}'".format(state['job_state'])

    def get_viewer_params(self, state):
        """
        Maps job state 'result' onto the inputs for a viewer.
        """
        if state is None or state['job_state'] != 'completed':
            return None
        (output_widget, widget_params) = self._get_output_info(state)
        return {
            'name': output_widget,
            'tag': self.tag,
            'params': widget_params
        }

    def _get_output_info(self, state):
        spec = self.app_spec()
        return map_outputs_from_state(state, map_inputs_from_job(self.parameters(), spec), spec)

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
        return (num_available_lines, self._job_logs[first_line:first_line+num_lines])

    def _update_log(self):
        log_update = clients.get("job_service").get_job_logs(
            {'job_id': self.job_id,
             'skip_lines': len(self._job_logs)})
        if log_update['lines']:
            self._job_logs = self._job_logs + log_update['lines']

    def is_finished(self):
        """
        Returns True if the job is finished (in any state, including errors or canceled),
        False if its running/queued.
        """
        status = self.status()
        return status.lower() in ['completed', 'error', 'suspend', 'cancelled']

    def __repr__(self):
        return u"KBase Narrative Job - " + unicode(self.job_id)

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
            if (state.get('job_state', '') == 'completed'):
                (output_widget, widget_params) = self._get_output_info(state)
                output_widget_info = {
                    'name': output_widget,
                    'params': widget_params
                }

            info = {
                'app_id': spec['info']['id'],
                'version': spec['info'].get('ver', None),
                'name': spec['info']['name']
            }
        except Exception as e:
            state = {}
            info = {
                'app_id': None,
                'version': None,
                'name': 'Unknown App'
            }
        return Template(tmpl).render(job_id=self.job_id,
                                     elem_id='kb-job-{}-{}'.format(self.job_id, uuid.uuid4()),
                                     state=json.dumps(state),
                                     info=json.dumps(info),
                                     output_widget_info=json.dumps(output_widget_info))
