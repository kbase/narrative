#!/bin/sh
export NARRATIVE_DIR=$(pwd)
python --version
which pytest
pip freeze

pytest \
    --cov=biokbase.narrative \
    --cov-config=.coveragerc \
    --cov-report=html \
    --cov-report=xml \
    --ignore=src/biokbase/narrative/tests/util.py \
    src/biokbase/narrative/tests
