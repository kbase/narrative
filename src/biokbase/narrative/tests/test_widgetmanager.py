from __future__ import print_function

"""
Tests for the WidgetManager class
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

import unittest
from biokbase.narrative.widgetmanager import WidgetManager
import IPython
import mock
from biokbase.narrative.tests.util import read_narrative_file

class WidgetManagerTestCase(unittest.TestCase):
    @classmethod
    @mock.patch('biokbase.narrative.widgetmanager.NarrativeMethodStore')
    def setUpClass(self, mock_njs):
        mock_njs.return_value.list_methods_spec.return_value = read_narrative_file('data/specs.json')
        self.wm = WidgetManager()
        self.good_widget = "kbaseTabTable"
        self.bad_widget = "notAWidget"
        self.good_tag = "release"
        self.bad_tag = "notATag"
        print(self.wm.widget_info)

    def test_widgetmanager_instantiated(self):
        self.assertIsInstance(self.wm, WidgetManager)

    def test_widget_inputs(self):
        self.wm.print_widget_inputs(self.good_widget)

    def test_widget_inputs_bad(self):
        with self.assertRaises(ValueError) as err:
            self.wm.print_widget_inputs(self.bad_widget)

    def test_widget_constants(self):
        constants = self.wm.get_widget_constants(self.good_widget)
        self.assertTrue('type' in constants)

    def test_widget_constants_bad(self):
        with self.assertRaises(ValueError) as err:
            self.wm.get_widget_constants(self.bad_widget)

    def test_show_output_widget(self):
        self.assertIsInstance(self.wm.show_output_widget(self.good_widget, obj='TestObject'), IPython.core.display.Javascript)

    def test_show_output_widget_bad(self):
        with self.assertRaises(ValueError) as err:
            self.wm.show_output_widget(self.bad_widget)

if __name__ == '__main__':
    unittest.main()