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

    _num_done, total_work = 0, 3

    # 1. Parse parameters.
    _num_done += 1
    print_progress("Parsing Parameters", _num_done, total_work)

    genome_id = params['Identifiers.Genome']
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']

    get_genome_params = {
        'id' : genome_id,
        'type' : 'Genome',
        'workspace' : workspace,
        'auth' : token,
    }

    # 2. Fetch genome.
    _num_done += 1
    print_progress("Fetching Genome Data for Display", _num_done, total_work)
    wsClient = workspaceService(URLS.workspace)

    genome_meta = wsClient.get_objectmeta(get_genome_params)

    # 3. Pass it forward to the client.
    _num_done += 1
    print_progress("Rendering Genome Information", _num_done, total_work)
    print 'GenomeView({ data: ' + json.dumps(genome_meta) + '});'

if __name__ == '__main__':
    sys.exit(main())