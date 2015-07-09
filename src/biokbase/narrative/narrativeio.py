"""
Utilities for doing IO operations on Narrative objects.
Implements the KBaseWSManagerMixin class.
"""

import biokbase.auth
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
import re
import json

# The list_workspace_objects method has been deprecated, the
# list_objects method is the current primary method for fetching
# objects, and has a different field list
list_objects_fields = ['objid', 'name', 'type', 'save_date', 'ver', 'saved_by',
                       'wsid', 'workspace', 'chsum', 'size', 'meta']
obj_field = dict(zip(list_objects_fields,range(len(list_objects_fields))))

obj_ref_regex = re.compile('^(?P<wsid>\d+)\/(?P<objid>\d+)(\/(?P<ver>\d+))?$')

class PermissionsError(WorkspaceClient.ServerError):
    """Raised if user does not have permission to
    access the workspace.
    """
    @staticmethod
    def is_permissions_error(err):
        """Try to guess if the error string is a permission-denied error
        for the narrative (i.e. the workspace the narrative is in).
        """
        pat = re.compile("\s*[Uu]sers?\s*(\w+)?\s*may not \w+ workspace.*")
        return pat.search(err) is not None

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

        try:
            v = self.ws_client().ver()
        except Exception as e:
            raise HTTPError(500, 'Unable to connect to workspace service at {}: {}'.format(self.ws_uri, e))

    def ws_client(self):
        return WorkspaceClient.Workspace(self.ws_uri)

    def _test_obj_ref(self, obj_ref):
        m = obj_ref_regex.match(obj_ref)
        if m is None:
            raise ValueError('Narrative object references must be of the format wsid/objid/ver')        

    def _ws_err_to_perm_err(self, err):
        if PermissionsError.is_permissions_error(err.message):
            return PermissionsError(name=err.name, code=err.code,
                                   message=err.message, data=err.data)
        else:
            return err

    def _ws_id_to_name(self, wsid):
        try:
            ws_info = self.ws_client().get_workspace_info({'id': wsid})
            return ws_info[1]
        except WorkspaceClient.ServerError, err:
            raise self._ws_err_to_perm_err(err)

    def narrative_exists(self, obj_ref):
        """
        Test if a narrative exists.
        If we can fetch the narrative info (e.g. the get_object_info from the 
            workspace), then it exists.
        """
        try:
            return self.read_narrative(obj_ref, content=False, include_metadata=False) is not None
        except PermissionsError:
            raise
        except WorkspaceClient.ServerError, err:
            return False

    def read_narrative(self, obj_ref, content=True, include_metadata=True):
        """
        Fetches a Narrative and its object info from the Workspace
        If content is False, this only returns the Narrative's info 
        and metadata, otherwise, it returns the whole workspace object.

        This is mainly a wrapper around Workspace.get_objects(), except that
        it always returns a dict. If content is False, it returns a dict
        containing a single key: 'info', with the object info and, optionally,
        metadata.

        obj_ref: expected to be in the format "wsid/objid", e.g. "4337/1"
        or even "4337/1/1" to include version.
        """

        self._test_obj_ref(obj_ref)
        try:
            if content:
                nar_data = self.ws_client().get_objects([{'ref':obj_ref}])
                print "READ_NARRATIVE: {}".format(nar_data[0])
                if nar_data:
                    return nar_data[0]
            else:
                nar_data = self.ws_client().get_object_info_new({
                    'objects':[{'ref':obj_ref}],
                    'includeMetadata': 1 if include_metadata else 0
                })
                if nar_data:
                    return {'info': nar_data[0]}
        except WorkspaceClient.ServerError, err:
            raise self._ws_err_to_perm_err(err)

    def write_narrative(self, ws_id, obj_id, nb, cur_user):
        """
        Given a notebook, break this down into a couple parts:
        1. Figure out what ws and obj to save to
        2. Build metadata object
        3. Save the narrative object (write_narrative)
        4. Return any notebook changes.
        """
        # make sure the metadata's up to date.
        try:
            meta = nb['metadata']
            if 'name' not in meta:
                meta['name'] = 'Untitled'
            if 'ws_name' not in meta:
                meta['ws_name'] = os.environ.get('KB_WORKSPACE_ID', self._ws_id_to_name(ws_id))
            if 'creator' not in meta:
                meta['creator'] = cur_user
            if 'type' not in meta:
                meta['type'] = self.nar_type
            if 'description' not in meta:
                meta['description'] = ''
            if 'data_dependencies' not in meta:
                meta['data_dependencies'] = list()
            if 'job_ids' not in meta:
                meta['job_ids'] = {'methods' : [], 'apps' : [], 'job_usage': {'queue_time': 0, 'run_time': 0}}
            if 'methods' not in meta['job_ids']:
                meta['job_ids']['methods'] = list()
            if 'apps' not in meta['job_ids']:
                meta['job_ids']['apps'] = list()
            if 'job_usage' not in meta['job_ids']:
                meta['job_ids']['job_usage'] = {'queue_time': 0, 'run_time': 0}
            meta['format'] = u'ipynb'

            nb['metadata'] = meta
        except PermissionsError as e:
            raise
        except Exception as e:
            raise HTTPError(400, u'Unexpected error setting Narrative attributes: %s' %e)

        # With that set, update the workspace metadata with the new info.
        try:
            updated_metadata = {
                'is_temporary': 'false',
                'narrative_nice_name': nb['metadata']['name']
            }
            self.ws_client().alter_workspace_metadata({'wsi': {'id': ws_id}, 'new':updated_metadata})
        except Exception as e:
            raise HTTPError(500, u'Error adjusting Narrative metadata: %s, %s' % (e.__str__(), ws_id))

        # Now we can save the Narrative object.
        try:
            ws_save_obj = {
                'type': self.nar_type,
                'data': nb,
                'objid': obj_id,
                'meta': nb['metadata'].copy(),
                'provenance': [{
                    'service': u'narrative',
                    'description': u'Saved by KBase Narrative Interface',
                    'service_ver': unicode(biokbase.narrative.version())
                }]
            }
            # no non-strings allowed in metadata!
            ws_save_obj['meta']['data_dependencies'] = json.dumps(ws_save_obj['meta']['data_dependencies'])
            ws_save_obj['meta']['methods'] = json.dumps(self._extract_cell_info(nb))

            # Sort out job info we want to keep
            # Gonna look like this, so init it that way
            nb_job_usage = nb['metadata']['job_ids'].get('job_usage', {'queue_time':0, 'run_time':0})
            job_info = {
                'queue_time': nb_job_usage.get('queue_time', 0),
                'run_time': nb_job_usage.get('run_time', 0),
                'running': 0,
                'completed': 0,
                'error': 0
            }
            for job in nb['metadata']['job_ids']['methods'] + nb['metadata']['job_ids']['apps']:
                status = job.get('status', 'running')
                if status.startswith('complete'):
                    job_info['completed'] += 1
                elif 'error' in status:
                    job_info['error'] += 1
                else:
                    job_info['running'] += 1
            ws_save_obj['meta']['job_info'] = json.dumps(job_info)
            if 'job_ids' in ws_save_obj['meta']:
                ws_save_obj['meta'].pop('job_ids')

            # clear out anything from metadata that doesn't have a string value
            # This flushes things from IPython that we don't need as KBase object metadata
            ws_save_obj['meta'] = {key: value for key, value in ws_save_obj['meta'].items() if isinstance(value, str) or isinstance(value, unicode)}
            # for key in ws_save_obj['meta']:
            #     if not isinstance(ws_save_obj['meta'][key], str) and not isinstance(ws_save_obj['meta'][key], unicode):
            #         ws_save_obj['meta'].pop(key)

            print ws_save_obj
            # Actually do the save now!
            self.log.debug("calling Workspace.save_objects")
            obj_info = self.ws_client().save_objects({'id': ws_id,
                                                      'objects': [ws_save_obj]})
            self.log.debug("save_object returned object ref: {}/{}".format(obj_info[6], obj_info[0]))

            # tweak the workspace's metadata to properly present its narrative
            self.ws_client().alter_workspace_metadata({'wsi': {'id': ws_id}, 'new':{'narrative':obj_info[0][0]}})
            return (nb, obj_info[6], obj_info[0])

        except WorkspaceClient.ServerError, err:
            raise self._ws_err_to_perm_err(err)

        except Exception as e:
            raise HTTPError(500, u'%s saving Narrative: %s' % (type(e),e))

    def _extract_cell_info(self, nb):
        """
        This is an internal method that returns, as a dict, how many kb-method,
        kb-app, and IPython cells exist in the notebook object.

        For app and method cells, it counts them based on their method/app ids

        In the end, it returns a dict like this:
        {
            'method': {
                'my_method' : 2,
                'your_method' : 1
            },
            'app': {
                'my app' : 3
            },
            'ipython': {
                'code' : 5,
                'markdown' : 6
            }
        }
        """
        cell_types = {'method' : {},
                      'app' : {},
                      'output': 0,
                      'ipython' : {'markdown': 0, 'code': 0}}
        for cell in nb.get('cells'):
            meta = cell['metadata']
            if 'kb-cell' in meta:
                t = None
                # It's a KBase cell! So, either an app or method.
                if 'type' in meta['kb-cell'] and meta['kb-cell']['type'] == 'function_output':
                    cell_types['output'] = cell_types['output'] + 1
                else:
                    if 'app' in meta['kb-cell']:
                        t = 'app'
                    elif 'method' in meta['kb-cell']:
                        t = 'method'
                    else:
                        # that should cover our cases
                        continue
                    if t is not None:
                        try:
                            count = 1
                            app_id = meta['kb-cell'][t]['info']['id']
                            if app_id in cell_types[t]:
                                count = cell_types[t][app_id] + 1
                            cell_types[t][app_id] = count
                        except KeyError:
                            continue
            else:
                t = cell['cell_type']
                cell_types['ipython'][t] = cell_types['ipython'][t] + 1
        return cell_types

    def rename_narrative(self, obj_ref, new_name, content=True):
        try:
            nar = self.read_narrative(obj_ref)
            # do stuff to set the new name
            renamed_nar = {}
            self.write_narrative(renamed_nar)
        except WorkspaceClient.ServerError, err:
            raise self._ws_err_to_perm_err(err)

    def copy_narrative(self, obj_ref, content=True):
        pass

    def list_narratives(self, ws_id=None):
        # self.log.debug("Listing Narratives")
        # self.log.debug("kbase_session = %s" % str(self.kbase_session))
        """
        By default, this searches for Narrative types in any workspace that the
        current token has read access to. Works anonymously as well.

        If the ws_id field is not None, it will only look up Narratives in that
        particular workspace (by its numerical id).

        Returns a list of dictionaries of object descriptions, one for each Narrative.
        The keys in each dictionary are those from the list_objects_fields list above.

        This is just a wrapper around the Workspace list_objects command.

        Raises: PermissionsError, if access is denied; ValueError is ws_id is not 
        numeric.
        """
        list_obj_params = {'type': self.nar_type,
                           'includeMetadata': 1}
        if ws_id:
            try:
                int(ws_id)
                list_obj_params['ids'] = [ws_id]
            except ValueError:
                raise

        try:
            res = self.ws_client().list_objects(list_obj_params)
        except WorkspaceClient.ServerError, err:
            raise self._ws_err_to_perm_err(err)
        my_narratives = [dict(zip(list_objects_fields, obj)) for obj in res]
        return my_narratives

    def narrative_permissions(self, obj_ref, user=None):
        """
        Returns permissions to a Narrative.
        This is returned as a dict, where each key is a user.
        '*' is a special key, meaning public.
        This is a wrapper around Workspace.get_permissions.

        If user is not None, then only the user's key is returned.
        If that key isn't present, then the user doesn't have access, and
        'n' is returned for that key's value.

        If nobody is logged in, this throws a WorkspaceClient.ServerError.
        """
        m = obj_ref_regex.match(obj_ref)
        if m is None:
            raise ValueError('Narrative object references must be of the format wsid/objid/ver')
        ws_id = m.group('wsid')
        perms = {}
        try:
            perms = self.ws_client().get_permissions({'id': ws_id})
        except WorkspaceClient.ServerError, err:
            raise self._ws_err_to_perm_err(err)
        if user is not None:
            if perms.has_key(user):
                perms = {user: perms[user]}
            else:
                perms = {user: 'n'}
        return perms

    def narrative_writable(self, obj_ref, user):
        """
        Returns True if the user can write to the narrative, False otherwise.
        Throws a WorkspaceClient.ServerError if not logged in, or 
        if the narrative doesn't exist.
        """
        if user is None:
            raise ValueError('A user must be given for testing whether a Narrative can be written')
        perms = self.narrative_permissions(obj_ref, user)
        if perms.has_key(user):
            return perms[user] == 'w' or perms[user] == 'a'
        else:
            return False