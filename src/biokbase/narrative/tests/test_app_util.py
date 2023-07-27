"""
Tests for the app_util module
"""
import unittest
from biokbase.narrative.app_util import (
    check_tag,
    get_result_sub_path,
    map_inputs_from_job,
    map_outputs_from_state,
)
import os
from . import util

__author__ = "Bill Riehl <wjriehl@lbl.gov>"


class DummyWorkspace:
    def get_workspace_info(*args, **kwargs):
        return [12345]


class AppUtilTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config = util.ConfigTests()
        cls.user_id = config.get("users", "test_user")
        cls.user_token = util.read_token_file(
            config.get_path("token_files", "test_user", from_root=True)
        )

        cls.good_tag = "release"
        cls.bad_tag = "notATag"
        # inject phony variables into the environment
        cls.bad_fake_token = "NotAGoodTokenLOL"
        cls.workspace = "valid_workspace"

    def test_check_tag_good(self):
        self.assertTrue(check_tag(self.good_tag))

    def test_check_tag_bad(self):
        self.assertFalse(check_tag(self.bad_tag))

    def test_check_tag_bad_except(self):
        with self.assertRaises(ValueError):
            check_tag(self.bad_tag, raise_exception=True)

    def test_get_result_sub_path(self):
        result = [{"report": "this_is_a_report", "report_ref": "123/456/7"}]
        path = [0, "report_ref"]
        self.assertEqual(get_result_sub_path(result, path), "123/456/7")

    def test_get_result_sub_path_deep_list(self):
        result = ["foo", "bar", "baz"]
        path = [2]
        self.assertEqual(get_result_sub_path(result, path), "baz")

    def test_get_result_sub_path_deep_obj(self):
        result = ["foo", {"bar": "baz"}, "foobar"]
        path = [1, "bar"]
        self.assertEqual(get_result_sub_path(result, path), "baz")

    def test_get_result_obj_path(self):
        result = ["foo", 0, {"bar": {"baz": [10, 11, 12, 13]}}]
        path = [2, "bar", "baz", 3]
        self.assertEqual(get_result_sub_path(result, path), 13)

    def test_get_result_sub_path_list_fail(self):
        result = ["foo"]
        path = [2]
        self.assertIsNone(get_result_sub_path(result, path))

    def test_get_result_sub_path_key_fail(self):
        result = {"foo": "bar"}
        path = ["baz"]
        self.assertIsNone(get_result_sub_path(result, path))

    def test_map_inputs_from_job(self):
        inputs = [
            "input1",
            {"ws": "my_workspace", "foo": "bar"},
            "some_ref/obj_id",
            ["ref/num_1", "ref/num_2", "num_3"],
            123,
        ]
        app_spec = {
            "behavior": {
                "kb_service_input_mapping": [
                    {"target_position": 0, "input_parameter": "an_input"},
                    {
                        "target_position": 1,
                        "target_property": "ws",
                        "input_parameter": "workspace",
                    },
                    {
                        "target_position": 1,
                        "target_property": "foo",
                        "input_parameter": "baz",
                    },
                    {
                        "target_position": 2,
                        "input_parameter": "ref_input",
                        "target_type_transform": "ref",
                    },
                    {
                        "target_position": 3,
                        "input_parameter": "a_list",
                        "target_type_transform": "list<ref>",
                    },
                    {
                        "target_position": 4,
                        "input_parameter": "a_num",
                        "target_type_transform": "int",
                    },
                ],
            }
        }
        expected = {
            "an_input": "input1",
            "workspace": "my_workspace",
            "baz": "bar",
            "ref_input": "obj_id",
            "a_list": ["num_1", "num_2", "num_3"],
            "a_num": 123,
        }
        self.assertDictEqual(map_inputs_from_job(inputs, app_spec), expected)

    def test_map_outputs_from_state_simple(self):
        os.environ["KB_WORKSPACE_ID"] = self.workspace
        app_spec = {
            "parameters": [],
            "behavior": {
                "output_mapping": [{"narrative_system_variable": "workspace"}]
            },
        }
        self.assertTupleEqual(
            map_outputs_from_state(None, None, app_spec),
            ("kbaseDefaultNarrativeOutput", self.workspace),
        )

    def test_map_outputs_from_state(self):
        os.environ["KB_WORKSPACE_ID"] = self.workspace
        app_spec = {
            "widgets": {"input": None, "output": "testOutputWidget"},
            "parameters": [],
            "behavior": {
                "kb_service_output_mapping": [
                    {"narrative_system_variable": "workspace", "target_property": "ws"},
                    {"constant_value": 5, "target_property": "a_constant"},
                    {
                        "service_method_output_path": [1],
                        "target_property": "a_path_ref",
                    },
                    {"input_parameter": "an_input", "target_property": "an_input"},
                ]
            },
        }
        params = {"an_input": "input_val"}
        state = {"job_output": {"result": ["foo", "bar"]}}
        expected = (
            "testOutputWidget",
            {
                "ws": self.workspace,
                "a_constant": 5,
                "a_path_ref": "bar",
                "an_input": "input_val",
            },
        )
        self.assertTupleEqual(map_outputs_from_state(state, params, app_spec), expected)

    def test_map_outputs_from_state_bad_spec(self):
        os.environ["KB_WORKSPACE_ID"] = self.workspace
        app_spec = {"not": "really"}
        params = {"an_input": "input_val"}
        state = {}
        with self.assertRaises(ValueError):
            map_outputs_from_state(state, params, app_spec)


if __name__ == "__main__":
    unittest.main()
