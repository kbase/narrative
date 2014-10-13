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
from logging.handlers import SocketHandler
import os
import re
import socket
# IPython
import IPython
# Local
from .util import kbase_env
from . import log_proxy

## Constants

KBASE_TMP_DIR = "/tmp"
KBASE_TMP_LOGFILE = os.path.join(KBASE_TMP_DIR, "kbase-narrative.log")

# env var with location of proxy config file
KBASE_PROXY_ENV = 'KB_PROXY_CONFIG'

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

    adapter = LogAdapter(log, _get_meta())

    return adapter

def log_event(log, event, mapping):
    """Log an event and a mapping.
    """
    kvp = " ".join(["{}={}".format(k, v) for k, v in mapping.iteritems()])
    log.info("{}{}{}".format(event, log_proxy.EVENT_MSG_SEP, kvp))

class LogAdapter(logging.LoggerAdapter):
    """
    Add some extra methods to the stock LoggerAdapter
    """
    def __init__(self, log, extra):
        logging.LoggerAdapter.__init__(self, log, extra)
        self.handlers = log.handlers
        self.addHandler = log.addHandler
        self.removeHandler = log.removeHandler
        self.setLevel = log.setLevel
        self.isEnabledFor = log.isEnabledFor

def _get_meta():
    meta = {}


    # Auth values
    token = kbase_env.auth_token

    if token:
        # User
        m = re.search('un=([^|]+)', token)
        if m is not None:
            meta['user'] = m.group(1)

    # Session id
    sess = kbase_env.session
    if sess:
        meta['session_id'] = sess

    # Notebook name
    if kbase_env.narrative:
        meta['narr'] = kbase_env.narrative

    return meta


class MetaFormatter(logging.Formatter):
    def __init__(self):
        """
        Format with metadata in the mix.
        """
        logging.Formatter.__init__(
            self,
            "%(levelname)s %(asctime)s %(name)s %(message)s")

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
        g_log.setLevel(logging.DEBUG)
    else:
        g_log.setLevel(logging.INFO)

    # Add log handler and assoc. formatter for metadata
    hndlr = logging.FileHandler(KBASE_TMP_LOGFILE)
    hndlr.setFormatter(MetaFormatter())
    g_log.addHandler(hndlr)

    # If local forwarder is available, add that one too
    has_local_forwarder = True
    config_file = os.environ.get(KBASE_PROXY_ENV, None)
    proxy_config = log_proxy.ProxyConfiguration(config_file)
    # Attempt a connection
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((proxy_config.host, proxy_config.port))
    except socket.error:
        has_local_forwarder = False
        g_log.debug("init_handlers local_forwarder=false")
    # If connection succeeds, add a logging.handler
    if has_local_forwarder:
        g_log.debug("init_handlers local_forwarder=true")
        sock_handler = SocketHandler(proxy_config.host,
                                     proxy_config.port)
        g_log.addHandler(sock_handler)
    else:
        g_log.debug("init_handlers local_forwarder=false")

def reset_handlers():
    """Remove & re-add all handlers.
    """
    while g_log.handlers:
        g_log.removeHandler(g_log.handlers.pop())
    init_handlers()

## Run the rest of this on import

# Get root log obj.
g_log = get_logger()

# If no handlers, initialize them
if not g_log.handlers:
    init_handlers()
