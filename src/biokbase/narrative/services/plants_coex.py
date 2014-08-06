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
from biokbase.CoExpression.Client import CoExpression
#from biokbase.workspaceService.Client import workspaceService
#from biokbase.workspaceServiceDeluxe.Client import Workspace
from biokbase.cdmi.client import CDMI_API,CDMI_EntityAPI
from biokbase.OntologyService.Client import Ontology
from biokbase.IdMap.Client import IdMap
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
    #awe = "http://140.221.85.182:7080"
    awe = "https://kbase.us/services/awe-api/"
    workspace = "http://kbase.us/services/workspace"
    ws = "http://kbase.us/services/ws"
    #ws = "http://140.221.84.209:7058"
    ids = "http://kbase.us/services/idserver"
    ontology = "http://kbase.us/services/ontology_service"
    #ontology = "http://140.221.85.171:7062"
    gwas = "https://kbase.us/services/GWAS"
    coex = "https://kbase.us/services/coexpression"
    ujs = "https://kbase.us/services/userandjobstate/"
    cdmi = "http://kbase.us/services/cdmi_api"
    #cdmi = "http://140.221.84.182:7032"
    #cdmi  = "http://140.221.85.181:7032"
    #idmap = "http://140.221.85.96:7111"
    #idmap = "http://140.221.85.181:7111"
    idmap = "http://kbase.us/services/id_map"


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

def ids2cds(ql):
    cdmic = CDMI_API(URLS.cdmi)
    idm = IdMap(URLS.idmap)

    gl = set()
    rd = {}
    eids = []
    lids = set()
    mids = set()
    for gid in ql:
      rd[gid] = gid
      if 'kb|g.' in gid:
        if 'locus' in gid:
          lids.add(gid)
        elif 'mRNA' in gid:
          mids.add(gid)
      else:
        eids.append(gid)

    sid2fids = cdmic.source_ids_to_fids(eids)
    for sid in sid2fids:
      for fid in sid2fids[sid]:
        rd[sid] = fid
        if 'locus' in fid:
          lids.add(fid)
        elif 'mRNA' in fid:
          mids.add(fid)
    lidmap = ()
    if len(lids) > 0: lidmap = idm.longest_cds_from_locus(list(lids))
    for lid in lidmap:
      for k in lidmap[lid]:
        gl.add(k)
    midl = list(mids)
    midmap = ()
    if len(mids) > 0: lidmap = idm.longest_cds_from_mrna(list(mids))
    for lid in midmap:
      for k in midmap[lid]:
        gl.add(k)

    for gid in ql:
      if 'kb|g.' in gid:
        if 'locus' in gid:
          for k in lidmap[gid]:
            rd[gid] = k
        elif 'mRNA' in gid:
          for k in midmap[gid]:
            rd[gid] = k
      else:
        if 'locus' in rd[gid]:
            for k in lidmap[rd[gid]]:
              rd[gid] = k
        elif 'mRNA' in rd[gid]:
            for k in midmap[rd[gid]]:
              rd[gid] = k
    return rd

def cds2locus(gids):
    cdmie = CDMI_EntityAPI(URLS.cdmi)
    mrnas_l = cdmie.get_relationship_IsEncompassedIn(gids, [], ['to_link'], [])
    mrnas = dict((i[1]['from_link'], i[1]['to_link']) for i in mrnas_l)
    locus_l = cdmie.get_relationship_IsEncompassedIn(mrnas.values(), [], ['to_link'], [])
    locus = dict((i[1]['from_link'], i[1]['to_link']) for i in locus_l)
    lgids = dict((i,locus[mrnas[i]]) for i in gids if i in mrnas and mrnas[i] in locus)
    return lgids
    
        
def kb_id2ext_id(idc, in_list, chunk_size):
    n = len(in_list);
    rst = {}
    for idx in range(0, n, chunk_size):
        sub_lst = []
        if(idx + chunk_size < n):
            idx_n = idx+chunk_size
            sub_lst = in_list[idx:idx_n]
        else:
            sub_lst = in_list[idx:n]
        while True:
            try:
                rst_tmp = idc.kbase_ids_to_external_ids(sub_lst)
                break
            except:
                pass
        rst = dict(rst.items() + rst_tmp.items())
    return rst

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


def _workspace_output(wsid):
    return json.dumps({'values': [["Workspace object", wsid]]})

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
def filter_expr(meth, series_obj_id=None, filtering_method="anova",
                num_genes=None, p_value="1.0"):
    """Filter expression table to differentially expressed genes

    :param series_obj_id:Object id of the expression series data
    :type series_obj_id:kbtypes.KBaseExpression.ExpressionSeries
    :param filtering_method: Filtering method ('anova' for ANOVA or 'lor' for log-odd ratio)
    :type filtering_method: kbtypes.Unicode
    :param num_genes: Target number of genes (choose this or p-value below)
    :type num_genes: kbtypes.Unicode
    :param p_value: p-value cutoff (choose this or num_genes above)
    :type p_value: kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    meth.stages = 3

    meth.advance("Initialize COEX service")
    cc = CoExpression(URLS.coex, token=meth.token)

    argsx = {"ws_id" : meth.workspace_id, "inobj_id" : series_obj_id, "outobj_id" : series_obj_id+".fltrd",  "p_value" : "0.05", "method" : filtering_method, "num_genes" : num_genes}
    meth.advance("submit job to select genes")
    try:
        jid = cc.filter_genes(argsx)
    except Exception as err:
        raise COEXException("submit job failed: {}".format(err))
    if not jid:
        raise COEXException(2, "submit job failed, no job id")

    AweJob.URL = URLS.awe
    AweJob(meth, started="Differential expression filter", running="Differential expression filter").run(jid[0])

    return _workspace_output(series_obj_id+".fltrd")


@method(name="Construct co-expression network and clusters")
def build_net_clust(meth, series_obj_id=None, net_method='simple', clust_method='hclust',
                    cut_off=None, num_module=None):
    """Construct co-expression network and a set of densely interconnected clusters in co-expression network based on
       expression table object

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
    :output_widget: ValueListWidget
    """
    meth.stages = 3

    meth.advance("Initialize COEX service")
    cc = CoExpression(URLS.coex, token=meth.token)

    argsx = {"ws_id" : meth.workspace_id, "inobj_id" : series_obj_id, "outobj_id" : 'coex_by_' +series_obj_id,  "cut_off" : cut_off, "net_method" : net_method, "clust_method" : clust_method, "num_modules" : num_module}
    meth.advance("submit job to construct network and clusters")
    try:
        jid = cc.const_coex_net_clust(argsx)
    except Exception as err:
        raise COEXException("submit job failed: {}".format(err))
    if not jid:
        raise COEXException(2, "submit job failed, no job id")

    AweJob.URL = URLS.awe
    AweJob(meth, started="Construct coex network and clusters", running="Construct coex network and clusters").run(jid[0])


    return _workspace_output('coex_by_' +series_obj_id)


@method(name="Add ontology annotation for network genes")
def go_anno_net(meth, net_obj_id=None):
    """Add Gene Ontology annotation to network gene nodes

    :param net_obj_id: Network object id
    :type net_obj_id: kbtypes.KBaseNetworks.Network
    :return: Workspace id
    :rtype: kbtypes.Unicode
    :output_widget: ValueListWidget
    """
    meth.stages = 5

    meth.advance("Prepare annotation service")
    #gc = GWAS(URLS.gwas, token=meth.token)

    # load from current or other workspace
    wsid =  meth.workspace_id
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
            if 'CDS' in i or 'locus' in i or (not 'clst' in i and not i.startswith('cluster') and 'ps.' not in i )]

    meth.advance("Get relationships from central data model")
    #eids = idc.kbase_ids_to_external_ids(gids)
    eids = kb_id2ext_id(idc, gids, 100)
    gids2cds = ids2cds(gids)
    cgids    = gids2cds.values()
    cds2l    = cds2locus(cgids)
    #mrnas_l = cdmie.get_relationship_Encompasses(gids, [], ['to_link'], [])
    #mrnas = dict((i[1]['from_link'], i[1]['to_link']) for i in mrnas_l)
    #locus_l = cdmie.get_relationship_Encompasses(mrnas.values(), [], ['to_link'], [])
    #locus = dict((i[1]['from_link'], i[1]['to_link']) for i in locus_l)
    #lgids = [locus[mrnas[i]] for i in gids if i in mrnas.keys()]  # ignore original locus ids in gids
    lgids = cds2l.values()

    meth.advance("Annotate ({:d} nodes, {:d} edges)".format(
                 len(net_object['nodes']), len(net_object['edges'])))
    #ots = oc.get_goidlist(lgids, ['biological_process'], ['IEA'])
    ots = oc.get_goidlist(cgids, [], [])
    oan = () #oc.get_go_annotation(lgids)
    funcs = cdmic.fids_to_functions(lgids)
    funcs_org = cdmic.fids_to_functions(cgids)
    annotate_nodes(net_object, ots=ots, oan=oan, funcs=funcs, funcs_org=funcs_org, eids=eids,
                   gids2cds=gids2cds, cds2l=cds2l)

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

    return _workspace_output(net_obj_id + ".ano")


def annotate_nodes(net_object, ots=None, oan=None, funcs=None, funcs_org=None, eids=None,
                   gids2cds=None, cds2l=None):
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
        if gid.startswith('cluster.') or 'clst' in gid or 'ps.' in gid:
            continue
        cid = gids2cds[gid]
        lid = cds2l[cid]
        if gid in eids:
            hr_nd['user_annotations']['external_id'] = eids[gid][1]
        # try to annotate both locus and cds because some genomes have functions in CDS
        if lid in funcs and funcs[lid]:
            hr_nd['user_annotations']['functions'] = funcs[lid]
        if 'functions' not in hr_nd['user_annotations'] or not hr_nd['user_annotations']['functions']:
          if cid in funcs_org:
            hr_nd['user_annotations']['functions'] = funcs_org[cid]
        if cid in ots:
            go_enr_list = []
            for lcnt, go in enumerate(ots[cid].keys()):
                if lcnt < 0:
                    go_enr_list.append(go + "(go)" + ots[cid][go][0]['desc'] + '\n')
                for i, goen in enumerate(ots[cid][go]):
                    for ext in "domain", "ec", "desc":
                        hr_nd['user_annotations'][go_key(go, i, ext)] = goen[ext]
            hr_nd['user_annotations']['go_annotation'] = ''.join(go_enr_list)
#        if lid in oan['gene_enrichment_annotations']:
#            oan_gea_lid = oan['gene_enrichment_annotations'][lid]  # short alias
#            oan_gea_lid.sort(key=lambda x: x.get('p_value', 1.0))
#            go_enr_list = []
#            for i, goen in enumerate(oan_gea_lid):
#                goen_oid, goen_desc = goen['ontology_id'], goen['ontology_description']
#                hr_nd['user_annotations'][gea_key(i, goen_oid, "desc")] = goen_desc
#                has_pvalue = 'p_value' in goen
#                if has_pvalue:  # optional
#                    hr_nd['user_annotations'][gea_key(i, goen_oid, "p_value")] = goen['p_value']
#                hr_nd['user_annotations'][gea_key(i, goen_oid, "type")] = goen['ontology_type']
#                if i < MAX_COUNT:
#                    if not has_pvalue: continue
#                    pval = "{:6.4f}".format(float(goen['p_value'])) if has_pvalue else "go"
#                    go_enr_list.append("{}({}){}\n".format(goen_oid, pval, goen_desc))
#            hr_nd['user_annotations']['go_enrichnment_annotation'] = ''.join(go_enr_list)


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

    gids = [ i for i in sorted(nc.ugids.keys()) if 'CDS' in i or 'locus' in i or (not 'clst' in i and not i.startswith('cluster'))]
    
    gids2cds = ids2cds(gids)
   
    meth.advance("Run enrichment test for each clusters")
    rows = []
    for hr_nd in net_object[0]['data']['nodes']:
        gid = hr_nd['entity_id']
        if not (gid.startswith('cluster.') or 'clst' in gid ): continue
        glist = nc.get_gene_list(gid)
        # now everything is in CDS id
        #llist = []
        #for i in glist:
        #    if i in mrnas: i = mrnas[i]
        #    if i in locus: i = locus[i]
        #    if 'locus' in i: llist.append(i)
        #llist = [ locus[mrnas[i]] ]; # it will ignore orignal locus ids (TODO: keep locus)
        cds_gl = [gids2cds[i] for i in glist]

        enr_list = oc.get_go_enrichment(cds_gl, domain_list, ec_list, 'hypergeometric', 'GO')
        
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
    :type net_obj_id: kbtypes.KBaseNetworks.Network
    :param cluster_id_list: Comma-separated list of user-selected cluster ids
    :type cluster_id_list:kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    :output_widget: kbasePlantsNTO
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
    data = {'input': net_object[0]['data']}
    #return json.dumps({'token': meth.token, 'workspaceID': meth.workspace_id, 'networkObjectID': net_obj_id + ".trmd" })
    return json.dumps(data)

#@method(name="Network diagram")
#def network_diagram(meth, workspace_id=None, obj_id=None):
#    """Create and embed an interactive view of the network as a force-directed graph.
#
#    :param workspace_id: Workspace name (if empty, defaults to current workspace)
#    :type workspace_id: kbtypes.Unicode
#    :param obj_id: Coexpression network workspace identifier.
#    :type obj_id: kbtypes.KBaseNetworks.Network
#    :return: Workspace objectID for network
#    :rtype: kbtypes.Unicode
#    :output_widget: ForceDirectedNetwork
#    """
#    meth.stages = 1
#    meth.advance("Create plot specification")
#    if not workspace_id:
#        workspace_id = meth.workspace_id
#	return json.dumps({'token': meth.token, 'workspaceID': workspace_id, 'networkObjectID': obj_id })


@method(name="Functional modules")
def gene_network(meth, nto=None):
    """Display information for network clusters.

        :param nto: Network Typed Object
        :type nto: kbtypes.KBaseNetworks.Network
        :return: Rows for display
        :rtype: kbtypes.Unicode
        :output_widget: kbasePlantsNTO
        """
    #:param workspace_id: Workspace name (use current if empty)
    #:type workspace_id: kbtypes.Unicode
    meth.stages = 1
    # if not workspace_id:
    #     meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
    #     workspace_id = meth.workspace_id
    meth.advance("Retrieve NTO from workspace")
    if nto:
        ws = Workspace2(token=meth.token, wsid=meth.workspace_id)
        raw_data = ws.get(nto)
    else:
        raw_data = {}
    data = {'input': raw_data}
    return json.dumps(data)



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
