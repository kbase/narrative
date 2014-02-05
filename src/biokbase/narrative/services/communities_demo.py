"""
Demo communitites service and methods
"""
__author__ = 'Travis Harrison'
__date__ = '1/10/13'

## Imports
# Stdlib
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
#from biokbase.workspaceService.Client import workspaceService
from biokbase.workspaceServiceDeluxe.Client import Workspace as workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.shock import Client as shockService
from biokbase.mglib import tab_to_matrix

## Globals
VERSION = (0, 0, 1)
NAME = "Communities Services"
default_ws = 'communitiesdemo:home'

class CWS:
    data = 'Communities.Data-1.0'
    handle = 'Communities.DataHandle-1.0'
    profile = 'Communities.Profile-1.0'
    annot = 'Communities.ProfileTable-1.0'
    mg = 'Communities.Metagenome-1.0'
    coll = 'Communities.Collection-1.0'
    proj = 'Communities.Project-1.0'
    seq = 'Communities.SequenceFile-1.0'
    model = 'KBaseFBA.FBAModel-2.0'
    mg_an = 'KBaseGenomes.MetagenomeAnnotation-1.0'

class URLS:
    shock = "http://shock1.chicago.kbase.us"
    awe = "http://140.221.85.36:8000"
    #workspace = "http://kbase.us/services/workspace"
    workspace = "http://140.221.84.209:7058"
    #invocation = "https://kbase.us/services/invocation"
    invocation = "http://140.221.85.110:443"

picrustWF = """{
   "info" : {
      "clientgroups" : "qiime-wolfgang",
      "noretry" : true,
      "project" : "project",
      "name" : "qiime-job",
      "user" : "wgerlach",
      "pipeline" : "qiime-wolfgang"
   },
   "tasks" : [
      {
         "cmd" : {
            "args" : "-i @input.fas -o ucr -p @otu_picking_params.txt -r /home/ubuntu/data/gg_13_5_otus/rep_set/97_otus.fasta",
            "name" : "pick_closed_reference_otus.py",
            "description" : "0_pick_closed_reference_otus"
         },
         "outputs" : {
            "otu_table.biom" : {
               "directory" : "ucr",
               "host" : "$shock"
            }
         },
         "taskid" : "0",
         "inputs" : {
            "input.fas" : {
               "node" : "$seq",
               "host" : "$shock"
            },
            "otu_picking_params.txt" : {
               "node" : "$param",
               "host" : "$shock"
            }
         }
      },
      {
         "cmd" : {
            "args" : "-i @otu_table.biom -o normalized.biom",
            "name" : "normalize_by_copy_number.py",
            "description" : "1_normalize_by_copy_number"
         },
         "outputs" : {
            "normalized.biom" : {
               "host" : "$shock"
            }
         },
         "dependsOn" : [
            "0"
         ],
         "taskid" : "1",
         "inputs" : {
            "otu_table.biom" : {
               "origin" : "0",
               "host" : "$shock"
            }
         }
      },
      {
         "cmd" : {
            "args" : "-i @normalized.biom -o prediction.biom",
            "name" : "predict_metagenomes.py",
            "description" : "2_predict_metagenomes"
         },
         "outputs" : {
            "prediction.biom" : {
               "host" : "$shock"
            }
         },
         "dependsOn" : [
            "1"
         ],
         "taskid" : "2",
         "inputs" : {
            "normalized.biom" : {
               "origin" : "1",
               "host" : "$shock"
            }
         }
      }
   ]
}"""

# Initialize
init_service(name=NAME, desc="Demo workflow communities service", version=VERSION)

def _get_wsname(meth, ws):
    if ws:
        return ws
    elif meth.workspace_id and (meth.workspace_id != 'null'):
        return meth.workspace_id
    else:
        return default_ws

def _submit_awe(wf):
    headers = {'Content-Type': 'multipart/form-data', 'Datatoken': os.environ['KB_AUTH_TOKEN']}
    files = {'upload': ('awe_workflow', cStringIO.StringIO(wf))}
    url = URLS.awe+"/job"
    req = requests.post(url, headers=headers, files=files, allow_redirects=True)
    res = req.json()
    return res['data']
    
def _get_awe_job(jobid):
    req = urllib2.Request('%s/job/%s'%(URLS.awe, jobid))
    res = urllib2.urlopen(req)
    return json.loads(res.read())['data']

def _get_awe_results(jobid, pause=60):
    ajob = _get_awe_job(jobid)
    while ajob['state'] != 'completed':
        if ajob['state'] == 'suspend':
            return None
        time.sleep(pause)
        ajob = _get_awe_job(jobid)
    return ajob

def _get_shock_data(nodeid, binary=False):
    token = os.environ['KB_AUTH_TOKEN']
    shock = shockService(URLS.shock, token)
    return shock.download_to_string(nodeid, binary=binary)

def _run_invo(cmd):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URLS.invocation, token=token)
    stdout, stderr = invo.run_pipeline("", cmd, [], 100000, '/')
    return "".join(stdout), "".join(stderr)

def _get_invo(name, binary=False):
    # upload from invo server
    stdout, stderr = _run_invo("mg-upload2shock %s %s"%(URLS.shock, name))
    node = json.loads(stdout)
    # get file content from shock
    return _get_shock_data(node['id'], binary=binary)

def _put_invo(name, data):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URLS.invocation, token=token)
    # data is a string
    invo.put_file("", name, data, '/')

def _get_ws(wsname, name, wtype):
    token = os.environ['KB_AUTH_TOKEN']
    ws = workspaceService(URLS.workspace)
    obj = ws.get_object({'auth': token, 'workspace': wsname, 'id': name, 'type': wtype})
    data = None
    # Data format
    if 'data' in obj['data']:
        data = obj['data']['data']
    # Handle format
    elif 'ref' in obj['data']:
        data = obj['data']['ref']
    # Collection format
    elif 'members' in obj['data']:
        data = [m['ID'] for m in obj['data']['members']]
    return data

def _put_ws(wsname, name, wtype, data=None, ref=None):
    token = os.environ['KB_AUTH_TOKEN']
    ws = workspaceService(URLS.workspace)
    if data is not None:
        ws.save_object({'auth': token, 'workspace': wsname, 'id': name, 'type': wtype, 'data': data})
    elif ref is not None:
        ws.save_object({'auth': token, 'workspace': wsname, 'id': name, 'type': wtype, 'data': ref})

@method(name="Retrieve Subsytems Annotation")
def _get_annot(meth, workspace, mgid, out_name, top, level, evalue, identity, length, rest):
    """Retrieve all SEED/Subsystems functional annotations for a given metagenome ID. Alternatively, filter annotations for specific taxa.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param mgid: metagenome ID
    :type mgid: kbtypes.Communities.Metagenome
    :ui_name mgid: Metagenome ID
    :param out_name: workspace ID of annotation set table
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :param top: produce annotations for top N abundant taxa
    :type top: kbtypes.Unicode
    :ui_name top: Top Taxa
    :default top: 10
    :param level: taxon level to group annotations by
    :type level: kbtypes.Unicode
    :ui_name level: Annotation Level
    :default level: genus
    :param evalue: negative exponent value for maximum e-value cutoff, default is 5
    :type evalue: kbtypes.Unicode
    :ui_name evalue: E-Value
    :default evalue: 5
    :param identity: percent value for minimum % identity cutoff, default is 60
    :type identity: kbtypes.Unicode
    :ui_name identity: % Identity
    :default identity: 60
    :param length: value for minimum alignment length cutoff, default is 15
    :type length: kbtypes.Unicode
    :ui_name length: Alignment Length
    :default length: 15
    :param rest: lump together remaining taxa after top N
    :type rest: kbtypes.Unicode
    :ui_name rest: Remainder
    :default rest: no
    :return: Metagenome Annotation Set Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 3
    meth.advance("Processing inputs")
    # validate
    if not (mgid and out_name):
        return json.dumps({'header': 'ERROR:  missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if top == '':
        top = 10
    if level == '':
        level = 'genus'
    if evalue == '':
        evalue = 5
    if identity == '':
        identity = 60
    if length == '':
        length = 15
    if rest == '':
        rest = 'no'
    
    meth.advance("Building annotation set from communitites API")
    mg = _get_ws(workspace, in_name, CWS.mg)
    cmd = "mg-get-annotation-set --id %s --top %d --level %s --evalue %d --identity %d --length %d"%(mg['ID'], int(top), level, int(evalue), int(identity), int(length))
    if rest.lower() == 'yes':
        cmd += " --rest"
    cmd += " > "+out_name
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Storing in Workspace")
    anno = _get_invo(out_name, binary=False)
    rows = len(anno.strip().split('\n')) - 1
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'table', 'data': anno}
    text = "Annotation sets for the %s %s from SEED/Subsystems were downloaded into %s. The download used default settings for the E-value (e-%d), percent identity (%d), and alignment length (%d)."%('top '+str(top) if int(top) > 0 else 'merged', level, out_name, int(evalue), int(identity), int(length))
    _put_ws(workspace, out_name, CWS.annot, data=data)
    return json.dumps({'header': text})

@method(name="PICRUSt Predicted Abundance Profile")
def _run_picrust(meth, workspace, in_seq, out_name):
    """Create a KEGG annotated functional abundance profile for 16S data in BIOM format using PICRUSt. The input OTUs are created by QIIME using a closed-reference OTU picking against the Greengenes database (pre-clustered at 97% identity).

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_seq: workspace ID of input sequence file
    :type in_seq: kbtypes.Communities.SequenceFile
    :ui_name in_seq: Input Sequence
    :param out_name: workspace ID of resulting BIOM profile
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :return: PICRUSt Prediction Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 5
    meth.advance("Processing inputs")
    # validate
    if not (in_seq and out_id):
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Retrieve Data from Workspace")
    seq_nid = _get_ws(workspace, in_seq, CWS.seq)['ID']
    _run_invo("echo 'pick_otus:enable_rev_strand_match True' > picrust.params")
    _run_invo("echo 'pick_otus:similarity 0.97' >> picrust.params")
    stdout, stderr = _run_invo("mg-upload2shock %s picrust.params"%(URLS.shock))
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    param_nid = json.loads(stdout)['id']
    wf_tmp = Template(picrustWF)
    wf_str = wf_tmp.substitute(shock=URLS.shock, seq=seq_nid, param=param_nid)
    
    meth.advance("Submiting PICRUSt prediction of KEGG BIOM to AWE")
    ajob = _submit_awe(wf_str)
    
    meth.advance("Waiting on PICRUSt prediction of KEGG BIOM")
    aresult = _get_awe_results(ajob['id'])
    if not aresult:
        return json.dumps({'header': 'ERROR: AWE error running PICRUSt'})
    
    meth.advance("Storing Profile BIOM in Workspace")
    last_task = aresult['tasks'][-1]
    name, info = last_task['outputs'].items()[0]
    data = {'name': name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'biom', 'data': _get_shock_data(info['node'])}
    _put_ws(workspace, out_name, CWS.profile, data=data)
    text = "Abundance Profile BIOM %s created for PICRUSt prediction of %s"%(out_name, in_seq)
    return json.dumps({'header': text})

@method(name="Map KEGG annotation to Subsystems annotation")
def _map_annot(meth, workspace, in_name, out_name):
    """Create SEED/Subsystems annotations from a KEGG metagenome abundance profile.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile BIOM
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param out_name: workspace ID of annotation set table
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :return: Metagenome Annotation Set Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not (in_name and out_name):
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Retrieve Data from Workspace")
    biom = _get_ws(workspace, in_name, CWS.profile)
    # get data if is shock refrence
    try:
        shockid = biom['ID']
        biom = _get_shock_data(shockid)
    except:
        pass
    _put_invo(in_name, biom)
    
    meth.advance("Building annotation set from abundance profile BIOM")
    cmd = "mg-kegg2ss --input %s --output text > %s"%(in_name, out_name)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Storing in Workspace")
    anno = _get_invo(out_name, binary=False)
    rows = len(anno.strip().split('\n')) - 1
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'table', 'data': anno}
    text = "Annotation set %s from SEED/Subsystems was created from KEGG abundance profile BIOM %s."%(out_name, in_name)
    _put_ws(workspace, out_name, CWS.annot, data=data)
    return json.dumps({'header': text})

@method(name="Create Metabolic Model")
def _make_model(meth, workspace, in_name, out_name):
    """Create a draft metabolic model from metagenome Subsystems annotations.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of annotation set table
    :type in_name: kbtypes.Communities.ProfileTable
    :ui_name in_name: Input Name
    :param out_name: workspace ID of model
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :return: Metagenome Model
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not (in_name and out_name):
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.annot))
    
    meth.advance("Create Metagenome Annotation Object")
    cmd = "fba-import-meta-anno %s -u %s.annot -n %s.annot -w %s"%(in_name, in_name, in_name, workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Create Metagenome Model Object")
    cmd = "fba-metaanno-to-models %s.annot -m 1 -w %s -e %s"%(in_name, workspace, workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    htmltext = "<br>".join( stdout.strip().split('\n') )
    return json.dumps({'header': htmltext})

@method(name="Gapfill Metabolic Model")
def _gapfill_model(meth, workspace, in_name):
    """Fill in missing core metabolism functions in a draft model.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of model
    :type in_name: kbtypes.KBaseFBA.FBAModel
    :ui_name in_name: Model Name
    :return: Gapfilled Metagenome Model
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 2
    meth.advance("Processing inputs")
    # validate
    if not in_name:
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Gapfill Model Starting")
    cmd = "kbfba-gapfill %s --numsol 5 --timepersol 3600 --intsol -w %s"%(in_name, workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    htmltext = "<br>".join( stdout.strip().split('\n') )
    return json.dumps({'header': htmltext})

@method(name="Compare Metabolic Model")
def _compare_model(meth, workspace, model1, model2):
    """Compare two or more metabolic models with appropriate statistical tests.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param model1: workspace ID of model 1
    :type model1: kbtypes.KBaseFBA.FBAModel
    :ui_name model1: Model 1 Name
    :param model2: workspace ID of model 2
    :type model2: kbtypes.KBaseFBA.FBAModel
    :ui_name model2: Model 2 Name
    :return: Metagenome Model Comparison
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 2
    meth.advance("Processing inputs")
    # validate
    workspace = _get_wsname(meth, workspace)
    if not (model1 and model1):
        return json.dumps({'header': 'ERROR: missing model 1 and model 2'})
    
    meth.advance("Compare Models")
    cmd = "fba-compare-mdls %s %s"%(';'.join(model_list), workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    htmltext = "<br>".join( stdout.strip().split('\n') )
    return json.dumps({'header': htmltext})

@method(name="Retrieve Annotation Abundance Profile")
def _get_matrix(meth, workspace, ids, out_name, annot, level, source, int_name, int_level, int_source, evalue, identity, length, norm):
    """Retrieve annotation abundance data for selected metagenomes.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param ids: workspace ID of metagenome list
    :type ids: kbtypes.Communities.Collection
    :ui_name ids: Metagenome List
    :param out_name: workspace ID of abundance profile table
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :param annot: annotation of abundance profile, one of 'taxa' or 'functions'
    :type annot: kbtypes.Unicode
    :ui_name annot: Annotation Type
    :default annot: taxa
    :param level: annotation hierarchal level to retrieve abundances for
    :type level: kbtypes.Unicode
    :ui_name level: Annotation Level
    :default level: genus
    :param source: datasource to filter results by
    :type source: kbtypes.Unicode
    :ui_name source: Source Name
    :default source: SEED
    :param int_name: workspace ID of list of names to filter results by
    :type int_name: kbtypes.Communities.Data
    :ui_name int_name: Filter List
    :param int_level: hierarchal level of filter names list
    :type int_level: kbtypes.Unicode
    :ui_name int_level: Filter Level
    :param int_source: datasource of filter names list
    :type int_source: kbtypes.Unicode
    :ui_name int_source: Filter Source
    :param evalue: negative exponent value for maximum e-value cutoff, default is 5
    :type evalue: kbtypes.Unicode
    :ui_name evalue: E-Value
    :default evalue: 5
    :param identity: percent value for minimum % identity cutoff, default is 60
    :type identity: kbtypes.Unicode
    :ui_name identity: % Identity
    :default identity: 60
    :param length: value for minimum alignment length cutoff, default is 15
    :type length: kbtypes.Unicode
    :ui_name length: Alignment Length
    :default length: 15
    :param norm: log transform the abundance data
    :type norm: kbtypes.Unicode
    :ui_name norm: Normalize
    :default norm: yes
    :return: Metagenome Abundance Profile Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not (ids and out_name):
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if annot == '':
        annot = 'taxa'
    if level == '':
        level = 'genus'
    if source == '':
        source = 'SEED'
    if evalue == '':
        evalue = 5
    if identity == '':
        identity = 60
    if length == '':
        length = 15
    if norm == '':
        norm = 'yes'
    
    meth.advance("Retrieve Data from Workspace")
    id_list = _get_ws(workspace, ids, CWS.coll)
    cmd = "mg-compare-%s --format biom --ids %s --level %s --source %s --evalue %d --identity %d --length %d"%(annot, ','.join(id_list), level, source, int(evalue), int(identity), int(length))
    # optional intersection
    if int_name and int_level and int_source:
        _put_invo(int_name, _get_ws(workspace, int_name, CWS.data))
        cmd += " --intersect_name %s --intersect_level %s --intersect_source %s"%(int_name, int_level, int_source)
    if norm.lower() == 'yes':
        cmd += " | mg-compare-normalize --input - --format biom --output biom"
    
    meth.advance("Building abundance profile from communitites API")
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Storing in Workspace")
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'biom', 'data': stdout}
    text = "%s abundance data for %d samples listed in %s were downloaded. %s level %s annotations from the %s database were downloaded into %s. The download used default settings for the E-value (e-%d), percent identity (%d), and alignment length (%d). Annotations with an overall abundance of 1 were removed by singleton filtering. Values did%s undergo normalization."%(annot, len(id_list), ids, level, annot, source, out_name, int(evalue), int(identity), int(length), '' if norm.lower() == 'yes' else ' not')
    _put_ws(workspace, out_name, CWS.profile, data=data)
    return json.dumps({'header': text})

@method(name="Statistical Significance Test")
def _group_matrix(meth, workspace, in_name, out_name, metadata, stat_test, order, direction):
    """Apply matR-based statistical tests to abundance profile data.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param out_name: workspace ID of abundance profile table with significance
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :param metadata: metadata field to group metagenomes by
    :type metadata: kbtypes.Unicode
    :ui_name metadata: Metadata
    :param stat_test: supported statistical tests, one of: Kruskal-Wallis, t-test-paired, Wilcoxon-paired, t-test-unpaired, Mann-Whitney-unpaired-Wilcoxon, ANOVA-one-way, default is Kruskal-Wallis
    :type stat_test: kbtypes.Unicode
    :ui_name stat_test: Stat Test
    :default stat_test: Kruskal-Wallis
    :param order: column number to sort output by, default is last column
    :type order: kbtypes.Unicode
    :ui_name order: Sort by Column
    :param direction: direction of sorting. 'asc' for ascending sort, 'desc' for descending sort
    :type direction: kbtypes.Unicode
    :ui_name direction: Sort Direction
    :default direction: desc
    :return: Metagenome Abundance Profile Significance Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not (in_name and metadata and out_name):
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if stat_test == '':
        stat_test = 'Kruskal-Wallis'
    if direction == '':
        direction = 'desc'

    meth.advance("Retrieve Data from Workspace")
    # abundance profile
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.profile))
    
    meth.advance("Computing Significance")
    cmd = "mg-group-significance --input %s --stat_test %s --metadata '%s' --direction %s --format biom --output biom"%(in_name, stat_test, metadata, direction)
    if order != '':
        cmd += ' --order %d'%int(order)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Storing in Workspace")
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'biom', 'data': stdout}
    text = "The %s test was applied to %s to find annotations that exhibited the most significant differences in abundance. Metadata values for %s were used to create sample groupings. Analysis results are in %s. The rows of the BIOM file contain the test statistic, statistic p, and statistic fdr respectively."%(stat_test, in_name, metadata, out_name)
    _put_ws(workspace, out_name, CWS.profile, data=data)
    return json.dumps({'header': text})

@method(name="Sub-select Abundance Profile")
def _select_matrix(meth, workspace, in_name, out_name, order, direction, cols, rows):
    """Sort and/or subselect annotation abundance data and outputs from statistical analyses.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param out_name: workspace ID of altered profile
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :param order: column number to sort output by, (0 for last column), default is no sorting
    :type order: kbtypes.Unicode
    :ui_name order: Sort by Column
    :param direction: direction of sorting. 'asc' for ascending sort, 'desc' for descending sort
    :type direction: kbtypes.Unicode
    :ui_name direction: Sort Direction
    :default direction: desc
    :param cols: number of columns from the left to return from input table, default is all
    :type cols: kbtypes.Unicode
    :ui_name cols: Columns
    :param rows: number of rows from the top to return from input table, default is all
    :type rows: kbtypes.Unicode
    :ui_name rows: Rows
    :return: Metagenome Abundance Profile Significance Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if direction == '':
        direction = 'desc'

    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.profile))
    
    meth.advance("Manipulating Abundance Table")
    cmd = "mg-select-significance --input %s --direction %s --format biom --output biom"%(in_name, direction)
    txt = "%s was saved as %s."%(in_name, out_name)
    if order != '':
        cmd += ' --order %d'%int(order)
        txt += " Rows were ordered by column %d."%int(order)
    if cols != '':
        cmd += ' --cols %d'%int(cols)
        txt += " All but first %d columns were removed."%int(cols)
    if rows != '':
        cmd += ' --rows %d'%int(rows)
        txt += " All but first %d rows were removed."%int(cols)
    stdout, stderr = _run_invo(cmd)
    
    meth.advance("Storing in Workspace")
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'biom', 'data': stdout}
    _put_ws(workspace, out_name, CWS.profile, data=data)
    return json.dumps({'header': txt})

@method(name="View Abundace Profile")
def _view_matrix(meth, workspace, in_name, row_start, row_end, col_start, col_end, stats):
    """View a slice of a BIOM format abundance profile as a table

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param row_start: row position to start table with, default is first
    :type row_start: kbtypes.Unicode
    :ui_name row_start: Row Start
    :param row_end: row position to end table with, default is last
    :type row_end: kbtypes.Unicode
    :ui_name row_end: Row End
    :param col_start: column position to start table with, default is first
    :type col_start: kbtypes.Unicode
    :ui_name col_start: Column Start
    :param col_end: column position to end table with, default is last
    :type col_end: kbtypes.Unicode
    :ui_name col_end: Column End
    :param stats: include significance stats in table view
    :type stats: kbtypes.Unicode
    :ui_name stats: Show Stats
    :default stats: yes
    :return: Metagenome Abundance Profile Table
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if stats == '':
        stats = 'yes'

    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.profile))
    
    meth.advance("Manipulating Table")
    cmd = "mg-biom-view --input %s"%in_name
    if row_start != '':
        cmd += ' --row_start %d'%int(row_start)
    if row_end != '':
        cmd += ' --row_end %d'%int(row_end)
    if col_start != '':
        cmd += ' --col_start %d'%int(col_start)
    if col_end != '':
        cmd += ' --col_end %d'%int(col_end)
    if stats.lower() == 'yes':
        cmd += ' --stats'
    stdout, stderr = _run_invo(cmd)
    
    meth.advance("Displaying Table")
    table = [[c for c in r.split('\t')] for r in stdout.rstrip().split('\n')]
    return json.dumps({'table': table})

@method(name="Boxplots from Abundance Profile")
def _plot_boxplot(meth, workspace, in_name, use_name):
    """Generate boxplots from annotation abundance data.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param use_name: label by metagenome name and not ID
    :type use_name: kbtypes.Unicode
    :ui_name use_name: Label Name
    :default use_name: no
    :return: Metagenome Abundance Profile Significance Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not in_name:
        json.dumps({'header': 'ERROR: missing input'})
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if use_name == '':
        use_name = 'no'
    
    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.profile))
    
    meth.advance("Calculating Boxplot")
    cmd = "mg-compare-boxplot-plot --input %s --plot %s.boxplot --format biom"%(in_name, in_name)
    if use_name.lower() == 'yes':
        cmd += ' --name'
    stdout, stderr = _run_invo(cmd)
    if stderr:
        json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Displaying Boxplot")
    text = 'Boxplot was produced for abundance profile %s.'%in_name
    rawpng = _get_invo(in_name+'.boxplot.png', binary=True)
    b64png = base64.b64encode(rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '650', 'data': b64png})

@method(name="Heatmap from Abundance Profiles")
def _plot_heatmap(meth, workspace, in_name, use_name, distance, cluster, order, label):
    """Generate a heatmap-dendrogram from annotation abundance data.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param use_name: label by metagenome name and not ID
    :type use_name: kbtypes.Unicode
    :ui_name use_name: Label Name
    :default use_name: no
    :param distance: distance/dissimilarity metric, one of: bray-curtis, euclidean, maximum, manhattan, canberra, minkowski, difference
    :type distance: kbtypes.Unicode
    :ui_name distance: Distance
    :default distance: euclidean
    :param cluster: cluster method, one of: ward, single, complete, mcquitty, median, centroid
    :type cluster: kbtypes.Unicode
    :ui_name cluster: Cluster
    :default cluster: ward
    :param order: order columns
    :type order: kbtypes.Unicode
    :ui_name order: Order
    :default order: yes
    :param label: label rows 
    :type label: kbtypes.Unicode
    :ui_name label: Label
    :default label: no
    :return: Metagenome Abundance Profile Significance Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not in_name:
        json.dumps({'header': 'ERROR: missing input'})
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if use_name == '':
        use_name = 'no'
    if distance == '':
        distance = 'euclidean'
    if cluster == '':
        cluster = 'ward'
    if order == '':
        order = 'yes'
    if label == '':
        label = 'no'
    
    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.profile))
    
    meth.advance("Calculating Heatmap")
    cmd = "mg-compare-heatmap-plot --input %s --plot %s.heatmap --distance %s --cluster %s --format biom"%(in_name, in_name, distance, cluster)
    if use_name.lower() == 'yes':
        cmd += ' --name'
    if order.lower() == 'yes':
        cmd += ' --order'
    if label.lower() == 'yes':
        cmd += ' --label'
    stdout, stderr = _run_invo(cmd)
    if stderr:
        json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Displaying Heatmap")
    text = "A heatmap-dendrogram was produced from the abundance profile %s. The %s distance/dissimilarity was used to compute distances and %s was used to cluster the data. Rows (annotations) were sorted; columns were%s sorted."%(in_name, distance, cluster, '' if order.lower() == 'yes' else ' not')
    rawpng = _get_invo(in_name+'.heatmap.png', binary=True)
    b64png = base64.b64encode(rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '600', 'data': b64png})

@method(name="PCoA from Abundance Profiles")
def _plot_pcoa(meth, workspace, in_name, metadata, distance, three):
    """Generate a PCoA from annotation abundance data.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param metadata: metadata field to group metagenomes by
    :type metadata: kbtypes.Unicode
    :ui_name metadata: Metadata
    :param distance: distance/dissimilarity metric, one of: bray-curtis, euclidean, maximum, manhattan, canberra, minkowski, difference
    :type distance: kbtypes.Unicode
    :ui_name distance: Distance
    :default distance: euclidean
    :param three: create 3-D PCoA
    :type three: kbtypes.Unicode
    :ui_name three: 3D
    :default three: no
    :return: Metagenome Abundance Profile Significance Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not in_name:
        return json.dumps({'header': 'ERROR: missing input'})
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if distance == '':
        distance = 'euclidean'
    if three == '':
        three = 'no'
    
    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.profile))
    
    meth.advance("Computing PCoA")
    cmd = "mg-compare-pcoa-plot --input %s --plot %s.pcoa --distance %s --format biom"%(in_name, in_name, distance)
    if metadata != '':
        cmd += " --metadata '%s'"%metadata
    if three.lower() == 'yes':
        cmd += ' --three'
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Displaying PCoA")
    text = "A %s dimensional PCoA calculated from %s distance/dissimilarity was created from %s."%('three' if three.lower() == 'yes' else 'two', distance, in_name)
    if metadata:
        text += " Samples were colored by metadata values for %s."%metadata
    fig_rawpng = _get_invo(in_name+'.pcoa.png', binary=True)
    fig_b64png = base64.b64encode(fig_rawpng)
    leg_rawpng = _get_invo(in_name+'.pcoa.png.legend.png', binary=True)
    leg_b64png = base64.b64encode(leg_rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '600', 'data': fig_b64png, 'legend': leg_b64png})

# Finalization
finalize_service()
