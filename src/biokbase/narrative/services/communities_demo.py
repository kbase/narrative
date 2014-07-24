"""
Demo communitites service and methods
"""
__author__ = 'Travis Harrison'
__date__ = '1/10/13'
__version__ = '0.5'

## Imports
# Stdlib
import re
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
from biokbase.mglib import tab_to_matrix, sparse_to_dense

## Globals
VERSION = (0, 0, 1)
NAME = "Communities Services"
default_ws = 'communitiesdemo:home'
ec_re = re.compile(r'[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')
mg_re = re.compile(r'mgm[0-9]{7}\.[0-9]')

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
    shock = "http://shock.metagenomics.anl.gov"
    awe = "http://140.221.67.184:8000"
    workspace = "https://kbase.us/services/ws"
    invocation = "https://kbase.us/services/invocation"

#old: -i @input.fas -o ucr -p @otu_picking_params.txt -r /home/ubuntu/data/gg_13_5_otus/rep_set/97_otus.fasta
picrustWF = """{
   "info" : {
      "clientgroups" : "docker",
      "noretry" : true,
      "project" : "project",
      "name" : "picrust",
      "user" : "narrative",
      "pipeline" : "picrust"
   },
   "shockhost" : "$shock",
   "tasks" : [
      {
	  "taskid" : "0",
	  "cmd" : {
		"name" : "app:QIIME.pick_closed_reference_otus.default",
		"app_args" : [
			{"resource":"shock",
				"host" : "$shock",
				"node" : "$seq",
				"filename" : "input.fas"},
			{"resource" : "shock",
				"host" : "$shock",
				"node" : "$param",
				"filename" : "otu_picking_params_97.txt"},
			{"resource" : "string",
				"key" : "IDENTITY",
				"value" : "97"}
			]
         }
      },
	  {
	  	"taskid" : "1",
	  	"cmd" : {
	  		"name" : "app:PIRCUSt.normalize_by_copy_number.default",
	  		"app_args" : [
	 			 {"resource":"task",
	  				"task" : "0",
	 				 "position" : 0}
	  		]
		}
	  },
	  {
	  	"taskid" : "2",
	 	"cmd" : {
	  		"name" : "app:PIRCUSt.predict_metagenomes.default",
	  		"app_args" : [
	  			{"resource":"task",
				"task" : "1",
	  			"position" : 0}
	  			]
	  		}
	  }
	]
}"""

emirgeWF = """{
	
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
    headers = {'Datatoken': os.environ['KB_AUTH_TOKEN']}
    files = {'upload': ('awe_workflow', cStringIO.StringIO(wf))}
    url = URLS.awe+"/job"
    req = requests.post(url, headers=headers, files=files, allow_redirects=True)
    return req.json()

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
    stdout, stderr = invo.run_pipeline("", cmd, [], 0, '/')
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
    # just return the whole thing
    else:
        data = obj['data']
    return data

def _put_ws(wsname, name, wtype, data=None, ref=None):
    token = os.environ['KB_AUTH_TOKEN']
    ws = workspaceService(URLS.workspace)
    if data is not None:
        ws.save_object({'auth': token, 'workspace': wsname, 'id': name, 'type': wtype, 'data': data})
    elif ref is not None:
        ws.save_object({'auth': token, 'workspace': wsname, 'id': name, 'type': wtype, 'data': ref})

@method(name="Import Metagenome List")
def _import_metagenome_list(meth, workspace, metagenome_list_id):
    """Import metagenome list object into workspace.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param metagenome_list_id: name of metagenome list object
    :type metagenome_list_id: kbtypes.Unicode
    :ui_name metagenome_list_id: Metagenome List Name
    :return: Metagenome List Uploading Info
    :rtype: kbtypes.Unicode
    :output_widget: MetagenomeListUploadWidget
    """
    meth.stages = 1
    if not metagenome_list_id:
        raise Exception("Metagenome List object name is not set.")
    workspace = _get_wsname(meth, workspace)
    return json.dumps({'ws': workspace, 'id': metagenome_list_id})

@method(name="Export Functional Profile for Modeling")
def _get_annot(meth, workspace, mgid, out_name, top, level, evalue, identity, length, rest):
    """Retrieve all SEED/Subsystems functional annotations for a given metagenome ID. Alternatively, filter annotations for specific taxa. For input into modeling service.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param mgid: Communities.Metagenome object name
    :type mgid: kbtypes.Communities.Metagenome
    :ui_name mgid: Metagenome ID
    :param out_name: object name of annotation set table
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
        return json.dumps({'header': 'ERROR:\nmissing input or output object names'})
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
    mg = _get_ws(workspace, mgid, CWS.mg)
    cmd = "mg-get-annotation-set --id %s --top %d --level %s --evalue %d --identity %d --length %d"%(mg['ID'], int(top), level, int(evalue), int(identity), int(length))
    if rest.lower() == 'yes':
        cmd += " --rest"
    cmd += " > "+out_name
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    
    meth.advance("Storing in Workspace")
    anno = _get_invo(out_name, binary=False)
    rows = len(anno.strip().split('\n')) - 1
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'table', 'data': anno}
    text = "Annotation sets for the %s %s from SEED/Subsystems were downloaded into %s. The download used default settings for the E-value (e-%d), percent identity (%d), and alignment length (%d)."%('top '+str(top) if int(top) > 0 else 'merged', level, out_name, int(evalue), int(identity), int(length))
    _put_ws(workspace, out_name, CWS.annot, data=data)
    return json.dumps({'header': text})

@method(name="EMIRGE 16S Extraction")
def _run_emirge(meth, workspace, in_seq1, in_seq2, out_seq):
    """EMIRGE (Miller et al., Genome Biol. 2011) extracts 16S sequences from a WGS metagenome and reconstructs full-length small subunit gene sequences. It also provides estimates of relative taxon abundances.
    
    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_seq1: object name of input sequence, fastq mate pair 1
    :type in_seq1: kbtypes.Communities.SequenceFile
    :ui_name in_seq1: Input FASTQ Pair 1
    :param in_seq2:  object name of input sequence, fastq mate pair 2
    :type in_seq2: kbtypes.Communities.SequenceFile
    :ui_name in_seq2: Input FASTQ Pair 2
    :param out_name: object name of resulting 16S sequences
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output 16S Sequences
    :return: EMIRGE Results
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    if not (in_seq1 and in_seq2 and out_seq):
        return json.dumps({'header': 'ERROR:\nmissing input or output object names'})
    workspace = _get_wsname(meth, workspace)
    #time.sleep(2)
    
    meth.advance("Retrieve Data from Workspace")
    in_seq1_id = _get_ws(workspace, in_seq1, CWS.seq)['ID']
    in_seq2_id = _get_ws(workspace, in_seq2, CWS.seq)['ID']

    wf_tmp = Template(emirgeWF)
    wf_str = wf_tmp.substitute(shock=URLS.shock, seq=seq_nid, param=param_nid)
    meth.advance("Submiting EMIRGE to AWE")
    time.sleep(4)
    
    meth.advance("Running EMIRGE")
    time.sleep(8)
    return json.dumps({'header': "EMIRGE ran on %s and %s"%(in_seq1, in_seq2)})
    

@method(name="PICRUSt Predicted Abundance Profile")
def _run_picrust(meth, workspace, in_seq, out_name):
    """Create a KEGG annotated functional abundance profile for 16S data in BIOM format using PICRUSt. The input OTUs are created by QIIME using a closed-reference OTU picking against the Greengenes database (pre-clustered at 97% identity).

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_seq: object name of input sequence file
    :type in_seq: kbtypes.Communities.SequenceFile
    :ui_name in_seq: Input Sequence
    :param out_name: object name of resulting BIOM profile
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :return: PICRUSt Prediction Info
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 5
    meth.advance("Processing inputs")
    # validate
    if not (in_seq and out_name):
        return json.dumps({'header': 'ERROR:\nmissing input or output object names'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Retrieve Data from Workspace")
    seq_obj = _get_ws(workspace, in_seq, CWS.seq)
    seq_url = seq_obj['URL']+'/node/'+seq_obj['ID']+'?download'
    _run_invo("echo 'pick_otus:enable_rev_strand_match True' > picrust.params")
    _run_invo("echo 'pick_otus:similarity 0.97' >> picrust.params")
    stdout, stderr = _run_invo("mg-upload2shock %s picrust.params"%(URLS.shock))
    if stderr:
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    param_nid = json.loads(stdout)['id']
    wf_tmp = Template(picrustWF)
    wf_str = wf_tmp.substitute(shock=URLS.shock, seq_url=seq_url, param=param_nid)
    
    meth.advance("Submiting PICRUSt prediction of KEGG BIOM to AWE")
    ajob = _submit_awe(wf_str)
    if ajob['status'] != 200:
        return json.dumps({'header': 'ERROR:\n%d - %s'%(ajob['status'], ', '.join(ajob['error']))})
    
    meth.advance("Waiting on PICRUSt prediction of KEGG BIOM")
    aresult = _get_awe_results(ajob['data']['id'])
    if not aresult:
        return json.dumps({'header': 'ERROR:\nAWE error running PICRUSt'})
    
    meth.advance("Storing Profile BIOM in Workspace")
    last_task = aresult['tasks'][-1]
    name, info = last_task['outputs'].items()[0]
    data = {'name': name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'biom', 'data': _get_shock_data(info['node'])}
    _put_ws(workspace, out_name, CWS.profile, data=data)
    text = "Abundance Profile BIOM %s created for PICRUSt prediction of %s"%(out_name, in_seq)
    return json.dumps({'header': text})

@method(name="Transform Abundance Profile to Functional Profile for Modeling")
def _map_annot(meth, workspace, in_name, out_name):
    """Create SEED/Subsystems functional annotations from a KEGG metagenome abundance profile. For input into modeling service.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: object name of abundance profile BIOM
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param out_name: object name of annotation set table
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
        return json.dumps({'header': 'ERROR:\nmissing input or output object names'})
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
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    
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
    :param in_name: object name of annotation set table
    :type in_name: kbtypes.Communities.ProfileTable
    :ui_name in_name: Input Name
    :param out_name: object name of model
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :return: Metagenome Model
    :rtype: kbtypes.Unicode
    :output_widget: ImageViewWidget
    """
    
    meth.stages = 5
    meth.advance("Processing inputs")
    # validate
    if not (in_name and out_name):
        return json.dumps({'header': 'ERROR:\nmissing input or output object names'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.annot))
    
    meth.advance("Create Metagenome Annotation Object")
    cmd = "fba-import-meta-anno %s --newuid %s.annot --name %s.annot --workspace %s --showerror"%(in_name, in_name, in_name, workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    
    meth.advance("Create Metagenome Model Object")
    cmd = "fba-metaanno-to-models %s.annot --maxotumod 0 --workspace %s --metaannows %s --showerror"%(in_name, workspace, workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    
    meth.advance("Saving Model in Workspace")
    lines = stdout.strip().split('\n')
    mname = lines[1].split(':')[1].strip()
    stdout, stderr = _run_invo("ws-rename %s %s --workspace %s"%(mname, out_name, workspace))
    if stderr:
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    
    lines[1] = 'Object Name: '+out_name
    return json.dumps({'header': '\n'.join(lines)})

@method(name="Gapfill Metabolic Model")
def _gapfill_model(meth, workspace, in_name):
    """Fill in missing core metabolism functions in a draft model.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: object name of model
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
        return json.dumps({'header': 'ERROR:\nmissing input or output object names'})
    workspace = _get_wsname(meth, workspace)
    
    meth.advance("Gapfill Model Starting")
    cmd = "kbfba-gapfill %s --numsol 1 --timepersol 3600 --intsol -w %s"%(in_name, workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    time.sleep(5)
    return json.dumps({'header': stdout})

@method(name="Compare Metabolic Model")
def _compare_model(meth, workspace, model1, model2):
    """Compare two or more metabolic models with appropriate statistical tests.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param model1: object name of model 1
    :type model1: kbtypes.KBaseFBA.FBAModel
    :ui_name model1: Model 1 Name
    :param model2: object name of model 2
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
    if not (model1 and model2):
        return json.dumps({'header': 'ERROR:\nmissing model 1 and model 2'})
    
    meth.advance("Compare Models")
    cmd = "fba-compare-mdls %s;%s %s"%(model1, model2, workspace)
    stdout, stderr = _run_invo(cmd)
    if stderr:
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    return json.dumps({'header': stdout})

@method(name="KEGG Mapper")
def _kegg_map(meth, workspace, input1, input2):
    """Compare two or more metabolic networks via overlay on graphical KEGG Map.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param input1: object name of model 1
    :type input1: kbtypes.KBaseFBA.FBAModel
    :ui_name input1: Model 1 Name
    :param input2: object name of model 2
    :type input2: kbtypes.KBaseFBA.FBAModel
    :ui_name input2: Model 2 Name
    :return: KEGG Map
    :rtype: kbtypes.Unicode
    :output_widget: KeggMapWidget
    """
    
    meth.stages = 4
    meth.advance("Processing inputs")
    # validate
    workspace = _get_wsname(meth, workspace)
    if not (input1 and input2):
        return json.dumps({'header': 'ERROR:\nmissing profile 1 and profile 2'})
    
    meth.advance("Retrieve Data from Workspace")
    models = [ _get_ws(workspace, input1, CWS.model), _get_ws(workspace, input2, CWS.model) ]
    kgdata = [{},{}]
    
    meth.advance("Compare KEGG Networks")
    # models to data
    for i, m in enumerate(models):
        for mr in m['modelreactions']:
            for mrp in mr['modelReactionProteins']:
                for mrps in mrp['modelReactionProteinSubunits']:
                    for ecm in ec_re.finditer(mrps['role'].rstrip()):
                        ec = ecm.group()
                        if ec in ec2ko:
                            for ko in ec2ko[ec]:
                                kgdata[i][ko] = 1
    
    meth.advance("Display KEGG Map")
    text = "KEGG Pathway map comparison. Colored lines represent reactions found in the inputed models.  %s is in green and %s is in blue. Overlap is in cyan."%(input1, input2)
    return json.dumps({'header': text, 'data': kgdata, 'width': 800})

@method(name="Retrieve Annotation Abundance Profile")
def _get_matrix(meth, workspace, ids, out_name, annot, level, source, int_name, int_level, int_source, evalue, identity, length, norm):
    """Retrieve annotation abundance data for selected metagenomes.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param ids: object name of metagenome list
    :type ids: kbtypes.Communities.Collection
    :ui_name ids: Metagenome List
    :param out_name: object name of abundance profile table
    :type out_name: kbtypes.Unicode
    :ui_name out_name: Output Name
    :param annot: annotation of abundance profile, one of 'taxa' or 'functions'
    :type annot: kbtypes.Unicode
    :ui_name annot: Annotation Type
    :default annot: taxa
    :param level: annotation hierarchical level to retrieve abundances for
    :type level: kbtypes.Unicode
    :ui_name level: Annotation Level
    :default level: genus
    :param source: data source to filter results by
    :type source: kbtypes.Unicode
    :ui_name source: Source Name
    :default source: SEED
    :param int_name: object name of list of names to filter results by
    :type int_name: kbtypes.Communities.Data
    :ui_name int_name: Filter List
    :param int_level: hierarchical level of filter names list
    :type int_level: kbtypes.Unicode
    :ui_name int_level: Filter Level
    :param int_source: data source of filter names list
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
        return json.dumps({'header': 'ERROR:\nmissing input or output object names'})
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
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    
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
    :param in_name: object name of abundance profile table
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param out_name: object name of abundance profile table with significance
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
        return json.dumps({'header': 'ERROR:\nmissing input or output object names'})
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
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    
    meth.advance("Storing in Workspace")
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': 'biom', 'data': stdout}
    text = "The %s test was applied to %s to find annotations that exhibited the most significant differences in abundance. Metadata values for %s were used to create sample groupings. Analysis results are in %s. The rows of the BIOM file contain the test statistic, statistic p, and statistic fdr respectively."%(stat_test, in_name, metadata, out_name)
    _put_ws(workspace, out_name, CWS.profile, data=data)
    return json.dumps({'header': text})

@method(name="Sub-select Abundance Profile")
def _select_matrix(meth, workspace, in_name, out_name, order, direction, cols, rows, alist):
    """Sort and/or subselect annotation abundance data and outputs from statistical analyses.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: object name of abundance profile table
    :type in_name: kbtypes.Communities.Profile
    :ui_name in_name: Input Name
    :param out_name: object name of altered profile
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
    :param alist: create only list of annotations from ordering and sub-selection
    :type alist: kbtypes.Unicode
    :ui_name alist: Output List
    :default alist: no
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
    if alist == '':
        alist = 'no'

    meth.advance("Retrieve Data from Workspace")
    _put_invo(in_name, _get_ws(workspace, in_name, CWS.profile))
    
    meth.advance("Manipulating Abundance Table")
    biom = None
    cmd = "mg-select-significance --input %s --direction %s --format biom --output biom"%(in_name, direction)
    txt = "%s was saved as %s."%(in_name, out_name)
    if cols != '':
        cmd += ' --cols %d'%int(cols)
        txt += " All but first %d columns were removed."%int(cols)
    if rows != '':
        cmd += ' --rows %d'%int(rows)
        txt += " All but first %d rows were removed."%int(rows)
    if order != '':
        cmd += ' --order %d'%int(order)
        txt += " Rows were ordered by column %d."%int(order)
    stdout, stderr = _run_invo(cmd)
    
    meth.advance("Storing in Workspace")
    data = {'name': out_name, 'created': time.strftime("%Y-%m-%d %H:%M:%S"), 'type': '', 'data': ''}
    wtype = None
    if alist.lower() == 'yes':
        biom = json.loads(stdout)
        data['type'] = 'list'
        data['data'] = "\n".join([r['id'] for r in biom['rows']])
        wtype = CWS.data
    else:
        data['type'] = 'biom'
        data['data'] = stdout
        wtype = CWS.profile
    
    _put_ws(workspace, out_name, wtype, data=data)
    return json.dumps({'header': txt})

@method(name="View Abundance Profile")
def _view_matrix(meth, workspace, in_name, row_start, row_end, col_start, col_end, stats):
    """View a slice of a BIOM format abundance profile as a table

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: object name of abundance profile table
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
    :param in_name: object name of abundance profile table
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
        json.dumps({'header': 'ERROR:\nmissing input'})
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
        json.dumps({'header': 'ERROR:\n%s'%stderr})
    
    meth.advance("Displaying Boxplot")
    text = 'Boxplot was produced for abundance profile %s.'%in_name
    rawpng = _get_invo(in_name+'.boxplot.png', binary=True)
    b64png = base64.b64encode(rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '650', 'data': b64png})

@method(name="Heatmap from Abundance Profile")
def _plot_heatmap(meth, workspace, in_name, use_name, distance, cluster, order, label):
    """Generate a heatmap-dendrogram from annotation abundance data.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: object name of abundance profile table
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
        json.dumps({'header': 'ERROR:\nmissing input'})
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
        json.dumps({'header': 'ERROR:\n%s'%stderr})
    
    meth.advance("Displaying Heatmap")
    text = "A heatmap-dendrogram was produced from the abundance profile %s. The %s distance/dissimilarity was used to compute distances and %s was used to cluster the data. Rows (annotations) were sorted; columns were%s sorted."%(in_name, distance, cluster, '' if order.lower() == 'yes' else ' not')
    rawpng = _get_invo(in_name+'.heatmap.png', binary=True)
    b64png = base64.b64encode(rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '600', 'data': b64png})

@method(name="PCoA from Abundance Profile")
def _plot_pcoa(meth, workspace, in_name, metadata, distance, three):
    """Generate a PCoA from annotation abundance data.

    :param workspace: name of workspace, default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param in_name: object name of abundance profile table
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
        return json.dumps({'header': 'ERROR:\nmissing input'})
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
        return json.dumps({'header': 'ERROR:\n%s'%stderr})
    
    meth.advance("Displaying PCoA")
    text = "A %s dimensional PCoA calculated from %s distance/dissimilarity was created from %s."%('three' if three.lower() == 'yes' else 'two', distance, in_name)
    if metadata:
        text += " Samples were colored by metadata values for %s."%metadata
    fig_rawpng = _get_invo(in_name+'.pcoa.png', binary=True)
    fig_b64png = base64.b64encode(fig_rawpng)
    leg_rawpng = _get_invo(in_name+'.pcoa.png.legend.png', binary=True)
    leg_b64png = base64.b64encode(leg_rawpng)
    return json.dumps({'header': text, 'type': 'png', 'width': '600', 'data': fig_b64png, 'legend': leg_b64png})

@method(name="View Metagenome")
def _view_mg(meth, mgid):
    """Overview of metagenome statistics, numeric and plotted.
    
    :param in_name: id of a metagenome
    :type in_name: kbtypes.Unicode
    :ui_name in_name: Metagenome ID
    :return: Metagenome Overview
    :rtype: kbtypes.Unicode
    :output_widget: MGOverviewWidget
    """
    
    meth.stages = 2
    meth.advance("Processing inputs")
    # validate
    if not (mgid and mg_re.match(mgid)):
        return json.dumps({'header': 'ERROR:\nInvalid metagenome ID'})
    
    meth.advance("Building Overview")
    return json.dumps({'mgid': mgid})

ec2ko = {
    "3.1.22.4": ["K01159"],
    "3.1.22.1": ["K01158"],
    "3.1.22.-": ["K08991", "K10882", "K08991", "K10882"],
    "3.4.22.61": ["K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398", "K04398"],
    "4.6.1.12": ["K12506", "K01770"],
    "4.6.1.13": ["K01771"],
    "3.2.1.49": ["K01204", "K01204"],
    "1.5.3.7": ["K00306", "K00306", "K00306"],
    "1.1.5.2": ["K00117"],
    "1.1.5.3": ["K00111", "K00112", "K00113"],
    "1.1.5.4": ["K00116"],
    "4.2.3.119": ["K07384"],
    "1.1.5.8": ["K05358"],
    "1.1.5.9": ["K00115"],
    "1.1.4.1": ["K05357"],
    "3.2.2.16": ["K01244"],
    "1.13.11.41": ["K05913"],
    "1.1.1.144": ["K14732"],
    "4.2.3.15": ["K12467"],
    "1.17.4.1": ["K00524", "K00525", "K00526", "K10807", "K10808", "K00524", "K00525", "K00526", "K10807", "K10808", "K10807", "K10808", "K10808", "K12970"],
    "3.1.4.45": ["K01125"],
    "3.1.4.46": ["K01126"],
    "1.17.4.2": ["K00527", "K00527"],
    "3.1.4.41": ["K01123"],
    "4.2.3.12": ["K01737"],
    "1.1.1.125": ["K00065"],
    "3.4.24.15": ["K01392", "K01392"],
    "1.1.1.122": ["K00064"],
    "4.2.3.10": ["K15097"],
    "1.1.-.-": ["K15573", "K15403", "K11147", "K11148", "K11149", "K15573", "K11147"],
    "3.6.4.1": ["K01553"],
    "1.8.7.1": ["K00392"],
    "3.4.21.108": ["K08669"],
    "4.2.3.13": ["K14183"],
    "3.4.21.107": ["K04771"],
    "4.2.1.57": ["K13779"],
    "1.8.2.4": ["K16964"],
    "6.3.2.10": ["K01929", "K15792", "K01929", "K15792"],
    "6.3.2.11": ["K14755", "K14755", "K14755"],
    "3.6.4.6": ["K06027", "K06027", "K06027"],
    "2.7.7.19": ["K14376", "K00970"],
    "4.2.1.108": ["K06720"],
    "2.7.7.15": ["K00968", "K00968"],
    "2.7.7.14": ["K00967", "K00967"],
    "2.7.7.13": ["K16011", "K16881", "K00971", "K00966", "K16881", "K00966", "K00971", "K16011"],
    "2.7.7.12": ["K00965", "K00965", "K00965"],
    "1.1.1.239": ["K13368", "K13369", "K13370", "K13369", "K13368"],
    "1.4.3.16": ["K00278", "K00278"],
    "1.4.3.10": ["K03343"],
    "1.4.1.14": ["K00264", "K00265", "K00266", "K00264", "K00265", "K00266", "K00264", "K00265", "K00266"],
    "1.4.1.16": ["K03340", "K03340"],
    "1.1.1.234": ["K13082"],
    "1.4.1.13": ["K00264", "K00265", "K00266", "K00264", "K00265", "K00266", "K00264", "K00265", "K00266"],
    "1.1.1.236": ["K05354"],
    "2.4.1.133": ["K00733", "K00733"],
    "6.3.2.19": ["K10599", "K10577", "K10597", "K10661", "K10578", "K04554", "K10575", "K04555", "K10601", "K10666", "K10636", "K09561", "K06689", "K04556", "K03178", "K10684", "K10685", "K10686", "K10698", "K10699", "K10573", "K10574", "K06688", "K06689", "K10687", "K10575", "K04555", "K10576", "K10577", "K10578", "K04554", "K04552", "K04553", "K10579", "K10580", "K10581", "K10582", "K02207", "K10583", "K10584", "K10688", "K10585", "K04649", "K10586", "K10587", "K10588", "K10589", "K04678", "K05632", "K05633", "K05630", "K10590", "K10591", "K13305", "K10592", "K10593", "K10594", "K10595", "K10614", "K10615", "K10596", "K10597", "K09561", "K10599", "K06643", "K04707", "K04556", "K04506", "K10143", "K10144", "K10601", "K10602", "K10604", "K10606", "K08285", "K10607", "K10608", "K10643", "K10606", "K13960", "K10632", "K04707", "K04506", "K04678", "K04707", "K10652", "K10577", "K05632", "K06643", "K10628", "K06643", "K04707", "K10591", "K13305", "K06643", "K11981", "K05632", "K04678", "K05633", "K08338", "K17888", "K08343", "K06643", "K06643", "K04506", "K10143", "K10144", "K10652", "K12170", "K04707", "K04707", "K06643", "K13305", "K10143", "K06643", "K04707", "K06643", "K10577", "K12035", "K06643", "K04707", "K06643", "K06643", "K10587", "K10691", "K06643", "K04707", "K06643", "K06643", "K06643", "K06643", "K10651", "K10628", "K03178", "K10698", "K04552", "K04553", "K04554", "K10578", "K04555", "K10575", "K04556", "K05632", "K15343", "K15353", "K15488", "K04707", "K10144", "K10652", "K02207", "K06643", "K10591"],
    "3.4.24.16": ["K01393"],
    "2.7.7.49": ["K11126"],
    "4.4.1.25": ["K17950"],
    "4.4.1.24": ["K16845", "K16846"],
    "4.4.1.22": ["K03396", "K03396"],
    "4.4.1.21": ["K07173", "K07173", "K07173"],
    "4.4.1.20": ["K00807"],
    "1.8.5.-": ["K17218"],
    "1.5.4.1": ["K00310"],
    "4.2.1.105": ["K13258"],
    "2.4.1.87": ["K00743"],
    "1.8.4.2": ["K05360"],
    "2.5.1.75": ["K00791"],
    "2.5.1.74": ["K02548"],
    "2.5.1.77": ["K11780", "K11781"],
    "1.8.5.2": ["K16936", "K16937"],
    "2.5.1.73": ["K06868"],
    "2.5.1.72": ["K03517"],
    "5.1.2.3": ["K01782", "K01825", "K01825", "K01782", "K01825", "K01782", "K01825", "K01782", "K01782", "K01825", "K01825", "K01782", "K01825", "K01782", "K01825", "K01782", "K01825", "K01782", "K01825", "K01782", "K01825", "K01782", "K01825", "K01782", "K01825", "K01782", "K01825", "K01782"],
    "2.1.1.41": ["K00559"],
    "2.1.1.43": ["K06101", "K11427", "K11420", "K15588", "K11424", "K11425", "K11422", "K11423", "K11431", "K11428", "K11421", "K11433", "K11419", "K11429", "K09186", "K09187", "K09188", "K14959", "K09189", "K11431", "K06101", "K09186", "K11427", "K11424", "K11430"],
    "2.1.1.45": ["K00560", "K13998", "K13998", "K13998", "K00560"],
    "2.1.1.46": ["K13259"],
    "2.1.1.49": ["K00562", "K00562"],
    "2.7.1.59": ["K00884"],
    "2.7.1.58": ["K00883"],
    "6.2.1.18": ["K15232", "K15232"],
    "6.2.1.19": ["K06046"],
    "2.7.1.55": ["K00881"],
    "6.2.1.17": ["K01908"],
    "6.2.1.14": ["K01906"],
    "2.7.1.56": ["K00882"],
    "2.7.1.51": ["K00879"],
    "6.2.1.13": ["K01905", "K01905", "K01905"],
    "2.7.1.53": ["K00880", "K00880"],
    "2.7.1.52": ["K05305", "K05305"],
    "2.4.99.-": ["K03369", "K03373", "K03375", "K03376"],
    "3.6.4.-": ["K14326", "K14326", "K12599", "K03723", "K04066", "K10875", "K10877", "K15173"],
    "1.1.1.58": ["K00041"],
    "1.1.1.53": ["K00038"],
    "1.1.1.50": ["K00037", "K00037"],
    "1.1.1.51": ["K05296", "K05296"],
    "1.1.1.56": ["K00039"],
    "1.1.1.57": ["K00040"],
    "1.2.7.1": ["K00169", "K00170", "K00171", "K00172", "K00169", "K00170", "K00171", "K00172", "K00169", "K00170", "K00171", "K00172", "K00169", "K00170", "K00172", "K00171", "K00169", "K00170", "K00172", "K00171", "K00169", "K00170", "K00172", "K00171", "K00169", "K00170", "K00172", "K00171", "K00169", "K00170", "K00171", "K00172", "K00169", "K00170", "K00172", "K00171"],
    "2.3.1.169": ["K14138", "K14138"],
    "1.2.7.3": ["K00174", "K00175", "K00177", "K00176", "K00174", "K00175", "K00177", "K00176", "K00174", "K00175", "K00177", "K00176"],
    "1.2.7.5": ["K03738", "K03738", "K03738"],
    "1.2.7.4": ["K00198", "K00192", "K00198", "K00192", "K00198", "K00198"],
    "1.2.7.7": ["K00186", "K00187", "K00189", "K00188"],
    "1.2.7.6": ["K11389"],
    "2.3.1.160": ["K12694"],
    "2.3.1.162": ["K12923"],
    "2.3.1.164": ["K10852"],
    "2.3.1.166": ["K12925"],
    "2.3.1.167": ["K12926"],
    "3.3.2.1": ["K01252"],
    "1.1.1.24": ["K09484"],
    "1.2.7.-": ["K03737", "K03737"],
    "2.7.1.179": ["K16018"],
    "2.4.1.238": ["K12939"],
    "1.7.1.2": ["K10534"],
    "1.7.1.3": ["K10534"],
    "1.7.1.1": ["K10534"],
    "1.7.1.7": ["K00364"],
    "1.7.1.4": ["K17877"],
    "6.3.5.9": ["K02224"],
    "1.14.13.119": ["K15805"],
    "1.14.13.118": ["K13401", "K13401", "K13401"],
    "1.14.13.117": ["K14984", "K14984", "K14984"],
    "1.5.8.4": ["K00315"],
    "1.14.13.114": ["K14974"],
    "1.14.13.113": ["K16839"],
    "1.7.7.1": ["K00366"],
    "1.14.13.111": ["K16968", "K16969"],
    "1.5.8.2": ["K00317", "K00317"],
    "2.1.1.210": ["K09846"],
    "2.1.1.212": ["K13259"],
    "4.1.1.46": ["K14333", "K14333"],
    "3.5.4.1": ["K01485", "K01485"],
    "2.8.2.5": ["K01017", "K04742", "K07779"],
    "1.2.1.-": ["K05829", "K05829", "K11947", "K13356", "K15786", "K05829", "K12254", "K09472", "K05829", "K00155", "K00155", "K00155", "K11947", "K13356"],
    "5.5.1.5": ["K14334"],
    "1.2.3.7": ["K11817"],
    "1.2.3.1": ["K00157", "K00157", "K00157", "K00157", "K00157", "K00157", "K00157"],
    "1.2.3.3": ["K00158"],
    "3.5.4.6": ["K01490"],
    "4.2.3.29": ["K14037"],
    "1.14.12.17": ["K05916"],
    "1.14.12.10": ["K05549", "K05550", "K05549", "K05550", "K05549", "K05550", "K05549", "K05550"],
    "1.14.12.11": ["K03268", "K16268", "K03268", "K16268", "K03268", "K16268", "K03268", "K16268", "K03268", "K16268"],
    "1.14.12.12": ["K14579", "K14580", "K14579", "K14580", "K14579", "K14580", "K14579", "K14580"],
    "1.2.1.8": ["K14085", "K14085", "K14085", "K14085", "K14085", "K14085", "K14085", "K00130", "K14085", "K14085", "K14085", "K14085", "K14085", "K14085", "K14085", "K14085"],
    "1.2.1.5": ["K00129", "K00129", "K00129", "K00129", "K00129", "K00129", "K00129", "K00129"],
    "1.2.1.4": ["K14519", "K14519"],
    "1.2.1.3": ["K14085", "K00128", "K14085", "K00149", "K00128", "K00128", "K14085", "K00149", "K00128", "K14085", "K00149", "K00128", "K14085", "K00149", "K00128", "K14085", "K00149", "K00128", "K14085", "K00149", "K14085", "K00128", "K14085", "K00149", "K14085", "K14085", "K00128", "K00149", "K00128", "K14085", "K00149", "K00128", "K14085", "K00149", "K00128", "K14085", "K00149", "K00128", "K14085", "K00149", "K00128", "K00128"],
    "1.2.1.2": ["K00122", "K00123", "K00125", "K00126", "K08348", "K00122", "K00125", "K00126", "K00123", "K08348", "K00122", "K00123", "K00125", "K00126", "K08348", "K08348"],
    "1.4.3.3": ["K00273", "K00273", "K00273", "K00273", "K00273"],
    "1.4.3.2": ["K03334", "K03334", "K03334", "K03334", "K03334", "K03334", "K03334", "K03334"],
    "1.4.3.1": ["K00272", "K00272"],
    "1.4.3.5": ["K00275"],
    "1.4.3.4": ["K00274", "K00274", "K00274", "K00274", "K00274", "K00274", "K00274", "K00274", "K00274", "K00274", "K00274", "K00274", "K00274"],
    "4.2.1.10": ["K13830", "K03785", "K03786", "K13832", "K13830", "K03785", "K03786", "K13832"],
    "4.2.1.11": ["K01689", "K01689", "K01689", "K01689", "K01689", "K01689"],
    "4.2.1.12": ["K01690", "K01690"],
    "2.3.1.91": ["K09756"],
    "2.3.1.93": ["K13610"],
    "4.2.1.17": ["K15016", "K01715", "K01782", "K01825", "K07511", "K07514", "K07515", "K01825", "K01782", "K07514", "K10527", "K01692", "K13767", "K07511", "K07515", "K01692", "K01825", "K01782", "K07515", "K07514", "K07511", "K01825", "K01782", "K01692", "K01715", "K07515", "K07514", "K07511", "K01715", "K15016", "K01782", "K01825", "K07515", "K07511", "K01825", "K01782", "K07515", "K10527", "K01692", "K07514", "K07511", "K13767", "K10527", "K01825", "K01782", "K07515", "K01692", "K01825", "K01782", "K07515", "K07514", "K07511", "K01692", "K01825", "K01782", "K07515", "K07514", "K07511", "K01692", "K01692", "K01825", "K01782", "K07515", "K07514", "K07511", "K01692", "K01825", "K01782", "K07515", "K07514", "K07511", "K01692", "K01825", "K01782", "K01692", "K01825", "K01782", "K01692", "K07515", "K07514", "K07511", "K01692", "K07515", "K07514", "K07511", "K01692", "K01825", "K01782", "K07515", "K07514", "K07511", "K07514", "K07514"],
    "3.6.1.53": ["K01517", "K01517"],
    "4.2.3.28": ["K14036"],
    "3.6.1.54": ["K03269"],
    "3.6.1.57": ["K15897"],
    "2.1.1.104": ["K00588", "K00588", "K00588", "K00588"],
    "3.6.1.58": ["K13987"],
    "1.14.14.14": ["K07434", "K07434"],
    "2.1.1.107": ["K13542", "K13543", "K02496", "K02302", "K02303", "K00589"],
    "4.2.3.27": ["K12742"],
    "4.2.3.26": ["K15087"],
    "1.4.3.-": ["K09471"],
    "2.1.1.103": ["K05929"],
    "6.3.5.-": ["K14244"],
    "1.14.13.71": ["K13385"],
    "1.14.13.70": ["K05917"],
    "1.14.13.73": ["K12696"],
    "1.14.13.72": ["K07750", "K14423", "K14424"],
    "1.14.13.77": ["K12922"],
    "1.14.13.76": ["K12924"],
    "1.14.13.79": ["K04123"],
    "1.14.13.78": ["K04122"],
    "4.1.2.8": ["K13222"],
    "3.3.2.12": ["K02618"],
    "3.3.2.10": ["K08726", "K08726", "K08726"],
    "1.3.1.93": ["K10258", "K10258", "K10258"],
    "1.3.1.94": ["K12345"],
    "1.3.1.98": ["K00075", "K00075"],
    "3.5.4.19": ["K01496", "K11755", "K14152", "K01496", "K11755", "K14152"],
    "3.5.4.16": ["K01495", "K09007"],
    "3.5.4.13": ["K01494"],
    "3.5.4.12": ["K01493"],
    "3.5.4.10": ["K00602", "K11176", "K00602"],
    "2.6.99.2": ["K03474"],
    "2.7.1.113": ["K00904", "K15518"],
    "1.14.99.1": ["K00509", "K11987", "K11987", "K11987", "K11987", "K11987", "K00509", "K11987", "K11987", "K11987", "K11987", "K11987", "K11987", "K11987"],
    "1.14.99.3": ["K00510", "K00510"],
    "1.14.99.9": ["K00512", "K00512", "K00512"],
    "1.18.6.1": ["K02586", "K02591", "K02588", "K00531", "K11333", "K00531", "K02591", "K02588", "K02586"],
    "2.4.1.236": ["K13080", "K13080"],
    "2.-.-.-": ["K03635", "K12630", "K12633", "K03635"],
    "1.1.1.300": ["K11146", "K11152", "K11153"],
    "1.13.11.74": ["K15059"],
    "1.13.11.70": ["K17913"],
    "1.13.11.72": ["K12905"],
    "3.1.4.55": ["K06167"],
    "2.4.1.234": ["K13269"],
    "3.1.4.53": ["K13293", "K13294"],
    "3.1.4.52": ["K13245"],
    "3.1.4.50": ["K01127"],
    "1.14.16.-": ["K03393"],
    "1.1.99.1": ["K00108"],
    "1.1.99.2": ["K00109"],
    "1.1.99.3": ["K06151", "K06152"],
    "1.1.1.136": ["K13015"],
    "1.1.1.137": ["K05352"],
    "1.1.1.132": ["K00066", "K00066", "K00066"],
    "1.1.1.133": ["K00067", "K00067"],
    "1.1.1.130": ["K08092", "K08092"],
    "1.1.99.-": ["K00119"],
    "4.2.3.20": ["K15096"],
    "1.1.1.302": ["K14654"],
    "4.1.3.17": ["K10218", "K10218"],
    "4.1.3.16": ["K01625", "K01625", "K01625", "K01625"],
    "2.3.2.-": ["K12554", "K12555", "K00687", "K12556"],
    "2.7.7.23": ["K00972", "K04042", "K11528"],
    "2.7.7.27": ["K00975", "K00975"],
    "2.7.7.24": ["K00973", "K00973"],
    "1.4.3.22": ["K11182", "K11182", "K11182"],
    "1.4.3.21": ["K00276", "K00276", "K00276", "K00276", "K00276", "K00276"],
    "1.1.1.223": ["K15090"],
    "1.1.1.220": ["K04071"],
    "2.4.1.91": ["K10757"],
    "4.4.1.13": ["K00816", "K00816", "K00816"],
    "4.4.1.11": ["K01761", "K01761"],
    "4.4.1.16": ["K01763", "K11717", "K11717"],
    "4.4.1.17": ["K01764"],
    "4.4.1.14": ["K01762"],
    "4.4.1.15": ["K05396"],
    "4.4.1.19": ["K08097"],
    "2.5.1.82": ["K05355"],
    "2.5.1.83": ["K05355"],
    "2.5.1.84": ["K05356"],
    "2.5.1.85": ["K05356"],
    "2.5.1.86": ["K14215"],
    "2.5.1.87": ["K11778"],
    "2.5.1.89": ["K15888"],
    "2.1.1.53": ["K05353"],
    "2.1.1.56": ["K00565"],
    "2.4.1.257": ["K03843", "K03843"],
    "2.3.1.51": ["K14674", "K00655", "K13509", "K13513", "K13517", "K13519", "K13523", "K14674", "K13509", "K13513", "K13517", "K13519", "K13523", "K00655", "K14674", "K14674", "K13519", "K14674", "K14674", "K14674", "K13509"],
    "1.11.1.7": ["K11188", "K00430", "K11188", "K00430", "K12550", "K10788"],
    "4.1.-.-": ["K12261"],
    "4.1.1.19": ["K01583", "K01584", "K01585", "K02626"],
    "4.1.1.18": ["K01582", "K01582"],
    "4.2.2.3": ["K01729"],
    "4.2.2.2": ["K01728"],
    "4.2.2.6": ["K01730"],
    "4.2.2.9": ["K01731"],
    "4.1.1.12": ["K09758", "K09758", "K09758"],
    "4.1.1.15": ["K01580", "K01580", "K01580", "K01580", "K01580", "K01580"],
    "4.1.1.17": ["K01581", "K01581"],
    "3.6.3.27": ["K02036"],
    "1.1.3.45": ["K15949"],
    "1.1.3.44": ["K13552"],
    "1.1.1.49": ["K00036", "K00036", "K00036"],
    "1.1.1.48": ["K00035"],
    "1.1.1.45": ["K13247"],
    "1.1.1.44": ["K00033", "K00033", "K00033"],
    "1.1.1.47": ["K13937", "K00034", "K13937", "K00034"],
    "1.1.1.46": ["K13873"],
    "1.1.1.41": ["K00030", "K00030", "K00030", "K00030"],
    "1.1.1.40": ["K00029", "K00029", "K00029"],
    "1.1.1.43": ["K00032", "K00032"],
    "1.1.1.42": ["K00031", "K00031", "K00031", "K00031", "K00031", "K00031", "K00031"],
    "2.5.1.3": ["K14153", "K00788", "K14154"],
    "2.3.1.115": ["K13264", "K13264"],
    "5.4.99.53": ["K16207"],
    "2.3.1.117": ["K00674", "K00674"],
    "5.4.99.52": ["K16204"],
    "2.4.1.221": ["K03691"],
    "2.4.1.222": ["K05948", "K05948"],
    "2.4.1.223": ["K02369", "K02370"],
    "2.4.1.224": ["K02370", "K02368", "K02366", "K02367"],
    "2.4.1.225": ["K02366", "K02367"],
    "2.4.1.226": ["K13499", "K00747", "K03419", "K13500"],
    "2.4.1.227": ["K02563", "K02563"],
    "2.4.1.228": ["K01988"],
    "1.3.99.29": ["K10027"],
    "1.3.99.28": ["K10027"],
    "3.4.21.22": ["K01321"],
    "3.4.21.21": ["K01320"],
    "3.4.21.20": ["K01319", "K01319", "K01319", "K01319", "K01319"],
    "3.4.21.27": ["K01323"],
    "1.14.13.109": ["K14040"],
    "1.14.13.104": ["K15093"],
    "1.14.13.106": ["K12645"],
    "1.14.13.107": ["K14733"],
    "1.14.13.100": ["K07430", "K07430"],
    "1.14.13.101": ["K13608"],
    "2.4.1.10": ["K00692", "K00692"],
    "2.4.1.11": ["K16153", "K00693", "K16150", "K00693", "K00693"],
    "2.4.1.12": ["K00694"],
    "2.4.1.13": ["K00695"],
    "2.4.1.14": ["K00696"],
    "2.4.1.15": ["K00697", "K16055"],
    "2.4.1.16": ["K00698"],
    "2.4.1.17": ["K00699", "K00699", "K00699", "K00699", "K00699", "K00699", "K00699", "K00699", "K00699", "K00699"],
    "2.4.1.18": ["K00700", "K16149"],
    "2.1.1.267": ["K13272"],
    "2.1.1.260": ["K14568"],
    "1.21.3.1": ["K04126"],
    "2.7.7.18": ["K06210", "K00969"],
    "3.4.21.39": ["K01329"],
    "2.3.1.61": ["K00658", "K00658", "K00658"],
    "2.4.2.-": ["K02501", "K01663", "K03815", "K02501", "K01663", "K13676", "K11023"],
    "2.3.1.65": ["K00659", "K00659", "K00659", "K00659", "K00659"],
    "2.3.1.67": ["K13510", "K13510"],
    "2.4.2.9": ["K00761", "K02825"],
    "2.4.2.8": ["K00760", "K15780", "K00760"],
    "3.6.1.26": ["K01521"],
    "3.6.1.27": ["K06153"],
    "3.6.1.22": ["K03426", "K03426"],
    "3.6.1.23": ["K01520"],
    "2.4.2.1": ["K03783", "K03784", "K03783", "K03784", "K03783", "K03784"],
    "4.2.3.17": ["K12921"],
    "2.4.2.3": ["K00757", "K00757"],
    "2.4.2.2": ["K00756"],
    "3.6.1.28": ["K05307"],
    "2.4.2.4": ["K00758", "K00758", "K00758"],
    "2.4.2.7": ["K00759"],
    "2.4.2.6": ["K08728"],
    "2.7.11.2": ["K12077"],
    "2.7.11.1": ["K03097", "K14758", "K07178", "K07179", "K16194", "K16195", "K08860", "K16196", "K08852", "K06642", "K06640", "K11912", "K04409", "K04410", "K05733", "K05734", "K05735", "K05736", "K04456", "K04366", "K04365", "K04366", "K04456", "K04365", "K04366", "K04367", "K04372", "K04373", "K04406", "K04407", "K04408", "K04409", "K04410", "K04414", "K04429", "K04442", "K04443", "K04444", "K04445", "K16510", "K04456", "K04409", "K11228", "K11229", "K04409", "K04410", "K05733", "K05734", "K05735", "K05736", "K08845", "K04365", "K04366", "K04456", "K04688", "K08960", "K03097", "K08957", "K17388", "K06228", "K08957", "K08958", "K08959", "K08960", "K02218", "K04514", "K04688", "K08791", "K08959", "K08960", "K08960", "K08791", "K04366", "K04443", "K04444", "K04456", "K04702", "K04456", "K04730", "K04733", "K02861", "K04728", "K03097", "K02861", "K04445", "K16510", "K08847", "K08849", "K04456", "K04372", "K04456", "K04688", "K06276", "K04456", "K13302", "K13303", "K13304", "K08960", "K04365", "K04366", "K08845", "K04728", "K04366", "K06276", "K04688", "K13302", "K13303", "K13304", "K04456", "K06276", "K04456", "K04688", "K08269", "K04373", "K04365", "K14498", "K14510", "K13416", "K13415", "K14500", "K14502", "K08269", "K08333", "K08845", "K04365", "K04366", "K04367", "K04409", "K04410", "K05733", "K05734", "K05735", "K05736", "K04514", "K17388", "K05743", "K05744", "K02214", "K06632", "K06633", "K02178", "K06637", "K06640", "K04728", "K02216", "K06641", "K06642", "K02214", "K02178", "K02216", "K06683", "K03114", "K06641", "K12761", "K12765", "K02214", "K12766", "K12767", "K12771", "K12776", "K03114", "K02216", "K02178", "K06683", "K11481", "K04367", "K04373", "K06633", "K08836", "K02178", "K04728", "K02861", "K04730", "K04731", "K04732", "K04733", "K04456", "K04728", "K06641", "K06640", "K02216", "K04514", "K17388", "K06272", "K06276", "K04456", "K04409", "K04410", "K05733", "K05734", "K05735", "K05736", "K04365", "K04366", "K03097", "K03097", "K06103", "K04456", "K04366", "K08959", "K04456", "K04733", "K04730", "K02861", "K08846", "K02861", "K02861", "K08847", "K04409", "K08845", "K04365", "K04366", "K04409", "K04410", "K05733", "K05734", "K05735", "K05736", "K04366", "K06276", "K04456", "K04366", "K04456", "K06276", "K04456", "K04366", "K04456", "K04688", "K04366", "K04409", "K05743", "K05744", "K04514", "K17388", "K04366", "K04365", "K04456", "K04409", "K04514", "K17388", "K06276", "K04456", "K04688", "K08845", "K04365", "K04366", "K04372", "K04456", "K06272", "K06276", "K04366", "K04366", "K04456", "K04367", "K04373", "K06633", "K04456", "K08845", "K04365", "K04366", "K02178", "K04456", "K04366", "K04366", "K06276", "K04456", "K04366", "K04445", "K04456", "K08845", "K04365", "K04366", "K04514", "K17388", "K04456", "K04981", "K04982", "K13302", "K06276", "K04456", "K04456", "K08845", "K04365", "K04366", "K08845", "K04365", "K04366", "K04373", "K08845", "K04365", "K04366", "K04366", "K04365", "K04373", "K04445", "K04443", "K04456", "K06276", "K08846", "K04730", "K04731", "K04732", "K04733", "K08834", "K04514", "K17388", "K04409", "K04410", "K05733", "K05734", "K05735", "K05736", "K05743", "K05744", "K04456", "K08959", "K08960", "K04445", "K08960", "K03097", "K13412", "K13420", "K13416", "K13417", "K13428", "K13436", "K13430", "K04456", "K08878", "K08845", "K04365", "K04366", "K08803", "K06228", "K08854", "K04728", "K04702", "K05734", "K04728", "K04445", "K04366", "K04514", "K04365", "K04366", "K08845", "K04409", "K04514", "K17388", "K04456", "K06276", "K04688", "K16195", "K02216", "K04443", "K04456", "K08845", "K04365", "K04366", "K04456", "K08845", "K04365", "K04366", "K08845", "K04365", "K04366", "K04456", "K04365", "K04456", "K04688", "K08845", "K04365", "K04366", "K04702", "K08806", "K08878", "K04456", "K04366", "K08845", "K04365", "K06228", "K08845", "K04365", "K04366", "K04456", "K04456", "K08845", "K04365", "K04366", "K04409", "K04410", "K05733", "K05734", "K05735", "K05736", "K08845", "K04365", "K04366", "K04445", "K08803", "K06276", "K04456", "K08845", "K04365", "K04366", "K06276", "K06272", "K04456", "K08845", "K04365", "K04366", "K04456", "K06276", "K04456", "K08845", "K04365", "K04366", "K08852", "K08860", "K08844", "K05688", "K08845", "K04365", "K04366", "K12567", "K12567", "K04456", "K08852", "K08860", "K04409", "K04514", "K17388", "K04514", "K17388", "K04514", "K17388", "K08846", "K04733", "K04730", "K04456", "K08846", "K04733", "K04730", "K04731", "K04366", "K14949", "K06272", "K06637", "K04456", "K04728", "K06640", "K02216", "K06641", "K04456", "K04730", "K04733", "K03097", "K16194", "K16195", "K08860", "K16196", "K16194", "K16195", "K08860", "K16196", "K04456", "K04733", "K04366", "K04456", "K04366", "K02861", "K16194", "K16195", "K08860", "K16196", "K04365", "K04366", "K08845", "K06276", "K04456", "K16194", "K16195", "K08860", "K16196", "K15409", "K03097", "K03097", "K04456", "K02861", "K04730", "K16194", "K16195", "K08860", "K16196", "K04730", "K04733", "K13412", "K06276", "K04456", "K04730", "K04733", "K04730", "K04733", "K04456"],
    "2.1.1.279": ["K17059"],
    "1.14.13.47": ["K15089"],
    "1.14.13.40": ["K09461"],
    "1.14.13.41": ["K13027", "K13027", "K13027"],
    "2.7.11.-": ["K06684", "K06686", "K02515", "K06668", "K02831", "K02831"],
    "1.14.13.48": ["K17721", "K17719", "K17719", "K17721", "K17719", "K07381", "K07381", "K14732", "K17719", "K17719", "K17721", "K17719", "K17721", "K17719", "K17721"],
    "1.14.13.49": ["K17721", "K17719", "K17719", "K17721", "K17719", "K07382", "K07382", "K14732", "K17719", "K17719", "K17721", "K17719", "K17721", "K17719", "K17721"],
    "1.6.99.5": ["K05903"],
    "1.6.99.3": ["K03934", "K03935", "K03936", "K03940", "K03941", "K03942", "K03943", "K00356", "K03885", "K03942", "K03943", "K03934", "K03935", "K03936", "K03940", "K03941", "K03942", "K03943", "K03934", "K03935", "K03936", "K03940", "K03941", "K03942", "K03943", "K03934", "K03935", "K03936", "K03940", "K03941", "K03942", "K03943", "K03934", "K03935", "K03936", "K03940", "K03941"],
    "1.3.1.83": ["K10960", "K10960"],
    "1.3.1.82": ["K15091"],
    "1.3.1.81": ["K15092"],
    "1.3.1.80": ["K13545"],
    "1.3.1.87": ["K05711", "K05711"],
    "1.3.1.86": ["K17829", "K17829"],
    "1.3.1.85": ["K14446"],
    "1.3.1.84": ["K14469", "K15020", "K14469", "K15020"],
    "3.5.1.94": ["K09473"],
    "3.5.1.96": ["K05526"],
    "3.5.4.21": ["K03365"],
    "3.5.4.26": ["K01498", "K11752"],
    "3.5.4.27": ["K01499", "K01499"],
    "3.5.1.92": ["K08069"],
    "3.5.4.25": ["K01497", "K14652"],
    "3.5.4.29": ["K08096"],
    "3.5.1.98": ["K06067", "K06067", "K06067", "K11404", "K06067", "K06067", "K06067", "K11404", "K11406", "K11407", "K11408", "K11405", "K11409", "K11418", "K06067", "K06067", "K06067", "K11404", "K11406", "K11407", "K11408", "K11405", "K11409", "K11418", "K11406", "K06067"],
    "3.5.1.99": ["K15528"],
    "3.4.24.86": ["K06059", "K06059", "K06059"],
    "3.4.24.84": ["K06013"],
    "3.4.24.85": ["K07765"],
    "1.4.3.19": ["K03153"],
    "3.4.24.80": ["K07763", "K07763"],
    "3.4.24.81": ["K06704", "K06704"],
    "2.7.1.100": ["K00899"],
    "2.4.2.27": ["K04341"],
    "2.7.1.106": ["K11809"],
    "2.7.1.107": ["K00901", "K00901", "K00901"],
    "2.7.1.105": ["K01103", "K00900", "K01103"],
    "2.7.1.108": ["K00902"],
    "3.8.1.3": ["K01561", "K01561"],
    "1.7.2.5": ["K04561"],
    "1.7.2.4": ["K00376"],
    "1.7.2.6": ["K10535"],
    "1.7.2.1": ["K00368", "K15864"],
    "1.7.2.3": ["K07811"],
    "1.7.2.2": ["K03385", "K03385"],
    "5.3.4.1": ["K08056", "K09580", "K09582", "K09584", "K13996", "K08056", "K09582", "K09582"],
    "3.8.1.2": ["K01560", "K01560"],
    "2.6.1.102": ["K13010"],
    "2.6.1.101": ["K13547"],
    "2.6.1.100": ["K13547"],
    "1.13.11.62": ["K17862"],
    "1.13.11.60": ["K17863", "K17864"],
    "4.2.99.21": ["K04781", "K04782"],
    "4.2.99.20": ["K08680", "K14759"],
    "3.11.1.1": ["K05306"],
    "3.11.1.2": ["K06193"],
    "1.13.11.68": ["K17912"],
    "3.6.3.12": ["K01546", "K01547", "K01548"],
    "2.4.1.182": ["K00748"],
    "1.1.1.103": ["K00060", "K15789"],
    "1.1.1.102": ["K04708"],
    "1.1.1.101": ["K06123", "K06123"],
    "1.1.1.100": ["K00059", "K00059", "K00059", "K00059"],
    "1.1.1.105": ["K13369", "K15734", "K13369"],
    "4.1.3.27": ["K01656", "K13501", "K01657", "K01658", "K13503", "K13497", "K01656", "K13501", "K01657", "K01658", "K13503", "K13497"],
    "4.1.3.24": ["K08691", "K08691", "K08691", "K08691", "K08691"],
    "5.3.3.1": ["K00070", "K01822", "K16045", "K01822", "K00070"],
    "1.14.17.1": ["K00503"],
    "3.2.1.67": ["K01213", "K01213"],
    "2.7.7.31": ["K00977", "K00977"],
    "2.7.7.30": ["K00976", "K00976"],
    "2.7.7.33": ["K00978", "K00978"],
    "2.6.1.37": ["K03430"],
    "2.6.1.39": ["K00825", "K00825", "K00825", "K00825", "K00825"],
    "2.7.7.39": ["K00980"],
    "2.7.7.38": ["K00979"],
    "2.8.2.33": ["K08106"],
    "1.1.1.219": ["K13082"],
    "1.1.1.218": ["K03378"],
    "1.1.1.216": ["K15890", "K15891", "K15891", "K15890"],
    "1.1.1.215": ["K00090"],
    "1.1.1.213": ["K00089", "K04119", "K04119", "K04119"],
    "1.1.1.211": ["K07515", "K10527", "K07515", "K07515", "K07515", "K07515", "K07515", "K10527", "K10527", "K07515", "K07515", "K07515", "K07515", "K07515", "K07515", "K07515", "K07515"],
    "1.2.1.13": ["K05298", "K05298"],
    "1.2.1.12": ["K00134", "K00134", "K00134", "K10705", "K00134", "K00134", "K00134"],
    "1.2.1.11": ["K00133", "K00133", "K00133", "K00133", "K00133"],
    "1.2.1.10": ["K04072", "K04072", "K00132", "K04072", "K04073", "K00132", "K04072", "K04073", "K04072", "K04072", "K00132", "K04072", "K04073", "K04072", "K00132", "K04072", "K04073", "K00132", "K04072", "K04073", "K04072"],
    "1.2.1.16": ["K00135", "K08324", "K00135", "K08324", "K00135", "K00135"],
    "1.2.1.19": ["K00137", "K00137"],
    "1.2.1.18": ["K00140", "K00140", "K00140", "K00140", "K00140"],
    "2.5.1.93": ["K13565"],
    "2.5.1.92": ["K15887"],
    "2.5.1.91": ["K12504", "K12505"],
    "2.5.1.90": ["K02523"],
    "2.5.1.97": ["K15898"],
    "2.5.1.96": ["K10208"],
    "6.3.2.7": ["K05362"],
    "2.1.1.67": ["K00569"],
    "2.1.1.64": ["K00568"],
    "2.1.1.68": ["K13066"],
    "3.1.5.1": ["K01129"],
    "1.6.5.4": ["K08232"],
    "1.6.5.3": ["K00329", "K00330", "K00331", "K00332", "K00333", "K13378", "K13380", "K00334", "K00335", "K00336", "K00337", "K00338", "K00339", "K00340", "K00341", "K00342", "K15863", "K00343", "K05572", "K05573", "K05574", "K05575", "K05576", "K05577", "K05578", "K05579", "K05580", "K05581", "K05582", "K05583", "K05584", "K05585", "K05586", "K05587", "K05588", "K03878", "K03879", "K03880", "K03881", "K03882", "K03883", "K03884", "K03934", "K03935", "K03936", "K03940", "K03941", "K03942", "K03943", "K03942", "K03943", "K03934", "K03935", "K03936", "K03940", "K03941", "K03878", "K03879", "K03880", "K03881", "K03882", "K03883", "K03884", "K03942", "K03943", "K03934", "K03935", "K03936", "K03940", "K03941", "K03942", "K03943", "K03934", "K03935", "K03936", "K03940", "K03941", "K03942", "K03943", "K03934", "K03935", "K03936", "K03940", "K03941"],
    "1.6.5.2": ["K00355"],
    "3.2.1.125": ["K12695"],
    "4.1.1.68": ["K05921", "K05921"],
    "4.1.1.65": ["K01613"],
    "2.3.1.74": ["K00660", "K00660"],
    "4.1.1.61": ["K01612", "K01612"],
    "3.6.5.5": ["K17065", "K01528", "K01528", "K01528", "K01528"],
    "1.6.3.-": ["K13447"],
    "3.8.1.-": ["K14419", "K14420", "K14421", "K01564", "K01564"],
    "2.5.1.78": ["K00794"],
    "2.3.1.78": ["K10532", "K10532"],
    "2.3.1.109": ["K00673"],
    "2.3.1.107": ["K12698"],
    "2.3.1.102": ["K03896"],
    "2.3.1.101": ["K00672", "K00672"],
    "2.3.2.10": ["K05363"],
    "2.3.2.13": ["K03917", "K05625"],
    "2.3.2.16": ["K11693"],
    "2.3.2.17": ["K11694"],
    "2.3.2.18": ["K11695"],
    "2.3.2.19": ["K13563"],
    "1.8.5.3": ["K07306"],
    "2.4.1.254": ["K12937"],
    "1.3.99.34": ["K17830"],
    "2.4.1.256": ["K03850"],
    "1.3.99.32": ["K16173"],
    "1.3.99.33": ["K17363"],
    "1.3.99.30": ["K15745"],
    "5.4.99.58": ["K16180"],
    "5.4.99.57": ["K16206"],
    "5.4.99.56": ["K16205"],
    "5.4.99.54": ["K16204"],
    "2.4.1.259": ["K03846", "K03846"],
    "2.4.1.258": ["K03845", "K03845"],
    "1.14.13.131": ["K16967"],
    "3.4.21.35": ["K01325"],
    "1.14.13.133": ["K15907"],
    "1.14.13.132": ["K00511", "K00511"],
    "1.14.13.137": ["K13223"],
    "1.14.13.136": ["K13257"],
    "1.14.13.139": ["K13225"],
    "1.14.13.138": ["K13224"],
    "3.4.21.38": ["K01328"],
    "1.2.3.14": ["K09842"],
    "3.1.3.1": ["K01077", "K01113", "K01077", "K01113", "K01077", "K01113"],
    "3.6.1.31": ["K01523", "K11755", "K14152", "K01523", "K11755", "K14152"],
    "4.1.1.90": ["K10106"],
    "3.1.3.3": ["K01079", "K01079", "K02203", "K01079", "K02203", "K02203", "K01079"],
    "2.1.1.271": ["K05936"],
    "3.4.25.1": ["K02730", "K02726", "K02728", "K02731", "K02729", "K02725", "K02727", "K02738", "K02739", "K02735", "K02734", "K02737", "K02732", "K02736", "K02741", "K02733", "K02740", "K11598", "K03432", "K03433"],
    "5.3.1.14": ["K01813"],
    "5.3.1.16": ["K01814", "K01814"],
    "5.3.1.17": ["K01815"],
    "3.3.2.9": ["K01253", "K01253", "K01253"],
    "5.3.1.12": ["K01812"],
    "5.3.3.12": ["K01827", "K01827"],
    "5.3.3.10": ["K01826", "K01826"],
    "3.3.2.8": ["K10533"],
    "5.3.3.18": ["K15866"],
    "2.6.1.5": ["K00838", "K00838", "K00815", "K00838", "K00815", "K00838", "K00815", "K00838", "K00815", "K00838", "K00838", "K00815", "K00838", "K00815", "K00838", "K00815", "K00838", "K00815", "K00838", "K00815", "K00838"],
    "3.8.1.8": ["K05394"],
    "2.6.1.7": ["K00825", "K00825", "K00825", "K00825", "K00816", "K00825", "K14264", "K00816", "K00816"],
    "2.3.1.76": ["K11155", "K11155", "K11156", "K11155", "K11156"],
    "2.3.1.75": ["K15406", "K11155", "K11160", "K11155", "K11156", "K11155", "K11160", "K11156"],
    "4.2.1.39": ["K05308", "K05308"],
    "4.2.1.36": ["K01705", "K01705", "K01705"],
    "3.1.3.-": ["K01112", "K10047", "K10047", "K11725", "K04716", "K04717", "K00974", "K10909", "K10916", "K15850", "K10047", "K10909", "K10916"],
    "4.2.1.35": ["K01703", "K01704", "K01703", "K01704", "K01703", "K01704", "K01703", "K01704"],
    "4.2.1.32": ["K03779", "K03780"],
    "4.2.1.33": ["K01703", "K01704", "K01702", "K01703", "K01704", "K01702", "K01703", "K01704", "K01702", "K01703", "K01704"],
    "4.2.1.30": ["K06120", "K06121", "K06122"],
    "3.1.3.4": ["K01080", "K15728", "K01080", "K15728", "K01080", "K01080", "K01080", "K01080"],
    "3.1.3.5": ["K01081", "K11751", "K03787", "K08722", "K08723", "K01081", "K11751", "K03787", "K08722", "K08723", "K01081", "K11751", "K03787", "K08722", "K08723"],
    "3.1.3.6": ["K08693", "K08693"],
    "3.1.3.7": ["K15759", "K15422", "K01082", "K15759", "K15422", "K15759", "K15422"],
    "3.5.3.6": ["K01478"],
    "3.1.3.2": ["K01093", "K01078", "K09474", "K03788", "K01093", "K14394", "K14379", "K14395", "K14410", "K01078", "K01093", "K03788", "K09474", "K09474", "K14379", "K14379", "K01078"],
    "3.1.1.11": ["K01051", "K01051"],
    "4.2.1.2": ["K01676", "K01679", "K01677", "K01678", "K01676", "K01677", "K01678", "K01679", "K01676", "K01677", "K01678", "K01679", "K01679", "K01679"],
    "3.1.3.8": ["K01083"],
    "3.1.3.9": ["K01084", "K01084", "K01084", "K01084", "K01084", "K01084", "K01084", "K01084"],
    "1.14.13.59": ["K03897"],
    "2.7.1.156": ["K02231"],
    "2.4.1.283": ["K13550"],
    "3.1.1.14": ["K08099"],
    "1.14.13.50": ["K03391", "K03391"],
    "2.7.1.150": ["K00921", "K00921", "K00921", "K00921"],
    "4.1.99.5": ["K15404"],
    "4.1.99.2": ["K01668"],
    "4.1.99.1": ["K01667"],
    "2.7.8.34": ["K07291"],
    "2.7.8.37": ["K06164", "K06166", "K06165", "K05780"],
    "3.4.15.1": ["K01283", "K01283", "K01283"],
    "6.2.1.16": ["K01907"],
    "3.5.4.37": ["K12968", "K12968", "K12968"],
    "3.5.4.30": ["K09887"],
    "6.2.1.12": ["K01904", "K01904", "K01904"],
    "3.5.4.38": ["K10989", "K10989"],
    "3.5.1.89": ["K03434"],
    "2.7.1.50": ["K00878", "K14154"],
    "3.1.7.2": ["K01139"],
    "3.1.7.6": ["K15793", "K15793"],
    "1.22.1.1": ["K17231"],
    "4.1.2.27": ["K01634"],
    "2.7.1.137": ["K00914", "K00914", "K00914", "K00914", "K00914"],
    "3.1.3.39": ["K04342"],
    "2.7.1.134": ["K00913", "K00913"],
    "2.7.1.130": ["K00912"],
    "2.1.4.2": ["K04340"],
    "2.1.4.1": ["K00613", "K00613"],
    "3.1.3.36": ["K01099", "K01099"],
    "2.7.1.138": ["K04715"],
    "2.1.2.9": ["K00604", "K00604"],
    "2.1.2.5": ["K00603", "K13990", "K00603", "K13990"],
    "4.3.3.2": ["K01757"],
    "2.1.2.1": ["K00600", "K00600", "K00600", "K00600", "K00600", "K00600", "K00600"],
    "2.1.2.2": ["K11787", "K00601", "K11175", "K08289", "K11787", "K00601", "K11175", "K08289"],
    "2.1.2.3": ["K00602", "K01492", "K00602"],
    "2.4.2.40": ["K13494"],
    "5.-.-.-": ["K03082", "K09829", "K06726"],
    "2.4.2.49": ["K13554"],
    "1.13.11.16": ["K05713", "K05713"],
    "1.13.11.14": ["K10621", "K10621", "K10621"],
    "1.13.11.15": ["K00455", "K00455"],
    "1.13.11.12": ["K00454", "K00454"],
    "1.14.15.12": ["K16593"],
    "1.13.11.11": ["K00453"],
    "1.13.11.18": ["K17725"],
    "1.13.11.19": ["K10712"],
    "1.14.11.12": ["K05282"],
    "1.10.9.1": ["K02636"],
    "1.21.-.-": ["K11784"],
    "3.5.4.5": ["K01489", "K01489"],
    "4.3.99.3": ["K10026"],
    "3.2.1.39": ["K01199"],
    "3.4.21.34": ["K01324"],
    "2.6.1.22": ["K07250", "K13524", "K07250", "K13524", "K07250", "K13524", "K07250", "K13524", "K07250", "K13524", "K13524"],
    "2.6.1.21": ["K00824", "K00824", "K00824", "K00824", "K00824"],
    "2.6.1.27": ["K00838", "K00838", "K00838", "K00838", "K00838", "K00838", "K14265", "K00838", "K00838", "K00838", "K00838", "K00838", "K00838"],
    "2.6.1.28": ["K05821", "K05821", "K05821", "K05821"],
    "1.1.1.202": ["K00086"],
    "1.1.1.205": ["K00088", "K00088"],
    "1.1.1.206": ["K08081"],
    "1.1.1.207": ["K15094"],
    "1.1.1.208": ["K15095"],
    "3.2.2.27": ["K03648", "K03648"],
    "3.2.2.26": ["K11783"],
    "3.2.2.21": ["K01247", "K13529", "K03652"],
    "3.2.2.20": ["K01246"],
    "3.2.2.23": ["K10563"],
    "2.3.1.168": ["K09699"],
    "1.2.1.26": ["K13877"],
    "1.2.1.27": ["K00140", "K00140", "K00140", "K00140", "K00140"],
    "1.2.1.24": ["K00139", "K17761", "K08324", "K00139", "K17761", "K08324"],
    "1.2.1.22": ["K07248", "K07248"],
    "3.4.13.20": ["K05604", "K05604", "K05604"],
    "1.2.1.20": ["K00135", "K00135", "K00135", "K00135"],
    "1.2.1.21": ["K07248", "K07248"],
    "1.2.1.28": ["K00141", "K00141", "K00141", "K00141"],
    "1.13.11.38": ["K11948"],
    "1.1.1.267": ["K00099"],
    "4.2.1.129": ["K06045"],
    "3.4.21.37": ["K01327", "K01327"],
    "4.1.3.39": ["K01666", "K01666", "K01666", "K01666", "K01666"],
    "4.1.3.38": ["K02619", "K03342"],
    "4.1.3.30": ["K03417"],
    "4.1.3.34": ["K15234", "K01644", "K15234", "K01644"],
    "4.1.3.36": ["K01661"],
    "1.16.1.-": ["K10142", "K14737", "K14738"],
    "2.7.1.82": ["K14156", "K00894"],
    "2.7.1.83": ["K16328", "K16330"],
    "1.16.1.3": ["K05368", "K05368"],
    "1.1.1.145": ["K00070", "K16045", "K00070"],
    "1.11.1.20": ["K15717"],
    "3.2.1.20": ["K12047", "K01187", "K12316", "K12317", "K15922", "K12047", "K01187", "K12316", "K12317", "K15922", "K12316", "K12047"],
    "3.2.1.21": ["K01188", "K05349", "K05350", "K01188", "K05349", "K05350", "K01188", "K05349", "K05350"],
    "3.2.1.22": ["K01189", "K07406", "K07407", "K01189", "K07406", "K07407", "K01189", "K07406", "K07407", "K01189", "K07406", "K07407", "K01189"],
    "4.3.1.18": ["K01753"],
    "3.2.1.24": ["K01191", "K12311", "K12312", "K12311"],
    "3.2.1.25": ["K01192", "K01192"],
    "4.1.1.79": ["K06034", "K13039"],
    "3.2.1.28": ["K01194"],
    "4.1.1.75": ["K12253"],
    "4.1.1.74": ["K04103"],
    "4.1.1.73": ["K07246", "K07246"],
    "4.1.1.70": ["K01615", "K01615"],
    "5.99.1.2": ["K03165", "K03165"],
    "5.99.1.4": ["K14584", "K14584"],
    "2.3.2.4": ["K00682"],
    "2.3.2.2": ["K00681", "K00681", "K00681", "K00681"],
    "2.3.2.3": ["K14205"],
    "2.3.1.133": ["K13065", "K13065", "K13065"],
    "2.3.1.137": ["K05940"],
    "2.3.1.135": ["K00678", "K00678"],
    "6.-.-.-": ["K02847"],
    "1.1.3.8": ["K00103"],
    "1.1.3.9": ["K04618"],
    "1.7.99.1": ["K15864", "K05601"],
    "1.7.99.4": ["K00370", "K00371", "K00374", "K00372", "K00360", "K02567", "K00370", "K00371", "K00374"],
    "1.1.3.-": ["K13552"],
    "5.4.99.40": ["K15815"],
    "5.4.99.41": ["K15815", "K15816"],
    "2.4.1.244": ["K09656", "K09657"],
    "2.4.1.245": ["K13057"],
    "2.4.1.241": ["K09480"],
    "1.14.13.126": ["K07436", "K07436"],
    "1.14.13.127": ["K05712", "K05712"],
    "1.14.13.124": ["K12153", "K12153", "K12153"],
    "1.14.13.125": ["K11812", "K11813", "K11812", "K11813", "K11812", "K11813"],
    "1.14.13.122": ["K13600"],
    "1.14.13.123": ["K15800"],
    "1.14.13.121": ["K15472"],
    "2.1.1.71": ["K00570"],
    "2.1.1.72": ["K06223", "K13581"],
    "1.14.13.129": ["K15746"],
    "2.4.1.37": ["K00709"],
    "2.4.1.34": ["K00706"],
    "2.1.1.240": ["K16040"],
    "2.1.1.247": ["K14082", "K14082"],
    "2.1.1.246": ["K14080", "K14080"],
    "2.1.1.245": ["K00197", "K00194", "K00197", "K00194", "K00197", "K00194"],
    "2.1.1.249": ["K16178", "K16178"],
    "2.1.1.248": ["K16176", "K16176"],
    "2.4.1.38": ["K07966", "K07967", "K07966", "K07967", "K07968", "K07966", "K07967", "K07968", "K07966", "K07967", "K07968", "K07966", "K07967", "K07968", "K07966", "K07967", "K07968"],
    "2.4.1.302": ["K12711"],
    "2.4.1.300": ["K17192"],
    "2.7.3.9": ["K08483", "K08484"],
    "6.3.4.23": ["K06863"],
    "6.3.4.21": ["K00763"],
    "6.3.4.20": ["K06920"],
    "5.5.1.18": ["K06444"],
    "2.8.1.-": ["K04085", "K07235", "K11179", "K00566"],
    "1.10.3.-": ["K02299", "K02298", "K02297", "K00425", "K00426", "K00425", "K00426"],
    "5.5.1.19": ["K17841", "K06443", "K14605", "K14606"],
    "2.8.1.8": ["K03644"],
    "1.10.3.1": ["K00422", "K00422"],
    "1.10.3.3": ["K00423"],
    "5.5.1.17": ["K15797"],
    "2.8.1.2": ["K01011", "K01011", "K01011"],
    "2.8.1.1": ["K01011", "K02439", "K01011", "K01011"],
    "2.8.1.6": ["K01012"],
    "2.8.1.7": ["K11717", "K04487", "K11717", "K04487"],
    "2.3.1.46": ["K00651", "K00651", "K00651"],
    "4.2.1.20": ["K01695", "K01696", "K06001", "K01694", "K01694", "K01695", "K01696", "K06001", "K01695", "K01696", "K06001", "K01694"],
    "4.2.1.22": ["K01697", "K10150", "K10150", "K01697", "K10150", "K10150", "K01697"],
    "4.2.1.25": ["K13875"],
    "2.3.1.43": ["K00650"],
    "2.3.1.40": ["K05939", "K05939"],
    "2.3.1.41": ["K00647", "K00647", "K00647"],
    "4.2.1.28": ["K01699", "K13919", "K13920"],
    "2.7.8.-": ["K08729", "K06131", "K06132", "K08744", "K05537", "K06133"],
    "2.3.1.48": ["K04498", "K04498", "K06062", "K04498", "K04498", "K04498", "K04498", "K04498", "K04498", "K06062", "K09101", "K11256", "K04498", "K04498", "K02223", "K04498", "K02223", "K02223", "K04498", "K04498", "K04498", "K06062", "K04498", "K04498", "K04498", "K11303", "K04498", "K11304", "K04498", "K06062", "K04498", "K04498", "K04498", "K02223", "K04498"],
    "2.4.1.232": ["K05528"],
    "2.7.8.1": ["K13644", "K00993", "K00993", "K13644", "K00993", "K13644"],
    "2.7.8.2": ["K00994", "K13644", "K00994", "K13644", "K13644", "K00994"],
    "4.2.3.70": ["K15807"],
    "2.7.8.5": ["K00995"],
    "2.7.8.7": ["K00997"],
    "2.7.8.8": ["K00998", "K17103", "K00998", "K17103"],
    "1.14.13.28": ["K13261"],
    "1.14.13.25": ["K16157", "K16158", "K16159", "K16161", "K16157", "K16158", "K16159", "K16161", "K16157", "K16158", "K16159", "K16161"],
    "1.14.13.22": ["K03379", "K03379"],
    "1.14.11.22": ["K13077", "K13077"],
    "1.14.13.20": ["K10676", "K10676"],
    "1.14.13.21": ["K05280", "K05280"],
    "2.7.8.27": ["K04714"],
    "2.7.8.26": ["K02233"],
    "1.3.2.3": ["K00225"],
    "2.7.8.24": ["K01004"],
    "2.7.8.20": ["K01002"],
    "1.7.1.-": ["K15055", "K15057"],
    "2.7.8.29": ["K08730"],
    "2.7.8.28": ["K11212"],
    "3.1.3.37": ["K11532", "K01086", "K01100", "K11532", "K01086", "K11532", "K01086", "K11532", "K01086", "K11532", "K01086", "K01100", "K11532", "K01086"],
    "3.2.1.23": ["K01190", "K12111", "K12308", "K12309", "K01190", "K12309", "K12309", "K12309", "K01190", "K12111", "K12309", "K12309"],
    "1.14.99.43": ["K15814"],
    "1.14.99.40": ["K04719"],
    "1.14.99.46": ["K09018"],
    "1.14.99.44": ["K10210"],
    "1.14.99.45": ["K09837"],
    "1.5.8.1": ["K00317", "K00317"],
    "1.14.13.112": ["K12637", "K12638"],
    "1.7.7.2": ["K00367"],
    "1.14.20.1": ["K12744", "K12746"],
    "3.1.3.29": ["K01097"],
    "1.14.20.2": ["K13229"],
    "3.1.3.21": ["K06116", "K06117"],
    "3.1.3.27": ["K01095", "K01096"],
    "3.1.3.26": ["K01093", "K01093", "K01093"],
    "3.1.3.25": ["K10047", "K01092", "K10047", "K15759", "K15759", "K01092", "K01092", "K10047", "K15759"],
    "5.1.1.13": ["K01779", "K01779"],
    "5.1.1.17": ["K04127"],
    "5.1.1.18": ["K12235"],
    "4.2.1.131": ["K09844"],
    "2.4.2.51": ["K17193"],
    "2.4.2.53": ["K10012"],
    "2.4.2.52": ["K05966", "K13927"],
    "3.2.1.26": ["K01193", "K01193"],
    "6.2.1.4": ["K01899", "K01900", "K01899", "K01900", "K01899", "K01900"],
    "3.1.4.54": ["K13985"],
    "1.3.1.20": ["K00078", "K00212", "K00078"],
    "1.3.1.22": ["K12343", "K12344", "K12345", "K09591", "K12344"],
    "5.2.1.13": ["K09835"],
    "1.3.1.24": ["K05901", "K00214", "K05901"],
    "1.12.98.2": ["K13942", "K13942"],
    "3.1.26.12": ["K08300"],
    "1.1.1.315": ["K00061"],
    "2.7.1.127": ["K00911", "K00911", "K00911"],
    "1.13.12.3": ["K00466"],
    "2.7.4.8": ["K00942"],
    "2.7.4.9": ["K00943"],
    "1.13.12.4": ["K00467"],
    "2.7.4.6": ["K00940", "K00940"],
    "2.7.4.7": ["K00877", "K00941", "K14153"],
    "2.7.4.1": ["K00937", "K00937"],
    "2.7.4.2": ["K00938", "K13273", "K13273"],
    "2.7.4.3": ["K00939", "K14535", "K14535"],
    "2.7.4.-": ["K13800"],
    "5.3.2.6": ["K01821", "K01821", "K01821", "K01821"],
    "2.7.6.5": ["K00951", "K07816"],
    "2.7.6.2": ["K00949"],
    "2.7.6.3": ["K13939", "K13940", "K00950", "K13941"],
    "1.13.12.-": ["K00468"],
    "2.7.6.1": ["K00948", "K00948", "K00948", "K00948"],
    "2.6.1.16": ["K00820", "K00820"],
    "2.6.1.17": ["K00821", "K00821", "K14267", "K00821", "K14267", "K00821"],
    "2.6.1.13": ["K00819"],
    "2.6.1.11": ["K00818", "K00821", "K05830", "K05830", "K00818", "K00821", "K00821", "K05830", "K00818", "K00821", "K05830"],
    "2.6.1.18": ["K00822", "K00822", "K00822"],
    "2.6.1.19": ["K00823", "K07250", "K13524", "K00823", "K07250", "K13524", "K00823", "K07250", "K13524", "K07250", "K13524", "K00823", "K07250", "K13524", "K13524"],
    "1.1.1.275": ["K12466"],
    "1.1.1.271": ["K02377", "K02377"],
    "1.1.1.270": ["K09827", "K13373", "K13373", "K13373"],
    "1.2.1.39": ["K00146", "K00146"],
    "1.2.1.38": ["K00145", "K12659", "K05829", "K05829", "K00145", "K12659", "K05829", "K00145", "K05829", "K12659"],
    "3.4.16.-": ["K09756", "K09757"],
    "1.97.1.-": ["K00539", "K00539", "K00539", "K00539"],
    "3.4.23.15": ["K01380"],
    "1.2.1.31": ["K00143", "K14085", "K14085", "K14085", "K14085", "K14085", "K14085", "K14085", "K14085", "K14085", "K00143", "K14085", "K00143", "K14085", "K14085", "K14085", "K14085", "K14085"],
    "1.2.1.32": ["K10217", "K10217", "K10217", "K10217"],
    "1.2.1.36": ["K07249"],
    "1.97.1.9": ["K07309", "K07310", "K12527"],
    "4.2.1.78": ["K13382"],
    "3.4.16.4": ["K07258", "K07259", "K07260"],
    "3.4.16.5": ["K13289", "K13289"],
    "3.4.16.2": ["K01285"],
    "3.7.1.-": ["K10623", "K10702", "K05714", "K07539", "K15756", "K03336", "K05714", "K15359", "K07539", "K10702", "K10623", "K10702", "K15756", "K14604"],
    "2.7.2.-": ["K05828", "K05828", "K05828", "K05828"],
    "3.7.1.8": ["K10222", "K10222"],
    "3.7.1.9": ["K10216", "K10216", "K10216", "K10216"],
    "2.7.2.8": ["K00930", "K12659", "K05828", "K05828", "K00930", "K12659", "K05828", "K00930", "K05828", "K12659"],
    "2.7.2.2": ["K00926", "K00926", "K00926", "K00926"],
    "2.7.2.3": ["K00927", "K00927", "K00927", "K00927"],
    "1.1.1.303": ["K00004", "K03366"],
    "2.7.2.1": ["K00925", "K00925", "K00925", "K00925", "K00925", "K00925"],
    "1.1.1.305": ["K10011"],
    "2.7.2.7": ["K00929"],
    "2.7.2.4": ["K00928", "K00928", "K12524", "K12525", "K12526", "K00928", "K12524", "K12525", "K12526", "K00928", "K12524", "K12525", "K12526", "K00928", "K12524", "K12525", "K12526"],
    "2.7.1.91": ["K04718", "K04718", "K04718", "K04718", "K04718"],
    "2.7.1.90": ["K00895"],
    "2.7.1.92": ["K03338"],
    "2.7.1.94": ["K09881"],
    "1.14.16.4": ["K00502", "K00502"],
    "1.14.16.2": ["K00501", "K00501", "K00501", "K00501", "K00501", "K00501", "K00501", "K00501"],
    "1.14.16.1": ["K00500", "K00500", "K00500"],
    "3.5.5.7": ["K01502"],
    "3.5.5.4": ["K13035"],
    "3.5.5.1": ["K01501", "K01501", "K01501", "K13035", "K01501", "K01501"],
    "3.2.1.33": ["K01196"],
    "1.14.12.14": ["K15766", "K15767"],
    "1.3.8.9": ["K09479", "K09479"],
    "4.1.1.41": ["K11264"],
    "3.2.1.37": ["K01198", "K15920", "K01198", "K15920"],
    "4.1.1.47": ["K01608"],
    "4.1.1.44": ["K14727", "K01607", "K14727", "K01607"],
    "4.1.1.45": ["K03392"],
    "1.3.8.3": ["K07545", "K07545"],
    "1.3.8.2": ["K10209"],
    "1.3.8.1": ["K00248", "K00248", "K00248", "K00248", "K00248"],
    "4.1.1.49": ["K01610", "K01610", "K01610", "K01610", "K01610"],
    "1.3.8.7": ["K00249", "K00249", "K00249", "K00249", "K00249", "K00249", "K00249"],
    "1.3.8.6": ["K00252", "K00252", "K00252"],
    "1.3.8.4": ["K00253"],
    "1.1.1.94": ["K00057"],
    "1.1.1.95": ["K00058", "K00058", "K00058", "K00058"],
    "1.1.1.93": ["K07246", "K07246"],
    "1.1.1.90": ["K00055", "K00055", "K00055", "K00055", "K00055", "K00055"],
    "1.2.1.9": ["K00131"],
    "1.14.12.13": ["K08686"],
    "2.3.1.129": ["K00677"],
    "2.4.1.278": ["K14368", "K14368"],
    "2.4.1.277": ["K16004", "K16004"],
    "2.4.1.276": ["K14596"],
    "1.3.99.12": ["K09478", "K09478", "K11410", "K09478"],
    "2.4.1.274": ["K07553"],
    "5.4.99.35": ["K15819"],
    "5.4.99.34": ["K15818"],
    "5.4.99.37": ["K15810"],
    "5.4.99.36": ["K15820"],
    "5.4.99.31": ["K15821"],
    "1.14.18.-": ["K00506", "K00506"],
    "5.4.99.33": ["K15812"],
    "3.5.1.-": ["K04711", "K05848", "K09023", "K15784", "K01833", "K08281", "K11121", "K11411", "K11411", "K11411"],
    "1.14.12.18": ["K08689", "K15750", "K08689", "K15750"],
    "5.4.99.39": ["K15813", "K15815"],
    "5.4.99.38": ["K15822"],
    "1.14.12.19": ["K05708", "K05709", "K05708", "K05709"],
    "3.1.13.4": ["K01148", "K12571"],
    "3.5.1.9": ["K01432", "K14263", "K07130", "K01432", "K14263", "K07130"],
    "3.5.1.2": ["K01425", "K01425", "K01425", "K01425", "K01425", "K01425", "K01425"],
    "3.5.1.3": ["K13566"],
    "1.14.18.2": ["K08080"],
    "1.14.18.3": ["K10944", "K10944", "K10944"],
    "3.5.1.6": ["K01431", "K01431", "K01431", "K01431"],
    "3.5.1.4": ["K01426", "K01426", "K01426", "K01426", "K01426"],
    "3.5.1.5": ["K01427", "K01428", "K01429", "K01430", "K14048", "K01427", "K01428", "K01429", "K01430", "K14048", "K01428", "K01429", "K01430", "K14048", "K14048", "K01428"],
    "2.1.1.254": ["K14369"],
    "4.2.1.18": ["K05607", "K13766"],
    "2.1.1.250": ["K14083", "K14083"],
    "2.1.1.251": ["K16954"],
    "4.2.1.19": ["K01693", "K01089", "K01693", "K01089"],
    "2.1.1.258": ["K15023", "K15023"],
    "6.3.4.18": ["K01589"],
    "6.3.4.19": ["K15780"],
    "6.3.4.16": ["K01948", "K01948", "K01948", "K01948", "K01948"],
    "6.3.4.14": ["K01961", "K01961", "K11263", "K11262", "K01961", "K11262", "K01961", "K11262", "K01961", "K11263", "K01961", "K11262", "K01961", "K11262", "K11262"],
    "6.3.4.15": ["K01947", "K01942", "K03524", "K01947"],
    "1.23.1.-": ["K13266"],
    "6.3.4.13": ["K11787", "K11788", "K01945", "K13713", "K11787"],
    "6.3.4.10": ["K01942"],
    "6.3.4.11": ["K01942"],
    "3.-.-.-": ["K05294", "K12629", "K12584", "K12610", "K12611", "K04799", "K04799", "K04799", "K11859", "K11859", "K14493", "K02311", "K11859", "K11859", "K11859"],
    "3.1.13.-": ["K12618", "K12619", "K12585", "K12591", "K12618", "K12619"],
    "2.3.1.95": ["K13232"],
    "2.3.1.94": ["K10817", "K10817"],
    "1.5.1.41": ["K05368", "K05368"],
    "1.5.1.43": ["K13746"],
    "1.5.1.45": ["K16902"],
    "1.5.1.47": ["K17364"],
    "4.2.1.55": ["K17865", "K17865"],
    "6.3.2.17": ["K01930", "K11754"],
    "3.6.1.19": ["K01519", "K02428", "K01519", "K02428", "K01519"],
    "4.2.1.51": ["K14170", "K04518", "K01713", "K05359", "K14170", "K01713", "K04518", "K05359"],
    "6.3.2.12": ["K11754"],
    "6.3.2.13": ["K01928", "K15792", "K01928", "K15792"],
    "3.6.1.15": ["K06928", "K06928"],
    "3.1.4.3": ["K01114", "K16619", "K01114", "K16619", "K01114", "K16619", "K01114"],
    "3.6.1.17": ["K01518", "K01518"],
    "3.6.1.16": ["K01517", "K01517"],
    "3.6.1.11": ["K01514", "K01524"],
    "4.2.1.59": ["K01716", "K02372", "K16363", "K01716", "K02372", "K16363", "K16363", "K02372"],
    "3.6.1.13": ["K01517", "K13988", "K01515", "K01517", "K13987"],
    "3.6.1.12": ["K16904"],
    "4.2.3.67": ["K15809"],
    "2.3.1.13": ["K00628"],
    "4.2.3.61": ["K15804"],
    "4.2.3.60": ["K15802"],
    "3.8.1.5": ["K01563", "K01563"],
    "2.3.1.92": ["K09757"],
    "1.3.3.14": ["K15949"],
    "4.2.3.69": ["K15799"],
    "1.14.13.39": ["K00491", "K13240", "K13241", "K13242", "K13253", "K13427", "K13242", "K13241", "K13242", "K13240", "K13241", "K13242", "K13242", "K13240", "K13241", "K13242", "K13240", "K13240", "K13240", "K13427", "K13241", "K13241", "K13240", "K13240", "K13241", "K13241", "K13241", "K13241", "K13241", "K13241", "K13241"],
    "1.14.13.38": ["K14256", "K14256"],
    "1.14.13.36": ["K09754", "K09754", "K09754"],
    "1.14.13.30": ["K17726"],
    "1.14.13.32": ["K17689", "K17689", "K17689", "K17689", "K17689", "K17689", "K17689"],
    "2.4.1.21": ["K00703", "K16148"],
    "2.4.1.20": ["K00702"],
    "2.4.1.22": ["K00704", "K07966", "K07967", "K07966", "K07967", "K07966", "K07967", "K07966", "K07967", "K07966", "K07967", "K07966", "K07967"],
    "2.4.1.25": ["K01196", "K00705"],
    "2.1.1.109": ["K17649"],
    "1.14.13.175": ["K17651"],
    "4.2.3.23": ["K14179"],
    "4.2.3.22": ["K15803", "K10187"],
    "4.2.3.21": ["K14182"],
    "1.11.1.-": ["K11207", "K13447"],
    "3.4.24.56": ["K01408"],
    "2.1.1.100": ["K00587"],
    "2.1.1.101": ["K15996"],
    "3.6.3.28": ["K02041"],
    "3.6.3.29": ["K02017"],
    "4.2.3.25": ["K15086"],
    "1.11.1.8": ["K00431", "K00431", "K00431", "K00431", "K00431", "K00431"],
    "1.11.1.9": ["K00432", "K00432", "K00432"],
    "1.11.1.6": ["K03781", "K03781", "K03781", "K03781", "K03781"],
    "2.3.1.50": ["K00654"],
    "3.6.3.20": ["K05816"],
    "4.2.3.24": ["K14178"],
    "2.3.1.54": ["K00656", "K00656", "K00656"],
    "2.3.1.57": ["K00657"],
    "3.6.3.25": ["K02045", "K02045"],
    "3.1.3.18": ["K01091"],
    "2.7.11.13": ["K02677", "K02677", "K06070", "K06069", "K02677", "K02677", "K02677", "K02677", "K06069", "K06069", "K02677", "K02677", "K02677", "K02677", "K06071", "K02677", "K06069", "K02677", "K06069", "K02677", "K06068", "K02677", "K02677", "K02677", "K02677", "K02677", "K06069", "K02677", "K02677", "K02677", "K02677", "K06068", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K02677", "K06071", "K02677", "K02677", "K02677"],
    "3.1.3.16": ["K01110", "K06269", "K15544", "K04382", "K11915", "K04348", "K04457", "K04459", "K04460", "K04461", "K04348", "K04382", "K04382", "K06269", "K04382", "K04348", "K15637", "K01110", "K04348", "K01110", "K01110", "K04382", "K16340", "K01110", "K14497", "K14501", "K06269", "K04382", "K06269", "K04382", "K06269", "K04382", "K04348", "K04348", "K01110", "K10147", "K06269", "K01110", "K04382", "K01110", "K04348", "K04348", "K04348", "K06269", "K04382", "K06269", "K06269", "K04348", "K04348", "K06269", "K04382", "K06269", "K04348", "K04382", "K13807", "K04348", "K04348", "K01110", "K01110", "K06269", "K01110", "K01110", "K01110", "K01110", "K01110", "K04348", "K04348", "K06269", "K04348", "K06269", "K04348", "K04348", "K01110", "K04382", "K06269", "K04382"],
    "3.1.3.15": ["K01089", "K04486", "K05602", "K05602", "K01089", "K04486"],
    "3.1.3.12": ["K01087", "K16055"],
    "3.1.3.13": ["K01837", "K01837"],
    "3.1.3.10": ["K01085"],
    "3.1.3.11": ["K01622", "K03841", "K02446", "K11532", "K01086", "K04041", "K01622", "K03841", "K02446", "K11532", "K01086", "K04041", "K01622", "K01622", "K03841", "K02446", "K11532", "K01086", "K04041", "K03841", "K02446", "K11532", "K01086", "K04041", "K01622", "K03841", "K02446", "K11532", "K01086", "K04041", "K01622", "K03841", "K02446", "K11532", "K01086", "K04041", "K03841"],
    "2.4.2.28": ["K00772"],
    "2.7.11.12": ["K07376", "K07376", "K07376", "K07376", "K07376"],
    "2.4.2.24": ["K00770", "K00770"],
    "2.4.2.26": ["K00771", "K00771"],
    "2.4.1.120": ["K13068"],
    "2.4.2.21": ["K00768"],
    "2.4.2.22": ["K00769", "K03816"],
    "2.7.8.13": ["K01000"],
    "2.7.8.11": ["K00999", "K00999", "K00999"],
    "2.7.8.17": ["K08239"],
    "2.7.8.15": ["K01001"],
    "2.4.1.129": ["K05364", "K05365", "K03587", "K12555"],
    "3.5.99.2": ["K03707"],
    "3.5.99.3": ["K03382"],
    "3.5.99.6": ["K02564"],
    "3.5.99.7": ["K01505"],
    "3.5.99.4": ["K08710"],
    "3.5.99.5": ["K15067"],
    "2.7.1.159": ["K00913", "K00913"],
    "2.7.1.158": ["K10572", "K10572"],
    "4.2.3.73": ["K14181"],
    "2.7.1.154": ["K00923", "K00923"],
    "3.1.1.13": ["K01052", "K12298", "K14674", "K12298", "K14674", "K14674", "K14674", "K14674", "K14674", "K14674", "K01052", "K12298", "K12298"],
    "2.7.1.151": ["K00915", "K00328", "K00915"],
    "3.1.1.15": ["K13874"],
    "2.7.1.153": ["K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922", "K00922"],
    "3.1.1.17": ["K01053", "K01053", "K01053", "K01053", "K01053"],
    "3.2.2.-": ["K05522", "K03660", "K10567", "K10568", "K03649", "K10800", "K03575", "K10801"],
    "3.2.2.3": ["K01240", "K01240"],
    "3.2.2.1": ["K01239", "K01239"],
    "3.2.2.4": ["K01241"],
    "3.2.2.5": ["K01242", "K01242", "K01242", "K01242", "K01242"],
    "3.2.2.8": ["K10213", "K10213"],
    "3.2.2.9": ["K01243", "K01243"],
    "4.2.1.66": ["K10675"],
    "1.1.99.38": ["K13549"],
    "2.7.11.23": ["K02202", "K02202", "K02087", "K02202", "K02087", "K02087", "K02087", "K02087", "K02211", "K02087", "K02087", "K02087"],
    "1.1.1.266": ["K13306"],
    "1.13.11.39": ["K00462", "K00462", "K00462"],
    "1.1.1.262": ["K00097"],
    "1.1.1.261": ["K00096"],
    "1.13.11.31": ["K00458", "K00458"],
    "1.13.11.33": ["K08022", "K00460", "K00460", "K00460", "K08022"],
    "1.13.11.34": ["K00461", "K00461", "K00461", "K00461"],
    "1.13.11.37": ["K04098", "K04098"],
    "2.7.7.86": ["K17834"],
    "2.7.7.81": ["K15899"],
    "1.2.1.44": ["K09753"],
    "1.2.1.46": ["K00148", "K00148", "K00148"],
    "1.2.1.47": ["K00149", "K00149", "K00149", "K00149", "K00149", "K00149", "K00149", "K00149", "K00149", "K00149", "K00149", "K00149"],
    "1.2.1.41": ["K00147", "K12657", "K00147", "K12657"],
    "1.2.1.43": ["K05299", "K15022", "K05299", "K15022", "K05299", "K15022"],
    "4.1.2.50": ["K01737"],
    "2.7.11.14": ["K00909", "K00909", "K00909"],
    "4.1.2.52": ["K02510"],
    "4.1.2.53": ["K12660"],
    "3.4.14.9": ["K01279"],
    "4.1.1.20": ["K12526", "K01586", "K12526", "K12526", "K12526", "K01586"],
    "4.1.1.22": ["K01590"],
    "1.1.1.318": ["K17055"],
    "1.1.1.319": ["K17056"],
    "1.1.1.312": ["K10219", "K10219", "K10219", "K10219"],
    "1.1.1.313": ["K15373"],
    "1.1.1.310": ["K16843"],
    "1.1.1.311": ["K14746", "K14746"],
    "1.1.1.316": ["K17744"],
    "1.1.1.314": ["K15800"],
    "1.12.98.1": ["K00440", "K00441", "K00443"],
    "4.1.1.55": ["K04102"],
    "1.1.1.88": ["K00054"],
    "5.4.99.-": ["K14655", "K15056", "K11131"],
    "4.1.1.50": ["K01611", "K01611"],
    "1.1.1.81": ["K00049", "K12972", "K00049", "K00050", "K12972", "K00050", "K12972", "K00049"],
    "1.1.1.83": ["K07246", "K07246"],
    "1.1.1.82": ["K00051", "K00051", "K00051"],
    "1.1.1.85": ["K00052", "K00052", "K00052"],
    "1.1.1.87": ["K05824", "K10978", "K05824", "K10978", "K10978", "K05824", "K10978"],
    "1.1.1.86": ["K00053", "K00053", "K00053", "K00053"],
    "2.7.11.19": ["K00871", "K00871"],
    "5.4.99.8": ["K01853"],
    "5.4.99.7": ["K01852"],
    "5.4.99.5": ["K13853", "K01850", "K04092", "K14187", "K04093", "K14170", "K04516", "K06208", "K06209", "K13853", "K01850", "K04092", "K14187", "K04093", "K14170", "K04516", "K06208", "K06209", "K14187"],
    "1.3.3.12": ["K05276"],
    "5.4.99.2": ["K01847", "K01848", "K01849", "K11942", "K01847", "K01847", "K01849", "K01848", "K11942", "K01847", "K01848", "K01849", "K11942", "K01847", "K01849", "K01848", "K11942"],
    "5.4.99.1": ["K01846"],
    "2.8.3.12": ["K01039", "K01040", "K01039", "K01040"],
    "2.7.11.18": ["K00907", "K00907", "K00907", "K00907", "K00907"],
    "2.8.3.10": ["K01643", "K01643"],
    "2.8.3.17": ["K13607"],
    "2.8.3.15": ["K07543", "K07544", "K07543", "K07544"],
    "2.4.1.265": ["K03849"],
    "2.4.1.267": ["K03848"],
    "2.4.1.260": ["K03847", "K03847"],
    "2.4.1.261": ["K03846", "K03846"],
    "2.4.1.263": ["K14595"],
    "2.1.1.17": ["K00551", "K16369", "K00570"],
    "2.1.1.16": ["K00550"],
    "2.1.1.14": ["K00549", "K00549", "K00549"],
    "2.1.1.13": ["K00548", "K00548", "K00548", "K00548"],
    "2.1.1.12": ["K08247"],
    "2.1.1.11": ["K03428"],
    "2.1.1.10": ["K00547"],
    "5.1.3.18": ["K10046", "K10046"],
    "5.1.3.19": ["K01794"],
    "5.1.3.14": ["K01791", "K12409"],
    "5.1.3.15": ["K01792"],
    "5.1.3.17": ["K01793"],
    "5.1.3.10": ["K12454"],
    "5.1.3.13": ["K01790", "K01790"],
    "5.3.1.25": ["K01818"],
    "5.3.1.24": ["K13501", "K01817", "K13498", "K13501", "K01817", "K13498"],
    "5.3.1.27": ["K08094", "K13831", "K08094", "K13831", "K08094", "K13831", "K08094", "K13831"],
    "5.3.1.26": ["K01819"],
    "5.3.1.23": ["K08963"],
    "5.3.1.22": ["K01816"],
    "3.4.21.89": ["K03100"],
    "5.3.1.28": ["K03271"],
    "4.-.-.-": ["K02288", "K02631", "K04034", "K05555"],
    "2.1.3.11": ["K13043"],
    "2.1.3.12": ["K12713"],
    "2.8.2.21": ["K01022"],
    "1.14.14.3": ["K00494", "K15854"],
    "2.8.2.23": ["K01024", "K08104"],
    "2.8.2.25": ["K13270"],
    "2.8.2.27": ["K13271"],
    "1.5.1.38": ["K00299"],
    "1.5.1.34": ["K00357", "K10679"],
    "2.3.1.146": ["K13231"],
    "1.5.1.36": ["K00484", "K00484"],
    "1.5.1.37": ["K15245"],
    "1.5.1.30": ["K05901", "K05901"],
    "4.2.1.47": ["K01711", "K01711"],
    "4.2.1.46": ["K01710", "K01710", "K01710"],
    "4.2.1.45": ["K01709"],
    "4.2.1.44": ["K03335"],
    "4.2.1.43": ["K13876"],
    "4.2.1.42": ["K01708"],
    "4.2.1.41": ["K01707"],
    "4.2.1.40": ["K01706"],
    "4.2.3.53": ["K15798"],
    "4.2.3.50": ["K15798"],
    "4.2.3.56": ["K14186"],
    "4.2.3.57": ["K15808", "K14184"],
    "4.2.1.49": ["K01712"],
    "4.2.3.55": ["K15794"],
    "4.1.99.12": ["K14652", "K02858"],
    "4.1.1.7": ["K01576"],
    "5.4.1.2": ["K06042"],
    "2.4.1.58": ["K03279"],
    "2.4.1.56": ["K03280"],
    "2.4.1.50": ["K13646", "K11703", "K11703", "K13646"],
    "4.2.99.-": ["K02330", "K03512", "K03512", "K02330", "K02330"],
    "2.8.2.29": ["K07808"],
    "3.5.1.52": ["K01456"],
    "3.5.1.53": ["K12251"],
    "3.5.1.54": ["K01457", "K14541", "K01457", "K14541"],
    "3.5.1.56": ["K03418"],
    "5.2.1.14": ["K17911"],
    "3.5.1.59": ["K08687"],
    "3.4.22.56": ["K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187", "K02187"],
    "2.4.1.101": ["K00726", "K00726"],
    "2.2.1.1": ["K00615", "K00615", "K00615", "K00615", "K00615"],
    "2.2.1.2": ["K00616", "K13810", "K00616", "K13810", "K13810", "K13810", "K00616", "K13810", "K13810"],
    "2.2.1.3": ["K17100", "K17100"],
    "2.3.1.201": ["K13018"],
    "2.2.1.6": ["K01652", "K01653", "K11258", "K01652", "K01653", "K11258", "K01652", "K01653", "K11258", "K01652", "K01653", "K11258", "K01652", "K01653", "K11258", "K01652", "K01653", "K11258"],
    "2.3.1.202": ["K15896"],
    "2.4.1.109": ["K00728"],
    "2.2.1.9": ["K02551", "K14759"],
    "2.1.1.285": ["K12712"],
    "2.1.1.284": ["K12705"],
    "2.3.1.29": ["K00639"],
    "2.3.1.24": ["K04709", "K04710"],
    "6.6.1.1": ["K03403", "K03404", "K03405"],
    "2.3.1.26": ["K00637"],
    "3.6.3.36": ["K10831", "K10831"],
    "2.3.1.20": ["K15406", "K00635", "K11155", "K11160", "K14456", "K11155", "K14456", "K11155", "K11160"],
    "2.3.1.21": ["K08765", "K08766", "K08765", "K08766", "K08765", "K08765", "K08766"],
    "2.3.1.22": ["K14456", "K14457", "K14456"],
    "2.3.1.23": ["K13519", "K13519", "K13510", "K13512", "K13515", "K13512", "K13510", "K13519"],
    "3.4.22.58": ["K04395"],
    "2.4.1.215": ["K13495"],
    "2.2.1.10": ["K16306", "K16306", "K16306", "K16306", "K16306", "K16306", "K16306"],
    "2.2.1.11": ["K16305", "K16305", "K16305", "K16305", "K16305", "K16305", "K16305"],
    "5.2.1.12": ["K15744"],
    "2.4.1.217": ["K05947"],
    "3.1.7.10": ["K16086"],
    "6.1.1.13": ["K03367", "K14188", "K03367", "K14188"],
    "6.1.1.12": ["K01876"],
    "6.1.1.11": ["K01875"],
    "6.1.1.10": ["K01874", "K01874"],
    "6.1.1.17": ["K01885", "K14163", "K01885", "K14163"],
    "6.1.1.16": ["K01883", "K01884"],
    "6.1.1.15": ["K14163", "K14163", "K01881"],
    "2.4.2.38": ["K03714"],
    "2.4.2.36": ["K10928", "K10928"],
    "6.1.1.19": ["K01887"],
    "6.1.1.18": ["K01886"],
    "3.5.2.7": ["K01468"],
    "2.4.2.30": ["K10798"],
    "3.1.-.-": ["K11124", "K14570", "K13288", "K12573", "K12574", "K07462", "K10848", "K07462", "K10746", "K07462", "K10887", "K10848", "K10887"],
    "6.1.1.9": ["K01873"],
    "6.1.1.7": ["K01872"],
    "3.1.2.28": ["K12073"],
    "6.1.1.5": ["K01870"],
    "6.1.1.4": ["K01869"],
    "6.1.1.3": ["K01868"],
    "6.1.1.2": ["K01867"],
    "3.6.3.-": ["K15578", "K15555", "K15497", "K15578", "K11952", "K11953", "K15555", "K10111", "K10038", "K10041", "K10000", "K10004", "K10021", "K09972", "K10008", "K10010", "K16960", "K10025", "K17063", "K17076", "K16963", "K09817", "K16784", "K16786", "K16787", "K09814", "K09810", "K06861", "K16907", "K11085", "K14698", "K14699", "K05685", "K10004"],
    "3.6.3.6": ["K01535"],
    "3.4.21.112": ["K08653"],
    "3.6.3.8": ["K05850", "K05853", "K05850", "K05850", "K05853", "K05850", "K05853"],
    "2.7.11.15": ["K00910", "K00910", "K00910", "K00910", "K00910"],
    "3.4.-.-": ["K01423", "K05366", "K05365", "K12552", "K12553", "K01423", "K12946", "K12947", "K12948", "K13280", "K08303"],
    "3.4.21.75": ["K01349"],
    "6.4.1.8": ["K10701", "K10701"],
    "2.7.1.148": ["K00919"],
    "2.7.1.149": ["K00920", "K00920", "K00920"],
    "6.4.1.2": ["K01961", "K01962", "K01963", "K01964", "K15036", "K01962", "K01963", "K01961", "K11262", "K01962", "K01961", "K01963", "K11262", "K01962", "K01961", "K01963", "K11262", "K01964", "K15036", "K01962", "K01961", "K01963", "K01964", "K15036", "K01962", "K01961", "K01963", "K11262", "K01964", "K15036", "K01964", "K15036", "K01962", "K01961", "K01963", "K11262", "K11262"],
    "6.4.1.3": ["K01964", "K15036", "K01965", "K01966", "K15052", "K01965", "K01966", "K01964", "K15036", "K01965", "K01966", "K01964", "K15036", "K01965", "K01966", "K15052", "K01964", "K15036", "K01965", "K01966", "K01964", "K15036"],
    "2.7.1.144": ["K00917"],
    "6.4.1.1": ["K01958", "K01959", "K01960", "K01958", "K01959", "K01960", "K01958", "K01959", "K01960", "K01958", "K01959", "K01960", "K01958", "K01959", "K01960"],
    "2.7.1.140": ["K00915", "K00915"],
    "6.4.1.5": ["K13777", "K13778"],
    "4.2.3.58": ["K14185"],
    "4.2.3.59": ["K15796"],
    "2.6.1.78": ["K15849", "K15849", "K15849", "K15849", "K15849", "K15849"],
    "2.6.1.79": ["K15849", "K15849", "K15849", "K15849", "K15849", "K15849"],
    "1.14.14.-": ["K09831", "K14630", "K14257", "K14257"],
    "2.6.1.76": ["K00836", "K00836", "K00836"],
    "2.6.1.77": ["K03851"],
    "2.1.3.2": ["K11540", "K11541", "K00609", "K00608", "K00609", "K00608", "K11540", "K11541"],
    "1.1.1.251": ["K00094"],
    "1.1.1.250": ["K17738"],
    "1.13.11.27": ["K00457", "K00457", "K00457"],
    "1.13.11.25": ["K16049", "K16049"],
    "1.13.11.20": ["K00456", "K00456"],
    "1.2.1.59": ["K00150", "K00150", "K00150", "K00150"],
    "1.2.1.54": ["K12254"],
    "1.2.1.50": ["K03400"],
    "4.2.3.54": ["K15798"],
    "4.1.2.43": ["K08093", "K13812", "K13831", "K13831", "K08093", "K13812", "K13812", "K08093", "K13831", "K08093", "K13812", "K13831"],
    "4.1.2.40": ["K01635", "K08302"],
    "4.1.2.47": ["K13033"],
    "4.1.2.46": ["K14577"],
    "4.1.2.45": ["K14585", "K14585"],
    "2.6.1.95": ["K13553"],
    "1.6.1.2": ["K00323", "K00324", "K00325"],
    "4.2.1.116": ["K14469", "K15019", "K14469", "K15019"],
    "1.4.4.2": ["K00281", "K00282", "K00283", "K00281", "K00282", "K00283"],
    "1.1.1.329": ["K13548"],
    "3.1.1.7": ["K01049", "K01049"],
    "3.1.1.4": ["K14674", "K14674", "K01047", "K16342", "K16343", "K14621", "K14674", "K16817", "K01058", "K01047", "K16342", "K16343", "K14621", "K14674", "K16817", "K01058", "K01047", "K16342", "K16343", "K14621", "K14674", "K16817", "K01058", "K01047", "K16342", "K16343", "K14621", "K14674", "K16817", "K01058", "K01047", "K16342", "K16343", "K14621", "K14674", "K16817", "K01058", "K01047", "K16342", "K16343", "K16817", "K16342", "K16342", "K16342", "K16342", "K16342", "K01047", "K16342", "K16343", "K01047", "K01047", "K14621", "K16342", "K16342", "K16342"],
    "3.1.1.5": ["K14621", "K06128", "K06129", "K06130", "K13333", "K01048", "K14676", "K14621", "K14621", "K14621", "K14621", "K10804", "K06129", "K14621"],
    "3.1.1.2": ["K01045", "K01045"],
    "3.1.1.3": ["K12298", "K14674", "K01046", "K12298", "K16816", "K13534", "K14073", "K14074", "K14075", "K14076", "K14452", "K14675", "K14674", "K17900", "K14674", "K14674", "K14674", "K14674", "K14674", "K14073", "K14074", "K14075", "K12298", "K14452", "K14073", "K14074", "K14075", "K12298", "K14073"],
    "3.1.1.1": ["K01044", "K03927"],
    "3.2.1.18": ["K01186", "K12357", "K01186", "K12357", "K01186"],
    "3.2.1.10": ["K01182", "K01203", "K01203", "K01182", "K01203"],
    "3.1.1.-": ["K03476", "K13535", "K11188", "K02576", "K02577", "K02578", "K02579", "K11157", "K15889", "K11188", "K01066", "K01066", "K13618", "K14349", "K13806", "K13806"],
    "3.2.1.15": ["K01184", "K01184"],
    "3.2.1.14": ["K01183", "K13381"],
    "3.2.1.17": ["K13381", "K11331", "K13915"],
    "1.13.12.20": ["K17643"],
    "2.7.11.26": ["K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K08822", "K03083", "K03083", "K03083", "K03083", "K03083", "K08822", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083", "K08822", "K03083", "K03083", "K03083", "K03083", "K03083", "K03083"],
    "2.1.1.76": ["K05279"],
    "3.1.6.12": ["K01135", "K01135"],
    "2.7.1.166": ["K11211"],
    "2.7.1.167": ["K03272"],
    "1.3.98.1": ["K00226"],
    "2.7.1.161": ["K07732"],
    "4.1.1.86": ["K13745"],
    "4.1.1.85": ["K03081", "K03078"],
    "4.1.1.82": ["K09459"],
    "4.1.1.81": ["K04720"],
    "5.4.99.18": ["K01588"],
    "2.4.1.297": ["K12933"],
    "2.4.1.299": ["K17194"],
    "2.4.1.298": ["K12338"],
    "5.4.99.17": ["K06045"],
    "5.4.99.16": ["K05343"],
    "5.4.99.15": ["K06044"],
    "1.18.1.-": ["K12265"],
    "1.97.1.11": ["K07754"],
    "3.4.24.7": ["K01388", "K01388", "K01388", "K01388"],
    "2.1.1.20": ["K00552"],
    "2.1.1.28": ["K00553"],
    "1.18.1.3": ["K15765", "K15758", "K00529", "K14581", "K15765", "K00529", "K14581", "K00529", "K00529", "K00529", "K00529", "K00529", "K00529", "K15765", "K15758", "K15758", "K00529", "K14581", "K00529", "K00529", "K14581", "K14581"],
    "1.18.1.2": ["K02641"],
    "1.18.1.1": ["K05297"],
    "2.7.11.25": ["K04426", "K04416", "K11230", "K04415", "K04416", "K04419", "K04420", "K04421", "K04422", "K04423", "K04424", "K04425", "K04426", "K04427", "K04428", "K04466", "K11230", "K04427", "K04466", "K04427", "K04427", "K04426", "K04466", "K04415", "K04466", "K04427", "K04424", "K04420", "K04427", "K04415", "K04427", "K04427", "K04416", "K04427", "K04415", "K04466", "K04466", "K04416", "K04420", "K04421", "K04428", "K04421", "K04416", "K04426", "K04466", "K04427", "K13414", "K04426", "K04419", "K04426", "K04466", "K04416", "K04421", "K04466", "K04427", "K04416", "K04427", "K04466", "K04427", "K04427", "K04427"],
    "2.8.3.8": ["K01034", "K01035", "K01034", "K01035", "K01034", "K01035", "K01034", "K01035"],
    "3.1.3.33": ["K13917"],
    "2.8.3.1": ["K01026", "K01026", "K01026"],
    "2.8.3.5": ["K01027", "K01028", "K01029", "K01027", "K01028", "K01029", "K01027", "K01028", "K01029"],
    "2.8.3.6": ["K01031", "K01032"],
    "3.2.-.-": ["K16329", "K16330"],
    "2.8.3.-": ["K14471", "K14472", "K15569", "K15570", "K14471", "K14472", "K01041", "K15569", "K15570", "K01041"],
    "4.1.1.33": ["K01597"],
    "1.5.3.14": ["K13366", "K13366"],
    "1.5.3.16": ["K12259", "K13366", "K12259", "K13366"],
    "1.5.3.17": ["K17839", "K13367", "K17839", "K13367"],
    "2.8.2.35": ["K08105"],
    "1.5.3.13": ["K00308"],
    "2.4.99.6": ["K00781", "K00781", "K00781", "K00781"],
    "2.4.99.7": ["K03374"],
    "1.2.4.4": ["K00166", "K00167", "K11381"],
    "1.2.4.2": ["K00164", "K00164", "K00164", "K00164"],
    "2.4.99.3": ["K03479"],
    "1.2.4.1": ["K00163", "K00161", "K00162", "K00163", "K00161", "K00162", "K00163", "K00161", "K00162", "K00163", "K00161", "K00162", "K00161", "K00162"],
    "1.14.11.15": ["K04124"],
    "1.14.11.17": ["K03119", "K03119"],
    "2.7.1.89": ["K07251"],
    "1.14.11.11": ["K12692"],
    "1.5.1.21": ["K13609", "K13609"],
    "1.5.1.20": ["K00297", "K00297", "K00297"],
    "4.2.3.49": ["K15793", "K15793"],
    "4.2.3.48": ["K14175"],
    "4.2.3.44": ["K14042"],
    "4.2.3.47": ["K15793", "K15793", "K14174"],
    "4.2.1.-": ["K17450", "K17450", "K07546", "K07534", "K15572", "K14259", "K01726", "K17450", "K02509", "K17749", "K11336", "K13603", "K01726", "K05554", "K14249", "K15884", "K15885", "K14627", "K14249", "K01726", "K07534", "K07546", "K01726", "K01726", "K15572"],
    "4.2.3.40": ["K15795"],
    "4.2.3.43": ["K14047"],
    "6.3.2.-": ["K05827", "K05827", "K05827", "K04783", "K04787", "K04706", "K16063", "K16064", "K16065", "K04706", "K16063", "K16064", "K16065", "K16065", "K13452", "K16063", "K16063", "K04706"],
    "4.2.1.6": ["K01684"],
    "4.2.1.7": ["K01685", "K16849", "K16850"],
    "6.3.2.1": ["K13799", "K01918", "K13799", "K01918", "K13799"],
    "6.3.2.6": ["K13713", "K01587", "K01923"],
    "4.2.1.3": ["K01681", "K01682", "K01681", "K01682", "K01681", "K01682", "K01681", "K01682", "K01681", "K01682", "K01682", "K01681", "K01682"],
    "6.3.2.4": ["K01921", "K01921"],
    "4.2.1.1": ["K01672", "K01673", "K01674"],
    "6.3.2.8": ["K01924", "K01924"],
    "6.3.2.9": ["K01925", "K01925"],
    "4.2.1.8": ["K01686"],
    "4.2.1.9": ["K01687", "K01687", "K01687", "K01687"],
    "6.3.4.4": ["K01939", "K01939"],
    "2.6.1.52": ["K00831", "K00831", "K00831", "K00831", "K00831"],
    "1.14.13.15": ["K00488", "K00488"],
    "1.14.13.13": ["K07438", "K07438"],
    "1.14.13.12": ["K07824", "K07824", "K07824"],
    "6.3.4.2": ["K01937"],
    "6.3.4.3": ["K01938", "K01938", "K01938", "K13402", "K00288"],
    "6.3.4.9": ["K01942"],
    "4.1.1.77": ["K01617", "K01617", "K01617", "K01617"],
    "2.6.1.51": ["K00830", "K00830", "K00830", "K00830", "K00830", "K00830"],
    "3.4.22.35": ["K08570"],
    "3.4.22.34": ["K01369", "K01369"],
    "2.7.11.21": ["K06631", "K08861", "K08862", "K08863", "K06631", "K06660", "K06660", "K06631", "K06631", "K08862"],
    "2.4.1.46": ["K03715"],
    "2.4.1.45": ["K04628"],
    "2.4.1.44": ["K03278"],
    "2.4.1.43": ["K13648", "K13648"],
    "2.4.1.41": ["K00710"],
    "2.4.1.40": ["K00709"],
    "3.2.1.118": ["K13032"],
    "1.11.2.2": ["K10789", "K10789"],
    "1.12.1.2": ["K00436"],
    "3.2.1.113": ["K01230", "K01230", "K01230"],
    "3.2.1.114": ["K01231", "K01231"],
    "3.2.1.117": ["K13031"],
    "1.12.7.2": ["K00532", "K00533", "K00534", "K06441"],
    "3.5.1.41": ["K01452"],
    "3.5.1.47": ["K05823", "K05823"],
    "3.5.1.44": ["K03411"],
    "2.7.10.2": ["K07360", "K06619", "K08887", "K05704", "K05704", "K05725", "K06619", "K08887", "K05725", "K05704", "K11217", "K04447", "K11218", "K11219", "K05856", "K07360", "K05855", "K05854", "K07370", "K05871", "K05855", "K11217", "K04447", "K11218", "K05725", "K05704", "K05725", "K05704", "K06619", "K05704", "K05725", "K05703", "K05704", "K05703", "K05705", "K05704", "K05705", "K05704", "K05871", "K05856", "K07360", "K05855", "K05703", "K05856", "K05703", "K07360", "K07363", "K07364", "K05854", "K05855", "K07370", "K05855", "K05854", "K07370", "K05703", "K08893", "K05854", "K05855", "K05725", "K05871", "K07363", "K08016", "K04447", "K11218", "K05854", "K08893", "K08891", "K05704", "K07363", "K05725", "K05871", "K04447", "K05704", "K05871", "K05704", "K04447", "K05704", "K05704", "K05704", "K04447", "K05703", "K05854", "K06619", "K08888", "K05703", "K05725", "K06619", "K07527", "K05856", "K05703", "K07370", "K07364", "K05855", "K11217", "K11219", "K05725", "K06619", "K11217", "K05725", "K06619", "K05704", "K05725", "K05704", "K11217", "K11218", "K05854", "K05855", "K11217", "K06619", "K05725", "K05856", "K07360", "K07370", "K05703", "K05703", "K06619", "K08887", "K05704", "K05854", "K05728", "K05703", "K06619", "K05704", "K06619", "K11217", "K04447", "K05704", "K05855", "K05704", "K05725", "K11217", "K11218", "K05856", "K05703", "K11217", "K11218", "K11219", "K04447", "K11217", "K11219", "K04447", "K05871", "K05704", "K11217", "K11217", "K11219", "K11217", "K11219", "K04447", "K08891", "K11218", "K05854", "K05855", "K11217", "K11219", "K05725", "K11217", "K04447", "K11219", "K11217", "K04447"],
    "3.5.1.49": ["K01455", "K01455", "K01455"],
    "2.7.10.1": ["K04361", "K04362", "K05093", "K05094", "K05095", "K04527", "K05087", "K04363", "K05089", "K05090", "K05091", "K05096", "K05097", "K05098", "K05099", "K05121", "K05103", "K04361", "K04362", "K05093", "K05094", "K05095", "K04527", "K05087", "K04363", "K05089", "K05090", "K05091", "K05096", "K05097", "K05098", "K05099", "K05121", "K05103", "K03176", "K04360", "K04361", "K04362", "K05093", "K05094", "K05095", "K04363", "K05089", "K12378", "K04361", "K05088", "K04361", "K05083", "K05084", "K05085", "K05098", "K04527", "K04361", "K05087", "K05083", "K05096", "K05121", "K05087", "K04527", "K04361", "K04361", "K05083", "K05084", "K05085", "K04363", "K05089", "K04361", "K04362", "K05093", "K05094", "K05095", "K04527", "K05087", "K04363", "K05089", "K05090", "K05091", "K05096", "K05097", "K05098", "K05099", "K05121", "K05103", "K13416", "K13415", "K04363", "K05089", "K05096", "K05098", "K05097", "K05099", "K04361", "K05090", "K05091", "K05092", "K04361", "K05096", "K05098", "K04363", "K05093", "K05094", "K05095", "K05087", "K05099", "K03176", "K05084", "K05085", "K05091", "K05126", "K05090", "K05086", "K04361", "K04362", "K05093", "K05094", "K05095", "K04363", "K05089", "K05087", "K03176", "K04363", "K05089", "K05087", "K05098", "K04361", "K05096", "K05097", "K05099", "K05083", "K05087", "K04527", "K05099", "K04361", "K05083", "K04362", "K04363", "K05089", "K04361", "K05092", "K05091", "K05090", "K04527", "K04361", "K04527", "K05087", "K04361", "K05087", "K05091", "K04527", "K05087", "K03176", "K04360", "K05101", "K04361", "K05102", "K05103", "K05104", "K05105", "K05106", "K05107", "K05108", "K05109", "K05110", "K05111", "K05112", "K05113", "K05114", "K05099", "K05090", "K13416", "K13417", "K04361", "K05083", "K04363", "K05089", "K05087", "K05091", "K05092", "K05099", "K04362", "K05093", "K05094", "K05126", "K03176", "K05090", "K05090", "K05092", "K05087", "K03176", "K05096", "K05099", "K05099", "K04361", "K05083", "K05084", "K05094", "K04363", "K05089", "K05083", "K05087", "K04361", "K05084", "K05085", "K05098", "K05099", "K04362", "K04361", "K05083", "K04361", "K04363", "K05089", "K05087", "K05126", "K03176", "K05091", "K05092", "K04362", "K05099", "K05087", "K04363", "K05089", "K04361", "K05099", "K05094", "K05083", "K04361", "K05086", "K04363", "K05089", "K04362", "K05093", "K04361", "K05083", "K05087", "K04361", "K05083", "K04361", "K05083", "K05119", "K05096", "K05121", "K04360", "K04527", "K04527", "K05099", "K04361", "K05099", "K04363", "K05089", "K04361", "K05099"],
    "2.4.-.-": ["K02841", "K02843", "K02849", "K03277"],
    "4.2.3.33": ["K14044"],
    "2.3.1.214": ["K12935"],
    "2.4.1.111": ["K12356"],
    "2.4.1.117": ["K00729"],
    "2.3.1.211": ["K17212"],
    "2.7.12.1": ["K08866", "K08866"],
    "2.7.12.2": ["K04431", "K04368", "K04369", "K04368", "K04369", "K04432", "K04433", "K04368", "K04369", "K04430", "K04431", "K04432", "K04433", "K04463", "K04368", "K11226", "K08294", "K11227", "K04430", "K04431", "K04368", "K04369", "K04368", "K04369", "K04430", "K04431", "K04432", "K04433", "K04368", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K14511", "K04368", "K04369", "K04368", "K04368", "K04368", "K04369", "K04463", "K04368", "K04369", "K04432", "K04433", "K04430", "K04431", "K04368", "K04369", "K04368", "K04369", "K04431", "K04368", "K04369", "K04430", "K04431", "K04432", "K04433", "K04368", "K04369", "K04368", "K04368", "K04368", "K04369", "K04432", "K04433", "K04430", "K04431", "K04368", "K04369", "K04368", "K04369", "K04368", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04368", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04463", "K04431", "K04368", "K04368", "K04433", "K04431", "K04368", "K13413", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04368", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04368", "K04369", "K04432", "K04433", "K04368", "K04369", "K04368", "K04430", "K04430", "K04432", "K04433", "K04430", "K04431", "K04368", "K04369", "K04430", "K04368", "K04369", "K04432", "K04433", "K04430", "K04431", "K04432", "K04433", "K04430"],
    "2.3.1.218": ["K13233"],
    "2.3.1.219": ["K17211"],
    "6.3.2.26": ["K12743"],
    "6.3.2.38": ["K03894"],
    "6.3.2.39": ["K03895"],
    "2.3.1.39": ["K00645", "K13935", "K00645", "K13935"],
    "2.3.1.37": ["K00643", "K00643"],
    "6.3.2.33": ["K15740"],
    "4.2.1.70": ["K01718"],
    "6.3.2.31": ["K12234"],
    "4.2.1.76": ["K12450"],
    "2.7.11.30": ["K04674", "K04388", "K04671", "K04672", "K04388", "K04670", "K13596", "K04673", "K13578", "K04675", "K04674", "K13567", "K04674", "K04388", "K04673", "K13578", "K04671", "K04674", "K04388", "K04388", "K04674", "K04670", "K13596", "K04675", "K13567", "K04672", "K04671", "K04673", "K13578", "K04674", "K04388", "K04674", "K04388", "K04674", "K04388", "K04674", "K04388", "K04388", "K04671", "K04674", "K04388", "K04674", "K04388", "K04674", "K04388", "K04674", "K04388", "K04674", "K04388", "K04674"],
    "2.3.1.31": ["K00641"],
    "2.3.1.30": ["K00640", "K00640", "K00640", "K00640"],
    "3.1.3.74": ["K07758", "K13248"],
    "3.1.3.75": ["K06124"],
    "3.1.3.77": ["K16054", "K09880"],
    "3.1.3.70": ["K07026"],
    "3.1.3.71": ["K05979"],
    "3.1.3.73": ["K02226"],
    "3.1.3.78": ["K13085", "K13085", "K13085"],
    "6.1.1.26": ["K11627"],
    "6.1.1.27": ["K07587"],
    "6.1.1.24": ["K09698"],
    "6.1.1.22": ["K01893"],
    "6.1.1.23": ["K09759"],
    "6.1.1.20": ["K01889", "K01890"],
    "6.1.1.21": ["K01892"],
    "1.1.3.6": ["K03333"],
    "3.4.21.53": ["K01338"],
    "3.4.21.109": ["K08670"],
    "1.11.1.15": ["K11188", "K11185", "K11186", "K11188", "K14171", "K11187", "K13279"],
    "3.6.5.-": ["K14536", "K07953", "K07953", "K14139"],
    "3.4.21.104": ["K03993", "K03993"],
    "1.3.1.19": ["K16269", "K16269", "K16269", "K16269", "K16269", "K16269"],
    "1.3.1.10": ["K00208", "K00208", "K00208"],
    "1.3.1.12": ["K14187", "K00210", "K04517", "K00220", "K14187", "K00210", "K04517", "K00220", "K00210", "K04517", "K14187", "K00220"],
    "1.3.1.13": ["K00211"],
    "1.3.1.14": ["K17828"],
    "2.7.1.173": ["K10524"],
    "2.7.1.177": ["K16651"],
    "2.7.1.175": ["K16146"],
    "2.7.1.174": ["K16368"],
    "3.1.1.34": ["K01059", "K01059", "K01059"],
    "3.1.1.32": ["K16817", "K01058", "K16818", "K16817", "K01058", "K16817", "K01058", "K16817", "K01058", "K16817", "K01058", "K16818", "K16817"],
    "3.1.1.31": ["K13937", "K01057", "K07404", "K01057", "K07404", "K13937"],
    "4.3.2.1": ["K14681", "K14681", "K01755", "K01755", "K14681", "K01755", "K14681"],
    "4.3.2.2": ["K01756", "K01756"],
    "4.3.2.3": ["K16856"],
    "4.3.2.6": ["K13564"],
    "3.6.3.21": ["K10017"],
    "1.10.3.12": ["K02829", "K02828", "K02827", "K02826"],
    "2.4.1.102": ["K00727"],
    "2.6.1.66": ["K14260", "K14260", "K14260", "K00835", "K14260"],
    "2.6.1.64": ["K00816", "K00816", "K00816"],
    "3.5.3.23": ["K01484"],
    "2.6.1.62": ["K00833"],
    "1.1.1.248": ["K13392"],
    "2.1.1.289": ["K03399"],
    "1.1.1.244": ["K00093"],
    "1.16.3.1": ["K02217", "K13624", "K00522", "K00522"],
    "2.2.1.7": ["K01662", "K01662"],
    "1.1.1.243": ["K14730", "K14732"],
    "1.2.1.60": ["K00151", "K00151"],
    "1.2.1.65": ["K00152", "K00152"],
    "1.2.1.68": ["K12355"],
    "3.6.3.49": ["K05031", "K05031", "K05031", "K05031", "K05031"],
    "3.6.3.24": ["K15587", "K10824"],
    "1.1.1.330": ["K10251", "K10251", "K10251", "K10251"],
    "1.1.1.335": ["K13016", "K13020"],
    "1.1.1.336": ["K02472"],
    "1.1.1.337": ["K05884"],
    "1.1.1.338": ["K16844"],
    "1.17.99.1": ["K05797"],
    "1.17.99.2": ["K10700", "K10700"],
    "1.17.99.3": ["K10214", "K10214", "K10214"],
    "5.3.3.-": ["K05921", "K05921", "K12663"],
    "5.3.3.8": ["K01825", "K07514", "K01825", "K07514", "K01825", "K07514", "K01825", "K07514", "K01825", "K01825", "K07514", "K13238", "K13239", "K01825", "K01825", "K07514", "K01825", "K07514", "K01825", "K07514", "K01825", "K07514", "K01825", "K01825", "K07514", "K07514", "K01825", "K07514", "K07514", "K13239", "K07514"],
    "3.6.3.34": ["K02013"],
    "3.2.1.65": ["K01212"],
    "5.3.3.2": ["K01823"],
    "5.3.3.3": ["K14534", "K14534", "K14534"],
    "5.3.3.4": ["K03464", "K03464"],
    "5.3.3.5": ["K01824"],
    "3.2.1.62": ["K01229", "K01229"],
    "3.1.26.-": ["K08852", "K11592", "K08852", "K08852"],
    "2.7.4.23": ["K05774"],
    "2.7.4.22": ["K09903"],
    "2.7.4.26": ["K06981"],
    "1.14.13.93": ["K09843"],
    "3.6.3.30": ["K02010"],
    "3.6.3.33": ["K06074"],
    "3.6.3.32": ["K02000"],
    "3.5.3.8": ["K01479"],
    "3.5.3.9": ["K02083"],
    "4.1.1.95": ["K13560"],
    "2.6.1.9": ["K00817", "K00817", "K00817", "K00817", "K00817", "K00817", "K00817"],
    "2.6.1.4": ["K14272", "K14272", "K14272", "K14272", "K14272", "K14272", "K14272"],
    "3.5.3.1": ["K01476", "K01476", "K01476"],
    "3.4.17.20": ["K01300", "K01300", "K01300"],
    "3.5.3.3": ["K08688", "K08688"],
    "3.5.3.4": ["K01477"],
    "2.6.1.1": ["K14454", "K14455", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K15849", "K14454", "K14455", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K15849", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K15849", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K15849", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K15849", "K14454", "K14455", "K00811", "K00812", "K00813", "K11358", "K15849", "K00812", "K00813", "K11358", "K14455"],
    "2.6.1.2": ["K00814", "K14272", "K00814", "K14260", "K14272", "K00814", "K14260", "K14272", "K14272", "K00814", "K14272", "K00814", "K14260", "K14272", "K14272", "K14260"],
    "3.5.3.7": ["K12255"],
    "2.6.1.-": ["K14272", "K14272", "K05825", "K05830", "K14272", "K05825", "K05830", "K00841", "K14272", "K14272", "K14272", "K14272", "K15785", "K08969", "K00841", "K05825", "K05830", "K12256", "K05830", "K16016"],
    "1.1.1.247": ["K13394"],
    "3.5.3.-": ["K14977"],
    "2.4.1.284": ["K13550"],
    "2.4.1.285": ["K13556"],
    "1.2.1.88": ["K00294", "K13821", "K13821", "K00294"],
    "1.2.1.82": ["K17819"],
    "3.4.21.79": ["K01353", "K01353", "K01353", "K01353", "K01353", "K01353"],
    "1.2.1.85": ["K10217", "K10217", "K10217", "K10217"],
    "1.2.1.86": ["K17832"],
    "2.1.1.37": ["K00558", "K17398", "K17399", "K17398", "K17399", "K00558"],
    "2.1.1.38": ["K12635"],
    "5.3.99.2": ["K01830"],
    "2.6.1.33": ["K13308"],
    "2.7.1.29": ["K00863", "K00863", "K00863", "K00863"],
    "3.1.26.3": ["K03685", "K03685"],
    "4.1.2.4": ["K01619"],
    "4.1.2.5": ["K01620", "K01620"],
    "2.7.1.20": ["K00856"],
    "2.7.1.21": ["K00857", "K00857"],
    "2.7.1.22": ["K10524"],
    "4.1.2.9": ["K01621", "K01621"],
    "2.7.1.24": ["K02318", "K00859"],
    "2.7.1.25": ["K13811", "K00955", "K00860", "K13811", "K00955", "K00860", "K13811", "K00955"],
    "2.7.1.26": ["K00861", "K11753"],
    "3.1.26.5": ["K01164", "K14522", "K14523", "K03538", "K03537", "K14524", "K14525", "K14526", "K14527", "K14528", "K14529", "K03539", "K03540", "K14530", "K01164", "K14522", "K14523", "K03538", "K03537", "K14524", "K14525", "K14526", "K14527", "K14528", "K03539", "K14530"],
    "1.14.11.20": ["K12697"],
    "1.14.11.21": ["K12675"],
    "1.5.1.10": ["K00293", "K00293", "K00293"],
    "1.14.11.23": ["K05278"],
    "1.14.11.26": ["K12745", "K12746"],
    "1.5.1.15": ["K13403", "K00295"],
    "1.5.1.19": ["K00296"],
    "4.1.2.-": ["K11395", "K11946", "K11395", "K10528", "K11946"],
    "2.1.1.197": ["K02169"],
    "2.1.1.196": ["K02191"],
    "2.1.1.195": ["K02188"],
    "2.1.1.241": ["K13230"],
    "2.3.1.191": ["K02536"],
    "2.3.1.192": ["K15517"],
    "3.4.21.78": ["K01352"],
    "2.3.1.199": ["K10203", "K10245", "K10246", "K10244", "K10205", "K10247", "K10205", "K10248", "K10249", "K10244", "K10203", "K10250", "K15397", "K10245", "K10246", "K10203", "K10245", "K10246", "K10244", "K10205"],
    "3.4.22.27": ["K01368", "K01368", "K01368", "K01368"],
    "3.1.8.1": ["K01045", "K01045"],
    "2.4.1.79": ["K00719"],
    "4.2.3.37": ["K10156"],
    "3.2.1.108": ["K01229", "K01229"],
    "3.1.4.4": ["K01115", "K16860", "K17717", "K01115", "K16860", "K17717", "K01115", "K01115", "K01115", "K01115", "K01115"],
    "3.1.2.-": ["K10781", "K07536", "K10781", "K10782", "K10804", "K10805", "K10806", "K01076", "K02614", "K01076", "K07536", "K13719"],
    "3.1.4.1": ["K01513", "K01513", "K01513", "K01513", "K01513"],
    "3.2.1.105": ["K12693"],
    "3.1.2.1": ["K01067"],
    "3.1.4.-": ["K08743", "K00974"],
    "3.1.2.2": ["K01068", "K17360", "K00659", "K01068", "K17360", "K00659", "K00659", "K00659", "K00659"],
    "3.1.2.4": ["K05605", "K05605", "K05605", "K05605"],
    "3.1.2.6": ["K01069"],
    "2.4.1.90": ["K07966", "K07967", "K07966", "K07967", "K07968", "K07966", "K07967", "K07968", "K07966", "K07967", "K07968", "K07966", "K07967", "K07968", "K07969", "K07966", "K07967", "K07968", "K07969"],
    "2.3.1.222": ["K13923"],
    "2.4.1.92": ["K00725"],
    "2.3.1.227": ["K17939"],
    "3.5.1.78": ["K01460"],
    "2.4.1.122": ["K00731"],
    "5.1.3.-": ["K17195", "K10046", "K12451", "K10046", "K12451"],
    "6.1.1.14": ["K01880", "K01878", "K01879", "K14164"],
    "2.4.1.134": ["K00734", "K00734"],
    "5.1.3.8": ["K01787"],
    "5.1.3.9": ["K13967", "K01788"],
    "4.2.1.69": ["K06035"],
    "1.1.99.31": ["K15054"],
    "5.1.3.2": ["K15917", "K01784", "K15917", "K17716", "K01784", "K15917", "K17716"],
    "5.1.3.3": ["K01785", "K15917", "K15917", "K15917"],
    "2.7.11.24": ["K04440", "K04371", "K04440", "K04371", "K04441", "K04371", "K04440", "K04441", "K04464", "K04468", "K04371", "K04464", "K04441", "K04440", "K04371", "K04468", "K04440", "K04371", "K04440", "K04371", "K04441", "K04440", "K04441", "K04371", "K04371", "K04468", "K04440", "K04371", "K04441", "K04371", "K04371", "K14512", "K04371", "K04371", "K04440", "K04371", "K04371", "K04468", "K04371", "K04464", "K04371", "K04441", "K04440", "K04371", "K04440", "K04441", "K04440", "K04441", "K04371", "K04441", "K04371", "K04371", "K04440", "K04441", "K04371", "K04371", "K04441", "K04371", "K04371", "K04440", "K04440", "K04441", "K04464", "K04440", "K04371", "K04371", "K04440", "K04441", "K04371", "K04371", "K04440", "K04441", "K04371", "K04371", "K04371", "K04441", "K04371", "K04371", "K04371", "K04371", "K04441", "K04440", "K04371", "K04371", "K04371", "K04371", "K04440", "K04441", "K04371", "K04464", "K04441", "K04440", "K04371", "K04371", "K04371", "K04441", "K04440", "K04371", "K04371", "K04440", "K04464", "K04371", "K04441", "K04371", "K04371", "K04440", "K04371", "K04440", "K04371", "K04371", "K04371", "K04371", "K04371", "K04371", "K04371", "K04371", "K04371", "K04371", "K04371", "K04441", "K04371", "K04371", "K04371", "K04440", "K04440", "K04441", "K04440", "K04441", "K04371", "K04440", "K04440", "K04371", "K04441", "K04441", "K04440", "K04371", "K04441", "K04371", "K04440", "K04441", "K04440", "K04371", "K04440", "K04371", "K04441", "K04440", "K04371", "K04440", "K04441", "K04440", "K04371", "K04440", "K04441", "K04371", "K04441", "K04440", "K04371", "K04441"],
    "5.1.3.1": ["K01783", "K01783", "K01783", "K01783", "K01783"],
    "5.1.3.6": ["K08679", "K08679"],
    "5.1.3.7": ["K02473"],
    "5.1.3.4": ["K01786", "K03080", "K03077"],
    "5.1.3.5": ["K12448"],
    "3.1.3.67": ["K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110", "K01110"],
    "3.1.3.66": ["K01109", "K01109"],
    "3.1.3.64": ["K01108", "K01108"],
    "3.1.3.62": ["K03103"],
    "5.5.1.13": ["K04120"],
    "3.4.14.5": ["K01278"],
    "2.4.1.135": ["K00735", "K10157", "K10158", "K10158"],
    "3.4.14.1": ["K01275"],
    "3.1.6.-": ["K12381"],
    "2.4.2.14": ["K00764", "K00764"],
    "2.4.2.17": ["K00765", "K00765"],
    "2.4.2.10": ["K13421", "K00762", "K13421"],
    "2.4.2.12": ["K03462"],
    "3.4.18.1": ["K08568"],
    "1.14.-.-": ["K12156", "K11818", "K15398", "K15399", "K15401", "K13407", "K15402", "K04712", "K11818", "K11785", "K17961", "K15747", "K09588", "K09590", "K12640", "K09589", "K15639", "K14985", "K00517", "K14366", "K14372", "K14366", "K14372", "K14252", "K14253", "K14252", "K14253", "K09755", "K00517", "K12156", "K11818", "K00517", "K00517", "K00517"],
    "2.10.1.1": ["K15376"],
    "2.4.2.19": ["K00767"],
    "2.4.2.18": ["K00766", "K13497", "K00766", "K13497"],
    "2.7.11.22": ["K02202", "K02202", "K02206", "K02206", "K02089", "K02091", "K02089", "K02091", "K02206", "K02087", "K02202", "K04563", "K06655", "K06667", "K04563", "K02087", "K02206", "K02089", "K02091", "K02206", "K02087", "K02089", "K02087", "K02089", "K02206", "K02087", "K02090", "K02089", "K02091", "K02206", "K02211", "K08821", "K02091", "K02206", "K02087", "K02091", "K02089", "K02089", "K02091", "K02089", "K02091", "K02089", "K02091", "K02089", "K02091", "K02089", "K02206", "K02089", "K02091", "K02206", "K02089", "K02091", "K02090", "K02090", "K02089", "K02089", "K02091", "K02206", "K02089", "K02091", "K02206", "K02087", "K02206", "K02087", "K02206"],
    "3.1.6.8": ["K01134", "K01134"],
    "3.1.6.4": ["K01132", "K01132"],
    "3.1.6.1": ["K01130", "K01130"],
    "3.1.6.2": ["K01131"],
    "1.14.14.5": ["K04091"],
    "3.1.2.26": ["K15871"],
    "3.1.2.27": ["K11992", "K11992"],
    "2.1.3.-": ["K16035", "K16035"],
    "1.14.14.1": ["K00493", "K14338", "K07408", "K07409", "K07412", "K07413", "K07414", "K17690", "K17691", "K07424", "K07410", "K07418", "K17728", "K07412", "K07413", "K17718", "K07409", "K17718", "K07413", "K07418", "K07424", "K00493", "K07408", "K07409", "K07410", "K14338", "K07408", "K07409", "K07411", "K07412", "K17718", "K17720", "K07413", "K07420", "K17690", "K17691", "K07424", "K07409", "K00493", "K14338", "K07408", "K07410", "K07409", "K07416", "K07420", "K17685", "K17712", "K17690", "K17712", "K17690", "K07409", "K17718", "K07418", "K07410", "K07408", "K17718", "K17720", "K07413", "K17712", "K07414", "K07418", "K07428", "K07410", "K07408", "K17690", "K17691", "K17692", "K07424", "K07409", "K07410", "K17718", "K17720", "K07413", "K17685", "K07412"],
    "3.1.2.22": ["K01074", "K01074", "K01074"],
    "3.1.2.23": ["K01075", "K01075"],
    "1.14.14.8": ["K16901", "K16901", "K16901"],
    "1.14.14.9": ["K00483", "K16901", "K00483", "K16901", "K16901"],
    "1.14.12.-": ["K05549", "K05550", "K10619", "K16303", "K14748", "K14749", "K15248", "K15249", "K14599", "K14600", "K05549", "K05550", "K03384", "K05549", "K05550", "K03384", "K03384", "K15248", "K15249", "K03384", "K05549", "K05550", "K10619", "K16303", "K14748", "K14749", "K14599", "K14600", "K03384", "K14599", "K14600", "K03384"],
    "2.1.3.9": ["K09065"],
    "1.14.12.3": ["K03268", "K16268", "K03268", "K16268", "K03268", "K16268", "K03268", "K16268", "K03268", "K16268"],
    "1.14.12.1": ["K05599", "K05600", "K16319", "K16320"],
    "1.14.15.6": ["K00498", "K00498"],
    "1.14.12.7": ["K07519", "K07519"],
    "2.1.3.1": ["K03416", "K17489", "K17490"],
    "5.1.99.1": ["K05606", "K05606", "K05606", "K05606", "K05606"],
    "2.1.3.3": ["K00611", "K00611"],
    "5.1.99.3": ["K16841"],
    "5.1.99.4": ["K01796", "K01796"],
    "2.1.3.7": ["K04128"],
    "2.1.1.102": ["K15995"],
    "2.1.1.8": ["K00546"],
    "2.1.1.2": ["K00542", "K00542"],
    "2.1.1.1": ["K00541"],
    "2.1.1.6": ["K00545", "K00545", "K00545", "K00545"],
    "2.1.1.5": ["K00544", "K00544"],
    "2.1.1.4": ["K00543"],
    "2.7.1.164": ["K10837", "K10837"],
    "2.7.1.165": ["K11529", "K11529", "K11529", "K11529"],
    "3.1.1.23": ["K01054", "K13700", "K01054"],
    "3.1.1.22": ["K07518"],
    "3.1.1.24": ["K01055", "K14727", "K01055", "K14727"],
    "2.1.1.-": ["K17462", "K17462", "K00599", "K00599", "K13601", "K13602", "K13604", "K10718", "K14374", "K16038", "K15467", "K14374", "K15467", "K16038", "K14251", "K14255", "K15942", "K15954", "K15959", "K15963", "K15971", "K14251", "K14255", "K13067", "K13390", "K15064", "K00599", "K14292", "K14563", "K02464", "K11434"],
    "2.7.1.168": ["K07031"],
    "2.7.1.169": ["K06982"],
    "6.2.1.9": ["K08692", "K14067", "K08692", "K14067", "K08692", "K14067"],
    "3.5.3.12": ["K10536"],
    "3.5.3.13": ["K05603"],
    "2.6.1.50": ["K05957"],
    "3.5.3.11": ["K01480"],
    "2.6.1.57": ["K00838", "K00838", "K00832", "K00832", "K00838", "K00838", "K00832", "K00838", "K00832", "K00838", "K00838", "K00832", "K00838", "K00838", "K00832", "K00838", "K00832", "K00838", "K00832", "K00838"],
    "2.6.1.55": ["K15372", "K15372"],
    "2.6.1.58": ["K05821", "K05821", "K05821", "K05821"],
    "3.5.3.19": ["K01483"],
    "4.5.1.-": ["K15236"],
    "4.5.1.3": ["K17070"],
    "6.1.1.6": ["K04567", "K04566", "K04568"],
    "1.2.1.75": ["K14468", "K15017", "K14468", "K14468", "K15017"],
    "4.2.3.42": ["K12928"],
    "1.2.1.76": ["K15017", "K15038", "K15038", "K15017"],
    "1.2.1.71": ["K06447"],
    "1.2.1.70": ["K02492"],
    "1.2.1.72": ["K03472"],
    "1.2.1.79": ["K00135", "K00135", "K00135", "K00135"],
    "1.8.4.14": ["K08968"],
    "6.1.1.1": ["K01866"],
    "1.21.4.1": ["K10793", "K10794", "K10795", "K10796"],
    "1.14.14.12": ["K16047"],
    "1.1.1.341": ["K12455"],
    "1.13.-.-": ["K05915", "K05915"],
    "1.1.1.342": ["K12453"],
    "1.14.14.13": ["K13561"],
    "1.1.1.349": ["K17644"],
    "1.1.1.348": ["K13265"],
    "3.6.3.17": ["K10441", "K10539", "K10542", "K10545", "K10551", "K10562"],
    "2.5.1.19": ["K13830", "K00800", "K13830", "K00800"],
    "2.5.1.18": ["K00799", "K13299", "K04097", "K00799", "K13299", "K00799", "K13299", "K13299", "K00799", "K13299"],
    "2.3.1.47": ["K00652"],
    "2.5.1.10": ["K00787", "K00795", "K00804", "K13789", "K13787", "K00787", "K00787"],
    "2.5.1.17": ["K00798", "K04032"],
    "2.5.1.16": ["K00797", "K00797", "K00797", "K00797"],
    "2.5.1.15": ["K13939", "K00796", "K13941"],
    "3.4.22.1": ["K01363", "K01363"],
    "3.6.3.14": ["K02114", "K02112", "K02115", "K02111", "K02113", "K02109", "K02110", "K02108", "K02135", "K02134", "K02133", "K02136", "K02132", "K02137", "K02125", "K02128", "K02126", "K02127", "K02129", "K02131", "K02130", "K02138", "K02139", "K02141", "K02142", "K02143", "K02140", "K02119", "K02122", "K02117", "K02118", "K02121", "K02124", "K02123", "K02120", "K02146", "K02151", "K02148", "K02145", "K02147", "K02150", "K02155", "K03661", "K02154", "K02149", "K02153", "K02152", "K02144", "K03662", "K02114", "K02112", "K02115", "K02111", "K02113", "K02109", "K02110", "K02108", "K03224", "K12646", "K02145", "K02147", "K02148", "K02149", "K02150", "K02151", "K02152", "K02153", "K02154", "K02146", "K02144", "K02155", "K03661", "K03662", "K02154", "K02146", "K02144", "K03662", "K02155", "K03661", "K02412", "K12646", "K12649", "K12646", "K02145", "K02147", "K02152", "K02148", "K02149", "K02150", "K02151", "K02153", "K02154", "K02155", "K02146", "K02145", "K02147", "K02148", "K02149", "K02150", "K02151", "K02152", "K02153", "K02154", "K02146", "K02144", "K02155", "K03661", "K02146", "K02145", "K02147", "K02148", "K02149", "K02150", "K02151", "K02152", "K02153", "K02154", "K02146", "K02144", "K03662", "K02155", "K03661", "K02132", "K02133", "K02136", "K02134", "K02135", "K02126", "K02127", "K02128", "K02138", "K02137", "K02131", "K02125", "K02132", "K02133", "K02136", "K02134", "K02135", "K02126", "K02127", "K02128", "K02138", "K02137", "K02131", "K02125", "K02132", "K02133", "K02136", "K02134", "K02135", "K02126", "K02127", "K02128", "K02138", "K02137", "K02131", "K02125", "K02145", "K02147", "K02148", "K02149", "K02150", "K02151", "K02152", "K02153", "K02154", "K02146", "K02144", "K03662", "K02155", "K03661", "K02145", "K02147", "K02148", "K02149", "K02150", "K02151", "K02152", "K02153", "K02154", "K02146", "K02144", "K03662", "K02155", "K03661", "K02154", "K02146", "K02144", "K03662", "K02155", "K03661", "K12646", "K12646", "K03662", "K12646", "K12646", "K12646", "K12646"],
    "3.2.1.78": ["K01218"],
    "3.4.24.-": ["K11749", "K07996"],
    "2.3.1.42": ["K13507", "K13507", "K00649", "K00649"],
    "3.6.3.9": ["K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539", "K01539"],
    "4.2.1.24": ["K01698"],
    "2.7.4.16": ["K00946"],
    "2.7.4.14": ["K00945", "K13799", "K13800", "K13809", "K13799", "K13799"],
    "2.7.4.10": ["K00944"],
    "3.6.3.10": ["K01541", "K01542", "K01543", "K01544", "K01542", "K01543", "K01542", "K01543"],
    "4.7.1.1": ["K06163"],
    "1.1.1.38": ["K00027", "K00027", "K00027"],
    "1.1.1.39": ["K00028", "K00028", "K00028"],
    "1.5.1.9": ["K00292", "K14157"],
    "1.1.1.30": ["K00019", "K00019"],
    "1.1.1.31": ["K00020"],
    "3.4.17.15": ["K01298", "K01298"],
    "1.1.1.34": ["K00021", "K00021"],
    "1.1.1.35": ["K15016", "K01782", "K01825", "K07516", "K07514", "K01825", "K01782", "K07516", "K00022", "K07514", "K10527", "K07547", "K07548", "K01825", "K01782", "K07514", "K00022", "K01825", "K01782", "K07514", "K15016", "K01782", "K01825", "K07516", "K00022", "K01825", "K01782", "K00022", "K10527", "K07514", "K07516", "K12405", "K10527", "K01825", "K01782", "K01825", "K01782", "K07514", "K00022", "K08683", "K01825", "K01782", "K07514", "K00022", "K01825", "K01782", "K07514", "K00022", "K01825", "K01782", "K07514", "K01825", "K01782", "K00022", "K01825", "K01782", "K07514", "K07514", "K07547", "K07548", "K01825", "K01782", "K07514", "K00022", "K12405", "K07514", "K07514", "K08683"],
    "1.1.1.36": ["K00023", "K00023"],
    "1.1.1.37": ["K00026", "K00025", "K00024", "K00025", "K00026", "K00024", "K00025", "K00026", "K00024", "K00025", "K00026", "K00024", "K00025", "K00026", "K00024", "K00024", "K00024", "K00024", "K00025", "K00026", "K00025"],
    "2.3.1.9": ["K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626", "K00626"],
    "2.3.1.8": ["K15024", "K00625", "K13788", "K00625", "K13788", "K15024", "K00625", "K13788", "K15024", "K00625", "K13788", "K15024", "K00625", "K13788", "K00625", "K13788", "K15024"],
    "2.9.1.1": ["K01042", "K01042"],
    "5.4.2.6": ["K01838"],
    "3.3.1.1": ["K01251"],
    "5.4.2.4": ["K01837", "K01837"],
    "4.2.3.75": ["K15803", "K10187"],
    "2.3.1.1": ["K00619", "K00620", "K00618", "K11067", "K14681", "K14682", "K00618", "K00619", "K00620", "K11067", "K14681", "K14682", "K14681", "K14681", "K00618", "K00619", "K14682", "K00620", "K11067"],
    "5.4.2.8": ["K15778", "K15778", "K17497", "K01840", "K15778", "K16881", "K15778", "K15778", "K15778", "K17497", "K01840", "K16881", "K15778", "K15778"],
    "5.4.2.9": ["K01841"],
    "2.3.1.5": ["K00622", "K00622", "K00622", "K00622"],
    "2.3.1.4": ["K00621"],
    "2.3.1.7": ["K00624"],
    "2.3.1.6": ["K00623", "K00623"],
    "5.4.4.5": ["K17863"],
    "2.3.3.9": ["K01638", "K01638", "K01638"],
    "2.3.3.8": ["K15230", "K15231", "K01648", "K15230", "K15231", "K01648", "K15230", "K15231"],
    "2.3.1.-": ["K00193", "K11533", "K07549", "K07550", "K15574", "K15575", "K03821", "K00193", "K11533", "K13513", "K13517", "K13519", "K13523", "K13534", "K14675", "K13513", "K13517", "K13519", "K13523", "K13512", "K13515", "K13511", "K13514", "K13516", "K13512", "K13519", "K14329", "K00680", "K02615", "K03372", "K02517", "K02560", "K10212", "K00680", "K05551", "K05552", "K14245", "K14246", "K15880", "K15881", "K14245", "K14246", "K17054", "K12932", "K00680", "K00680", "K07549", "K07550", "K00680", "K15574", "K15575", "K14521", "K15853", "K16675", "K07389", "K12973"],
    "5.4.4.2": ["K01851", "K02552", "K02361", "K14759", "K01851", "K02552", "K02361", "K04781"],
    "2.3.3.1": ["K01647", "K01647", "K01647", "K01647", "K01647"],
    "2.3.3.5": ["K01659"],
    "4.2.3.71": ["K15801"],
    "1.1.2.3": ["K00101"],
    "1.1.2.7": ["K14028", "K14029", "K14028", "K14029", "K14028", "K14029", "K14028", "K14029"],
    "5.1.3.20": ["K03274"],
    "4.3.-.-": ["K13812", "K10713", "K13812", "K13812", "K13812", "K10713"],
    "5.1.3.22": ["K03079"],
    "2.3.3.15": ["K03852"],
    "2.3.3.14": ["K01655", "K10977", "K01655", "K10977", "K01655", "K02594", "K10977", "K10977", "K01655", "K10977"],
    "2.3.3.13": ["K01649", "K01649", "K01649", "K01649"],
    "2.3.3.10": ["K01641", "K01641", "K01641", "K01641"],
    "2.8.4.1": ["K00399", "K00401", "K00402", "K00399", "K00401", "K00402"],
    "1.2.99.2": ["K00198", "K03518", "K03519", "K03520", "K00198", "K03518", "K03519", "K03520", "K00198", "K03518", "K03519", "K03520", "K00198", "K03518", "K03519", "K03520"],
    "1.2.99.5": ["K00200", "K00201", "K00202", "K00203", "K11261", "K00200", "K00201", "K00202", "K00203", "K11261"],
    "1.2.99.4": ["K17067", "K17067", "K17068", "K17067", "K17068"],
    "1.1.2.-": ["K05888"],
    "2.8.2.11": ["K01019"],
    "2.7.1.39": ["K02203", "K00872", "K02204", "K02203", "K00872", "K02204", "K02203"],
    "2.8.2.14": ["K11822", "K11822", "K11822"],
    "2.8.2.17": ["K01020", "K04743"],
    "2.7.1.33": ["K00867", "K09680", "K03525", "K01947", "K01947"],
    "2.7.1.32": ["K00866", "K14156"],
    "2.7.1.31": ["K00865", "K15788", "K15918", "K00865", "K15788", "K15918", "K00865", "K15788", "K15918"],
    "2.7.1.30": ["K00864", "K00864", "K00864"],
    "2.7.1.36": ["K00869", "K00869"],
    "2.7.1.35": ["K00868"],
    "2.4.1.150": ["K00742"],
    "1.14.11.31": ["K14976"],
    "1.5.1.5": ["K01491", "K01491", "K00288", "K01491"],
    "2.7.7.61": ["K05964", "K13927"],
    "3.2.1.166": ["K07964", "K07964"],
    "2.7.1.146": ["K00918", "K00918", "K00918"],
    "2.7.1.147": ["K08074", "K00918", "K08074", "K00918", "K00918"],
    "3.4.17.10": ["K01294"],
    "2.3.1.182": ["K09011", "K09011", "K09011"],
    "2.3.1.183": ["K03823"],
    "2.3.1.180": ["K00648", "K00648"],
    "2.3.1.181": ["K03801"],
    "2.3.1.188": ["K15400"],
    "2.4.1.65": ["K00716", "K07633", "K07634"],
    "2.4.1.64": ["K05342"],
    "2.4.1.67": ["K06611"],
    "2.4.1.66": ["K13646", "K13646"],
    "6.4.1.4": ["K01968", "K01969"],
    "2.4.1.62": ["K00715", "K00715"],
    "2.4.1.69": ["K00718", "K00718"],
    "2.4.1.68": ["K00717", "K00717", "K00717", "K00717"],
    "3.5.1.68": ["K01458", "K01458"],
    "3.2.1.132": ["K01233"],
    "2.4.1.88": ["K00722"],
    "3.4.24.18": ["K01395", "K08606"],
    "2.4.1.83": ["K00721"],
    "2.4.1.82": ["K06617"],
    "2.4.1.132": ["K03843", "K03843"],
    "2.4.1.80": ["K00720"],
    "2.7.9.1": ["K01006", "K01006", "K01006", "K01006"],
    "1.14.99.10": ["K00513"],
    "2.7.9.3": ["K01008"],
    "2.7.9.2": ["K01007", "K01007", "K01007", "K01007"],
    "2.3.1.221": ["K15316"],
    "3.1.11.-": ["K10857"],
    "5.3.99.-": ["K06606"],
    "2.3.1.15": ["K00629", "K13506", "K13507", "K00630", "K13508", "K00631", "K03621", "K08591", "K00629", "K13506", "K13507", "K00630", "K13508", "K00631", "K03621", "K08591"],
    "5.3.99.3": ["K15729", "K05309", "K15730"],
    "4.2.1.92": ["K01723"],
    "2.3.1.16": ["K00632", "K07513", "K07508", "K07509", "K07508", "K07509", "K00632", "K07513", "K07508", "K07509", "K00632", "K07513", "K07513", "K00632", "K07513", "K07508", "K07509", "K00632", "K00632", "K07513", "K07508", "K07509", "K00632", "K07513", "K07513"],
    "5.3.99.6": ["K10525"],
    "2.7.11.16": ["K08291", "K08291", "K08291"],
    "5.3.99.4": ["K01831"],
    "5.3.99.5": ["K01832"],
    "3.1.11.6": ["K03601", "K03602"],
    "4.2.1.99": ["K01682", "K01682", "K01682", "K01682", "K01682", "K01682", "K01682"],
    "5.3.99.8": ["K14593"],
    "5.3.99.9": ["K14594"],
    "2.3.1.19": ["K00634"],
    "3.1.11.1": ["K01141"],
    "1.17.3.2": ["K00106", "K00106", "K00106", "K00106"],
    "5.4.2.2": ["K01835", "K15778", "K15779", "K01835", "K15778", "K15779", "K15778", "K01835", "K15778", "K15779", "K01835", "K15778", "K15779", "K01835", "K15778", "K15779", "K01835", "K15778", "K15779", "K01835", "K15778"],
    "3.4.22.-": ["K08658", "K11863", "K04741", "K12292", "K07369", "K09599", "K09600", "K08569", "K08342", "K04741", "K07369", "K07369", "K13439", "K13440", "K04741", "K04741", "K04741", "K07369", "K04741", "K13537", "K13537"],
    "5.4.2.3": ["K01836"],
    "2.5.1.-": ["K02301", "K02257", "K10764", "K10764", "K02257", "K02301", "K13605", "K03179", "K06125", "K02548", "K15239", "K15241"],
    "2.5.1.7": ["K00790", "K00790"],
    "1.17.1.1": ["K00523"],
    "1.17.1.2": ["K03527"],
    "1.17.1.3": ["K13081"],
    "1.17.1.4": ["K00106", "K00087", "K13479", "K13481", "K13482", "K11177", "K11178", "K00106", "K00106", "K00106"],
    "2.5.1.2": ["K10811"],
    "2.5.1.1": ["K00787", "K00795", "K14066", "K00804", "K13789", "K13787", "K00787", "K00787"],
    "1.17.1.7": ["K02618"],
    "1.17.1.8": ["K00215", "K00215"],
    "2.5.1.9": ["K00793"],
    "5.4.2.7": ["K15779", "K01839", "K15779", "K15779", "K15779", "K15779", "K01839", "K15779"],
    "2.3.3.-": ["K10977", "K15741", "K15742", "K10977", "K10977", "K10977", "K10977", "K17748", "K15741", "K15742"],
    "2.1.1.163": ["K03183"],
    "2.1.1.160": ["K12731"],
    "3.5.3.22": ["K12676"],
    "1.17.7.1": ["K03526"],
    "4.1.1.11": ["K01579", "K01579"],
    "4.2.3.144": ["K17982"],
    "3.6.1.29": ["K01522", "K01522", "K01522"],
    "3.7.1.2": ["K01555", "K16171", "K01555", "K16171"],
    "4.2.1.65": ["K13036"],
    "1.3.1.38": ["K07512", "K07753", "K07512", "K07753", "K07753"],
    "3.4.19.9": ["K01307"],
    "1.3.1.34": ["K13237"],
    "1.3.1.32": ["K00217", "K00217", "K00217", "K00217", "K00217"],
    "5.4.4.6": ["K17864"],
    "1.3.1.31": ["K10797"],
    "3.1.1.56": ["K03927"],
    "3.1.1.57": ["K10221", "K10221"],
    "6.5.1.2": ["K01972", "K01972", "K01972", "K01972"],
    "1.1.3.43": ["K13552"],
    "3.1.3.56": ["K01106", "K01106"],
    "3.1.3.57": ["K01107", "K15422", "K15422", "K01107", "K15422"],
    "2.7.2.15": ["K00932"],
    "2.7.2.11": ["K00931", "K12657", "K00931", "K12657"],
    "2.6.1.45": ["K00830", "K00830", "K00830", "K00830", "K00830", "K00830"],
    "2.6.1.44": ["K14272", "K00830", "K14272", "K14272", "K00830", "K14272", "K14272", "K00830", "K00830", "K00827", "K14272", "K00830", "K00827", "K14272", "K00830"],
    "2.6.1.40": ["K00827", "K00827"],
    "2.6.1.42": ["K00826", "K00826", "K00826", "K00826", "K00826"],
    "2.6.1.48": ["K14268"],
    "3.1.21.2": ["K01151"],
    "3.1.27.-": ["K14403", "K10787"],
    "5.5.1.14": ["K14043", "K12928"],
    "5.1.3.25": ["K17947"],
    "2.7.7.-": ["K02684", "K02685", "K02684", "K02685", "K02364", "K14168", "K02316", "K02684", "K02685", "K03515"],
    "4.1.2.14": ["K01625", "K01625", "K17463", "K01625", "K01625"],
    "2.7.7.9": ["K00963", "K00963", "K00963", "K00963"],
    "4.1.2.17": ["K01628"],
    "4.1.2.10": ["K08248"],
    "4.1.2.11": ["K08249"],
    "4.1.2.13": ["K01623", "K01624", "K11645", "K16305", "K16306", "K01622", "K01623", "K01624", "K01622", "K11645", "K16305", "K16306", "K01623", "K11645", "K01624", "K01622", "K16305", "K16306", "K01623", "K11645", "K01624", "K01622", "K16305", "K16306", "K01623", "K11645", "K01624", "K01622", "K16305", "K16306", "K01623", "K11645", "K01624", "K01623", "K11645", "K01624", "K01622", "K16305", "K16306", "K16305", "K16306"],
    "2.7.7.3": ["K02318", "K00954", "K02201"],
    "2.7.7.2": ["K11753", "K00953"],
    "2.7.7.1": ["K00952", "K06210", "K13522"],
    "2.7.7.7": ["K02335", "K02319", "K02322", "K02323", "K02337", "K03763", "K02338", "K02343", "K02340", "K02341", "K02342", "K14159", "K02345", "K02339", "K02344", "K02320", "K02327", "K02324", "K02325", "K02326", "K03506", "K02335", "K02337", "K03763", "K02338", "K02343", "K02340", "K02341", "K02342", "K14159", "K02345", "K02339", "K02344", "K02319", "K02322", "K02323", "K02320", "K02327", "K02324", "K02325", "K02326", "K03506", "K03514", "K02345", "K02342", "K14159", "K02337", "K03763", "K02343", "K02341", "K02340", "K02344", "K02339", "K02338", "K02335", "K02320", "K02327", "K02324", "K02325", "K02326", "K03506", "K02335", "K02330", "K03512", "K02327", "K02324", "K02325", "K02326", "K03506", "K02335", "K02327", "K02324", "K02325", "K02326", "K03506", "K02337", "K03763", "K02338", "K02343", "K02340", "K02341", "K02342", "K14159", "K02345", "K02339", "K02344", "K02327", "K02335", "K02337", "K03763", "K02338", "K02343", "K02340", "K02341", "K02342", "K14159", "K02345", "K02339", "K02344", "K02327", "K03512", "K03513", "K10981", "K02350", "K03508", "K03509", "K03510", "K03511", "K16618", "K02330", "K02327", "K02324", "K02325", "K02326", "K03506", "K02330"],
    "4.1.2.19": ["K01629", "K01629"],
    "2.7.7.4": ["K13811", "K00955", "K00956", "K00957", "K00958", "K13811", "K00955", "K00956", "K00957", "K00958", "K13811", "K00955", "K00956", "K00957", "K00958"],
    "5.1.3.23": ["K13019"],
    "1.1.2.4": ["K00102"],
    "5.2.1.2": ["K01800", "K01800"],
    "5.2.1.1": ["K01799", "K01799"],
    "4.3.1.25": ["K13064", "K13064"],
    "1.1.1.352": ["K17652"],
    "1.1.1.353": ["K17647"],
    "1.1.1.350": ["K00073"],
    "5.2.1.4": ["K01801", "K16163"],
    "5.5.1.12": ["K12927", "K14041", "K14042"],
    "5.2.1.8": ["K09567", "K12733", "K09564", "K10598", "K09565", "K09578", "K09571", "K09565", "K09565", "K09565"],
    "1.97.1.10": ["K01562", "K17904"],
    "3.5.1.113": ["K17078"],
    "1.1.2.8": ["K00114", "K00114", "K00114"],
    "1.5.3.-": ["K12259", "K13366", "K17839", "K12259", "K13366", "K17839"],
    "2.5.1.26": ["K00803", "K00803"],
    "2.5.1.22": ["K00802", "K00802", "K00802", "K00802"],
    "2.5.1.21": ["K00801", "K00801"],
    "1.15.1.1": ["K04564", "K04565", "K04564", "K04565", "K04565", "K04564", "K04565"],
    "3.2.1.46": ["K01202", "K01202"],
    "3.2.1.45": ["K01201", "K17108", "K01201", "K17108", "K01201"],
    "3.2.1.48": ["K01203", "K01203", "K01203"],
    "1.5.3.1": ["K00301", "K00302", "K00303", "K00305", "K00304", "K00306", "K00306", "K00306"],
    "1.13.12.16": ["K00459"],
    "1.8.4.-": ["K10950", "K10976", "K10950"],
    "3.6.-.-": ["K10866", "K10866"],
    "1.8.2.3": ["K17229"],
    "1.8.2.1": ["K05301"],
    "1.5.5.2": ["K13821", "K13821"],
    "4.2.1.109": ["K08964", "K16054"],
    "2.7.7.41": ["K00981", "K00981"],
    "2.7.7.43": ["K00983"],
    "1.8.4.8": ["K00390"],
    "1.8.4.9": ["K05907"],
    "2.7.7.48": ["K00985"],
    "4.2.1.100": ["K07537", "K07537"],
    "3.2.1.106": ["K01228", "K01228"],
    "4.2.1.104": ["K01725"],
    "4.2.1.107": ["K12405", "K12405"],
    "4.2.1.106": ["K15872"],
    "1.1.1.29": ["K00018", "K00018", "K00018", "K00018"],
    "1.1.1.28": ["K03777", "K03778"],
    "1.14.15.-": ["K15757", "K15757", "K15757"],
    "3.5.4.-": ["K01500"],
    "1.1.1.23": ["K14152", "K00013", "K14152", "K00013"],
    "1.1.1.22": ["K00012", "K00012", "K00012", "K00012"],
    "1.1.1.21": ["K00011", "K00011", "K00011", "K00011", "K00011"],
    "1.1.1.27": ["K00016", "K00016", "K00016", "K00016"],
    "1.1.1.26": ["K00015"],
    "1.1.1.25": ["K13830", "K00014", "K13832", "K13830", "K13832", "K00014"],
    "1.14.17.4": ["K05933"],
    "1.14.15.9": ["K09847"],
    "3.5.4.9": ["K01491", "K01491", "K00288", "K01491", "K13403"],
    "3.4.13.18": ["K08660", "K08660", "K08660"],
    "3.5.4.3": ["K01487"],
    "3.5.4.2": ["K01486"],
    "1.14.15.3": ["K00496", "K17687", "K17688", "K07425", "K17687", "K07425", "K17687", "K07425", "K07425", "K17687", "K17688", "K07425"],
    "1.14.15.5": ["K07433"],
    "1.14.15.4": ["K00497", "K07433"],
    "1.14.15.7": ["K00499"],
    "3.5.4.4": ["K01488", "K01488"],
    "3.4.11.7": ["K11141"],
    "3.4.21.41": ["K01330", "K01330", "K01330", "K01330", "K01330"],
    "3.4.21.43": ["K01332", "K01332", "K01332", "K01332"],
    "3.4.21.42": ["K01331", "K01331", "K01331", "K01331"],
    "3.4.21.45": ["K01333", "K01333"],
    "3.4.21.47": ["K01335", "K01335"],
    "3.4.21.46": ["K01334", "K01334"],
    "1.3.99.27": ["K09845"],
    "1.3.99.26": ["K10027"],
    "3.4.24.11": ["K01389", "K01389", "K01389", "K01389"],
    "1.10.99.3": ["K09839"],
    "1.14.19.-": ["K10255", "K10256", "K10257", "K10226", "K10224", "K10226", "K10255", "K10256", "K10257", "K10226", "K10224", "K10255", "K10226"],
    "1.3.99.23": ["K09516"],
    "1.3.99.22": ["K02495"],
    "1.14.19.7": ["K12903"],
    "1.14.19.1": ["K00507", "K00507", "K00507"],
    "1.14.19.3": ["K00508"],
    "1.14.19.2": ["K03921", "K03922", "K03921", "K03922", "K03921", "K03922"],
    "1.4.99.1": ["K00285"],
    "1.14.11.32": ["K14975"],
    "3.2.1.122": ["K01232"],
    "3.5.1.18": ["K01439", "K01439"],
    "3.5.1.19": ["K01440", "K08281"],
    "3.5.1.14": ["K14677", "K14677", "K14677"],
    "3.5.1.15": ["K01437", "K01437"],
    "3.5.1.16": ["K01438", "K01438", "K01438"],
    "3.5.1.10": ["K01433", "K01433"],
    "3.5.1.11": ["K01434"],
    "3.5.1.12": ["K01435", "K01435"],
    "3.8.1.7": ["K14418"],
    "1.14.99.22": ["K10723"],
    "2.4.1.149": ["K00741", "K00741"],
    "3.3.2.6": ["K01254"],
    "2.4.1.145": ["K00738", "K13748", "K13748", "K00738"],
    "2.4.1.144": ["K00737"],
    "2.4.1.147": ["K00739"],
    "1.4.2.-": ["K07255", "K07256"],
    "2.4.1.141": ["K07432", "K07441", "K07432", "K07441"],
    "2.4.1.143": ["K00736", "K00736"],
    "2.4.1.142": ["K03842", "K03842"],
    "3.6.1.1": ["K01507", "K15986", "K06019", "K15987", "K11725", "K11726"],
    "3.6.1.3": ["K01509"],
    "3.6.1.5": ["K01510", "K14641", "K14642", "K01510", "K14641", "K14642", "K01510"],
    "3.6.1.7": ["K01512", "K01512"],
    "3.6.1.6": ["K12304", "K12305", "K01511", "K12304", "K12305", "K01511", "K12305"],
    "3.6.1.9": ["K01513", "K01513", "K01513", "K01513", "K01513"],
    "3.6.1.8": ["K04765", "K04765"],
    "4.2.1.83": ["K10220", "K16515"],
    "3.4.23.46": ["K04521"],
    "3.4.23.45": ["K07747"],
    "4.2.1.80": ["K02554", "K02554", "K02554", "K02554", "K02554"],
    "3.4.23.43": ["K02464"],
    "4.2.1.84": ["K01721", "K01721", "K01721", "K01721"],
    "3.6.1.-": ["K13987", "K08312", "K13522", "K14539", "K08311", "K15078", "K17879", "K13355"],
    "4.4.1.8": ["K01760", "K14155", "K01760", "K14155", "K01760", "K14155"],
    "4.4.1.9": ["K13034", "K13034", "K13034", "K13034", "K13034"],
    "4.4.1.1": ["K01758", "K17217", "K17217", "K01758", "K17217", "K01758", "K17217", "K01758"],
    "4.4.1.2": ["K17217", "K17217", "K17217", "K17217"],
    "4.4.1.3": ["K16953"],
    "4.4.1.5": ["K01759", "K01759"],
    "2.7.7.59": ["K00990"],
    "4.4.1.-": ["K11819", "K11819", "K11819"],
    "2.1.1.269": ["K17486"],
    "1.8.99.2": ["K00394", "K00395"],
    "1.11.1.21": ["K03782", "K03782", "K03782"],
    "1.8.99.1": ["K11180", "K11181", "K11180", "K11181"],
    "2.1.1.159": ["K12730"],
    "2.1.1.158": ["K12729"],
    "3.6.3.31": ["K11072"],
    "1.3.1.-": ["K00209", "K02371", "K05783", "K15252", "K00209", "K02371", "K05783", "K05783", "K15237", "K15238", "K15252", "K00224", "K05783", "K00224", "K00224"],
    "2.1.1.152": ["K02228"],
    "2.1.1.151": ["K03394"],
    "2.1.1.150": ["K13262"],
    "1.3.1.2": ["K00207", "K00207", "K00207", "K00207"],
    "1.3.1.3": ["K00251", "K00251"],
    "1.3.1.1": ["K17722", "K17723", "K17722", "K17723", "K17722", "K17723"],
    "1.3.1.9": ["K00208", "K00208", "K00208"],
    "2.1.1.116": ["K13386"],
    "3.1.1.78": ["K08233"],
    "1.1.1.181": ["K12408"],
    "3.1.1.79": ["K07188"],
    "1.1.1.184": ["K00079", "K00081", "K00084", "K00079", "K00081", "K00084", "K00079"],
    "1.1.1.189": ["K00079", "K00079", "K00079"],
    "1.1.1.188": ["K04119", "K04119", "K04119"],
    "1.3.1.21": ["K00213"],
    "6.2.1.5": ["K01902", "K01903", "K01899", "K01900", "K01902", "K01903", "K01899", "K01900", "K01899", "K01900", "K01903", "K01902", "K01903", "K01902", "K01902", "K01903"],
    "6.2.1.7": ["K08748", "K08748", "K08748"],
    "1.3.1.25": ["K05783", "K05783", "K05783", "K05783"],
    "6.2.1.1": ["K01895", "K01895", "K01895", "K01895", "K01895", "K01895"],
    "6.2.1.2": ["K01896"],
    "6.2.1.3": ["K01897", "K15013", "K01897", "K15013", "K08746", "K01897", "K01897", "K15013", "K08746", "K01897", "K15013"],
    "1.3.1.29": ["K14582", "K14582", "K14582"],
    "1.3.1.28": ["K00216"],
    "3.1.26.11": ["K00784"],
    "1.13.99.1": ["K00469", "K00469"],
    "3.1.1.47": ["K16795", "K01062"],
    "3.1.1.45": ["K01061", "K01061", "K01061"],
    "3.1.3.48": ["K01110", "K14394", "K07293", "K05866", "K04458", "K04459", "K07293", "K11240", "K07293", "K05697", "K01110", "K01110", "K01110", "K01110", "K06478", "K05695", "K05693", "K05866", "K05867", "K06639", "K06645", "K06639", "K02555", "K06639", "K05867", "K01110", "K01110", "K05693", "K05694", "K05695", "K05696", "K05697", "K05698", "K01110", "K05697", "K07293", "K06478", "K05697", "K05697", "K06478", "K07293", "K05696", "K05695", "K07293", "K06645", "K05866", "K05867", "K07293", "K01110", "K15616", "K01110", "K06645", "K05866", "K05867", "K07293", "K05697", "K01110", "K07293", "K01110", "K07293", "K01110", "K01110", "K01110", "K06478", "K07817", "K07293", "K08114", "K01110", "K07293", "K05697"],
    "3.1.1.41": ["K01060"],
    "3.1.3.45": ["K03270"],
    "6.2.1.-": ["K14466", "K14467", "K14747", "K14466", "K14467", "K10526", "K01913", "K13776", "K01913", "K04116", "K01913", "K14747", "K01913", "K08746", "K08745", "K08746"],
    "3.1.3.46": ["K01103", "K14634", "K01103"],
    "3.1.3.41": ["K01101"],
    "4.6.1.2": ["K12318", "K12319", "K12320", "K12321", "K12323", "K12324", "K01769", "K12318", "K12319", "K12323", "K12324", "K12318", "K12319", "K12318", "K12319", "K12318", "K12319", "K12321", "K12318", "K12319"],
    "4.6.1.1": ["K01768", "K05851", "K05873", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K11265", "K11029", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08047", "K08048", "K08049", "K01768", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08046", "K08043", "K08049", "K08046", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08045", "K08045", "K08041", "K08048", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08043", "K08044", "K08046", "K08048", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K11265", "K08045", "K08045", "K08045", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08045", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08043", "K08049", "K05851", "K11029", "K08041", "K08042", "K08043", "K08044", "K08045", "K08046", "K08047", "K08048", "K08049", "K08041", "K08041"],
    "2.1.1.111": ["K12643"],
    "3.7.1.20": ["K16165"],
    "1.1.1.295": ["K13070"],
    "1.1.1.294": ["K13606"],
    "1.1.1.290": ["K03473"],
    "2.1.1.110": ["K17650"],
    "1.1.1.298": ["K14468", "K15039", "K14468", "K14468", "K15039"],
    "3.4.21.83": ["K01354", "K01354"],
    "3.2.1.4": ["K01179"],
    "2.1.1.117": ["K13397"],
    "3.2.1.1": ["K05343", "K01176", "K07405", "K01176"],
    "3.2.1.3": ["K12047", "K12047", "K01178", "K12047"],
    "3.2.1.2": ["K01177"],
    "3.2.1.-": ["K02438", "K07965", "K07965"],
    "4.99.1.1": ["K01772"],
    "4.99.1.3": ["K02190", "K03795"],
    "4.99.1.4": ["K02302", "K02304", "K03794"],
    "4.99.1.7": ["K10566", "K10566"],
    "4.99.1.6": ["K11868"],
    "1.1.1.169": ["K00077"],
    "1.7.1.14": ["K15877"],
    "1.7.1.15": ["K00362", "K00363"],
    "1.7.1.13": ["K06879", "K09457"],
    "2.5.1.31": ["K00806"],
    "2.5.1.30": ["K00805"],
    "2.5.1.32": ["K02291", "K17841"],
    "2.1.1.115": ["K13388"],
    "3.4.23.1": ["K06002"],
    "3.2.1.55": ["K01209", "K15921"],
    "3.2.1.54": ["K01208"],
    "3.2.1.51": ["K01206", "K15923"],
    "3.2.1.50": ["K01205", "K01205"],
    "3.2.1.52": ["K01207", "K12373", "K14459", "K12373", "K12373", "K12373", "K12373", "K14459", "K12373"],
    "3.4.17.23": ["K09708", "K09708"],
    "3.2.1.58": ["K01210"],
    "3.4.22.16": ["K01366"],
    "3.4.22.15": ["K01365", "K01365", "K01365", "K01365", "K01365"],
    "2.7.7.53": ["K00988"],
    "4.2.1.118": ["K09483", "K15652"],
    "2.7.7.50": ["K13917"],
    "1.12.99.6": ["K06281", "K06282"],
    "2.6.1.98": ["K13017"],
    "2.6.1.99": ["K16903"],
    "2.6.1.96": ["K16871", "K16871"],
    "4.2.1.113": ["K02549", "K14759"],
    "2.6.1.94": ["K13553"],
    "2.7.7.58": ["K02363"],
    "2.6.1.92": ["K15895"],
    "2.6.1.93": ["K13553"],
    "4.2.1.114": ["K16792", "K16793", "K16792", "K16793", "K16792", "K16793", "K16792", "K16793"],
    "4.2.1.115": ["K15894"],
    "1.1.1.18": ["K00010", "K00010"],
    "1.1.1.17": ["K00009"],
    "1.1.1.14": ["K00008"],
    "3.4.21.6": ["K01314"],
    "1.1.1.10": ["K03331"],
    "1.1.1.11": ["K00007", "K00007"],
    "3.4.17.21": ["K14592"],
    "4.2.3.4": ["K13830", "K01735", "K13829", "K13830", "K01735", "K13829"],
    "4.2.3.5": ["K01736", "K01736"],
    "4.2.3.6": ["K12249"],
    "4.2.3.7": ["K12250"],
    "4.2.3.1": ["K01733", "K01733", "K01733"],
    "4.2.3.3": ["K01734"],
    "4.2.3.8": ["K12929"],
    "4.2.3.9": ["K14180"],
    "4.2.3.-": ["K14184", "K13450", "K13450"],
    "6.3.4.6": ["K01941", "K14541", "K14541"],
    "1.14.13.152": ["K15099"],
    "1.14.13.151": ["K05525"],
    "1.14.13.157": ["K17689", "K17689", "K17689", "K17689", "K17689", "K17689", "K17689"],
    "4.2.3.103": ["K16082"],
    "1.14.13.154": ["K14370", "K14370"],
    "1.14.13.159": ["K07419"],
    "2.1.1.86": ["K00577", "K00578", "K00579", "K00580", "K00581", "K00582", "K00583", "K00584", "K00577", "K00578", "K00579", "K00580", "K00581", "K00582", "K00583", "K00584"],
    "2.1.1.80": ["K00575", "K13924", "K13924", "K00575"],
    "2.4.1.115": ["K12930"],
    "2.3.1.64": ["K14329"],
    "5.1.2.2": ["K01781"],
    "2.7.1.11": ["K00850", "K16370", "K00850", "K16370", "K00850", "K16370", "K00850", "K16370", "K00850", "K16370", "K00850", "K16370", "K00850", "K16370"],
    "2.7.1.13": ["K11441"],
    "2.7.1.12": ["K00851", "K00851"],
    "2.7.1.15": ["K00852"],
    "2.7.1.14": ["K11214"],
    "2.7.1.17": ["K00854"],
    "2.7.1.16": ["K00853"],
    "2.7.1.19": ["K00855", "K00855"],
    "1.1.3.13": ["K17066", "K17066"],
    "3.1.26.4": ["K14159", "K14159", "K14159", "K03469", "K03470", "K03471", "K10743", "K14159", "K14159"],
    "1.1.3.15": ["K11517", "K00104", "K11517"],
    "1.1.3.16": ["K10724"],
    "1.1.3.17": ["K17755"],
    "6.3.5.11": ["K02224"],
    "6.3.5.10": ["K02232"],
    "1.3.1.101": ["K17830"],
    "1.3.1.104": ["K10780", "K10780"],
    "1.3.99.31": ["K10027"],
    "5.1.1.8": ["K12658"],
    "4.2.3.18": ["K12927"],
    "5.1.1.1": ["K01775"],
    "5.1.1.3": ["K01776"],
    "5.1.1.4": ["K01777"],
    "5.1.1.7": ["K01778", "K01778"],
    "1.14.99.37": ["K14039"],
    "1.14.99.36": ["K00515"],
    "1.8.1.12": ["K04283"],
    "1.14.99.33": ["K08262"],
    "3.4.24.36": ["K01404", "K01404"],
    "3.4.24.35": ["K01403", "K01403", "K01403", "K01403", "K01403", "K01403", "K01403", "K01403", "K01403"],
    "2.4.1.131": ["K03844", "K03844"],
    "2.4.1.157": ["K03429"],
    "2.4.1.155": ["K00744"],
    "2.4.1.152": ["K03663", "K03663", "K03663"],
    "3.4.24.17": ["K01394", "K01394", "K01394"],
    "1.14.99.39": ["K10944", "K10944", "K10944"],
    "1.14.99.38": ["K10223"],
    "1.8.1.4": ["K00382", "K00382", "K00382", "K00382", "K00382", "K00382"],
    "1.8.1.7": ["K00383", "K00383"],
    "1.8.1.6": ["K05395"],
    "2.4.1.8": ["K00691"],
    "1.8.1.2": ["K00380", "K00381"],
    "2.4.1.7": ["K00690"],
    "2.4.1.4": ["K05341"],
    "2.4.1.5": ["K00689", "K00689"],
    "1.8.1.9": ["K00384", "K00384"],
    "2.4.1.1": ["K00688", "K16153", "K00688"],
    "1.8.3.6": ["K05906"],
    "1.8.3.5": ["K05906"],
    "2.4.1.-": ["K00754", "K07966", "K07967", "K06119", "K16266", "K07966", "K07967", "K07968", "K09661", "K05529", "K05530", "K05531", "K05532", "K05533", "K05534", "K05535", "K05536", "K05538", "K14413", "K14412", "K14434", "K14464", "K07966", "K07967", "K07968", "K09653", "K09662", "K09663", "K09905", "K09666", "K07966", "K07967", "K07968", "K07632", "K07635", "K09661", "K10967", "K05538", "K10968", "K10969", "K10970", "K10971", "K09667", "K13675", "K13667", "K07966", "K07967", "K07968", "K07969", "K09664", "K05284", "K07542", "K05286", "K08098", "K07819", "K07820", "K03877", "K07966", "K07967", "K07968", "K07969", "K07632", "K07635", "K07970", "K07971", "K03877", "K02844", "K02840", "K03275", "K03276", "K03814", "K05367", "K05366", "K12551", "K04478", "K10211", "K13493", "K15994", "K14375", "K15994", "K14375", "K16039", "K15929", "K15936", "K15939", "K15946", "K15948", "K15951", "K15960", "K15961", "K15964", "K15965", "K13235", "K13078", "K15787", "K12938", "K15774", "K15775", "K15776", "K11718"],
    "2.4.1.85": ["K13030"],
    "1.8.3.1": ["K00387"],
    "2.1.1.140": ["K13384"],
    "2.1.1.141": ["K08241"],
    "6.5.1.1": ["K10747", "K01971", "K10776", "K10747", "K01971", "K10747", "K01971", "K10747", "K01971", "K10777"],
    "2.1.1.143": ["K08242"],
    "2.1.1.146": ["K17057", "K17058"],
    "2.1.1.148": ["K03465", "K03465"],
    "4.2.3.124": ["K13546"],
    "5.3.1.8": ["K15916", "K15916", "K15916", "K01809", "K15916", "K16011", "K15916", "K15916", "K16011", "K01809"],
    "5.3.1.9": ["K01810", "K06859", "K15916", "K13810", "K13810", "K01810", "K06859", "K13810", "K15916", "K01810", "K06859", "K13810", "K15916", "K15916", "K01810", "K06859", "K13810", "K15916", "K01810", "K06859", "K13810", "K15916"],
    "4.2.3.120": ["K07384"],
    "5.3.1.1": ["K01803", "K01803", "K01803", "K01803", "K01803", "K01803"],
    "5.3.1.6": ["K01807", "K01808", "K01807", "K01808", "K01807", "K01808", "K01808", "K01807", "K01808"],
    "5.3.1.4": ["K01804"],
    "5.3.1.5": ["K01805", "K01805"],
    "1.1.1.195": ["K00083"],
    "1.1.1.197": ["K00079", "K00079", "K00079"],
    "5.3.1.-": ["K01820", "K02080", "K03337"],
    "6.3.1.11": ["K09470"],
    "6.3.1.10": ["K02227"],
    "6.3.1.15": ["K12709"],
    "1.3.1.54": ["K05895"],
    "4.2.1.90": ["K12661"],
    "1.3.1.56": ["K08690", "K08690"],
    "2.7.1.41": ["K05344", "K05344"],
    "4.2.1.91": ["K01713", "K05359", "K01713", "K05359"],
    "6.2.1.27": ["K04105", "K04105", "K04105"],
    "1.3.1.58": ["K10620", "K10620"],
    "2.7.11.11": ["K04345", "K04345", "K04345", "K04345", "K07198", "K04345", "K07198", "K07198", "K07198", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K07198", "K07198", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K07198", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K04345", "K07198", "K04345", "K07198", "K04345", "K04345", "K04345", "K04345"],
    "3.1.1.75": ["K05973"],
    "1.5.99.9": ["K00319", "K00319"],
    "2.7.11.10": ["K04467", "K07209", "K05410", "K04467", "K07209", "K04467", "K07209", "K07209", "K04467", "K04467", "K07209", "K04467", "K07209", "K07209", "K04467", "K07209", "K04467", "K07209", "K07211", "K05410", "K04467", "K07209", "K05410", "K07211", "K04467", "K07209", "K05410", "K07211", "K04467", "K07209", "K04467", "K07209", "K04467", "K07209", "K04467", "K07209", "K07209", "K04467", "K07209", "K07209", "K04467", "K07209", "K04467", "K07209", "K07209", "K04467", "K07209", "K04467", "K07209", "K04467", "K07209", "K04467", "K07209", "K04467", "K07209", "K07209", "K07209", "K04467", "K07209", "K04467", "K07209", "K04467", "K07209", "K07211", "K05410", "K04467", "K07209", "K05410", "K07211", "K04467", "K07209", "K07211", "K05410", "K05410", "K07211", "K04467", "K07209", "K07209", "K04467", "K07211", "K05410", "K04467", "K07209", "K05410", "K04467", "K07209", "K04467", "K07209"],
    "2.7.11.17": ["K04515", "K04515", "K04515", "K04515", "K05869", "K04515", "K04515", "K07359", "K04515", "K04515", "K04515", "K04515", "K04515", "K05869", "K04515", "K04515", "K05869", "K04515", "K05869", "K04515", "K04515", "K05869", "K04515", "K04515", "K04515", "K04515", "K05869", "K07359", "K05869", "K04515"],
    "1.7.3.3": ["K00365", "K16838", "K00365", "K16838"],
    "1.5.99.6": ["K00316", "K00316"],
    "3.7.1.12": ["K02189", "K13541"],
    "3.7.1.17": ["K16050", "K16050"],
    "2.3.1.12": ["K00627", "K00627", "K00627", "K00627"],
    "1.1.1.288": ["K09841"],
    "4.1.2.34": ["K11949"],
    "1.1.1.281": ["K15856", "K15856"],
    "1.1.1.282": ["K05887"],
    "1.1.1.284": ["K00121", "K00121", "K00121", "K00121", "K00121", "K00121", "K00121", "K00121", "K00121", "K00121", "K00121", "K00121"],
    "2.6.-.-": ["K05290"],
    "1.1.1.286": ["K17753", "K17753", "K17753", "K17753"],
    "1.1.1.287": ["K17818"],
    "3.1.11.5": ["K03582", "K03583", "K03581"],
    "1.2.-.-": ["K00206"],
    "1.4.9.1": ["K15228", "K15229", "K08685"],
    "3.1.11.2": ["K01142", "K02830", "K02830", "K10790"],
    "1.4.9.2": ["K13371", "K13372", "K13371", "K13372", "K13371", "K13372"],
    "3.4.19.12": ["K05611"],
    "3.1.2.15": ["K11832", "K11838", "K11839", "K11866", "K08601", "K12655", "K08601", "K11838", "K11838", "K11838"],
    "3.1.2.14": ["K10781", "K01071", "K10781", "K01071", "K10782"],
    "3.1.2.12": ["K01070", "K01070"],
    "1.4.1.24": ["K11646"],
    "1.4.1.20": ["K00270", "K00270", "K00270"],
    "1.4.1.21": ["K06989"],
    "1.4.1.23": ["K00271"],
    "4.1.2.30": ["K00512", "K00512", "K00512"],
    "1.4.7.1": ["K00284", "K00284"],
    "1.4.1.1": ["K00259", "K00259"],
    "1.4.1.3": ["K00261", "K00261", "K00261", "K00261", "K00261"],
    "1.4.1.2": ["K15371", "K00260", "K15371", "K00260", "K15371", "K00260", "K15371", "K00260"],
    "1.4.1.4": ["K00262", "K00262", "K00262"],
    "1.4.1.9": ["K00263", "K00263"],
    "3.1.4.12": ["K12350", "K12351", "K12352", "K12353", "K12354", "K01117", "K12350"],
    "3.1.4.11": ["K05858", "K05857", "K05860", "K01116", "K05859", "K05861", "K01116", "K05859", "K05860", "K05858", "K01116", "K05860", "K01116", "K05859", "K05858", "K01116", "K05859", "K01116", "K05859", "K01116", "K05859", "K05857", "K05858", "K01116", "K05859", "K05860", "K05861", "K05858", "K05857", "K05860", "K01116", "K05859", "K05861", "K05861", "K05858", "K01116", "K05859", "K01116", "K05859", "K01116", "K05859", "K01116", "K05859", "K01116", "K05859", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05857", "K05860", "K01116", "K05859", "K05861", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K05858", "K01116", "K05859", "K05858", "K05859", "K05858", "K01116", "K05859", "K01116", "K05859", "K05860", "K01116", "K05859", "K01116", "K05859", "K01116", "K05859", "K05858", "K05858", "K01116", "K05859", "K01116", "K05859", "K01116", "K05859", "K05858", "K05858", "K05858"],
    "3.1.4.17": ["K01120", "K13755", "K13296", "K13298", "K13755", "K13296", "K13296", "K13755", "K13296", "K13298", "K01120"],
    "3.1.4.16": ["K01119", "K01119"],
    "3.5.2.17": ["K07127", "K13484"],
    "3.1.4.14": ["K08682"],
    "3.5.2.18": ["K15358"],
    "1.21.3.3": ["K00307"],
    "1.1.1.178": ["K08683", "K08683"],
    "1.1.1.179": ["K00078", "K00078"],
    "1.1.1.170": ["K07748"],
    "2.5.1.44": ["K00808"],
    "3.4.24.29": ["K01401"],
    "2.5.1.47": ["K01738", "K12339", "K13034", "K17069", "K01738", "K12339", "K13034", "K17069", "K10150", "K10150", "K01738", "K12339", "K13034", "K17069", "K10150", "K01738", "K12339", "K13034", "K10150", "K17069", "K13034"],
    "2.5.1.41": ["K17104"],
    "2.5.1.42": ["K17105"],
    "3.5.2.10": ["K01470"],
    "2.5.1.48": ["K01739", "K01739", "K01739", "K01739"],
    "2.5.1.49": ["K17069", "K17069", "K17069", "K17069", "K01740"],
    "3.10.1.1": ["K01565", "K01565"],
    "3.5.2.15": ["K03383"],
    "3.5.2.14": ["K01473", "K01474"],
    "2.5.1.6": ["K00789", "K00789"],
    "1.5.99.12": ["K00279"],
    "1.5.99.13": ["K17851"],
    "1.5.99.11": ["K00320", "K00320"],
    "5.3.2.8": ["K16514"],
    "2.6.1.81": ["K00840"],
    "2.6.1.83": ["K10206", "K10206"],
    "2.6.1.82": ["K09251"],
    "2.6.1.85": ["K01665", "K01664", "K13950", "K03342"],
    "2.6.1.84": ["K12252"],
    "2.6.1.87": ["K07806", "K07806"],
    "4.2.1.128": ["K15816"],
    "4.2.1.126": ["K07106"],
    "4.2.1.125": ["K15817"],
    "4.2.1.124": ["K15823"],
    "2.7.7.68": ["K14941"],
    "4.2.1.120": ["K14534", "K14534", "K14534"],
    "1.6.2.4": ["K14338", "K14338", "K14338"],
    "1.3.99.-": ["K06445", "K15571", "K06445", "K11538", "K11731", "K00257", "K04117", "K06446", "K15571"],
    "1.6.2.2": ["K00326"],
    "3.1.1.94": ["K17648"],
    "1.3.99.8": ["K16877", "K16878", "K16879"],
    "1.3.99.4": ["K05898"],
    "1.3.99.5": ["K16051"],
    "1.3.99.1": ["K00239", "K00240", "K00244", "K00245", "K00239", "K00240", "K00244", "K00245", "K00239", "K00240", "K00244", "K00245", "K00239", "K00240", "K00244", "K00245", "K00239", "K00240", "K00244", "K00245", "K00239", "K00240", "K00244", "K00245", "K00244", "K00245", "K00239"],
    "1.14.13.140": ["K13226"],
    "1.14.13.141": ["K15981"],
    "1.14.13.142": ["K15982", "K15983"],
    "1.14.13.143": ["K16083"],
    "1.14.13.144": ["K16085"],
    "1.14.13.145": ["K16084"],
    "1.14.13.149": ["K02609", "K02611"],
    "3.4.21.69": ["K01344"],
    "3.4.21.68": ["K01343", "K01343"],
    "2.1.1.96": ["K00562", "K00562"],
    "2.1.1.95": ["K05928"],
    "2.1.1.90": ["K04480", "K04480"],
    "3.5.1.90": ["K08260"],
    "2.7.1.65": ["K04339"],
    "2.7.1.66": ["K00887"],
    "2.7.1.67": ["K00888", "K13711", "K00888", "K13711"],
    "2.7.1.60": ["K12409", "K00885", "K13967"],
    "4.2.3.76": ["K15806"],
    "2.7.1.63": ["K00886", "K00886", "K00886"],
    "3.5.1.93": ["K12748"],
    "2.7.1.68": ["K00889", "K13712", "K00889", "K00889", "K13712", "K00889", "K00889"],
    "2.7.1.69": ["K02777", "K02778", "K02790", "K02749", "K02752", "K17464", "K17465", "K02768", "K02769", "K02793", "K02794", "K02798", "K02799", "K02781", "K02782", "K02812", "K02813", "K02773", "K02774", "K02786", "K02787", "K02744", "K02745", "K10984", "K02821", "K02822", "K02808", "K02809", "K02777", "K02790", "K02817", "K02818", "K02777", "K11191", "K02802", "K02803", "K02763", "K02764", "K02778", "K02793", "K02794", "K11194", "K11195", "K02777", "K02778", "K02802", "K02803", "K02790", "K02763", "K02764", "K02808", "K02809", "K02755", "K02756", "K02752", "K02817", "K02818", "K11191", "K02749", "K02786", "K02787", "K02759", "K02760", "K02798", "K02799", "K11198", "K11199", "K02793", "K02794", "K11194", "K11195", "K02812", "K02813", "K02744", "K02745", "K10984", "K17464", "K17465", "K02781", "K02782", "K02773", "K02774", "K02821", "K02822", "K02768", "K02769", "K02806"],
    "3.2.1.86": ["K01222", "K01223"],
    "3.4.21.92": ["K01358"],
    "3.2.1.84": ["K05546", "K05546"],
    "3.2.1.85": ["K01220"],
    "3.2.1.80": ["K03332"],
    "1.10.2.2": ["K00411", "K00411", "K00411", "K00411", "K00411", "K00411", "K00411"],
    "2.3.1.150": ["K13393"],
    "2.3.1.153": ["K12936"],
    "1.10.2.-": ["K03886"],
    "2.3.1.157": ["K04042"],
    "2.3.1.159": ["K12644"],
    "2.3.1.158": ["K00679"],
    "3.4.22.68": ["K03345", "K03345"],
    "3.4.22.62": ["K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399", "K04399"],
    "3.4.22.63": ["K04400", "K04400", "K04400", "K04400", "K04400"],
    "3.4.22.60": ["K04397", "K04397", "K04397", "K04397", "K04397", "K04397"],
    "3.4.11.23": ["K07751"],
    "1.2.5.1": ["K00156"],
    "3.4.24.83": ["K08645"],
    "3.5.1.32": ["K01451"],
    "3.2.1.147": ["K01237"],
    "3.5.1.31": ["K01450", "K01450"],
    "6.3.1.9": ["K01833"],
    "6.3.1.8": ["K01917", "K01460"],
    "3.2.1.141": ["K01236"],
    "6.3.1.5": ["K01916"],
    "3.5.1.38": ["K05597", "K05597", "K05597", "K05597"],
    "6.3.1.1": ["K01914", "K01914", "K01914"],
    "6.3.1.2": ["K01915", "K01915", "K01915", "K01915", "K01915", "K01915", "K01915", "K01915"],
    "3.4.24.24": ["K01398", "K01398", "K01398", "K01398", "K01398", "K01398"],
    "3.4.24.25": ["K08604", "K08604"],
    "2.1.1.222": ["K00568"],
    "3.4.24.23": ["K01397"],
    "6.3.3.4": ["K12674"],
    "6.3.3.3": ["K01935"],
    "6.3.3.2": ["K01934"],
    "6.3.3.1": ["K11787", "K11788", "K01933", "K11787"],
    "6.3.5.1": ["K01950"],
    "6.3.5.3": ["K01952"],
    "6.3.5.2": ["K01951", "K01951"],
    "6.3.5.5": ["K11540", "K11541", "K01954", "K01955", "K01956", "K11540", "K11541", "K01954", "K01955", "K01956"],
    "6.3.5.4": ["K01953"],
    "6.3.5.7": ["K02433", "K02434", "K02435", "K09482", "K03330"],
    "6.3.5.6": ["K02433", "K02434", "K02435"],
    "2.8.2.-": ["K11821", "K11821", "K09672", "K09673", "K09674", "K03193", "K02576", "K02577", "K02578", "K02579", "K02513", "K02514", "K08102", "K08103", "K09671", "K04745", "K04746", "K11821"],
    "5.5.1.-": ["K15943"],
    "5.5.1.4": ["K01858", "K01858"],
    "2.8.2.4": ["K01016"],
    "5.5.1.6": ["K01859"],
    "5.5.1.7": ["K01860", "K01860", "K01860"],
    "2.8.2.1": ["K01014"],
    "5.5.1.1": ["K01856", "K01856", "K01856", "K01856", "K01856"],
    "5.5.1.2": ["K01857", "K01857"],
    "2.8.2.2": ["K01015"],
    "5.5.1.8": ["K15098"],
    "5.5.1.9": ["K08246"],
    "2.8.2.30": ["K07809"],
    "3.4.22.49": ["K02365", "K02365", "K02365", "K02365"],
    "5.4.2.10": ["K03431"],
    "5.4.2.11": ["K01834", "K01834", "K01834", "K01837", "K01834", "K01834", "K01837"],
    "5.4.2.12": ["K15633", "K15634", "K15635", "K15633", "K15634", "K15635", "K15633", "K15634", "K15635", "K15633", "K15634", "K15635", "K15633", "K15634", "K15635"],
    "3.6.1.62": ["K16855", "K12613", "K16855"],
    "3.6.1.63": ["K06162"],
    "3.6.1.64": ["K16855", "K16855"],
    "2.1.1.131": ["K13540", "K05934", "K13541"],
    "2.1.1.130": ["K03394", "K13540"],
    "2.1.1.133": ["K05936"],
    "2.1.1.132": ["K00595"],
    "2.4.99.4": ["K00780", "K03368", "K00780", "K03368", "K03494", "K00780", "K03368", "K03368", "K00780"],
    "1.14.13.88": ["K13083", "K13083"],
    "1.14.13.89": ["K13260"],
    "1.14.13.80": ["K17721", "K17719", "K17719", "K17721", "K17719", "K17719", "K17719", "K17721", "K17719", "K17721", "K17719", "K17721"],
    "1.14.13.81": ["K04035"],
    "1.14.13.82": ["K03862", "K03863"],
    "1.14.13.83": ["K02229"],
    "1.14.13.84": ["K14520"],
    "1.14.11.18": ["K00477"],
    "2.4.99.14": ["K02527"],
    "2.4.99.15": ["K02527"],
    "2.4.99.16": ["K16147"],
    "2.4.99.10": ["K03792"],
    "1.16.8.1": ["K13786"],
    "2.4.99.12": ["K02527"],
    "2.4.99.13": ["K02527"],
    "3.1.6.13": ["K01136", "K01136"],
    "2.4.99.1": ["K00778", "K00779", "K00778", "K00779"],
    "2.4.99.18": ["K07151", "K07151", "K07151"],
    "3.1.6.14": ["K01137", "K01137"],
    "1.3.1.45": ["K05281"],
    "1.3.1.44": ["K00209", "K00209"],
    "1.3.1.43": ["K00220", "K00220", "K00220"],
    "1.3.1.42": ["K05894"],
    "3.1.1.64": ["K11158"],
    "6.2.1.22": ["K01910"],
    "3.1.1.61": ["K13924", "K03412", "K13491", "K03412", "K13924"],
    "2.4.99.8": ["K03371", "K03371", "K03371"],
    "2.4.99.9": ["K03370"],
    "2.7.13.-": ["K07706", "K12294", "K14509"],
    "3.2.1.76": ["K01217", "K01217"],
    "2.7.13.3": ["K07636", "K07768", "K07637", "K07638", "K07639", "K07640", "K07650", "K07641", "K07642", "K07643", "K07644", "K07645", "K07646", "K07647", "K07648", "K07649", "K07651", "K07652", "K07653", "K07654", "K07655", "K07656", "K11328", "K11520", "K07769", "K08479", "K10681", "K11629", "K11633", "K14980", "K14982", "K02491", "K07697", "K07698", "K13532", "K13533", "K07700", "K11637", "K07701", "K11691", "K11614", "K07704", "K08082", "K11640", "K07673", "K07674", "K07675", "K07677", "K07676", "K07678", "K07680", "K07679", "K07777", "K07778", "K07681", "K11617", "K07682", "K07683", "K11623", "K07708", "K13598", "K07709", "K07710", "K08475", "K10125", "K02668", "K11383", "K07711", "K03407", "K11354", "K07716", "K02489", "K11357", "K13587", "K10909", "K10916", "K15850", "K11711", "K13040", "K14986", "K10942", "K17060", "K11231", "K10715", "K07717", "K07718", "K11356", "K15011", "K11231", "K14489", "K03407", "K07716", "K11357", "K13587", "K10909", "K10916", "K10942", "K07679"],
    "1.1.1.309": ["K12904"],
    "2.7.7.64": ["K12447", "K12447", "K12447"],
    "2.3.-.-": ["K05283", "K12632", "K10915"],
    "2.7.7.65": ["K11444"],
    "2.7.7.62": ["K02231"],
    "6.6.1.2": ["K02230", "K09882", "K09883"],
    "2.7.7.63": ["K03800"],
    "4.3.1.-": ["K17468"],
    "4.2.3.46": ["K14173"],
    "4.1.2.29": ["K03339"],
    "2.7.7.60": ["K00991", "K12506"],
    "4.1.2.25": ["K13939", "K13940", "K01633"],
    "4.3.3.7": ["K01714", "K01714"],
    "4.3.3.6": ["K06215", "K08681"],
    "4.1.2.21": ["K01631"],
    "4.1.2.20": ["K01630"],
    "4.1.2.22": ["K01632"],
    "1.5.8.3": ["K00314"],
    "5.1.-.-": ["K15857"],
    "4.3.1.7": ["K03735", "K03736"],
    "4.3.1.4": ["K13990", "K13990", "K01746"],
    "4.3.1.3": ["K01745"],
    "4.3.1.2": ["K04835"],
    "4.3.1.1": ["K01744"],
    "6.3.2.2": ["K11204", "K01919"],
    "6.2.1.26": ["K01911", "K14760"],
    "3.7.1.3": ["K01556"],
    "6.3.2.3": ["K01920"],
    "4.1.3.40": ["K03181"],
    "3.7.1.5": ["K01557", "K16164"],
    "4.3.1.12": ["K01750", "K01750"],
    "3.5.1.107": ["K13995"],
    "3.5.1.106": ["K15357"],
    "4.3.1.17": ["K01752", "K01752", "K01752", "K17989", "K01752", "K17989", "K17989"],
    "1.1.1.149": ["K05295"],
    "3.5.1.102": ["K14653"],
    "1.1.1.146": ["K15680", "K15680", "K15680"],
    "4.3.1.19": ["K01754", "K01754", "K01754", "K17989", "K17989", "K01754", "K17989"],
    "2.7.7.69": ["K14190"],
    "3.5.1.108": ["K16363", "K16363", "K02535", "K16363"],
    "1.1.1.141": ["K00069"],
    "1.1.1.140": ["K00068"],
    "2.5.1.57": ["K05304"],
    "2.5.1.56": ["K05304", "K01654"],
    "2.5.1.55": ["K01627"],
    "2.5.1.54": ["K01626", "K03856", "K13853", "K01626", "K03856", "K13853"],
    "2.7.3.3": ["K00934"],
    "2.7.3.2": ["K00933"],
    "6.3.2.5": ["K01922", "K13038"],
    "2.5.1.59": ["K05955"],
    "1.3.1.33": ["K00218"],
    "2.7.7.71": ["K15669"],
    "2.7.7.70": ["K03272"],
    "2.7.7.73": ["K03148", "K03148"],
    "2.7.7.72": ["K00974"],
    "2.7.7.75": ["K03831", "K15376"],
    "2.7.7.74": ["K07281"],
    "1.-.-.-": ["K10529", "K08351", "K04036", "K11337", "K15972", "K12628", "K10678", "K10679", "K10680", "K04727", "K10133"],
    "4.2.1.134": ["K10703", "K10703", "K10703"],
    "5.3.2.5": ["K08965"],
    "1.14.13.17": ["K00489", "K00489", "K00489", "K00489"],
    "1.1.1.77": ["K00048", "K00048"],
    "5.3.2.1": ["K07253", "K07253"],
    "6.3.4.5": ["K01940", "K01940", "K01940"],
    "1.1.1.79": ["K00049", "K12972", "K00049", "K12972", "K12972", "K00049"],
    "2.9.1.2": ["K03341", "K03341"],
    "1.14.13.11": ["K00487", "K00487", "K00487", "K00487", "K00487"],
    "2.7.1.-": ["K05878", "K05879", "K02850", "K02848", "K15892", "K15486"],
    "3.1.1.59": ["K01063"],
    "2.7.1.5": ["K00848", "K00848"],
    "2.7.1.4": ["K00847", "K00847", "K00847"],
    "2.7.1.6": ["K00849", "K00849"],
    "2.7.1.1": ["K00844", "K00844", "K00844", "K00844", "K00844", "K00844", "K00844", "K00844", "K00844", "K00844", "K00844", "K00844"],
    "2.7.1.3": ["K00846"],
    "2.7.1.2": ["K12407", "K00845", "K12407", "K00845", "K12407", "K00845", "K12407", "K00845", "K00845", "K12407", "K12407", "K00845", "K12407", "K00845", "K12407", "K12407", "K12407", "K12407", "K12407"],
    "1.1.1.193": ["K00082", "K11752"],
    "1.14.13.174": ["K17645"],
    "1.9.3.1": ["K02277", "K02276", "K02274", "K15408", "K02275", "K02256", "K00404", "K15862", "K00404", "K15862", "K02256", "K02256", "K02256", "K02256", "K02256"],
    "6.2.1.39": ["K13559"],
    "6.2.1.30": ["K01912"],
    "6.2.1.31": ["K16876"],
    "6.2.1.32": ["K08295"],
    "6.2.1.33": ["K14417"],
    "6.2.1.36": ["K14469", "K15018", "K14469", "K15018"],
    "1.13.11.66": ["K15240"],
    "2.7.1.76": ["K15519", "K10353", "K15519"],
    "2.7.1.74": ["K00893", "K15519", "K00893", "K15519"],
    "2.7.1.73": ["K00892"],
    "2.7.1.72": ["K12570"],
    "2.7.1.71": ["K13830", "K13829", "K00891", "K13830", "K13829", "K00891"],
    "2.7.1.78": ["K14399"],
    "3.2.1.91": ["K01225"],
    "4.1.1.21": ["K01587", "K11808"],
    "3.2.1.93": ["K01226"],
    "4.1.1.23": ["K13421", "K01591", "K13421"],
    "4.1.1.25": ["K01592", "K01592"],
    "3.2.1.96": ["K01227"],
    "4.1.1.28": ["K01593", "K01593", "K01593", "K01593", "K01593", "K01593", "K01593", "K01593", "K01593", "K01593", "K01593", "K01593"],
    "4.1.1.29": ["K01594"],
    "1.13.11.69": ["K17913"],
    "4.1.1.-": ["K10622", "K16838", "K13484", "K13485", "K16840", "K13747", "K12732", "K03182", "K03186", "K17942", "K12468", "K16838", "K10622", "K14422", "K10622"],
    "3.4.22.36": ["K01370", "K01370", "K01370", "K01370", "K01370", "K01370", "K01370"],
    "3.2.1.31": ["K01195", "K14756", "K01195", "K14756", "K01195", "K01195", "K01195", "K01195", "K01195", "K14756"],
    "1.3.8.8": ["K00255", "K00255", "K00255"],
    "4.1.1.9": ["K01578", "K01578", "K01578"],
    "4.1.1.8": ["K01577"],
    "3.4.22.38": ["K01371", "K01371", "K01371", "K01371"],
    "4.1.1.5": ["K01575", "K01575"],
    "4.1.1.4": ["K01574", "K01574"],
    "4.1.99.11": ["K07540", "K07540"],
    "4.1.1.6": ["K17724"],
    "4.1.1.1": ["K01568"],
    "4.1.99.16": ["K10187"],
    "4.1.1.3": ["K01571", "K01572", "K01573", "K01571", "K01572", "K01573"],
    "4.1.1.2": ["K01569"],
    "3.4.22.53": ["K03853", "K03853", "K03853", "K03853"],
    "3.4.22.52": ["K01367", "K01367", "K01367"],
    "3.4.22.51": ["K08571"],
    "3.2.1.35": ["K01197"],
    "4.1.3.6": ["K01643", "K01644", "K01646", "K01646", "K01644", "K01643"],
    "3.4.22.59": ["K04396"],
    "4.1.3.4": ["K01640", "K01640", "K01640", "K01640", "K01640"],
    "4.1.3.3": ["K01639"],
    "2.4.1.214": ["K00753"],
    "4.1.3.1": ["K01637", "K01637"],
    "3.5.2.5": ["K01466", "K16842"],
    "1.1.1.153": ["K00072"],
    "4.1.3.-": ["K02500", "K01663", "K02500", "K01663"],
    "3.5.2.6": ["K17836", "K17837", "K01467", "K17838", "K17836", "K01467"],
    "3.5.2.3": ["K11540", "K01465", "K11540"],
    "3.5.2.2": ["K01464", "K01464", "K01464", "K01464"],
    "3.4.21.70": ["K01345", "K01345"],
    "3.4.21.71": ["K01346", "K01346"],
    "3.4.21.73": ["K01348", "K01348", "K01348", "K01348", "K01348"],
    "3.5.2.9": ["K01469"],
    "4.1.1.48": ["K01656", "K13501", "K01609", "K13498", "K01656", "K13501", "K01609", "K13498"],
    "3.4.21.77": ["K01351", "K01351"],
    "3.5.1.25": ["K02079", "K01443"],
    "3.5.1.24": ["K01442", "K01442"],
    "3.5.1.26": ["K01444", "K01444"],
    "3.5.1.23": ["K12348", "K12349", "K01441", "K12348"],
    "2.4.1.174": ["K00746"],
    "2.4.1.175": ["K00746", "K13499", "K00747", "K13500"],
    "1.6.1.1": ["K00322"],
    "2.4.1.170": ["K13263"],
    "2.1.1.234": ["K13311"],
    "2.1.1.235": ["K13307"],
    "2.1.1.239": ["K13320", "K13320"],
    "3.4.23.36": ["K03101"],
    "3.4.23.34": ["K01382"],
    "1.3.3.4": ["K00231"],
    "1.3.3.5": ["K08100"],
    "1.3.3.6": ["K00232", "K00232", "K00232", "K00232", "K00232", "K00232"],
    "1.3.3.3": ["K00228"],
    "3.6.3.40": ["K09693"],
    "3.6.3.41": ["K02193"],
    "1.3.3.9": ["K13400"],
    "1.5.-.-": ["K00318", "K11394"],
    "1.11.1.11": ["K00434", "K00434"],
    "1.11.1.12": ["K05361"],
    "2.1.1.125": ["K02516", "K02516"],
    "2.1.1.122": ["K13396"],
    "2.1.1.128": ["K13383"],
    "1.14.13.99": ["K07439"],
    "1.14.13.98": ["K07440"],
    "1.14.13.97": ["K17689", "K17689", "K17689", "K17689", "K17689", "K17689", "K17689"],
    "1.14.13.95": ["K07431", "K07431"],
    "2.7.-.-": ["K05285", "K05287", "K05310", "K06375"],
    "3.2.1.175": ["K15748"],
    "1.14.13.90": ["K09838"],
    "1.14.21.4": ["K13391"],
    "1.14.21.5": ["K13399"],
    "1.14.21.6": ["K00227"],
    "1.14.21.1": ["K13395"],
    "1.14.21.3": ["K13387"],
    "1.14.21.-": ["K13389"],
    "1.3.1.78": ["K15226", "K15227", "K15226", "K15227"],
    "1.4.99.5": ["K10814", "K10815", "K10816"],
    "1.3.1.72": ["K09828"],
    "1.3.1.70": ["K00222"],
    "1.3.1.71": ["K00223"],
    "1.3.1.76": ["K02302", "K02304"],
    "1.3.1.77": ["K08695"],
    "1.3.7.2": ["K05369"],
    "1.3.7.3": ["K05370"],
    "1.3.7.4": ["K08101"],
    "1.3.7.5": ["K05371"],
    "1.3.7.7": ["K04037", "K04038", "K04039"],
    "1.3.7.8": ["K04112", "K04113", "K04114", "K04115", "K04112", "K04113", "K04114", "K04115"],
    "1.3.7.9": ["K04107", "K04108", "K04109", "K04107", "K04108", "K04109", "K04107", "K04108", "K04109"],
    "3.13.1.1": ["K06118", "K06118"],
    "4.2.3.35": ["K14046"],
    "1.3.5.2": ["K00254"],
    "1.3.5.3": ["K00230"],
    "2.4.1.198": ["K03857"],
    "1.3.5.1": ["K00234", "K00235", "K00234", "K00235", "K00234", "K00235", "K00234", "K00235", "K00234", "K00235", "K00234", "K00235", "K00234", "K00235"],
    "1.3.5.6": ["K00514"],
    "4.1.99.-": ["K01670", "K15567", "K15568", "K11782", "K01670", "K15567", "K15568"],
    "1.3.5.5": ["K02293"],
    "2.1.1.114": ["K00591"],
    "2.5.1.111": ["K12707"],
    "2.4.1.195": ["K11820", "K11820", "K11820"],
    "2.3.1.217": ["K13234", "K17211"],
    "1.14.13.-": ["K12154", "K12155", "K15760", "K15761", "K15763", "K15764", "K10616", "K16242", "K15768", "K15769", "K07415", "K17689", "K07415", "K17721", "K17709", "K17719", "K17719", "K17721", "K07415", "K17689", "K00492", "K10437", "K16265", "K17683", "K17709", "K17719", "K17689", "K03185", "K03184", "K06126", "K06134", "K02294", "K09587", "K12639", "K00492", "K15950", "K15966", "K15506", "K13267", "K17683", "K12154", "K12155", "K16242", "K10215", "K00492", "K16242", "K00492", "K15243", "K15244", "K15246", "K16242", "K15760", "K15761", "K15763", "K15764", "K00492", "K15768", "K15769", "K10616", "K14481", "K14482", "K10437", "K00492", "K00492", "K00492", "K17719", "K17689", "K17709", "K17683", "K07415", "K17719", "K17689", "K17721", "K17709", "K07415", "K17683", "K17689", "K17683", "K17719", "K17721", "K17689", "K17719", "K17721", "K17683", "K07415", "K07415"],
    "1.14.13.7": ["K03380", "K03380", "K03380"],
    "1.14.13.2": ["K00481", "K00481"],
    "1.14.13.1": ["K00480", "K00480", "K00480", "K00480"],
    "1.14.13.9": ["K00486"],
    "1.14.13.8": ["K00485", "K00485"],
    "1.5.1.8": ["K00291", "K14157"],
    "1.14.11.4": ["K00473", "K13645", "K13646", "K13647", "K13646"],
    "1.14.11.1": ["K00471"],
    "1.14.11.2": ["K00472"],
    "3.6.4.12": ["K03139", "K10843", "K10844", "K03654", "K02314", "K02540", "K02541", "K02212", "K02209", "K02542", "K02210", "K10742", "K03657", "K10843", "K10844", "K03657", "K03550", "K03551", "K03655", "K10901", "K15362", "K10901", "K04494", "K02540", "K02541", "K02212", "K02209", "K02542", "K02210", "K02540", "K02541", "K02212", "K02209", "K02542", "K02210", "K02314", "K02540", "K02541", "K02212", "K02209", "K02542", "K02210", "K11643"],
    "3.6.4.13": ["K12811", "K12812", "K12813", "K12814", "K12815", "K12818", "K12820", "K12823", "K12835", "K12854", "K12858", "K13025", "K13131", "K13025", "K12812", "K13025", "K12812", "K12598", "K14442", "K12614", "K03732", "K11927", "K05592", "K12647", "K11594", "K12823", "K12823", "K11594", "K12647", "K12647", "K12812", "K11594", "K12647", "K12647"],
    "1.5.1.2": ["K00286", "K00286"],
    "1.5.1.3": ["K13998", "K00287", "K13998", "K13938", "K00287", "K13998", "K13938"],
    "1.14.11.9": ["K00475"],
    "1.14.11.8": ["K00474"],
    "1.5.1.6": ["K00289"],
    "1.5.1.7": ["K00290", "K00290", "K00290"],
    "4.2.3.108": ["K07385"],
    "1.5.1.-": ["K10714", "K10714", "K09024", "K13938", "K13938", "K14631", "K13562"],
    "1.14.11.-": ["K06912", "K10674", "K06912", "K09592", "K09592", "K11449", "K11447", "K09592"],
    "1.13.11.-": ["K10621", "K16270", "K14751", "K15749", "K15754", "K15755", "K15242", "K11943", "K11944", "K11945", "K08021", "K08022", "K15777", "K10621", "K15065", "K15242", "K15247", "K15253", "K16270", "K10621", "K14751", "K15749", "K15754", "K15755", "K11943", "K11944", "K11945", "K08021", "K08022"],
    "1.13.11.58": ["K15718"],
    "1.13.11.59": ["K17842"],
    "1.3.-.-": ["K00258", "K00258"],
    "1.13.11.52": ["K00463", "K00463"],
    "1.13.11.53": ["K08967"],
    "1.13.11.51": ["K09840"],
    "1.13.11.56": ["K14583", "K14583"],
    "1.13.11.57": ["K04099"],
    "1.13.11.54": ["K08967"],
    "1.13.11.55": ["K16952"],
    "3.1.4.39": ["K01122"],
    "1.13.11.8": ["K04100", "K04101", "K04100", "K04101", "K04100", "K04101"],
    "1.13.11.4": ["K00450"],
    "1.13.11.5": ["K00451", "K00451"],
    "1.13.11.6": ["K00452"],
    "3.1.4.35": ["K13762", "K08718", "K13756", "K13757", "K13763", "K13761", "K13298", "K08718", "K13756", "K13298"],
    "1.13.11.1": ["K03381", "K03381", "K03381", "K03381", "K03381"],
    "1.13.11.2": ["K00446", "K00446", "K00446", "K00446", "K00446"],
    "1.13.11.3": ["K00448", "K00449", "K00448", "K00449", "K00448", "K00449"],
    "1.1.99.21": ["K08261"],
    "4.3.1.24": ["K10775", "K10775"],
    "4.2.1.79": ["K01720"],
    "3.5.1.112": ["K13551", "K17078"],
    "4.3.1.23": ["K10774"],
    "3.5.1.110": ["K09020"],
    "1.1.1.157": ["K00074", "K00074", "K00074"],
    "3.4.11.9": ["K14208"],
    "3.4.11.5": ["K01259", "K11142", "K11142"],
    "1.13.11.46": ["K16421"],
    "3.4.11.1": ["K11142", "K11142", "K01255"],
    "3.4.11.3": ["K01257"],
    "3.4.11.2": ["K11140", "K01256", "K11140", "K11140"],
    "6.3.2.32": ["K14940"],
    "3.4.17.2": ["K01291", "K01291"],
    "3.4.17.1": ["K08780", "K08779", "K08780", "K08779", "K08780"],
    "2.3.1.35": ["K00620", "K00620", "K00620"],
    "1.8.98.1": ["K03388", "K03389", "K03390", "K08264", "K08265", "K03388", "K03389", "K03390", "K08264", "K08265"],
    "2.7.1.23": ["K00858"],
    "6.3.2.36": ["K09722"],
    "5.4.99.32": ["K15811"],
    "4.2.1.144": ["K16016"],
    "2.7.7.8": ["K00962", "K00962", "K00962"],
    "6.3.2.34": ["K12234"],
    "4.2.1.143": ["K17646"],
    "4.2.1.142": ["K17646"],
    "4.2.1.75": ["K01719", "K13542", "K13543"],
    "1.1.1.67": ["K00045"],
    "1.1.1.65": ["K05275"],
    "1.1.1.64": ["K04119", "K10207", "K04119", "K04119"],
    "1.1.1.62": ["K10251", "K10251", "K13373", "K00044", "K13368", "K13369", "K13373", "K13370", "K10251", "K10251", "K13369", "K00044", "K13368", "K13373"],
    "1.1.1.61": ["K00043"],
    "1.1.1.60": ["K00042"],
    "3.4.23.-": ["K04505", "K04505", "K04522", "K08565", "K04505", "K04522", "K04505", "K04522"],
    "3.4.23.5": ["K01379", "K01379"],
    "1.14.11.19": ["K05277"],
    "3.4.21.4": ["K01312", "K01312", "K01312", "K01312"],
    "3.4.21.5": ["K01313", "K01313", "K01313"],
    "3.4.13.-": ["K01270", "K15428"],
    "3.4.21.7": ["K01315", "K01315", "K01315", "K01315"],
    "2.5.1.58": ["K05955", "K05954"],
    "2.7.7.6": ["K03040", "K03043", "K03046", "K13797", "K03060", "K03042", "K03041", "K03044", "K03045", "K13798", "K03053", "K03055", "K03058", "K03047", "K03049", "K03050", "K03056", "K03059", "K03051", "K03052", "K03054", "K02999", "K03002", "K03006", "K03010", "K03018", "K03021", "K03040", "K03043", "K03046", "K13797", "K03060", "K03042", "K03041", "K03044", "K03045", "K13798", "K03053", "K03055", "K03058", "K03047", "K03049", "K03050", "K03056", "K03059", "K03051", "K03052", "K03054", "K02999", "K03002", "K03006", "K03010", "K03018", "K03021", "K03040", "K03043", "K03046", "K13797", "K03060", "K03042", "K03041", "K03044", "K03045", "K13798", "K03053", "K03055", "K03058", "K03047", "K03049", "K03050", "K03056", "K03059", "K03051", "K03052", "K03010", "K03006", "K03021", "K03018", "K03002", "K02999", "K03018", "K03021", "K03006", "K03010", "K03006", "K03006", "K03010", "K03018", "K03021"],
    "2.5.1.68": ["K12503"],
    "2.5.1.62": ["K04040"],
    "3.4.21.-": ["K07259", "K09647", "K09648", "K08477", "K08372", "K06249", "K06249", "K06249", "K03992", "K09632", "K09632", "K08665", "K12688", "K03992"],
    "2.5.1.61": ["K01749"],
    "2.5.1.66": ["K12673"],
    "2.5.1.65": ["K10150", "K10150", "K10150", "K10150"],
    "2.7.1.48": ["K00876", "K00876"],
    "2.7.1.49": ["K00877", "K00941", "K14153"],
    "1.14.18.1": ["K00505", "K00505", "K00505", "K00505", "K00505"],
    "2.7.1.43": ["K16190", "K16190", "K16190"],
    "2.7.1.40": ["K00873", "K12406", "K00873", "K12406", "K00873", "K12406", "K00873", "K12406", "K00873", "K12406", "K12406", "K00873", "K00873", "K12406", "K12406", "K12406"],
    "6.2.1.20": ["K01909", "K05939", "K05939"],
    "2.7.1.46": ["K12446"],
    "2.7.1.47": ["K00875"],
    "6.2.1.25": ["K04105", "K04105", "K04110", "K04110", "K04105"],
    "2.7.1.45": ["K00874", "K00874"],
    "3.5.1.1": ["K01424", "K01424"],
    "5.4.3.8": ["K01845"],
    "5.4.3.5": ["K17898", "K17899"],
    "5.4.3.3": ["K01844"],
    "5.4.3.2": ["K01843"],
    "1.1.3.21": ["K00105"],
    "4.1.1.32": ["K01596", "K01596", "K01596", "K01596", "K01596", "K01596", "K01596", "K01596", "K01596"],
    "4.1.1.31": ["K01595", "K01595", "K01595", "K01595", "K01595"],
    "4.1.1.37": ["K01599"],
    "4.1.1.36": ["K01598", "K13038"],
    "4.1.1.35": ["K08678", "K08678"],
    "1.21.3.6": ["K13079"],
    "4.1.1.39": ["K01601", "K01602", "K01601", "K01602", "K01601", "K01602"],
    "2.3.1.176": ["K08764", "K08764", "K08764"],
    "2.3.1.175": ["K12747"],
    "2.3.1.174": ["K07823"],
    "2.3.1.172": ["K12934"],
    "2.3.1.171": ["K12931"],
    "1.8.99.3": ["K11180", "K11181", "K11180", "K11181"],
    "2.3.1.179": ["K09458", "K09458", "K09458"],
    "2.3.1.178": ["K06718"],
    "3.4.22.41": ["K01373"],
    "3.4.22.42": ["K01374"],
    "3.4.22.43": ["K01375"],
    "2.4.1.202": ["K13227", "K13228"],
    "2.4.1.203": ["K13492"],
    "2.4.1.201": ["K13748", "K13748"],
    "2.4.1.206": ["K03766"],
    "2.4.1.207": ["K14504"],
    "1.3.1.60": ["K14582", "K14582", "K14582"],
    "1.14.13.168": ["K11816"],
    "1.14.13.169": ["K04713"],
    "2.1.2.13": ["K10011"],
    "2.1.2.10": ["K00605", "K00605", "K00605"],
    "2.1.2.11": ["K00606"],
    "3.1.3.88": ["K13555"],
    "2.1.1.201": ["K03183", "K06127"],
    "1.14.12.20": ["K13071"],
    "1.14.12.22": ["K15751", "K15751"],
    "2.3.1.89": ["K05822", "K05822"],
    "2.3.1.86": ["K00668", "K00667", "K00668", "K00667"],
    "2.3.1.87": ["K00669"],
    "3.6.3.55": ["K06857", "K15497"],
    "2.3.1.85": ["K00665", "K00665", "K00665"],
    "4.2.3.38": ["K14177"],
    "4.2.3.39": ["K14176"],
    "5.5.1.23": ["K15943"],
    "2.1.1.118": ["K13398"],
    "4.2.3.30": ["K14038"],
    "4.2.3.32": ["K14041"],
    "3.6.1.45": ["K11751", "K11751", "K11751"],
    "4.2.3.34": ["K14045"],
    "3.6.1.43": ["K07252"],
    "3.6.1.40": ["K01524"],
    "3.6.1.41": ["K01525"],
    "2.5.1.29": ["K00804", "K13789", "K13787"],
    "1.14.13.63": ["K10438"],
    "1.14.13.67": ["K17689", "K17689", "K17689", "K17689", "K17689", "K17689", "K17689"],
    "3.2.1.165": ["K15855"],
    "1.14.13.68": ["K13029"],
    "1.14.11.13": ["K04125"],
    "1.1.1.-": ["K14465", "K10978", "K10978", "K07538", "K07535", "K00100", "K02474", "K12451", "K15858", "K00100", "K16043", "K16044", "K14465", "K10978", "K00071", "K00100", "K16066", "K09019", "K10978", "K17750", "K11150", "K11151", "K11154", "K12420", "K14248", "K15883", "K05556", "K14633", "K15944", "K14248", "K12451", "K07538", "K07535", "K00100", "K00100", "K00071"],
    "1.1.1.4": ["K00004", "K03366"],
    "1.1.1.6": ["K00005"],
    "1.1.1.1": ["K00121", "K13953", "K13954", "K00001", "K00121", "K04072", "K13951", "K13980", "K00121", "K13952", "K04072", "K13953", "K13954", "K00001", "K04072", "K04072", "K00121", "K13951", "K13980", "K00121", "K13952", "K04072", "K13953", "K13954", "K00001", "K11440", "K13951", "K13980", "K00121", "K13952", "K04072", "K13953", "K13954", "K00001", "K13951", "K13980", "K00121", "K13952", "K13953", "K00001", "K04072", "K13953", "K13954", "K00001", "K00121", "K04072", "K04072", "K04072", "K13953", "K13954", "K00001", "K00121", "K04072", "K13951", "K13980", "K00121", "K13952", "K13953", "K00001", "K13951", "K13980", "K00121", "K13952", "K13953", "K00001", "K13951", "K13980", "K13952", "K00121"],
    "1.1.1.2": ["K00002", "K00002", "K00002", "K00002"],
    "1.1.1.3": ["K12524", "K12525", "K00003", "K12524", "K12525", "K00003", "K12524", "K12525", "K00003", "K00003", "K12524", "K12525"],
    "4.2.3.19": ["K04121"],
    "1.1.1.8": ["K00006"],
    "1.1.1.9": ["K05351"],
    "1.3.1.62": ["K04118"],
    "3.1.1.83": ["K14731", "K14731"],
    "3.1.1.82": ["K13544"],
    "3.1.1.85": ["K02170"],
    "3.1.1.84": ["K03927"],
    "3.1.3.83": ["K03273"],
    "3.1.3.82": ["K03273"],
    "3.1.3.87": ["K08966"],
    "3.1.3.86": ["K03084", "K15909", "K03084", "K15909", "K03084", "K15909", "K03084", "K03084", "K15909", "K15909"],
    "4.2.3.16": ["K15088"],
    "4.2.99.18": ["K10563", "K05522", "K03660", "K10773", "K10567", "K10568", "K10771", "K10772"]
}

# Finalization
finalize_service()
