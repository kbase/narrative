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
    _host = '140.221.84.248'
    main = "http://{40.221.84.236:8000/node"
    shock = "http://140.221.84.236:8000"
    awe = "http://140.221.84.236:8001/"
    expression= "http://{}:7075".format(_host)
    workspace= "http://kbase.us/services/workspace"
    ids = "http://kbase.us/services/idserver"
    cdmi = "http://kbase.us/services/cdmi_api"
    ontology = "http://kbase.us/services/ontology_service"
    fba = "https://kbase.us/services/fba_model_services"

def main():
    print "running main!"
    return 0

if __name__ == '__main__':
    sys.exit(main())


def run(params):
    print "running genomeToFba"
    return 0
