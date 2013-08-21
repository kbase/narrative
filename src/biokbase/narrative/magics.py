# Customize an ipython environment for KBase
#
# sychan 7/12/2013
#

from IPython.core.magic import (Magics, magics_class, line_magic,
                                cell_magic, line_cell_magic)

from biokbase.InvocationService.Client import InvocationService as InvocationClient
import biokbase.auth
import getpass
import random
import string
import time
from IPython.core.display import display, Javascript

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
endpoint = { 'invocation' : 'https://kbase.us/services/invocation' }

# IPython interpreter object
ip = None

#
# Some helper code to prompt for a password from
# https://github.com/minrk/ipython_extensions/blob/master/nbinput.py
#
# This code is supposed to be obsolete once we merge with IPython 1.0
# and will be removed
#
def nbgetpass(user_id):
    display(Javascript("""
var dialog = $('<div/>').append(
    $('<input/>')
    .attr('id', 'password')
    .attr('name', 'password')
    .attr('type', 'password')
    .attr('value', '')
);
$(document).append(dialog);
dialog.dialog({
    resizable: false,
    modal: true,
    title: "Password for %s",
    closeText: '',
    buttons : {
        "Okay": function () {
            IPython.notebook.kernel.execute(
                "biokbase.narrative.do_login( '%s', '" + $("input#password").attr('value') + "')"
            );
            $(this).dialog('close');
            dialog.remove();
        },
        "Cancel": function () {
            $(this).dialog('close');
            dialog.remove();
        }
    }
});
""" % (user_id,user_id)), include=['application/javascript'])
                                  

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
        print "Failed to login with username password provided. Please try again."
        token = None
    if token is not None:
        print "Logged in as %s" % user_id

def set_token( newtoken):
    global user_id, token, user_profile, inv_client, inv_session
    if newtoken:
        token = newtoken
        user_profile = biokbase.auth.User( token = token)
        user_id = user_profile.user_id
        # If we had a previous session, clear it out
        if inv_session is not None:
            print "Clearing anonymous invocation session"
            inv_client.exit_session( inv_session)
        inv_client = None
        inv_session = None
        ws_client = None

def clear_token():
    global user_id, token, user_profile, inv_client, inv_session
    if token is not None:
        print "Clearing credentials and profile for %s" % user_id
        user_id = None
        token = None
        user_profile = None
    # If we had a previous session, clear it out
    if inv_session is not None:
        print "Clearing anonymous invocation session"
        inv_client.exit_session( inv_session)
    inv_client = None
    inv_session = None
    ws_client = None

# Define the KBase notebook magics

@magics_class
class kbasemagics(Magics):

    @line_magic
    def kblogin(self,user):
        global user_id, token, user_profile, inv_client, inv_session
        "Login using username and password to KBase and then push necessary info into the environment"
        # display(Javascript("IPython.notebook.kernel.execute( 'biokbase.narrative.have_browser = 1')"))
        if user_id is not None:
            print "Already logged in as %s. Please kblogout first if you want to re-login" % user_id
        elif user is None:
            print "kblogin requires at least a username"
        else:
            try:
                # try to login with only user_id in case there is an ssh_agent running
                t = biokbase.auth.Token( user_id = user)
                if t.token is None:
                    password = raw_input( "Please enter the KBase password for %s : " % user)
                    t = biokbase.auth.Token( user_id = user, password = password)
                if t.token:
                    user_id = t.user_id
                    token = t.token
                    user_profile = biokbase.auth.User( token = token)
                    # If we had a previous session, clear it out
                    if inv_session is not None:
                        print "Clearing anonymous invocation session"
                        inv_client.exit_session( inv_session)
                    inv_client = None
                    inv_session = None
                    ws_client = None
                else:
                    raise biokbase.auth.AuthFail( "Could not get token with username and password given")
            except biokbase.auth.AuthFail, a:
                print "Failed to login with username password provided. Please try again."
                token = None
        if token is not None:
            return user_id
        else:
            return None


    @line_magic
    def kb_nblogin(self,user):
        global user_id, token, user_profile, inv_client, inv_session
        "Notebook interface specific Login using username and password to KBase and then push necessary info into the environment"
        if user_id is not None:
            raise Exception( "Already logged in as %s. Please logout first if you want to re-login" % user_id)
        if user is None:
            print "kb_nblogin requires at least a username"
        else:
            # try to login with only user_id in case there is an ssh_agent running
            try:
                t = biokbase.auth.Token( user_id = user)
                if t.token:
                    user_id = t.user_id
                    token = t.token
                    user_profile = biokbase.auth.User( token = token)
                    # If we had a previous session, clear it out
                    if inv_session is not None:
                        print "Clearing anonymous invocation session"
                        inv_client.exit_session( inv_session)
                    inv_client = None
                    inv_session = None
                    ws_client = None
            except biokbase.auth.AuthFail, a:
                # use javascript callback
                nbgetpass( user)
        if token is not None:
            return user_id
        else:
            # The JS callback was used return None
            return None

    @line_magic
    def kblogout(self,line):
        "Logout by removing credentials from environment and clearing session objects"
        # Call the clear_token method
        clear_token()
        return
        

    def invoke_session(self):
        "Return the current invocation session id, create one if necessary"
        global user_id, token, user_profile, inv_client, inv_session, endpoint

        if inv_client is None:
            if token is None:
                print "You are not currently logged in, using anonymous, unauthenticated access"
            try:
                inv_client = InvocationClient( url = endpoint['invocation'], token = token)
                sess_id = "nrtv_" + str(int(time.time())) + "_" + ''.join(random.choice(string.hexdigits) for x in range(6))
                inv_session = inv_client.start_session(sess_id)
                if inv_session == sess_id:
                    print "New anonymous session created : %s" % inv_session
                else:
                    print "New authenticated session created for user %s" % user_id
            except Exception, e:
                print "Error initializing a new invocation service client: %s" % e
        return inv_session
                
    @line_cell_magic
    def invoke_run(self,line, cell=None):
        "If we are logged in, make sure we have a session and then use the invocation run_pipeline() method to executing something"
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.invoke_session()
        res = inv_client.run_pipeline( sess, line, [], 200, '/')
        
        return res[0]

    @line_magic
    def invoke_ls(self,line):
        "Invocation service list files"
        global user_id, token, user_profile, inv_client, inv_session, inv_cwd
        sess = self.invoke_session()
        if len(line) > 0:
            try:
                (cwd,d) = line.split()
            except:
                cwd = line
                d = ''
        else:
            cwd = inv_cwd
            d = ''
        res = inv_client.list_files( sess, cwd,d)
        return res

    @line_magic
    def invoke_make_directory(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session,inv_cwd
        sess = self.invoke_session()
        if len(line) < 1:
            print "Error - must specify a new directory name"
            res = None
        else:
            cwd = inv_cwd
            d = line
            res = inv_client.make_directory( sess, cwd,d)
        return res

    @line_magic
    def invoke_remove_directory(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session,inv_cwd
        sess = self.invoke_session()
        if len(line) < 1:
            print "Error - must specify a directory to remove"
            res = None
        else:
            cwd = inv_cwd
            d = line
            res = inv_client.remove_directory( sess, cwd,d)
        return res

    @line_magic
    def invoke_cd(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session,inv_cwd
        sess = self.invoke_session()
        if len(line) > 0:
            d = line
            res = inv_client.change_directory( sess, inv_cwd,d)
            inv_cwd = res
        else:
            print "Error - please specify a directory"
        return res

    @line_magic
    def invoke_cwd(self,line):
        "Invocation service current working directory"
        global user_id, token, user_profile, inv_client, inv_session,cwd
        sess = self.invoke_session()
        return inv_cwd

    @line_magic
    def invoke_valid_commands(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.invoke_session()
        res = inv_client.valid_commands()
        return res

    @line_magic
    def invoke_remove_files(self,line):
        "Invocation service remove files"
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.invoke_session()
        return res

    @line_magic
    def invoke_rename_files(self,line):
        "Invocation service remove files"
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.invoke_session()
        return res

    @line_magic
    def invoke_copy(self,line):
        "Invocation service copy file"
        global user_id, token, user_profile, inv_client, inv_session
        sess = self.invoke_session()
        return res

    @line_magic
    def invoke_put_file(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session
        return res

    @line_magic
    def invoke_get_file(self,line):
        "Invocation service make directory"
        global user_id, token, user_profile, inv_client, inv_session
        return res

    @line_magic
    def invoke_get_tutorial_text(self,line):
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
        user_id = t.tuser_id
        token = t.token
        user_profile = biokbase.auth.User( token = token)
        print "Logged in automatically as %s from environment defaults" % user_id
    else:
        print "You are not currently logged in. Access to kbase will be unauthenticated (where allowed).\nPlease login with kblogin for personal access"
    print "KBase narrative module loaded.\nUse 'kblogin {username}' and 'kblogout' to acquire and dispose of KBase credentials.\nIPython magics defined for invocation service access are prefixed with invoke_*\n"
