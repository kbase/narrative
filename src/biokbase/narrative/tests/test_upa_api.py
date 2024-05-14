"""Tests for the Python side of the UPA api."""

import os
import unittest
from unittest import mock

import pytest
from biokbase.narrative.upa import (
    deserialize,
    external_tag,
    is_ref,
    serialize,
    serialize_external,
)

this_ws = "31"


def mock_sys_var(var):
    return this_ws


class UpaApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.serialize_test_data = [
            {"upa": "31/2/3", "serial": "[31]/2/3"},
            {"upa": "31/2/3;4/5/6", "serial": "[31]/2/3;4/5/6"},
            {"upa": "31/2/3;4/5/6;7/8/9", "serial": "[31]/2/3;4/5/6;7/8/9"},
            {"upa": ["31/2/3", "4/5/6", "7/8/9"], "serial": "[31]/2/3;4/5/6;7/8/9"},
            {"upa": "31/31/31;31/31/31", "serial": "[31]/31/31;31/31/31"},
        ]

        self.serialize_external_test_data = [
            {"upa": "5/1/2", "serial": f"{external_tag}5/1/2"},
            {"upa": "5/1/2;1/2/3", "serial": f"{external_tag}5/1/2;1/2/3"},
            {"upa": "5/5/5;1/1/1", "serial": f"{external_tag}5/5/5;1/1/1"},
        ]

        self.bad_upas = [
            "1/2",
            "1/2/3;4/5/",
            "1/2/a",
            "123/456/7/",
            "1/2/3;",
            "x/y/z",
            "1",
            "foo",
            "foo/bar",
            "1;2;3",
            "foo/bar;baz/frobozz",
            "myws/myobj/myver;otherws/otherobj/otherver",
            "myws/myobj/myver",
        ]

        self.bad_serials = [
            "[1]/2",
            "[1]/2/3;4/5/",
            "[1]/2/a",
            "[123]/456/7/",
            "[1]/2/3;",
            "[x]/y/z",
            "[1]",
            "[foo]",
            "[foo]/bar",
            "[1];2;3",
            "[f]oo/bar;baz/frobozz",
            "[myws]/myobj/myver;otherws/otherobj/otherver",
            "[myws]/myobj/myver",
            "[1]2/23/4",
            "[1]2/3/4;5/6/7",
        ]

        self.good_refs = [
            "1/2",
            "foo/2",
            "1/bar",
            "foo/bar",
            "1/2/3",
            "foo/2/3",
            "1/bar/3",
            "foo/bar/3",
            "foo/bar/3;1/2/3",
        ]

        self.bad_refs = ["foo", "1", "1/2/3/41;2"]

        for bad_upa in self.bad_upas:
            self.bad_serials.append(external_tag + bad_upa)

    def test_serialize_good(self):
        for pair in self.serialize_test_data:
            serial_upa = serialize(pair["upa"])
            assert serial_upa == pair["serial"]

    def test_serialize_external_good(self):
        for pair in self.serialize_external_test_data:
            serial_upa = serialize_external(pair["upa"])
            assert serial_upa == pair["serial"]

    @mock.patch("biokbase.narrative.upa.system_variable", mock_sys_var)
    def test_deserialize_good(self):
        for pair in self.serialize_test_data + self.serialize_external_test_data:
            if not isinstance(pair["upa"], list):
                deserial_upa = deserialize(pair["serial"])
                assert deserial_upa == pair["upa"]

    @mock.patch("biokbase.narrative.upa.system_variable", mock_sys_var)
    def test_serialize_bad(self):
        for bad_upa in self.bad_upas:
            with pytest.raises(
                ValueError,
                match=r'^".+" is not a valid UPA\. It may have already been serialized\.$',
            ):
                serialize(bad_upa)

    @mock.patch("biokbase.narrative.upa.system_variable", mock_sys_var)
    def test_deserialize_bad(self):
        for bad_serial in self.bad_serials:
            with pytest.raises(ValueError, match='Deserialized UPA: ".+" is invalid!'):
                deserialize(bad_serial)

    @mock.patch("biokbase.narrative.upa.system_variable", mock_sys_var)
    def test_deserialize_bad_type(self):
        bad_types = [["123/4/5", "6/7/8"], {"123": "456"}, None]
        for t in bad_types:
            with pytest.raises(ValueError, match="Can only deserialize UPAs from strings."):
                deserialize(t)

    def test_missing_ws_deserialize(self):
        tmp = None
        if "KB_WORKSPACE_ID" in os.environ:
            tmp = os.environ.get("KB_WORKSPACE_ID")
            del os.environ["KB_WORKSPACE_ID"]
        try:
            with pytest.raises(
                RuntimeError,
                match="Currently loaded workspace is unknown! Unable to deserialize UPA.",
            ):
                deserialize("[1]/2/3")
        finally:
            if tmp is not None:
                os.environ["KB_WORKSPACE_ID"] = tmp

    def test_is_ref(self):
        """Explicitly test the is_ref function.
        UPAs should pass, as well as shorter ws_name/obj_name, ws_id/obj_name, ws_id/obj_id references.
        """
        for ref in self.good_refs:
            assert is_ref(ref)

        for ref in self.bad_refs:
            assert is_ref(ref) is False


if __name__ == "__main__":
    unittest.main()
