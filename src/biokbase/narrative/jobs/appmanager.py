"""
A module for managing apps, specs, requirements, and for starting jobs.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

from .job import Job
import biokbase.narrative.clients as clients
from .jobmanager import JobManager
from .specmanager import SpecManager
import os
import biokbase.auth
from .app_util import (
    app_version_tags,
    check_tag,
    system_variable
)
from IPython.display import HTML
from jinja2 import Template
import json
import re
from biokbase.narrative.common import kblogging
import logging
from ipykernel.comm import Comm
import datetime
import traceback

class AppManager(object):
    """
    The main class for managing how KBase apps get run. This contains functions
    for showing app descriptions, their usage (how to invoke various parameters),
    and, ultimately, for running the app.

    A typical flow might be like this.
    am = AppManager()
    am.available_apps()
        # show the set of apps with a brief description of each.
    am.app_usage(app_id)
        # show how to use a app and set its parameters.
    job = am.run_app(app_id, input1=value1, input2=value2, ...)
        # run an app with given inputs.
    """
    __instance = None

    nms = clients.get('narrative_method_store')
    njs = clients.get('job_service')
    ws_client = clients.get('workspace')
    spec_manager = SpecManager()
    _log = kblogging.get_logger(__name__)
    _log.setLevel(logging.INFO)
    _comm = None


    def __new__(cls):
        if AppManager.__instance is None:
            AppManager.__instance = object.__new__(cls)
            AppManager.__instance._comm = None
        return AppManager.__instance

    def reload(self):
        """
        Reloads all app specs into memory from the App Catalog.
        Any outputs of app_usage, app_description, or available_apps
        should be run again after the update.
        """
        self.spec_manager.reload()

    def app_usage(self, app_id, tag='release'):
        """
        This shows the list of inputs and outputs for a given app with a given
        tag. By default, this is done in a pretty HTML way, but this app can be wrapped
        in str() to show a bare formatted string.

        If either the app_id is unknown, or isn't found with the given release tag,
        or if the tag is unknown, a ValueError will be raised.

        Parameters:
        -----------
        app_id : string
            A KBase app id, generally of the format Module_name/app_name
            (see available_apps for a list)
        tag : Which version of the app to view - either release, beta, or dev (default=release)
        """
        return self.spec_manager.app_usage(app_id, tag)


    def app_description(self, app_id, tag='release'):
        """
        Returns the app description in a printable HTML format.

        If either the app_id is unknown, or isn't found with the given release tag,
        or if the tag is unknown, a ValueError will be raised.

        Parameters:
        -----------
        app_id : string
            A KBase app id, generally of the format Module_name/app_name
            (see available_apps for a list)
        tag : Which version of the app to view - either release, beta, or dev (default=release)
        """
        return self.spec_manager.app_description(app_id, tag)

    def available_apps(self, tag="release"):
        """
        Lists the set of available apps for a given tag in a simple table.
        If the tag is not found, a ValueError will be raised.

        Parameters:
        -----------
        tag : Which version of the list of apps to view - either release, beta, or dev (default=release)

        """
        return self.spec_manager.available_apps(tag)



    def run_app(self, *args, **kwargs):
        try:
            return self._run_app_internal(*args, **kwargs)
        except Exception as e:
            cell_id = kwargs.get('cell_id', None)
            run_id = kwargs.get('run_id', None)
            e_type = type(e).__name__
            e_message = str(e).replace('<', '&lt;').replace('>', '&gt;')
            e_trace = traceback.format_exc().replace('<', '&lt;').replace('>', '&gt;')
            self._send_comm_message('run_status', {
                'event': 'error',
                'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
                'cell_id': cell_id,
                'run_id': run_id,
                'error_message': e_message,
                'error_type': e_type,
                'error_stacktrace': e_trace
            })
            raise

    def _run_app_internal(self, app_id, tag="release", version=None, cell_id=None, run_id=None, **kwargs):
        """
        Attemps to run the app, returns a Job with the running app info.
        Should *hopefully* also inject that app into the Narrative's metadata.
        Probably need some kind of JavaScript-foo to get that to work.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'build_a_metabolic_model'
                    or 'MegaHit/run_megahit'.
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules have
                  versions, so if the tag is not 'release', and a version is given,
                  a ValueError will be raised.
        **kwargs - these are the set of parameters to be used with the app.
                   They can be found by using the app_usage function. If any
                   non-optional apps are missing, a ValueError will be raised.

        Example:
        --------
        my_job = mm.run_app('MegaHit/run_megahit', version=">=1.0.0", read_library_name="My_PE_Library", output_contigset_name="My_Contig_Assembly")
        """

        self._send_comm_message('run_status', {
            'event': 'validating_app',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        ### TODO: this needs restructuring so that we can send back validation failure
        ### messages. Perhaps a separate function and catch the errors, or return an
        ### error structure.

        # Intro tests:
        self.spec_manager.check_app(app_id, tag, raise_exception=True)

        if version is not None and tag != "release":
            raise ValueError("App versions only apply to released app modules!")

        # Get the spec & params
        spec = self.spec_manager.get_spec(app_id, tag)
        if not 'behavior' in spec or not 'kb_service_input_mapping' in spec['behavior']:
            raise Exception("This app is not SDK-compatible!")
        spec_params = self.spec_manager.app_params(spec)


        # Preflight check the params - all required ones are present, all values are the right type, all numerical values are in given ranges
        spec_param_ids = [ p['id'] for p in spec_params ]

        # First, test for presence.
        missing_params = list()
        for p in spec_params:
            if not p['optional'] and not p['default'] and not kwargs.get(p['id'], None):
                missing_params.append(p['id'])
        if len(missing_params):
            raise ValueError('Missing required parameters {} - try executing app_usage("{}", tag="{}") for more information'.format(json.dumps(missing_params), app_id, tag))

        # Next, test for extra params that don't make sense
        extra_params = list()
        for p in kwargs.keys():
            if p not in spec_param_ids:
                extra_params.append(p)
        if len(extra_params):
            raise ValueError('Unknown parameters {} - maybe something was misspelled?\nexecute app_usage("{}", tag="{}") for more information'.format(json.dumps(extra_params), app_id, tag))

        # Now, validate parameter values.
        # Should also check if input (NOT OUTPUT) object variables are present in the current workspace
        workspace = system_variable('workspace')
        ws_id = system_variable('workspace_id')
        if workspace is None or ws_id is None:
            raise ValueError('Unable to retrive current Narrative workspace information! workspace={}, workspace_id={}'.format(workspace, ws_id))

        param_errors = list()
        # If they're workspace objects, track their refs in a list we'll pass to run_job as
        # a separate param to track provenance.
        ws_input_refs = list()
        for p in spec_params:
            if p['id'] in kwargs:
                (wsref, err) = self._check_parameter(p, kwargs[p['id']], workspace)
                if err is not None:
                    param_errors.append("{} - {}".format(p['id'], err))
                if wsref is not None:
                    if isinstance(wsref, list):
                        for ref in wsref:
                            if ref is not None:
                                ws_input_refs.append(ref)
                    else:
                        ws_input_refs.append(wsref)
        if len(param_errors):
            raise ValueError('Parameter value errors found! {}'.format(json.dumps(param_errors)))

        # Hooray, parameters are validated. Set them up for transfer.
        params = kwargs
        for p in spec_params:
            # If any param is a checkbox, need to map from boolean to actual expected value in p['checkbox_map']
            # note that True = 0th elem, False = 1st
            if p['type'] == 'checkbox':
                if p['id'] in params:
                    checkbox_idx = 0 if params[p['id']] else 1
                    params[p['id']] = p['checkbox_map'][checkbox_idx]
            # While we're at it, set the default values for any unset parameters that have them
            if p['default'] and p['id'] not in params:
                params[p['id']] = p['default']


        self._send_comm_message('run_status', {
            'event': 'validated_app',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        # Okay, NOW we can start the show
        input_vals = dict()
        for param in spec['behavior']['kb_service_input_mapping']:
            p_value = None
            p_id = param.get('target_property', 'invalid_mapping')
            if 'input_parameter' in param:
                p_value = params.get(param['input_parameter'], None)
            elif 'narrative_system_variable' in param:
                p_value = system_variable(param['narrative_system_variable'])
            input_vals[p_id] = p_value

        service_method = spec['behavior']['kb_service_method']
        service_name = spec['behavior']['kb_service_name']
        service_ver = spec['behavior'].get('kb_service_version', None)
        #if (service_ver == None):
        #    raise ValueError('Invalid method - service version (behavior.kb_service_version) not found in spec')

        service_url = spec['behavior']['kb_service_url']

        app_id_dot = service_name + '.' + service_method
        # app_id_dot = app_id.replace('/', '.')


        # typedef structure {
        #     string method;
        #     list<UnspecifiedObject> params;
        #     string service_ver;
        #     RpcContext rpc_context;
        #     string remote_url;
        #     list<wsref> source_ws_objects;
        #     string app_id;
        #     mapping<string, string> meta;
        #     int wsid;
        # } RunJobParams;

        job_meta = {'tag': tag}
        if cell_id is not None:
            job_meta['cell_id'] = cell_id
        if run_id is not None:
            job_meta['run_id'] = run_id

        job_runner_inputs = {
            'method' : app_id_dot,
            'service_ver' : service_ver,
            'params' : [input_vals],
            'app_id' : app_id,
            'wsid': ws_id,
            'meta': job_meta
        }
        if len(ws_input_refs) > 0:
            job_runner_inputs['source_ws_objects'] = ws_input_refs

        log_info = {
            'app_id': app_id,
            'tag': tag,
            'version': service_ver,
            'username': system_variable('user_id'),
            'wsid': ws_id
        }
        self._log.setLevel(logging.INFO)
        kblogging.log_event(self._log, "run_app", log_info)

        self._send_comm_message('run_status', {
            'event': 'launching_job',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        try:
            job_id = self.njs.run_job(job_runner_inputs)
        except Exception as e:
            log_info.update({'err': str(e)})
            self._log.setLevel(logging.ERROR)
            kblogging.log_event(self._log, "run_app_error", log_info)
            raise

        self._send_comm_message('run_status', {
            'event': 'launched_job',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id,
            'job_id': job_id
        })


        # new_job = Job(app_state['job_id'], app_id, params, tag=tag, app_version=service_ver, cell_id=cell_id)
        new_job = Job(job_id, app_id, [params], tag=tag, app_version=service_ver, cell_id=cell_id)
        JobManager().register_new_job(new_job)
        if cell_id is not None:
            return
        else:
            return new_job

    def _check_parameter(self, param, value, workspace):
        """
        Checks if the given value matches the rules provided in the param dict.
        If yes, returns None
        If no, returns a String with an error.

        This is a pretty light wrapper around _validate_param_value that handles the case
        where the given value is a list.

        Parameters:
        -----------
        param : dict
            A dict representing a single KBase App parameter, generated by the Spec Manager
        value : any
            A value input by the user
        workspace : string
            The name of the current workspace to search against (if needed)
        """
        if param['allow_multiple'] and isinstance(value, list):
            ws_refs = list()
            error_list = list()
            for v in value:
                (ref, err) = self._validate_param_value(param, v, workspace)
                if err:
                    error_list.append(err)
                if ref:
                    ws_refs.append(ref)
            if len(error_list):
                return ", ".join(error_list)
            else:
                return (ws_refs, None)
        return self._validate_param_value(param, value, workspace)


    def _validate_param_value(self, param, value, workspace):
        """
        Tests a value to make sure it's valid, based on the rules given in the param dict.
        Returns None if valid, an error string if not.

        Parameters:
        -----------
        param : dict
            A dict representing a single KBase App parameter, generated by the Spec Manager.
            This contains the rules for processing any given values.
        value : any
            A value input by the user - likely either None, int, float, string, or list
        workspace : string
            The name of the current workspace to test workspace object types against, if
            required by the parameter.
        """
        # The workspace reference for the parameter. Can be None, and returned as such.
        ws_ref = None

        # allow None to pass, we'll just pass it to the method and let it get rejected there.
        if value is None:
            return (ws_ref, None)

        # Also, for strings, last I heard, an empty string is the same as null/None
        if param['type'] == 'string' and isinstance(value, basestring) and value == '':
            return (ws_ref, '')

        # cases - value == list, int, float, others get rejected
        if not (isinstance(value, basestring) or
                isinstance(value, int) or
                isinstance(value, float)):
            return (ws_ref, "input type not supported - only str, int, float, or list")

        # check types. basestring is pretty much anything (it'll just get casted),
        # but ints, floats, or lists are funky.
        if param['type'] == 'int' and not isinstance(value, int):
            return (ws_ref, 'Given value {} is not an int'.format(value))
        elif param['type'] == 'float' and not (isinstance(value, float) or isinstance(value, int)):
            return (ws_ref, 'Given value {} is not a number'.format(value))

        # if it's expecting a workspace object, check if that's present, and a valid type
        if 'allowed_types' in param and len(param['allowed_types']) > 0 and not param['is_output']:
            try:
                info = self.ws_client.get_object_info_new({'objects': [{'workspace':workspace, 'name':value}]})[0]
                ws_ref = "{}/{}/{}".format(info[6], info[0], info[4])
                type_ok = False
                for t in param['allowed_types']:
                    if re.match(t, info[2]):
                        type_ok = True
                if not type_ok:
                    return (ws_ref, 'Type of data object, {}, does not match allowed types'.format(info[2]))
            except Exception as e:
                return (ws_ref, 'Data object named {} not found with this Narrative.')

        # if it expects a set of allowed values, check if this one matches
        if 'allowed_values' in param:
            if value not in param['allowed_values']:
                return (ws_ref, "Given value '{}' is not permitted in the allowed set.".format(value))

        # if it expects a numerical value in a certain range, check that.
        if 'max_val' in param:
            try:
                if float(value) > param['max_val']:
                    return (ws_ref, "Given value {} should be <= {}".format(value, param['max_val']))
            except:
                return (ws_ref, "Given value {} must be a number".format(value))

        if 'min_val' in param:
            try:
                if float(value) < param['min_val']:
                    return (ws_ref, "Given value {} should be >= {}".format(value, param['min_val']))
            except:
                return (ws_ref, "Given value {} must be a number".format(value))

        # if it's an output object, make sure it follows the data object rules.
        if param['is_output']:
            if re.search('\s', value):
                return (ws_ref, "Spaces are not allowed in data object names.")
            if re.match('^\d+$', value):
                return (ws_ref, "Data objects cannot be just a number.")
            if not re.match('^[a-z0-9|\.|\||_\-]*$', value, re.IGNORECASE):
                return (ws_ref, "Data object names can only include symbols: _ - . |")

        # Last, regex. not being used in any extant specs, but cover it anyway.
        if 'regex_constraint' in param:
            for regex in regex_constraint:
                if not re.match(regex_constraint, value):
                    return (ws_ref, 'Value {} does not match required regex {}'.format(value, regex))

        # Whew. Passed all filters!
        return (ws_ref, None)

    def _send_comm_message(self, msg_type, content):
        JobManager()._send_comm_message(msg_type, content)