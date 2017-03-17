"""
Kbase wrappers around Globus Online Nexus client libraries. We wrap the Nexus
libraries to provide a similar API between the Perl Bio::KBase::Auth* libraries
and the python version

In this module, we follow standard Python idioms of raising exceptions for
various failure states (Perl modules returned error states in error_msg field)
"""

import requests
import json
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.util import kbase_env

tokenenv = 'KB_AUTH_TOKEN'


def set_environ_token(token):
    kbase_env.auth_token = token


def get_user_info(token):
    headers = {"Authorization": token}
    r = requests.get(URLS.auth + "/api/V2/token", headers=headers)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
    auth_info = json.loads(r.content)
    auth_info['token'] = token
    return auth_info


def init_session_env(auth_info, ip):
    set_environ_token(auth_info.get('token', None))
    kbase_env.session = auth_info.get('id', '')
    kbase_env.user = auth_info.get('user', '')
    kbase_env.client_ip = ip


def new_session(token):
    init_session_env(get_user_info(token))
