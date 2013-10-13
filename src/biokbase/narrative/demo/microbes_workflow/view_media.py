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
        list<media_id> medias;
        list<workspace_id> workspaces;
        string auth;
    } get_media_params;
    """

    media_params = {
        'medias' : [params['Identifiers.Media']],
        'workspaces' : [workspace],
        'auth' : token
    }

    _num_done += 1
    print_progress("Fetch Media Information", _num_done, total_work)    
    media_list = fba.get_media(media_params)

    _num_done += 1
    print_progress("Render Media", _num_done, total_work)

    print json.dumps(media_list)
    return 0

if __name__ == '__main__':
    sys.exit(main())