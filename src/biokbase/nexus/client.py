"""
Client for interacting with Nexus.
"""
import base64
from datetime import datetime
import hashlib
import json
import logging
from subprocess import Popen, PIPE
import time
import urllib
import urlparse

import yaml
import nexus.token_utils as token_utils
from nexus.utils import (
        read_openssh_public_key,
        read_openssh_private_key,
        canonical_time,
        b64encode,
        sha1_base64,
        sign_with_rsa,
        sign_with_sshagent)
import requests
import rsa
import paramiko.agent
import os
import nexus.sshagent

log = logging.getLogger()

class NexusClient(object):
    """
    Root object for interacting with the Nexus service
    """

    def __init__(self, config=None, config_file=None):
        if config_file is not None:
            with open(config_file, 'r') as cfg:
                self.config = yaml.load(cfg.read())
        elif config is not None:
            self.config = config
        else:
            raise AttributeError("No configuration was specified")
        self.server = self.config['server']
        cache_config = self.config.get('cache', {
                    'class': 'nexus.token_utils.InMemoryCache',
                    'args': [],
                    })
        self.client = self.config['client']
        if 'SSH_AUTH_SOCK' in os.environ:
            self.agent = nexus.sshagent.Agent2()
            sshkeys = self.agent.keys
            # strip out DSA keys since they are unusable for GO
            self.agent_keys = { name : sshkeys[name] for name in sshkeys.keys() if sshkeys[name].get_name() == 'ssh-rsa' }
            self.agent_keyname = self.agent_keys.keys()[0] if len(self.agent_keys.keys()) == 1 else None
        self.client_secret = self.config['client_secret']
        default_key = os.path.expanduser( '~/.ssh/id_rsa' )
        self.user_key_file = self.config.get('user_private_key_file', default_key if os.path.exists(default_key) else None)
        cache_class = cache_config['class']
        self.verify_ssl = self.config.get('verify_ssl', True)
        mod_name = '.'.join(cache_class.split('.')[:-1])
        mod = __import__(mod_name)
        for child_mod_name in mod_name.split('.')[1:]:
            mod = getattr(mod, child_mod_name)
        cache_impl_class = getattr(mod, cache_class.split('.')[-1])
        self.cache = cache_impl_class(*cache_config.get('args', []))
        self.cache = token_utils.LoggingCacheWrapper(self.cache)

    def validate_token(self, token):
        """
        Validate that a token was issued for the specified user and client by
        the server in the SigningSubject.

        :param token: An authentication token provided by the client.

        :return: username, client id and the server that issued the token.
        
        :raises ValueError: If the signature is invalid, the token is expired or
        the public key could not be gotten.
        """
        return token_utils.validate_token(token, self.cache, self.verify_ssl)


    def generate_request_url(self, username=None):
        """
        In order for the user to authorize the client to access his data, he
        must first go to the custom url provided here.

        :param username: (Optional) This will pre-populate the user's info in the form

        :return: A custom authorization url
        """
        query_params = {
                "response_type": "code",
                "client_id": self.client,
                }
        if username is not None:
            query_params['username'] = username
        parts = ('https', self.server, '/goauth/authorize',
                urllib.urlencode(query_params), None)
        return urlparse.urlunsplit(parts)

    def get_access_token_from_code(self, code):
        """
        After receiving a code from the end user, this method will acquire an
        access token from the server which can be used for subsequent requests.

        :param code: The code which the user received after authenticating with the server and authorizing the client.

        :return: Tuple containing (access_token, refresh_token, expire_time)
        """
        url_parts = ('https', self.server, '/goauth/token', None, None)
        result = token_utils.request_access_token(self.client,
                self.client_secret, code, urlparse.urlunsplit(url_parts))
        return (
                result.access_token,
                result.refresh_token,
                time.mktime(datetime.utcnow().timetuple()) + result.expires_in
                )

    def rsa_get_request_token(self, username, client_id, password=None):
        query_params = {
                "response_type": "code",
                "client_id": client_id
                }
        query_params = urllib.urlencode(query_params)
        path = '/goauth/authorize'
        method = 'GET'
        headers = sign_with_rsa(self.user_key_file,
                path,
                method,
                username,
                query=query_params,
                password=password)
        url_parts = ('https', self.server, '/goauth/authorize', query_params, None)
        url = urlparse.urlunsplit(url_parts)
        response = requests.get(url, headers=headers, verify=self.verify_ssl)
        return response.json


    def sshagent_get_request_token(self, username, client_id, keyname):
        query_params = {
                "response_type": "code",
                "client_id": client_id
                }
        query_params = urllib.urlencode(query_params)
        path = '/goauth/authorize'
        method = 'GET'
        headers = sign_with_sshagent(self.agent_keys[keyname],
                path,
                method,
                username,
                query=query_params)
        url_parts = ('https', self.server, '/goauth/authorize', query_params, None)
        url = urlparse.urlunsplit(url_parts)
        response = requests.get(url, headers=headers, verify=self.verify_ssl)
        return response.json

    def request_client_credential(self, client_id, password=None):
        """
        This is designed to support section 4.4 of the OAuth 2.0 spec:
        
        "The client can request an access token using only its client
         credentials (or other supported means of authentication) when the
         client is requesting access to the protected resources under its
         control"

        If we have a user_key_file defined, the the client_id and password
        for RSA authentication, if we don't have an RSA keyfile, use the
        client_id and password for BASIC auth
        """
        body = 'grant_type=client_credentials'
        path = '/goauth/token'
        method = 'POST'
        url_parts = ('https', self.server, path, None, None)
        url = urlparse.urlunsplit(url_parts)

        if self.user_key_file:
            headers = sign_with_rsa(self.user_key_file,
                                    path,
                                    method,
                                    client_id,
                                    body=body,
                                    password=password)
            response = requests.post(url, data={'grant_type': 'client_credentials'}, headers=headers, verify=self.verify_ssl)
        elif password:
            response = requests.post(url, data={'grant_type': 'client_credentials','client_id' : client_id }, auth = (client_id, password), verify=self.verify_ssl)
        else:
            raise Exception( "Password and legitimate user_key_file required")
        return response.json

    def request_client_credential_sshagent(self, client_id=None, agent_keyname = None):
        """
        This is designed to support section 4.4 of the OAuth 2.0 spec:

        "The client can request an access token using only its client
         credentials (or other supported means of authentication) when the
         client is requesting access to the protected resources under its
         control"
        """
        body = 'grant_type=client_credentials'
        path = '/goauth/token'
        method = 'POST'
        url_parts = ('https', self.server, path, None, None)
        url = urlparse.urlunsplit(url_parts)
        # Handle options based on explicitly parameters - ignore implicit options based
        # on instance attributes
        if client_id is None:
            client_id = self.client
        if agent_keyname is None:
            agent_keyname = self.agent_keyname

        if agent_keyname and client_id:
            headers = sign_with_sshagent(self.agent_keys[agent_keyname],
                                         path,
                                         method,
                                         client_id,
                                         body=body)
            response = requests.post(url, data={'grant_type': 'client_credentials'}, headers=headers, verify=self.verify_ssl)
        else:
            raise Exception('Requires client_id and ssh agent_keyname as parameters or as part of initial config to authenticate credential request')
        return response.json

    def get_user_using_access_token(self, access_token):
        access_token_dict = dict(field.split('=') for field in access_token.split('|'))
        user_path = '/users/' + access_token_dict['un']
        url_parts = ('https', self.server, user_path, None, None)
        url = urlparse.urlunsplit(url_parts)
        headers = { 
            "X-Globus-Goauthtoken": str(access_token),
            "Content-Type": "application/json"
        }
        response = requests.get(url, headers=headers, verify=self.verify_ssl)
        assert(response.status_code == requests.codes.ok)
        return response.json
