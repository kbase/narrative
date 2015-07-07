from biokbase.workspace.client import Workspace
import biokbase.auth
import os
from getpass import getpass
import json
import time

prod_ws = 'https://kbase.us/services/ws'
ci_ws = 'https://ci.kbase.us/services/ws'
ws_metadata = {
    'is_temporary': False,
    'narrative_nice_name': None
}

def fetch_narrative(nar_id, auth_token, url=ci_ws, file_name=None):
    """
    Fetches a Narrative object with the given reference id (of the form ##/##).
    If a file_name is given, then it is printed to that file.
    If the narrative is found, the jsonized string of it is returned.
    """
    ws_client = Workspace(url=url, token=auth_token)
    nar_data = ws_client.get_objects([{'ref':nar_id}])
    if len(nar_data) > 0:
        nar_json = json.dumps(nar_data[0])
        if file_name is not None:
            f = open(file_name, 'w')
            f.write(nar_json)
            f.close()
        return nar_json
    return {}

def upload_narrative(nar_file, auth_token, url=ci_ws, set_public=False):
    """
    Uploads a Narrative from a downloaded object file.
    This file needs to be in JSON format, and it expects all
    data and info that is usually returned by the Workspace.get_objects
    method.

    Returns a dict of three elements: 
        ws: the id of the workspace that was created
        obj: the id of the narrative object
        ref: the above two joined together into an object ref (for convenience)
    """

    # read the file
    f = open(nar_file, 'r')
    nar = json.loads(f.read())
    f.close()

    # do some setup.
    current_nar_metadata = ws_metadata
    current_nar_metadata['narrative_nice_name'] = nar['data']['metadata']['name']
    ws_client = Workspace(url=url, token=auth_token.token)

    # create the new workspace for the narrative
    ws_info = ws_client.create_workspace({
        'workspace': '{}:{}'.format(auth_token.user_id, str(time.time()).replace('.', '')),
        'meta': current_nar_metadata,
        'globalread': 'r' if set_public else 'n'
    })
    ws_id = ws_info[0]

    # setup and save the narrative object
    metadata = nar['info'][10]
    ws_save_obj = {
        'type': 'KBaseNarrative.Narrative',
        'data': nar['data'], 
        'name': nar['info'][1],
        'meta': nar['info'][10],
        'provenance': [{
            'script': 'upload_narrative_test.py',
            'description': 'Temporary Narrative uploaded for automated testing'
        }]
    }
    obj_info = ws_client.save_objects({'id': ws_id,
                                       'objects': [ws_save_obj]})

    # tweak the workspace's metadata to properly present its narrative
    ws_client.alter_workspace_metadata({'wsi': {'id': ws_id}, 'new':{'narrative':obj_info[0][0]}})
    return {
        'ws': ws_info[0],
        'obj': obj_info[0][0],
        'ref': '{}/{}'.format(ws_info[0], obj_info[0][0])
    }

def delete_narrative(ws_id, auth_token, url=ci_ws):
    """
    Deletes a workspace with the given id. Throws a ServerError if the user given
    by auth_token isn't allowed to do so.
    """
    ws_client = Workspace(url=url, token=auth_token.token)
    ws_client.delete_workspace({'id': ws_id})

if __name__ == '__main__':
    test_user_id = 'wjriehl'
    password = getpass('Password for {}: '.format(test_user_id))
    t = biokbase.auth.Token(user_id=test_user_id, password=password)

    fetch_narrative('630/1', t, file_name='wjriehl_nar_private.json')

