# Customize an ipython environment for KBase
#
# sychan 7/12/2013
#

from __future__ import print_function
from IPython.core.magic import (Magics, magics_class, line_magic,
                                cell_magic, line_cell_magic)

from biokbase.InvocationService.Client import InvocationService as InvocationClient
import biokbase.auth
import getpass
import random
import string
import os
import errno
import time
import sys
import types
import re
import biokbase.narrative.upload_handler

from IPython.core.display import display, Javascript
from ast import literal_eval
from IPython.display import HTML


# Module variables for maintaining KBase Notebook state
user_id = None
token = None
user_profile = None
inv_client = None
ws_client = None
inv_session = None
inv_cwd = '/'

# Flag set by a JS callback to let is know if we have a browser or not
have_browser = None

# End points for various services
endpoint = { 'invocation' : 'https://kbase.us/services/invocation',
             'workspace' : 'https://kbase.us/services/ws/' }

# IPython interpreter object
ip = None

# default start directory
workdir = "/tmp/narrative"

# Actually performs the login with username and password
def do_login( user, password):
    global user_id, token, user_profile, inv_client, inv_session
    try:
        t = biokbase.auth.Token( user_id = user, password = password)
        if t.token:
            set_token(t.token)
        else:
            raise biokbase.auth.AuthFail( "Could not get token with username and password given")
    except biokbase.auth.AuthFail, a:
        print("Failed to login with username password provided. Please try again.",file=sys.stderr)
        token = None
    if token is not None:
        print("Logged in as %s" % user_id,file=sys.stderr)

def set_token( newtoken):
    global user_id, token, user_profile, inv_client, inv_session
    if newtoken:
        token = newtoken
        biokbase.auth.set_environ_token( token)
        user_profile = biokbase.auth.User( token = token)
        user_id = user_profile.user_id
        # If we had a previous session, clear it out
        if inv_session is not None:
            print("Clearing anonymous invocation session",file=sys.stderr)
            inv_client.exit_session( inv_session)
        inv_client = None
        inv_session = None
        ws_client = None

def clear_token():
    global user_id, token, user_profile, inv_client, inv_session
    if token is not None:
        print("Clearing credentials and profile for %s" % user_id,file=sys.stderr)
        user_id = None
        token = None
        user_profile = None
    biokbase.auth.set_environ_token( None)
    # If we had a previous session, clear it out
    if inv_session is not None:
        print("Clearing anonymous invocation session",file=sys.stderr)
        inv_client.exit_session( inv_session)
    inv_client = None
    inv_session = None
    ws_client = None

# Define the KBase notebook magics

@magics_class
class kbasemagics(Magics):

    @line_magic
    def kblogin(self,line):
        """
        Login using username and password to KBase and then push login token into the environment.
        Usage is: kblogin {userid}
        If you have an ssh-agent with keys loaded, kblogin will attempt to use your ssh-key to
        get an Globus token, if not, then you will be prompted for your password.
        The token will be pushed into the KBASE_AUTH_TOKEN environment variable and picked up
        by any libraries that have implemented that support.
        """
        try:
            (user,password) = line.split();
        except ValueError:
            user = line
            password = None
        global user_id, token, user_profile, inv_client, inv_session
        # display(Javascript("IPython.notebook.kernel.execute( 'biokbase.narrative.have_browser = 1')"))
        if user_id is not None:
            print("Already logged in as %s. Please kblogout first if you want to re-login" % user_id,file=sys.stderr)
        elif user is None:
            print("kblogin requires at least a username",file=sys.stderr)
        else:
            try:
                # try to login with only user_id in case there is an ssh_agent running
                t = biokbase.auth.Token( user_id = user)
                if t.token is None:
                    if password is None:
                        password = getpass.getpass( "Please enter the KBase password for %s : " % user)
                    t = biokbase.auth.Token( user_id = user, password = password)
                if t.token:
                    set_token( t.token)
                else:
                    raise biokbase.auth.AuthFail( "Could not get token with username and password given")
            except biokbase.auth.AuthFail, a:
                print("Failed to login with username password provided. Please try again.",file=sys.stderr)
                token = None
        if token is not None:
            return user_id
        else:
            return None

    @line_magic
    def kblogout(self,line):
        "Logout by removing credentials from environment and clearing session objects"
        # Call the clear_token method
        clear_token()
        return
        
    @line_magic
    def uploader(self,line):
        """
        Bring up basic input form that allows you to upload files into /tmp/narrative
        using PLUpload client libraries
        Note that this is a demonstration prototype!
        """
        return HTML( biokbase.narrative.upload_handler.HTML_EXAMPLE)
        
    @line_magic
    def jquploader(self,line):
        """
        Bring up an html cell with JQuery UI PLUpload widget that supports drag and drop
        Note that this is a demonstration prototype!
        """
        return HTML( biokbase.narrative.upload_handler.JQUERY_UI_EXAMPLE)
        
    @line_magic
    def inv_session(self, line=None):
        "Return the current invocation session id, create one if necessary. Parameters are ignored"
        global user_id, token, user_profile, inv_client, inv_session, endpoint

        if inv_client is None:
            if token is None:
                print("You are not currently logged in, using anonymous, unauthenticated access",file=sys.stderr)
            try:
                inv_client = InvocationClient( url = endpoint['invocation'], token = token)
                sess_id = "nrtv_" + str(int(time.time())) + "_" + ''.join(random.choice(string.hexdigits) for x in range(6))
                inv_session = inv_client.start_session(sess_id)
                if inv_session == sess_id:
                    print("New anonymous session created : %s" % inv_session,file=sys.stderr)
                else:
                    print("New authenticated session created for user %s" % user_id,file=sys.stderr)
            except Exception, e:
                print("Error initializing a new invocation service client: %s" % e,file=sys.stderr)
        return inv_session
                
    @line_cell_magic
    def inv_run(self,line, cell=None):
        """
        If we are logged in, make sure we have an invocation session and then use the invocation run_pipeline()
        method to executing the rest of the line
        """
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.inv_session()
        try:
            res = inv_client.run_pipeline( sess, line, [], 200, '/')
            if res[1]:
                print("\n".join(res[1]),file=sys.stderr)
        except Exception, e:
            print("Error: %s" % str(e),file=sys.stderr)
            return None
        return res[0]

    @line_magic
    def inv_ls(self,line):
        """
        List files on the invocation service for this session
        """
        global user_id, token, user_profile, inv_client, inv_session, inv_cwd
        sess = self.inv_session()
        if len(line) > 0:
            try:
                (cwd,d) = line.split()
            except:
                cwd = line
                d = ''
        else:
            cwd = inv_cwd
            d = ''
        try:
            res = inv_client.list_files( sess, cwd,d)
            dirs = [ "%12s   %s   %s" % ('directory', d['mod_date'],d['name']) for d in res[0]]
            print( "\n".join(dirs))
            files = [ "%12d   %s   %s" % (f['size'], f['mod_date'],f['name']) for f in res[1]]
            print( "\n".join(files))
        except Exception, e:
            print("Error: %s" % str(e),file=sys.stderr)
            res = None
        return res

    @line_magic
    def inv_make_directory(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session,inv_cwd
        sess = self.inv_session()
        if len(line) < 1:
            print("Error - must specify a new directory name",file=sys.stderr)
            res = None
        else:
            cwd = inv_cwd
            d = line
            try:
                res = inv_client.make_directory( sess, cwd,d)
            except Exception, e:
                print("Error: %s" % str(e),file=sys.stderr)
                res = None
        return res

    @line_magic
    def inv_remove_directory(self,line):
        """
        Invocation service remove directory
        """
        global user_id, token, user_profile, inv_client, inv_session,inv_cwd
        sess = self.inv_session()
        if len(line) < 1:
            print("Error - must specify a directory to remove",file=sys.stderr)
            res = None
        else:
            cwd = inv_cwd
            d = line
            try:
                res = inv_client.remove_directory( sess, cwd,d)
            except Exception, e:
                print("Error: %s" % str(e),file=sys.stderr)
                res = None
        return res

    @line_magic
    def inv_cd(self,line):
        "Invocation service change directory"
        global user_id, token, user_profile, inv_client, inv_session,inv_cwd
        sess = self.inv_session()
        if len(line) > 0:
            d = line
            try:
                res = inv_client.change_directory( sess, inv_cwd,d)
                inv_cwd = res
            except Exception as e:
                print("Error: %s" % str(e),file=sys.stderr)
                res = None
        else:
            print("Error - please specify a directory",file=sys.stderr)
            res = None
        return res

    @line_magic
    def inv_cwd(self,line):
        "Invocation service current working directory"
        global user_id, token, user_profile, inv_client, inv_session,cwd
        sess = self.inv_session()
        return inv_cwd

    @line_magic
    def inv_valid_commands(self,line):
        "Invocation service inventory of command scripts"
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.inv_session()
        try:
            res = inv_client.valid_commands()
        except Exception as e:
            print("Error: %s" % str(e),file=sys.stderr)
            res = None
        return res

    @line_magic
    def inv_remove_files(self,line):
        """
        Invocation service remove files
        Parameters are: [cwd] filename
        If only a single parameter is given, it is assumed to be a filename
        """
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        if len(line) < 1:
            print("Must specify filename and optionally a cwd",file=sys.stderr)
        else:
            try:
                (cwd,filename) = line.split()
            except:
                filename = line
                cwd = inv_cwd
            sess = self.inv_session()
            try:
                res = inv_client.remove_files( sess, cwd, filename)
            except Exception as e:
                print("Error: %s" % str(e),file=sys.stderr)
        return res

    @line_magic
    def inv_rename_files(self,line):
        "Invocation service rename files"
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        if len(line) < 1:
            print("Must specify: cwd from_filename to_filename",file=sys.stderr)
        else:
            try:
                (cwd, fromfn, tofn) = line.split()
            except:
                try:
                    (fromfn, tofn) = line.split()
                except:
                    print("Must at least from_filename and to_filename",file=sys.stderr)
                    return(None)
                cwd = inv_cwd
            sess = self.inv_session()
            try:
                res = inv_client.rename_file( sess, cwd, fromfn, tofn)
            except Exception as e:
                print("Unable to rename %s to %s in directory %s: %s" % (fromfn,tofn,cwd,str(e)),file=sys.stderr)
        return res

    @line_magic
    def inv_copy(self,line):
        "Invocation service copy file"
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        if len(line) < 1:
            print("Must specify: cwd from_filename to_filename",file=sys.stderr)
        else:
            try:
                (cwd, fromfn, tofn) = line.split()
            except:
                try:
                    (fromfn, tofn) = line.split()
                except:
                    print("Must at least from_filename and to_filename",file=sys.stderr)
                    return(None)
                cwd = inv_cwd
            sess = self.inv_session()
            try:
                res = inv_client.copy( sess, cwd, fromfn, tofn)
            except Exception as e:
                print("Unable to copy %s to %s in directory %s: %s" % (fromfn,tofn,cwd,str(e)),file=sys.stderr)
        return res

    @line_magic
    def inv_put_file(self,line):
        """
        Invocation service put a file on the server.
        Parameters are filename contents [cwd]
        As usual, parameters are whitespace separated and the contents parameter is evaluated as
        a python expression, so you can use a variable to contain file contents, however if contents
        is a literal prefixed with a <, it will be treated as a filename in the current working
        directory.
        Examples:

        inv_put_file newdata 012345
        The line above will write a file called "newdata" to the invocation server, containing the text "012345"

        inv_put_file newdata <newdata.txt
        This line will look for a file called newdata.txt and upload the contents to the file newdata

        inv_put_file newdata newdata
        This line will take the contents of the newdata variable and send it to the newdata file. If there
        is an error evaluating the value of newdata (such as, it is undefined) nothing will be written
        """
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        constr = None
        if len(line) < 1:
            print("Must specify filename, contents and optionally a cwd",file=sys.stderr)
        else:
            try:
                (filename, contents, cwd) = line.split()
            except:
                try:
                    (filename, contents) = line.split()
                except:
                    print("Must at least filename and contents",file=sys.stderr)
                    return(None)
                cwd = inv_cwd
            sess = self.inv_session()
            filematch = re.match('<(.+)',filename)
            if filematch:
                filename = filematch.groups()[0]
                try:
                    with open( filename, "r") as myfile:
                        constr = myfile.read()
                except Exception as e:
                    print("Error: %s" % str(e),file=sys.stderr)                    
            else:
                try:
                    con1 = ip.ev(contents)
                    contstr = str(con1)
                except Exception as e:
                    print("Unable to convert %s to string: %s" % (contents,e),file=sys.stderr)
                    constr = None
            if constr:
                try:
                    res = inv_client.put_file( sess, filename, contstr, cwd)
                except Exception as e:
                    print("Error: %s" % str(e),file=sys.stderr)
        return res

    @line_magic
    def inv_get_file(self,line):
        "Invocation service get file contents"
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        if len(line) < 1:
            print("Must specify filename and optionally a cwd",file=sys.stderr)
        else:
            try:
                (filename,cwd) = line.split()
            except:
                filename = line
                cwd = inv_cwd
            sess = self.inv_session()
            try:
                res = inv_client.get_file( sess, filename, cwd)
            except Exception as e:
                print("Error: %s" % str(e),file=sys.stderr)
        return res

    @line_magic
    def inv_get_tutorial_text(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session
        return res

# Grab the ipython object and the config object if available
#
try:
    ip = get_ipython()
    conf = get_config()
except NameError:
    # Wasn't running within an ipython instance, skip
    pass
except:
    # Hmmm, bad, rethrow it
    raise
if ip is not None:
    ip.register_magics( kbasemagics)
    # If we have a browser, have it set the have_browser flag
    # Try to bring in a token to the environment
    t = biokbase.auth.Token()
    if t.token is not None:
        user_id = t.user_id
        token = t.token
        user_profile = biokbase.auth.User( token = token)
        print("Logged in automatically as %s from environment defaults" % user_id,file=sys.stderr)
    else:
        print("You are not currently logged in. Access to kbase will be unauthenticated (where allowed).\n",file=sys.stderr)
        print("Please login with kblogin for personal access",file=sys.stderr)
    print("KBase narrative module loaded.\nUse 'kblogin {username}' and 'kblogout' to acquire and dispose of KBase credentials.\n",file=sys.stderr)
    print("IPython magics defined for invocation service access are prefixed with inv_*\n",file=sys.stderr)

    # build a bunch of helper functions under the "invoker" namespace
    # that simply run the various commands available from "valid_command"
    # Dynamically create the module, and sub-modules based on command categories
    # and then import it.
    # based heavily on method here:
    # http://dietbuddha.blogspot.com/2012/11/python-metaprogramming-dynamic-module.html

    icmd = types.ModuleType('icmd',"Top level module for invocation command helper functions")
    sys.modules['icmd'] = icmd

    def mkfn(script):
        def fn( *args):
            args2 = [script]
            args2 += list(args)
            if inv_client is None:
                ip.magic("inv_session")
            stdout, stderr = inv_client.run_pipeline(inv_session," ".join(args2),[],200,'/')
            if stderr:
                print( "\n".join(stderr), file=sys.stderr)
            return stdout
        return fn

    # initialize an invocation session
    ip.magic("inv_session")
    cmds = inv_client.valid_commands()
    for category in cmds:
        catname = str(category['name']).replace('-','_')
        m = types.ModuleType(catname,category['title'])
        setattr(icmd,catname, m)
        sys.modules[ 'icmd.%s' % catname] = m
        for item in category['items']:
            script = str(item['cmd']).replace('-','_')
            fn = mkfn(str(item['cmd']))
            fn.__name__ = script
            fn.__doc__ = "Runs the %s script via invocation service" % item['cmd']
            setattr( m, script, fn)
    ip.ex('import icmd')
    try:
        os.makedirs(workdir)
    except OSError as exception:
        if exception.errno != errno.EEXIST:
            raise
    os.chdir(workdir)
    print("Invocation service script helper functions have been loaded under the icmd.* namespace\n",file=sys.stderr)
