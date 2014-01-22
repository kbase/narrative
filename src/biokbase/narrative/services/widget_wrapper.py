"""
Service to wrap widgets

"""
__author__ = 'Mustafa Syed <syedmh@ornl.gov>'
__date__ = '12/27/13'

## Imports

# Stdlib
import json
import time

# Third party
import requests

# Service framework
from biokbase.narrative.common.service import init_service, method, finalize_service

# Other KBase

## Exceptions

## Globals

VERSION = (0, 0, 1)
NAME = "WidgetWrapper"

# Initialize
init_service(name=NAME, desc="widget wrapper service", version=VERSION)

@method(name="Trait Manhattan Plot")
def trait_manhattan_plot(meth, workspaceID=None, gwasObjectID=None):
    """
    :param workspaceID: workspaceID
    :type workspaceID: kbtypes.Unicode
    :param gwasObjectID: gwas result objectID
    :type gwasObjectID: kbtypes.Unicode
    :return: Workspace objectID of gwas results
    :rtype: kbtypes.Unicode
    :output_widget: Manhattan
    """
    # XXX: What (other) parameters are needed?
    # XXX: What gets executed and returned?
    meth.debug("starting function")
    meth.stages = 1
    meth.advance("doing something..")
    token = meth.token
    return json.dumps({ 'token': token, 'workspaceID' : workspaceID, 'gwasObjectID' : gwasObjectID })

# Finalize (registers service)
finalize_service()
