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
import traitlets as trt
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import *
from biokbase.narrative_method_store.client import NarrativeMethodStore
from biokbase.NarrativeJobService.Client import NarrativeJobService
from biokbase.workspace.client import Workspace as workspaceService
from biokbase.narrative.common.generic_service_calls import correct_method_specs_json
from biokbase.narrative.common.generic_service_calls import create_app_for_njs

## Globals

_CT = 'content-type'
_AJ = 'application/json'
_URL_SCHEME = frozenset(['http', 'https'])

VERSION = (0, 0, 1)
NAME = "app_service"

# Initialize
init_service(name=NAME, desc="KBase App Calls", version=VERSION)

@method(name="app_call")
def _app_call(meth, app_spec_json, method_specs_json, param_values_json):
    """Makes a call to the app service

    :param app_spec_json: The App Spec
    :type app_spec_json: kbtypes.Unicode
    :ui_name app_spec_json: The App Spec
    :param method_specs_json: The Method Specs
    :type method_specs_json: kbtypes.Unicode
    :ui_name method_specs_json: The Method Specs
    :param param_values_json: Param values
    :type param_values_json: kbtypes.Unicode
    :ui_name param_values_json: Param values
    :rtype: kbtypes.Unicode
    :return: running job info
    """
    token, workspace = meth.token, meth.workspace_id
    
    appSpec = json.loads(app_spec_json)
    paramValues = json.loads(param_values_json)

    methIdToSpec = json.loads(correct_method_specs_json(method_specs_json))
    
    #raise ValueError("========\nExternal=" + method_specs_json + "\n=======================\nInternal=" + json.dumps(methIdToSpec))
    
    app = create_app_for_njs(workspace, token, service.URLS, appSpec['info']['id'], appSpec['steps'], methIdToSpec, paramValues)
    
    #raise ValueError("App sending to NJS: " + json.dumps(app))
    meth.debug(json.dumps(app))
    njsClient = NarrativeJobService(service.URLS.job_service, token = token)
    appState = njsClient.run_app(app)

    # assuming we get a job ID out of this, do the following:
    job_id = "njs:" + appState["job_id"]
    meth.register_app(job_id)

    return json.dumps({ 'job_id' : job_id, 'app' : app, 'app_state' : appState})


# Finalize (registers service)
finalize_service()
