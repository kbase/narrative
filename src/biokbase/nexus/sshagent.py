#
# Subclass of Paramiko.Agent that is mostly identical except that
# this class doesn't discard the ssh key comment that is returned
# by the ssh agent. The keys instance variable is now a dict
# keyed on the comment.
#
# Steve Chan
# sychan@lbl.gov
# 2/25/2012
#
""" 
SSH Agent interface for Unix clients. Modified to keep ssh-key comment field
""" 

import os 
import socket 
import struct 
import sys 
from paramiko.agent import SSH2_AGENTC_REQUEST_IDENTITIES, SSH2_AGENT_IDENTITIES_ANSWER, \
    SSH2_AGENTC_SIGN_REQUEST, SSH2_AGENT_SIGN_RESPONSE, Agent, AgentKey

from paramiko.ssh_exception import SSHException 
from paramiko.message import Message 
from paramiko.pkey import PKey 

class Agent2( Agent ):
    """
    subclass of paramiko.Agent that stores the keys attribute as a dict, keyed on
    ssh-key comment, with the value as the key

    Client interface for using private keys from an SSH agent running on the
    local machine.  If an SSH agent is running, this class can be used to
    connect to it and retreive L{PKey} objects which can be used when
    attempting to authenticate to remote SSH servers.
    
    Because the SSH agent protocol uses environment variables and unix-domain
    sockets, this probably doesn't work on Windows.  It does work on most
    posix platforms though (Linux and MacOS X, for example).
    """
    def __init__(self):
        """
        Open a session with the local machine's SSH agent, if one is running.
        If no agent is running, initialization will succeed, but L{get_keys}
        will return an empty tuple.
        
        @raise SSHException: if an SSH agent is found, but speaks an
            incompatible protocol
        """
        self._conn = None
        self.keys = dict()
        if ('SSH_AUTH_SOCK' in os.environ) and (sys.platform != 'win32'):
            conn = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            try:
                conn.connect(os.environ['SSH_AUTH_SOCK'])
            except:
                # probably a dangling env var: the ssh agent is gone
                return
            self._conn = conn
        elif sys.platform == 'win32':
            import win_pageant
            if win_pageant.can_talk_to_agent():
                self._conn = win_pageant.PageantConnection()
            else:
                return
        else:
            # no agent support
            return
            
        ptype, result = self._send_message(chr(SSH2_AGENTC_REQUEST_IDENTITIES))
        if ptype != SSH2_AGENT_IDENTITIES_ANSWER:
            raise SSHException('could not get keys from ssh-agent')
        for i in range(result.get_int()):
            rawkey = result.get_string()
            comment = result.get_string()
            self.keys[comment] = AgentKey(self, rawkey)

