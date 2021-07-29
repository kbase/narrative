#!/bin/sh
export NARRATIVE_DIR=$(pwd)
pytest \
    --cov=biokbase.narrative \
    --cov-config=.coveragerc \
    --cov-report=html \
    --cov-report=xml \
    --ignore=src/biokbase/narrative/tests/util.py \
    src/biokbase/narrative/tests
