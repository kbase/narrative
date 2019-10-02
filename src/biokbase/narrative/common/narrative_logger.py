import json
import socket
from .url_config import URLS
from .util import kbase_env

"""
A simple ELK stack logger for a few Narrative events.
"""

# TODO:
# * add more log events (or generalize further. don't much like using magic strings, tho)
# * TESTS
# * local log testing mode, for when we point this to the prod logstash
# * include environment


class NarrativeLogger(object):
    """
    This is a very simple logger that talks to Elastic search.
    It's initialized from the internally configured log host and port, along with
    the environment it uses. On each log event, it opens a socket to Elastic, writes a
    JSON packet, then closes off the socket. If there's any errors while writing, it just
    ignores them and moves on - if we lose a log or two, it's not a big deal.
    """
    def __init__(self):
        self.host = URLS.log_host
        self.port = URLS.log_port
        self.env = kbase_env.env

    def _log_event(self, event, context):
        # If there's no log host, do nothing
        if self.host is None or self.port is None:
            return

        message = {
            "type": "narrative",
            "user": kbase_env.user,
            "operation": event,
            "env": self.env
        }
        message.update(context)
        log_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            log_socket.connect((self.host, self.port))
            log_socket.sendall(json.dumps(message) + "\n")
        except:
            pass  # just bomb out silently. We can lose a log or two.
        finally:
            log_socket.close()

    def narrative_open(self, narrative, version):
        self._log_event("open", {"narrative": narrative, "narr_ver": version})

    def narrative_save(self, narrative, version):
        self._log_event("save", {"narrative": narrative, "narr_ver": version})
