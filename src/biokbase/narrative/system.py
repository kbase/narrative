import os
import time
from typing import Union

import biokbase.narrative.clients as clients
from biokbase.auth import get_auth_token, get_user_info


def strict_system_variable(var: str) -> Union[str, int]:
    """
    Returns a system variable.
    If that variable isn't defined, or anything else happens, raises an exception.
    """
    result = system_variable(var)
    if result is None:
        raise ValueError(f'Unable to retrieve system variable: "{var}"')
    return result


def system_variable(var: str) -> Union[str, int, None]:
    """
    Returns a KBase system variable. Just a little wrapper.

    Parameters
    ----------
    var: string, one of "workspace", "workspace_id", "token", "user_id",
        "timestamp_epoch_ms", "timestamp_epoch_sec"
        workspace - returns the KBase workspace name
        workspace_id - returns the numerical id of the current workspace
        token - returns the current user's token credential
        user_id - returns the current user's id
        timestamp_epoch_ms - the current epoch time in milliseconds
        timestamp_epoch_sec - the current epoch time in seconds

    if anything is not found, returns None
    """
    var = var.lower()
    if var == "workspace":
        return os.environ.get("KB_WORKSPACE_ID")
    elif var == "workspace_id":
        ws_name = os.environ.get("KB_WORKSPACE_ID")
        if ws_name is None:
            return None
        try:
            ws_info = clients.get("workspace").get_workspace_info(
                {"workspace": ws_name}
            )
            return ws_info[0]
        except Exception:
            return None
    elif var == "user_id":
        token = get_auth_token()
        if token is None:
            return None
        try:
            user_info = get_user_info(token)
            return user_info.user_name
        except Exception:
            return None
        # TODO: make this better with more exception handling.
    elif var == "timestamp_epoch_ms":
        # get epoch time in milliseconds
        return int(time.time() * 1000)
    elif var == "timestamp_epoch_sec":
        # get epoch time in seconds
        return int(time.time())
    return None
