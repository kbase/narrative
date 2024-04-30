"""Utility functions for dealing with KBase services, etc."""

__author__ = "Dan Gunter <dkgunter@lbl.gov>"
__date__ = "1/6/14"

import os
import re


def kbase_debug_mode() -> bool:
    """Check whether the KBASE_DEBUG env var is set.

    :return: True or False
    :rtype: bool
    """
    return bool(os.environ.get("KBASE_DEBUG"))


class _KBaseEnv:
    """Single place to get/set KBase environment variables.

    Also act as a dict for LogAdapter's "extra" arg.

    Use global variable `kbase_env` instead of this class.
    """

    # Environment variables.
    # Each is associated with an attribute that is the
    # same as the variable name without the 'env_' prefix.
    env_auth_token = "KB_AUTH_TOKEN"  # noqa: S105
    env_narrative = "KB_NARRATIVE"
    env_session = "KB_SESSION"
    env_client_ip = "KB_CLIENT_IP"
    env_workspace = "KB_WORKSPACE_ID"
    env_user = "KB_USER_ID"
    env_env = "KB_ENVIRONMENT"
    env_anon_user_id = "KB_ANON_USER_ID"

    _defaults = {
        "auth_token": "none",
        "narrative": "none",
        "session": "none",
        "client_ip": "0.0.0.0",  # noqa: S104
        "user": "anonymous",
        "workspace": "none",
        "env": "none",
        "anon_user_id": "none",
    }

    def __getattr__(self: "_KBaseEnv", name: str) -> str:
        ename = "env_" + name
        if ename in _KBaseEnv.__dict__:
            return os.environ.get(getattr(self.__class__, ename), self._defaults[name])
        err_msg = f"kbase_env: {name}"
        raise KeyError(err_msg)

    def __setattr__(self: "_KBaseEnv", name: str, value: str | None):
        ename = "env_" + name
        if ename in _KBaseEnv.__dict__:
            env_var = getattr(self.__class__, ename)
            if value is None and env_var in os.environ:
                del os.environ[env_var]
            elif value is not None:
                os.environ[getattr(self.__class__, ename)] = value

    # Dict emulation

    def __iter__(self: "_KBaseEnv"):
        return iter(self.keys())

    def __getitem__(self: "_KBaseEnv", name: str):
        return getattr(self, name)

    def __contains__(self: "_KBaseEnv", name: str):
        return name in self._defaults

    def keys(self: "_KBaseEnv"):
        return list(self._defaults.keys())

    def iterkeys(self: "_KBaseEnv"):
        return iter(self._defaults.keys())

    def __str__(self: "_KBaseEnv"):
        return ", ".join([f"{k}: {self[k]}" for k in self.keys()])

    def _user(self: "_KBaseEnv"):
        token = self.auth_token
        if not token:
            return self._defaults["user"]
        m = re.search("un=([^|]+)", token)
        return m.group(1) if m else self._defaults["user"]


# Get/set KBase environment variables by getting/setting
# attributes of this object.
kbase_env = _KBaseEnv()
