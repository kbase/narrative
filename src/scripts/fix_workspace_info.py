"""
Fixes workspace info to do the following.
1. Make sure the "narrative" metadata field contains an int that points to the narrative.
2. Make sure the "narrative_nice_name" metadata field is correct.
3. Make sure the "is_temporary" metadata field exists and is correct.
4. Adds a count of the number of narrative cells.
5. Does nothing at all if there's > 1 narrative in the workspace.
Note that while this fetches the Narrative object, it doesn't modify it in any way.
"""
from biokbase.workspace.client import Workspace

ws_url = "https://ci.kbase.us/services/workspace"

def fix_workspace_info(ws_id, token, verbose=False):
    """
    ws_id = id of the workspace to update.
    token = auth token of the user who owns the workspace.
    """
    assert(token is not None)
    assert(str(ws_id).isdigit())

    new_meta = dict()
    ws = Workspace(url=ws_url, token=token)

    if verbose:
        print("Checking workspace {}".format(ws_id))

    # test if there's exactly 1 Narrative object in the workspace
    narr_obj_list = ws.list_objects({'ids': [ws_id]})
    if len(narr_obj_list) != 1:
        if verbose:
            print("\tFound {} Narratives! Skipping this workspace".format(len(narr_obj_list)))
        return
    narr_info = narr_obj_list[0]
    narr_obj_id = narr_info[0]

    # fetch the workspace info and narrative object (with metadata)
    ws_info = ws.get_workspace_info({'id': int(ws_id)})
    ws_meta = ws_info[8]
    narr_obj = ws.get_objects2({'objects': [{'ref': '{}/{}'.format(ws_id, narr_obj_id)}]})['data'][0]
    narr_name = narr_obj['data']['metadata']['name']

    # 1. Test "narrative" key of ws_meta
    if str(narr_obj_id) != ws_meta.get('narrative'):
        new_meta['narrative'] = str(narr_obj_id)
        if verbose:
            print("\tUpdating id from {} -> {}".format(ws_meta.get('narrative'), narr_obj_id))

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
                print("\tNarrative is named {} and has {} versions - marking not temporary".format(narr_name, narr_info[4]))
            new_meta['is_temporary'] = 'false'
        # get list of cells
        # if it's really REALLY old, it has a 'worksheets' field. Removed in Jupyter notebook format 4.
        if 'worksheets' in narr_obj['data']:
            cells = narr_obj['data']['worksheets'][0]['cells']
        else:
            cells = narr_obj['data']['cells']
        if len(cells) > 1 or cells[0]['cell_type'] != 'markdown':
            if verbose:
                print("\tNarrative has {} cells and the first is type {} - marking not temporary".format(len(cells), cells[0]['cell_type']))
            new_meta['is_temporary'] = 'false'

    # 3. Test "narrative_nice_name" key
    meta_name = ws_meta.get('narrative_nice_name')
    if (meta_name is None and current_temp == 'false') or meta_name != narr_name:
        new_meta['narrative_nice_name'] = narr_name
        if verbose:
            print("\tUpdating 'narrative_nice_name' from {} -> {}".format(meta_name, narr_name))

    # 4. Add the total cell count while we're at it.
    new_meta['cell_count'] = str(len(cells))
    if verbose:
        print("\tAdding cell_count of {}".format(str(len(cells))))

    ws.alter_workspace_metadata({'wsi': {'id': ws_id}, 'new': new_meta})