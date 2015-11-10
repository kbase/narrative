#!/bin/sh

if [ ! -e ./url.cfg ] ; then
  echo "No url.cfg found.  Skipping fixup"
  exit
fi

if [ ! -e /kb/dev_container/narrative/src/config.json ] ;then
  echo "Run this after deployment"
  exit
fi

. ./url.cfg

sed -i "s/ci.kbase.us/$SERVICESSL/" /kb/dev_container/narrative/src/config.json

grep -rl //kbase.us/services /kb/deployment/services/narrative-venv/ | \
       xargs sed -i "s/\/\/kbase.us\/services/\/\/$SERVICESSL\/services/g" || echo "Done" && \

grep -rl narrative.kbase.us /kb/deployment/services/narrative-venv/ | \
       xargs sed -i "s/narrative.kbase.us/$NARRSSL/" || echo "Done"
