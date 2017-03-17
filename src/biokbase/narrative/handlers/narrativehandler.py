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


class NarrativeHandler(IPythonHandler):
    def get(self, path):
        """
        Inject the user's KBase cookie before trying to look up a file.
        One of our big use cases bypasses the typical Jupyter login mechanism.
        """
        client_ip = self.request.remote_ip
        http_headers = self.request.headers
        ua = http_headers.get('User-Agent', 'unknown')

        auth_cookie = self.cookies.get(auth_cookie_name, None)
        if auth_cookie:
            token = urllib.unquote(auth_cookie.value)
        else:
            raise web.HTTPError(status_code=401,
                                log_message='No auth cookie, denying access',
                                reason='Authorization required for Narrative access')

        if token != kbase_env.auth_token:
            init_session_env(get_user_info(token), client_ip)
            log_event(g_log, 'session_start', {'user': kbase_env.user, 'user_agent': ua})

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
            raise
            # if e.status_code == 404 and 'files' in path.split('/'):
            #     # 404, but '/files/' in URL, let FilesRedirect take care of it
            #     return FilesRedirectHandler.redirect_to_files(self, path)
            # else:
            #     raise
        if model['type'] != 'notebook':
            # not a notebook, redirect to files
            return FilesRedirectHandler.redirect_to_files(self, path)
        name = url_escape(path.rsplit('/', 1)[-1])
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
    web_app.add_handlers(host_pattern, [(route_pattern, NarrativeHandler)])
