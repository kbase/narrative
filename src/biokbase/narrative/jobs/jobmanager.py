import biokbase.narrative.clients as clients
from .job import Job
# from ipykernel.comm import Comm
import threading
from biokbase.narrative.common import kblogging
from IPython.display import HTML
from jinja2 import Template
from datetime import (
    datetime,
    timezone,
    timedelta
)
import time
from biokbase.narrative.app_util import system_variable
from biokbase.narrative.exception_util import (
    transform_job_exception
)
"""
KBase Job Manager

The main class here defines a manager for running jobs (as Job objects).
This class knows how to fetch job status, kill jobs, etc.
It also communicates with the front end over the KBaseJobs channel.

This is a singleton - instantiating a new JobManager will return the existing
instance in its current state.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"
__version__ = "0.0.1"

TERMINAL_STATES = ["completed", "terminated", "error"]
ALL_STATES = ["created", "estimating", "queued", "running", "completed", "error", "terminated"]

class JobManager(object):
    """
    The KBase Job Manager class. This handles all jobs and makes their status available.
    On status lookups, it feeds the results to the KBaseJobs channel that the front end
    listens to.
    """
    __instance = None

    # keys = job_id, values = { refresh = T/F, job = Job object }
    _running_jobs = dict()
    # keys = job_id, values = state from either Job object or NJS (these are identical)
    _completed_job_states = dict()

    _log = kblogging.get_logger(__name__)

    def __new__(cls):
        if JobManager.__instance is None:
            JobManager.__instance = object.__new__(cls)
        return JobManager.__instance

    def initialize_jobs(self):
        """
        Initializes this JobManager.
        This is expected to be run by a running Narrative, and naturally linked to a workspace.
        So it does the following steps.
        1. app_util.system_variable('workspace_id')
        2. get list of jobs with that ws id from UJS (also gets tag, cell_id, run_id)
        3. initialize the Job objects by running NJS.get_job_params (also gets app_id)
        4. start the status lookup loop.
        """
        ws_id = system_variable("workspace_id")
        try:
            job_states = clients.get('execution_engine2').check_workspace_jobs({
                'workspace_id': ws_id, 'return_list': 0})
            self._running_jobs = dict()
        except Exception as e:
            kblogging.log_event(self._log, 'init_error', {'err': str(e)})
            new_e = transform_job_exception(e)
            error = {
                'error': 'Unable to get initial jobs list',
                'message': getattr(new_e, 'message', 'Unknown reason'),
                'code': getattr(new_e, 'code', -1),
                'source': getattr(new_e, 'source', 'jobmanager'),
                'name': getattr(new_e, 'name', type(e).__name__),
                'service': 'execution_engine2'
            }
            raise new_e

        for job_id, job_state in job_states.items():
            job_input = job_state.get('job_input', {})
            job_meta = job_input.get('narrative_cell_info', {})
            status = job_state.get('status')
            job = Job.from_state(job_id,
                                 job_input,
                                 job_state.get('user'),
                                 app_id=job_input.get('app_id'),
                                 tag=job_meta.get('tag', 'release'),
                                 cell_id=job_meta.get('cell_id', None),
                                 run_id=job_meta.get('run_id', None),
                                 token_id=job_meta.get('token_id', None),
                                 meta=job_meta)
            self._running_jobs[job_id] = {
                'refresh': 1 if status not in ['completed', 'errored', 'terminated'] else 0,
                'job': job
            }

    def _create_jobs(self, job_ids):
        """
        TODO: error handling
        Makes a bunch of Job objects from job_ids.
        Initially used to make Child jobs from some parent, but will eventually be adapted to all jobs on startup.
        Just slaps them all into _running_jobs
        """
        job_states = clients.get('execution_engine2').check_jobs({'job_ids': job_ids,
                                                                  'return_list': 0})
        for job_id in job_ids:
            if job_id in job_ids and job_id not in self._running_jobs:
                job_state = job_states.get(job_id, {})
                user = job_state.get('user')
                job_info = job_state.get('job_input', {})
                job_meta = job_info.get('narrative_cell_info', {})
                job = Job.from_state(job_id,                                     # the id
                                     job_info,                                   # params, etc.
                                     user,                                       # owner id
                                     app_id=job_info.get('app_id', job_info.get('method')),
                                     tag=job_meta.get('tag', 'release'),
                                     cell_id=job_meta.get('cell_id', None),
                                     run_id=job_meta.get('run_id', None),
                                     token_id=job_meta.get('token_id', None),
                                     meta=job_meta)

                # Note that when jobs for this narrative are initially loaded,
                # they are set to not be refreshed. Rather, if a client requests
                # updates via the start_job_update message, the refresh flag will
                # be set to True.
                self._running_jobs[job_id] = {
                    'refresh': 0,
                    'job': job
                }

    def list_jobs(self):
        """
        List all job ids, their info, and status in a quick HTML format.
        """
        try:
            status_set = list()
            for job_id in self._running_jobs:
                job = self._running_jobs[job_id]['job']
                job_state = self.get_job_state(job_id)
                job_state['app_id'] = job.app_id
                job_state['owner'] = job.owner
                status_set.append(job_state)

            if not len(status_set):
                return "No running jobs!"
            status_set = sorted(status_set, key=lambda s: s.get('created', 0))
            for status in status_set:
                status['creation_time'] = datetime.fromtimestamp(
                    status['created'] / 1000.0).strftime("%Y-%m-%d %H:%M:%S")
                status['run_time'] = 'Not started'
                exec_start = status.get('running', None)

                if status.get('finished'):
                    finished_time = datetime.fromtimestamp(status.get('finished') / 1000.0)
                    status['finish_time'] = finished_time.strftime("%Y-%m-%d %H:%M:%S")
                    if exec_start:
                        exec_start_time = datetime.fromtimestamp(exec_start / 1000.0)
                        delta = finished_time - exec_start_time
                        delta = delta - timedelta(microseconds=delta.microseconds)
                        status['run_time'] = str(delta)
                elif exec_start:
                    exec_start_time = datetime.fromtimestamp(exec_start / 1000.0).replace(
                        tzinfo=timezone.utc)
                    delta = datetime.now(timezone.utc) - exec_start_time
                    delta = delta - timedelta(microseconds=delta.microseconds)
                    status['run_time'] = str(delta)


            tmpl = """
            <table class="table table-bordered table-striped table-condensed">
                <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Submitted</th>
                    <th>Submitted By</th>
                    <th>Status</th>
                    <th>Run Time</th>
                    <th>Complete Time</th>
                </tr>
                {% for j in jobs %}
                <tr>
                    <td>{{ j.job_id|e }}</td>
                    <td>{{ j.app_id|e }}</td>
                    <td>{{ j.creation_time|e }}</td>
                    <td>{{ j.owner|e }}</td>
                    <td>{{ j.status|e }}</td>
                    <td>{{ j.run_time|e }}</td>
                    <td>{% if j.finish_time %}{{ j.finish_time|e }}{% else %}Incomplete{% endif %}</td>
                </tr>
                {% endfor %}
            </table>
            """
            return HTML(Template(tmpl).render(jobs=status_set))

        except Exception as e:
            kblogging.log_event(self._log, "list_jobs.error", {'err': str(e)})
            raise

    def _construct_job_status(self, job: Job, state: dict) -> dict:
        """
        Creates a Job status dictionary with structure:
        {
            owner: string (username),
            spec: app_spec (from NMS, via biokbase.narrative.jobs.specmanager)
            widget_info: (if not finished, None, else...) job.get_viewer_params result
            state: {
                job_state: string,
                error (if present): dict of error info,
                cell_id: string/None,
                run_id: string/None,
                canceled: 0/1
                creation_time: epoch second
                exec_start_time: epoch/none,
                finish_time: epoch/none,
                finished: 0/1,
                job_id: string,
                status: (from UJS) [
                    timestamp(last_update, string),
                    stage (string),
                    status (string),
                    progress (string/None),
                    est_complete (string/None),
                    complete (0/1),
                    error (0/1)
                ],
                ujs_url: string
            }
        }
        """
        widget_info = None
        app_spec = {}

        if job is None:
            state = {
                'status': 'error',
                'error': {
                    'error': 'Job does not seem to exist, or it is otherwise unavailable.',
                    'message': 'Job does not exist',
                    'name': 'Job Error',
                    'code': -1,
                    'exception': {
                        'error_message': 'job not found in JobManager',
                        'error_type': 'ValueError',
                        'error_stacktrace': ''
                    }
                },
                'cell_id': None,
                'run_id': None,
            }
            return {
                'state': state,
                'app_spec': app_spec,
                'widget_info': widget_info,
                'owner': None
            }

        if state is None:
            kblogging.log_event(self._log, "lookup_job_status.error", {'err': 'Unable to get job state for job {}'.format(job.job_id)})

            state = {
                'status': 'error',
                'error': {
                    'error': 'Unable to find current job state. Please try again later, or contact KBase.',
                    'message': 'Unable to return job state',
                    'name': 'Job Error',
                    'code': -1,
                    'source': 'JobManager._construct_job_status',
                    'exception': {
                        'error_message': 'No state provided during lookup',
                        'error_type': 'null-state',
                        'error_stacktrace': '',
                    }
                },
                'creation_time': 0,
                'cell_id': job.cell_id,
                'run_id': job.run_id,
                'job_id': job.job_id
            }

        elif 'lookup_error' in state:
            kblogging.log_event(self._log, "lookup_job_status.error", {
                'err': 'Problem while getting state for job {}'.format(job.job_id),
                'info': str(state['lookup_error'])
            })
            state = {
                'status': 'error',
                'error': {
                    'error': 'Unable to fetch current state. Please try again later, or contact KBase.',
                    'message': 'Error while looking up job state',
                    'name': 'Job Error',
                    'code': -1,
                    'source': 'JobManager._construct_job_status',
                    'exception': {
                        'error_message': 'Error while fetching job state',
                        'error_type': 'failed-lookup',
                    },
                    'error_response': state['lookup_error'],
                    'creation_time': 0,
                    'cell_id': job.cell_id,
                    'run_id': job.run_id,
                    'job_id': job.job_id
                }
            }
        if state.get('finished'):
            try:
                widget_info = job.get_viewer_params(state)
            except Exception as e:
                # Can't get viewer params
                new_e = transform_job_exception(e)
                kblogging.log_event(self._log, "lookup_job_status.error", {'err': str(e)})
                state['state'] = 'error'
                state['error'] = {
                    'error': 'Unable to generate App output viewer!\nThe App appears to have completed successfully,\nbut we cannot construct its output viewer.\nPlease contact the developer of this App for assistance.',
                    'message': 'Unable to build output viewer parameters!',
                    'name': 'App Error',
                    'code': getattr(new_e, "code", -1),
                    'source': getattr(new_e, "source", "JobManager")
                }

        state.update({
            'child_jobs': self._child_job_states(
                state.get('sub_jobs', []),
                job.meta.get('batch_app'),
                job.meta.get('batch_tag')
            )
        })
        if 'batch_size' in job.meta:
            state.update({'batch_size': job.meta['batch_size']})
        return {'state': state,
                'spec': app_spec,
                'widget_info': widget_info,
                'owner': job.owner,
                'listener_count': self._running_jobs[job.job_id]['refresh']}

    def _child_job_states(self, sub_job_list, app_id, app_tag):
        """
        Fetches state for all jobs in the list. These are expected to be child jobs, with no actual Job object associated.
        So if they're done, we need to do the output mapping out of band.
        But the check_jobs call with params will return the app id. So that helps.

        app_id = the id of the app that all the child jobs are running (format: module/method, like "MEGAHIT/run_megahit")
        app_tag = one of "release", "beta", "dev"
        (the above two aren't stored with the subjob metadata, and won't until we back some more on KBParallel - I want to
        lobby for pushing toward just starting everything up at once from here and letting HTCondor deal with allocation)
        sub_job_list = list of ids of jobs to look up
        """
        if not sub_job_list:
            return []

        sub_job_list = sorted(sub_job_list)

        job_states = clients.get('execution_engine2').check_jobs({'job_ids': sub_job_list,
                                                                  'return_list': 0})
        child_job_states = list()

        for job_id in sub_job_list:
            job_state = job_states.get(job_id, {})
            params = job_state.get('job_input', {}).get('params', [])
            # if it's error, get the error.
            if job_state.get('errormsg'):
                error = job_state
                error.update({'job_id': job_id})
                child_job_states.append(error)
                continue
            # if it's done, get the output mapping.
            state = job_state.get('status')
            if state == 'completed':
                try:
                    widget_info = Job.map_viewer_params(
                        state,
                        params,
                        app_id,
                        app_tag
                    )
                except ValueError:
                    widget_info = {}
                state.update({'widget_info': widget_info})
            child_job_states.append(state)
        return child_job_states

    def _construct_job_status_set(self, job_ids: list) -> dict:
        """
        Builds a set of job states for the list of job ids.
        """
        job_states = self._get_all_job_states(job_ids)

        status_set = dict()
        for job_id in job_ids:
            job = None
            if job_id in self._running_jobs:
                job = self._running_jobs[job_id]['job']
            status_set[job_id] = self._construct_job_status(job, job_states.get(job_id, None))
        return status_set

    def _verify_job_parentage(self, parent_job_id, child_job_id):
        """
        Validate job relationships.
        1. Make sure parent exists, and the child id is in its list of sub jobs.
        2. If child doesn't exist, create it and add it to the list.
        If parent doesn't exist, or child isn't an actual child, raise an exception
        """
        if parent_job_id not in self._running_jobs:
            raise ValueError('Parent job id {} not found, cannot validate child job {}.'.format(parent_job_id, child_job_id))
        if child_job_id not in self._running_jobs:
            parent_job = self.get_job(parent_job_id)
            parent_state = parent_job.state()
            if child_job_id not in parent_state.get('sub_jobs', []):
                raise ValueError('Child job id {} is not a child of parent job {}'.format(child_job_id, parent_job_id))
            else:
                self._create_jobs([child_job_id])
                # injects its app id and version
                child_job = self.get_job(child_job_id)
                child_job.app_id = parent_job.meta.get('batch_app')
                child_job.tag = parent_job.meta.get('batch_tag', 'release')

    def lookup_job_info(self, job_id, parent_job_id=None):
        """
        Will raise a ValueError if job_id doesn't exist.
        Sends the info over the comm channel as this packet:
        {
            app_id: module/name,
            app_name: random string,
            job_id: string,
            job_params: dictionary
        }
        """
        # if parent_job is real, and job_id (the child) is not, just add it to the
        # list of running jobs and work as normal.
        if parent_job_id is not None:
            self._verify_job_parentage(parent_job_id, job_id)
        job = self.get_job(job_id)
        info = {
            'app_id': job.app_id,
            'app_name': job.app_spec()['info']['name'],
            'job_id': job_id,
            'job_params': job.inputs
        }
        return info
        # self._send_comm_message('job_info', info)

    def lookup_all_job_states(self, ignore_refresh_flag=False):
        """
        Fetches states for all running jobs.
        If ignore_refresh_flag is True, then returns states for all jobs this
        JobManager knows about (i.e. all jobs associated with the workspace).

        This returns them all as a dictionary, keyed on the job id.
        :param ignore_refresh_flag: boolean - if True, ignore the usual refresh state of the job.
            Even if the job is stopped, or completed, fetch and return its state from the service.
        """
        jobs_to_lookup = list()
        # grab the list of running job ids, so we don't run into update-while-iterating problems.
        for job_id in self._running_jobs.keys():
            if self._running_jobs[job_id]['refresh'] > 0 or ignore_refresh_flag:
                jobs_to_lookup.append(job_id)
        if len(jobs_to_lookup) > 0:
            return self._construct_job_status_set(jobs_to_lookup)
        else:
            return dict()

    def register_new_job(self, job: Job) -> None:
        """
        Registers a new Job with the manager - should only be invoked when a new Job gets
        started. This stores the Job locally and pushes it over the comm channel to the
        Narrative where it gets serialized.

        Parameters:
        -----------
        job : biokbase.narrative.jobs.job.Job object
            The new Job that was started.
        """
        kblogging.log_event(self._log, "register_new_job", {"job_id": job.job_id})
        self._running_jobs[job.job_id] = {'job': job, 'refresh': 0}
        # self._lookup_job_status(job.job_id)

    def get_job(self, job_id):
        """
        Returns a Job with the given job_id.
        Raises a ValueError if not found.
        """
        if job_id in self._running_jobs:
            return self._running_jobs[job_id]["job"]
        else:
            raise ValueError(f"No job present with id {job_id}")

    def get_job_logs(self, job_id: str, parent_job_id: str=None, first_line: int=0,
                     num_lines: int=None, latest_only: bool=False) -> tuple:
        """
        Raises a Value error if the job_id doesn't exist or is not present.
        :param job_id: str - the job id from the execution engine
        :param parent_job_id: if the job is a child job, this is its parent (optional)
        :param first_line: int - the first line to be requested by the log. 0-indexed. If < 0,
            this will be set to 0
        :param max_lines: int - the maximum number of lines to return.
            if < 0, will be reset to 0.
            if None, then will not be considered, and just return all the lines.
        :param latest_only: bool - if True, will only return the most recent max_lines
            of logs. This overrides the first_line parameter if set to True. So if the call made
            is get_job_logs(id, first_line=0, num_lines=5, latest_only=True), and there are 100
            log lines available, then lines 96-100 will be returned.
        :returns: 3-tuple. elements in order:
            int - the first line returned
            int - the number of logs lines currently available for that job
            list - the lines themselves, fresh from the server. These are all tiny dicts
                with key "is_error" (either 0 or 1) and "line" - the log line string

        """
        job = self.get_job(job_id)

        if first_line < 0:
            first_line = 0
        if num_lines is not None and num_lines < 0:
            num_lines = 0

        try:
            if latest_only:
                (max_lines, logs) = job.log()
                if num_lines is not None and max_lines > num_lines:
                    first_line = max_lines - num_lines
                    logs = logs[first_line:]
            else:
                (max_lines, logs) = job.log(first_line=first_line, num_lines=num_lines)

            return (first_line, max_lines, logs)
        except Exception as e:
            raise transform_job_exception(e)

    def cancel_job(self, job_id: str, parent_job_id: str=None) -> None:
        """
        Cancels a running job, placing it in a canceled state.
        Does NOT delete the job.
        if the job_id is None or not found in this Narrative, a ValueError is raised.
        This then checks the job to see if it is already canceled/finished,
        then attempts to cancel it.
        If either of those steps fail, a NarrativeException is raised.
        """

        if job_id is None:
            raise ValueError('Job id required for cancellation!')
        if not parent_job_id and job_id not in self._running_jobs:
            raise ValueError(f"No job present with id {job_id}")

        try:
            cancel_status = clients.get("execution_engine2").check_job_canceled({"job_id": job_id})
            if cancel_status.get("finished", 0) == 1 or cancel_status.get("canceled", 0) == 1:
                # It's already finished, don't try to cancel it again.
                return
        except Exception as e:
            raise transform_job_exception(e)

        # Stop updating the job status while we try to cancel.
        # Also, set it to have a special state of 'canceling' while we're doing the cancel
        if not parent_job_id:
            is_refreshing = self._running_jobs[job_id].get('refresh', 0)
            self._running_jobs[job_id]['refresh'] = 0
            self._running_jobs[job_id]['canceling'] = True
        try:
            clients.get('execution_engine2').cancel_job({'job_id': job_id})
        except Exception as e:
            raise transform_job_exception(e)
        finally:
            if not parent_job_id:
                self._running_jobs[job_id]['refresh'] = is_refreshing
                del self._running_jobs[job_id]['canceling']

    def _get_all_job_states(self, job_ids: list=None) -> dict:
        """
        Returns the state for all running jobs.
        Returns a dict keyed on job id where each element has this structure:
        { TBD }

        If an error happens while looking up job states, it gets raised.
        """
        # 1. Get list of ids
        if job_ids is None:
            job_ids = self._running_jobs.keys()

        # 2. Foreach, check if in completed cache. If so, grab the status. If not, enqueue id
        # for batch lookup.
        job_states = dict()

        jobs_to_lookup = list()
        for job_id in job_ids:
            if job_id in self._completed_job_states:
                job_states[job_id] = dict(self._completed_job_states[job_id])
            else:
                jobs_to_lookup.append(job_id)

        # 3. Lookup those jobs that need it. Cache those in a terminal state.
        if len(jobs_to_lookup):
            try:
                fetched_states = clients.get('execution_engine2').check_jobs({
                    'job_ids': jobs_to_lookup,
                    'return_list': 0
                })
            except Exception as e:
                kblogging.log_event(self._log, 'get_all_job_states_error', {'err': str(e)})
                return {}

            for job_id in jobs_to_lookup:
                state = fetched_states.get(job_id, {})
                status = state.get('status')
                if status in ALL_STATES:
                    state['cell_id'] = self._running_jobs[job_id]['job'].cell_id
                    state['run_id'] = self._running_jobs[job_id]['job'].run_id
                    if status == 'completed':
                        self._completed_job_states[state['job_id']] = dict(state)
                    state['job_input'] = state.get('job_input', {})
                    state['job_output'] = state.get('job_output', {})
                    job_states[state['job_id']] = state
                else:
                    error = state
                    job_states[state['job_id']] = {'lookup_error': error}
        return job_states

    def get_job_state(self, job_id: str, parent_job_id: str=None) -> dict:
        if parent_job_id is not None:
            self._verify_job_parentage(parent_job_id, job_id)
        if job_id is None or job_id not in self._running_jobs:
            raise ValueError(f"No job present with id {job_id}")
        if job_id in self._completed_job_states:
            return dict(self._completed_job_states[job_id])
        state = self._running_jobs[job_id]['job'].state()
        if state.get('status') == 'completed':
            self._completed_job_states[job_id] = dict(state)
        return dict(state)

    def modify_job_refresh(self, job_id: str, update_adjust: int, parent_job_id: str=None) -> None:
        """
        Modifies how many things want to get the job updated.
        If this sets the current "refresh" key to be less than 0, it gets reset to 0.
        If the job isn't present or None, a ValueError is raised.
        """
        if parent_job_id is not None:
            self._verify_job_parentage(parent_job_id, job_id)
        if job_id is None or job_id not in self._running_jobs:
            raise ValueError(f"No job present with id {job_id}")
        self._running_jobs[job_id]["refresh"] += update_adjust
        if self._running_jobs[job_id]["refresh"] < 0:
            self._running_jobs[job_id]["refresh"] = 0
