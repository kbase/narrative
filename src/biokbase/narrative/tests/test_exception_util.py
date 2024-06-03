"""Test custom KBase exceptions and exception conversion."""

import pytest
import requests
from biokbase.execution_engine2.baseclient import ServerError as EEServerError
from biokbase.narrative.exception_util import (
    NarrativeException,
    transform_job_exception,
)
from requests.exceptions import HTTPError

ERROR_MSG = "some error message"

HTTP_ERROR = "HTTPError"
HTTP_ERROR_MSG = "http error message"


def check_error(
    nar_err: NarrativeException,
    code: int,
    message: str,
    name: str,
    source: str,
    error_msg: str | None,
) -> None:
    """Check that a NarrativeException has all the expected fields."""
    assert isinstance(nar_err, NarrativeException)
    assert nar_err.code == code
    assert nar_err.message == message
    assert nar_err.name == name
    assert nar_err.source == source
    assert nar_err.error == error_msg


def test_transform_ee2_err() -> None:
    code = 1000
    message = ERROR_MSG
    name = "EEError"
    source = "ee2"
    error = None
    ee2_err = EEServerError(name, code, message)
    nar_err = transform_job_exception(ee2_err)
    check_error(nar_err, code, message, name, source, error)


def test_transform_ee2_err__with_error() -> None:
    code = 1000
    message = ERROR_MSG
    name = "EEError"
    source = "ee2"
    error = "Unable to perform some request"
    ee2_err = EEServerError(name, code, message)
    nar_err = transform_job_exception(ee2_err, error)
    check_error(nar_err, code, message, name, source, error)


@pytest.mark.parametrize("code", [404, 502, 503])
def test_transform_http_err_unavailable(code: int) -> None:
    message = "A KBase service is currently unavailable."
    name = HTTP_ERROR
    res = requests.Response()
    res.status_code = code
    source = "network"
    error = None
    err = HTTPError(HTTP_ERROR_MSG, response=res)

    nar_err = transform_job_exception(err)
    check_error(nar_err, code, message, name, source, error)


@pytest.mark.parametrize("code", [504, 598, 599])
def test_transform_http_err_timeout(code: int) -> None:
    message = "There was a temporary network connection error."
    name = HTTP_ERROR
    res = requests.Response()
    res.status_code = code
    source = "network"
    error = None
    err = HTTPError(HTTP_ERROR_MSG, response=res)

    nar_err = transform_job_exception(err)
    check_error(nar_err, code, message, name, source, error)


def test_transform_http_err_internal() -> None:
    code = 500
    message = "An internal error occurred in the KBase service."
    name = HTTP_ERROR
    res = requests.Response()
    res.status_code = code
    source = "network"
    error = None
    err = HTTPError(HTTP_ERROR_MSG, response=res)

    nar_err = transform_job_exception(err)
    check_error(nar_err, code, message, name, source, error)


def test_transform_http_err_unknown() -> None:
    code = 666
    message = "An untracked error occurred."
    name = HTTP_ERROR
    res = requests.Response()
    res.status_code = code
    source = "network"
    error = None
    err = HTTPError(HTTP_ERROR_MSG, response=res)

    nar_err = transform_job_exception(err)
    check_error(nar_err, code, message, name, source, error)


@pytest.mark.parametrize("error_str", [None, "Oh no!"])
def test_other_err_unknown_no_error_str(error_str: str | None) -> None:
    message = "That's the wrong key"
    err = KeyError(message)
    err_as_str = str(err)  # '"That\'s the wrong key"'
    name = "KeyError"
    source = "unknown"

    nar_err = transform_job_exception(err, error_str)
    check_error(nar_err, -1, err_as_str, name, source, error_str)
