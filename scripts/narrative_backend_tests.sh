#!/bin/sh
export NARRATIVE_DIR=$(pwd)
python -m nose $@ --nocapture --with-coverage --cover-html --cover-xml --cover-package=biokbase.narrative src/biokbase/narrative/tests
