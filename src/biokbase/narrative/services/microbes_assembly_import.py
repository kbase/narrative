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
NAME = "Microbes Assembly & Genome Import"

# Initialize
init_service(name=NAME, desc="Demo workflow microbes service", version=VERSION)

@method(name="Simplified Assembly From Reads")
def _assemble_contigs(meth, asm_input):
    """Use the AssemblyRAST service to assemble a set of contigs from sequenced reads.
    This starts a job that might run for several hours.
    When it finishes, the assembled ContigSet will be stored in your data space. [1]

    :param asm_input: A list of files with read information [1.1]
    :type asm_input: kbtypes.KBaseAssembly.AssemblyInput
    :ui_name asm_input: Assembly Input file
    :return: An assembly job
    :rtype: kbtypes.Unicode
    :output_widget: AssemblyWidget
    """
    ws = os.environ['KB_WORKSPACE_ID']
    token = os.environ['KB_AUTH_TOKEN']
    arURL = 'http://kbase.us/services/assembly/'
    ar_user = token.split('=')[1].split('|')[0]

    wsClient = workspaceService(service.URLS.workspace, token=token)
    ws_request = {'id': asm_input,
                  'workspace': ws}

    asm_data = wsClient.get_object(ws_request)
    meth.debug(str(asm_data))

    return json.dumps({"ar_url": arURL,
                       "ar_user" : ar_user,
                       "ar_token" : token,
                       "ws_url" : service.URLS.workspace,
                       "ws_name" : os.environ['KB_WORKSPACE_ID'],
                       "kbase_assembly_input": asm_data['data']})

@method(name="Assemble Genome from Fasta")
def _assemble_genome(meth, contig_file, out_genome):
    """This assembles a ContigSet into a Genome object in your workspace.
    This should be run before trying to annotate a Genome. [2]

    :param contig_file: A FASTA file with contig data [2.1]
    :type contig_file: kbtypes.Unicode
    :ui_name contig_file: Contig File ID
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly. [2.2]
    :type out_genome: kbtypes.KBaseGenomes.Genome
    :ui_name out_genome: Output Genome ID
    :return: Assembled output genome ID
    :rtype: kbtypes.KBaseGenomes.Genome
    """
    # Regarding annotation, here's the latest. You want to take the fasta file that the above command
    # created ("contigs.fasta"), and load it to the workspace as a contig set:
    # "ga-loadfasta contigs.fasta -u MyContigs"
    #
    # -- this is already in the workspace by this point.
    meth.stages = 4

    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']

    # Setup invocation and double-check workspace
    meth.advance("Initialize Annotation Service")
    inv = InvocationService(service.URLS.invocation)
    inv.run_pipeline("", "kbws-workspace " + workspace, [], 100, '/')

    # Run sequence to genome.
    meth.advance("Build Contig Set into a Genome")
    inv.run_pipeline("", "ga-seq-to-genome " + contig_file + " --genomeid " + out_genome, [], 100, '/')

    # 4. Fetch genome.
    meth.advance("Fetching Genome for Display")
    wsClient = workspaceService(service.URLS.workspace)

    get_genome_params = {
        'id': out_genome,
        'type': 'Genome',
        'workspace': workspace,
        'auth': token,
    }
    genome_meta = wsClient.get_objectmeta(get_genome_params)

    # 5. Pass it forward to the client.
    meth.advance("Rendering Genome Information")
    return json.dumps(genome_meta)

@method(name="Upload Contigs (FASTA-file)")
def _upload_contigs(meth, contig_set):
    """Upload a ContigSet from FASTA-file into your workspace.
    This function should be run before wrapping the ContigSet as a Genome object. [19]

    :param contig_set: Output contig set ID. If empty, an ID will be chosen randomly. [19.1]
    :type contig_set: kbtypes.KBaseGenomes.ContigSet
    :ui_name contig_set: Contig Set Object ID
    :return: Preparation message
    :rtype: kbtypes.Unicode
    :output_widget: ContigSetUploadWidget
    """
    if not contig_set:
        contig_set = "contigset_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    meth.stages = 1
    workspace = os.environ['KB_WORKSPACE_ID']
    return json.dumps({'ws_name': workspace, 'contig_set': contig_set})

@method(name="Upload Genome (GBK-file)")
def _upload_genome(meth, genome_id):
    """Upload a Genome and ContigSet from GBK-file (or files in case of zip) into your workspace.
    This function should be run before adding KBase annotations to this Genome. [25]

    :param genome_id: Output Genome ID. If empty, an ID will be chosen randomly. [25.1]
    :type genome_id: kbtypes.KBaseGenomes.Genome
    :ui_name genome_id: Genome Object ID
    :return: Preparation message
    :rtype: kbtypes.Unicode
    :output_widget: GenomeUploadWidget
    """
    if not genome_id:
        genome_id = "genome_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    meth.stages = 1
    workspace = os.environ['KB_WORKSPACE_ID']
    return json.dumps({'ws_name': workspace, 'genome_id': genome_id, 'type': 'gbk'})

@method(name="Import NCBI Genome")
def _import_ncbi_genome(meth, ncbi_genome_name, genome_id):
    """Import a Genome and ContigSet from NCBI into your workspace. [26]

    :param ncbi_genome_name: Name of public genome accessible on NCBI FTP. [26.1]
    :type ncbi_genome_name: kbtypes.Unicode
    :ui_name ncbi_genome_name: NCBI Genome Name
    :param genome_id: Output Genome ID. If empty, an ID will be chosen automatically. [26.2]
    :type genome_id: kbtypes.KBaseGenomes.Genome
    :ui_name genome_id: Genome Object ID
    :return: Preparation message
    :rtype: kbtypes.Unicode
    :input_widget: NcbiGenomeImportInput
    :output_widget: GenomeAnnotation
    """
    if not genome_id:
        chars = ['\'',' ','-','=','.','/','(',')','_',':','+','*','#',',','[',']']
        genome_id_prefix = ncbi_genome_name
        for ch in chars:
            genome_id_prefix = genome_id_prefix.replace(ch, '_')
        genome_id = genome_id_prefix + '.ncbi'
    meth.stages = 1
    token, workspace = meth.token, meth.workspace_id
    cmpClient = GenomeComparison(url = service.URLS.genomeCmp, token = token)
    import_ncbi_genome_params = {
        'genome_name': ncbi_genome_name, 
        'out_genome_ws': workspace, 
        'out_genome_id': genome_id, 
    }
    cmpClient.import_ncbi_genome(import_ncbi_genome_params)
    return json.dumps({'ws_name': workspace, 'ws_id': genome_id})

@method(name="Import RAST Genomes")
def _import_rast_genomes(meth, genome_ids, rast_username, rast_password):
    """Import genomes from the RAST annotation pipeline. 
    
    :param genome_ids: list of genome ids (comma seperated)
    :type genome_ids: kbtypes.Unicode
    :ui_name genome_ids: RAST Genome IDs
    
    :param rast_username: Your RAST Username
    :type rast_username: kbtypes.Unicode
    :ui_name rast_username: RAST Username

    :param rast_password: Your RAST Password
    :type rast_password: kbtypes.Unicode
    :ui_name rast_password: RAST Password

    :return: Uploaded RAST Genome
    :rtype: kbtypes.Unicode
    :output_widget: GenomeAnnotation
    :input_widget: rastGenomeImportInput
    """
    #315750.3
    gids = genome_ids.split(',')

    meth.stages = len(gids)+1 # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    token, ws = meth.token, meth.workspace_id;

    fba = fbaModelServices(url = service.URLS.fba, token = token)

    for gid in gids:
        meth.advance("Loading genome: "+gid);
        fba.genome_to_workspace({'genome': gid, 
                                 'workspace': ws, 
                                 'sourceLogin': rast_username,
                                 'sourcePassword': rast_password,
                                 'source': 'rast'})


    return json.dumps({'ws_name': ws, 'ws_id': gids[0]})

@method(name="Import SEED Genomes")
def _import_seed_genomes(meth, genome_ids):
    """Import genomes from the pubSEED database. 
    
    :param genome_ids: list of genome ids (comma seperated)
    :type genome_ids: kbtypes.Unicode
    :ui_name genome_ids: SEED Genome IDs

    :return: Uploaded SEED Genome
    :rtype: kbtypes.Unicode
    :output_widget: GenomeAnnotation
    """
    #315750.3
    gids = genome_ids.split(',')

    meth.stages = len(gids)+1 # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    token, ws = meth.token, meth.workspace_id;

    fba = fbaModelServices(url = service.URLS.fba, token = token)

    for gid in gids:
        meth.advance("Loading genome: "+gid);
        fba.genome_to_workspace({'genome': gid, 
                                 'workspace': ws, 
                                 'source': 'seed'})

    return json.dumps({'ws_name': ws, 'ws_id': gids[0]})

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
