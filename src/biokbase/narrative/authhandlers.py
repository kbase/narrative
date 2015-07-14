"""
KBase handlers for authentication in the IPython notebook.
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

from tornado.escape import url_escape
from IPython.html.base.handlers import IPythonHandler
from IPython.config import Application
from IPython.html.auth.login import LoginHandler
from IPython.html.auth.logout import LogoutHandler

from biokbase.narrative.common.kblogging import get_logger, log_event
from biokbase.narrative.common.util import kbase_env
import biokbase.auth

import tornado.log
import re
import os
import urllib
import logging

# Set logging up globally.
g_log = get_logger("biokbase.narrative")

app_log = tornado.log.app_log  # alias
if Application.initialized:
    app_log = Application.instance().log

if os.environ.get('KBASE_DEBUG', False):
    app_log.setLevel(logging.DEBUG)

auth_cookie_name = "kbase_narr_session"
backup_cookie = "kbase_session"
all_cookies = (auth_cookie_name, backup_cookie)

class KBaseLoginHandler(LoginHandler):
    """KBase-specific login handler.
    This should get the cookie and put it where it belongs.

    A (not-so-distant) future version will return a session token.
    """

    def get(self):
        """
        Initializes the KBase session from the cookie passed into it.
        """

        cookie_regex = re.compile('([^ =|]+)=([^\|]*)')

        client_ip = self.request.remote_ip
        http_headers = self.request.headers
        ua = http_headers.get('User-Agent', 'unknown')
        # save client ip in environ for later logging
        kbase_env.client_ip = client_ip
        found_cookies = [self.cookies[c] for c in all_cookies
                         if c in self.cookies]
        if found_cookies:
            # Push the cookie
            cookie_val = urllib.unquote(found_cookies[0].value)
            cookie_obj = {
                k: v.replace('EQUALSSIGN', '=').replace('PIPESIGN', '|')
                for k, v in cookie_regex.findall(cookie_val) 
            }
            if app_log.isEnabledFor(logging.DEBUG):
                app_log.debug("kbase cookie = {}".format(cookie_val))
                app_log.debug("KBaseLoginHandler.get: user_id={uid} token={tok}"
                    .format(uid=sess.get('token', 'none'),
                            tok=sess.get('token', 'none')))

            biokbase.auth.set_environ_token(cookie_obj.get('token', None))
            kbase_env.session = cookie_obj.get('kbase_sessionid', '')
            kbase_env.client_ip = client_ip
            kbase_env.user = cookie_obj.get('user_id', '')
            log_event(g_log, 'session_start', {'user': kbase_env.user, 'user_agent': ua})
            self.current_user = kbase_env.user

        app_log.info("KBaseLoginHandler.get(): user={}".format(kbase_env.user))

        if self.current_user:
            self.redirect(self.get_argument('next', default=self.base_url))
        else:
            self.write('This is a test?')


    def post(self):
        pass

    @classmethod
    def get_user(cls, handler):
        user_id = kbase_env.user

        if user_id == '':
            user_id = 'anonymous'
        if user_id is None:
            handler.clear_login_cookie()
            if not handler.login_available:
                user_id = 'anonymous'
        return user_id

    @classmethod
    def password_from_settings(cls, settings):
        return u''

    @classmethod
    def login_available(cls, settings):
        """Whether this LoginHandler is needed - and therefore whether the login page should be displayed."""
        return True

class KBaseLogoutHandler(LogoutHandler):
    def get(self):
        client_ip = self.request.remote_ip
        http_headers = self.request.headers
        user = kbase_env.user
        ua = http_headers.get('User-Agent', 'unknown')

        kbase_env.auth_token = 'none'
        kbase_env.narrative = 'none'
        kbase_env.session = 'none'
        kbase_env.user = 'anonymous'
        kbase_env.workspace = 'none'

        biokbase.auth.set_environ_token(None)

        app_log.info('Successfully logged out')
        log_event(g_log, 'session_close', {'user': user, 'user_agent': ua})

        self.write(self.render_template('logout.html', message={'info': 'Successfully logged out'}))