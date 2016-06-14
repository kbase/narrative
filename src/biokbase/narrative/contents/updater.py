"""
Updates Narratives to the most recent version.
This is intended to operate on the Narrative Typed Object as returned
from the Workspace, BEFORE it gets transformed into a notebook model.
(e.g. should be injected into narrativeio.KBaseWSManagerMixin.read_narrative
 when content==True)
"""

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
    """
    # 1. Turn it into a code cell.
    cell['cell_type'] = u'code'

    # 2. Get its metadata and update it to be new cell-ish
    meta = cell['metadata']['kb-cell']
    new_meta = []

    cell['metadata']['kbase'] = new_meta
    del cell['metadata']['kb-cell']
    return cell

def update_app_cell(cell):
    """
    Updates an app cell to the new style (which is deprecated...)
    """
    # (let the front end deal with it)
    cell['metadata']['kbase'] = {'app': True, 'info': cell['metadata']['kb-cell']}
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

def update_metadata(narrative):
    """
    Updates the narrative (e.g. notebook) metadata to the new format.
    """
    if 'kbase' in narrative['metadata']:
        return narrative
    else:
        narrative['metadata']['kbase'] = {
            'job_ids': narrative['metadata'].get('job_ids', {}),
            'name': narrative['metadata'].get('name', ''),
            'creator': narrative['metadata'].get('creator', ''),
            'ws_name': narrative['metadata'].get('ws_name', '')
        }
        # delete the old here, but we'll do that later once the rest
        # of the system supports that.
    return narrative