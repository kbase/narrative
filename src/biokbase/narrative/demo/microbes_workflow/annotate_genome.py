__version__ = '0.1'

## Imports
import os
import sys

# KBase packages
from biokbase.workspaceService.Client import workspaceService
from biokbase.InvocationService.Client import InvocationService
from biokbase.narrative.common import service

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


    # 1. Do setup.
    _num_done, total_work = 0, 6
    _num_done += 1
    print_progress("Parse Parameters", _num_done, total_work)


    inv_lines = 100
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    genome = params['Identifiers.Genome']
    out_genome = params['Output.New Genome ID (optional)']

    out_genome = out_genome.strip()
    out_genome = out_genome.replace(' ', '_')

    # 2. Setup invocation and double-check workspace
    _num_done += 1
    print_progress("Initialize Annotation Service", _num_done, total_work)
    inv = InvocationService(URLS.invocation)
    inv.run_pipeline("", "kbws-workspace " + workspace, [], 100, '/')

    # 3. Run genome annotation.
    _num_done += 1
    print_progress("Annotate Genome", _num_done, total_work)
    run_str = "ga-annotate-ws-genome " + genome
    if (out_genome):
        run_str += " --newuserid " + out_genome

    res_list = inv.run_pipeline("", run_str, [], 100, '/')



    # 4. Pass it forward to the client.
    _num_done += 1
    print_progress("Rendering Job Information", _num_done, total_work)
    job_info = res_list[0]

    if (out_genome):
        genome = out_genome

    job_id = job_info[1].strip()

    job_return = ("Annotation job submitted successfully!<br/>" + job_id + "<br/>"
                  "This job will take approximately an hour.<br/>"
                  "Your annotated genome will have ID: <b>" + genome + "</b><br/>")

    print "append($(\"<div>" + job_return + "</div>\"));"
    return 0

if __name__ == '__main__':
    sys.exit(main())