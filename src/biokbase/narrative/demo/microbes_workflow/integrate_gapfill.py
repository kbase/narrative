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

def print_progress(stage, completed, total):
    o = sys.stdout
    o.write("#{},{:d},{:d}\n".format(stage, completed, total))
    o.flush()

def run(params):
    _num_done, total_work = 0, 4

    _num_done += 1
    print_progress("Parse Parameters", _num_done, total_work)

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
        'workspace' : workspace,
        'auth' : token,
    }

    new_model = params['New model (optional)']
    new_model = new_model.strip()
    if (new_model)
        integrate_params['out_model'] = new_model

    # funcdef integrate_reconciliation_solutions(integrate_reconciliation_solutions_params input) returns (object_metadata modelMeta);

    _num_done += 1
    print_progress("Integrate Gapfill results", _num_done, total_work)
    
    model_meta = fba.integrate_reconciliation_solutions(integrate_params)

    _num_done += 1
    print_progress("Fetch Gapfilled FBA Model", _num_done, total_work)

    model_params = {
        'models': [model_meta[0]],
        'workspaces': [workspace],
        'auth': token,
    }
    model = fba.get_models(model_params)

    _num_done += 1
    print_progress("Render FBA Model", _num_done, total_work)

    print json.dumps(metadata)
    return 0

if __name__ == '__main__':
    sys.exit(main())