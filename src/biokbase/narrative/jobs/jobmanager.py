import biokbase.narrative.clients as clients
from .job import Job
from ipykernel.comm import Comm
import threading
from biokbase.narrative.common import kblogging
from IPython.display import HTML
from jinja2 import Template
import datetime
import time
from biokbase.narrative.app_util import system_variable
from biokbase.narrative.exception_util import (
    transform_job_exception
)
import traceback
from .util import sanitize_all_states
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

    _lookup_timer = None
    _comm = None
    _log = kblogging.get_logger(__name__)
    # TODO: should this not be done globally?
    _running_lookup_loop = False

    def __new__(cls):
        if JobManager.__instance is None:
            JobManager.__instance = object.__new__(cls)
        return JobManager.__instance

    def initialize_jobs(self, start_lookup_thread=True):
        """
        Initializes this JobManager.
        This is expected to be run by a running Narrative, and naturally linked to a workspace.
        So it does the following steps.
        1. app_util.system_variable('workspace_id')
        2. get list of jobs with that ws id from UJS (also gets tag, cell_id, run_id)
        3. initialize the Job objects by running NJS.get_job_params (also gets app_id)
        4. start the status lookup loop.
        """

        self._send_comm_message("start", {"time": int(round(time.time() * 1000))})
        ws_id = system_variable("workspace_id")

        try:
            nar_jobs = clients.get('user_and_job_state').list_jobs2({
                'authstrat': 'kbaseworkspace',
                'authparams': [str(ws_id)]
            })
        except Exception as e:
            kblogging.log_event(self._log, 'init_error', {'err': str(e)})
            new_e = transform_job_exception(e)
            error = {
                'error': 'Unable to get initial jobs list',
                'message': getattr(new_e, 'message', 'Unknown reason'),
                'code': getattr(new_e, 'code', -1),
                'source': getattr(new_e, 'source', 'jobmanager'),
                'name': getattr(new_e, 'name', type(e).__name__),
                'service': 'user_and_job_state'
            }
            self._send_comm_message('job_init_err', error)
            raise new_e

        job_ids = [j[0] for j in nar_jobs]
        job_states = clients.get('job_service').check_jobs({
            'job_ids': job_ids, 'with_job_params': 1
        })
        job_states = sanitize_all_states(job_states)
        job_param_info = job_states.get('job_params', {})
        job_check_error = job_states.get('check_error', {})
        error_jobs = dict()
        for info in nar_jobs:
            job_id = info[0]
            user_info = info[1]
            job_meta = info[10]
            try:
                if job_id in job_param_info:
                    job_info = job_param_info[job_id]

                    job = Job.from_state(job_id,
                                         job_info,
                                         user_info[0],
                                         app_id=job_info.get('app_id'),
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
                elif job_id in job_check_error:
                    job_err_state = {
                        'job_state': 'error',
                        'error': {
                            'error': 'KBase execution engine returned an error while looking up this job.',
                            'message': job_check_error[job_id].get('message', 'No error message available'),
                            'name': 'Job Error',
                            'code': job_check_error[job_id].get('code', -999),
                            'exception': {
                                'error_message': 'Job lookup in execution engine failed',
                                'error_type': job_check_error[job_id].get('name', 'unknown'),
                                'error_stacktrace': job_check_error[job_id].get('error', '')
                            }
                        },
                        'cell_id': job_meta.get('cell_id', None),
                        'run_id': job_meta.get('run_id', None),
                    }
                    error_jobs[job_id] = job_err_state

            except Exception as e:
                kblogging.log_event(self._log, 'init_error', {'err': str(e)})
                new_e = transform_job_exception(e)
                error = {
                    'error': 'Unable to get job info on initial lookup',
                    'job_id': job_id,
                    'message': getattr(new_e, 'message', 'Unknown reason'),
                    'code': getattr(new_e, 'code', -1),
                    'source': getattr(new_e, 'source', 'jobmanager'),
                    'name': getattr(new_e, 'name', type(e).__name__),
                    'service': 'job_service'
                }
                self._send_comm_message('job_init_lookup_err', error)
                raise new_e  # should crash and burn on any of these.

        if len(job_check_error):
            err_str = 'Unable to find info for some jobs on initial lookup'
            err_type = 'job_init_partial_err'
            if len(job_check_error) == len(nar_jobs):
                err_str = 'Unable to get info for any job on initial lookup'
                err_type = 'job_init_lookup_err'
            error = {
                'error': err_str,
                'job_errors': error_jobs,
                'message': 'Job information was unavailable from the server',
                'code': -2,
                'source': 'jobmanager',
                'name': 'jobmanager',
                'service': 'job_service',
            }
            self._send_comm_message(err_type, error)

        if not self._running_lookup_loop and start_lookup_thread:
            # only keep one loop at a time in case this gets called again!
            if self._lookup_timer is not None:
                self._lookup_timer.cancel()
            self._running_lookup_loop = True
            self._lookup_job_status_loop()
        else:
            self._lookup_all_job_status()

    def _create_jobs(self, job_ids):
        """
        TODO: error handling
        Makes a bunch of Job objects from job_ids.
        Initially used to make Child jobs from some parent, but will eventually be adapted to all jobs on startup.
        Just slaps them all into _running_jobs
        """
        job_states = clients.get('job_service').check_jobs({'job_ids': job_ids, 'with_job_params': 1})
        job_states = sanitize_all_states(job_states)
        for job_id in job_ids:
            ujs_info = clients.get('user_and_job_state').get_job_info2(job_id)

            if job_id in job_ids and job_id not in self._running_jobs:
                job_info = job_states.get('job_params', {}).get(job_id, {})
                job_meta = ujs_info[10]
                job = Job.from_state(job_id,                                     # the id
                                     job_info,                                   # params, etc.
                                     ujs_info[2],                                # owner id
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
                job_state = self._get_job_state(job_id)
                job_state['app_id'] = job.app_id
                job_state['owner'] = job.owner
                status_set.append(job_state)
            if not len(status_set):
                return "No running jobs!"
            status_set = sorted(status_set, key=lambda s: s['creation_time'])
            for i in range(len(status_set)):
                status_set[i]['creation_time'] = datetime.datetime.strftime(datetime.datetime.fromtimestamp(status_set[i]['creation_time']/1000), "%Y-%m-%d %H:%M:%S")
                exec_start = status_set[i].get('exec_start_time', None)
                if 'finish_time' in status_set[i]:
                    finished = status_set[i].get('finish_time', None)
                    if finished is not None and exec_start:
                        delta = datetime.datetime.fromtimestamp(finished/1000.0) - datetime.datetime.fromtimestamp(exec_start/1000.0)
                        delta = delta - datetime.timedelta(microseconds=delta.microseconds)
                        status_set[i]['run_time'] = str(delta)
                        status_set[i]['finish_time'] = datetime.datetime.strftime(datetime.datetime.fromtimestamp(status_set[i]['finish_time']/1000), "%Y-%m-%d %H:%M:%S")
                elif exec_start:
                    delta = datetime.datetime.utcnow() - datetime.datetime.utcfromtimestamp(exec_start/1000.0)
                    delta = delta - datetime.timedelta(microseconds=delta.microseconds)
                    status_set[i]['run_time'] = str(delta)
                else:
                    status_set[i]['run_time'] = 'Not started'

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
                    <td>{{ j.job_state|e }}</td>
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

    def get_jobs_list(self):
        """
        A convenience method for fetching an unordered list of all running Jobs.
        """
        return [j['job'] for j in self._running_jobs.values()]

    def _construct_job_status(self, job, state):
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
                awe_job_id: string/None,
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
                'job_state': 'error',
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

        # try:
        #     app_spec = job.app_spec()
        # except Exception as e:
        #     kblogging.log_event(self._log, "lookup_job_status.error", {'err': str(e)})

        if state is None:
            kblogging.log_event(self._log, "lookup_job_status.error", {'err': 'Unable to get job state for job {}'.format(job.job_id)})

            state = {
                'job_state': 'error',
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
                'job_state': 'error',
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
        if state.get('finished', 0) == 1:
            try:
                widget_info = job.get_viewer_params(state)
            except Exception as e:
                # Can't get viewer params
                new_e = transform_job_exception(e)
                kblogging.log_event(self._log, "lookup_job_status.error", {'err': str(e)})
                state['job_state'] = 'error'
                state['error'] = {
                    'error': 'Unable to generate App output viewer!\nThe App appears to have completed successfully,\nbut we cannot construct its output viewer.\nPlease contact the developer of this App for assistance.',
                    'message': 'Unable to build output viewer parameters!',
                    'name': 'App Error',
                    'code': getattr(new_e, "code", -1),
                    'source': getattr(new_e, "source", "JobManager")
                }

        if 'canceling' in self._running_jobs[job.job_id]:
            state['job_state'] = 'canceling'

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
        job_info = clients.get('job_service').check_jobs({'job_ids': sub_job_list, 'with_job_params': 1})
        job_info = sanitize_all_states(job_info)
        child_job_states = list()

        for job_id in sub_job_list:
            params = job_info['job_params'][job_id]
            # if it's error, get the error.
            if job_id in job_info['check_error']:
                error = job_info['check_error'][job_id]
                error.update({'job_id': job_id})
                child_job_states.append(error)
                continue
            # if it's done, get the output mapping.
            state = job_info['job_states'][job_id]
            if state.get('finished', 0) == 1:
                try:
                    widget_info = Job.map_viewer_params(
                        state,
                        params['params'],
                        app_id,
                        app_tag
                    )
                except ValueError:
                    widget_info = {}
                state.update({'widget_info': widget_info})
            child_job_states.append(state)
        return child_job_states

    def _construct_job_status_set(self, job_ids):
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


    def _lookup_job_status(self, job_id, parent_job_id=None):
        """
        Will raise a ValueError if job_id doesn't exist.
        Sends the status over the comm channel as the usual job_status message.
        """

        # if parent_job is real, and job_id (the child) is not, just add it to the
        # list of running jobs and work as normal.
        if parent_job_id is not None:
            self._verify_job_parentage(parent_job_id, job_id)
        job = self._running_jobs.get(job_id, {}).get('job', None)
        state = self._get_job_state(job_id)
        status = self._construct_job_status(job, state)
        self._send_comm_message('job_status', status)

    def _lookup_job_info(self, job_id, parent_job_id=None):
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
        self._send_comm_message('job_info', info)

    def _lookup_all_job_status(self, ignore_refresh_flag=False):
        """
        Looks up status for all jobs.
        Once job info is acquired, it gets pushed to the front end over the
        'KBaseJobs' channel.
        Returns the number of jobs whose status were looked up (useful for deciding when
        to stop calling this function - if 0 is returned, we don't need to look up any more jobs
        for a while).
        """
        jobs_to_lookup = list()
        # grab the list of running job ids, so we don't run into update-while-iterating problems.
        for job_id in self._running_jobs.keys():
            if self._running_jobs[job_id]['refresh'] > 0 or ignore_refresh_flag:
                jobs_to_lookup.append(job_id)

        if len(jobs_to_lookup) > 0:
            status_set = self._construct_job_status_set(jobs_to_lookup)
            self._send_comm_message('job_status_all', status_set)

        return len(jobs_to_lookup)

    def _start_job_status_loop(self):
        kblogging.log_event(self._log, 'starting job status loop', {})
        if self._lookup_timer is None:
            self._lookup_job_status_loop()

    def _lookup_job_status_loop(self):
        """
        Initialize a loop that will look up job info. This uses a Timer thread on a 10
        second loop to update things.
        """

        refreshing_jobs = self._lookup_all_job_status()
        # Automatically stop when there are no more jobs requesting a refresh.
        if refreshing_jobs == 0:
            self.cancel_job_lookup_loop()
        else:
            self._lookup_timer = threading.Timer(10, self._lookup_job_status_loop)
            self._lookup_timer.start()

    def cancel_job_lookup_loop(self):
        """
        Cancels a running timer if one's still alive.
        """
        if self._lookup_timer:
            self._lookup_timer.cancel()
            self._lookup_timer = None
        self._running_lookup_loop = False

    def register_new_job(self, job):
        """
        Registers a new Job with the manager - should only be invoked when a new Job gets
        started. This stores the Job locally and pushes it over the comm channel to the
        Narrative where it gets serialized.

        Parameters:
        -----------
        job : biokbase.narrative.jobs.job.Job object
            The new Job that was started.
        """
        self._running_jobs[job.job_id] = {'job': job, 'refresh': 0}
        # push it forward! create a new_job message.
        self._lookup_job_status(job.job_id)
        self._send_comm_message('new_job', {
            'job_id': job.job_id
        })

    def get_job(self, job_id):
        """
        Returns a Job with the given job_id.
        Raises a ValueError if not found.
        """
        if job_id in self._running_jobs:
            return self._running_jobs[job_id]['job']
        else:
            raise ValueError('No job present with id {}'.format(job_id))

    def _handle_comm_message(self, msg):
        """
        Handles comm messages that come in from the other end of the KBaseJobs channel.
        All messages (of any use) should have a 'request_type' property.
        Possible types:
        * all_status
            refresh all jobs that are flagged to be looked up. Will send a
            message back with all lookup status.
        * job_status
            refresh the single job given in the 'job_id' field. Sends a message
            back with that single job's status, or an error message.
        * stop_update_loop
            stop the running refresh loop, if there's one going (might be
            one more pass, depending on the thread state)
        * start_update_loop
            reinitialize the refresh loop.
        * stop_job_update
            flag the given job id (should be an accompanying 'job_id' field) that the front
            end knows it's in a terminal state and should no longer have its status looked
            up in the refresh cycle.
        * start_job_update
            remove the flag that gets set by stop_job_update (needs an accompanying 'job_id'
            field)
        * job_info
            from the given 'job_id' field, returns some basic info about the job, including the app
            id, version, app name, and key-value pairs for inputs and parameters (in the parameters
            id namespace specified by the app spec).
        """

        if 'request_type' in msg['content']['data']:
            r_type = msg['content']['data']['request_type']
            job_id = msg['content']['data'].get('job_id', None)
            parent_job_id = msg['content']['data'].get('parent_job_id', None)
            if job_id is not None and job_id not in self._running_jobs and not parent_job_id:
                # If it's not a real job, just silently ignore the request.
                # Unless it has a parent job id, then its a child job, so things get muddled. If there's 100+ child jobs,
                # then this might get tricky to look up all of them. Let it pass through and fail if it's not real.
                #
                # TODO: perhaps we should implement request/response here. All we really need is to thread a message
                # id through
                self._send_comm_message('job_does_not_exist', {'job_id': job_id, 'request_type': r_type})
                return
            elif parent_job_id is not None:
                try:
                    self._verify_job_parentage(parent_job_id, job_id)
                except ValueError as e:
                    self._send_comm_message('job_does_not_exist', {'job_id': job_id, 'parent_job_id': parent_job_id, 'request_type': r_type})

            if r_type == 'all_status':
                self._lookup_all_job_status(ignore_refresh_flag=True)

            elif r_type == 'job_status':
                if job_id is not None:
                    self._lookup_job_status(job_id, parent_job_id=parent_job_id)

            elif r_type == 'job_info':
                if job_id is not None:
                    self._lookup_job_info(job_id, parent_job_id=parent_job_id)

            elif r_type == 'stop_update_loop':
                self.cancel_job_lookup_loop()

            elif r_type == 'start_update_loop':
                self._start_job_status_loop()

            elif r_type == 'stop_job_update':
                if job_id is not None:
                    if self._running_jobs[job_id]['refresh'] > 0:
                        self._running_jobs[job_id]['refresh'] -= 1

            elif r_type == 'start_job_update':
                if job_id is not None:
                    self._running_jobs[job_id]['refresh'] += 1
                    self._start_job_status_loop()

            elif r_type == 'delete_job':
                if job_id is not None:
                    try:
                        self.delete_job(job_id, parent_job_id=parent_job_id)
                    except Exception as e:
                        self._send_comm_message('job_comm_error', {'message': str(e), 'request_type': r_type, 'job_id': job_id})

            elif r_type == 'cancel_job':
                if job_id is not None:
                    try:
                        self.cancel_job(job_id, parent_job_id=parent_job_id)
                    except Exception as e:
                        self._send_comm_message('job_comm_error', {'message': str(e), 'request_type': r_type, 'job_id': job_id})

            elif r_type == 'job_logs':
                if job_id is not None:
                    first_line = msg['content']['data'].get('first_line', 0)
                    num_lines = msg['content']['data'].get('num_lines', None)
                    self._get_job_logs(job_id, parent_job_id=parent_job_id, first_line=first_line, num_lines=num_lines)
                else:
                    raise ValueError('Need a job id to fetch jobs!')

            elif r_type == 'job_logs_latest':
                if job_id is not None:
                    num_lines = msg['content']['data'].get('num_lines', None)
                    try:
                        self._get_latest_job_logs(job_id, parent_job_id=parent_job_id, num_lines=num_lines)
                    except Exception as e:
                        self._send_comm_message('job_comm_error', {
                            'job_id': job_id,
                            'message': str(e),
                            'request_type': r_type})
                else:
                    raise ValueError('Need a job id to fetch jobs!')

            else:
                self._send_comm_message('job_comm_error', {'message': 'Unknown message', 'request_type': r_type})
                raise ValueError('Unknown KBaseJobs message "{}"'.format(r_type))

    def _get_latest_job_logs(self, job_id, parent_job_id=None, num_lines=None):
        job = self.get_job(job_id)
        if job is None:
            raise ValueError('job "{}" not found while fetching logs!'.format(job_id))

        (max_lines, logs) = job.log()

        first_line = 0
        if num_lines is not None and max_lines > num_lines:
            first_line = max_lines - num_lines
            logs = logs[first_line:]
        self._send_comm_message('job_logs', {
            'job_id': job_id,
            'first': first_line,
            'max_lines': max_lines,
            'lines': logs,
            'latest': True})

    def _get_job_logs(self, job_id, parent_job_id=None, first_line=0, num_lines=None):
        # if parent_job is real, and job_id (the child) is not, just add it to the
        # list of running jobs and work as normal.

        job = self.get_job(job_id)
        if job is None:
            raise ValueError('job "{}" not found!'.format(job_id))

        (max_lines, log_slice) = job.log(first_line=first_line, num_lines=num_lines)
        self._send_comm_message('job_logs', {'job_id': job_id, 'first': first_line, 'max_lines': max_lines, 'lines': log_slice, 'latest': False})

    def delete_job(self, job_id, parent_job_id=None):
        """
        If the job_id doesn't exist, raises a ValueError.
        Attempts to delete a job, and cancels it first. If the job cannot be canceled,
        raises an exception. If it can be canceled but not deleted, it gets canceled, then raises
        an exception.
        """
        if job_id is None:
            raise ValueError('Job id required for deletion!')
        if not parent_job_id and job_id not in self._running_jobs:
            self._send_comm_message('job_does_not_exist', {'job_id': job_id, 'source': 'delete_job'})
            return
            # raise ValueError('Attempting to cancel a Job that does not exist!')

        try:
            self.cancel_job(job_id, parent_job_id=parent_job_id)
        except Exception:
            raise

        try:
            clients.get('user_and_job_state').delete_job(job_id)
        except Exception:
            raise

        if job_id in self._running_jobs:
            del self._running_jobs[job_id]
        if job_id in self._completed_job_states:
            del self._completed_job_states[job_id]
        self._send_comm_message('job_deleted', {'job_id': job_id})

    def cancel_job(self, job_id, parent_job_id=None):
        """
        Cancels a running job, placing it in a canceled state.
        Does NOT delete the job.
        Raises an exception if the current user doesn't have permission to cancel the job.
        """

        if job_id is None:
            raise ValueError('Job id required for cancellation!')
        if not parent_job_id and job_id not in self._running_jobs:
            self._send_comm_message('job_does_not_exist', {'job_id': job_id, 'source': 'cancel_job'})
            return

        try:
            state = self._get_job_state(job_id, parent_job_id=parent_job_id)
            if state.get('canceled', 0) == 1 or state.get('finished', 0) == 1:
                # It's already finished, don't try to cancel it again.
                return
        except Exception as e:
            raise ValueError('Unable to get Job state')

        # Stop updating the job status while we try to cancel.
        # Also, set it to have a special state of 'canceling' while we're doing the cancel
        if not parent_job_id:
            is_refreshing = self._running_jobs[job_id].get('refresh', 0)
            self._running_jobs[job_id]['refresh'] = 0
            self._running_jobs[job_id]['canceling'] = True
        try:
            clients.get('job_service').cancel_job({'job_id': job_id})
        except Exception as e:
            new_e = transform_job_exception(e)
            error = {
                'error': 'Unable to get cancel job',
                'message': getattr(new_e, 'message', 'Unknown reason'),
                'code': getattr(new_e, 'code', -1),
                'source': getattr(new_e, 'source', 'jobmanager'),
                'name': getattr(new_e, 'name', type(e).__name__),
                'request_type': 'cancel_job',
                'job_id': job_id
            }
            self._send_comm_message('job_comm_error', error)
            raise(e)
        finally:
            if not parent_job_id:
                self._running_jobs[job_id]['refresh'] = is_refreshing
                del self._running_jobs[job_id]['canceling']

        # Rather than a separate message, how about triggering a job-status message:
        self._lookup_job_status(job_id, parent_job_id=parent_job_id)

    def _send_comm_message(self, msg_type, content):
        """
        Sends a ipykernel.Comm message to the KBaseJobs channel with the given msg_type
        and content. These just get encoded into the message itself.
        """
        msg = {
            'msg_type': msg_type,
            'content': content
        }
        if self._comm is None:
            self._comm = Comm(target_name='KBaseJobs', data={})
            self._comm.on_msg(self._handle_comm_message)
        self._comm.send(msg)

    def _get_all_job_states(self, job_ids=None):
        """
        Returns the state for all running jobs.
        Returns a list where each element has this structure:
        {
            cell_id: (optional) id of the cell that spawned the job
            run_id: (optional) id of the job run
            awe_job_state: string
            creation_time: timestamp (ms since epoch)
            finished: 0/1
            job_id: string
            job_state: string
            status: [ timestamp, _, _, _, _, _, _ ], (7-tuple)
            sub_jobs: [],
            ujs_url: string,
            child_jobs: []
        }
        """
        # 1. Get list of ids
        if job_ids is None:
            job_ids = self._running_jobs.keys()
        # 1.5 Go through job ids and remove ones that aren't found.
        job_ids = [j for j in job_ids if j in self._running_jobs]
        # 2. Foreach, check if in completed cache. If so, grab the status. If not, enqueue id
        # for batch lookup.
        job_states = dict()
        jobs_to_lookup = list()
        for job_id in job_ids:
            if job_id in self._completed_job_states:
                job_states[job_id] = dict(self._completed_job_states[job_id])
            else:
                jobs_to_lookup.append(job_id)
        # 3. Lookup those jobs what need it. Cache 'em as we go, if finished.
        try:
            fetched_states = clients.get('job_service').check_jobs({'job_ids': jobs_to_lookup})
            fetched_states = sanitize_all_states(fetched_states)
        except Exception as e:
            kblogging.log_event(self._log, 'get_all_job_states_error', {'err': str(e)})
            return {}

        error_states = fetched_states.get('check_error', {})
        fetched_states = fetched_states.get('job_states', {})
        for job_id in jobs_to_lookup:
            if job_id in fetched_states:
                state = fetched_states[job_id]
                state['cell_id'] = self._running_jobs[job_id]['job'].cell_id
                state['run_id'] = self._running_jobs[job_id]['job'].run_id
                if state.get('finished', 0) == 1:
                    self._completed_job_states[state['job_id']] = dict(state)
                job_states[state['job_id']] = state
            elif job_id in error_states:
                error = error_states[job_id]
                job_states[state['job_id']] = {'lookup_error': error}

        return job_states

    def _get_job_state(self, job_id, parent_job_id=None):
        if parent_job_id is not None:
            self._verify_job_parentage(parent_job_id, job_id)
        if job_id is None or job_id not in self._running_jobs:
            raise ValueError('job_id {} not found'.format(job_id))
        if job_id in self._completed_job_states:
            return dict(self._completed_job_states[job_id])
        state = self._running_jobs[job_id]['job'].state()
        if state.get('finished', 0) == 1:
            self._completed_job_states[job_id] = dict(state)
        return dict(state)
