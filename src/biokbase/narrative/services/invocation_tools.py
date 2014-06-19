"""
invocation functions for all
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
NAME = "KBase Commands"

class URLS:
    shock = "http://shock.metagenomics.anl.gov"
    workspace = "https://kbase.us/services/ws"
    invocation = "https://kbase.us/services/invocation"

# Initialize
init_service(name=NAME, desc="Functions for executing KBase commands and manipulating the results", version=VERSION)

def _list_cmds():
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URL.invocation, token=token)
    return invo.valid_commands()

def _run_invo(cmd):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URL.invocation, token=token)
    stdout, stderr = invo.run_pipeline("", cmd, [], 0, '/')
    return "".join(stdout), "".join(stderr)

def _list_files(d):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URL.invocation, token=token)
    _, files = invo.list_files("", '/', d)
    return files

def _mv_file(old, new):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URL.invocation, token=token)
    invo.rename_file("", '/', old, new)
    return

def _rm_file(f):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URL.invocation, token=token)
    invo.remove_files("", '/', f)
    return

@method(name="Execute KBase Command")
def _execute_command(meth, command):
    """Execute given KBase command.

    :param command: command to run
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

@method(name="View KBase Commands")
def _view_cmds(meth):
    """View available KBase commands.
    
    :return: Command List
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    meth.stages = 1
    cmd_list = _list_cmds()
    cmd_sort = sorted(cmd_list, key=lambda k: k['title'])
    cmd_table = [['category', 'command']]
    for cat in cmd_sort:
        for c in cat['items']:
            cmd_table.append([ cat['title'], c['cmd'] ])
    return json.dumps({'table': cmd_table})

@method(name="View Files")
def _view_files(meth):
    """View your files.
    
    :return: File List
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    meth.stages = 1
    file_list  = _list_files("")
    file_sort  = sorted(file_list, key=lambda k: k['name'])
    file_table = [['name', 'size', 'timestamp']]
    for f in file_sort:
        file_table.append([ f['name'], f['size'], f['mod_date'] ])
    return json.dumps({'table': file_table})

@method(name="Rename File")
def _rename_file(meth, old, new):
    """Rename a file.
    
    :param old: old filename
    :type old: kbtypes.Unicode
    :ui_name old: Old
    :param new: new filename
    :type new: kbtypes.Unicode
    :ui_name new: New
    :return: Status
    :rtype: kbtypes.Unicode
    """
    meth.stages = 1
    if not afile:
        raise Exception("File is empty.")
    _mv_file(old, new)
    return

@method(name="Delete File")
def _delete_file(meth, afile):
    """Delete a file.
    
    :param afile: file to delete
    :type afile: kbtypes.Unicode
    :ui_name afile: File
    :return: Status
    :rtype: kbtypes.Unicode
    """
    meth.stages = 1
    if not afile:
        raise Exception("File is empty.")
    _rm_file(afile)
    return

# Finalization
finalize_service()
