"""
Some utility functions for running KBase Apps or Methods or whatever they are this week.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>, Roman Sutormin <rsutormin@lbl.gov>"

import os
import re
import biokbase.narrative.clients as clients

app_version_tags = ['release', 'beta', 'dev']
_ws_client = clients.get('workspace')

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
            ws_info = _ws_client.get_workspace_info({'workspace': ws_name})
            return ws_info[0]
        except:
            return None
    elif var == 'token':
        return os.environ.get('KB_AUTH_TOKEN', None)
    elif var == 'user_id':
        token = os.environ.get('KB_AUTH_TOKEN', None)
        if token is None:
            return None
        m = re.match("un=(\w+)|", token)
        if m is not None and len(m.groups()) == 1:
            return m.group(1)
        else:
            return None
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
            continue;
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
        out_mapping_key = 'output_mapping' # for viewers or short-running things, but the inner keys are the same.

    for out_param in app_spec['behavior'].get(out_mapping_key, []):
        value = None
        if 'narrative_system_variable' in out_param:
            value = system_variable(out_param['narrative_system_variable'])
        elif 'constant_value' in out_param:
            value = out_param['constant_value']
        elif 'input_parameter' in out_param:
            value = params.get(out_param['input_parameter'], None)
        elif 'service_method_output_path' in out_param:
            value = get_result_sub_path(state['result'], out_param['service_method_output_path'])

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