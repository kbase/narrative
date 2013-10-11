"""
This fetches an FBA model from a user's workspace and
return it as a JSON object.

It actually returns a list with a single member, as the command
invoked is "fba.get_models"

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

    model_params = {
        'models': [params['Identifiers.Model']],
        'workspaces': [workspace],
        'auth': token,
    }

    model = fba.get_models(model_params)

    print json.dumps(model)
    return 'Done'

if __name__ == '__main__':
    sys.exit(main())