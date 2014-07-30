"""
Utility functions for dealing with KBase services, etc.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '1/6/14'

import json
import logging
import os
import re
import requests
from setuptools import Command
import time
from biokbase.workspaceService.Client import workspaceService as WS1
from biokbase.workspaceServiceDeluxe.Client import Workspace as WS2
from biokbase.workspaceServiceDeluxe.Client import ServerError, URLError
from biokbase.narrative.common import kblogging

# Init logging.
_log = logging.getLogger(__name__)


class AweTimeoutError(Exception):
    def __init__(self, jobid,  timeout):
        Exception.__init__(self, "AWE job ({}) timed out after {:d} seconds".format(jobid, timeout))


class AweJob(object):
    URL = None

    def __init__(self, meth=None, started="Starting method", running="Method"):
        """Create a new AweJob wrapper.

        :param meth: Python service method state (optional)
        :type meth: narrative.common.service.ServiceMethod
        :param started str: Name of method started event
        :param running str: Name of method, running, event
        """
        self._meth = meth
        self._sname, self._rname = started, running

    def run(self, jid, stage_fun=None, timeout=600):
        """Run synchronously, optionally invoking a callback at each completed stage, until
        all sub-jobs have completed.

        :param jid: AWE Job ID
        :param stage_fun: Stage callback function.
                          If present, invoked with the (jid, completed, total_jobs)
        :param timeout int: Timeout, in seconds
        :return int: Number of jobs run
        :raises: AweTimeoutError on timeout.
        """
        t0 = time.time()
        self._cb = stage_fun
        self._jid = jid
        njobs = self.job_count()
        self._started()
        completed = 0
        self._add_jobs(njobs)
        while completed < njobs:
            time.sleep(5)
            if time.time() - t0 > timeout:
                raise AweTimeoutError(self._jid, timeout)
            remaining = self.job_count()
            while completed < (njobs - remaining):
                completed += 1
                self._advance(completed, njobs)
        return njobs

    def _started(self):
        if self._meth:
            self._meth.advance(self._sname)

    def _add_jobs(self, n):
        if self._meth:
            self._meth.stages += n

    def _advance(self, completed, njobs):
        if self._meth:
            self._meth.advance("{}: {:d}/{:d} jobs completed".format(self._rname, completed, njobs))
        if self._cb:
            self._cb(self._jid, completed, njobs)

    def job_count(self):
        """Get count of jobs remaining in AWE.
        """
        headers = {"Authorization": "OAuth {}".format(self._meth.token)}
        url = self.URL + "/job/" + self._jid
        r = requests.get(url, headers=headers)
        response = json.loads(r.text)
        remain_tasks = response.get("data", dict()).get("remaintasks")
        return remain_tasks


class WorkspaceException(Exception):
    """More friendly workspace exception messages.
    """
    def __init__(self, command, params, err):
        fmt_params = ", ".join(["{nm}='{val}'".format(nm=k, val=params[k]) for k in sorted(params.keys())])
        oper = "{}({})".format(command, fmt_params)
        msg = "Workspace.{o}: {e}".format(o=oper, e=err)
        Exception.__init__(self, msg)


class Workspace(WS1):
    """Simple wrapper for KBase workspace-1 service.
    """
    def __init__(self, url=None, token=None, name=None):
        WS1.__init__(self, url=url, token=token)
        self._ws_name = name

    def get(self, objid, objtype, instance=None, as_json=True):
        # set common parameters
        params = {
            'id': objid,
            'type': objtype,
            'workspace': self._ws_name
        }
        # if instance isn't given, figure out most recent one
        # XXX: this is dumb -- better way to do this?!
        if instance is None:
            params['asHash'] = False
            try:
                result = self.object_history(params)
            except Exception as err:
                raise WorkspaceException("object_history", params, err)
            instance = len(result) - 1
        # get selected instance
        params.update({'asJSON': as_json, 'instance': instance})
        try:
            obj = self.get_object(params)
        except Exception as err:
            raise WorkspaceException("get_object", params, err)
        # return the object
        return obj


class Workspace2(WS2):
    """Simple wrapper for KBase workspace-2 service.
    """

    all_digits = re.compile('\d+')

    #: Encoding to use for output strings
    encoding = 'utf-8'

    def __init__(self, url=None, token=None, user_id=None, password=None, wsid=None,
                 create=False, **create_kw):
        """Constructor.

        :param url: URL of remote WS service
        :type url: str
        :param token: Authorization token, overrides 'user_id'/'password'
        :type token: str
        :param user_id: User ID for authentication (overridden by 'token')
        :type user_id: str
        :param user_id: Password for authentication (overridden by 'token')
        :type user_id: str
        :param wsid: Workspace ID or name
        :type wsid: str
        :param create_kw: Any extra keywords to create a new workspace
        :type create_kw: None or dict
        :raise: ValueError if workspace id is empty, KeyError if there is no workspace by that name,
                WorkspaceException if creation of the workspace fails.
        """
        WS2.__init__(self, url=url, user_id=user_id, password=password, token=token)
        self.has_wsid = False
        if wsid is not None:
            self._init_ws(wsid, create_kw)
            self.has_wsid = True

    def set_ws(self, wsid, create_kw):
        """Set workspace.

        :param wsid: Workspace ID or name
        :type wsid: str
        :param create_kw: Any extra keywords to create a new workspace
        :type create_kw: None or dict
        :return: None
        """
        self._init_ws(wsid, create_kw)
        self.has_wsid = True

    def _init_ws(self, wsid, create_kw):
        """Set up workspace.
        """
        if self.is_name(wsid):
            self._ws_name, self._ws_id = wsid, None
        else:
            self._ws_name, self._ws_id = None, wsid
        self._wsi = {'workspace': self._ws_name, 'id': self._ws_id}

        # No workspace; create it or error.
        if self._get_ws() is None:
            if create_kw is None:
                raise KeyError("No such workspace: '{}'".format(wsid))
            if not self.is_name(wsid):
                raise ValueError("Create new workspace: Workspace identifier cannot be an ID")
            create_kw['workspace'] = wsid
            self._create_ws(create_kw)

    def _get_ws(self):
        """Get existing workspace, or None
        """
        try:
            result = self.get_workspace_info(self._wsi)
        except (ServerError, URLError) as err:
            if "No workspace" in str(err):
                return None
            raise WorkspaceException("get_workspace_info", self._wsi, err)
        return result

    @property
    def workspace(self):
        return self._wsi

    def _create_ws(self, create_params):
        """Create new workspace, or raise WorkspaceException.
        """
        try:
            self.create_workspace(create_params)
        except (ServerError, URLError) as err:
            raise WorkspaceException("create_workspace", create_params, err)

    def is_name(self, id_):
        """Is this an object ID or name?

        :return: True for name, False for numeric ID
        :rtype: bool
        :raise: ValueError if it isn't a string, or it is length 0,
                or if it starts with a digit but has non-digits.
        """
        if not id_:
            raise ValueError("Empty value")
        try:
            # If it does not
            if not id_[0].isdigit():
                return True
        except (KeyError, ValueError) as err:
            raise ValueError("Cannot get first letter")
            # Make sure it is *all* digits
        if not self.all_digits.match(id_).span() == (0, len(id_)):
            raise ValueError("Starts with a digit, but not all digits")
        return False

    def get(self, objid, instance=None, data_only=True):
        """Get an object in the workspace.
        If there are multiple objects, the first one is returned.
        Returns just the object data, not all the associated info.

        :param objid: Object name or ID
        :type objid: str
        :param instance: Instance (version) identifier, None for 'latest'
        :type instance: str or None
        :param data_only: Return the values for the 'data' key (True) or the whole result dict (False)
        :type data_only: bool
        :return: whatever the JSON for the object data parsed to, probably a dict,
                 or None if there are no objects by that name or ID, or workspace is not set.
        :raise: WorkspaceException, if command fails
        """
        if not self.has_wsid:
            _log.error("No workspace set")
            return None
        params = self._make_oid_params(objid, ver=instance)
        try:
            for result in self.get_objects(params):
                return result['data'] if data_only else result
        except (URLError, ServerError) as err:
            if "No object with" in str(err):
                return None
            raise WorkspaceException("get_objects", {'object_ids': params}, err)

    def _make_oid_params(self, objid, ver=None):
        """Build params for an 'object_identity'.
        """
        # Set object ID/name.
        if self.is_name(objid):
            obj_id, obj_name = None, objid
        else:
            obj_id, obj_name = objid, None

        # Fill in and returnparameter values.
        #return {'object_ids':
        return [{
            # note, one of these will always be None
            'workspace': self._ws_name,
            'wsid': self._ws_id,
            'objid': obj_id,
            'name': obj_name,
            'ver': ver
        }]

    def types(self, module=None, strip_version=True, info_keys=None):
        """Get a list of all types in a given module, or all modules.

        :param module: Module (namespace) to operate in
        :type module: str or None
        :param strip_version: If True (the default), strip "-x.y" version off end of type name
        :type strip_version: bool
        :param info_keys: If None, return type name only. Otherwise return dict (see return type).
        :type info_keys: None or list of str
        :return: Type names, or details, depending on info_keys
        :rtype: If all modules dict keyed by module name, with a list of strings (type names) for each,
                or if info_keys is non-empty a dict {<type_name>:{ key:value..}} for each type.
                If just one module, then just a list of strings (type names).
        """
        modules = [module] if module else self.list_modules({})
        result = {}
        for m in modules:
            try:
                modinfo = self.get_module_info({'mod': m})
                if info_keys is None:
                    # get list of types, stripping redundant module prefix
                    types = [t[t.find('.') + 1:] for t in modinfo['types'].iterkeys()]
                    # optionally strip trailing version
                    if strip_version:
                        types = [t.split("-", 1)[0] for t in types]
                    # encode in UTF-8
                    types = [s.encode(self.encoding) for s in types]
                    # map to module in result
                else:
                    types = {}
                    for t, raw_meta in modinfo['types'].iteritems():
                        name = t[t.find('.') + 1:]
                        if strip_version:
                            name = name.split("-", 1)[0]
                        meta = json.loads(raw_meta)
                        types[name] = {k: meta[k] for k in info_keys}
                result[m.encode(self.encoding)] = types
            except ServerError as err:
                if "Module wasn't uploaded" in str(err):
                    _log.warn("list_types: module '{}' not uploaded".format(m))
                else:
                    _log.error("list_types: server.error={}".format(err))
                continue
        return result.values()[0] if module else result

#     def set_project(self):
#         """Set the 'is a project' tag on this workspace.
#         """
#         try:
# f.get_object_info([{'wsid': ws_id,
#                                              'name': ws_tag['project']}],
#                                            0);
#         except biokbase.workspaceServiceDeluxe.Client.ServerError, e:
#             # If it is a not found error, create it, otherwise reraise
#             if e.message.find('not found'):
#                 obj_save_data = {'name': ws_tag['project'],
#                                  'type': ws_tag_type,
#                                  'data': {'description': 'Tag! You\'re a project!'},
#                                  'meta': {},
#                                  'provenance': [],
#                                  'hidden': 1}
#                 ws_meta = wsclient.save_objects({'id': ws_id,
#                                                  'objects': [obj_save_data]});
#             else:
#                 raise e
#         return True
#
# def get_user_id(wsclient):
#     """
#     Grab the userid from the token in the wsclient object
#     This is a pretty brittle way to do things, and will need to be changed eventually
#     """
#     try:
#         token = wsclient._headers.get('AUTHORIZATION', None)
#         match = user_id_regex.match(token)
#         if match:
#             return match.group(1)
#         else:
#             return None
#     except Exception, e:
#         raise e
#
# def check_homews(wsclient, user_id=None):
#     """
#     Helper routine to make sure that the user's home workspace is built. Putting it here
#     so that when/if it changes we only have a single place to change things.
#     Takes a wsclient, and if it is authenticated, extracts the user_id from the token
#     and will check for the existence of the home workspace and
#     create it if necessary. Will pass along any exceptions. Will also make sure that
#     it is tagged with a workspace_meta object named "_project"
#     returns the workspace name and workspace id as a tuple
#
#     Note that parsing the token from the wsclient object is brittle and should be changed!
#     """
#     if user_id is None:
#         user_id = get_user_id(wsclient)
#     try:
#         homews = "%s:home" % user_id
#         workspace_identity = {'workspace': homews}
#         ws_meta = wsclient.get_workspace_info(workspace_identity)
#     except biokbase.workspaceServiceDeluxe.Client.ServerError, e:
#         # If it is a not found error, create it, otherwise reraise
#         if e.message.find('not found'):
#             ws_meta = wsclient.create_workspace({'workspace': homews,
#                                                  'globalread': 'n',
#                                                  'description': 'User home workspace'})
#         else:
#             raise e
#     if ws_meta:
#         check_project_tag(wsclient, ws_meta[0])
#         # return the textual name and the numeric ws_id
#         return ws_meta[1], ws_meta[0]
#     else:
#         raise Exception('Unable to find or create home workspace: %s' % homews)


class BuildDocumentation(Command):
    """Setuptools command hook to build Sphinx docs
    """
    description = "build Sphinx documentation"
    user_options = []

    def initialize_options(self):
        self.doc_dir = "biokbase-doc"

    def finalize_options(self):
        pass

    def run(self):
        filedir = os.path.dirname(os.path.realpath(__file__))
        p = filedir.find("/biokbase/")
        top = filedir[:p + 1]
        doc = top + self.doc_dir
        os.chdir(doc)
        os.system("make html")
