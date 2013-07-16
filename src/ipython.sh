#!/usr/bin/env bash
#
# Script to run ipython from the src directory so that you don't have to install
# everything - intended solely for development work in the src repo
#
export PYTHONPATH=`pwd`:$PYTHONPATH
echo $PYTHONPATH
python KBNB/ipython $*
