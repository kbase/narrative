# Customize an ipython environment for KBase
#
# sychan 7/12/2013
#

# System
import getpass
import logging
import sys
# IPython
from IPython.core.magic import (Magics, magics_class, line_magic,
                                cell_magic, line_cell_magic)
# KBase
import biokbase.auth

from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.common.log_common import EVENT_MSG_SEP

# Logging
g_log = logging.getLogger(__name__)

# Module variables for maintaining KBase Notebook state
user_id = None
token = None
user_profile = None
ws_client = None

# Flag set by a JS callback to let is know if we have a browser or not
have_browser = None

# End points for various services
endpoint = {'workspace': URLS.workspace}

# IPython interpreter object
ip = None

# default start directory
workdir = "/tmp/narrative"


def user_msg(s):
    """Show a message to the user.
    Adds a newline.
    Also logs it for posterity.
    """
    g_log.debug("user_msg{}len={:d}".format(
               EVENT_MSG_SEP, len(s)))
    sys.stderr.write(s + "\n")


def set_token(newtoken):
    global user_id, token, user_profile
    if newtoken:
        token = newtoken
        biokbase.auth.set_environ_token(token)
        user_profile = biokbase.auth.User(token=token)
        user_id = user_profile.user_id
        # If we had a previous session, clear it out
        ws_client = None


def clear_token():
    global user_id, token, user_profile
    if token is not None:
        user_msg("Clearing credentials and profile for {}".format(user_id))
        user_id = None
        token = None
        user_profile = None
    biokbase.auth.set_environ_token(None)
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
            (user, password) = line.strip().split()
        except ValueError:
            user = line
            password = None
        global user_id, token, user_profile

        if user_id is not None:
            user_msg("Already logged in as {}. "
                     "Please kblogout first if you want to re-login"
                     .format(user_id))
        elif user is None:
            user_msg("kblogin requires at least a username")
        else:
            try:
                # XXX: SSH_AGENT NOT WORKING, so it's been deprecated
                # try to login with only user_id in case there is
                # an ssh_agent running
                # t = biokbase.auth.Token(user_id=user)
                # if t.token is None:
                if password is None:
                    password = getpass.getpass("Please enter the KBase "
                                               "password for '%s': " % user)
                t = biokbase.auth.Token(user_id=user, password=password)
                if t.token:
                    set_token(t.token)
                else:
                    raise biokbase.auth.AuthFail(
                        "Could not get token with username and password given")
            except biokbase.auth.AuthFail:
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
