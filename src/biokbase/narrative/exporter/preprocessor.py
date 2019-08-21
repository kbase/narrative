"""
Narrative preprocessor for nbconvert exporting
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'


from nbconvert.preprocessors import Preprocessor
import os

class NarrativePreprocessor(Preprocessor):
    """
    A KBase Narrative specific pre-processor.
    Right now it simply extracts the narrative title and
    provides it as a resource under resources['kbase']['title']

    Something to build on!
    """

    def __init__(self, **kw):
        super(NarrativePreprocessor, self).__init__(**kw)
        self.host = 'https://narrative-dev.kbase.us'
        self.app_style_file = os.path.join(os.environ.get('NARRATIVE_DIR', '.'), 'src', 'biokbase', 'narrative', 'exporter', 'app_style.css')

    def preprocess(self, nb, resources):
        (nb, resources) = super(NarrativePreprocessor, self).preprocess(nb, resources)

        # Get some more stuff to show in the page into resources
        if not 'kbase' in resources:
            resources['kbase'] = {}
        resources['kbase'].update({
            'title': nb['metadata']['name'],
            'host': self.host,
            'creator': nb['metadata']['creator']
        })

        if not 'inlining' in resources:
            resources['inlining'] = {}
        if not 'css' in resources['inlining']:
            resources['inlining']['css'] = []
        with open(self.app_style_file, 'r') as css:
            resources['inlining']['css'].append(css.read())

        return nb, resources

    def preprocess_cell(self, cell, resources, index):
        # for output in cell.get('outputs', []):
        #     if 'application/javascript' in output.get('data', {}):
        #         output['data']['application/javascript'][]
        # outputs = print cell.get('outputs', [])
        if 'kbase' in cell.metadata:
            kb_meta = cell.metadata.get('kbase')
            kb_info = {
                'type': kb_meta.get('type')
            }
            if kb_info['type'] == 'app':
                kb_info = self._process_app_info(kb_info, kb_meta)
            cell.metadata['kbase'] = kb_info
        else:
            kb_info = {
                'type': 'nonkb'
            }
        if not 'kbase' in resources:
            resources['kbase'] = {}
        if not 'cells' in resources['kbase']:
            resources['kbase']['cells'] = {}
        resources['foo'] = 'bar'
        resources['kbase']['cells'][index] = cell.metadata.get('kbase')
        return cell, resources

    def _process_app_info(self, kb_info: dict, kb_meta: dict) -> dict:
        """
        Extracts the useful bits of the complicated metadata structure so that the Jinja templates don't
        look like spaghetti with stuff like 'kbase.appCell.app.spec.info......'
        returns a dict with the updated info.
        """
        kb_info['app'] = {
            'title': kb_meta['attributes']['title'],
            'subtitle': kb_meta['attributes']['subtitle'],
            'version': kb_meta['appCell']['app']['version'],
            'id': kb_meta['appCell']['app']['id'],
            'tag': kb_meta['appCell']['app']['tag'],
            'catalog_url': kb_meta['attributes']['info']['url'],
        }
        kb_info['params'] = {
            'input': [],
            'output': [],
            'parameter': []
        }
        param_values = kb_meta['appCell']['params']
        spec_params = kb_meta['appCell']['app']['spec']['parameters']
        for p in spec_params:
            p['value'] = param_values.get(p['id'])
            p_type = p['ui_class']
            kb_info['params'][p_type].append(p)
        kb_info['output'] = kb_meta['appCell']['exec']['outputWidgetInfo']['params']
        kb_info['job'] = {
            'state': kb_meta['appCell']['exec']['jobState']['job_state']
        }
        return kb_info
