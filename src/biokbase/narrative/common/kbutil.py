"""
Utility functions for dealing with KBase services, etc.
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '1/6/14'

import json
import requests
import time


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

    def run(self, jid, stage_fun=None):
        """Run synchronously, optionally invoking a callback at each completed stage.

        :param jid: AWE Job ID
        :param stage_fun: Stage callback function.
                          If present, invoked with the (jid, completed, total_jobs)
        :return int: Number of jobs run
        """
        self._cb = stage_fun
        self._jid = jid
        njobs = self.job_count()
        self._started()
        completed = 0
        self._add_jobs(njobs)
        while completed < njobs:
            time.sleep(5)
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
