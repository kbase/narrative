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
from biokbase.narrative.common.url_config import URLS
import biokbase.auth

class KBjobManager():

    def __init__(self):
        self.ujs = None
        self.nar_user = 'narrativejoblistener'
        pass

    # def __creds(self):
    #     return [__name, __pw]

    def __ujs_client(self, token=None):
        if self.ujs is None:
            token = os.environ['KB_AUTH_TOKEN']
            self.ujs = UserAndJobState(url=URLS.user_and_job_state, token=token)

        return self.ujs

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

    def poll_job(self, job_id, ujs=None):
        """
        Polls a single job id on behalf of the narrativejoblistener account
        Will raise biokbase.user_and_job_state.ServerError if a job doesn't exist.
        """
        if ujs is None:
            t = self.get_njl_token()
            print t
            if t is None:
                return 'No Token!' # should probably throw exception

            ujs = UserAndJobState(url=URLS.user_and_job_state, token=t.token)

        return ujs.get_job_info(job_id)

    def poll_jobs(self, job_ids):
        """
        Polls a list of job ids on behalf of the narrativejoblistener
        account and returns the results
        """
        pass

        # t = self.get_njl_token()
        # if t is None:
        #     return None # should probably throw exception

        # ujs = UserAndJobState(url=service.URLS.user_and_job_state, token=t)

        # info_list = list()
        # for i in range(0, len(job_ids)):
        #     info_list.append(self.poll_job(job_ids[i], ujs))

        # return info_list

    # def get_njl_token(self):
    #     """
    #     Get the auth token for the narrativejoblistener.
    #     """
    #     return None

        # if self.njl_token is None:
        #     try:
        #         creds = self.creds()
        #         njl_token = biokbase.auth.Token(user_id=creds[0], password=creds[1])
        #         self.njl_token = njl_token
        #     except biokbase.auth.AuthFail, a:
        #         raise biokbase.auth.AuthFail("uid/pw invalid")

        # return self.njl_token