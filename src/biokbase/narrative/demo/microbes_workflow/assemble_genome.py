__version__ = '0.1'

## Imports
import json
import os
import logging
import sys
import time
import uuid

# KBase packages
from biokbase.workspaceService.Client import workspaceService
from biokbase.InvocationService.Client import InvocationService

class URLS:
    workspace= "http://kbase.us/services/workspace"
    invocation = "https://kbase.us/services/invocation"


def main():
    return 0

def print_progress(stage, completed, total):
    o = sys.stdout
    o.write("#{},{:d},{:d}\n".format(stage, completed, total))
    o.flush()

def run(params):

    # Regarding annotation, here's the latest. You want to take the fasta file that the above command 
    # created ("contigs.fasta"), and load it to the workspace as a contig set:
    # "ga-loadfasta contigs.fasta -u MyContigs"
    #
    # -- this is already in the workspace by this point.

    """
    SequenceAnalysisPrototype
    ContigSet6
    ProteinSet1
    """


    """
    Steps:
    1. Set up invocation service.
    2. Make sure we're set in the right workspace (kbws-workspace)
    3.  # Then you want to convert that contig set into a genome object:
        # ga-seq-to-genome MyContigs --genomeid MyGenome
        #
        # -- params: contig set, genome output
    4.  # Then you want to annotate your genome in the workspace:
        # ga-annotate-ws-genome MyGenome
        #
        # -- params: genome to annotate.
    5. Return genome metadata (or something) to user.
    """

    _num_done += 1
    print_progress("Parse Parameters", _num_done, total_work)

    inv_lines = 100
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    contig_file = params['Identifiers.Contig Set']
    out_genome = params['Output.New Genome']            

    # 2. Setup invocation and double-check workspace
    _num_done += 1
    print_progress("Initialize Annotation Service", _num_done, total_work)
    inv = InvocationService(URLS.invocation)
    inv.run_pipeline("", "kbws-workspace " + workspace, [], 100, '/')

    # 3. Run sequence to genome.
    _num_done += 1
    print_progress("Build Contig Set into a Genome", _num_done, total_work)
    inv.run_pipeline("", "ga-seq-to-genome " + contig_file + " --genomeid " + out_genome, [], 100, '/')

    # 4. Fetch genome.
    _num_done += 1
    print_progress("Fetching Genome for Display", _num_done, total_work)
    wsClient = workspaceService(URLS.workspace)

    get_genome_params = {
        'id' : out_genome,
        'type' : 'Genome',
        'workspace' : workspace,
        'auth' : token,
    }
    genome_meta = wsClient.get_objectmeta(get_genome_params)

    # 5. Pass it forward to the client.
    _num_done += 1
    print_progress("Rendering Genome Information", _num_done, total_work)
    print json.dumps(genome_meta)

if __name__ == '__main__':
    sys.exit(main())