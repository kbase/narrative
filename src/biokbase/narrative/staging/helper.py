
import os
import urllib
import urllib2
import json

"""
KBase staging.helper class
"""
__author__ = "Tianhao Gu <tgu@anl.gov>"


class Helper(object):

    def __token(self):
        """
        Authorization token passed in from front-end.
        """

        token = os.environ.get('KB_AUTH_TOKEN')

        if not token:
            raise ValueError('Cannot retrieve auth token')

        return token

    def __staging_url(self):
        """
        Staging service host URL
        """

        staging_url = 'https://ci.kbase.us/services/staging_service/'

        return staging_url

    def __fetch_url(self, end_point, values=None, headers=None):
        """
        Fetching URL
        By default, it sends a GET request with {"Authorization": $KB_AUTH_TOKEN} header
        """

        data = None
        if values:
            data = urllib.urlencode(values)

        if not headers:
            headers = {"Authorization": self._token}

        req = urllib2.Request(end_point, data, headers)
        try:
            response = urllib2.urlopen(req)
        except urllib2.URLError, e:
            error_msg = 'The server could not fulfill the request.\n'

            server_msg = e.read()
            if server_msg:
                error_msg += 'Server message: {server_msg}\n'.format(server_msg=server_msg)

            if hasattr(e, 'reason'):
                error_msg += 'Reason: {reason}\n'.format(reason=e.reason)

            if hasattr(e, 'code'):
                error_msg += 'Error code: {code}\n'.format(code=e.code)

            raise ValueError(error_msg)

        return response.read()

    def __init__(self):
        """
        Initializes a new Helper instance.
        """
        self._token = self.__token()
        self._staging_url = self.__staging_url()

    def list(self, dir=''):
        """
        Calling LIST endpoint and return a list of file path
        """

        end_point = self._staging_url + 'list/' + dir
        response = self.__fetch_url(end_point)

        resp_json = json.loads(response)

        file_list = list()
        for file in resp_json:
            if not file.get('isFolder'):
                file_list.append(file.get('path'))

        return sorted(file_list)

    def metadata(self, path=''):
        """
        Calling METADATA endpoint and return metadata in JSON format
        """

        if not path:
            raise ValueError('Must provide path argument')

        end_point = self._staging_url + 'metadata/' + path
        response = self.__fetch_url(end_point)

        resp_json = json.loads(response)

        return resp_json

    def jgi_metadata(self, path=''):
        """
        Calling JGI-METADATA endpoint and return metadata in JSON format
        """

        if not path:
            raise ValueError('Must provide path argument')

        end_point = self._staging_url + 'jgi-metadata/' + path
        response = self.__fetch_url(end_point)

        resp_json = json.loads(response)

        return resp_json
