"""
Demo microbes service and methods
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>, Bill Riehl <wjriehl@lbl.gov>'
__date__ = '11/15/13'

## Imports
# Stdlib
import json
import os
import random
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import init_service, method, finalize_service
#from biokbase.workspaceService.Client import workspaceService
from biokbase.workspaceServiceDeluxe.Client import Workspace as workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.fbaModelServices.Client import fbaModelServices
from biokbase.GenomeComparison.Client import GenomeComparison

## Globals

VERSION = (0, 0, 1)
NAME = "Microbes Services"

# Initialize
init_service(name=NAME, desc="Demo workflow microbes service", version=VERSION)

@method(name="Assemble Contigs from Reads")
def _assemble_contigs(meth, reads_files, out_contig_set):
    """Use a KBase pipeline to assemble a set of contigs from generated reads files.
    This starts a job that might run for several hours.
    When it finishes, the assembled ContigSet will be stored in your data space. [1]

    :param reads_files: A list of files with read information [1.1]
    :type reads_files: kbtypes.List
    :ui_name reads_files: Genome Reads files
    :param out_contig_set: The name of the created contig set (leave blank for a random name) [1.2]
    :type out_contig_set: kbtypes.Unicode
    :ui_name out_contig_set: Output ContigSet ID
    :return: A contig assembly job ID
    :rtype: kbtypes.Unicode
    """
    return json.dumps({"output": "Assemble Contigs stub"})


@method(name="Assemble Genome from Fasta")
def _assemble_genome(meth, contig_file, out_genome):
    """This assembles a ContigSet into a Genome object in your data space.
    This should be run before trying to annotate a Genome. [2]

    :param contig_file: A FASTA file with contig data [2.1]
    :type contig_file: kbtypes.Unicode
    :ui_name contig_file: Contig File ID
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly. [2.2]
    :type out_genome: kbtypes.Genome
    :ui_name out_genome: Output Genome ID
    :return: Assembled output genome ID
    :rtype: kbtypes.Genome
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

@method(name="Convert Contigs to a Genome")
def _prepare_genome(meth, contig_set, scientific_name, out_genome):
    """This wraps a ContigSet by a Genome object in your data space.
    This should be run before trying to annotate a Genome. [3]

    :param contig_set: An object with contig data [3.1]
    :type contig_set: kbtypes.KBaseGenomesContigSet1
    :ui_name contig_set: Contig Set Object
    :param scientific_name: enter the scientific name to assign to your new genome [3.2]
    :type scientific_name: kbtypes.Unicode
    :ui_name scientific_name: Scientific Name
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly. [3.3]
    :type out_genome: kbtypes.Unicode
    :ui_name out_genome: Output Genome ID
    :return: Preparation message
    :rtype: kbtypes.Unicode
    """
    if not scientific_name:
        return json.dump({'error': 'output genome name should be defined'})
    if not out_genome:
        out_genome = "genome_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    meth.stages = 1
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    fbaClient = fbaModelServices(service.URLS.fba)
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
    return json.dumps({"output": "New genome was created"})

@method(name="Annotate Assembled Genome")
def _annotate_genome(meth, genome, out_genome):
    """This starts a job that might run for an hour or longer.
    When it finishes, the annotated Genome will be stored in your data space. [4]
    
    :param genome: Source genome ID [4.1]
    :type genome: kbtypes.Genome
    :ui_name genome: Genome ID
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly. [4.2]
    :type out_genome: kbtypes.Unicode
    :ui_name out_genome: Output Genome ID
    :return: Annotated output genome ID
    :rtype: kbtypes.Genome
    :output_widget: GenomeAnnotation
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    if not out_genome:
        out_genome = "genome_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])
    if genome != out_genome:
        wsClient  = workspaceService(service.URLS.workspace)
        retObj = wsClient.get_object({'auth': token, 'workspace': workspace, 'id': genome, 'type': 'Genome'})
        gnmObj = retObj['data']
        gnmObj['id'] = out_genome
        if '_wsWS' in gnmObj:
            del gnmObj['_wsWS']
        if '_wsID' in gnmObj:
            del gnmObj['_wsID']
        wsClient.save_object({'auth': token, 'workspace': workspace, 'id': out_genome, 'type': 'Genome', 'data': gnmObj})
    fbaClient = fbaModelServices(service.URLS.fba)
    annotate_workspace_genome_params = {
        'auth': token, 
        'Genome_ws': workspace, 
        'Genome_uid': out_genome, 
        'workspace':workspace, 
        'new_uid': out_genome,
    }
    job_id = fbaClient.annotate_workspace_Genome(annotate_workspace_genome_params)['id']
    return json.dumps({'token': token, 'ws_name': workspace, 'ws_id': out_genome, 'job_id': job_id})

@method(name="View Annotated Genome")
def _show_genome(meth, genome):
    """View and explore an annotated Genome in your Workspace. [5]
    
    :param genome: select the genome you want to view [5.1]
    :type genome: kbtypes.Genome
    :ui_name genome: Genome
    :return: Same genome ID
    :rtype: kbtypes.Genome
    :output_widget: GenomeAnnotation
    """
    meth.stages = 1  # for reporting progress
    meth.advance("Loading the genome")
    token, workspaceName = meth.token, meth.workspace_id
    return json.dumps({'token': token, 'ws_name': workspaceName, 'ws_id': genome})

@method(name="Build an FBA Model for a Genome")
def _genome_to_fba_model(meth, genome_id, fba_model_id):
    """Given an annotated Genome, build a draft flux balance analysis model. [6]

    :param genome_id: Source genome name [6.1]
    :type genome_id: kbtypes.KBaseGenome3
    :ui_name genome_id: Genome Name
    
    :param fba_model_id: select a name for the generated FBA Model (optional) [6.2]
    :type fba_model_id: kbtypes.KBaseFBA_FBAModel
    :ui_name fba_model_id: Output FBA Model Name
    
    :return: Generated FBA Model ID
    :rtype: kbtypes.Model
    
    :output_widget: kbaseModelMetaNarrative
    """
    """
    THIS OPTION
    :param fba_model_template_id: specify a custom template for building the model (optional) [6.3]
    :type fba_model_template_id: kbtypes.Unicode
    :ui_name fba_model_template_id: FBA Model Template
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting")
    meth.advance("Building your new FBA model")
    
    #grab token and workspace info, setup the client
    token, workspaceName = meth.token, meth.workspace_id
    fbaClient = fbaModelServices(service.URLS.fba)
    
    # create the model object
    build_fba_params = {
        'genome': genome_id,
        'workspace': workspaceName,
        'auth': token,
    }
    if fba_model_id:
        fba_model_id = fba_model_id.strip()
        build_fba_params['model']=fba_model_id;
        
    # other options that are not exposed
    #bool probannoOnly - a boolean indicating if only the probabilistic annotation should be used in building the model (an optional argument; default is '0')
    #fbamodel_id model - ID that should be used for the newly constructed model (an optional argument; default is 'undef')
    #bool coremodel - indicates that a core model should be constructed instead of a genome scale model (an optional argument; default is '0')
    #selecting a model template
    
    fba_meta_data = fbaClient.genome_to_fbamodel(build_fba_params)
    model_wsobj_id = fba_meta_data[0]
    model_name = fba_meta_data[1]
    
    
    #fetch the object so we can display something useful about it
    wsClient  = workspaceService(service.URLS.workspace)
    objdata = wsClient.get_objects([{'ref':workspaceName+'/'+model_wsobj_id}])
    fbaModel = objdata[0]['data']
    meth.debug(json.dumps(fbaModel['modelreactions']))
    
    # compute the number of genes- crazy, i know!  is this actually correct?
    n_features_mapped = 0
    for rxns in fbaModel['modelreactions'] :
        for prots in rxns['modelReactionProteins'] :
            for subunits in prots['modelReactionProteinSubunits']:
                n_features_mapped += len(subunits['feature_refs'])
    
    return json.dumps({"data":{
                             'name': model_name,
                             'number_genes':n_features_mapped,
                             'number_reactions':len(fbaModel['modelreactions']),
                             'number_compounds':len(fbaModel['modelcompounds']),
                             'number_compartments':len(fbaModel['modelcompartments'])
                        }})


@method(name="View FBA Model Details")
def _view_model_details(meth, fba_model_id):
    """Bring up a detailed view of your FBA Model within the narrative. [7]
    
    :param fba_model_id: the FBA Model to view [7.1]
    :type fba_model_id: kbtypes.KBaseFBA_FBAModel
    :ui_name fba_model_id: FBA Model
    
    :return: FBA Model Data
    :rtype: kbtypes.Model
    :output_widget: kbaseModelTabs
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    token, workspaceName = meth.token, meth.workspace_id;
    fbaClient = fbaModelServices(service.URLS.fba)
    
    ws = workspaceService(service.URLS.workspace)
    
    meth.advance("Loading the model")
    get_objects_params = [{
        'workspace' : workspaceName,
        'name' : fba_model_id
    }]
    data = ws.get_objects(get_objects_params)
    
    return json.dumps({'id': fba_model_id, 'ws': workspaceName, 'modelsData': [data[0]['data']]})


@method(name="Build Media")
def _build_media(meth, media):
    """Assemble a set of compounds to use as a media set for performing FBA on a model. [8]

    :param base_media: Base media type [8.1]
    :type base_media: kbtypes.Media
    :ui_name base_media: Media ID
    :return: Metadata from new Media object
    :rtype: kbtypes.Media
    :input_widget: kbaseBuildMediaInput
    :output_widget: kbaseMediaViewer
    :embed: True
    """
    meth.stages = 3

    meth.advance("Initializing")
    fba = fbaModelServices(service.URLS.fba)
    token, workspace_id = meth.token, meth.workspace_id

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

@method(name="Run Flux Balance Analysis")
def _run_fba(meth, fba_model_id, media_id, fba_result_id):
    """Run Flux Balance Analysis on a metabolic model. [9]

    :param fba_model_id: the FBA model you wish to run [9.1]
    :type fba_model_id: kbtypes.KBaseFBA_FBAModel
    :ui_name fba_model_id: FBA Model
    :param media_id: the media condition in which to run FBA [9.2]
    :type media_id: kbtypes.KBaseBiochem_Media
    :ui_name media_id: Media
    
    :param fba_result_id: select a name for the FBA result object (optional) [9.3]
    :type fba_result_id: kbtypes.KBaseFBA_FBA
    :ui_name fba_result_id: Output FBA Result Name
    
    :return: something 
    :rtype: kbtypes.Unicode
    
    :output_widget: kbaseFbaTabsNarrative
    """
    
    meth.stages = 3
    meth.advance("Setting up FBA parameters")
    
    #grab token and workspace info, setup the client
    token, workspaceName = meth.token, meth.workspace_id;
    
    fbaClient = fbaModelServices(service.URLS.fba)
    
    # setup the parameters
    """
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
    fba_formulation = {
        'media' : media_id,
        'media_workspace' : workspaceName,
    }
    fba_params = {
        'model' : fba_model_id,
        'model_workspace' : workspaceName,
        'formulation' : fba_formulation,
        'workspace' : workspaceName,
        'notes' : "ran from the narrative",
        'auth': token,
    }
    fba_result_id = fba_result_id.strip()
    if fba_result_id:
        fba_params['fba'] = fba_result_id

    
    meth.advance("Running FBA")
    result_meta = fbaClient.runfba(fba_params)
    generated_fba_id = result_meta[0]
    
    meth.advance("Retrieving FBA results")
    get_fbas_params = {
        'fbas' : [generated_fba_id],
        'workspaces' : [workspaceName],
        'auth' : token
    }
    fbadata = fbaClient.get_fbas(get_fbas_params)
    
    # a hack: get object info so we can have the object name (instead of the id number)
    ws = workspaceService(service.URLS.workspace)
    meth.advance("Loading the model")
    get_objects_params = [{
        'ref' : workspaceName+"/"+generated_fba_id
    }]
    info = ws.get_object_info(get_objects_params,0)
    
    return json.dumps({ "ids":[info[0][1]],"workspaces":[workspaceName],"fbaData":fbadata })



@method(name="View FBA Result Details")
def _view_fba_result_details(meth, fba_id):
    """This brings up a detailed view of your FBA Model within the narrative. [10]
    
    :param fba_id: the FBA Result to view [10.1]
    :type fba_id: kbtypes.KBaseFBA_FBA
    :ui_name fba_id: FBA Result
    
    :return: something 
    :rtype: kbtypes.Unicode
    
    :output_widget: kbaseFbaTabsNarrative
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    token, workspaceName = meth.token, meth.workspace_id;
    fbaClient = fbaModelServices(service.URLS.fba)
    
    meth.advance("Retrieving FBA results")
    get_fbas_params = {
        'fbas' : [fba_id],
        'workspaces' : [workspaceName],
        'auth' : token
    }
    fbadata = fbaClient.get_fbas(get_fbas_params)
    
    
    return json.dumps({ "ids":[fba_id],"workspaces":[workspaceName],"fbaData":fbadata })




@method(name="Gapfill an FBA Model")
def _gapfill_fba(meth, fba_model_id, media_id, solution_limit, total_time_limit, solution_time_limit):
    """Run Gapfilling on an FBA Model [11]

    :param fba_model_id: the FBA Model to gapfill [11.1]
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model
    
    :param media_id: the media condition in which to gapfill [11.2]
    :type media_id: kbtypes.Media
    :ui_name media_id: Media
    
    :param solution_limit: select the number of solutions you want to find [11.3]
    :type solution_limit: kbtypes.Unicode
    :ui_name solution_limit: Number of Solutions
    
    :param total_time_limit: the total time you want to run gapfill [11.4]
    :type total_time_limit: kbtypes.Unicode
    :ui_name total_time_limit: Total Time Limit (s)
    
    :param solution_time_limit: the max time you want to spend per solution [11.5]
    :type solution_time_limit: kbtypes.Unicode
    :ui_name solution_time_limit: Solution Time Limit (s)
    
    :return: job ID string
    :rtype: kbtypes.Unicode
    """
    
    # setting the output id appears to not work, so for now we leave it out
    #:param output_model_id: select a name for the FBA result object (optional)
    #:type output_model_id: kbtypes.Unicode
    #:ui_name output_model_id: Output FBA Result Name
    

    meth.stages = 2
    meth.advance("Setting up gapfill parameters")
    
    #grab token and workspace info, setup the client
    token, workspaceName = meth.token, meth.workspace_id;
    
    fbaClient = fbaModelServices(service.URLS.fba)

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
        'totalTimeLimit' : int(total_time_limit),
        'auth' : token
    }
    #if(output_model_id):
    #    gapfill_params['out_model'] = output_model_id,

    meth.advance("Submitting gapfill job")
    job_data = fbaClient.queue_gapfill_model(gapfill_params);

    job_id = job_data['id'].strip()
    total_time_hrs = int(total_time_limit) / 3600.0
    hour_suffix = ""
    if (total_time_hrs is not 1):
        hour_suffix = "s"

    return json.dumps(
        {
            'job_id':job_id,
            'estimated_time_str': str(total_time_hrs) + " hour" + str(hour_suffix),
            'output_data_id' : str(job_data['jobdata']['postprocess_args'][0]['out_model'].strip()),
            'token' : token,
            #'job_data' : job_data,
        })

@method(name="Integrate Gapfill Solution")
def _integrate_gapfill(meth, fba_model_id, gapfill_id, output_model_id):
    """Integrate a Gapfill solution into your FBA model [12]

    :param fba_model_id: the FBA Model to integrate gapfill solutions into [12.1]
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model
    
    :param gapfill_id: select the ID of the gapfill solution (found in the Gapfilling tab in the model viewer) [12.2]
    :type gapfill_id: kbtypes.Unicode
    :ui_name gapfill_id: Gapfill ID

    :param output_model_id: select a name for the gapfilled object (optional) [12.3]
    :type output_model_id: kbtypes.Unicode
    :ui_name output_model_id: Output FBA Result Name
    
    :output_widget: kbaseModelMetaNarrative

    :return: gapfilled model ID
    :rtype: kbtypes.Unicode
    """

    meth.stages = 3
    meth.advance("Setting up parameters")
    
    #grab token and workspace info, setup the client
    token, workspaceName = meth.token, meth.workspace_id;
    fbaClient = fbaModelServices(service.URLS.fba)

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
        'workspace' : workspaceName,
        'auth' : token,
    }

    output_model_id = output_model_id.strip()
    if (output_model_id):
        integrate_params['out_model'] = output_model_id

    # funcdef integrate_reconciliation_solutions(integrate_reconciliation_solutions_params input) returns (object_metadata modelMeta);
    meth.advance("Integrating the gapfill solutions")
    model_meta = fbaClient.integrate_reconciliation_solutions(integrate_params)

    return json.dumps({"data":model_meta})

@method(name="Upload Phenotype Data")
def _upload_phenotype(meth, genome_id, phenotype_id):
    """Upload phenotype data for FBA analysis [13]

    :param genome_id: a genome id [13.1]
    :type genome_id: kbtypes.Genome
    :ui_name genome_id: Genome ID
    :param phenotype_id: a phenotype ID [13.2]
    :type phenotype_id: kbtypes.Unicode
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

@method(name="Simulate Phenotype Data")
def _simulate_phenotype(meth, fba_model_id, phenotype_id, simulation_id):
    """Simulate some phenotype on an FBA model [14]

    :param fba_model_id: an FBA model id [14.1]
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :param phenotype_id: a phenotype ID [14.2]
    :type phenotype_id: kbtypes.PhenotypeSet
    :ui_name phenotype_id: Phenotype Dataset ID
    :param simulation_id: an output simulation ID [14.3]
    :type simulation_id: kbtypes.Unicode
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

@method(name="Reconcile Phenotype Data")
def _reconcile_phenotype(meth, fba_model_id, phenotype_id, out_model_id):
    """Run Gapfilling on an FBA Model [15]

    :param fba_model_id: an FBA model id [15.1]
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :param phenotype_id: a phenotype simulation ID [15.2]
    :type phenotype_id: kbtypes.PhenotypeSimulationSet
    :ui_name phenotype_id: Phenotype Simulation Dataset ID
    :param out_model_id: a name for the generated FBA Model (optional) [15.3]
    :type out_model_id: kbtypes.Unicode
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
    When it finishes, the annotated Genome will be stored in your data space. [16]
     
    :param genome1: Source genome1 ID [16.1]
    :type genome1: kbtypes.Genome
    :ui_name genome1: Genome1 ID
    :param genome2: Source genome2 ID [16.2]
    :type genome2: kbtypes.Genome
    :ui_name genome2: Genome2 ID
    :param out_proteome_cmp: Output proteome comparison ID. If empty, an ID will be chosen randomly. [16.3]
    :type out_proteome_cmp: kbtypes.Unicode
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
    When it finishes, the annotated Genome will be stored in your data space. [17]
     
    :param proteome_cmp: Proteome comparison ID [17.1]
    :type proteome_cmp: kbtypes.ProteomeComparison
    :ui_name proteome_cmp: Proteome Comparison ID
    :return: Output Proteome Comparison ID
    :rtype: kbtypes.ProteomeComparison
    :output_widget: GenomeComparisonWidget
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    return json.dumps({'ws_name': workspace, 'ws_id': proteome_cmp})

@method(name="Compare Two Fba Models")
def _compare_fba_models(meth, fba_model1, fba_model2, proteome_cmp):
    """This starts a job that might run for an hour or longer.
    When it finishes, the annotated Genome will be stored in your data space. [18]
     
    :param fba_model1: an FBA model id from first genome [18.1]
    :type fba_model1: kbtypes.Model
    :ui_name fba_model1: FBA Model 1 ID
    :param fba_model2: an FBA model id from second genome [18.2]
    :type fba_model2: kbtypes.Model
    :ui_name fba_model2: FBA Model 2 ID
    :param proteome_cmp: Proteome comparison ID [18.3]
    :type proteome_cmp: kbtypes.ProteomeComparison
    :ui_name proteome_cmp: Proteome Comparison ID
    :return: Output Comparison Result
    :rtype: kbtypes.Unicode
    :output_widget: FbaModelComparisonWidget
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    fbaClient = fbaModelServices(url = service.URLS.fba, token = token)
    get_models_params = {
                         'models' : [fba_model1, fba_model2],
                         'workspaces' : [workspace, workspace],
                         'auth' : token
                         }
    modeldata = fbaClient.get_models(get_models_params)
    model1 = modeldata[0]
    model2 = modeldata[1]
    return json.dumps({'ws_name': workspace, 'fba_model1': model1, 'fba_model2': model2, 'proteome_cmp': proteome_cmp, 'key1': 'val1'})


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
