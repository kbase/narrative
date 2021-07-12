import copy
import threading
from typing import List
from ipykernel.comm import Comm
import biokbase.narrative.jobs.jobmanager as jobmanager
from biokbase.narrative.exception_util import JobException, NarrativeException
from biokbase.narrative.common import kblogging

UNKNOWN_REASON = "Unknown reason"


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

    Each JobRequest has at most one of a job_id or job_id_list. If the job comm
    channel request data is received with a job_id_list, it may be split up
    into multiple JobRequests. Likewise, if the job comm channel request data
    is received with a job_id, a JobRequest may be created with a job_id_list
    containing that job_id

    Provides 4 attributes:
    msg_id: str - a unique string (within reason) for a message id.
    request: str - a string for the request sent from the front end. This isn't
        strictly controlled here, but by JobComm._handle_comm_message.
    job_id: str or job_id_list: list - (optional) - a string or strings for
        the job id, as set by EE2.
    rq_data: dict - the actual data of the request. Containers the request type,
        job_id (sometimes), and other information that can be specific for
        each request.
    """

    # request types either require a job_id, a job_id_list, or neither
    REQUIRE_JOB_ID = [
        "job_info",
        "job_status",
        "start_job_update",
        "stop_job_update",
        "cancel_job",
        "job_logs",
        "job_logs_latest",
    ]
    REQUIRE_JOB_ID_LIST = ["retry_job"]

    def __init__(self, rq: dict):
        self.msg_id = rq.get("msg_id")  # might be useful later?
        self.rq_data = rq.get("content", {}).get("data")
        if self.rq_data is None:
            raise ValueError("Improperly formatted job channel message!")
        self.request = self.rq_data.get("request_type")
        if self.request is None:
            raise ValueError("Missing request type in job channel message!")
        self.job_id = self.rq_data.get("job_id")
        self.job_id_list = self.rq_data.get("job_id_list")

    @classmethod
    def _convert_to_using_job_id_list(cls, msg: dict) -> "JobRequest":
        """
        If a message comes with job_id instead of job_id_list, it may be converted
        into a JobRequest with a job_id_list
        """
        msg["content"]["data"]["job_id_list"] = [msg["content"]["data"]["job_id"]]
        del msg["content"]["data"]["job_id"]
        return cls(msg)

    @classmethod
    def _split_request_by_job_id(cls, msg: dict) -> List["JobRequest"]:
        """
        If a message comes with job_id_list instead of job_id, it may be converted
        into multiple JobRequest objects each having a single job_id
        """
        job_id_list = msg["content"]["data"]["job_id_list"]
        if not isinstance(job_id_list, list):
            raise ValueError("List expected for job_id_list")
        insts = []
        for job_id in job_id_list:
            msg_ = copy.deepcopy(msg)
            msg_["content"]["data"]["job_id"] = job_id
            del msg_["content"]["data"]["job_id_list"]
            insts.append(cls(msg_))
        return insts

    @classmethod
    def translate(cls, msg: dict) -> List["JobRequest"]:
        req_type = msg.get("content", {}).get("data", {}).get("request_type")
        job_id = msg.get("content", {}).get("data", {}).get("job_id")
        job_id_list = msg.get("content", {}).get("data", {}).get("job_id_list")

        if job_id is not None and job_id_list is not None:
            raise ValueError("Both job_id and job_id_list present")

        if job_id_list is not None and req_type in cls.REQUIRE_JOB_ID:
            requests = cls._split_request_by_job_id(msg)
        elif job_id is not None and req_type in cls.REQUIRE_JOB_ID_LIST:
            requests = [cls._convert_to_using_job_id_list(msg)]
        else:
            requests = [cls(msg)]
        return requests


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

    Allowed messages:
    * all_status - return job state for all jobs in this Narrative.
    * job_status - return the job state for a single job (requires a job_id)
    * job_info - return basic job info for a single job (requires a job_id)
    * start_update_loop - starts a looping thread that runs returns all job info
        for running jobs
    * stop_update_loop - stops the automatic update loop
    * start_job_update - tells the update loop to include a job when updating (requires a job_id)
    * stop_job_update - has the update loop not include a job when updating (requires a job_id)
    * cancel_job - cancels a running job, if it hasn't otherwise terminated (requires a job_id)
    * job_logs - sends job logs back over the comm channel (requires a job id and first line)
    * job_logs_latest - sends the most recent job logs over the comm channel (requires a job_id)
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
                "retry_job": self._retry_jobs,
                "job_logs": self._get_job_logs,
                "job_logs_latest": self._get_job_logs,
            }

    def _verify_job_id(self, req: JobRequest) -> None:
        if not req.job_id:
            self.send_error_message("job_does_not_exist", req)
            raise ValueError(f"Job id required to process {req.request} request")

    def _verify_job_id_list(self, req: JobRequest) -> None:
        if not isinstance(req.job_id_list, list):
            raise ValueError("List expected for job_id_list")
        req.job_id_list[:] = [job_id for job_id in req.job_id_list if job_id]
        if len(req.job_id_list) == 0:
            self.send_error_message("job_does_not_exist", req)
            raise ValueError("No valid job ids")

    def start_job_status_loop(self, *args, **kwargs) -> None:
        """
        Starts the job status lookup loop. This runs every 10 seconds.
        This has the bare *args and **kwargs to handle the case where this comes in as a job
        channel request (gets a JobRequest arg), or has the "init_jobs" kwarg.

        If init_jobs=True, this attempts to reinitialize the JobManager's list of known jobs
        from the workspace.
        """
        self._running_lookup_loop = True
        if kwargs.get("init_jobs", False):
            try:
                self._jm.initialize_jobs()
            except Exception as e:
                error = {
                    "error": "Unable to get initial jobs list",
                    "message": getattr(e, "message", UNKNOWN_REASON),
                    "code": getattr(e, "code", -1),
                    "source": getattr(e, "source", "jobmanager"),
                    "name": getattr(e, "name", type(e).__name__),
                    "service": "execution_engine2",
                }
                self.send_comm_message("job_init_err", error)
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
        except ValueError:
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
        req = JobRequest(
            {"content": {"data": {"request_type": "job_status", "job_id": job_id}}}
        )
        return self._lookup_job_state(req)

    def _lookup_job_state(self, req: JobRequest) -> dict:
        """
        Look up job state.
        """
        self._verify_job_id(req)
        try:
            job_state = self._jm.get_job_state(req.job_id)
            self.send_comm_message("job_status", job_state)
            return job_state
        except ValueError:
            # kblogging.log_event(self._log, "lookup_job_state_error", {"err": str(e)})
            self.send_error_message("job_does_not_exist", req)
            self.send_comm_message(
                "job_status",
                {"state": {"job_id": req.job_id, "status": "does_not_exist"}},
            )
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
        except ValueError:
            self.send_error_message("job_does_not_exist", req)
            raise
        except NarrativeException as e:
            self.send_error_message(
                "job_comm_error",
                req,
                {
                    "error": "Unable to cancel job",
                    "message": getattr(e, "message", UNKNOWN_REASON),
                    "code": getattr(e, "code", -1),
                    "name": getattr(e, "name", type(e).__name__),
                },
            )
            raise
        self._lookup_job_state(req)

    def _retry_jobs(self, req: JobRequest) -> None:
        self._verify_job_id_list(req)
        try:
            retry_results = self._jm.retry_jobs(req.job_id_list)
            self.send_comm_message("jobs_retried", retry_results)
            self.send_comm_message(
                "new_job",
                {
                    "job_id_list": [
                        job["retry_id"] for job in retry_results if job["retry_id"]
                    ]
                },
            )
        except JobException as e:
            self.send_error_message(
                "job_does_not_exist", req, {"job_id_list": e.err_job_ids}
            )
            raise
        except NarrativeException as e:
            self.send_error_message(
                "job_comm_error",
                req,
                {
                    "error": "Unable to retry job(s)",
                    "message": getattr(e, "message", UNKNOWN_REASON),
                    "code": getattr(e, "code", -1),
                    "name": getattr(e, "name", type(e).__name__),
                },
            )
            raise

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
                req.job_id,
                num_lines=num_lines,
                first_line=first_line,
                latest_only=latest_only,
            )
            self.send_comm_message(
                "job_logs",
                {
                    "job_id": req.job_id,
                    "first": first_line,
                    "max_lines": max_lines,
                    "lines": logs,
                    "latest": latest_only,
                },
            )
        except ValueError:
            self.send_error_message("job_does_not_exist", req)
            raise
        except NarrativeException as e:
            self.send_error_message(
                "job_comm_error",
                req,
                {
                    "error": "Unable to retrieve job logs",
                    "message": getattr(e, "message", UNKNOWN_REASON),
                    "code": getattr(e, "code", -1),
                    "name": getattr(e, "name", type(e).__name__),
                },
            )
            raise

    def _handle_comm_message(self, msg: dict) -> None:
        """
        Handles comm messages that come in from the other end of the KBaseJobs channel.
        Messages get translated into one or more JobRequest objects, which are then
        passed to the right handler, based on the request.

        A handler dictionary is created on JobComm creation.

        Any unknown request is returned over the channel as a job_comm_error, and a
        ValueError is raised.
        """
        requests = JobRequest.translate(msg)
        for request in requests:
            kblogging.log_event(
                self._log, "handle_comm_message", {"msg": request.request}
            )
            if request.request in self._msg_map:
                self._msg_map[request.request](request)
            else:
                self.send_comm_message(
                    "job_comm_error",
                    {"message": "Unknown message", "request_type": request.request},
                )
                raise ValueError(f"Unknown KBaseJobs message '{request.request}'")

    def send_comm_message(self, msg_type: str, content: dict) -> None:
        """
        Sends a ipykernel.Comm message to the KBaseJobs channel with the given msg_type
        and content. These just get encoded into the message itself.
        """
        msg = {"msg_type": msg_type, "content": content}
        self._comm.send(msg)

    def send_error_message(
        self, err_type: str, req: JobRequest, content: dict = None
    ) -> None:
        """
        Sends a comm message over the KBaseJobs channel as an error. This will have msg_type as
        whatever the error type is, and include the original request in the message content as
        "source".

        This sends a packet that looks like:
        {
            job_id or job_id_list: (string or list of strings, if relevant),
            source: the original message that spawned the error,
            other fields about the error, dependent on the content.
        }
        """
        error_content = {"source": req.request}
        if req.job_id_list is not None:
            error_content["job_id_list"] = req.job_id_list
        else:
            error_content["job_id"] = req.job_id
        if content is not None:
            error_content.update(content)
        self.send_comm_message(err_type, error_content)
