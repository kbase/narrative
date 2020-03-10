import threading
from ipykernel.comm import Comm
import biokbase.narrative.jobs.jobmanager as jobmanager
from biokbase.narrative.exception_util import NarrativeException
from biokbase.narrative.common import kblogging


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
    _log = kblogging.get_logger(__name__)

    def __new__(cls):
        if JobComm.__instance is None:
            JobComm.__instance = object.__new__(cls)
        return JobComm.__instance

    def __init__(self):
        if self._comm is None:
            self._comm = Comm(target_name="KBaseJobs", data={})
            self._comm.on_msg(self._handle_comm_message)
        if self._jm is None:
            self._jm = jobmanager.JobManager()
        if self._msg_map is None:
            self._msg_map = {
               "all_status": self._lookup_all_job_states,
               "job_status": self._lookup_job_state,
               "job_info": self._lookup_job_info,
               "start_update_loop": self.start_job_status_loop,
               "stop_update_loop": self.stop_job_status_loop,
               "start_job_update": self._modify_job_update,
               "stop_job_update": self._modify_job_update,
               "cancel_job": self._cancel_job,
               "job_logs": self._get_job_logs,
               "job_logs_latest": self._get_job_logs
            }

    def _verify_job_id(self, req: JobRequest) -> None:
        if req.job_id is None:
            self.send_error_message("job_does_not_exist", req)
            raise ValueError(f"Job id required to process {req.request} request")

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

    def send_error_message(self, err_type: str, req: JobRequest, content: dict = None) -> None:
        error_content = {
            "job_id": req.job_id,
            "source": req.request
        }
        if content is not None:
            error_content.update(content)
        self.send_comm_message(err_type, error_content)

    def start_job_status_loop(self, *args, **kwargs) -> None:
        """
        Starts the job status lookup loop. This runs every 10 seconds.
        """
        self._running_lookup_loop = True
        if self._lookup_timer is None:
            self._lookup_job_status_loop()

    def stop_job_status_loop(self, *args, **kwargs) -> None:
        """
        Stops the job status lookup loop if it's running. Otherwise, this effectively
        does nothing.
        """
        if self._lookup_timer:
            self._lookup_timer.cancel()
            self._lookup_timer = None
        self._running_lookup_loop = False

    def _lookup_job_status_loop(self) -> None:
        """
        Run a loop that will look up job info. After running, this spawns a Timer thread on a 10
        second loop to run itself again.
        """
        job_statuses = self._lookup_all_job_states(None)
        if len(job_statuses) == 0 or not self._running_lookup_loop:
            self.stop_job_status_loop()
        else:
            self._lookup_timer = threading.Timer(10, self._lookup_job_status_loop)
            self._lookup_timer.start()

    def _lookup_all_job_states(self, req: JobRequest) -> dict:
        """
        Fetches status of all jobs in the current workspace and sends them to the front end.
        req can be None, as it's not used.
        """
        job_statuses = self._jm.lookup_all_job_states(ignore_refresh_flag=True)
        self.send_comm_message("job_status_all", job_statuses)
        return job_statuses

    def _lookup_job_info(self, req: JobRequest) -> dict:
        """
        Looks up job info. This is just some high-level generic information about the running
        job, including the app id, name, and job parameters.
        :param req: a JobRequest with the job_id of interest
        :returns: a dict with the following keys:
            - app_id - str - module/name,
            - app_name - str - name of the app as it shows up in the Narrative interface
            - job_id - str - just re-reporting the id string
            - job_params - dict - the params that were passed to that particular job
        """
        self._verify_job_id(req)
        try:
            job_info = self._jm.lookup_job_info(req.job_id)
            self.send_comm_message("job_info", job_info)
            return job_info
        except ValueError as e:
            self.send_error_message("job_does_not_exist", req)
            raise

    def lookup_job_state(self, job_id: str) -> dict:
        """
        This differs from the _lookup_job_state (underscored version) in that
        it just takes a job_id string, not a JobRequest. It, however, functions the
        same, by creating a JobRequest and forwarding it to the request version.

        Therefore, it sends the job message to the browser over the right channel,
        and also returns the job state (or raises a ValueError if not found).
        """
        req = JobRequest({
            "content": {
                "data": {
                    "request_type": "job_status",
                    "job_id": job_id
                }
            }
        })
        return self._lookup_job_state(req)

    def _lookup_job_state(self, req: JobRequest) -> dict:
        """
        Look up job state.
        """
        self._verify_job_id(req)
        try:
            job_state = self._jm.get_job_state(req.job_id)
            self.send_comm_message("job_status", {"state": job_state})
            return job_state
        except ValueError as e:
            # kblogging.log_event(self._log, "lookup_job_state_error", {"err": str(e)})
            self.send_error_message("job_does_not_exist", req)
            raise

    def _modify_job_update(self, req: JobRequest) -> None:
        """
        Modifies how many things want to listen to a job update.
        If this is a request to start a job update, then this starts the update loop that
        returns update messages across the job channel.
        If this is a request to stop a job update, then this sends that request to the
        JobManager, which might have the side effect of shutting down the update loop if there's
        no longer anything requesting job status.

        If the given job_id in the request doesn't exist in the current Narrative, or is None,
        this raises a ValueError.
        """
        self._verify_job_id(req)
        update_adjust = 1 if req.request == "start_job_update" else -1
        self._jm.modify_job_refresh(req.job_id, update_adjust)
        if update_adjust == 1:
            self.start_job_status_loop()

    def _cancel_job(self, req: JobRequest) -> None:
        """
        This cancels a running job. If the job has already been canceled, then nothing is
        done.
        If the job doesn't exist (or the job id in the request is None), this raises a ValueError.
        If there's an error while attempting to cancel, this raises a NarrativeError.
        In the end, after a successful cancel, this finishes up by fetching and returning the
        job state with the new status.
        """
        self._verify_job_id(req)
        try:
            self._jm.cancel_job(req.job_id)
        except ValueError as e:
            self.send_error_message("job_does_not_exist", req)
            raise
        except NarrativeException as e:
            self.send_error_message("job_comm_error", req, {
                "error": "Unable to cancel job",
                "message": getattr(e, "message", "Unknown reason"),
                "code": getattr(e, "code", -1),
                "name": getattr(e, "name", type(e).__name__)
            })
            raise
        self._lookup_job_state(req)

    def _get_job_logs(self, req: JobRequest) -> None:
        """
        This returns a set of job logs based on the info in the request.
        """
        self._verify_job_id(req)
        first_line = req.rq_data.get("first_line", 0)
        num_lines = req.rq_data.get("num_lines", None)
        latest_only = req.request == "job_logs_latest"
        try:
            (first_line, max_lines, logs) = self._jm.get_job_logs(
                req.job_id, num_lines=num_lines, first_line=first_line, latest_only=latest_only)
            self.send_comm_message("job_logs", {
                "job_id": req.job_id,
                "first": first_line,
                "max_lines": max_lines,
                "lines": logs,
                "latest": latest_only
            })
        except ValueError as e:
            self.send_error_message("job_does_not_exist", req)
            raise
        except NarrativeException as e:
            self.send_error_message("job_comm_error", req, {
                "error": "Unable to retrieve job logs",
                "message": getattr(e, "message", "Unknown reason"),
                "code": getattr(e, "code", -1),
                "name": getattr(e, "name", type(e).__name__)
            })
            raise

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
        kblogging.log_event(self._log, "handle_comm_message", {"msg": request.request})
        if request.request in self._msg_map:
            self._msg_map[request.request](request)
        else:
            self.send_comm_message("job_comm_error", {"message": "Unknown message", "request_type": request.request})
            raise ValueError(f"Unknown KBaseJobs message '{request.request}'")
