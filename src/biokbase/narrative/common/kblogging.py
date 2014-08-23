"""
Common narrative logging functions.

Other biokbase modules can use the logging like this:

    from biokbase.narrative.common.kblogging import get_logger
    _log = get_logger(__name__)

Log messages are free-form, *but* the MongoDB handler will break any
parts of the message in the form '<key>=<value>' into their own fields
in the MongoDB record.

Logging to MongoDB will be enabled, via proxy, if the proxy is
running on the pre-configured host/port
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '2014-07-31'

import logging
import os
import re
import socket
# Local
from .util import kbase_env
from . import log_proxy

## Constants

KBASE_TMP_DIR = "/tmp"
KBASE_TMP_LOGFILE = os.path.join(KBASE_TMP_DIR, "kbase-narrative.log")

## Functions


def get_logger(name=""):
    """Get a given KBase log obj.

    :param name: name (a.b.c) of the logging namespace, which may be
                 relative or absolute (starting with 'biokbase.'), or
                 empty in which case the root logger is returned
    :return: Log object
    :rtype: logging.Logger
    """
    # no name => root
    if not name:
        log = logging.getLogger("biokbase")
    # absolute name
    elif name.startswith("biokbase."):
        log = logging.getLogger(name)
    # relative name
    else:
        log = logging.getLogger("biokbase." + name)

    adapter = logging.LoggerAdapter(log, _get_meta())
    return log


def _get_meta():
    meta, empty = {}, '?'

    # User
    result, token = empty, kbase_env.auth_token
    if token:
        m = re.search('un=([^|]+)', token)
        if m is not None:
            result = m.group(1)
    meta['user'] = result

    # Notebook name
    result = kbase_env.narrative or empty
    meta['narr'] = result

    # Session id
    result, token = empty, kbase_env.auth_token
    if token:
        m = re.search('tokenid=([^|]+)', token)
        if m is not None:
            result = m.group(1)
    meta['session_id'] = result

    return meta


class MetaFormatter(logging.Formatter):
    def __init__(self):
        """
        Format with metadata in the mix.
        """
        logging.Formatter.__init__(
            self,
            "%(levelname)s %(asctime)s %(name)s user=%(user)s "
            "narr=%(narr)s %(message)s")

    def format(self, record):
        """
        Add KB_* environment values at format time.
        """
        s = logging.Formatter.format(self, record)
        return "{} [{}]".format(s, ' '.join(["{}={}".format(k, v)
                                           for k, v in os.environ.items()
                                           if k.startswith('KB_')]))


def init_handlers():
    """
    Initialize and add the log handlers.
    """
    # Turn on debugging by setting environment variable KBASE_DEBUG.
    if os.environ.get("KBASE_DEBUG", None):
        _log.setLevel(logging.DEBUG)
    else:
        _log.setLevel(logging.INFO)

    # Add log handler and assoc. formatter for metadata
    hndlr = logging.FileHandler(KBASE_TMP_LOGFILE)
    hndlr.setFormatter(MetaFormatter())
    _log.addHandler(hndlr)

    # If local forwarder is available, add that one too
    has_local_forwarder = True
    proxy_config = log_proxy.ProxyConfiguration()
    # Attempt a connection
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((proxy_config.host, proxy_config.port))
    except socket.error:
        has_local_forwarder = False
    # If connection succeeds, add a logging.handler
    if has_local_forwarder:
        sock_handler = logging.handlers.Sockethandler(proxy_config.host,
                                                      proxy_config.port)
        _log.addHandler(sock_handler)

## Run the rest of this on import

# Get root log obj.
_log = get_logger()

# If no handlers, initialize them
if not _log.handlers:
    init_handlers()
