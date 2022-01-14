import copy
import threading
from typing import List, Union
from ipykernel.comm import Comm
from biokbase.narrative.jobs.jobmanager import JobManager
from biokbase.narrative.exception_util import NarrativeException, JobRequestException
from biokbase.narrative.common import kblogging

UNKNOWN_REASON = "Unknown reason"

JOB_NOT_PROVIDED_ERR = "job_id not provided"
JOBS_NOT_PROVIDED_ERR = "job_id_list not provided"
CELLS_NOT_PROVIDED_ERR = "cell_id_list not provided"
BATCH_NOT_PROVIDED_ERR = "batch_id not provided"
ONE_INPUT_TYPE_ONLY_ERR = "Please provide one of job_id, job_id_list, or batch_id"

INVALID_REQUEST_ERR = "Improperly formatted job channel message!"
MISSING_REQUEST_TYPE_ERR = "Missing request type in job channel message!"

LOOKUP_TIMER_INTERVAL = 5

JOB_ID = "job_id"
JOB_ID_LIST = "job_id_list"
CELL_ID_LIST = "cell_id_list"
BATCH_ID = "batch_id"

# message types
CANCEL = "cancel_job"
CELL_JOB_STATUS = "cell_job_status"
INFO = "job_info"
LOGS = "job_logs"
RETRY = "retry_job"
START_UPDATE = "start_job_update"
STATUS = "job_status"
STATUS_ALL = "job_status_all"
STOP_UPDATE = "stop_job_update"
# these message types are for outgoing messages only
ERROR = "job_error"
NEW = "new_job"
RUN_STATUS = "run_status"

REQUESTS = [
    CANCEL,
    CELL_JOB_STATUS,
    INFO,
    LOGS,
    RETRY,
    START_UPDATE,
    STATUS,
    STATUS_ALL,
    STOP_UPDATE,
]


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
                'job_id': optional
                'job_id_list': optional
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

    Provides the following attributes:
    raw_request     dict    the unedited request received by the job comm
    msg_id          str     unique message id
    request_type    str     the function to perform. This isn't
        strictly controlled here, but by JobComm._handle_comm_message.
    rq_data         dict    the actual data of the request. Contains the request
        type and other parameters specific to the function to be performed

    Optional:
    job_id          str
    job_id_list     list(str)
    batch_id        str

    The IDs of the job(s) to perform the function on.

    """

    def __init__(self, rq: dict):
        self.raw_request = copy.deepcopy(rq)
        self.msg_id = rq.get("msg_id")  # might be useful later?
        self.rq_data = rq.get("content", {}).get("data")
        if self.rq_data is None:
            raise JobRequestException(INVALID_REQUEST_ERR)
        self.request_type = self.rq_data.get("request_type")
        if self.request_type is None:
            raise JobRequestException(MISSING_REQUEST_TYPE_ERR)

        input_type_count = 0
        for input_type in [JOB_ID, JOB_ID_LIST, BATCH_ID]:
            if input_type in self.rq_data:
                input_type_count += 1
        if input_type_count > 1:
            raise JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)

    @property
    def job_id(self):
        if JOB_ID in self.rq_data:
            return self.rq_data[JOB_ID]
        raise JobRequestException(JOB_NOT_PROVIDED_ERR)

    @property
    def job_id_list(self):
        if JOB_ID_LIST in self.rq_data:
            return self.rq_data[JOB_ID_LIST]
        if JOB_ID in self.rq_data:
            return [self.rq_data[JOB_ID]]
        raise JobRequestException(JOBS_NOT_PROVIDED_ERR)

    @property
    def batch_id(self):
        if BATCH_ID in self.rq_data:
            return self.rq_data[BATCH_ID]
        raise JobRequestException(BATCH_NOT_PROVIDED_ERR)

    def has_batch_id(self):
        return BATCH_ID in self.rq_data

    @property
    def cell_id_list(self):
        if CELL_ID_LIST in self.rq_data:
            return self.rq_data[CELL_ID_LIST]
        raise JobRequestException(CELLS_NOT_PROVIDED_ERR)


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
    * job_status - return the job state for a single job (requires a job_id)
    * job_status_all - return job state for all jobs in this Narrative.
    * job_info - return basic job info for a single job (requires a job_id)
    * start_job_update - tells the update loop to include a job when updating (requires a job_id)
    * stop_job_update - has the update loop not include a job when updating (requires a job_id)
    * cancel_job - cancels a running job, if it hasn't otherwise terminated (requires a job_id)
    * retry_job - retries a job (requires a job_id)
    * job_logs - sends job logs back over the comm channel (requires a job id)
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
            self._jm = JobManager()
        if self._msg_map is None:
            self._msg_map = {
                CANCEL: self._cancel_jobs,
                CELL_JOB_STATUS: self._lookup_job_states_by_cell_id,
                INFO: self._get_job_info,
                LOGS: self._get_job_logs,
                RETRY: self._retry_jobs,
                START_UPDATE: self._modify_job_updates,
                STATUS: self._lookup_job_states,
                STATUS_ALL: self._lookup_all_job_states,
                STOP_UPDATE: self._modify_job_updates,
            }

    def _get_job_ids(self, req: JobRequest = None):
        if req.has_batch_id():
            return self._jm.update_batch_job(req.batch_id)

        try:
            return req.job_id_list
        except Exception:
            raise JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)

    def start_job_status_loop(
        self,
        init_jobs: bool = False,
        cell_list: List[str] = None,
    ) -> None:
        """
        Starts the job status lookup loop. This runs every LOOKUP_TIMER_INTERVAL seconds.

        :param init_jobs: If init_jobs=True, this attempts to (re-)initialize
            the JobManager's list of known jobs from the workspace.
        :param cell_list: from FE, the list of extant cell IDs
        """
        self._running_lookup_loop = True
        if init_jobs:
            try:
                self._jm.initialize_jobs(cell_list)
            except Exception as e:
                error = {
                    "error": "Unable to get initial jobs list",
                    "message": getattr(e, "message", UNKNOWN_REASON),
                    "code": getattr(e, "code", -1),
                    "source": getattr(e, "source", "jobmanager"),
                    "name": getattr(e, "name", type(e).__name__),
                }
                self.send_comm_message(ERROR, error)
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
        Run a loop that will look up job info. After running, this spawns a Timer thread on
        a loop to run itself again. LOOKUP_TIMER_INTERVAL sets the frequency at which the loop runs.
        """
        all_job_states = self._lookup_all_job_states()
        if len(all_job_states) == 0 or not self._running_lookup_loop:
            self.stop_job_status_loop()
        else:
            self._lookup_timer = threading.Timer(
                LOOKUP_TIMER_INTERVAL, self._lookup_job_status_loop
            )
            self._lookup_timer.start()

    def _lookup_all_job_states(self, req: JobRequest = None) -> dict:
        """
        Fetches status of all jobs in the current workspace and sends them to the front end.
        req can be None, as it's not used.
        """
        all_job_states = self._jm.lookup_all_job_states(ignore_refresh_flag=True)
        self.send_comm_message(STATUS_ALL, all_job_states)
        return all_job_states

    def _lookup_job_states_by_cell_id(self, req: JobRequest = None) -> dict:
        """
        Fetches status of all jobs associated with the given cell ID(s)
        :param req: a JobRequest with the cell_id_list of interest
        :returns: dict in the form
        {
            "jobs": {
                # dict with job IDs as keys and job states as values
                "job_one": { ... },
                "job_two": { ... },
            },
            "mapping": {
                # dict with cell IDs as keys and values being the set of job IDs associated
                # with that cell
                "cell_one": [ "job_one", "job_two", ... ],
                "cell_two": [ ... ],
            }
        }
        """
        cell_job_states = self._jm.lookup_job_states_by_cell_id(
            cell_id_list=req.cell_id_list
        )
        self.send_comm_message(CELL_JOB_STATUS, cell_job_states)
        return cell_job_states

    def _get_job_info(self, req: JobRequest) -> dict:
        """
        Look up job info. This is just some high-level generic information about the running
        job, including the app id, name, and job parameters.
        :param req: a JobRequest with the job_id_list of interest
        :returns: a dict keyed with job IDs and with values of dicts with the following keys:
            - app_id - str - module/name,
            - app_name - str - name of the app as it shows up in the Narrative interface
            - batch_id - str - the batch parent ID (if appropriate)
            - job_id - str - just re-reporting the id string
            - job_params - dict - the params that were passed to that particular job
        """
        job_id_list = self._get_job_ids(req)
        job_info = self._jm.get_job_info(job_id_list)
        self.send_comm_message(INFO, job_info)
        return job_info

    def __job_states(self, job_id_list) -> dict:
        """
        Look up job states.

        Returns a dictionary of job state information indexed by job ID.
        """
        output_states = self._jm.get_job_states(job_id_list)
        self.send_comm_message(STATUS, output_states)
        return output_states

    def lookup_job_state(self, job_id: str) -> dict:
        """
        This differs from the _lookup_job_state (underscored version) in that
        it just takes a job_id string, not a JobRequest.
        """
        return self.__job_states([job_id])

    def _lookup_job_states(self, req: JobRequest) -> dict:
        job_id_list = self._get_job_ids(req)
        return self.__job_states(job_id_list)

    def _modify_job_updates(self, req: JobRequest) -> dict:
        """
        Modifies how many things want to listen to a job update.
        If this is a request to start a job update, then this starts the update loop that
        returns update messages across the job channel.
        If this is a request to stop a job update, then this sends that request to the
        JobManager, which might have the side effect of shutting down the update loop if there's
        no longer anything requesting job status.

        If the given job_id in the request doesn't exist in the current Narrative, or is None,
        this raises a JobRequestException.
        """
        job_id_list = self._get_job_ids(req)
        update_type = req.request_type
        if update_type == START_UPDATE:
            update_adjust = 1
        elif update_type == STOP_UPDATE:
            update_adjust = -1
        else:
            # this should be impossible
            raise JobRequestException("Unknown request")

        self._jm.modify_job_refresh(job_id_list, update_adjust)
        if update_adjust == 1:
            self.start_job_status_loop()

        output_states = self._jm.get_job_states(job_id_list)
        self.send_comm_message(STATUS, output_states)
        return output_states

    def _cancel_jobs(self, req: JobRequest) -> dict:
        """
        This cancels a running job.
        If there are no valid jobs, this raises a JobRequestException.
        If there's an error while attempting to cancel, this raises a NarrativeError.
        In the end, after a successful cancel, this finishes up by fetching and returning the
        job state with the new status.
        """
        job_id_list = self._get_job_ids(req)
        cancel_results = self._jm.cancel_jobs(job_id_list)
        self.send_comm_message(STATUS, cancel_results)
        return cancel_results

    def _retry_jobs(self, req: JobRequest) -> dict:
        job_id_list = self._get_job_ids(req)
        retry_results = self._jm.retry_jobs(job_id_list)
        retry_ids = [
            result["retry"]["jobState"]["job_id"]
            for result in retry_results.values()
            if "retry" in result
        ]
        if len(retry_ids):
            self.send_comm_message(
                NEW,
                {JOB_ID_LIST: retry_ids},
            )
        self.send_comm_message(RETRY, retry_results)

        return retry_results

    def _get_job_logs(self, req: JobRequest) -> dict:
        """
        This returns a set of job logs based on the info in the request.
        """
        job_id_list = self._get_job_ids(req)
        log_output = self._jm.get_job_logs_for_list(
            job_id_list,
            num_lines=req.rq_data.get("num_lines", None),
            first_line=req.rq_data.get("first_line", 0),
            latest=req.rq_data.get("latest", False),
        )
        self.send_comm_message(LOGS, log_output)
        return log_output

    def _handle_comm_message(self, msg: dict) -> dict:
        """
        Handles comm messages that come in from the other end of the KBaseJobs channel.
        Messages get translated into one or more JobRequest objects, which are then
        passed to the right handler, based on the request.

        A handler dictionary is created on JobComm creation.

        Any unknown request is returned over the channel with message type 'job_error', and a
        JobRequestException is raised.
        """
        with exc_to_msg(msg):
            request = JobRequest(msg)

            kblogging.log_event(
                self._log, "handle_comm_message", {"msg": request.request_type}
            )
            if request.request_type not in self._msg_map:
                raise JobRequestException(
                    f"Unknown KBaseJobs message '{request.request_type}'"
                )

            return self._msg_map[request.request_type](request)

    def send_comm_message(self, msg_type: str, content: dict) -> None:
        """
        Sends a ipykernel.Comm message to the KBaseJobs channel with the given msg_type
        and content. These just get encoded into the message itself.
        """
        msg = {"msg_type": msg_type, "content": content}
        self._comm.send(msg)

    def send_error_message(
        self, req: Union[JobRequest, dict, str], content: dict = None
    ) -> None:
        """
        Sends a comm message over the KBaseJobs channel as an error. This will have msg_type set to
        ERROR ('job_error'), and include the original request in the message content as
        "source".

        req can be the original request message or its JobRequest form.
        Since the latter is made from the former, they have the same information.
        It can also be a string or None if this context manager is invoked outside of a JC request

        This sends a packet that looks like:
        {
            raw_request: the original JobRequest object, function params, or function name
            source: the function request that spawned the error
            other fields about the error, dependent on the content.
        }
        """
        error_content = dict()
        if isinstance(req, JobRequest):
            error_content["raw_request"] = req.raw_request
            error_content["source"] = req.request_type
        elif isinstance(req, dict):
            data = req.get("content", {}).get("data", {})
            error_content["raw_request"] = req
            error_content["source"] = data.get("request_type")
        elif isinstance(req, str) or req is None:
            error_content["raw_request"] = req
            error_content["source"] = req

        if content is not None:
            error_content.update(content)

        self.send_comm_message(ERROR, error_content)


class exc_to_msg:
    """
    This is a context manager to wrap around JC code
    """

    jc = JobComm()

    def __init__(self, req: Union[JobRequest, dict, str] = None):
        """
        req can be several different things because this context manager
        supports being used in several different places. Generally it is
        a request dict or request object, but when used outside of a request,
        e.g., from appmanager, req can inform of the source of the JobComm
        call
        """
        self.req = req

    def __enter__(self):
        pass  # nothing to do here

    def __exit__(self, exc_type, exc_value, exc_tb):
        """
        If exception is caught, will send job comm message in this format
        {
            "msg_type": ERROR,
            "content": {
                "source": "request_type",
                "job_id": "0123456789abcdef",  # or job_id_list. optional and mutually exclusive
                "name": "ValueError",
                "message": "Something happened",
                #---------- Below, NarrativeException only -----------
                "code": -1,
                "error": "Unable to complete this request"
            }
        }
        Will then re-raise exception
        """
        if exc_type == NarrativeException:
            self.jc.send_error_message(
                self.req,
                {
                    "name": exc_value.name,
                    "message": exc_value.message,
                    "error": exc_value.error,
                    "code": exc_value.code,
                },
            )
        elif exc_type:
            self.jc.send_error_message(
                self.req,
                {
                    "name": exc_type.__name__,
                    "message": str(exc_value),
                },
            )
