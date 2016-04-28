"""
Some utility functions for running KBase Apps or Methods or whatever they are this week.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

import os
import re

method_version_tags = ['release', 'beta', 'dev']

def check_tag(tag, raise_exception=False):
    """
    Checks if the given tag is one of "release", "beta", or "dev".
    Returns a boolean.
    if raise_exception == True and the tag is bad, raises a ValueError
    """
    tag_exists = tag in method_version_tags
    if not tag_exists and raise_exception:
        raise ValueError("Can't find tag %s - allowed tags are %s" % (tag, ", ".join(method_version_tags)))
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