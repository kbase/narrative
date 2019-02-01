"""
Utilities for doing IO operations on Narrative objects.
Implements the KBaseWSManagerMixin class.
"""

import biokbase.auth
import biokbase.narrative.clients
import biokbase.narrative.common.service as service
from biokbase.narrative.common import util
import biokbase.workspace
from biokbase.workspace.baseclient import ServerError
from tornado.web import HTTPError
from notebook.utils import (
    to_api_path,
    to_os_path
)
from biokbase.narrative.common.exceptions import (
    WorkspaceError
)
from traitlets import (
    Unicode,
    Dict,
    Bool,
    List,
    TraitError
)
from biokbase.narrative.common.kblogging import (
    get_logger, log_event
)
import re
import json
from collections import Counter
from updater import update_narrative
from biokbase.narrative.common.narrative_ref import NarrativeRef


# The list_workspace_objects method has been deprecated, the
# list_objects method is the current primary method for fetching
# objects, and has a different field list
list_objects_fields = ['objid', 'name', 'type', 'save_date', 'ver', 'saved_by',
                       'wsid', 'workspace', 'chsum', 'size', 'meta']
obj_field = dict(zip(list_objects_fields,range(len(list_objects_fields))))

obj_ref_regex = re.compile('^(?P<wsid>\d+)\/(?P<objid>\d+)(\/(?P<ver>\d+))?$')

MAX_METADATA_STRING_BYTES = 900
MAX_METADATA_SIZE_BYTES = 16000
WORKSPACE_TIMEOUT = 30  # seconds
NARRATIVE_TYPE = "KBaseNarrative.Narrative"

g_log = get_logger("biokbase.narrative")


class KBaseWSManagerMixin(object):
    """
    Manages the connection to the workspace for a user
    """

    ws_uri = service.URLS.workspace
    nar_type = 'KBaseNarrative.Narrative'

    def __init__(self, *args, **kwargs):
        if not self.ws_uri:
            raise HTTPError(412, u'Missing KBase workspace service endpoint URI')
        self.test_connection()

    def test_connection(self):
        try:
            self.ws_client().ver()
        except ServerError as e:
            raise HTTPError(500, u'Unable to connect to workspace service at {}: {}'.format(self.ws_uri, e))

    def ws_client(self):
        return biokbase.narrative.clients.get('workspace')

    def _ws_id_to_name(self, wsid):
        try:
            ws_info = self.ws_client().get_workspace_info({'id': wsid})
            return ws_info[1]
        except ServerError as err:
            raise WorkspaceError(err, wsid)

    def narrative_exists(self, ref):
        """
        Test if a narrative exists.
        If we can fetch the narrative info (e.g. the get_object_info from the workspace), then it
        exists. If we can't, then it doesn't. If any non-404 looking error gets raised, then we
        don't know, and should just propagate the error on up.
        :param ref: a NarrativeRef object
        """
        try:
            return self.read_narrative(ref, content=False, include_metadata=False) is not None
        except WorkspaceError as err:
            if err.http_code == 404:
                return False
            else:
                raise

    def _validate_nar_type(self, t, ref):
        if not t.startswith(NARRATIVE_TYPE):
            err = "Expected a Narrative object"
            if ref is not None:
                err += " with reference {}".format(ref)
            err += ", got a {}".format(t)
            raise HTTPError(500, err)

    def read_narrative(self, ref, content=True, include_metadata=True):
        """
        Fetches a Narrative and its object info from the Workspace
        If content is False, this only returns the Narrative's info
        and metadata, otherwise, it returns the whole workspace object.

        This is mainly a wrapper around Workspace.get_objects2(), except that
        it always returns a dict. If content is False, it returns a dict
        containing a single key: 'info', with the object info and, optionally,
        metadata.

        :param ref: a NarrativeRef
        :param content: if True, returns the narrative document, otherwise just the metadata
        :param include_metadata: if True, includes the object metadata when returning
        """
        log_event(g_log, "reading narrative", {'ref': str(ref), 'content': content, 'include_meta': include_metadata})
        assert isinstance(ref, NarrativeRef), "read_narrative must use a NarrativeRef as input!"
        try:
            if content:
                nar_data = self.ws_client().get_objects2({'objects': [{'ref': str(ref)}]})
                nar = nar_data['data'][0]
                self._validate_nar_type(nar['info'][2], ref)
                nar['data'] = update_narrative(nar['data'])
                return nar
            else:
                log_event(g_log, 'read_narrative testing existence', {'ref': str(ref)})
                nar_data = self.ws_client().get_object_info3({
                    'objects': [{'ref': str(ref)}],
                    'includeMetadata': 1 if include_metadata else 0
                })
                nar_info = nar_data['infos'][0]
                self._validate_nar_type(nar_info[2], ref)
                return {'info': nar_info}
        except ServerError as err:
            raise WorkspaceError(err, ref.wsid)

    def write_narrative(self, ref, nb, cur_user):
        """
        :param ref: a NarrativeRef
        :param nb: a notebook model
        :cur_user: the current user id
        Given a notebook, break this down into a couple parts:
        1. Figure out what ws and obj to save to
        2. Build metadata object
        3. Save the narrative object (write_narrative)
        4. Return any notebook changes as a list-
           (narrative, ws_id, obj_id, ver)
        """

        assert isinstance(ref, NarrativeRef), "write_narrative must use a NarrativeRef as input!"
        if 'worksheets' in nb:
            # it's an old version. update it by replacing the 'worksheets' key with
            # the 'cells' subkey
            # the old version only uses the first 'worksheet', so if it's there,
            # copy it out
            if (isinstance(nb['worksheets'], list) and len(nb['worksheets']) > 0 and nb['worksheets'][0].has_key('cells')):
                nb['cells'] = nb['worksheets'][0]['cells']
            else:
                nb['cells'] = list()
            del(nb['worksheets'])
            nb['nbformat'] = 4

        ws_id = ref.wsid
        obj_id = ref.objid

        # make sure the metadata's up to date.
        try:
            meta = nb['metadata']
            if 'name' not in meta:
                meta[u'name'] = u'Untitled'
            if 'ws_name' not in meta:
                meta[u'ws_name'] = util.kbase_env.workspace or self._ws_id_to_name(ws_id)
            if 'creator' not in meta:
                meta[u'creator'] = cur_user
            if 'type' not in meta:
                meta[u'type'] = self.nar_type
            if 'description' not in meta:
                meta[u'description'] = ''
            if 'data_dependencies' not in meta:
                meta[u'data_dependencies'] = list()
            if 'job_ids' not in meta:
                meta[u'job_ids'] = {u'methods' : [], u'apps' : [], u'job_usage': {u'queue_time': 0, u'run_time': 0}}
            if 'methods' not in meta[u'job_ids']:
                meta[u'job_ids'][u'methods'] = list()
            if 'apps' not in meta[u'job_ids']:
                meta[u'job_ids'][u'apps'] = list()
            if 'job_usage' not in meta[u'job_ids']:
                meta[u'job_ids'][u'job_usage'] = {u'queue_time': 0, u'run_time': 0}
            meta[u'is_temporary'] = 'false'
            meta[u'format'] = u'ipynb'

            if len(meta[u'name']) > MAX_METADATA_STRING_BYTES - len(u'name'):
                meta[u'name'] = meta[u'name'][0:MAX_METADATA_STRING_BYTES - len(u'name')]

            nb[u'metadata'] = meta
        except Exception as e:
            raise HTTPError(400, u'Unexpected error setting Narrative attributes: %s' %e)

        # With that set, update the workspace metadata with the new info.
        try:
            updated_metadata = {
                u'is_temporary': u'false',
                u'narrative_nice_name': nb[u'metadata'][u'name']
            }
            self.ws_client().alter_workspace_metadata({u'wsi': {u'id': ws_id}, u'new':updated_metadata})
        except ServerError as err:
            raise WorkspaceError(err, ws_id, message="Error adjusting Narrative metadata", http_code=500)

        # Now we can save the Narrative object.
        try:
            ws_save_obj = {
                'type': self.nar_type,
                'data': nb,
                'objid': obj_id,
                'meta': nb[u'metadata'].copy(),
                'provenance': [{
                    'service': u'narrative',
                    'description': u'Saved by KBase Narrative Interface',
                    'service_ver': unicode(biokbase.narrative.version())
                }]
            }
            # no non-strings allowed in metadata!
            ws_save_obj['meta']['data_dependencies'] = json.dumps(ws_save_obj['meta']['data_dependencies'])

            # Sort out job info we want to keep
            # Gonna look like this, so init it that way
            nb_job_usage = nb['metadata']['job_ids'].get('job_usage', {u'queue_time':0, u'run_time':0})
            job_info = {
                u'queue_time': nb_job_usage.get('queue_time', 0),
                u'run_time': nb_job_usage.get('run_time', 0),
                u'running': 0,
                u'completed': 0,
                u'error': 0
            }
            for job in nb['metadata']['job_ids']['methods'] + nb['metadata']['job_ids']['apps']:
                status = job.get('status', u'running')
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
            ws_save_obj['meta'] = {key: value for key, value in ws_save_obj['meta'].items() if isinstance(value, basestring)}
            ws_save_obj['meta'] = self._process_cell_usage(nb, ws_save_obj['meta'])

            # Actually do the save now!
            obj_info = self.ws_client().save_objects({'id': ws_id,
                                                      'objects': [ws_save_obj]})[0]

            return (nb, obj_info[6], obj_info[0], obj_info[4])

        except ServerError as err:
            raise WorkspaceError(err, ws_id)
        except Exception as e:
            raise HTTPError(500, u'%s saving Narrative: %s' % (type(e),e))

    def _process_cell_usage(self, nb, metadata):
        """
        A shiny new version of _extract_cell_info that tallies up the methods
        and apps in a Narrative. The Workspace has two limits built into it,
        that the old way could easily violate:
        1. The total size of each key/value in the metadata must be less than
        900 bytes
        2. The total metadata size must be less than 16KB.

        This is intended to be the last step of the save process before pushing
        to the workspace. As such, it will do a few things.
        1. Go through all KBase cells and identify how many of each app and
        method is being used.
        2. Enforce limits on length of each key and value in the metadata
        3. Enforce the overall size of metadata by reducing the number of
        key/value pairs allowed (just among apps and methods - pre-existing
        keys are ignored.)
        """

        cells = []
        if 'cells' in nb: #ipynb v4+
            cells = nb['cells']
        elif 'worksheets' in nb: #ipynb v3
            cells = nb['worksheets'][0]['cells']

        method_info = Counter()
        app_info = Counter()

        num_methods = 0
        num_apps = 0

        cell_info = Counter()
        for cell in cells:
            meta = cell['metadata']
            if 'kb-cell' in meta:
                # It's a KBase cell! So either an app, method, or viewer
                if 'type' in meta['kb-cell'] and meta['kb-cell']['type'] == 'function_output':
                    cell_info['viewer'] += 1
                else:
                    if 'app' in meta['kb-cell']:
                        app_id = meta['kb-cell']['app']['info']['id']
                        app_hash = meta['kb-cell']['app']['info'].get('git_commit_hash', '')
                        app_info[u'app.' + app_id + '/' + app_hash] += 1
                        num_apps += 1
                    elif 'method' in meta['kb-cell']:
                        method_id = meta['kb-cell']['method']['info']['id']
                        method_hash = meta['kb-cell']['method']['info'].get('git_commit_hash', '')
                        method_info[u'method.' + method_id + '/' + method_hash] += 1
                        num_methods += 1
                    else:
                        # covers the cases we care about
                        continue
            elif 'kbase' in meta and 'type' in meta['kbase']:
                kbase_type = meta['kbase']['type']
                if kbase_type == 'app':
                    app = meta['kbase'].get('appCell', {}).get('app', {})
                    id = app.get('id', 'UnknownApp')
                    commit_hash = app.get('gitCommitHash', 'unknown')
                    method_info[u'method.' + id + '/' + commit_hash] += 1
                    num_methods += 1
                elif kbase_type == 'editor':
                    app = meta['kbase'].get('editorCell', {}).get('app', {})
                    id = app.get('id', 'UnknownApp')
                    commit_hash = app.get('gitCommitHash', 'unknown')
                    method_info[u'method.' + id + '/' + commit_hash] += 1
                    num_methods += 1
                elif kbase_type == 'view':
                    app = meta['kbase'].get('viewCell', {}).get('app', {})
                    id = app.get('id', 'UnknownApp')
                    commit_hash = app.get('gitCommitHash', 'unknown')
                    method_info[u'method.' + id + '/' + commit_hash] += 1
                    num_methods += 1
            else:
                cell_info['jupyter.' + cell.get('cell_type', 'code')] += 1

        # Now we have all cell types like this:
        #
        # app.id
        # method.id
        # jupyter.code
        # jupyter.markdown
        #
        # method and path names are limited by their file system, since they're methods. on extFS, Mac,
        # and many others that we care about (like those probably where the Catalog service lives), that's
        # 255 bytes. Don't even care.
        # But we do need the totals anyway, in case we blow over the max metadata size.

        # final pass - trim out methods and apps if cell_kvp_size > total allowable size
        kvp_size = lambda(x): sum([len(k) + len(unicode(x[k])) for k in x])

        metadata_size = kvp_size(metadata)
        method_size = kvp_size(method_info)
        app_size = kvp_size(app_info)
        cell_size = kvp_size(cell_info)

        total_size = metadata_size + cell_size + app_size + method_size
        if total_size > MAX_METADATA_SIZE_BYTES:
            meth_overflow_key = u'method.overflow'

            # if we can make it under the limit by removing all methods, then we can likely
            # do so by removing some. So pop them out one at a time, and keep track of the lengths chopped.
            # otherwise, remove them all.
            if total_size - method_size + len(meth_overflow_key) + len(unicode(num_methods)) < MAX_METADATA_SIZE_BYTES:
                # filter them.
                method_info = self._filter_app_methods(total_size, meth_overflow_key, method_info)
            else:
                method_info = Counter({meth_overflow_key : num_methods})
            total_size -= method_size
            method_size = kvp_size(method_info)
            total_size += method_size

        # test again, now focus on apps
        if total_size > MAX_METADATA_SIZE_BYTES:
            app_overflow_key = u'app.overflow'

            # same for apps now.
            if total_size - app_size + len(app_overflow_key) + len(unicode(num_apps)) < MAX_METADATA_SIZE_BYTES:
                app_info = self._filter_app_methods(total_size, app_overflow_key, app_info)
            else:
                app_info = Counter({app_overflow_key : num_apps})
            total_size -= app_size
            app_size = kvp_size(app_info)
            total_size += app_size

        # Now the total of everything must be under MAX_METADATA_SIZE_BYTES. Smoosh them together into the
        # proper metadata object.
        metadata.update(method_info)
        metadata.update(app_info)
        metadata.update(cell_info)

        return metadata

    def _filter_app_methods(self, total_len, overflow_key, filter_dict):
        overflow_count = 0
        overflow_key_size = len(overflow_key)
        while total_len + overflow_key_size + len(unicode(overflow_count)) > MAX_METADATA_SIZE_BYTES:
            key, val = filter_dict.popitem()
            overflow_count += val
            total_len = total_len - len(key) - len(unicode(val))
        filter_dict[overflow_key] = overflow_count
        return filter_dict

    def rename_narrative(self, ref, cur_user, new_name):
        """
        Renames a Narrative. Requires a ref (NarrativeRef)
        and the name to set for the Narrative. If the current name
        doesn't match the new name, nothing changes.

        There are no restrictions on this name, since it just
        goes into the object's metadata.

        Any Exceptions that get thrown should just be auto-raised.
        """
        nar = self.read_narrative(ref)['data']
        # do stuff to set the new name
        if nar['metadata']['name'] == new_name:
            return
        nar['metadata']['name'] = new_name
        self.write_narrative(ref, nar, cur_user)

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

        Raises: WorkspaceError, if access is denied; ValueError is ws_id is not
        numeric.
        """
        log_event(g_log, 'list_narratives start', {'ws_id': ws_id})
        list_obj_params = {'type': self.nar_type,
                           'includeMetadata': 1}
        if ws_id:
            try:
                int(ws_id)  # will throw an exception if ws_id isn't an int
                list_obj_params['ids'] = [ws_id]
            except ValueError:
                raise

        try:
            ws = self.ws_client()
            res = ws.list_objects(list_obj_params)
        except ServerError as err:
            raise WorkspaceError(err, ws_id)
        my_narratives = [dict(zip(list_objects_fields, obj)) for obj in res]
        for nar in my_narratives:
            # Look first for the name in the object metadata. if it's not there, use
            # the object's name. If THAT'S not there, use Untitled.
            # This gives support for some rather old narratives that don't
            # have their name stashed in the metadata.
            nar['name'] = nar['meta'].get('name', nar.get('name', 'Untitled'))

        return my_narratives

    def narrative_permissions(self, ref, user=None):
        """
        Returns permissions to a Narrative.
        This is returned as a dict, where each key is a user.
        '*' is a special key, meaning public.
        This is a wrapper around Workspace.get_permissions.

        If user is not None, then only the user's key is returned.
        If that key isn't present, then the user doesn't have access, and
        'n' is returned for that key's value.

        If nobody is logged in, this raises a WorkspaceError.
        """
        assert isinstance(ref, NarrativeRef), "narrative_permissions must use a NarrativeRef as input!"
        perms = {}
        try:
            perms = self.ws_client().get_permissions({'id': ref.wsid})
        except ServerError as err:
            raise WorkspaceError(err, ref.wsid)
        if user is not None:
            if perms.has_key(user):
                perms = {user: perms[user]}
            else:
                perms = {user: 'n'}
        return perms

    def narrative_writable(self, ref, user):
        """
        Returns True if the logged in user can know if the given user can write to this narrative.
        E.g. user A is logged in. If A can see user B's permissions, and user B can write to this
        narrative, True is returned.

        Another e.g. nobody is logged in, and cannot see any permissions. False is returned.

        This is intended to be a quick check for kbwsmanager to flag the narrative as writable for the
        currently logged in user. A logged in user can see their own permissions, always, if they exist
        on that narrative.

        Throws a WorkspaceClient.ServerError if not logged in, or
        if the narrative doesn't exist.
        :param ref: a NarrativeRef
        :param user: str - the user to check for permissions
        """
        if user is None:
            raise ValueError('A user must be given for testing whether a Narrative can be written')
        perms = self.narrative_permissions(ref, user)
        if perms.has_key(user):
            return perms[user] == 'w' or perms[user] == 'a'
        else:
            return False
