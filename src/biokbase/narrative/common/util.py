"""
Utility functions for dealing with KBase services, etc.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '1/6/14'

import json
import os
import re
import requests
from setuptools import Command
import time
from .kvp import KVP_EXPR, parse_kvp
from biokbase.workspace.client import Workspace as WS2
from biokbase.workspace.baseclient import ServerError
from urllib.error import URLError

def kbase_debug_mode():
    return bool(os.environ.get('KBASE_DEBUG', None))

class _KBaseEnv(object):
    """Single place to get/set KBase environment variables.

    Also act as a dict for LogAdapter's "extra" arg.

    Use global variable `kbase_env` instead of this class.
    """
    # Environment variables.
    # Each is associated with an attribute that is the
    # same as the variable name without the 'env_' prefix.
    env_auth_token = "KB_AUTH_TOKEN"
    env_narrative  = "KB_NARRATIVE"
    env_session    = "KB_SESSION"
    env_client_ip  = "KB_CLIENT_IP"
    env_workspace  = "KB_WORKSPACE_ID"
    env_user       = "KB_USER_ID"
    env_env        = "KB_ENVIRONMENT"

    _defaults = {'auth_token': 'none',
                 'narrative': 'none',
                 'session': 'none',
                 'client_ip': '0.0.0.0',
                 'user': 'anonymous',
                 'workspace': 'none',
                 'env': 'none'}

    def __getattr__(self, name):
        ename = "env_" + name
        if ename in _KBaseEnv.__dict__:
            return os.environ.get(getattr(self.__class__, ename),
                                  self._defaults[name])
        else:
            raise KeyError("kbase_env:{}".format(name))

    def __setattr__(self, name, value):
        ename = "env_" + name
        if ename in _KBaseEnv.__dict__:
            env_var = getattr(self.__class__, ename)
            if value is None and env_var in os.environ:
                del os.environ[env_var]
            elif value is not None:
                os.environ[getattr(self.__class__, ename)] = value

    # Dict emulation

    def __iter__(self):
        return iter(self.keys())

    def __getitem__(self, name):
        return getattr(self, name)

    def __contains__(self, name):
        return name in self._defaults

    def keys(self):
        return list(self._defaults.keys())

    def iterkeys(self):
        return iter(self._defaults.keys())

    def __str__(self):
        return ', '.join(['{}: {}'.format(k, self[k])
                          for k in self.keys()])

    def _user(self):
        token = self.auth_token
        if not token:
            return self._defaults['user']
        m = re.search('un=([^|]+)', token)
        return m.group(1) if m else self._defaults['user']


# Get/set KBase environment variables by getting/setting
# attributes of this object.
kbase_env = _KBaseEnv()

class BuildDocumentation(Command):
    """Setuptools command hook to build Sphinx docs
    """
    description = "build Sphinx documentation"
    user_options = []

    def initialize_options(self):
        self.doc_dir = "biokbase-doc"

    def finalize_options(self):
        pass

    def run(self):
        filedir = os.path.dirname(os.path.realpath(__file__))
        p = filedir.find("/biokbase/")
        top = filedir[:p + 1]
        doc = top + self.doc_dir
        os.chdir(doc)
        os.system("make html")
