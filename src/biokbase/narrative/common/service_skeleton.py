"""
Skeleton for a new wrapped KBase Narrative Service
"""
__author__ = 'Me Myself <me@my.org>'
__date__ = 'MM/DD/YYYY'

## Imports

from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.narrative.common import kbtypes

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
    :param param2: Some text
    :type param2: kbtypes.Unicode
    :return: Workspace object ID
    :rtype: kbtypes.Unicode
    """
    meth.stages = 1  # for reporting progress
    result = None

    meth.advance("Hit it and quit")

    return "bogus_workspace_id"

# Finalization

finalize_service()
