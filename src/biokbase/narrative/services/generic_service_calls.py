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
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import *
from biokbase.narrative.common.generic_service_calls import prepare_generic_method_input
from biokbase.narrative.common.generic_service_calls import prepare_generic_method_output
from biokbase.narrative.common.generic_service_calls import is_script_method
from biokbase.narrative.common.generic_service_calls import create_app_step

## Globals

_CT = 'content-type'
_AJ = 'application/json'
_URL_SCHEME = frozenset(['http', 'https'])

VERSION = (0, 0, 1)
NAME = "generic_service"

# Initialize
init_service(name=NAME, desc="Generic service method calls", version=VERSION)

@method(name="method_call")
def _method_call(meth, method_spec_json, param_values_json):
    """Generic service method calls

    :param method_spec_json: Method descriptor JSON string
    :type method_spec_json: kbtypes.Unicode
    :ui_name method_spec_json: Method descriptor JSON string
    :param param_values_json: Parameter values JSON string
    :type param_values_json: kbtypes.Unicode
    :ui_name param_values_json: Parameter values JSON string
    :return: Service method response
    :rtype: kbtypes.Unicode
    """
    token = os.environ['KB_AUTH_TOKEN']
    workspace = os.environ['KB_WORKSPACE_ID']
    methodSpec = json.loads(method_spec_json)
    paramValues = json.loads(param_values_json)
    methodOut = None

    if is_script_method(methodSpec):
        wsClient = workspaceService(service.URLS.workspace, token = token)
        steps = []
        methodId = methodSpec['info']['id']
        app = { 'name' : 'App wrapper for method ' + methodId,'steps' : steps }
        steps.append(create_app_step(workspace, token, wsClient, methodSpec, paramValues, methodId, True))
        njsClient = NarrativeJobService(service.URLS.job_service, token = token)
        appState = njsClient.run_app(app)
        jobId = "method:" + appState["job_id"]
        meth.register_app(jobId)
        methodOut = {'job_id': jobId}
    else:
        input = {}
        rpcArgs = prepare_generic_method_input(token, workspace, methodSpec, paramValues, input);
        behavior = methodSpec['behavior']
        url = behavior['kb_service_url']
        serviceName = behavior['kb_service_name']
        methodName = behavior['kb_service_method']
        if serviceName:
            methodName = serviceName + '.' + methodName
        genericClient = GenericService(url = url, token = token)
        output = genericClient.call_method(methodName, rpcArgs)
        methodOut = prepare_generic_method_output(token, workspace, methodSpec, input, output)
        if 'job_id_output_field' in methodSpec:
            jobIdField = methodSpec['job_id_output_field']
            if jobIdField in methodOut:
                meth.register_job(methodOut[jobIdField])
    return json.dumps(methodOut)


# Finalize (registers service)
finalize_service()

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




