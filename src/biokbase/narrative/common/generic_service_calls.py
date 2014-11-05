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

## Globals

def prepare_generic_method_input(token, workspace, methodSpec, paramValues, input, rpcArgs):
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
        if paramValue is None:
            raise ValueError("Value is not defined in input mapping: " + mapping)
        build_args(paramValue, mapping, workspace, rpcArgs)

def prepare_generic_method_output(token, workspace, methodSpec, input, output):
    narrSysProps = {'workspace': workspace, 'token': token}
    outArgs = []
    outputMapping = methodSpec['behavior']['kb_service_output_mapping']
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
        elif 'service_method_output_path' in mapping:
            paramValue = output
        if paramValue is None:
            raise ValueError("Value is not defined in input mapping: " + mapping)
        build_args(paramValue, mapping, workspace, outArgs)
    return outArgs[0]

def _app_get_state(workspace, token, URLS, job_manager, app_spec_json, method_specs_json, param_values_json, app_job_id):
    
    appSpec = json.loads(app_spec_json)
    paramValues = json.loads(param_values_json)
    methIdToSpec = json.loads(method_specs_json)
    
    njsClient = NJSMock(url = URLS.job_service, token = token)
    appState = njsClient.check_app_state(app_job_id)
    appState['widget_outputs'] = {}
    for stepId in appState['step_job_ids']:
        stepJobId = appState['step_job_ids'][stepId]
        job_manager.register_job(stepJobId)
    for stepSpec in appSpec['steps']:
        stepId = stepSpec['step_id']
        if not stepId in appState['step_outputs']:
            continue
        rpcOut = appState['step_outputs'][stepId]
        methodId = stepSpec['method_id']
        methodSpec = methIdToSpec[methodId]
        methodOut = None
        if 'kb_service_input_mapping' in methodSpec['behavior']:
            input = {}
            tempArgs = []
            methodInputValues = extract_param_values(paramValues, stepId)
            prepare_generic_method_input(token, workspace, methodSpec, methodInputValues, input, tempArgs);
            methodOut = prepare_generic_method_output(token, workspace, methodSpec, input, rpcOut)
        else:
            methodOut = rpcOut
        appState['widget_outputs'][stepId] = methodOut
    return appState

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
        return [transform_value(paramValue, workspace, innerTrans)]
    if targetTrans == "none":
        return paramValue
    raise ValueError("Transformation type is not supported: " + targetTrans)

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




