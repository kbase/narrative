"""
Tests for the app_util module
"""
import copy
import os
import pytest
from unittest import mock

from biokbase.narrative.app_util import (
    app_param,
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

@pytest.fixture()
def workspace_name():
    def set_ws_name(ws_name):
        os.environ["KB_WORKSPACE_ID"] = ws_name
    yield set_ws_name
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
    workspace_name(workspace)
    app_spec = {
        "parameters": [],
        "behavior": {
            "output_mapping": [{"narrative_system_variable": "workspace"}]
        },
    }
    expected = ("kbaseDefaultNarrativeOutput", workspace)
    assert map_outputs_from_state(None, None, app_spec) == expected

def test_map_outputs_from_state(workspace_name):
    workspace_name(workspace)
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
    workspace_name(workspace)
    app_spec = {"not": "really"}
    params = {"an_input": "input_val"}
    state = {}
    with pytest.raises(ValueError):
        map_outputs_from_state(state, params, app_spec)



# app_param tests
base_app_param = {
    'id': 'my_param',
    'ui_name': 'My Param',
    'short_hint': 'Short Info',
    'description': 'Longer description',
    'allow_multiple': 0,
    'optional': 0,
    'ui_class': 'input',
    'default_values': [''],
}
base_expect = {
    "id": base_app_param["id"],
    "optional": False,
    "short_hint": base_app_param["short_hint"],
    "description": base_app_param["description"],
    "is_group": False,
    "is_output": False,
    "allow_multiple": False,
    "default": None,
}
app_param_cases = [(
    "text", {}, {}
), (
    "text",
    {
        "text_options": {
            "is_output_name": 1
        }
    },
    {
        "is_output": True
    }
), (
    "text",
    {
        "optional": 1,
    },
    {
        "optional": True
    }
), (
    "text",
    {
        "allow_multiple": 1,
        "default_values": ["foo", "", "bar"]
    },
    {
        "allow_multiple": True,
        "default": ["foo", "bar"]
    }
), (
    "text",
    {
        "text_options": {
            "validate_as": "int",
            "min_int": -1,
            "max_int": 1000
        }
    },
    {
        "type": "int",
        "min_val": -1,
        "max_val": 1000
    }
), (
    "text",
    {
        "text_options": {
            "validate_as": "float",
            "min_float": -1.2,
            "max_float": 1000.4
        }
    },
    {
        "type": "float",
        "min_val": -1.2,
        "max_val": 1000.4
    }
), (
    "dropdown",
    {
        "dropdown_options": {
            "options": [
                {"display": "a", "value": "b"},
                {"display": "c", "value": "d"}
            ]
        }
    },
    {
        "allowed_values": ["b", "d"]
    }
), (
    "checkbox",
    {
        "checkbox_options": {
            "checked_value": 1,
            "unchecked_value": 0
        }
    },
    {
        "checkbox_map": [1, 0],
        "allowed_values": [True, False]
    }
), (
    "checkbox",
    {},
    {
        "allowed_values": [True, False]
    }
), (
    "checkbox",
    {
        "checkbox_options": {
            "checked_value": 2,
            "unchecked_value": 1,
            "kinda_checked_value": 0
        }
    },
    {
        "allowed_values": [True, False]
    }
), (
    "text",
    {
        "text_options": {
            "valid_ws_types": []
        }
    },
    {}
), (
    "text",
    {
        "text_options": {
            "valid_ws_types": ["KBaseGenomes.Genome", "FooBar.Baz"]
        }
    },
    {
        "allowed_types": ["KBaseGenomes.Genome", "FooBar.Baz"]
    }
), (
    "text",
    {
        "text_options": {
            "regex_constraint": "/\\d+/"
        }
    },
    {
        "regex_constraint": "/\\d+/"
    }
)]
@pytest.mark.parametrize("field_type,spec_add,expect_add", app_param_cases)
def test_app_param(field_type, spec_add, expect_add):
    spec_param = copy.deepcopy(base_app_param)
    expected = copy.deepcopy(base_expect)
    spec_param["field_type"] = field_type
    expected["type"] = field_type

    spec_param.update(spec_add)
    expected.update(expect_add)
    assert app_param(spec_param) == expected


# transform_param_value tests
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
    workspace_name(workspace)
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
    workspace_name(workspace)
    assert transform_param_value("resolved-ref", value, None) == expected
