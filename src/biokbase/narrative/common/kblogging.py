"""
Common narrative logging functions.


To log an event with proper metadata and formatting use 'log_event':

You can also do free-form logs, but these will be ignored by
most upstream consumers.

"""
import collections
import json
import logging
import os
import threading
import time
import uuid
from datetime import datetime, timezone
from logging import handlers

import biokbase

from . import log_proxy
from .log_common import format_event
from .narrative_logger import NarrativeLogger
# Local
from .util import kbase_env

__author__ = "Dan Gunter <dkgunter@lbl.gov>"
__date__ = "2014-07-31"

# Constants

KBASE_TMP_DIR = "/tmp"
KBASE_TMP_LOGFILE = os.path.join(KBASE_TMP_DIR, "kbase-narrative.log")

KBASE_UI_LOGFILE = os.path.join(KBASE_TMP_DIR, "kbase-narrative-ui.json")

# env var with location of proxy config file
KBASE_PROXY_ENV = "KBASE_PROXY_CONFIG"

# Internal logging

_log = logging.getLogger("tornado.application")
_narr_log = NarrativeLogger()

# WTF is going on logging
# def _logdbg(m):
#    open("/tmp/wtf", "a").write(m + "\n")

# External functions


def get_narrative_logger():
    """Get a Narrative logger that talks to the Logstash store.

    This doesn't do the usual write-to-syslog thing, but opens a socket to
    Logstash, and writes a hunk of JSON to it. It probably doesn't make sense to use
    the typical Python logging library, I don't think.

    It's really intended for specific events that should be collated and used for metrics.
    """
    return _narr_log


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
    return logging.getLogger(_kbase_log_name(name))


def log_event(log, event, mapping):
    """Log an event and a mapping.

    For example::

        log_event(_log, "collision", {"who":"unstoppable force",
                  "with":"immovable object", "where":"kbase"})
    """
    msg = format_event(event, mapping)
    log.info(msg)


# Internal functions and classes


def _kbase_log_name(name):
    """Smarter name of KBase logger."""
    # no name => root
    if not name:
        return "biokbase"
    # absolute name
    if name.startswith("biokbase."):
        return name
    # relative name
    return "biokbase." + name


def _has_handler_type(log, type_):
    return any([isinstance(h, type_) for h in log.handlers])


# Custom handlers


class BufferedSocketHandler(handlers.SocketHandler):
    """Buffer up messages to a socket, sending them asynchronously.
    Starts a separate thread to pull messages off and send them.
    Ignores any messages that did not come from `log_event()`, above.
    """

    def __init__(self, *args):
        handlers.SocketHandler.__init__(self, *args)
        self._dbg = _log.isEnabledFor(logging.DEBUG)
        if self._dbg:
            _log.debug("Created SocketHandler with args = {}".format(args))
        self.buf = collections.deque([], 100)
        self.buf_lock = threading.Lock()
        # start thread to send data from buffer
        self.thr = threading.Thread(target=self.emitter)
        self.thr.daemon = True
        self._stop = False
        self.extra = {}
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
        if self._skip(record):
            return
        # stuff 'extra' from environment into record
        # _logdbg("@@ stuffing into record: {}".format(kbase_env))
        record.__dict__.update(kbase_env)
        if "auth_token" in record.__dict__:
            del record.__dict__["auth_token"]
        self.buf_lock.acquire()
        try:
            self.buf.append(record)
        finally:
            self.buf_lock.release()

    def _skip(self, record):
        """Return True if this record should not go to a socket"""
        # Do not forward records that didn't get logged through
        # kblogging.log_event
        if record.funcName != "log_event":
            if self._dbg:
                _log.debug("Skip: funcName {} != log_event".format(record.funcName))
            return

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
    """Initialize and add the log handlers.
    We only allow one FileHandler and one SocketHandler to exist,
    no matter how many times this is called.
    """
    # Turn on debugging by setting environment variable KBASE_DEBUG.
    if os.environ.get("KBASE_DEBUG", None):
        g_log.setLevel(logging.DEBUG)
    else:
        g_log.setLevel(logging.INFO)

    if not _has_handler_type(g_log, logging.FileHandler):
        hndlr = logging.FileHandler(KBASE_TMP_LOGFILE)
        #  hndlr = logging.StreamHandler(sys.stdout)
        fmtr = logging.Formatter("%(levelname)s %(asctime)s %(name)s %(message)s")
        hndlr.setFormatter(fmtr)
        g_log.addHandler(hndlr)

    if not _has_handler_type(g_log, handlers.SocketHandler):
        cfg = get_proxy_config()
        g_log.debug("Opening socket to proxy at {}:{}".format(cfg.host, cfg.port))
        sock_handler = BufferedSocketHandler(cfg.host, cfg.port)
        g_log.addHandler(sock_handler)


def get_proxy_config():
    config_file = os.environ.get(KBASE_PROXY_ENV, None)
    if config_file:
        _log.info("Configuring KBase logging from file '{}'".format(config_file))
    else:
        _log.warning(
            "Configuring KBase logging from defaults ({} is empty, or not found)".format(
                KBASE_PROXY_ENV
            )
        )
    #    return log_proxy.ProxyConfiguration(config_file)
    return log_proxy.ProxyConfigurationWrapper(config_file)


def reset_handlers():
    """Remove & re-add all handlers."""
    while g_log.handlers:
        g_log.removeHandler(g_log.handlers.pop())
    init_handlers()


# Run the rest of this on import

# Get root log obj.
g_log = get_logger()

# If no handlers, initialize them
if not g_log.handlers:
    init_handlers()


class NarrativeUIError(object):
    """Created by Narrative UI javascript on an error."""

    ui_log = get_logger("narrative_ui")

    def __init__(self, is_fatal, where="unknown location", what="unknown condition"):
        info = {"function": where, "msg": what}
        msg = format_event("ui.error", info)
        log_method = (self.ui_log.error, self.ui_log.critical)[is_fatal]
        log_method(msg)

def epoch_time_millis():
    epoch_time = datetime.now(tz=timezone.utc).timestamp()
    return int(epoch_time * 1000)

def get_username():
    token = biokbase.auth.get_auth_token()
    if token is None:
        return None
    try:
        user_info = biokbase.auth.get_user_info(token)
        return user_info.get("user", None)
    except BaseException:
        return None
        
def log_ui_event(event: str, data: dict, level: str):
    # We use a separate logger, configured to save the 
    # entire message as a simple string ... and that string
    # is a JSON-encoded message object.
    # The resulting log file, then, is y it is a JSON stream format, since it
    # contains multiple objects in sequence.
    ui_log = get_logger("narrative_ui_json")
    log_id = str(uuid.uuid4())
    if not _has_handler_type(ui_log, logging.FileHandler):
        # Here we may change the logging handler to something like HTTP, syslog, io stream, 
        # see https://docs.python.org/3/library/logging.handlers.html
        handler = logging.FileHandler(KBASE_UI_LOGFILE)
        formatter = logging.Formatter("%(message)s")
        handler.setFormatter(formatter)
        ui_log.addHandler(handler)

   
    #
    # The logging message is simply what, when, who, where, and ... data
    # There could be other interesting information such as 
    #
    [_, workspace_id, _, object_id] = kbase_env.narrative.split(".")

    
    message = json.dumps({
        # If logs are combined, we need to tie log entries to 
        # a specific version of a service in a specific environment.
        "service": "narrative",
        "version": biokbase.narrative.version(),
        "environment": kbase_env.env,
        # General log entry; information that any log entry
        # will need. 
        # id helps create a unique reference to a log entry; perhaps
        # should be uuid, service + uuid, or omitted and only created
        # by a logging repository service. 
        "id": log_id,
        "timestamp": epoch_time_millis(),
        # The actual, specific event. The event name is a simple
        # string, the data is a dict or serializable class whose
        # definition is implied by the event name.
        "event": {
            "name": event,
            # the event context captures information common to instances 
            # of this kind of event. As a narrative ui event, part of the context
            # is the narrative object, the current user, and the current user's
            # browser. Clearly more could be captured here, e.g. the browser model,
            # narrative session id, etc.
            "context": {
                # I tried to update kbase_env to reflect the current narrative ref,
                # but no no avail so far. The kbase_env here is not the same as the 
                # one used when saving a narrative and getting the new version, so it does
                # not reflect an updated narrative object version.
                # If that isn't possible, we can store the ws and object id instead.
                "narrative_ref": kbase_env.narrative_ref,
                # Log entries for authenticated contexts should identify the user
                "username": kbase_env.user,
                # Log entries resulting from a network call can/should identify
                # the ip address of the caller
                "client_ip": kbase_env.client_ip
                # could be more context, like the jupyter / ipython / etc. versions
            },
            # This is the specific data sent in this logging event
            "data": data
        }
    })

    if level == 'debug':
        ui_log.debug(message)
    elif level == 'info':
        ui_log.info(message)
    elif level == 'warning':
        ui_log.warning(message)
    elif level == 'error':
        ui_log.error(message)
    elif level == 'critical':
        ui_log.critical(message)
    else:
        raise ValueError(f"log level must be one of debug, info, warning, error, or critical; it is '{level}'")
    return log_id
