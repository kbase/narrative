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
from biokbase.narrative_method_store.client import NarrativeMethodStore

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

    :param app_spec_json: The App Spec
    :type app_spec_json: kbtypes.Unicode
    :ui_name app_spec_json: The App Spec
    :param param_values_json: Param values
    :type param_values_json: kbtypes.Unicode
    :ui_name param_values_json: Param values
    :rtype: kbtypes.Unicode
    :return: running job info
    """
    token, workspaceName = meth.token, meth.workspace_id
    
    appSpec = json.loads(app_spec_json)
    paramValues = json.loads(param_values_json)

    methodIds = []
    for step in appSpec['steps']:
        methodId = step['method_id']
        methodIds.append(methodId)
    nmsClient = NarrativeMethodStore(service.URLS.narrative_method_store)
    
    methSpecs = nmsClient.get_method_spec({'ids' : methodIds})
    
    methIdToSpec = {}
    for methSpec in methSpecs:
        methIdToSpec[methSpec['info']['id']] = methSpec
    # Insert translation and app calling code here

    # assuming we get a job ID out of this, do the following:
    job_id = '12345'
    # meth.register_job(job_id)

    return json.dumps({ 'job_id' : job_id, 'app_spec' : appSpec, 'methods' : methIdToSpec})


# Finalize (registers service)
finalize_service()