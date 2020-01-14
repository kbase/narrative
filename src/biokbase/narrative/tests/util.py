"""
Test utility functions
"""
import logging
import pickle
import struct
import threading
import time
import unittest
import socketserver
import socket
import os
import json
import configparser
from contextlib import closing
from biokbase.narrative.common import util
from biokbase.workspace.client import Workspace
from biokbase.narrative.common.narrative_ref import NarrativeRef

__author__ = 'Dan Gunter <dkgunter@lbl.gov>, Bill Riehl <wjriehl@lbl.gov>'
_log = logging.getLogger('kbtest')
_hnd = logging.StreamHandler()
_hnd.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s %(name)s: %(message)s"))
_log.addHandler(_hnd)
_log.setLevel(logging.DEBUG)


prod_ws = 'https://kbase.us/services/ws'
ci_ws = 'https://ci.kbase.us/services/ws'
ws_metadata = {
    'is_temporary': False,
    'narrative_nice_name': None
}
_config_file = "test.cfg"


def test_logger(name):
    return logging.getLogger('kbtest.' + name)


class TestConfig(object):
    def __init__(self):
        self._path_prefix = os.path.join(os.environ["NARRATIVE_DIR"], "src", "biokbase",
                                         "narrative", "tests")
        self._path_root = os.path.join(os.environ["NARRATIVE_DIR"])
        config_file_path = self.file_path(_config_file)
        self._config = configparser.ConfigParser()
        self._config.read(config_file_path)

    def get(self, *args, **kwargs):
        return self._config.get(*args, **kwargs)

    def get_path(self, *args, **kwargs):
        from_root = False
        if 'from_root' in kwargs:
            from_root = kwargs['from_root']
            del kwargs['from_root']
        val = self.get(*args, **kwargs)
        return self.file_path(val, from_root)

    def load_json_file(self, filename):
        """
        Reads, parses, and returns as a dict, a JSON file.
        The filename parameter is expected to be a path relative to this file's expected
        location in <narrative_root>/src/biokbase/narrative/tests
        """
        json_file_path = self.file_path(filename)
        with open(json_file_path, 'r') as f:
            data = json.loads(f.read())
            f.close()
            return data

    def file_path(self, filename, from_root=False):
        """
        Returns the path to the filename, relative to this file's expected location.
        <narrative root>/src/biokbase/narrative/tests
        """
        if from_root:
            return os.path.join(self._path_root, filename)
        else:
            return os.path.join(self._path_prefix, filename)


def fetch_narrative(nar_id, auth_token, url=ci_ws, file_name=None):
    """
    Fetches a Narrative object with the given reference id (of the form ##/##).
    If a file_name is given, then it is printed to that file.
    If the narrative is found, the jsonized string of it is returned.

    If nothing is found, an empty Dict is returned.
    """
    ws_client = Workspace(url=url, token=auth_token)
    nar_data = ws_client.get_objects([{'ref': nar_id}])
    if len(nar_data) > 0:
        nar_json = json.dumps(nar_data[0])
        if file_name is not None:
            f = open(file_name, 'w')
            f.write(nar_json)
            f.close()
        return nar_json
    return {}


def upload_narrative(nar_file, auth_token, user_id, url=ci_ws, set_public=False):
    """
    Uploads a Narrative from a downloaded object file.
    This file needs to be in JSON format, and it expects all
    data and info that is usually returned by the Workspace.get_objects
    method.

    Returns a dict of three elements:
        ws: the id of the workspace that was created
        obj: the id of the narrative object
        ref: the above two joined together into an object ref (for convenience)
    """

    # read the file
    f = open(nar_file, 'r')
    nar = json.loads(f.read())
    f.close()

    # do some setup.
    current_nar_metadata = ws_metadata
    current_nar_metadata['narrative_nice_name'] = nar['data']['metadata']['name']
    ws_client = Workspace(url=url, token=auth_token)

    # create the new workspace for the narrative
    ws_info = ws_client.create_workspace({
        'workspace': '{}:{}'.format(user_id, str(time.time()).replace('.', '')),
        'meta': current_nar_metadata,
        'globalread': 'r' if set_public else 'n'
    })
    ws_id = ws_info[0]

    # setup and save the narrative object
    metadata = nar['info'][10]
    ws_save_obj = {
        'type': 'KBaseNarrative.Narrative',
        'data': nar['data'],
        'name': nar['info'][1],
        'meta': nar['info'][10],
        'provenance': [{
            'script': 'upload_narrative_test.py',
            'description': 'Temporary Narrative uploaded for automated testing'
        }]
    }
    obj_info = ws_client.save_objects({'id': ws_id,
                                       'objects': [ws_save_obj]})

    # tweak the workspace's metadata to properly present its narrative
    ws_client.alter_workspace_metadata({'wsi': {'id': ws_id}, 'new': {'narrative': obj_info[0][0]}})
    return {
        'ws': ws_info[0],
        'obj': obj_info[0][0],
        'refstr': '{}/{}'.format(ws_info[0], obj_info[0][0]),
        'ref': NarrativeRef({'wsid': ws_info[0], 'objid': obj_info[0][0]})
    }


def delete_narrative(ws_id, auth_token, url=ci_ws):
    """
    Deletes a workspace with the given id. Throws a ServerError if the user given
    by auth_token isn't allowed to do so.
    """
    ws_client = Workspace(url=url, token=auth_token)
    ws_client.delete_workspace({'id': ws_id})


def read_token_file(path):
    """
    Reads in a token file.
    A token file is just expected to have a single line in it - the token itself.
    """
    if not os.path.isfile(path):
        return None
    else:
        with open(path, 'r') as f:
            token = f.read().strip()
            f.close()
            return token


def read_json_file(path):
    """
    Generically reads in any JSON file and returns it as a dict.
    Especially intended for reading a Narrative file.
    """
    with open(path, 'r') as f:
        data = json.loads(f.read())
        f.close()
        return data


class MyTestCase(unittest.TestCase):
    def test_kvparse(self):
        for input, text, kvp in (
                ("foo", "foo", {}),
                ("name=val", "", {"name": "val"}),
                ("a name=val boy", "a boy", {"name": "val"})
        ):
            rkvp = {}
            rtext = util.parse_kvp(input, rkvp)
            self.assertEqual(text, rtext, "Text '{}' does not match "
                                          "result '{}' "
                                          "from input '{}'".format(
                                            text, rtext, input))
            self.assertEqual(text, rtext, "Dict '{}' does not match "
                                          "result '{}' "
                                          "from input '{}'".format(
                                            kvp, rkvp, input))


class SocketServerBuf(socketserver.TCPServer):
    allow_reuse_address = True

    def __init__(self, addr, handler):
        socketserver.TCPServer.__init__(self, addr, handler)
        self.buf = ""

    def get_data(self):
        """Get current buffer and clear it."""
        data, self.buf = self.buf, ""
        return data

    def server_close(self):
        self.socket.close()


def recvall(socket, n, timeout=0):
    buf, m, t = b'', 0, time.time()
    while m < n:
        if timeout > 0 and (time.time() - t > timeout):
            raise RuntimeError("Timeout")
        b = socket.recv(n - m)
        if b:
            buf += b
            m += len(b)
            # print("@@ recv {}".format(len(b)))
        else:
            time.sleep(0.1)
            # print("@@ recv 0/{}".format(n - m))
    return buf


class LogProxyMessageBufferer(socketserver.BaseRequestHandler):
    def handle(self):
        self.request.settimeout(1)
        while 1:
            try:
                hdr = self.request.recv(4)
            except Exception:
                return
            if not hdr:
                return
            size = struct.unpack('>L', hdr)[0]
            #  print("@@ body {}".format(size))
            if size < 65536:
                chunk = recvall(self.request, size, timeout=1)
                record = pickle.loads(chunk)
                # print("@@ message <{}>".format(record['msg']))
                self.server.buf += record['msg']


class NarrativeMessageBufferer(socketserver.StreamRequestHandler):
    def handle(self):
        # self.rfile is a file-like object created by the handler;
        # we can now use e.g. readline() instead of raw recv() calls
        self.data = self.rfile.readline().strip()
        # print("{} wrote:".format(self.client_address[0]))
        # print(self.data)
        self.server.buf += self.data.decode('utf-8')


def start_tcp_server(host, port, poll_interval, bufferer=LogProxyMessageBufferer):
    _log.info("Starting server on {}:{}".format(host, port))
    server = SocketServerBuf((host, port), bufferer)
    thr = threading.Thread(target=server.serve_forever,
                           args=[poll_interval])
    thr.daemon = True
    thr.start()
    return server, thr


def stop_tcp_server(server, thr):
    _log.info("Stopping server")
    server.shutdown()
    thr.join()
    _log.info("Stopped server")
    server.server_close()
    _log.info("Closed server")


def find_free_port() -> int:
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.bind(('', 0))
        return s.getsockname()[1]


if __name__ == '__main__':
    unittest.main()
