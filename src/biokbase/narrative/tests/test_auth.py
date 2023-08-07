import pytest
from biokbase.auth import (
    TokenInfo,
    get_token_info,
    set_environ_token,
    init_session_env,
    get_auth_token,
    get_agent_token,
    validate_token,
    get_display_names
)
import json
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.util import kbase_env
from requests import HTTPError
import os

AUTH_URL = URLS.auth + "/api/V2/"

unauth_error = {
    "error": {
        "httpcode": 401,
        "httpstatus": "Unauthorized",
        "appcode": 10020,
        "apperror": "Invalid token",
        "message": "10020 Invalid token",
        "callid": "7024216894157398",
        "time": 1691184318526
    }
}

bad_request_error = {
    "error": {
        "httpcode": 400,
        "httpstatus": "Bad Request",
        "appcode": 10010,
        "apperror": "No authentication token",
        "message": "10010 No authentication token: No user token provided",
        "callid": "7036685833684377",
        "time": 1691184644451
    }
}

@pytest.fixture
def mock_auth_call(requests_mock):
    def run_mock_auth(verb: str, endpoint: str, token: str, return_data: dict, status_code=200):
        if status_code == 400:
            return_data = json.dumps(bad_request_error)
        elif status_code == 401:
            return_data = json.dumps(unauth_error)
        else:
            return_data = json.dumps(return_data)
        requests_mock.register_uri(
            verb,
            AUTH_URL + endpoint,
            text=return_data,
            headers={"Authorizaton": token},
            status_code=status_code
        )
    return run_mock_auth

@pytest.fixture
def mock_token_endpoint(mock_auth_call):
    def token_mocker(token, verb, return_info={}, status_code=200):
        return mock_auth_call(verb, "token", token, return_info, status_code=status_code)
    return token_mocker

@pytest.fixture
def mock_display_names_call(mock_auth_call):
    def names_mocker(token, user_ids, return_info={}, status_code=200):
        return mock_auth_call("GET", f"users/?list={','.join(user_ids)}", token, return_info, status_code=status_code)
    return names_mocker

def test_get_token_info(mock_token_endpoint):
    real_info = {
        "id": "some_id",
        "name": "MyToken",
        "user": "some_user"
    }
    token = "not_a_token"
    mock_token_endpoint(token, "GET", return_info=real_info)
    token_info = get_token_info(token)
    assert isinstance(token_info, TokenInfo)
    assert token_info.token_id == real_info["id"]
    assert token_info.user == real_info["user"]
    assert token_info.name == real_info["name"]
    assert token_info.token == token

def test_get_token_info_fail(mock_token_endpoint):
    token = "not a token"
    mock_token_endpoint(token, "GET", status_code=401)
    with pytest.raises(HTTPError):
        get_token_info("not a token")

def test_set_environ_token():
    token = "some fake token"
    set_environ_token(token)
    assert os.environ["KB_AUTH_TOKEN"] == token
    del os.environ["KB_AUTH_TOKEN"]

def test_validate_token_ok(mock_token_endpoint):
    token = "ok_token"
    set_environ_token(token)
    mock_token_endpoint(token, "GET", return_info={"id": "foo"})
    assert validate_token() == True

def test_validate_token_fail(mock_token_endpoint):
    token = "bad_token"
    set_environ_token(token)
    mock_token_endpoint(token, "GET", status_code=401)
    assert validate_token() == False


def test_init_session_env():
    token = "init_session_token"
    ip = "127.0.0.1"
    token_id = "some-token-id"
    user = "kbase_user"

    token_info = TokenInfo({
        "id": token_id,
        "user": user
    }, token=token)
    init_session_env(token_info, ip)
    assert get_auth_token() == token
    assert kbase_env.session == token_info.token_id
    assert kbase_env.user == token_info.user
    assert kbase_env.client_ip == ip


def test_get_agent_token_ok(mock_token_endpoint):
    agent_response = {
        "type": "Agent",
        "id": "agent-token-id",
        "expires": 1691616436321,
        "created": 1691011636321,
        "name": "SomeAgentToken",
        "user": "kbase_user",
        "custom": {},
        "cachefor": 300000,
        "token": "shiny-new-agent-token"
    }
    login_token = "a_login_token"
    mock_token_endpoint(login_token, "POST", return_info=agent_response)
    agent_info = get_agent_token(login_token)
    keymap = {
        "token_type": "type",
        "token_id": "id",
        "expires": "expires",
        "created": "created",
        "name": "name",
        "user": "user",
        "custom": "custom",
        "cachefor": "cachefor",
        "token": "token"
    }
    for key in keymap:
        assert getattr(agent_info, key) == agent_response[keymap[key]]


def test_get_agent_token_fail(mock_token_endpoint):
    login_token = "bad_login_token"
    mock_token_endpoint(login_token, "POST", status_code=401)
    with pytest.raises(HTTPError):
        get_agent_token(login_token)


def test_get_display_names_ok(mock_display_names_call):
    token = "display_names_token"
    user_ids = ["foo", "bar", "baz"]
    expected = {
        "foo": "Ms. Foo",
        "bar": "Dr. Bar",
        "baz": "Herr Doktor Baz IV, Esq."
    }
    mock_display_names_call(token, user_ids, expected)
    assert get_display_names(token, user_ids) == expected

def test_get_display_names_fail(mock_display_names_call):
    token = "display_names_fail"
    user_ids = ["foo", "bar"]
    mock_display_names_call(token, user_ids, status_code=401)
    with pytest.raises(HTTPError):
        get_display_names(token, user_ids)
