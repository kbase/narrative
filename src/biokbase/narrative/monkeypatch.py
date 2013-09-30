"""
Module to monkeypatch the parts of the IPython core that we don't/won't rewrite

Yes, its nasty.
No, we wouldn't use these if there were an alternative

We use some code that GvR posted here as helpers:
https://mail.python.org/pipermail/python-dev/2008-January/076194.html

sychan@lbl.gov

"""

import os
import urllib
import re
import pprint
import IPython.html.notebook.handlers
import IPython.html.services.notebooks.handlers
import IPython

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

# This is all kind of gross, but we will end up re-doing it later. Tentatively planning on
# submitting class wrapper decorators for the IPython Tornado request handlers, will do
# it as a patch to the IPython core and then submit a PR
def do_patching( c ):
    if c.NotebookApp.get('kbase_auth',False):
        IPython.html.base.handlers.app_log.debug("Monkeypatching IPython.html.notebook.handlers.NamedNotebookHandler.get() in process {}".format(os.getpid()))

        cookierx = re.compile('([^ =|]+)=([^\|]*)')
        def parsecookie( cookie):
            """ Parser for Jim Thomason's login widget cookies """
            sess = { k : v.replace('EQUALSSIGN','=').replace('PIPESIGN','|')
                     for k,v in cookierx.findall(urllib.unquote(cookie)) }
            return sess

        def cookie_pusher(cookie, handler):
            """
            unpack a kbase cookie into a dict, and push it into the target handler's instance
            as a kbase_session attribute
            """
            cookierx = re.compile('([^ =|]+)=([^\|]*)')
            """ Parser for Jim Thomason's login widget cookies """
            sess = { k : v.replace('EQUALSSIGN','=').replace('PIPESIGN','|')
                     for k,v in cookierx.findall(urllib.unquote(cookie)) }
            IPython.html.base.handlers.app_log.debug("token = " + sess.get('token'))
            setattr(handler,'kbase_session', sess)

        def handler_route_replace(handlers,oldre,newre):
            """ Look for a regex in a tornado routing table and replace it with a new one"""
            if len(handlers) > 0:
                findre = re.escape(oldre)
                for i in range(0,len(handlers)):
                    (route,handler) = handlers[i]
                    route2 = re.sub(findre,newre,route)
                    if route2 != route:
                        handlers[i] = (route2,handler)


        old_get = IPython.html.notebook.handlers.NamedNotebookHandler.get

        def_handler = IPython.html.notebook.handlers.default_handlers
        print "IPython.html.notebook.handlers.default_handlers:\n", pprint.pformat(def_handler)
        handler_route_replace( def_handler, r'(?P<notebook_id>\w+-\w+-\w+-\w+-\w+)',r'(?P<notebook_id>\w+\.\w+)')
        print "new IPython.html.notebook.handlers.default_handlers:\n", pprint.pformat(def_handler)

        @monkeypatch_method(IPython.html.notebook.handlers.NamedNotebookHandler)
        def get(self,notebook_id):
            if 'kbase_session' in self.cookies and hasattr(self,'notebook_manager'):
                cookie_pusher(self.cookies['kbase_session'].value, getattr(self,'notebook_manager'))
            return old_get(self,notebook_id)

        def_handler = IPython.html.services.notebooks.handlers.default_handlers
        print "IPython.html.services.notebooks.handlers.default_handlers:\n", pprint.pformat(def_handler)
        handler_route_replace( def_handler, r'(?P<notebook_id>\w+-\w+-\w+-\w+-\w+)',r'(?P<notebook_id>\w+\.\w+)')
        print "new IPython.html.services.notebooks.handlers.default_handlers:\n", pprint.pformat(def_handler)

        IPython.html.base.handlers.app_log.debug("Monkeypatching IPython.html.services.notebooks.handlers.NotebookRootHandler.get() in process {}".format(os.getpid()))
        old_get1 = IPython.html.services.notebooks.handlers.NotebookRootHandler.get
        @monkeypatch_method(IPython.html.services.notebooks.handlers.NotebookRootHandler)
        def get(self):
            if 'kbase_session' in self.cookies:
                cookie_pusher( self.cookies['kbase_session'].value,getattr(self,'notebook_manager'))
            return old_get1(self)
