"""
Module to monkeypatch the parts of the IPython core that we don't/won't rewrite

Yes, its nasty.
No, we wouldn't use these if there were an alternative

We use some code that GvR posted here as helpers:
https://mail.python.org/pipermail/python-dev/2008-January/076194.html

sychan@lbl.gov

"""
import logging
import os
import sys
import urllib
import re
import IPython.html.services.notebooks.handlers
from IPython.html.notebook.handlers import web  # get Tornado hook
import IPython
import biokbase.auth
from biokbase.narrative.common.kblogging import get_logger, log_event
from biokbase.narrative.common.util import kbase_env

g_log = get_logger("biokbase.narrative")

def monkeypatch_method(cls):
    """
    To use:
    from <somewhere> import <someclass>

    @monkeypatch_method(<someclass>)
    def <newmethod>(self, args):
        return <whatever>

    This adds <newmethod> to <someclass>
    """
    def decorator(func):
        setattr(cls, func.__name__, func)
        return func
    return decorator

def monkeypatch_class(name, bases, namespace):
    """
    To use:
    from <somewhere> import <someclass>
    class <newclass>(<someclass>):
        __metaclass__ = monkeypatch_class
        def <method1>(...): ...
        def <method2>(...): ...
        ...

    This adds <method1>, <method2>, etc. to <someclass>, and makes
    <newclass> a local alias for <someclass>.
    """
    assert len(bases) == 1, "Exactly one base class required"
    base = bases[0]
    for name, value in namespace.iteritems():
        if name != "__metaclass__":
            setattr(base, name, value)
    return base

# This is all kind of gross, but we will end up re-doing it later.
# Tentatively planning on
# submitting class wrapper decorators for the IPython Tornado request
# handlers, will do
# it as a patch to the IPython core and then submit a PR
def do_patching(c):
    auth_cookie_name = "kbase_narr_session"
    backup_cookie = "kbase_session"
    all_cookies = (auth_cookie_name, backup_cookie)

    app_log = IPython.html.base.handlers.app_log  # alias
    if os.environ.get('KBASE_DEBUG', False):
        app_log.setLevel(logging.DEBUG)

    if c.NotebookApp.get('kbase_auth', False):
        app_log.debug("Monkeypatching IPython.html."
                      "notebook.handlers.NamedNotebookHandler.get() "
                      "in process {}".format(os.getpid()))

        cookierx = re.compile('([^ =|]+)=([^\|]*)')

        parse_cookie = lambda cookie: {
            k: v.replace('EQUALSSIGN', '=').replace('PIPESIGN', '|')
            for k, v in cookierx.findall(cookie)}

        def cookie_pusher(cookie, handler):
            """
            unpack a kbase cookie into a dict, and push it into the target
            handler's instance
            as a kbase_session attribute
            """
            sess = parse_cookie(cookie)
            if app_log.isEnabledFor(logging.DEBUG):
                app_log.debug("cookie_pusher: user_id={uid} token={tok}"
                    .format(uid=sess.get('token', 'none'),
                            tok=sess.get('token', 'none')))
            setattr(handler, 'kbase_session', sess)
            # also push the token into the environment hash so that
            # KBase python clients pick it up
            biokbase.auth.set_environ_token(sess.get('token', 'None'))
            kbase_env.session = sess.get('kbase_sessionid', '')
            return sess

        app_log.debug("Monkeypatching IPython.html.notebook.handlers."
                      "NamedNotebookHandler.get() in process {}".format(
                      os.getpid()))
        old_get = IPython.html.notebook.handlers.NamedNotebookHandler.get
        @monkeypatch_method(IPython.html.notebook.handlers.NamedNotebookHandler)
        def get(self, notebook_id):
            client_ip = self.request.remote_ip
            http_headers = self.request.headers
            ua = http_headers.get('User-Agent', 'unknown')
            app_log.info("Http-Headers={}".format(list(self.request.headers.get_all())))
            # save client ip in environ for later logging
            kbase_env.client_ip = client_ip
            app_log.debug("notebook_id = " + notebook_id)
            found_cookies = [self.cookies[c] for c in all_cookies
                             if c in self.cookies]
            if found_cookies:
                # Push the cookie
                cookie_val = urllib.unquote(found_cookies[0].value)
                app_log.debug("kbase cookie = {}".format(cookie_val))
                cookie_obj = cookie_pusher(cookie_val, getattr(self, 'notebook_manager'))
                # Log the event
                user = cookie_obj.get('user_id', '')
                session = cookie_obj.get('kbase_sessionid', '')
                kbase_env.narrative = notebook_id
                kbase_env.session = session
                kbase_env.client_ip = client_ip
                log_event(g_log, 'open', {'user': user, 'user_agent': ua})
            app_log.info("After get(): KB_NARRATIVE={}".format(os.environ.get('KB_NARRATIVE', 'none')))
            return old_get(self, notebook_id)

        app_log.debug("Monkeypatching IPython.html.services.notebooks.handlers.NotebookRootHandler.get() in process {}".format(os.getpid()))
        old_get1 = IPython.html.services.notebooks.handlers.NotebookRootHandler.get
        @monkeypatch_method(IPython.html.services.notebooks.handlers.NotebookRootHandler)
        def get(self):
            found_cookies = [self.cookies[c] for c in all_cookies
                             if c in self.cookies]
            if found_cookies:
                # Push the cookie
                cookie_val = urllib.unquote(found_cookies[0].value)
                cookie_pusher(cookie_val, getattr(self, 'notebook_manager'))
            return old_get1(self)

    app_log.debug("Monkeypatching IPython.html.base.handlers.RequestHandler.write_error() in process {}".format(os.getpid()))
    # Patch RequestHandler to deal with errors and render them in a half-decent
    # error page, templated to look (more or less) like the rest of the site.
    @monkeypatch_method(IPython.html.base.handlers.RequestHandler)
    def write_error(self, status_code, **kwargs):
        # some defaults
        error = 'Unknown error'
        traceback = 'Not available'
        request_info = 'Not available'

        import traceback

        if self.settings.get('debug') and 'exc_info' in kwargs:
            exc_info = kwargs['exc_info']
            trace_info = ''.join(["%s<br>" % line for line in traceback.format_exception(*exc_info)])
            request_info = ''.join(["<strong>%s</strong>: %s<br>" % (k, self.request.__dict__[k] ) for k in self.request.__dict__.keys()])

            error_list = exc_info[1]
            if error_list is not None:
                error_list = error_list.__str__().split('\n')
                error = '<h3>%s</h3>' % error_list[0]
                error += '<br>'.join(error_list[1:])
            self.set_header('Content-Type', 'text/html')

        self.write(self.render_template('error.html', error_status=error,
                                        traceback=trace_info,
                                        request_info=request_info))
