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
from collections import defaultdict
# Local
from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.narrative.common import kbtypes
#from biokbase.workspaceService.Client import workspaceService
from biokbase.workspaceServiceDeluxe.Client import Workspace as workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.mglib import tab_to_matrix

## Globals
VERSION = (0, 0, 1)
NAME = "communities"
default_ws = 'communitiesdemo:home'

class URLS:
    shock = "http://shock1.chicago.kbase.us"
    awe = "http://140.221.85.36:8000"
    #workspace = "http://kbase.us/services/workspace"
    workspace = "http://140.221.84.209:7058"
    #invocation = "https://kbase.us/services/invocation"
    invocation = "http://140.221.85.110:443"

picrustWF = """
{
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
            "args" : "pick_closed_reference_otus.py -i @input.fas -o ucr -p @otu_picking_params.txt -r /home/ubuntu/data/gg_13_5_otus/rep_set/97_otus.fasta",
            "description" : "0_pick_closed_reference_otus"
         },
         "outputs" : {
            "otu_table.biom" : {
               "directory" : "ucr",
               "host" : "{0}"
            }
         },
         "taskid" : "0",
         "inputs" : {
            "input.fas" : {
               "node" : "{1}",
               "host" : "{0}"
            },
            "otu_picking_params.txt" : {
               "node" : "{2}",
               "host" : "{0}"
            }
         }
      },
      {
         "cmd" : {
            "args" : "normalize_by_copy_number.py -i @otu_table.biom -o normalized.biom",
            "description" : "1_normalize_by_copy_number"
         },
         "outputs" : {
            "normalized.biom" : {
               "host" : "{0}"
            }
         },
         "dependsOn" : [
            "0"
         ],
         "taskid" : "1",
         "inputs" : {
            "otu_table.biom" : {
               "origin" : "0",
               "host" : "{0}"
            }
         }
      },
      {
         "cmd" : {
            "args" : "predict_metagenomes.py -i @normalized.biom -o prediction.biom",
            "description" : "2_predict_metagenomes"
         },
         "outputs" : {
            "prediction.biom" : {
               "host" : "{0}"
            }
         },
         "dependsOn" : [
            "1"
         ],
         "taskid" : "2",
         "inputs" : {
            "normalized.biom" : {
               "origin" : "1",
               "host" : "{0}"
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
    tmpfile = 'awewf.json'
    headers = { 'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Datatoken': os.environ['KB_AUTH_TOKEN'] }
    with open(tmpfile, 'w') as f:
        f.write(wf)
    try:
        url = '%s/job'%(URLS.awe)
        req = urllib2.Request(URLS.awe+'/job', data=urllib.urlencode({'upload': tmpfile}), headers=header)
        res = urllib2.urlopen(req)
        return json.loads(res.read())
    except:
        return None

def _run_invo(cmd):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URLS.invocation, token=token)
    stdout, stderr = invo.run_pipeline("", cmd, [], 100000, '/')
    return "".join(stdout), "".join(stderr)

def _get_invo(name):
    # upload from invo server
    stdout, stderr = _run_invo("mg-upload2shock %s %s"%(URLS.shock, name))
    node = json.loads(stdout)
    # get file content from shock
    token  = os.environ['KB_AUTH_TOKEN']
    header = {'Accept': 'application/json', 'Authorization': 'OAuth %s'%token}
    try:
        url = '%s/node/%s?download'%(URLS.shock, node['id'])
        req = urllib2.Request(url, headers=header)
        res = urllib2.urlopen(req)
        return res.read()
    except:
        return ''

def _put_invo(name, data):
    token = os.environ['KB_AUTH_TOKEN']
    invo = InvocationService(url=URLS.invocation, token=token)
    # data is a string
    invo.put_file("", name, data, '/')

def _get_ws(wsname, name):
    token = os.environ['KB_AUTH_TOKEN']
    ws = workspaceService(URLS.workspace)
    obj = ws.get_object({'auth': token, 'workspace': wsname, 'id': name, 'type': 'Communities.Data-1.0'})
    data = None
    # CommunitiesData format
    if 'data' in obj['data']:
        data = obj['data']['data']
    # CommunitiesDataHandle format
    elif 'ref' in obj['data']:
        data = obj['data']['ref']
    return data

def _put_ws(wsname, name, data=None, ref=None):
    token = os.environ['KB_AUTH_TOKEN']
    ws = workspaceService(URLS.workspace)
    wtype = 'Communities.DataHandle-1.0' if ref else 'Communities.Data-1.0'
    if data is not None:
        ws.save_object({'auth': token, 'workspace': wsname, 'id': name, 'type': 'Communities.Data-1.0', 'data': data})
    elif ref is not None:
        ws.save_object({'auth': token, 'workspace': wsname, 'id': name, 'type': 'Communities.DataHandle-1.0', 'data': ref})

def _label_ws_meta(meta):
    meta_keys = ['id', 'type', 'moddate', 'instance', 'command', 'lastmodifier', 'owner', 'workspace', 'ref', 'checksum']
    return list(zip(meta_keys, meta))

# replace mgids with group names
def _relabel_cols(data, groups, pos):
    grows, gcols, gdata = tab_to_matrix(groups)
    rows = data.strip().split('\n')
    head = rows[0].strip().split('\t')
    gidx = int(pos) - 1
    gmap = {}
    for r, row in enumerate(gdata):
        gmap[grows[r]] = row[gidx]
    for i in range(len(head)):
        if head[i] in gmap:
            head[i] = gmap[head[i]]+'_'+str(i+1)
    rows[0] = "\t".join(head)
    return "\n".join(rows)+"\n"

@method(name="Retrieve Annotation Set")
def _get_annot(meth, workspace, mgid, out_name, top, level, evalue, identity, length, rest):
    """Retrieve a Subsystems annotation set based on the top N taxa of the inputted metagenome ID.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param mgid: metagenome ID
    :type mgid: kbtypes.Unicode
    :ui_name mgid: Metagenome ID
    :param out_name: workspace ID of annotation set table
    :type out_name: kbtypes.WorkspaceObjectId
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
    cmd = "mg-get-annotation-set --id %s --top %d --level %s --evalue %d --identity %d --length %d"%(mgid, int(top), level, int(evalue), int(identity), int(length))
    if rest.lower() == 'yes':
        cmd += " --rest"
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Storing in Workspace")
    rows = len(stdout.strip().split('\n')) - 1
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'table', 'data': stdout}
    text = "Annotation sets for the top %d %s from SEED/Subsystems were downloaded into %s. The download used default settings for the E-value (e-%d), percent identity (%d), and alignment length (%d)."%(int(top), level, out_name, int(evalue), int(identity), int(length))
    _put_ws(workspace, out_name, data=data)
    return json.dumps({'header': text})

@method(name="Predict PICRUSt Abundance Profile")
def _redo_annot(meth, workspace, in_seq, out_id):
    """Create a KEGG annotated functional abundance profile BIOM for 16S data using PICRUSt.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_seq: workspace ID of input sequence file
    :type in_seq: kbtypes.WorkspaceObjectId
    :ui_name in_seq: Input Sequence
    :param out_id: workspace ID of running AWE ID
    :type out_id: kbtypes.WorkspaceObjectId
    :ui_name out_id: Output ID
    :return: PICRUSt Prediction Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not (in_seq and out_id):
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Retrieve Data from Workspace")
    seq_nid = _get_ws(workspace, in_seq)['ID']
    _run_invo("echo 'pick_otus:enable_rev_strand_match True' > picrust.params")
    _run_invo("echo 'pick_otus:similarity 0.97' >> picrust.params")
    stdout, stderr = _run_invo("mg-upload2shock %s picrust.params"%(URLS.shock))
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    param_nid = json.loads(stdout)['id']
    pwf = picrustWF.format(URLS.shock, seq_nid, param_nid)
    
    meth.advance("Submiting PICRUSt prediction of KEGG BIOM to AWE")
    job = _submit_awe(pwf)
    job_id = job['data']['id']
    
    meth.advance("Storing status in Workspace")
    data = { 'name': out_id,
             'created': time.strftime("%Y-%m-%d %H:%M:%S"),
             'type': 'awe_job',
             'ref': {'ID': job_id, 'URL': URLS.awe+'/job/'+job_id} }
    text = "PICRUSt prediction of %s running under AWE job %s. Status available here: %s"%(in_seq, job_id, URLS.awe+'/job/'+job_id)
    _put_ws(workspace, out_id, ref=data)
    return json.dumps({'header': text})

@method(name="Annotation Set from Abundance Profile")
def _redo_annot(meth, workspace, in_name, out_name):
    """Create a Subsystems annotation set from a KEGG metagenome abundance profile.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile BIOM
    :type in_name: kbtypes.WorkspaceObjectId
    :ui_name in_name: Input Name
    :param out_name: workspace ID of annotation set table
    :type out_name: kbtypes.WorkspaceObjectId
    :ui_name out_name: Output Name
    :return: Metagenome Annotation Set Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 3
    meth.advance("Processing inputs")
    # validate
    if not (in_name and out_name):
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Building annotation set BIOM from abundance profile")
    cmd = "mg-kegg2ss --input %s --output text"%(in_name)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Storing in Workspace")
    rows = len(stdout.strip().split('\n')) - 1
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'table', 'data': stdout}
    text = "Annotation set %s from SEED/Subsystems was created from KEGG abundance profile BIOM %s."%(out_name, in_name)
    _put_ws(workspace, out_name, data=data)
    return json.dumps({'header': text})

@method(name="Create Metabolic Model")
def _redo_annot(meth, workspace, in_name, out_name):
    """Create a metabolic model from a metagenome annotation set.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of annotation set table
    :type in_name: kbtypes.WorkspaceObjectId
    :ui_name in_name: Input Name
    :param out_name: workspace ID of model
    :type out_name: kbtypes.WorkspaceObjectId
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
    _put_invo(in_name, _get_ws(workspace, in_name))
    
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
def _redo_annot(meth, workspace, in_name):
    """Gapfill a metagenomic metabolic model.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of model
    :type in_name: kbtypes.WorkspaceObjectId
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
def _redo_annot(meth, workspace, model1, model2):
    """Gapfill a metagenomic metabolic model.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param model1: workspace ID of model 1
    :type model1: kbtypes.WorkspaceObjectId
    :ui_name model1: Model 1 Name
    :param model2: workspace ID of model 2
    :type model2: kbtypes.WorkspaceObjectId
    :ui_name model2: Model 2 Name
    :param names: workspace ID of list of models, use if comparing more than two
    :type names: kbtypes.Unicode
    :ui_name names: Model List
    :return: Metagenome Model Comparison
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 2
    meth.advance("Processing inputs")
    # validate
    workspace = _get_wsname(meth, workspace)
    if names != '':
        model_list = _get_ws(workspace, names).strip().split('\n')
    elif (model1 != '') and (model2 != ''):
        model_list = [model1, model2]
    else:
        return json.dumps({'header': 'ERROR: missing model1 and model2 names'})
    
    meth.advance("Compare Models")
    cmd = "fba-compare-mdls %s %s"%(';'.join(model_list), workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    htmltext = "<br>".join( stdout.strip().split('\n') )
    return json.dumps({'header': htmltext})

@method(name="Retrieve Abundance Profile")
def _get_matrix(meth, workspace, ids, out_name, annot, level, source, int_name, int_level, int_source, evalue, identity, length, norm):
    """Retrieve an abundance profile of the inputted metagenome IDs based in inputted options.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param ids: workspace ID of metagenome list
    :type ids: kbtypes.Unicode
    :ui_name ids: Metagenome List
    :param out_name: workspace ID of abundance profile table
    :type out_name: kbtypes.WorkspaceObjectId
    :ui_name out_name: Output Name
    :param annot: annotation of abundance profile, one of 'taxa' or 'function'
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
    :param int_name: workspace ID of list of intersecting names to filter results by
    :type int_name: kbtypes.Unicode
    :ui_name int_name: Intersection List
    :param int_level: intersecting hierarchal level to filter results by
    :type int_level: kbtypes.Unicode
    :ui_name int_level: Intersection Level
    :param int_source: intersecting datasource to filter results by
    :type int_source: kbtypes.Unicode
    :ui_name int_source: Intersection Source
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
    id_list = _get_ws(workspace, ids).strip().split('\n')
    cmd = "mg-compare-%s --format text --ids %s --level %s --source %s --evalue %d --identity %d --length %d"%(annot, ','.join(id_list), level, source, int(evalue), int(identity), int(length))
    # optional intersection
    if int_name and int_level and int_source:
        _put_invo(int_name, _get_ws(workspace, int_name))
        cmd += " --intersect_name %s --intersect_level %s --intersect_source %s"%(int_name, int_level, int_source)
    if norm.lower() == 'yes':
        cmd += " | mg-compare-normalize --input - --format text --output text"
    
    meth.advance("Building abundance profile from communitites API")
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Storing in Workspace")
    rows = len(stdout.strip().split('\n')) - 1
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'table', 'data': stdout}
    text = "%s abundance data for %d samples listed in %s were downloaded. %d %s level %s annotations from the %s database were downloaded into %s. The download used default settings for the E-value (e-%d), percent identity (%d), and alignment length (%d). Annotations with an overall abundance of 1 were removed by singleton filtering. Values did%s undergo normalization."%(annot, len(id_list), ids, rows, level, annot, source, out_name, int(evalue), int(identity), int(length), '' if norm.lower() == 'yes' else ' not')
    _put_ws(workspace, out_name, data=data)
    return json.dumps({'header': text})

@method(name="Group Abundance Profile with Significance")
def _group_matrix(meth, workspace, in_name, out_name, groups, gpos, stat_test, order, direction):
    """Apply matR-based statistical tests to grouped metagenomic abundance profiles

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.WorkspaceObjectId
    :ui_name in_name: Input Name
    :param out_name: workspace ID of abundance profile table with significance
    :type out_name: kbtypes.WorkspaceObjectId
    :ui_name out_name: Output Name
    :param groups: workspace ID of groups table
    :type groups: kbtypes.Unicode
    :ui_name groups: Groups
    :param gpos: position of group to use, default is first
    :type gpos: kbtypes.Unicode
    :ui_name gpos: Group Position
    :default gpos: 1
    :param stat_test: supported statistical tests, one of: Kruskal-Wallis, t-test-paired, Wilcoxon-paired, t-test-unpaired, Mann-Whitney-unpaired-Wilcoxon, ANOVA-one-way, default is Kruskal-Wallis
    :type stat_test: kbtypes.Unicode
    :ui_name stat_test: Stat Test
    :default stat_test: Kruskal-Wallis
    :param order: column number to order output by, default is last column
    :type order: kbtypes.Unicode
    :ui_name order: Order by Column
    :param direction: direction of order. 'asc' for ascending order, 'desc' for descending order
    :type direction: kbtypes.Unicode
    :ui_name direction: Direction
    :default direction: desc
    :return: Metagenome Abundance Profile Significance Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not (in_name and groups and out_name):
        return json.dumps({'header': 'ERROR: missing input or output workspace IDs'})
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if stat_test == '':
        stat_test = 'Kruskal-Wallis'
    if gpos == '':
        gpos = 1
    if direction == '':
        direction = 'desc'

    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name))
    grows, gcols, gdata = tab_to_matrix( _get_ws(workspace, groups) )
    gindex = int(gpos) - 1
    gjson = defaultdict(list)
    for r, row in enumerate(gdata):
        gjson[ row[gindex] ].append(grows[r])
    
    meth.advance("Computing Significance")
    cmd = "mg-group-significance --input %s --format text --stat_test %s --groups '%s' --direction %s"%(in_name, stat_test, json.dumps(gjson), direction)
    if order != '':
        cmd += ' --order %d'%int(order)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Storing in Workspace")
    rows = len(stdout.strip().split('\n')) - 1
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'table', 'data': stdout}
    text = "The %s test was applied to %s to find annotations that exhibited the most significant differences in abundance. Column %d of the metadata file %s was used to create sample groupings. Analysis results are in %s; these were sorted in %s order by column %d. The last three columns of the result file contain the test statistic, statistic p, and statistic fdr respectively."%(stat_test, in_name, int(gpos), groups, out_name, direction, -1 if order == '' else int(order))
    _put_ws(workspace, out_name, data=data)
    return json.dumps({'header': text})

@method(name="Select Abundance Profile")
def _select_matrix(meth, workspace, in_name, out_name, order, direction, cols, rows):
    """Order and/or sub-select metagenomic abundance profile

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.WorkspaceObjectId
    :ui_name in_name: Input Name
    :param out_name: workspace ID of altered table, if empty display table
    :type out_name: kbtypes.WorkspaceObjectId
    :ui_name out_name: Output Name
    :param order: column number to order output by (0 for last column), default is no ordering
    :type order: kbtypes.Unicode
    :ui_name order: Order by Column
    :param direction: direction of order. 'asc' for ascending order, 'desc' for descending order
    :type direction: kbtypes.Unicode
    :ui_name direction: Direction
    :default direction: desc
    :param cols: number of columns from the left to return from input table, default is all
    :type cols: kbtypes.Unicode
    :ui_name cols: Columns
    :param rows: number of rows from the top to return from input table, default is all
    :type rows: kbtypes.Unicode
    :ui_name rows: Rows
    :return: Metagenome Abundance Profile Significance Info
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    workspace = _get_wsname(meth, workspace)
    # set defaults since unfilled options are empty strings
    if direction == '':
        direction = 'desc'

    meth.advance("Retrieve Data from Workspace")
    data_table = _get_ws(workspace, in_name)
    _put_invo(in_name, data_table)
    
    meth.advance("Manipulating Abundance Table")
    if (order == '') and (cols == ''):
        if rows != '':
            table = [[c for c in r.split('\t')] for r in data_table.rstrip().split('\n')[:int(rows)]]
        else:
            table = [[c for c in r.split('\t')] for r in data_table.rstrip().split('\n')]
    else:
        cmd = "mg-select-significance --input %s --direction %s"%(in_name, direction)
        if order != '':
            cmd += ' --order %d'%int(order)
        if cols != '':
            cmd += ' --cols %d'%int(cols)
        if rows != '':
            cmd += ' --rows %d'%int(rows)
        stdout, stderr = _run_invo(cmd)
        table = [[c for c in r.split('\t')] for r in stdout.rstrip().split('\n')]
    
    if out_name:
        meth.advance("Storing in Workspace")
        data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'table', 'data': stdout}
        _put_ws(workspace, out_name, data=data)
        return json.dumps({'table': table[:10]})
    else:
        meth.advance("Displaying Abundance Table")
        return json.dumps({'table': table})

@method(name="Boxplot of Abundance Profile")
def _plot_boxplot(meth, workspace, in_name, groups, gpos):
    """Generate boxplot vizualization from metagenome abundance profile

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.WorkspaceObjectId
    :ui_name in_name: Input Name
    :param groups: workspace ID of groups table
    :type groups: kbtypes.WorkspaceObjectId
    :ui_name groups: Groups
    :param gpos: position of group to use, default is first
    :type gpos: kbtypes.Unicode
    :ui_name gpos: Group Position
    :default gpos: 1
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
    if gpos == '':
        gpos = 1
    
    meth.advance("Retrieve Data from Workspace")
    matrix = _get_ws(workspace, in_name)
    if groups:
        gdata = _get_ws(workspace, groups)
        matrix = _relabel_cols(matrix, gdata, gpos)
        _put_invo(groups, gdata)
    _put_invo(in_name, matrix)

    meth.advance("Calculating Boxplot")
    cmd = "mg-compare-boxplot-plot --input %s --plot %s.boxplot --format text"%(in_name, in_name)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Displaying Boxplot")
    text = 'Boxplot was produced for abundace profile %s.'%in_name
    rawpng = _get_invo(in_name+'.boxplot.png')
    b64png = base64.b64encode(rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '550', 'data': b64png})

@method(name="Heatmap-dendrogram of Abundance Profile")
def _plot_heatmap(meth, workspace, in_name, groups, gpos, distance, cluster, order, label):
    """Generate heatmap-dendrogram vizualization from metagenome abundance profile

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.WorkspaceObjectId
    :ui_name in_name: Input Name
    :param groups: workspace ID of groups table
    :type groups: kbtypes.WorkspaceObjectId
    :ui_name groups: Groups
    :param gpos: position of group to use, default is first
    :type gpos: kbtypes.Unicode
    :ui_name gpos: Group Position
    :default gpos: 1
    :param distance: distance metric, one of: bray-curtis, euclidean, maximum, manhattan, canberra, minkowski, difference
    :type distance: kbtypes.Unicode
    :ui_name distance: Distance
    :default distance: euclidean
    :param cluster: cluster method, one of: ward, single, complete, mcquitty, median, centroid
    :type cluster: kbtypes.Unicode
    :ui_name cluster: Cluster
    :default cluster: ward
    :param order: sort columns 
    :type order: kbtypes.Unicode
    :ui_name order: Sort
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
    if gpos == '':
        gpos = 1
    if distance == '':
        distance = 'euclidean'
    if cluster == '':
        cluster = 'ward'
    if order == '':
        order = 'yes'
    if label == '':
        label = 'no'
    
    meth.advance("Retrieve Data from Workspace")
    matrix = _get_ws(workspace, in_name)
    if groups:
        gdata = _get_ws(workspace, groups)
        matrix = _relabel_cols(matrix, gdata, gpos)
        _put_invo(groups, gdata)
    _put_invo(in_name, matrix)

    meth.advance("Calculating Heatmap")
    cmd = "mg-compare-heatmap-plot --input %s --plot %s.heatmap --distance %s --cluster %s --format text"%(in_name, in_name, distance, cluster)
    if order.lower() == 'yes':
        cmd += ' --order'
    if label.lower() == 'yes':
        cmd += ' --label'
    stdout, stderr = _run_invo(cmd)
    if stderr:
        json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Displaying Heatmap")
    text = "A heatmap-dendrogram was produced from the abundance profile %s. The %s distance/dissimilarity was used to compute distances and %s was used to cluster the data. Rows (annotations) were sorted; columns were%s sorted."%(in_name, distance, cluster, '' if order.lower() == 'yes' else ' not')
    rawpng = _get_invo(in_name+'.heatmap.png')
    b64png = base64.b64encode(rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '550', 'data': b64png})

@method(name="PCoA Plot of Abundance Profile")
def _plot_pcoa(meth, workspace, in_name, groups, gpos, distance, three):
    """Generate PCoA (Principal Coordinate Analysis) from metagenome abundance profile

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: workspace ID of abundance profile table
    :type in_name: kbtypes.WorkspaceObjectId
    :ui_name in_name: Input Name
    :param groups: workspace ID of groups table
    :type groups: kbtypes.WorkspaceObjectId
    :ui_name groups: Groups
    :param gpos: position of group to use, default is first
    :type gpos: kbtypes.Unicode
    :ui_name gpos: Group Position
    :default gpos: 1
    :param distance: distance metric, one of: bray-curtis, euclidean, maximum, manhattan, canberra, minkowski, difference
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
    if gpos == '':
        gpos = 1
    if distance == '':
        distance = 'euclidean'
    if three == '':
        three = 'no'
    
    meth.advance("Retrieve Data from Workspace")
    matrix = _get_ws(workspace, in_name)
    if groups:
        gdata = _get_ws(workspace, groups)
        _put_invo(groups, gdata)
    _put_invo(in_name, matrix)

    meth.advance("Computing PCoA")
    cmd = "mg-compare-pcoa-plot --input %s --plot %s.pcoa --distance %s --format text"%(in_name, in_name, distance)
    if groups:
        cmd += ' --color_group %s --color_pos %d --color_auto'%(groups, int(gpos))
    if three.lower() == 'yes':
        cmd += ' --three'
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR: %s'%stderr})
    
    meth.advance("Displaying PCoA")
    text = "A %s dimensional PCoA calculated from %s distance/dissimilarity was created from %s."%('three' if three.lower() == 'yes' else 'two', distance, in_name)
    if groups:
        text += " Samples were colored by metadata in column %d of the %s metadata file."%(int(gpos), groups)
    rawpng = _get_invo(in_name+'.pcoa.png')
    b64png = base64.b64encode(rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '550', 'data': b64png})



# Finalization
finalize_service()
