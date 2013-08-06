"""
Kbase wrappers around Globus Online Nexus client libraries. We wrap the Nexus
libraries to provide a similar API between the Perl Bio::KBase::Auth* libraries
and the python version

In this module, we follow standard Python idioms of raising exceptions for
various failure states ( Perl modules returned error states in error_msg field)
"""
import biokbase.nexus.client
from ConfigParser import ConfigParser
import os
from urlparse import urlparse
from pprint import pformat
import requests
import re

"""
Package "globals"
    kb_config
    trust_token_signers
    attrs
    authdata
    config
    tokenend
    AuthSvcHost
    RoleSvcURL
    nexusconfig

"""
__version__ = "0.9"

kb_config = os.environ.get('KB_DEPLOYMENT_CONFIG',os.environ['HOME']+"/.kbase_config")

trust_token_signers = [ 'https://nexus.api.globusonline.org/goauth/keys' ]
attrs = [ 'user_id', 'token','client_secret', 'keyfile',
          'keyfile_passphrase','password','sshagent_keys',
          'sshagent_keyname']

# authdata stores the configuration key/values from any configuration file
authdata = dict()
if os.path.exists( kb_config):
    try:
        conf = ConfigParser()
        conf.read(kb_config)
        # strip down whatever we read to only what is legit
        for x in attrs:
            authdata[x] = conf.get('authentication',x) if conf.has_option('authentication',x) else None 
    except Exception, e:
        print "Error while reading INI file %s: %s" % (kb_config, e)
tokenenv = authdata.get( 'tokenvar', 'KB_AUTH_TOKEN')
# Yes, some variables are camel cased and others are all lower. Trying to maintain
# the attributes names from the perl version which was a mishmash too. regret.
AuthSvcHost = authdata.get( 'servicehost', "https://nexus.api.globusonline.org/")
# Copied from perl libs for reference, not used here
#ProfilePath = authdata.get( 'authpath', "/goauth/token")
RoleSvcURL = authdata.get( 'rolesvcurl', "https://kbase.us/services/authorization/Roles")
nexusconfig = { 'cache' : { 'class': 'biokbase.nexus.token_utils.InMemoryCache',
                            'args': [],
                            },
                'server' : urlparse(AuthSvcHost).netloc,
                'verify_ssl' : False,
                'client' : None,
                'client_secret' : None}
# Compile a regex for parsing out user_id's from tokens
token_userid = re.compile( '(?<=^un=)\w+')

def LoadConfig():
    """
    Method to load configuration from INI style files from the file in kb_config
    """
    global kb_config,authdata,tokenenv,AuthSvcHost,RolesSvcHost
    global RoleSvcURL,nexusconfig,conf

    kb_config = os.environ.get('KB_DEPLOYMENT_CONFIG',os.environ['HOME']+"/.kbase_config")

    if os.path.exists( kb_config):
        try:
            conf = ConfigParser()
            conf.read(kb_config)
            # strip down whatever we read to only what is legit
            for x in attrs:
                authdata[x] = conf.get('authentication',x) if conf.has_option('authentication',x) else None 
        except Exception, e:
            print "Error while reading INI file %s: %s" % (kb_config, e)
    tokenenv = authdata.get( 'tokenvar', 'KB_AUTH_TOKEN')
    # Yes, some variables are camel cased and others are all lower. Trying to maintain
    # the attributes names from the perl version which was a mishmash too. regret.
    AuthSvcHost = authdata.get( 'servicehost', "https://nexus.api.globusonline.org/")
    # Copied from perl libs for reference, not used here
    #ProfilePath = authdata.get( 'authpath', "/goauth/token")
    RoleSvcURL = authdata.get( 'rolesvcurl', "https://kbase.us/services/authorization/Roles")
    nexusconfig = { 'cache' : { 'class': 'biokbase.nexus.token_utils.InMemoryCache',
                                'args': [],
                                },
                    'server' : urlparse(AuthSvcHost).netloc,
                    'verify_ssl' : False,
                    'client' : None,
                    'client_secret' : None}

def SetConfigs( configs):
    """
    Method used to set configuration directives in INI file kb_config
    Takes as a parameter a dictionary of config directives within the authentication section
    that need to be set/unset. If there is a dictionary entry where the value is None
    then the config setting will be deleted
    """
    global kb_config,authdata,tokenenv,AuthSvcHost,RolesSvcHost
    global RoleSvcURL,nexusconfig,conf

    conf = ConfigParser()
    if os.path.exists( kb_config):
        conf.read(kb_config)
    if not conf.has_section('authentication'):
        conf.add_section('authentication')
    for key in configs.keys():
        if configs[key] is not None:
            conf.set('authentication',key, configs[key])
        else:
            conf.remove_option('authentication',key)
    with open(kb_config, 'wb') as configfile:
        conf.write(configfile)
    LoadConfig()

class AuthCredentialsNeeded( Exception ):
    """
    Simple wrapper around Exception class that flags the fact that we don't have
    enough credentials to authenticate, which is distinct from having bad or bogus
    credentials
    """
    pass

class AuthFail( Exception ):
    """
    Simple wrapper around Exception class that flags our credentials are bad or bogus
    """
    pass

class Token:
    """
    Class that handles token requests and validation. This is basically a wrapper
    around the nexus.client.NexusClient class from GlobusOnline that provides a
    similar API to the perl Bio::KBase::AuthToken module. For KBase purposes
    we have modified the base Globus Online classes to support ssh agent based
    authentication as well.

    In memory caching is provided by the underlying nexus.client implementation.

    Instance Attributes:
    user_id 
    password 
    token 
    keyfile 
    client_secret 
    keyfile_passphrase 
    sshagent_keyname 
    """

    def __init__(self, **kwargs):
        """
        Constructor for Token class will accept these optional parameters attributes in
        order to initialize the object:

        user_id, password, token, keyfile, client_secret, keyfile_passphrase, sshagent_keyname

        If user_id is provided among the initializers, the get() method will be called at the
        end of initialization to attempt to fetch a token from the service defined in
        AuthSvcHost. If there are not enough credentials to authenticate, we ignore the
        exception. However if there are enough credentials and they fail to authenticate,
        the exception will be reraised.

        If there is a ~/kbase_config INI file, it will be used to fill in values when there
        are no initialization values given - this can be short circuited by setting
        ignore_kbase_config to true among the initialization params
        """
        global nexusconfig
        attrs = [ 'keyfile','keyfile_passphrase','user_id','password','token','client_secret','sshagent_keyname']
        for attr in attrs:
            setattr( self, attr, kwargs.get(attr,None))
        self.nclient = biokbase.nexus.client.NexusClient(nexusconfig)
        self.nclient.user_key_file = self.keyfile

        if self.nclient.__dict__.has_key("agent_keys"):
            self.sshagent_keys = self.nclient.agent_keys
        else:
            self.sshagent_keys = dict()

        # Flag to mark if we got default values from .kbase_config file
        defattr = reduce( lambda x,y: x or (authconf.get(y, None) is not None), attrs)
        # if we have a user_id defined, try to get a token with whatever else was given
        # if it fails due to not enough creds, try any values from ~/.kbase_config
        if (self.user_id):
            try:
                self.get()
            except AuthCredentialsNeeded:
                pass
            except Exception, e:
                raise e
        elif os.environ.get(tokenenv):
            self.token = os.environ[tokenenv]
        elif defattr and not kwargs.get('ignore_kbase_config'):
            for attr in attrs:
                if authdata.get(attr) is not None:
                    setattr(self,attr,authdata[attr])
            try:
                self.get()
            except AuthCredentialsNeeded:
                pass
            except Exception, e:
                raise e
        if self.user_id is None and self.token:
            # parse out the user_id and set it
            self.user_id = token_userid.search( self.token).group(0)

    def validate( self, token = None):
        """
        Method that validates the contents of self.token against the authentication service backend
        This method caches results, so an initial validation will be high latency due to the
        network round trips, but subsequent validations will return very quickly

        A successfully validated token will return user_id

        Invalid tokens will generate a ValueError exception
        """
        if token is not None:
            res = self.nclient.validate_token( token)
        else:
            res = self.nclient.validate_token( self.token)
        self.user_id = res[0]
        return self.user_id

    def get(self, **kwargs):
        """
        Use either explicit parameters or the current instance vars to authenticate and retrieve a
        token from GlobusOnline (or whoever else is defined in the AuthSvcHost class attribute).

        The following parameters are optional, and will be assigned to the instance vars before
        attempting to fetch a token:
        keyfile, keyfile_passphrase, user_id, password, client_secret, sshagent_keyname

        A user_id and any of the following will be enough to attempt authentication:
        keyfile, keyfile_passphrase, password, sshagent_keyname

        If there are not enough credentials, then an AuthCredentialsNeeded exception will be raised
        If the underlying Globus libraries fail to authenticate, the exception will be passed up

        Success returns self, but with the token attribute containing a good token, an AuthFail
        exception will be thrown if the credentials are rejected by Globus Online

        Note: authentication with an explicit RSA client_secret is not currently supported
        """
        # attributes that we would allow to be passed in via kwargs
        attrs = [ 'keyfile','keyfile_passphrase','user_id','password','token','client_secret','sshagent_keyname']
        for attr in attrs:
            if attr in kwargs:
                setattr( self, attr, kwargs[attr])
        # override the user_key_file default in the nclient object
        self.nclient.user_key_file = self.keyfile
        # in the perl libraries, if we have a user_id, no other credentials, and a single
        # available sshagent_keyname from ssh_agent, default to using that for auth
        if (self.user_id and not ( self.password or self.sshagent_keyname or self.keyfile)
            and (len(self.sshagent_keys.keys()) == 1)):
            self.sshagent_keyname = self.sshagent_keys.keys()[0]
        if not (self.user_id and ( self.password or self.sshagent_keyname or self.keyfile)):
            raise AuthCredentialsNeeded( "Need either (user_id, client_secret || password || sshagent_keyname)  to be defined.")
        if self.keyfile:
            self.nclient.user_key_file = self.keyfile
        if (self.user_id and self.keyfile):
            passphrase = kwargs.get("keyfile_passphrase",self.keyfile_passphrase)
            res = self.nclient.request_client_credential( self.user_id, lambda : passphrase )
        elif (self.user_id and self.password):
            res = self.nclient.request_client_credential( self.user_id, self.password)
        elif (self.user_id and self.sshagent_keyname):
            res = self.nclient.request_client_credential_sshagent( self.user_id, self.sshagent_keyname)
        else:
            raise AuthCredentialsNeeded("Authentication with explicit client_secret not supported - please put key in file or sshagent")
        if 'access_token' in res:
            self.token = res['access_token']
        else:
            raise AuthFail('Could not authenticate with values: ' + pformat(self.__dict__))
        return self

    def get_sessDB_token():
        pass

class User:
    top_attrs = { "user_id" : "username",
                 "verified" : "email_validated",
                 "opt_in" : "opt_in",
                 "name" : "fullname",
                 "email" : "email",
                 "system_admin" : "system_admin" }

    def __init__(self, **kwargs):
        """
        Constructor for User class will accept these optional parameters attributes in
        order to initialize the object:

        user_id, password, token, enabled, groups, name, email, verified

        If a token is provided among the initializers, the get() method will be called at the
        end of initialization to attempt to fetch the user profile from Globus Online

        The ~/.kbase_config file is only indirectly supported - use it to get a token, and then
        use that token as an initializer to this function to fetch a profile
        """
        global nexusconfig
        attrs = [ 'user_id', 'enabled', 'groups', 'name', 'email', 'verified' ]
        for attr in attrs:
            setattr( self, attr, kwargs.get(attr,None))
        if kwargs['token']:
            self.authToken = Token( token = kwargs['token'])
            self.token = self.authToken.token
            self.get()
        return

    def get(self, **kwargs):
        if 'token' in kwargs:
            self.authToken = Token( token = kwargs['token'])
            self.token = self.authToken.token
        if not self.token:
            raise AuthCredentialsNeeded( "Authentication token required")
        p = { 'custom_fields' : '*',
              'fields' : 'groups,username,email_validated,fullname,email'
              }
        headers = { 'Authorization' : 'Globus-Goauthtoken ' + self.token }
        resp = requests.get( AuthSvcHost+"users/" + self.authToken.user_id, params = p,
                             headers = headers)
        profile = resp.json
        for attr,go_attr in self.top_attrs.items():
            setattr( self, attr, profile.get( go_attr))
        # pull out the name field from the groups dict entries and put into groups
        setattr( self, 'groups', [ x['name'] for x in resp.json['groups']])
        if 'custom_fields' in profile:
            for attr in profile['custom_fields'].keys():
                setattr( self, attr, profile['custom_fields'][attr])
        return self
                         
    def update(self, **kwargs):
        pass
