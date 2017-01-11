"""
A module for managing apps, specs, requirements, and for starting jobs.
"""

from job import Job
from jobmanager import JobManager
from specmanager import SpecManager
import biokbase.narrative.clients as clients
from biokbase.narrative.widgetmanager import WidgetManager
from biokbase.narrative.app_util import (
    system_variable,
    map_outputs_from_state,
    validate_parameters,
    check_parameter,
    validate_group_values,
    validate_param_value,
    resolve_ref,
    resolve_ref_if_typed,
    transform_param_value,
    extract_ws_refs
)
from biokbase.narrative.exception_util import (
    transform_job_exception
)
from biokbase.narrative.common import kblogging
import re
import datetime
import traceback
import random

"""
A module for managing apps, specs, requirements, and for starting jobs.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"


class AppManager(object):
    """
    The main class for managing how KBase apps get run. This contains functions
    for showing app descriptions, their usage (how to invoke various
    parameters), and, ultimately, for running the app.

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
    service_client = clients.get('service')

    spec_manager = SpecManager()
    _log = kblogging.get_logger(__name__)
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
        tag. By default, this is done in a pretty HTML way, but this app can be
        wrapped in str() to show a bare formatted string.

        If either the app_id is unknown, or isn't found with the given release
        tag, or if the tag is unknown, a ValueError will be raised.

        Parameters:
        -----------
        app_id : string
            A KBase app id, generally of the format Module_name/app_name
            (see available_apps for a list)
        tag : Which version of the app to view - either release, beta, or dev
            (default=release)
        """
        return self.spec_manager.app_usage(app_id, tag)

    def app_description(self, app_id, tag='release'):
        """
        Returns the app description in a printable HTML format.

        If either the app_id is unknown, or isn't found with the given release
        tag, or if the tag is unknown, a ValueError will be raised.

        Parameters:
        -----------
        app_id : string
            A KBase app id, generally of the format Module_name/app_name
            (see available_apps for a list)
        tag : Which version of the app to view - either release, beta, or dev
            (default=release)
        """
        return self.spec_manager.app_description(app_id, tag)

    def available_apps(self, tag="release"):
        """
        Lists the set of available apps for a given tag in a simple table.
        If the tag is not found, a ValueError will be raised.

        Parameters:
        -----------
        tag : Which version of the list of apps to view - either release, beta,
            or dev (default=release)

        """
        return self.spec_manager.available_apps(tag)

    # def run_app_old(self, app_id, params, tag="release", version=None,
    #                 cell_id=None, run_id=None, **kwargs):
    #     """
    #     Attempts to run the app, returns a Job with the running app info.
    #     If this is given a cell_id, then returns None. If not, it returns the
    #     generated Job object.
    #
    #     Parameters:
    #     -----------
    #     app_id - should be from the app spec, e.g. 'build_a_metabolic_model'
    #                 or 'MegaHit/run_megahit'.
    #     params - this is hte dictionary of parameters to tbe used with the app.
    #              They can be found by using the app_usage function. If any
    #              non-optional apps are missing, a ValueError will be raised.
    #     tag - optional, one of [release|beta|dev] (default=release)
    #     version - optional, a semantic version string. Only released modules
    #               have versions, so if the tag is not 'release', and a version
    #               is given, a ValueError will be raised.
    #     **kwargs - these are the set of parameters to be used with the app.
    #                They can be found by using the app_usage function. If any
    #                non-optional apps are missing, a ValueError will be raised.
    #
    #     Example:
    #     --------
    #     run_app('MegaHit/run_megahit',
    #             {
    #                 'read_library_name' : 'My_PE_Library',
    #                 'output_contigset_name' : 'My_Contig_Assembly'
    #             },
    #             version='>=1.0.0'
    #     )
    #     """
    #
    #     try:
    #         if params is None:
    #             params = dict()
    #         return self._run_app_internal(app_id, params, tag, version,
    #                                       cell_id, run_id, **kwargs)
    #     except Exception as e:
    #         e_type = type(e).__name__
    #         e_message = str(e).replace('<', '&lt;').replace('>', '&gt;')
    #         e_trace = traceback.format_exc()
    #         e_trace = e_trace.replace('<', '&lt;').replace('>', '&gt;')
    #         e_code = getattr(e, 'code', -1)
    #         e_source = getattr(e, 'source', 'appmanager')
    #         self._send_comm_message('run_status', {
    #             'event': 'error',
    #             'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
    #             'cell_id': cell_id,
    #             'run_id': run_id,
    #             'error_message': e_message,
    #             'error_type': e_type,
    #             'error_stacktrace': e_trace,
    #             'error_code': e_code,
    #             'error_source': e_source
    #         })
    #         print("Error while trying to start your app (run_app)!\n" +
    #               "-----------------------------------------------\n" +
    #               str(e))
    #         return
    #
    # def _run_app_internal_old(self, app_id, params, tag, version,
    #                           cell_id, run_id, **kwargs):
    #     """
    #     Attemps to run the app, returns a Job with the running app info.
    #     Should *hopefully* also inject that app into the Narrative's metadata.
    #     Probably need some kind of JavaScript-foo to get that to work.
    #
    #     Parameters:
    #     -----------
    #     app_id - should be from the app spec, e.g. 'build_a_metabolic_model'
    #                 or 'MegaHit/run_megahit'.
    #     params - the dictionary of parameters.
    #     tag - optional, one of [release|beta|dev] (default=release)
    #     version - optional, a semantic version string. Only released modules
    #               have versions, so if the tag is not 'release', and a version
    #               is given, a ValueError will be raised.
    #     **kwargs - these are the set of parameters to be used with the app.
    #                They can be found by using the app_usage function. If any
    #                non-optional apps are missing, a ValueError will be raised.
    #     """
    #
    #     # TODO: this needs restructuring so that we can send back validation
    #     # failure messages. Perhaps a separate function and catch the errors,
    #     # or return an error structure.
    #
    #     # Intro tests:
    #     self.spec_manager.check_app(app_id, tag, raise_exception=True)
    #
    #     if version is not None and tag != "release":
    #         if re.match(r'\d+\.\d+\.\d+', version) is not None:
    #             raise ValueError(
    #                 "Semantic versions only apply to released app modules. " +
    #                 "You can use a Git commit hash instead to specify a " +
    #                 "version.")
    #
    #     # Get the spec & params
    #     spec = self.spec_manager.get_spec(app_id, tag)
    #
    #     # There's some branching to do here.
    #     # Cases:
    #     # app has behavior.kb_service_input_mapping - valid long-running app.
    #     # app has behavior.output_mapping - not kb_service_input_mapping or
    #     #     script_module - it's a viewer and should return immediately
    #     # app has other things besides kb_service_input_mapping - not valid.
    #     if 'behavior' not in spec:
    #         raise Exception("This app appears invalid - " +
    #                         "it has no defined behavior")
    #
    #     if 'kb_service_input_mapping' not in spec['behavior']:
    #         raise Exception("This app does not appear to be a long-running " +
    #                         "job! Please use 'run_local_app' to start this " +
    #                         "instead.")
    #
    #     # Preflight check the params - all required ones are present, all
    #     # values are the right type, all numerical values are in given ranges
    #     spec_params = self.spec_manager.app_params(spec)
    #     spec_params_map = dict((spec_params[i]['id'], spec_params[i])
    #                            for i in range(len(spec_params)))
    #
    #     (params, ws_input_refs) = self._validate_parameters(app_id,
    #                                                         tag,
    #                                                         spec_params,
    #                                                         params)
    #
    #     ws_id = system_variable('workspace_id')
    #     if ws_id is None:
    #         raise ValueError('Unable to retrive current ' +
    #                          'Narrative workspace information!')
    #
    #     input_vals = self._map_inputs(
    #         spec['behavior']['kb_service_input_mapping'],
    #         params,
    #         spec_params_map)
    #
    #     service_method = spec['behavior']['kb_service_method']
    #     service_name = spec['behavior']['kb_service_name']
    #     service_ver = spec['behavior'].get('kb_service_version', None)
    #     # service_url = spec['behavior']['kb_service_url']
    #
    #     # Let the given version override the spec's version.
    #     if version is not None:
    #         service_ver = version
    #
    #     # This is what calls the function in the back end - Module.method
    #     # This isn't the same as the app spec id.
    #     function_name = service_name + '.' + service_method
    #     job_meta = {'tag': tag}
    #     if cell_id is not None:
    #         job_meta['cell_id'] = cell_id
    #     if run_id is not None:
    #         job_meta['run_id'] = run_id
    #
    #     # This is the input set for NJSW.run_job. Now we need the worksapce id
    #     # and whatever fits in the metadata.
    #     job_runner_inputs = {
    #         'method': function_name,
    #         'service_ver': service_ver,
    #         'params': input_vals,
    #         'app_id': app_id,
    #         'wsid': ws_id,
    #         'meta': job_meta
    #     }
    #     if len(ws_input_refs) > 0:
    #         job_runner_inputs['source_ws_objects'] = ws_input_refs
    #
    #     # Log that we're trying to run a job...
    #     log_info = {
    #         'app_id': app_id,
    #         'tag': tag,
    #         'version': service_ver,
    #         'username': system_variable('user_id'),
    #         'wsid': ws_id
    #     }
    #     kblogging.log_event(self._log, "run_app", log_info)
    #
    #     try:
    #         job_id = self.njs.run_job(job_runner_inputs)
    #     except Exception as e:
    #         log_info.update({'err': str(e)})
    #         kblogging.log_event(self._log, "run_app_error", log_info)
    #         raise transform_job_exception(e)
    #
    #     new_job = Job(job_id,
    #                   app_id,
    #                   [params],
    #                   system_variable('user_id'),
    #                   tag=tag,
    #                   app_version=service_ver,
    #                   cell_id=cell_id,
    #                   run_id=run_id)
    #
    #     self._send_comm_message('run_status', {
    #         'event': 'launched_job',
    #         'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
    #         'cell_id': cell_id,
    #         'run_id': run_id,
    #         'job_id': job_id
    #     })
    #     JobManager().register_new_job(new_job)
    #     if cell_id is not None:
    #         return
    #     else:
    #         return new_job

    def run_app(self, app_id, params, tag="release", version=None,
                cell_id=None, run_id=None, **kwargs):
        """
        Attempts to run the app, returns a Job with the running app info.
        If this is given a cell_id, then returns None. If not, it returns the
        generated Job object.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'build_a_metabolic_model'
                    or 'MegaHit/run_megahit'.
        params - this is hte dictionary of parameters to tbe used with the app.
                 They can be found by using the app_usage function. If any
                 non-optional apps are missing, a ValueError will be raised.
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules
                  have versions, so if the tag is not 'release', and a version
                  is given, a ValueError will be raised.
        **kwargs - these are the set of parameters to be used with the app.
                   They can be found by using the app_usage function. If any
                   non-optional apps are missing, a ValueError will be raised.

        Example:
        --------
        run_app('MegaHit/run_megahit',
                {
                    'read_library_name' : 'My_PE_Library',
                    'output_contigset_name' : 'My_Contig_Assembly'
                },
                version='>=1.0.0'
        )
        """

        try:
            if params is None:
                params = dict()
            return self._run_app_internal(app_id, params, tag, version,
                                          cell_id, run_id, **kwargs)
        except Exception as e:
            e_type = type(e).__name__
            e_message = str(e).replace('<', '&lt;').replace('>', '&gt;')
            e_trace = traceback.format_exc()
            e_trace = e_trace.replace('<', '&lt;').replace('>', '&gt;')
            e_code = getattr(e, 'code', -1)
            e_source = getattr(e, 'source', 'appmanager')
            self._send_comm_message('run_status', {
                'event': 'error',
                'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
                'cell_id': cell_id,
                'run_id': run_id,
                'error_message': e_message,
                'error_type': e_type,
                'error_stacktrace': e_trace,
                'error_code': e_code,
                'error_source': e_source
            })
            print("Error while trying to start your app (run_app)!\n" +
                  "-----------------------------------------------\n" +
                  str(e) + "\n" +
                  "-----------------------------------------------\n" +
                  e_trace)
            return

    def _run_app_internal(self, app_id, params, tag, version,
                          cell_id, run_id, **kwargs):
        """
        Attemps to run the app, returns a Job with the running app info.
        Should *hopefully* also inject that app into the Narrative's metadata.
        Probably need some kind of JavaScript-foo to get that to work.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'build_a_metabolic_model'
                    or 'MegaHit/run_megahit'.
        params - the dictionary of parameters.
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules
                  have versions, so if the tag is not 'release', and a version
                  is given, a ValueError will be raised.
        **kwargs - these are the set of parameters to be used with the app.
                   They can be found by using the app_usage function. If any
                   non-optional apps are missing, a ValueError will be raised.
        """

        # TODO: this needs restructuring so that we can send back validation
        # failure messages. Perhaps a separate function and catch the errors,
        # or return an error structure.

        # Intro tests:
        self.spec_manager.check_app(app_id, tag, raise_exception=True)

        if version is not None and tag != "release":
            if re.match(r'\d+\.\d+\.\d+', version) is not None:
                raise ValueError(
                    "Semantic versions only apply to released app modules. " +
                    "You can use a Git commit hash instead to specify a " +
                    "version.")

        # Get the spec & params
        spec = self.spec_manager.get_spec(app_id, tag)

        # There's some branching to do here.
        # Cases:
        # app has behavior.kb_service_input_mapping - valid long-running app.
        # app has behavior.output_mapping - not kb_service_input_mapping or
        #     script_module - it's a viewer and should return immediately
        # app has other things besides kb_service_input_mapping - not valid.
        if 'behavior' not in spec:
            raise Exception("This app appears invalid - " +
                            "it has no defined behavior")

        if 'kb_service_input_mapping' not in spec['behavior']:
            raise Exception("This app does not appear to be a long-running " +
                            "job! Please use 'run_local_app' to start this " +
                            "instead.")

        # Preflight check the params - all required ones are present, all
        # values are the right type, all numerical values are in given ranges
        spec_params = self.spec_manager.app_params(spec)
        spec_params_map = dict((spec_params[i]['id'], spec_params[i])
                               for i in range(len(spec_params)))

        ws_input_refs = extract_ws_refs(app_id, tag, spec_params, params)

        #(params, ws_input_refs) = self._validate_parameters(app_id,
        #                                                    tag,
        #                                                    spec_params,
        #                                                    params)

        ws_id = system_variable('workspace_id')
        if ws_id is None:
            raise ValueError('Unable to retrive current ' +
                             'Narrative workspace information!')

        input_vals = self._map_inputs(
            spec['behavior']['kb_service_input_mapping'],
            params,
            spec_params_map)

        service_method = spec['behavior']['kb_service_method']
        service_name = spec['behavior']['kb_service_name']
        service_ver = spec['behavior'].get('kb_service_version', None)
        # service_url = spec['behavior']['kb_service_url']

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

        # This is the input set for NJSW.run_job. Now we need the worksapce id
        # and whatever fits in the metadata.
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
        kblogging.log_event(self._log, "run_app", log_info)

        try:
            job_id = self.njs.run_job(job_runner_inputs)
        except Exception as e:
            log_info.update({'err': str(e)})
            kblogging.log_event(self._log, "run_app_error", log_info)
            raise transform_job_exception(e)

        new_job = Job(job_id,
                      app_id,
                      [params],
                      system_variable('user_id'),
                      tag=tag,
                      app_version=service_ver,
                      cell_id=cell_id,
                      run_id=run_id)

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

    def run_local_app(self, app_id, params, tag="release", version=None,
                      cell_id=None, run_id=None, **kwargs):
        """
        Attempts to run a local app. These do not return a Job object, but just
        the result of the app. In most cases, this will be a Javascript display
        of the result, but could be anything.

        If the app_spec looks like it makes a service call, then this raises a
        ValueError. Otherwise, it validates each parameter in **kwargs against
        the app spec, executes it, and returns the result.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'view_expression_profile'
        params - the dictionary of parameters for the app. Should be key-value
                 pairs where they keys are strings. If any non-optional
                 parameters are missing, an informative string will be printed.
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules
                  have versions, so if the tag is not 'release', and a version
                  is given, a ValueError will be raised.
        **kwargs - these are the set of parameters to be used with the app.
                   They can be found by using the app_usage function. If any
                   non-optional apps are missing, a ValueError will be raised.

        Example:
        run_local_app('NarrativeViewers/view_expression_profile',
                      version='0.0.1',
                      input_expression_matrix="MyMatrix",
                      input_gene_ids="1234")
        """
        try:
            if params is None:
                params = dict()
            return self._run_local_app_internal(app_id, params, tag, version,
                                                cell_id, run_id, **kwargs)
        except Exception as e:
            e_type = type(e).__name__
            e_message = str(e).replace('<', '&lt;').replace('>', '&gt;')
            e_trace = traceback.format_exc()
            e_trace = e_trace.replace('<', '&lt;').replace('>', '&gt;')
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
            print("Error while trying to start your app (run_local_app)!\n" +
                  "-------------------------------------\n" + str(e))

    def _run_local_app_internal(self, app_id, params, tag, version,
                                cell_id, run_id, **kwargs):
        self._send_comm_message('run_status', {
            'event': 'validating_app',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        # Intro tests:
        self.spec_manager.check_app(app_id, tag, raise_exception=True)

        if version is not None and tag != "release":
            raise ValueError("App versions only apply to released modules!")

        # Get the spec & params
        spec = self.spec_manager.get_spec(app_id, tag)

        if 'behavior' not in spec:
            raise ValueError("This app appears invalid - " +
                             "it has no defined behavior")

        behavior = spec['behavior']

        if 'script_module' in behavior or 'script_name' in behavior:
            # It's an old NJS script. These don't work anymore.
            raise ValueError('This app relies on a service that is now ' +
                             'obsolete. Please contact the administrator.')

        # Here, we just deal with two behaviors:
        # 1. None of the above - it's a viewer.
        # 2. ***TODO*** python_class / python_function.
        #    Import and exec the python code.

        # for now, just map the inputs to outputs.
        # First, validate.
        # Preflight check the params - all required ones are present, all
        # values are the right type, all numerical values are in given ranges
        spec_params = self.spec_manager.app_params(spec)
        (params, ws_refs) = self._validate_parameters(app_id, tag,
                                                      spec_params, params)

        # Log that we're trying to run a job...
        log_info = {
            'app_id': app_id,
            'tag': tag,
            'username': system_variable('user_id'),
            'ws': system_variable('workspace')
        }
        kblogging.log_event(self._log, "run_local_app", log_info)

        self._send_comm_message('run_status', {
            'event': 'success',
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z',
            'cell_id': cell_id,
            'run_id': run_id
        })

        (output_widget, widget_params) = map_outputs_from_state([],
                                                                params,
                                                                spec)

        # All a local app does is route the inputs to outputs through the
        # spec's mapping, and then feed that into the specified output widget.
        return WidgetManager().show_output_widget(output_widget,
                                                  widget_params,
                                                  cell_id=cell_id, tag=tag)

    def run_dynamic_service(self, app_id, params, tag="release", version=None,
                            cell_id=None, run_id=None, **kwargs):
        """
        Attempts to run a local app. These do not return a Job object, but just
        the result of the app. In most cases, this will be a Javascript display
        of the result, but could be anything.

        If the app_spec looks like it makes a service call, then this raises a ValueError.
        Otherwise, it validates each parameter in **kwargs against the app spec, executes it, and
        returns the result.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'view_expression_profile'
        params - the dictionary of parameters for the app. Should be key-value
                 pairs where they keys are strings. If any non-optional
                 parameters are missing, an informative string will be printed.
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
            if params is None:
                params = dict()
            return self._run_dynamic_service_internal(app_id, params, tag, version, cell_id, run_id, **kwargs)
        except Exception as e:
            e_type = type(e).__name__
            e_message = str(e).replace('<', '&lt;').replace('>', '&gt;')
            e_trace = traceback.format_exc().replace('<', '&lt;').replace('>', '&gt;')

            if cell_id:
                self.send_cell_message('result', cell_id, run_id, {
                    'error': {
                        'message': e_message,
                        'type': e_type,
                        'stacktrace': e_trace
                    }
                })
            else:
                print("Error while trying to start your app (run_local_app)!\n-------------------------------------\n" + str(e))

    def _run_dynamic_service_internal(self, app_id, params, tag, version, cell_id, run_id, **kwargs):
        # Intro tests:
        self.spec_manager.check_app(app_id, tag, raise_exception=True)

        if version is not None and tag != "release":
            raise ValueError("App versions only apply to released app modules!")

        # Get the spec & params
        spec = self.spec_manager.get_spec(app_id, tag)

        if 'behavior' not in spec:
            raise ValueError("This app appears invalid - it has no defined behavior")

        behavior = spec['behavior']

        if 'script_module' in behavior or 'script_name' in behavior:
            # It's an old NJS script. These don't work anymore.
            raise ValueError('This app relies on a service that is now obsolete. Please contact the administrator.')

        # Log that we're trying to run a job...
        log_info = {
            'app_id': app_id,
            'tag': tag,
            'username': system_variable('user_id'),
            'ws': system_variable('workspace')
        }
        kblogging.log_event(self._log, "run_dynamic_service", log_info)

        # Silly to keep this here, but we do not validate the incoming parameters.
        # If they are provided by the UI (we have cell_id), they are constructed
        # according to the spec, so are trusted;
        # Otherwise, if they are the product of direct code cell entry, this is a mode we do not
        # "support", so we can let it fail hard.
        # In the future when code cell interaction is supported for users, we will need to provide
        # robust validation and error reporting, but this may end up being (should be) provided by the
        # sdk execution infrastructure anyway

        input_vals = params
        function_name = spec['behavior']['kb_service_name'] + '.' + spec['behavior']['kb_service_method']
        try:
            result = self.service_client.sync_call(
                function_name,
                input_vals,
                service_version=tag
            )[0]
            # if a ui call (a cell_id is defined) we send a result message, otherwise
            # just the raw result for display in a code cell. This is how we "support"
            # code cells for internal usage.
            if cell_id:
                self.send_cell_message('result', cell_id, run_id, {
                    'result': result
                })
            else:
                return result
        except:
            raise

    def send_cell_message(self, message_id, cell_id, run_id, message):
        address = {
            'cell_id': cell_id,
            'run_id': run_id,
            'event_at': datetime.datetime.utcnow().isoformat() + 'Z'
        }

        self._send_comm_message(message_id, {
            'address': address,
            'message': message
        })

    def _validate_parameters(self, app_id, tag, spec_params, params):
        """
        Validates the dict of params against the spec_params. If all is good,
        it updates a few parameters that need it - checkboxes go from
        True/False to 1/0, and sets default values where necessary.
        Then it returns a tuple like this:
        (dict_of_params, list_of_ws_refs)
        where list_of_ws_refs is the list of workspace references for objects
        being passed into the app.

        If it fails, this will raise a ValueError with a description of the
        problem and a (hopefully useful!) hint for the user as to what went
        wrong.
        """
        return validate_parameters(app_id, tag, spec_params, params)

    def _resolve_ref(self, workspace, value):
        return resolve_ref(workspace, value)

    def _resolve_ref_if_typed(self, value, spec_param):
        """
        For a given value and associated spec, if this is not an output param,
        then ensure that the reference points to an object in the current
        workspace, and transform the value into an absolute reference to it.
        """
        return resolve_ref_if_typed(value, spec_param)

    def _map_group_inputs(self, value, spec_param, spec_params):
        if isinstance(value, list):
            return [self._map_group_inputs(v, spec_param, spec_params)
                    for v in value]
        elif value is None:
            return None
        else:
            mapped_value = dict()
            id_map = spec_param.get('id_mapping', {})
            for param_id in id_map:
                # ensure that the param referenced in the group param list
                # exists in the spec.
                # NB: This should really never happen if the sdk registration
                # process validates them.
                if param_id not in spec_params:
                    msg = "Unknown parameter id in group mapping: " + param_id
                    raise ValueError(msg)
            for param_id in value:
                target_key = id_map.get(param_id, param_id)
                # Sets either the raw value, or if the parameter is an object
                # reference the full object refernce (see the method).
                target_val = self._resolve_ref_if_typed(value[param_id],
                                                        spec_params[param_id])
                mapped_value[target_key] = target_val
            return mapped_value

    def _map_inputs(self, input_mapping, params, spec_params):
        """
        Maps the dictionary of parameters and inputs based on rules provided in
        the input_mapping. This iterates over the list of input_mappings, and
        uses them as a filter to apply to each parameter.

        Returns a list of inputs that can be passed directly to NJSW.run_job

        input_mapping is a list of dicts, as defined by
        NarrativeMethodStore.ServiceMethodInputMapping.
        params is a dict of key-value-pairs, each key is the input_parameter
        field of some parameter.
        """
        inputs_dict = dict()
        for p in input_mapping:
            # 2 steps - figure out the proper value, then figure out the
            # proper position. value first!
            p_value = None
            input_param_id = None
            if 'input_parameter' in p:
                input_param_id = p['input_parameter']
                p_value = params.get(input_param_id, None)
                if spec_params[input_param_id].get('type', '') == 'group':
                    p_value = self._map_group_inputs(p_value, spec_params[input_param_id],
                                                     spec_params)
                # turn empty strings into None
                if isinstance(p_value, basestring) and len(p_value) == 0:
                    p_value = None
            elif 'narrative_system_variable' in p:
                p_value = system_variable(p['narrative_system_variable'])
            if 'constant_value' in p and p_value is None:
                p_value = p['constant_value']
            if 'generated_value' in p and p_value is None:
                p_value = self._generate_input(p['generated_value'])

            spec_param = None
            if input_param_id:
                spec_param = spec_params[input_param_id]
            p_value = self._transform_input(p.get('target_type_transform'), p_value,
                                            spec_param)

            # get position!
            arg_position = p.get('target_argument_position', 0)
            target_prop = p.get('target_property', None)
            if target_prop is not None:
                final_input = inputs_dict.get(arg_position, dict())
                if '/' in target_prop:
                    # This is case when slashes in target_prop separeate
                    # elements in nested maps. We ignore escaped slashes
                    # (separate backslashes should be escaped as well).
                    bck_slash = u"\u244A"
                    fwd_slash = u"\u20EB"
                    temp_string = target_prop.replace("\\\\", bck_slash)
                    temp_string = temp_string.replace("\\/", fwd_slash)
                    temp_path = []
                    for part in temp_string.split("/"):
                        part = part.replace(bck_slash, "\\")
                        part = part.replace(fwd_slash, "/")
                        temp_path.append(part.encode('ascii', 'ignore'))
                    temp_map = final_input
                    temp_key = None
                    # We're going along the path and creating intermediate
                    # dictionaries.
                    for temp_path_item in temp_path:
                        if temp_key:
                            if temp_key not in temp_map:
                                temp_map[temp_key] = {}
                            temp_map = temp_map[temp_key]
                        temp_key = temp_path_item
                    # temp_map points to deepest nested map now, temp_key is
                    # the last item in the path
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

    def _transform_input(self, transform_type, value, spec_param):
        """
        Transforms an input according to the rules given in
        NarrativeMethodStore.ServiceMethodInputMapping
        Really, there are three types of transforms possible:
          1. ref - turns the input string into a workspace ref.
          2. int - tries to coerce the input string into an int.
          3. list<type> - turns the given list into a list of the given type.
          (4.) none or None - doesn't transform.

        Returns a transformed (or not) value.
        """
        return transform_param_value(transform_type, value, spec_param)

    def _generate_input(self, generator):
        """
        Generates an input value using rules given by
        NarrativeMethodStore.AutoGeneratedValue.
        generator - dict
            has 3 optional properties:
            prefix - if present, is prepended to the generated string.
            symbols - if present is the number of symbols to autogenerate (if
                      not present, default=8)
            suffix - if present, is appended to the generated string.
        So, if generator is None or an empty dict, returns an 8-symbol string.
        """
        symbols = 8
        if 'symbols' in generator:
            try:
                symbols = int(generator['symbols'])
            except:
                raise ValueError(
                    'The "symbols" input to the generated value must be an ' +
                    'integer > 0!'
                )
        if symbols < 1:
            raise ValueError(
                'Must have at least 1 symbol to randomly generate!'
            )
        ret = ''.join([chr(random.randrange(0, 26) + ord('A'))
                      for _ in xrange(symbols)])
        if 'prefix' in generator:
            ret = str(generator['prefix']) + ret
        if 'suffix' in generator:
            ret = ret + str(generator['suffix'])
        return ret

    def _check_parameter(self, param, value, workspace, all_params=dict()):
        """
        Checks if the given value matches the rules provided in the param dict.
        If yes, returns None
        If no, returns a String with an error.

        This is a pretty light wrapper around _validate_param_value that
        handles the case where the given value is a list.

        Parameters:
        -----------
        param : dict
            A dict representing a single KBase App parameter, generated by the
            Spec Manager
        value : any
            A value input by the user
        workspace : string
            The name of the current workspace to search against (if needed)
        all_params : dict (param id -> param dict)
            All spec parameters. Really only needed when validating a parameter
            group, because it probably needs to dig into all of them.
        """
        return check_parameter(param, value, workspace, all_params)

    def _validate_group_values(self, param, value, workspace, spec_params):
        return validate_group_values(param, value, workspace, spec_params)

    def _validate_param_value(self, param, value, workspace):
        """
        Tests a value to make sure it's valid, based on the rules given in the
        param dict. Returns None if valid, an error string if not.

        Parameters:
        -----------
        param : dict
            A dict representing a single KBase App parameter, generated by the
            Spec Manager. This contains the rules for processing any given
            values.
        value : any
            A value input by the user - likely either None, int, float, string,
            list, or dict. Which is pretty much everything, right?
        workspace : string
            The name of the current workspace to test workspace object types
            against, if required by the parameter.
        """
        return validate_param_value(param, value, workspace)

    def _send_comm_message(self, msg_type, content):
        JobManager()._send_comm_message(msg_type, content)
