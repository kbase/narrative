from biokbase.narrative.common.kbjob_manager import KBjobManager
import biokbase.narrative.clientmanager as clients
from .job import Job
from ipykernel.comm import Comm
import threading
import json

def get_manager():
    """
    Keep this as a singleton! ONLY USE THIS!
    """
    return _manager

class JobManager(object):
    """
    The new JobManager class. This handles all jobs and keeps their status.
    On status lookups, it feeds the results to the KBaseJobs channel that the
    front end listens to.
    """
    def __init__(self):
        self._lookup_timer = None
        self.running_jobs = dict()
        self._comm_channel = None

    def initialize_jobs(self, job_tuples):
        """
        job_tuples = list of job tuples:
        (job_id, tag, cell_id)

        expect them ALL to be NJS-wrapped job ids.
        so you can strip down the prefix (if present) and fetch the info from NJS

        This is expected to be run with a list of job ids that have already been initialized.
        For example, if the kernel is restarted and the synching needs to be redone from the front end.
        """
        for job_tuple in job_tuples:
            if job_tuple[0] not in self.running_jobs:
                self.running_jobs[job_tuple[0]] = self.get_existing_job(job_tuple)
        self.lookup_job_status(set_timer=True)

    def get_existing_job(self, job_tuple):
        """
        creates a Job object from a job_id that already exists.
        If no job exists, throws a XXXX Exception. (not found? value error?)
        Tuple format:
        ( job_id, job_inputs (as json), tag, cell_id )
        """

        # remove the prefix (if present) and take the last element in the split
        job_id = job_tuple[0].split(':')[-1]
        try:
            job_state = clients.get('job_service').check_app_state(job_id)
            return Job.from_state(job_state, json.loads(job_tuple[1]), tag=job_tuple[2], cell_id=job_tuple[3])
        except:
            raise

    def lookup_job_status(self, set_timer=False):
        """
        Starts the job status lookup. This then optionally spawns a timer that
        looks up the status again after a few seconds.

        Once job info is acquired, it gets pushed to the front end over the
        'KBaseJobs' channel.
        """
        status_set = dict()
        for job_id in self.running_jobs:
            status_set[job_id] = self.running_jobs[job_id].status()

        self._send_comm_message('job_status', status_set)

        if set_timer:
            self._lookup_timer = threading.Timer(10, self.lookup_job_status, kwargs={'set_timer':True})
            self._lookup_timer.start()

    def cancel_job_lookup(self):
        """
        Cancels a running timer if one's still alive.
        """
        if self._lookup_timer:
            self._lookup_timer.cancel()

    def register_new_job(self, job):
        self.running_jobs[job.job_id] = job
        # push it forward! create a new_job message.
        self._send_comm_message('new_job', {
            'id': job.job_id,
            'method_id': job.method_id,
            'inputs': job.inputs,
            'version': job.method_version,
            'tag': job.tag,
            'cell_id': job.cell_id
        })

    def _send_comm_message(self, msg_type, content):
        msg = {
            'msg_type': msg_type,
            'content': content
        }
        if not self._comm_channel:
            self._comm_channel = Comm(target_name='KBaseJobs', data={})
        self._comm_channel.send(msg)


_manager = JobManager()

