"""Test utility functions."""

import configparser
import json
import logging
import os
import pickle
import socket
import socketserver
import struct
import threading
import time
import unittest
from contextlib import closing
from types import NoneType
from typing import Any

from biokbase.installed_clients.WorkspaceClient import Workspace
from biokbase.narrative.common.narrative_ref import NarrativeRef
from biokbase.narrative.jobs.jobcomm import (
    PARAM,
    JobRequest,
)

BATCH_ID = PARAM["BATCH_ID"]
JOB_ID = PARAM["JOB_ID"]
JOB_ID_LIST = PARAM["JOB_ID_LIST"]
CELL_ID_LIST = PARAM["CELL_ID_LIST"]


_log = logging.getLogger("kbtest")
_hnd = logging.StreamHandler()
_hnd.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s %(name)s: %(message)s"))
_log.addHandler(_hnd)
_log.setLevel(logging.DEBUG)


prod_ws = "https://kbase.us/services/ws"
ci_ws = "https://ci.kbase.us/services/ws"
ws_metadata = {"is_temporary": False, "narrative_nice_name": None}
_config_file = "test.cfg"


def test_logger(name):
    return logging.getLogger("kbtest." + name)


class ConfigTests:
    """Test config and utility functions."""

    def __init__(self: "ConfigTests") -> None:
        """Init the config tests object and read in the config."""
        self._path_prefix = os.path.join(
            os.environ["NARRATIVE_DIR"], "src", "biokbase", "narrative", "tests"
        )
        self._path_root = os.path.join(os.environ["NARRATIVE_DIR"])
        self.config_file_path = self.file_path(_config_file)
        self._config = configparser.ConfigParser()
        self._config.read(self.config_file_path)

    def get(self: "ConfigTests", *args: str, **kwargs: dict[str, Any]) -> str:
        """Get a variable from the config."""
        return self._config.get(*args, **kwargs)

    def get_path(self: "ConfigTests", *args: str, **kwargs: dict[str, Any]) -> str:
        """Return the file path for a given file in the config."""
        from_root = False
        if "from_root" in kwargs and kwargs["from_root"] is True:
            from_root = kwargs["from_root"]
            del kwargs["from_root"]
        val = self.get(*args, **kwargs)
        return self.file_path(val, from_root)

    def load_json_file(self: "ConfigTests", filename: str) -> dict[str, Any]:
        """Reads, parses, and returns as a dict, a JSON file.

        The filename parameter is expected to be a path relative to this file's expected
        location in <narrative_root>/src/biokbase/narrative/tests
        """
        json_file_path = self.file_path(filename)
        with open(json_file_path) as f:
            data = json.loads(f.read())
            f.close()
            return data

    def write_json_file(self: "ConfigTests", filename: str, data: dict[str, Any]) -> None:
        json_file_path = self.file_path(filename)
        with open(json_file_path, "w") as f:
            f.write(json.dumps(data, indent=4, sort_keys=True))
            f.close()

    def file_path(self: "ConfigTests", filename: str, from_root: bool = False) -> str:
        """Returns the path to the filename, relative to this file's expected location.

        <narrative root>/src/biokbase/narrative/tests
        """
        if from_root:
            return os.path.join(self._path_root, filename)
        return os.path.join(self._path_prefix, filename)


def fetch_narrative(nar_id, auth_token, url=ci_ws, file_name=None):
    """Fetches a Narrative object with the given reference id (of the form ##/##).

    If a file_name is given, then it is printed to that file.
    If the narrative is found, the jsonized string of it is returned.

    If nothing is found, an empty Dict is returned.
    """
    ws_client = Workspace(url=url, token=auth_token)
    nar_data = ws_client.get_objects([{"ref": nar_id}])
    if len(nar_data) > 0:
        nar_json = json.dumps(nar_data[0])
        if file_name is not None:
            with open(file_name, "w") as f:
                f.write(nar_json)
                f.close()
        return nar_json
    return {}


def upload_narrative(
    nar_file: str, auth_token: str, user_id, url: str = ci_ws, set_public: bool = False
) -> dict[str, Any]:
    """Uploads a Narrative from a downloaded object file.

    This file needs to be in JSON format, and it expects all
    data and info that is usually returned by the Workspace.get_objects
    method.

    Returns a dict of three elements:
        ws: the id of the workspace that was created
        obj: the id of the narrative object
        ref: the above two joined together into an object ref (for convenience)
    """
    # read the file
    with open(nar_file) as f:
        nar = json.loads(f.read())
        f.close()

    # do some setup.
    current_nar_metadata = ws_metadata
    current_nar_metadata["narrative_nice_name"] = nar["data"]["metadata"]["name"]
    ws_client = Workspace(url=url, token=auth_token)

    # create the new workspace for the narrative
    ws_info = ws_client.create_workspace(
        {
            "workspace": "{}:{}".format(user_id, str(time.time()).replace(".", "")),
            "meta": current_nar_metadata,
            "globalread": "r" if set_public else "n",
        }
    )
    ws_id = ws_info[0]

    # setup and save the narrative object
    nar["info"][10]
    ws_save_obj = {
        "type": "KBaseNarrative.Narrative",
        "data": nar["data"],
        "name": nar["info"][1],
        "meta": nar["info"][10],
        "provenance": [
            {
                "script": "upload_narrative_test.py",
                "description": "Temporary Narrative uploaded for automated testing",
            }
        ],
    }
    obj_info = ws_client.save_objects({"id": ws_id, "objects": [ws_save_obj]})

    # tweak the workspace's metadata to properly present its narrative
    ws_client.alter_workspace_metadata({"wsi": {"id": ws_id}, "new": {"narrative": obj_info[0][0]}})
    return {
        "ws": ws_info[0],
        "obj": obj_info[0][0],
        "refstr": f"{ws_info[0]}/{obj_info[0][0]}",
        "ref": NarrativeRef({"wsid": ws_info[0], "objid": obj_info[0][0]}),
    }


def delete_narrative(ws_id, auth_token, url=ci_ws):
    """Deletes a workspace with the given id.

    Throws a ServerError if the user given by auth_token isn't allowed to do so.
    """
    ws_client = Workspace(url=url, token=auth_token)
    ws_client.delete_workspace({"id": ws_id})


def read_token_file(path: str) -> str | None:
    """Reads in a token file.

    A token file is just expected to have a single line in it - the token itself.
    """
    if not os.path.isfile(path):
        return None

    with open(path) as f:
        token = f.read().strip()
        f.close()
        return token


def read_json_file(path: str) -> dict[str, Any] | list[Any]:
    """Generically reads in any JSON file and returns it as a dict.

    Especially intended for reading a Narrative file.
    """
    with open(path) as f:
        data = json.loads(f.read())
        f.close()
        return data


class SocketServerBuf(socketserver.TCPServer):
    allow_reuse_address = True

    def __init__(self, addr, handler) -> None:
        socketserver.TCPServer.__init__(self, addr, handler)
        self.buf = ""

    def get_data(self):
        """Get current buffer and clear it."""
        data, self.buf = self.buf, ""
        return data

    def server_close(self):
        self.socket.close()


def recvall(socket, n, timeout=0):
    buf, m, t = b"", 0, time.time()
    while m < n:
        if timeout > 0 and (time.time() - t > timeout):
            raise RuntimeError("Timeout")
        b = socket.recv(n - m)
        if b:
            buf += b
            m += len(b)
        else:
            time.sleep(0.1)
    return buf


class LogProxyMessageBufferer(socketserver.BaseRequestHandler):
    def handle(self):
        self.request.settimeout(1)
        while True:
            try:
                hdr = self.request.recv(4)
            except Exception:
                return
            if not hdr:
                return
            size = struct.unpack(">L", hdr)[0]
            if size < 65536:
                chunk = recvall(self.request, size, timeout=1)
                record = pickle.loads(chunk)
                self.server.buf += record["msg"]


class NarrativeMessageBufferer(socketserver.StreamRequestHandler):
    def handle(self):
        # self.rfile is a file-like object created by the handler;
        # we can now use e.g. readline() instead of raw recv() calls
        self.data = self.rfile.readline().strip()
        self.server.buf += self.data.decode("utf-8")


def start_tcp_server(host, port, poll_interval, bufferer=LogProxyMessageBufferer):
    _log.info(f"Starting server on {host}:{port}")
    server = SocketServerBuf((host, port), bufferer)
    thr = threading.Thread(target=server.serve_forever, args=[poll_interval])
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
        s.bind(("", 0))
        return s.getsockname()[1]


def validate_job_state(job_state: dict) -> None:
    """Validates the structure and entries in a job state as returned by the JobManager.

    If any keys are missing, or extra keys exist, or values are weird, then this
    raises an AssertionError.
    """
    assert "jobState" in job_state, "jobState key missing"
    assert isinstance(job_state["jobState"], dict), "jobState is not a dict"
    assert "outputWidgetInfo" in job_state, "outputWidgetInfo key missing"
    assert isinstance(
        job_state["outputWidgetInfo"], dict | NoneType
    ), "outputWidgetInfo is not a dict or None"
    state = job_state["jobState"]
    # list of tuples - first = key name, second = value type
    # details for other cases comes later. This is just the expected basic set of
    # keys for EVERY job, once it's been created in EE2.

    state_keys = {
        "required": {
            "job_id": str,
            "status": str,
            "created": int,
        },
        "optional": {
            "batch_id": (NoneType, str),
            "batch_job": bool,
            "child_jobs": list,
            "cell_id": (NoneType, str),
            "error": dict,
            "errormsg": str,
            "error_code": int,
            "finished": int,
            "parent_job_id": (NoneType, str),
            "queued": int,
            "retry_count": int,
            "retry_ids": list,
            "run_id": (NoneType, str),
            "running": int,
            "terminated_code": int,
            "user": str,
            "wsid": int,
        },
    }

    for requiredness in ["required", "optional"]:
        for attr, type_list in state_keys[requiredness].items():
            if requiredness == "required":
                assert attr in state, f"attribute {attr} ({requiredness}) is missing from state"
            if attr in state:
                assert isinstance(state[attr], type_list), (
                    f"{state[attr]} does not match type(s) {type_list}: " + json.dumps(state[attr])
                )


def make_job_request(
    msg_type: str,
    job_id_like: str | list[str] | dict[str, Any],
    content: dict[str, Any] | None = None,
) -> JobRequest:
    """Make a JobRequest object."""
    comm_msg = make_comm_msg(msg_type, job_id_like, content)
    return JobRequest(comm_msg)


def make_comm_msg(
    msg_type: str,
    job_id_like: None | str | list[str] | dict[str, Any],
    content: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Generate the comm message for a given set of params."""
    if content is None:
        content = {}
    job_arguments = {}
    if isinstance(job_id_like, dict):
        job_arguments = job_id_like
    elif isinstance(job_id_like, list):
        job_arguments[JOB_ID_LIST] = job_id_like
    elif job_id_like:
        job_arguments[JOB_ID] = job_id_like

    return {
        "msg_id": "some_id",
        "content": {"data": {"request_type": msg_type, **job_arguments, **content}},
    }


if __name__ == "__main__":
    unittest.main()
