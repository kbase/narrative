
__author__ = 'James Gurtowski <gurtowsk@cshl.edu> / Sri Ramakrishnan <sramakri@cshl.edu>'
__date__ = '1/23/13'

from collections import namedtuple

import time
import json
import os

from thrift import Thrift
from thrift.transport import TSocket, TSSLSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from biokbase.Jnomics.jnomics_api import JnomicsData, JnomicsCompute
from biokbase.Jnomics.jnomics_api.ttypes import Authentication, JnomicsThriftException 
from biokbase.Jnomics.jnomics_api.ttypes import JnomicsThriftJobStatus, JnomicsThriftJobID

from biokbase.narrative.common.service import init_service, method, finalize_service
from IPython.display import display, HTML

VERSION = (0, 0, 1)
NAME = "VariationExpression"

POLL_SLEEP_INTERVAL=90

URL = namedtuple("URL",["host","port"])

Stage = namedtuple("Stage", ["func","name","poll"])


URLS = {"compute":URL("variation.services.kbase.us", 10000),
        "data":URL("variation.services.kbase.us", 10001)}

CLIENT_CLASSES = {"compute": JnomicsCompute.Client,
                  "data" : JnomicsData.Client}

    
init_service(name = NAME, desc="Variation and Expression service", version = VERSION)

clients = {}

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

def computeClient(func):
    '''decorator for compute client,
    opens compute client connection and passes
    it to the func'''
    def wrap():
        client = openComputeClientConnection()
        d = func(client)
        closeClientConnection(client)
        return d
    return wrap

def dataClient(func):
    '''decorator for data client,
    opens data client connection and passes
    it to the func'''
    def wrap():
        client = openDataClientConnection()
        d = func(client)
        closeClientConnection(client)
        return d
    return wrap
    
def poller(pollfunc):
    '''decorator for polling logic'''
    def polret(job_id, auth):
        status = False
        while not status:
            time.sleep(POLL_SLEEP_INTERVAL)
            status = pollfunc(job_id, auth)
        return status
    return polret

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

def runStep(step, auth, poll_func=None):
    '''Runs a pipeline step.
    'step' is expected to return a job id which can be polled, otherwise None
    'poll_func' function to poll the returned job id
    '''
    json_error = None
    status = None
    job_id = None

    try:
        job_id = step()
    except JnomicsThriftException as e:
        json_error=e.msg
        
    if json_error:
        return {"output" : str(status), "error": json_error}

    if poll_func:
        status = poll_func(job_id, auth)
    
    if status and not status.running_state == 2:
        json_error = status.failure_info

    return {"output" : str(status), "error": json_error}

    
    
@method(name = "Calculate Variatons")
def jnomics_calculate_variations(meth, Input_file_path=None,
                                 Input_organism=None,
                                 Output_file_path=None):
    """Calculate variations

    :param Input_file_path: Input to the raw sequencing data
    :type Input_file_path: kbtypes.Unicode
    :param Input_organism: Input organism (kb_id)
    :type Input_organism: kbtypes.Unicode
    :param Output_file_path: Output directory
    :type Output_file_path: kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    
    auth = Authentication(userFromToken(meth.token), "", meth.token)
    align_out_path = os.path.join(Output_file_path , "align")

    @computeClient
    def runBowtie(client):
        return client.alignBowtie(Input_file_path,
                                    Input_organism,
                                    align_out_path,
                                    "",auth)

        
    snp_out_path = os.path.join(Output_file_path, "snps")
    @computeClient
    def runSNP(client):
        return client.snpSamtools(align_out_path,
                                    Input_organism,
                                    snp_out_path,
                                    auth)
        
    merge_outpath = os.path.join(Output_file_path, "output.vcf")
    @computeClient
    def runMerge(client):
        return client.mergeVCF(snp_out_path, align_out_path, merge_outpath, auth)
        
    filename = os.path.basename(Input_file_path)
    @computeClient
    def writeShock(client):
        return client.ShockWrite(filename,
                                 merge_outpath,
                                 auth)
        
    stages = [Stage(runBowtie,"Aligning Reads",pollHadoopJob),
              Stage(runSNP,"Calling Variations",pollHadoopJob),
              Stage(runMerge,"Merging Output",None),
              Stage(writeShock,"Uploading Output To Shock",pollGridJob)]

    meth.stages = len(stages)
    for stage in stages:
        meth.advance(stage.name)
        stat = runStep(stage.func,auth,stage.poll)
        if not stat["error"] == None:
            return json.dumps(stat)
    return json.dumps(stat)
        

@method(name = "Calculate Gene Expression")
def jnomics_calculate_variations(meth, Input_file_path=None,
                                 Input_organism=None,
                                 Output_file_path=None):
    """Calculate variations

    :param Input_file_path: Input to the raw sequencing data
    :type Input_file_path: kbtypes.Unicode
    :param Input_organism: Input organism (kb_id)
    :type Input_organism: kbtypes.Unicode
    :param Output_file_path: Output directory
    :type Output_file_path: kbtypes.Unicode
    :return: Workspace id
    :rtype: kbtypes.Unicode
    """
    auth = Authentication(userFromToken(meth.token), "", meth.token)

    tophat_out_path = os.path.join(Output_file_path, "tophat")
    @computeClient
    def runTophat(client):
        return client.alignTophat( Input_organism, Input_file_path,
                                     "", Output_file_path,
                                     "", "", auth)

    cufflinks_in_path = os.path.join(tophat_out_path,"accepted_hits.bam")
    cufflinks_out_path = os.path.join(Output_file_path, "cufflinks")
    @computeClient
    def runCufflinks(client):
        return client.callCufflinks( cufflinks_in_path,
                                     cufflinks_out_path,
                                     "", "", "", auth)

    stages = [Stage(runTophat, "Aligning Reads with Tophat", pollGridJob),
              Stage(runCufflinks, "Calculating Expression with Cufflinks", pollGridJob)]

    meth.stages = len(stages)
    for stage in stages:
        meth.advance(stage.name)
        stat = runStep(stage.func, auth, stage.poll)
        if not stat["error"] == None:
            return json.dumps(stat)
    return json.dumps(stat)

finalize_service()
