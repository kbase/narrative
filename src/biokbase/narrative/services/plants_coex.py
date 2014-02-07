"""
COEX service.
"""

__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '12/12/13'

## Imports

# Stdlib
import copy
import json
import sys
from string import Template
from operator import itemgetter

# Third party
import requests
import urllib2

# Service framework
from biokbase.narrative.common.service import init_service, method, finalize_service
#from IPython.display import display, HTML
# Other KBase
from biokbase.GWAS.Client import GWAS
#from biokbase.workspaceService.Client import workspaceService
#from biokbase.workspaceServiceDeluxe.Client import Workspace
from biokbase.cdmi.client import CDMI_API,CDMI_EntityAPI
from biokbase.OntologyService.Client import Ontology
##from biokbase.IdMap.Client import IdMap
from biokbase.idserver.client import IDServerAPI
from biokbase.narrative.common.util import AweJob
from biokbase.narrative.common.util import Workspace2

## Exceptions


class COEXException(Exception):
    pass


class UploadException(Exception):
    pass


class SubmitException(Exception):
    pass


## Globals

VERSION = (0, 0, 1)
NAME = "Plants Coexpression Service"


class URLS:
    _host = '140.221.84.248'
    main = "http://{40.221.84.236:8000/node"
    shock = "http://140.221.84.236:8000"
    awe = "http://140.221.85.171:7080"
    expression = "http://{}:7075".format(_host)
    workspace = "http://kbase.us/services/workspace"
    ws = "http://kbase.us/services/ws"
    #ws = "http://140.221.84.209:7058"
    ids = "http://kbase.us/services/idserver"
    #ontology = "http://kbase.us/services/ontology_service"
    ontology = "http://140.221.85.171:7062"
    gwas = "http://140.221.85.171:7086"
    gwas1 = "http://140.221.85.95:7086"
    ujs = "http://140.221.85.171:7083"
    #cdmi = "http://kbase.us/services/cdmi_api"
    #cdmi = "http://140.221.84.182:7032"
    cdmi  = "http://140.221.85.181:7032"
    #idmap = "http://140.221.85.96:7111"
    #idmap = "http://140.221.85.181:7111"


class Node:
    nodes = []
    edges = []
    ugids = {}
    igids = {}
    gid2nt = {}
    clst2genes = {}

    def __init__(self, unodes=None, uedges=None):
        unodes = [] if unodes is None else unodes
        uedges = [] if uedges is None else uedges
        self._register_nodes(unodes)
        self._register_edges(uedges)
  
    def get_node_id(self, node, nt = "GENE"):
      if not node in self.ugids.keys() :
          #print node + ":" + nt
          self.ugids[node] = len(self.ugids)
          self.nodes.append( {
            'entity_id' : node,
            'name' : node,
            'user_annotations' : {},
            'type' : nt,
            'id' : 'kb|netnode.' + `self.ugids[node]`,
            'properties' : {}
          } )
          self.igids['kb|netnode.' + `self.ugids[node]`] = node
          self.gid2nt[node] = nt
      return "kb|netnode." + `self.ugids[node]`

    def add_edge(self, strength, ds_id, node1, nt1, node2, nt2, confidence):
      #print node1 + "<->" + node2
      self.edges.append( {
          'name' : 'interacting gene pair',
          'properties' : {},
          'strength' : float(strength),
          'dataset_id' : ds_id,
          'directed' : 'false',
          'user_annotations' : {},
          'id' : 'kb|netedge.'+`len(self.edges)`,
          'node_id1' : self.get_node_id(node1, nt1),
          'node_id2' : self.get_node_id(node2, nt2),
          'confidence' : float(confidence)
      })
      if(nt1 == 'CLUSTER'):
        if not node1 in self.clstr2genes.keys() : self.clst2genes[node1] = {}
        if(nt2 == 'GENE'):
          self.clst2gene[node1][node2] = 1
      else:
        if(nt2 == 'CLUSTER'):
          if not node2 in self.clst2genes.keys() : self.clst2genes[node2] = {}
          self.clst2genes[node2][node1] = 1
   
    def _register_nodes(self, unodes):
      self.nodes = unodes
      self.ugids = {}
      for node in self.nodes:
        nnid = node['id']
        nnid = nnid.replace("kb|netnode.","");
        self.ugids[node['entity_id']] = nnid
        self.igids[node['id']] = node['entity_id']
        self.gid2nt[node['entity_id']] = node['type']

    def _register_edges(self, uedges):
      self.edges = uedges
      for edge in self.edges:
        node1 = self.igids[edge['node_id1']];
        nt1  = self.gid2nt[node1];
        node2 = self.igids[edge['node_id2']];
        nt2  = self.gid2nt[node2];
        if(nt1 == 'CLUSTER'):
          if not node1 in self.clstr2genes.keys() : self.clst2genes[node1] = {}
          if(nt2 == 'GENE'):
            self.clst2genes[node1][node2] = 1
        else:
          if(nt2 == 'CLUSTER'):
            if not node2 in self.clst2genes.keys() : self.clst2genes[node2] = {}
            self.clst2genes[node2][node1] = 1
        

    def get_gene_list(self, cnode):
      if(cnode in self.clst2genes.keys()) : return self.clst2genes[cnode].keys()
      return []

        
        
        
     
AweJob.URL = URLS.awe

files = {"expression": "data.csv",
         "sample_id": "sample.csv"#,
#         "annotation": "Gene_Annotation.csv",
}
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
sessionID = "1234"

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


# DATA

AWE_JOB_FILTER = """
{
    "info": {
        "pipeline": "coex-filter",
        "name": "testcoex",
        "project": "default",
        "user": "default",
        "clientgroups":"",
         "sessionId":"xyz1234"
    }, 
    "tasks": [
        {
            "cmd": {
                "args": "-i @data_csv --output=data_filtered_csv -m anova --sample_index=@sample_id_csv  -u n -r y -d y $coex_filter", 
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
    ]
}
"""

AWE_JOB_NC = """
{
    "info": {
        "pipeline": "coex-net_cluster",
        "name": "testcoex",
        "project": "default",
        "user": "default",
        "clientgroups":"",
         "sessionId":"xyz1234"
    }, 
    "tasks": [
        {
            "cmd": {
                "args": "-i @data_filtered_csv -o net_edge_csv $coex_net_method -t edge -r 0.8 -k 40 -p 50 $coex_net_cut", 
                "description": "coex network", 
                "name": "coex_net"
            }, 
            "inputs": {
               "data_filtered_csv": {
                    "host": "$shock_uri",
                    "node": "$expression"
                }
            }, 
            "outputs": {
                "net_edge_csv": {
                    "host": "$shock_uri"
                }
            },
            "taskid": "0",
            "skip": 0, 
            "totalwork": 1
        },
        {
            "cmd": {
                "args": "-i @data_filtered_csv -o module_csv $coex_clust_cmethod $coex_clust_nmethod -r 0.8 -k 40 -p 50 -d 0.99 $coex_clust_nmodule", 
                "description": "clustering", 
                "name": "coex_cluster2"
            }, 
            "inputs": {
               "data_filtered_csv": {
                    "host": "$shock_uri",
                    "node": "$expression"
                }
            }, 
            "outputs": {
                "hclust_tree_method=hclust.txt": {
                    "host": "$shock_uri"
                },
                "module_network_edgelist_method=hclust.csv": {
                    "host": "$shock_uri"
                },
                "module_csv": {
                    "host": "$shock_uri"
                }
            },
            "taskid": "1",
            "skip": 0,
            "totalwork": 1
        }
    ]
}
"""
def gnid(s):
    return s if s.startswith('kb|g.') else 'kb|g.' + s

def nbconsole(x):
    sys.stderr.write('@ ' + x + '\n')
    sys.stderr.flush()

# Initialize
init_service(name=NAME, desc="Plants Coexpression service", version=VERSION)


def join_stripped(iterable):
    return ''.join((s.strip() for s in iterable))



def upload_file(uri, filename, att_content):
    file_contents = open(filename).read()
    data = {'upload': (filename, file_contents),
            'attributes': ('', att_content)}
    r = requests.post("%s/node" % uri, files=data)
    response = json.loads(r.text)
    if response['data'] is None:
        raise UploadException("Response from upload has no data: {}".format(response))
    try:
        return response['data']['id']
    except Exception as err:
        raise UploadException("Problem with parsing response from upload: {}".format(err))
    

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
    except Exception as err:
        raise Exception("Parsing merged_csv_node: {}. Response: {}", err, response)
    url_viz = "http://140.221.85.95/gvisualize/%s" % merged_csv_node
    return url_viz


def get_output_filter(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    download_urls = {}
    try:
        download_urls["datafiltered.csv"] = response["data"]["tasks"][0]["outputs"]["data_filtered_csv"]["url"]
    except Exception, e:
        raise Exception("Parsing results: %s" % e)
    return download_urls

def get_output_netclust(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    download_urls = {}
    try:
        download_urls["edge_list.csv"]    = response["data"]["tasks"][0]["outputs"]["net_edge_csv"]["url"]
        download_urls["coex_modules.csv"] = response["data"]["tasks"][1]["outputs"]["module_csv"]["url"]
    except Exception, e:
        raise Exception("Parsing results: %s" % e)
    return download_urls


def submit_awe_job(uri, awe_job_document):
    #_log.debug("Processed document:\n{}".format(awe_job_document))
    content = {'upload': ("awe_job", awe_job_document)}
    r = requests.post("{}/job".format(uri), files=content)
    response = json.loads(r.text)
    if response['data'] is None:
        raise SubmitException("Response from job submit has no data: {}".format(response))
    try:
        return(response['data']['id'])
    except Exception as e:
        raise SubmitException("Parsing response from job submit: {}".format(e))


def _output_object(name):
    """Format an object ID as JSON output, for returning from a narr. function.
    """
    return json.dumps({'output': name})


def ws_obj2shock(ws, obj_id, advance=None, meth=None):
    """Put a workspace object in SHOCK.

    :param ws: Workspace to get object from
    :type ws: Workspace2
    :param obj_id: Object ID
    :type obj_id: str
    :param advance: Reporting obj
    """

    lseries = ws.get(obj_id)

    if lseries is None:
        raise COEXException("Object {} not found in workspace {}".format(obj_id, ws.workspace))
    if meth:
        meth.debug("series object: {}".format(lseries))
    #'type' : 'KBaseExpression.ExpressionSeries',

    advance("Converting file format")

    samples, sids, genome_id = {}, [], ""
    for gid in sorted(lseries['genome_expression_sample_ids_map'].keys()):
        genome_id = gid
        for samid in lseries['genome_expression_sample_ids_map'][gid]:
            sids.append({'ref': samid})
        samples = ws.get_objects(sids)
        break
     

    cif = open(files['expression'], 'w')
    header = ",".join([s['data']['source_id'] for s in samples])
    cif.write(header + "\n")
    gids = samples[0]['data']['expression_levels'].keys()  # each sample has same gids
    for gid in sorted(gids):
        line = gid + ","
        line += ",".join([str(s['data']['expression_levels'][gid]) for s in samples])
        cif.write(line + "\n")
    cif.close()

    sif = open(files['sample_id'], 'w')
    sample = ",".join(map(str, range(len(samples))))
    sif.write(sample + "\n")
    sif.close()

    advance("Uploading files to shock")
    shock_ids = {}
    for file_type, file_name in files.iteritems():
        file_meta = str(metadata[file_type])
        shock_ids[file_type] = upload_file(URLS.shock, file_name, file_meta)

    advance("Uploaded to shock. ids = {}".format(','.join(shock_ids.values())))
    return {'shock_ids': shock_ids, 'series': lseries,
            'samples': samples, 'gnid': genome_id}

@method(name="Differential expression filter")
def filter_expr(meth, series_ws_id=None, series_obj_id=None, filtering_method=None,
                num_genes=None, p_value=None):
    """Filter expression table to differentially expressed genes

    :param series_ws_id:Workspace name for the expression series data (if empty, defaults to current workspace)
    :type series_ws_id:kbtypes.Unicode
    :param series_obj_id:Object id of the expression series data
    :type series_obj_id:kbtypes.WorkspaceObjectId
    :param filtering_method: Filtering method ('anova' for ANOVA or 'lor' for log-odd ratio)
    :type filtering_method: kbtypes.Unicode
    :param num_genes: Target number of genes (choose this or p-value below)
    :type num_genes: kbtypes.Unicode
    :param p_value: p-value cutoff (choose this or num_genes above)
    :type p_value: kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 9

    meth.advance("Initialize COEX service")

    # Connect to workspace.
    if not series_ws_id:
        series_ws_id = meth.workspace_id
    wsd = Workspace2(token=meth.token, wsid=series_ws_id)

    meth.advance("Downloading expression data")
    full_obj = ws_obj2shock(wsd, series_obj_id, advance=meth.advance, meth=meth)
    shock_ids = full_obj['shock_ids']

    # Read & substitute values into job spec
    subst = shock_ids.copy()
    if num_genes is not None:
        subst.update({"coex_filter": "-n {}".format(num_genes)})
    elif num_genes is None and p_value is not None:
        subst.update({"coex_filter": "-p {}".format(num_genes)})
    else:
        raise COEXException("None of p_value and num_genes are specified")
    
    subst.update(dict(shock_uri=URLS.shock, session_id=sessionID))
    awe_job_str = Template(AWE_JOB_FILTER).substitute(subst)
    # Submit job
    job_id = submit_awe_job(URLS.awe, awe_job_str)
    # record provenance
    awe_job_dict = json.loads(awe_job_str)
    coex_filter_args = awe_job_dict['tasks'][0]['cmd']['args']

    # Wait for job to complete
    AweJob(meth, started="Filtering expression object", running="Filter expression object").run(job_id)

    download_urls = get_output_filter(URLS.awe, job_id)

    meth.advance("Upload filtered object")
    # now put them back into ws
    elm = {}
    fif = urllib2.urlopen(download_urls[files_rst['expression_filtered']])
    # TODO: make sure # of sample IDs are match to the header of filtered data
    fif.readline()   # skip header

    nsamples = len(full_obj['samples'])
    # don't need but to be safe
    for i in range(nsamples):
        elm[i] = {}
    
    for line in fif:
        line.strip()
        values = line.split(',')
        gene_id = values[0].replace("\"", "")
        for i in range(nsamples):
            elm[i][gene_id] = float(values[i + 1])
    samples = full_obj['samples']

    data_list = []
    sid_list = []
    for i in range(nsamples):
        samples[i]['data']['expression_levels'] = elm[i]
        if samples[i]['data']['title'] is None:
            samples[i]['data']['title'] = " filtered by coex_filter"
        else:
            samples[i]['data']['title'] += " filtered by coex_filter"
        if samples[i]['data']['description'] is None:
            samples[i]['data']['description'] = "Generated by coex_filter " + coex_filter_args
        else:
            samples[i]['data']['description'] += " Generated by coex_filter " + coex_filter_args
        samples[i]['data']['id'] += ".filtered"
        samples[i]['data']['source_id'] += ".filtered"
        data_list.append({'type': 'KBaseExpression.ExpressionSample', 'data': samples[i]['data'],
                          'name': samples[i]['data']['id']})
    sv_rst = wsd.save_objects({'workspace': meth.workspace_id, 'objects': data_list})
    for i in range(nsamples): sid_list.append(str(sv_rst[i][6]) + "/" + str(sv_rst[i][0]) + "/" + str(sv_rst[i][4]))

    series = full_obj['series']
    series['genome_expression_sample_ids_map'][full_obj['gnid']] = sid_list
    series['title'] += " filtered by coex_filter for " + full_obj['gnid']
    series['source_id'] += ".filtered"
    series['id'] += ".filtered"
    data_list = [{'type': 'KBaseExpression.ExpressionSeries', 'data': series,
                  'name': series['id'], 'meta': {'org.data.csv': shock_ids['expression'],
                                                 'org.sample.csv': shock_ids['sample_id']}}]
    wsd.save_objects({'workspace': meth.workspace_id, 'objects': data_list})

    return _output_object(series['id'])


@method(name="Construct co-expression network and clusters")
def build_net_clust(meth, series_ws_id=None, series_obj_id=None, net_method='simple', clust_method='hclust',
                    cut_off=None, num_module=None):
    """Construct co-expression network and a set of densely interconnected clusters in co-expression network based on
       expression table object

    :param series_ws_id: Workspace name for the expression series data (if empty, defaults to current workspace)
    :type series_ws_id: kbtypes.Unicode
    :param series_obj_id: Object id of the expression Series data
    :type series_obj_id: kbtypes.KBaseExpression.ExpressionSeries
    :param net_method : Network construction algorithm ('simple' for Pearson correlation coefficient or 'WGCNA')
    :type net_method: kbtypes.Unicode
    :param clust_method : Clustering algorithm ('hclust' for hierachical clustering or 'WGNCA')
    :type clust_method: kbtypes.Unicode
    :param cut_off: Lower cutoff to keep edges
    :type cut_off: kbtypes.Unicode
    :param num_module: The number of cluster
    :type num_module: kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 9

    # Check arguments.
    # (note: This should go away once narrative API supports enumerations)
    def _check(val, name, allowed):
        if val not in [a.lower() for a in allowed]:
            values = ", ".join(["'{}'".format(a) for a in allowed])
            raise ValueError("Unknown {}, '{}', not in: {}"
                             .format(name, val, values))
    _check(net_method.lower(), "network construction algorithm", ('simple', 'WGNCA'))
    _check(clust_method.lower(), "clustering algorithm", ('hclust', 'WGNCA'))

    meth.advance("init COEX service")

    # Connect to workspace.
    if not series_ws_id:
        series_ws_id = meth.workspace_id
    wsd = Workspace2(token=meth.token, wsid=series_ws_id)

    # Read obj from SHOCK.
    full_obj = ws_obj2shock(wsd, series_obj_id, advance=meth.advance, meth=meth)
    shock_ids = full_obj['shock_ids']

    # Read & substitute values into job spec
    subst = shock_ids.copy()
    subst.update({
        "coex_net_cut": "-c {}".format(cut_off),
        "coex_net_method": "-m {}".format(net_method),
        "coex_clust_nmodule": "-s {}".format(num_module),
        "coex_clust_cmethod": "-c {}".format(clust_method),
        "coex_clust_nmethod": "-n {}".format(net_method)
    })
    subst.update(dict(shock_uri=URLS.shock, session_id=sessionID))
    awe_job_str = Template(AWE_JOB_NC).substitute(subst)

    #print awe_job_str

    # Submit job.
    job_id = submit_awe_job(URLS.awe, awe_job_str)
    # record provenance
    awe_job_dict = json.loads(awe_job_str)
    coex_net_args = awe_job_dict['tasks'][0]['cmd']['args']
    coex_clust_args = awe_job_dict['tasks'][1]['cmd']['args']

    AweJob(meth, started="building co-expression network and clusters",
           running="build co-expression network and clusters").run(job_id)
    download_urls = get_output_netclust(URLS.awe, job_id)

    # Generate Networks datasets.
    # setup
    net_ds_id = series_obj_id + ".net"
    clt_ds_id = series_obj_id + ".clt"
    # common base
    base = {
        'network_type': 'FUNCTIONAL_ASSOCIATION',
        'taxons': [full_obj['gnid']],
        'source_ref': 'WORKSPACE',
        'name': None,
        'id': clt_ds_id,
        'description': "Coexpression {} object of " + series_obj_id,
        'properties': {
            'original_data_type': 'workspace',
            'original_ws_id': series_ws_id,
            'original_obj_id': series_obj_id,
        }
    }
    # modify base to create network and cluster datasets
    # (note: deepcopy is needed to get 2 copies of 'properties')
    datasets = map(copy.deepcopy, (base, base))
    datasets[0]['name'], datasets[1]['name'] = net_ds_id, clt_ds_id
    for i, thing in enumerate(("network", "cluster")):
        datasets[i]['description'] = datasets[i]['description'].format(thing)
    datasets[0]['properties']['coex_net_args'] = coex_net_args
    datasets[1]['properties']['coex_clust_args'] = coex_clust_args

    # Process coex network/cluster files.
    meth.advance("Process coex network & cluster files")
    # setup
    nc = Node()
    parse_values = lambda line: line.strip().replace('"', '').split(',')
    # network file
    cnf = urllib2.urlopen(download_urls[files_rst['edge_net']])
    cnf.readline()  # skip header
    for line in cnf:
        values = parse_values(line)
        if values[0] != values[1]:
            # we add edges meaningful
            nc.add_edge(float(values[2]), net_ds_id, values[0], 'GENE', values[1], 'GENE', 0.0)
    # cluster file
    cnf = urllib2.urlopen(download_urls[files_rst['cluster']])
    cnf.readline()  # skip header
    for line in cnf:
        values = parse_values(line)
        nc.add_edge(1.0, clt_ds_id, values[0], 'GENE', "cluster." + values[1], 'CLUSTER', 0.0)

    # generate Networks object
    net_object = {
        'datasets': datasets,
        'nodes': nc.nodes,
        'edges': nc.edges,
        'user_annotations': {},
        'name': 'Coexpression Network',
        'id': series_obj_id + ".netclt",
        'properties': {
            'graphType': 'edu.uci.ics.jung.graph.SparseMultigraph'
        }
    }

    # Store results object into workspace
    meth.advance("Store results in workspace")
    obj = {
        'type': 'KBaseNetworks.Network',
        'data': net_object,
        'name': series_obj_id + ".netclt",
        'meta': {
            'org.data.csv': shock_ids['expression'],
            'org.sample.csv': shock_ids['sample_id']
        }
    }
    wsd.save_objects({'workspace': meth.workspace_id, 'objects': [obj]})

    return _output_object(series_obj_id + ".netclt")


@method(name="Add ontology annotation for network genes")
def go_anno_net(meth, workspace=None, net_obj_id=None):
    """Add Gene Ontology annotation to network gene nodes

    :param workspace: Workspace name for the expression series data (if empty, defaults to current workspace)
    :type workspace: kbtypes.Unicode
    :param net_obj_id: Network object id
    :type net_obj_id: kbtypes.KBaseNetworks.Network
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 5

    meth.advance("Prepare annotation service")
    #gc = GWAS(URLS.gwas, token=meth.token)

    # load from current or other workspace
    wsid = workspace or meth.workspace_id
    # save to current workspace
    ws_save_id = meth.workspace_id

    meth.advance("Load network object")
    wsd = Workspace2(token=meth.token, wsid=wsid)
    oc = Ontology(url=URLS.ontology)

    net_object = wsd.get(net_obj_id)
    nc = Node(net_object['nodes'], net_object['edges'])

    idc = IDServerAPI(URLS.ids)
    cdmic = CDMI_API(URLS.cdmi)
    cdmie = CDMI_EntityAPI(URLS.cdmi)
    #idm = IdMap(URLS.idmap)
    gids = [i for i in sorted(nc.ugids.keys())
            if 'CDS' in i or 'locus' in i or (not 'clst' in i and not i.startswith('cluster'))]

    meth.advance("Get relationships from central data model")
    eids = idc.kbase_ids_to_external_ids(gids)
    mrnas_l = cdmie.get_relationship_Encompasses(gids, [], ['to_link'], [])
    mrnas = dict((i[1]['from_link'], i[1]['to_link']) for i in mrnas_l)
    locus_l = cdmie.get_relationship_Encompasses(mrnas.values(), [], ['to_link'], [])
    locus = dict((i[1]['from_link'], i[1]['to_link']) for i in locus_l)
    lgids = [locus[mrnas[i]] for i in gids if i in mrnas.keys()]  # ignore original locus ids in gids

    meth.advance("Annotate ({:d} nodes, {:d} edges)".format(
                 len(net_object['nodes']), len(net_object['edges'])))
    ots = oc.get_goidlist(lgids, ['biological_process'], ['IEA'])
    oan = oc.get_go_annotation(lgids)
    funcs = cdmic.fids_to_functions(lgids)
    annotate_nodes(net_object, ots=ots, oan=oan, funcs=funcs, eids=eids,
                   locus=locus, mrnas=mrnas)

    meth.advance("Save annotated object to workspace {}".format(ws_save_id))
    obj = {
        'type': 'KBaseNetworks.Network',
        'data': net_object,
        'name': net_obj_id + ".ano",
        'meta': {
            'original': net_obj_id
        }
    }
    wsd.save_objects({'workspace': ws_save_id, 'objects': [obj]})

    return _output_object(net_obj_id + ".ano")


def annotate_nodes(net_object, ots=None, oan=None, funcs=None, eids=None,
                   locus=None, mrnas=None):
    """Annotate nodes. Called from `go_anno_net()`.

    :param net_object: Object, modified with annotations.
    :param ots:
    :param oan:
    :param funcs:
    :param eids:
    :param locus:
    :param mrnas:
    :return: None
    """
    # TODO: Documenting the params (above) would make the logic easier to follow.

    go_key = lambda go, i, ext: "go.{}.{:d}.{}".format(go, i, ext)
    gea_key = lambda i, id_, name: "gea.{:d}.{}.{}".format(i, id_, name)
    MAX_COUNT = 3  # XXX: why?

    for hr_nd in net_object['nodes']:
        gid = hr_nd['entity_id']
        if gid.startswith('cluster.') or 'clst' in gid:
            continue
        lid = locus[mrnas[gid]]
        if gid in eids:
            hr_nd['user_annotations']['external_id'] = eids[gid][1]
        if lid in funcs and funcs[lid] is not None:
            hr_nd['user_annotations']['functions'] = funcs[lid]
        if lid in ots:
            go_enr_list = []
            for lcnt, go in enumerate(ots[lid].keys()):
                if lcnt < 0:
                    go_enr_list.append(go + "(go)" + ots[lid][go][0]['desc'] + '\n')
                for i, goen in enumerate(ots[lid][go]):
                    for ext in "domain", "ec", "desc":
                        hr_nd['user_annotations'][go_key(go, i, ext)] = goen[ext]
            hr_nd['user_annotations']['go_annotation'] = ''.join(go_enr_list)
        if lid in oan['gene_enrichment_annotations']:
            oan_gea_lid = oan['gene_enrichment_annotations'][lid]  # short alias
            oan_gea_lid.sort(key=lambda x: x.get('p_value', 1.0))
            go_enr_list = []
            for i, goen in enumerate(oan_gea_lid):
                goen_oid, goen_desc = goen['ontology_id'], goen['ontology_description']
                hr_nd['user_annotations'][gea_key(i, goen_oid, "desc")] = goen_desc
                has_pvalue = 'p_value' in goen
                if has_pvalue:  # optional
                    hr_nd['user_annotations'][gea_key(i, goen_oid, "p_value")] = goen['p_value']
                hr_nd['user_annotations'][gea_key(i, goen_oid, "type")] = goen['ontology_type']
                if i < MAX_COUNT:
                    if not has_pvalue: continue
                    pval = "{:6.4f}".format(float(goen['p_value'])) if has_pvalue else "go"
                    go_enr_list.append("{}({}){}\n".format(goen_oid, pval, goen_desc))
            hr_nd['user_annotations']['go_enrichnment_annotation'] = ''.join(go_enr_list)


@method(name="Annotate clusters with enriched ontology terms")
def go_enrch_net(meth, net_obj_id=None, p_value=0.05, ec=None, domain=None):
    """Identify Gene Ontology terms enriched in individual network clusters

    :param net_obj_id: Cluster object id
    :type net_obj_id: kbtypes.KBaseNetworks.Network
    :param p_value: p-value cutoff
    :type p_value: kbtypes.Unicode
    :param ec: Evidence code list (comma separated, IEA, ...)
    :type ec:kbtypes.Unicode
    :param domain: Domain list (comma separated, biological_process, ...)
    :type domain: kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
#    :default p_value: 0.05
    meth.stages = 3

    meth.advance("Prepare enrichment test")
    gc = GWAS(URLS.gwas, token=meth.token)

    ec = ec.replace(" ","")
    domain = domain.replace(" ","")
    ec_list = [ i for i in ec.split(',')]
    domain_list = [ i for i in domain.split(',')]


    wsd = Workspace2(token=meth.token, wsid=meth.workspace_id)
    oc = Ontology(url=URLS.ontology)

    net_object = wsd.get_objects([{'workspace' : meth.workspace_id, 'name' : net_obj_id}]);
    nc = Node(net_object[0]['data']['nodes'], net_object[0]['data']['edges'])

    idc = IDServerAPI(URLS.ids)
    cdmic = CDMI_API(URLS.cdmi)
    cdmie = CDMI_EntityAPI(URLS.cdmi)
    #idm = IdMap(URLS.idmap)
    gids = [ i for i in sorted(nc.ugids.keys()) if 'CDS' in i or 'locus' in i or (not 'clst' in i and not i.startswith('cluster'))]
    
    mrnas_l = cdmie.get_relationship_Encompasses(gids, [],['to_link'],[])
    mrnas = dict((i[1]['from_link'],i[1]['to_link']) for i in mrnas_l)
    locus_l = cdmie.get_relationship_Encompasses(mrnas.values(), [],['to_link'],[])
    locus = dict((i[1]['from_link'],i[1]['to_link']) for i in locus_l)
    lgids = [ locus[mrnas[i]] for i in gids]# it will ignore original locus ids in gids

   
    meth.advance("Run enrichment test for each clusters")
    rows = []
    for hr_nd in net_object[0]['data']['nodes']:
        gid = hr_nd['entity_id']
        if not (gid.startswith('cluster.') or 'clst' in gid ): continue
        glist = nc.get_gene_list(gid)
        llist = [ locus[mrnas[i]] for i in glist]; # it will ignore orignal locus ids (TODO: keep locus)

        enr_list = oc.get_go_enrichment(llist, domain_list, ec_list, 'hypergeometric', 'GO')
        
        enr_list = sorted(enr_list, key=itemgetter('pvalue'), reverse=False)
        go_enr_smry = "";
        go_enr_anns = ["", "", ""]
        for i in range(len(enr_list)):
          goen = enr_list[i]
          if goen['pvalue'] > float(p_value) : continue
          hr_nd['user_annotations']['gce.'+goen['goID']+".desc" ] = goen['goDesc'][0]
          hr_nd['user_annotations']['gce.'+goen['goID']+".domain" ] = goen['goDesc'][1]
          hr_nd['user_annotations']['gce.'+goen['goID']+".p_value" ] = `goen['pvalue']`
          if i < 3 :
            go_enr_smry += goen['goID']+"(" + "{:6.4f}".format(goen['pvalue']) + ")" + goen['goDesc'][0] + "\n"
            go_enr_anns[i] = goen['goID']+"(" + "{:6.4f}".format(goen['pvalue']) + ")" + goen['goDesc'][0]
        hr_nd['user_annotations']['go_enrichnment_annotation'] =  go_enr_smry
        rows.append([gid,len(glist),go_enr_anns[0],go_enr_anns[1],go_enr_anns[2]])

    wsd.save_objects({'workspace' : meth.workspace_id, 'objects' : [{'type' : 'KBaseNetworks.Network', 'data' : net_object[0]['data'], 'name' : net_obj_id + ".cenr", 'meta' : {'orginal' : net_obj_id}}]})

    rows = sorted(rows, key=lambda x: x[1], reverse=True)
    
    #meth.debug("rows: {}".format(rows))
    header = ["Cluster ID", "# of Genes", "Annotation1", "Annotation2", "Annotation3"]
    data = {'table': [header] + rows}
    return json.dumps(data)
    #return _output_object(net_obj_id + ".cenr")

@method(name="Construct subnetwork from user-selected clusters")
def const_subnet (meth, net_obj_id=None, cluster_id_list = None):
    """Construct subnetwork connecting genes in user-selected clusters 

    :param net_obj_id: Cluster object id
    :type net_obj_id:kbtypes.WorkspaceObjectId
    :param cluster_id_list: Comma-separated list of user-selected cluster ids 
    :type cluster_id_list:kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    :output_widget: ForceDirectedNetwork
    """
    meth.stages = 2

    meth.advance("Extract cluster nodes")

    cluster_id_list = cluster_id_list.replace(" ","")
    clusters = [ i for i in cluster_id_list.split(',')]

    wsd = Workspace2(token=meth.token, wsid=meth.workspace_id)

    net_object = wsd.get_objects([{'workspace' : meth.workspace_id, 'name' : net_obj_id}]);
    nc = Node(net_object[0]['data']['nodes'], net_object[0]['data']['edges'])

    

    keeping_ids = {}
    for cnode in nc.clst2genes.keys():
      if cnode in clusters :
        keeping_ids[cnode] = 1
        for i in nc.clst2genes[cnode].keys():
          keeping_ids[i] = 1
    #meth.debug("IDs to keep : {} ".format(keeping_ids))
    nnodes = []
    nedges = []
    for node in nc.nodes:
      if node['entity_id'] in keeping_ids.keys():
        nnodes.append(node)
    for edge in nc.edges:
      if nc.igids[edge['node_id1']] in keeping_ids.keys() and nc.igids[edge['node_id1']] in keeping_ids.keys():
        nedges.append(edge)

    net_object[0]['data']['nodes'] = nnodes
    net_object[0]['data']['edges'] = nedges
    net_object[0]['data']['user_annotations']['filtered'] = cluster_id_list
    
    wsd.save_objects({'workspace' : meth.workspace_id, 'objects' : [{'type' : 'KBaseNetworks.Network', 'data' : net_object[0]['data'], 'name' : net_obj_id + ".trmd", 'meta' : {'orginal' : net_obj_id, 'cluster_id_list' : cluster_id_list}}]})

    meth.advance("Create plot specification")
    workspaceID = "{}.{}".format(meth.workspace_id, net_obj_id + ".trmd")
    return json.dumps({'token': meth.token, 'workspaceID': workspaceID})

@method(name="Network diagram")
def network_diagram(meth, workspace_id=None, obj_id=None):
    """Create and embed an interactive view of the network as a force-directed graph.

    :param workspace_id: Workspace name (if empty, defaults to current workspace)
    :type workspace_id: kbtypes.Unicode
    :param obj_id: Coexpression network workspace identifier.
    :type obj_id: kbtypes.Unicode
    :return: Workspace objectID for network
    :rtype: kbtypes.Unicode
    :output_widget: ForceDirectedNetwork
    """
    meth.stages = 1
    meth.advance("Create plot specification")
    if not workspace_id:
        workspace_id = meth.workspace_id
    workspaceID = "{}.{}".format(workspace_id, obj_id)
    return json.dumps({'token': meth.token, 'workspaceID': workspaceID})



# Finalize (registers service)
finalize_service()


## OLD

#@method(name="Construct co-expression network")
#def build_net (meth, series_obj_id=None, net_method = 'simple', cut_off=None):
#    """Construct co-expression network based on expression table object
#
#    :param series_obj_id:Object id of the expression series data
#    :type series_obj_id:kbtypes.WorkspaceObjectId
#    :param net_method : Network construction algorithm ('simple' for Pearson correlation coefficient or 'WGCNA')
#    :type net_method:kbtypes.Unicode
#    :param cut_off: Lower cutoff to keep edges
#    :type cut_off:kbtypes.Unicode
#    :return: Workspace id
#    :rtype: kbtypes.Unicode
#    """
#    meth.stages = 3
#
#    meth.advance("init COEX service")
#    gc = GWAS(URLS.gwas, token=meth.token)
#
#    meth.advance("construct co-expression network")
#    #try:
#    #    #jid = gc.gwas_create_population_trait_object(meth.workspace_id, GwasPopulation_obj_id, population_trait_file_id, protocol, comment, originator, output_trait_object_name, kbase_genome_id, trait_ontology_id, trait_name, unit_of_measure)
#    #except Exception as err:
#    #    raise COEXException("submit job failed: {}".format(err))
#    #if not jid:
#    #    raise COEXException(2, "submit job failed, no job id")
#
#    AweJob(meth, started="building co-expression network", running="build co-expression network").run("ddd")
#    return _output_object('Coex_' + series_obj_id)
#
#@method(name="Construct co-expression clusters")
#def build_clust (meth, series_obj_id=None, net_method = 'simple', clust_method = 'hclust',  num_module = None, cut_off=None):
#    """Construct a set of densely interconnected clusters in co-expression network based on expression table object
#
#    :param series_obj_id:Object id of the expression Series data
#    :type series_obj_id:kbtypes.WorkspaceObjectId
#    :param net_method : Network construction algorithm ('simple' for Pearson correlation coefficient or 'WGCNA')
#    :type net_method:kbtypes.Unicode
#    :param clust_method : Clustering algorithm ('hclust' for hierachical clustering or 'WGNCA')
#    :type clust_method:kbtypes.Unicode
#    :param cut_off: Lower cutoff to keep edges
#    :type cut_off:kbtypes.Unicode
#    :param num_module: The number of cluster
#    :type num_module:kbtypes.Unicode
#    :return: Workspace id
#    :rtype: kbtypes.Unicode
#    """
#    meth.stages = 3
#
#    meth.advance("init COEX service")
#    gc = GWAS(URLS.gwas, token=meth.token)
#
#    meth.advance("build co-expression network")
#    #try:
#    #    #jid = gc.gwas_create_population_trait_object(meth.workspace_id, GwasPopulation_obj_id, population_trait_file_id, protocol, comment, originator, output_trait_object_name, kbase_genome_id, trait_ontology_id, trait_name, unit_of_measure)
#    #except Exception as err:
#    #    raise COEXException("submit job failed: {}".format(err))
#    #if not jid:
#    #    raise COEXException(2, "submit job failed, no job id")
#
#    AweJob(meth, started="building co-expression network", running="build co-expression network").run("ddd")
#    return _output_object('Coex_' + series_obj_id)
