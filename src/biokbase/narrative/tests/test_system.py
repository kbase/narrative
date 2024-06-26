"""Test system and strict system variables."""

import os
import time
from unittest import mock

import biokbase.auth
import pytest
from biokbase.narrative.system import strict_system_variable, system_variable
from biokbase.narrative.tests import util
from biokbase.narrative.tests.narrative_mock.mockclients import get_mock_client

user_token = "SOME_TOKEN"  # noqa: S105
config = util.ConfigTests()
user_token = util.read_token_file(config.get_path("token_files", "test_user", from_root=True))

# inject phony variables into the environment
bad_fake_token = "NotAGoodTokenLOL"  # noqa: S105
workspace = "valid_workspace"
bad_variable = "not a variable"


# test standard system_variable function
# N.b. these tests alter environment variables without restoring previous values
# afterwards and should ideally be rewritten not to do so.


def test_sys_var_user(user_name: str, user_token: str) -> None:
    if user_token:
        biokbase.auth.set_environ_token(user_token)
        assert system_variable("user_id") == user_name


def test_sys_var_no_ws() -> None:
    if "KB_WORKSPACE_ID" in os.environ:
        del os.environ["KB_WORKSPACE_ID"]
    assert system_variable("workspace") is None


def test_sys_var_workspace() -> None:
    os.environ["KB_WORKSPACE_ID"] = workspace
    assert system_variable("workspace") == workspace


def test_sys_var_no_ws_id() -> None:
    if "KB_WORKSPACE_ID" in os.environ:
        del os.environ["KB_WORKSPACE_ID"]
    assert system_variable("workspace_id") is None


@mock.patch("biokbase.narrative.app_util.clients.get", get_mock_client)
def test_sys_var_workspace_id() -> None:
    os.environ["KB_WORKSPACE_ID"] = workspace
    assert system_variable("workspace_id") == 12345


@mock.patch("biokbase.narrative.app_util.clients.get", get_mock_client)
def test_sys_var_workspace_id_except() -> None:
    os.environ["KB_WORKSPACE_ID"] = "invalid_workspace"
    assert system_variable("workspace_id") is None


def test_sys_var_user_bad() -> None:
    biokbase.auth.set_environ_token(bad_fake_token)
    assert system_variable("user_id") is None


def test_sys_var_user_none() -> None:
    if "KB_AUTH_TOKEN" in os.environ:
        del os.environ["KB_AUTH_TOKEN"]
    assert system_variable("user_id") is None


def test_sys_var_time_ms() -> None:
    cur_t = int(time.time() * 1000)
    ts = system_variable("timestamp_epoch_ms")
    assert isinstance(ts, int)
    assert cur_t <= ts
    assert ts - cur_t < 1000


def test_sys_var_time_sec() -> None:
    cur_t = int(time.time())
    ts = system_variable("timestamp_epoch_sec")
    assert isinstance(ts, int)
    assert cur_t <= ts
    assert ts - cur_t < 1


def test_sys_var_bad() -> None:
    assert system_variable(bad_variable) is None


# test strict_system_variable function
def test_strict_sys_var_user_ok(user_name, user_token) -> None:
    if user_token:
        biokbase.auth.set_environ_token(user_token)
        assert strict_system_variable("user_id") == user_name
        biokbase.auth.set_environ_token(None)


def test_strict_sys_var_user_bad() -> None:
    biokbase.auth.set_environ_token(bad_fake_token)
    with pytest.raises(ValueError, match='Unable to retrieve system variable: "user_id"'):
        strict_system_variable("user_id")
    biokbase.auth.set_environ_token(None)
