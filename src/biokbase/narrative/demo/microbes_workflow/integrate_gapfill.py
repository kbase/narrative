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
    typedef structure {
        fbamodel_id model;
        workspace_id model_workspace;
        list<gapfillsolution_id> gapfillSolutions;
        list<gapgensolution_id> gapgenSolutions;
        fbamodel_id out_model;
        workspace_id workspace;
        string auth;
        bool overwrite;
    } integrate_reconciliation_solutions_params;
    """

    integrate_params = {
        'model' : params['Identifiers.Model'],
        'model_workspace' : workspace,
        'gapfillSolutions' : params['Identifiers.Gapfill'],
        'out_model' : params['Output.New Model'],
        'workspace' : workspace,
        'auth' : token,
    }

    # funcdef integrate_reconciliation_solutions(integrate_reconciliation_solutions_params input) returns (object_metadata modelMeta);
    
    model_meta = fba.integrate_reconciliation_solutions(integrate_params)







    metadata = fba.genome_to_fbamodel(fba_params)

    print json.dumps(metadata)
    return metadata

if __name__ == '__main__':
    sys.exit(main())