"""
A wrapper around the FBA Model Services call "genome_to_fbamodel"
Given a genome ID (and, later, other parameters), this produces a 
draft FBA model in the user's workspace.

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

    fba_params = {
        'genome': params['Identifiers.Genome'],
        'workspace': workspace,
        'auth': token,
    }

    metadata = fba.genome_to_fbamodel(fba_params)

    print json.dumps(metadata)
    return metadata

if __name__ == '__main__':
    sys.exit(main())