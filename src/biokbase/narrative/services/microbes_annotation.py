"""
Demo microbes service and methods
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>, Bill Riehl <wjriehl@lbl.gov>, Michael Sneddon <mwsneddon@lbl.gov>, Roman Sutormin <rsutormin@lbl.gov>'
__date__ = '11/15/13'

## Imports
# Stdlib
import json
import os
import random
import numbers
import uuid
import hashlib
import re
import sys
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.workspace.client import Workspace as workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.fbaModelServices.Client import fbaModelServices
from biokbase.GenomeComparison.Client import GenomeComparison
from biokbase.assembly.client import Client as ArastClient
from biokbase.KBaseTrees.Client import KBaseTrees

## Globals

VERSION = (0, 0, 1)
NAME = "Microbes Annotation"

# Initialize
init_service(name=NAME, desc="Demo workflow microbes service", version=VERSION)

@method(name="Annotate ContigSet")
def _prepare_genome(meth, contig_set, scientific_name, genetic_code, out_genome):
    """Build a Genome object from a ContigSet, creating structural and functional annotations.
    The annotation job may run for an hour or longer. When the annotation job finishes,
    the annotated Genome object will be stored in your workspace. [3]

    :param contig_set: An object with contig data [3.1]
    :type contig_set: kbtypes.KBaseGenomes.ContigSet
    :ui_name contig_set: Contig Set Object
    :param scientific_name: enter the scientific name to assign to your new genome [3.2]
    :type scientific_name: kbtypes.Unicode
    :ui_name scientific_name: Scientific Name
    :param genetic_code: enter the genetic code for your new genome (default is 11) [3.2]
    :type genetic_code: kbtypes.Unicode
    :ui_name genetic_code: Genetic Code
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly. [3.3]
    :type out_genome: kbtypes.KBaseGenomes.Genome
    :ui_name out_genome: Output Genome ID
    :return: Preparation message
    :rtype: kbtypes.Unicode
    :output_widget: GenomeAnnotation
    """
    if not scientific_name:
        return json.dump({'error': 'output genome name should be defined'})
    if not genetic_code:
        genetic_code = 11
    if not out_genome:
        out_genome = "genome_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    meth.stages = 2
    meth.advance("Annotating the contigs (3-4 minutes)...")
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    fbaClient = fbaModelServices(url = service.URLS.fba, token = token)
        # create the model object
    contigset_to_genome_params = {
        'auth': token,
        'ContigSet_ws': workspace,
        'ContigSet_uid': contig_set,
        'workspace': workspace,
        'uid': out_genome,
        'scientific_name': scientific_name,
        'domain': 'Bacteria',
        'genetic_code': genetic_code,
    }
    fbaClient.ContigSet_to_Genome(contigset_to_genome_params)
    wsClient = workspaceService(service.URLS.workspace, token=token)
    genomeData = wsClient.get_objects([{'ref': workspace+'/'+out_genome}])[0]
    genome = genomeData['data']
    meta = genomeData['info'][10]
    if not meta:
        meta = {}
    meta['Scientific name'] = scientific_name
    wsClient.save_objects({'workspace': workspace, 'objects': [{'type': 'KBaseGenomes.Genome', 'name': out_genome, 'data': genome, 'meta': meta}]})
    return json.dumps({'ws_name': workspace, 'ws_id': out_genome})

@method(name="Annotate Genome")
def _annotate_genome(meth, genome, out_genome):
    """Annotate a Genome object with structural and functional gene annotations.
    The annotation job may run for an hour or longer. When the annotation job finishes,
    the annotated Genome object will be stored in your workspace. [4]
    
    :param genome: Source genome ID [4.1]
    :type genome: kbtypes.KBaseGenomes.Genome
    :ui_name genome: Genome ID
    :param out_genome: Annotated output genome ID. If empty, annotation will be added into original genome object. [4.2]
    :type out_genome: kbtypes.KBaseGenomes.Genome
    :ui_name out_genome: Output Genome ID
    :return: Annotated output genome ID
    :rtype: kbtypes.KBaseGenomes.Genome
    :output_widget: GenomeAnnotation
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    if not out_genome:
        out_genome = genome
    cmpClient = GenomeComparison(url = service.URLS.genomeCmp, token = token)
    annotate_genome_params = {
        'in_genome_ws': workspace, 
        'in_genome_id': genome, 
        'out_genome_ws': workspace, 
        'out_genome_id': out_genome, 
    }
    job_id = cmpClient.annotate_genome(annotate_genome_params)
    return json.dumps({'ws_name': workspace, 'ws_id': out_genome, 'job_id': job_id})

@method(name="Add KBase Annotation")
def _add_kbase_annotation(meth, genome, out_genome):
    """Add KBase annotations to a genome.  This function will start a job that might run for an hour or longer.
    When the job finishes, the Genome with KBase annotations will be stored in your workspace. [21]
    
    :param genome: Source genome ID [21.1]
    :type genome: kbtypes.KBaseGenomes.Genome
    :ui_name genome: Genome ID
    :param out_genome: Annotated output genome ID. If empty, annotation will be added into original genome object. [21.2]
    :type out_genome: kbtypes.KBaseGenomes.Genome
    :ui_name out_genome: Output Genome ID
    :return: Annotated output genome ID
    :rtype: kbtypes.Genome
    :output_widget: GenomeAnnotation
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    if not out_genome:
        out_genome = genome
    cmpClient = GenomeComparison(url = service.URLS.genomeCmp, token = token)
    annotate_genome_params = {
        'in_genome_ws': workspace, 
        'in_genome_id': genome, 
        'out_genome_ws': workspace, 
        'out_genome_id': out_genome,
        'seed_annotation_only' : 1,
    }
    job_id = cmpClient.annotate_genome(annotate_genome_params)
    return json.dumps({'ws_name': workspace, 'ws_id': out_genome, 'job_id': job_id})

@method(name="View Genome")
def _show_genome(meth, genome):
    """View and explore a Genome object in your workspace. [5]
    
    :param genome: select the genome you want to view [5.1]
    :type genome: kbtypes.KBaseGenomes.Genome
    :ui_name genome: Genome
    :return: Same genome ID
    :rtype: kbtypes.KBaseGenomes.Genome
    :output_widget: GenomeAnnotation
    """
    meth.stages = 1  # for reporting progress
    meth.advance("Loading the genome")
    token, workspaceName = meth.token, meth.workspace_id
    return json.dumps({'ws_name': workspaceName, 'ws_id': genome})

@method(name="View KBase Subsystem Data")
def _show_KBase_functional_categories(meth, genome):
    """View and explore the KBase Subsystem categories associated with genes in your genome.

    :param genome: select the genome you want to view
    :type genome: kbtypes.KBaseGenomes.Genome
    :ui_name genome: Genome
    :return: Same genome ID
    :rtype: kbtypes.KBaseGenomes.Genome
    :output_widget: KBaseSEEDFunctions
    """
    meth.stages = 1
    meth.advance("Loading the genome")
    token, workspaceName = meth.token, meth.workspace_id
    return json.dumps({ 'wsNameOrId': workspaceName, 'objNameOrId': genome})



#
#@method(name="Edit Data")
#def _edit_data(meth, obj_name, type):
#    """Edit data in your workspace.
#    :param object_name: name of the data object
#    :type object_id: kbtypes.WorkspaceObjectId
#    :ui_name object_id: Data Name
#    :param type: type of the data object
#    :type type: kbtypes.Unicode
#    :ui_name type: Data Type
#    :return: something 
#    :rtype: kbtypes.Unicode
#    """
#    
#    
#    """
#    :output_widget: kbaseFbaResultViewer
#    """
#    
#    meth.stages = 3
#    meth.advance("Setting up FBA parameters")
#    
#    #grab token and workspace info, setup the client
#    token, workspaceName = meth.token, meth.workspace_id;
#    
#    wsClient = workspaceService(service.URLS.workspace)
#    get_obj_params = {
#        'auth' : token,
#        ''
#    }
#    objData = wsClient.get_object();
#    
#    return json.dumps({ "obj":objData })
#
#





# Finalize (registers service)
finalize_service()
