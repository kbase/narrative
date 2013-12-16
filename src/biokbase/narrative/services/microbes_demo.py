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


@method(name="Assemble Genome from Contigs")
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

@method(name="Annotate Assembled Genome")
def _annotate_genome(meth, genome, out_genome):
    """This starts a job that might run for an hour or longer.
    When it finishes, the annotated Genome will be stored in your data space.

    :param genome: Source genome ID
    :type genome: kbtypes.Genome
    :ui_name genome: Genome ID
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly.
    :type out_genome: kbtypes.Genome
    :ui_name out_genome: Output Genome ID
    :return: Annotated output genome ID
    :rtype: kbtypes.Genome
    """
    meth.stages = 3  # for reporting progress

    inv_lines = 100
    #token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']

    if not out_genome:
        out_genome = "genome_" + ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(8)])

    # 2. Setup invocation and double-check workspace
    meth.advance("Initialize Annotation Service")
    inv = InvocationService(service.URLS.invocation)
    inv.run_pipeline("", "kbws-workspace " + workspace, [], inv_lines, '/')

    # 3. Run genome annotation.
    meth.advance("Annotate Genome")
    cmd = "ga-annotate-ws-genome {input} --newuserid {output}".format(input=genome, output=out_genome)
    res_list = inv.run_pipeline("", cmd, [], 100, '/')

    # 4. Pass it forward to the client.
    meth.advance("Rendering Job Information")
    job_info = res_list[0]

    return json.dumps({ 'output': "<br/>".join(["Annotation job submitted successfully!", job_info[1],
                         "This job will take approximately an hour.",
                         "Your annotated genome will have ID: <b>" + out_genome + "</b>", ""]) })

@method(name="Genome to Draft FBA Model")
def _genome_to_fba_model(meth, genome_id, fba_model_id):
    """Temp text

    :param genome_id: Source genome ID
    :type genome_id: kbtypes.Genome
    :ui_name genome_id: Genome ID
    :param fba_model_id: ID of the generated FBA Model (optional)
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: Output FBA Model ID
    :return: Generated FBA Model ID
    :rtype: kbtypes.Model
    """
    return json.dumps({ 'output' : "FBA Model stub" })

@method(name="Build Media")
def _build_media(meth, base_media):
    """Assemble a set of compounds to use as a media set for performing FBA on a model.

    :param base_media: Base media type
    :type base_media: kbtypes.Media
    :ui_name base_media: Media ID
    :return: JSON of medias
    :rtype: kbtypes.Media
    :output_widget: kbaseMediaEditorNarrative
    :embed: True
    """
    meth.stages = 2

    meth.advance("Init")
    fba = fbaModelServices(service.URLS.fba)
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    base_media = base_media.strip().replace(' ', '_')

    meth.advance("Fetch Base Media")
    result = { 'viewOnly': False, 'editOnly': True, 'ws': workspace, 'auth': token }
    if base_media:
        meth.stages += 1
        media_params = {
            'medias': [base_media],
            'workspaces': [workspace],
            'auth': token
        }
        media_list = fba.get_media(media_params)
        meth.advance("Render Media")
        result['mediaData'] = media_list

    return json.dumps(result)

@method(name="Run Flux Balance Analysis")
def _run_fba(meth, fba_model_id, media_id, fba_result_id):
    """Run FBA on a model.

    :param fba_model_id: an FBA model
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :param media_id: a Media set
    :type media_id: kbtypes.Media
    :ui_name media_id: Media ID
    :param fba_result_id: an FBA result
    :type fba_result_id: kbtypes.FBAResult
    :ui_name fba_result_id: FBA Result ID
    :return: something 
    :rtype: kbtypes.Unicode
    """
    return json.dumps({ 'output' : "Run FBA stub" })

@method(name="Gapfill FBA Model")
def _gapfill_fba(meth, fba_model_id):
    """Run Gapfilling on an FBA Model

    :param fba_model_id: an FBA Model
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :return: job ID string
    :rtype: kbtypes.Unicode
    """

    return json.dumps({ 'output' : "Gapfill FBA stub" })

@method(name="Integrate Gapfill Solution")
def _integrate_gapfill(meth, fba_model_id, gapfill_id):
    """Integrate a Gapfill solution into your FBA model

    :param fba_model_id: an FBA model id
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :param gapfill_id: a gapfilling ID
    :type gapfill_id: kbtypes.Gapfill
    :ui_name gapfill_id: Gapfill result ID
    :return: gapfilled model ID
    :rtype: kbtypes.Unicode
    """

    return json.dumps({ 'output' : "Integrate Gapfill stub" })

@method(name="Simulate Phenotype Data")
def _simulate_phenotype(meth, fba_model_id, phenotype_id):
    """Simulate some phenotype on an FBA model

    :param fba_model_id: an FBA model id
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :param phenotype_id: a phenotype ID
    :type phenotype_id: kbtypes.PhenotypeData
    :ui_name phenotype_id: Phenotype Dataset ID
    :return: something
    :rtype: kbtypes.Unicode
    """

    return json.dumps({ 'output' : "Simulate Phenotype stub" })

@method(name="Reconcile Phenotype Data")
def _reconcile_phenotype(meth, fba_model_id, phenotype_id):
    """Run Gapfilling on an FBA Model

    :param fba_model_id: an FBA model id
    :type fba_model_id: kbtypes.Model
    :ui_name fba_model_id: FBA Model ID
    :param phenotype_id: a phenotype ID
    :type phenotype_id: kbtypes.PhenotypeData
    :ui_name phenotype_id: Phenotype Dataset ID
    :return: something
    :rtype: kbtypes.Unicode
    """

    return json.dumps({ 'output' : "Reconcile Phenotype stub" })

# Finalize (registers service)
finalize_service()
