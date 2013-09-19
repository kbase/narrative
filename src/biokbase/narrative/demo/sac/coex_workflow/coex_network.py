# -*- coding: utf-8 -*-
"""
This a conversion of Ranjan Priya's coex_network script into Python 2.7+

Authors:
    Steve Chan <sychan@lbl.gov>
    Dan Gunter <dkgunter@lbl.gov>
"""
__version__ = '0.1'

## Imports

# std lib
import json
import logging
import argparse
import os
from string import Template
import sys
import time
import uuid
# third-party
import requests

## Configure logging

_log = logging.getLogger("coex_network")
_log.setLevel(logging.DEBUG)
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
_log.addHandler(_h)

## Exception classes


class UploadException(Exception):
    pass


class SubmitException(Exception):
    pass

## Classes


class Awe(object):
    """
    Job	submit	curl -X POST http://awe-server/job
    show	curl -X GET http://awe-server/job/id
    query	curl -X GET http://awe-server/job?queue&key=val
    delete	curl -X DELETE http://awe-server/job/id
    Workunit	checkout	curl -X GET http://awe-server/work?client=id
    show	curl -X GET http://awe-server/work/id
    status update	curl -X PUT http://awe-server/work/id?status=xx
    Client	register	curl -X POST http://awe-server/client
    show all	curl -X GET http://awe-server/client
    show one	curl -X GET http://awe-server/client/id
    status update	curl -X PUT http://awe-server/client/id
    Queue	show status	curl –X GET http://awe-server/queue
    """
    def __init__(self, url):
        self.url = url

    def _get(self, suffix=None, params=None, as_json=True):
        if suffix:
            uri = self.url + '/' + suffix
        else:
            uri = self.url
        pp = {} if params is None else params
        result = requests.get(uri, params=pp)
        if as_json:
            result = result.json()
            return result, result.get('data', {})
        else:
            return result.text, {}

    def job_status(self, id_):
        r, data = self._get('job/{}'.format(id_))
        status = JobStatus(data)
        return status

    def queue_status(self):
        r, data = self._get('queue')
        return data


class JobStatus(object):
    def __init__(self, data):
        self.count = data.get("remaintasks", -1)

## Functions

def join_stripped(iterable):
    return '\n'.join((s.strip() for s in iterable))


def upload_file(uri, filename, att_content):
    file_contents = join_stripped(open(filename))
    data = {'upload': (filename, file_contents),
            'attributes': ('', att_content)}
    _log.debug("upload.request data={}".format(data))
    r = requests.post("%s/node" % uri, files=data)
    response = json.loads(r.text)
    if response['data'] is None:
        raise UploadException("Response from upload has no data: {}".format(response))
    _log.debug("Response.json={}".format(response))
    try:
        return response['data']['id']
    except Exception as err:
        raise UploadException("Problem with parsing response from upload: {}".format(err))
    

def check_job_status(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    remain_tasks = response.get("data", dict()).get("remaintasks")
    return remain_tasks


def get_url_visualization(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    try:
        merged_csv_node = response["data"]["tasks"][3]["outputs"]["merged_list_json"]["node"]
    except Exception,e:
        raise Exception("Could not parse out merged_csv_node: %s" % e)
    url_viz = "http://140.221.85.95/gvisualize/%s" % merged_csv_node
    return url_viz


def get_output_files(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    download_urls = []
    try:
        download_urls.append("data_filtered_csv: %s" %
                              response["data"]["tasks"][0]["outputs"]["data_filtered_csv"]["url"])
        download_urls.append("net_edge_csv: %s" %
                              response["data"]["tasks"][1]["outputs"]["net_edge_csv"]["url"])
        download_urls.append("module_csv: %s" %
                              response["data"]["tasks"][2]["outputs"]["module_csv"]["url"])
    except Exception, e:
        raise Exception("Parsing results: %s" % e)
    return download_urls


def submit_awe_job(uri, awe_job_document):
    _log.debug("job.script value=\n{}".format(awe_job_document))
    content = {'upload': ("awe_job", awe_job_document)}
    r = requests.post("{}/job".format(uri), files=content)
    response = json.loads(r.text)
    if response['data'] is None:
        raise SubmitException("Response from job submit has no data: {}".format(response))
    try:
        return response['data']['id']
    except Exception as e:
        raise SubmitException("Parsing response from job submit: {}".format(e))

## MAIN ##


# Run options
DEFAULTS = dict(
    config_file="config.json",
    job_file="awe_job.json")


def parse_args():
    d = DEFAULTS    # alias
    op = argparse.ArgumentParser()
    op.add_argument("-c", "--config", dest="config_file", default=d["config_file"],
                  help="JSON configuration file with urls, files, etc. "
                        "(default={})".format(d["config_file"]))
    op.add_argument("-j", "--job", dest="job_file", default=d["job_file"],
                  help="AWE job JSON configuration file "
                       "(default={})".format(d["job_file"]))
    op.add_argument("-v", "--verbose", dest="vb", action="count", default=0,
                    help="More verbose messages")
    options = op.parse_args()
    # Log verbosity
    if options.vb > 1:
        _log.setLevel(logging.DEBUG)
    elif options.vb > 0:
        _log.setLevel(logging.INFO)
    else:
        _log.setLevel(logging.WARN)
    # check that input files exist
    for key in 'config_file', 'job_file':
        f = getattr(options, key)
        if not os.path.exists(f):
            flag = '--' + key.split('_')[0]
            op.error("File for {} not found: {}".format(flag, f))
    return options

def main(options):
    """Create a narrative for co-expression network workflow

    1. User uploads multiple files to shock and remembers shock node IDs
    2. An AWE job script is created
    3. Job is submitted to awe service
    4. Node ids of output files are provided
    """
    sessionID = str(uuid.uuid4())

    # Configure from JSON
    _log.info("config.read.begin")
    cfg = json.load(open(options.config_file))
    _log.info("config.read.end")
    # local aliases
    files, descs, urls = cfg['files'], cfg['files_desc'], cfg['urls']

    # Create metadata for each file type
    metadata = {}
    for file_type, file_name in files.iteritems():
        metadata[file_type] = {
            "pipeline": "coexpression network",
            "file_name": file_name,
            "file_type": "expression_file",
            "description": descs[file_type],
            "sessionID": sessionID
        }

    # Upload data to Shock
    _log.info("upload.shock.begin")
    shock_ids = {}
    for file_type, file_name in files.iteritems():
        _log.info("upload.shock.file url={} type={} name={}".format(
            urls['shock'], file_type, file_name))
        file_meta = str(metadata[file_type])
        shock_ids[file_type] = upload_file(urls['shock'], file_name, file_meta)
    _log.debug("upload.shock.end ids={}".format(','.join(shock_ids.values())))

    # Read & substitute values into job spec
    awe_job = json.load(open(options.job_file))
    subst = shock_ids.copy()
    subst.update(cfg['args'])
    subst.update(dict(shock_uri=urls['shock'], session_id=sessionID))
    awe_job_str = Template(json.dumps(awe_job)).substitute(subst)

    # Submit job
    job_id = submit_awe_job(urls['awe'], awe_job_str)

    # Wait for job to complete
    _log.info("job.begin")
    awe = Awe(urls['awe'])
    while 1:
        time.sleep(5)
        count = awe.job_status(job_id).count
        if count == 0:
            break
        _log.info("job.run tasks_remaining={:d}".format(count))
        if _log.isEnabledFor(logging.DEBUG):
            qstat = str(awe.queue_status())
            _log.debug("job.run.details queue_status={}".format(qstat))
    _log.info("job.end")

    #XXX: Never get past this point

    sep = '#' * 40
    print(sep + "\nDownload and visualize network output\n" + sep)

    print("\nOutput files:")
    download_urls = get_output_files(urls['awe'], job_id)
    print('\n'.join(['\t\t' + s for s in download_urls]))

    print("\nURL to visualize the network")
    viz_urls = [get_url_visualization(urls['awe'], job_id)]
    print('\n'.join(['\t\t' + s for s in viz_urls]))

    return 0

if __name__ == '__main__':
    options = parse_args()
    sys.exit(main(options))
