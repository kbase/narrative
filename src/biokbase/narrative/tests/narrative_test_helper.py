"""
Contains a couple utilities for fetching narratives and uploading them to the
Workspace.

Uses a hard-coded workspace server for now.
"""

from biokbase.workspace.client import Workspace
import biokbase.auth
import os
from getpass import getpass
import json
import time
import ConfigParser

prod_ws = 'https://kbase.us/services/ws'
ci_ws = 'https://ci.kbase.us/services/ws'
ws_metadata = {
    'is_temporary': False,
    'narrative_nice_name': None
}
_config_file = "test.cfg"


class TestConfig(object):
    def __init__(self):
        self._path_prefix = os.path.join(os.environ["NARRATIVE_DIR"], "src", "biokbase",
                                         "narrative", "tests")
        config_file_path = os.path.join(self._path_prefix, _config_file)
        print("GETTING CONFIG FILE")
        print(config_file_path)
        self._config = ConfigParser.ConfigParser()
        self._config.read(config_file_path)

    def get(self, *args, **kwargs):
        return self._config.get(*args, **kwargs)

    def get_file(self, filename):
        pass

    def load_json_file(self, filename):
        json_file_path = os.path.join(self._path_prefix, filename)
        with open(json_file_path, 'r') as f:
            data = json.loads(f.read())
            f.close()
            return data


def fetch_narrative(nar_id, auth_token, url=ci_ws, file_name=None):
    """
    Fetches a Narrative object with the given reference id (of the form ##/##).
    If a file_name is given, then it is printed to that file.
    If the narrative is found, the jsonized string of it is returned.

    If nothing is found, an empty Dict is returned.
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


def read_json_file(path):
    """
    Generically reads in any JSON file and returns it as a dict.
    Especially intended for reading a Narrative file.
    """
    with open(path, 'r') as f:
        data = json.loads(f.read())
        f.close()
        return data


if __name__ == '__main__':
    test_user_id = 'wjriehl'
    password = getpass('Password for {}: '.format(test_user_id))
    t = biokbase.auth.Token(user_id=test_user_id, password=password)

    fetch_narrative('8245/32', t.token, file_name='updater_test_poplar.json')
