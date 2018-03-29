# Adapted from a Karma test startup script
# developebd by the Jupyter team here;
# https://github.com/jupyter/jupyter-js-services/blob/master/test/run_test.py
#
# Also uses the flow where we assign a os process group id and shut down the
# server based on that - since the subprocess actually executes the kbase-narrative
# script.
# (recipe here)
# http://stackoverflow.com/questions/4789837/how-to-terminate-a-python-subprocess-launched-with-shell-true
from __future__ import print_function

import subprocess
import sys
import argparse
import threading
import time
import os
import signal

KARMA_PORT = 9876
JUPYTER_PORT = 32323

argparser = argparse.ArgumentParser(
        description='Run KBase Narrative unit tests'
    )
argparser.add_argument('-b', '--browsers', default='Firefox',
                       help="Browsers to use for Karma test")
argparser.add_argument('-d', '--debug', action='store_true',
                       help="Whether to enter debug mode in Karma")
options = argparser.parse_args(sys.argv[1:])

nb_command = ['kbase-narrative', '--no-browser', '--NotebookApp.allow_origin="*"', '--ip=127.0.0.1',
              '--port={}'.format(JUPYTER_PORT)]

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
    if 'The Jupyter Notebook is running at:' in line:
        break
    if 'is already in use' in line:
        os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
        # nb_server.terminate()
        raise ValueError(
            'The port {} was already taken, kill running notebook servers'.format(JUPYTER_PORT)
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
    os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
    # nb_server.terminate()
sys.exit(resp)
