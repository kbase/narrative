"""
From a given formulation, this runs a flux balance analysis
using information in the user's workspace.

Instead of just returning the metadata of the run's result,
it returns the whole object as JSON.

Bill Riehl <wjriehl@lbl.gov>
"""
__version__ = '0.1'

## Imports
import json
import os
import logging
import sys
import time
import uuid

# KBase packages
from biokbase.workspaceService.Client import workspaceService
from biokbase.fbaModelServices.Client import fbaModelServices

class URLS:
    workspace= "http://kbase.us/services/workspace"
    fba = "https://kbase.us/services/fba_model_services"


def main():
    return 0


def run(params):
    fba = fbaModelServices(URLS.fba)
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']

    """
    kb|g.0.fbamdl.633
    Carbon-D-Glucose-aerobic
    """
    fetch_params = {
        'fbas' : [params['Identifiers.FBA Result']],
        'workspaces' : [workspace],
        'auth' : token
    }
    fba_result = fba.get_fbas(fetch_params);

    print json.dumps(fba_result)
    return "Done!"

if __name__ == '__main__':
    sys.exit(main())