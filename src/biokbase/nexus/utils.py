"""
Various utilities used throughout.
"""
import base64
import datetime
import hashlib
import os.path
import struct
from subprocess import Popen, PIPE
import sys

from pyasn1.type import univ
from pyasn1.codec.der import encoder as der_encoder
import rsa
import paramiko.agent
from paramiko.message import Message

def b64encode(value):
    """
    Break things up into 60-character chunks.
    """
    b64 = base64.b64encode(value)
    for i in xrange(0, len(b64), 60):
        yield b64[i:i+60]

def sha1_base64(value):
    """
    hash and encode a value
    """
    return b64encode(hashlib.sha1(value).digest())

def canonical_time(timestamp):
    """
    Create a canonical time format.
    """
    if timestamp.tzinfo is not None:
        timestamp = timestamp.astimezone(utc).replace(tzinfo=None)
    return timestamp.replace(microsecond=0).isoformat() + 'Z'

class UTC(datetime.tzinfo):
    """
    UTC timezone stub.
    """

    ZERO = datetime.timedelta(0)

    def utcoffset(self, dt):
        return self.ZERO

    def tzname(self, dt):
        return 'UTC'

    def dst(self, dt):
        return self.ZERO

utc = UTC()

def read_openssh_public_key(key_file):
    """
    Convert an openssl formatted key into a pkcs#1 formatted key as used by our
    rsa library
    """
    with open(os.path.expanduser(key_file), 'r') as file_handle:
        keydata = base64.b64decode(file_handle.read().split(None)[1])

    parts = []
    while keydata:
        # read the length of the data
        dlen = struct.unpack('>I', keydata[:4])[0]
        # read in <length> bytes
        data, keydata = keydata[4:dlen+4], keydata[4+dlen:]
        parts.append(data)
    e_val_list = ['%02X' % struct.unpack('B', x)[0] for x in parts[1]]
    e_val = eval('0x' + ''.join(e_val_list))
    n_val_list = ['%02X' % struct.unpack('B', x)[0] for x in parts[2]]
    n_val = eval('0x' + ''.join(n_val_list))
    pkcs1_seq = univ.Sequence()
    pkcs1_seq.setComponentByPosition(0, univ.Integer(n_val))
    pkcs1_seq.setComponentByPosition(1, univ.Integer(e_val))
    encoded_string = base64.encodestring(der_encoder.encode(pkcs1_seq))
    key_data = ('-----BEGIN RSA PUBLIC KEY-----\n'
                '{0}\n'
                '-----END RSA PUBLIC KEY-----').format(encoded_string)
    return rsa.PublicKey.load_pkcs1(key_data)

def read_openssh_private_key(key_file, password_callback=None):
    """
    Given an openssh private key, return an rsa PrivateKey object
    """
    abs_key_file = os.path.abspath(key_file)
    with open(abs_key_file, 'r') as file_handle:
        key_data = file_handle.read()
    if 'ENCRYPTED' in key_data:
        password = password_callback()
        command = 'openssl rsa -passin pass:{0} -in {1}'
        proc = Popen(command.format(password, os.path.expanduser(key_file)),
                stdout=PIPE, stderr=PIPE, shell=True)
        key_data = proc.communicate()[0]
    return rsa.PrivateKey.load_pkcs1(key_data)

def sign_with_rsa(key_file, path, method, user_id, body='', query='', password=None):
    """
    Sign a request using the specified rsa key.

    :return: dictionary of headers
    """
    private_key = read_openssh_private_key(key_file, password)
    headers = {
            'X-Globus-UserId': user_id,
            'X-Globus-Sign': 'version=1.0'
            }
    timestamp = canonical_time(datetime.datetime.now())
    headers['X-Globus-Timestamp'] = timestamp
    hashed_body = base64.b64encode(hashlib.sha1(body).digest())
    hashed_path =  base64.b64encode(hashlib.sha1(path).digest())
    hashed_query = base64.b64encode(hashlib.sha1(query).digest())
    to_sign = ("Method:{0}\n"
        "Hashed Path:{1}\n"
        "X-Globus-Content-Hash:{2}\n"
        "X-Globus-Query-Hash:{3}\n"
        "X-Globus-Timestamp:{4}\n"
        "X-Globus-UserId:{5}")
    to_sign = to_sign.format(method,
            hashed_path,
            hashed_body,
            hashed_query,
            headers['X-Globus-Timestamp'],
            headers['X-Globus-UserId'])
    value = rsa.sign(to_sign, private_key, 'SHA-1')
    sig = b64encode(value)
    for i, line in enumerate(sig):
        headers['X-Globus-Authorization-{0}'.format(i)] = line
    return headers

def sign_with_sshagent(agentkey, path, method, user_id, body='', query=''):
    """
    Sign a request using the specified paramiko.AgentKey.

    :return: dictionary of headers
    """
    headers = {
            'X-Globus-UserId': user_id,
            'X-Globus-Sign': 'version=1.0'
            }
    timestamp = canonical_time(datetime.datetime.now())
    headers['X-Globus-Timestamp'] = timestamp
    hashed_body = base64.b64encode(hashlib.sha1(body).digest())
    hashed_path =  base64.b64encode(hashlib.sha1(path).digest())
    hashed_query = base64.b64encode(hashlib.sha1(query).digest())
    to_sign = ("Method:{0}\n"
        "Hashed Path:{1}\n"
        "X-Globus-Content-Hash:{2}\n"
        "X-Globus-Query-Hash:{3}\n"
        "X-Globus-Timestamp:{4}\n"
        "X-Globus-UserId:{5}")
    to_sign = to_sign.format(method,
            hashed_path,
            hashed_body,
            hashed_query,
            headers['X-Globus-Timestamp'],
            headers['X-Globus-UserId'])
    rawsig = agentkey.sign_ssh_data(None,to_sign)
    msg = Message( content=rawsig)
    type = msg.get_string()
    if not type == "ssh-rsa":
        raise Exception( "Returned signature is not RSA signature")
    value = msg.get_string()
    # value = rawsig[15:]
    sig = b64encode(value)
    for i, line in enumerate(sig):
        headers['X-Globus-Authorization-{0}'.format(i)] = line
    return headers
