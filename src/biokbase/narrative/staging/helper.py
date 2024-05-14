import json
import os
import urllib.error
import urllib.parse
import urllib.request

from biokbase import auth
from biokbase.narrative.common.url_config import URLS

"""
KBase staging.helper class
"""
__author__ = "Tianhao Gu <tgu@anl.gov>"

CHUNK_SIZE = 16 * 1024


class Helper:
    def __token(self):
        """Authorization token passed in from front-end."""
        token = auth.get_auth_token()

        if not token:
            raise ValueError("Cannot retrieve auth token")

        return token

    def __staging_url(self):
        """Staging service host URL"""
        return URLS.staging_api_url

    def __fetch_url(self, end_point, values=None, headers=None, method="GET", save_path=None):
        """Fetching URL
        By default, it sends a GET request with {"Authorization": $KB_AUTH_TOKEN} header
        """
        if save_path and os.path.exists(save_path):
            raise ValueError(
                f"A file exists at {save_path} but this method does not overwrite files"
            )

        data = None
        if values:
            data = urllib.parse.urlencode(values)

        if not headers:
            headers = {"Authorization": self._token}

        req = urllib.request.Request(end_point, data, headers)
        req.get_method = lambda: method
        try:
            response = urllib.request.urlopen(req)
        except urllib.error.URLError as e:
            error_msg = "The server could not fulfill the request.\n"

            server_msg = e.read()
            if server_msg:
                error_msg += f"Server message: {server_msg}\n"

            if hasattr(e, "reason"):
                error_msg += f"Reason: {e.reason}\n"

            if hasattr(e, "code"):
                error_msg += f"Error code: {e.code}\n"

            raise ValueError(error_msg) from e

        if not save_path:
            return response.read()

        with open(save_path, "wb") as f:
            while True:
                chunk = response.read(CHUNK_SIZE)
                if not chunk:
                    break
                f.write(chunk)

    def __init__(self):
        """Initializes a new Helper instance."""
        self._token = self.__token()
        self._staging_url = self.__staging_url()

    def list(self, directory=""):
        """Calling LIST endpoint and return a list of file path"""
        end_point = self._staging_url + "/list/" + directory
        response = self.__fetch_url(end_point)

        resp_json = json.loads(response)

        file_list = []
        for file in resp_json:
            if not file.get("isFolder"):
                file_list.append(file.get("path"))

        return sorted(file_list)

    def metadata(self, path=""):
        """Calling METADATA endpoint and return metadata in JSON format"""
        if not path:
            raise ValueError("Must provide path argument")

        end_point = self._staging_url + "/metadata/" + path
        response = self.__fetch_url(end_point)

        return json.loads(response)

    def jgi_metadata(self, path=""):
        """Calling JGI-METADATA endpoint and return metadata in JSON format"""
        if not path:
            raise ValueError("Must provide path argument")

        end_point = self._staging_url + "/jgi-metadata/" + path
        response = self.__fetch_url(end_point)

        return json.loads(response)

    def search(self, path=""):
        """Calling SEARCH endpoint and return server response in JSON format"""
        if not path:
            raise ValueError("Must provide path argument")

        end_point = self._staging_url + "/search/" + path
        response = self.__fetch_url(end_point)

        return json.loads(response)

    def delete(self, path=""):
        """Calling DELETE endpoint and return server response in JSON format"""
        if not path:
            raise ValueError("Must provide path argument")

        end_point = self._staging_url + "/delete/" + path
        response = self.__fetch_url(end_point, method="DELETE")

        return {"server_response": response}

    def download(self, path, save_location=None):
        """Calling DOWNLOAD endpoint and saving the resulting file"""
        if not save_location:
            save_location = "./" + os.path.basename(path)

        end_point = self._staging_url + "/download/" + path
        self.__fetch_url(end_point, save_path=save_location)

        return save_location

    def mv(self, path="", new_path=""):
        """Calling MV endpoint and return server response in JSON format"""
        if not path:
            raise ValueError("Must provide path argument")

        if not new_path:
            raise ValueError("Must provide new_path argument")

        end_point = self._staging_url + "/mv/" + path
        body_values = {"newPath": new_path}
        response = self.__fetch_url(end_point, values=body_values, method="PATCH")

        return {"server_response": response}
