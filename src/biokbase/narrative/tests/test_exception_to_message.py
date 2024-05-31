"""Tests of the ExceptionToMessage class."""

# disable warnings about accessing the JobComm's _comm and _jm attributes
# ruff: noqa: SLF001

from collections.abc import Callable
from typing import Any

import pytest
from biokbase.narrative.exception_util import (
    JobRequestException,
    NarrativeException,
    transform_job_exception,
)
from biokbase.narrative.jobs.jobcomm import (
    MESSAGE_TYPE,
    ExceptionToMessage,
    JobComm,
    JobRequest,
)
from biokbase.narrative.tests.job_test_constants import (
    BATCH_CHILDREN,
    BATCH_ERROR_RETRIED,
    BATCH_PARENT,
    BATCH_TERMINATED,
    JOB_CREATED,
    JOB_RUNNING,
    JOB_TERMINATED,
)
from biokbase.narrative.tests.util import make_comm_msg, make_job_request

RQ_TYPE = "request_type"
CANCEL = MESSAGE_TYPE["CANCEL"]
ERROR = MESSAGE_TYPE["ERROR"]
INFO = MESSAGE_TYPE["INFO"]
STATUS = MESSAGE_TYPE["STATUS"]

NO_JOBS_MAPPING = {
    "jobs": {},
    "mapping": {
        "a": set(),
        "b": set(),
        "c": set(),
    },
}

"""
In the code, ExceptionToMessage is called as follows:

    with ExceptionToMessage(msg):
        request = JobRequest(msg)
        if request.request_type not in self._msg_map:
            err_msg = f"Unknown KBaseJobs message '{request.request_type}'"
            raise JobRequestException(err_msg)

        return self._msg_map[request.request_type](request)
"""


def fn_with_context_manager(
    fn: Callable,
    req: JobRequest | dict[str, Any] | str | None,
) -> None:
    """Execute a function within the ExceptionToMessage context manager.

    :param fn: the function to execute
    :type fn: Callable
    :param req: job request-like parameters
    :type req: JobRequest | dict[str, Any] | str | None
    """
    with ExceptionToMessage(req):
        return fn()


def fn_with_context_manager_and_try_except(
    fn: Callable, req: JobRequest | dict[str, Any] | str | None, indic: list[str]
) -> None:
    """Execute a function within a try/except within the ExceptionToMessage context manager.

    :param fn: the function to execute
    :type fn: Callable
    :param req: job request-like parameters
    :type req: JobRequest | dict[str, Any] | str | None
    :param indic: list of strings to act as an indicator to show which lines of code have executed
    :type indic: list[str]
    """
    with ExceptionToMessage(req):
        try:
            fn()
        except Exception:
            indic += ["A"]
            raise
        indic += ["B"]
    indic += ["C"]


@pytest.mark.parametrize(
    "some_input",
    [
        pytest.param({"input": None}, id="None"),
        pytest.param({"input": "some string"}, id="string"),
        pytest.param(
            {"input": make_comm_msg(STATUS, "some_job_id")}, id="dict"
        ),  # dictionary input
        pytest.param(
            {"input": make_job_request(STATUS, "another_job_id")}, id="JobRequest"
        ),  # JobRequest object
    ],
)
def test_success_all_input_types(
    job_comm: JobComm, some_input: None | str | dict[str, Any] | JobRequest
) -> None:
    """Test the successful handling of a variety of inputs."""
    message = "boom!"

    def append_message() -> str:
        return f"ka-{message}"

    output = fn_with_context_manager(append_message, some_input)
    assert output == "ka-boom!"
    assert job_comm._comm.last_message is None


@pytest.mark.parametrize(
    "params",
    [
        pytest.param({"input": None, "request": None, "source": None}, id="None"),
        pytest.param(
            {"input": "some string", "request": "some string", "source": "some string"},
            id="string",
        ),
        pytest.param(
            {
                "input": make_comm_msg(STATUS, {"this": "that", "some": "thing"}),
                "request": {RQ_TYPE: STATUS, "this": "that", "some": "thing"},
                "source": STATUS,
            },
            id="dict",
        ),  # dictionary input
        pytest.param(
            {
                "input": make_job_request(STATUS, "another_job_id"),
                "request": make_job_request(STATUS, "another_job_id").rq_data,
                "source": STATUS,
            },
            id="JobRequest",
        ),  # JobRequest object
    ],
)
def test_error_all_input_types(job_comm: JobComm, params: dict[str, Any]) -> None:
    """Test where inner code throws a ValueError with a variety of inputs."""
    message = "Greetings!"

    def raise_value_err() -> None:
        raise ValueError(message)

    with pytest.raises(ValueError, match=message):
        fn_with_context_manager(raise_value_err, params["input"])

    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "name": "ValueError",
            "message": message,
            "request": params["request"],
            "source": params["source"],
        },
    }


def test_JobRequestException(job_comm: JobComm) -> None:
    """Test the handling of a job request exception within the context manager."""
    job_id = BATCH_PARENT
    req_type = INFO
    req = make_job_request(req_type, job_id)
    message = "too long"
    jre_message = "didn't read"

    def raise_job_req_exc() -> None:
        raise JobRequestException(message, jre_message)

    with pytest.raises(JobRequestException, match=f"{message}: {jre_message}"):
        fn_with_context_manager(raise_job_req_exc, req)
    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "name": "JobRequestException",
            "message": f"{message}: {jre_message}",
            "request": req.rq_data,
            "source": req_type,
        },
    }


def test_error_with_transform_job_exception(job_comm: JobComm) -> None:
    """Test the handling of a narrative exception within the context manager using transform_job_exception."""
    job_id_list = BATCH_CHILDREN
    req_type = "start_job_status_loop"
    req = make_job_request(req_type, job_id_list)
    message = (
        "In a similar experiment, conducted in Stanford in 1975 ... "
        "Participants gave the dehumanized people twice the punishment "
        "of the humanized ones and significantly more than the ones "
        "they knew nothing about"
    )
    err_as_str = str(ValueError(message))
    error = "Unable to perform this request"

    def transform_exception() -> None:
        raise transform_job_exception(ValueError(message), error)

    with pytest.raises(NarrativeException, match=message):
        fn_with_context_manager(transform_exception, req)

    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "request": req.rq_data,
            "source": req_type,
            # Below are from transform_job_exception
            "name": "ValueError",
            "message": err_as_str,
            "error": error,
            "code": -1,
        },
    }


def test_error_down_the_stack(job_comm: JobComm) -> None:
    """Test the handling of an error with some extra stack frames."""
    job_id = JOB_CREATED
    req_type = STATUS
    req_dict = make_comm_msg(req_type, job_id)
    message = (
        "Caste is the granting or witholding of "
        "respect, status, honor, attention, priveliges, "
        "resources, benefit of the doubt, and human "
        "kindness to someone on the basis of their "
        "perceived rank or standing in the hierarchy."
    )

    # Throw a few frames into stack
    def add_stack_frames(i: int = 5) -> None:
        if i == 0:
            raise ValueError(message)
        add_stack_frames(i - 1)

    with pytest.raises(ValueError, match=message):
        fn_with_context_manager(add_stack_frames, req_dict)

    msg = job_comm._comm.last_message
    assert msg == {
        "msg_type": ERROR,
        "content": {
            "name": "ValueError",
            "message": message,
            "request": req_dict["content"]["data"],
            "source": req_type,
        },
    }


def test_with_nested_try__raise(job_comm: JobComm) -> None:
    """Test the handling of an exception that triggers the try/except handler."""
    job_id_list = [BATCH_TERMINATED, JOB_TERMINATED]
    req_type = "stop_job_status_loop"
    req = make_job_request(req_type, job_id_list)
    message = (
        "Casteism is the investment in keeping the hierarchy "
        "as it is in order to maintain your own ranking, advantage, "
        "privilege, or to elevate yourself above others or keep "
        "others beneath you"
    )

    def raise_runtime_err() -> None:
        raise RuntimeError(message)

    f_var = []
    with pytest.raises(RuntimeError, match=message):
        fn_with_context_manager_and_try_except(raise_runtime_err, req, f_var)

    assert ["A"] == f_var
    msg = job_comm._comm.last_message
    assert {
        "msg_type": ERROR,
        "content": {
            "name": "RuntimeError",
            "message": message,
            "source": req_type,
            "request": req.rq_data,
        },
    } == msg


def test_with_nested_try__succeed(job_comm: JobComm) -> None:
    """Test the handling of a function that does not throw an error."""
    job_id_list = [BATCH_ERROR_RETRIED, JOB_RUNNING]
    req_type = CANCEL
    req = make_job_request(req_type, job_id_list)
    message = "boom!"

    def print_me() -> None:
        """Print fn."""
        print(message)  # noqa: T201

    f_var = []
    fn_with_context_manager_and_try_except(print_me, req, f_var)
    assert ["B", "C"] == f_var
    msg = job_comm._comm.last_message
    assert msg is None
