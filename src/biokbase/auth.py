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


def get_auth_token():
    return kbase_env.auth_token


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


def get_agent_token(login_token, token_name="NarrativeAgent"):
    """
    Uses the given login token (if it's valid) to get and return an agent token from
    the server. This returns generated token as a dict with keys (straight from the
    auth service):
    token: the token string itself - can be used to do things
    id: the token's UUID string - can be used to revoke it later
    type: Agent
    expires: expiration date, ms since epoch
    created: ms since epoch
    """
    headers = {"Authorization": login_token,
               "Content-Type": "Application/json"}
    data = json.dumps({"tokenname": token_name})
    r = requests.post(URLS.auth + "/api/V2/token", headers=headers, data=data)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
    agent_token_info = json.loads(r.content)
    return agent_token_info
