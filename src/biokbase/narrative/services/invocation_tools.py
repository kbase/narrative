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
import datetime
from string import Template
from collections import defaultdict
# Local
from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.narrative.common import kbtypes
from biokbase.InvocationService.Client import InvocationService
from biokbase.shock import Client as shockService

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
    invo = InvocationService(url=URLS.invocation, token=token)
    return invo.valid_commands()

def _run_invo(cmd):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URLS.invocation, token=token)
    stdout, stderr = invo.run_pipeline("", cmd, [], 0, '/')
    return "".join(stdout), "".join(stderr)

def _list_files(d):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URLS.invocation, token=token)
    _, files = invo.list_files("", '/', d)
    return files

def _mv_file(old, new):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URLS.invocation, token=token)
    invo.rename_file("", '/', old, new)
    return

def _rm_file(f):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URLS.invocation, token=token)
    invo.remove_files("", '/', f)
    return

def _get_invo(name, binary=False):
    # upload from invo server
    stdout, stderr = _run_invo("mg-upload2shock %s %s"%(URLS.shock, name))
    if stderr:
        return stderr, True
    node = json.loads(stdout)
    # get file content from shock
    return _get_shock_data(node['id'], binary=binary), False

def _get_shock_data(nodeid, binary=False):
    token = os.environ['KB_AUTH_TOKEN']
    shock = shockService(URLS.shock, token)
    return shock.download_to_string(nodeid, binary=binary)

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
    meth.stages = 2
    if not command:
        raise Exception("Command is empty.")
    command.replace('$workspace', os.environ['KB_WORKSPACE_ID'])
    meth.advance("Running Command")
    stdout, stderr = _run_invo(command)
    if (stdout == '') and (stderr == ''):
        stdout = 'Your command executed successfully'
    meth.advance("Displaying Output")
    return json.dumps({'text': stdout, 'error': stderr})

@method(name="View KBase Commands")
def _view_cmds(meth):
    """View available KBase commands.
    
    :return: Command List
    :rtype: kbtypes.Unicode
    :output_widget: CategoryViewWidget
    """
    meth.stages = 2
    meth.advance("Retrieving Commands")
    cmd_list = _list_cmds()
    meth.advance("Displaying Output")
    cmd_sort = sorted(cmd_list, key=lambda k: k['title'])
    cmd_data = []
    for cat in cmd_sort:
        data = {'title': cat['title'], 'items': []}
        for c in cat['items']:
            data['items'].append(c['cmd'])
        cmd_data.append(data)
    return json.dumps({'data': cmd_data})

@method(name="View Files")
def _view_files(meth, sortby):
    """View your files in temp invocation file space.
    
    :param sortby: sort files by name or date, default is name
    :type sortby: kbtypes.Unicode
    :ui_name sortby: Sort By
    :default sortby: name
    :return: File List
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    meth.stages = 2
    meth.advance("Retrieving File List")
    file_list = _list_files("")
    meth.advance("Displaying Output")
    # get datetime objects
    for f in file_list:
        f['mod_date'] = datetime.datetime.strptime(f['mod_date'], "%b %d %Y %H:%M:%S")
    # sort
    if sortby == 'date':
        file_sort = sorted(file_list, key=lambda k: k['mod_date'], reverse=True)
    else:
        file_sort = sorted(file_list, key=lambda k: k['name'])
    # output
    file_table = [['name', 'size', 'timestamp']]
    for f in file_sort:
        file_table.append([ f['name'], f['size'], f['mod_date'].ctime() ])
    return json.dumps({'table': file_table})

@method(name="View PNG File")
def _view_files(meth, afile):
    """View a .png image file from temp invocation file space.
    
    :param afile: file to display
    :type afile: kbtypes.Unicode
    :ui_name afile: File
    :return: File List
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    meth.stages = 2
    if not afile:
        raise Exception("Missing file name.")
    if not afile.endswith('.png'):
        raise Exception("Invalid file type.")
    meth.advance("Retrieving Content")
    content, err = _get_invo(afile, binary=True)
    meth.advance("Displaying Image")
    if err:
        raise Exception(content)
    b64png = base64.b64encode(content)
    return json.dumps({'type': 'png', 'width': '600', 'data': b64png})

@method(name="Download File")
def _download_file(meth, afile):
    """Download a file from temp invocation file space.
    
    :param afile: file to download
    :type afile: kbtypes.Unicode
    :ui_name afile: File
    :return: Status
    :rtype: kbtypes.Unicode
    :output_widget: DownloadFileWidget
    """
    meth.stages = 3
    if not afile:
        raise Exception("Missing file name.")
    meth.advance("Validating Filename")
    file_list = _list_files("")
    has_file  = False
    for f in file_list:
        if f['name'] == afile:
            has_file = True
            break
    if not has_file:
        raise Exception("The file '"+afile+"' does not exist")
    meth.advance("Retrieving Content")
    content, err = _get_invo(afile, binary=False)
    if err:
        raise Exception(content)
    meth.advance("Creating Download")
    return json.dumps({'data': content, 'name': afile})

@method(name="Upload File")
def _upload_file(meth):
    """Upload a file to temp invocation file space.
    
    :return: Status
    :rtype: kbtypes.Unicode
    :output_widget: UploadFileWidget
    """
    meth.stages = 1
    meth.advance("Creating Upload")
    return json.dumps({'url': URLS.invocation, 'auth': {'token': os.environ['KB_AUTH_TOKEN']}})

@method(name="Rename File")
def _rename_file(meth, old, new):
    """Rename a file in temp invocation file space.
    
    :param old: old filename
    :type old: kbtypes.Unicode
    :ui_name old: Old
    :param new: new filename
    :type new: kbtypes.Unicode
    :ui_name new: New
    :return: Status
    :rtype: kbtypes.Unicode
    :output_widget: DisplayTextWidget
    """
    meth.stages = 1
    if not (old and new):
        raise Exception("Missing file names.")
    meth.advance("Renaming File")
    _mv_file(old, new)
    return json.dumps({'text': '%s changed to %s'%(old,new)})

@method(name="Delete File")
def _delete_file(meth, afile):
    """Delete a file from temp invocation file space.
    
    :param afile: file to delete
    :type afile: kbtypes.Unicode
    :ui_name afile: File
    :return: Status
    :rtype: kbtypes.Unicode
    :output_widget: DisplayTextWidget
    """
    meth.stages = 1
    if not afile:
        raise Exception("Missing file name.")
    meth.advance("Deleting File")
    _rm_file(afile)
    return json.dumps({'text': 'removed '+afile})

# Finalization
finalize_service()
