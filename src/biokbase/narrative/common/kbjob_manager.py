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

from biokbase.userandjobstate.client import UserAndJobState
import service
import os

nar_user = "narrativejoblistener"

class kbjob_manager:
    def __init__(self):
        self.ujs = None

    def ujs_client(self):
        if self.ujs is None:
            try:
                token = os.environ['KB_AUTH_TOKEN']
                ujs = UserAndJobState(url=service.URLS.user_and_job_state, token=token)
            except:
                return None

        return ujs

    def register_job(self, job_id):
        """This really just shares an existing job with narrativejoblistener.
        Propagates its exception if unsuccessful
        """
        ujs = self.ujs_client()
        ujs.share_job(job_id, [nar_user])

    def unregister_job(self, job_id):
        """Removes sharing privilege from narrativejoblistener
        """
        ujs = self.ujs_client()
        ujs.unshare_job(job_id, [nar_user])

    def get_results(self, job_id):
        """Gets the results of a job.
        """
        ujs = self.ujs_client()
        res = ujs.get_results(job_id)
        return res
