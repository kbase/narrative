import threading
from ipykernel.comm import Comm
import biokbase.narrative.jobs.jobmanager as jobmanager


class JobRequest:
    """
    A small wrapper for job comm channel request data.
    This generally comes in the form of a packet from the kernel Comm object.
    It's expected to be a dict of the format:
    {
        content: {
            'comm_id': <some string>,
            'data': {
                'request_type': effectively, the function requested.
            }
        }
    }

    This little wrapper fills 2 roles:
    1. It validates that the packet is correct and has some expected values.
    2. If there's a job_id field, it makes sure that it's real (by asking the
       JobManager - avoids a bunch of duplicate validation code)

    Provides 4 attributes:
    msg_id: str - a unique string (within reason) for a message id.
    request: str - a string for the request sent from the front end. This isn't
        strictly controlled here, but by JobComm._handle_comm_message.
    job_id: str - (optional) - a string for the job id, as set by EE2.
    rq_data: dict - the actual data of the request. Containers the request type,
        job_id (sometimes), and other information that can be specific for
        each request.
    """
    def __init__(self, rq: dict):
        self.msg_id = rq.get("msg_id")  # might be useful later?
        self.rq_data = rq.get("content", {}).get("data")
        if self.rq_data is None:
            raise ValueError("Improperly formatted job channel message!")
        self.request = self.rq_data.get("request_type")
        if self.request is None:
            raise ValueError("Missing request type in job channel message!")
        self.job_id = self.rq_data.get("job_id")


class JobComm:
    """
    The main JobComm channel. This is the kernel-side of the connection, and routes
    requests for job information from various app cells (or the front end in general)
    to the right function.

    This has a handle on the JobManager, which does the work of fetching job information
    and statuses.

    The JobComm officially exposes the channel for other things to use. Anything that
    needs to send messages about Jobs to the front end should use JobComm.send_comm_message.

    It also maintains the lookup loop thread. This is a threading.Timer that, after
    some interval, will lookup the status of all running jobs. If there are no jobs to
    look up, this cancels itself.
    """

    # An instance of this class. It's meant to be a singleton, so this just gets created and
    # returned once.
    __instance = None

    # The kernel job comm channel that talks to the front end.
    _comm = None

    # The JobManager that actually manages things.
    _jm = None

    _msg_map = None
    _running_lookup_loop = False
    _lookup_timer = None

    def __new__(cls):
        if JobComm.__instance is None:
            JobComm.__instance = object.__new__(cls)
        return JobComm.__instance

    def __init__(self):
        if self._comm is None:
            self._comm = Comm(target_name='KBaseJobs', data={})
            self._comm.on_msg(self._handle_comm_message)
        if self._jm is None:
            self._jm = jobmanager.JobManager()
        if self._msg_map is None:
            self._msg_map = {
               "all_status": self.lookup_all_job_states
            }

    def send_comm_message(self, msg_type: str, content: dict) -> None:
        """
        Sends a ipykernel.Comm message to the KBaseJobs channel with the given msg_type
        and content. These just get encoded into the message itself.
        """
        msg = {
            "msg_type": msg_type,
            "content": content
        }
        self._comm.send(msg)

    def start_job_status_loop(self) -> None:
        self._running_lookup_loop = True
        if self._lookup_timer is None:
            self._lookup_job_status_loop()

    def stop_job_status_loop(self) -> None:
        if self._lookup_timer:
            self._lookup_timer.cancel()
            self._lookup_timer = None
        self._running_lookup_loop = False

    def _lookup_job_status_loop(self) -> None:
        """
        Run a loop that will look up job info. After running, this spawns a Timer thread on a 10
        second loop to run itself again.
        """
        job_statuses = self._jm.lookup_all_job_states()
        self.send_comm_message("job_status_all", job_statuses)
        if len(job_statuses) == 0 or not self._running_lookup_loop:
            self.stop_job_status_loop()
        else:
            self._lookup_timer = threading.Timer(10, self._lookup_job_status_loop)
            self._lookup_timer.start()

    def lookup_all_job_states(self, msg: dict, send_message=False) -> None:
        """
        Fetches status of all jobs in the current workspace and sends them to the front end.

        """
        job_statuses = self._jm.lookup_all_job_states(ignore_refresh_flag=True)
        if send_message:
            self.send_comm_message("job_status_all", job_statuses)
        return job_statuses

    def _handle_comm_message(self, msg: dict) -> None:
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
        request = JobRequest(msg)
        if request.request in self._msg_map:
            self._msg_map[request.request](request, True)
        else:
            self.send_comm_message("job_comm_error", {"message": "Unknown message", "request_type": request.request})
            raise ValueError(f"Unknown KBaseJobs message '{request.request}'")

        # if 'request_type' in msg_data and msg_data['request_type'] in self._msg_map:
        #     self._msg_map[]

        #     r_type = msg_data['request_type']
        #     job_id = msg_data.get('job_id', None)
        #     parent_job_id = msg_data.get('parent_job_id', None)
        #     if job_id is not None and job_id not in self._running_jobs and not parent_job_id:
        #         # If it's not a real job, just silently ignore the request.
        #         # Unless it has a parent job id, then its a child job, so things get muddled. If there's 100+ child jobs,
        #         # then this might get tricky to look up all of them. Let it pass through and fail if it's not real.
        #         #
        #         # TODO: perhaps we should implement request/response here. All we really need is to thread a message
        #         # id through
        #         self.send_comm_message('job_does_not_exist', {'job_id': job_id, 'request_type': r_type})
        #         return
        #     elif parent_job_id is not None:
        #         try:
        #             self._verify_job_parentage(parent_job_id, job_id)
        #         except ValueError as e:
        #             self.send_comm_message('job_does_not_exist', {'job_id': job_id, 'parent_job_id': parent_job_id, 'request_type': r_type})

        #     if r_type == 'all_status':
        #         all_status = self._jm.lookup_all_job_states()
        #         self.send_comm_message("job_status_all", all_status)

            # elif r_type == 'job_status':
            #     if job_id is not None:
            #         self._lookup_job_status(job_id, parent_job_id=parent_job_id)

            # elif r_type == 'job_info':
            #     if job_id is not None:
            #         self._lookup_job_info(job_id, parent_job_id=parent_job_id)

            # elif r_type == 'stop_update_loop':
            #     self.cancel_job_lookup_loop()

            # elif r_type == 'start_update_loop':
            #     self._start_job_status_loop()

            # elif r_type == 'stop_job_update':
            #     if job_id is not None:
            #         if self._running_jobs[job_id]['refresh'] > 0:
            #             self._running_jobs[job_id]['refresh'] -= 1

            # elif r_type == 'start_job_update':
            #     if job_id is not None:
            #         self._running_jobs[job_id]['refresh'] += 1
            #         self._start_job_status_loop()

            # elif r_type == 'delete_job':
            #     if job_id is not None:
            #         try:
            #             self.delete_job(job_id, parent_job_id=parent_job_id)
            #         except Exception as e:
            #             self.send_comm_message('job_comm_error', {'message': str(e), 'request_type': r_type, 'job_id': job_id})

            # elif r_type == 'cancel_job':
            #     if job_id is not None:
            #         try:
            #             self.cancel_job(job_id, parent_job_id=parent_job_id)
            #         except Exception as e:
            #             self.send_comm_message('job_comm_error', {'message': str(e), 'request_type': r_type, 'job_id': job_id})

            # elif r_type == 'job_logs':
            #     if job_id is not None:
            #         first_line = msg_data.get('first_line', 0)
            #         num_lines = msg_data.get('num_lines', None)
            #         self._get_job_logs(job_id, parent_job_id=parent_job_id, first_line=first_line, num_lines=num_lines)
            #     else:
            #         raise ValueError('Need a job id to fetch jobs!')

            # elif r_type == 'job_logs_latest':
            #     if job_id is not None:
            #         num_lines = msg_data.get('num_lines', None)
            #         try:
            #             self._get_latest_job_logs(job_id, parent_job_id=parent_job_id, num_lines=num_lines)
            #         except Exception as e:
            #             self.send_comm_message('job_comm_error', {
            #                 'job_id': job_id,
            #                 'message': str(e),
            #                 'request_type': r_type})
            #     else:
            #         raise ValueError('Need a job id to fetch jobs!')

