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
from biokbase.njs_mock.Client import NJSMock
from biokbase.narrative.services.generic_service_calls import prepare_generic_method_input
from biokbase.narrative.services.generic_service_calls import prepare_generic_method_output

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

    methIdToSpec = json.loads(method_specs_json.replace('\n', '\\n'))  #load_method_specs(appSpec)
    
    #raise ValueError("========\nExternal=" + method_specs_json + "\n=======================\nInternal=" + json.dumps(methIdToSpec))
    
    steps = []
    app = { 'steps' : steps }
    for stepSpec in appSpec['steps']:
        stepId = stepSpec['step_id']
        methodId = stepSpec['method_id']
        methodSpec = methIdToSpec[methodId]
        behavior = methodSpec['behavior']
        methodInputValues = extract_param_values(paramValues, stepId)
        step = { 'step_id' : stepId }
        if 'kb_service_input_mapping' in methodSpec['behavior']:
            tempInput = {}
            rpcArgs = []
            prepare_generic_method_input(token, workspace, methodSpec, methodInputValues, tempInput, rpcArgs)
            serviceName = behavior['kb_service_name']
            methodName = behavior['kb_service_method']
            if serviceName:
                methodName = serviceName + '.' + methodName
            generic = {'service_url' : behavior['kb_service_url'], 'method_name' : methodName}
            step['type'] = 'generic'
            step['input_values'] = rpcArgs
            step['generic'] = generic
            if 'job_id_output_field' in methodSpec:
                jobIdField = methodSpec['job_id_output_field']
                rpcJobIdField = None
                jobIdFieldFound = False
                for mapping in behavior['kb_service_output_mapping']:
                    if mapping['target_property'] == jobIdField:
                        jobIdFieldFound = True
                        rpcOutPath = mapping['service_method_output_path']
                        if rpcOutPath is not None:
                            if len(rpcOutPath) > 1:
                                raise ValueError("Unsupported path to job id field in RPC method output for method [" + methodId + "]: " + json.dumps(rpcOutPath))
                            if len(rpcOutPath) == 1:
                                rpcJobIdField = rpcOutPath[0]
                if not jobIdFieldFound:
                    raise ValueError("Job id field wasn't found in method output mappings for method [" + methodId + "]: " + json.dumps(behavior['kb_service_output_mapping']))
                step['is_long_running'] = 1
                if rpcJobIdField is not None:
                    step['job_id_output_field'] = rpcJobIdField                                   
        elif 'python_class' in behavior:
            step['type'] = 'python'
            step['input_values'] = methodInputValues
            step['python'] = {'python_class' : behavior['python_class'], 'method_name' : behavior['python_function']}
            if 'job_id_output_field' in methodSpec:
                jobIdField = methodSpec['job_id_output_field']
                step['is_long_running'] = 1
                step['job_id_output_field'] = jobIdField
        elif 'kb_service_output_mapping' in behavior:
            continue  # We don't put these steps in app sending to NJS. We will process them later in _app_get_state
        else:
            raise ValueError("Unsupported behavior type for [" + methodId + "]: " + json.dumps(behavior))
        steps.append(step)
    
    njsClient = NJSMock(url = service.URLS.job_service, token = token)
    appState = njsClient.run_app(app)

    # assuming we get a job ID out of this, do the following:
    job_id = appState["app_job_id"]
    # meth.register_job(job_id)

    return json.dumps({ 'job_id' : job_id, 'app' : app})


@method(name="app_get_state")
def _app_get_state(meth, app_spec_json, method_specs_json, param_values_json, app_job_id):
    """Prepare app state returned by NJS

    :param app_spec_json: The App Spec
    :type app_spec_json: kbtypes.Unicode
    :ui_name app_spec_json: The App Spec
    :param method_specs_json: The Method Specs
    :type method_specs_json: kbtypes.Unicode
    :ui_name method_specs_json: The Method Specs
    :param param_values_json: Param values
    :type param_values_json: kbtypes.Unicode
    :ui_name param_values_json: Param values
    :param app_job_id: The App Job ID
    :type app_job_id: kbtypes.Unicode
    :ui_name app_job_id: The App Job ID
    :rtype: kbtypes.Unicode
    :return: running job info
    """
    token, workspace = meth.token, meth.workspace_id
    
    appSpec = json.loads(app_spec_json)
    paramValues = json.loads(param_values_json)
    methIdToSpec = json.loads(method_specs_json)
    
    njsClient = NJSMock(url = service.URLS.job_service, token = token)
    appState = njsClient.check_app_state(app_job_id)

    return json.dumps(appState)


def extract_param_values(paramValues, stepId):
    ret = None
    for paramVal in paramValues:
        if paramVal['stepId'] == stepId:
            ret = []
            for keyVal in paramVal['values']:
                ret.append(keyVal['value'])
    if ret is None:
        raise ValueError("Step [" + stepId + "] wasn't found in input values: " + json.dumps(paramValues))
    #parameters = methodSpec['parameters']
    #for param in parameters:
    #    value = ""
    #    if 'text_options' in param and 'valid_ws_types' in param['text_options']:
    #        types = param['text_options']['valid_ws_types']
    #        if len(types) == 1:
    #            type = types[0]
    #            if type == 'KBaseGenomes.ContigSet':
    #                value = "contigset.1"
    #            elif type == 'KBaseGenomes.Genome':
    #                value = "genome.1"
    #            elif type == 'KBaseFBA.FBAModel':
    #                value = "model.1"
    #            elif type == 'GenomeComparison.ProteomeComparison':
    #                value = "protcmp.1"
    #            elif type == 'KBaseTrees.Tree':
    #                value = "tree.1"
    #            elif type == 'KBaseTrees.MSA':
    #                value = "msa.1"
    #            elif type == 'KBaseSearch.GenomeSet':
    #                value = 'genomeset.1'
    #            elif type == 'KBaseGenomes.Pangenome':
    #                value = 'pangenome.1'
    #            elif type == 'KBaseBiochem.Media':
    #                value = 'media.1'
    #            elif type == 'KBaseFBA.FBA':
    #                value = 'fba.1'
    #            elif type == 'KBaseFBA.Gapfilling':
    #                value = 'gapfilling.1'
    #    ret.append(value)
    return ret

def load_method_specs(appSpec):
    methodIds = []
    for stepSpec in appSpec['steps']:
        methodId = stepSpec['method_id']
        methodIds.append(methodId)
    nmsClient = NarrativeMethodStore(service.URLS.narrative_method_store)
    
    methSpecs = nmsClient.get_method_spec({'ids' : methodIds})
    
    methIdToSpec = {}
    for methSpec in methSpecs:
        methIdToSpec[methSpec['info']['id']] = methSpec
    return methIdToSpec

# Finalize (registers service)
finalize_service()