"""
Tests for the Python side of the UPA api.
"""
import unittest
import mock
from biokbase.narrative.upa import (
    external_tag,
    serialize,
    deserialize,
    serialize_external,
    is_ref
)
import os

this_ws = "31"


def mock_sys_var(var):
    return this_ws


class UpaApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.serialize_test_data = [{
            "upa": "31/2/3",
            "serial": "[31]/2/3"
        }, {
            "upa": "31/2/3;4/5/6",
            "serial": "[31]/2/3;4/5/6"
        }, {
            "upa": "31/2/3;4/5/6;7/8/9",
            "serial": "[31]/2/3;4/5/6;7/8/9"
        }, {
            "upa": ["31/2/3", "4/5/6", "7/8/9"],
            "serial": "[31]/2/3;4/5/6;7/8/9"
        }, {
            "upa": "31/31/31;31/31/31",
            "serial": "[31]/31/31;31/31/31"
        }]

        self.serialize_external_test_data = [{
            "upa": "5/1/2",
            "serial": "{}5/1/2".format(external_tag)
        }, {
            "upa": "5/1/2;1/2/3",
            "serial": "{}5/1/2;1/2/3".format(external_tag)
        }, {
            "upa": "5/5/5;1/1/1",
            "serial": "{}5/5/5;1/1/1".format(external_tag)
        }]

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
            "myws/myobj/myver"
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
            "[1]2/3/4;5/6/7"
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
            "foo/bar/3;1/2/3"
        ]

        self.bad_refs = [
            "foo",
            "1",
            "1/2/3/4"
            "1;2"
        ]

        for bad_upa in self.bad_upas:
            self.bad_serials.append(external_tag + bad_upa)

    def test_serialize_good(self):
        for pair in self.serialize_test_data:
            serial_upa = serialize(pair["upa"])
            self.assertEqual(serial_upa, pair["serial"])

    def test_serialize_external_good(self):
        for pair in self.serialize_external_test_data:
            serial_upa = serialize_external(pair["upa"])
            self.assertEqual(serial_upa, pair["serial"])

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_deserialize_good(self):
        for pair in self.serialize_test_data + self.serialize_external_test_data:
            if type(pair["upa"]) is not list:
                deserial_upa = deserialize(pair["serial"])
                self.assertEqual(deserial_upa, pair["upa"])

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_serialize_bad(self):
        for bad_upa in self.bad_upas:
            with self.assertRaisesRegex(
                ValueError,
                "^\".+\" is not a valid UPA\. It may have already been serialized\.$"
            ):
                serialize(bad_upa)

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_deserialize_bad(self):
        for bad_serial in self.bad_serials:
            with self.assertRaisesRegex(
                ValueError,
                "Deserialized UPA: \".+\" is invalid!"
            ):
                deserialize(bad_serial)

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_deserialize_bad_type(self):
        bad_types = [
            ['123/4/5', '6/7/8'],
            {'123': '456'},
            None
        ]
        for t in bad_types:
            with self.assertRaises(ValueError) as e:
                deserialize(t)
            self.assertEqual(str(e.exception), "Can only deserialize UPAs from strings.")

    def test_missing_ws_deserialize(self):
        tmp = None
        if 'KB_WORKSPACE_ID' in os.environ:
            tmp = os.environ.get('KB_WORKSPACE_ID')
            del os.environ['KB_WORKSPACE_ID']
        try:
            with self.assertRaises(RuntimeError) as e:
                deserialize("[1]/2/3")
            self.assertEqual(str(e.exception),
                             "Currently loaded workspace is unknown! Unable to deserialize UPA.")
        finally:
            if tmp is not None:
                os.environ['KB_WORKSPACE_ID'] = tmp

    def test_is_ref(self):
        """
        Explicitly test the is_ref function.
        UPAs should pass, as well as shorter ws_name/obj_name, ws_id/obj_name, ws_id/obj_id references.
        """
        for ref in self.good_refs:
            self.assertTrue(is_ref(ref))

        for ref in self.bad_refs:
            self.assertFalse(is_ref(ref))


if __name__ == '__main__':
    unittest.main()
