#!/bin/bash
export NARRATIVE_DIR=$(pwd)

docker_container=${DOCKER_CONTAINER:-false}

pytest \
    --cov=biokbase.narrative \
    --cov=biokbase.auth \
    --cov-config=.coveragerc \
    --cov-report=html \
    --cov-report=xml \
    --ignore=src/biokbase/narrative/tests/util.py \
    src/biokbase/narrative/tests

exit_status=$?

if [ "$docker_container" == "true" ]; then
    cp ./python-coverage/coverage.xml /tmp/output/coverage.xml
fi

exit $exit_status
