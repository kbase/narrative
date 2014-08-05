# Customize an ipython environment for KBase
#
# sychan 7/12/2013
#

# System
import errno
import getpass
import logging
import os
import random
import re
import string
import sys
import time
import types
# IPython
from IPython.core.magic import (Magics, magics_class, line_magic,
                                cell_magic, line_cell_magic)
from IPython.display import HTML
# KBase
import biokbase.auth
from biokbase.InvocationService.Client import \
    InvocationService as InvocationClient
import biokbase.narrative.upload_handler
from biokbase.narrative.common.url_config import URLS

# Logging
_log = logging.getLogger(__name__)

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
endpoint = {'invocation': URLS.invocation,
            'workspace': URLS.workspace }
# endpoint = { 'invocation' : 'https://kbase.us/services/invocation',
#              'workspace' : 'https://kbase.us/services/ws/' }

# IPython interpreter object
ip = None

# default start directory
workdir = "/tmp/narrative"


def user_msg(s):
    """Show a message to the user.
    Adds a newline.
    """
    _log.debug("user_msg len={:d}".format(len(s)))
    sys.stderr.write(s + "\n")


def do_login(user, password):
    """Actually performs the login with username and password
    """
    global user_id, token, user_profile, inv_client, inv_session
    try:
        t = biokbase.auth.Token(user_id=user, password=password)
        if t.token:
            set_token(t.token)
        else:
            raise biokbase.auth.AuthFail("Could not get token with username and password given")
    except biokbase.auth.AuthFail, a:
        user_msg("Failed to login with username password provided. "
                     "Please try again.")
        token = None
    if token is not None:
        user_msg("Logged in as {}".format(user_id))


def set_token(newtoken):
    global user_id, token, user_profile, inv_client, inv_session
    if newtoken:
        token = newtoken
        biokbase.auth.set_environ_token(token)
        user_profile = biokbase.auth.User(token = token)
        user_id = user_profile.user_id
        # If we had a previous session, clear it out
        if inv_session is not None:
            user_msg("Clearing anonymous invocation session")
            inv_client.exit_session(inv_session)
        inv_client = None
        inv_session = None
        ws_client = None


def clear_token():
    global user_id, token, user_profile, inv_client, inv_session
    if token is not None:
        user_msg("Clearing credentials and profile for {}".format(user_id))
        user_id = None
        token = None
        user_profile = None
    biokbase.auth.set_environ_token( None)
    # If we had a previous session, clear it out
    if inv_session is not None:
        user_msg("Clearing anonymous invocation session")
        inv_client.exit_session( inv_session)
    inv_client = None
    inv_session = None
    ws_client = None

# Define the KBase notebook magics


@magics_class
class kbasemagics(Magics):

    @line_magic
    def kblogin(self, line):
        """
        Login using username and password to KBase and then push login token into the environment.
        Usage is: kblogin {userid}
        If you have an ssh-agent with keys loaded, kblogin will attempt to use your ssh-key to
        get an Globus token, if not, then you will be prompted for your password.
        The token will be pushed into the KBASE_AUTH_TOKEN environment variable and picked up
        by any libraries that have implemented that support.
        """
        try:
            (user, password) = line.split()
        except ValueError:
            user = line
            password = None
        global user_id, token, user_profile, inv_client, inv_session
        # display(Javascript("IPython.notebook.kernel.execute( 'biokbase.narrative.have_browser = 1')"))
        if user_id is not None:
            user_msg("Already logged in as {}. "
                         "Please kblogout first if you want to re-login"
                         .format(user_id))
        elif user is None:
            user_msg("kblogin requires at least a username")
        else:
            try:
                # try to login with only user_id in case there is
                # an ssh_agent running
                t = biokbase.auth.Token(user_id=user)
                if t.token is None:
                    if password is None:
                        password = getpass.getpass("Please enter the KBase "
                                                   "password for '%s': " % user)
                    t = biokbase.auth.Token(user_id=user, password=password)
                if t.token:
                    set_token(t.token)
                else:
                    raise biokbase.auth.AuthFail(
                        "Could not get token with username and password given")
            except biokbase.auth.AuthFail, a:
                user_msg("Failed to login with username password provided. "
                         "Please try again.")
                token = None
        if token is not None:
            return user_id
        else:
            return None

    @line_magic
    def kblogout(self, line):
        """Logout by removing credentials from environment and
           clearing session objects
        """
        # Call the clear_token method
        clear_token()
        return
        
    @line_magic
    def uploader(self, line):
        """
        Bring up basic input form that allows you to upload files into /tmp/narrative
        using PLUpload client libraries
        Note that this is a demonstration prototype!
        """
        return HTML(biokbase.narrative.upload_handler.HTML_EXAMPLE)
        
    @line_magic
    def jquploader(self, line):
        """
        Bring up an html cell with JQuery UI PLUpload widget that supports drag and drop
        Note that this is a demonstration prototype!
        """
        return HTML(biokbase.narrative.upload_handler.JQUERY_UI_EXAMPLE)
        
    @line_magic
    def inv_session(self, line=None):
        """Return the current invocation session id, create one if necessary.
        Parameters are ignored
        """
        global user_id, token, user_profile, inv_client, inv_session, endpoint

        if inv_client is None:
            if token is None:
                user_msg("You are not currently logged in. Using anonymous,"
                             " unauthenticated access")
            try:
                inv_client = InvocationClient( url = endpoint['invocation'], token = token)
                sess_id = "nrtv_" + str(int(time.time())) + "_" + ''.join(random.choice(string.hexdigits) for x in range(6))
                inv_session = inv_client.start_session(sess_id)
                if inv_session == sess_id:
                    user_msg("New anonymous session created : %s"
                                 % inv_session)
                else:
                    user_msg("New authenticated session created "
                                 "for user %s" % user_id)
            except Exception, e:
                user_msg("Error initializing a new invocation service "
                             "client: %s" % e)
        return inv_session
                
    @line_cell_magic
    def inv_run(self, line, cell=None):
        """
        If we are logged in, make sure we have an invocation session and then use the invocation run_pipeline()
        method to executing the rest of the line
        """
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.inv_session()
        cwd = self.inv_cwd('')

        # if there's just a single line
        if len(line) > 0 and cell is None:
            res = self.inv_run_line(sess, cwd, line)
            if res is not None:
                print("".join(res))
                return res
        if cell is not None:
            all_results = []
            lines = cell.splitlines()
            for command in lines:
                res = self.inv_run_line(sess, cwd, command)
                if res is not None:
                    all_results.append(res)
            print("\n".join(all_results))

        # try:
        #     res = inv_client.run_pipeline( sess, line, [], 200, '/')
        #     if res[1]:
        #         print("\n".join(res[1]),file=sys.stderr)
        # except Exception, e:
        #     print("Error: %s" % str(e),file=sys.stderr)
        #     return None
        # return res[0]

    def inv_run_line(self, session, cwd, line):
        """
        This is the workhorse for running an Invocation service command.
        In the case where there's a cell full of these, they should be passed here one at a time.
        Note that this does NOT set up an Invocation session - that should be set up externally and
        passed to this function.
        """
        try:
            line = line.strip()

            # get the first token as lower case
            first_token = line.split()[0].lower()

            # keep the rest of the line parameters, incase we need to pass them along to the other magics
            line_params = line[len(first_token):].strip()

            # Now, test the first token for convenience commands, and pass them along as necessary:
            # ls 
            # cwd or pwd
            # mkdir
            # rmdir
            # copy or cp
            # rm
            # mv
            if (first_token == 'ls'):
                return self.inv_ls(line_params, print_output=False)
            elif (first_token == 'cwd' or first_token == 'pwd'):
                return self.inv_cwd(line_params)
            elif (first_token == 'mkdir'):
                return self.inv_make_directory(line_params)
            elif (first_token == 'copy' or first_token == 'cp'):
                return self.inv_copy(line_params)
            elif (first_token == 'rmdir'):
                return self.inv_remove_directory(line_params)
            elif (first_token == 'rm'):
                return self.inv_remove_files(line_params)
            elif (first_token == 'mv'):
                return self.inv_rename_files(line_params)
            elif (first_token == 'cd'):
                return self.inv_cd(line_params)
            else:
                res = inv_client.run_pipeline(session, line, [], 200, cwd)
                if res[1]:
                    user_msg("\n".join(res[1]))
                else:
                    return "".join(res[0])
        except Exception, e:
            _log.error("inv_run_line msg={}".format(e))
            user_msg("Error: %s" % str(e))
            return None
        # return res[0]

    @line_magic
    def inv_ls(self, line, print_output=True):
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
            res = inv_client.list_files(sess, cwd, d)
            dirs = ["%12s   %s   %s" % ('directory', d['mod_date'],
                                        d['name']) for d in res[0]]
            files = ["%12d   %s   %s" % (f['size'], f['mod_date'],
                                         f['name']) for f in res[1]]
            print_dir = "\n".join(dirs)
            print_file = "\n".join(files)
            if print_output is True:
                print(print_dir + "\n" + print_file)
            res = print_dir + "\n" + print_file
        except Exception, e:
            user_msg("Error: %s" % str(e))
            res = None
        return res

    @line_magic
    def inv_make_directory(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session,inv_cwd
        sess = self.inv_session()
        if len(line) < 1:
            user_msg("Error - must specify a new directory name")
            res = None
        else:
            cwd = inv_cwd
            d = line
            try:
                res = inv_client.make_directory( sess, cwd,d)
            except Exception, e:
                user_msg("Error: %s" % str(e))
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
            user_msg("Error - must specify a directory to remove")
            res = None
        else:
            cwd = inv_cwd
            d = line
            try:
                res = inv_client.remove_directory( sess, cwd,d)
            except Exception, e:
                user_msg("Error: %s" % str(e))
                res = None
        return res

    @line_magic
    def inv_cd(self, line):
        "Invocation service change directory"
        global user_id, token, user_profile, inv_client, inv_session,inv_cwd
        sess = self.inv_session()
        if len(line) > 0:
            d = line
            try:
                res = inv_client.change_directory( sess, inv_cwd,d)
                inv_cwd = res
            except Exception as e:
                user_msg("Error: %s" % str(e))
                res = None
        else:
            user_msg("Error - please specify a directory")
            res = None
        return res

    @line_magic
    def inv_cwd(self,line):
        "Invocation service current working directory"
        global user_id, token, user_profile, inv_client, inv_session,cwd
        sess = self.inv_session()
        return inv_cwd

    @line_magic
    def inv_valid_commands(self, line):
        "Invocation service inventory of command scripts"
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.inv_session()
        try:
            res = inv_client.valid_commands()
        except Exception as e:
            user_msg("Error: %s" % str(e))
            res = None
        return res

    @line_magic
    def inv_remove_files(self, line):
        """
        Invocation service remove files
        Parameters are: [cwd] filename
        If only a single parameter is given, it is assumed to be a filename
        """
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        if len(line) < 1:
            user_msg("Must specify filename and optionally a cwd")
        else:
            try:
                (cwd, filename) = line.split()
            except:
                filename = line
                cwd = inv_cwd
            sess = self.inv_session()
            try:
                res = inv_client.remove_files( sess, cwd, filename)
            except Exception as e:
                user_msg("Error: %s" % str(e))
        return res

    @line_magic
    def inv_rename_files(self, line):
        "Invocation service rename files"
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        if len(line) < 1:
            user_msg("Must specify: cwd from_filename to_filename")
        else:
            try:
                (cwd, fromfn, tofn) = line.split()
            except:
                try:
                    (fromfn, tofn) = line.split()
                except:
                    user_msg("Must at least from_filename and to_filename")
                    return(None)
                cwd = inv_cwd
            sess = self.inv_session()
            try:
                res = inv_client.rename_file( sess, cwd, fromfn, tofn)
            except Exception as e:
                user_msg("Unable to rename %s to %s in directory %s: %s"
                             % (fromfn,tofn,cwd,str(e)))
        return res

    @line_magic
    def inv_copy(self,line):
        "Invocation service copy file"
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        if len(line) < 1:
            user_msg("Must specify: cwd from_filename to_filename")
        else:
            try:
                (cwd, fromfn, tofn) = line.split()
            except:
                try:
                    (fromfn, tofn) = line.split()
                except:
                    user_msg("Must at least from_filename and to_filename")
                    return None
                cwd = inv_cwd
            sess = self.inv_session()
            try:
                res = inv_client.copy( sess, cwd, fromfn, tofn)
            except Exception as e:
                user_msg("Unable to copy %s to %s in directory %s: %s" %
                             (fromfn,tofn,cwd,str(e)))
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
            user_msg("Must specify filename, contents and optionally a cwd")
        else:
            try:
                (filename, contents, cwd) = line.split()
            except:
                try:
                    (filename, contents) = line.split()
                except:
                    user_msg("Must at least filename and contents")
                    return None
                cwd = inv_cwd
            sess = self.inv_session()
            filematch = re.match('<(.+)',filename)
            if filematch:
                filename = filematch.groups()[0]
                try:
                    with open( filename, "r") as myfile:
                        constr = myfile.read()
                except Exception as e:
                    user_msg("Error: %s" % str(e))
            else:
                try:
                    con1 = ip.ev(contents)
                    contstr = str(con1)
                except Exception as e:
                    user_msg("Unable to convert %s to string: %s" %
                                 (contents, e))
                    constr = None
            if constr:
                try:
                    res = inv_client.put_file(sess, filename, contstr, cwd)
                except Exception as e:
                    user_msg("Error: %s" % str(e))
        return res

    @line_magic
    def inv_get_file(self, line):
        "Invocation service get file contents"
        global user_id, token, user_profile, inv_client, inv_session
        res = None
        if len(line) < 1:
            user_msg("Must specify filename and,"
                     " optionally, a working directory.")
        else:
            try:
                (filename, wdir) = line.split()
            except:
                filename = line
                wdir = inv_cwd
            sess = self.inv_session()
            try:
                res = inv_client.get_file(sess, filename, wdir)
            except Exception as e:
                user_msg("Error: %s" % str(e))
        return res

    @line_magic
    def inv_get_tutorial_text(self, line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session
        return res

# Grab the ipython object and the config object if available
#
try:
    # XXX: Where are these defined/imported?
    ip = get_ipython()
    conf = get_config()
except NameError:
    # Wasn't running within an ipython instance, skip
    pass
except:
    # Hmmm, bad, rethrow it
    raise
if ip is None:
    user_msg("Cannot fetch IPython instance")
else:
    ip.register_magics(kbasemagics)
    # If we have a browser, have it set the have_browser flag
    # Try to bring in a token to the environment
    t = biokbase.auth.Token()
    if t.token is not None:
        user_id = t.user_id
        token = t.token
        # XXX: This isn't actually used anywhere! But it does trigger a poke at globusonline...
        user_profile = None
#        user_profile = biokbase.auth.User(token=token)
        user_msg("Logged in automatically as %s from environment defaults"
                 % user_id)
    else:
        user_msg("You are not currently logged in. Access to kbase will be "
                 "unauthenticated (where allowed).\n"
                 "Please login with kblogin for personal access.")
    user_msg("KBase narrative module loaded.\n"
             "Use 'kblogin {username}' and "
             "'kblogout' to acquire and dispose of KBase credentials.\n"
             "IPython magics defined for invocation service access are "
             "prefixed with inv_*")

    # build a bunch of helper functions under the "invoker" namespace
    # that simply run the various commands available from "valid_command"
    # Dynamically create the module, and sub-modules based on command categories
    # and then import it.
    # based heavily on method here:
    # http://dietbuddha.blogspot.com/2012/11/python-metaprogramming-dynamic-module.html

    icmd = types.ModuleType('icmd', "Top level module for invocation command "
                                    "helper functions")
    sys.modules['icmd'] = icmd

    def mkfn(script):
        def fn(*args):
            args2 = [script]
            args2 += list(args)
            if inv_client is None:
                ip.magic("inv_session")
            stdout, stderr = inv_client.run_pipeline(inv_session," ".join(args2),[],200,'/')
            if stderr:
                user_msg("\n".join(stderr))
            return stdout
        return fn

    # initialize an invocation session
    ip.magic("inv_session")
    cmds = inv_client.valid_commands()
    for category in cmds:
        catname = str(category['name']).replace('-','_')
        m = types.ModuleType(catname,category['title'])
        setattr(icmd,catname, m)
        sys.modules['icmd.%s' % catname] = m
        for item in category['items']:
            script = str(item['cmd']).replace('-','_')
            fn = mkfn(str(item['cmd']))
            fn.__name__ = script
            fn.__doc__ = "Runs the %s script via invocation service" % item['cmd']
            setattr(m, script, fn)
    ip.ex('import icmd')
    try:
        os.makedirs(workdir)
    except OSError as exception:
        if exception.errno != errno.EEXIST:
            raise
    os.chdir(workdir)
    user_msg("Invocation service script helper functions have been loaded "
             "under the icmd.* namespace")
