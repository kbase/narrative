from notebook.utils import (
    url_path_join, url_escape
)
from notebook.base.handlers import (
    IPythonHandler, FilesRedirectHandler
)

import os
from tornado import web
HTTPError = web.HTTPError

class NarrativeHandler(IPythonHandler):
    def get(self, path):
        # self.finish('Hello, KBase! ' + path)
        """get renders the notebook template if a name is given, or 
        redirects to the '/files/' handler if the name is not given."""
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
        print(model)
        if model['type'] != 'notebook':
            # not a notebook, redirect to files
            return FilesRedirectHandler.redirect_to_files(self, path)
        name = url_escape(path.rsplit('/', 1)[-1])
        path = url_escape(path)
        self.write(self.render_template('notebook.html',
            notebook_path=path,
            notebook_name=path,
            kill_kernel=False,
            mathjax_url=self.mathjax_url,
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