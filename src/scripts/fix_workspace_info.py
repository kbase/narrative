"""
Fixes workspace info to do the following.
1. Make sure the "narrative" metadata field contains an int that points to the narrative.
2. Make sure the "narrative_nice_name" metadata field is correct.
3. Make sure the "is_temporary" metadata field exists and is correct.
4. Adds a count of the number of narrative cells.
5. Does nothing at all if there's > 1 narrative in the workspace.
Note that while this fetches the Narrative object, it doesn't modify it in any way.
"""
import sys
import requests
import argparse
import json
from biokbase.workspace.client import Workspace
import biokbase.workspace.baseclient as baseclient

MAX_WS_ID = 45000  # make this somewhat reasonable. I think the max ws in prod is +/- 40000

def fix_all_workspace_info(ws_url, auth_url, token):
    """
    Iterates over all workspaces available at the ws_url endpoint, using the given admin token,
    and applies _fix_single_workspace_info to each.
    """
    assert(ws_url)
    assert(auth_url)
    assert(token)

    try:
        user_info = _get_user_id(auth_url, token)
    except:
        print("Failed to validate token or retrieve user info! Exiting.")
        raise

    ws = Workspace(url=ws_url, token=token)
    for ws_id in range(MAX_WS_ID):
        try:
            _fix_single_workspace_info(ws_id, user_info['user'], ws, verbose=True)
        except baseclient.ServerError as e:
            if "No workspace with id" in str(e):
                print("WS:{} does not exist")

def _fix_single_workspace_info(ws_id, admin_id, ws, verbose=False):
    """
    ws_id = id of the workspace to update.
    ws = an authenticated workspace client.
    """
    assert(ws is not None)
    assert(str(ws_id).isdigit())

    new_meta = dict()

    if verbose:
        print("WS:{} Checking workspace {}".format(ws_id, ws_id))

    # test if there's exactly 1 Narrative object in the workspace
    narr_obj_list = ws.administer({
        'command': 'listObjects',
        'params': {
            'ids': [ws_id],
            'type': 'KBaseNarrative.Narrative'
        }
    })
    # narr_obj_list = ws.list_objects({'ids': [ws_id], 'type': 'KBaseNarrative.Narrative'})
    if len(narr_obj_list) != 1:
        if verbose:
            print("WS:{} Found {} Narratives! Skipping this workspace".format(ws_id, len(narr_obj_list)))
        return
    narr_info = narr_obj_list[0]
    narr_obj_id = narr_info[0]

    # fetch the workspace info and narrative object (with metadata)
    ws_info = ws.administer({
        'command': 'getWorkspaceInfo',
        'params': {
            'id': int(ws_id)
        }
    })
    # ws_info = ws.get_workspace_info({'id': int(ws_id)})
    ws_meta = ws_info[8]
    narr_obj = ws.administer({
        'command': 'getObjects',
        'params': {
            'objects': [{'ref': '{}/{}'.format(ws_id, narr_obj_id)}]
        }
    })['data'][0]
    # narr_obj = ws.get_objects2({'objects': [{'ref': '{}/{}'.format(ws_id, narr_obj_id)}]})['data'][0]
    narr_name = narr_obj['data']['metadata']['name']

    # 1. Test "narrative" key of ws_meta
    if str(narr_obj_id) != ws_meta.get('narrative'):
        new_meta['narrative'] = str(narr_obj_id)
        if verbose:
            print("WS:{} Updating id from {} -> {}".format(ws_id, ws_meta.get('narrative'), narr_obj_id))

    # 2. Test "is_temporary" key.
    # Should be true if there's only a single narrative version, and it's name is Untitled, and it only has a single markdown cell.
    # Should never reset to be temporary if it's not.
    # Really, this is here to add the field if it's not there, and to set things as non-temporary
    # if it looks like they should be.
    # So, if the marked 'is_temporary' is already false, do nothing.
    current_temp = ws_meta.get('is_temporary')
    if current_temp == 'true':
        # make sure it should be temporary.
        if narr_info[4] > 1 or narr_name != 'Untitled':
            if verbose:
                print("WS:{} Narrative is named {} and has {} versions - marking not temporary".format(ws_id, narr_name, narr_info[4]))
            new_meta['is_temporary'] = 'false'
        # get list of cells
        # if it's really REALLY old, it has a 'worksheets' field. Removed in Jupyter notebook format 4.
        if 'worksheets' in narr_obj['data']:
            cells = narr_obj['data']['worksheets'][0]['cells']
        else:
            cells = narr_obj['data']['cells']
        if len(cells) > 1 or cells[0]['cell_type'] != 'markdown':
            if verbose:
                print("WS:{} Narrative has {} cells and the first is type {} - marking not temporary".format(ws_id, len(cells), cells[0]['cell_type']))
            new_meta['is_temporary'] = 'false'

    # 3. Test "narrative_nice_name" key
    current_name = ws_meta.get('narrative_nice_name')
    if (current_name is None and current_temp == 'false') or current_name != narr_name:
        new_meta['narrative_nice_name'] = narr_name
        if verbose:
            print("WS:{} Updating 'narrative_nice_name' from {} -> {}".format(ws_id, current_name, narr_name))

    # 4. Add the total cell count while we're at it.
    new_meta['cell_count'] = str(len(cells))
    if verbose:
        print("WS:{} Adding cell_count of {}".format(ws_id, str(len(cells))))

    # 5. Finally, add the searchtags field to metadata.
    new_meta['searchtags'] = 'narrative'

    # ...and update the metadata
    _admin_update_metadata(ws, admin_id, ws_id, new_meta)


def _admin_update_metadata(ws, admin_id, ws_id, new_meta):
    """
    ws = workspace client with admin rights
    admin_id = username of the admin who's token was used to set up the ws client.
    ws_id = the workspace to tweak
    new_meta = the new metadata to set
    """

    # Now we can update the metadata. This is a little tricky from
    # If we don't have permission to write to the workspace, grab it.
    perms = ws.administer({
        'command': 'getPermissionsMass',
        'params': {'workspaces': [{'id': ws_id}]}
    })['perms'][0]
    current_admin_perm = perms.get(admin_id, 'n')
    if current_admin_perm != 'a':
        # add the admin_id as an admin on that workspace.
        ws.administer({
            'command': 'setPermissions',
            'params': {
                'id': ws_id,
                'new_permission': 'a',
                'users': [admin_id]
            }
        })
    # Now that we added ourself as an admin on that workspace, we can just use the usual call to update the metadata
    ws.alter_workspace_metadata({'wsi': {'id': ws_id}, 'new': new_meta})

    # Now, reset our permission on that workspace.
    if current_admin_perm != 'a':
        ws.administer({
            'command': 'setPermissions',
            'params': {
                'id': ws_id,
                'new_permission': current_admin_perm,
                'users': [admin_id]
            }
        })

def _get_user_id(auth_url, token):
    """
    This uses the given token to query the authentication service for information
    about the user who created the token.
    """
    token_api_url = auth_url + "/api/V2/token"
    headers = { "Authorization": token }
    r = requests.get(token_api_url, headers=headers)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
    auth_info = json.loads(r.content)
    return auth_info['user']

def parse_args(args):
    p = argparse.ArgumentParser(description=__doc__.strip())
    p.add_argument("-t", "--token", dest="token", default=None, help="Auth token for workspace admin")
    p.add_argument("-w", "--ws_url", dest="ws_url", default=None, help="Workspace service endpoint")
    p.add_argument("-a", "--auth_url", dest="auth_url", default=None, help="Auth service endpoint")
    args = p.parse_args(args)
    if args.ws_url is None:
        raise ValueError("ws_url - the Workspace service endpoint - is required!")
    if args.auth_url is None:
        raise ValueError("auth_url - the Auth service endpoint - is required!")
    if args.token is None:
        raise ValueError("token - a valid Workspace admin auth token - is required!")
    return args

def main(args):
    args = parse_args(args)
    return fix_all_workspace_info(args.ws_url, args.auth_url, args.token)

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))