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
import json
import biokbase.narrative.clients as clients

KARMA_PORT = 9876
JUPYTER_PORT = 32323
TEST_ROOT = os.path.join("test", "casper")
BASE_TEST_COMMAND = ['casperjs', 'test', '--includes=narr-venv/jupyter_notebook/notebook/tests/util.js']

with open(os.path.join(TEST_ROOT, "testConfig.json"), 'r') as c:
    testConfig = json.loads(c.read())

for user in testConfig.get("users"):
    tokenFile = testConfig['users'][user]['tokenFile']
    with open(tokenFile, 'r') as t:
        token = t.read().strip()
    testConfig['users'][user]['token'] = token

print(testConfig)
sys.exit(0)









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
    if 'The Jupyter Notebook is running at: http://127.0.0.1:{}/'.format(JUPYTER_PORT) in line:
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

def init_test(config):
    """
    Initializes a widget test set by creating a new narrative and copying a single piece of data
    in to it.
    """


def run_tests():
    for widget in widgetConfig:
        testConfig = widgetConfig[widget]
        narrative = init_test(test_config)
        resp = subprocess.check_call(test_command, stderr=subprocess.STDOUT)


# # find all casper js test modules.
# # they're all the files under test/casper/widgets
#
# for dirpath, dnames, fnames in os.walk('test/casper/widgets'):
#     for f in fnames:
#         if f.endswith('.js'):
#             test_command.append(os.path.join(dirpath, f))

resp = 1
try:
    print("Jupyter server started, starting test script.")
    run_tests()
except subprocess.CalledProcessError:
    pass
finally:
    print("Done running tests, killing server.")
    os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
sys.exit(resp)
