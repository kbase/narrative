#!/bin/sh
export NARRATIVE_DIR=$(pwd)
python -m nose $@ --with-coverage --cover-html --cover-package=biokbase.narrative src/biokbase/narrative/tests/test_batch.py
