__author__ = 'James Gurtowski <gurtowsk@cshl.edu> / Sri Ramakrishnan <sramakri@cshl.edu>'
__date__ = '1/23/13'

from collections import namedtuple

import time
import json
import os
import re
import sys
import base64
import logging
import ast
import StringIO
import uuid;
import math
from collections import namedtuple
from functools import wraps
from time import gmtime, strftime
from collections import OrderedDict
from operator import itemgetter
from thrift import Thrift
from thrift.transport import TSocket, TSSLSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from biokbase.Jnomics.jnomics_api import JnomicsData, JnomicsCompute
from biokbase.Jnomics.jnomics_api.ttypes import Authentication, JnomicsThriftException 
from biokbase.Jnomics.jnomics_api.ttypes import JnomicsThriftJobStatus, JnomicsThriftJobID , JnomicsThriftHandle

from biokbase.workspaceServiceDeluxe.Client import Workspace as workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.idserver.client import IDServerAPI
from biokbase.shock import Client as shockService
from biokbase.PlantExpressionService.Client import PlantExpression as expressionService
from biokbase.cdmi.client import CDMI_API,CDMI_EntityAPI
from biokbase.mglib import tab_to_matrix, sparse_to_dense
from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.narrative.common import kbtypes

from IPython.display import display, HTML

## Exceptions

class JnomicsException(Exception):
    pass


class ShockUploadException(Exception):
    pass


class SubmitException(Exception):
    pass

class FileNotFound(Exception):
    pass

VERSION = (0, 0, 1)
NAME = "VariationExpression"

POLL_SLEEP_INTERVAL=10

URL = namedtuple("URL",["host","port"])

Stage = namedtuple("Stage", ["func","name","poll"])


URLS = {"compute":URL("variation.services.kbase.us", 10000),
        "data":URL("variation.services.kbase.us", 10001)}

#URLS = {"compute":URL("mshadoop1.cshl.edu", 10000),
#        "data":URL("mshadoop1.cshl.edu", 10001)}

CLIENT_CLASSES = {"compute": JnomicsCompute.Client,
                  "data" : JnomicsData.Client}

class OTHERURLS:
    _host = '140.221.84.248'
    #shock = "http://shock1.chicago.kbase.us"
    shock = "https://kbase.us/services/shock-api"
    #shock = "http://shock.metagenomics.anl.gov"
    awe = "http://140.221.85.36:8000"
    workspace = "http://kbase.us/services/ws"
    #workspace = "http://140.221.84.209:7058"
    ids = "http://kbase.us/services/idserver"
    ontology = "http://140.221.85.171:7062"
    #cdmi  = "http://140.221.85.181:7032"
    cdmi = "https://kbase.us/services/cdmi_api"
    expression = "http://kbase.us/services/plant_expression"
    #expression = "http://{}:7075".format(_host)
    #workspace = "http://kbase.us/services/workspace"
    #invocation = "https://kbase.us/services/invocation"
    #invocation = "http://140.221.85.110:443"
    invocation = "http://140.221.85.185:7049"

class WSTYPES:
    ### Variation workspace types
    var_sampletype = 'KBaseGwasData.VariationSample'
    var_vcftype = 'KBaseGwasData.VariantCall'

    ### RNASeq workspace types
    rnaseq_sampletype = 'KBaseExpression.RNASeqSample'
    rnaseq_bamtype = 'KBaseExpression.RNASeqSampleAlignment'
    rnaseq_diffexptype = 'KBaseExpression.RNASeqDifferentialExpression'
    rnaseq_exptype =  'KBaseExpression.ExpressionSample'
    rnaseq_expseriestype = 'KBaseExpression.ExpressionSeries'
    datatabletype = 'MAK.FloatDataTable'

class IDServerids:
    ### variation
    var_vcf = 'kb|variant'
    ###RNASeq 
    rnaseq_expsample = 'kb|sample'
    rnaseq_series = 'kb|series'
    rnaseq_alignment = 'kb|alignment'
    rnaseq_difexp = 'kb|differentialExpression'
    dt_type = 'kb|dataTable'

# Init logging.
_log = logging.getLogger(__name__)
    
init_service(name = NAME, desc="Variation and Expression service", version = VERSION)

clients = {}

    
##
##Decorators for control logic
##

def _get_wsname(meth, ws):
    '''gets the workspace name
    '''
    if ws:
        return ws
    elif meth.workspace_id and (meth.workspace_id != 'null'):
        return meth.workspace_id
    else:
        return default_ws

def _get_shock_data(nodeid, binary=False):
    token = os.environ['KB_AUTH_TOKEN']
    shock = shockService(OTHERURLS.shock, token)
    return shock.download_to_string(nodeid, binary=binary)

def _get_ws(wsname, name, wtype,auth):
    #token = os.environ['KB_AUTH_TOKEN']
    ws = workspaceService(OTHERURLS.workspace)
    obj = ws.get_object({'auth': auth, 'workspace': wsname, 'id': name, 'type': wtype})
    data = None
    # Data format
    if 'data' in obj['data']:
        data = obj['data']['data']
    # Handle format
    elif 'shock_ref' in obj['data']:
        data = obj['data']['shock_ref']
    # Collection format
    elif 'members' in obj['data']:
        data = [m['ID'] for m in obj['data']['members']]
    # just return the whole thing
    else:
        data = obj['data']
    return data

def _output_object(name):
    """Format an object ID as JSON output, for returning from a narr. function.
    """
    return json.dumps({'output': name})

def to_JSON(self):
    return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

def dataClient(func):
    '''decorator for data client,
    opens data client connection and passes
    it to the func'''
    return lambda : clientWrap("data",func)

def computeClient(func):
    '''decorator for compute client,
    opens compute client connection and passes
    it to the func'''
    return lambda : clientWrap("compute",func)

def poller(pollfunc):
    '''decorator for polling logic'''
    @wraps(pollfunc)
    def polret(job_id, auth):
        status = False
        while not status:
            time.sleep(POLL_SLEEP_INTERVAL)
            status = pollfunc(job_id, auth)
        return status
    return polret

##
##data client functions

def listfiles(filepath, auth):
    client = openDataClientConnection()
    status = client.listStatus(filepath,auth)
    closeClientConnection(client)
    return to_JSON(status)

def isFileFound(filepath, auth):
    client = openDataClientConnection()
    status = client.listStatus(filepath,auth)
    closeClientConnection(client)
    if not status:
        return False
    return True

def writefile(filename,obj,auth):
    #features = genome + "_fids.txt"
    client = openDataClientConnection()
    fshandle = client.create(filename,auth)
    status = ""
    fsize = obj.len
    obj.seek(0)
    pos = 0
    while pos <= fsize :
        piece = obj.read(65536)
        #print piece
        if not piece:
                break
        pos = obj.tell()
        status = client.write(fshandle , piece , auth)
    client.close(fshandle,auth)
    closeClientConnection(client)
    return status

def cathdfsfile(samplefile,auth):
    client = openDataClientConnection()
    fshandle = client.open(samplefile,auth)
    status = client.read(fshandle , auth)
    client.close(fshandle,auth)
    closeClientConnection(client)
    return status

def parselog(jid,expression,auth):
    lsfiles = listfiles(".",auth)
    reg = re.compile('(.*?).o'+str(jid))
    lsfile = re.search(reg,lsfiles)
    if lsfile is None:
        return None
    lfile = str(lsfile.group(0)).split('path\"')[1].replace(': "','')
    contents = cathdfsfile(lfile,auth)
    if contents is None:
        return None
    line  = re.search(expression, contents)
    if line is None:
        return None
    return str(line.group(0))

def getGenomefeatures(ref,auth):
    gid = [ref]
    cdmic = CDMI_API(OTHERURLS.cdmi)
    gfids = cdmic.genomes_to_fids(gid,['CDS'])
    output = StringIO.StringIO()
    for item in gfids.values():
        locs = cdmic.fids_to_locations(item)
        for key in locs.keys():
                #       print(locs[key][0][0] + "\t" + str(locs[key][0][1]) + "\t" + str(int(locs[key][0][1]) + int(locs[key][0][3])) + "\t" + locs[key][0][2] + "\t" + key,file = entityfile)
            print >>output, locs[key][0][0] + "\t" + str(locs[key][0][1]) + "\t" + str(int(locs[key][0][1]) + int(locs[key][0][3])) + "\t" + locs[key][0][2] + "\t" + key
    return output

def prepareInputfiles(token,workspace=None,files=None,wstype=None):
    auth = Authentication(userFromToken(token), "", token)
    json_error = None
    status = None
    job_ids = []
    meta = []
    ret_code = "FAILED"
    ws = workspaceService(OTHERURLS.workspace)
    files = files.split(",")
    for nfile in files:
        filename = os.path.basename(nfile)
        try: 
            obj = ws.get_object({'auth': token, 'workspace': workspace, 'id': filename, 'type': wstype})
        except FileNotFound as e:
            raise FileNotFound("File Not Found: {}".format(err))
        #return {"output" : str(status), "error": json_error}
        if 'data' in obj and 'shock_ref' in obj['data'] and 'shock_id' in  obj['data']['shock_ref']:
            node_id = obj['data']['shock_ref']['shock_id']
        if 'data' in obj and 'metadata' in obj['data']:
            meta.append(obj['data']['metadata'])
        shockfilename = filename.replace("|","_")
        job_ids.append(readShock(node_id,shockfilename,auth))
        
    for jid in job_ids:
        status = pollGridJob(jid, auth)
        if status and not status.running_state == 2:
            json_error = status.failure_info
    ret_code = "SUCCESS"
    return {"status" : ret_code ,"job_ids" : [x.job_id for x in job_ids] ,"metadata" : meta, "error": json_error}

def shockfileload(auth,filename=None,filepath=None):
    json_error = None
    status = None
    pattern =  re.compile("\[id=(.*?)]")
    try: 
        jobid = writeShock(filename,filepath,auth)
    except JnomicsThriftException as e:
        json_error = e.msg
    if json_error:
        return {"output" : str(status), "error": json_error}
    status = pollGridJob(jobid, auth)
    if status and not status.running_state == 2:
        json_error = status.failure_info
    sid =  parselog(str(jobid.job_id),pattern,auth)
    if not sid:
        json_error =  "Shock Upload Unsuccessful"
    shockid  = str(sid).rstrip().split('=')[1].replace(']','')
    if not shockid:
        json_error =  "Shock Upload Unsuccessful"
    
    return {"submitted" : filename , "shock_id" : shockid , "error": json_error}

def ws_saveobject(sampleid,data,wstype,wsid,token):
    ws = workspaceService(OTHERURLS.workspace)
    return  ws.save_object({'auth' : token ,
                            'workspace' : wsid ,
                            'id' : sampleid ,'type' : wstype ,
                            'data' :  data })

def writeShock(filename,filepath,auth):
    client = openComputeClientConnection()
    ret =  client.ShockWrite(filename,
                             filepath,
                             auth)
    closeClientConnection(client)
    return ret

def readShock(nodeid,filename,auth):
    client = openComputeClientConnection()
    ret =  client.ShockRead(nodeid,
                            filename,
                             auth)
    closeClientConnection(client)
    return ret

##
##Utility functions
##

@poller
def pollHadoopJob(job_id, auth):
    '''Returns status of Hadoop Job'''
    client = openComputeClientConnection()
    status = client.getJobStatus(job_id, auth)
    closeClientConnection(client)
    if status.complete:
        return status
    return False

@poller
def pollGridJob(job_id, auth):
    '''Returns status of grid job'''

    client = openComputeClientConnection()
    status = client.getGridJobStatus(job_id,auth)
    closeClientConnection(client)
    if status in ["DONE","FAILED"]:
        running_state = 1 if status =="FAILED" else 2
        return JnomicsThriftJobStatus(job_id.job_id,
                                      auth.username,
                                      status,
                                      True,running_state, -1, "-1",
                                      -1.0,-1.0)
    return False

@poller
def pollGridJobs(job_ids, auth):
    '''Returns status of grid job'''
    status = []
    ret = [] 
    running_state = [] 
    client = openComputeClientConnection()
    for jid in job_ids:
         status.append(client.getGridJobStatus(jid,auth))
    closeClientConnection(client)
    for i in len(status):
        if status[i] in ["DONE","FAILED"]:
            running_state[i] = 1 if status[i] =="FAILED" else 2
            ret.append(JnomicsThriftJobStatus(job_id.job_id,
                                      auth.username,
                                      status[i],
                                      True,running_state[i], -1, "-1",
                                      -1.0,-1.0))
    return ret

    #return False

def runSteps(step, auth, poll_func=None, previous_steps=None):
    '''Runs multiple pipeline step.
    'step' is expected to return a job id which can be polled, otherwise None
    'poll_func' function to poll the returned job id
    '''
    json_error = None
    status = []
    job_id = []

    try:
        job_ids = step(previous_steps)
    except JnomicsThriftException as e:
        json_error=e.msg
        
    if json_error:
        return {"output" : status, "error": json_error}

    if poll_func:
        status = poll_func(job_ids, auth)
    else:
        return {"output": job_ids, "error" : json_error}
    
    for k in status:
        if status[k] and not status[k].running_state == 2:
            json_error = status[k].failure_info

    return {"output" : status, "error": json_error}

def runStep(step, auth, poll_func=None, previous_steps=None):
    '''Runs a pipeline step.
    'step' is expected to return a job id which can be polled, otherwise None
    'poll_func' function to poll the returned job id
    '''
    json_error = None
    status = None
    job_id = None

    try:
        job_id = step(previous_steps)
    except JnomicsThriftException as e:
        json_error=e.msg
        
    if json_error:
        return {"output" : status, "error": json_error}

    if poll_func:
        status = poll_func(job_id, auth)
    else:
        return {"output": job_id, "error" : json_error}
    
    if status and not status.running_state == 2:
        json_error = status.failure_info

    return {"output" : status, "error": json_error}

def userFromToken(token):
    un,user = token.strip().split('|')[0].split('=')
    if not un == "un" or user == "":
        raise Exception, "Token is not in correct form"
    return user

def openClientConnection(client_class, url):
    transport = TSSLSocket.TSSLSocket(url.host, url.port,validate=False)
    transport = TTransport.TBufferedTransport(transport)

    protocol = TBinaryProtocol.TBinaryProtocol(transport)

    client = client_class(protocol)

    transport.open()

    clients[client] = transport
    return client
    
def openDataClientConnection():
    return openClientConnection(CLIENT_CLASSES["data"],URLS["data"])

def openComputeClientConnection():
    return openClientConnection(CLIENT_CLASSES["compute"],URLS["compute"])

def closeClientConnection(client):
    clients[client].close()
    del clients[client]

def pipelineStep(client_type = None):
    '''Decorator that wraps pipeline steps.
    All steps must subscribe to the interface
    step(client, previous_steps)'''

    def _dec(func):
        if not client_type:
            return lambda previous_steps : func(None, previous_steps)
        def _f(previous_steps):
            if client_type =="compute":
                client= openComputeClientConnection()
            elif client_type == "data":
                client = openDataClientConnection()
            else:
                raise Exception, "Unknown Client Type"
            d = func(client,previous_steps)
            closeClientConnection(client)
            return d
        return _f
    return _dec
    
    
def clientWrap(client_type, func):
    if client_type =="compute":
        client= openComputeClientConnection()
    elif client_type == "data":
        client = openDataClientConnection()
    else:
        raise Exception, "Unknown Client Type"
    d = func(client)
    closeClientConnection(client)
    return d

def runPipeline(stages,meth,auth):
    '''Runs pipeline stages'''
    meth.stages = len(stages)
    previous_steps = []
    for stage in stages:
        meth.advance(stage.name)
        stat = runStep(stage.func,auth,stage.poll, previous_steps)
        if not stat["error"] == None:
    		return to_JSON(stat)
        previous_steps.append(stat)
    return previous_steps


##
##Narrative Functions that will be displayed
##

@method(name = "Calculate Variatons")
def jnomics_calculate_variations(meth,workpace=None,Input_file=None,
                                 Input_organism=None):
    """Calculate variations
    :param workspace: name of workspace; default is current
    :type workspace: kbtypes.Unicode
    :ui_name workspace: Workspace
    :param Input_file: Input to the raw sequencing data (paired end, comma sep)
    :type Input_file: kbtypes.Unicode
    :param Input_organism: Input organism (kb_id)
    :type Input_organism: kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """

    #ws = workspaceService(OTHERURLS.workspace)
    #data = ws.get_object({'auth':meth.token, 'workspace':meth.workspace_id,
    #                      'id': Input_file, 'type':WSTYPES.var_sampletype})
    #return to_JSON(data)
    
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    wtype = WSTYPES.var_sampletype

    Output_file_path = "narrative_variation_"+ str(uuid.uuid4().get_hex().upper()[0:6])
    align_out_path = os.path.join(Output_file_path , "align")
    input_pe_path = os.path.join(Output_file_path, "input.pe")
    @pipelineStep("compute")
    def fastqToPE(client, previous_steps):
        return client.fastqtoPe(file1,
                                file2,
                                input_pe_path,
                                "",auth)

    
    @pipelineStep("compute")
    def runBowtie(client, previous_steps):
        return client.alignBowtie(input_pe_path,
                                  Input_organism,
                                  align_out_path,
                                  "",auth)
        
    snp_out_path = os.path.join(Output_file_path, "snps")
    
    @pipelineStep("compute")
    def runSNP(client, previous_steps):
        return client.snpSamtools(align_out_path,
                                  Input_organism,
                                  snp_out_path,
                                  auth)
    
    merge_outpath = os.path.join(Output_file_path, "output.vcf")
    @pipelineStep("compute")
    def runMerge(client, previous_steps):
        return client.mergeVCF(snp_out_path, align_out_path, merge_outpath, auth)
    
    filename = Input_file.replace(',','_')+".vcf"

    @pipelineStep(None)
    def writeShock(client, previous_steps):
        return shockfileload(auth,filename,
                                 merge_outpath)

    @pipelineStep(None)
    def writeWS(client, previous_steps):
        previous_steps = previous_steps[-1]
        #previous_job_id = previous_step["output"].job_id
        #pattern =  re.compile("\[id=(.*?)]")
        #shockid = parselog(previous_job_id,pattern,auth)
        #sid = str(shockid).rstrip().split('=')[1].replace(']','')
        if 'output' in previous_steps and 'shock_id' in previous_steps['output']:
            shock_id = previous_steps['output']['shock_id']
        idc = IDServerAPI(OTHERURLS.ids)
        name = 'kb|variant.'+str(idc.allocate_id_range(WSTYPES.var_vcftype,1))
        obj = { "name": name,
               "type": "vcf",
               "created":strftime("%d %b %Y %H:%M:%S +0000", gmtime()),
               "shock_ref":{ "shock_id" : shock_id,
                             "shock_url" : OTHERURLS.shock+"/"+shock_id },
               "metadata" : {
                             "source" : "test",
                             "source_id" : "test",
                             "base_count" : "50",
                             "paired" : "yes",
                             "assay" : "test",
                             "library" : "test",
                             "read_count" : "100",
                             "ref_genome" : "Ecoli",
                             "domain" : "Bacteria",
                             "ext_source_date" : "41717",
                             "sample_id" : "test11",
                             "title" : "Test upload",
                             "platform" : "Illumina"
                             },
               }

        return ws_saveobject(name,obj, WSTYPES.var_vcftype,meth.workspace_id,meth.token)

    meth.advance("Preparing Input files")
    ret  = prepareInputfiles(meth.token,meth.workspace_id,Input_file,wtype)
    file1 = Input_file.split(',')[0]
    file2 = Input_file.split(',')[1]
    stages = [Stage(fastqToPE,"Preparing PE",pollGridJob),
              Stage(runBowtie,"Aligning Reads",pollHadoopJob),
              Stage(runSNP,"Calling Variations",pollHadoopJob),
              Stage(runMerge,"Merging Output",None),
              Stage(writeShock,"Uploading Output To Shock",None),
              Stage(writeWS, "Uploading to Workspace", None)]

    #t=namedtuple("ff",["job_id"])
    #return to_JSON({"hello":writeWS([{"output":t("id=1425")}])})
    ret = runPipeline(stages,meth,auth)
    
    return to_JSON(ret[-1])
      
@method(name = "Calculate Gene Expression")
def jnomics_calculate_expression(meth, workspace = None,paired=None,
                                 Input_file_path=None,
                                 ref=None,src_id=None):
    """Calculate Expression

    :param workspace : name of workspace; default is current
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace
    :param paired : Paired-End say 'yes'; else 'no'; default is 'no'
    :type paired : kbtypes.Unicode
    :ui_name paired : Paired-End (?)
    :default paired : no
    :param Input_file_path: Input the raw sequencing data
    :type Input_file_path: kbtypes.Unicode
    :ui_name Input_file_path : Input files 
    :param ref: Reference Genome (kb_id)
    :type ref : kbtypes.Unicode
    :ui_name ref : Reference
    :param src_id: Source and Source Id
    :type src_id : kbtypes.Unicode
    :ui_name src_id : Source/Source Id
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """

    meth.stages = 7
    token = meth.token
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    ws = workspaceService(OTHERURLS.workspace)
    idc = IDServerAPI(OTHERURLS.ids)

    act_ref = ref.replace('|','_')

    wtype = WSTYPES.rnaseq_sampletype 
    exptype = WSTYPES.rnaseq_exptype 
    bamtype = WSTYPES.rnaseq_bamtype 
 
    node_id = None
    stats = []
    myfile = None
    sample_id = None

    @pipelineStep("compute")
    def runTophat(client,previous_steps):
        return client.alignTophat(act_ref, Input_file_path,
                                     "", tophat_out_path,
                                     "", "", auth)

    @pipelineStep("compute")
    def runCufflinks(client,previous_steps):
        return client.callCufflinks( cufflinks_in_path,
                                     cufflinks_out_path,
                                     "", "", "", auth)
        
    @pipelineStep("compute")
    def workspaceobj(client,previous_steps):
        previous_steps = previous_steps[-1]
        if 'output' in previous_steps and 'shock_id' in previous_steps['output']:
            shock_id = previous_steps['output']['shock_id']
        if not isFileFound(entityfile,auth):
            out = getGenomefeatures(ref,auth)
            ret = writefile(entityfile,out,auth) 
        ontodict = ontologydata(po_id,eo_id)
        ontoid = ",".join([ key for (key,value) in ontodict.items()])
        ontodef =  ",".join([value for (key,value) in ontodict.items()])
        ontoname = ontodef
        return client.workspaceUpload(cufflinks_output,ref.replace('kb|',''),
                                      desc,title,srcdate,ontoid,
                                      ontodef,ontoname,paired,
                                      shock_id,src_id.replace('/',' '),"",auth)
    @pipelineStep(None)
    def writeBamfile(client,previous_steps):
        tophatid  = idc.allocate_id_range(IDServerids.rnaseq_alignment,1)
        tophatobjname = IDServerids.rnaseq_alignment+"."+str(tophatid)
        filedata = shockfileload(auth,tophatobjname,cufflinks_in_path)
        objdata = { "name" : str(sample_id)+"_accepted_hits.bam" ,"paired" : paired , "created" :  strftime("%d %b %Y %H:%M:%S +0000", gmtime()) ,
                "shock_ref": { "shock_id" : filedata['shock_id']  , "shock_url" : OTHERURLS.shock+'/node/'+filedata['shock_id'] },"metadata" : ret['metadata'][0] }
        wsreturn = ws_saveobject(tophatobjname,objdata,bamtype,meth.workspace_id,meth.token)
        return wsreturn

    @pipelineStep(None)
    def uploadtoShock(client,previous_steps):
         return shockfileload(auth,cufflinksobjname,cufflinks_output)
    
    @pipelineStep(None)
    def saveWorkspace_obj(client,previous_steps):
        previous_steps = previous_steps[-1]
	json_error = None
        if 'output' in previous_steps:
            job_id =  previous_steps['output'].job_id
        pattern2 = re.compile('Writing the Expression object kb\|sample.[0-9]*')
        sampleid = parselog(str(job_id),pattern2,auth)
	if sampleid:
        	realid = sampleid.split('Writing the Expression object ')[1]
        #realid = 'kb\|sample.20064'
                result = cathdfsfile(realid,auth)
                jsonobj = json.loads(str(result))
                wsreturn = ws_saveobject(realid,jsonobj,exptype,meth.workspace_id,meth.token)
        else:
		json_error = previous_steps['output'].failure_info
        #    raise Exception , "Workspace obj generation Failed"
        return {"submitted" : realid , "type" : exptype , "status" : wsreturn , "error" :  json_error}

    def ontologydata(poid=None,eoid=None):
        exp =  expressionService(OTHERURLS.expression)
        #json_error = None
        #status = None
        poids = poid[0].split(",") 
        eoids = eoid[0].split(",")
        podesc = exp.get_po_descriptions(poids)
        eodesc = exp.get_eo_descriptions(eoids)
        ontoids = ",".join(poids + eoids)
        ontodef = ",".join([ value for (key,value) in podesc.items() ] + [value for (key1,value1) in eodesc.items()])
        return dict(podesc.items() + eodesc.items())
    
    meth.advance("Preparing Input files")
    ret  = prepareInputfiles(meth.token,workspace,Input_file_path,wtype)
    #return to_JSON(ret)
    if 'metadata' in ret:
        if 'sample_id' in ret['metadata'][0]:
            sample_id = ret['metadata'][0]['sample_id']
            title = sample_id
        if 'title' in  ret['metadata'][0]:
            desc =  ret['metadata'][0]['title']
        if 'ext_source_date' in  ret['metadata'][0]:
            srcdate = ret['metadata'][0]['ext_source_date']
        if 'po_id' in  ret['metadata'][0]:
            po_id = ret['metadata'][0]['po_id']
        if 'eo_id' in  ret['metadata'][0]:
            eo_id = ret['metadata'][0]['eo_id']
    
    Output_file_path = "narrative_RNASeq_"+str(sample_id)+'_'+ str(uuid.uuid4().get_hex().upper()[0:6])
    entityfile = str(act_ref) + "_fids.txt"
    tophat_out_path = os.path.join(Output_file_path, "tophat")
    cufflinks_in_path = os.path.join(tophat_out_path,"accepted_hits.bam")
    cufflinks_out_path = os.path.join(Output_file_path,"cufflinks")
    cufflinks_output =  os.path.join(cufflinks_out_path,"transcripts.gtf")
    cufflinksobjname = str(sample_id)+'_transcripts.gtf'

    stages= [Stage(runTophat,"Aligning Reads",pollGridJob),
             Stage(runCufflinks,"Assembling Transcripts",pollGridJob),
             Stage(writeBamfile,"Writing Alignment file",None),
             Stage(uploadtoShock,"Uploading to Shock",None),
             Stage(workspaceobj,"Preparing Workspace obj",pollGridJob),
             Stage(saveWorkspace_obj,"Saving Object",None)]
    
    ret = runPipeline(stages,meth,auth)
    return to_JSON(ret[-1])

@method(name = "Calculate Gene Expression - Batch Mode")
def jnomics_calculate_expression_batch(meth, workspace = None,paired=None,
                                 Input_file_path=None,
                                 ref=None,src_id=None):
    """Calculate Expression

    :param workspace : name of workspace; default is current
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace
    :param paired : Paired-End say 'yes'; else 'no'; default is 'no'
    :type paired : kbtypes.Unicode
    :ui_name paired : Paired-End (?)
    :default paired : no
    :param Input_file_path: Input the raw sequencing data
    :type Input_file_path: kbtypes.Unicode
    :ui_name Input_file_path : Input files 
    :param ref: Reference Genome (kb_id)
    :type ref : kbtypes.Unicode
    :ui_name ref : Reference
    :param src_id: Source and Source Id
    :type src_id : kbtypes.Unicode
    :ui_name src_id : Source/Source Id
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """

    meth.stages = 7
    token = meth.token
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    ws = workspaceService(OTHERURLS.workspace)
    idc = IDServerAPI(OTHERURLS.ids)

    act_ref = ref.replace('|','_')

    wtype = WSTYPES.rnaseq_sampletype 
    exptype = WSTYPES.rnaseq_exptype 
    bamtype = WSTYPES.rnaseq_bamtype 
 
    node_id = None
    stats = []
    myfile = None
    sample_id = None

    @pipelineStep("compute")
    def runTophat(client,previous_steps):
        previous_steps = previous_steps[-1]
        tohat_jobs = [] 
        i_files = Input_file_path.split(";")
        for ifile in i_files:
            tophat_out_path =  os.path.join(Output_file_path,ifile.replace(",","_")+"/tophat") 
            tophat_jobs = client.alignTophat(act_ref, Input_file_path,
                                     "", tophat_out_path,
                                     "", "", auth)
        return tophat_jobs

    @pipelineStep("compute")
    def runCufflinks(client,previous_steps):
         previous_steps = previous_steps[-1]
         cufflinks_jobs = [] 
         i_files = Input_file_path.split(";")
         for ifile in i_files:
             cufflinks_in_path = os.path.join(Output_file_path,ifile.replace(",","_")+"/tophat/accepted_hits.bam")
             cufflinks_out_path =  os.path.join(Output_file_path,ifile.replace(",","_")+"/cufflinks")
             cufflinks_jobs.append(client.callCufflinks( cufflinks_in_path,
                                     cufflinks_out_path,
                                     "", "", "", auth))
         return cufflinks_jobs
        
    @pipelineStep("compute")
    def workspaceobj(client,previous_steps):
        previous_steps = previous_steps[-1]
        if 'output' in previous_steps and 'shock_id' in previous_steps['output']:
            shock_id = previous_steps['output']['shock_id']
        if not isFileFound(entityfile,auth):
            out = getGenomefeatures(ref,auth)
            ret = writefile(entityfile,out,auth) 
        ontodict = ontologydata(po_id,eo_id)
        ontoid = ",".join([ key for (key,value) in ontodict.items()])
        ontodef =  ",".join([value for (key,value) in ontodict.items()])
        ontoname = ontodef
        return client.workspaceUpload(cufflinks_output,ref.replace('kb|',''),
                                      desc,title,srcdate,ontoid,
                                      ontodef,ontoname,paired,
                                      shock_id,"","",auth)
    @pipelineStep(None)
    def writeBamfile(client,previous_steps):
        tophatid  = idc.allocate_id_range(IDServerids.rnaseq_alignment,1)
        tophatobjname = IDServerids.rnaseq_alignment+"."+str(tophatid)
        filedata = shockfileload(auth,tophatobjname,cufflinks_in_path)
        objdata = { "name" : str(sample_id)+"_accepted_hits.bam" ,"paired" : paired , "created" :  strftime("%d %b %Y %H:%M:%S +0000", gmtime()) ,
                "shock_ref": { "shock_id" : filedata['shock_id']  , "shock_url" : OTHERURLS.shock+'/node/'+filedata['shock_id'] },"metadata" : ret['metadata'][0] }
        wsreturn = ws_saveobject(tophatobjname,objdata,bamtype,meth.workspace_id,meth.token)
        return wsreturn

    @pipelineStep(None)
    def uploadtoShock(client,previous_steps):
         return shockfileload(auth,cufflinksobjname,cufflinks_output)
    
    @pipelineStep(None)
    def saveWorkspace_obj(client,previous_steps):
        previous_steps = previous_steps[-1]
        if 'output' in previous_steps:
            job_id =  previous_steps['output'].job_id
        pattern2 = re.compile('Writing the Expression object kb\|sample_test.[0-9]*')
        try: 
           sampleid = parselog(str(job_id),pattern2,auth)
        except FileNotFound as e:
            raise  ShockUploadException("Error in Parsing log file: {}".format(err))
        realid = sampleid.split('Writing the Expression object ')[1]
        result = cathdfsfile(realid,auth)
        jsonobj = json.loads(str(result))
        wsreturn = ws_saveobject(realid,jsonobj,exptype,meth.workspace_id,meth.token)
        return {"submitted" : realid , "type" : exptype , "status" : wsreturn}

    def ontologydata(poid=None,eoid=None):
        exp =  expressionService(OTHERURLS.expression)
        #json_error = None
        #status = None
        poids = poid[0].split(",") 
        eoids = eoid[0].split(",")
        podesc = exp.get_po_descriptions(poids)
        eodesc = exp.get_eo_descriptions(eoids)
        ontoids = ",".join(poids + eoids)
        ontodef = ",".join([ value for (key,value) in podesc.items() ] + [value for (key1,value1) in eodesc.items()])
        return dict(podesc.items() + eodesc.items())
    
    meth.advance("Preparing Input files")
    ret  = prepareInputfiles(meth.token,workspace,Input_file_path,wtype)
    #return to_JSON(ret)
    if 'metadata' in ret:
        if 'sample_id' in ret['metadata'][0]:
            sample_id = ret['metadata'][0]['sample_id']
            title = sample_id
        if 'title' in  ret['metadata'][0]:
            desc =  ret['metadata'][0]['title']
        if 'ext_source_date' in  ret['metadata'][0]:
            srcdate = ret['metadata'][0]['ext_source_date']
        if 'po_id' in  ret['metadata'][0]:
            po_id = ret['metadata'][0]['po_id']
        if 'eo_id' in  ret['metadata'][0]:
            eo_id = ret['metadata'][0]['eo_id']
    
    Output_file_path = "narrative_RNASeq_"+str(sample_id)+'_'+ str(uuid.uuid4().get_hex().upper()[0:6])
    entityfile = str(act_ref) + "_fids.txt"
    #tophat_out_path = os.path.join(Output_file_path, "tophat")
    #cufflinks_in_path = os.path.join(tophat_out_path,"accepted_hits.bam")
    #cufflinks_out_path = os.path.join(Output_file_path,"cufflinks")
    cufflinks_output =  os.path.join(cufflinks_out_path,"transcripts.gtf")
    cufflinksobjname = str(sample_id)+'_transcripts.gtf'
    #stages = #[Stage(getfiles,"Prepare Input files",None),
    stages= [Stage(runTophat,"Aligning Reads",pollGridJobs)]
             #Stage(runCufflinks,"Assembling Transcripts",pollGridJobs),
             #Stage(writeBamfile,"Writing Alignment file",None),
             #Stage(uploadtoShock,"Uploading to Shock",None),
             #Stage(workspaceobj,"Preparing Workspace obj",pollGridJob),
             #Stage(saveWorkspace_obj,"Saving Object",None)]

    return to_JSON(runPipeline(stages,meth,auth))
    
@method(name = "Identify Differential Expression")
def jnomics_differential_expression(meth,workspace= None,title=None, alignment_files=None,exp_files=None,
                                 ref=None):
    """Identify differential Expression
    :param workspace: name of workspace, default is current
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace
    :param title : Experiment title
    :type title : kbtypes.Unicode
    :ui_name title : Experiment Name 
    :param alignment_files: Alignment files in .bam format
    :type alignment_files: kbtypes.Unicode
    :ui_name alignment_files : Alignment files
    :param exp_files: Gene Expression files
    :type exp_files: kbtypes.Unicode
    :ui_name exp_files : Gene Expressionfiles
    :param ref : Reference Genome (kb_id)
    :type ref : kbtypes.Unicode
    :ui_name ref : Reference
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 5
    token = meth.token
    
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    ws = workspaceService(OTHERURLS.workspace)
    idc = IDServerAPI(OTHERURLS.ids)

    act_ref = ref.replace('|','_')

    wtype =  WSTYPES.rnaseq_sampletype
    exptype =  WSTYPES.rnaseq_exptype
    diffexptype = WSTYPES.rnaseq_diffexptype
    bamtype  = WSTYPES.rnaseq_bamtype

    node_id = None
    stats = []
    
    @pipelineStep("compute")
    def runCuffmerge(client,previous_steps):
        return client.callCuffmerge(Merge_files,act_ref,
                                    merge_out_path,"",
                                     "", "", auth)
    @pipelineStep("compute")
    def runCuffdiff(client,previous_steps):
        return client.callCuffdiff( cuffdiff_in_path,
                                    cuffdiff_out_path,
                                    act_ref,
                                    "", condn_labels,merged_gtf,
                                    "","", auth)

    @pipelineStep("compute")
    def savediffWorkspace_obj(client,previous_steps):
        idsdict = {}
        for dfile in diff_files:
            time.sleep(10)
            filepath =  os.path.join(cuffdiff_out_path,dfile)
            jid = writeShock(title+"_"+dfile,filepath,auth)
            idsdict[dfile] = jid
        
        for key,value in idsdict.items():
            status = pollGridJob(value, auth)
            if status and not status.running_state == 2:
             ## fail here
                pass

        for key, value in idsdict.items():
            pattern =  re.compile("\[id=(.*?)]")
            shockid = parselog(str(value.job_id),pattern,auth)
        #del idsdict[key]
            idsdict[key] = str(shockid).rstrip().split('=')[1].replace(']','')
    
        diff_exp_files = []
        for key, value in idsdict.items():
            diff_exp = {}
            diff_exp["name"] =  key
            diff_exp["shock_ref"] = {}
            diff_exp["shock_ref"]["shock_id"] = value
            diff_exp["shock_ref"]["shock_url"] = OTHERURLS.shock+"/node/"+value
            diff_exp_files.append(diff_exp)

        diffid = "kb|differentialExpression."+str(idc.allocate_id_range(diffexptype,1))
        diffexpobj = { "name" : diffid,
                       "title" : title, 
                       "created" : strftime("%d %b %Y %H:%M:%S +0000", gmtime()),
                       "diff_expression" :  diff_exp_files
                     }
        wsreturn = ws_saveobject(diffid,diffexpobj,diffexptype,meth.workspace_id,meth.token)
        return {"submitted" : diffid , "status" : "SUCCESS" , "metadata" : wsreturn}

    files = alignment_files.strip('\r\n').split(',')
    expfiles =  exp_files.strip('\r\n').split(',')
    nodeids = []
    job_ids = []
    objnames = []
    Merge_files = ""
    bamfiles = ""
    Output_file_path = ""
    condn_labels = ""
    diff_files = ["genes.fpkm_tracking","isoforms.fpkm_tracking","tss_groups.fpkm_tracking","cds.fpkm_tracking","gene_exp.diff","cds_exp.diff","splicing.diff","tss_group_exp.diff","promoters.diff","cds.diff"]
    Output_file_path = "narr_RNASeq_diffexp_" + str(uuid.uuid4().get_hex().upper()[0:6])

    meth.advance("Preparing Input Files")
    ret  = prepareInputfiles(meth.token,workspace,alignment_files,exptype)
          
    for nfile in expfiles:
        obj = ws.get_object({'auth': token, 'workspace': workspace, 'id': nfile, 'type': exptype})
        node_id =  obj['data']['shock_url']
        filename = str(obj['data']['id']).replace(".","_")+".gtf"
        objnames.append(filename)
        job_ids.append(readShock(node_id.split("/node/")[1],filename,auth))
         
    for jid in job_ids:
        status = pollGridJob(jid, auth)
        if status and not status.running_state == 2:
              ##fail here
            pass

    for objname in objnames:
        if Merge_files == "":
            Merge_files = objname
        else:
            Merge_files = Merge_files + "," + objname

    merge_out_path = os.path.join(Output_file_path,"cuffmerge")
    cuffdiff_in_path = alignment_files.replace("|","_")
    condn_labels = alignment_files.replace("|","_")
    cuffdiff_out_path = os.path.join(Output_file_path,"cuffdiff")
    merged_gtf = os.path.join(merge_out_path,"merged.gtf")

    stages = [Stage(runCuffmerge,"Merging Assembled Transcripts",pollGridJob),
              Stage(runCuffdiff,"Differential Expression",pollGridJob),
              Stage(savediffWorkspace_obj,"Saving Workspace Obj",None)]
    ret = runPipeline(stages,meth,auth)
    return  to_JSON(ret[-1])

@method(name = "Create Expression Series ")
def createExpSeries(meth,workspace= None,exp_samples=None,ref=None,title=None,design=None,summary=None,source_Id=None,src_date=None):
    """search a file

    :param workspace: Worspace id
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace 
    :param exp_samples: Expression sample ids
    :type exp_samples : kbtypes.Unicode
    :ui_name exp_samples : Expression Samples
    :param ref: Reference genome
    :type ref : kbtypes.Unicode
    :ui_name ref : Reference
    :param title: title
    :type title : kbtypes.Unicode
    :ui_name title : Experiment Title
    :param design: Design of the Experiment
    :type design : kbtypes.Unicode
    :ui_name  design : Experiment Design
    :param summary : Summary of the Experiment 
    :type summary : kbtypes.Unicode
    :ui_name summary : Experiment Summary
    :param source_Id: source_Id
    :type source_Id : kbtypes.Unicode
    :ui_name source_Id : Source Id 
    :param src_date: External Source Date
    :type src_date : kbtypes.Unicode
    :ui_name src_date : Publication Date 
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages =  1 
    token = meth.token

    auth = Authentication(userFromToken(meth.token), "", meth.token)
    exptype =  WSTYPES.rnaseq_exptype #####'ExpressionServices.ExpressionSample'
    expseriestype = WSTYPES.rnaseq_expseriestype #####ExpressionServices.ExpressionSeries'

    ws = workspaceService(OTHERURLS.workspace)
    idc = IDServerAPI(OTHERURLS.ids)

    def ws_getObject(workspace,expfile,exptype,token):
        obj = ws.get_object({'auth': token, 'workspace': workspace, 'id': expfile, 'type': exptype})
        return obj
    
    #source_id = ""
    #title = ""
    #ext_src_date = ""
    files = exp_samples.strip('\r\n').split(",")
    source_Id = source_Id + "___" + "RNA-Seq"
    #exp_sampleids = []
    #for expfile in files:
    #    myobj = ws_getObject(workspace, expfile, exptype, token)
        #source_id = myobj['data']['source_id']
        #sample_id = myobj['data']['id']
        #title = myobj['data']['description']
        #ext_src_date = myobj['data']['external_source_date']
        #exp_sampleids.append(sample_id)

    genome_map = [workspace+"/"+x for x in files]    
    #return to_JSON(meth.workspace_id)

    ### get id from ID server
    #register_ids("kb|series","KB",["GSE30249___RNA-Seq"])
    id_dict = idc.register_ids(IDServerids.rnaseq_series,"KB",[source_Id])
    objid = id_dict.values()[0]     
    meth.advance("Preparing the Series Object")

    seriesobj = { 'id' : str(objid) ,
                  'source_id' : source_Id ,
                  'genome_expression_sample_ids_map' : { ref : genome_map },
                  #'genome_expression_sample_ids_map' : {workspace+"/"+x+"/" for x in files 'kb|g.3907': [workspace+"/"+kb|sample_test.13397.json/1' , '863/kb|sample_test.13398.json/1'] } ,
                  'title' : title ,
                  'summary' : summary ,
                  'design' : design ,
                  #'publication_id' : source_id ,
                  'external_source_date' : src_date }
    
    wsreturn = ws_saveobject(seriesobj['id'],seriesobj,expseriestype,meth.workspace_id,meth.token)

    return to_JSON(wsreturn)

@method(name = "Generate Data Table ")
def createDataTable(meth,workspace= None,name=None,exp_series=None,ref=None):
    """search a file

    :param workspace: Worspace id
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace
    :param name: Datatable Name
    :type name : kbtypes.Unicode
    :ui_name name : Name
    :param exp_series: Expression Series Id
    :type exp_series : kbtypes.Unicode
    :ui_name exp_series : Expression Series ID
    :param ref: Reference (kb_id)
    :type ref : kbtypes.Unicode
    :ui_name ref : Reference
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages =  1 
    token = meth.token

    auth = Authentication(userFromToken(meth.token), "", meth.token)
    ws = workspaceService(OTHERURLS.workspace)
    idc = IDServerAPI(OTHERURLS.ids)
    
    wstype =  WSTYPES.rnaseq_expseriestype
    exp_type =  WSTYPES.rnaseq_exptype
    dt_type = WSTYPES.datatabletype

    datatable={}
    row_ids = []
    row_labels = []
    column_ids = []
    column_labels = []
    fpkmdata = []
    exp_levels = []
    row_pos = -1
    sids = []
    filename = os.path.basename(exp_series)
    
    try: 
        obj = ws.get_object({'auth': token, 'workspace': workspace, 'id': filename, 'type': wstype})
    except FileNotFound as e:
        raise FileNotFound("File Not Found: {}".format(err))
    #return json.dumps(obj)
        #return {"output" : str(status), "error": json_error}
    if 'genome_expression_sample_ids_map' in obj['data']:
        samples = obj['data']['genome_expression_sample_ids_map'][ref]
        for sample in samples:
            sids.append({'ref' : sample })
            
        sample_list = ws.get_objects(sids)
        #return to_JSON(sample_list)
        #sample_list = ["srividya22:home/kb|sample_test.13451/1","srividya22:home/kb|sample_test.13452/1"]
        #sample_list = ["srividya22:home/kb|sample.20008/1","srividya22:home/kb|sample.20011/1","srividya22:home/kb|sample.20014/1"]
        #return to_JSON(sample_list)
        #return range(len(sample_list))
        for k in range(len(sample_list)):
            #wsid = sample_list[k].strip().split('/')[0]
            #sampleid = sample_list[k].strip().split('/')[1]
            sample_obj = sample_list[k]
            if 'data' in sample_obj and 'expression_levels' in sample_obj['data']:
                 column_ids.append(str(sample_obj['data']['id']))
                 exp_levels = sample_obj['data']['expression_levels']
                 #return exp_levels
                 for x,y in exp_levels.items():
                     #if str(x) in sortdict:
                     #    sortdict[str(x)]= sortdict[str(x)].append(y)
                     #else:
                     #     sortdict[str(x)]= [y]
                     if x in row_ids:
                         rowid_pos = row_ids.index(str(x))
                         fpkmdata[(row_pos  * len(sample_list)) + k] = float(y)
                     else:
                         row_ids.append(str(x))
                         for j in range(len(sample_list)):
                             if j==k:
                                 fpkmdata.append(float(y))
                             else:
                                 fpkmdata.append(float(0))
    dt_id = "kb|datatable."+str(idc.allocate_id_range("kb|datatable",1))
    dt_obj = OrderedDict({"id" : dt_id, "name" : name, "row_ids" : row_ids, "row_labels" : row_ids , "column_labels" : column_ids , "column_ids" : column_ids, "data" : [fpkmdata] })
    return  to_JSON(ws_saveobject(dt_id,dt_obj,dt_type,meth.workspace_id,meth.token))

@method(name = "Filter Expression Data Table ")
def filterDataTable(meth,workspace= None,dtname=None):
    """search a file

    :param workspace: Worspace id
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace
    :param dtname: Datatable Name
    :type dtname : kbtypes.Unicode
    :ui_name dtname : DataTable Name
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages =  1 
    token = meth.token

    auth = Authentication(userFromToken(meth.token), "", meth.token)
    ws = workspaceService(OTHERURLS.workspace)
    idc = IDServerAPI(OTHERURLS.ids)
    
    wstype =  WSTYPES.rnaseq_expseriestype
    exp_type =  WSTYPES.rnaseq_exptype
    dt_type = WSTYPES.datatabletype

    try: 
        ret = ws.get_object({'auth': token, 'workspace': workspace, 'id': dtname, 'type': dt_type})
        result = ret['data']
    except FileNotFound as e:
        raise FileNotFound("File Not Found: {}".format(err))
    nsamples = len(result['column_ids'])
    rindex = 0 
    diff_index = {}
    for i in xrange(0,(len(result['data'][0])-(nsamples -1)),nsamples):
        lindex= i + nsamples
        maxl = max(result['data'][0][i:lindex])
        minl = [ x for index, x in enumerate(result['data'][0][i:lindex]) if x != float(0) ] 
        if len(minl) == 1 and minl[0] == maxl:
            diff_index[rindex] = maxl
        elif len(minl) > 1:
            diff_index[rindex] = maxl - min(minl)
        rindex = rindex + 1
    
    sorted_dict = sorted(diff_index.items(), key=itemgetter(1),reverse=True)[:100]
    sorted_dt = OrderedDict({ "id" : "", "name" : "","row_ids" : [] ,"column_ids" : [] ,"row_labels" : [] ,"column_labels" : [] , "data" : [] })
    for k, v in sorted_dict:
        left = k * nsamples
        right = k * nsamples + nsamples
        sorted_dt["row_ids"].append(result["row_ids"][k])
        sorted_dt["data"].append(result['data'][0][left:right])
        
    sorted_dt["column_ids"] = result["column_ids"]
    sorted_dt['row_labels'] = sorted_dt["row_ids"]
    sorted_dt["column_labels"] = sorted_dt['column_ids']
    sorted_dt["id"] = "kb|filtereddatatable."+str(idc.allocate_id_range("kb|filtereddatatable",1))
    sorted_dt["name"] = result["name"]
    #return to_JSON(sorted_dt)
    return  to_JSON(ws_saveobject(sorted_dt["id"],sorted_dt,dt_type,meth.workspace_id,meth.token))

@method(name = "Test Workspace obj ")
def Workspaceobject(meth,workspace= None,dtname=None):
    """search a file

    :param workspace: Worspace id
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """

    token = meth.token
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    ws = workspaceService(OTHERURLS.workspace)
    idc = IDServerAPI(OTHERURLS.ids)
    ref = 'kb|g.3907' 
    act_ref = ref.replace('|','_')

    wtype = WSTYPES.rnaseq_sampletype 
    exptype = WSTYPES.rnaseq_exptype 
    bamtype = WSTYPES.rnaseq_bamtype 
    
    @pipelineStep(None)
    def uploadtoShock(client,previous_steps):
         return shockfileload(auth,cufflinksobjname,cufflinks_output)

    @pipelineStep("compute")
    def workspaceobj(client,previous_steps):
        previous_steps = previous_steps[-1]
        if 'output' in previous_steps and 'shock_id' in previous_steps['output']:
            shock_id = previous_steps['output']['shock_id']
        if not isFileFound(entityfile,auth):
            out = getGenomefeatures(ref,auth)
            ret = writefile(entityfile,out,auth) 
        #ontodict = ontologydata(po_id,eo_id)
        #return to_JSON(ontodict)
        #ontoid = ",".join([ key.strip() for (key,value) in ontodict.items()])
        #ontodef =  ",".join([value.strip() for (key,value) in ontodict.items()])
        #ontoname = ontodef
        #return to_JSON({"ontoid" : ontoid,"ontodef" : ontodef , "ontoname" : ontoname})
        #return to_JSON({ "out" : cufflinks_output , "ref" : ref.replace('kb|',''),
        #                "desc" : desc , "title" : title , "srcdate" : srcdate , "ontoid" : ontoid,
        #                "ontodef" : ontodef , "ontoname" : ontoname , "paired" : paired , "shock_id" : shock_id,
        #                "src_id": "SRA SRX031076_1" })
        ontodef = 's,s,s'
        ontoname = 's,s,s'
        ontoid = 's,s,s'
        return client.workspaceUpload(cufflinks_output,ref.replace('kb|',''),
                                      desc,title,srcdate,ontoid,
                                      ontodef,ontoname,paired,
                                      shock_id,"SRA:SRX031076","",auth)
    
    def ontologydata(poid=None,eoid=None):
        exp =  expressionService(OTHERURLS.expression)
        #json_error = None
        #status = None
        poids = poid[0].split(",") 
        eoids = eoid[0].split(",")
        podesc = exp.get_po_descriptions(poids)
        eodesc = exp.get_eo_descriptions(eoids)
        ontoids = ",".join(poids + eoids)
        ontodef = ",".join([ value for (key,value) in podesc.items() ] + [value for (key1,value1) in eodesc.items()])
        return dict(podesc.items() + eodesc.items())
    
    cufflinks_output =  "transcripts_pop2.gtf"
    cufflinksobjname = "transcripts_pop2.gtf"
    shock_id  = "sadkjdiewrjwerkwelkjwsdfdf"
    po_id = ["PO:0009047,PO:0005352"]
    eo_id = ["EO:0007256"]
    paired = "yes"
    src_id = "SRA/SRX031076"
    title = "SRA21313"
    desc = "this is a description"
    srcdate = "May 12 2014"
    entityfile = str(act_ref) + "_fids.txt"

    stages= [Stage(uploadtoShock,"Uploading to Shock",None),
             Stage(workspaceobj,"Preparing Workspace obj",None)]

    return to_JSON(runPipeline(stages,meth,auth))

finalize_service()

