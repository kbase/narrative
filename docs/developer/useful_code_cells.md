## IPython notebook code-cell snippets

This is some collection of useful IPython notebook code-cell snippets for advanced Narrative developer.

How to get method info from Narrative Method Store:
```python
from biokbase.service.Client import Client
cl = Client("https://appdev.kbase.us/services/narrative_method_store/rpc", use_url_lookup=False)
cl.sync_call("NarrativeMethodStore.get_method_brief_info", [{'ids': ["PangenomeOrthomcl/build_pangenome_with_orthomcl"], 'tag': "dev"}])[0]
```

How to request method ids and names (and other properties) from NMS:
```python
version_tag = 'release' # may be 'release', 'beta' or 'dev'
from biokbase.service.Client import Client
cl = Client("https://appdev.kbase.us/services/narrative_method_store/rpc", use_url_lookup=False)
ret = cl.sync_call("NarrativeMethodStore.list_methods", 
                 [{'tag': version_tag}])[0]
count = 0
for method in ret:
    if 'active' not in method['categories']:
        continue
    genome_found = False
    for in_type in method['input_types']:
        if in_type == "KBaseGenomes.Genome":
            genome_found = True
            break
    if not genome_found:
        for in_type in method['output_types']:
            if in_type == "KBaseGenomes.Genome":
                genome_found = True
                break
    if not genome_found:
        continue
    print('"' + method['name'] + '"  (' + method['id'] + ')')
    # Also see such properties as:
    #method['ver'] -> semantic version (like 1.0.2)
    #method['authors'] -> list of authors
    #method['git_commit_hash'] -> git commit hash
    #method['input_types'] -> list of input types
    #method['output_types'] -> list of output types
    #method['tooltip'] -> breif info
    count += 1
print("==================================================================================")
print("Count: " + str(count))
```

Here is an example of how to modify Narrative object in Workspace:
```python
narr_ws = 20181 (your narrative numeric workspace ID)
narr_id = 1
from biokbase.service.Client import Client
cl = Client("https://appde.kbase.us/services/ws", use_url_lookup=False)
obj = cl.sync_call("get_objects", [[{'ref': str(narr_ws) + "/" + str(narr_id)}]])[0][0]
narr_meta = obj["info"][10]
narr_obj = obj['data']
cells = narr_obj['cells']
ortho_cells = []
for cell in cells:
    if (cell['cell_type'] == 'code' and 'metadata' in cell and 
        'kbase' in cell['metadata'] and 'appCell' in cell['metadata']['kbase']):
        app_cell = cell['metadata']['kbase']['appCell']
        app = app_cell['app']
        if app['id'] == 'PangenomeOrthomcl/build_pangenome_with_orthomcl':
            tag = app['tag']
            ver = app['version']
            commit = app['gitCommitHash']
            ortho_cells.append(cell)
            app['tag'] = "release"
            app['version'] = "0.0.1"
            app['gitCommitHash'] = "dea354f3a2ddbf486cd0ddc6871bdce4c66e4b75"
            del app['spec']
            narr_meta["method." + app['id'] + "/" + app['gitCommitHash']] = '1'
            app_cell['fatalError'] = {'advice': [u'This condition should never occur outside of a development environment'],
                                      'detail': 'no additional details',
                                      'message': 'This app cell is corrupt -- the app info is incomplete',
                                      'title': 'Error loading main widgets'}
            app_cell['fsm'] = {'currentState': {'mode': 'internal-error'}}
            app_cell['notifications'] = ['Error loading main widgets: This app cell is corrupt -- the app info is incomplete']
            cell['source'] = ''
cl.sync_call("save_objects", [{'id': narr_ws, 'objects': [{'type': "KBaseNarrative.Narrative", 
    'objid': narr_id, 'meta': narr_meta, 'data': narr_obj, 'hidden': 1}]}])[0]
ortho_cells
```

Here is how to use admin methods in Catalog:
```python
from biokbase.service.Client import Client
cl = Client("https://appdev.kbase.us/services/catalog", use_url_lookup=False)
#cl.sync_call("Catalog.set_to_inactive", [{'module_name': "???"}])
#cl.sync_call("Catalog.migrate_module_to_new_git_url", [{'module_name': "WsLargeDataIO", 'current_git_url': "https://github.com/rsutormin/WsLargeDataIO", 'new_git_url': "https://github.com/kbaseapps/WsLargeDataIO"}])
#cl.sync_call("Catalog.push_dev_to_beta", [{'module_name': "RAST_SDK"}])
#cl.sync_call("Catalog.request_release", [{'module_name': "RAST_SDK"}])
```
