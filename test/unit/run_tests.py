# Adapted from a Karma test startup script
# developebd by the Jupyter team here;
# https://github.com/jupyter/jupyter-js-services/blob/master/test/run_test.py
#
from __future__ import print_function

import subprocess
import sys
import argparse
import threading
import time
import os
import signal

KARMA_PORT = 9876

argparser = argparse.ArgumentParser(
        description='Run KBase Narrative unit tests'
    )
argparser.add_argument('-b', '--browsers', default='Firefox',
                       help="Browsers to use for Karma test")
argparser.add_argument('-d', '--debug', action='store_true',
                       help="Whether to enter debug mode in Karma")
options = argparser.parse_args(sys.argv[1:])

nb_command = ['kbase-narrative', '--no-browser', '--NotebookApp.allow_origin="*"']

if not hasattr(sys, 'real_prefix'):
    nb_command[0] = 'narrative-venv/bin/kbase-narrative'

nb_server = subprocess.Popen(nb_command,
    stderr=subprocess.STDOUT,
    stdout=subprocess.PIPE,
    preexec_fn = os.setsid
)

# wait for notebook server to start up
while 1:
    line = nb_server.stdout.readline().decode('utf-8').strip()
    if not line:
        continue
    print(line)
    if 'The Jupyter Notebook is running at: http://localhost:8888/' in line:
        break
    if 'is already in use' in line:
        print("Pid: {}".format(nb_server.pid))
        os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
        # nb_server.terminate()
        raise ValueError(
            'The port 8888 was already taken, kill running notebook servers'
        )


def readlines():
    """Print the notebook server output."""
    while 1:
        line = nb_server.stdout.readline().decode('utf-8').strip()
        if line:
            print(line)


thread = threading.Thread(target=readlines)
thread.setDaemon(True)
thread.start()
# time.sleep(15)

test_command = ['grunt', 'test']

resp = 1
try:
    print("Jupyter server started, starting test script.")
    resp = subprocess.check_call(test_command, stderr=subprocess.STDOUT)
except subprocess.CalledProcessError:
    pass
finally:
    print("Done running tests, killing server.")
    print("Pid: {}".format(nb_server.pid))
    os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
    # nb_server.terminate()
sys.exit(resp)
