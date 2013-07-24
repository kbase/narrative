#!/usr/bin/env bash
#
# Script to run ipython from the src directory so that you don't have to install
# everything - intended solely for development work in the src repo
#
export IPYTHONSRC="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export PYTHONPATH=$IPYTHONSRC:$IPYTHONSRC/KBNB:$PYTHONPATH
export IPYTHONDIR=$IPYTHONSRC/ipythondir

KBNB/ipython.py $* --NotebookManager.notebook_dir=$IPYTHONSRC/notebooks --profile=narrative
