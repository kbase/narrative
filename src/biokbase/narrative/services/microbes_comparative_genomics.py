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
#from biokbase.workspaceService.Client import workspaceService
from biokbase.workspaceServiceDeluxe.Client import Workspace as workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.fbaModelServices.Client import fbaModelServices
from biokbase.GenomeComparison.Client import GenomeComparison
from biokbase.assembly.client import Client as ArastClient
from biokbase.KBaseTrees.Client import KBaseTrees

## Globals

VERSION = (0, 0, 1)
NAME = "Microbes Comparative Genomics"

# Initialize
init_service(name=NAME, desc="Demo workflow microbes service", version=VERSION)

@method(name="Compute Pangenome")
def _compute_pan_genome(meth, genome_set,pangenome_id):
    """ Rapidly compute gene families for a set of phylogenetically close genomes

    :param genome_set: a Genome Set to compute pangenome for
    :type genome_set: kbtypes.KBaseSearch.GenomeSet
    :ui_name genome_set: Genome Set ID
    
    :param pangenome_id: ID for output pangenome
    :type pangenome_id: kbtypes.KBaseGenomes.Pangenome
    :ui_name pangenome_id: Pangenome ID
    
    :return: Generated Pangenome Object
    :rtype: kbtypes.KBaseGenomes.Pangenome
    :output_widget: kbasePanGenome
    """
    meth.stages = 2
    meth.advance("Computing pangenome (20 sec per genome)...")
    usertoken, workspace_id = meth.token, meth.workspace_id

    ws = workspaceService(service.URLS.workspace, token=usertoken)
    data = ws.get_objects([{'ref': workspace_id+'/'+genome_set}])[0]
    genome_set_elements = data['data']['elements']
    genomes = []
    gwss = []
    for key in genome_set_elements:
        array = genome_set_elements[key]['ref'].split('/')
        gwss.append(array[0])
        genomes.append(array[1])

    pangenome_parameters = {
        'genomes':genomes,
        'genome_workspaces':gwss,
        'workspace':workspace_id,
        'auth':usertoken,
        'wsurl':service.URLS.workspace}
    
    if pangenome_id:
        pangenome_parameters['output_id']=pangenome_id
    
    fbaclient = fbaModelServices(url = service.URLS.fba, token=usertoken)
    meta = fbaclient.build_pangenome(pangenome_parameters)
    
    return json.dumps({'ws': workspace_id, 'name':meta[1]})

@method(name="View Pangenome")
def _view_pan_genome(meth, pan_genome_id):
    """Show Pangenome object. [29] 
    
    :param pan_genome_id: ID of pangenome object [29.1]
    :type pan_genome_id: kbtypes.KBaseGenomes.Pangenome
    :ui_name pan_genome_id: Pangenome ID

    :return: Generated Compare Genome
    :rtype: kbtypes.KBaseGenomes.Pangenome
    :output_widget: kbasePanGenome
    """
    
    meth.stages = 1 # for reporting progress
    
    return json.dumps({'ws': meth.workspace_id, 'name': pan_genome_id})


@method(name="Export gene sets from Pangenome")
def _export_gene_set_pan_genome(meth, pan_genome_id):
    """Export gene sets from Pangenome as external FeatureSet objects. [26] 
    
    :param pan_genome_id: ID of pangenome object [26.1]
    :type pan_genome_id: kbtypes.KBaseGenomes.Pangenome
    :ui_name pan_genome_id: Pangenome ID

    :return: Generated Compare Genome
    :rtype: kbtypes.KBaseGenomes.Pangenome
    :output_widget: kbasePanGenome
    """
    
    meth.stages = 1 # for reporting progress
    
    return json.dumps({'ws': meth.workspace_id, 'name': pan_genome_id, 'withExport': 'true'})

@method(name="Genome Comparison from Pangenome")
def _compare_genomes(meth, pangenome_id):
    """Genome Comparison analysis based on the PanGenome input. 
    
    :param pangenome_id: Pangenome ID 
    :type pangenome_id: kbtypes.KBaseGenomes.Pangenome
    :ui_name pangenome_id: Pangenome ID

    :return: Uploaded Genome Comparison Data
    :rtype: kbtypes.KBaseGenomes.GenomeComparison
    :output_widget: kbaseGenomeComparisonViewer
    """
    meth.stages = 2
    meth.advance("Comparing all genomes in pangenome (1-2 minutes)...")
    
    #grab token and workspace info, setup the client
    token, ws = meth.token, meth.workspace_id;
    wss =[]
    fba = fbaModelServices(url = service.URLS.fba, token = token)

    meta = fba.compare_genomes({'pangenome_id': pangenome_id, 
                                'pangenome_ws': ws,
                                'workspace': ws })
    
    return json.dumps({'ws': meth.workspace_id, 'id':meta[1]})

@method(name="View Genome Comparison")
def _compare_genomes(meth, genomecomp_id):
    """View genome comparison results.
        
        :param genomecomp_id: Genome comparison ID
        :type genomecomp_id: kbtypes.KBaseGenomes.GenomeComparison
        :ui_name genomecomp_id: Genome comparison ID
        
        :return: Uploaded Genome Comparison Data
        :rtype: kbtypes.KBaseGenomes.GenomeComparison
        :output_widget: kbaseGenomeComparisonViewer
        """
    meth.stages = 2
    meth.advance("Opening genome comparison...")
    token, ws = meth.token, meth.workspace_id;
                               
    return json.dumps({'ws': meth.workspace_id, 'id': genomecomp_id})

@method(name="Compare Two Proteomes")
def _compare_proteomes(meth, genome1, genome2, out_proteome_cmp):
    """Start a job to run Blast between the proteomes of two genomes.
    The comparison information includes best-bidirectional hits. [17]
     
    :param genome1: Source genome1 ID [17.1]
    :type genome1: kbtypes.KBaseGenomes.Genome
    :ui_name genome1: Genome1 ID
    :param genome2: Source genome2 ID [17.2]
    :type genome2: kbtypes.KBaseGenomes.Genome
    :ui_name genome2: Genome2 ID
    :param out_proteome_cmp: Output proteome comparison ID. If empty, an ID will be chosen randomly. [17.3]
    :type out_proteome_cmp: kbtypes.GenomeComparison.ProteomeComparison
    :ui_name out_proteome_cmp: Output Proteome Comparison ID
    :return: Output Proteome Comparison ID
    :rtype: kbtypes.ProteomeComparison
    :output_widget: GenomeComparisonWidget
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    if not out_proteome_cmp:
        out_proteome_cmp = "proteome_cmp_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    cmpClient = GenomeComparison(url = service.URLS.genomeCmp, token = token)
    blast_proteomes_params = {
        'genome1ws': workspace, 
        'genome1id': genome1, 
        'genome2ws': workspace, 
        'genome2id': genome2, 
        'output_ws': workspace, 
        'output_id': out_proteome_cmp, 
    }
    job_id = cmpClient.blast_proteomes(blast_proteomes_params)
    return json.dumps({'ws_name': workspace, 'ws_id': out_proteome_cmp, 'job_id': job_id})

@method(name="View Proteome Comparison")
def _view_proteome_cmp(meth, proteome_cmp):
    """Show the hit map result of running a comparison between two proteomes, 
    which includes information about best-bidirectional hits. [18]
     
    :param proteome_cmp: Proteome comparison ID [18.1]
    :type proteome_cmp: kbtypes.GenomeComparison.ProteomeComparison
    :ui_name proteome_cmp: Proteome Comparison ID
    :return: Output Proteome Comparison ID
    :rtype: kbtypes.ProteomeComparison
    :output_widget: GenomeComparisonWidget
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    return json.dumps({'ws_name': workspace, 'ws_id': proteome_cmp})

@method(name="Insert Genome into Species Tree")
def _insert_genome_into_species_tree(meth, genome, neighbor_count, out_tree):
    """ Insert a Genome into a global genome tree composed of 49 conserved COGs [20]

    :param genome: a Genome to insert into the tree [20.1]
    :type genome: kbtypes.KBaseGenomes.Genome
    :ui_name genome: Genome ID
    :param neighbor_count: number of closest public genomes the tree will contain. (optional, default value is 100) [20.2]
    :type neighbor_count: kbtypes.Unicode
    :ui_name neighbor_count: Neighbor public genome count
    :param out_tree: Output species tree ID. If empty, an ID will be chosen randomly. [20.3]
    :type out_tree: kbtypes.KBaseTrees.Tree
    :ui_name out_tree: Output species tree ID
    :return: Species Tree Result
    :rtype: kbtypes.Unicode
    :output_widget: kbaseTree
    """
    meth.stages = 2
    meth.advance("Instantiating tree construction job...")
    token, workspace = meth.token, meth.workspace_id
    if not out_tree:
        out_tree = "sptree_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    treeClient = KBaseTrees(url = service.URLS.trees, token = token)
    construct_species_tree_params = {
        'new_genomes': [workspace + '/' + genome], 
        'use_ribosomal_s9_only': 0, 
        'out_workspace': workspace, 
        'out_tree_id': out_tree, 
    }
    if neighbor_count:
        construct_species_tree_params['nearest_genome_count'] = int(neighbor_count)
    job_id = treeClient.construct_species_tree(construct_species_tree_params)
    return json.dumps({'treeID': out_tree, 'workspaceID': workspace, 'height':'500px', 'jobID': job_id})

@method(name="View Tree")
def _view_tree(meth, tree_id):
    """ View a Tree from your workspace [21]

    :param tree_id: a Tree id [21.1]
    :type tree_id: kbtypes.KBaseTrees.Tree
    :ui_name tree_id: Tree ID
    :return: Species Tree Result
    :rtype: kbtypes.Unicode
    :output_widget: kbaseTree
    """
    meth.stages = 1
    workspace = meth.workspace_id
    return json.dumps({'treeID': tree_id, 'workspaceID': workspace, 'height':'500px'})

@method(name="Build Genome Set From Tree")
def _build_genome_set_from_tree(meth, tree_id,genome_set):
    """ Build a genome set from the contents of the species tree, copying any CDM genomes 
    into local workspace.

    :param species_tree: a species tree with close genomes
    :type species_tree: kbtypes.KBaseTrees.Tree
    :ui_name species_tree: Species Tree
    
    :param genome_set: ID to use when saving genome set
    :type genome_set: kbtypes.KBaseSearch.GenomeSet
    :ui_name genome_set: Output Genome Set ID
    
    :return: Genome Set Result
    :rtype: kbtypes.Unicode
    :output_widget: kbaseGenomeSetBuilder
    """
    
    meth.stages = 2
    meth.advance("Building genome set from tree...")
    token, workspace = meth.token, meth.workspace_id
    ws = workspaceService(service.URLS.workspace, token=token)
    data = ws.get_objects([{'ref': workspace+'/'+tree_id}])[0]
    wsid = data['info'][6]
    refs = data['data']['ws_refs']
    elements = {}
    gcount = 0
    namehash = {}
    objectids = []
    for key in refs:
        if key[:5] != "kb|g.":
            param = 'param'+`gcount`
            gcount = gcount+1
            ref = refs[key]['g'][0]
            objectids.append({'ref':ref})
            elements[param] = {'ref': ref}

    infos = ws.get_object_info(objectids,0);
    for item in infos:
        namehash[item[1]] = 1

    for key in refs:
        if key[:5] == "kb|g.":
            ref = refs[key]['g'][0]
            newname = data['data']['default_node_labels'][key];
            newname = re.sub('[^a-zA-Z0-9_\.]', '_', newname)
            if newname in namehash:
                count = 0
                testname = newname+'_'+`count`
                while testname in namehash:
                    count = count + 1
                    testname = newname+'_'+`count`

                newname = testname

            namehash[newname] = 1
            wsinfo = ws.copy_object({
                'to':{'workspace':workspace,'name':newname},
                'from':{'objid':ref.split('/')[1],'wsid':ref.split('/')[0]}
            })
            wsid = wsinfo[6]
            name = wsinfo[0]
            version = wsinfo[4]
            ref = `wsid`+"/"+`name`+"/"+`version`
            param = 'param'+`gcount`
            gcount = gcount+1
            elements[param] = {'ref': ref}

    description = 'GenomeSet of genome included in species tree ' + workspace + '/' + tree_id
    ws.save_objects({
        'workspace': workspace,
        'objects': [{
                'type': 'KBaseSearch.GenomeSet',
                'data': {'description': description,'elements': elements},
                'name': genome_set
        }]
    })

    return json.dumps({'loadExisting': 1,'genomeSetName': genome_set, 'wsName': workspace})

@method(name="Build Genome Set Object")
def _build_genome_set(meth, out_genome_set):
    """ Construct a Genome Set object [22]

    :param out_genome_set: Output genome set ID. If empty, an ID will be chosen randomly. [22.1]
    :type out_genome_set: kbtypes.KBaseSearch.GenomeSet
    :ui_name out_genome_set: Output genome set ID
    :return: Genome set Result
    :rtype: kbtypes.Unicode
    :output_widget: kbaseGenomeSetBuilder
    """
    meth.stages = 1
    token, workspace = meth.token, meth.workspace_id
    if not out_genome_set:
        out_genome_set = "genome_set_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    return json.dumps({'genomeSetName': out_genome_set, 'wsName': workspace})

@method(name="Insert Set of Genomes into Species Tree")
def _insert_genome_set_into_species_tree(meth, genome_set, neighbor_count, out_tree):
    """ Insert a Genome Set into a global genome tree composed of 50 conserved COGs [23]

    :param genome_set: a Genome Set to insert into the tree [23.1]
    :type genome_set: kbtypes.KBaseSearch.GenomeSet
    :ui_name genome_set: Genome Set ID
    :param neighbor_count: number of closest public genomes the tree will contain. (optional, default value is 100) [23.2]
    :type neighbor_count: kbtypes.Unicode
    :ui_name neighbor_count: Neighbor public genome count
    :param out_tree: Output species tree ID. If empty, an ID will be chosen randomly. [23.3]
    :type out_tree: kbtypes.KBaseTrees.Tree
    :ui_name out_tree: Output species tree ID
    :return: Species Tree Result
    :rtype: kbtypes.Unicode
    :output_widget: kbaseTree
    """
    meth.stages = 2
    meth.advance("Instantiating tree construction job...")
    token, workspace = meth.token, meth.workspace_id
    if not out_tree:
        out_tree = "sptree_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    
    ws = workspaceService(service.URLS.workspace, token=token)
    data = ws.get_objects([{'ref': workspace+'/'+genome_set}])[0]
    genome_set_elements = data['data']['elements']
    genome_refs = []
    for key in genome_set_elements:
        genome_refs.append(genome_set_elements[key]['ref'])
    treeClient = KBaseTrees(url = service.URLS.trees, token = token)
    construct_species_tree_params = {
        'new_genomes': genome_refs, 
        'use_ribosomal_s9_only': 0, 
        'out_workspace': workspace, 
        'out_tree_id': out_tree, 
    }
    if neighbor_count:
        construct_species_tree_params['nearest_genome_count'] = int(neighbor_count)
    job_id = treeClient.construct_species_tree(construct_species_tree_params)
    return json.dumps({'treeID': out_tree, 'workspaceID': workspace, 'height':'500px', 'jobID': job_id})

@method(name="Align Protein Sequences")
def _align_protein_sequences(meth, feature_set, alignment_method, out_msa):
    """Construct multiple sequence alignment object based on set of proteins. [27]

    :param feature_set: An object with protein features [27.1]
    :type feature_set: kbtypes.KBaseSearch.FeatureSet
    :ui_name feature_set: Feture Set Object
    :param alignment_method: name of alignment method (one of Muscle, Clustal, ProbCons, T-Coffee, Mafft), leave it blank for default Clustal method [27.2]
    :type alignment_method: kbtypes.Unicode
    :ui_name alignment_method: Multiple Alignment Method
    :param out_msa: Multiple sequence alignment object ID. If empty, an ID will be chosen randomly. [27.3]
    :type out_msa: kbtypes.KBaseTrees.MSA
    :ui_name out_msa: Output MSA ID
    :return: Preparation message
    :rtype: kbtypes.Unicode
    :output_widget: kbaseMSA
    """
    if not alignment_method:
        alignment_method = 'Clustal'
    if not out_msa:
        out_msa = "msa_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    meth.stages = 1
    token, workspace = meth.token, meth.workspace_id
    ws = workspaceService(service.URLS.workspace, token=token)
    elements = ws.get_objects([{'ref': workspace+'/'+feature_set}])[0]['data']['elements']
    gene_sequences = {}
    for key in elements:
        elem = elements[key]['data']
        id = elem['id']
        if 'genome_ref' in elem:
            genome_obj_name = ws.get_object_info([{'ref' : elem['genome_ref']}],0)[0][1]
            id = genome_obj_name + '/' + id
        seq = elements[key]['data']['protein_translation']
        gene_sequences[id] = seq
    treeClient = KBaseTrees(url = service.URLS.trees, token = token)
    construct_multiple_alignment_params = {
        'gene_sequences': gene_sequences,                                  
        'alignment_method': alignment_method, 
        'out_workspace': workspace, 
        'out_msa_id': out_msa 
    }
    job_id = treeClient.construct_multiple_alignment(construct_multiple_alignment_params)
    return json.dumps({'workspaceID': workspace, 'msaID': out_msa, 'jobID' : job_id})

@method(name="View Multiple Alignment")
def _view_alignment(meth, msa_id):
    """View multiple sequence alignment. [29]

    :param msa_id: Multiple sequence alignment object ID.[29.1]
    :type msa_id: kbtypes.KBaseTrees.MSA
    :ui_name msa_id: MSA ID
    :return: Preparation message
    :rtype: kbtypes.Unicode
    :output_widget: kbaseMSA
    """
    return json.dumps({'workspaceID': meth.workspace_id, 'msaID': msa_id})

@method(name="Build Gene Tree")
def _build_gene_tree(meth, msa, out_tree):
    """ Build phylogenetic tree for multiple alignmnet of protein sequences [28]

    :param msa: a Multiple sequence alignment [28.1]
    :type msa: kbtypes.KBaseTrees.MSA
    :ui_name msa: MSA ID
    :param out_tree: Output gene tree ID. If empty, an ID will be chosen randomly. [28.2]
    :type out_tree: kbtypes.KBaseTrees.Tree
    :ui_name out_tree: Output gene tree ID
    :return: Species Tree Result
    :rtype: kbtypes.Unicode
    :output_widget: kbaseTree
    """
    meth.stages = 1
    token, workspace = meth.token, meth.workspace_id
    if not out_tree:
        out_tree = "genetree_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    treeClient = KBaseTrees(url = service.URLS.trees, token = token)
    construct_tree_for_alignment_params = {
        'msa_ref': workspace + '/' + msa, 
        'tree_method': 'FastTree', 
        'out_workspace': workspace, 
        'out_tree_id': out_tree
    }
    job_id = treeClient.construct_tree_for_alignment(construct_tree_for_alignment_params)
    return json.dumps({'treeID': out_tree, 'workspaceID': workspace, 'height':'500px', 'jobID': job_id})

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
