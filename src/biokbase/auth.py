"""Narrative authentication tools.

This uses the KBase auth2 API to get and manage auth tokens.
"""

from typing import Any

import requests
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.util import kbase_env

token_api_url = URLS.auth + "/api/V2"
endpt_token = "/token"  # noqa: S105
endpt_token_revoke = "/tokens/revoke"  # noqa: S105
endpt_user_display = "/users/?list="
endpt_me = "/me"


class TokenInfo:
    """Container for token information.

    Converts an information dictionary from the Auth service to a
    simple class that contains default values.

    Default values for strings are None, for numerical fields are 0,
    and for the "custom" field is empty dictionary.

    If token is provided as a kwarg, that overrides the "token" key of
    the info dict, if present.
    """

    def __init__(self: "TokenInfo", info_dict: dict, token: str | None = None) -> None:
        """Create an instance of the TokenInfo class."""
        self.cachefor = info_dict.get("cachefor", 0)
        self.created = info_dict.get("created", 0)
        self.custom = info_dict.get("custom", {})
        self.expires = info_dict.get("expires", 0)
        self.id = info_dict.get("id")
        self.token = token if token is not None else info_dict.get("token")
        self.token_name = info_dict.get("name")
        self.token_type = info_dict.get("type")
        self.user_name = info_dict.get("user")


class UserInfo:
    """A container for user information that comes from the Auth service.

    Does not hold the token itself.
    """

    def __init__(self: "UserInfo", user_dict: dict[str, Any]) -> None:
        """Create an instance of the UserInfo class."""
        self.anon_user_id = user_dict.get("anonid")
        self.custom_roles = user_dict.get("customroles", [])
        self.display_name = user_dict.get("display")
        self.user_name = user_dict.get("user")


def validate_token() -> bool:
    """Validates the currently set auth token.

    Returns True if valid, False otherwise.
    """
    headers = {"Authorization": get_auth_token()}
    r = requests.get(token_api_url + endpt_token, headers=headers)
    return r.status_code == 200


def set_environ_token(token: str | None) -> None:
    """Sets a login token in the local environment variable."""
    kbase_env.auth_token = token


def get_auth_token() -> str | None:
    """Returns the current login token being used, or None if one isn't set."""
    return kbase_env.auth_token


def get_user_info(token: str) -> UserInfo:
    """Returns the UserInfo object with information about the user who owns the valid token.

    If the token is invalid (i.e. the status_code
    of the request is not ok), an HTTPError exception is raised.
    """
    headers = {"Authorization": token}
    r = requests.get(token_api_url + endpt_me, headers=headers)
    r.raise_for_status()
    return UserInfo(r.json())


def get_token_info(token: str) -> TokenInfo:
    """Retrieve token information as a TokenInfo object."""
    headers = {"Authorization": token}
    r = requests.get(token_api_url + endpt_token, headers=headers)
    r.raise_for_status()
    return TokenInfo(r.json(), token=token)


def init_session_env(token_info: TokenInfo, user_info: UserInfo, ip: str) -> None:
    """Initializes the internal session environment.

    Parameters:
      token_info: TokenInfo object, uses id, token, and user attributes
      ip: the client IP address
    """
    set_environ_token(token_info.token)
    kbase_env.session = token_info.id
    kbase_env.user = token_info.user_name
    kbase_env.anon_user_id = user_info.anon_user_id
    kbase_env.client_ip = ip


def get_agent_token(login_token: str, token_name: str = "NarrativeAgent") -> TokenInfo:  # noqa: S107
    """Given a user token, get an agent token.

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
    return TokenInfo(r.json())


def get_display_names(auth_token: str, user_ids: list[str]) -> dict[str, Any]:
    """Given a list of user IDs, get the corresponding display names."""
    headers = {"Authorization": auth_token}
    r = requests.get(token_api_url + endpt_user_display + ",".join(user_ids), headers=headers)
    r.raise_for_status()
    return r.json()
