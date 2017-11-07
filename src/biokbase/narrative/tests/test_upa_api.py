"""
Tests for the Python side of the UPA api.
"""
import unittest
import mock
from biokbase.narrative.upa import (
    external_tag,
    serialize,
    deserialize
)
import os

this_ws = "31"


def mock_sys_var(var):
    return this_ws


class UpaApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.test_data = [{
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
        }, {
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
            "x/y/z"
        ]

        self.bad_serials = list()
        for bad_upa in self.bad_upas:
            self.bad_serials.append(external_tag + bad_upa)

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_serialize_good(self):
        for pair in self.test_data:
            serial_upa = serialize(pair["upa"])
            self.assertEquals(serial_upa, pair["serial"])

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_deserialize_good(self):
        for pair in self.test_data:
            if type(pair["upa"]) is not list:
                deserial_upa = deserialize(pair["serial"])
                self.assertEquals(deserial_upa, pair["upa"])

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_serialize_bad(self):
        for bad_upa in self.bad_upas:
            with self.assertRaises(ValueError):
                serialize(bad_upa)

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_deserialize_bad(self):
        for bad_serial in self.bad_serials:
            with self.assertRaises(ValueError):
                deserialize(bad_serial)

    @mock.patch('biokbase.narrative.upa.system_variable', mock_sys_var)
    def test_deserialize_bad_type(self):
        bad_types = [
            ['123/4/5', '6/7/8'],
            {'123': '456'},
            None
        ]
        for t in bad_types:
            with self.assertRaises(ValueError):
                deserialize(t)

    def test_missing_ws_serialize(self):
        tmp = None
        if 'KB_WORKSPACE_ID' in os.environ:
            tmp = os.environ.get('KB_WORKSPACE_ID')
            del os.environ['KB_WORKSPACE_ID']
        with self.assertRaises(RuntimeError):
            serialize("1/2/3")
        if tmp is not None:
            os.environ['KB_WORKSPACE_ID'] = tmp

    def test_missing_ws_deserialize(self):
        tmp = None
        if 'KB_WORKSPACE_ID' in os.environ:
            tmp = os.environ.get('KB_WORKSPACE_ID')
            del os.environ['KB_WORKSPACE_ID']
        with self.assertRaises(RuntimeError):
            deserialize("[1]/2/3")
        if tmp is not None:
            os.environ['KB_WORKSPACE_ID'] = tmp
