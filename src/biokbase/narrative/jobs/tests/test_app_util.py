"""
Tests for the app_util module
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

import unittest
from biokbase.narrative.jobs.app_util import (
    check_tag,
    system_variable
)
import os

class AppUtilTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        self.good_tag = "release"
        self.bad_tag = "notATag"

        # inject phony variables into the environment
        self.user_id = "KBaseTest"
        self.good_fake_token = "un={}|tokenid=12345|expiry=1592895594|client_id={}|token_type=bearer|SigningSubject=whaaaaaaaaaaat".format(self.user_id, self.user_id)
        self.bad_fake_token = "NotAGoodTokenLOL"
        self.workspace = "{}:12345".format(self.user_id)
        os.environ['KB_WORKSPACE_ID'] = self.workspace

    def test_check_tag_good(self):
        self.assertTrue(check_tag(self.good_tag))

    def test_check_tag_bad(self):
        self.assertFalse(check_tag(self.bad_tag))

    def test_check_tag_bad_except(self):
        with self.assertRaises(ValueError) as err:
            check_tag(self.bad_tag, raise_exception=True)

    def test_sys_var_user(self):
        os.environ['KB_AUTH_TOKEN'] = self.good_fake_token
        self.assertEquals(system_variable('user_id'), self.user_id)

    def test_sys_var_workspace(self):
        self.assertEquals(system_variable('workspace'), self.workspace)

    def test_sys_var_token(self):
        os.environ['KB_AUTH_TOKEN'] = self.good_fake_token
        self.assertEquals(system_variable('token'), self.good_fake_token)

    def test_sys_var_bad_token(self):
        if 'KB_AUTH_TOKEN' in os.environ:
            del os.environ['KB_AUTH_TOKEN']
        self.assertIsNone(system_variable('token'))

    def test_sys_var_user_bad(self):
        os.environ['KB_AUTH_TOKEN'] = self.bad_fake_token
        self.assertIsNone(system_variable('user_id'))

    def test_sys_var_user_none(self):
        if 'KB_AUTH_TOKEN' in os.environ:
            del os.environ['KB_AUTH_TOKEN']
        self.assertIsNone(system_variable('user_id'))

    def test_sys_var_bad(self):
        self.assertIsNone(system_variable(self.bad_tag))


if __name__ == '__main__':
    unittest.main()