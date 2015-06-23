"""
Utilities for doing IO operations on Narrative objects.
Implements the KBaseWSManagerMixin class.
"""

from biokbase.workspace.client import Workspace
from tornado.web import HTTPError
from IPython.html.utils import (
    to_api_path,
    to_os_path
)
from IPython import nbformat

class KBaseWSManagerMixin(object):
    """
    Manages the connection to the workspace for a user
    """
    def _read_narrative(self, obj_ref, ws_client):
        pass

    def _write_narrative(self, obj_ref, ws_client):
        pass

    def _rename_narrative(self, obj_ref, ws_client):
        pass

    def _copy_narrative(self, obj_ref, ws_client):
        pass