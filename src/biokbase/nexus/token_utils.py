"""
Utilities for working with nexus tokens.

Helps with generating tokens, validating tokens.
"""
import binascii
from collections import Mapping
from datetime import datetime
import hashlib
import json
import logging
import os
import re
import sys
import time
import urllib
import urlparse

import requests
import rsa

log = logging.getLogger()

class DictObj(Mapping):
    """
    Simple dictionary wrapper
    """
    def __init__(self, delegate):
        self.delegate = delegate

    def __len__(self):
        return len(self.delegate)

    def __iter__(self):
        return self.delegate.__iter__()

    def __getitem__(self, item):
        return self.delegate[item]

    def __getattr__(self, attrname):
        try:
            return self.delegate[attrname]
        except KeyError:
            raise AttributeError()

class InMemoryCache(object):
    """
    Simple cache implementation for signing certificates.
    """

    def __init__(self):
        self.cache_map = {}

    def save_public_key(self, key_id, key):
        self.cache_map[key_id] = key

    def has_public_key(self, key_id):
        return key_id in self.cache_map

    def get_public_key(self, key_id):
        return rsa.PublicKey.load_pkcs1(self.cache_map[key_id])

class FileSystemCache(object):
    """
    Cache signing certificates to the filesystem.
    """

    def __init__(self, cache_path):
        self.cache_path = cache_path
        if not os.path.exists(self.cache_path):
            os.makedirs(self.cache_path)

    def save_public_key(self, key_id, key):
        cached_cert_path = os.path.join(self.cache_path,
            "{0}.pem".format(key_id))
        with open(cached_cert_path, 'w') as cert:
            cert.write(str(key))

    def has_public_key(self, key_id):
        cached_cert_path = os.path.join(self.cache_path,
            "{0}.pem".format(key_id))
        return os.path.exists(cached_cert_path)

    def get_public_key(self, key_id):
        cached_cert_path = os.path.join(self.cache_path,
            "{0}.pem".format(key_id))
        with open(cached_cert_path, 'r') as cert:
            return rsa.PublicKey.load_pkcs1(cert.read())

class LoggingCacheWrapper(object):

    def __init__(self, cache):
        self.cache = cache

    def save_public_key(self, key_id, key):
        message = "{0}: Saving public key {1}:{2}"
        log.debug(message.format(self.cache.__class__.__name__,
                    key_id, key))
        self.cache.save_public_key(key_id, key)

    def has_public_key(self, key_id):
        return self.cache.has_public_key(key_id)

    def get_public_key(self, key_id):
        message = "{0}: Getting public key {1}"
        log.debug(message.format(self.cache.__class__.__name__, key_id))
        return self.cache.get_public_key(key_id)

def validate_token(token, cache=InMemoryCache(), verify=True):
    """
    Given a request or access token validate it.

    Keyword arguments:
    :param tokens: A signed authentication token which was provided by Nexus

    :raises ValueError: If the signature is invalid, the token is expired or
    the public key could not be gotten.
    """
    unencoded_token = urllib.unquote(token)
    token_map = {}
    for entry in unencoded_token.split('|'):
        key, value = entry.split('=')
        token_map[key] = value

    # If the public key is not already in the cache, cache it keyed by the signing subject.
    if not cache.has_public_key(token_map['SigningSubject']):
        response = requests.get(token_map['SigningSubject'], verify=verify)
        if response.status_code != 200:
            message = "Could not get SigningSubject public key"
            log.debug(message)
            raise ValueError(message)
        key_struct = response.content
        public_key = json.loads(key_struct)['pubkey']
        cache.save_public_key(token_map['SigningSubject'], public_key)

    public_key = cache.get_public_key(token_map['SigningSubject'])
    sig = token_map.pop('sig')
    match = re.match('^(.+)\|sig=.*', unencoded_token)
    signed_data = match.group(1)
    try:
        sig = binascii.a2b_hex(sig)
        rsa.verify(signed_data, sig, public_key)
    except rsa.VerificationError:
        exc_value, exc_traceback = sys.exc_info()[1:]
        log.debug('RSA Verification error')
        log.debug(exc_value)
        log.debug(exc_traceback)
        raise ValueError('Invalid Signature')
    now = time.mktime(datetime.utcnow().timetuple())
    if token_map['expiry'] < now:
        raise ValueError('TokenExpired')
    urlparts = urlparse.urlparse(token_map['SigningSubject'])
    return (
        token_map['un'],
        token_map['client_id'],
        urlparts.hostname
    )

def request_access_token(client_id, client_secret,
        auth_code, auth_uri="https://graph.api.globusonline.org/token",
        verify=False):
    """
    Given an authorization code, request an access token.

    :param client_id: The client's api id
    :param client_secret: The client's api secret
    :param auth_code: The authorization code given to the resource owner by nexus
    :param auth_uri: The url of the authentication endpoint

    :returns: A dictionary of the access code response.  This will include the
    fields: access_token, refresh_token and expires_in
    :raises TokenRequestError: If the request for an access token fails
    """
    payload = {
            'grant_type': 'authorization_code',
            'code': auth_code,
            }
    response = requests.post(auth_uri,
            auth=(client_id, client_secret),
            data=payload, verify=verify)
    if response.status_code == requests.codes.created:
        return DictObj(response.json)
    raise TokenRequestError(response.json)

def get_token_refresh(client_id, client_secret,
        refresh_token, auth_uri="https://graph.api.globuscs.info/authorize",
        verify=True):
    """
    Update the access token using the refresh token from a previous request.

    :param client_id: The client's api id
    :param client_secret: The client's api secret
    :param refresh_token: The refresh token issued in a previous authentication.
    :param auth_uri: The url of the authentication endpoint.
    """
    payload = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            }
    response = requests.post(auth_uri,
            auth=(client_id, client_secret),
            data=payload, verify=verify)
    if response.status_code == requests.codes.ok:
        return DictObj(response.json)
    raise TokenRequestError(response.json)


class TokenRequestError(Exception):
    """
    Just an Error class that takes a json response as a property.
    """

    def __init__(self, error):
        super(TokenRequestError, self).__init__()
        self.error = error





