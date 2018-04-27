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
from biokbase.workspace.client import Workspace
from biokbase.service.Client import Client as ServiceClient

KARMA_PORT = 9876
TEST_ROOT = os.path.join("test", "casper")
BASE_TEST_COMMAND = ['casperjs', 'test', '--engine=phantomjs', '--includes=test/casper/jupyterUtil.js']

# TODO: configure, inject from mini-kbase, etc.
BASE_URL = "https://ci.kbase.us/services/"
URLS = {
    "workspace": BASE_URL + "ws",
    "service_wizard": BASE_URL + "service_wizard"
}

with open(os.path.join(TEST_ROOT, "test_cfg.json"), 'r') as c:
    test_cfg = json.loads(c.read())

JUPYTER_PORT = test_cfg['jupyterPort']

for user in test_cfg.get("users"):
    token_file = test_cfg['users'][user]['tokenFile']
    with open(token_file, 'r') as t:
        token = t.read().strip()
        test_cfg['users'][user]['token'] = token

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

def init_test_narrative(widget_cfg, urls):
    """
    Makes a new test narrative for user A, with info and data as dictated in widget_cfg.
    Specifically, it needs the publicData key to be an UPA, which gets copied into the new
    Narrative's workspace.
    """
    global test_cfg
    ws_client = Workspace(url=urls['workspace'], token=test_cfg['users']['userA']['token'])
    service_client = ServiceClient(url=urls['service_wizard'], token=test_cfg['users']['userA']['token'], use_url_lookup=True)
    # make a new narrative.
    new_nar = service_client.sync_call('NarrativeService.create_new_narrative', [{
        'includeIntroCell': 1,
        'title': widget_cfg['narrativeName']
    }])
    # add data
    obj_info = service_client.sync_call('NarrativeService.copy_object', [{
        'ref': widget_cfg['publicData'],
        'target_ws_id': new_nar['workspaceInfo']['id']
    }])
    # share with user B
    ws_client.set_permissions({
        'id': new_nar['workspaceInfo']['id'],
        'new_permission': 'r',
        'users': [test_cfg['users']['userB']['id']]
    })
    return {
        'nar_info': new_nar['narrativeInfo'],
        'ws_info': new_nar['workspaceInfo'],
        'obj_info': obj_info
    }

def run_insertion_test(config):
    """
    Initializes a widget test set by creating a new narrative and copying a single piece of data
    in to it.
    """
    cmd = BASE_TEST_COMMAND + [os.path.join('test', 'casper', config['testFile'])]
    return subprocess.check_call(test_cmd, stderr=subprocess.STDOUT)

def copy_and_unshare_narrative(info):
    """
    Info is a dict with three keys: nar_info, ws_info, and obj_info, the usual workspace info for
    the narrative, workspace, and tested data object, respectively.
    This makes a copy of the given narrative (e.g. workspace), and returns the new, updated info.
    """
    global test_cfg
    ws_A = Workspace(url=urls['workspace'], token=test_cfg['users']['userA']['token'])
    service_B = ServiceClient(url=urls['service_wizard'], token=test_cfg['users']['userB']['token'], use_url_lookup=True)
    # B copies narrative A (in info)
    copy_result = service_B.sync_call("NarrativeService.copy_narrative", [{
        "workspaceId": info['ws_info']['id']
    }])
    # A removes B's privileges
    ws_A.set_permissions({
        'id': info['ws_info']['id'],
        'new_permission': 'n',
        'users': [test_cfg['users']['userB']['id']]
    })
    return copy_result

def run_validation_test(widget_cfg, narr_info):
    cmd = BASE_TEST_COMMAND + [os.path.join('test', 'casper', config['testFile'])]

def run_widget_test(widget):
    """
    Master function that does all the test management for a single widget.
    Does the following steps.
    1. init_test_narrative - Makes a new narrative on behalf of user A and Copies a piece of data for the given widget based on config (also for user A). Also sets up sharing for user B.
    2. run_insertion_test - Opens the narrative, "clicks" the data object and inserts a new cell with its viewer, validates the viewer, and saves that narrative.
    3. copy_and_unshare_narrative - Does the NarrativeService and Workspace tasks of copying a narrative to user B, then A unshared from B.
    4.
    """
    global test_cfg
    global urls
    widget_cfg = test_cfg["widgets"].get(widget)
    if not widget_cfg:
        raise "Widget {} not found in config!".format(widget)
    infoA = init_test_narrative(widget_cfg, urls)
    resp = run_insertion_test(widget_cfg, infoA)
    if resp != 0:
        print("Failed insertion test from userA on widget {}".format(widget))
        return resp
    copy_result = copy_and_unshare_narrative(infoA)
    resp = run_validation_test(widget_cfg, copy_result)
    if resp != 0:
        print("Failed validation test from userB on widget {}".format(widget))
        return resp
    return resp

# # find all casper js test modules.
# # they're all the files under test/casper/widgets
#
# for dirpath, dnames, fnames in os.walk('test/casper/widgets'):
#     for f in fnames:
#         if f.endswith('.js'):
#             test_command.append(os.path.join(dirpath, f))

resp = 0
try:
    print("Jupyter server started, starting test script.")
    for widget in test_cfg["widgets"]:
        widget_resp = run_widget_test(widget)
        if widget_resp != 0:
            print("Failed testing widget {}".format(widget))
            resp = resp + 1
    # run_tests(test_cfg["widgets"])
except subprocess.CalledProcessError:
    pass
finally:
    print("Done running tests, killing server.")
    os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
sys.exit(resp)
