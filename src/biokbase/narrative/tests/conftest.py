"""General configurations and fixtures for the narrative tests."""

import vcr

# Set up a local instance of VCR that stores its recordings in
# "src/biokbase/narrative/tests/data/cassettes/" and omits the
# authorization header.
#
# If the files in the cassette_library_dir are deleted, they will
# be rerecorded during the next test run.
narrative_vcr = vcr.VCR(
    cassette_library_dir="src/biokbase/narrative/tests/data/cassettes/",
    record_mode="once",
    filter_headers=["authorization"],
)
