"""
Tests for the app_util module
"""
import os
import pytest
from unittest import mock

from biokbase.narrative.app_util import (
    check_tag,
    get_result_sub_path,
    map_inputs_from_job,
    map_outputs_from_state,
    transform_param_value
)

from . import util
from .narrative_mock.mockclients import get_mock_client

user_token = "SOME_TOKEN"
config = util.ConfigTests()
user_id = config.get("users", "test_user")
user_token = util.read_token_file(config.get_path("token_files", "test_user", from_root=True))

good_tag = "release"
bad_tag = "not_a_tag"
# inject phony variables into the environment
bad_fake_token = "NotAGoodTokenLOL"
workspace = "valid_workspace"
bad_variable = "not a variable"

def test_check_tag_good():
    assert check_tag(good_tag) is True

def test_check_tag_bad():
    assert check_tag(bad_tag) is False

def test_check_tag_bad_except():
    with pytest.raises(ValueError):
        check_tag(bad_tag, raise_exception=True)

@pytest.fixture(scope="module")
def workspace_name():
    os.environ["KB_WORKSPACE_ID"] = workspace
    yield
    del os.environ["KB_WORKSPACE_ID"]

get_result_sub_path_cases = [
    (
        [{"report": "this_is_a_report", "report_ref": "123/456/7"}],
        [0, "report_ref"],
        "123/456/7"
    ),
    (
        ["foo", "bar", "baz"],
        [2],
        "baz"
    ),
    (
        ["foo", {"bar": "baz"}, "foobar"],
        [1, "bar"],
        "baz"
    ),
    (
        ["foo", 0, {"bar": {"baz": [10, 11, 12, 13]}}],
        [2, "bar", "baz", 3],
        13
    ),
    (
        ["foo"],
        [2],
        None
    ),
    (
        {"foo": "bar"},
        ["baz"],
        None
    )
]
@pytest.mark.parametrize("result,path,expected", get_result_sub_path_cases)
def test_get_result_sub_path(result, path, expected):
    assert get_result_sub_path(result, path) == expected

def test_map_inputs_from_job():
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
    assert map_inputs_from_job(inputs, app_spec) == expected


def test_map_outputs_from_state_simple(workspace_name):
    app_spec = {
        "parameters": [],
        "behavior": {
            "output_mapping": [{"narrative_system_variable": "workspace"}]
        },
    }
    expected = ("kbaseDefaultNarrativeOutput", workspace)
    assert map_outputs_from_state(None, None, app_spec) == expected

def test_map_outputs_from_state(workspace_name):
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
            "ws": workspace,
            "a_constant": 5,
            "a_path_ref": "bar",
            "an_input": "input_val",
        },
    )
    assert map_outputs_from_state(state, params, app_spec) == expected

def test_map_outputs_from_state_bad_spec(workspace_name):
    app_spec = {"not": "really"}
    params = {"an_input": "input_val"}
    state = {}
    with pytest.raises(ValueError):
        map_outputs_from_state(state, params, app_spec)


transform_param_value_simple_cases = [
    ( "string", None, None, None ),
    ( "string", "foo", None, "foo" ),
    ( "string", 123, None, "123" ),
    ( "string", ["a", "b", "c"], None, "a,b,c"),
    ( "string", {"a": "b", "c": "d"}, None, "a=b,c=d"),
    ( "string", [], None, "" ),
    ( "string", {}, None, "" ),
    ( "int", "1", None, 1 ),
    ( "int", None, None, None ),
    ( "int", "", None, None ),
    ( "list<string>", [1, 2, 3], None, ["1", "2", "3"] ),
    ( "list<int>", ["1", "2", "3"], None, [1, 2, 3] ),
    ( "list<string>", "asdf", None, ["asdf"] ),
    ( "list<int>", "1", None, [1] )
]
@pytest.mark.parametrize("transform_type,value,spec_param,expected", transform_param_value_simple_cases)
def test_transform_param_value_simple(transform_type, value, spec_param, expected):
    assert transform_param_value(transform_type, value, spec_param) == expected

def test_transform_param_value_fail():
    ttype = "foobar"
    with pytest.raises(ValueError, match=f"Unsupported Transformation type: {ttype}"):
        transform_param_value(ttype, "foo", None)

textsubdata_cases = [
    (None, None),
    ("asdf", "asdf"),
    (123, "123"),
    (["1", "2", "3"], "1,2,3"),
    ({"a":"b", "c": "d"}, "a=b,c=d")
]
@pytest.mark.parametrize("value,expected", textsubdata_cases)
def test_transform_param_value_textsubdata(value, expected):
    spec = {
        "type": "textsubdata"
    }
    assert transform_param_value(None, value, spec) == expected

ref_cases = [
    (None, None),
    ("foo/bar", "foo/bar"),
    ("1/2/3", "1/2/3"),
    ("name", workspace + "/name")
]
@pytest.mark.parametrize("value,expected", ref_cases)
def test_transform_param_value_simple_ref(value, expected, workspace_name):
    for tf_type in ["ref", "unresolved-ref"]:
        assert transform_param_value(tf_type, value, None) == expected

mock_upa = "18836/5/1"
upa_cases = [
    ("some_name", mock_upa),
    (["multiple", "names"], [mock_upa, mock_upa]),
    ("already/ref", mock_upa)
]
@mock.patch("biokbase.narrative.app_util.clients.get", get_mock_client)
@pytest.mark.parametrize("value,expected", upa_cases)
def test_transform_param_value_resolved_ref(value, expected, workspace_name):
    assert transform_param_value("resolved-ref", value, None) == expected
