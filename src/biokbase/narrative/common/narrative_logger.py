import json
import socket
from .url_config import URLS
from .util import kbase_env


class NarrativeLogger(object):
    def __init__(self):
        self.host = URLS.log_host
        self.port = URLS.log_port
        self._open_socket()

    def _open_socket(self):
        self._log_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._log_socket.connect((self.host, self.port))

    def _log_event(self, event, context):
        message = {
            "type": "narrative",
            "user": kbase_env.user,
            "operation": event
        }
        message.update(context)
        try:
            self._log_socket.sendall(json.dumps(message) + "\n")
        except:
            # assume the socket's dead. re-init and try again. Just once, though.
            self._log_socket.close()
            self._open_socket()
            self._log_event(event, context)

    def narrative_open(self, narrative, version):
        self._log_event("open", {"narrative": narrative, "narr_ver": version})

    def narrative_save(self, narrative, version):
        self._log_event("save", {"narrative": narrative, "narr_ver": version})
