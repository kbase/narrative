"""
Narrative authentication tools.
This uses the KBase auth2 API to get and manage auth tokens.
"""

from typing import Optional

import requests

from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.util import kbase_env

token_api_url = URLS.auth + "/api/V2"
endpt_token = "/token"
endpt_token_revoke = "/tokens/revoke"
endpt_user_display = "/users/?list="
endpt_me = "/me"


class TokenInfo:
    """
    Converts an information dictionary from the Auth service to a
    simple class that contains default values.

    Default values for strings are None, for numerical fields are 0,
    and for the "custom" field is empty dictionary.

    If token is provided as a kwarg, that overrides the "token" key of
    the info dict, if present.
    """

    def __init__(self, info_dict: dict, token: str = None):
        self.token_type = info_dict.get("type")
        self.token_id = info_dict.get("id")
        self.expires = info_dict.get("expires", 0)
        self.created = info_dict.get("created", 0)
        self.token_name = info_dict.get("name")
        self.user_name = info_dict.get("user")
        self.custom = info_dict.get("custom", {})
        self.cachefor = info_dict.get("cachefor", 0)
        self.token = token if token is not None else info_dict.get("token")


class UserRole:
    def __init__(self, role_info):
        self.id = role_info.get("id")
        self.description = role_info.get("desc")


class PolicyId:
    def __init__(self, policy_info):
        self.id = policy_info.get("id")
        self.agree_date = policy_info.get("agreedon")


class Identity:
    def __init__(self, ident_info):
        self.id = ident_info.get("id")
        self.provider = ident_info.get("provider")
        self.provider_user_name = ident_info.get("provusername")


class UserInfo:
    """
    A container for user information that comes from the Auth service. Does not
    hold the token itself.
    """

    def __init__(self, user_dict: dict):
        self.user_name = user_dict.get("user")
        self.created = user_dict.get("created")
        self.last_login = user_dict.get("lastlogin")
        self.display_name = user_dict.get("display")
        self.roles = [UserRole(role) for role in user_dict.get("roles", [])]
        self.custom_roles = user_dict.get("customroles", [])
        self.policy_ids = [
            PolicyId(policy) for policy in user_dict.get("policyids", [])
        ]
        self.user = user_dict.get("user")
        self.local_user = user_dict.get("local", False)
        self.email = user_dict.get("email")
        self.idents = [Identity(ident) for ident in user_dict.get("idents", [])]
        self.anon_user_id = user_dict.get("anonid")


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


def set_environ_token(token: str) -> None:
    """
    Sets a login token in the local environment variable.
    """
    kbase_env.auth_token = token


def get_auth_token() -> Optional[str]:
    """
    Returns the current login token being used, or None if one isn't set.
    """
    return kbase_env.auth_token


def get_user_info(token: str) -> UserInfo:
    """
    Returns the UserInfo object with information about the user who
    owns the valid token. If the token is invalid (i.e. the status_code
    of the request is not ok), an HTTPError exception is raised.
    """
    headers = {"Authorization": token}
    r = requests.get(token_api_url + endpt_me, headers=headers)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
    user_info = UserInfo(r.json())
    return user_info


def get_token_info(token: str) -> TokenInfo:
    headers = {"Authorization": token}
    r = requests.get(token_api_url + endpt_token, headers=headers)
    r.raise_for_status()
    auth_info = TokenInfo(r.json(), token=token)
    return auth_info


def init_session_env(auth_info: TokenInfo, ip: str) -> None:
    """
    Initializes the internal session environment.
    Parameters:
      auth_info: TokenInfo object, uses token_id, token, and user attributes
      ip: the client IP address
    """
    set_environ_token(auth_info.token)
    kbase_env.session = auth_info.token_id
    kbase_env.user = auth_info.user
    kbase_env.client_ip = ip


def get_agent_token(login_token: str, token_name: str = "NarrativeAgent") -> TokenInfo:
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
    headers = {"Authorization": login_token, "Content-Type": "Application/json"}
    data = {"name": token_name}
    r = requests.post(token_api_url + endpt_token, headers=headers, json=data)
    r.raise_for_status()
    agent_token_info = TokenInfo(r.json())
    return agent_token_info


def get_display_names(auth_token: str, user_ids: list) -> dict:
    headers = {"Authorization": auth_token}
    r = requests.get(
        token_api_url + endpt_user_display + ",".join(user_ids), headers=headers
    )
    r.raise_for_status()
    return r.json()
