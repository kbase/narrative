__version__ = '0.1'

## Imports
import json
import os
import logging
import sys
import time
import uuid

# KBase packages
from biokbase.auth import Token
from biokbase.workspaceService.Client import workspaceService
from biokbase.ExpressionServices.ExpressionServicesClient import ExpressionServices
from biokbase.idserver.client import IDServerAPI
from biokbase.cdmi.client import CDMI_API
from biokbase.OntologyService.Client import Ontology

class URLS:
    workspace= "http://kbase.us/services/workspace"
    fba = "https://kbase.us/services/fba_model_services"

def main():
    print "running main!"
    return 0


def run(params):
    print "running genomeToFba"
    return 0

if __name__ == '__main__':
    sys.exit(main())