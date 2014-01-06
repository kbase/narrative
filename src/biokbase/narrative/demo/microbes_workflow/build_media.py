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

    base_media = params['Identifiers.Base Media (optional)']
    base_media = base_media.strip()
    base_media = base_media.replace(' ', '_')

    _num_done += 1
    print_progress("Fetch Base Media", _num_done, total_work)    

    if (base_media):
        media_params = {
            'medias' : [base_media],
            'workspaces' : [workspace],
            'auth' : token
        }

        media_list = fba.get_media(media_params)

        _num_done += 1
        print_progress("Render Media", _num_done, total_work)

        print "kbaseMediaEditorNarrative({ mediaData: " + json.dumps(media_list) + ", viewOnly: false, editOnly: true, ws: '" + workspace + "', auth: '" + token + "' });"

        # print json.dumps(media_list)
        return 0

    print "kbaseMediaEditorNarrative({ viewOnly: false, editOnly: true, ws: '" + workspace + "', auth: '" + token + "' });"
    return 0

if __name__ == '__main__':
    sys.exit(main())