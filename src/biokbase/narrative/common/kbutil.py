"""
Utility functions for dealing with KBase services, etc.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '1/6/14'

import json
import requests
import time

#from biokbase.workspaceService.Client import workspaceService as WS
from biokbase.workspaceServiceDeluxe.Client import Workspace as WS


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
        url = self.URL + "/job/" + self._jid
        r = requests.get(url)
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


class Workspace(WS):
    """Simple wrapper for KBase workspace service.
    """
    def __init__(self, url=None, token=None, name=None):
        WS.__init__(self, url=url, token=token)
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
