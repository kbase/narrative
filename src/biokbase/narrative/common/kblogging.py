"""
Common narrative logging functions.

Other biokbase modules can use the logging like this:

    from biokbase.narrative.common.kblogging import get_logger
    _log = get_logger(__name__)

Log messages can be free-form, *but* the desired format is:

    Event_name;Key1=value1 Key2=Value2 (..etc..)

In this format the "Event_name" is taken as the canonical name of what event in the
system this is logging and the Key/value pairs are parsed into a mapping.
Any non-key/value text will be combined into a single text field.

Logging to MongoDB will be enabled, via proxy, if the proxy is
running on the pre-configured host/port
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '2014-07-31'

import collections
import logging
from logging import handlers
import os
import re
import socket
import threading
import time
# Local
from .util import kbase_env
from . import log_proxy

## Constants

KBASE_TMP_DIR = "/tmp"
KBASE_TMP_LOGFILE = os.path.join(KBASE_TMP_DIR, "kbase-narrative.log")

# env var with location of proxy config file
KBASE_PROXY_ENV = 'KBASE_PROXY_CONFIG'

## Internal logging

_log = logging.getLogger("kblogging")
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s %(name)s: %(message)s"))
_log.addHandler(_h)
lvl = logging.DEBUG if os.environ.get('KBASE_DEBUG', False) else logging.WARN
_log.setLevel(lvl)

## Functions

def get_logger(name="", init=False):
    """Get a given KBase log obj.

    :param name: name (a.b.c) of the logging namespace, which may be
                 relative or absolute (starting with 'biokbase.'), or
                 empty in which case the 'biokbase' logger is returned
    :param init: If true, re-initialize the file/socket log handlers
    :return: Log object
    :rtype: LogAdapter
    """
    if init:
        reset_handlers()
    log = logging.getLogger(_kbase_log_name(name))
    return LogAdapter(log, _get_meta())

def _kbase_log_name(name):
    # no name => root
    if not name:
        return "biokbase"
    # absolute name
    if name.startswith("biokbase."):
        return name
    # relative name
    return "biokbase." + name

def log_event(log, event, mapping):
    """Log an event and a mapping."""
    kvp = " ".join(["{}={}".format(k, v) for k, v in mapping.iteritems()])
    log.info("{}{}{}".format(event, log_proxy.EVENT_MSG_SEP, kvp))

class LogAdapter(logging.LoggerAdapter):
    """Add some extra methods to the stock LoggerAdapter."""
    def __init__(self, log, extra):
        logging.LoggerAdapter.__init__(self, log, extra)
        self.handlers = log.handlers
        self.addHandler = log.addHandler
        self.removeHandler = log.removeHandler
        self.setLevel = log.setLevel
        self.isEnabledFor = log.isEnabledFor
        self.file_handler, self.socket_handler = None, None

    def addHandler(self, h):
        """Track known handlers for efficient access later."""
        if isinstance(h, logging.FileHandler):
            self.file_handler = h
        elif isinstance(h, handlers.SocketHandler):
            self.socket_handler = h
        self.logger.addHandler(h)

    def removeHandler(self, h):
        """Track known handlers for efficient access later."""
        if isinstance(h, logging.FileHandler):
            self.file_handler = None
        elif isinstance(h, handlers.SocketHandler):
            self.socket_handler = None
        self.logger.removeHandler(h)

    def shutdown(self):
        """Close and remove all handlers."""
        map(self.removeHandler, self.handlers)


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
        """Format with metadata in the mix."""
        logging.Formatter.__init__(
            self,
            "%(levelname)s %(asctime)s %(name)s %(message)s")

    def format(self, record):
        """Add KB_* environment values at format time."""
        s = logging.Formatter.format(self, record)
        return "{} [{}]".format(s, ' '.join(["{}={}".format(k, v)
                                             for k, v in os.environ.items()
                                             if k.startswith('KB_')]))

class BufferedSocketHandler(handlers.SocketHandler):
    """Proxy for another handler that always returns immediately
    and queues up messages to send.
    """
    def __init__(self, *args):
        handlers.SocketHandler.__init__(self, *args)
        _log.debug("Created SocketHandler with args = {}".format(args))
        self.buf = collections.deque([], 100)
        self.buf_lock = threading.Lock()
        # start thread to send data from buffer
        self.thr = threading.Thread(target=self.emitter)
        self.thr.daemon = True
        self._stop = False
        self.thr.start()

    def close(self):
        if self.thr:
            self._stop = True
            self.thr.join()
            self.thr = None
        handlers.SocketHandler.close(self)

    def emitter(self):
        while not self._stop:
            try:
                self.buf_lock.acquire()
                item = self.buf.popleft()
                if not self._emit(item):
                    self.buf.appendleft(item)
                    self.buf_lock.release()
                    time.sleep(0.1)
                else:
                    self.buf_lock.release()
            except IndexError:
                self.buf_lock.release()
                time.sleep(0.1)

    def emit(self, record):
        if _log.isEnabledFor(logging.DEBUG):
            _log.debug("Emit 1 record")
        self.buf_lock.acquire()
        try:
            self.buf.append(record)
        finally:
            self.buf_lock.release()

    def _emit(self, record):
        """Re-implement to return a success code."""
        success = False
        try:
            s = self.makePickle(record)
            self.send(s)
            success = True
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception as err:
            _log.debug("Emit record to socket failed: {}".format(err))
            self.handleError(record)
        if success and _log.isEnabledFor(logging.DEBUG):
            _log.debug("Record sent to socket")
        return success


def init_handlers():
    """Initialize and add the log handlers."""
    # Turn on debugging by setting environment variable KBASE_DEBUG.
    if os.environ.get("KBASE_DEBUG", None):
        g_log.setLevel(logging.DEBUG)
    else:
        g_log.setLevel(logging.INFO)

    if not g_log.file_handler:
        hndlr = logging.FileHandler(KBASE_TMP_LOGFILE)
        hndlr.setFormatter(MetaFormatter())
        g_log.addHandler(hndlr)

    if not g_log.socket_handler:
        cfg = get_proxy_config()
        sock_handler = BufferedSocketHandler(cfg.host, cfg.port)
        g_log.addHandler(sock_handler)

def get_proxy_config():
    config_file = os.environ.get(KBASE_PROXY_ENV, None)
    if config_file:
        _log.info("Configuring KBase logging from file '{}'".format(config_file))
    else:
        _log.info("Configuring KBase logging from defaults ({} is empty, or not found)"
                  .format(KBASE_PROXY_ENV))
    return log_proxy.ProxyConfiguration(config_file)

def reset_handlers():
    """Remove & re-add all handlers."""
    while g_log.handlers:
        g_log.removeHandler(g_log.handlers.pop())
    init_handlers()

## Run the rest of this on import

# Get root log obj.
g_log = get_logger()

# If no handlers, initialize them
if not g_log.handlers:
    init_handlers()
