import unittest
from biokbase.narrative.contents.updater import (
    update_narrative,
    find_app_info,
    suggest_apps
)
import json
from ConfigParser import ConfigParser

class TestKeyError(ValueError):
    def __init__(self, keyname, source):
        ValueError.__init__(self, "Key {} not found in {}".format(keyname, source))

class UpdaterTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        config = ConfigParser()
        config.read('test.cfg')

        # read in test file stuff from ./data/...
        f = open(config.get('narratives', 'updater_file'), 'r')
        self.test_nar = json.loads(f.read())['data']
        f.close()
        f = open(config.get('narratives', 'updater_file_big'), 'r')
        self.test_nar_big = json.loads(f.read())['data']
        f.close()
        f = open(config.get('narratives', 'updater_file_poplar'), 'r')
        self.test_nar_poplar = json.loads(f.read())['data']
        f.close()

    def validate_narrative(self, nar):
        """
        a valid narrative nar should have:
        nar.metadata = {
            description : string,
            data_dependencies : list,
            creator: string,
            format: string,
            name: string,
            type: string,
            ws_name: string,
            kbase: {
                job_ids,
                name,
                creator,
                ws_name
            }
        }
        nar.cells = [ list of cells ]
        nar.nbformat = int,
        nar.nbformat_minor = int
        """
        for key in ['metadata', 'cells', 'nbformat', 'nbformat_minor']:
            if key not in nar:
                raise TestKeyError(key, 'Narrative')

        if not isinstance(nar['nbformat'], int):
            raise ValueError('nbformat must be an int')
        if not isinstance(nar['nbformat_minor'], int):
            raise ValueError('nbformat_minor must be an int')
        if not isinstance(nar['cells'], list):
            raise ValueError('cells must be a list')
        if not isinstance(nar['metadata'], dict):
            raise ValueError('metadata must be a dict')
        for cell in nar['cells']:
            self.validate_cell(cell)
        self.validate_metadata(nar['metadata'])
        return True;

    def validate_metadata(self, meta):
        req_keys = ['description', 'data_dependencies', 'creator', 'format', 'name', 'type', 'ws_name', 'kbase']
        for key in req_keys:
            if key not in meta:
                raise TestKeyError(key, 'Narrative Metadata')
        if not isinstance(meta['kbase'], dict):
            raise ValueError('metadata.kbase must be a dict')
        for key in ['job_ids', 'name', 'creator', 'ws_name']:
            if key not in meta['kbase']:
                raise TestKeyError(key, 'narrative["metadata"]["kbase"]')
        return True

    def validate_cell(self, cell):
        """
        a valid cell should have:
        cell.source = string,
        cell.cell_type = ("markdown" | "code")
        cell.metadata = (optional) {
            "kbase": {
                stuff
            },
            "kb-cell" : {
                (deprecated, IF cell.metadata.kbase.methods, should not exist)
            }
        }
        """
        for key in ['source', 'cell_type']:
            if key not in cell:
                raise TestKeyError(key, 'Cell')
        if not isinstance(cell['source'], basestring):
            raise ValueError('cell.source must be a string')
        if not isinstance(cell['cell_type'], basestring):
            raise ValueError('cell.cell_type must be a string')
        if 'metadata' in cell:
            if 'kbase' in cell['metadata']:
                # test stuff
                if 'app' in cell['metadata']['kbase']:
                    return True
                elif 'appCell' in cell['metadata']['kbase']:
                    # print(cell['metadata']['kbase']['appCell']['app']['tag'])
                    return True
                if 'old_app' not in cell['metadata']['kbase'] and cell['cell_type'] != 'code':
                    raise ValueError('KBase method can no longer be Markdown cells!')
        return True

    def test_update_narrative(self):
        nar_update = update_narrative(self.test_nar)
        self.assertTrue(self.validate_narrative(nar_update))

    def test_update_narrative_big(self):
        nar_update = update_narrative(self.test_nar_big)
        self.assertTrue(self.validate_narrative(nar_update))

    def test_update_narrative_poplar(self):
        nar_update = update_narrative(self.test_nar_poplar)
        self.assertTrue(self.validate_narrative(nar_update))

    def test_find_app(self):
        info = find_app_info('NarrativeTest/test_input_params')
        self.assertTrue(isinstance(info, dict))

    def test_find_bad_app(self):
        self.assertIsNone(find_app_info('NotAnAppModule'))

    def test_suggest_apps(self):
        obsolete_id = 'build_a_metabolic_model'
        suggestions = suggest_apps(obsolete_id)
        self.assertTrue(isinstance(suggestions, list))
        self.assertEquals(suggestions[0]['spec']['info']['id'], 'fba_tools/build_metabolic_model')

    def test_suggest_apps_none(self):
        suggestions = suggest_apps('NotAnAppModule')
        self.assertTrue(isinstance(suggestions, list))
        self.assertEquals(len(suggestions), 0)

if __name__ == "__main__":
    unittest.main()
