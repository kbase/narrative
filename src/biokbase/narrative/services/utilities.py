"""
shared utility functions for all
"""
__author__ = 'Travis Harrison'
__date__ = '6/18/14'
__version__ = '0.5'

## Imports
import re
import json
import time
import os
import base64
import urllib
import urllib2
import cStringIO
import requests
from string import Template
from collections import defaultdict
# Local
from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.narrative.common import kbtypes
from biokbase.InvocationService.Client import InvocationService

## Globals
VERSION = (0, 0, 1)
NAME = "Utility Commands"
IURL = "https://kbase.us/services/invocation"

# Initialize
init_service(name=NAME, desc="General purpose utility commands", version=VERSION)

def _view_invo(d):
    token = os.environ['KB_AUTH_TOKEN']
    invo  = InvocationService(url=IURL, token=token)
    _, files = invo.list_files("", '/', d)
    return files

def _run_invo(cmd):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=IURL, token=token)
    stdout, stderr = invo.run_pipeline("", cmd, [], 0, '/')
    return "".join(stdout), "".join(stderr)

def _put_invo(name, data):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=IURL, token=token)
    # data is a string
    invo.put_file("", name, data, '/')

@method(name="Invocation Execute")
def _execute_command(meth, command):
    """Execute given command on invocation server.

    :param command: command to run on invocation server
    :type command: kbtypes.Unicode
    :ui_name command: Command
    :return: Results
    :rtype: kbtypes.Unicode
    :output_widget: DisplayTextWidget
    """
    meth.stages = 1
    if not command:
        raise Exception("Command is empty.")
    stdout, stderr = _run_invo(command)
    if (stdout == '') and (stderr == ''):
        stdout = 'Your command executed successfully'
    return json.dumps({'header': '', 'text': stdout, 'error': stderr})

@method(name="View Files")
def _view_files(meth):
    """View your files on invocation server.
    
    :return: File List
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    meth.stages = 1
    file_list  = _view_invo("")
    file_sort  = sorted(file_list, key=lambda k: k['name'])
    file_table = [['name', 'size', 'timestamp']]
    for f in file_list:
        file_table.append([ f['name'], f['size'], f['mod_date'] ])
    return json.dumps({'table': file_table})

# Finalization
finalize_service()
