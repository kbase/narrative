#!/bin/sh
export NARRATIVE_DIR=$(pwd)
python test/integration/run_tests.py $1
