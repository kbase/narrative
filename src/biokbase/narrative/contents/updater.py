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
import os
import datetime
import biokbase.narrative.clients as clients
from biokbase.narrative.jobs.specmanager import SpecManager


def update_needed(narrative):
    # simple enough - if there's a "kbase" block
    # in the metadata, it's been updated.
    return 'kbase' not in narrative['metadata']


def update_narrative(narrative):
    """
    Updates the Narrative to the most recent version.
    If no updates are necessary, just returns the narrative.
    """
    if not update_needed(narrative):
        return narrative

    updated_cells = list()

    format_ver = narrative.get('nbformat', 4)

    if 'worksheets' in narrative:
        cells = narrative['worksheets'][0]['cells']
        format_ver = 3 # just to double-check
    else:
        cells = narrative['cells']

    for idx, cell in enumerate(cells):
        updated_cells.append(update_cell(cell, format_ver))

    updated_metadata = update_metadata(narrative['metadata'])
    if 'worksheets' in narrative:
        narrative['worksheets'][0] = {
            'cells': updated_cells,
            'metadata': updated_metadata
        }
    else:
        narrative['cells'] = updated_cells
        narrative['metadata'] = updated_metadata
    return narrative


def update_cell(cell, format_ver):
    """
    Look for what kind of cell it is.
    if code cell, do nothing, it's already up-to-date.
    if Markdown cell, and it has kb-cell in its metadata, do something.
    if kb-cell.type == kb_app, go to update_legacy_app_cell
    if kb-cell.type == function_input , go to update_method_cell
    if kb-cell.type == function_output , go to update_output_cell
    """
    if cell.get('cell_type', None) != 'markdown':
        return cell
    meta = cell['metadata']

    kb_cell_type = meta.get('kb-cell', {}).get('type', None)
    if kb_cell_type == 'kb_app':
        cell = update_legacy_app_cell(cell)
    elif kb_cell_type == 'function_input':
        cell = update_method_cell(cell, format_ver)
    elif kb_cell_type == 'function_output':
        cell = update_output_cell(cell, format_ver)

    return cell


def update_method_cell(cell, format_ver):
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
    # 1. Get its metadata and update it to be new cell-ish
    meta = cell['metadata']['kb-cell']
    if 'method' not in meta:
        # throw an error?
        return cell

    # try to find cell_id, if not, make up a new one.

    method_info = meta['method'].get('info', {})
    method_behavior = meta['method'].get('behavior', {})
    widget_state = meta.get('widget_state', [])
    if len(widget_state):
        widget_state = widget_state[0]
    else:
        widget_state = {}

    runtime_state = widget_state.get('state', {})
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

    ts = widget_state.get('time', None)
    if ts:
        ts = datetime.datetime.utcfromtimestamp(ts/1000.0).strftime('%a, %d %b %Y %H:%M:%S GMT')

    git_hash = method_info.get('git_commit_hash', None)
    app_name = method_info.get('id', '')
    # the app_name in this case, is everything after the slash. So MegaHit/run_megahit would just be 'run_megahit'
    app_name = app_name[app_name.find('/')+1:]
    module_name = method_behavior.get('kb_service_name', None)
    tag = None
    # now we get the version, if it exists.
    # print("{}/{}".format(module_name, git_hash))
    # Suddenly, this is very complex...
    # Need git_hash and module_name to look up the version.
    # if lookup succeeds -
    #   if has a release tag, use it.
    #   if not, lookup the module's info (get_module_info), use the most released one (release > beta > dev) and change the hash
    # if lookup fails -
    #   try again with just the module info
    #   if THAT fails, the cell can't be updated.
    # if no git_hash or module_name, it's not an SDK-based cell and can't be looked up.
    if git_hash and module_name:
        cat = clients.get('catalog')
        tag_pref_order = ['release', 'beta', 'dev']
        try:
            # print('looking up ' + module_name + ' hash ' + git_hash)
            version_info = cat.get_module_version({'module_name': module_name, 'version': git_hash})
            if 'release_tags' in version_info:
                tags = version_info['release_tags']
                if len(tags) > 0:
                    tags = [t.lower() for t in tags]
                    for tag_pref in tag_pref_order:
                        if tag_pref in tags:
                            tag = tag_pref
                if tag is None:
                    raise Exception("No release tag found!")
        except Exception as e:
            # print("Exception found: {}".format(str(e)))
            try:
                # print("Searching for module info...")
                mod_info = cat.get_module_info({'module_name': module_name})
                # look for most recent (R > B > D) release tag with the app.
                for tag_pref in tag_pref_order:
                    tag_info = mod_info.get(tag_pref, None)
                    if tag_info is not None and app_name in tag_info.get('narrative_methods', []):
                        tag = tag_pref
                        break
                # print("tag set to {}".format(tag))
            except Exception as e2:
                print("Exception found: {}".format(e2))

    else:
        # it's not an SDK method! do something else!
        return obsolete_method_cell(cell, method_info.get('id'), method_info.get('name'), meta['method'], method_params)

    new_meta = {
        'type': 'app',
        'attributes': {
            'title': method_info.get('name', 'Unnamed App'),
            'id': unicode(uuid.uuid4()),
            'status': 'new',
            'created': ts,          # default to last saved time
            'lastLoaded': ts,
        },
        'appCell': {
            'app': {
                'id': method_info.get('id', 'unknown'),
                'gitCommitHash': git_hash,
                'version': method_info.get('ver', None),
                'tag': tag,
                'spec': meta['method']
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
            }
            # 'fsm': {
            #     'currentState': fsm_state
            # }
        }
    }

    # Finally, turn it into a code cell.
    source_key = 'input' if format_ver == 3 else 'source'
    exec_count_key = 'prompt_number' if format_ver == 3 else 'execution_count'

    cell['cell_type'] = u'code'
    cell[exec_count_key] = None
    cell['outputs'] = []
    cell['metadata']['kbase'] = new_meta
    del cell['metadata']['kb-cell']
    cell[source_key] = u''
    return cell


def obsolete_method_cell(cell, app_id, app_name, app_spec, params):
    """
    Sets the cell to be a Markdown cell with information about how it's obsolete
    and how to update it.
    """
    cell['cell_type'] = 'markdown'
    base_source = """<div style="border:1px solid #CECECE; padding: 5px">
    <div style="font-size: 120%; font-family: 'OxygenBold', Arial, sans-serif; color:#2e618d;">{}</div>
    <div style="font-family: 'OxygenBold', Arial, sans-serif;">
    Obsolete App!
    </div>
    Sorry, this app is obsolete and can no longer function. But don't worry! Any data objects that were produced when you ran this app have been saved.
    <br>Please see the <a href="http://kbase.us/kbase-app-replacement/">App Replacement page</a> for more information.
    <br><br><b>Parameter settings you used:</b>
    {}
    <br><b>Suggested replacement app(s):</b><br>
    {}
</div>"""

    if len(params) == 0:
        format_params = "<br>No saved parameters found<br><br>"
    else:
        format_params = '<ul>\n'
        p_name_map = dict()
        for p in app_spec['parameters']:
            p_name_map[p.get('id', 'none')] = p.get('ui_name', p.get('id', 'none')).rstrip()

        for p in params:
            p_name = p_name_map.get(p, p)
            format_params = format_params + '<li>{} - {}</li>\n'.format(p_name, params[p])
        # format_params = '<ul>' + '\n'.join(['<li>{} - {}</li>'.format(p, params[p]) for p in params]) + '</ul>'
        format_params = format_params + '</ul>'

    suggestions = suggest_apps(app_id)
    if len(suggestions) == 0:
        format_sug = "Sorry, no suggested apps found."
    else:
        format_sug = 'The following replacement apps might help and are available in the Apps menu:<br><ul>' + '\n'.join(['<li>{}</li>'.format(s['spec']['info']['name']) for s in suggestions]) + '</ul>'

    cell['source'] = unicode(base_source.format(app_name, format_params, format_sug))
    del cell['metadata']['kb-cell']
    return cell


def update_legacy_app_cell(cell):
    """
    Updates a legacy app cell to the new show a message about deprecation/obsoletion.
    """
    meta = cell['metadata']['kb-cell']
    app_name = meta.get('app', {}).get('info', {}).get('name', 'Unknown app') + " (multi-step app)"
    app_id = meta.get('app', {}).get('info', {}).get('id', None)

    params = dict()
    if len(meta.get('widget_state')):
        try:
            params = meta['widget_state'][0]['state']['step']
        except:
            pass
    cell = obsolete_app_cell(cell, app_id, app_name, meta.get('app', {}), params)
    cell['metadata']['kbase'] = {'old_app': True, 'info': meta}
    return cell


def obsolete_app_cell(cell, app_id, app_name, app_spec, params):
    """
    Generates a Markdown cell with some information about the old-style app
    being obsolete, and how to update it.
    """

    cell['cell_type'] = 'markdown'
    base_source = """<div style="border:1px solid #CECECE; padding: 5px">
    <div style="font-size: 120%; font-family: 'OxygenBold', Arial, sans-serif; color:#2e618d;">{}</div>
    <div style="font-family: 'OxygenBold', Arial, sans-serif;">
    Obsolete App!
    </div>
    Sorry, this app is obsolete and can no longer function. But don't worry! Any data objects that were produced when you ran this app have been saved.
    <br>Please see the <a href="http://kbase.us/kbase-app-replacement/">App Replacement page</a> for more information.
    <br><br><b>Parameter settings you used:</b>
    {}
    <br><b>Suggested replacement app(s):</b><br>
    {}
</div>"""

    if len(params) == 0:
        format_params = "<br>No saved parameters found<br><br>"
    else:
        format_params = '<ol>\n'
        for step in app_spec.get('steps', []):
            step_id = step.get('step_id', None)
            if step_id is not None:
                step_name = step.get('method_id', None)
                step_params = params.get(step_id, {}).get('inputState', {})
                if step_name is not None:
                    format_params += '<li>' + step_name
                    if len(step_params):
                        format_params += '<ul>' + ''.join(['<li>{} - {}</li>'.format(p, step_params[p]) for p in step_params]) + '</ul>'
                    format_params += '\n'
        format_params += '</ol>'

    suggestions = list()
    for idx, step in enumerate(app_spec.get('steps', [])):
        sug_list = suggest_apps(step.get('method_id', ''))
        orig_step = step.get('method_id', 'Step {}'.format(idx))
        if len(sug_list) == 0:
            suggestions.append(dict(orig_step=orig_step, sug=['No suggestions found']))
        else:
            suggestions.append(dict(orig_step=orig_step, sug=[s['spec']['info']['name'] for s in sug_list]))
    if len(suggestions) == 0:
        format_sug = "Sorry, no suggested apps found."
    else:
        format_sug = "The following replacement apps might help and are available in the Apps menu:<br><ol>"
        for idx, s_list in enumerate(suggestions):
            format_sug += '<li>{}<ul>'.format(s_list['orig_step'])
            format_sug += ''.join(['<li>{}</li>'.format(s) for s in s_list['sug']]) + '</ul></li>'
        format_sug += '</ol>'

    cell['source'] = unicode(base_source.format(app_name, format_params, format_sug))
    del cell['metadata']['kb-cell']
    return cell


def update_output_cell(cell, format_ver):
    """
    Updates an output viewer cell to the right new format.
    """
    # hoo-boy, here's the hard one.
    # Grab the source, parse it, build a new viewer for it,
    # put that in a code cell, and put the result in the output area (since we already know what it is, just plop it in there).
    code = cell['source']

    m = re.search('<div id=\"(.+)\"></div>\s*<script>(\$\(.+\))\.(\w+)\((.+)\);\<\/script\>', code)
    groups = m.groups()
    if m is not None and len(m.groups()) == 4:
        cell_id = groups[0]
        cell_node = groups[1]
        widget = groups[2]
        widget_inputs=groups[3]
        elem_output = '\n element.html("<div id=\'' + cell_id + '\' class=\'kb-vis-area\'></div>");\n\n require(["' + widget + '"], function(' + widget + ') { new ' + widget + '(' + cell_node + ', ' + widget_inputs + '); });'
        new_source = "from IPython.display import Javascript\nJavascript(\"\"\"" + elem_output + "\"\"\")"
        js_output = {
            u'data': {
                u'text/plain': u'<IPython.core.display.Javascript object>',
                u'application/javascript': elem_output
            },
            u'execution_count': 1,
            u'metadata': {},
            u'output_type': u'execute_result'
        }

        source_key = 'input' if format_ver == 3 else 'source'
        exec_count_key = 'prompt_number' if format_ver == 3 else 'execution_count'
        cell['outputs'] = [js_output]
        cell[source_key] = new_source
        cell['cell_type'] = 'code'
        cell[exec_count_key] = 1
        meta = cell['metadata']
        meta['kbase'] = {
            'attributes': {
                'status': 'new',
                'title': 'Data Viewer',
            },
            'type': 'output'
        }
        cell['metadata'] = meta
        if (format_ver == 3):
            del cell['source']
    return cell


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


def find_app_info(app_id):
    sm = SpecManager()
    for tag in ['release', 'beta', 'dev']:
        if app_id in sm.app_specs[tag]:
            return {'tag': tag, 'spec': sm.app_specs[tag][app_id]}
    return None


def suggest_apps(obsolete_id):
    suggest = obsolete_apps.get(obsolete_id, None)
    suggestions = list()
    if suggest is not None:
        for new_id in suggest:
            new_spec = find_app_info(new_id)
            if new_spec is not None:
                suggestions.append(new_spec)
    return suggestions

try:
    nar_path = os.environ["NARRATIVE_DIR"]
    obsolete_json = open(os.path.join(nar_path, "src", "obsolete_app_mapping.json"))
    obsolete_apps = json.loads(obsolete_json.read())
except:
    obsolete_apps = dict()
