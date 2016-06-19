"""
Some utility functions for running KBase Apps or Methods or whatever they are this week.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

import os
import re
import biokbase.narrative.clients as clients

app_version_tags = ['release', 'beta', 'dev']
_ws_clients = clients.get('workspace')

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
    var: string, one of "workspace", "token", "user_id"
        workspace - returns the KBase workspace name
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
        ws_info = _ws_client.get_workspace_info({'workspace': ws_name})
        return ws_info[0]
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

def map_inputs_from_state(state, app_spec):
    """
    returns a dict of readable (ish) method inputs - those used for the run_app function - to the input values.
    narrative_system_variables are ignored, so workspace names and tokens shouldn't show up.
    """
    input_dict = dict()
    inputs = state['original_app']['steps'][0]['input_values'][0]
    spec_inputs = app_spec['behavior']['kb_service_input_mapping']
    # preprocess so it's O(1) lookup
    targets_to_inputs = dict()
    for spec_input in spec_inputs:
        if 'input_parameter' in spec_input:
            targets_to_inputs[spec_input['target_property']] = spec_input['input_parameter']

    for target_name in inputs:
        if target_name in targets_to_inputs:
            input_dict[targets_to_inputs[target_name]] = inputs[target_name]

    return input_dict