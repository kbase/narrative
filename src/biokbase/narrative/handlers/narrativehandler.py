import os
from notebook.utils import (
    url_path_join, url_escape
)
from notebook.base.handlers import (
    IPythonHandler, FilesRedirectHandler
)
from tornado import web
from biokbase.narrative.common.kblogging import (
    get_logger, log_event
)
from biokbase.narrative.common.util import kbase_env
import urllib
import tornado.log
from traitlets.config import Application
from biokbase.auth import (
    get_user_info,
    init_session_env
)

HTTPError = web.HTTPError

app_log = tornado.log.app_log  # alias
if Application.initialized:
    app_log = Application.instance().log

g_log = get_logger("biokbase.narrative")
auth_cookie_name = "kbase_session"

def _init_session(request, cookies):
    client_ip = request.remote_ip
    http_headers = request.headers
    ua = http_headers.get('User-Agent', 'unknown')
    auth_cookie = cookies.get(auth_cookie_name)
    if auth_cookie is not None:
        token = urllib.unquote(auth_cookie.value)
    else:
        raise web.HTTPError(status_code=401,
                            log_message='No auth cookie, denying access',
                            reason='Authorization required for Narrative access')
    if token != kbase_env.auth_token:
        init_session_env(get_user_info(token), client_ip)
        log_event(g_log, 'session_start', {'user': kbase_env.user, 'user_agent': ua})


class NarrativeMainHandler(IPythonHandler):
    """
    The primary narrative path handler. Handles paths like: ws.###.obj.###
    """
    def get(self, path):
        _init_session(self.request, self.cookies)
        """
        get renders the notebook template if a name is given, or
        redirects to the '/files/' handler if the name is not given.
        """

        path = path.strip('/')
        cm = self.contents_manager

        # will raise 404 on not found
        try:
            model = cm.get(path, content=False)
        except web.HTTPError as e:
            log_event(g_log, 'loading_error', {'error': str(e)})
            if e.status_code == 403:
                self.write(self.render_template('403.html'))
                return
            else:
                self.write(self.render_template('generic_error.html', message=e.log_message))
                return
        if model.get('type') != 'notebook':
            # not a notebook, redirect to files
            return FilesRedirectHandler.redirect_to_files(self, path)
        path = url_escape(path)
        self.write(
            self.render_template(
                'notebook.html',
                notebook_path=path,
                notebook_name=path,
                kill_kernel=False,
                mathjax_url=self.mathjax_url
            )
        )

def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], r'(ws\.\d+\.obj\.\d+.*)')
    web_app.add_handlers(host_pattern, [(route_pattern, NarrativeMainHandler)])

    route_pattern = url_path_join(web_app.settings['base_url'], r'(ws\.\d+)$')
    web_app.add_handlers(host_pattern, [(route_pattern, NarrativeMainHandler)])

    route_pattern = url_path_join(web_app.settings['base_url'], r'(\d+)$')
    web_app.add_handlers(host_pattern, [(route_pattern, NarrativeMainHandler)])
