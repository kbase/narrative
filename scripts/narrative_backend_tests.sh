#!/bin/sh
export NARRATIVE_DIR=$(pwd)
# python -m nose $@ --nocapture --with-coverage --cover-html --cover-package=biokbase.narrative src/biokbase/narrative/tests
pytest \
    --cov=biokbase.narrative \
    --cov-config=.coveragerc \
    --cov-report=html \
    --cov-report=xml \
    --ignore=src/biokbase/narrative/tests/util.py \
    src/biokbase/narrative/tests
