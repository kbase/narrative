"""
Tests for the app_util module
"""

import copy
import os
import re
from unittest import mock

import pytest

from biokbase.narrative.app_util import (
    app_param,
    check_tag,
    clients,
    get_result_sub_path,
    map_inputs_from_job,
    map_outputs_from_state,
    transform_param_value,
)
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.tests import util
from biokbase.narrative.tests.conftest import body_match_vcr as vcr
from biokbase.narrative.upa import is_upa
from biokbase.workspace.client import Workspace

config = util.ConfigTests()
user_name = config.get("users", "test_user")

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
        "123/456/7",
    ),
    (["foo", "bar", "baz"], [2], "baz"),
    (["foo", {"bar": "baz"}, "foobar"], [1, "bar"], "baz"),
    (["foo", 0, {"bar": {"baz": [10, 11, 12, 13]}}], [2, "bar", "baz", 3], 13),
    (["foo"], [2], None),
    ({"foo": "bar"}, ["baz"], None),
]


@pytest.mark.parametrize(("result", "path", "expected"), get_result_sub_path_cases)
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
        "behavior": {"output_mapping": [{"narrative_system_variable": "workspace"}]},
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
    "id": "my_param",
    "ui_name": "My Param",
    "short_hint": "Short Info",
    "description": "Longer description",
    "allow_multiple": 0,
    "optional": 0,
    "ui_class": "input",
    "default_values": [""],
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
app_param_cases = [
    ("text", {}, {}),
    ("text", {"text_options": {"is_output_name": 1}}, {"is_output": True}),
    (
        "text",
        {
            "optional": 1,
        },
        {"optional": True},
    ),
    (
        "text",
        {"allow_multiple": 1, "default_values": ["foo", "", "bar"]},
        {"allow_multiple": True, "default": ["foo", "bar"]},
    ),
    (
        "text",
        {"text_options": {"validate_as": "int", "min_int": -1, "max_int": 1000}},
        {"type": "int", "min_val": -1, "max_val": 1000},
    ),
    (
        "text",
        {
            "text_options": {
                "validate_as": "float",
                "min_float": -1.2,
                "max_float": 1000.4,
            }
        },
        {"type": "float", "min_val": -1.2, "max_val": 1000.4},
    ),
    (
        "dropdown",
        {
            "dropdown_options": {
                "options": [
                    {"display": "a", "value": "b"},
                    {"display": "c", "value": "d"},
                ]
            }
        },
        {"allowed_values": ["b", "d"]},
    ),
    (
        "checkbox",
        {"checkbox_options": {"checked_value": 1, "unchecked_value": 0}},
        {"checkbox_map": [1, 0], "allowed_values": [True, False]},
    ),
    ("checkbox", {}, {"allowed_values": [True, False]}),
    (
        "checkbox",
        {
            "checkbox_options": {
                "checked_value": 2,
                "unchecked_value": 1,
                "kinda_checked_value": 0,
            }
        },
        {"allowed_values": [True, False]},
    ),
    ("text", {"text_options": {"valid_ws_types": []}}, {}),
    (
        "text",
        {"text_options": {"valid_ws_types": ["KBaseGenomes.Genome", "FooBar.Baz"]}},
        {"allowed_types": ["KBaseGenomes.Genome", "FooBar.Baz"]},
    ),
    (
        "text",
        {"text_options": {"regex_constraint": "/\\d+/"}},
        {"regex_constraint": "/\\d+/"},
    ),
]


@pytest.mark.parametrize(("field_type", "spec_add", "expect_add"), app_param_cases)
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
    ("string", None, None, None),
    ("string", "foo", None, "foo"),
    ("string", 123, None, "123"),
    ("string", ["a", "b", "c"], None, "a,b,c"),
    ("string", {"a": "b", "c": "d"}, None, "a=b,c=d"),
    ("string", [], None, ""),
    ("string", {}, None, ""),
    ("int", "1", None, 1),
    ("int", None, None, None),
    ("int", "", None, None),
    ("list<string>", [1, 2, 3], None, ["1", "2", "3"]),
    ("list<int>", ["1", "2", "3"], None, [1, 2, 3]),
    ("list<string>", "asdf", None, ["asdf"]),
    ("list<int>", "1", None, [1]),
]


@pytest.mark.parametrize(
    ("transform_type", "value", "spec_param", "expected"),
    transform_param_value_simple_cases,
)
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
    ({"a": "b", "c": "d"}, "a=b,c=d"),
]


@pytest.mark.parametrize(("value", "expected"), textsubdata_cases)
def test_transform_param_value_textsubdata(value, expected):
    spec = {"type": "textsubdata"}
    assert transform_param_value(None, value, spec) == expected


tf_types = [None, "ref", "resolved-ref", "unresolved-ref", "putative-ref", "upa"]
all_types = []
for t in tf_types:
    all_types.append(t)
    if t is not None:
        all_types.append(f"list<{t}>")

ws_name = "narrative_1695311690413"

VALID_UPA_A = "69356/5/2"
VALID_UPA_B = "69356/4/1"
VALID_NAME_A = "Abiotrophia_defectiva_ATCC_49176"
VALID_NAME_B = "_Nostoc_azollae__0708"
VALID_REF_A = f"{user_name}:{ws_name}/Abiotrophia_defectiva_ATCC_49176"
VALID_REF_B = f"{user_name}:{ws_name}/_Nostoc_azollae__0708"

input_list = [
    pytest.param(None, id="none"),
    pytest.param(VALID_UPA_A, id="upa"),
    pytest.param(VALID_NAME_A, id="name"),
    pytest.param(VALID_REF_A, id="ws_name"),
    pytest.param([VALID_UPA_A, VALID_UPA_B], id="upa_arr"),
    pytest.param([VALID_NAME_A, VALID_NAME_B], id="name_arr"),
    pytest.param(
        [
            VALID_REF_A,
            VALID_REF_B,
        ],
        id="ws_name_arr",
    ),
]


@pytest.mark.parametrize("tf_type", all_types)
@pytest.mark.parametrize("inp", input_list)
def test_transform_param_value_all_types_with_all_inputs(
    inp, tf_type, workspace_name, monkeypatch, request, user_name, user_token
):
    workspace_name(f"{user_name}:{ws_name}")

    def get_workspace(_):
        # ensure that there's a token for the workspace client
        return Workspace(URLS.workspace, token=user_token)

    monkeypatch.setattr(clients, "get", get_workspace)

    with vcr.use_cassette(
        f"test_app_util/transform_param_value-{request.node.callspec.id}.yaml",
    ):
        output = transform_param_value(tf_type, inp, None)

        if inp is None:
            if tf_type and "list" in tf_type:
                assert output == [None]
            else:
                assert output is None
            return

        if tf_type is None:
            assert output == inp
            return

        # list input
        if isinstance(inp, list):
            if len(inp) > 1:
                if "upa" in tf_type or tf_type in [
                    "resolved-ref",
                    "list<resolved-ref>",
                ]:
                    assert output == [VALID_UPA_A, VALID_UPA_B]
                else:
                    assert output == [VALID_REF_A, VALID_REF_B]
                return
            if "upa" in tf_type or tf_type in [
                "resolved-ref",
                "list<resolved-ref>",
            ]:
                assert output == [VALID_UPA_A]
            else:
                assert output == [VALID_REF_A]
            return

        # input is a single entity
        if tf_type in ["list<resolved-ref>", "list<upa>"]:
            assert output == [VALID_UPA_A]
        elif tf_type in ["resolved-ref", "upa"]:
            assert output == VALID_UPA_A
        elif tf_type in ["ref", "unresolved-ref", "putative-ref"]:
            assert output == VALID_REF_A
        elif tf_type in ["list<ref>", "list<unresolved-ref>", "list<putative-ref>"]:
            assert output == [VALID_REF_A]


INVALID_UPA_A = "69356/666/666"  # object doesn't exist in this ws
INVALID_NAME_A = "some_defective_name"
INVALID_REF_A = f"{user_name}:{ws_name}/{INVALID_NAME_A}"

putative_refs = [
    pytest.param(
        {"in": INVALID_NAME_A, "tf": "putative-ref", "out": INVALID_REF_A},
        id="invalid-name_putative-ref",
    ),
    pytest.param(
        {"in": INVALID_UPA_A, "tf": "putative-ref", "out": INVALID_UPA_A},
        id="invalid-upa_putative-ref",
    ),
]


@pytest.mark.parametrize("params", putative_refs)
def test_transform_param_value_putative_refs(
    params, workspace_name, monkeypatch, request, user_name, user_token
):
    workspace_name(f"{user_name}:{ws_name}")

    def get_workspace(_):
        return Workspace(URLS.workspace, token=user_token)

    monkeypatch.setattr(clients, "get", get_workspace)

    with vcr.use_cassette(
        f"test_app_util/transform_param_value-{request.node.callspec.id}.yaml",
    ):
        assert transform_param_value(params["tf"], params["in"], None) == params["out"]


invalid_upa_fails = [
    pytest.param(
        {
            "in": INVALID_NAME_A,
            "tf": tf,
            "error": f"Unable to find object reference '{INVALID_REF_A}' to transform as {tf}",
        },
        id=f"name_{tf}",
    )
    for tf in ["upa", "resolved-ref"]
]


invalid_ref_fails = [
    pytest.param(
        {
            "in": INVALID_UPA_A,
            "tf": tf,
            "error": f"Unable to find object reference '{INVALID_UPA_A}' to transform as {tf}",
        },
        id=f"upa_{tf}",
    )
    for tf in ["ref", "unresolved-ref"]
]


@pytest.mark.parametrize("params", invalid_upa_fails + invalid_ref_fails)
def test_transform_param_value_fail_all_types(
    params, workspace_name, monkeypatch, request, user_name, user_token
):
    workspace_name(f"{user_name}:{ws_name}")

    def get_workspace(_):
        return Workspace(URLS.workspace, token=user_token)

    monkeypatch.setattr(clients, "get", get_workspace)

    with vcr.use_cassette(
        f"test_app_util/transform_param_value-fail-{request.node.callspec.id}.yaml",
    ):
        regex = re.escape(params["error"]) + ".+"
        with pytest.raises(ValueError, match=regex):
            transform_param_value(params["tf"], params["in"], None)


class RefChainWorkspace:
    def get_object_info3(self, params):
        """
        Makes quite a few assumptions about input, as it's used for a specific test.
        1. params = {"objects": [{"ref": ref}, {"ref": ref}, ...]}
        2. ref is a ;-separated chain of either wsname/objid or upas, not a mix.
        3. we don't really care about names or object info here in responses

        # TODO something like this should go into the MockClient workspace call
        """

        def make_obj_info(wsid, objid, ver):
            return [
                objid,
                "objname",
                "Object.Type-1.0",
                "date",
                ver,
                "user_name",
                wsid,
                "SomeWorkspace",
                "checksum",
                12345,
                None,
            ]

        obj_infos = []
        obj_paths = []
        for obj_ident in params["objects"]:
            ref_chain = obj_ident["ref"].split(";")
            obj_path = []
            cur_ws = 1
            cur_obj = 1
            cur_ver = 1
            for ref in ref_chain:
                if is_upa(ref):
                    obj_path.append(ref)
                else:
                    obj_path.append(f"{cur_ws}/{cur_obj}/{cur_ver}")
                cur_ws += 1
                cur_obj += 1
                cur_ver += 1
            if is_upa(obj_ident["ref"]):
                obj_info = make_obj_info(*(ref_chain[-1].split("/")))
            else:
                obj_info = make_obj_info(cur_ws, cur_obj, cur_ver)
            obj_infos.append(obj_info)
            obj_paths.append(obj_path)
        return {"infos": obj_infos, "paths": obj_paths}


def get_ref_path_mock_ws(name="workspace"):
    return RefChainWorkspace()


@pytest.mark.parametrize(
    "tf_type", ["ref", "unresolved-ref", "upa", "resolved-ref", "putative-ref"]
)
@mock.patch("biokbase.narrative.app_util.clients.get", get_ref_path_mock_ws)
def test_transform_param_value_upa_path(tf_type):
    upa_path = "69375/2/2;67729/2/2"
    assert transform_param_value(tf_type, upa_path, None) == upa_path


@pytest.mark.parametrize(
    "tf_type", ["ref", "unresolved-ref", "upa", "resolved-ref", "putative-ref"]
)
@mock.patch("biokbase.narrative.app_util.clients.get", get_ref_path_mock_ws)
def test_transform_param_value_ref_path(tf_type):
    ref_path = "some_ws/some_obj;some_other_ws/some_other_obj"
    if tf_type in ["ref", "unresolved-ref", "putative-ref"]:
        assert transform_param_value(tf_type, ref_path, None) == ref_path

    if tf_type in ["upa", "resolved-ref"]:
        expected_upa = "1/1/1;2/2/2"
        assert transform_param_value(tf_type, ref_path, None) == expected_upa
