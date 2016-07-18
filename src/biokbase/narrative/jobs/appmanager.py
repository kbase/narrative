"""
A module for managing apps, specs, requirements, and for starting jobs.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

from .job import Job
import biokbase.narrative.clients as clients
from biokbase.narrative.widgetmanager import WidgetManager
from .jobmanager import JobManager
from .specmanager import SpecManager
import os
import biokbase.auth
from biokbase.narrative.app_util import (
    app_version_tags,
    check_tag,
    system_variable,
    map_outputs_from_state
)
from IPython.display import HTML
from jinja2 import Template
import json
import re
from biokbase.narrative.common import kblogging
import logging
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
    viewer_count = 1

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

    def run_local_app(self, app_id, tag="release", version=None, cell_id=None, run_id=None, **kwargs):
        """
        Attempts to run a local app. These do not return a Job object, but just the result of the app.
        In most cases, this will be a Javascript display of the result, but could be anything.

        If the app_spec looks like it makes a service call, then this raises a ValueError.
        Otherwise, it validates each parameter in **kwargs against the app spec, executes it, and
        returns the result.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'view_expression_profile'
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules have
                  versions, so if the tag is not 'release', and a version is given,
                  a ValueError will be raised.
        **kwargs - these are the set of parameters to be used with the app.
                   They can be found by using the app_usage function. If any
                   non-optional apps are missing, a ValueError will be raised.

        Example:
        run_local_app('NarrativeViewers/view_expression_profile', version='0.0.1', input_expression_matrix="MyMatrix", input_gene_ids="1234")
        """
        try:
            return self._run_local_app_internal(app_id, tag, version, cell_id, run_id, **kwargs)
        except Exception as e:
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
            # raise
            print("Error while trying to start your app (run_local_app)!\n-------------------------------------\n" + str(e))

    def _run_local_app_internal(self, app_id, tag, version, cell_id, run_id, **kwargs):
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

        if 'behavior' not in spec:
            raise ValueError("This app appears invalid - it has no defined behavior")

        behavior = spec['behavior']

        if 'kb_service_input_mapping' in behavior:
            # it's a service! Should run this with run_app!
            raise ValueError('This app appears to be a long-running job! Please start it using the run_app function instead.')

        if 'script_module' in behavior or 'script_name' in behavior:
            # It's an old NJS script. These don't work anymore.
            raise ValueError('This app relies on a service that is now obsolete. Please contact the administrator.')

        # Here, we just deal with two behaviors:
        # 1. None of the above - it's a viewer.
        # 2. ***TODO*** python_class / python_function. Import and exec the python code.

        # for now, just map the inputs to outputs.
        # First, validate.
        # Preflight check the params - all required ones are present, all values are the right type, all numerical values are in given ranges
        spec_params = self.spec_manager.app_params(spec)
        (params, ws_refs) = self._validate_parameters(app_id, tag, spec_params, kwargs)

        # Log that we're trying to run a job...
        log_info = {
            'app_id': app_id,
            'tag': tag,
            'username': system_variable('user_id'),
            'ws': system_variable('workspace')
        }
        self._log.setLevel(logging.INFO)
        kblogging.log_event(self._log, "run_local_app", log_info)

        self._send_comm_message('run_status', {
            'event': 'success',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        # now just map onto outputs.
        (output_widget, widget_params) = map_outputs_from_state([], params, spec)
        return WidgetManager().show_output_widget(output_widget, tag=tag, **widget_params)

    def run_widget_app(self, app_id, tag="release", version=None, cell_id=None, run_id=None):
        """
        Attempts to run a local app. These do not return a Job object, but just the result of the app.
        In most cases, this will be a Javascript display of the result, but could be anything.

        If the app_spec looks like it makes a service call, then this raises a ValueError.
        Otherwise, it validates each parameter in **kwargs against the app spec, executes it, and
        returns the result.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'view_expression_profile'
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules have
                  versions, so if the tag is not 'release', and a version is given,
                  a ValueError will be raised.
        **kwargs - these are the set of parameters to be used with the app.
                   They can be found by using the app_usage function. If any
                   non-optional apps are missing, a ValueError will be raised.

        Example:
        run_local_app('NarrativeViewers/view_expression_profile', version='0.0.1', input_expression_matrix="MyMatrix", input_gene_ids="1234")
        """
        try:
            return self._run_widget_app_internal(app_id, tag, version, cell_id, run_id)
        except Exception as e:
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
            # raise
            print("Error while trying to start your app (run_widget_app)!\n-------------------------------------\n" + str(e))

    def _run_widget_app_internal(self, app_id, tag, version, cell_id, run_id):
        self._send_comm_message('run_status', {
            'event': 'validating_app',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        # Intro tests:
        self.spec_manager.check_app(app_id, tag, raise_exception=True)

        if version is not None and tag != "release":
            raise ValueError("App versions only apply to released app modules!")

        # Get the spec & params
        spec = self.spec_manager.get_spec(app_id, tag)

        if 'behavior' not in spec:
            raise ValueError("This app appears invalid - it has no defined behavior")

        behavior = spec['behavior']

        if 'kb_service_input_mapping' in behavior:
            # it's a service! Should run this with run_app!
            raise ValueError('This app appears to be a long-running job! Please start it using the run_app function instead.')

        if 'script_module' in behavior or 'script_name' in behavior:
            # It's an old NJS script. These don't work anymore.
            raise ValueError('This app relies on a service that is now obsolete. Please contact the administrator.')

        # Here, we just deal with two behaviors:
        # 1. None of the above - it's a viewer.
        # 2. ***TODO*** python_class / python_function. Import and exec the python code.

        # for now, just map the inputs to outputs.
        # First, validate.
        # Preflight check the params - all required ones are present, all values are the right type, all numerical values are in given ranges
        #spec_params = self.spec_manager.app_params(spec)
        #(params, ws_refs) = self._validate_parameters(app_id, tag, spec_params, kwargs)

        log_info = {
            'app_id': app_id,
            'tag': tag,
            'username': system_variable('user_id'),
            'ws': system_variable('workspace')
        }
        self._log.setLevel(logging.INFO)
        kblogging.log_event(self._log, "run_widget_app", log_info)

        self._send_comm_message('run_status', {
            'event': 'success',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        # now just map onto outputs.
        custom_widget = spec.get('widgets', {}).get('input', None)
        return WidgetManager().show_custom_widget(custom_widget, app_id, version, tag, spec)

    def _validate_parameters(self, app_id, tag, spec_params, params):
        """
        Validates the dict of params against the spec_params. If all is good, it updates a few
        parameters that need it - checkboxes go from True/False to 1/0, and sets default values
        where necessary.
        Then it returns a tuple like this:
        (dict_of_params, list_of_ws_refs)
        where list_of_ws_refs is the list of workspace references for objects being passed into
        the app.

        If it fails, this will raise a ValueError with a description of the problem and a
        (hopefully useful!) hint for the user as to what went wrong.
        """
        spec_param_ids = [p['id'] for p in spec_params]

        # First, test for presence.
        missing_params = list()
        for p in spec_params:
            if not p['optional'] and not p['default'] and not params.get(p['id'], None):
                missing_params.append(p['id'])
        if len(missing_params):
            raise ValueError('Missing required parameters {} - try executing app_usage("{}", tag="{}") for more information'.format(json.dumps(missing_params), app_id, tag))

        # Next, test for extra params that don't make sense
        extra_params = list()
        for p in params.keys():
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
            if p['id'] in params:
                (wsref, err) = self._check_parameter(p, params[p['id']], workspace)
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
            raise ValueError('Parameter value errors found!\n{}'.format("\n".join(param_errors)))

        # Hooray, parameters are validated. Set them up for transfer.
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

        return (params, ws_input_refs)

    def run_app(self, app_id, tag="release", version=None, cell_id=None, run_id=None, **kwargs):
        """
        Attempts to run the app, returns a Job with the running app info.
        If this is given a cell_id, then returns None. If not, it returns the generated
        Job object.

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
        run_app('MegaHit/run_megahit', version=">=1.0.0", read_library_name="My_PE_Library", output_contigset_name="My_Contig_Assembly")
        """
        try:
            return self._run_app_internal(app_id, tag, version, cell_id, run_id, **kwargs)
        except Exception as e:
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
            # raise
            print("Error while trying to start your app (run_app)!\n-------------------------------------\n" + str(e))
            return

    def _run_app_internal(self, app_id, tag, version, cell_id, run_id, **kwargs):
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
            if re.match(version, '\d+\.\d+\.\d+') is not None:
                raise ValueError("Semantic versions only apply to released app modules. You can use a Git commit hash instead to specify a version.")

        # Get the spec & params
        spec = self.spec_manager.get_spec(app_id, tag)

        # There's some branching to do here.
        # Cases:
        # app has behavior.kb_service_input_mapping -- is a valid long-running app.
        # app only has behavior.output_mapping - not kb_service_input_mapping or script_module - it's a viewer and should return immediately
        # app has other things besides kb_service_input_mapping -- not a valid app.
        if 'behavior' not in spec:
            raise Exception("This app appears invalid - it has no defined behavior")

        if  'kb_service_input_mapping' not in spec['behavior']:
            raise Exception("This app does not appear to be a long-running job! Please use 'run_local_app' to start this instead.")

        # Preflight check the params - all required ones are present, all values are the right type, all numerical values are in given ranges
        spec_params = self.spec_manager.app_params(spec)

        (params, ws_input_refs) = self._validate_parameters(app_id, tag, spec_params, kwargs)

        self._send_comm_message('run_status', {
            'event': 'validated_app',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        ws_id = system_variable('workspace_id')
        if ws_id is None:
            raise ValueError('Unable to retrive current Narrative workspace information!')

        input_vals = self._map_inputs(spec['behavior']['kb_service_input_mapping'], params)

        service_method = spec['behavior']['kb_service_method']
        service_name = spec['behavior']['kb_service_name']
        service_ver = spec['behavior'].get('kb_service_version', None)
        service_url = spec['behavior']['kb_service_url']
        

        # Let the given version override the spec's version.
        if version is not None:
            service_ver = version

        # This is what calls the function in the back end - Module.method
        # This isn't the same as the app spec id.
        function_name = service_name + '.' + service_method
        job_meta = {'tag': tag}
        if cell_id is not None:
            job_meta['cell_id'] = cell_id
        if run_id is not None:
            job_meta['run_id'] = run_id

        # This is the input set for NJSW.run_job. Now we need the worksapce id and whatever fits in the metadata.
        job_runner_inputs = {
            'method': function_name,
            'service_ver': service_ver,
            'params': input_vals,
            'app_id': app_id,
            'wsid': ws_id,
            'meta': job_meta
        }
        if len(ws_input_refs) > 0:
            job_runner_inputs['source_ws_objects'] = ws_input_refs

        # Log that we're trying to run a job...
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

        new_job = Job(job_id, app_id, [params], tag=tag, app_version=service_ver, cell_id=cell_id)

        self._send_comm_message('run_status', {
            'event': 'launched_job',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id,
            'job_id': job_id
        })
        JobManager().register_new_job(new_job)
        if cell_id is not None:
            return
        else:
            return new_job

    def _map_inputs(self, input_mapping, params):
        """
        Maps the dictionary of parameters and inputs based on rules provided in the input_mapping.
        This iterates over the list of input_mappings, and uses them as a filter to apply to each
        parameter.

        Returns a list of inputs that can be passed directly to NJSW.run_job

        input_mapping is a list of dicts, as defined by NarrativeMethodStore.ServiceMethodInputMapping.
        params is a dict of key-value-pairs, each key is the input_parameter field of some parameter.
        """
        inputs_dict = dict()
        for p in input_mapping:
            # 2 steps - figure out the proper value, then figure out the proper position.
            # value first!
            p_value = None
            if 'input_parameter' in p:
                p_value = params.get(p['input_parameter'], None)
            elif 'narrative_system_variable' in p:
                p_value = system_variable(p['narrative_system_variable'])
            if 'constant_value' in p and p_value is None:
                p_value = p['constant_value']
            if 'generated_value' in p and p_value is None:
                p_value = self._generate_input(generated_value)
            if 'target_type_transform' in p:
                p_value = self._transform_input(p['target_type_transform'], p_value)

            # get position!
            arg_position = p.get('target_argument_position', 0)
            target_prop = p.get('target_property', None)
            if target_prop is not None:
                final_input = inputs_dict.get(arg_position, dict())
                if '/' in target_prop:
                    ## This is case when slashes in target_prop separeate elements in nested maps.
                    ## We ignore escaped slashes (separate backslashes should be escaped as well).
                    bck_slash = u"\u244A"
                    fwd_slash = u"\u20EB"
                    temp_string = target_prop.replace("\\\\", bck_slash).replace("\\/", fwd_slash)
                    temp_path = []
                    for part in temp_string.split("/"):
                        part = part.replace(bck_slash, "\\").replace(fwd_slash, "/")
                        temp_path.append(part.encode('ascii','ignore'))
                    temp_map = final_input
                    temp_key = None
                    ## We're going along the path and creating intermediate dictionaries.
                    for temp_path_item in temp_path:
                        if temp_key:
                            if temp_key not in temp_map:
                                temp_map[temp_key] = {}
                            temp_map = temp_map[temp_key]
                        temp_key = temp_path_item
                    ## temp_map points to deepest nested map now, temp_key is last item in path
                    temp_map[temp_key] = p_value
                else:
                    final_input[target_prop] = p_value
                inputs_dict[arg_position] = final_input
            else:
                inputs_dict[arg_position] = p_value

        inputs_list = list()
        keys = sorted(inputs_dict.keys())
        for k in keys:
            inputs_list.append(inputs_dict[k])
        return inputs_list

    def _transform_input(self, transform_type, value):
        """
        Transforms an input according to the rules given in NarrativeMethodStore.ServiceMethodInputMapping
        Really, there are three types of transforms possible:
          1. ref - turns the input string into a workspace ref.
          2. int - tries to coerce the input string into an int.
          3. list<type> - turns the given list into a list of the given type.
          (4.) none or None - doesn't transform.

        Returns a transformed (or not) value.
        """
        if transform_type == "none" or transform_type is None:
            return value

        elif transform_type == "ref":
            # make a workspace ref
            if value is not None:
                value = system_variable('workspace') + '/' + value
            return value

        elif transform_type == "int":
            # make it an integer, OR 0.
            if value is None or len(str(value).strip()) == 0:
                return None
            return int(value)

        elif transform_type.startswith("list<") and transform_type.endswith(">"):
            # make it a list of transformed types.
            list_type = transform_type[5:-1]
            if isinstance(value, list):
                ret = []
                for pos in range(0, len(value)):
                    ret.append(self._transform_input(list_type, value[pos]))
                return ret
            else:
                return [self._transform_input(list_type, value)]

        else:
            raise ValueError("Unsupported Transformation type: " + transform_type)


    def _generate_input(self, generator):
        """
        Generates an input value using rules given by NarrativeMethodStore.AutoGeneratedValue.
        generator - dict
            has 3 optional properties:
            prefix - if present, is prepended to the generated string.
            symbols - if present is the number of symbols to autogenerate (if not present, default=8)
            suffix - if present, is appended to the generated string.
        So, if generator is None or an empty dict, returns an 8-symbol string.
        """
        symbols = 8
        if 'symbols' in generator:
            symbols = int(generator['symbols'])
        ret = ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(symbols)])
        if 'prefix' in generator:
            ret = str(generator['prefix']) + ret
        if 'suffix' in generator:
            ret = ret + str(generator['suffix'])
        return ret

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
                return (None, "\n\t".join(error_list))
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
                info = self.ws_client.get_object_info_new({'objects': [{'workspace': workspace, 'name': value}]})[0]
                ws_ref = "{}/{}/{}".format(info[6], info[0], info[4])
                type_ok = False
                for t in param['allowed_types']:
                    if re.match(t, info[2]):
                        type_ok = True
                if not type_ok:
                    return (ws_ref, 'Type of data object, {}, does not match allowed types'.format(info[2]))
            except Exception as e:
                return (ws_ref, 'Data object named {} not found with this Narrative.'.format(value))

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
