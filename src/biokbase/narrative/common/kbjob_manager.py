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
import json
from biokbase.userandjobstate.client import UserAndJobState
from biokbase.narrativejobproxy.client import NarrativeJobProxy
from biokbase.narrative.common.url_config import URLS
import biokbase.auth
from biokbase.narrative.common.generic_service_calls import _app_get_state
from biokbase.narrative.common.generic_service_calls import _method_get_state

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

    def poll_ujs_job(self, job_id, ujs_proxy=None):
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

    def poll_jobs(self, jobs, as_json=False):
        """
        Polls a list of job ids on behalf of the narrativejoblistener
        account and returns the results
        """
        job_states = list()
        ujs_proxy = self.__proxy_client()

        for job in jobs:
            # Expect job to be a list.
            # The first element is the id of the job
            job_id = job.pop(0)

            if job_id.startswith('method:'):
                try:
                    job_states.append(self.get_method_state(job, job_id))
                except Exception as e:
                    import traceback
                    job_states.append({'job_id' : job_id, 'job_state' : 'error', 'error' : e.__str__(), 'traceback' : traceback.format_exc()})
            elif job_id.startswith('njs:'):
                try:
                    job_states.append(self.get_app_state(job, job_id))
                except Exception as e:
                    import traceback
                    job_states.append({'job_id' : job_id, 'job_state' : 'error', 'error' : e.__str__(), 'traceback' : traceback.format_exc()})
            else:
                try:
                    # 0  job_id job,
                    # 1  service_name service,
                    # 2  job_stage stage,
                    # 3  timestamp started,
                    # 4  job_status status,
                    # 5  timestamp last_update,
                    # 6  total_progress prog,
                    # 7  max_progress max,
                    # 8  progress_type ptype,
                    # 9  timestamp est_complete,
                    # 10 boolean complete,
                    # 11 boolean error,
                    # 12 job_description desc,
                    # 13 Results res
                    ujs_job = self.poll_ujs_job(job_id, ujs_proxy)
                    method_info = job
                    job = { 'job_id' : job_id, 
                            'job_state' : ujs_job[4], 
                            'running_step_id' : '', 
                            'step_errors': {}, 
                            'step_outputs': {}, 
                            'widget_outputs': ujs_job[13], 
                            'ujs_info' : ujs_job }
                    if ujs_job[11] == 1:
                        job['job_state'] = 'error'
                        job['error'] = ujs_job[4]
                    elif ujs_job[10] == 1:
                        job['widget_outputs'] = self.get_method_state(method_info, job_id)
                    job_states.append(job)
                except Exception as e:
                    import traceback
                    job_states.append({'job_id' : job_id, 'job_state' : 'error', 'error' : e.__str__(), 'traceback' : traceback.format_exc()})
        if as_json:
            import json
            job_states = json.dumps(job_states)
        return job_states

    def get_app_state(self, app_info, app_job_id):
        """
        Prepare app state returned by NJS (use map {step_id -> widget_data} stored in widget_outputs field of resulting app state).
        """
        token = os.environ['KB_AUTH_TOKEN']
        workspace = os.environ['KB_WORKSPACE_ID']
        return _app_get_state(workspace, token, URLS, self, app_info[0], app_info[1], app_info[2], app_job_id)

    def get_method_state(self, method_info, method_job_id):
        """
        Prepare method state returned by NJS (use widget_output field of resulting state for visualization).
        Parameter param_values_json is an array of values returned by kbaseNarrativeMethodInput.getParameters() .
        """
        token = os.environ['KB_AUTH_TOKEN']
        workspace = os.environ['KB_WORKSPACE_ID']
        return _method_get_state(workspace, token, URLS, self, method_info[0], method_info[1], method_job_id)