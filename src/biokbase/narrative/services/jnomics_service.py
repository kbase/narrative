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

from collections import namedtuple
from functools import wraps
from time import gmtime, strftime

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

CLIENT_CLASSES = {"compute": JnomicsCompute.Client,
                  "data" : JnomicsData.Client}

class OTHERURLS:
    _host = '140.221.84.248'
    shock = "http://shock1.chicago.kbase.us"
    #shock = "http://shock.metagenomics.anl.gov"
    awe = "http://140.221.85.36:8000"
    workspace = "http://140.221.84.209:7058"
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
    var_sampletype = 'KBaseVariationData.VariationSample'
    var_vcftype = 'KBaseVariationData.VariantCall'

    ### RNASeq workspace types
    rnaseq_sampletype = 'KBaseRNASeqData.RNASeqSample'
    rnaseq_bamtype = 'KBaseRNASeqData.RNASeqSampleAlignment'
    rnaseq_diffexptype = 'KBaseRNASeqData.RNASeqDifferentialExpression'
    rnaseq_exptype =  'KBaseExpression.ExpressionSample'
    rnaseq_expseriestype = 'KBaseExpression.ExpressionSeries'

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
        node_id = obj['data']['shock_ref']['shock_id']
        #sample_id = obj['data']['metadata']['sample_id']
        meta = obj['data']['metadata']
        #Output_file_path = 'narrative_RNASeq_' + sample_id +'_'+ str(uuid.uuid4().get_hex().upper()[0:6])
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
    shockid  = str(sid).rstrip().split('=')[1].replace(']','')
    if not shockid:
        raise ShockUploadException("Shock Upload Unsuccessful")
    
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
            return json.dumps(stat)
        previous_steps.append(stat)
    return previous_steps


##
##Narrative Functions that will be displayed
##

@method(name = "Calculate Variatons")
def jnomics_calculate_variations(meth, Input_file=None,
                                 Input_organism=None):
    """Calculate variations

    :param Input_file: Input to the raw sequencing data (paired end, comma sep)
    :type Input_file: kbtypes.Unicode
    :param Input_organism: Input organism (kb_id)
    :type Input_organism: kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    Output_file_path = "narrative_variation_"+ str(uuid.uuid4().get_hex().upper()[0:6])
    align_out_path = os.path.join(Output_file_path , "align")

    input_pe_path = os.path.join(Output_file_path, "input.pe")
    @pipelineStep("compute")
    def fastqToPE(client, previous_steps):
        pass

    
    @pipelineStep("compute")
    def runBowtie(client, previous_steps):
        return client.alignBowtie(Input_file,
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
    
    filename = os.path.basename(Input_file)

    @pipelineStep("compute")
    def writeShock(client, previous_steps):
        return client.ShockWrite(filename,
                                 merge_outpath,
                                 auth)

    @pipelineStep
    def writeWS(client, previous_steps):
        #previous_step = previous_steps[-1]
        #previous_job_id = previous_step["output"].job_id
        #pattern =  re.compile("\[id=(.*?)]")
        #shockid = parselog(str(jobid.job_id),pattern,auth)
        #sid = str(shockid).rstrip().split('=')[1].replace(']','')
        #ws = workspaceService(OTHERURLS.workspace)
        #idc = IDServerAPI(OTHERURLS.ids)
        #name = idc.allocate_id_range("kb|variant_test",1)
        #obj = { "name": name,
        #        "type": "vcf",
        #        "created":strftime("%d %b %Y %H:%M:%S +0000", gmtime()),
        #        "shock_ref":{ "shock_id" : sid,
        #                      "shock_url" : OTHERURLS.shock+"/node"+sid },
        #                      "metadata" : {
        #                          "domain" : "adfasdf",
        #                          "paired" : "yes",
        #                          "sample_id" : "yeast",
        #                          "title" : "asdf"
        #                      },
        #        }

        obj = {"shock_ref" : {
            "shock_id" : "shock",
            "shock_url" : "shockid"
            },
            "created" : "2014-04-02 12:42:56",
            "name" : "kb|vcf_test.0",
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
            "type" : "vcf"
        }

        return ws_saveobject("asdfasdf",obj, WSTYPES.var_vcftype,meth.workspace_id,meth.token)
        
    
    
    stages = [Stage(runBowtie,"Aligning Reads",pollHadoopJob),
              Stage(runSNP,"Calling Variations",pollHadoopJob),
              Stage(runMerge,"Merging Output",None),
              Stage(writeShock,"Uploading Output To Shock",pollGridJob),
              Stage(writeWS, "Uploading to Workspace", None)]

    t=namedtuple("ff",["job_id"])
    return to_JSON(writeWS([{"output":t("id=1425")}]))
    
      
@method(name = "Calculate Gene Expression")
def jnomics_calculate_expression(meth, workspace = None,paired=None,
                                 Input_file_path=None,
                                 ref=None):
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
    :param ref: Reference Genome (kb_id)
    :type ref : kbtypes.Unicode
    :ui_name ref : Reference
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

    @computeClient
    def runTophat(client):
        return client.alignTophat(act_ref, Input_file_path,
                                     "", tophat_out_path,
                                     "", "", auth)
    @computeClient
    def runCufflinks(client):
        return client.callCufflinks( cufflinks_in_path,
                                     cufflinks_out_path,
                                     "", "", "", auth)

    @computeClient
    def workspaceobj(client):
        return client.workspaceUpload(wsfile,ref.replace('kb|',''),
                                      desc,title,srcdate,ontoid,
                                      ontodef,ontoname,paired,
                                      shock_id,"",auth)
   
    def ontologyinfo(tissue,condition):
        part = tissue
        condn = condition
        exp =  expressionService(OTHERURLS.expression)
        poids = exp.get_all_po()
        eoids = exp.get_all_eo()
        ontoids = ",".join([ key for (key,value) in poids.items() if value in part] + [key1 for (key1,value1) in eoids.items() if value1 in condn ])
        ontodef = ",".join(part + condition)
        ontodict = { "ontoids" : ontoids , "ontodef" : ontodef , "ontoname" : ontodef} 
        return ontodict

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
    sample_id = ret['metadata']['sample_id']
    desc =  ret['metadata']['title']
    title = sample_id
    srcdate = ret['metadata']['ext_source_date']
    po_id = ret['metadata']['po_id']
    eo_id = ret['metadata']['eo_id']
   #return to_JSON({'title' :  title ,"desc" : desc, "srcdate" : srcdate , "po_id" : po_id , "eo_id" :eo_id })
   
    Output_file_path = "narrative_RNASeq_"+sample_id+'_'+ str(uuid.uuid4().get_hex().upper()[0:6])
    #return to_JSON(ret)
    
    jids = []
    meth.advance("Aligning Reads using Tophat")
    tophat_out_path = os.path.join(Output_file_path, "tophat")
    jids.append(runTophat())
    
    meth.advance("Polling Status of the Tophat jobs")
    for jid in jids:
        status = pollGridJob(jid, auth)
        if status and not status.running_state == 2:
            ##fail here
            pass
    
    jids = []
    meth.advance("Running Cufflinks")
    #for nfile in files:
    #    filename = os.path.basename(nfile)
    #tophat_out_path = os.path.join(Output_file_path, "tophat")
    cufflinks_in_path = os.path.join(tophat_out_path,"accepted_hits.bam")
    #####
    #create the tophat output object
    #####
    
    tophatid  = idc.allocate_id_range("kb|alignment_test",1)
    tophatobjname = "kb|alignment_test."+str(tophatid)
    filedata = shockfileload(auth,tophatobjname,cufflinks_in_path)
    objdata = { "name" : sample_id+"_accepted_hits.bam" ,"paired" : paired , "created" :  strftime("%d %b %Y %H:%M:%S +0000", gmtime()) ,
                "shock_ref": { "shock_id" : filedata['shock_id']  , "shock_url" : OTHERURLS.shock+'/node/'+filedata['shock_id'] },"metadata" : ret['metadata'] }
   
    ws_saveobject(tophatobjname,objdata,bamtype,meth.workspace_id,meth.token)
    cufflinks_out_path = os.path.join(Output_file_path,"cufflinks")
    jids.append(runCufflinks())

    meth.advance("Polling status of Cufflinks Jobs")
    for jid in jids:
        status = pollGridJob(jid, auth)
        if status and not status.running_state == 2:
            ##fail here
            pass

    meth.advance("Uploading output to Shock")
    #filename = os.path.basename(nfile)
    cufflinks_out_path = os.path.join(Output_file_path,"cufflinks")
    cufflinks_output =  os.path.join(cufflinks_out_path,"transcripts.gtf")
    cufflinksobjname = sample_id+'_transcripts.gtf'
    filedata = shockfileload(auth,cufflinksobjname,cufflinks_output)
    #return to_JSON(filedata)

    meth.advance("Preparing the workspace object")
    out = getGenomefeatures(ref,auth)
    entityfile = str(act_ref) + "_fids.txt"
    ret = writefile(entityfile,out,auth)
    #return to_JSON(ret)
    wsfile = cufflinks_output
    #desc = ret['metadata']['title']
    #title = ret['metadata']['sample_id']
    #srcdate = ret['metadata']['ext_source_date']
    shock_id = filedata['shock_id']
    #if ret['metadata'].has_key('po_id') or ret['metadata'].has_key('eo_id') :
    ontodict = ontologydata(po_id,eo_id)
   # return to_JSON(ontodict)
        #ontodict =  ontologyinfo(meta['tissue'],meta['condition'])
    ontoid = ",".join([ key for (key,value) in ontodict.items()])
    ontodef =  ",".join([value for (key,value) in ontodict.items()])
    ontoname = ontodef
    wsjobid = workspaceobj()
    pattern2 = re.compile('Writing the Expression object kb\|sample_test.[0-9]*')
    stats = pollGridJob(wsjobid, auth)
    if stats and not stats.running_state == 2:
       ##fail here
       pass
    sampleid = parselog(str(wsjobid.job_id),pattern2,auth)
    realid = sampleid.split('Writing the Expression object ')[1]
    #return to_JSON(realid)
    result = cathdfsfile(realid,auth)
    jsonobj = json.loads(str(result))
    wsreturn = ws_saveobject(realid,jsonobj,exptype,meth.workspace_id,meth.token)
    json_info = wsreturn
    return json.dumps({"submitted" : realid , "type" : exptype , "status" : json_info})

@method(name = "Identify Differential Expression")
def jnomics_differential_expression(meth,workspace= None,title=None, alignment_files=None,exp_files=None,
                                 ref=None):
    """Identify differential Expression
    :param workspace: name of workspace, default is current
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace
    :default workspace : meth.workspace_id
    :param title : Experiment title to identify differential expression
    :type title : kbtypes.Unicode
    :ui_name title : Experiment Title 
    :param alignment_files: Alignment files in .bam format
    :type alignment_files: kbtypes.Unicode
    :ui_name alignment_files : Alignment files
    :param exp_files: Gene Expression files
    :type exp_files: kbtypes.Unicode
    :ui_name exp_files : Gene Expressionfiles
    :param ref : Input organism (kb_id)
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
    
    @computeClient
    def runCuffmerge(client):
        return client.callCuffmerge(Merge_files,act_ref,
                                    merge_out_path,"",
                                     "", "", auth)
    @computeClient
    def runCuffdiff(client):
        return client.callCuffdiff( cuffdiff_in_path,
                                    cuffdiff_out_path,
                                    act_ref,
                                    "", condn_labels,merged_gtf,
                                    "", auth)

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
          
    #meth.advance("Running CuffMerge ")
    for nfile in expfiles:
        obj = ws.get_object({'auth': token, 'workspace': workspace, 'id': nfile, 'type': exptype})
        node_id =  obj['data']['shock_url']
        #experimentid =  obj['data']['metadata']['source_id']
        #sampleid = obj['data']['metadata']['sample_id']
        #idc.allocate_id_range("kb|alignment_test",1)
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

            
    #return to_JSON(Merge_files)

    #basepath = "narrative_RNASeq_"+sampleid
    #if Merge_files == "" and bamfiles == "":
    #    condn_labels = sampleid
    #    Merge_files = os.path.join(basepath,"cufflinks/transcripts.gtf")
    #    bamfiles = os.path.join(basepath,"tophat/accepted_hits.bam")
    #else:
    #    condn_labels = condn_labels + "," + sampleid 
    #    Merge_files = Merge_files + "," + os.path.join(basepath,"cufflinks/transcripts.gtf")
    #    bamfiles = bamfiles + "," + os.path.join(basepath,"tophat/accepted_hits.bam")
    jids = []
    merge_out_path = os.path.join(Output_file_path,"cuffmerge")
    jids.append(runCuffmerge())
    
    meth.advance("Polling Status of the Cuffmerge job")
    for jid in jids:
        status = pollGridJob(jid, auth)
        if status and not status.running_state == 2:
            ##fail here
            pass
    jids = [] 
    meth.advance("Running Cuffdiff ")
    cuffdiff_in_path = alignment_files.replace("|","_")
    condn_labels = alignment_files.replace("|","_")
    cuffdiff_out_path = os.path.join(Output_file_path,"cuffdiff")
    merged_gtf = os.path.join(merge_out_path,"merged.gtf")
    jids.append(runCuffdiff())

    meth.advance("Polling status of Cuffdiff Job")
    for jid in jids:
        status = pollGridJob(jid, auth)
        if status and not status.running_state == 2:
            ##fail here
            pass

    meth.advance("Preparing Workspace object")
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

    diffid = "kb|differentialExpression."+str(idc.allocate_id_range("kb|differentialExpression_test",1))
    diffexpobj = { "name" : diffid,
                   "title" : title, 
                   "created" : strftime("%d %b %Y %H:%M:%S +0000", gmtime()),
                   "diff_expression" :  diff_exp_files
                 }
    wsreturn = ws_saveobject(diffid,diffexpobj,diffexptype,meth.workspace_id,meth.token)
    return to_JSON({"submitted" : diffid , "status" : "SUCCESS" , "metadata" : wsreturn})

@method(name = "Identify Differential Expression bkp")
def jnomics_differential_expression_bkp(meth,workspace= None,title=None, alignment_files=None,
                                        ref=None):
    """Identify differential Expression
    :param workspace: name of workspace, default is current
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace
    :default workspace : meth.workspace_id
    :param title : Experiment title to identify differential expression
    :type title : kbtypes.Unicode
    :ui_name title : Experiment Title 
    :param alignment_files: Alignment files in .bam format
    :type alignment_files: kbtypes.Unicode
    :ui_name alignment_files : Alignment_files  
    :param ref : Input organism (kb_id)
    :type ref : kbtypes.Unicode
    :ui_name ref : Reference
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    meth.stages = 5
    token = meth.token
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    ws = workspaceService(OTHERURLS.workspace)

    wtype =  WSTYPES.rnaseq_sampletype
    exptype =  WSTYPES.rnaseq_exptype
    diffexptype = WSTYPES.rnaseq_diffexptype

    act_ref = ref.replace('|','_')

    node_id = None
    stats = []
    
    def ws_getObject(wsname,filename,wtype,token):
        obj = ws.get_object({'auth': token, 'workspace': workspace, 'id': filename, 'type': exptype})
        node_id = obj['data']['shock_ref']['shock_id']
        return to_JSON(node_id)
 
    @computeClient
    def readShock(client): 
         return client.ShockRead(node_id,filename,auth)
 
    @computeClient
    def runCuffmerge(client):
        return client.callCuffmerge(Merge_files,act_ref,
                                    merge_out_path,"",
                                     "", "", auth)
    @computeClient
    def runCuffdiff(client):
        return client.callCuffdiff( cuffdiff_in_path,
                                    cuffdiff_out_path,
                                    act_ref,
                                    "", condn_labels,merged_gtf,
                                    "", auth)

    files = alignment_files.strip('\r\n').split(',')
    nodeids = []
    jids = []
    Merge_files = ""
    bamfiles = ""
    Output_file_path = ""
    condn_labels = ""
    diff_files = ["genes.fpkm_tracking","isoforms.fpkm_tracking","tss_groups.fpkm_tracking","cds.fpkm_tracking","gene_exp.diff","cds_exp.diff","splicing.diff","tss_group_exp.diff","promoters.diff","cds.diff"]
    
    meth.advance("Running CuffMerge ")
    for nfile in files:
        obj = ws.get_object({'auth': token, 'workspace': workspace, 'id': nfile, 'type': exptype})
        experimentid =  obj['data']['metadata']['source_id']
        sampleid = obj['data']['metadata']['sample_id']
        Output_file_path = obj['data']['metadata']['source_id']+"_"+ str(uuid.uuid4().get_hex().upper()[0:6])
        basepath = "narrative_RNASeq_"+sampleid
        if Merge_files == "" and bamfiles == "":
            condn_labels = sampleid
            Merge_files = os.path.join(basepath,"cufflinks/transcripts.gtf")
            bamfiles = os.path.join(basepath,"tophat/accepted_hits.bam")
        else:
            condn_labels = condn_labels + "," + sampleid 
            Merge_files = Merge_files + "," + os.path.join(basepath,"cufflinks/transcripts.gtf")
            bamfiles = bamfiles + "," + os.path.join(basepath,"tophat/accepted_hits.bam")
  
    merge_out_path = os.path.join(Output_file_path,"cuffmerge")
    jids.append(runCuffmerge())
    
    meth.advance("Polling Status of the Cuffmerge job")
    for jid in jids:
        status = pollGridJob(jid, auth)
        if status and not status.running_state == 2:
            ##fail here
            pass

    meth.advance("Running Cuffdiff ")
    cuffdiff_in_path = bamfiles
    cuffdiff_out_path = os.path.join(Output_file_path,"cuffdiff")
    merged_gtf = os.path.join(merge_out_path,"merged.gtf")
    jids.append(runCuffdiff())

    meth.advance("Polling status of Cuffdiff Job")
    for jid in jids:
        status = pollGridJob(jid, auth)
        if status and not status.running_state == 2:
            ##fail here
            pass

    meth.advance("Preparing Workspace object")
    idsdict = {}
    for dfile in diff_files:
        time.sleep(10)
        filepath =  os.path.join(cuffdiff_out_path,dfile)
        jid = writeShock(experimentid+"_"+dfile,filepath,auth)
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

    diffid = "kb|differentialExpression."+str(idc.allocate_id_range("kb|differentialExpression_test",1))
    diffexpobj = { "name" : diffid,
                   "title" : title, 
                   "created" : strftime("%d %b %Y %H:%M:%S +0000", gmtime()),
                   "diff_expression" :  diff_exp_files
                 }
    wsreturn = ws_saveobject(experimentid+"_differential_expression",diffexpobj,diffexptype,meth.workspace_id,meth.token)
    return to_JSON(wsreturn)

@method(name = "Create Expression Series ")
def createExpSeries(meth,workspace= None,exp_samples=None,ref=None,design=None,summary=None):
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
    :param design: Design of the Experiment
    :type design : kbtypes.Unicode
    :ui_name  design : Experiment Design
    :param summary : Summary of the Experiment 
    :type summary : kbtypes.Unicode
    :ui_name summary : Experiment Summary
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
    
    source_id = ""
    title = ""
    ext_src_date = ""
    files = exp_samples.strip('\r\n').split(",")
    exp_sampleids = []
    for expfile in files:
        myobj = ws_getObject(workspace, expfile, exptype, token)
        source_id = myobj['data']['source_id']
        title = myobj['data']['description']
        ext_src_date = myobj['data']['external_source_date']
        exp_sampleids.append(source_id)

    genome_map = [workspace+"/"+x for x in files]

    ### get id from ID server
    objid = idc.allocate_id_range("kb|series_test",1)

    meth.advance("Preparing the Series Object")

    seriesobj = { 'id' : "kb|series_test." + str(objid) ,
                  'source_id' : source_id ,
                  'genome_expression_sample_ids_map' : { ref : genome_map },
                  #'genome_expression_sample_ids_map' : {workspace+"/"+x+"/" for x in files 'kb|g.3907': [workspace+"/"+kb|sample_test.13397.json/1' , '863/kb|sample_test.13398.json/1'] } ,
                  'title' : title ,
                  'summary' : summary ,
                  'design' : design ,
                  'publication_id' : source_id ,
                  'external_source_date' : ext_src_date }
    
    wsreturn = ws_saveobject(seriesobj['id'],seriesobj,expseriestype,meth.workspace_id,meth.token)

    return to_JSON(wsreturn)

@method(name = "Save Multiple Shock files ")
def saveshockfiles(meth):
    """search a file
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    token = meth.token
    diff_files = ["genes.fpkm_tracking","isoforms.fpkm_tracking","tss_groups.fpkm_tracking","cds.fpkm_tracking","gene_exp.diff","cds_exp.diff","splicing.diff","tss_group_exp.diff","promoters.diff","cds.diff"]
    cuffdiff_out_path = os.path.join('SRA026096_10D582','cuffdiff')
    idsdict = {}
    for dfile in diff_files:
        time.sleep(10)
        filepath =  os.path.join(cuffdiff_out_path,dfile)
        jid = writeShock('SRA026096_'+dfile,filepath,auth)
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
 
    return to_JSON(idsdict)

@method(name = "Prepare Input files ")
def prepareInputfiles1(meth,workspace=None,files=None,wstype=None):
    """search a file
    :param workspace: Worspace id
    :type workspace : kbtypes.Unicode
    :ui_name workspace : Workspace 
    :param files: RNASeq samples
    :type files : kbtypes.Unicode
    :ui_name files : Samples
    :param wstype: wstype
    :type wstype : kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """

    json_error = None
    status = None
    job_ids = []
    meta = []

    auth = Authentication(userFromToken(meth.token), "", meth.token)
    ws = workspaceService(OTHERURLS.workspace)
    token = meth.token
    files = files.split(",")
    for nfile in files:
        filename = os.path.basename(nfile)
        try: 
            obj = ws.get_object({'auth': token, 'workspace': workspace, 'id': filename, 'type': wstype})
        except FileNotFound as e:
            raise FileNotFound("File Not Found: {}".format(err))
        #return {"output" : str(status), "error": json_error}
        node_id = obj['data']['shock_ref']['shock_id']
        sample_id = obj['data']['metadata']['sample_id']
        meta.append(obj['data']['metadata'])
        Output_file_path = 'narrative_RNASeq_' + sample_id +'_'+ str(uuid.uuid4().get_hex().upper()[0:6])
        job_ids.append(readShock(node_id,filename,auth))
        
    for jid in job_ids:
            status = pollGridJob(jid, auth)
            if status and not status.running_state == 2:
                json_error = status.failure_info
    jsonobj = {"stats" : "Input Files Loaded","job_ids" : [x.job_id for x in job_ids] ,"metadata" : meta, "error": json_error}
    objtype = type(jsonobj)
    return to_JSON(objtype)

@method(name = "Save Multiple Shock files ")
def saveshockfiles(meth):
    """search a file
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    token = meth.token
    diff_files = ["genes.fpkm_tracking","isoforms.fpkm_tracking","tss_groups.fpkm_tracking","cds.fpkm_tracking","gene_exp.diff","cds_exp.diff","splicing.diff","tss_group_exp.diff","promoters.diff","cds.diff"]
    cuffdiff_out_path = os.path.join('SRA026096_10D582','cuffdiff')
    idsdict = {}
    for dfile in diff_files:
        time.sleep(10)
        filepath =  os.path.join(cuffdiff_out_path,dfile)
        jid = writeShock('SRA026096_'+dfile,filepath,auth)
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
 
    return to_JSON(idsdict)

@method(name = "Load files to Shokc ")
def shockfileload1(meth,filename=None,filepath=None):
    """search a file
    :param filename: Worspace id
    :type filename : kbtypes.Unicode
    :ui_name filename : Workspace 
    :param filepath: RNASeq samples
    :type filepath : kbtypes.Unicode
    :ui_name filepath : Samples
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    json_error = None
    status = None
    pattern =  re.compile("\[id=(.*?)]")
    try: 
        jobid = writeShock(filename,filepath,auth)
    except JnomicsThriftException as e:
        json_error = e.msg
    if json_error:
        return to_JSON({"output" : str(status), "error": json_error})
    status = pollGridJob(jobid, auth)
    if status and not status.running_state == 2:
        json_error = status.failure_info
    sid =  parselog(str(jobid.job_id),pattern,auth)
    shockid  = str(sid).rstrip().split('=')[1].replace(']','')
    if not shockid:
        raise ShockUploadException("Shock Upload Unsuccessful")
    
    return to_JSON({"Submitted" : filename , "shock_id" : shockid , "error": json_error})
    
@method(name = "Get Ontology ids ")
def ontologydata(meth,poid=None,eoid=None):
    """search a file
    :param poid : Worspace id
    :type poid : kbtypes.Unicode
    :ui_name poid : Workspace 
    :param eoid: RNASeq samples
    :type eoid : kbtypes.Unicode
    :ui_name eoid : Samples
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    exp =  expressionService(OTHERURLS.expression)
    
    json_error = None
    status = None
    poids = poid.split(",") 
    eoids = eoid.split(",")
    exp =  expressionService(OTHERURLS.expression)
    podesc = exp.get_po_descriptions(poids)
    eodesc = exp.get_eo_descriptions(eoids)
    ontoids = ",".join(poids + eoids)
    ontodef = ",".join([ value for (key,value) in podesc.items() ] + [value for (key1,value1) in eodesc.items()])
    return to_JSON(dict(podesc.items() + eodesc.items()))
    #return to_JSON({ "ontoids" : ontoids , "ontodef" : ontodef , "ontoname" : ontodef})
    #return to_JSON({ "poid" : poids ,"podesc" : podesc })
        #poids = exp.get_all_po()
        #eoids = exp.get_all_eo()
       # ontoids = ",".join([ key for (key,value) in poids.items()] + [key1 for (key1,value1) in eoids.items() if value1 in condn ])
       # ontodef = ",".join(part + condition)
       # ontodict = { "ontoids" : ontoids , "ontodef" : ontodef , "ontoname" : ontodef} 
       # return ontodict

     ##### check if a key exists in dict python  : dict.has_key(key)
@method(name = "Check files on HDFS and throw exception")
def Checkfiles(meth,filepath=None):
    """search a file 
    :param filepath: filepath
    :type filepath : kbtypes.Unicode
    :ui_name filepath : filepath
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    #exp =  expressionService(OTHERURLS.expression)
    
    json_error = None
    status = None
    auth = Authentication(userFromToken(meth.token), "", meth.token)

    def isFileFound(filepath, auth):
        client = openDataClientConnection()
        status = client.listStatus(filepath,auth)
        if not status:
            return to_JSON(False)
        closeClientConnection(client)
        return to_JSON(True)
    
    ret  = isFileFound(filepath,auth)
    return to_JSON(ret)

finalize_service()

