from biokbase.narrative.staging.helper import Helper
import unittest
import os
from mock import patch


class StagingHelperTest(unittest.TestCase):

    def setUp(self):
        self.good_fake_token = "good_fake_token"
        os.environ['KB_AUTH_TOKEN'] = self.good_fake_token
        self.staging_helper = Helper()

    def test_token(self):
        self.assertEqual(self.good_fake_token, self.staging_helper._token)

    def test_staging_url(self):
        self.assertEqual('https://ci.kbase.us/services/staging_service/',
                         self.staging_helper._staging_url)

    def test_unauthorized_token(self):
        with self.assertRaises(ValueError) as context:
            self.staging_helper.list()
        self.assertTrue('Reason: Unauthorized' in str(context.exception.message))
        self.assertTrue('Error code: 401' in str(context.exception.message))

    def mock_fetch_url(end_point):
        if 'list' in end_point:
            print 'mocking __fetch_url list endpoint'
            return '[{"path": "tgu/test_file_1", "isFolder": false},\
                     {"path": "tgu/test_dir", "isFolder": true},\
                     {"path": "tgu/test_dir/test_file_2", "isFolder": false}]'

    @patch.object(Helper, "_Helper__fetch_url", side_effect=mock_fetch_url)
    def test_list(self, _fetch_url):
        file_list = self.staging_helper.list()
        self.assertTrue("tgu/test_file_1" in file_list)
        self.assertTrue("tgu/test_dir/test_file_2" in file_list)
        self.assertTrue("tgu/test_dir" not in file_list)

if __name__ == "__main__":
    unittest.main()
