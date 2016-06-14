"""
Updates Narratives to the most recent version.
This is intended to operate on the Narrative Typed Object as returned
from the Workspace, BEFORE it gets transformed into a notebook model.
(e.g. should be injected into narrativeio.KBaseWSManagerMixin.read_narrative
 when content==True)

It should be noted here that if an update occurs, job ids will no longer be available.
"""
import uuid
import json
import re

def update_needed(narrative):
    # simple enough - if there's a "kbase" block
    # in the metadata, it's been updated.
    return 'kbase' in narrative['metadata']

def update_narrative(narrative):
    """
    Updates the Narrative to the most recent version.
    If no updates are necessary, just returns the narrative.
    """
    if not update_needed(narrative):
        return narrative

    updated_cells = set()
    for idx, cell in enumerate(narrative['cells']):
        cell = update_cell(cell)
        if cell.get('metadata', {}).get('kbase', {}).get('updated', False):
            updated_cells.add(idx)
    narrative.metadata = update_metadata(narrative.metadata)
    return narrative

def update_cell(cell):
    """
    Look for what kind of cell it is.
    if code cell, do nothing.
    if Markdown cell, and it has kb-cell in its metadata, do something.
    if kb-cell.type == kb_app, go to update_app_cell
    if kb-cell.type == function_input , go to update_method_cell
    if kb-cell.type == function_output , go to update_output_cell
    """
    if cell.get('cell_type', None) is not 'markdown':
        return cell
    meta = cell['metadata']

    kb_cell_type = meta.get('kb-cell', {}).get('type', None)
    if kb_cell_type == 'kb_app':
        cell = update_app_cell(cell)
    elif kb_cell_type == 'function_input':
        cell = update_method_cell(cell)
    elif kb_cell_type == 'function_output':
        cell = update_output_cell(cell)

    return cell

def update_method_cell(cell):
    """
    Updates a single method cell to fill these two constraints:
    1. Become a code cell, NOT a markdown cell.
    2. Translate the cell's metadata to the right structure.
    3. Remove the MD code from the source area.

    Some assumptions made here:
    1. Jobs associated with the cell are not available. So the only
       states are either editing or complete (default to editing)
    2. We don't know what tag the methods came from, so go with 'release'
    """
    # 1. Turn it into a code cell.
    cell['cell_type'] = u'code'

    # 2. Get its metadata and update it to be new cell-ish
    meta = cell['metadata']['kb-cell']
    if 'method' not in meta:
        # throw an error?
        return cell

    # try to find cell_id, if not, make up a new one.

    method_info = meta['method'].get('info', {})
    widget_state = meta.get('widget_state', [])
    if len(widget_state):
        widget_state = widget_state[0]
    else:
        widget_state = {}

    runtime_state = None
    if 'state' in widget_state:
        runtime_state = widget_state['state']

    method_params = runtime_state.get('params', None)
    if not method_params:
        method_params = {}

    # guess at the FSM state for the method cell from the runtime_state.runningState
    cur_state = runtime_state.get('runningState', 'input')
    fsm_state = {}
    if cur_state == 'input':
        fsm_state = {
            'mode': 'editing',
            'params': 'incomplete'
        }
    elif cur_state in ['submitted', 'queued', 'running', 'error']:
        # no longer access to the job, so just reset to input
        fsm_state = {
            'mode': 'editing',
            'params': 'complete'
        }
    else:
        # only one left is complete...
        fsm_state = {
            'mode': 'success',
            'params': 'complete'
        }

    new_meta = {
        'type': 'method',
        'attributes': {
            'id': uuid.uuid4(),
            'status': ...,
            'created': widget_state.get('time', None),          # default to last saved time
            'lastLoaded': widget_state.get('time', None),
        },
        'methodCell': {
            'method': {
                'id': method_info.get('id', 'unknown'),
                'gitCommitHash': method_info.get('git_commit_hash', None)
                'version': method_info.get('ver', None),
                'tag': 'release'
            },
            'state': {
                'edit': 'editing',
                'params': None,
                'code': None,
                'request': None,
                'result': None
            },
            'params': method_params,
            'user-settings': {
                'showCodeInputArea': False,
                'showDeveloperOptions': False
            },
            'fsm': {
                'currentState': fsm_state
            }
        }
    }

    cell['metadata']['kbase'] = new_meta
    del cell['metadata']['kb-cell']
    cell['source'] = u''
    return cell

def update_app_cell(cell):
    """
    Updates an app cell to the new style (which is deprecated...)
    """
    # (let the front end deal with it)
    cell['metadata']['kbase'] = {'old_app': True, 'info': cell['metadata']['kb-cell']}
    del cell['metadata']['kb-cell']
    return cell

def update_output_cell(cell):
    """
    Updates an output viewer cell to the right new format.
    """
    # hoo-boy, here's the hard one.
    # Grab the source, parse it, build a new viewer for it,
    # put that in a code cell, and execute it.
    # ... maybe directly change the output area? Might be easier ...
    pass

def update_metadata(metadata):
    """
    Updates the narrative (e.g. notebook) metadata to the new format.
    """
    if 'kbase' in metadata:
        return metadata
    else:
        metadata['kbase'] = {
            'job_ids': metadata.get('job_ids', {}),
            'name': metadata.get('name', ''),
            'creator': metadata.get('creator', ''),
            'ws_name': metadata.get('ws_name', '')
        }
        # delete the old here, but we'll do that later once the rest
        # of the system supports that.
    return metadata