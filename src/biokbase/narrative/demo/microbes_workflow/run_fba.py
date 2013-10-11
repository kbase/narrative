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
    _num_done, total_work = 0, 4

    _num_done += 1
    print_progress("Parse Parameters", _num_done, total_work)

    fba = fbaModelServices(URLS.fba)
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']

    """  
    All possible parameters. We're only exposing like 3 right now...

    typedef structure {
        fbamodel_id model;
        workspace_id model_workspace;
        FBAFormulation formulation;
        bool fva;
        bool simulateko;
        bool minimizeflux;
        bool findminmedia;
        string notes;
        fba_id fba;
        workspace_id workspace;
        string auth;
        bool overwrite;
        bool add_to_model;
    } runfba_params;

    typedef structure {
        media_id media;
        list<compound_id> additionalcpds;
        prommodel_id prommodel;
        workspace_id prommodel_workspace;
        workspace_id media_workspace;
        float objfraction;
        bool allreversible;
        bool maximizeObjective;
        list<term> objectiveTerms;
        list<feature_id> geneko;
        list<reaction_id> rxnko;
        list<bound> bounds;
        list<constraint> constraints;
        mapping<string,float> uptakelim;
        float defaultmaxflux;
        float defaultminuptake;
        float defaultmaxuptake;
        bool simplethermoconst;
        bool thermoconst;
        bool nothermoerror;
        bool minthermoerror;
    } FBAFormulation;

    kb|g.0.fbamdl.633
    Carbon-D-Glucose-aerobic
    """

    fba_formulation = {
        'media' : params['Identifiers.Media'],
        'media_workspace' : workspace,
    }

    fba_params = {
        'model' : params['Identifiers.Model'],
        'model_workspace' : workspace,
        'formulation' : fba_formulation,
        'workspace' : workspace,
        'notes' : params['Misc.Notes'],
        'auth': token,
    }

    _num_done += 1
    print_progress("Perform Flux Balance Analysis", _num_done, total_work)

    result_meta = fba.runfba(fba_params)

    """
    typedef structure {
        fba_id fba;
        workspace_id workspace;
        string format;
        string auth;
    } export_fba_params;
    """

    _num_done += 1
    print_progress("Fetch FBA Results", _num_done, total_work)

    fetch_params = {
        'fbas' : [result_meta[0]],
        'workspaces' : [workspace],
        'auth' : token
    }

    fba_result = fba.get_fbas(fetch_params);

    _num_done += 1
    print_progress("Render FBA Results", _num_done, total_work)

    print json.dumps(fba_result)

    return "Done!"

if __name__ == '__main__':
    sys.exit(main())