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
import biokbase.auth as auth
from biokbase.workspace.client import Workspace
from biokbase.service.Client import Client as ServiceClient

# print(os.path.dirname(os.path.abspath(__file__)))
# exit(0)

# os.environ['NARRATIVE_DIR'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
TEST_ROOT = os.path.join("test", "integration")
BASE_TEST_COMMAND = [os.path.join("node_modules", "casperjs", "bin", "casperjs"), "test", "--engine=phantomjs", "--includes=test/integration/jupyterUtil.js"]
# TODO: configure, inject from mini-kbase, etc.
BASE_URL = "https://ci.kbase.us/services/"
URLS = {
    "workspace": BASE_URL + "ws",
    "service_wizard": BASE_URL + "service_wizard",
    "auth": BASE_URL + "auth"
}
auth.token_api_url = URLS['auth'] + "/api/V2"

def print_warning(text):
    print("\033[93m" + text + "\033[0m")

def readlines():
    """Print the notebook server output."""
    while 1:
        line = nb_server.stdout.readline().decode("utf-8").strip()
        if line:
            print(line)

def init_test_narrative(widget_cfg, test_cfg):
    """
    Makes a new test narrative for user A, with info and data as dictated in widget_cfg.
    Specifically, it needs the publicData key to be an UPA, which gets copied into the new
    Narrative's workspace.
    """
    global URLS

    print_warning("Creating new test narrative for user " + test_cfg['users']['userA']['id'])
    ws_client = Workspace(url=URLS['workspace'], token=test_cfg['users']['userA']['token'])
    service_client = ServiceClient(url=URLS['service_wizard'], token=test_cfg['users']['userA']['token'], use_url_lookup=True)
    # make a new narrative.
    new_nar = service_client.sync_call('NarrativeService.create_new_narrative', [{
        'includeIntroCell': 1,
        'title': widget_cfg['narrativeName']
    }])[0]
    # add data
    obj_info = service_client.sync_call('NarrativeService.copy_object', [{
        'ref': widget_cfg['publicData'],
        'target_ws_id': new_nar['workspaceInfo']['id']
    }])[0]['info']
    obj_info['upa'] = obj_info['ref']
    # share with user B
    ws_client.set_permissions({
        'id': new_nar['workspaceInfo']['id'],
        'new_permission': 'r',
        'users': [test_cfg['users']['userB']['id']]
    })
    print_warning("Done. New narrative with ref {}/{}".format(new_nar['workspaceInfo']['id'], new_nar['narrativeInfo']['id']))
    return {
        'nar_info': new_nar['narrativeInfo'],
        'ws_info': new_nar['workspaceInfo'],
        'obj_info': obj_info,
        'user_info': test_cfg['users']['userA']
    }

def run_insertion_test(test_cfg, widget, nar_info):
    """
    Initializes a widget test set by creating a new narrative and copying a single piece of data
    in to it.
    """
    print_warning("Testing insertion of new widget into primary test narrative")
    widget_config = test_cfg["widgets"][widget]
    test_cmd = BASE_TEST_COMMAND + [
        os.path.join('test', 'integration', widget_config['testFile']),
        '--insert-widget',
        '--save',
        '--narrative-id={}'.format(nar_info['nar_info']['id']),
        '--workspace-id={}'.format(nar_info['ws_info']['id']),
        '--owner-id={}'.format(nar_info['user_info']['id']),
        '--owner-name={}'.format(nar_info['user_info']['name']),
        '--title={}'.format(nar_info['nar_info']['metadata']['name']),
        '--object-upa={}'.format(nar_info['obj_info']['upa']),
        '--object-name={}'.format(nar_info['obj_info']['name']),
        '--widget-name={}'.format(widget),
        '--current-user={}'.format(test_cfg['users']['userA']['id'])
    ]

    return subprocess.check_call(test_cmd, stderr=subprocess.STDOUT)

def copy_and_unshare_narrative(info, test_cfg):
    """
    Info is a dict with three keys: nar_info, ws_info, and obj_info, the usual workspace info for
    the narrative, workspace, and tested data object, respectively.
    This makes a copy of the given narrative (e.g. workspace), and returns the new, updated info.
    """
    global URLS
    print_warning("Copying primary test narrative for user " + test_cfg['users']['userB']['id'])
    ws_A = Workspace(url=URLS['workspace'], token=test_cfg['users']['userA']['token'])
    service_B = ServiceClient(url=URLS['service_wizard'], token=test_cfg['users']['userB']['token'], use_url_lookup=True)
    # B copies narrative A (in info)
    copy_result = service_B.sync_call("NarrativeService.copy_narrative", [{
        "workspaceRef": "{}/{}".format(info['ws_info']['id'], info['nar_info']['id']),
        "newName": info['nar_info']['metadata']['name'] + ' copy'
    }])[0]
    # A removes B's privileges
    ws_A.set_permissions({
        'id': info['ws_info']['id'],
        'new_permission': 'n',
        'users': [test_cfg['users']['userB']['id']]
    })
    print_warning("Done. New copied narrative with ref {}/{}".format(copy_result['newWsId'], copy_result['newNarId']))
    return copy_result

def run_validation_test(test_cfg, widget, nar_info, copy_info):
    print_warning("Running validation test on narrative copied by user " + test_cfg['users']['userB']['id'])
    widget_cfg = test_cfg["widgets"][widget]
    test_cmd = BASE_TEST_COMMAND + [
        os.path.join('test', 'integration', widget_cfg['testFile']),
        '--validate-only',
        '--narrative-id={}'.format(copy_info['newNarId']),
        '--workspace-id={}'.format(copy_info['newWsId']),
        '--owner-id={}'.format(nar_info['user_info']['id']),
        '--owner-name={}'.format(nar_info['user_info']['name']),
        '--title={}'.format(nar_info['nar_info']['metadata']['name'] + ' copy'),
        '--object-upa={}'.format(nar_info['obj_info']['upa']),
        '--object-name={}'.format(nar_info['obj_info']['name']),
        '--widget-name={}'.format(widget),
        '--current-user={}'.format(test_cfg['users']['userB']['id'])
    ]
    return subprocess.check_call(test_cmd, stderr=subprocess.STDOUT)

def delete_narratives(wsidA, wsidB, test_cfg):
    global URLS
    print_warning("Deleting test narratives...")
    ws_client = Workspace(url=URLS['workspace'], token=test_cfg['users']['userA']['token'])
    ws_client.delete_workspace({'id': wsidA})
    ws_client = Workspace(url=URLS['workspace'], token=test_cfg['users']['userB']['token'])
    ws_client.delete_workspace({'id': wsidB})
    print_warning("Done")

def run_widget_test(widget, test_cfg):
    """
    Master function that does all the test management for a single widget.
    Does the following steps.
    1. init_test_narrative - Makes a new narrative on behalf of user A and Copies a piece of data for the given widget based on config (also for user A). Also sets up sharing for user B.
    2. run_insertion_test - Opens the narrative, "clicks" the data object and inserts a new cell with its viewer, validates the viewer, and saves that narrative.
    3. copy_and_unshare_narrative - Does the NarrativeService and Workspace tasks of copying a narrative to user B, then A unshared from B.
    4.
    """
    global URLS
    print_warning("Starting tests for widget " + widget)
    widget_cfg = test_cfg["widgets"].get(widget)
    if not widget_cfg:
        raise "Widget {} not found in config!".format(widget)
    infoA = init_test_narrative(widget_cfg, test_cfg)
    resp = run_insertion_test(test_cfg, widget, infoA)
    if resp != 0:
        print_warning("Failed insertion test from userA on widget {}".format(widget))
        return resp
    # copy_result == has newNarId and newWsId keys
    copy_result = copy_and_unshare_narrative(infoA, test_cfg)
    resp = run_validation_test(test_cfg, widget, infoA, copy_result)
    if resp != 0:
        print_warning("Failed validation test from userB on widget {}".format(widget))
        return resp
    delete_narratives(infoA['ws_info']['id'], copy_result['newWsId'], test_cfg)

    return resp


def start_and_run_tests(single_widget=None):
    # load main config
    with open(os.path.join(TEST_ROOT, "testConfig.json"), 'r') as c:
        test_cfg = json.loads(c.read())
    JUPYTER_PORT = test_cfg['jupyterPort']

    # Set up user config
    for user in test_cfg.get("users"):
        token_file = test_cfg['users'][user]['tokenFile']
        with open(token_file, 'r') as t:
            token = t.read().strip()
            test_cfg['users'][user]['token'] = token
            user_info = auth.get_user_info(token)
            test_cfg['users'][user]['id'] = user_info['user']
            user_name = auth.get_user_names([user_info['user']], token=token)
            test_cfg['users'][user]['name'] = user_name[user_info['user']]

    # start the notebook server!
    nb_command = ['kbase-narrative', '--no-browser', '--NotebookApp.allow_origin="*"', '--ip=127.0.0.1',
                  '--port={}'.format(JUPYTER_PORT)]
    if not hasattr(sys, 'real_prefix'):
        nb_command[0] = 'narrative-venv/bin/kbase-narrative'

    global nb_server
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

    thread = threading.Thread(target=readlines)
    thread.setDaemon(True)
    thread.start()

    resp = 0
    # Run all the widget tests from here.
    try:
        print_warning("Jupyter server started, starting test script.")
        if single_widget is not None:
            print_warning("Only running a single test on " + single_widget)
            widget_resp = run_widget_test(single_widget, test_cfg)
            if widget_resp != 0:
                print_warning("Failed testing widget {}".format(widget))
                resp = resp + 1
        else:
            for widget in test_cfg["widgets"]:
                widget_resp = run_widget_test(widget, test_cfg)
                if widget_resp != 0:
                    print_warning("Failed testing widget {}".format(widget))
                    resp = resp + 1
    except subprocess.CalledProcessError:
        pass
    finally:
        print_warning("Done running tests, killing server.")
        os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
    sys.exit(resp)

if __name__ == "__main__":
    widget = None
    if len(sys.argv) > 1:
        widget = sys.argv[1]
    sys.exit(start_and_run_tests(widget))
