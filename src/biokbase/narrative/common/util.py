"""
Utility functions for dealing with KBase services, etc.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '1/6/14'

import json
import os
import re
import requests
from setuptools import Command
import time
from biokbase.workspace.client import Workspace as WS2
from biokbase.workspace.client import ServerError, URLError

def kbase_debug_mode():
    return bool(os.environ.get('KBASE_DEBUG', None))

class _KBaseEnv(object):
    """Single place to get/set KBase environment variables.

    Also act as a dict for LogAdapter's "extra" arg.

    Use global variable `kbase_env` instead of this class.
    """
    # Environment variables.
    # Each is associated with an attribute that is the
    # same as the variable name without the 'env_' prefix.
    env_auth_token = "KB_AUTH_TOKEN"
    env_narrative  = "KB_NARRATIVE"
    env_session    = "KB_SESSION"
    env_client_ip  = "KB_CLIENT_IP"
    env_user       = None

    _defaults = {'auth_token': 'none',
                 'narrative': 'none',
                 'session': 'none',
                 'client_ip': '0.0.0.0',
                 'user': 'anonymous'}

    def __getattr__(self, name):
        ename = "env_" + name
        if ename in _KBaseEnv.__dict__:
            if ename == 'env_user':
                return self._user()
            else:
                return os.environ.get(getattr(self.__class__, ename),
                                      self._defaults[name])
        else:
            raise KeyError("kbase_env:{}".format(name))

    def __setattr__(self, name, value):
        ename = "env_" + name
        if ename in _KBaseEnv.__dict__:
            if ename != 'env_user':
                os.environ[getattr(self.__class__, ename)] = value

    # Dict emulation

    def __iter__(self):
        return self.iterkeys()

    def __getitem__(self, name):
        return getattr(self, name)

    def __contains__(self, name):
        return name in self._defaults

    def keys(self):
        return self._defaults.keys()

    def iterkeys(self):
        return self._defaults.iterkeys()

    def __str__(self):
        return ', '.join(['{}: {}'.format(k, self[k])
                          for k in self.keys()])

    def _user(self):
        token = self.auth_token
        if not token:
            return self._defaults['user']
        m = re.search('un=([^|]+)', token)
        return m.group(1) if m else self._defaults['user']


# Get/set KBase environment variables by getting/setting
# attributes of this object.
kbase_env = _KBaseEnv()

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

    def run(self, jid, stage_fun=None, timeout=3600):
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
            #_log.error("No workspace set")
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
                    pass
                    #_log.warn("list_types: module '{}' not uploaded".format(m))
                else:
                    #_log.error("list_types: server.error={}".format(err))
                    pass
                continue
        return result.values()[0] if module else result


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

## Key=value pair parser

KVP_EXPR = re.compile(r"""
    (?:
        \s*                        # leading whitespace
        ([0-9a-zA-Z_.\-]+)         # Name
        =
        (?:                        # Value:
          ([^"\s]+) |              # - simple value
          "((?:[^"] | (?<=\\)")*)" # - quoted string
        )
        \s*
    ) |
    ([^= ]+)                        # Text w/o key=value
    """, flags=re.X)

def parse_kvp(msg, record, text_sep=' '):
    """
    Parse key-value pairs, adding to record in-place.

    :param msg: Input string
    :param record: In/out dict
    :param text_sep: Separator for output text pieces
    :return: All non-KVP as a string, joined by `text_sep`
    """
    text = []
    for n, v, vq, txt in KVP_EXPR.findall(msg):
        if n:
            if vq:
                v = vq.replace('\\"', '"')
            # add this KVP to output dict
            record[n] = v
        else:
            text.append(txt)
    return text_sep.join(text)