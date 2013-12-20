"""
Example narrative-wrapped KBase service code.
This defines a new service, composed of one or more narrative functions.
"""
__author__ = 'Me Myself <me@my.org>'
__date__ = 'MM/DD/YYYY'

## Imports

from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.narrative.common import kbtypes

## Globals

VERSION = (0, 0, 1)         # We use Semantic Versioning
NAME = 'MyExampleService'   # Each service needs a name
DESC = 'This is an example service'

# Initialization
# This initializes a service to have the given attributes described above.
# Added service methods fall below.
init_service(name=NAME, desc=DESC, version=VERSION)

# Define one function

# Note that the user will see the text in this decorator, so consider that
# when writing the name.
@method(name='My Example Function')
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
    :output_widget: kbaseExampleWidget
    """
    meth.stages = 1  # for reporting progress
    result = {}

    meth.advance('Running my method')
    result['output'] = 'My output string'

    return json.dumps(result)

# Finalization

finalize_service()