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
from biokbase.workspaceService.Client import workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.fbaModelServices.Client import fbaModelServices

## Globals

VERSION = (0, 0, 1)
NAME = "microbes"

# Initialize
init_service(name=NAME, desc="Demo workflow microbes service", version=VERSION)

@method(name="Assemble Contigs from Reads")
def _assemble_contigs(meth, reads_files, out_contig_set):
    """Use a KBase pipeline to assemble a set of contigs from generated reads files.
    This starts a job that might run for several hours.
    When it finishes, the assembled ContigSet will be stored in your data space.

    :param reads_files: A list of files with read information
    :type reads_files: kbtypes.List
    :ui_name reads_files: Genome Reads files
    :param out_contig_set: The name of the created contig set (leave blank for a random name)
    :type out_contig_set: kbtypes.Unicode
    :ui_name out_contig_set: Output ContigSet ID
    :return: A contig assembly job ID
    :rtype: kbtypes.Unicode
    """
    return json.dumps({"output": "Assemble Contigs stub"})


@method(name="Assemble Genome from Fasta")
def _assemble_genome(meth, contig_file, out_genome):
    """This assembles a ContigSet into a Genome object in your data space.
    This should be run before trying to annotate a Genome.

    :param contig_file: A FASTA file with contig data
    :type contig_file: kbtypes.Unicode
    :ui_name contig_file: Contig File ID
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly.
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

@method(name="Convert Contigs to Genome Object")
def _prepare_genome(meth, contig_set, scientific_name, out_genome):
    """This wraps a ContigSet by a Genome object in your data space.
    This should be run before trying to annotate a Genome.

    :param contig_set: An object with contig data
    :type contig_set: kbtypes.ContigSet
    :ui_name contig_set: Contig Set Object
    :param scientific_name: enter the scientific name to assign to your new genome
    :type scientific_name: kbtypes.Unicode
    :ui_name scientific_name: Scientific Name
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly.
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
    When it finishes, the annotated Genome will be stored in your data space.
    
    :param genome: Source genome ID
    :type genome: kbtypes.Genome
    :ui_name genome: Genome ID
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly.
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
    """This shows an annotated Genome stored in your data space.
    
    :param genome: Source genome ID
    :type genome: kbtypes.Genome
    :ui_name genome: Genome ID
    :return: Same genome ID
    :rtype: kbtypes.Genome
    :output_widget: GenomeAnnotation
    """
    meth.stages = 1  # for reporting progress
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    return json.dumps({'token': token, 'ws_name': workspace, 'ws_id': genome})

@method(name="Build an FBA Model for a Genome")
def _genome_to_fba_model(meth, genome_id, fba_model_id):
    """Given an annotated Genome, build a draft flux balance analysis model.

    :param genome_id: Source genome name
    :type genome_id: kbtypes.Genome
    :ui_name genome_id: Genome Name
    :param fba_model_id: select a name for the generated FBA Model (optional)
    :type fba_model_id: kbtypes.Unicode
    :ui_name fba_model_id: Output FBA Model Name
    :return: Generated FBA Model ID
    :rtype: kbtypes.Model
    
    :output_widget: kbaseModelMetaNarrative
    """
    
    meth.stages = 3  # for reporting progress
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
    fba_meta_data = fbaClient.genome_to_fbamodel(build_fba_params)
    generated_model_id = fba_meta_data[0]
    
    #rename the object if requested
    meth.advance("Saving the new model data object")
    fba_model_id = fba_model_id.strip()
    if fba_model_id:
        wsClient  = workspaceService(service.URLS.workspace)
        move_obj_params = {
            'new_id':fba_model_id,
            'new_workspace':workspaceName,
            'source_id':generated_model_id,
            'type':'Model',
            'source_workspace':workspaceName,
            'auth':token
        }
        fba_meta_data = wsClient.move_object(move_obj_params)
    
    return json.dumps({"data":fba_meta_data})



@method(name="Build Media")
def _build_media(meth, media):
    """Assemble a set of compounds to use as a media set for performing FBA on a model.

    :param base_media: Base media type
    :type base_media: kbtypes.Media
    :ui_name base_media: Media ID
    :return: Metadata from new Media object
    :rtype: kbtypes.Media
    :input_widget: kbaseBuildMediaInput
    :embed: True
    """
    meth.stages = 2

    meth.advance("Initializing")
    fba = fbaModelServices(service.URLS.fba)
    token, workspace_id = meth.token, meth.workspace_id

    media = json.loads(media)
    media['auth'] = token
    media['workspace'] = workspace_id

    meth.advance("Submitting Media to workspace")

    media_meta = fba.addmedia(media)

    result = {'data' : media_meta}
    return json.dumps(result)

@method(name="Run Flux Balance Analysis")
def _run_fba(meth, fba_model_id, media_id, fba_result_id):
    """Run Flux Balance Analysis on a metabolic model.

    :param fba_model_id: the FBA model you wish to run
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model
    :param media_id: the media condition in which to run FBA
    :type media_id: kbtypes.Media
    :ui_name media_id: Media
    
    :param fba_result_id: select a name for the FBA result object (optional)
    :type fba_result_id: kbtypes.Unicode
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
    
    
    return json.dumps({ "ids":[generated_fba_id],"workspaces":[workspaceName],"fbaData":fbadata })

@method(name="Gapfill an FBA Model")
def _gapfill_fba(meth, fba_model_id, media_id, solution_limit, total_time_limit, solution_time_limit):
    """Run Gapfilling on an FBA Model

    :param fba_model_id: the FBA Model to gapfill
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model
    
    :param media_id: the media condition in which to gapfill
    :type media_id: kbtypes.Media
    :ui_name media_id: Media
    
    :param solution_limit: select the number of solutions you want to find
    :type solution_limit: kbtypes.Unicode
    :ui_name solution_limit: Number of Solutions
    
    :param total_time_limit: the total time you want to run gapfill
    :type total_time_limit: kbtypes.Unicode
    :ui_name total_time_limit: Total Time Limit (s)
    
    :param solution_time_limit: the max time you want to spend per solution
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
def _integrate_gapfill(meth, fba_model_id, gapfill_id):
    """Integrate a Gapfill solution into your FBA model

    :param fba_model_id: the FBA Model to integrate gapfill solutions into
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model
    
    :param gapfill_id: select the ID of the gapfill solution (found in the gapfill solutions tab in the model viewer)
    :type gapfill_id: kbtypes.Unicode
    :ui_name gapfill_id: Gapfill ID

    :param output_model_id: select a name for the gapfilled object (optional)
    :type output_model_id: kbtypes.Unicode
    :ui_name output_model_id: Output FBA Result Name


    :return: Generated FBA Model ID
    :rtype: kbtypes.Model
    
    :output_widget: kbaseModelMetaNarrative

    :return: gapfilled model ID
    :rtype: kbtypes.Unicode
    """

    meth.stages = 2
    meth.advance("Setting up gapfill parameters")
    
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
        'gapfillSolutions' : params['Identifiers.Gapfill'],
        'workspace' : workspaceName,
        'auth' : token,
    }

    output_model_id = output_model_id.strip()
    if (output_model_id):
        integrate_params['out_model'] = output_model_id

    # funcdef integrate_reconciliation_solutions(integrate_reconciliation_solutions_params input) returns (object_metadata modelMeta);

    
    model_meta = fba.integrate_reconciliation_solutions(integrate_params)

    _num_done += 1
    print_progress("Fetch Gapfilled FBA Model", _num_done, total_work)

    model_params = {
        'models': [model_meta[0]],
        'workspaces': [workspace],
        'auth': token,
    }
    model = fba.get_models(model_params)

    _num_done += 1
    print_progress("Render FBA Model", _num_done, total_work)

    print json.dumps(metadata)






    return json.dumps({ 'output' : "Integrate Gapfill stub" })

@method(name="Upload Phenotype Data")
def _upload_phenotype(meth, genome_id, phenotype_id):
    """Upload phenotype data for FBA analysis

    :param genome_id: a genome id
    :type genome_id: kbtypes.Genome
    :ui_name genome_id: Genome ID
    :param phenotype_id: a phenotype ID
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
    """Simulate some phenotype on an FBA model

    :param fba_model_id: an FBA model id
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :param phenotype_id: a phenotype ID
    :type phenotype_id: kbtypes.PhenotypeSet
    :ui_name phenotype_id: Phenotype Dataset ID
    :param simulation_id: an output simulation ID
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
def _reconcile_phenotype(meth, fba_model_id, phenotype_id):
    """Run Gapfilling on an FBA Model

    :param fba_model_id: an FBA model id
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :param phenotype_id: a phenotype ID
    :type phenotype_id: kbtypes.PhenotypeSet
    :ui_name phenotype_id: Phenotype Dataset ID
    :return: something
    :rtype: kbtypes.Unicode
    """

    return json.dumps({ 'output' : "Reconcile Phenotype stub" })



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
