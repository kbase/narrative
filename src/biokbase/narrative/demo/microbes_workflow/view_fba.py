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

def print_progress(stage, completed, total):
    o = sys.stdout
    o.write("#{},{:d},{:d}\n".format(stage, completed, total))
    o.flush()

def run(params):
    _num_done, total_work = 0, 3

    _num_done += 1
    print_progress("Parse Parameters", _num_done, total_work)

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

    _num_done += 1
    print_progress("Fetch FBA Results", _num_done, total_work)

    fba_result = fba.get_fbas(fetch_params);

    _num_done += 1
    print_progress("Render FBA Results", _num_done, total_work)

    print "kbaseFbaTabsNarrative({ fbaData: " + json.dumps(fba_result) + " });"
    return "Done!"

if __name__ == '__main__':
    sys.exit(main())