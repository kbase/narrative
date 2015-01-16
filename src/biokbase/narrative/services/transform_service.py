"""
Calls to the Transform Service
"""
__author__ = ('Bill Riehl <wjriehl@lbl.gov>, ' +
              'Roman Sutormin <rsutormin@lbl.gov>' +
              'Gavin Price <gaprice@lbl.gov>')
__date__ = '1/15/15'

# Imports

import json
# Third-party
import IPython.utils.traitlets as trt
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import init_service
from biokbase.narrative.common.service import finalize_service
from biokbase.narrative.common.service import method
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
NAME = "Transform Service"

# Initialize
init_service(name=NAME, desc="KBase Transform Service Calls", version=VERSION)


@method(name="Assy to ContigSet")
def _assy_to_cs(meth, input_assyfile, output_contigset):
    """Makes a call to the app service

    :param input_assyfile: the KBaseFile.AssemblyFile to convert
    :type input_assyfile: kbtypes.Unicode
    :ui_name input_assyfile: assembly file
    :param output_contigset: the name for the output ContigSet
    :type output_contigset: kbtypes.Unicode
    :ui_name output_contigset: output ContigSet name
    :rtype: kbtypes.Unicode
    :return: running job info
    """
    token, workspace = meth.token, meth.workspace_id
    meth.debug(input_assyfile)
    meth.debug(output_contigset)
#     appSpec = json.loads(app_spec_json)
#     paramValues = json.loads(param_values_json)
#
#     methIdToSpec = json.loads(correct_method_specs_json(method_specs_json))

    # raise ValueError("========\nExternal=" + method_specs_json +
    # "\n=======================\nInternal=" + json.dumps(methIdToSpec))

#     app = create_app_for_njs(
#         workspace, token, service.URLS, appSpec['info']['id'],
#         appSpec['steps'], methIdToSpec, paramValues)

    # raise ValueError("App sending to NJS: " + json.dumps(app))
#     meth.debug(json.dumps(app))
#     njsClient = NarrativeJobService(service.URLS.__dict__['job_service'],
#         token=token)
#     appState = njsClient.run_app(app)

    # assuming we get a job ID out of this, do the following:
#     job_id = "njs:" + appState["job_id"]
#     meth.register_app(job_id)

#     return json.dumps({'job_id': job_id, 'app': app, 'app_state': appState})
    meth.register_job("foo")
    return json.dumps({'jobID': 'foo'})

# Finalize (registers service)
finalize_service()
