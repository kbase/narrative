from __future__ import print_function
import unittest
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
        cls.attribute_set_ref = "36095/73/1"
        cls.generic_ref = "36095/74/1"
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
        from biokbase.narrative import viewers
        with self.assertRaises(AssertionError):
            viewers.view_as_clustergrammer(self.generic_ref, col_categories="Time")
        with self.assertRaises(AssertionError):
            viewers.view_as_clustergrammer(self.generic_ref, row_categories="Time")
        with self.assertRaises(AssertionError):
            viewers.view_as_clustergrammer(self.generic_ref, normalize_on="Time")
        with self.assertRaisesRegexp(ValueError, "not a compatible data type"):
            viewers.view_as_clustergrammer(self.attribute_set_ref)

    def test__get_categories(self):
        import pandas as pd
        from biokbase.narrative import viewers
        ids = ["WRI_RS00010_CDS_1", "WRI_RS00015_CDS_1", "WRI_RS00025_CDS_1"]
        mapping = {
            "WRI_RS00010_CDS_1": "test_row_instance_1",
            "WRI_RS00015_CDS_1": "test_row_instance_2",
            "WRI_RS00025_CDS_1": "test_row_instance_3"
        }
        index = [('WRI_RS00010_CDS_1',
                  'test_attribute_1: 1',
                  'test_attribute_2: 4',
                  'test_attribute_3: 7'),
                 ('WRI_RS00015_CDS_1',
                  'test_attribute_1: 2',
                  'test_attribute_2: 5',
                  'test_attribute_3: 8'),
                 ('WRI_RS00025_CDS_1',
                  'test_attribute_1: 3',
                  'test_attribute_2: 6',
                  'test_attribute_3: 9')]
        filtered_index = [('WRI_RS00010_CDS_1', 'test_attribute_1: 1'),
                          ('WRI_RS00015_CDS_1', 'test_attribute_1: 2'),
                          ('WRI_RS00025_CDS_1', 'test_attribute_1: 3')]
        multi_index = pd.MultiIndex(levels=[[u'WRI_RS00010_CDS_1', u'WRI_RS00015_CDS_1', u'WRI_RS00025_CDS_1'], [u'1', u'2', u'3']],
                                    labels=[[0, 1, 2], [0, 1, 2]], names=[u'ID', u'test_attribute_1'])
        self.assertEqual(ids, viewers._get_categories(ids, self.generic_ref))
        with self.assertRaisesRegexp(ValueError, "not in the provided mapping"):
            viewers._get_categories(['boo'], self.generic_ref, self.attribute_set_ref, mapping)
        with self.assertRaisesRegexp(ValueError, "has no attribute"):
            viewers._get_categories(['boo'], self.generic_ref, self.attribute_set_ref)
        self.assertEqual(index,
                         viewers._get_categories(ids, self.generic_ref, self.attribute_set_ref,
                                                 mapping, clustergrammer=True))
        pd.testing.assert_index_equal(
            multi_index, viewers._get_categories(ids, self.generic_ref, self.attribute_set_ref,
                                                 mapping, {"test_attribute_1"}))
        self.assertEqual(filtered_index,
                         viewers._get_categories(ids, self.generic_ref, self.attribute_set_ref,
                                                 mapping, {"test_attribute_1"}, clustergrammer=True))

    def test_get_df(self):
        import pandas as pd
        from biokbase.narrative import viewers

        res = viewers.get_df(self.generic_ref)
        self.assertIsInstance(res, pd.DataFrame)
        self.assertEqual(res.shape, (3, 4))
        self.assertIsInstance(res.index, pd.MultiIndex)

        res = viewers.get_df(self.generic_ref, None, None)
        self.assertIsInstance(res, pd.DataFrame)
        self.assertEqual(res.shape, (3, 4))
        self.assertIsInstance(res.index, pd.Index)

        res = viewers.get_df(self.generic_ref, clustergrammer=True)
        self.assertIsInstance(res, pd.DataFrame)
        self.assertEqual(res.shape, (3, 4))
        self.assertIsInstance(res.index, pd.Index)

        res = viewers.get_df(self.expression_matrix_ref)
        self.assertIsInstance(res, pd.DataFrame)
        self.assertEqual(res.shape, (4297, 16))
        self.assertIsInstance(res.index, pd.Index)

    def test_view_as_clustergrammer(self):
        from biokbase.narrative import viewers
        self.assertEqual(str(type(viewers.view_as_clustergrammer(self.generic_ref))),
                         "<class 'clustergrammer_widget.example.clustergrammer_widget'>")
