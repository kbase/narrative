"""
Demo plants/co-expression
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '11/15/13'

## Imports
# Stdlib
import json
import os
import random
# Local
from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.workspaceService.Client import workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.fbaModelServices.Client import fbaModelServices

## Globals

VERSION = (0, 0, 1)
NAME = "plants"

# Initialize
init_service(name=NAME, desc="Demo plants co-expression service", version=VERSION)


# Finalize (registers service)
finalize_service()
