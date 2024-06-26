import os
import unittest
from unittest import mock

import IPython
import pytest
from biokbase.narrative.tests.narrative_mock.mockclients import get_mock_client
from biokbase.narrative.tests.util import ConfigTests
from biokbase.narrative.widgetmanager import WidgetManager

"""
Tests for the WidgetManager class
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"


def assert_is_valid_cell_code(js_obj):
    code_lines = js_obj.data.strip().split("\n")
    assert code_lines[0].strip().startswith("element.html(\"<div id='kb-vis")
    assert (
        code_lines[1].strip()
        == "require(['kbaseNarrativeOutputCell'], function(KBaseNarrativeOutputCell) {"
    )
    assert code_lines[2].strip().startswith("var w = new KBaseNarrativeOutputCell($('#kb-vis")


class WidgetManagerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config = ConfigTests()
        os.environ["KB_WORKSPACE_ID"] = "12345"  # That's the same workspace as my luggage!
        app_specs_list = config.load_json_file(config.get("specs", "app_specs_file"))
        app_specs_dict = {}
        for s in app_specs_list:
            app_specs_dict[s["info"]["id"]] = s
        cls.wm = WidgetManager()
        cls.good_widget = "kbaseTabTable"
        cls.bad_widget = "notAWidget"
        cls.good_tag = "release"
        cls.bad_tag = "notATag"
        cls.widget_with_consts = "kbaseContigSetView"

    def test_widgetmanager_reload(self):
        self.wm.load_widget_info(verbose=True)

    def test_widgetmanager_instantiated(self):
        assert isinstance(self.wm, WidgetManager)

    def test_widget_inputs(self):
        self.wm.print_widget_inputs(self.good_widget)

    def test_widget_inputs_bad(self):
        with pytest.raises(ValueError):
            self.wm.print_widget_inputs(self.bad_widget)

    def test_widget_constants(self):
        constants = self.wm.get_widget_constants(self.widget_with_consts)
        assert "ws" in constants

    def test_widget_constants_bad(self):
        with pytest.raises(ValueError):
            self.wm.get_widget_constants(self.bad_widget)

    def test_show_output_widget(self):
        assert isinstance(
            self.wm.show_output_widget(
                self.good_widget,
                {"obj": "TestObject"},
                upas={"obj": "1/2/3"},
                check_widget=True,
            ),
            IPython.core.display.Javascript,
        )

    def test_show_output_widget_bad(self):
        with pytest.raises(ValueError):
            self.wm.show_output_widget(
                self.bad_widget,
                {"bad": "inputs"},
                upas={"bad": "1/2/3"},
                check_widget=True,
            )

    # N.b. the following test contacts the workspace
    # src/config/config.json must be set to use the CI configuration
    def test_show_advanced_viewer_widget(self):
        title = "Widget Viewer"
        cell_id = "abcde"
        widget_name = "CustomOutputDemo"
        widget_js = self.wm.show_advanced_viewer_widget(
            widget_name,
            {"param1": "value1", "param2": "value2"},
            {"param1": "value1", "param2": "value2"},
            title=title,
            cell_id=cell_id,
            tag="dev",
            check_widget=True,
        )
        assert isinstance(widget_js, IPython.core.display.Javascript)
        widget_code = widget_js.data
        assert f"widget: '{widget_name}'" in widget_code
        assert f'cellId: "{cell_id}"' in widget_code
        assert f"title: '{title}'" in widget_code

    def test_show_advanced_viewer_widget_bad(self):
        with pytest.raises(ValueError):
            self.wm.show_advanced_viewer_widget(
                self.bad_widget, {"bad": "inputs"}, {"bad": "state"}, check_widget=True
            )

    def test_show_external_widget(self):
        widget = self.wm.show_external_widget(
            "contigSet", "My ContigSet View", {"objectRef": "6402/3/8"}, {}
        )
        assert isinstance(widget, IPython.core.display.Javascript)

    def test_show_external_widget_list(self):
        widget = self.wm.show_external_widget(
            ["widgets", "0.1.0", "genomeComparison"],
            "Genome Comparison Demo",
            {"objectRef": "6402/5/2"},
            {},
            auth_required=True,
        )
        assert isinstance(widget, IPython.core.display.Javascript)

    @mock.patch("biokbase.narrative.widgetmanager.clients.get", get_mock_client)
    def test_show_data_cell(self):
        """Tests - should do the following:
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
        assert_is_valid_cell_code(js_obj)

    @mock.patch("biokbase.narrative.widgetmanager.clients.get", get_mock_client)
    def test_infer_upas(self):
        test_result_upa = "18836/5/1"
        upas = self.wm.infer_upas(
            "testCrazyExample",
            {
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
                "other_extra_param": 0,
            },
        )
        assert upas["obj_id1"] == test_result_upa
        assert upas["obj_id2"] == test_result_upa
        assert upas["obj_name1"] == test_result_upa
        assert upas["obj_name2"] == test_result_upa
        assert upas["obj_names"] == [test_result_upa] * 3
        assert upas["obj_ref1"] == "1/2/3"
        assert upas["obj_ref2"] == test_result_upa
        assert upas["obj_refs"] == [test_result_upa] * 2
        assert len(upas.keys()) == 8

    @mock.patch("biokbase.narrative.widgetmanager.clients.get", get_mock_client)
    def test_infer_upas_none(self):
        """Test infer_upas when no upas are given. Should return an empty dict."""
        upas = self.wm.infer_upas(
            "testCrazyExample",
            {"some_param": "some_value", "another_param": "another_value"},
        )
        assert isinstance(upas, dict)
        assert not upas

    @mock.patch("biokbase.narrative.widgetmanager.clients.get", get_mock_client)
    def test_infer_upas_simple_widget(self):
        """Test infer_upas against the "default" widget - i.e. params don't matter and UPAs don't matter."""
        upas = self.wm.infer_upas(
            "kbaseDefaultNarrativeOutput",
            {
                "some_param": "some_value",
                "another_param": "another_value",
                "obj_ref": "1/2/3",
                "ws_name": "some_workspace",
            },
        )
        assert isinstance(upas, dict)
        assert not upas

    @mock.patch("biokbase.narrative.widgetmanager.clients.get", get_mock_client)
    def test_infer_upas_nulls(self):
        """Test infer_upas when None is passed to it as an object name. Fields with None
        as input should not map to an UPA.
        """
        test_result_upa = "18836/5/1"
        upas = self.wm.infer_upas(
            "testCrazyExample",
            {
                "obj_id1": None,
                "obj_id2": None,
                "obj_name1": "foo",
                "obj_name2": "bar/baz",
                "obj_names": ["a", "b", "c"],
                "obj_ref1": "1/2/3",
                "obj_ref2": "foo/bar",
                "obj_refs": ["7/8/9", "0/1/2"],
                "ws_name": "some_ws",
                "extra_param": "extra_value",
                "other_extra_param": 0,
            },
        )
        assert isinstance(upas, dict)
        assert "obj_id1" not in upas
        assert "obj_id2" not in upas
        assert upas["obj_name1"] == test_result_upa
        assert upas["obj_name2"] == test_result_upa
        assert upas["obj_names"] == [test_result_upa] * 3
        assert upas["obj_ref1"] == "1/2/3"
        assert upas["obj_ref2"] == test_result_upa
        assert upas["obj_refs"] == [test_result_upa] * 2

    @mock.patch("biokbase.narrative.widgetmanager.clients.get", get_mock_client)
    def test_missing_env_path(self):
        backup_dir = os.environ["NARRATIVE_DIR"]
        del os.environ["NARRATIVE_DIR"]
        test_wm = WidgetManager()
        assert isinstance(test_wm.widget_param_map, dict)
        assert not test_wm.widget_param_map
        os.environ["NARRATIVE_DIR"] = backup_dir


if __name__ == "__main__":
    unittest.main()
