from __future__ import print_function

"""
Some tests for narrative exporting.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

from biokbase.narrative.contents.narrativeio import PermissionsError
from biokbase.narrative.exporter.exporter import NarrativeExporter
import unittest
import os
import ConfigParser
import mock
import sys
import json

def read_narrative_file(path):
    try:
        with open(path, 'r') as f:
            narr = json.loads(f.read())
            f.close()
            return narr
    except Exception, e:
        print("Unable to open file {}: {}".format(path, e))
        sys.exit(1)

def mock_read_narrative(bar):
    if bar == test_narrative_ref:
        return narr_file
    elif bar == bad_narrative_ref:
        raise ValueError('bad!')
    elif bar == private_narrative_ref:
        raise PermissionsError('private!')

output_file = "test.html"
config = ConfigParser.ConfigParser()
config.read('test.cfg')

test_narrative_ref = config.get('narrative_refs', 'public')
private_narrative_ref = config.get('narrative_refs', 'private')
bad_narrative_ref = config.get('narrative_refs', 'bad')
narr_file = read_narrative_file(config.get('narrative_refs', 'narr_file'))

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
        with self.assertRaises(ValueError) as err:
            self.exporter.export_narrative(bad_narrative_ref, output_file)

    def test_export_private(self):
        with self.assertRaises(PermissionsError) as err:
            self.exporter.export_narrative(private_narrative_ref, output_file)


if __name__ == "__main__":
    unittest.main()