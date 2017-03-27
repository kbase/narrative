from __future__ import print_function
from biokbase.narrative.contents.narrativeio import PermissionsError
from biokbase.narrative.exporter.exporter import NarrativeExporter
from biokbase.narrative.tests.narrative_test_helper import read_json_file
import unittest
import os
import mock
import sys
import json
from narrative_test_helper import TestConfig

"""
Some tests for narrative exporting.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

output_file = "test.html"
config = TestConfig()


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
        return config.get_json_file(config.get('narrative_refs', 'narr_file'))
    elif style == bad_narrative_ref:
        raise ValueError('Bad Narrative!')
    elif style == private_narrative_ref:
        raise PermissionsError('Private Narrative!')

test_narrative_ref = config.get('narrative_refs', 'public')
private_narrative_ref = config.get('narrative_refs', 'private')
bad_narrative_ref = config.get('narrative_refs', 'bad')


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

    def test_export_good(self):
        self.exporter.export_narrative(test_narrative_ref, output_file)
        self.assertTrue(os.path.isfile(output_file))

    def test_export_bad(self):
        with self.assertRaises(ValueError):
            self.exporter.export_narrative(bad_narrative_ref, output_file)

    def test_export_private(self):
        with self.assertRaises(PermissionsError):
            self.exporter.export_narrative(private_narrative_ref, output_file)


if __name__ == "__main__":
    unittest.main()
