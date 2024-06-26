import os
import unittest
from unittest.mock import patch

import pytest
from biokbase.narrative.staging.helper import Helper


class StagingHelperTest(unittest.TestCase):
    def setUp(self):
        self.good_fake_token = "good_fake_token"
        os.environ["KB_AUTH_TOKEN"] = self.good_fake_token
        self.staging_helper = Helper()

    def test_missing_token(self):
        os.environ["KB_AUTH_TOKEN"] = ""
        with pytest.raises(ValueError, match="Cannot retrieve auth token"):
            Helper()

    def test_token(self):
        assert self.good_fake_token == self.staging_helper._token

    def test_staging_url(self):
        assert "kbase.us/services/staging_service" in self.staging_helper._staging_url

    @pytest.mark.skip("Skipped: test contacts the staging service, but should not")
    def test_unauthorized_token(self):
        import re

        with pytest.raises(
            ValueError,
            match=re.escape(
                "The server could not fulfill the request.\nServer message: b'Error "
                + "connecting to auth service: 401 Unauthorized\\n10020 Invalid token'\n"
                + "Reason: Unauthorized\nError code: 401\n"
            ),
        ):
            self.staging_helper.list()

    def mock_fetch_url(
        end_point, values=None, headers=None, method="GET", save_path=None
    ) -> str | None:
        if "list" in end_point:
            print("mocking __fetch_url list endpoint")
            return '[{"path": "tgu/test_file_1", "isFolder": false},\
                     {"path": "tgu/test_dir", "isFolder": true},\
                     {"path": "tgu/test_dir/test_file_2", "isFolder": false}]'

        if "jgi-metadata" in end_point:
            print("mocking __fetch_url jgi-metadata endpoint")
            return '{"file_name": "test_file", "file_status": "BACKUP_COMPLETE"}'

        if "metadata" in end_point:
            print("mocking __fetch_url metadata endpoint")
            return '{"head": "head_line", "tail": "tail_line", "lineCount": 10}'

        if "search" in end_point:
            print("mocking __fetch_url search endpoint")
            return '[{"isFolder": false, "mtime": 1515526154896, "name": "LMS-PROC-315.pdf"}]'

        if "delete" in end_point:
            print("mocking __fetch_url delete endpoint")
            return "successfully deleted tgu2/test.pdf"

        if "download" in end_point:
            print("mocking __fetch_url download endpoint")
            return None

        if "mv" in end_point:
            print("mocking __fetch_url mv endpoint")
            return "successfully moved tgu2/test.pdf to tgu2/test_1.pdf"

        return None

    @patch.object(Helper, "_Helper__fetch_url", side_effect=mock_fetch_url)
    def test_list(self, _fetch_url):
        file_list = self.staging_helper.list()
        assert "tgu/test_file_1" in file_list
        assert "tgu/test_dir/test_file_2" in file_list
        assert "tgu/test_dir" not in file_list

    def test_missing_path(self):
        with pytest.raises(ValueError, match="Must provide path argument"):
            self.staging_helper.metadata()

    @patch.object(Helper, "_Helper__fetch_url", side_effect=mock_fetch_url)
    def test_metadata(self, _fetch_url):
        metadata = self.staging_helper.metadata("test_fake_file")
        assert "head" in metadata
        assert metadata.get("head") == "head_line"
        assert "tail" in metadata
        assert metadata.get("tail") == "tail_line"
        assert "lineCount" in metadata
        assert metadata.get("lineCount") == 10

    @patch.object(Helper, "_Helper__fetch_url", side_effect=mock_fetch_url)
    def test_jgi_metadata(self, _fetch_url):
        metadata = self.staging_helper.jgi_metadata("test_fake_file")
        assert "file_name" in metadata
        assert metadata.get("file_name") == "test_file"
        assert "file_status" in metadata
        assert metadata.get("file_status") == "BACKUP_COMPLETE"

    @patch.object(Helper, "_Helper__fetch_url", side_effect=mock_fetch_url)
    def test_search(self, _fetch_url):
        search_ret = self.staging_helper.search("test_fake_file")
        assert isinstance(search_ret, list)
        element = search_ret[0]
        assert "isFolder" in element
        assert not element.get("isFolder")
        assert "name" in element
        assert element.get("name") == "LMS-PROC-315.pdf"

    @patch.object(Helper, "_Helper__fetch_url", side_effect=mock_fetch_url)
    def test_delete(self, _fetch_url):
        delete_ret = self.staging_helper.delete("test_fake_file")
        assert "server_response" in delete_ret
        assert delete_ret.get("server_response") == "successfully deleted tgu2/test.pdf"

    @patch.object(Helper, "_Helper__fetch_url", side_effect=mock_fetch_url)
    def test_download(self, _fetch_url):
        download_ret = self.staging_helper.download("test_fake_file")
        assert "test_fake_file" in download_ret

    @patch.object(Helper, "_Helper__fetch_url", side_effect=mock_fetch_url)
    def test_mv(self, _fetch_url):
        mv_ret = self.staging_helper.mv("test.pdf ", "test_1.pdf")
        assert "server_response" in mv_ret
        assert (
            mv_ret.get("server_response") == "successfully moved tgu2/test.pdf to tgu2/test_1.pdf"
        )


if __name__ == "__main__":
    unittest.main()
