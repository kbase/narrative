"""
Generic App service calls.
This generates and runs the KBase App call based on an App Spec from the
Narrative Method Store, and a set of parameters.
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>, Roman Sutormin <rsutormin@lbl.gov>'
__date__ = '10/28/14'

## Imports

import json
# Third-party
import IPython.utils.traitlets as trt
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import *

## Globals

_CT = 'content-type'
_AJ = 'application/json'
_URL_SCHEME = frozenset(['http', 'https'])

VERSION = (0, 0, 1)
NAME = "app_service"

# Initialize
init_service(name=NAME, desc="KBase App Calls", version=VERSION)

@method(name="app_call")
def _app_call(meth, app_spec_json, param_values_json):
    """Makes a call to the app service
    """
    token, workspaceName = meth.token, meth.workspace_id

    # Insert translation and app calling code here

    # assuming we get a job ID out of this, do the following:
    job_id = '12345'
    # meth.register_job(job_id)

    return json.dumps({ 'job_id' : job_id })


# Finalize (registers service)
finalize_service()