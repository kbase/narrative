import os
import re
import json
import biokbase.narrative.clients as clients
import biokbase.auth

"""
Some utility functions for running KBase Apps or Methods or whatever they are this week.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>, Roman Sutormin <rsutormin@lbl.gov>"

app_version_tags = ['release', 'beta', 'dev']


def check_tag(tag, raise_exception=False):
    """
    Checks if the given tag is one of "release", "beta", or "dev".
    Returns a boolean.
    if raise_exception == True and the tag is bad, raises a ValueError
    """
    tag_exists = tag in app_version_tags
    if not tag_exists and raise_exception:
        raise ValueError("Can't find tag %s - allowed tags are %s" % (tag, ", ".join(app_version_tags)))
    else:
        return tag_exists


def strict_system_variable(var):
    """
    Returns a system variable.
    If that variable isn't defined, or anything else happens, raises an exception.
    """
    result = system_variable(var)
    if result is None:
        raise ValueError('Unable to retrieve system variable: "{}"'.format(var))
    return result


def system_variable(var):
    """
    Returns a KBase system variable. Just a little wrapper.

    Parameters
    ----------
    var: string, one of "workspace", "workspace_id", "token", "user_id"
        workspace - returns the KBase workspace name
        workspace_id - returns the numerical id of the current workspace
        token - returns the current user's token credential
        user_id - returns the current user's id

    if anything is not found, returns None
    """
    var = var.lower()
    if var == 'workspace':
        return os.environ.get('KB_WORKSPACE_ID', None)
    elif var == 'workspace_id':
        ws_name = os.environ.get('KB_WORKSPACE_ID', None)
        if ws_name is None:
            return None
        try:
            ws_info = clients.get('workspace').get_workspace_info({'workspace': ws_name})
            return ws_info[0]
        except:
            return None
    elif var == 'token':
        token = biokbase.auth.get_auth_token()
        if token == 'none':
            return None
        return token
    elif var == 'user_id':
        token = biokbase.auth.get_auth_token()
        if token is None:
            return None
        try:
            user_info = biokbase.auth.get_user_info(token)
            return user_info.get('user', None)
        except:
            return None
        # TODO: make this better with more exception handling.
    else:
        return None


def map_inputs_from_job(job_inputs, app_spec):
    """
    Unmaps the actual list of job inputs back to the
    parameters specified by app_spec.
    For example, the inputs given to a method might be a list like this:
    ['input1', {'ws': 'my_workspace', 'foo': 'bar'}]
    and the input mapping looks like:
    [{
        'target_position': 0,
        'input_parameter': 'an_input'
    },
    {
        'target_position': 1,
        'target_property': 'ws',
        'input_parameter': 'workspace'
    },
    {
        'target_position': 1,
        'target_property': 'foo',
        'input_parameter': 'baz'
    }]
    this would return:
    {
        'an_input': 'input1',
        'workspace': 'my_workspace',
        'baz': 'bar'
    }
    This only covers those parameters from the input_mapping that come with an input_parameter
    field. system variables, constants, etc., are ignored - this function just goes back to the
    original inputs set by the user.
    """
    input_dict = dict()
    spec_inputs = app_spec['behavior']['kb_service_input_mapping']

    # expect the inputs to be valid. so things in the expected position should be the
    # right things (either dict, list, singleton)
    for param in spec_inputs:
        if 'input_parameter' not in param:
            continue
        input_param = param.get('input_parameter', None)
        position = param.get('target_position', 0)
        prop = param.get('target_property', None)
        value = job_inputs[position]
        if prop is not None:
            value = value.get(prop, None)

        # that's the value. Now, if it was transformed, try to transform it back.
        if 'target_type_transform' in param:
            transform_type = param['target_type_transform']
            if transform_type.startswith('list') and isinstance(value, list):
                inner_transform = transform_type[5:-1]
                for i in range(len(value)):
                    value[i] = _untransform(inner_transform, value[i])
            else:
                value = _untransform(transform_type, value)

        input_dict[input_param] = value
    return input_dict


def _untransform(transform_type, value):
    if transform_type == 'ref' and isinstance(value, basestring):
        # shear off everything before the first '/' - there should just be one.
        slash = value.find('/')
        if slash == -1:
            return value
        else:
            return value[slash+1:]
    else:
        return value


def app_param(p):
    p_info = {'id': p['id'], 'is_group': False}

    if p['optional'] == 0:
        p_info['optional'] = False
    else:
        p_info['optional'] = True

    p_info['short_hint'] = p['short_hint']
    p_info['description'] = p['description']
    p_info['type'] = p['field_type'].lower()
    p_info['is_output'] = False

    p_info['allow_multiple'] = False
    if p['allow_multiple'] == 1:
        p_info['allow_multiple'] = True

    if p_info['type'] == 'dropdown':
        p_info['allowed_values'] = [opt['value'] for opt in p['dropdown_options']['options']]
    if p_info['type'] == 'checkbox':
        p_info['allowed_values'] = [True, False]

    defaults = p['default_values']
    # remove any empty strings, because that's silly
    defaults = [x for x in defaults if x]
    if p_info['allow_multiple']:
        p_info['default'] = defaults
    else:
        p_info['default'] = defaults[0] if len(defaults) > 0 else None

    if 'checkbox_options' in p and len(p['checkbox_options'].keys()) == 2:
        p_info['checkbox_map'] = [p['checkbox_options']['checked_value'], p['checkbox_options']['unchecked_value']]

    if 'text_options' in p:
        opts = p['text_options']
        if 'is_output_name' in opts:
            p_info['is_output'] = opts['is_output_name']
        if 'valid_ws_types' in opts and len(opts['valid_ws_types']) > 0:
            p_info['allowed_types'] = opts['valid_ws_types']
        if 'validate_as' in opts and p_info['type'] != 'checkbox' and p_info['type'] != 'custom':
            p_info['type'] = opts['validate_as']
        if 'min_float' in opts:
            p_info['min_val'] = opts['min_float']
        if 'min_int' in opts:
            p_info['min_val'] = opts['min_int']
        if 'max_float' in opts:
            p_info['max_val'] = opts['max_float']
        if 'max_int' in opts:
            p_info['max_val'] = opts['max_int']
        if 'regex_constraint' in opts and len(opts['regex_constraint']):
            p_info['regex_constraint'] = opts['regex_constraint']
    return p_info


def map_outputs_from_state(state, params, app_spec):
    """
    Returns the dict of output values from a completed app.
    Also returns the output widget.
    """
    if 'behavior' not in app_spec:
        raise ValueError("Invalid app spec - unable to map outputs")
    widget_params = dict()
    out_mapping_key = 'kb_service_output_mapping'
    if out_mapping_key not in app_spec['behavior']:
        # for viewers or short-running things, but the inner keys are the same.
        out_mapping_key = 'output_mapping'

    spec_params = dict((app_spec_param['id'], app_param(app_spec_param))
                       for app_spec_param in app_spec['parameters'])

    for out_param in app_spec['behavior'].get(out_mapping_key, []):
        value = None
        input_param_id = None
        if 'narrative_system_variable' in out_param:
            value = system_variable(out_param['narrative_system_variable'])
        elif 'constant_value' in out_param:
            value = out_param['constant_value']
        elif 'input_parameter' in out_param:
            input_param_id = out_param['input_parameter']
            value = params.get(input_param_id, None)
        elif 'service_method_output_path' in out_param:
            value = get_result_sub_path(state['result'], out_param['service_method_output_path'])

        spec_param = None
        if input_param_id:
            spec_param = spec_params.get(input_param_id)
        value = transform_param_value(out_param.get('target_type_transform'), value, spec_param)

        p_id = out_param.get('target_property', None)
        if p_id is not None:
            widget_params[p_id] = value
        else:
            widget_params = value

    output_widget = app_spec.get('widgets', {}).get('output', 'kbaseDefaultNarrativeOutput')
    # Yes, sometimes silly people put the string 'null' in their spec.
    if (output_widget == 'null'):
        output_widget = 'kbaseDefaultNarrativeOutput'

    return (output_widget, widget_params)


def get_result_sub_path(result, path):
    """
    Peels the right value out of the result with the given path.
    result - list
        This is a list of objects - each object is either a singleton, list, or object.
    path - list
        This is a list of strings
    pos - int
        This is the position in path that we're looking at right now.

    A typical run looks like this:
    result = [{'report': 'asdf', 'report_ref': 'xyz'}]
    path = ['0', 'report_ref']
    pos = 0

    So it recursively works through.
    look at path[pos] - that's a 0, so get the 0th element of result (the dict that's there.)
    since result is a list (it almost always is, to start with, since that's what run_job returns), we get:
    result[path[0]] = {'report': 'asdf', 'report_ref': 'xyz'}
    path = ['0', 'report_ref']
    pos = 1

    and do it again.
    Now, since result is NOT a list (it's the terminal element), do one of 2 things.
    1. if there's no part of the path left (e.g. path == []), return the result object.
    2. otherwise (as in this case), continue.
    now, result = result[path[1]] = result['report_ref'] = 'xyz'
    path = unchanged
    pos = 2
    and repeat

    Finally, pos = 2, pos > len(path), so just return the final result - 'xyz'

    In total, we use path to get to the exact value we want out of the result list.
    Kinda complex for a few lines of code.

    Returns None if the expected value isn't there - either the key doesn't exist or
    the array element is out of range.
    """
    # When we have an empty path, it is the identity of the result.
    if len(path) == 0:
        return result

    # if we have a list, assume the first element of the path is an integer
    # in string's clothing
    path_head = path[0]
    path_tail = path[1:]
    if isinstance(result, list):
        elem = int(path_head)
        if elem >= len(result):
            return None
        else:
            return get_result_sub_path(result[elem], path_tail)
    return get_result_sub_path(result.get(path_head), path_tail)


def extract_ws_refs(app_id, tag, spec_params, params):
    """
    Returns a list of workspace refs (xxx/yyy/zzz) from the given parameters,
    if they are actual workspace objects.
    """
    # Cheater way for making a dict of params with param[id] => param
    params_dict = dict((spec_params[i]['id'], spec_params[i])
                       for i in range(len(spec_params)))
    workspace = system_variable('workspace')
    ws_input_refs = list()
    for p in spec_params:
        if p['id'] in params:
            (wsref, err) = check_parameter(p,
                                           params[p['id']],
                                           workspace,
                                           all_params=params_dict)
            if wsref is not None:
                if isinstance(wsref, list):
                    for ref in wsref:
                        if ref is not None:
                            ws_input_refs.append(ref)
                else:
                    ws_input_refs.append(wsref)
    return ws_input_refs


def validate_parameters(app_id, tag, spec_params, params):
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
    spec_param_ids = [p['id'] for p in spec_params]

    # Cheater way for making a dict of params with param[id] => param
    params_dict = dict((spec_params[i]['id'], spec_params[i])
                       for i in range(len(spec_params)))

    # First, test for presence.
    missing_params = list()
    for p in spec_params:
        if not p['optional'] and \
           not p['default'] and \
           not params.get(p['id'], None):
            missing_params.append(p['id'])
    if len(missing_params):
        msg = 'Missing required parameters {} - try executing app_usage(' \
              '"{}", tag="{}") for more information'
        msg = msg.format(json.dumps(missing_params), app_id, tag)
        raise ValueError(msg)

    # Next, test for extra params that don't make sense
    extra_params = list()
    for p in params.keys():
        if p not in spec_param_ids:
            extra_params.append(p)
    if len(extra_params):
        msg = 'Unknown parameters {} - maybe something was misspelled?\n' \
              'execute app_usage("{}", tag="{}") for more information'
        msg = msg.format(json.dumps(extra_params), app_id, tag)
        raise ValueError(msg)

    # Now, validate parameter values.
    # Should also check if input (NOT OUTPUT) object variables are
    # present in the current workspace
    workspace = system_variable('workspace')
    ws_id = system_variable('workspace_id')
    if workspace is None or ws_id is None:
        msg = 'Unable to retrive current Narrative workspace ' \
              'information! workspace={}, workspace_id={}'
        msg = msg.format(workspace, ws_id)
        raise ValueError(msg)

    param_errors = list()
    # If they're workspace objects, track their refs in a list we'll pass
    # to run_job as a separate param to track provenance.
    ws_input_refs = list()
    for p in spec_params:
        if p['id'] in params:
            (wsref, err) = check_parameter(p,
                                           params[p['id']],
                                           workspace,
                                           all_params=params_dict)
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
        raise ValueError('Parameter value errors found!\n{}'.format(
            "\n".join(param_errors)))

    # Hooray, parameters are validated. Set them up for transfer.
    for p in spec_params:
        # If any param is a checkbox, need to map from boolean to actual
        # expected value in p['checkbox_map']
        # note that True = 0th elem, False = 1st
        if p['type'] == 'checkbox':
            if p['id'] in params:
                checkbox_idx = 0 if params[p['id']] else 1
                params[p['id']] = p['checkbox_map'][checkbox_idx]
        # While we're at it, set the default values for any
        # unset parameters that have them
        if p.get('default', '') and p['id'] not in params:
            params[p['id']] = p['default']

    return (params, ws_input_refs)


def check_parameter(param, value, workspace, all_params=dict()):
    """
    Checks if the given value matches the rules provided in the param dict.
    If yes, returns None
    If no, returns a String with an error.

    This is a pretty light wrapper around validate_param_value that
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
    if param['allow_multiple'] and isinstance(value, list):
        ws_refs = list()
        error_list = list()
        for v in value:
            if param['type'] == 'group':
                # returns ref and err as a list
                (ref, err) = validate_group_values(param,
                                                   v,
                                                   workspace,
                                                   all_params)
                if err:
                    error_list += err
                if ref:
                    ws_refs += ref
            else:
                # returns a single ref / err pair
                (ref, err) = validate_param_value(param,
                                                  v,
                                                  workspace)
                if err:
                    error_list.append(err)
                if ref:
                    ws_refs.append(ref)
        if len(error_list):
            return (None, "\n\t".join(error_list))
        else:
            return (ws_refs, None)
    return validate_param_value(param, value, workspace)


def validate_group_values(param, value, workspace, spec_params):
    ref = list()
    err = list()

    if not isinstance(value, dict):
        return (None, "A parameter-group must be a dictionary")

    for param_id in value:
        if param_id not in spec_params:
            err.append(
                'Unknown parameter id "{}" in parameter group'.format(
                    param_id
                )
            )
            continue
        if param_id not in param.get('parameter_ids', []):
            err.append(
                'Unmappable parameter id "{}" in parameter group'.format(
                    param_id
                )
            )
            continue
        (param_ref, param_err) = validate_param_value(
            spec_params[param_id], value[param_id], workspace
        )
        if param_ref:
            ref.append(param_ref)
        if param_err:
            err.append(param_err)
    return (ref, err)


def validate_param_value(param, value, workspace):
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
    # The workspace reference for the parameter. Can be None.
    ws_ref = None

    # allow None to pass, we'll just pass it to the method.
    if value is None:
        return (ws_ref, None)

    # Also, for strings, an empty string is the same as null/None
    if param['type'] in ['string', 'dropdown', 'checkbox'] and \
            isinstance(value, basestring) and value == '':
        return (ws_ref, None)

    # cases - value == list (checked by wrapping function,
    #  check_parameter), int, float, others get rejected
    if param['type'] == 'group' and not (isinstance(value, list) or
                                         isinstance(value, dict)):
        return (ws_ref, "a parameter group must be of type list or dict")
    elif param['type'] == 'mapping' and not isinstance(value, dict):
        return (ws_ref, "a parameter of type 'mapping' must be a dict")
    elif param['type'] == 'textsubdata' and \
            not (isinstance(value, basestring) or
                 isinstance(value, list)):
        return (ws_ref, "input value not supported for 'textsubdata' type - "
                        "only str or list is supported")
    elif param['type'] == 'custom_textsubdata' and \
            not (isinstance(value, basestring) or
                 isinstance(value, list)):
        return (ws_ref, "input value not supported for 'custom_textsubdata' type - "
                        "only str or list is supported")
    elif param['type'] not in ['group', 'mapping', 'textsubdata', 'custom_textsubdata', 'custom'] and \
            not (isinstance(value, basestring) or
                 isinstance(value, int) or
                 isinstance(value, float)):
        return (ws_ref, "input value not supported for '" + str(param['type']) +
                        "' type - only str, int or float")

    # check types. basestring is pretty much anything (it'll just get
    # casted), but ints, floats, or lists are funky.
    if param['type'] == 'int' and not isinstance(value, int):
        return (ws_ref, 'Given value {} is not an int'.format(value))
    elif param['type'] == 'float' and not (isinstance(value, float) or
                                           isinstance(value, int)):
        return (ws_ref, 'Given value {} is not a number'.format(value))

    # if it's expecting a workspace object, check if that's present,
    # and a valid type
    if 'allowed_types' in param and len(param['allowed_types']) > 0 and \
            not param['is_output']:
        try:
            # If we see a / , assume it's already an object reference.
            if '/' in value:
                path_items = [item.strip() for item in value.split(';')]
                for path_item in path_items:
                    if len(path_item.split('/')) > 3:
                        return (ws_ref, ('Data reference named {} does not ' +
                                         'have the right format - should be ' +
                                         'workspace/object/version(optional)'
                                         ).format(value))
                info = clients.get('workspace').get_object_info_new({
                    'objects': [{'ref': value}]
                })[0]
                path_items[len(path_items) - 1] = "{}/{}/{}".format(info[6], info[0], info[4])
                ws_ref = ';'.join(path_items)
            # Otherwise, assume it's a name, not a reference.
            else:
                info = clients.get('workspace').get_object_info_new({
                    'objects': [{'workspace': workspace, 'name': value}]
                })[0]
                ws_ref = "{}/{}/{}".format(info[6], info[0], info[4])
            type_ok = False
            for t in param['allowed_types']:
                if re.match(t, info[2]):
                    type_ok = True
            if not type_ok:
                msg = 'Type of data object, {}, ' \
                      'does not match allowed types'
                return (ws_ref, msg.format(info[2]))
        except Exception as e:
            print(e)
            msg = 'Data object named {} not found with this Narrative.'
            return (ws_ref, msg.format(value))

    # if it expects a set of allowed values, check if this one matches
    if 'allowed_values' in param:
        if value not in param['allowed_values']:
            return (ws_ref, "Given value '{}' is not permitted"
                            "in the allowed set.".format(value))

    # if it expects a numerical value in a certain range, check that.
    if 'max_val' in param:
        try:
            if float(value) > param['max_val']:
                return (ws_ref, "Given value {} should be <= {}".format(
                        value, param['max_val']))
        except:
            return (ws_ref,
                    "Given value {} must be a number".format(value))

    if 'min_val' in param:
        try:
            if float(value) < param['min_val']:
                return (ws_ref, "Given value {} should be >= {}".format(
                        value, param['min_val']))
        except:
            return (ws_ref,
                    "Given value {} must be a number".format(value))

    # if it's an output object, make sure it follows the data object rules.
    if param.get('is_output', False):
        if re.search(r'\s', value):
            return (ws_ref, "Spaces are not allowed in data object names.")
        if re.match(r'^\d+$', value):
            return (ws_ref, "Data objects cannot be just a number.")
        if not re.match(r'^[a-z0-9|\.|\||_\-]*$', value, re.IGNORECASE):
            return (ws_ref,
                    "Data object names can only include symbols: _ - . |")

    # Last, regex. not being used in any extant specs, but cover it anyway.
    # Disabled for now - the regex string that works in javascript may not work
    # in python and vice versa
    # if 'regex_constraint' in param:
    #     for regex in param['regex_constraint']:
    #         regex_string = regex.get('regex')
    #         if not re.match(regex_string, value):
    #             return (ws_ref,
    #                     'Value {} does not match required regex {}'.format(
    #                         value, regex))

    # Whew. Passed all filters!
    return (ws_ref, None)


def resolve_single_ref(workspace, value):
    ret = None
    if '/' in value:
        path_items = [item.strip() for item in value.split(';')]
        for path_item in path_items:
            if len(path_item.split('/')) > 3:
                raise ValueError('Object reference {} has too many slashes  - should be workspace/object/version(optional)'.format(value))
            # return (ws_ref, 'Data reference named {} does not have the right format - should be workspace/object/version(optional)')
        info = clients.get('workspace').get_object_info_new({'objects': [{'ref': value}]})[0]
        path_items[len(path_items) - 1] = "{}/{}/{}".format(info[6], info[0], info[4])
        ret = ';'.join(path_items)
    # Otherwise, assume it's a name, not a reference.
    else:
        info = clients.get('workspace').get_object_info_new({'objects': [{'workspace': workspace, 'name': value}]})[0]
        ret = "{}/{}/{}".format(info[6], info[0], info[4])
    return ret


def resolve_ref(workspace, value):
    if isinstance(value, list):
        return [resolve_single_ref(workspace, v) for v in value]
    else:
        return resolve_single_ref(workspace, value)


def resolve_ref_if_typed(value, spec_param):
    """
    For a given value and associated spec, if this is not an output param,
    then ensure that the reference points to an object in the current
    workspace, and transform the value into an absolute reference to it.
    """
    is_output = 'is_output' in spec_param and spec_param['is_output'] == 1
    if 'allowed_types' in spec_param and not is_output:
        allowed_types = spec_param['allowed_types']
        if len(allowed_types) > 0:
            workspace = system_variable('workspace')
            return resolve_ref(workspace, value)
    return value


def transform_param_value(transform_type, value, spec_param):
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
    if transform_type is None and spec_param is not None and spec_param['type'] == 'textsubdata':
        transform_type = "string"

    if transform_type is None or transform_type == "none" or transform_type == "object-name":
        return value

    elif transform_type == "ref" or transform_type == "unresolved-ref":
        # make unresolved workspace ref (like 'ws-name/obj-name')
        if (value is not None) and ('/' not in value):
            value = system_variable('workspace') + '/' + value
        return value

    elif transform_type == "resolved-ref":
        # make a workspace ref
        if value is not None:
            value = resolve_ref(system_variable('workspace'), value)
        return value

    elif transform_type == "future-default":
        # let's guess base on spec_param
        if spec_param is None:
            return value
        else:
            if value is not None:
                value = resolve_ref_if_typed(value, spec_param)
            return value

    elif transform_type == "int":
        # make it an integer, OR 0.
        if value is None or len(str(value).strip()) == 0:
            return None
        return int(value)

    elif transform_type == "string":
        if value is None:
            return value
        elif isinstance(value, list):
            return ",".join(value)
        elif isinstance(value, dict):
            return ",".join([key + "=" + str(value[key]) for key in value])
        else:
            return str(value)

    elif transform_type.startswith("list<") and \
            transform_type.endswith(">"):
        # make it a list of transformed types.
        list_type = transform_type[5:-1]
        if isinstance(value, list):
            ret = []
            for pos in range(0, len(value)):
                ret.append(transform_param_value(list_type, value[pos], None))
            return ret
        else:
            return [transform_param_value(list_type, value, None)]

    else:
        raise ValueError("Unsupported Transformation type: " +
                         transform_type)
