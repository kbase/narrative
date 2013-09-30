# -*- coding: utf-8 -*-
"""
This a conversion of Ranjan Priya's coex_network script into Python 2.7+

Authors:
    Steve Chan <sychan@lbl.gov>
    Dan Gunter <dkgunter@lbl.gov>
"""
__version__ = '0.1'

## Imports

from biokbase.auth import Token
from biokbase.workspaceService.Client import workspaceService
from biokbase.ExpressionServices.Client import ExpressionServices
from biokbase.idserver.client import IDServerAPI
from biokbase.cdmi.client import CDMI_API
from biokbase.OntologyService.Client import Ontology

# system
import json
import logging
from string import Template
import sys
import time
import uuid
# third-party
import requests
import os

## Configure logging

_log = logging.getLogger("coex_network")
_log.setLevel(logging.DEBUG)
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
_log.addHandler(_h)

## Exception classes


class UploadException(Exception):
    pass


class DownloadException(Exception):
    pass


class SubmitException(Exception):
    pass

## Classes


class CoexNetwork(object):
    """Implement all the functions for coex network.
    """

    def __init__(self, workspace_id=None, auth_token=None):
        self._ws = workspace_id
        self._token = auth_token
        self._wss = workspaceService(URLS.workspace)

    def get_expression_data(self, ont_id=None, gn_id=None):
        edge_object_id = self.gene_id(ont_id, gn_id, "filtered.edge_net")
        clust_object_id = self.gene_id(ont_id, gn_id, "filtered.clust_net")
        self.edge_core_id = self.ws_url(edge_object_id)
        clust_core_id = self.ws_url(clust_object_id)
        self.edge_ds_id = "kb|netdataset." + self.edge_core_id
        clust_ds_id = "kb|netdataset." + clust_core_id
        networks_id = self.gene_id(ont_id, gn_id, "filtered.network")
        exprc = ExpressionServices(URLS.expression)
        sample_ids = exprc.get_expression_sample_ids_by_ontology_ids([ont_id], 'and', "kb|g." + gn_id, 'microarray',
                                                                     'N');
        sample_data = exprc.get_expression_samples_data(sample_ids)
        return sample_data

    def save_sample_data(self, ont_id=None, gn_id=None, data=None):
        """Save data with given ontology / 'gn' id.
        """
        obj_id = ont_id + ".g" + gn_id
        self._wss.save_object({
            'id': obj_id,
            'type': 'ExpressionDataSamplesMap',
            'data': data,
            'workspace': self._ws,
            'auth': self._token})
        return obj_id

    def build_expression_data(self, samples):
        """
        :return: 2d arr, first row is sample ids and rows 2..n are gid,<value> for each sample id.
                 Note this means that the first row has 1 less column than the rest.
        """
        _v = 'dataExpressionLevelsForSample'
        d = []
        # get filtered list of sample ids
        samp_ids = [x for x in samples.iterkeys() if not x.startswith('_')]
        d.append(samp_ids)  # header
        # get unique gids (same for every sample)
        sid = samp_ids[0]
        gids = set(samples[sid][_v].keys())
        # add 1 row for each gid
        for gid in sorted(list(gids)):
            # add gid + 1 column for each sample
            d.append([gid] + [samples[sid][_v][gid] for sid in samp_ids])
        return d

    def save_expr_data(self, ont_id=None, gn_id=None, data=None):
        obj_id = 'exds_' + ont_id + '.g' + gn_id
        self.save_object(id=obj_id, type=TYPES.expr_dset, data=data)
        return obj_id

    def save_sample_ids(self, ids=None, ont_id=None, gn_id=None):
        text = self.vec_to_csv(ids) + '\n'
        obj_id = 'exds_' + ont_id + '.g' + gn_id
        self.save_object(id=obj_id, type=TYPES.expr_dset, data=text)
        return obj_id

    def save_net_data(self, ont_id=None, gn_id=None, data=None):
        # net_object = {
        #     'datasets': datasets,
        #     'nodes': nodes,
        #     'edges': edges,
        #     'userAnnotations': {},
        #     'name': 'Coexpression Network',
        #     'id': "kb|net." + networks_id,
        #     'properties': {
        #         'graphType': 'edu.uci.ics.jung.graph.SparseMultigraph'
        #     }
        # }
        obj_id = 'exds_' + ont_id + '.g' + gn_id
        self.save_object(id=obj_id, type=TYPES.expr_dset, data=data)
        return obj_id


    def update_samples(self, fif, samp, sids):
        """Update the samples based on filtered results.

        :param fif: Raw filtered output file data
        :type fif: str
        :param samp: Sample data obj -- modified by this method
        :type samp: dict
        :param sids: Sample ids
        :type sids: list
        """
        # read & check header
        fdata = fif.split('\n')
        hdr = fdata[0]
        nhdr = len(hdr.split(','))
        if nhdr != len(sids):
            raise ValueError("number of fields in header {:d} does not match number of sample ids {:d}"
                             .format(nhdr, len(sids)))
        # build expression levels per sample
        elm = {sid: {} for sid in sids}
        for line in fdata[1:]:
            line.strip()
            values = line.split(',')
            for i in range(len(sids)):
                elm[sids[i]][values[0]] = values[i + 1]
        # apply expression levels to samples
        delme = []
        for sid in sorted(samp.keys()):
            x = samp[sid]
            if sid.startswith('_'):
                delme.append(sid)
            else:
                x['dataExpressionLevelsForSample'] = elm[sid]
                if x['sampleTitle'] is None:
                    x['sampleTitle'] = " filtered by coex_filter"
                else:
                    x['sampleTitle'] += " filtered by coex_filter"
                if x['experimentDescription'] is None:
                    x['experimentDescription'] = "Generated by coex_filter " + coex_filter_args
                else:
                    x['experimentDescription'] += "Generated by coex_filter " + coex_filter_args
        # delete underscored samples out of loop
        for sid in delme:
            del samp[sid]

    ## utility methods

    def save_object(self, **kw):
        self._wss.save_object(dict(workspace=self._ws, auth=self._token, **kw))

    def vec_to_csv(self, data):
        return ','.join(['"{}"'.format(s) for s in data])

    def arr_to_csv(self, data):
        return '\n'.join([self.vec_to_csv(vec) for vec in data])

    def ws_url(self, oid):
        return URLS.create_ws_url(self._ws, oid)

    @property
    def workspace_id(self):
        "Get workspace id for this network."
        return self._ws

    def gene_id(self, ont_id, gn_id, name):
        "Format (and return, as str) a gene object identifier"
        return ont_id + ".g" + gn_id + "." + name

class Engine(object):
    """Wrapper for interacting with Shock/Awe.

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

    def __init__(self, shock_url=None, awe_url=None):
        self._surl = shock_url
        self._aurl = awe_url
        self._last_id = None

    def run(self, job):
        """Run a job.

        :param job: The job spec
        :type job: AweJob
        :return: job id
        :rtype: object
        """
        result = None
        job.shock_uri = self._surl
        _log.debug("job.script value=\n{}".format(job))
        content = {'upload': ("awe_job", str(job))}
        r = requests.post("{}/job".format(self._aurl), files=content)
        response = json.loads(r.text)
        if response['data'] is None:
            raise SubmitException("Response from job submit has no data: {}".format(response))
        try:
            result = response['data']['id']
        except Exception as e:
            raise SubmitException("Parsing response from job submit: {}".format(e))
        self._last_id = result
        return result

    def _get(self, suffix=None, params=None, as_json=True):
        if suffix:
            uri = self._aurl + '/' + suffix
        else:
            uri = self._aurl
        pp = {} if params is None else params
        result = requests.get(uri, params=pp)
        if as_json:
            result = result.json()
            return result, result.get('data', {})
        else:
            return result.text, {}

    def status(self, id_=None):
        if id_ is None:
            if self._last_id is not None:
                id_ = self._last_id
            else:
                raise ValueError("job id missing and no previous job found")
        r, data = self._get('job/{}'.format(id_))
        status = AweJobStatus(data)
        return status

    def queue_status(self):
        r, data = self._get('queue')
        return data


    def save(self, name=None, data=None, **attributes):
        """Upload data to Shock

        :param name: Data "file" name
        :param data: The data to upload
        :param attributes: Additional metadata dict
        :return: Shock ID of uploaded object
        """
        data = {'upload': (name, data),
                'attributes': ('', attributes)}
        #_log.debug("upload.request data={}".format(data))
        r = requests.post("{}/node".format(self._surl), files=data)
        response = json.loads(r.text)
        if response['data'] is None:
            raise UploadException("Response from upload has no data: {}".format(response))
        _log.debug("Response.json={}".format(response))
        try:
            result = response['data']['id']
        except Exception as err:
            raise UploadException("Problem with parsing response from upload: {}".format(err))
        return result

    def fetch_output(self, jobid=None, name=None, task_num=0):
        """Fetch output of a job

        :param jobid: Identifier of job that generated some output
        :param name: Name of output
        :param task_num: Task number in job (default=0)
        :return: Data, as a string buffer
        :rtype: str
        """
        url = "%s/job/%s" % (self._surl, jobid)
        try:
            r = requests.get(url)
        except requests.RequestException as err:
            raise DownloadException("failed to get result of job {}: {}".format(jobid, err))
        try:
            response = json.loads(r.text)
        except Exception as err:    # TODO: make more specific
            raise DownloadException("failed to decode job result JSON: {}".format(err))
        try:
            data_url = response["data"]["tasks"][task_num]["outputs"][name]["url"]
            r = requests.get(data_url)
        except requests.RequestException as err:
            raise DownloadException("failed to retrieve job[{:d}] result '{}': {}".format(task_num, name, err))
        data = r.text
        return data


class AweJob(object):
    # Template for job info
    INFO = {
        "pipeline": "coex-example",
        "name": "testcoex",
        "project": "default",
        "user": "default",
        "clientgroups": "",
        "sessionId": "$session_id"
    }
    # Template for a task
    TASK = {
        "cmd": {
            "args": "-i @data_csv --output=data_filtered_csv  --sample_index=@sample_id_csv  $coex_filter",
            "description": "filtering",
            "name": "coex_filter"
        },
        "dependsOn": [],
        "inputs": {
            "data_csv": {
                "host": "$shock_uri",
                "node": "$expression"
            },
            "sample_id_csv": {
                "host": "$shock_uri",
                "node": "$sample_id"
            }
        },
        "outputs": {
            "data_filtered_csv": {
                "host": "$shock_uri"
            }
        },
        "taskid": "0",
        "skip": 0,
        "totalwork": 1
    }

    def __init__(self, info=None):
        self._info = self.INFO.copy()
        self._info.update(info)
        self._tasks = []
        self._uri = None

    def add_task(self, cmd=None, inputs=None, outputs=None):
        t = self.TASK.copy()
        t['cmd'] = cmd
        t['inputs'] = inputs
        t['outputs'] = outputs
        t['taskid'] = len(self._tasks)
        self._tasks.append(t)

    @property
    def shock_uri(self):
        return self._uri

    @shock_uri.setter
    def shock_uri(self, u):
        """Set Shock url in all tasks
        """
        for t in self._tasks:
            for io in 'inputs', 'outputs':
                for key, val in t['io'].iteritems():
                    val['host'] = u
        self._uri = u

    def to_json(self):
        return {'info': self._info, 'tasks': self._tasks}

    def __str__(self):
        "Render as JSON string"
        return json.dumps(self.to_json())


class AweJobStatus(object):
    def __init__(self, data):
        self.count = data.get("remaintasks", -1)


## Functions


def report_progress(name, done, total):
    "Progress output"
    sys.stderr.write(":progress: {} {:d} {:d}".format(name, done, total))

def get_node_id(node, nt = "GENE"):
    if not node in ugids.keys() :
        ugids[node] = len(ugids)
        nodes.append( {
          'entityId' : node,
          'userAnnotations' : {},
          'type' : nt,
          'id' : 'kb|netnode.' + `ugids[node]`,
          'properties' : {}
        } )
    return "kb|netnode." + `ugids[node]`

def join_stripped(iterable):
    return ''.join((s.strip() for s in iterable))



def check_job_status(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    remain_tasks = response.get("data",dict()).get("remaintasks")
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


## Global (configuration) variables

# Server URLs


class URLS:
    main = "http://140.221.84.236:8000/node"
    shock = "http://140.221.84.236:8000"
    awe = "http://140.221.84.236:8001/"
    expression = "http://140.221.85.118:7075"
    workspace = "http://kbase.us/services/workspace"
    ids = "http://kbase.us/services/idserver"
    cdmi = "http://kbase.us/services/cdmi_api"
    ontology = "http://kbase.us/services/ontology_service"

    @classmethod
    def create_ws_url(cls, workspace_id, object_id):
        return "ws://{ws}/{obj}".format(ws=workspace_id, obj=object_id)


class TYPES:
    "Enumeration of workspace datatype names"
    expr_map = 'ExpressionDataSamplesMap'
    expr_dset = 'ExpressionDataSet'

sessionID = str(uuid.uuid4())


# File types, names, and descriptions

files = {"expression": "data.csv",
         "sample_id": "sample.csv",
         "annotation": "Gene_Annotation.csv",
         "expression_filtered" : "datafiltered.csv",
         "edge_net" : "edge_list.csv",
         "cluster" : "coex_modules.csv" }
files_rst = {
         "expression_filtered" : "datafiltered.csv",
         "edge_net" : "edge_list.csv",
         "cluster" : "coex_modules.csv" }
files_desc = dict(expression="Expression data",
                  sample_id="Sample file",
                  annotation="Annotation file", 
                  expression_filtered="Filtered expression data",
                  edge_net = "Network edge list",
                  cluster = "Cluster membership file")

# Create metadata for each file type

metadata = {}
for file_type, file_name in files.iteritems():
    metadata[file_type] = {
        "pipeline": "coexpression network",
        "file_name": file_name,
        "file_type": "expression_file",
        "description": files_desc[file_type],
        "sessionID": sessionID
    }

coex_args = dict(
    coex_filter="-m anova -n 100",
    coex_net="-c 0.75",
    coex_cluster2="-c hclust -n simple")

coex_filter_args = "-i " + files['expression'] + " -s " + files['sample_id'] + " -o " + files_rst['expression_filtered'] + " -m anova -n 100"
coex_net_args = "-i " + files_rst['expression_filtered'] +  " -o " + files_rst['edge_net'] + " -c 0.75 "

ugids = {}
nodes = []

# util
def filter_underscore(vals):
    "Filter out values that start with an underscore '_'"
    return sorted([i for i in vals if not i.startswith('_')])


class LoggedAction(object):
    def __init__(self, name):
        self._name = name
    def __enter__(self):
        _log.debug(self._name + '.begin')
    def __exit__(self, exc_type, exc_value, traceback):
        if exc_type is None:
            _log.debug(self._name + '.end')
        else:
            _log.debug(self._name + '.error msg="{ev}"'.format(
                ev=exc_value))


def main():
    """Create a narrative for co-expression network workflow
    """
    script_name = "coexpression_network"
    script_stages, cur_stage = 4, 0

    wsid = 'coexpr_test'   # XXX: param
    token = '|'.join(['un=kbasetest', 'tokenid=2567ebbe-2780-11e3-8409-1231391ccf32',
                     'expiry=1411827708', 'client_id=kbasetest', 'token_type=Bearer',
                     "SigningSubject=https://nexus.api.globusonline.org/goauth/keys/"
                     "26000b42-2780-11e3-8409-1231391ccf32",
                     "sig=4964a75b44c393b4ec3c2760b78b7ddc626dd3891c2ae97ee8d7237a05"
                     "bedd72813e58968d495eb1be9f698f0f287ce524a01a88f647dacdbbec03b5"
                     "f32ebf66a12d09ec7fbbb3106dcc040bea0b05d3ed1e85d8c69e0ae53760b5"
                     "7e0e467a68b7c3b2b9f143e93b41f46b61dd4df81006412be6b95ed13c573ab45ea892a1cb"])
    gn_id, ont_id = '3899', 'PO:0009005'
    expr_params = dict(ont_id=ont_id, gn_id=gn_id)

    with LoggedAction("init"):
        # the Shock/Awe "engine" that runs the code
        eng = Engine(awe_url=URLS.awe, shock_url=URLS.shock)

        # wrapper for coex network functions + workspace utils
        network = CoexNetwork(workspace_id=wsid, auth_token=token)

    # keep track of identifiers in these dicts
    shock_ids, ws_ids, awe_ids = {}, {}, {}

    with LoggedAction("create_sample_data"):
        # load samples from the central scrutinizer
        sample_data = network.get_expression_data(**expr_params)
        # save samples to the workspace
        ws_ids['samp'] = network.save_sample_data(data=sample_data, **expr_params)
        # save samples to Shock
        shock_ids['samp'] = eng.save(data=sample_data, name=ws_ids['samp'])

    with LoggedAction("create_expression_data"):
        # build expression data from samples
        expr_data = network.build_expression_data(sample_data)
        # save expressions to the workspace
        ws_ids['expr'] = network.save_expr_data(data=expr_data, **expr_params)
        # save expressions, as CSV, to shock
        expr_bytes = network.arr_to_csv(expr_data)
        shock_ids['expr'] = eng.save(data=expr_bytes, name=ws_ids['expr'])

    with LoggedAction("create_sample_id_data"):
        # create list of sample ids
        sample_ids = range(len(expr_data[0]))
        # save sample ids to the workspace
        ws_ids['sampid'] = network.save_sample_ids(ids=sample_ids, **expr_params)
        # save sample ids to Shock
        shock_ids['sampid'] = eng.save(data=sample_ids, name=ws_ids['sampid'])

    with LoggedAction("coex_filter_run"):
        # run coex_filter in Awe, taking as input the samples, expressions and sample ids in Shock
        job = AweJob({"pipeline": "coex_filter", "name": "coex_filter_1", "sessionId": sessionID})
        shock_ids['filtered'] = 'data_filtered_csv'
        job.add_task(cmd=dict(
            args="-i @data_csv --output={}  --sample_index=@sample_id_csv coex_filter".format(shock_ids['filtered']),
            description="filtering", name="coex_filter"),
            inputs=dict(data_csv={"node": shock_ids["samp"]},
                        sample_id_csv={"node": shock_ids["sampid"]}),
            outputs={shock_ids['filtered']: {}})
        awe_ids['coex_filter'] = eng.run(job)
        # wait for the job to finish
        while eng.status().count > 0:
            report_progress(script_name, cur_stage, script_stages)
            time.sleep(3)
        # retrieve (raw) output from coex_filter (into memory, as CSV)
        filtered_data = eng.fetch_output(jobid=awe_ids['coex_filter'], name=shock_ids['filtered'])
        cur_stage += 1
        report_progress(script_name, cur_stage, script_stages)

    # os.system("coex_filter " + coex_filter_args)
    ##
    # 6. Upload filtered output back into Workspace
    ##
    # 6.1 get the reference object
    # lsamples = wsc.get_object({'id' : ont_id + ".g" + gn_id,
    #               'type' : 'ExpressionDataSamplesMap',
    #               'workspace' : workspace_id,
    #               'auth' : token})
    # sids = filter_underscore(lsamples['data'].keys())

    # update (expression) samples from output of filter
    network.update_samples(filtered_data, sample_data, sample_ids)
    # save new samples in workspace
    network.save_sample_data(data=sample_data, **expr_params)


    # 6.4 save back into workspace
    # wsc.save_object({'id' : ont_id + ".g" + gn_id + ".filtered",
    #               'type' : 'ExpressionDataSamplesMap',
    #               'data' : lsamples['data'], 'workspace' : workspace_id,
    #               'auth' : token})


    ##
    # 7, Run coex_net and coex_clust 
    # Note : this step clould be started from already saved coex filtered object
    # In that case we just need to add download and converting again back to csv
    ##

    # run coex_net in awe
    job = AweJob({"pipeline": "coex_net", "name": "coex_net_1", "sessionId": sessionID})
    shock_ids['net'] = 'net_edge_csv'
    job.add_task(cmd=dict(
        args="-i @data_filtered_csv -o {}  -m simple -t edge coex_net".format(shock_ids['net']),
        description="coex network", name="coex_net"),
                 inputs=dict(data_filtered_csv={"origin": "0"}),
                 outputs={shock_ids['net']: {}})
    awe_ids['coex_net'] = eng.run(job)
    # wait for the job to finish
    while eng.status().count > 0:
        report_progress(script_name, cur_stage, script_stages)
        time.sleep(3)
    # retrieve (raw) output (into memory, as CSV)
    net_data = eng.fetch_output(jobid=awe_ids['coex_net'], name=shock_ids['net'])
    cur_stage += 1
    report_progress(script_name, cur_stage, script_stages)


    #os.system("coex_net " + coex_net_args);
    #$run_output = `coex_clust2 $coex_clust_args`; # on test machine, it's not working due to single core (requires at least two cores)
    
    
    ##
    # 8. Save Coexpression network and cluster back into workspace for future visualization
    ##

    # 8.1 get the reference expression object
    # lsamples = wsc.get_object({'id' : ont_id + ".g" + gn_id + ".filtered",
    #               'type' : TYPES.expr_map,
    #               'workspace' : workspace_id,
    #               'auth' : token})
    # sids = [ i for i in sorted(lsamples['data'].keys()) if not i.startswith('_')]

    edges = []

    # 8.2 generate Networks datasets
    dtype = 'FUNCTIONAL_ASSOCIATION'
    datasets = [
        {
            'networkType': dtype,
            'taxons': ['kb|g.' + gn_id],
            'sourceReference': 'WORKSPACE',
            'name': network.edge_core_id,
            'id': network.edge_ds_id,
        'description': "Coexpression network object " + ont_id + " and kb|g." + gn_id + " filtered by coex_net " + coex_filter_args,
        'properties': {
            'original_data_type': 'workspace',
            'original_data_id': URLS.create_ws_url(network.workspace_id, network.gene_id(ont_id, gn_id, "filtered")),
            'coex_filter_args': coex_filter_args,
            'coex_net_args': coex_net_args
        }
      },
      {
        'networkType' : 'FUNCTIONAL_ASSOCIATION',
        'taxons' : [ "kb|g." + gn_id ],
        'sourceReference' : 'WORKSPACE',
        'name' : clust_core_id,
        'id' : clust_ds_id,
        'description' : "Coexpression network object " + ont_id+  " and kb|g." + gn_id + " filtered by coex_net " + coex_filter_args,
        'properties' : { 
          'original_data_type' : 'workspace',
          'original_data_id' : "ws://" + workspace_id + "/" + ont_id +".g" + gn_id + ".filtered",
          'coex_filter_args' : coex_filter_args,
          'coex_clust_args' : coex_net_args # this line need to be changed to clust_args later...
        }
      }
    ]

    # --------------------------------------
    return 0

    # 8.3 process coex network file
    #open(files_rst['edge_net']);
    #cnf.readline(); # skip header
    for line in net_data[1:]:
        line = line.strip().replace('"', '')
        values = line.split(',')
        edges.append({
            'name': 'interacting gene pair',
            'properties': {},
            'strength': values[2],
            'datasetId': edge_ds_id,
            'directed': 'false',
            'userAnnotations': {},
            'id': 'kb|netedge.'+`len(edges)`,
            'nodeId1': get_node_id(values[0], 'GENE'),
            'nodeId2': get_node_id(values[1], 'GENE'),
            'confidence': '0'
        })
  
          
    # 8.4 process coex cluster file
    cnf = open(files_rst['cluster']);
    cnf.readline(); # skip header
    for line in cnf :
        line.strip();
        line = line.replace('"','')
        values = line.split(',')
        edges.append( {
          'name' : 'member of cluster',
          'properties' : {},
          'strength' : '0',
          'datasetId' : clust_ds_id,
          'directed' : 'false',
          'userAnnotations' : {},
          'id' : 'kb|netedge.'+`len(edges)`,
          'nodeId1' : get_node_id(values[0], 'GENE'),
          'nodeId2' : get_node_id("cluster." + values[1], 'CLUSTER'),
          'confidence' : '0'
        })
  
    
    # 8.5 fill annotations
    idc = IDServerAPI("http://kbase.us/services/idserver")
    cdmic = CDMI_API("http://kbase.us/services/cdmi_api")
    oc  = Ontology("http://kbase.us/services/ontology_service") 
    gids = [ i for i in sorted(ugids.keys()) if not i.startswith('cluster')]
    eids = idc.kbase_ids_to_external_ids(gids)
    funcs = cdmic.fids_to_functions(gids)
    ots   = oc.get_goidlist(gids,['biological_process'],['IEA'])
    for hr_nd in nodes :
        gid = hr_nd['entityId']
        if gid in  eids.keys() : hr_nd['userAnnotations']['external_id'] = eids[gid][1]
        if gid in funcs.keys() : hr_nd['userAnnotations']['functions'] = funcs[gid]
        if gid in ots.keys() : hr_nd['userAnnotations']['ontologies'] = ots[gid] # TODO: convert it to JSON string

    # 8.6 generate Networks object
    net_object = {
      'datasets': datasets,
      'nodes': nodes,
      'edges': edges,
      'userAnnotations' : {},
      'name' : 'Coexpression Network',
      'id' : "kb|net." + networks_id,
      'properties' : {
        'graphType' : 'edu.uci.ics.jung.graph.SparseMultigraph'
      }
    }

    # 8.7 Store results object into workspace
    wsc.save_object({'id' : edge_object_id, 
                     'type' : 'Networks', 
                     'data' : net_object, 'workspace' : workspace_id,
                     'auth' : token});

    # --------------------------------------

    # store result in workspace
    network.save_net_data(data=net_data, **expr_params)

if __name__ == '__main__':
    sys.exit(main())
