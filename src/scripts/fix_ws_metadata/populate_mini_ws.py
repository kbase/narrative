from biokbase.workspace.client import Workspace
import requests
import json
import sys
from time import time
from fix_workspace_info import fix_all_workspace_info
from pprint import pprint

mini_ws_url = "http://localhost/services/ws"
mini_auth_url = "http://localhost/services/auth/testmode"
mini_ws_admin = "wsadmin"
narrative_spec_file = '../../../narrative_object.spec'
old_narrative_spec_file = 'old_narrative_object.spec'
test_narrative_data = 'narrative_test_data.json'
test_user = "kbasetest"

####
# BEFORE YOU RUN THIS:
# 1. Spin up mini_kb with the workspace env pointed to my branch:
# that is, the "-env" line in the ws command points to
# "https://raw.githubusercontent.com/briehl/mini_kb/master/deployment/conf/workspace-minikb.ini"
#
# 2. When this starts up, the workspace will complain. Auth is in testmode, and there's no test user/token set up
# for the Shock configuration. Do the following:
#   a. enter the mongo container
#      > docker exec -it mini_kb_ci-mongo_1 /bin/bash
#   b. start mongo (just "mongo" at the prompt)
#   c. Run the following to use gridFS:
#      > use workspace
#      > db.settings.findAndModify({ query: {backend: "shock"}, update: { $set: {"backend": "gridFS"} } })
#   d. Exit that container, and restart the workspace container
#      > docker-compose restart ws
#
# With the setup done, this script should do the job of creating accounts, importing the Narrative type,
# loading test data, etc.


def create_user(user_id):
    """
    Returns a token for that user.
    """
    headers = {
        "Content-Type": "application/json"
    }
    r = requests.post(mini_auth_url + '/api/V2/testmodeonly/user', headers=headers, data=json.dumps({'user': user_id, 'display': "User {}".format(user_id)}))
    if r.status_code != 200 and r.status_code != 400:
        print("Can't create dummy user!")
        r.raise_for_status()
    r = requests.post(mini_auth_url + '/api/V2/testmodeonly/token', headers=headers, data=json.dumps({'user': user_id, 'type': 'Login'}))
    if r.status_code != 200:
        print("Can't make dummy token!")
        r.raise_for_status()
    token = json.loads(r.text)
    return token['token']

def load_narrative_type(ws):
    """
    Loads the KBaseNarrative.Narrative type info into mini kb.
    ws = Workspace client configured for admin
    """
    ws.request_module_ownership("KBaseNarrative")
    ws.administer({
        'command': 'approveModRequest',
        'module': 'KBaseNarrative'
    })
    with open(old_narrative_spec_file, "r") as f:
        old_spec = f.read()
    ws.register_typespec({
        'spec': old_spec,
        'dryrun': 0,
        'new_types': [
            'Narrative',
            'Cell',
            'Worksheet',
            'Metadata'
        ]
    })
    ws.release_module('KBaseNarrative')
    for n in ws.get_module_info({'mod': 'KBaseNarrative'})['types'].keys():
        if '.Narrative' in n:
            old_ver = n.split('-')[-1]

    with open(narrative_spec_file, "r") as f:
        spec = f.read()
    ws.register_typespec({
        'spec': spec,
        'dryrun': 0,
        'new_types': []
    })
    ws.release_module('KBaseNarrative')
    for n in ws.get_module_info({'mod': 'KBaseNarrative'})['types'].keys():
        if '.Narrative' in n:
            new_ver = n.split('-')[-1]
    return {
        'old_ver': old_ver,
        'new_ver': new_ver
    }

def load_narrative_test_data(ws, vers):
    """
    Loads the test data set into mini kb ws.
    Returns this structure:
    wsid: {
        narrative_id: int
        correct_ws_meta: {}
        correct_ws_perms: {}
    }

    there's more than 1 wsid (should be ~7-10), but that's it.
    """
    with open(test_narrative_data, 'r') as f:
        test_data = json.loads(f.read().strip())

    uploaded_data = list()
    for ws_data in test_data["old"]:
        uploaded_data.append(_load_workspace_data(ws, ws_data, len(uploaded_data), vers['old_ver']))
    for ws_data in test_data["new"]:
        uploaded_data.append(_load_workspace_data(ws, ws_data, len(uploaded_data), vers['new_ver']))
    return uploaded_data

def _load_workspace_data(ws, ws_data, idx, narrative_ver):
    """
    Loads up a single workspace with data and returns a dict about it.
    Dict contains:
    id = the workspace id
    perms = the workspace permissions
    correct_meta = the correct workspace metadata (for validation)
    """

    print(ws_data.keys())
    narratives = ws_data['narratives']
    ws_meta = ws_data['ws_meta']
    ws_info = ws.create_workspace({"workspace": "NarrativeWS-{}-{}".format(idx, int(time()*1000))})
    ws_id = ws_info[0]
    info = {
        "ws_id": ws_id,
        "ws_info": ws_info,
        "nar_info": [],
        "perms": ws_data["perms"],
        "correct_meta": ws_data["correct_meta"],
        "loaded_meta": ws_meta
    }

    if len(narratives):
        for idx, nar in enumerate(narratives):
            objects = ws.save_objects({
                'id': ws_id,
                'objects': [{
                    'type': 'KBaseNarrative.Narrative-{}'.format(narrative_ver),
                    'data': nar,
                    'name': 'Narrative-{}'.format(idx)
                }]
            })
            info['nar_info'].append(objects[0])

        if len(ws_meta):
            ws.alter_workspace_metadata({
                'wsi': {'id': ws_id},
                'new': ws_meta
            })

        perms = ws_data["perms"]
        if len(perms) > 1:
            admin_perm = perms['wsadmin']
            ws.set_permissions({
                'id': ws_id,
                'new_permission': admin_perm,
                'users': ['wsadmin']
            })
    return info

def main():
    admin_token = create_user(mini_ws_admin)
    admin_ws = Workspace(url=mini_ws_url, token=admin_token)
#    versions = load_narrative_type(admin_ws)
    versions = {
        'old_ver': '1.0',
        'new_ver': '2.0'
    }

    user_token = create_user(test_user)
    user_ws = Workspace(url=mini_ws_url, token=user_token)
    loaded_info = load_narrative_test_data(user_ws, versions)
    pprint(loaded_info)

    fix_all_workspace_info(mini_ws_url, mini_auth_url, admin_token)
    for ws_data in loaded_info:
        ws_id = ws_data['ws_id']
        ws_meta = user_ws.get_workspace_info({'id': ws_id})[8]
        try:
            assert(ws_meta == ws_data['correct_meta'])
        except:
            print("WS: {}".format(ws_id))
            pprint(ws_meta)
            print("doesn't match")
            pprint(ws_data['correct_meta'])

if __name__ == '__main__':
    sys.exit(main())