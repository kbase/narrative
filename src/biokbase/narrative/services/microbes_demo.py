"""
Demo microbes service and methods
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '11/15/13'

## Imports
# Stdlib
import json
import os
import random
# Local
from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.workspaceService.Client import workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.fbaModelServices.Client import fbaModelServices

## Globals

VERSION = (0, 0, 1)
NAME = "microbes"

# Initialize
init_service(name=NAME, desc="Demo workflow microbes service", version=VERSION)


@method(name="AnnotateGenome")
def _annotate_genome(meth, genome, out_genome):
    """This starts a job that might run for an hour or longer.
    When it finishes, the annotated Genome will be stored in your data space.

    :param genome: Source genome ID
    :type genome: kbtypes.Genome
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly.
    :type out_genome: kbtypes.Genome
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

    print("<br/>".join(["Annotation job submitted successfully!", job_info[1],
                        "This job will take approximately an hour.",
                        "Your annotated genome will have ID: <b>" + out_genome + "</b>", ""]))

    return out_genome


@method(name="AssembleGenome")
def _assemble_genome(meth, contig_file, out_genome):
    """This starts a job that might run for an hour or longer.
    When it finishes, the annotated Genome will be stored in your data space.

    :param contig_file: A FASTA file with contig data
    :type contig_file: kbtypes.Unicode
    :param out_genome: Annotated output genome ID. If empty, an ID will be chosen randomly.
    :type out_genome: kbtypes.Genome
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
    print(json.dumps(genome_meta))

    return out_genome


@method(name="BuildMedia")
def _build_media(meth, base_media):
    """Build media

    :param base_media: Base media type
    :type base_media: kbtypes.Media
    :return: JSON of medias
    :rtype: kbtypes.Media
    """
    meth.stages = 2

    meth.advance("Init")
    fba = fbaModelServices(service.URLS.fba)
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    base_media = base_media.strip().replace(' ', '_')

    meth.advance("Fetch Base Media")
    if base_media:
        meth.stages += 1
        media_params = {
            'medias': [base_media],
            'workspaces': [workspace],
            'auth': token
        }
        media_list = fba.get_media(media_params)
        meth.advance("Render Media")
        result = json.dumps(media_list)
    else:
        result = ""
    return result

# Finalize (registers service)
finalize_service()
