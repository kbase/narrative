"""
This a conversion of Ranjan Priya's coex_network script into Python 2.7+

Authors:
    Steve Chan <sychan@lbl.gov>
    Dan Gunter <dkgunter@lbl.gov>
"""
__version__ = '0.1'

## Imports

# system
import json
import logging
import os
from string import Template
import sys
import time
import uuid
# third-party
import requests
import os
import urllib2
# package
from biokbase.auth import Token
from biokbase.workspaceService.Client import workspaceService
from biokbase.ExpressionServices.ExpressionServicesClient import ExpressionServices
from biokbase.idserver.client import IDServerAPI
from biokbase.cdmi.client import CDMI_API
from biokbase.OntologyService.Client import Ontology

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

class WorkspaceException(Exception):
    def __init__(self, msg, err):
        Exception.__init__(self, "Workspace error: {} :: {}".format(msg, err))

## Functions

def print_progress(stage, completed, total):
    print("#{},{:d},{:d}".format(stage, completed, total))

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


def upload_file(uri, filename, att_content):
    file_contents = open(filename).read()
    data = {'upload': (filename, file_contents),
            'attributes': ('', att_content)}
    #_log.debug("upload.request data={}".format(data))
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


def get_output_files(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    download_urls = {}
    try:
        download_urls["datafiltered.csv"] = response["data"]["tasks"][0]["outputs"]["data_filtered_csv"]["url"]
        download_urls["edge_list.csv"]    = response["data"]["tasks"][1]["outputs"]["net_edge_csv"]["url"]
        download_urls["coex_modules.csv"] = response["data"]["tasks"][2]["outputs"]["module_csv"]["url"]
    except Exception, e:
        raise Exception("Parsing results: %s" % e)
    return download_urls


def submit_awe_job(uri, awe_job_document):
    _log.debug("Processed document:\n{}".format(awe_job_document))
    content = {'upload': ("awe_job", awe_job_document)}
    r = requests.post("{}/job".format(uri), files=content)
    response = json.loads(r.text)
    if response['data'] is None:
        raise SubmitException("Response from job submit has no data: {}".format(response))
    try:
        return(response['data']['id'])
    except Exception as e:
        raise SubmitException("Parsing response from job submit: {}".format(e))

## Global (configuration) variables

# Server URLs


class URLS:
    _host = '140.221.84.248'
    main = "http://{40.221.84.236:8000/node"
    shock = "http://140.221.84.236:8000"
    awe = "http://140.221.84.236:8001/"
    expression= "http://{}:7075".format(_host)
    workspace= "http://kbase.us/services/workspace"
    ids = "http://kbase.us/services/idserver"
    cdmi = "http://kbase.us/services/cdmi_api"
    ontology = "http://kbase.us/services/ontology_service"

sessionID = str(uuid.uuid4())


# File types, names, and descriptions

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

#coex_filter_args = "-i " + files['expression'] + " -s " + files['sample_id'] + " -o " +files_rst['expression_filtered'] + " -m anova -n 100"
#coex_net_args = "-i " + files_rst['expression_filtered'] +  " -o " +files_rst['edge_net'] + " -c 0.75 "

ugids = {}
nodes = []

# DATA

AWE_JOB = """
{
    "info": {
        "pipeline": "coex-example",
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
        },
        {
            "cmd": {
                "args": "-i @data_filtered_csv -o net_edge_csv -m simple -t edge -r 0.8 -k 40 -p 50 $coex_net", 
                "description": "coex network", 
                "name": "coex_net"
            }, 
            "dependsOn": ["0"], 
            "inputs": {
               "data_filtered_csv": {
                    "host": "$shock_uri",
                    "origin": "0"
                }
            }, 
            "outputs": {
                "net_edge_csv": {
                    "host": "$shock_uri"
                }
            },
            "taskid": "1",
            "skip": 0, 
            "totalwork": 1
        },
        {
            "cmd": {
                "args": "-i @data_filtered_csv -o module_csv -c hclust -n simple -r 0.8 -k 40 -p 50 -d 0.99 $coex_cluster", 
                "description": "clustering", 
                "name": "coex_cluster2"
            }, 
            "dependsOn": ["1"], 
            "inputs": {
               "data_filtered_csv": {
                    "host": "$shock_uri",
                    "origin": "0"
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
            "taskid": "2",
            "skip": 0,
            "totalwork": 1
        }
    ]
}
"""
def gnid(s):
    return s if s.startswith('kb|g.') else 'kb|g.' + s

## MAIN ##

def main(ont_id="GSE5622", gn_id='3899',
         fltr_m='anova', fltr_n='100', fltr_p='0.00005',
         net_c='0.75',
         clust_c='hclust', clust_n='simple', clust_s='10',
         token=None, workspace_id=None):
    """Create a narrative for co-expression network workflow

    1. User uploads multiple files to shock and remembers shock node IDs
    2. An AWE job script is created
    3. Job is submitted to awe service
    4. Node ids of output files are provided

    Modifications (dan gunter):
    - add parameters
    """
    _num_done, total_work = 0, 12

    # parameterize --dang
    coex_args = {}
    coex_args['coex_filter'] = "-p {}".format(fltr_p)
    coex_args['coex_net'] = "-c {}".format(net_c)
    coex_args['coex_cluster'] = "-s {}".format(clust_s)

    ##
    # 1. Get token
    ## 
    _log.info("Get auth token")
    #aconf = {"username" :'kbasetest', "password" :'@Suite525'}
    #auth = Token(aconf)
    #token = 'un=kbasetest|tokenid=0ff5667c-2ae0-11e3-88f8-12313809f035|expiry=1412198758|client_id=kbasetest|token_type=Bearer|SigningSubject=https://nexus.api.globusonline.org/goauth/keys/105f50b4-2ae0-11e3-88f8-12313809f035|sig=a288a0e941120509d3ee1a8ce091160b71f0a61a0731ccf95cc7655266167c9b85b64356f8cec48d67164a55bec1f92074f09367f936e5dac1119744ff2d1c315174fa38285d4e3be612c9cbb83c66242f13a790610eef701e31cb9213d0c48304b9a68d40d3e8f77c8b67f8f97e4d1ec49de10f3c7c8648985354349fb8ea85';

    ##
    # 2. Get expression data
    ## 
    _num_done += 1
    print_progress("Get expression data", _num_done, total_work)

    _log.info("Get expression data")
    #workspace_id = 'coexpr_test'
    edge_object_id = ont_id + ".g" + gn_id +".filtered.edge_net"
    clust_object_id = ont_id+ ".g" + gn_id +".filtered.clust_net"
    edge_core_id = "ws//" +workspace_id+ "/" +edge_object_id
    clust_core_id = "ws//" +workspace_id+ "/" +clust_object_id
    edge_ds_id ="kb|netdataset." + edge_core_id; 
    clust_ds_id ="kb|netdataset." +clust_core_id; 
    networks_id = ont_id+".g" + gn_id + ".filtered.network"


    exprc = ExpressionServices(URLS.expression)
    #series_ids = exprc.get_expression_series_ids_by_series_external_source_ids([ont_id],'and',gnid(gn_id), 'microarray', 'N');
    series_ids = exprc.get_expression_series_ids_by_series_external_source_ids([ont_id]);
    sample_ids = exprc.get_expression_sample_ids_by_series_ids(series_ids);
    sample_data = exprc.get_expression_samples_data(sample_ids);
    
    
    ##
    # 3. Store expression in workspace
    ## 
    _num_done += 1
    print_progress("Store expression in workspace", _num_done, total_work)

    _log.info("Store expression data in workspace")
    wsc = workspaceService(URLS.workspace)
    try :
        wsc.save_object({'id' : ont_id + ".g" + gn_id, 
                  'type' : 'ExpressionDataSamplesMap', 
                  'data' : sample_data, 'workspace' : workspace_id,
                  'auth' : token})
    except Exception as err:
        raise WorkspaceException("Storing expression data", err)
        #print "Err store error...\n"
        #sys.exit(1)

    ##
    # 4. Download expression object from workspace
    ##
    _num_done += 1
    print_progress("Download expression object from workspace", _num_done, total_work)

    _log.info("Download expression data from workspace")
    lsamples = wsc.get_object({'id' : ont_id + ".g" + gn_id, 
                  'type' : 'ExpressionDataSamplesMap', 
                  'workspace' : workspace_id,
                  'auth' : token})

    cif = open(files['expression'], 'w')
    gids = {};
    header ="";
    sample ="";
    sample_id = 0;
    sids = [ i for i in sorted(lsamples['data'].keys()) if not i.startswith('_')]

    for sid in sids:
        header += "," + sid
        gids = dict((i,1) for i in lsamples['data'][sid]['dataExpressionLevelsForSample'].keys())
        if sample != "": sample += "," 
        sample_id +=1;
        sample += `sample_id`


    print >>cif, header 
    for gid in sorted(gids.keys()) :
        line =  gid
        for sid in sids :
            line += "," + lsamples['data'][sid]['dataExpressionLevelsForSample'][gid]
        print >>cif, line
    cif.close();

    sif = open(files['sample_id'], 'w')
    print >>sif, sample
    sif.close();

    ##
    # 5. Run coex_filter <-- this step can be replaced with awk job
    ##
    # os.system("coex_filter " + coex_filter_args)
    _num_done += 1
    print_progress("Submit coexpression filter to AWE", _num_done, total_work)


    _log.info("Run coex_* tools")
    ##
    # AWE running
    ##
    _log.info("Uploading files to shock")
    shock_ids = {}
    for file_type, file_name in files.iteritems():
        _log.info("Uploading to {} :: {} = {}".format(URLS.shock, file_type, file_name))
        file_meta = str(metadata[file_type])
        shock_ids[file_type] = upload_file(URLS.shock, file_name, file_meta)
    _log.debug("Uploaded to shock. ids = {}".format(','.join(shock_ids.values())))

    # Read & substitute values into job spec
    subst = shock_ids.copy()
    subst.update(coex_args)
    subst.update(dict(shock_uri=URLS.shock, session_id=sessionID))
    awe_job_str = Template(AWE_JOB).substitute(subst)
    # Submit job
    job_id = submit_awe_job(URLS.awe, awe_job_str)
    # record provenance
    awe_job_dict = json.loads(awe_job_str)
    coex_filter_args = awe_job_dict['tasks'][0]['cmd']['args']
    coex_net_args = awe_job_dict['tasks'][1]['cmd']['args']
    coex_clust_args = awe_job_dict['tasks'][2]['cmd']['args']

    # Wait for job to complete
    _num_done += 1
    print_progress("Wait for AWE coexpression job to complete", _num_done, total_work)

    _log.info("job.begin")
    while 1:
        time.sleep(5)
        count = check_job_status(URLS.awe, job_id)
        if count == 0:
            break
        _log.debug("job.run tasks_remaining={:d}".format(count))
    _log.info("job.end")

    #print("\n##############################\nDownload and visualize network output\n")

    #print("\nURLs to download output files\n")
    download_urls = get_output_files(URLS.awe, job_id)
    _log.info("Download URLS: {}".format(download_urls))
    #print('\n'.join(['\t\t' + s for s in download_urls]))

    #print("URL to visualize the network\n")
    #viz_urls = get_url_visualization(URLS.awe, job_id)
    #print('\n'.join(['\t\t' + s for s in viz_urls]))


    ##
    # 6. Upload filtered output back into Workspace
    ##
    _num_done += 1
    print_progress("Upload filtered output into workspace", _num_done, total_work)

    # 6.1 get the reference object
    lsamples = wsc.get_object({'id' : ont_id + ".g" + gn_id, 
                  'type' : 'ExpressionDataSamplesMap', 
                  'workspace' : workspace_id,
                  'auth' : token})
    sids = [ i for i in sorted(lsamples['data'].keys()) if not i.startswith('_')]

    # 6.2 read file and parsing
    elm = {};
    #fif = open(files_rst['expression_filtered'])
    fif = urllib2.urlopen(download_urls[files_rst['expression_filtered']]);
    # TODO: make sure # of sample IDs are match to the header of filtered data
    fif.readline(); # skip header

    
    # don't need but to be safe
    for sid in sids : elm[sid] = {}
    
    for line in fif :
        line.strip();
        values = line.split(',')
        for i in range(len(sids)): elm[sids[i]][values[0]] = values[i + 1]

    # 6.3 updating reference object
    for sid in sorted(lsamples['data'].keys()) :
      if sid.startswith('_') : del lsamples['data'][sid]
      else :
          lsamples['data'][sid]['dataExpressionLevelsForSample'] = elm[sid]
          if lsamples['data'][sid]['sampleTitle'] is None: lsamples['data'][sid]['sampleTitle'] = " filtered by coex_filter"
          else : lsamples['data'][sid]['sampleTitle'] += " filtered by coex_filter"
          if lsamples['data'][sid]['experimentDescription'] is None : lsamples['data'][sid]['experimentDescription'] = "Generated by coex_filter " + coex_filter_args
          else : lsamples['data'][sid]['experimentDescription'] += "Generated by coex_filter " + coex_filter_args


    # 6.4 save back into workspace
    wsc.save_object({'id' : ont_id + ".g" + gn_id + ".filtered", 
                  'type' : 'ExpressionDataSamplesMap', 
                  'data' : lsamples['data'], 'workspace' : workspace_id,
                  'auth' : token})


    ##
    # 7, Run coex_net and coex_clust 
    # Note : this step clould be started from already saved coex filtered object
    # In that case we just need to add download and converting again back to csv
    ##
    _num_done += 1
    print_progress("Run coex_net and coex_clust", _num_done, total_work)
    
    #os.system("coex_net " + coex_net_args);
    #$run_output = `coex_clust2 $coex_clust_args`; # on test machine, it's not working due to single core (requires at least two cores)
    
    
    ##
    # 8. Save Coexpression network and cluster back into workspace for future visualization
    ##

    # 8.1 get the reference expression object
    lsamples = wsc.get_object({'id' : ont_id + ".g" + gn_id + ".filtered", 
                  'type' : 'ExpressionDataSamplesMap', 
                  'workspace' : workspace_id,
                  'auth' : token})
    sids = [ i for i in sorted(lsamples['data'].keys()) if not i.startswith('_')]

    edges = [];
    datasets = [];

    # 8.2 generate Networks datasets
    _num_done += 1
    print_progress("Generate networks datasets", _num_done, total_work)

    datasets = [ 
      {
        'networkType' : 'FUNCTIONAL_ASSOCIATION',
        'taxons' : [ gnid(gn_id) ],
        'sourceReference' : 'WORKSPACE',
        'name' : edge_core_id,
        'id' : edge_ds_id,
        'description' : "Coexpression network object " + ont_id+  " and " + gnid(gn_id) + " filtered by coex_net " + coex_filter_args,
        'properties' : { 
          'original_data_type' : 'workspace',
          'original_data_id' : "ws://" + workspace_id + "/" + ont_id +".g" + gn_id + ".filtered",
          'coex_filter_args' : coex_filter_args,
          'coex_net_args' : coex_net_args
        }
      },
      {
        'networkType' : 'FUNCTIONAL_ASSOCIATION',
        'taxons' : [ gnid(gn_id) ],
        'sourceReference' : 'WORKSPACE',
        'name' : clust_core_id,
        'id' : clust_ds_id,
        'description' : "Coexpression network object " + ont_id+  " and " + gnid(gn_id) + " filtered by coex_net " + coex_filter_args,
        'properties' : { 
          'original_data_type' : 'workspace',
          'original_data_id' : "ws://" + workspace_id + "/" + ont_id +".g" + gn_id + ".filtered",
          'coex_filter_args' : coex_filter_args,
          'coex_clust_args' : coex_net_args # this line need to be changed to clust_args later...
        }
      }
    ]


    # 8.3 process coex network file
    _num_done += 1
    print_progress("Process coexpression network file", _num_done, total_work)

    #cnf = open(files_rst['edge_net']);
    cnf = urllib2.urlopen(download_urls[files_rst['edge_net']]);
    cnf.readline(); # skip header
    for line in cnf :
        line.strip();
        line = line.replace('"','')
        values = line.split(',')
        edges.append( {
          'name' : 'interacting gene pair',
          'properties' : {},
          'strength' : values[2],
          'datasetId' : edge_ds_id,
          'directed' : 'false',
          'userAnnotations' : {},
          'id' : 'kb|netedge.'+`len(edges)`,
          'nodeId1' : get_node_id(values[0], 'GENE'),
          'nodeId2' : get_node_id(values[1], 'GENE'),
          'confidence' : '0'
        })
  
          
    # 8.4 process coex cluster file
    _num_done += 1
    print_progress("Process coexpression cluster file", _num_done, total_work)
    #cnf = open(files_rst['cluster']);
    cnf = urllib2.urlopen(download_urls[files_rst['cluster']]);
    cnf.readline(); # skip header
    clstr2genes = {};
    for line in cnf :
        line = line.strip();
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
        if not "cluster." + values[1] in clstr2genes.keys() : clstr2genes["cluster." + values[1]] = {}
        clstr2genes["cluster." + values[1]][values[0]] = 1;
  
    
    # 8.5 fill annotations
    _num_done += 1
    print_progress("Fill annotations", _num_done, total_work)

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
        if gid.startswith('cluster.') :
            enr = oc.get_go_enrichment(clstr2genes[gid].keys(), ['biological_process'], ["IEA","IDA","IPI","IMP","IGI","IEP","ISS","ISS","ISO","ISA","ISM","IGC","IBA","IBD","IKR","IRD","RCA","TAS","NAS","IC","ND","NR"], 'hypergeometric', 'GO')
            hr_nd['userAnnotations']['ontologies'] = enr

    # 8.6 generate Networks object
    net_object = {
      'datasets' : datasets,
      'nodes' : nodes,
      'edges' : edges,
      'userAnnotations' : {},
      'name' : 'Coexpression Network',
      'id' : "kb|net." + networks_id,
      'properties' : {
        'graphType' : 'edu.uci.ics.jung.graph.SparseMultigraph'
      }
    }

    # 8.7 Store results object into workspace
    _num_done += 1
    print_progress("Store result object into workspace", _num_done, total_work)

    wsc.save_object({'id' : edge_object_id, 
                     'type' : 'Networks', 
                     'data' : net_object, 'workspace' : workspace_id,
                     'auth' : token});

    return edge_object_id


# Entry point from IPython
def run_real(params, quiet=True):
    if quiet:
        # disable logging
        _log.setLevel(logging.CRITICAL - 1)
    # parse params
    p = {
        #'fltr_n': params['Filter.-n'],
        #'fltr_m': params['Filter.-m'],
        'fltr_p': params['Filter.p-value'],
        'gn_id': params['Identifiers.Genome'],
        'ont_id': params['Identifiers.Ontology'],
        'net_c': params['Network.Pearson cutoff'],
        #'clust_n': params['Cluster.-n'],
        #'clust_c': params['Cluster.-c']
        'clust_s': params['Cluster.Number of modules']
    }
    p.update(dict(token=os.environ['KB_AUTH_TOKEN'],
                  workspace_id=os.environ['KB_WORKSPACE_ID']))
    obj_id = main(**p)
    print(obj_id)
    return 0

def run_debug(params,**kw):
    print("GSE5622.g3899.filtered.edge_net")

run = run_real # run_debug

if __name__ == '__main__':
    sys.exit(main())


