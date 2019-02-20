from biokbase.narrative.staging.helper import Helper
import unittest
import os
from mock import patch


class StagingHelperTest(unittest.TestCase):

    def setUp(self):
        self.good_fake_token = 'good_fake_token'
        os.environ['KB_AUTH_TOKEN'] = self.good_fake_token
        self.staging_helper = Helper()

    def test_missing_token(self):
        os.environ['KB_AUTH_TOKEN'] = ''
        with self.assertRaises(ValueError) as context:
            Helper()
        self.assertEqual('Cannot retrieve auth token', str(context.exception.message))

    def test_token(self):
        self.assertEqual(self.good_fake_token, self.staging_helper._token)

    def test_staging_url(self):
        self.assertTrue('kbase.us/services/staging_service' in
                        self.staging_helper._staging_url)

    def test_unauthorized_token(self):
        with self.assertRaises(ValueError) as context:
            self.staging_helper.list()
        self.assertTrue('Reason: Unauthorized' in str(context.exception.message))
        self.assertTrue('Error code: 401' in str(context.exception.message))

    def mock_fetch_url(end_point, values=None, headers=None, method='GET', save_path=None):
        if 'list' in end_point:
            print('mocking __fetch_url list endpoint')
            return '[{"path": "tgu/test_file_1", "isFolder": false},\
                     {"path": "tgu/test_dir", "isFolder": true},\
                     {"path": "tgu/test_dir/test_file_2", "isFolder": false}]'
        elif 'jgi-metadata' in end_point:
            print('mocking __fetch_url jgi-metadata endpoint')
            return '{"file_name": "test_file", "file_status": "BACKUP_COMPLETE"}'
        elif 'metadata' in end_point:
            print('mocking __fetch_url metadata endpoint')
            return '{"head": "head_line", "tail": "tail_line", "lineCount": 10}'
        elif 'search' in end_point:
            print('mocking __fetch_url search endpoint')
            return '[{"isFolder": false, "mtime": 1515526154896, "name": "LMS-PROC-315.pdf"}]'
        elif 'delete' in end_point:
            print('mocking __fetch_url delete endpoint')
            return "successfully deleted tgu2/test.pdf"
        elif 'download' in end_point:
            print('mocking __fetch_url download endpoint')
        elif 'mv' in end_point:
            print('mocking __fetch_url mv endpoint')
            return "successfully moved tgu2/test.pdf to tgu2/test_1.pdf"

    @patch.object(Helper, '_Helper__fetch_url', side_effect=mock_fetch_url)
    def test_list(self, _fetch_url):
        file_list = self.staging_helper.list()
        self.assertTrue('tgu/test_file_1' in file_list)
        self.assertTrue('tgu/test_dir/test_file_2' in file_list)
        self.assertTrue('tgu/test_dir' not in file_list)

    def test_missing_path(self):
        with self.assertRaises(ValueError) as context:
            self.staging_helper.metadata()
        self.assertEqual('Must provide path argument', str(context.exception.message))

    @patch.object(Helper, '_Helper__fetch_url', side_effect=mock_fetch_url)
    def test_metadata(self, _fetch_url):
        metadata = self.staging_helper.metadata('test_fake_file')
        self.assertTrue('head' in metadata)
        self.assertEqual(metadata.get('head'), 'head_line')
        self.assertTrue('tail' in metadata)
        self.assertEqual(metadata.get('tail'), 'tail_line')
        self.assertTrue('lineCount' in metadata)
        self.assertEqual(metadata.get('lineCount'), 10)

    @patch.object(Helper, '_Helper__fetch_url', side_effect=mock_fetch_url)
    def test_jgi_metadata(self, _fetch_url):
        metadata = self.staging_helper.jgi_metadata('test_fake_file')
        self.assertTrue('file_name' in metadata)
        self.assertEqual(metadata.get('file_name'), 'test_file')
        self.assertTrue('file_status' in metadata)
        self.assertEqual(metadata.get('file_status'), 'BACKUP_COMPLETE')

    @patch.object(Helper, '_Helper__fetch_url', side_effect=mock_fetch_url)
    def test_search(self, _fetch_url):
        search_ret = self.staging_helper.search('test_fake_file')
        self.assertTrue(isinstance(search_ret, (list)))
        element = search_ret[0]
        self.assertTrue('isFolder' in element)
        self.assertFalse(element.get('isFolder'))
        self.assertTrue('name' in element)
        self.assertEqual(element.get('name'), 'LMS-PROC-315.pdf')

    @patch.object(Helper, '_Helper__fetch_url', side_effect=mock_fetch_url)
    def test_delete(self, _fetch_url):
        delete_ret = self.staging_helper.delete('test_fake_file')
        self.assertTrue('server_response' in delete_ret)
        self.assertEqual(delete_ret.get('server_response'), 'successfully deleted tgu2/test.pdf')

    @patch.object(Helper, '_Helper__fetch_url', side_effect=mock_fetch_url)
    def test_download(self, _fetch_url):
        download_ret = self.staging_helper.download('test_fake_file')
        self.assertTrue('test_fake_file' in download_ret)

    @patch.object(Helper, '_Helper__fetch_url', side_effect=mock_fetch_url)
    def test_mv(self, _fetch_url):
        mv_ret = self.staging_helper.mv('test.pdf ', 'test_1.pdf')
        self.assertTrue('server_response' in mv_ret)
        self.assertEqual(mv_ret.get('server_response'),
                         'successfully moved tgu2/test.pdf to tgu2/test_1.pdf')


if __name__ == "__main__":
    unittest.main()
