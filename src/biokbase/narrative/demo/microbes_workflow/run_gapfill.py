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
    typedef structure {
        FBAFormulation formulation;
        int num_solutions;
        bool nomediahyp;
        bool nobiomasshyp;
        bool nogprhyp;
        bool nopathwayhyp;
        bool allowunbalanced;
        float activitybonus;
        float drainpen;
        float directionpen;
        float nostructpen;
        float unfavorablepen;
        float nodeltagpen;
        float biomasstranspen;
        float singletranspen;
        float transpen;
        list<reaction_id> blacklistedrxns;
        list<reaction_id> gauranteedrxns;
        list<compartment_id> allowedcmps;
        probanno_id probabilisticAnnotation;
        workspace_id probabilisticAnnotation_workspace;
    } GapfillingFormulation;
    """

    """
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
    """

    """
    typedef structure {
        fbamodel_id model;
        workspace_id model_workspace;
        GapfillingFormulation formulation;
        phenotype_set_id phenotypeSet;
        workspace_id phenotypeSet_workspace;
        bool integrate_solution;
        fbamodel_id out_model;
        workspace_id workspace;
        gapfill_id gapFill;
        int timePerSolution;
        int totalTimeLimit;
        string auth;
        bool overwrite;
        bool completeGapfill;
    } gapfill_model_params;
    """

    fba_formulation = {}

    media = params['Identifiers.Media']
    if (media):
        fba_formulation = {
            'media' : params['Identifiers.Media'],
            'media_workspace' : workspace
        }

    gapfill_formulation = {
        'formulation' : fba_formulation,
        'num_solutions' : int(params['Solutions.Number to seek']),
    }

    gapfill_params = {
        'model' : params['Identifiers.Model'],
        'model_workspace' : workspace,
        'formulation' : gapfill_formulation,
        'workspace' : workspace,
        'timePerSolution' : int(params['Time.Per Solution (sec)']),
        'totalTimeLimit' : int(params['Time.Total Limit (sec)']),
        'auth' : token
    }

    _num_done += 1
    print_progress("Submit Gapfill job", _num_done, total_work)

    job_data = fba.queue_gapfill_model(gapfill_params)

    _num_done += 1
    print_progress("Return job statement", _num_done, total_work)
    
    print json.dumps(job_data)
    return "Done!"

if __name__ == '__main__':
    sys.exit(main())