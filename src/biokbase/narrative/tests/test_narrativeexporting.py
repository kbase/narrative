from biokbase.narrative.common.exceptions import WorkspaceError
from biokbase.workspace.baseclient import ServerError
from biokbase.narrative.exporter.exporter import NarrativeExporter
from biokbase.narrative.common.narrative_ref import NarrativeRef
import biokbase.auth
import unittest
import os
import mock
from . import util
import requests_mock
from biokbase.narrative.common.url_config import URLS
import biokbase.auth as auth

"""
Some tests for narrative exporting.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

output_file = "test.html"
config = util.TestConfig()


def mock_read_narrative(style):
    """
    Mocks the NarrativeIO.read_narrative() function.
    Style should be one of "good", "bad", or "private".

    A "good" narrative will just return the valid read_narrative()
    results by loading and returning the given file. (will raise a
    ValueError if file is None).

    A "bad" narrative will raise a ValueError, and a "private"
    style will raise a NarrativeIO.PermissionsError.
    """
    if style == test_narrative_ref:
        return config.load_json_file(config.get('narrative_refs', 'narr_file_for_export'))
    elif style == bad_narrative_ref:
        raise ValueError('Bad Narrative!')
    elif style == private_narrative_ref:
        raise WorkspaceError(ServerError("Error", -32500, "Private workspace!"), private_narrative_ref)

def refstring_to_ref(refstr: str) -> NarrativeRef:
    # just a one-off to fix the imported refs from the test config.
    ref_split = refstr.split('/')
    if len(ref_split) <= 1 or len(ref_split) > 3:
        return None
    elif len(ref_split) == 2:
        return NarrativeRef(dict(zip(['wsid', 'objid'], ref_split)))
    else:
        return NarrativeRef(dict(zip(['wsid', 'objid', 'ver'], ref_split)))

test_narrative_ref = refstring_to_ref(config.get('narrative_refs', 'public'))
private_narrative_ref = refstring_to_ref(config.get('narrative_refs', 'private'))
bad_narrative_ref = NarrativeRef({'wsid': 0, 'objid': 0, 'ver': 0})


class NarrativeExportTesting(unittest.TestCase):
    @classmethod
    @mock.patch('biokbase.narrative.exporter.exporter.NarrativeIO')
    def setUpClass(self, mock_io):
        mock_io.return_value.test_connection.return_value = ""
        mock_io.return_value.read_narrative = mock_read_narrative
        self.exporter = NarrativeExporter()

    @classmethod
    def tearDownClass(self):
        # delete generated file
        if os.path.isfile(output_file):
            os.remove(output_file)

    @unittest.skip("Skipping in Travis")
    @requests_mock.mock()
    def test_export_good(self, rq_mock):
        rq_mock.get(auth.token_api_url + auth.endpt_user_display, json={"foo": "Bar"})
        biokbase.auth.set_environ_token(util.read_token_file(config.get_path('token_files', 'test_user', from_root=True)))
        self.exporter.export_narrative(test_narrative_ref, output_file)
        self.assertTrue(os.path.isfile(output_file))
        biokbase.auth.set_environ_token(None)

    def test_export_bad(self):
        with self.assertRaises(ValueError):
            self.exporter.export_narrative(bad_narrative_ref, output_file)

    def test_export_private(self):
        with self.assertRaises(WorkspaceError):
            self.exporter.export_narrative(private_narrative_ref, output_file)


if __name__ == "__main__":
    unittest.main()
