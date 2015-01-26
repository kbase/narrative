"""
Generic service method calls
Usage example from narrative UI:
In method 'bindRunButton' of 'src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/js/widgets/kbaseNarrativeWorkspace.js'
instead of line:
                    //self.runCell()(cell, method.service, method.title, paramList);
you can use:
                    var methodSpec = {parameters: [{id: "param0", field_type : "text"}, {id : "param1", field_type : "text"}], 
                            behavior: {kb_service_url: "https://kbase.us/services/trees", 
                                kb_service_name: "KBaseTrees", kb_service_method: "construct_tree_for_alignment", 
                                kb_service_parameters_mapping: {
                                    param0: {target_property: "msa_ref", target_type_transform: "ref"}, 
                                    param1: {target_property: "out_tree_id"}
                                }, kb_service_workspace_name_mapping: {target_property: "out_workspace"}}};
                    self.runCell()(cell, "generic_service", "method_call", [JSON.stringify(methodSpec), JSON.stringify(paramList)]);
This is hardcoded example for calling gene tree building method. For generic case just use method descriptor for methodSpec variable.
"""
__author__ = 'Roman Sutormin <rsutormin@lbl.gov>'
__date__ = '10/16/14'

## Imports

import urllib2
import httplib
import urlparse
import random
import base64
import httplib2
from urllib2 import URLError, HTTPError
from ConfigParser import ConfigParser
import json
import os
import numbers
import uuid
import hashlib
import re
import sys
# Third-party
import IPython.utils.traitlets as trt
from IPython.core.application import Application
from biokbase.njs_mock.Client import NJSMock
from biokbase.NarrativeJobService.Client import NarrativeJobService
from biokbase.workspace.client import Workspace as workspaceService

## Globals

def prepare_generic_method_input(token, workspace, methodSpec, paramValues, input):
    rpcArgs = []
    narrSysProps = {'workspace': workspace, 'token': token}
    parameters = methodSpec['parameters']
    inputMapping = methodSpec['behavior']['kb_service_input_mapping']
    
    for paramPos in range(0, len(parameters)):
        param = parameters[paramPos]
        paramId = param['id']
        paramValue = paramValues[paramPos]
        input[paramId] = paramValue
    
    for mapping in inputMapping:
        paramValue = None
        paramId = None
        if 'input_parameter' in mapping:
            paramId = mapping['input_parameter']
            paramValue = input[paramId]
        elif 'narrative_system_variable' in mapping:
            sysProp = mapping['narrative_system_variable']
            paramValue = narrSysProps[sysProp]
        if 'constant_value' in mapping and not_defined(paramValue):
            paramValue = mapping['constant_value']
        if 'generated_value' in mapping and not_defined(paramValue):
            paramValue = generate_value(mapping['generated_value'])
            if paramId is not None:
                input[paramId] = paramValue
        #if paramValue is None:
        #    raise ValueError("Value is not defined in input mapping: " + json.dumps(mapping))
        build_args(paramValue, mapping, workspace, rpcArgs)
    return rpcArgs

def prepare_generic_method_output(token, workspace, methodSpec, input, output):
    narrSysProps = {'workspace': workspace, 'token': token}
    outArgs = []
    isScript = False
    if 'kb_service_output_mapping' in methodSpec['behavior']:
        outputMapping = methodSpec['behavior']['kb_service_output_mapping']
    elif 'output_mapping' in methodSpec['behavior']:
        outputMapping = methodSpec['behavior']['output_mapping']
    else:
        outputMapping = methodSpec['behavior']['script_output_mapping']
        isScript = True
    for mapping in outputMapping:
        paramValue = None
        if 'input_parameter' in mapping:
            paramId = mapping['input_parameter']
            paramValue = input[paramId]
        elif 'constant_value' in mapping:
            paramValue = mapping['constant_value']
        elif 'narrative_system_variable' in mapping:
            sysProp = mapping['narrative_system_variable']
            paramValue = narrSysProps[sysProp]
        elif (not isScript) and 'service_method_output_path' in mapping:
            paramValue = get_sub_path(output, mapping['service_method_output_path'], 0)
        elif isScript and 'script_output_path' in mapping:
            paramValue = get_sub_path(output, mapping['script_output_path'], 0)
        #if paramValue is None:
        #    raise ValueError("Value is not defined in output mapping [" + json.dumps(mapping) + "], actual output is: " + json.dumps(output))
        build_args(paramValue, mapping, workspace, outArgs)
    if len(outArgs) < 1:
        return {}
    return outArgs[0]

def correct_method_specs_json(method_specs_json):
    method_specs_json = method_specs_json.replace('\n', '\\n')
    method_specs_json = method_specs_json.replace('\t', '\\t')
    return method_specs_json

def app_state_output_into_method_output(workspace, token, wsClient, methodSpec, methodInputValues, rpcOut):
    methodOut = None
    input = {}
    if 'kb_service_input_mapping' in methodSpec['behavior'] or 'script_input_mapping' in methodSpec['behavior']:
        if 'kb_service_input_mapping' in methodSpec['behavior']:
            try:
                rpcOut = json.loads(rpcOut)
            except Exception as err:
                ##raise ValueError("Error parsing: " + rpcOut)
                pass
        tempArgs = []
        prepare_njs_method_input(token, wsClient, workspace, methodSpec, methodInputValues, input);
    else:
        parameters = methodSpec['parameters']
        for paramPos in range(0, len(parameters)):
            input[parameters[paramPos]['id']] = methodInputValues[paramPos]
    methodOut = prepare_generic_method_output(token, workspace, methodSpec, input, rpcOut)
    return methodOut

def _app_get_state(workspace, token, URLS, job_manager, app_spec_json, method_specs_json, param_values_json, app_job_id):
    appSpec = json.loads(app_spec_json)
    paramValues = json.loads(param_values_json)
    methIdToSpec = json.loads(correct_method_specs_json(method_specs_json))
    njsClient = NarrativeJobService(URLS.job_service, token = token)
    wsClient = workspaceService(URLS.workspace, token = token)
    if app_job_id.startswith("njs:"):
        app_job_id = app_job_id[4:]
    appState = njsClient.check_app_state(app_job_id)
    appState['widget_outputs'] = {}
    prevStepReady = True
    for stepSpec in appSpec['steps']:
        stepId = stepSpec['step_id']
        methodId = stepSpec['method_id']
        methodSpec = methIdToSpec[methodId]
        if stepId in appState['step_outputs']:
            rpcOut = appState['step_outputs'][stepId]
            prevStepReady = True
        elif 'output_mapping' in methodSpec['behavior'] and prevStepReady:
            rpcOut = None
            prevStepReady = True
        else:
            prevStepReady = False
            continue
        methodInputValues = extract_param_values(paramValues, stepId)
        appState['widget_outputs'][stepId] = app_state_output_into_method_output(workspace, token, wsClient, methodSpec, methodInputValues, rpcOut)
    appState['job_id'] = "njs:" + appState['job_id']
    return appState

def _method_get_state(workspace, token, URLS, job_manager, method_spec_json, param_values_json, method_job_id):
    methodSpec = json.loads(method_spec_json)
    methodInputValues = json.loads(param_values_json)
    njsClient = NarrativeJobService(URLS.job_service, token = token)
    wsClient = workspaceService(URLS.workspace, token = token)
    if method_job_id.startswith("method:"):
        method_job_id = method_job_id[7:]
        appState = njsClient.check_app_state(method_job_id)
        for stepId in appState['step_outputs']:
            rpcOut = appState['step_outputs'][stepId]
            appState['widget_outputs'] = app_state_output_into_method_output(workspace, token, wsClient, methodSpec, methodInputValues, rpcOut)
        appState['job_id'] = "method:" + appState['job_id']
        return appState
    else:
        input = {}
        rpcArgs = prepare_generic_method_input(token, workspace, methodSpec, methodInputValues, input);
        output = method_job_id
        methodOut = prepare_generic_method_output(token, workspace, methodSpec, input, output)
        return methodOut


def extract_param_values(paramValues, stepId):
    ret = None
    for paramVal in paramValues:
        if paramVal['stepId'] == stepId:
            ret = []
            for keyVal in paramVal['values']:
                ret.append(keyVal['value'])
    if ret is None:
        raise ValueError("Step [" + stepId + "] wasn't found in input values: " + json.dumps(paramValues))
    return ret

def not_defined(paramValue):
    return paramValue is None or len(str(paramValue).strip()) == 0

def generate_value(generProps):
    symbols = 8
    if 'symbols' in generProps:
        symbols = int(generProps['symbols'])
    ret = ''.join([chr(random.randrange(0, 26) + ord('A')) for _ in xrange(symbols)])
    if 'prefix' in generProps:
        ret = str(generProps['prefix']) + ret;
    if 'suffix' in generProps:
        ret = ret + str(generProps['suffix']);
    return ret

def get_sub_path(object, path, pos):
    if pos >= len(path):
        return object
    if isinstance(object, list):
        listPos = int(path[pos])
        return get_sub_path(object[listPos], path, pos + 1)
    return get_sub_path(object[path[pos]], path, pos + 1)

def build_args(paramValue, paramMapping, workspace, args):
    targetPos = 0
    targetProp = None
    targetTrans = "none"
    if 'target_argument_position' in paramMapping and paramMapping['target_argument_position'] is not None:
        targetPos = int(paramMapping['target_argument_position'])
    if 'target_property' in paramMapping and paramMapping['target_property'] is not None:
        targetProp = paramMapping['target_property']
    if 'target_type_transform' in paramMapping and paramMapping['target_type_transform'] is not None:
        targetTrans = paramMapping['target_type_transform']
    paramValue = transform_value(paramValue, workspace, targetTrans)
    while len(args) <= targetPos:
        args.append({})
    if targetProp is None:
        args[targetPos] = paramValue
    else:
        item = args[targetPos]
        item[targetProp] = paramValue

def transform_value(paramValue, workspace, targetTrans):
    if targetTrans == "ref":
        return workspace + '/' + paramValue
    if targetTrans == "int":
        if paramValue is None or len(str(paramValue).strip()) == 0:
            return None
        return int(paramValue) 
    if targetTrans.startswith("list<") and targetTrans.endswith(">"):
        innerTrans = targetTrans[5:-1]
        if isinstance(paramValue, list):
            ret = []
            for pos in range(0, len(paramValue)):
                elem = paramValue[pos]
                ret.append(transform_value(elem, workspace, innerTrans))
            return ret
        else:
            return [transform_value(paramValue, workspace, innerTrans)]
    if targetTrans == "none":
        return paramValue
    raise ValueError("Transformation type is not supported: " + targetTrans)

def prepare_njs_method_input(token, wsClient, workspace, methodSpec, paramValues, input):
    stepParams = []
    narrSysProps = {'workspace': workspace, 'token': token}
    parameters = methodSpec['parameters']
    inputMapping = None
    isScript = False
    if 'kb_service_input_mapping' in methodSpec['behavior']:
        inputMapping = methodSpec['behavior']['kb_service_input_mapping']
    else:
        inputMapping = methodSpec['behavior']['script_input_mapping']
        isScript = True
    
    paramToSpecs = {}
    for paramPos in range(0, len(parameters)):
        param = parameters[paramPos]
        paramId = param['id']
        paramValue = paramValues[paramPos]
        input[paramId] = paramValue
        paramToSpecs[paramId] = param
    
    for mapping in inputMapping:
        paramValue = None
        paramId = None
        if 'input_parameter' in mapping:
            paramId = mapping['input_parameter']
            paramValue = input[paramId]
        elif 'narrative_system_variable' in mapping:
            sysProp = mapping['narrative_system_variable']
            paramValue = narrSysProps[sysProp]
        if 'constant_value' in mapping and not_defined(paramValue):
            paramValue = mapping['constant_value']
        if 'generated_value' in mapping and not_defined(paramValue):
            paramValue = generate_value(mapping['generated_value'])
            if paramId is not None:
                input[paramId] = paramValue
        if paramValue is None:
            # might be dangerous!  but instead of throwing an error, null is an accepted value state because
            # optional text fields left empty with no defaults can be set to null.  If this is the case, then
            # we omit this value entirely from what is sent
            continue
            #raise ValueError("Value is not defined in input mapping: " + json.dumps(mapping))
        paramSpec = None
        if paramId is not None:
            paramSpec = paramToSpecs[paramId]
        stepParam = build_args_njs(paramValue, mapping, workspace, paramSpec)
        stepParam['step_source'] = ''
        isInput = 0
        workspaceName = ''
        objectType = ''
        isWorkspaceId = 0
        if isScript and (paramSpec is not None) and (paramValue is not None) and (len(str(paramValue)) > 0):
            types = []
            is_output_name = False
            if 'text_options' in paramSpec:
                textOptions = paramSpec['text_options']
                if 'valid_ws_types' in textOptions:
                    types = textOptions['valid_ws_types']
                if 'is_output_name' in textOptions:
                    is_output_name = (textOptions['is_output_name'] == 1)
            if len(types) > 0:
                if len(types) == 1:
                    objectType = types[0]
                else:
                    try:
                        objectType = wsClient.get_object_info_new({'objects' : [{'ref': workspace + "/" + paramValue}]})[0][2]
                        objectType = objectType[0:objectType.index('-')]
                    except:
                        objectType = types[0]
                workspaceName = workspace
                isWorkspaceId = 1
                if not is_output_name:
                    isInput = 1
        stepParam['is_workspace_id'] = isWorkspaceId
        stepParam['ws_object'] = {'workspace_name': workspaceName, 'object_type': objectType, 'is_input' : isInput}
        stepParams.append(stepParam)
    return stepParams

def build_args_njs(paramValue, paramMapping, workspace, paramSpec):
    targetProp = None
    targetTrans = "none"
    ret = {}
    if 'target_property' in paramMapping and paramMapping['target_property'] is not None:
        targetProp = paramMapping['target_property']
    if 'target_type_transform' in paramMapping and paramMapping['target_type_transform'] is not None:
        targetTrans = paramMapping['target_type_transform']
    paramValue = transform_value(paramValue, workspace, targetTrans)
    njsType = 'string'
    if paramSpec is not None:
        if 'allow_multiple' in paramSpec and paramSpec['allow_multiple'] == 1:
            njsType = 'array'
            paramValue = json.dumps(paramValue)
        else:
            if 'text_options' in paramSpec:
                textOptions = paramSpec['text_options']
                if 'validate_as' in textOptions:
                    type = textOptions['validate_as']
                    if type == 'int' or type == 'float':
                        njsType = type
            paramValue = str(paramValue)
    else:
        paramValue = str(paramValue)        
    ret['label'] = targetProp
    ret['value'] = paramValue
    ret['type'] = njsType
    return ret

def is_script_method(methodSpec):
    behavior = methodSpec['behavior']
    if 'kb_service_input_mapping' in behavior:
        url = behavior['kb_service_url']
        if len(url) == 0:
            return True
    if 'script_input_mapping' in behavior:
        return True
    return False

def create_app_step(workspace, token, wsClient, methodSpec, methodInputValues, stepId, scriptStep):
    step = { 'step_id' : stepId }
    if methodInputValues is not None:
        behavior = methodSpec['behavior']
        if 'kb_service_input_mapping' in behavior or 'script_input_mapping' in behavior:
            tempInput = {}
            if scriptStep:
                step['parameters'] = prepare_njs_method_input(token, wsClient, workspace, methodSpec, methodInputValues, tempInput)
            else:
                step['input_values'] = prepare_generic_method_input(token, workspace, methodSpec, methodInputValues, tempInput)
            serviceInfo = {'service_name' : '', 'method_name' : '', 'service_url' : ''}
            scriptInfo = {'service_name' : '', 'method_name' : '', 'has_files' : 0}
            if 'kb_service_input_mapping' in behavior:
                serviceName = behavior['kb_service_name']
                methodName = behavior['kb_service_method']
                serviceInfo['service_name'] = serviceName
                serviceInfo['method_name'] = methodName
                serviceInfo['service_url'] = behavior['kb_service_url']
                step['type'] = 'service'
            else:
                scriptInfo['service_name'] = behavior['script_module']
                scriptInfo['method_name'] = behavior['script_name']
                if 'script_has_files' in behavior:
                    scriptInfo['has_files'] = behavior['script_has_files']
                step['type'] = 'script'
            step['service'] = serviceInfo
            step['script'] = scriptInfo
            step['is_long_running'] = 0
            if 'job_id_output_field' in methodSpec and 'kb_service_output_mapping' in behavior and not scriptStep:
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
        elif 'output_mapping' in behavior:
            return None  # We don't put these steps in app sending to NJS. We will process them later in _app_get_state
        else:
            raise ValueError("Unsupported behavior type for [" + methodId + "]: " + json.dumps(behavior) + " expected 'kb_service_input_mapping' or 'script_input_mapping'")
    return step

def create_app_for_njs(workspace, token, URLS, appId, stepSpecs, methIdToSpec, paramValues):
    steps = []
    app = { 'name' : appId,'steps' : steps }
    wsClient = workspaceService(URLS.workspace, token=token)
    scriptApp = False
    for stepSpec in stepSpecs:
        methodId = stepSpec['method_id']
        methodSpec = methIdToSpec[methodId]
        if is_script_method(methodSpec):
            scriptApp = True
            break
    for stepSpec in stepSpecs:
        stepId = stepSpec['step_id']
        methodId = stepSpec['method_id']
        methodSpec = methIdToSpec[methodId]
        methodInputValues = extract_param_values(paramValues, stepId)
        step = create_app_step(workspace, token, wsClient, methodSpec, methodInputValues, stepId, scriptApp)
        if step is None:
            continue
        steps.append(step)
    return app

def extract_param_values(paramValues, stepId):
    ret = None
    for paramVal in paramValues:
        if paramVal['stepId'] == stepId:
            ret = []
            for keyVal in paramVal['values']:
                ret.append(keyVal['value'])
    if ret is None:
        raise ValueError("Step [" + stepId + "] wasn't found in input values: " + json.dumps(paramValues))
    return ret

def _get_token(user_id, password,
               auth_svc='https://nexus.api.globusonline.org/goauth/token?' +
                        'grant_type=client_credentials'):
    # This is bandaid helper function until we get a full
    # KBase python auth client released
    h = httplib2.Http(disable_ssl_certificate_validation=True)

    auth = base64.encodestring(user_id + ':' + password)
    headers = {'Authorization': 'Basic ' + auth}

    h.add_credentials(user_id, password)
    h.follow_all_redirects = True
    url = auth_svc

    resp, content = h.request(url, 'GET', headers=headers)
    status = int(resp['status'])
    if status >= 200 and status <= 299:
        tok = json.loads(content)
    elif status == 403:
        raise Exception('Authentication failed: Bad user_id/password ' +
                        'combination %s:%s' % (user_id, password))
    else:
        raise Exception(str(resp))

    return tok['access_token']


def _read_rcfile(file=os.environ['HOME'] + '/.authrc'):  # @ReservedAssignment
    # Another bandaid to read in the ~/.authrc file if one is present
    authdata = None
    if os.path.exists(file):
        try:
            with open(file) as authrc:
                rawdata = json.load(authrc)
                # strip down whatever we read to only what is legit
                authdata = {x: rawdata.get(x) for x in (
                    'user_id', 'token', 'client_secret', 'keyfile',
                    'keyfile_passphrase', 'password')}
        except Exception, e:
            print "Error while reading authrc file %s: %s" % (file, e)
    return authdata


def _read_inifile(file=os.environ.get(  # @ReservedAssignment
                      'KB_DEPLOYMENT_CONFIG', os.environ['HOME'] +
                      '/.kbase_config')):
    # Another bandaid to read in the ~/.kbase_config file if one is present
    authdata = None
    if os.path.exists(file):
        try:
            config = ConfigParser()
            config.read(file)
            # strip down whatever we read to only what is legit
            authdata = {x: config.get('authentication', x)
                        if config.has_option('authentication', x)
                        else None for x in
                           ('user_id', 'token', 'client_secret',
                            'keyfile', 'keyfile_passphrase', 'password')}
        except Exception, e:
            print "Error while reading INI file %s: %s" % (file, e)
    return authdata


class ServerError(Exception):

    def __init__(self, name, code, message, data=None, error=None):
        self.name = name
        self.code = code
        self.message = '' if message is None else message
        self.data = data or error or ''
        # data = JSON RPC 2.0, error = 1.1

    def __str__(self):
        return self.name + ': ' + str(self.code) + '. ' + self.message + \
            '\n' + self.data


class JSONObjectEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, frozenset):
            return list(obj)
        return json.JSONEncoder.default(self, obj)


class GenericService(object):

    def __init__(self, url=None, timeout=30 * 60, user_id=None,
                 password=None, token=None, ignore_authrc=False):
        if url is None:
            raise ValueError("URL wasn't set")
        scheme, _, _, _, _, _ = urlparse.urlparse(url)
        if scheme not in _URL_SCHEME:
            raise ValueError(url + " isn't a valid http url")
        self.url = url
        self.timeout = int(timeout)
        self._headers = dict()
        # token overrides user_id and password
        if token is not None:
            self._headers['AUTHORIZATION'] = token
        elif user_id is not None and password is not None:
            self._headers['AUTHORIZATION'] = _get_token(user_id, password)
        elif 'KB_AUTH_TOKEN' in os.environ:
            self._headers['AUTHORIZATION'] = os.environ.get('KB_AUTH_TOKEN')
        elif not ignore_authrc:
            authdata = _read_inifile()
            if authdata is None:
                authdata = _read_rcfile()
            if authdata is not None:
                if authdata.get('token') is not None:
                    self._headers['AUTHORIZATION'] = authdata['token']
                elif(authdata.get('user_id') is not None
                     and authdata.get('password') is not None):
                    self._headers['AUTHORIZATION'] = _get_token(
                        authdata['user_id'], authdata['password'])
        if self.timeout < 1:
            raise ValueError('Timeout value must be at least 1 second')

    def call_method(self, method_name, params):

        arg_hash = {'method': method_name,
                    'params': params,
                    'version': '1.1',
                    'id': str(random.random())[2:]
                    }

        body = json.dumps(arg_hash, cls=JSONObjectEncoder)
        try:
            request = urllib2.Request(self.url, body, self._headers)
            ret = urllib2.urlopen(request, timeout=self.timeout)
        except HTTPError as h:
            if _CT in h.headers and h.headers[_CT] == _AJ:
                b = h.read()
                err = json.loads(b)
                if 'error' in err:
                    raise ServerError(**err['error'])
                else:            # this should never happen... but if it does
                    se = ServerError('Unknown', 0, b)
                    se.httpError = h
                    # h.read() will return '' in the calling code.
                    raise se
            else:
                raise h
        if ret.code != httplib.OK:
            raise URLError('Received bad response code from server:' +
                           ret.code)
        resp = json.loads(ret.read())

        if 'result' in resp:
            return resp['result'][0]
        else:
            raise ServerError('Unknown', 0, 'An unknown server error occurred')




