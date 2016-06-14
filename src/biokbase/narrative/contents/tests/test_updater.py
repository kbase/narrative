import unittest
from biokbase.narrative.contents.updater import (
    update_narrative,
    update_cell,
    update_method_cell,
    update_app_cell,
    update_output_cell,
    update_metadata
)

class TestKeyError(ValueError):
    def __init__(self, keyname, source):
        ValueError.__init__(self, "Key {} not found in {}".format(keyname, source))

class UpdaterTestCase(unittest.TestCase):
    @setUpClass
    def init_class():
        # read in test file stuff from ./data/...
        pass

    def validate_narrative(nar):
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
                raise NarrativeKeyError(key, 'Narrative')

        if not isinstance(nar['nbformat'], int):
            raise ValueError('nbformat must be an int')
        if not isinstance(nar['nbformat_minor'], int):
            raise ValueError('nbformat_minor must be an int')
        if not isinstance(nar['cells'], list):
            raise ValueError('cells must be a list')
        if not isinstance(nar['metadata'], dict):
            raise ValueError('metadata must be a dict')
        for cell in nar['cells']:
            validate_cell(cell)
        validate_metadata(nar['metadata'])
        return true;

    def validate_metadata(meta):
        req_keys = ['description', 'data_dependencies', 'creator', 'format', 'name', 'type', 'ws_name', 'kbase']
        for key in req_keys:
            if key not in meta:
                raise NarrativeKeyError(key, 'Narrative Metadata')
        if not isinstance(meta['kbase'], dict):
            raise ValueError('metadata.kbase must be a dict')
        for key in ['job_ids', 'name', 'creator', 'ws_name']:
            if key not in meta['kbase']:
                raise NarrativeKeyError(key, 'narrative["metadata"]["kbase"]')


    def validate_cell(cell):
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
        pass

    def test_update_narrative_good():
        pass

    def test_update_narrative_bad():
        pass

    def test_update_cell_good():
        pass

    def test_update_cell_bad():
        pass

    def test_update_method_cell
