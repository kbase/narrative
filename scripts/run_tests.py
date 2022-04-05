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

argparser = argparse.ArgumentParser(description="Run KBase Narrative tests")
argparser.add_argument(
    "-u", "--unit", action="store_true", help="Whether to run unit tests"
)
argparser.add_argument(
    "-i", "--integration", action="store_true", help="Whether to run integration tests"
)
argparser.add_argument(
    "-c",
    "--container",
    help="Run the tests against the specified docker container, e.g. kbase/narrative:latest",
)
options = argparser.parse_args(sys.argv[1:])

nb_server = None

JUPYTER_PORT = 32323
IP_ADDRESS = "0.0.0.0" if options.container else "127.0.0.1"


def run_narrative():

    nb_command = [
        "kbase-narrative",
        "--no-browser",
        '--NotebookApp.allow_origin="*"',
        f"--ip={IP_ADDRESS}",
        f"--port={JUPYTER_PORT}",
    ]

    if options.container:
        nb_command = [
            "docker",
            "run",
            "-i",
            "-p",
            f"{JUPYTER_PORT}:{JUPYTER_PORT}",
            options.container,
            # start up args from the Dockerfile
            "--template",
            "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/src/config.json",
            "--template",
            "/kb/dev_container/narrative/src/config.json.templ:/kb/dev_container/narrative/kbase-extension/static/kbase/config/config.json",
        ] + nb_command

    print("running command " + " ".join(nb_command))

    nb_server = subprocess.Popen(
        nb_command,
        stderr=subprocess.STDOUT,
        stdout=subprocess.PIPE,
        preexec_fn=os.setsid,
    )

    print(f"Starting narrative at {IP_ADDRESS}:{JUPYTER_PORT}")

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
    if options.unit or options.integration:
        print("starting narrative")
        nb_server = run_narrative()
        print("narrative started")
    else:
        print("No tests specified.")

    if options.unit:
        print("starting unit tests")
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
