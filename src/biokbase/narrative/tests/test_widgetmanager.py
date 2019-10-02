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
        self.widget_with_consts = "kbaseContigSetView"

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
        constants = self.wm.get_widget_constants(self.widget_with_consts)
        self.assertTrue('ws' in constants)

    def test_widget_constants_bad(self):
        with self.assertRaises(ValueError):
            self.wm.get_widget_constants(self.bad_widget)

    def test_show_output_widget(self):
        self.assertIsInstance(
            self.wm.show_output_widget(
                self.good_widget,
                {'obj': 'TestObject'},
                upas={'obj': '1/2/3'},
                check_widget=True
            ),
            IPython.core.display.Javascript
        )

    def test_show_output_widget_bad(self):
        with self.assertRaises(ValueError):
            self.wm.show_output_widget(
                self.bad_widget,
                {'bad': 'inputs'},
                upas={'bad': '1/2/3'},
                check_widget=True
            )

    def test_show_advanced_viewer_widget(self):
        title = "Widget Viewer"
        cell_id = "abcde"
        widget_name = "CustomOutputDemo"
        widget_js = self.wm.show_advanced_viewer_widget(
            widget_name,
            {
                "param1": "value1",
                "param2": "value2"
            },
            {
                "param1": "value1",
                "param2": "value2"
            },
            title=title,
            cell_id=cell_id,
            tag="dev",
            check_widget=True
        )
        self.assertIsInstance(
            widget_js,
            IPython.core.display.Javascript
        )
        widget_code = widget_js.data
        self.assertIn("widget: '{}'".format(widget_name), widget_code)
        self.assertIn("cellId: \"{}\"".format(cell_id), widget_code)
        self.assertIn("title: '{}'".format(title), widget_code)

    def test_show_advanced_viewer_widget_bad(self):
        with self.assertRaises(ValueError):
            self.wm.show_advanced_viewer_widget(
                self.bad_widget,
                {'bad': 'inputs'},
                {'bad': 'state'},
                check_widget=True
            )

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

    @mock.patch('biokbase.narrative.widgetmanager.clients.get', get_mock_client)
    def test_infer_upas(self):
        test_result_upa = "18836/5/1"
        upas = self.wm.infer_upas("testCrazyExample", {
            "obj_id1": 1,
            "obj_id2": 2,
            "obj_name1": "foo",
            "obj_name2": "bar/baz",
            "obj_names": ["a", "b", "c"],
            "obj_ref1": "1/2/3",
            "obj_ref2": "foo/bar",
            "obj_refs": ["7/8/9", "0/1/2"],
            "ws_name": "some_ws",
            "extra_param": "extra_value",
            "other_extra_param": 0
        })
        self.assertEquals(upas['obj_id1'], test_result_upa)
        self.assertEquals(upas['obj_id2'], test_result_upa)
        self.assertEquals(upas['obj_name1'], test_result_upa)
        self.assertEquals(upas['obj_name2'], test_result_upa)
        self.assertEquals(upas['obj_names'], [test_result_upa]*3)
        self.assertEquals(upas['obj_ref1'], "1/2/3")
        self.assertEquals(upas['obj_ref2'], test_result_upa)
        self.assertEquals(upas['obj_refs'], [test_result_upa]*2)
        self.assertEquals(len(upas.keys()), 8)

    @mock.patch('biokbase.narrative.widgetmanager.clients.get', get_mock_client)
    def test_infer_upas_none(self):
        """
        Test infer_upas when no upas are given. Should return an empty dict.
        """
        upas = self.wm.infer_upas("testCrazyExample", {
            "some_param": "some_value",
            "another_param": "another_value"
        })
        self.assertIsInstance(upas, dict)
        self.assertFalse(upas)

    @mock.patch('biokbase.narrative.widgetmanager.clients.get', get_mock_client)
    def test_infer_upas_simple_widget(self):
        """
        Test infer_upas against the "default" widget - i.e. params don't matter and UPAs don't matter.
        """
        upas = self.wm.infer_upas("kbaseDefaultNarrativeOutput", {
            "some_param": "some_value",
            "another_param": "another_value",
            "obj_ref": "1/2/3",
            "ws_name": "some_workspace"
        })
        self.assertIsInstance(upas, dict)
        self.assertFalse(upas)

    @mock.patch('biokbase.narrative.widgetmanager.clients.get', get_mock_client)
    def test_missing_env_path(self):
        backup_dir = os.environ["NARRATIVE_DIR"]
        del os.environ["NARRATIVE_DIR"]
        test_wm = WidgetManager()
        self.assertIsInstance(test_wm.widget_param_map, dict)
        self.assertFalse(test_wm.widget_param_map)
        os.environ["NARRATIVE_DIR"] = backup_dir

    def assertIsValidCellCode(self, js_obj, data, type, widget, cellId, title):
        code_lines = js_obj.data.strip().split('\n')
        self.assertTrue(code_lines[0].strip().startswith('element.html("<div id=\'kb-vis'))
        self.assertEquals(code_lines[1].strip(), "require(['kbaseNarrativeOutputCell'], function(KBaseNarrativeOutputCell) {")
        self.assertTrue(code_lines[2].strip().startswith(r"var w = new KBaseNarrativeOutputCell($('#kb-vis"))

if __name__ == '__main__':
    unittest.main()
