#!/bin/bash

rsync -avP --exclude=.git\* * /kb/deployment/ui-common/
