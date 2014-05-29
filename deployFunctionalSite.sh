#!/bin/bash

# should be more selective what to deploy here
rsync -avP --exclude=.git\* --exclude=README\* --exclude=deployFunctionalSite\* --exclude=Makefile * /kb/deployment/ui-common/
