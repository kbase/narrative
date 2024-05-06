"""General configurations and fixtures for the narrative tests."""

import json
import logging

import pytest
import vcr
import vcr.request

from biokbase.narrative.tests.util import ConfigTests, read_token_file

# Initialize logging to allow debugging of vcrpy requests
logging.basicConfig()
vcr_log = logging.getLogger("vcr")
# set to INFO or DEBUG to view more messages
vcr_log.setLevel(logging.WARNING)


@pytest.fixture(scope="session")
def test_config() -> ConfigTests:
    """Read the test config file."""
    return ConfigTests()


@pytest.fixture(scope="session")
def user_name(test_config: ConfigTests) -> str:
    """Get the test_user user name from the test config file."""
    return test_config.get("users", "test_user")


@pytest.fixture(scope="session")
def user_token(test_config: ConfigTests) -> str | None:
    """Get the test_user token from the token file."""
    return read_token_file(
        test_config.get_path("token_files", "test_user", from_root=True)
    )


# Set up a local instance of VCR that stores its recordings in
# "src/biokbase/narrative/tests/data/cassettes/" and omits the
# authorization header.
#
# If the files in the cassette_library_dir are deleted, they will
# be rerecorded during the next test run.


MATCH_ON = ["method", "scheme", "host", "path", "body_matcher"]

body_match_vcr = vcr.VCR(
    cassette_library_dir="src/biokbase/narrative/tests/data/cassettes/",
    record_mode=vcr.record_mode.RecordMode.ONCE,
    filter_headers=["authorization"],
    match_on=MATCH_ON,
)


def body_matcher(r1: vcr.request.Request, r2: vcr.request.Request) -> None:
    """Compare the body contents of two requests to work out if they are identical or not."""
    r1_body = json.loads(r1.body.decode())
    r2_body = json.loads(r2.body.decode())
    if "id" in r1_body:
        del r1_body["id"]
    if "id" in r2_body:
        del r2_body["id"]
    assert r1_body == r2_body


body_match_vcr.register_matcher("body_matcher", body_matcher)
