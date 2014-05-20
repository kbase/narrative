"""
Skeleton for a new wrapped KBase Narrative Service
"""
__author__ = 'Me Myself <me@my.org>'
__date__ = 'MM/DD/YYYY'

## Imports

from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.narrative.common import kbtypes
import json

## Globals

VERSION = (0, 0, 1)
NAME = "MyExampleService"

# Initialization

init_service(name=NAME, desc="This is an example", version=VERSION)

# Define one service

@method(name="MyExampleFunction")
def _my_service_function(meth, param1, param2):
    """This is an example function.

    :param param1: Input Genome
    :type param1: kbtypes.Genome
    :ui_name param1: Genome ID (what the user sees)
    :param param2: Some text
    :type param2: kbtypes.Unicode
    :ui_name param2: Text
    :return: Workspace object ID
    :rtype: kbtypes.Unicode
    :output_widget: kbaseOutputWidgetName
    :input_widget: kbaseInputWidgetName
    """
    meth.stages = 1  # for reporting progress
    result = None

    meth.advance("Run and then done")

    return json.dumps({ "data" : "bogus_workspace_id" });

# Finalization

finalize_service()
