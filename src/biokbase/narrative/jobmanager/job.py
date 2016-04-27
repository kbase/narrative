"""
KBase job class
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

class Job ():
    job_id = None
    method_id = None
    method_version = None

    def __init__(self, job_id, method_id, method_version):
        """
        Initializes a new Job with a given id, method id, and method method_version.
        The method_id and method_version should both align with what's available in
        the Narrative Method Store service.
        """
        self.job_id = job_id
        self.method_id = method_id
        self.method_version = method_version

    def status(self):
        """
        Queries the job service to see the status of the current job.
        Returns a <something> stating its status. (string? enum type? different traitlet?)
        """
        pass

    def results(self):
        """
        For a complete job, returns the job results.
        An incomplete job throws an exception
        """
        pass

    def cancel(self):
        """
        Cancels a currently running job. Fails silently if there's no job running.
        """
        pass

    def is_finished(self):
        """
        Returns True if the job is finished (in any state, including errors or cancelled),
        False if its running/queued.
        """
        pass