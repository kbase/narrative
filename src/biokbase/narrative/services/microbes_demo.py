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
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import init_service, method, finalize_service
#from biokbase.workspaceService.Client import workspaceService
from biokbase.workspaceServiceDeluxe.Client import Workspace as workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.fbaModelServices.Client import fbaModelServices
from biokbase.GenomeComparison.Client import GenomeComparison
from biokbase.assembly.client import Client as ArastClient

## Globals

VERSION = (0, 0, 1)
NAME = "Microbes Services"

# Initialize
init_service(name=NAME, desc="Demo workflow microbes service", version=VERSION)

@method(name="Assemble Contigs from Reads")
def _assemble_contigs(meth, asm_input):
    """Use a KBase pipeline to assemble a set of contigs from generated reads files.
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
    arURL = 'http://140.221.84.124:8000/'
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
                       "kbase_assembly_input": asm_data['data']})

@method(name="Get Contigs from Assembly Service")
def _get_contigs(meth, job_id, contig_num, contig_name):
    """Pull down assembled contigs from the Assembly Service.  Enter the Job ID of the Assembly computation.
    The Contig Number indicates the single desired contig returned from a multi-pipeline assembly.

    :param job_id: The Job ID of the desired assembly
    :type job_id: kbtypes.Unicode
    :ui_name job_id: Job Id
    :param contig_num: The contig # returned by Assembly Service (optional)
    :type contig_num: kbtypes.Unicode
    :ui_name contig_num: Contig Number
    :param contig_name: The name of the ContigSet to be created (optional)
    :type contig_name: kbtypes.Unicode
    :ui_name contig_name: Output Contig Name
    :return: An assembly job
    :rtype: kbtypes.Unicode
    """
    ws = os.environ['KB_WORKSPACE_ID']
    token = os.environ['KB_AUTH_TOKEN']
    arURL = '140.221.84.124'
    ar_user = token.split('=')[1].split('|')[0]
    wsClient = workspaceService(service.URLS.workspace, token=token)
    aclient = ArastClient(arURL, ar_user, token)

    #### Get Fasta from Assembly service
    outdir = os.path.join('/tmp', str(uuid.uuid4()))
    if not contig_num:
        contig_num = 1
    aclient.get_assemblies(job_id=job_id, asm_id=contig_num, outdir=outdir)
    outfile = os.path.join(outdir, os.listdir(outdir)[0])

    #### Fasta to ContigSet
    def fasta_to_contigset(fasta_file, name):
        contig_set = {'name:': name,
                      'source':'AssemblyService',
                      'type': 'Genome',
                      'contigs': [],
                      'id': name,
                      'source_id': name}

        ##### Parse Fasta content
        contig = {'description', ''}
        seq_buffer = ''
        with open(fasta_file) as f:
            for line in f:
                if line[0] == '>':
                    header = line[1:].rstrip()
                    contig['id'] = header
                    contig['name'] = header
                    header = ''
                elif line[0] == '\n':
                    if seq_buffer != '':
                        contig['sequence'] = seq_buffer
                        m = hashlib.md5()
                        m.update(seq_buffer)
                        contig['md5'] = str(m.hexdigest())
                        contig['length'] = len(seq_buffer)
                        seq_buffer = ''
                        contig_set['contigs'].append(contig)
                        contig = {'description', ''}
                else:
                    seq_buffer += line.rstrip()
            if seq_buffer != '':
                contig['sequence'] = seq_buffer
                m = hashlib.md5()
                m.update(seq_buffer)
                contig['md5'] = str(m.hexdigest())
                contig['length'] = len(seq_buffer)
                contig_set['contigs'].append(contig)
        m = hashlib.md5()
        m.update(str(contig_set['contigs']))
        contig_set['md5'] = str(m.hexdigest())
        
        return contig_set

    if not contig_name:
        contig_name = str(job_id) + '.assembly.contigset'

    cs_data = fasta_to_contigset(outfile, contig_name)
    ws_saveobj_params = {'id': contig_name,
                         'type': 'KBaseGenomes.ContigSet',
                         'workspace': ws,
                         'data': cs_data}
    wsClient.save_object(ws_saveobj_params)

    return json.dumps({'Success': '{} saved to worksapace as {}'.format(
                os.path.basename(outfile), contig_name)})

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
    """Upload a Genome and ContigSet from GBK-file into your workspace.
    This function should be run before adding SEED annotations to this Genome. [20]

    :param genome_id: Output Genome ID. If empty, an ID will be chosen randomly. [20.1]
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

@method(name="Convert Contigs to a Genome")
def _prepare_genome(meth, contig_set, scientific_name, out_genome):
    """Wrap a ContigSet as a Genome object in your workspace.
    This function should be run before trying to annotate a Genome. [3]

    :param contig_set: An object with contig data [3.1]
    :type contig_set: kbtypes.KBaseGenomes.ContigSet
    :ui_name contig_set: Contig Set Object
    :param scientific_name: enter the scientific name to assign to your new genome [3.2]
    :type scientific_name: kbtypes.Unicode
    :ui_name scientific_name: Scientific Name
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly. [3.3]
    :type out_genome: kbtypes.KBaseGenomes.Genome
    :ui_name out_genome: Output Genome ID
    :return: Preparation message
    :rtype: kbtypes.Unicode
    :output_widget: GenomeAnnotation
    """
    if not scientific_name:
        return json.dump({'error': 'output genome name should be defined'})
    if not out_genome:
        out_genome = "genome_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    meth.stages = 1
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
        'genetic_code': 11,
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

@method(name="Add SEED Annotation")
def _add_seed_annotation(meth, genome, out_genome):
    """Add SEED annotations to a genome.  This function will start a job that might run for an hour or longer.
    When the job finishes, the Genome with SEED annotations will be stored in your workspace. [21]
    
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

@method(name="Build a Metabolic Model")
def _genome_to_fba_model(meth, genome_id, fba_model_id):
    """Given an annotated Genome, build a draft metabolic model which can be analyzed with FBA. [6]

    :param genome_id: Source genome name [6.1]
    :type genome_id: kbtypes.KBaseGenomes.Genome
    :ui_name genome_id: Genome Name
    
    :param fba_model_id: select a name for the generated metabolic model (optional) [6.2]
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: Output Metabolic Model Name
    
    :return: Generated Metabolic Model ID
    :rtype: kbtypes.KBaseFBA.FBAModel
    :output_widget: kbaseModelTabs
    """
    """
    Old output widget that was used:
    :output_widget: kbaseModelMetaNarrative
    
    Options that we should expose at some point:
    :param fba_model_template_id: specify a custom template for building the model (optional) [6.3]
    :type fba_model_template_id: kbtypes.Unicode
    :ui_name fba_model_template_id: FBA Model Template
    :param prob_annot: set to 1 to indicate that probabilistic annotations should be used (optional) [6.4]
    :type prob_annot: kbtypes.Unicode
    :ui_name prob_annot: Use Probabilitstic Annotations?
    :param core_model: set to 1 to indicate that a core metabolic model should be constructed instead of a full genome scale model (optional) [6.5]
    :type core_model: kbtypes.Unicode
    :ui_name core_model: Core Model Only?
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting")
    meth.advance("Building your new FBA model")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id
    fbaClient = fbaModelServices(service.URLS.fba,token=userToken)
    
    # create the model object
    build_fba_params = {
        'genome': genome_id,
        'workspace': workspaceName
    }
    if fba_model_id:
        fba_model_id = fba_model_id.strip()
        build_fba_params['model']=fba_model_id
    
    #if core_model:
    #    build_fba_params['coremodel']=1
    #if prob_annot:
    #    build_fba_params['probannoOnly']=1
        
    # other options that are not exposed
     #selecting a model template
    fba_meta_data = fbaClient.genome_to_fbamodel(build_fba_params)
    model_wsobj_id = fba_meta_data[0]
    model_name = fba_meta_data[1]
    
    # fetch the model via fba client
    #get_models_params = {
    #    'models' : [model_name],
    #      'workspaces' : [workspaceName]
    #}
    #modeldata = fbaClient.get_models(get_models_params)
    #meth.advance("Displaying your new FBA model details")
    return json.dumps({'id': model_name, 'ws': workspaceName})


@method(name="View Metabolic Model Details")
def _view_model_details(meth, fba_model_id):
    """Bring up a detailed view of your metabolic model within the narrative. [7]
    
    :param fba_model_id: the metabolic model to view [7.1]
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: Metabolic Model
    
    :return: Metabolic Model Data
    :rtype: kbtypes.Model
    :output_widget: kbaseModelTabs
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id;
    meth.advance("Loading the model")
    
    # fetch via fba client (NOW HANDLED IN JS WIDGET)
    #fbaClient = fbaModelServices(service.URLS.fba, token=userToken)
    #get_models_params = {
    #    'models' : [fba_model_id],
    #    'workspaces' : [workspaceName]
    #}
    #modeldata = fbaClient.get_models(get_models_params)
    return json.dumps({'id': fba_model_id, 'ws': workspaceName})


@method(name="Build Media")
def _build_media(meth, media):
    """Assemble a set of compounds to use as a media set for performing FBA on a metabolic model. [8]

    :param base_media: Base media type [8.1]
    :type base_media: kbtypes.KBaseBiochem.Media
    :ui_name base_media: Media ID
    :return: Metadata from new Media object
    :rtype: kbtypes.KBaseBiochem.Media
    :input_widget: kbaseBuildMediaInput
    :output_widget: kbaseMediaViewer
    :embed: True
    """
    meth.stages = 3

    meth.advance("Initializing")
    token, workspace_id = meth.token, meth.workspace_id

    fba = fbaModelServices(service.URLS.fba, token=token)

    media = json.loads(media)
    media['auth'] = token
    media['workspace'] = workspace_id

    meth.advance("Submitting Media to workspace")

    media_meta = fba.addmedia(media)

    meth.advance("Rendering new Media object")
    fetch_media_input = {
        'medias' : [media['name']],
        'workspaces' : [workspace_id],
        'auth' : token
    }
    new_media = fba.get_media(fetch_media_input)

    result = {'metadata': media_meta, 'media' : new_media[0] }
    return json.dumps(result)

@method(name="View Media")
def _view_media(meth, media_id):
    """Bring up a detailed view of a Media set within the narrative. [9]

    :param media_id: Media type [9.1]
    :type media_id: kbtypes.KBaseBiochem.Media
    :ui_name media_id: Media ID
    :return: A Media object
    :rtype: kbtypes.KBaseBiochem.Media
    :output_widget: kbaseMediaViewer
    :embed: True
    """
    meth.stages = 3
    meth.advance("Initializing")
    token, workspace_id = meth.token, meth.workspace_id

    fba = fbaModelServices(service.URLS.fba, token=token)

    meth.advance("Fetching Media from workspace")

    fetch_media_input = {
        'medias' : [media_id],
        'workspaces' : [workspace_id],
        'auth' : token
    }
    media = fba.get_media(fetch_media_input)

    meth.advance("Rendering Media object")

    result = {'metadata' : None, 'media' : media[0]}
    return json.dumps(result)

@method(name="Run Flux Balance Analysis")
def _run_fba(meth, fba_model_id, media_id, fba_result_id, geneko, rxnko, defaultmaxflux, defaultminuptake, defaultmaxuptake, minimizeFlux, maximizeObjective, allreversible):
    """Run Flux Balance Analysis on a metabolic model. [10]

    :param fba_model_id: the metabolic model you wish to run [10.1]
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: Metabolic Model
    
    :param media_id: the media condition in which to run FBA (optional, default is an artificial complete media) [10.2]
    :type media_id: kbtypes.KBaseBiochem.Media
    :ui_name media_id: Media
    
    :param fba_result_id: select a name for the FBA result object (optional) [10.3]
    :type fba_result_id: kbtypes.KBaseFBA.FBA
    :ui_name fba_result_id: Output FBA Result Name
    
    :param geneko: specify gene knockouts by the gene's feature ID delimited by semicolons(;) (optional) [10.4]
    :type geneko: kbtypes.Unicode
    :ui_name geneko: Gene Knockouts
    
    :param rxnko: specify reaction knockouts by reaction ID delimited by semicolons(;) (optional) [10.5]
    :type rxnko: kbtypes.Unicode
    :ui_name rxnko: Reaction Knockouts
    
    :param defaultmaxflux: specify the default maximum intracellular flux (optional) [10.6]
    :type defaultmaxflux: kbtypes.Unicode
    :ui_name defaultmaxflux: Default Maximum flux
    :default defaultmaxflux: 100
    
    :param defaultminuptake: specify the default minumum nutrient uptake flux (optional) [10.7]
    :type defaultminuptake: kbtypes.Unicode
    :ui_name defaultminuptake: Default Min Uptake
    :default defaultminuptake: -100
    
    :param defaultmaxuptake: specify the default maximum nutrient uptake flux (optional) [10.8]
    :type defaultmaxuptake: kbtypes.Unicode
    :ui_name defaultmaxuptake: Default Max Uptake
    :default defaultmaxuptake: 0
    
    :param minimizeFlux: set to 'yes' or '1' to run FBA by minimizing flux (optional) [10.9]
    :type minimizeFlux: kbtypes.Unicode
    :ui_name minimizeFlux: Minimize Flux?
    :default minimizeFlux: no
    
    :param maximizeObjective: set to 'no' or '0' to run FBA without maximizing the objective function (optional) [10.10]
    :type maximizeObjective: kbtypes.Unicode
    :ui_name maximizeObjective: Maximize Objective?
    :default maximizeObjective: yes
    
    :param allreversible: set to 'yes' or '1' to allow all model reactions to be reversible (optional) [10.11]
    :type allreversible: kbtypes.Unicode
    :ui_name allreversible: All rxns reversible?
    :default allreversible: no
    
    :return: something 
    :rtype: kbtypes.Unicode
    :output_widget: kbaseFbaTabsNarrative
    """
    
    ## !! Important note!  the default values set here are for display only, so we actually revert to the
    ## default values in the FBA modeling service.  Thus, if default values are updated there, the default values
    ## displayed to the end user will be incorrect!
    
    meth.stages = 3
    meth.advance("Setting up and validating FBA parameters")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id;
    fbaClient = fbaModelServices(service.URLS.fba, token=userToken)
    
    # setup the parameters
    """
    bool minimizeflux - a flag indicating if flux variability should be run (an optional argument: default is '0')
    typedef structure {
        fbamodel_id model;
        workspace_id model_workspace;
        FBAFormulation formulation;
        bool fva;
        bool simulateko;
        bool minimizeflux;
        bool findminmedia;
        string notes;
        fba_id fba;
        workspace_id workspace;
        string auth;
        bool overwrite;
        bool add_to_model;
    } runfba_params;

    typedef structure {
        media_id media;
        list<compound_id> additionalcpds;
        prommodel_id prommodel;
        workspace_id prommodel_workspace;
        workspace_id media_workspace;
        float objfraction;
        bool allreversible;
        bool maximizeObjective;
        list<term> objectiveTerms;
        list<feature_id> geneko;
        list<reaction_id> rxnko;
        list<bound> bounds;
        list<constraint> constraints;
        mapping<string,float> uptakelim;
        float defaultmaxflux;
        float defaultminuptake;
        float defaultmaxuptake;
        bool simplethermoconst;
        bool thermoconst;
        bool nothermoerror;
        bool minthermoerror;
    } FBAFormulation;
    """
    
    # handle and/or validate parameters...
    if not fba_model_id:
        raise Exception("Error in running FBA: model name was not specified")
    
    if media_id:
        fba_formulation = {
            'media' : media_id,
            'media_workspace' : workspaceName,
        }
    else:
        fba_formulation = {}
        
    fba_params = {
        'model' : fba_model_id,
        'model_workspace' : workspaceName,
        'formulation' : fba_formulation,
        'workspace' : workspaceName,
        'notes' : "ran from the narrative"
    }
    fba_result_id = fba_result_id.strip()
    if fba_result_id:
        fba_params['fba'] = fba_result_id
    if geneko:
        fba_params['simulateko'] = 1
        fba_params['formulation']['geneko']=geneko.split(";")
    if rxnko:
        fba_params['simulateko'] = 1
        fba_params['formulation']['rxnko']=rxnko.split(";")
    if maximizeObjective=='0' or maximizeObjective=='false' or maximizeObjective=='no':
        fba_params['formulation']['maximizeObjective'] = 0
    else:
        fba_params['formulation']['maximizeObjective'] = 1
        
    if minimizeFlux=='1' or minimizeFlux=='true' or minimizeFlux=='yes':
        fba_params['minimizeflux'] = 1
    else:
        fba_params['minimizeflux'] = 0
        
    if allreversible=='1' or allreversible=='true' or allreversible=='yes':   
        fba_params['formulation']['allreversible'] = 1
    else:  
        fba_params['formulation']['allreversible'] = 0
        

    if defaultmaxflux:
        try:
            fba_params['formulation']['defaultmaxflux'] = float(defaultmaxflux)
        except:
            raise Exception("Default maximum flux must be a valid number.")
    else:
        fba_params['formulation']['defaultmaxflux'] = 100
    if defaultminuptake:
        try:
            fba_params['formulation']['defaultminuptake'] = float(defaultminuptake)
        except:
            raise Exception("Default minimum uptake must be a valid number.")
    else:
        fba_params['formulation']['defaultminuptake'] = -100
    if defaultmaxflux:
        try:
            fba_params['formulation']['defaultmaxuptake'] = float(defaultmaxuptake)
        except:
            raise Exception("Default maximum uptake must be a valid number.")
    else:
        fba_params['formulation']['defaultmaxuptake'] = 0
    
    meth.debug(json.dumps(fba_params))

    meth.advance("Running FBA")
    result_meta = fbaClient.runfba(fba_params)
    generated_fba_id = result_meta[0]
    
    #meth.advance("Retrieving FBA results")
    #get_fbas_params = {
    #    'fbas' : [generated_fba_id],
    #    'workspaces' : [workspaceName]
    #}
    #fbadata = fbaClient.get_fbas(get_fbas_params)
    
    # a hack: get object info so we can have the object name (instead of the id number)
    ws = workspaceService(service.URLS.workspace, token=userToken)
    meth.advance("Loading the model")
    get_objects_params = [{
        'ref' : workspaceName+"/"+generated_fba_id
    }]
    info = ws.get_object_info(get_objects_params,0)
    
    return json.dumps({ "ids":[info[0][1]],"workspaces":[workspaceName] })



@method(name="View FBA Result Details")
def _view_fba_result_details(meth, fba_id):
    """Bring up a detailed view of your FBA result within the narrative. [11]
    
    :param fba_id: the FBA Result to view [11.1]
    :type fba_id: kbtypes.KBaseFBA.FBA
    :ui_name fba_id: FBA Result
    
    :return: something 
    :rtype: kbtypes.Unicode
    
    :output_widget: kbaseFbaTabsNarrative
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    token, workspaceName = meth.token, meth.workspace_id;
    #fbaClient = fbaModelServices(service.URLS.fba)
    
    meth.advance("Retrieving FBA results")
    #get_fbas_params = {
    #    'fbas' : [fba_id],
    #    'workspaces' : [workspaceName],
    #    'auth' : token
    #}
    #fbadata = fbaClient.get_fbas(get_fbas_params)
    
    
    return json.dumps({ "ids":[fba_id],"workspaces":[workspaceName] })




@method(name="Gapfill a Metabolic Model")
def _gapfill_fba(meth, fba_model_id, media_id, solution_limit, total_time_limit, solution_time_limit):
    """Run Gapfilling on an metabolic model.  Gapfill attempts to identify the minimal number of reactions
    needed to add to your metabolic model in order for the model to predict growth in the
    given media condition (or in complete media if no Media is provided).  Gapfilling is
    an optimization procedure that can produce many possible solutions.  After a gapfilling
    job is submitted and run, you can view the results by viewing a metabolic model details,
    and incorporate the new reactions by running the Integrate Gapfill Solution function. [12]

    :param fba_model_id: the metabolic model to gapfill [12.1]
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: Metabolic Model
    
    :param media_id: the media condition in which to gapfill [12.2]
    :type media_id: kbtypes.KBaseBiochem.Media
    :ui_name media_id: Media
    
    :param solution_limit: select the number of solutions you want to find [12.3]
    :type solution_limit: kbtypes.Unicode
    :ui_name solution_limit: Number of Solutions
    :default solution_limit: 5
    
    :param total_time_limit: the total time you want to run gapfill [12.4]
    :type total_time_limit: kbtypes.Unicode
    :ui_name total_time_limit: Total Time Limit (s)
    :default total_time_limit: 18000
    
    :param solution_time_limit: the max time you want to spend per solution [12.5]
    :type solution_time_limit: kbtypes.Unicode
    :ui_name solution_time_limit: Solution Time Limit (s)
    :default solution_time_limit: 3600
    
    :return: job ID string
    :rtype: kbtypes.Unicode
    :output_widget: kbaseGapfillStatus
    """
    
    # setting the output id appears to not work, so for now we leave it out
    #:param output_model_id: select a name for the FBA result object (optional)
    #:type output_model_id: kbtypes.Unicode
    #:ui_name output_model_id: Output FBA Result Name
    
    meth.stages = 2
    meth.advance("Setting up gapfill parameters")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id;

    fbaClient = fbaModelServices(service.URLS.fba,token=userToken)

    """
    typedef structure {
        FBAFormulation formulation;
        int num_solutions;
        bool nomediahyp;
        bool nobiomasshyp;
        bool nogprhyp;
        bool nopathwayhyp;
        bool allowunbalanced;
        float activitybonus;
        float drainpen;
        float directionpen;
        float nostructpen;
        float unfavorablepen;
        float nodeltagpen;
        float biomasstranspen;
        float singletranspen;
        float transpen;
        list<reaction_id> blacklistedrxns;
        list<reaction_id> gauranteedrxns;
        list<compartment_id> allowedcmps;
        probanno_id probabilisticAnnotation;
        workspace_id probabilisticAnnotation_workspace;
    } GapfillingFormulation;
    
    typedef structure {
        media_id media;
        list<compound_id> additionalcpds;
        prommodel_id prommodel;
        workspace_id prommodel_workspace;
        workspace_id media_workspace;
        float objfraction;
        bool allreversible;
        bool maximizeObjective;
        list<term> objectiveTerms;
        list<feature_id> geneko;
        list<reaction_id> rxnko;
        list<bound> bounds;
        list<constraint> constraints;
        mapping<string,float> uptakelim;
        float defaultmaxflux;
        float defaultminuptake;
        float defaultmaxuptake;
        bool simplethermoconst;
        bool thermoconst;
        bool nothermoerror;
        bool minthermoerror;
    } FBAFormulation;
    
    typedef structure {
        fbamodel_id model;
        workspace_id model_workspace;
        GapfillingFormulation formulation;
        phenotype_set_id phenotypeSet;
        workspace_id phenotypeSet_workspace;
        bool integrate_solution;
        fbamodel_id out_model;
        workspace_id workspace;
        gapfill_id gapFill;
        int timePerSolution;
        int totalTimeLimit;
        string auth;
        bool overwrite;
        bool completeGapfill;
    } gapfill_model_params;
    """
    
    fba_formulation = {}
    if (media_id):
        fba_formulation = {
            'media' : media_id,
            'media_workspace' : workspaceName
        }

    # set some default values
    if not solution_limit:
        solution_limit = 5 #10*60 #10 minutes
    if not solution_time_limit:
        solution_time_limit = 10*60 #10 minutes
    if not total_time_limit:
        total_time_limit = 10*60 #10 minutes
        
    
    gapfill_formulation = {
        'formulation' : fba_formulation,
        'num_solutions' : int(solution_limit),
    }
    gapfill_params = {
        'model' : fba_model_id,
        'model_workspace' : workspaceName,
        'formulation' : gapfill_formulation,
        'workspace' : workspaceName,
        'timePerSolution' : int(solution_time_limit),
        'totalTimeLimit' : int(total_time_limit)
        #'auth' : token
    }
    #if(output_model_id):
    #    gapfill_params['out_model'] = output_model_id,

    meth.advance("Submitting gapfill job")
    job_data = fbaClient.queue_gapfill_model(gapfill_params);

    job_id = job_data['id'].strip()
    total_time_hrs = round(int(total_time_limit) / 3600.0,3)
    hour_suffix = ""
    if (total_time_hrs is not 1):
        hour_suffix = "s"

    return json.dumps(
        {
            #'job_data':job_data
            #'job_id':job_id,
            'estimated_time_str': str(total_time_hrs) + " hour" + str(hour_suffix),
            #'output_data_id' : str(job_data['jobdata']['postprocess_args'][0]['out_model'].strip()),
            #'token' : token,
            'job_data' : job_data
        })

@method(name="Integrate Gapfill Solution")
def _integrate_gapfill(meth, fba_model_id, gapfill_id, output_model_id):
    """Integrate a Gapfill solution into your metabolic model [13]

    :param fba_model_id: the metabolic model to integrate gapfill solutions into [13.1]
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: Metabolic Model
    
    :param gapfill_id: select the ID of the gapfill solution (found in the Gapfilling tab in the model viewer, usually in the form 'modelId.gf.2.gfsol.1') [13.2]
    :type gapfill_id: kbtypes.KBaseFBA.Gapfilling
    :ui_name gapfill_id: Gapfill ID
    :default gapfill_id: e.g model.gf.2.gfsol.1

    :param output_model_id: select a name for the gapfilled object (optional) [13.3]
    :type output_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name output_model_id: Output Model Result Name
    
    :output_widget: kbaseIntegrateGapfillOutput
    
    :return: gapfilled model ID
    :rtype: kbtypes.Unicode
    """
    meth.stages = 2
    meth.advance("Setting up parameters")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id;
    fbaClient = fbaModelServices(service.URLS.fba, token=userToken)

    """
    typedef structure {
        fbamodel_id model;
        workspace_id model_workspace;
        list<gapfillsolution_id> gapfillSolutions;
        list<gapgensolution_id> gapgenSolutions;
        fbamodel_id out_model;
        workspace_id workspace;
        string auth;
        bool overwrite;
    } integrate_reconciliation_solutions_params;
    """
    integrate_params = {
        'model' : fba_model_id,
        'model_workspace' : workspaceName,
        'gapfillSolutions' : [gapfill_id],
        'gapgenSolutions' : [],
        'workspace' : workspaceName
    }
    
    # get the model to determine the number of reactions
    wsClient = workspaceService(service.URLS.workspace, token=userToken)
    firstReactionList = wsClient.get_object_subset([{'ref':workspaceName+"/"+fba_model_id, 'included':["/modelreactions/[*]/id"]}])
    #meth.debug(json.dumps(firstReactionList));

    output_model_id = output_model_id.strip()
    if (output_model_id):
        integrate_params['out_model'] = output_model_id
    else:
        output_model_id = fba_model_id

    # funcdef integrate_reconciliation_solutions(integrate_reconciliation_solutions_params input) returns (object_metadata modelMeta);
    meth.advance("Integrating the gapfill solution")
    model_meta = fbaClient.integrate_reconciliation_solutions(integrate_params)
    finalReactionList = wsClient.get_object_subset([{'ref':workspaceName+"/"+output_model_id, 'included':["/modelreactions/[*]/id"]}])

    return json.dumps( {
        "workspaceName":workspaceName,
        "originalModel":fba_model_id,
        "originalModelRef":str(firstReactionList[0]['info'][6])+"/"+str(firstReactionList[0]['info'][0])+"/"+str(firstReactionList[0]['info'][4]),
        "startingNumRxns":len(firstReactionList[0]['data']['modelreactions']),
        "newModel":output_model_id,
        "newModelRef":str(finalReactionList[0]['info'][6])+"/"+str(finalReactionList[0]['info'][0])+"/"+str(finalReactionList[0]['info'][4]),
        "endingNumRxns":len(finalReactionList[0]['data']['modelreactions'])
        })

#@method(name="Upload Phenotype Data")
def _upload_phenotype(meth, genome_id, phenotype_id):
    """Upload phenotype data for FBA analysis [14]

    :param genome_id: a genome id [14.1]
    :type genome_id: kbtypes.KBaseGenomes.Genome
    :ui_name genome_id: Genome ID
    :param phenotype_id: a phenotype ID [14.2]
    :type phenotype_id: kbtypes.KBasePhenotypes.PhenotypeSet
    :ui_name phenotype_id: Phenotype Dataset ID
    :return: something
    :rtype: kbtypes.Unicode
    :output_widget: PhenotypeUploader
    """

    if not phenotype_id:
        phenotype_id = "phenotype_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    return json.dumps({'token': token, 'ws_name': workspace, 'genome_id': genome_id, 'phenotype_id': phenotype_id})

#@method(name="Simulate Phenotype Data")
def _simulate_phenotype(meth, fba_model_id, phenotype_id, simulation_id):
    """Simulate some phenotype on an FBA model [15]

    :param fba_model_id: an FBA model id [15.1]
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: FBA Model ID
    :param phenotype_id: a phenotype ID [15.2]
    :type phenotype_id: kbtypes.KBasePhenotypes.PhenotypeSet
    :ui_name phenotype_id: Phenotype Dataset ID
    :param simulation_id: an output simulation ID [15.3]
    :type simulation_id: kbtypes.KBasePhenotypes.PhenotypeSimulationSet
    :ui_name simulation_id: Phenotype Simulation ID
    :return: something
    :rtype: kbtypes.Unicode
    :output_widget: PhenotypeSimulation
    """

    if not simulation_id:
        simulation_id = "simulation_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    fbaClient = fbaModelServices(service.URLS.fba)
    simulate_phenotypes_params = {
        'auth': token, 
        'workspace': workspace, 
        'phenotypeSimultationSet': simulation_id,
        'model_workspace': workspace,
        'model': fba_model_id,
        'phenotypeSet_workspace': workspace,
        'phenotypeSet': phenotype_id,
    }
    fbaClient.simulate_phenotypes(simulate_phenotypes_params)
    return json.dumps({'token': token, 'ws_name': workspace, 'simulation_id': simulation_id})

#@method(name="Reconcile Phenotype Data")
def _reconcile_phenotype(meth, fba_model_id, phenotype_id, out_model_id):
    """Run Gapfilling on an FBA Model [16]

    :param fba_model_id: an FBA model id [16.1]
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: FBA Model ID
    :param phenotype_id: a phenotype simulation ID [16.2]
    :type phenotype_id: kbtypes.KBasePhenotypes.PhenotypeSimulationSet
    :ui_name phenotype_id: Phenotype Simulation Dataset ID
    :param out_model_id: a name for the generated FBA Model (optional) [16.3]
    :type out_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name out_model_id: Output FBA Model Name
    :return: something
    :rtype: kbtypes.Unicode
    :output_widget: kbaseModelMetaNarrative
    """

    if not out_model_id:
        out_model_id = "model_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    fbaClient = fbaModelServices(service.URLS.fba)
    wildtype_phenotype_reconciliation_params = {
        'auth': token, 
        'model_workspace': workspace,
        'model': fba_model_id,
        'phenotypeSet_workspace': workspace,
        'phenotypeSet': phenotype_id,
        'workspace': workspace, 
        'out_model': out_model_id,
    }
    job_id = fbaClient.queue_wildtype_phenotype_reconciliation(wildtype_phenotype_reconciliation_params)['id']
    return json.dumps({'token': token, 'ws_name': workspace, 'model_id': out_model_id, 'job_id': job_id})

@method(name="Compare Two Proteomes")
def _compare_proteomes(meth, genome1, genome2, out_proteome_cmp):
    """This starts a job that might run for an hour or longer.
    When it finishes, the annotated Genome will be stored in your data space. [17]
     
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
    """This starts a job that might run for an hour or longer.
    When it finishes, the annotated Genome will be stored in your data space. [18]
     
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

@method(name="Compare Two Metabolic Models")
def _compare_fba_models(meth, fba_model1, fba_model2, proteome_cmp):
    """This starts a job that might run for an hour or longer.
    When it finishes, the annotated Genome will be stored in your data space. [19]
     
    :param fba_model1: an FBA model id from first genome [19.1]
    :type fba_model1: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model1: FBA Model 1 ID
    :param fba_model2: an FBA model id from second genome [19.2]
    :type fba_model2: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model2: FBA Model 2 ID
    :param proteome_cmp: Proteome comparison ID [19.3]
    :type proteome_cmp: kbtypes.GenomeComparison.ProteomeComparison
    :ui_name proteome_cmp: Proteome Comparison ID
    :return: Output Comparison Result
    :rtype: kbtypes.Unicode
    :output_widget: FbaModelComparisonWidget
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    #fbaClient = fbaModelServices(url = service.URLS.fba, token = token)
    #get_models_params = {
    #                     'models' : [fba_model1, fba_model2],
    #                     'workspaces' : [workspace, workspace],
    #                     'auth' : token
    #                     }
    #modeldata = fbaClient.get_models(get_models_params)
    #model1 = modeldata[0]
    #model2 = modeldata[1]
    return json.dumps({'ws_name': workspace, 'fba_model1_id': fba_model1, 'fba_model2_id': fba_model2, 'proteome_cmp': proteome_cmp})


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
