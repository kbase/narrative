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
from biokbase.fbaModelServices.Client import fbaModelServices

class URLS:
    workspace= "http://kbase.us/services/workspace"
    fba = "https://kbase.us/services/fba_model_services"


def main():
    return 0

def print_progress(stage, completed, total):
    o = sys.stdout
    o.write("#{},{:d},{:d}\n".format(stage, completed, total))
    o.flush()

def run(params):

    _num_done, total_work = 0, 5

    _num_done += 1
    print_progress("Parse Parameters", _num_done, total_work)

    contig_file = params['Output.Contig Set Name']
    contig_file.strip()
    contig_file.replace(' ', '_')
    if (not contig_file):
        import random
        contig_file = "kb|contigset." + str(random.randint(0,50))

    # 1. Do setup.
    _num_done += 1
    print_progress("Parse Parameters", _num_done, total_work)

    import time
    time.sleep(1)

    _num_done += 1
    print_progress("Initialize assembly service", _num_done, total_work)

    time.sleep(1)

    _num_done += 1
    print_progress("Start assembly job", _num_done, total_work)

    time.sleep(3)

    _num_done += 1
    print_progress("Render job information", _num_done, total_work)

    print contig_file

    return 0

if __name__ == '__main__':
    sys.exit(main())