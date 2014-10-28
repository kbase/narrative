"""
Simple client for testing (or maybe sending from bash) to the
log proxy (over a socket)
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '8/26/14'

# System imports
import argparse
import logging
import os
import signal
import sys
import time
# Local imports
from biokbase.narrative.common.kblogging import get_logger, reset_handlers
from biokbase.narrative.common import log_proxy as proxy

logging.basicConfig()
g_log = logging.getLogger()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("event", type=str, default="test",
                      help="Name of event (default=%(default)s")
    parser.add_argument("message", type=str, default="",
                      help="Text and/or <key>=<value> pairs for the message")
    parser.add_argument("-p", "--proxy", default=False, dest="start_proxy",
                        action="store_true",
                        help="Start log proxy before sending message")
    parser.add_argument("-v", "--verbose", dest="vb", action="count",
                        default=0, help="Increase verbosity")
    args = parser.parse_args()
    return args

class ProxyArgs:
    conf = "/tmp/kbase_logforward.conf"
    vb = 0

def send_message(event, message):
    g_log.info("Sending log message")
    kblog = get_logger("test")
    kblog.info("{}{}{}".format(event, proxy.EVENT_MSG_SEP, message))

def main(args):
    level = (logging.WARN, logging.INFO, logging.DEBUG)[min(args.vb, 2)]
    g_log.setLevel(level)

    g_log.info("init.start")

    if args.start_proxy:
        cfg = 'db: test\ncollection: kblog\n'
        with open(ProxyArgs.conf, "w") as f:
            f.write(cfg)
        g_log.info("Starting log proxy with config:\n{}".format(cfg))
        pid = os.fork()
        if pid == 0:
            ProxyArgs.vb = args.vb
            proxy.main(ProxyArgs)
        else:
            time.sleep(2)
            reset_handlers()
            send_message(args.event, args.message)
            time.sleep(1)
            g_log.debug("Killing {:d}".format(pid))
            os.kill(pid, signal.SIGKILL)
            g_log.info("Waiting for {:d} to stop".format(pid))
            os.waitpid(pid, 0)
    else:
        send_message(args.event, args.message)

    return 0

if __name__ == '__main__':
    sys.exit(main(parse_args()))
