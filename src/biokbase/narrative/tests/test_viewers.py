from __future__ import print_function
import unittest
from biokbase.narrative import viewers
import biokbase.auth
import util


"""
Tests for the viewer module
"""
__author__ = 'James Jeffryes <jjeffryes@mcs.anl.gov>'

@unittest.skip("Skipping clustergrammer-based tests")
class ViewersTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.condition_set_ref = "28852/13/1"
        cls.generic_type_ref = "28852/12/2"
        cls.expression_matrix_ref = "28852/11/1"
        config = util.TestConfig()
        cls.user_id = config.get('users', 'test_user')
        cls.user_token = util.read_token_file(
            config.get_path('token_files', 'test_user', from_root=True))
        if cls.user_token:
            biokbase.auth.set_environ_token(cls.user_token)
        else:
            raise unittest.SkipTest("No Token")

    def test_bad_view_as_clustergrammer_params(self):
        with self.assertRaises(AssertionError):
            viewers.view_as_clustergrammer(self.generic_type_ref, col_categories="Time")
        with self.assertRaises(AssertionError):
            viewers.view_as_clustergrammer(self.generic_type_ref, row_categories="Time")
        with self.assertRaises(AssertionError):
            viewers.view_as_clustergrammer(self.generic_type_ref, normalize_on="Time")
        with self.assertRaisesRegexp(ValueError, "not a compatible data type"):
            viewers.view_as_clustergrammer(self.condition_set_ref)

    def test__get_categories(self):
        ids = ["condition_1", "condition_2", "condition_3", "condition_4"]
        mapping = {
            "condition_1": "test_condition_1",
            "condition_2": "test_condition_2",
            "condition_3": "test_condition_3",
            "condition_4": "test_condition_3"
        }
        index = [
             ('condition_1',
              'test_factor_1:1-1',
              'test_factor_2:1-2',
              'test_factor_3:1-3'),
             ('condition_2',
              'test_factor_1:2-1',
              'test_factor_2:2-2',
              'test_factor_3:2-3'),
             ('condition_3',
              'test_factor_1:3-1',
              'test_factor_2:3-2',
              'test_factor_3:3-3'),
             ('condition_4',
              'test_factor_1:3-1',
              'test_factor_2:3-2',
              'test_factor_3:3-3')]
        filtered_index = [
             ('condition_1', 'test_factor_1:1-1'),
             ('condition_2', 'test_factor_1:2-1'),
             ('condition_3', 'test_factor_1:3-1'),
             ('condition_4', 'test_factor_1:3-1')]
        self.assertEqual(ids, viewers._get_categories(ids))
        with self.assertRaisesRegexp(ValueError, "not in the provided mapping"):
            viewers._get_categories(['boo'], self.condition_set_ref, mapping)
        with self.assertRaisesRegexp(ValueError, "has no condition"):
            viewers._get_categories(['boo'], self.condition_set_ref)
        self.assertEqual(index, viewers._get_categories(ids, self.condition_set_ref, mapping))
        self.assertEqual(filtered_index, viewers._get_categories(ids, self.condition_set_ref,
                                                                 mapping, {"test_factor_1"}))

    def test__get_df(self):
        res = viewers._get_df(self.generic_type_ref, (), ())
        self.assertEqual(str(type(res)), "<class 'pandas.core.frame.DataFrame'>")
        self.assertEqual(res.shape, (3, 4))
        res = viewers._get_df(self.expression_matrix_ref, (), ())
        self.assertEqual(str(type(res)), "<class 'pandas.core.frame.DataFrame'>")
        self.assertEqual(res.shape, (4297, 16))

    def test_view_as_clustergrammer(self):
        self.assertEqual(str(type(viewers.view_as_clustergrammer(self.generic_type_ref))),
                         "<class 'clustergrammer_widget.example.clustergrammer_widget'>")
