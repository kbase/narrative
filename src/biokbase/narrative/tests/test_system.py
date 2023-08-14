import os
import biokbase.auth
from unittest import mock
from biokbase.narrative.system import (
    strict_system_variable,
    system_variable
)
from .narrative_mock.mockclients import get_mock_client
import time
from . import util
import pytest

user_token = "SOME_TOKEN"
config = util.ConfigTests()
user_id = config.get("users", "test_user")
user_token = util.read_token_file(config.get_path("token_files", "test_user", from_root=True))

# inject phony variables into the environment
bad_fake_token = "NotAGoodTokenLOL"
workspace = "valid_workspace"
bad_variable = "not a variable"


# test standard system_variable function

def test_sys_var_user():
    if user_token:
        biokbase.auth.set_environ_token(user_token)
        assert system_variable("user_id") == user_id

def test_sys_var_no_ws():
    if "KB_WORKSPACE_ID" in os.environ:
        del os.environ["KB_WORKSPACE_ID"]
    assert system_variable("workspace") is None

def test_sys_var_workspace():
    os.environ["KB_WORKSPACE_ID"] = workspace
    assert system_variable("workspace") == workspace

def test_sys_var_no_ws_id():
    if "KB_WORKSPACE_ID" in os.environ:
        del os.environ["KB_WORKSPACE_ID"]
    assert system_variable("workspace_id") is None

@mock.patch("biokbase.narrative.app_util.clients.get", get_mock_client)
def test_sys_var_workspace_id():
    os.environ["KB_WORKSPACE_ID"] = workspace
    assert system_variable("workspace_id") == 12345

@mock.patch("biokbase.narrative.app_util.clients.get", get_mock_client)
def test_sys_var_workspace_id_except():
    os.environ["KB_WORKSPACE_ID"] = "invalid_workspace"
    assert system_variable("workspace_id") is None

def test_sys_var_user_bad():
    biokbase.auth.set_environ_token(bad_fake_token)
    assert system_variable("user_id") is None

def test_sys_var_user_none():
    if "KB_AUTH_TOKEN" in os.environ:
        del os.environ["KB_AUTH_TOKEN"]
    assert system_variable("user_id") is None

def test_sys_var_time_ms():
    cur_t = int(time.time() * 1000)
    ts = system_variable("timestamp_epoch_ms")
    assert cur_t <= ts
    assert ts - cur_t < 1000

def test_sys_var_time_sec():
    cur_t = int(time.time())
    ts = system_variable("timestamp_epoch_sec")
    assert cur_t <= ts
    assert ts - cur_t < 1

def test_sys_var_bad():
    assert system_variable(bad_variable) is None


# test strict_system_variable function
def test_strict_sys_var_user_ok():
    if user_token:
        biokbase.auth.set_environ_token(user_token)
        assert strict_system_variable("user_id") == user_id

def test_strict_sys_var_user_bad():
    biokbase.auth.set_environ_token(bad_fake_token)
    with pytest.raises(ValueError, match='Unable to retrieve system variable: "user_id"') as e:
        strict_system_variable("user_id")
        assert e
