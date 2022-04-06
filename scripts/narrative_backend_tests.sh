#!/bin/bash
export NARRATIVE_DIR=$(pwd)

docker_container=${DOCKER_CONTAINER:-false}

# if the test is being run in a docker container, ensure
# that the conda base environment is activated
if [ "$docker_container" == "true" ]; then
    source activate base
fi

pytest \
    --cov=biokbase.narrative \
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
