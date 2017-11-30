from __future__ import print_function
import unittest
from biokbase.narrative.widgetmanager import WidgetManager
import IPython
import mock
import os
from util import TestConfig
from narrative_mock.mockclients import get_mock_client

"""
Tests for the WidgetManager class
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'


class WidgetManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        config = TestConfig()
        os.environ['KB_WORKSPACE_ID'] = '12345'  # That's the same workspace as my luggage!
        app_specs_list = config.load_json_file(config.get('specs', 'app_specs_file'))
        app_specs_dict = dict()
        for s in app_specs_list:
            app_specs_dict[s['info']['id']] = s
        self.wm = WidgetManager()
        self.good_widget = "kbaseTabTable"
        self.bad_widget = "notAWidget"
        self.good_tag = "release"
        self.bad_tag = "notATag"

    def test_widgetmanager_reload(self):
        self.wm.load_widget_info(verbose=True)

    def test_widgetmanager_instantiated(self):
        self.assertIsInstance(self.wm, WidgetManager)

    def test_widget_inputs(self):
        self.wm.print_widget_inputs(self.good_widget)

    def test_widget_inputs_bad(self):
        with self.assertRaises(ValueError):
            self.wm.print_widget_inputs(self.bad_widget)

    def test_widget_constants(self):
        constants = self.wm.get_widget_constants(self.good_widget)
        self.assertTrue('ws' in constants)

    def test_widget_constants_bad(self):
        with self.assertRaises(ValueError):
            self.wm.get_widget_constants(self.bad_widget)

    def test_show_output_widget(self):
        self.assertIsInstance(
            self.wm.show_output_widget(
                self.good_widget,
                '1/2/3',
                {'obj': 'TestObject'}
            ),
            IPython.core.display.Javascript
        )

    def test_show_output_widget_bad(self):
        with self.assertRaises(ValueError):
            self.wm.show_output_widget(self.bad_widget, '1/2/3', {'bad': 'inputs'}, check_widget=True)

    def test_show_external_widget(self):
        widget = self.wm.show_external_widget(
            'contigSet', 'My ContigSet View', {'objectRef': '6402/3/8'}, {}
        )
        self.assertIsInstance(widget, IPython.core.display.Javascript)

    def test_show_external_widget_list(self):
        widget = self.wm.show_external_widget(['widgets', '0.1.0', 'genomeComparison'],
                                              'Genome Comparison Demo',
                                              {'objectRef': '6402/5/2'},
                                              {},
                                              auth_required=True)
        self.assertIsInstance(widget, IPython.core.display.Javascript)

    @mock.patch('biokbase.narrative.widgetmanager.clients.get', get_mock_client)
    def test_show_data_cell(self):
        """
        Tests - should do the following:
            def show_data_widget(self, upa, title=None, cell_id=None, tag="release"):
        fail message with no upa
        fail message with malformed upa
        shouldn't care what title or cell_id are, but should test to make sure they wind up in
            output code properly
        fail if type spec'd app isn't present for some tag
        otherwise, succeed and produce JS code.

        test mocks.
        """
        js_obj = self.wm.show_data_widget("18836/5/1", "some title", "no_id")
        print(js_obj.data)
        self.assertIsValidCellCode(js_obj, {}, "viewer", "kbaseGenomeView", "no_id", "some title")

    def assertIsValidCellCode(self, js_obj, data, type, widget, cellId, title):
        code_lines = js_obj.data.strip().split('\n')
        self.assertTrue(code_lines[0].strip().startswith('element.html("<div id=\'kb-vis'))
        self.assertEquals(code_lines[1].strip(), "require(['kbaseNarrativeOutputCell'], function(KBaseNarrativeOutputCell) {")
        self.assertTrue(code_lines[2].strip().startswith(r"var w = new KBaseNarrativeOutputCell($('#kb-vis"))



if __name__ == '__main__':
    unittest.main()
