"""Various constants used throughout the tests."""

import copy
from typing import Any

from biokbase.narrative.jobs.job import TERMINAL_STATUSES
from biokbase.narrative.tests.util import ConfigTests

config = ConfigTests()
TEST_JOBS: dict[str, dict] = config.load_json_file(config.get("jobs", "ee2_job_test_data_file"))


def generate_error(job_id: str, err_type: str) -> str:
    """Given a job id and an error type, generate the appropriate error string.

    :param job_id: job ID
    :type job_id: str
    :param err_type: error type
    :type err_type: str
    :raises KeyError: if the error type does not exist
    :return: error string
    :rtype: str
    """
    user_id = None
    status = None

    if job_id in TEST_JOBS:
        job = get_test_job(job_id)
        user_id = job["user"] or "fake_user"
        status = job["status"]

    error_strings = {
        "not_found": f"Cannot find job with ID {job_id}",
        "no_logs": f"Cannot find job log with id: {job_id}",
        "ee2_not_found": f"Cannot find job with ids: ['{job_id}']",
        "no_perms": f"User {user_id} does not have permission to JobPermissions.WRITE job {job_id}",
        "batch_parent_retry": "Cannot retry batch job parents. Must retry individual jobs",
        "retry_status": f"Error retrying job {job_id} with status {status}: can only retry jobs with status 'error' or 'terminated'",
    }

    if err_type not in error_strings:
        raise KeyError(f"No such error type: {err_type}")

    return error_strings[err_type]


def get_test_job(job_id: str) -> dict[str, Any]:
    """Given a job ID, fetch the appropriate job.

    :param job_id: job ID
    :type job_id: str
    :return: job data
    :rtype: dict[str, Any]
    """
    return copy.deepcopy(TEST_JOBS[job_id])


def get_test_jobs(job_ids: list[str]) -> dict[str, dict[str, Any]]:
    """Given a list of job IDs, fetch the appropriate jobs.

    :param job_ids: list of job IDs
    :type job_ids: list[str]
    :return: dict of jobs keyed by job ID
    :rtype: dict[str, dict[str, Any]]
    """
    return {job_id: get_test_job(job_id) for job_id in job_ids}


CLIENTS = "biokbase.narrative.clients.get"
TIME_NS = "biokbase.narrative.jobs.jobcomm.time.time_ns"

TEST_EPOCH_NS = 42  # arbitrary epoch ns
MAX_LOG_LINES = 10

# test_jobs contains jobs in the following states
JOB_COMPLETED = "JOB_COMPLETED"
JOB_CREATED = "JOB_CREATED"
JOB_RUNNING = "JOB_RUNNING"
JOB_TERMINATED = "JOB_TERMINATED"
JOB_ERROR = "JOB_ERROR"
BATCH_PARENT = "BATCH_PARENT"
BATCH_COMPLETED = "BATCH_COMPLETED"
BATCH_TERMINATED = "BATCH_TERMINATED"
BATCH_TERMINATED_RETRIED = "BATCH_TERMINATED_RETRIED"
BATCH_ERROR_RETRIED = "BATCH_ERROR_RETRIED"
BATCH_RETRY_COMPLETED = "BATCH_RETRY_COMPLETED"
BATCH_RETRY_RUNNING = "BATCH_RETRY_RUNNING"
BATCH_RETRY_ERROR = "BATCH_RETRY_ERROR"

ALL_JOBS = [
    JOB_COMPLETED,
    JOB_CREATED,
    JOB_RUNNING,
    JOB_TERMINATED,
    JOB_ERROR,
    BATCH_PARENT,
    BATCH_COMPLETED,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    BATCH_ERROR_RETRIED,
    BATCH_RETRY_COMPLETED,
    BATCH_RETRY_ERROR,
    BATCH_RETRY_RUNNING,
]

JOB_NOT_FOUND = "job_not_found"
BAD_JOB_ID = "a_bad_job_id"
BAD_JOB_ID_2 = "another_bad_job_id"

BAD_JOBS = [JOB_NOT_FOUND, BAD_JOB_ID, BAD_JOB_ID_2]

BATCH_CHILDREN = [
    BATCH_COMPLETED,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    BATCH_ERROR_RETRIED,
    BATCH_RETRY_COMPLETED,
    BATCH_RETRY_RUNNING,
    BATCH_RETRY_ERROR,
]

BATCH_PARENT_CHILDREN = [BATCH_PARENT, *BATCH_CHILDREN]

JOB_TERMINAL_STATE: dict[str, bool] = {
    job_id: TEST_JOBS[job_id]["status"] in TERMINAL_STATUSES for job_id in TEST_JOBS
}

TERMINAL_JOBS: list[str] = []
ACTIVE_JOBS: list[str] = []
REFRESH_STATE: dict[str, bool] = {}
for key, value in JOB_TERMINAL_STATE.items():
    if value:
        TERMINAL_JOBS.append(key)
    else:
        ACTIVE_JOBS.append(key)
    # job refresh state
    if key in BATCH_PARENT_CHILDREN:
        REFRESH_STATE[key] = False
    else:
        REFRESH_STATE[key] = not value

READS_OBJ_1 = "rhodobacterium.art.q20.int.PE.reads"
READS_OBJ_2 = "rhodobacterium.art.q10.PE.reads"
