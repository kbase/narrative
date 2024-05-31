"""General configurations and fixtures for the narrative tests."""

# disable warnings about accessing the JobComm's _comm and _jm attributes
# ruff: noqa: SLF001

import json
import logging
from collections.abc import Generator
from typing import Any
from unittest import mock

import pytest
import vcr
import vcr.request
from biokbase.narrative.jobs.job import TERMINAL_STATUSES
from biokbase.narrative.jobs.jobcomm import JobComm
from biokbase.narrative.jobs.jobmanager import JobManager
from biokbase.narrative.tests.job_test_constants import BATCH_PARENT_CHILDREN
from biokbase.narrative.tests.narrative_mock.mockclients import get_mock_client
from biokbase.narrative.tests.narrative_mock.mockcomm import MockComm
from biokbase.narrative.tests.util import ConfigTests, read_token_file

# initialise logging for vcrpy
logging.basicConfig()
vcr_log = logging.getLogger("vcr")
# set to INFO or DEBUG for debugging
vcr_log.setLevel(logging.WARNING)


@pytest.fixture(scope="session")
def test_config() -> ConfigTests:
    """Test configuration."""
    return ConfigTests()


@pytest.fixture(scope="session")
def user_name(test_config: ConfigTests) -> str:
    """Default user name."""
    return test_config.get("users", "test_user")


@pytest.fixture(scope="session")
def user_token(test_config: ConfigTests) -> str | None:
    """Token for default user (if supplied)."""
    return read_token_file(test_config.get_path("token_files", "test_user", from_root=True))


@pytest.fixture(scope="session")
def test_jobs(test_config: ConfigTests) -> dict[str, dict[str, Any]]:
    """Dictionary of ee2 job data, indexed by job ID."""
    return test_config.load_json_file(test_config.get("jobs", "ee2_job_test_data_file"))


@pytest.fixture(scope="session")
def job_terminal_states(test_jobs: dict[str, dict[str, Any]]) -> dict[str, bool]:
    """Dictionary of job ID and boolean denoting whether or not a job is in a terminal state."""
    return {job_id: test_jobs[job_id]["status"] in TERMINAL_STATUSES for job_id in test_jobs}


@pytest.fixture(scope="session")
def generate_job_lists(
    job_terminal_states: dict[str, bool],
) -> dict[str, list[str] | dict[str, bool]]:
    """Generate job lists for terminal jobs, active jobs, and the refresh state of jobs."""
    terminal_jobs: list[str] = []
    active_jobs: list[str] = []
    refresh_state: dict[str, bool] = {}
    for key, value in job_terminal_states.items():
        if value:
            terminal_jobs.append(key)
        else:
            active_jobs.append(key)
        # job refresh state
        if key in BATCH_PARENT_CHILDREN:
            refresh_state[key] = False
        else:
            refresh_state[key] = not value

    return {
        "terminal": terminal_jobs,
        "active": active_jobs,
        "refresh_state": refresh_state,
    }


@pytest.fixture(scope="session")
def terminal_jobs(generate_job_lists: dict[str, Any]) -> list[str]:
    """Jobs in a terminal state."""
    return generate_job_lists["terminal"]


@pytest.fixture(scope="session")
def active_jobs(generate_job_lists: dict[str, Any]) -> list[str]:
    """Jobs in an active state."""
    return generate_job_lists["active"]


@pytest.fixture(scope="session")
def refresh_state(generate_job_lists: dict[str, Any]) -> dict[str, bool]:
    """The refresh state of each of the test jobs."""
    return generate_job_lists["refresh_state"]


@pytest.fixture(scope="session")
def job_test_wsname(test_config: ConfigTests) -> str:
    """Get the name of the workspace used in the job tests."""
    return test_config.get("jobs", "job_test_wsname")


@pytest.fixture()
def job_comm() -> Generator:
    """A job comm instance with job manager with mocked clients and mocked comm."""
    # all calls to clients now use get_mock_client
    with mock.patch("biokbase.narrative.clients.get", side_effect=get_mock_client):
        jc = JobComm()
        jc._jm = JobManager()
        jc._comm = MockComm()
        jc._jm.initialize_jobs()

        # Yield the JobComm instance for use in tests
        yield jc

        # ensure the job status loop stops after the test!
        jc.stop_job_status_loop()


# Set up a local instance of VCR that stores its recordings in
# "src/biokbase/narrative/tests/data/cassettes/" and omits the
# authorization header. The "id" field in the request body is
# also removed to prevent it from causing false mismatches.
#
# If the files in the cassette_library_dir are deleted, they will
# be rerecorded during the next test run.


def body_matcher(r1: vcr.request.Request, r2: vcr.request.Request) -> None:
    """Compare the body contents of two requests to work out if they are identical or not."""
    r1_body = json.loads(r1.body.decode())
    r2_body = json.loads(r2.body.decode())
    if "id" in r1_body:
        del r1_body["id"]
    if "id" in r2_body:
        del r2_body["id"]
    assert r1_body == r2_body


MATCH_ON = ["method", "scheme", "host", "path", "body_matcher"]

config = {
    "record_mode": vcr.record_mode.RecordMode.ONCE,
    "filter_headers": ["authorization"],
    "match_on": MATCH_ON,
}


@pytest.fixture(scope="session")
def vcr_config() -> dict[str, Any]:
    """Config for the VCR used in the tests."""
    return config


def pytest_recording_configure(config: dict[str, Any], vcr: vcr.config.VCR) -> None:
    """Register the body_matcher with the VCR used in the tests."""
    vcr.register_matcher("body_matcher", body_matcher)
