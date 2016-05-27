"""
KBase job class
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

import biokbase.narrative.clients as clients
from .specmanager import SpecManager
from .app_util import (
    system_variable,
    map_inputs_from_state
)
from biokbase.narrative.common.generic_service_calls import (
    get_sub_path
)
# from biokbase.narrative.common.kbjob_manager import KBjobManager
import json
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
    _comm = None

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
        self._init_comm()

    @classmethod
    def from_state(Job, job_id, job_info, tag='release', cell_id=None):
        """
        Parameters:
        -----------
        job_id - string
            The job's unique identifier as returned at job start time.
        job_info - dict
            The job information returned from njs.get_job_params, just the first
            element of that list (not the extra list with URLs). Should have the following keys:
            'method': The method id (will be converted from '.' to '/' format)
            'params': The set of parameters sent to that job.
            'service_ver': The version of the service that was run.
        """
        app_id = job_info.get('method', "Unknown App")

        # Still juggling between Module.method_name and Module/method_name
        # There should be one and only one / after this is done.
        # So, if there's a /, do nothing.
        # If not, change the first . to a /
        if not '/' in app_id and '.' in app_id:
            app_id = app_id.replace('.', '/', 1)
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
        except Exception, e:
            raise Exception("Unable to fetch parameters for job {} - {}".format(self.job_id, e))

    def state(self):
        """
        Queries the job service to see the status of the current job.
        Returns a <something> stating its status. (string? enum type? different traitlet?)
        """
        try:
            return self._njs.check_job(self.job_id)
        except Exception, e:
            raise Exception("Unable to fetch info for job {} - {}".format(self.job_id, e))

    def output_viewer(self):
        """
        For a complete job, returns the job results.
        An incomplete job throws an exception
        """
        from biokbase.narrative.widgetmanager import WidgetManager
        state = self.state()
        if state['job_state'] == 'completed' and 'result' in state:
            # prep the output widget params
            widget_params = dict()
            app_spec = self.app_spec()
            for out_param in app_spec['behavior'].get('kb_service_output_mapping', []):
                p_id = out_param['target_property']
                if 'narrative_system_variable' in out_param:
                    widget_params[p_id] = system_variable(out_param['narrative_system_variable'])
                elif 'constant_value' in out_param:
                    widget_params[p_id] = out_param['constant_value']
                elif 'input_parameter' in out_param:
                    widget_params[p_id] = self.inputs.get(out_param['input_parameter'], None)
                elif 'service_method_output_path' in out_param:
                    # widget_params[p_id] = get_sub_path(json.loads(state['step_outputs'][self.app_id]), out_param['service_method_output_path'], 0)
                    widget_params[p_id] = get_sub_path(state['result'], out_param['service_method_output_path'], 0)
            output_widget = app_spec.get('widgets', {}).get('output', 'kbaseDefaultNarrativeOutput')
            return WidgetManager().show_output_widget(output_widget, tag=self.tag, **widget_params)

        else:
            return "Job is incomplete! It has status '{}'".format(state['job_state'])

    def log(self):
        pass

    def cancel(self):
        """
        Cancels a currently running job. Fails silently if there's no job running.
        (No way to cancel something started with run_job right now).
        """
        pass

    def is_finished(self):
        """
        Returns True if the job is finished (in any state, including errors or cancelled),
        False if its running/queued.
        """
        status = self.status()
        return status.lower() in ['completed', 'error', 'suspend']

    def _init_comm(self):
        if self._comm is not None:
            self._comm.close()
            self._comm = None
        self._comm = Comm(target_name='KBaseJob-' + self.job_id, data={})
        self._comm.on_msg(self._handle_comm_message)

    def _handle_comm_message(self, msg):
        pass

    def _send_comm_message(self, msg_type, msg):
        if self._comm is None:
            self.init_comm()
        self._comm.send({'msg_type':msg_type, 'content':msg})

    def __repr__(self):
        return u"KBase Narrative Job - " + unicode(self.job_id)

    def _repr_javascript_(self):
        tmpl = """
        element.html("<div id='kb-job-{{job_id}}' class='kb-vis-area'></div>");

        require(['jquery', 'kbaseNarrativeJobStatus'], function($, KBaseNarrativeJobStatus) {
            var w = new KBaseNarrativeJobStatus($('#kb-job-{{job_id}}'), {'jobId': '{{job_id}}', 'state': {{state}}});
        });
        """
        try:
            state = self.state()
        except Exception, e:
            state = {}
        return Template(tmpl).render(job_id=self.job_id, state=json.dumps(state))