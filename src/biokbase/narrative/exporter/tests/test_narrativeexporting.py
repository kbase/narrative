"""
Some tests for narrative exporting.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

from biokbase.narrative.narrativeio import PermissionsError
from biokbase.narrative.exporter.exporter import NarrativeExporter
import unittest
import os

test_narrative_ref = "6312/1"
private_narrative_ref = "6305/1"
bad_narrative_ref = "abc"
output_file = "test.html"

class NarrativeExportTesting(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.exporter = NarrativeExporter()

    @classmethod
    def tearDownClass(self):
        # delete generated file
        if os.path.isfile(output_file):
            os.remove(output_file)

    def test_export(self):
        self.exporter.export_narrative(test_narrative_ref, output_file)
        self.assertTrue(os.path.isfile(output_file))

    def test_export_bad_ref(self):
        with self.assertRaises(ValueError) as err:
            self.exporter.export_narrative(bad_narrative_ref, output_file)

    def test_export_private_ref(self):
        with self.assertRaises(PermissionsError) as err:
            self.exporter.export_narrative(private_narrative_ref, output_file)

if __name__ == "__main__":
    unittest.main()