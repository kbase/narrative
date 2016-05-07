"""
A module for managing methods, specs, requirements, and for starting jobs.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

from .job import Job
import biokbase.narrative.clients as clients
from .jobmanager import JobManager
import specmanager as specmanager
import os
import biokbase.auth
from .method_util import (
    method_version_tags,
    check_tag,
    system_variable
)
from IPython.display import HTML
from jinja2 import Template
import json
import re
from biokbase.narrative.common import kblogging
import logging

class MethodManager(object):
    __instance = None

    nms = clients.get('narrative_method_store')
    njs = clients.get('job_service')
    ws_client = clients.get('workspace')
    spec_manager = specmanager.get_manager()
    _log = kbLogging.get_logger(__name__)
    _log.setLevel(logging.INFO)

    def __new__(cls):
        if MethodManager.__instance is None:
            MethodManager.__instance = object.__new__(cls)
        return MethodManager.__instance

    def reload_methods(self):
        """
        Reloads all method specs into memory from the latest update.
        """
        self.spec_manager.reload_methods()


    def method_usage(self, method_id, tag='release'):
        """
        Should show method inputs and outputs. Something like this:
        Method id
        Method name
        Subtitle
        Parameters
            1. xxx - string - data object - [type1, type2, type3]
            (subtitle, description, etc)
            2. yyy - int - from x to y
            (subtitle, description, etc)
            3. zzz - list of strings
            ...
            4. aaa - OUTPUT - ....
        """
        return self.spec_manager.method_usage(method_id, tag)


    def method_description(self, method_id, tag='release'):
        """
        Returns the method description as a printable object. Makes it kinda pretty? repr_html, maybe?
        """
        return self.spec_manager.method_description(method_id, tag)

    def list_available_methods(self, tag="release"):
        """
        Lists the set of available methods in a pretty HTML way.
        Usable only in the Jupyter notebook.
        """
        return self.spec_manager.list_available_methods(tag)

    def run_method(self, method_id, tag="release", version=None, cell_id=None, **kwargs):
        """
        Attemps to run the method, returns a Job with the running method info.
        Should *hopefully* also inject that method into the Narrative's metadata.
        Probably need some kind of JavaScript-foo to get that to work.

        Parameters:
        -----------
        method_id - should be from the method spec, e.g. 'build_a_metabolic_model'
                    or 'MegaHit/run_megahit'.
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules have
                  versions, so if the tag is not 'release', and a version is given,
                  a ValueError will be raised.
        **kwargs - these are the set of parameters to be used with the method.
                   They can be found by using the method_usage function. If any
                   non-optional methods are missing, a ValueError will be raised.

        Example:
        --------
        my_job - mm.run_method('MegaHit/run_megahit', version=">=1.0.0", read_library_name="My_PE_Library", output_contigset_name="My_Contig_Assembly")
        """

        # Intro tests:
        self.spec_manager.check_method(method_id, tag, raise_exception=True)

        if version is not None and tag != "release":
            raise ValueError("Method versions only apply to released method modules!")

        # Get the spec & params
        spec = self.spec_manager.get_method_spec(method_id, tag)
        if not 'behavior' in spec or not 'kb_service_input_mapping' in spec['behavior']:
            raise Exception("Only good for SDK-made methods!")
        spec_params = self.spec_manager.method_params(spec)


        # Preflight check the params - all required ones are present, all values are the right type, all numerical values are in given ranges
        spec_param_ids = [ p['id'] for p in spec_params ]

        # First, test for presence.
        missing_params = list()
        for p in spec_params:
            if not p['optional'] and not p['default'] and not kwargs.get(p['id'], None):
                missing_params.append(p['id'])
        if len(missing_params):
            raise ValueError('Missing required parameters {} - try executing method_usage("{}", tag="{}") for more information'.format(json.dumps(missing_params), method_id, tag))

        # Next, test for extra params that don't make sense
        extra_params = list()
        for p in kwargs.keys():
            if p not in spec_param_ids:
                extra_params.append(p)
        if len(extra_params):
            raise ValueError('Unknown parameters {} - maybe something was misspelled?\nexecute method_usage("{}", tag="{}") for more information'.format(json.dumps(extra_params), method_id, tag))

        # Now, validate parameter values.
        # Should also check if input (NOT OUTPUT) object variables are present in the current workspace
        workspace = system_variable('workspace')
        param_errors = list()
        for p in spec_params:
            if p['id'] in kwargs:
                err = self._check_parameter(p, kwargs[p['id']], workspace)
                if err is not None:
                    param_errors.append("{} - {}".format(p['id'], err))
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

        method_name = spec['behavior']['kb_service_method']
        service_name = spec['behavior']['kb_service_name']
        service_ver = spec['behavior']['kb_service_version']
        service_url = spec['behavior']['kb_service_url']
        # 3. set up app structure
        app = {'name': 'App wrapper for method ' + method_id,
               'steps': [{'input_values': [input_vals],
                          'is_long_running': 1,
                          'method_spec_id': method_id,
                          'script': {'has_files': 0, 'method_name': '', 'service_name': ''},
                          'service': {'method_name': method_name,
                                      'service_name': service_name,
                                      'service_url': service_url,
                                      'service_version': service_ver},
                          'step_id': method_id,
                          'type': 'service'}]}


        log_info = {
            'method_id': method_id,
            'tag': tag,
            'version': service_ver,
            'username': system_variable('user_id')
        }
        self._log.setLevel(logging.INFO)
        kblogging.log_event(self._log, "run_method", log_info)

        try:
            app_state = self.njs.run_app(app)
        except Exception, e:
            log_info.update({'err': str(e)})
            self._log.setLevel(logging.ERROR)
            kblogging.log_event(_kblog, "run_method", log_info)
            raise

        new_job = Job(app_state['job_id'], method_id, params, tag=tag, method_version=service_ver, cell_id=cell_id)
        JobManager().register_new_job(new_job)
        # jobmanager.get_manager().register_new_job(new_job)
        return new_job

    def _check_parameter(self, param, value, workspace):
        """
        Checks if the given value matches the rules provided in the param dict.
        If yes, returns None
        If no, returns a String with an error.

        This is a pretty light wrapper around _validate_param_value that handles the case
        where the given value is a list.
        """
        if param['allow_multiple'] and isinstance(value, list):
            error_list = list()
            for v in value:
                err = self._validate_param_value(param, v, workspace)
                if err:
                    error_list.append(err)
            if len(error_list):
                return ", ".join(error_list)
            else:
                return None
        return self._validate_param_value(param, value, workspace)


    def _validate_param_value(self, param, value, workspace):
        """
        Tests a value to make sure it's valid.
        Returns None if valid, an error string if not.
        """
        # cases - value == list, int, float, others get rejected
        if not (isinstance(value, basestring) or
                isinstance(value, int) or
                isinstance(value, float)):
            return "input type not supported - only str, int, float, or list"

        # check types. basestring is pretty much anything (it'll just get casted),
        # but ints, floats, or lists are funky.
        if param['type'] == 'int' and not isinstance(value, int):
            return 'Given value {} is not an int'.format(value)
        elif param['type'] == 'float' and not (isinstance(value, float) or isinstance(value, int)):
            return 'Given value {} is not a number'.format(value)

        # if it's expecting a workspace object, check if that's present, and a valid type
        if 'allowed_types' in param and not param['is_output']:
            try:
                info = self.ws_client.get_object_info_new({'objects': [{'workspace':workspace, 'name':value}]})[0]
                type_ok = False
                for t in param['allowed_types']:
                    if re.match(t, info[2]):
                        type_ok = True
                if not type_ok:
                    return 'Type of data object, {}, does not match allowed types'.format(info[2])
            except Exception as e:
                return 'Data object named {} not found with this Narrative. (additional info: {})'.format(value, e)

        # if it expects a set of allowed values, check if this one matches
        if 'allowed_values' in param:
            if value not in param['allowed_values']:
                return "Given value is not permitted in the allowed set."

        # if it expects a numerical value in a certain range, check that.
        if 'max_val' in param:
            try:
                if float(value) > param['max_val']:
                    return "Given value {} should be <= {}".format(value, param['max_val'])
            except:
                return "Given value {} must be a number".format(value)

        if 'min_val' in param:
            try:
                if float(value) < param['min_val']:
                    return "Given value {} should be >= {}".format(value, param['min_val'])
            except:
                return "Given value {} must be a number".format(value)

        # if it's an output object, make sure it follows the data object rules.
        if param['is_output']:
            if re.search('\s', value):
                return "Spaces are not allowed in data object names."
            if re.match('^\d+$', value):
                return "Data objects cannot be just a number."
            if not re.match('^[a-z0-9|\.|\||_\-]*$', value, re.IGNORECASE):
                return "Data object names can only include symbols: _ - . |"

        # Last, regex. not being used in any extant specs, but cover it anyway.
        if 'regex_constraint' in param:
            for regex in regex_constraint:
                if not re.match(regex_constraint, value):
                    return 'Value {} does not match required regex {}'.format(value, regex)

        # Whew. Passed all filters!
        return None