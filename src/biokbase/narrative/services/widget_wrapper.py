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

@method(name="Network Plot")
def network_plot(meth, workspaceID=None, networkObjectID=None):
    """
    visualize force directed network.

    :param workspaceID: workspaceID
    :type workspaceID: kbtypes.Unicode
    :param networkObjectID: network result objectID
    :type networkObjectID: kbtypes.Unicode
    :return: Workspace objectID of netowrk results
    :rtype: kbtypes.Unicode
    :output_widget: ForceDirectedNetwork
    """
    meth.stages = 1
    meth.advance("Network plot")
    token = meth.token
    return json.dumps({'token': token, 'workspaceID': workspaceID, 'networkObjectID': networkObjectID })

# Finalize (registers service)
finalize_service()
