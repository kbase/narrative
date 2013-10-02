#!/bin/sh
find biokbase -name "*.pyc" -exec rm -f {} \;
cp -r ./biokbase ~/.virtualenvs/kbase-narr/lib/python2.7/site-packages/
