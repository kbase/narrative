"""
Skeleton for a new wrapped KBase Narrative Service
"""
__author__ = 'Me Myself <me@my.org>'
__date__ = 'MM/DD/YYYY'

## Imports
# Stdlib
# Local
from biokbase.narrative.common import service, kbtypes

## Globals

VERSION = (0, 0, 1)

# Create containing service
svc = service.Service(name="__SERVICE_NAME__", desc="_DESCRIPTION_", version=VERSION)

# Uncomment to eliminate output during debugging, but
# leave on for actually running in Narrative
# quiet = svc.quiet

# Define one service

def _my_service_function(meth, param1, param2, et, cetera):
    """PUT DESCRIPTION HERE

    :param param1: DESCRIPTION OF PARAMETER
    :type param1: kbtypes.TYPE_OF_PARAMETER
    .. ETCETERA ..
    :return: DESCRIPTION OF RETURN TYPE
    :rtype: kbtypes.TYPE_OF_RETURN_VALUE
    """
    meth.stages = 99  # for reporting progress
    
    result = None
    
    # IMPLEMENTATION GOES HERE
    
    return result

my_service_function = svc.add_method(name="__FUNCTION_NAME__", func=_my_service_function)

# Repeat from "Define one service" to here, for each function

## Finalization

# Register the (complete) service, so clients can find it
service.register_service(svc)
