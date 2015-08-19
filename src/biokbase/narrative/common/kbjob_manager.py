"""
Manage registering jobs.

This is a thin wrapper around some parts of the User and Job State service. When
it registers jobs *within the Narrative* it also shares them with the account
narrativejoblistener.

This is a cheesy way to share jobs so that all users can see what long-running
jobs are going.

Consider this a pass at alleviating some of our current August 2014 panic-mode.

UPDATED 1/28/2015
This manages where jobs get looked up, whether from the UJS or NJS or wherever
else they're running from. The 'poll_jobs' method routes the job to the service
it needs to be looked up from.
"""
__author__ = ["William Riehl <wjriehl@lbl.gov>", "Roman Sutormin <rsutormin@lbl.gov>"]
__version__ = "0.1.0"

import os
import json
import traceback
from biokbase.userandjobstate.client import UserAndJobState
from biokbase.narrativejobproxy.client import NarrativeJobProxy
from biokbase.NarrativeJobService.Client import NarrativeJobService
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
        job_states = dict()
        ujs_proxy = self.__proxy_client()

        for job in jobs:
            # Expect job to be a list.
            # The first element is the id of the job
            job_id = job.pop(0)

            if job_id.startswith('method:'):
                try:
                    job_states[job_id] = self.get_method_state(job, job_id)
                except Exception as e:
                    job_states[job_id] = self.prepare_job_error_state(job_id, e)
            elif job_id.startswith('njs:'):
                try:
                    job_states[job_id] = self.get_app_state(job, job_id)
                except Exception as e:
                    job_states[job_id] = self.prepare_job_error_state(job_id, e)
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
                            'job_state' : ujs_job[2],
                            'running_step_id' : '',
                            'step_errors': {},
                            'step_outputs': {},
                            'widget_outputs': ujs_job[13],
                            'ujs_info' : ujs_job }
                    if ujs_job[11] == 1:
                        job['job_state'] = 'error'
                        job['error'] = ujs_job[4]
                    elif ujs_job[10] == 1:
                        job['job_state'] = 'completed'
                        job['widget_outputs'] = self.get_method_state(method_info, job_id)
                    job_states[job_id] = job
                except Exception as e:
                    job_states[job_id] = self.prepare_job_error_state(job_id, e)
        if as_json:
            import json
            job_states = json.dumps(job_states)
        return job_states

    def prepare_job_error_state(self, job_id, e):
        e_type = type(e).__name__
        e_message = str(e).replace('<', '&lt;').replace('>', '&gt;')
        e_trace = traceback.format_exc().replace('<', '&lt;').replace('>', '&gt;')
        job_state = 'error'
        if e_type == 'ConnectionError' or e_type == 'HTTPError':
            job_state = 'network_error'            # Network problem routing to NJS wrapper
        elif e_type == 'ServerError':
            if '[awe error] job not found:' in e_message:
                job_state = 'not_found_error'      # NJS/AWE-server was wiped (or config url was switched to wrong instance)
            elif 'Information is not available' in e_message:
                job_state = 'not_found_error'      # NJS wrapper was wiped (or config url was switched to wrong instance)
            elif '[awe error] User Unauthorized:' in e_message:
                job_state = 'unauthorized_error'   # NJS is trying to retrieve state of unshared AWE job
            elif 'UnknownHostException' in e_message or 'Server returned HTTP response code:' in e_message:
                job_state = 'network_error'        # Network problem routing NJS
            elif '[awe error]' in e_message:
                job_state = 'awe_error'
        elif e_type == 'URLError':
            job_state = 'network_error'
        return {
            'job_id' : job_id,
            'job_state' : job_state,
            'error' : e_type + ': ' + e_message,
            'traceback' : e_trace
        }

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

    def delete_jobs(self, job_list, as_json=False):
        """
        Delete all jobs in the list. They may belong to different services based on their prefix, currently
        either 'njs', 'method', or 'ujs'.
        """
        deletion_status = dict()
        for job_id in job_list:
            app_id = None
            if job_id.startswith('njs:'):
                # delete from njs
                is_deleted = True
                app_id = job_id[4:]
            elif job_id.startswith('method:'):
                # delete from njs_wrapper
                is_deleted = True
                app_id = job_id[7:]
            else:
                # delete from ujs (njs_wrapper?)
                is_deleted = False
            if app_id is not None:
                token = os.environ['KB_AUTH_TOKEN']
                njsClient = NarrativeJobService(URLS.job_service, token = token)
                try:
                    status = njsClient.delete_app(app_id)
                    if (not status == 'success') and ('was marked for deletion' not in status):
                        is_deleted = False
                except Exception as e:
                    # just return false until we get some better info from the NJS folks.
                    is_deleted = False
            deletion_status[job_id] = is_deleted
        if as_json:
            import json
            deletion_status = json.dumps(deletion_status)
        return deletion_status