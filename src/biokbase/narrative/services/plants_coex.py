"""
COEX service.
"""

__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '12/12/13'

## Imports

# Stdlib
import json
import time
import re
import sys
from string import Template

# Third party
import requests
import urllib2

# Service framework
from biokbase.narrative.common.service import init_service, method, finalize_service
from IPython.display import display, HTML
# Other KBase
from biokbase.GWAS.Client import GWAS
from biokbase.workspaceService.Client import workspaceService
from biokbase.workspaceServiceDeluxe.Client import Workspace
from biokbase.cdmi.client import CDMI_API,CDMI_EntityAPI
from biokbase.OntologyService.Client import Ontology
#from biokbase.IdMap.Client import IdMap
from biokbase.idserver.client import IDServerAPI
from biokbase.narrative.common.kbutil import AweJob

## Exceptions


class COEXException(Exception):
    pass

## Globals

VERSION = (0, 0, 1)
NAME = "COEX Service"


class URLS:
    _host = '140.221.84.248'
    main = "http://{40.221.84.236:8000/node"
    shock = "http://140.221.84.236:8000"
    awe = "http://140.221.85.171:7080"
    expression = "http://{}:7075".format(_host)
    workspace = "http://kbase.us/services/workspace"
    #ws = "http://kbase.us/services/ws"
    ws = "http://140.221.84.209:7058"
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

    def __init__(self, unodes = [], uedges=[]):
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


def ws_obj2shock(meth, series_ws_id, series_obj_id):


    wsc = workspaceService(URLS.workspace)
    wsd = Workspace(url=URLS.ws,token=meth.token)

    meth.advance("downloading expression data")

    lseries = wsd.get_object({'id' : series_obj_id,
                  'type' : 'KBaseExpression.ExpressionSeries', 
                  'workspace' : series_ws_id})
                

    meth.advance("convert file format")

    samples = {};
    sids = [];
    genome_id = "";
    for gid in sorted(lseries['data']['genome_expression_sample_ids_map'].keys()):
      genome_id = gid;
      for samid in lseries['data']['genome_expression_sample_ids_map'][gid]:
        sids.append({'ref' : samid});
      samples = wsd.get_objects(sids);
      break;
     

    cif = open(files['expression'], 'w')
    gids = {};
    header ="";
    sample ="";
    sample_id = 0;
    
    sids = [] 
    for i in range(len(samples)):
      sids.append(samples[i]['info'][1])
      header += "," + (samples[i]['data']['source_id'])
      gids = dict((i,1) for i in samples[i]['data']['expression_levels'].keys())
      if sample != "": sample += "," 
      sample += `i`

    print >>cif, header 
    for gid in sorted(gids.keys()) :
        line =  gid
        for i in range(len(samples)) :
            line += "," + str(samples[i]['data']['expression_levels'][gid])
        print >>cif, line
    cif.close();

    sif = open(files['sample_id'], 'w')
    print >>sif, sample
    sif.close();

    meth.advance("Uploading files to shock")
    shock_ids = {}
    for file_type, file_name in files.iteritems():
        file_meta = str(metadata[file_type])
        shock_ids[file_type] = upload_file(URLS.shock, file_name, file_meta)
    nbconsole("Uploaded to shock. ids = {}".format(','.join(shock_ids.values())))
    return {'shock_ids' : shock_ids, 'series' :lseries, 'samples' : samples, 'gnid' : genome_id}

@method(name="Differential expression filter")
def filter_expr (meth, series_ws_id='KBasePublicExpression', series_obj_id=None, filtering_method=None, num_genes=None, p_value=None):
    """Filter expression table to differentially expressed genes

    :param series_ws_id:Workspace name for the expression series data (if empty, defaults to current workspace)
    :type series_ws_id:kbtypes.Unicode
    :param series_obj_id:Object id of the expression series data
    :type series_obj_id:kbtypes.WorkspaceObjectId
    :param filtering_method: Filtering method ('anova' for ANOVA or 'lor' for log-odd ratio)
    :type filtering_method:kbtypes.Unicode
    :param num_genes: Target number of genes (choose this or p-value below)
    :type num_genes:kbtypes.Unicode
    :param p_value: p-value cutoff (choose this or num_genes above)
    :type p_value:kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 8

    meth.advance("init COEX service")

    wsd = Workspace(URLS.ws, token=meth.token)

    if not series_ws_id:
        series_ws_id = meth.workspace_id

    full_obj = ws_obj2shock(meth, series_ws_id, series_obj_id)
    shock_ids = full_obj['shock_ids'];

    # Read & substitute values into job spec
    subst = shock_ids.copy()
    if(num_genes is not None): 
      subst.update({"coex_filter" : "-n {}".format(num_genes)})
    elif(num_genes is None and p_value is not None):
      subst.update({"coex_filter" : "-p {}".format(num_genes)})
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

    

    AweJob(meth, started="filtering expression object", running="filter expression object").run(job_id)

    download_urls = get_output_filter(URLS.awe, job_id)


    meth.advance("upload filtered object")
    # now put them back into ws
    elm = {};
    fif = urllib2.urlopen(download_urls[files_rst['expression_filtered']]);
    # TODO: make sure # of sample IDs are match to the header of filtered data
    fif.readline(); # skip header

    
    nsamples = len(full_obj['samples'])
    # don't need but to be safe
    for i in range(nsamples): elm[i] = {}
    
    for line in fif :
        line.strip();
        values = line.split(',')
        gene_id = values[0].replace("\"", "")
        for i in range(nsamples): elm[i][gene_id] = float(values[i + 1])
    samples = full_obj['samples'];

    data_list = [];
    sid_list =[];
    for i in range(nsamples) :
        samples[i]['data']['expression_levels'] = elm[i]
        if samples[i]['data']['title'] is None: samples[i]['data']['title'] = " filtered by coex_filter"
        else : samples[i]['data']['title'] += " filtered by coex_filter"
        if samples[i]['data']['description'] is None : samples[i]['data']['description'] = "Generated by coex_filter " + coex_filter_args
        else : samples[i]['data']['description'] += " Generated by coex_filter " + coex_filter_args
        samples[i]['data']['id']+=".filtered";
        samples[i]['data']['source_id']+=".filtered";
        data_list.append({'type' : 'KBaseExpression.ExpressionSample', 'data' : samples[i]['data'], 'name' : samples[i]['data']['id']})
    sv_rst = wsd.save_objects({'workspace' : meth.workspace_id, 'objects' : data_list})
    for i in range(nsamples):sid_list.append(str(sv_rst[i][6]) + "/" + str(sv_rst[i][0]) + "/" + str(sv_rst[i][4]))

    data_list = [];
    full_obj['series']['data']['genome_expression_sample_ids_map'][full_obj['gnid']] = sid_list;
    full_obj['series']['data']['title'] += " filtered by coex_filter for " + full_obj['gnid']
    full_obj['series']['data']['source_id'] += ".filtered"
    full_obj['series']['data']['id'] += ".filtered"
    data_list.append({'type' : 'KBaseExpression.ExpressionSeries', 'data' : full_obj['series']['data'], 'name' : full_obj['series']['data']['id'], 'meta' : {'org.data.csv' : shock_ids['expression'], 'org.sample.csv' : shock_ids['sample_id']}})
    wsd.save_objects({'workspace' : meth.workspace_id, 'objects' : data_list})

    return _output_object(full_obj['series']['data']['id'])

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

@method(name="Construct co-expression network and clusters")
def build_net_clust (meth, series_ws_id=None, series_obj_id=None, net_method = 'simple', clust_method = 'hclust', cut_off=None, num_module = None ):
    """Construct co-expression network and a set of densely interconnected clusters in co-expression network based on expression table object

    :param series_ws_id:Workspace name for the expression series data (if empty, defaults to current workspace)
    :type series_ws_id:kbtypes.Unicode
    :param series_obj_id:Object id of the expression Series data
    :type series_obj_id:kbtypes.WorkspaceObjectId
    :param net_method : Network construction algorithm ('simple' for Pearson correlation coefficient or 'WGCNA')
    :type net_method:kbtypes.Unicode
    :param clust_method : Clustering algorithm ('hclust' for hierachical clustering or 'WGNCA')
    :type clust_method:kbtypes.Unicode
    :param cut_off: Lower cutoff to keep edges
    :type cut_off:kbtypes.Unicode
    :param num_module: The number of cluster
    :type num_module:kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 7

    meth.advance("init COEX service")

    wsd = Workspace(url=URLS.ws,token=meth.token)


    if not series_ws_id:
        series_ws_id = meth.workspace_id

    full_obj = ws_obj2shock(meth, series_ws_id, series_obj_id)
    shock_ids = full_obj['shock_ids'];

    # Read & substitute values into job spec
    subst = shock_ids.copy()
    subst.update({"coex_net_cut" : "-c {}".format(cut_off)})
    subst.update({"coex_net_method" : "-m {}".format(net_method)})
    subst.update({"coex_clust_nmodule" : "-s {}".format(num_module)})
    subst.update({"coex_clust_cmethod" : "-c {}".format(clust_method)})
    subst.update({"coex_clust_nmethod" : "-n {}".format(net_method)})
    
    subst.update(dict(shock_uri=URLS.shock, session_id=sessionID))
    awe_job_str = Template(AWE_JOB_NC).substitute(subst)

    #print awe_job_str

    # Submit job
    job_id = submit_awe_job(URLS.awe, awe_job_str)
    # record provenance
    awe_job_dict = json.loads(awe_job_str)
    coex_net_args = awe_job_dict['tasks'][0]['cmd']['args']
    coex_clust_args = awe_job_dict['tasks'][1]['cmd']['args']

    AweJob(meth, started="building co-expression network and clusters", running="build co-expression network and clusters").run(job_id)
    download_urls = get_output_netclust(URLS.awe, job_id)

    #generate Networks datasets
    net_ds_id = series_obj_id + ".net"
    clt_ds_id = series_obj_id + ".clt"

    datasets = [
      {
        'network_type' : 'FUNCTIONAL_ASSOCIATION',
        'taxons' : [ full_obj['gnid'] ],
        'source_ref' : 'WORKSPACE',
        'name' : net_ds_id,
        'id' : clt_ds_id,
        'description' : "Coexpression network object of " + series_obj_id,
        'properties' : {
          'original_data_type' : 'workspace',
          'original_ws_id' : series_ws_id,
          'original_obj_id' : series_obj_id,
          'coex_net_args' : coex_net_args
        }
      },
      {
        'network_type' : 'FUNCTIONAL_ASSOCIATION',
        'taxons' : [ full_obj['gnid'] ],
        'source_ref' : 'WORKSPACE',
        'name' : clt_ds_id,
        'id' : clt_ds_id,
        'description' : "Coexpression cluster object of " + series_obj_id,
        'properties' : {
          'original_data_type' : 'workspace',
          'original_ws_id' : series_ws_id,
          'original_obj_id' : series_obj_id,
          'coex_clust_args' : coex_clust_args 
        }
      }
    ]


    # process coex network file
    nc = Node()

    cnf = urllib2.urlopen(download_urls[files_rst['edge_net']]);
    cnf.readline(); # skip header
    for line in cnf :
        line.strip();
        line = line.replace('"','')
        values = line.split(',')
        if values[0] != values[1] : nc.add_edge(float(values[2]), net_ds_id, values[0], 'GENE', values[1], 'GENE', 0.0) #we add edges meaningful


    # process coex cluster file
    cnf = urllib2.urlopen(download_urls[files_rst['cluster']]);
    cnf.readline(); # skip header
    for line in cnf :
        line = line.strip();
        line = line.replace('"','')
        values = line.split(',')
        nc.add_edge(1.0, clt_ds_id, values[0], 'GENE', "cluster." + values[1], 'CLUSTER', 0.0)

    # generate Networks object
    net_object = {
      'datasets' : datasets,
      'nodes' : nc.nodes,
      'edges' : nc.edges,
      'user_annotations' : {},
      'name' : 'Coexpression Network',
      'id' : series_obj_id + ".netclt",
      'properties' : {
        'graphType' : 'edu.uci.ics.jung.graph.SparseMultigraph'
      }
    }

    # Store results object into workspace
    wsd.save_objects({'workspace' : meth.workspace_id, 'objects' : [{'type' : 'Networks.Network', 'data' : net_object, 'name' : series_obj_id + ".netclt", 'meta' : {'org.data.csv' : shock_ids['expression'], 'org.sample.csv' : shock_ids['sample_id']}}]})

    return _output_object(series_obj_id+".netclt")


@method(name="Add ontology annotation for network genes")
def go_anno_net (meth, net_obj_id=None):
    """Add Gene Ontology annotation to network gene nodes

    :param net_obj_id: Network object id
    :type net_obj_id:kbtypes.WorkspaceObjectId
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("Prepare annotation service")
    gc = GWAS(URLS.gwas, token=meth.token)


    wsd = Workspace(url=URLS.ws,token=meth.token)
    oc = Ontology(url=URLS.ontology)

    net_object = wsd.get_objects([{'workspace' : meth.workspace_id, 'name' : net_obj_id}]);
    nc = Node(net_object[0]['data']['nodes'], net_object[0]['data']['edges'])

    idc = IDServerAPI(URLS.ids)
    cdmic = CDMI_API(URLS.cdmi)
    cdmie = CDMI_EntityAPI(URLS.cdmi)
    #idm = IdMap(URLS.idmap)
    gids = [ i for i in sorted(nc.ugids.keys()) if 'CDS' in i or 'locus' in i or (not 'clst' in i and not i.startswith('cluster'))]
    
    eids = idc.kbase_ids_to_external_ids(gids)
    mrnas_l = cdmie.get_relationship_Encompasses(gids, [],['to_link'],[])
    mrnas = dict((i[1]['from_link'],i[1]['to_link']) for i in mrnas_l)
    locus_l = cdmie.get_relationship_Encompasses(mrnas.values(), [],['to_link'],[])
    locus = dict((i[1]['from_link'],i[1]['to_link']) for i in locus_l)
    lgids = [ locus[mrnas[i]] for i in gids if i in mrnas.keys() ]# it will ignore original locus ids in gids

    meth.advance("Annotate each gene")
    ots   = oc.get_goidlist(lgids,['biological_process'],['IEA'])
    oan  = oc.get_go_annotation(lgids);
    funcs = cdmic.fids_to_functions(lgids)
    for hr_nd in net_object[0]['data']['nodes']:
        gid = hr_nd['entity_id']
        if gid.startswith('cluster.') or 'clst' in gid: continue
        lid = locus[mrnas[gid]]
        if gid in  eids.keys() : hr_nd['user_annotations']['external_id'] = eids[gid][1]
        if lid in funcs.keys() and funcs[lid] is not None: hr_nd['user_annotations']['functions'] = funcs[lid]
        if lid in ots.keys() : 
          for go in ots[lid].keys():
            for i in range(len(ots[lid][go])):
              goen = ots[lid][go][i]
              hr_nd['user_annotations']['go.'+go+"."+`i`+".domain" ] = goen['domain']
              hr_nd['user_annotations']['go.'+go+"."+`i`+".ec" ] = goen['ec']
              hr_nd['user_annotations']['go.'+go+"."+`i`+".desc" ] = goen['desc']
        if lid  in oan['gene_enrichment_annotations'].keys():
          for i in range(len(oan['gene_enrichment_annotations'][lid])):
            goen = oan['gene_enrichment_annotations'][lid][i]
            hr_nd['user_annotations']['gea.'+`i`+"."+goen['ontology_id']+".desc" ] = goen['ontology_description']
            if 'p_value' in goen.keys(): hr_nd['user_annotations']['gea.'+`i`+"."+goen['ontology_id']+".p_value" ] = goen['p_value'] # optional
            hr_nd['user_annotations']['gea.'+`i`+"."+goen['ontology_id']+".type" ] = goen['ontology_type'] 


    wsd.save_objects({'workspace' : meth.workspace_id, 'objects' : [{'type' : 'Networks.Network', 'data' : net_object[0]['data'], 'name' : net_obj_id + ".ano", 'meta' : {'orginal' : net_obj_id}}]})
    return _output_object(net_obj_id + ".ano")


@method(name="Annotate clusters with enriched ontology terms")
def go_enrch_net (meth, net_obj_id=None, p_value = 0.05, ec = None, domain = None):
    """Identify Gene Ontology terms enriched in individual network clusters

    :param net_obj_id: Cluster object id
    :type net_obj_id:kbtypes.WorkspaceObjectId
    :param p_value: p-value cutoff
    :type p_value:kbtypes.Unicode
    :param ec: Evidence code list (comma separated, IEA, ...)
    :type ec:kbtypes.Unicode
    :param domain: Domain list (comma separated, biological_process, ...)
    :type domain:kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("Prepare enrichment test")
    gc = GWAS(URLS.gwas, token=meth.token)

    ec = ec.replace(" ","")
    domain = domain.replace(" ","")
    ec_list = [ i for i in ec.split(',')]
    domain_list = [ i for i in domain.split(',')]


    wsd = Workspace(url=URLS.ws,token=meth.token)
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
    for hr_nd in net_object[0]['data']['nodes']:
        gid = hr_nd['entity_id']
        if not (gid.startswith('cluster.') or 'clst' in gid ): continue
        glist = nc.get_gene_list(gid)
        llist = [ locus[mrnas[i]] for i in glist]; # it will ignore orignal locus ids (TODO: keep locus)

        enr_list = oc.get_go_enrichment(llist, domain_list, ec_list, 'hypergeometric', 'GO')
        
        for i in range(len(enr_list)):
          goen = enr_list[i]
          hr_nd['user_annotations']['ge.'+goen['goID']+".desc" ] = goen['goDesc'][0]
          hr_nd['user_annotations']['ge.'+goen['goID']+".domain" ] = goen['goDesc'][1]
          hr_nd['user_annotations']['ge.'+goen['goID']+".p_value" ] = `goen['pvalue']`

    wsd.save_objects({'workspace' : meth.workspace_id, 'objects' : [{'type' : 'Networks.Network', 'data' : net_object[0]['data'], 'name' : net_obj_id + ".cenr", 'meta' : {'orginal' : net_obj_id}}]})
    return _output_object(net_obj_id + ".cenr")

#@method(name="Construct subnetwork from user-selected genes")
#def const_subnet (meth, net_obj_id=None, cluster_id_list = None):
#    """Construct subnetwork connecting genes in user-selected clusters 
#
#    :param net_obj_id: Cluster object id
#    :type net_obj_id:kbtypes.WorkspaceObjectId
#    :param cluster_id_list: Comma-separated list of user-selected cluster ids 
#    :type cluster_id_list:kbtypes.Unicode
#    :return: Workspace id
#    :rtype: kbtypes.Unicode
#    :output_widget: ForceDirectedNetwork
#    """
#    meth.stages = 2
#
#    gc = GWAS(URLS.gwas, token=meth.token)
#    meth.advance("Extract cluster nodes")
#    #try:
#    #    #jid = gc.gwas_create_population_trait_object(meth.workspace_id, GwasPopulation_obj_id, population_trait_file_id, protocol, comment, originator, output_trait_object_name, kbase_genome_id, trait_ontology_id, trait_name, unit_of_measure)
#    #except Exception as err:
#    #    raise COEXException("submit job failed: {}".format(err))
#    #if not jid:
#    #    raise COEXException(2, "submit job failed, no job id")
#
#    meth.advance("Create plot specification")
#
#    workspace_id = meth.workspace_id
#    workspaceID = "{}.{}".format("kbasetest_home", "GSE5622.g3899.filtered.edge_net")
#    return json.dumps({'token': meth.token, 'workspaceID': workspaceID})

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
