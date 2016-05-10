"""
KBase Job Manager

The main class here defines a manager for running jobs (as Job objects).
This class knows how to fetch job status, kill jobs, etc.
It also communicates with the front end over the KBaseJobs channel.

It is intended for use as a singleton - use the get_manager() function
to fetch it.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"
__version__ = "0.0.1"

from biokbase.narrative.common.kbjob_manager import KBjobManager
import biokbase.narrative.clients as clients
from .job import Job
from ipykernel.comm import Comm
import threading
import json
import logging
from biokbase.narrative.common import kblogging
from biokbase.narrative.common.log_common import EVENT_MSG_SEP
from IPython.display import HTML
from jinja2 import Template
import dateutil.parser

class JobManager(object):
    """
    The new JobManager class. This handles all jobs and keeps their status.
    On status lookups, it feeds the results to the KBaseJobs channel that the
    front end listens to.
    """
    __instance = None

    running_jobs = dict()
    _lookup_timer = None
    _comm_channel = None
    _log = kblogging.get_logger(__name__)
    _log.setLevel(logging.INFO)

    def __new__(cls):
        if JobManager.__instance is None:
            JobManager.__instance = object.__new__(cls)
        return JobManager.__instance

    def initialize_jobs(self, job_tuples):
        """
        job_tuples = list of job tuples:
        (job_id, tag, cell_id)

        expect them ALL to be NJS-wrapped job ids.
        so you can strip down the prefix (if present) and fetch the info from NJS

        This is expected to be run with a list of job ids that have already been initialized.
        For example, if the kernel is restarted and the synching needs to be redone from the front end.
        """
        try:
            for job_tuple in job_tuples:
                if job_tuple[0] not in self.running_jobs:
                    self.running_jobs[job_tuple[0]] = self.get_existing_job(job_tuple)

            # only keep one loop at a time in cause this gets called again!
            if self._lookup_timer is not None:
                self._lookup_timer.cancel()
            self.lookup_job_status_loop()
        except Exception, e:
            self._log.setLevel(logging.ERROR)
            kblogging.log_event(self._log, "init_error", {'err': str(e)})
            self._send_comm_message('job_init_err', str(e))

    def list_jobs(self):
        """
        List all job ids, their info, and status in a quick HTML format
        """
        try:
            status_set = list()
            for job_id in self.running_jobs:
                job_state = self.running_jobs[job_id].full_state()
                status_set.append(job_state)
            if not len(status_set):
                return "No running jobs!"
            status_set = sorted(status_set, key=lambda s: dateutil.parser.parse(s['submit_time']))
            for i in range(len(status_set)):
                status_set[i]['submit_time'] = datetime.datetime.strftime(dateutil.parser.parse(status_set[i]['submit_time']), "%Y %m %d %H:%M:%S")
                if 'complete_time' in status_set[i]:
                    status_set[i]['complete_time'] = datetime.datetime.strftime(dateutil.parser.parse(status_set[i]['complete_time']), "%Y %m %d %H:%M:%S")

            tmpl = """
            <table class="table table-bordered table-striped table-condensed">
                <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Started</th>
                    <th>Status</th>
                    <th>Run Time</th>
                    <th>Complete Time</th>
                </tr>
                {% for j in jobs %}
                <tr>
                    <td>{{ j.job_id|e }}</td>
                    <td>{{ j.original_app.steps[0].method_spec_id|e }}</td>
                    <td>{{ j.submit_time|e }}</td>
                    <td>{{ j.job_state|e }}</td>
                    <td>...</td>
                    <td>{% if complete_time in j %}{{ j.complete_time|e }}{% else %}Incomplete{% endif %}</td>
                </tr>
                {% endfor %}
            </table>
            """
            return HTML(Template(tmpl).render(jobs=status_set))

        except Exception, e:
            self._log.setLevel(logging.ERROR)
            kblogging.log_event(self._log, "list_jobs.error", {'err': str(e)})
            raise

    def get_jobs_list(self):
        return self.running_jobs.values()

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
        except Exception, e:
            self._log.setLevel(logging.ERROR)
            kblogging.log_event(self._log, "get_existing_job.error", {'job_id': job_id, 'err': str(e)})
            raise

    def lookup_job_status(self):
        """
        Starts the job status lookup. This then optionally spawns a timer that
        looks up the status again after a few seconds.

        Once job info is acquired, it gets pushed to the front end over the
        'KBaseJobs' channel.
        """
        status_set = dict()
        try:
            for job_id in self.running_jobs:
                status_set[job_id] = {'state': self.running_jobs[job_id].full_state(),
                                      'spec': self.running_jobs[job_id].method_spec()}
            self._send_comm_message('job_status', status_set)
        except Exception, e:
            self._log.setLevel(logging.ERROR)
            kblogging.log_event(self._log, "lookup_job_status.error", {'err': str(e)})
            self._send_comm_message('job_err', str(e))

    def lookup_job_status_loop(self):
        self.lookup_job_status()
        self._lookup_timer = threading.Timer(10, self.lookup_job_status_loop)
        self._lookup_timer.start()

    def cancel_job_lookup_loop(self):
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

    def get_job(self, job_id):
        if job_id in self.running_jobs:
            return self.running_jobs[job_id]
        else:
            raise ValueError('No job present with id {}'.format(job_id))

    def _send_comm_message(self, msg_type, content):
        msg = {
            'msg_type': msg_type,
            'content': content
        }
        if not self._comm_channel:
            self._comm_channel = Comm(target_name='KBaseJobs', data={})
        self._comm_channel.open()
        self._comm_channel.send(msg)
        self._comm_channel.close()
