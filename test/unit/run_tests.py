# Adapted from a Karma test startup script
# developed by the Jupyter team here;
# https://github.com/jupyter/jupyter-js-services/blob/master/test/run_test.py
#
# Also uses the flow where we assign a os process group id and shut down the
# server based on that - since the subprocess actually executes the kbase-narrative
# script.
# (recipe here)
# http://stackoverflow.com/questions/4789837/how-to-terminate-a-python-subprocess-launched-with-shell-true

import subprocess
import sys
import argparse
import threading
import os
import signal

KARMA_PORT = 9876
JUPYTER_PORT = 32323

argparser = argparse.ArgumentParser(description="Run KBase Narrative unit tests")
argparser.add_argument(
    "-b", "--browsers", default="Firefox", help="Browsers to use for Karma test"
)
argparser.add_argument(
    "-d", "--debug", action="store_true", help="Whether to enter debug mode in Karma"
)
argparser.add_argument(
    "-u", "--unit", action="store_true", help="Whether to run unit tests"
)
argparser.add_argument(
    "-i", "--integration", action="store_true", help="Whether to run integration tests"
)
options = argparser.parse_args(sys.argv[1:])

nb_server = None


def run_narrative():
    print(f"Starting local narrative on {JUPYTER_PORT}")
    nb_command = [
        "kbase-narrative",
        "--no-browser",
        '--NotebookApp.allow_origin="*"',
        "--ip=127.0.0.1",
        "--port={}".format(JUPYTER_PORT),
    ]

    if not hasattr(sys, "real_prefix"):
        nb_command[0] = "kbase-narrative"

    nb_server = subprocess.Popen(
        nb_command,
        stderr=subprocess.STDOUT,
        stdout=subprocess.PIPE,
        preexec_fn=os.setsid,
    )

    # wait for notebook server to start up
    while 1:
        line = nb_server.stdout.readline().decode("utf-8").strip()
        if not line:
            continue
        print(line)
        if "The Jupyter Notebook is running at:" in line:
            break
        if "is already in use" in line:
            os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
            # nb_server.terminate()
            raise ValueError(
                "The port {} was already taken, kill running notebook servers".format(
                    JUPYTER_PORT
                )
            )

    def readlines():
        """Print the notebook server output."""
        while 1:
            line = nb_server.stdout.readline().decode("utf-8").strip()
            if line:
                print(line)

    thread = threading.Thread(target=readlines)
    thread.setDaemon(True)
    thread.start()

    print("Jupyter server started!")

    return nb_server


resp = {
    "unit_isolated": -1,
    "unit": -1,
    "integration": -1,
}


try:
    if options.unit:
        print("starting unit tests")
        print("starting narrative")
        nb_server = run_narrative()
        print("narrative started")
        try:
            print("running isolated unit tests")
            resp["unit_isolated"] = subprocess.check_call(
                ["npm", "run", "test_isolated"],
                stderr=subprocess.STDOUT,
                shell=False,
            )  # nosec
        except subprocess.CalledProcessError as e:
            resp["unit_isolated"] = e.returncode
        try:
            print("running main unit tests")
            resp["unit"] = subprocess.check_call(
                ["npm", "run", "test"],
                stderr=subprocess.STDOUT,
                shell=False,
            )  # nosec
        except subprocess.CalledProcessError as e:
            resp["unit"] = e.returncode
    if options.integration:
        env = os.environ.copy()
        base_url = env.get("BASE_URL", None)
        if base_url is None:
            if nb_server is None:
                nb_server = run_narrative()
            base_url = f"http://localhost:{JUPYTER_PORT}"
            env["BASE_URL"] = base_url
        print("starting integration tests")
        try:
            resp["integration"] = subprocess.check_call(
                ["npx", "wdio", "test/integration/wdio.conf.js"],
                stderr=subprocess.STDOUT,
                env=env,
                shell=False,
            )  # nosec
        except subprocess.CalledProcessError as e:
            resp["integration"] = e.returncode
except Exception as e:
    print(f"Error! {str(e)}")
finally:
    print("Done running tests.")
    if nb_server is not None:
        print("Killing server.")
        os.killpg(os.getpgid(nb_server.pid), signal.SIGTERM)
    exit_code = 0
    for key in resp.keys():
        if resp[key] != -1:
            print(f"{key} tests completed with code {resp[key]}")
            if resp[key] != 0:
                exit_code = 1
    sys.exit(exit_code)
