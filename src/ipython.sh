#!/usr/bin/env bash
#
# Script to run ipython from the src directory so that you don't have to install
# everything - intended solely for development work in the src repo
#
export IPYTHONSRC="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Running out of $IPYTHONSRC"
export PYTHONPATH=$iPYTHONSRC:$PYTHONPATH
export IPYTHONDIR=$IPYTHONSRC/ipythondir

python KBNB/ipython $* # --profile=narrative $* # --NotebookManager.notebook_dir=$IPYTHONSRC/notebooks $*
