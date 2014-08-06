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
NAME = "Microbes Metabolic Modeling"

# Initialize
init_service(name=NAME, desc="Demo workflow microbes service", version=VERSION)

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

@method(name="Translate Model to New Genome")
def _translate_model_to_new_genome(meth, fba_model_id, proteome_cmp, remove_nogene, output_id):
    """ Functionality to assign a new genome to an imported model. 
    A proteome comparison is done between the orginal model genome 
    and the new desired genome. Metoblic reactions from original model 
    get mapped to genes in the new genome'.  [19]
     
    :param fba_model_id: an FBA model id from first genome [19.1]
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: FBA Model ID

    :param proteome_cmp: Proteome comparison ID [19.3]
    :type proteome_cmp: kbtypes.GenomeComparison.ProteomeComparison
    :ui_name proteome_cmp: Proteome Comparison ID
    
    :param remove_nogene: specify "yes" if reactions with no genes should be removed
    :type remove_nogene: kbtypes.Unicode
    :ui_name remove_nogene: Remove No-gene Reactions

    :param output_id: ID to which translated model should be saved
    :type output_id: kbtypes.KBaseFBA.FBAModel
    :ui_name output_id: Translated Model ID
    
    :return: Output Translated Model
    :rtype: kbtypes.KBaseFBA.FBAModel
    :output_widget: kbaseModelTabs
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Translating model to new genome...")
    keep = 1;
    if remove_nogene == 'yes':
    	keep = 0;
    	
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    fbaClient = fbaModelServices(url = "http://140.221.85.73:4043", token = token)
    translate_params = {
                         'protcomp' : proteome_cmp,
                         'model' : fba_model_id,
                         'workspace' : workspace,
                         'keep_nogene_rxn': keep,
                         'output_id' : output_id}
    modeldata = fbaClient.translate_fbamodel(translate_params)
    
    return json.dumps({'ws': workspace, 'id': output_id})


@method(name="View Phenotype Set")
def view_phenotype(meth, phenotype_set_id):
    """Bring up a detailed view of your phenotype set within the narrative. 
    
    :param phenotype_set_id: the phenotype set to view
    :type phenotype_set_id: kbtypes.KBasePhenotypes.PhenotypeSet
    :ui_name phenotype_set_id: Phenotype Set

    :return: Phenotype Set Data
    :rtype: kbtypes.KBasePhenotypes.PhenotypeSet
    :output_widget: kbasePhenotypeSet
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id;
    meth.advance("Loading the phenotype set")
    

    return json.dumps({'ws': meth.workspace_id, 'name': phenotype_set_id})

@method(name="Simulate growth on a Phenotype Set")
def _simulate_phenotype(meth, model, phenotypeSet, phenotypeSimulationSet):
    """Simulate the growth of a model on a phenotype set.

    :param model: FBA model
    :type model: kbtypes.KBaseFBA.FBAModel
    :ui_name model: FBA Model
    
    :param phenotypeSet: Phenotype Set
    :type phenotypeSet: kbtypes.KBasePhenotypes.PhenotypeSet
    :ui_name phenotypeSet: Phenotype Set
    
    :param phenotypeSimulationSet: Name for result of phenotype simulation (optional)
    :type phenotypeSimulationSet: kbtypes.KBasePhenotypes.PhenotypeSimulationSet
    :ui_name phenotypeSimulationSet: Phenotype Simulation Result
    
    :return: Generated Phenotype Simulation Set ID
    :rtype: kbtypes.KBasePhenotypes.PhenotypeSimulationSet
    :output_widget: kbaseSimulationSet
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting")
    meth.advance("Simulating Phenotypes")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id
    fbaClient = fbaModelServices(service.URLS.fba,token=userToken)
    
    # create the model object
    simulate_phenotypes_params = {
        'workspace': workspaceName, 
        'phenotypeSimulationSet': phenotypeSimulationSet,
        'model_workspace': workspaceName,
        'model': model,
        'phenotypeSet_workspace': workspaceName,
        'phenotypeSet': phenotypeSet,
    }

    fba_meta_data = fbaClient.simulate_phenotypes(simulate_phenotypes_params)
    wsobj_id = fba_meta_data[0]
    name = fba_meta_data[1]
    
    return json.dumps({'name': name, 'ws': workspaceName})

@method(name="View Phenotype Simulation Results")
def view_phenotype(meth, phenotype_set_id):
    """Bring up a detailed view of your Phenotype Simulation results within the narrative. 
    
    :param phenotype_set_id: the phenotype results to view
    :type phenotype_set_id: kbtypes.KBasePhenotypes.PhenotypeSimulationSet
    :ui_name phenotype_set_id: Phenotype Simulation Set
    
    :return: Phenotype Simulation Set Data
    :rtype: kbtypes.KBasePhenotypes.PhenotypeSimulationSet
    :output_widget: kbaseSimulationSet
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id;
    meth.advance("Loading the phenotype simulation results")
    
    ws = workspaceService(service.URLS.workspace, token=userToken)

    return json.dumps({'ws': meth.workspace_id, 'name' : phenotype_set_id})    

@method(name="Compare Models")
def _compare_models(meth, model_ids):
    """Compare two or models and compute core, noncore unique reactions, functional roles with their subsystem information. 
    
    :param model_ids: list of model ids (comma seperated)
    :type model_ids: kbtypes.KBaseFBA.FBAModel
    :ui_name model_ids: Model IDs

    :return: Uploaded Model Comparison Data
    :rtype: kbtypes.Unicode
    :output_widget: compmodels
    """
    mids = model_ids.split(',')

    meth.stages = len(mids)+1 # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    token, ws = meth.token, meth.workspace_id;
    wss =[]
    fba = fbaModelServices(url = service.URLS.fba, token = token)

    for mid in mids:
        meth.advance("Loading models: "+mid);
        wss.append(ws)

    modelout =fba.compare_models({'models': mids, 
                                  'workspaces': wss,
                                  'workspace': ws})

    comparemod = modelout['model_comparisons']                               
    reactioncomp = modelout['reaction_comparisons']
    #print meth.debug(json.dumps(comparemod))
    #print meth.debug(json.dumps(reactioncomp))
    return json.dumps({'data': comparemod})

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

@method(name="Delete Reaction")
def _delete_reaction(meth, fba_model_id, reaction_id, output_id):
    """Delete reactions from selected Metabolic Model 
    
    :param fba_model_id: the metabolic model to edit
    :type fba_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name fba_model_id: Metabolic Model

    :param reaction_id: Reactions to be deleted. Add multiple reactions seperated by ; 
    :type reaction_id: kbtypes.Unicode
    :ui_name reaction_id: Reaction(s) ID(s)

    :param output_id: ID of model with deleted reactions
    :type output_id: kbtypes.KBaseFBA.FBAModel
    :ui_name output_id: Edited Model

    :return: Metabolic Model Data
    :rtype: kbtypes.Model
    :output_widget: kbaseModelTabs    
    """
    meth.debug('delete reaction call')

    meth.stages = 2  # for reporting progress
    meth.advance("Starting...")
    
    #grab token and workspace info, setup the client
    token, ws = meth.token, meth.workspace_id;
    #meth.advance("Loading the phenotype set")
    #
    fba = fbaModelServices(service.URLS.fba, token=token)

    meth.debug(output_id)
    if output_id:
        params = {'model': fba_model_id, 
                   'workspace': ws,
                   'reaction' : reaction_id.split(';'), 
                   'removeReaction': 1,
                   'outputid': output_id }
    else:
        params = {'model': fba_model_id, 
                   'workspace': ws,
                   'reaction' : reaction_id.split(';'), 
                   'removeReaction': 1}


    data = fba.adjust_model_reaction(params)

    if output_id:
        data = json.dumps({'id': output_id, 'ws': ws})
    else:
        data = json.dumps({'id': fba_model_id, 'ws': ws})        

    return data

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
def _run_fba(meth, fba_model_id, media_id, fba_result_id, geneko, rxnko, defaultmaxflux, defaultminuptake, defaultmaxuptake, minimizeFlux, maximizeObjective, allreversible, prom):
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
    
    :param prom: specify the PROM constraint to apply for regulation of the metabolic model  (optional) [10.12]
    :type prom: kbtypes.KBaseFBA.PromConstraint
    :ui_name prom: PROM constraint
    
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
	promconstraint_id promconstraint;
	workspace_id promconstraint_workspace;
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
        fba_params['simulateko'] = 0
        fba_params['formulation']['geneko']=geneko.split(";")
    if rxnko:
        fba_params['simulateko'] = 0
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
        
    if prom:
        fba_params['formulation']['promconstraint'] = prom
        fba_params['formulation']['promconstraint_workspace'] = workspaceName

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
    fbaClient = fbaModelServices("http://140.221.85.73:4043",token=userToken)
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

@method(name="Compare FBA Results")
def _compare_fbas(meth, fba_id1, fba_id2):
    """Compare two FBA results, showing differences in fluxes for reactions.
    
    :param fba_id1: First FBA result
    :type fba_id1: kbtypes.KBaseFBA.FBA
    :ui_name fba_id1: First FBA result

    :param fba_id2: Second FBA result
    :type fba_id2: kbtypes.KBaseFBA.FBA
    :ui_name fba_id2: Second FBA result

    :return: FBA Result Comparison Data
    :rtype: kbtypes.Unicode
    :output_widget: kbaseCompareFBAs
    """

    meth.stages = 2 # for reporting progress
    meth.advance("Starting...")
    
    return json.dumps({'ids': [fba_id1, fba_id2],"ws": meth.workspace_id})
@method(name="Gapfill a Metabolic Model")
def _gapfill_fba(meth, fba_model_id, media_id,source_model_id,int_sol, output_model_id):
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
    
    :param source_model_id: model to gapfill from
    :type source_model_id: kbtypes.KBaseFBA.FBAModel
    :ui_name source_model_id: Source Gapfill Model
    
    :param int_sol: automatically integrate solution (yes/no)
    :type int_sol: kbtypes.Unicode
    :ui_name int_sol: Integrate Solution
    
    :param output_model_id: select a name for the model result object (optional)
    :type output_model_id: kbtypes.Unicode
    :ui_name output_model_id: Output Model ID
    
    :return: Metabolic Model Data
    :rtype: kbtypes.Model
    :output_widget: kbaseModelTabs
    """
    
    # setting the output id appears to not work, so for now we leave it out
    
    
    meth.stages = 2
    meth.advance("Running gapfill on model...")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id;

    fbaclient = fbaModelServices(url="http://140.221.85.73:4043", token=userToken)
    
    fba_formulation = {}
    if (media_id):
        fba_formulation = {
            'media' : media_id,
            'media_workspace' : workspaceName
        }
    
    gapfill_formulation = {
        'formulation' : fba_formulation,
    }
    gapfill_params = {
        'model' : fba_model_id,
        'model_workspace' : workspaceName,
        'formulation' : gapfill_formulation,
        'workspace' : workspaceName,
        'fastgapfill' : 1,
    }
    
    if(int_sol):
        gapfill_params['integrate_solution'] = int_sol;
        if (gapfill_params['integrate_solution'] == 'yes'):
            gapfill_params['integrate_solution'] = 1;

    if(output_model_id):
        gapfill_params['out_model'] = output_model_id;
        
    if(source_model_id):
        gapfill_params['source_model'] = source_model_id;
        gapfill_params['source_model_ws'] = workspaceName;
    
    output = fbaclient.gapfill_model(gapfill_params);

    if output_model_id:
        data = json.dumps({'id': output_model_id, 'ws': workspaceName})
    else:
        data = json.dumps({'id': fba_model_id, 'ws': workspaceName})

    return data

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
    return json.dumps({'ws_name': workspace, 'genome_id': genome_id, 'phenotype_id': phenotype_id})

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
    return json.dumps({'ws_name': workspace, 'model_id': out_model_id, 'job_id': job_id})



@method(name="Compare Two Metabolic Models")
def _compare_fba_models(meth, fba_model1, fba_model2, proteome_cmp):
    """ Compare genes mapped to the same reactions from two metabolic models according to
    the comparison result between proteomes. See also the function 'Compare Two Proteomes'.  [19]
     
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


@method(name="Build a PROM constraint")
def _build_promconstraint(meth, genome_id, series_id, regulome_id):
    """Given a gene expression series and a regulome, build a PROM constraint for FBA. [24]

    :param genome_id: Genome ID [24.1]
    :type genome_id: kbtypes.KBaseGenomes.Genome
    :ui_name genome_id: Genome Name
    
    :param series_id: Gene Expression Series ID [24.2]
    :type series_id: kbtypes.KBaseExpression.ExpressionSeries
    :ui_name series_id: Gene Expression Series Name
    
    :param regulome_id: Regulome ID [24.3]
    :type regulome_id: kbtypes.KBaseRegulation.Regulome
    :ui_name regulome_id: Regulome Name
    
    :return: Generated PROM constraint ID
    :rtype: kbtypes.KBaseFBA.PromConstraint
    :output_widget: kbasePromConstraint
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting")
    meth.advance("Building your new PROM constraint")
    
    #grab token and workspace info, setup the client
    userToken, workspaceName = meth.token, meth.workspace_id
    fbaClient = fbaModelServices("http://140.221.85.73:4043",token=userToken)
    
    # create the model object
    build_pc_params = {
        'genome_id': genome_id,
        'series_id': series_id,
        'regulome_id': regulome_id,
        'workspace': workspaceName
    }

    fba_meta_data = fbaClient.create_promconstraint(build_pc_params)
    wsobj_id = fba_meta_data[0]
    name = fba_meta_data[1]
    
    return json.dumps({'name': name, 'ws': workspaceName})

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
