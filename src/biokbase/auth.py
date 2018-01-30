"""
Narrative authentication tools.
This uses the KBase auth2 API to get and manage auth tokens.
"""

import requests
import json
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.util import kbase_env

tokenenv = 'KB_AUTH_TOKEN'
token_api_url = URLS.auth + "/api/V2"
endpt_token = "/token"
endpt_token_revoke = "/tokens/revoke"


def validate_token():
    """
    Validates the currently set auth token. Returns True if valid, False otherwise.
    """
    headers = {"Authorization": get_auth_token()}
    r = requests.get(token_api_url + endpt_token, headers=headers)
    if r.status_code == 200:
        return True
    else:
        return False


def set_environ_token(token):
    """
    Sets a login token in the local environment variable.
    """
    kbase_env.auth_token = token


def get_auth_token():
    """
    Returns the current login token being used, or None if one isn't set.
    """
    return kbase_env.auth_token


def get_user_info(token):
    """
    This uses the given token to query the authentication service for information
    about the user who created the token.
    """
    headers = {"Authorization": token}
    r = requests.get(token_api_url + endpt_token, headers=headers)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
    auth_info = json.loads(r.content)
    auth_info['token'] = token
    return auth_info


def init_session_env(auth_info, ip):
    """
    Initializes the internal session environment.
    Parameters:
      auth_info: dict, expects the following keys:
        token: the auth token string
        id: the auth token id
        user: the username of whoever created the auth token
      ip: the client IP address
    """
    set_environ_token(auth_info.get('token', None))
    kbase_env.session = auth_info.get('id', '')
    kbase_env.user = auth_info.get('user', '')
    kbase_env.client_ip = ip


def new_session(token):
    """
    Initializes a new session from the given token, storing information
    in kbase_env.
    """
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
    data = json.dumps({"name": token_name})
    r = requests.post(token_api_url + endpt_token, headers=headers, data=data)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
    agent_token_info = json.loads(r.content)
    return agent_token_info


def revoke_token(auth_token, revoke_id):
    """
    Revokes and invalidates an auth token, if it exists. If that token doesn't exist,
    this throws a 404.
    params:
    auth_token - the token to use for authorization to revoke something.
    revoke_id - the id of the token to invalidate
    """
    headers = {"Authorization": auth_token}
    r = requests.delete(URLS.auth + endpt_token_revoke + "/" + revoke_id, headers=headers)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
