"""Tests for the JobRequest class."""

import itertools
from typing import Any

import pytest
from biokbase.narrative.exception_util import (
    JobRequestException,
)
from biokbase.narrative.jobs.jobcomm import (
    CELLS_NOT_PROVIDED_ERR,
    INVALID_REQUEST_ERR,
    MESSAGE_TYPE,
    MISSING_REQUEST_TYPE_ERR,
    ONE_INPUT_TYPE_ONLY_ERR,
    PARAM,
    JobRequest,
)
from biokbase.narrative.tests.util import make_comm_msg

BATCH_ID = PARAM["BATCH_ID"]
JOB_ID = PARAM["JOB_ID"]
JOB_ID_LIST = PARAM["JOB_ID_LIST"]


def test_job_request_ok() -> None:
    """Check a valid job request."""
    rq_msg = {
        "msg_id": "some_id",
        "content": {"data": {"request_type": "a_request"}},
    }
    rq = JobRequest(rq_msg)
    assert rq.msg_id == "some_id"
    assert rq.request_type == "a_request"
    assert rq.raw_request == rq_msg
    assert rq.rq_data == {"request_type": "a_request"}

    with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
        rq.job_id  # noqa: B018

    with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
        rq.job_id_list  # noqa: B018


@pytest.mark.parametrize(
    "msg",
    [
        {"msg_id": "some_id", "content": {}},
        {"msg_id": "some_id", "content": {"data": {}}},
        {"msg_id": "some_id", "content": {"data": None}},
        {"msg_id": "some_id", "content": {"what": "?"}},
    ],
)
def test_job_request_fail_no_data(msg: dict[str, Any]) -> None:
    """Check that a request with no data throws an error."""
    with pytest.raises(JobRequestException, match=INVALID_REQUEST_ERR):
        JobRequest(msg)


@pytest.mark.parametrize(
    "msg",
    [
        {"msg_id": "some_id", "content": {"data": {"request_type": None}}},
        {"msg_id": "some_id", "content": {"data": {"request_type": ""}}},
        {"msg_id": "some_id", "content": {"data": {"what": {}}}},
    ],
)
def test_job_request_fail_no_req(msg: dict[str, Any]) -> None:
    """Check that a request with no request_type throws an error."""
    with pytest.raises(JobRequestException, match=MISSING_REQUEST_TYPE_ERR):
        JobRequest(msg)


@pytest.mark.parametrize(
    "combo",
    itertools.combinations(
        [
            {JOB_ID: "job_id"},
            {JOB_ID_LIST: ["job_1_id", "job_2_id"]},
            {BATCH_ID: "batch_id"},
        ],
        2,
    ),
)
def test_job_request_fail_more_than_one_input(combo: list[dict[str, Any]]) -> None:
    """Ensure that supplying more than one job ID-like input raises an error."""
    msg = make_comm_msg(MESSAGE_TYPE["STATUS"], {**combo[0], **combo[1]})
    with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
        JobRequest(msg)


def test_job_request_fail_job_id_list_batch() -> None:
    """Ensure that having all three inputs generates a failure message."""
    msg = make_comm_msg(
        MESSAGE_TYPE["STATUS"],
        {
            JOB_ID: "job_id",
            BATCH_ID: "batch_id",
            JOB_ID_LIST: [],
        },
    )
    with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
        JobRequest(msg)


def test_job_request_fail_no_input() -> None:
    """Ensure that a request with no input fails."""
    msg = make_comm_msg(MESSAGE_TYPE["STATUS"], {})
    req = JobRequest(msg)

    with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
        req.job_id  # noqa: B018

    with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
        req.job_id_list  # noqa: B018

    with pytest.raises(JobRequestException, match=ONE_INPUT_TYPE_ONLY_ERR):
        req.batch_id  # noqa: B018

    with pytest.raises(JobRequestException, match=CELLS_NOT_PROVIDED_ERR):
        req.cell_id_list  # noqa: B018
