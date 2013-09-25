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
import urlparse
import uuid
# third-party
import requests
from IPython.display import HTML
# Local
from biokbase.workspaceService import Client as WsClient

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


class ServerError(Exception):
    pass


## Global vars, constants

# Run options
DEFAULTS = dict(
    config_file="config.json",
    job_file="awe_job.json",
    ws_url="https://www.kbase.us/services/workspace")

g_ws_url = DEFAULTS['ws_url']

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


class DataSource(object):
    """Generalize the data source to include files and workspaces.
    """
    SCHEME = dict(file_='file', ws_='workspace')

    def __init__(self, url):
        _log.debug("DataSource.open url={}".format(url))
        u = urlparse.urlsplit(url)
        if u.scheme:
            self._type = self.SCHEME[u.scheme + '_']
            if u.scheme == 'file':
                self._url = u.path
            elif u.scheme == 'ws':
                if u.netloc:
                    self._ws_name = u.netloc
                    self._url = u.path[1:]
                else:
                    raise ValueError("Missing workspace name")   #XXX: figure it out
            else:
                assert (False)
        else:
            self._url = url
            self._type = self.SCHEME['file_']

    def read(self):
        """Read from the data source.

        :return: Two items: metadata (dict) and data (string)
        :rtype: tuple
        """
        _log.info("{}.read.begin url={}".format(self._type, self._url))
        try:
            mdata, data = getattr(self, self._type + '_read')()
        except Exception as err:
            _log.error("{}.read.failed msg={}".format(self._type, err))
            raise
        _log.info("{}.read.end".format(self._type))
        return mdata, data

    def file_read(self):
        f = open(self._url)
        return {}, f.read()

    def workspace_read(self):
        ws = WsClient.workspaceService(g_ws_url)
        #_log.debug("WsClient.create.end headers={}".format(ws._headers))
        datatype = 'Media'
        params = {
            'id': self._url,
            'workspace': self._ws_name,
            'type': datatype,
            'auth': ws._headers.get('AUTHORIZATION', '')
        }
        _log.debug("{}.get_object url={} params={}".format(self._type, g_ws_url, params))
        try:
            result = ws.get_object(params)
        except WsClient.ServerError as err:
            err_msg = str(err)
            err_msg = err_msg[:err_msg.find('Trace')]  # cut out ugly Perl stack trace
            _log.debug("{}.get_object.failed msg={}".format(self._type, err_msg))
            raise ServerError(err_msg)
        return result['metadata'], result['data']['bytes']

## Functions

def join_stripped(iterable):
    return '\n'.join((s.strip() for s in iterable))


def upload_file(uri, filename, att_content):
    _, file_contents = DataSource(filename).read() # join_stripped(open(filename))
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
    return options


def run(vb=0, config_file=None, job_file=None):
    """Run main() with options given.

    For the 'file' inputs, either a filename or
    a URL with an optional scheme is accepted.
    For scheme "ws:" the URL is parsed as "ws://<workspace>/<object-id>"
    and the object is looked up in the given workspace.

    :param vb: Verbosity, 0=least 3=greatest
    :type vb: int
    :param config_file: Configuration data source name
    :type config_file: str
    :param job_file: AWE job data source name
    :type job_file: str

    """
    opts = {'vb': vb}
    if config_file is not None:
        opts['config_file'] = config_file
    if job_file is not None:
        opts['job_file'] = job_file
    optobj = Options(opts)
    return main(optobj)


class Options(object):
    def __init__(self, opts):
        for key, value in DEFAULTS.iteritems():
            setattr(self, key, value)
        for key, value in opts.iteritems():
            setattr(self, key, value)


def main(options):
    """Create a narrative for co-expression network workflow

    1. User uploads multiple files to shock and remembers shock node IDs
    2. An AWE job script is created
    3. Job is submitted to awe service
    4. Node ids of output files are provided
    """
    sessionID = str(uuid.uuid4())

    # Log verbosity
    if options.vb > 1:
        _log.setLevel(logging.DEBUG)
    elif options.vb > 0:
        _log.setLevel(logging.INFO)
    else:
        _log.setLevel(logging.WARN)

    # Configure from JSON
    _log.info("config.read.begin")
    _, cfg_raw = DataSource(options.config_file).read()
    _log.info("config.read.end")
    _log.debug("config.read.info value={}".format(cfg_raw))
    # local aliases
    cfg = json.loads(cfg_raw)
    files, descs, urls = cfg['files'], cfg['files_desc'], cfg['urls']

    # Create metadata for each file type
    metadata = {}
    for file_type, file_name in files.iteritems():
        metadata[file_type] = {
            "pipeline": "coexpression network",
            "file_name": file_name,
            "file_type": "expression_file",  # XXX: or, file_type?
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
    _, awe_job_raw = DataSource(options.job_file).read()
    awe_job = json.loads(awe_job_raw)
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

    # Report results
    download_urls = get_output_files(urls['awe'], job_id)
    _log.info("Output files: {}".format('\n'.join(download_urls)))

    viz_urls = [get_url_visualization(urls['awe'], job_id)]
    _log.info("URL to visualize the network: {}".format('\n'.join(viz_urls)))

    final_url = viz_urls[0]
    html = '<a href="{}" target="_blank">Click here to visualize the network</a>'.format(final_url)
    return HTML(html)

if __name__ == '__main__':
    options = parse_args()
    sys.exit(main(options))
