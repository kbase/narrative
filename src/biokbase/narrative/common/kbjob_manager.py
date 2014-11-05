"""
Manage registering jobs.

This is a thin wrapper around some parts of the User and Job State service. When
it registers jobs *within the Narrative* it also shares them with the account
narrativejoblistener.

This is a cheesy way to share jobs so that all users can see what long-running
jobs are going.

Consider this a pass at alleviating some of our current August 2014 panic-mode.
"""
__author__ = ["William Riehl <wjriehl@lbl.gov>"]
__version__ = "0.0.1"

import os
from biokbase.userandjobstate.client import UserAndJobState
from biokbase.narrativejobproxy.client import NarrativeJobProxy
from biokbase.narrative.common.url_config import URLS
import biokbase.auth
from biokbase.narrative.common.generic_service_calls import _app_get_state

class KBjobManager():

    def __init__(self):
        self.ujs = None
        self.ujs_proxy = None
        self.nar_user = 'narrativejoblistener'

    def __ujs_client(self, token=None):
        if self.ujs is None:
            token = os.environ['KB_AUTH_TOKEN']
            self.ujs = UserAndJobState(url=URLS.user_and_job_state, token=token)

        return self.ujs

    def __proxy_client(self, token=None):
        if self.ujs_proxy is None:
            token = os.environ['KB_AUTH_TOKEN']
            self.ujs_proxy = NarrativeJobProxy(url=URLS.narrative_job_proxy, token=token)

        return self.ujs_proxy

    def register_job(self, job_id):
        """This really just shares an existing job with narrativejoblistener.
        Propagates its exception if unsuccessful
        """
        ujs = self.__ujs_client()
        ujs.share_job(job_id, [self.nar_user])

    def unregister_job(self, job_id):
        """Removes sharing privilege from narrativejoblistener
        """
        ujs = self.__ujs_client()
        ujs.unshare_job(job_id, [self.nar_user])

    def get_results(self, job_id):
        """Gets the results of a job.
        """
        ujs = self.__ujs_client()
        res = ujs.get_results(job_id)
        return res

    def poll_job(self, job_id, ujs_proxy=None):
        """
        Polls a single job id on behalf of the narrativejoblistener account
        Will raise biokbase.user_and_job_state.ServerError if a job doesn't exist.
        """
        # if self.ujs is None:
        #     t = self.get_njl_token()
        #     if t is None:
        #         return 'No Token!' # should probably throw exception

        #     self.ujs = UserAndJobState(url=URLS.user_and_job_state, token=t.token)

        # return self.ujs.get_job_info(job_id)
        if ujs_proxy is None:
            ujs_proxy = self.__proxy_client()

        return ujs_proxy.get_job_info(job_id)

    def poll_jobs(self, meth_jobs, app_jobs, as_json=False):
        """
        Polls a list of job ids on behalf of the narrativejoblistener
        account and returns the results
        """
        meth_state_list = list()
        ujs_proxy = self.__proxy_client()

        for job_id in meth_jobs:
            try:
                meth_state_list.append(self.poll_job(job_id, ujs_proxy))
            except Exception:
                raise
                # info_list.append([job_id, 
                #                   u'error', 
                #                   u'error', 
                #                   u'0000-00-00T00:00:00+0000', 
                #                   u'error', 
                #                   u'0000-00-00T00:00:00+0000', 
                #                   None, 
                #                   None, 
                #                   u'error',
                #                   u'0000-00-00T00:00:00+0000',
                #                   0,
                #                   0,
                #                   u'error',
                #                   None])

        app_state_list = list()
        # for app_info in app_jobs:
        #     try:
        #         app_state_list.append(self.get_app_state(app_info[1], app_info[2], app_info[3], app_info[0]))
        #     except Exception:
        #         raise

        jobs_info = {'methods' : meth_state_list, 'apps' : app_state_list}

        if as_json:
            import json
            jobs_info = json.dumps(jobs_info)
        return jobs_info

    def get_app_state(self, app_spec_json, method_specs_json, param_values_json, app_job_id):
        """
        Prepare app state returned by NJS (use map {step_id -> widget_data} stored in widget_outputs field of resulting app state).
        """
        token = os.environ['KB_AUTH_TOKEN']
        workspace = os.environ['KB_WORKSPACE_ID']
        return _app_get_state(workspace, token, URLS, app_spec_json, method_specs_json, param_values_json, app_job_id)