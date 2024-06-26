"""A basic Shock (https://github.com/MG-RAST/Shock) python access class.

Authors:

* Jared Wilkening
* Travis Harrison
"""

import os
import urllib

import cStringIO
import requests


class Client:
    shock_url = ""
    auth_header = {}
    token = ""
    template = "An exception of type {0} occured. Arguments:\n{1!r}"

    def __init__(self, shock_url, token=""):
        self.shock_url = shock_url
        if token != "":
            self.set_auth(token)

    def set_auth(self, token):
        self.auth_header = {"Authorization": f"OAuth {token}"}

    def get_acl(self, node):
        return self._manage_acl(node, "get")

    def add_acl(self, node, acl, user):
        return self._manage_acl(node, "put", acl, user)

    def delete_acl(self, node, acl, user):
        return self._manage_acl(node, "delete", acl, user)

    def _manage_acl(self, node, method, acl=None, user=None):
        url = self.shock_url + "/node/" + node + "/acl"
        if acl and user:
            url += "/" + acl + "?users=" + urllib.quote(user)
        try:
            if method == "get":
                req = requests.get(url, headers=self.auth_header)
            elif method == "put":
                req = requests.put(url, headers=self.auth_header)
            elif method == "delete":
                req = requests.delete(url, headers=self.auth_header)
        except Exception as ex:
            message = self.template.format(type(ex).__name__, ex.args)
            raise Exception(f"Unable to connect to Shock server {url}\n{message}") from ex
        if not (req.ok and req.text):
            raise Exception(f"Unable to connect to Shock server {url}\n{req.raise_for_status()}")
        rj = req.json()
        if not (
            rj and isinstance(rj, dict) and all(key in rj for key in ["status", "data", "error"])
        ):
            raise Exception("Return data not valid Shock format")
        if rj["error"]:
            raise Exception(f"Shock error {rj['status']} : {rj['error'][0]}")
        return rj["data"]

    def get_node(self, node):
        return self._get_node_data("/" + node)

    def query_node(self, query):
        query_string = "?query&" + urllib.urlencode(query)
        return self._get_node_data(query_string)

    def _get_node_data(self, path):
        url = self.shock_url + "/node" + path
        try:
            rget = requests.get(url, headers=self.auth_header, allow_redirects=True)
        except Exception as ex:
            message = self.template.format(type(ex).__name__, ex.args)
            raise Exception(f"Unable to connect to Shock server {url}\n{message}") from ex
        if not (rget.ok and rget.text):
            raise Exception(f"Unable to connect to Shock server {url}\n{rget.raise_for_status()}")
        rj = rget.json()
        if not (
            rj and isinstance(rj, dict) and all(key in rj for key in ["status", "data", "error"])
        ):
            raise Exception("Return data not valid Shock format")
        if rj["error"]:
            raise Exception(f"Shock error {rj['status']} : {rj['error'][0]}")
        return rj["data"]

    def download_to_string(self, node, index=None, part=None, chunk=None, binary=False):
        result = self._get_node_download(node, index=index, part=part, chunk=chunk, stream=False)
        if binary:
            return result.content
        return result.text

    def download_to_path(self, node, path, index=None, part=None, chunk=None):
        if path == "":
            raise Exception("download_to_path requires non-empty path parameter")
        result = self._get_node_download(node, index=index, part=part, chunk=chunk, stream=True)
        with open(path, "wb") as f:
            for chunk in result.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    f.flush()
        return path

    def _get_node_download(self, node, index=None, part=None, chunk=None, stream=False):
        if node == "":
            raise Exception("download requires non-empty node parameter")
        url = f"{self.shock_url}/node/{node}?download"
        if index and part:
            url += "&index=" + index + "&part=" + str(part)
            if chunk:
                url += "&chunk_size=" + str(chunk)
        try:
            rget = requests.get(url, headers=self.auth_header, stream=stream)
        except Exception as ex:
            message = self.template.format(type(ex).__name__, ex.args)
            raise Exception(f"Unable to connect to Shock server {url}\n{message}") from ex
        if not (rget.ok):
            raise Exception(f"Unable to connect to Shock server {url}: {rget.raise_for_status()}")
        return rget

    def delete_node(self, node):
        url = self.shock_url + "/node/" + node
        try:
            req = requests.delete(url, headers=self.auth_header)
            rj = req.json()
        except Exception as ex:
            message = self.template.format(type(ex).__name__, ex.args)
            raise Exception(f"Unable to connect to Shock server {url}\n{message}") from ex
        if rj["error"]:
            raise Exception(f"Shock error {rj['status']} : {rj['error'][0]}")
        return rj

    def index_node(self, node, index):
        url = "%s/node/%s/index/%s" % (self.shock_url, node, index)
        try:
            req = requests.put(url, headers=self.auth_header)
            rj = req.json()
        except Exception as ex:
            message = self.template.format(type(ex).__name__, ex.args)
            raise Exception(f"Unable to connect to Shock server {url}\n{message}") from ex
        if rj["error"]:
            raise Exception(f"Shock error {rj['status']} : {rj['error'][0]}")
        return rj

    def create_node(self, data="", attr="", data_name=""):
        return self.upload("", data, attr, data_name)

    # file_name is name of data file
    # form == True for multi-part form
    # form == False for data POST of file
    def upload(self, node="", data="", attr="", file_name="", form=True):
        method = "POST"
        files = {}
        url = self.shock_url + "/node"
        if node != "":
            url = "%s/%s" % (url, node)
            method = "PUT"
        if data != "":
            files["upload"] = self._get_handle(data, file_name)
        if attr != "":
            files["attributes"] = self._get_handle(attr)
        if form:
            try:
                if method == "PUT":
                    req = requests.put(
                        url, headers=self.auth_header, files=files, allow_redirects=True
                    )
                else:
                    req = requests.post(
                        url, headers=self.auth_header, files=files, allow_redirects=True
                    )
                rj = req.json()
            except Exception as ex:
                message = self.template.format(type(ex).__name__, ex.args)
                raise Exception(f"Unable to connect to Shock server {url}\n{message}") from ex
        elif (not form) and data:
            try:
                if method == "PUT":
                    req = requests.put(
                        url,
                        headers=self.auth_header,
                        data=files["upload"][1],
                        allow_redirects=True,
                    )
                else:
                    req = requests.post(
                        url,
                        headers=self.auth_header,
                        data=files["upload"][1],
                        allow_redirects=True,
                    )
                rj = req.json()
            except Exception as ex:
                message = self.template.format(type(ex).__name__, ex.args)
                raise Exception(f"Unable to connect to Shock server {url}\n{message}") from ex
        else:
            raise Exception(f"No data specificed for {method} body")
        if not (req.ok):
            raise Exception(f"Unable to connect to Shock server {url}\n{req.raise_for_status()}")

        if rj["error"]:
            raise Exception(f"Shock error {rj['status']} : {rj['error'][0]}")
        return rj["data"]

    # handles 3 cases
    # 1. file path
    # 2. file object (handle)
    # 3. file content (string)
    def _get_handle(self, d, n=""):
        try:
            if os.path.exists(d):
                name = n if n else os.path.basename(d)
                return (name, open(d))
            name = n if n else "unknown"
            return (name, cStringIO.StringIO(d))
        except TypeError:
            try:
                name = n if n else d.name
                return (name, d)
            except BaseException:
                raise Exception("Error opening file handle for upload") from BaseException
