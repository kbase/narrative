"""Simple utilities for handling gists.
"""

from __future__ import print_function

# Stdlib imports
import os
import subprocess
import sys
import time

# Third-party imports
import requests

# From IPython
from IPython.display import display, HTML

def get_gist(gist_id):
    """Get a gist by ID.
    
    Returns JSON object from request, or raises if status code != 200.    
    """
    urlbase = "https://api.github.com/gists/"
    url = urlbase + str(gist_id)
    r = requests.get(url)
    if r.status_code != 200:
        r.raise_for_status()
    return r.json()


def clone_gist(gist, path=None):
    """Clone a gist with git.
    
    By default, the path is gist-<ID>, but an explicit path can be given.
    """
    path = path if path is not None else 'gist-' + gist['id']
    subprocess.check_call(['git', 'clone', gist['git_pull_url'], path])
    

def save_gist(gist, path=None):
    """Save a gist to disk.
    
    If the gist is single-file, the file is written to the local directory.
    
    If the gist is multi-file, a directory called gist-<ID> is created, unless
    `path` is explicitly specified.
    
    # Parameters
    
    * gist: gist represented as a JSON object.
    
    * path: optional
      Path to create gist in, used only for multi-file gists.
    """
    start_dir = os.getcwd()
    files = gist['files']
    if len(files) == 1:
        print("Single file gist saved to current directory")
    else:
        path = path if path is not None else 'gist-' + gist['id']
        print("Multifile gist saved to new directory:", path)
        # If directory already exists, move to timestamped backups. 
        if os.path.isdir(path):
            timestr = time.strftime('%Y-%m-%d-%H-%M-%S', time.localtime())
            bkp_path = os.path.join(path+'-old', timestr)
            os.renames(path, bkp_path)
            print("Old directory renamed: %s -> %s" % (path, bkp_path))
        os.mkdir(path)    
        os.chdir(path)
        
    try:
        for fname,data in files.iteritems():
            if data['truncated']:
                content = requests.get(data['raw_url']).text
            else:
                content = data['content']
            with open(fname, 'w') as fd:
                fd.write(content)
        print("Files:", files.keys())
    finally:
        if os.getcwd() != start_dir:
            os.chdir(start_dir)
        

def gist(gist_id, clone=False, path=None):
    """Fetch and save a public gist, optionally cloning its repo.
    
    Thin wrapper around `save_gist` and `clone_gist`, see those for details.
    """
    gist_id = str(gist_id)
    if gist_id.startswith("http"):
        print("ERROR: gist id must be just the identifier, not full URL.", 
              file=sys.stderr)
        return
    
    g = get_gist(gist_id)
    
    # Some feedback about the gist just fetched
    msg = ('<a href="http://gist.github.com/%s" target=_blank>Gist %s</a>'
            % (gist_id, gist_id))
    desc = g['description']
    if desc:
        msg += ': ' + desc
    else:
        msg += '.'
    display(HTML(msg))
    
    # Save data to disk
    if clone:
        clone_gist(g, path)
    else:
        save_gist(g, path)