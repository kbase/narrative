"""
KBase job class
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

import biokbase.narrative.clients as clients
from .specmanager import SpecManager
from .app_util import (
    system_variable,
    map_inputs_from_job,
    map_outputs_from_state
)
import json
import uuid
from IPython.display import (
    Javascript,
    HTML
)
from jinja2 import Template
from ipykernel.comm import Comm


class Job(object):
    job_id = None
    app_id = None
    app_version = None
    cell_id = None
    inputs = None
    # _comm = None
    _job_logs = list()

    def __init__(self, job_id, app_id, inputs, tag='release', app_version=None, cell_id=None):
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
        # self.job_manager = KBjobManager()
        self.inputs = inputs
        self._njs = clients.get('job_service')

    @classmethod
    def from_state(Job, job_id, job_info, app_id, tag='release', cell_id=None):
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
        app_id - string
            Used in place of job_info.method. This is the actual method spec that was used to
            start the job. Can be None, but Bad Things might happen.
        tag - string
            The Tag (release, beta, dev) used to start the job.
        cell_id - the cell associated with the job (optional)
        """
        # app_id = job_info.get('method', "Unknown App")
        # Still juggling between Module.method_name and Module/method_name
        # There should be one and only one / after this is done.
        # So, if there's a /, do nothing.
        # If not, change the first . to a /
        # if not '/' in app_id and '.' in app_id:
        #     app_id = app_id.replace('.', '/', 1)
        return Job(job_id,
                   app_id,
                   job_info['params'],
                   tag=tag,
                   app_version=job_info.get('service_ver', None),
                   cell_id=cell_id)

    def info(self):
        spec = self.app_spec()
        print "App name (id): {}".format(spec['info']['name'], self.app_id)
        print "Version: {}".format(spec['info']['ver'])

        try:
            state = self.state()
            print "Status: {}".format(state['job_state'])
            # inputs = map_inputs_from_state(state, spec)
            print "Inputs:\n------"
            for p in self.inputs[0]:
                print "{}: {}".format(p, self.inputs[0][p])
        except:
            print "Unable to retrieve current running state!"

    def app_spec(self):
        return SpecManager().get_spec(self.app_id, self.tag)

    def status(self):
        return self._njs.check_job(self.job_id)['job_state']

    def parameters(self):
        try:
            return self._njs.get_job_params(self.job_id)
        except Exception as e:
            raise Exception("Unable to fetch parameters for job {} - {}".format(self.job_id, e))

    def state(self):
        """
        Queries the job service to see the status of the current job.
        Returns a <something> stating its status. (string? enum type? different traitlet?)
        """
        try:
            state = self._njs.check_job(self.job_id)
            state[u'cell_id'] = self.cell_id
            return state
        except Exception as e:
            raise Exception("Unable to fetch info for job {} - {}".format(self.job_id, e))

    def output_viewer(self, state=None):
        """
        For a complete job, returns the job results.
        An incomplete job throws an exception
        """
        from biokbase.narrative.widgetmanager import WidgetManager
        if state is None:
            state = self.state()
        if state['job_state'] == 'completed' and 'result' in state:
            (output_widget, widget_params) = self._get_output_info(state)
            return WidgetManager().show_output_widget(output_widget, tag=self.tag, **widget_params)
        else:
            return "Job is incomplete! It has status '{}'".format(state['job_state'])

    def get_viewer_params(self, state):
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
        return map_outputs_from_state(state, map_inputs_from_job(self.parameters()[0]['params'], spec), spec)

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
            First line of log to return (0-indexed). If < 0, starts at the beginning. If > total lines,
            returns an empty list.
        num_lines - int or None
            Limit on the number of lines to return (if None, return everything). If <= 0, returns no lines.
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
        log_update = self._njs.get_job_logs({'job_id': self.job_id, 'skip_lines': len(self._job_logs)})
        if log_update['lines']:
            self._job_logs = self._job_logs + log_update['lines']

    def cancel(self):
        """
        Cancels a currently running job. Fails silently if there's no job running.
        (No way to cancel something started with run_job right now).
        """
        status = self.status()
        if status in ['completed', 'error', 'suspend']:
            clients.get('user_and_job_state').delete_job(self.job_id)
        else:
            raise Exception('Currently unable to cancel running jobs!')

    def is_finished(self):
        """
        Returns True if the job is finished (in any state, including errors or cancelled),
        False if its running/queued.
        """
        status = self.status()
        return status.lower() in ['completed', 'error', 'suspend']

    def __repr__(self):
        return u"KBase Narrative Job - " + unicode(self.job_id)

    def _repr_javascript_(self):
        tmpl = """
        element.html("<div id='{{elem_id}}' class='kb-vis-area'></div>");

        require(['jquery', 'kbaseNarrativeJobStatus'], function($, KBaseNarrativeJobStatus) {
            var w = new KBaseNarrativeJobStatus($('#{{elem_id}}'), {'jobId': '{{job_id}}', 'state': {{state}}, 'info': {{info}}});
        });
        """
        try:
            state = self.state()
            spec = self.app_spec()
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
        return Template(tmpl).render(job_id=self.job_id, elem_id='kb-job-{}-{}'.format(self.job_id, uuid.uuid4()), state=json.dumps(state), info=json.dumps(info))