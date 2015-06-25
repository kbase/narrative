"""
Utilities for doing IO operations on Narrative objects.
Implements the KBaseWSManagerMixin class.
"""

import biokbase.narrative.common.service as service
import biokbase.workspace
from biokbase.workspace import client as WorkspaceClient
from tornado.web import HTTPError
from IPython.html.utils import (
    to_api_path,
    to_os_path
)
from IPython import nbformat
from IPython.utils.traitlets import (
    Unicode,
    Dict,
    Bool,
    List,
    TraitError
)

# The list_workspace_objects method has been deprecated, the
# list_objects method is the current primary method for fetching
# objects, and has a different field list
list_objects_fields = ['objid', 'name', 'type', 'save_date', 'ver', 'saved_by',
                       'wsid', 'workspace', 'chsum', 'size', 'meta']
obj_field = dict(zip(list_objects_fields,range(len(list_objects_fields))))

class PermissionsError(WorkspaceClient.ServerError):
    """Raised if user does not have permission to
    access the workspace.
    """
    @staticmethod
    def is_permissions_error(err):
        """Try to guess if the error string is a permission-denied error
        for the narrative (i.e. the workspace the narrative is in).
        """
        pat = re.compile("\s*[Uu]ser \w+ may not \w+ workspace.*")
        return pat.match(err) is not None

    def __init__(self, name=None, code=None, message=None, **kw):
        WorkspaceClient.ServerError.__init__(self, name, code, message, **kw)


class KBaseWSManagerMixin(object):
    """
    Manages the connection to the workspace for a user
    """

    ws_uri = service.URLS.workspace
    nar_type = 'KBaseNarrative.Narrative'

    def __init__(self, *args, **kwargs):
        if not self.ws_uri:
            raise HTTPError(412, 'Missing KBase workspace service endpoint URI')

        self.ws_client = WorkspaceClient.Workspace(self.ws_uri)
        try:
            v = self.ws_client.ver()
            print 'Workspace version: {}'.format(v)
        except Exception as e:
            raise HTTPError(500, 'Unable to connect to workspace service at {}: {}'.format(self.ws_uri, e))

    def _read_narrative(self, obj_ref):
        pass

    def _write_narrative(self, obj_ref):
        pass

    def _rename_narrative(self, obj_ref):
        pass

    def _copy_narrative(self, obj_ref):
        pass

    def _list_narratives(self):
        # self.log.debug("Listing Narratives")
        # self.log.debug("kbase_session = %s" % str(self.kbase_session))
        """
        Takes an initialized workspace client. Defaults to searching for
        Narrative types in any workspace that the token has at least read access to.

        If the ws field is specified then it will return the workspace metadata
        for only the workspace specified

        Returns a dictionary of object descriptions - the key is a workspace id of
        the form "ws.{workspace_id}.obj.{object_id}" and the values are dictionaries
        keyed on the list_ws_obj_field list above.

        Raises: PermissionsError, if access is denied
        """
        try:
            res = self.ws_client.list_objects({'type': self.nar_type,
                                               'includeMetadata': 1})
        except WorkspaceClient.ServerError, err:
            if PermissionsError.is_permissions_error(err.message):
                raise PermissionsError(name=err.name, code=err.code,
                                       message=err.message, data=err.data)
        my_narratives = [dict(zip(list_objects_fields, obj)) for obj in res]
        return my_narratives
#         for obj in res:
#             my_narratives['ws.{}.obj.{}'.format(obj[obj_field['wsid']], obj[obj_field['objid']])] = dict(zip(list_objects_fields, obj))

#         mapping = {
#             ws_id: "%s/%s" % (my_narratives[ws_id]['workspace'],my_narratives[ws_id]['meta'].get('name','undefined'))
#             for ws_id in my_narratives.keys()
#         }
#         data = [dict(narrative_id = it[0], name = it[1]) for it in mapping.items()]
#         data = []
#         print my_narratives
#         return my_narratives
# 'ws.2632.obj.10': {'wsid': 2632, 'ver': 2, 'name': u'ModelComparison', 'chsum': u'8205782b1e23ceae7cba506de76620f5', 'saved_by': u'chenry', 'save_date': u'2014-10-19T06:04:40+0000', 'meta': {u'description': u'', u'format': u'ipynb', u'creator': u'chenry', u'data_dependencies': u'["GenomeComparison.ProteomeComparison ", "KBaseFBA.FBAModel "]', u'ws_name': u'MicrobeApps', u'type': u'Narrative', u'name': u'ModelComparison'}, 'objid': 10, 'workspace': u'MicrobeApps', 'type': u'KBaseNarrative.Narrative-3.0', 'size': 4736}