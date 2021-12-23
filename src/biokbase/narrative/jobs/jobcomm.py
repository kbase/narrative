import copy
import threading
from typing import List, Union
from ipykernel.comm import Comm
from biokbase.narrative.jobs.jobmanager import (
    JOBS_TYPE_ERR,
    get_error_output_state,
    JobManager,
)
from biokbase.narrative.exception_util import NarrativeException, JobIDException
from biokbase.narrative.common import kblogging

UNKNOWN_REASON = "Unknown reason"

JOB_NOT_PROVIDED_ERR = "job_id not provided"
JOBS_NOT_PROVIDED_ERR = "job_id_list not provided"
CELLS_NOT_PROVIDED_ERR = "cell_id_list not provided"
BOTH_INPUTS_PRESENT_ERR = "Both job_id and job_id_list present"

LOOKUP_TIMER_INTERVAL = 5

JOB_ID = "job_id"
JOB_ID_LIST = "job_id_list"
CELL_ID_LIST = "cell_id_list"

# messages
CANCEL = "cancel_job"
CELL_JOB_STATUS = "cell_job_status"
ERROR = "job_error"
INFO = "job_info"
LOGS = "job_logs"
NEW = "new_job"
RETRY = "retry_job"
RUN_STATUS = "run_status"
START_UPDATE = "start_job_update"
STATUS = "job_status"
STATUS_ALL = "job_status_all"
STOP_UPDATE = "stop_job_update"

# batch versions
STATUS_BATCH = STATUS + "_batch"
INFO_BATCH = INFO + "_batch"
START_UPDATE_BATCH = START_UPDATE + "_batch"
STOP_UPDATE_BATCH = STOP_UPDATE + "_batch"


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

    Provides 4 attributes:
    msg_id: str - a unique string (within reason) for a message id.
    request: str - a string for the request sent from the front end. This isn't
        strictly controlled here, but by JobComm._handle_comm_message.
    job_id: str or job_id_list: list - (optional) - a string or strings for
        the job id, as set by EE2. Cannot have both attributes
    rq_data: dict - the actual data of the request. Containers the request type,
        job_id (sometimes), and other information that can be specific for
        each request.
    """

    # each kind of request handling requires a job_id, a job_id_list,
    # or none of those
    REQUIRE_JOB_ID = [
        INFO_BATCH,
        STATUS_BATCH,
        START_UPDATE_BATCH,
        STOP_UPDATE_BATCH,
    ]
    REQUIRE_JOB_ID_LIST = [
        CANCEL,
        INFO,
        LOGS,
        RETRY,
        STATUS,
        START_UPDATE,
        STOP_UPDATE,
    ]

    def __init__(self, rq: dict):
        self.msg_id = rq.get("msg_id")  # might be useful later?
        self.rq_data = rq.get("content", {}).get("data")
        if self.rq_data is None:
            raise ValueError("Improperly formatted job channel message!")
        self.request = self.rq_data.get("request_type")
        if self.request is None:
            raise ValueError("Missing request type in job channel message!")
        if JOB_ID in self.rq_data and JOB_ID_LIST in self.rq_data:
            raise ValueError(BOTH_INPUTS_PRESENT_ERR)

    @property
    def job_id(self):
        if JOB_ID in self.rq_data:
            return self.rq_data[JOB_ID]
        raise JobIDException(JOB_NOT_PROVIDED_ERR)

    @property
    def job_id_list(self):
        if JOB_ID_LIST in self.rq_data:
            return self.rq_data[JOB_ID_LIST]
        raise JobIDException(JOBS_NOT_PROVIDED_ERR)

    @property
    def cell_id_list(self):
        if CELL_ID_LIST in self.rq_data:
            return self.rq_data[CELL_ID_LIST]
        raise ValueError(CELLS_NOT_PROVIDED_ERR)

    def input(self):
        if JOB_ID in self.rq_data:
            return (JOB_ID, self.job_id)
        elif JOB_ID_LIST in self.rq_data:
            return (JOB_ID_LIST, self.job_id_list)
        else:
            return None

    @classmethod
    def _convert_to_using_job_id_list(cls, msg: dict) -> "JobRequest":
        """
        If a message comes with job_id instead of job_id_list, it may be converted
        into a JobRequest with a job_id_list
        """
        msg["content"]["data"][JOB_ID_LIST] = [msg["content"]["data"][JOB_ID]]
        del msg["content"]["data"][JOB_ID]
        return cls(msg)

    @classmethod
    def _split_request_by_job_id(cls, msg: dict) -> List["JobRequest"]:
        """
        If a message comes with job_id_list instead of job_id, it may be converted
        into multiple JobRequest objects each having a single job_id
        """
        job_id_list = msg["content"]["data"][JOB_ID_LIST]
        if not isinstance(job_id_list, list):
            raise TypeError(JOBS_TYPE_ERR)
        insts = []
        for job_id in job_id_list:
            msg_ = copy.deepcopy(msg)
            msg_["content"]["data"][JOB_ID] = job_id
            del msg_["content"]["data"][JOB_ID_LIST]
            insts.append(cls(msg_))
        return insts

    @classmethod
    def translate(cls, msg: dict) -> List["JobRequest"]:
        data = msg.get("content", {}).get("data", {})
        if JOB_ID in data and JOB_ID_LIST in data:
            raise ValueError(BOTH_INPUTS_PRESENT_ERR)

        req_type = data.get("request_type")

        if JOB_ID_LIST in data and req_type in cls.REQUIRE_JOB_ID:
            requests = cls._split_request_by_job_id(msg)
        elif JOB_ID in data and req_type in cls.REQUIRE_JOB_ID_LIST:
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
                STATUS_ALL: self._lookup_all_job_states,
                CELL_JOB_STATUS: self._lookup_job_states_by_cell_id,
                STATUS: self._lookup_job_states,
                STATUS_BATCH: self._lookup_job_states_batch,
                INFO: self._lookup_job_info,
                INFO_BATCH: self._lookup_job_info_batch,
                START_UPDATE: self._modify_job_updates,
                STOP_UPDATE: self._modify_job_updates,
                START_UPDATE_BATCH: self._modify_job_updates_batch,
                STOP_UPDATE_BATCH: self._modify_job_updates_batch,
                CANCEL: self._cancel_jobs,
                RETRY: self._retry_jobs,
                LOGS: self._get_job_logs,
            }

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

    def _lookup_all_job_states(
        self, req: JobRequest = None, ignore_refresh_flag: bool = False
    ) -> dict:
        """
        Fetches status of all jobs in the current workspace and sends them to the front end.
        req can be None, as it's not used.
        """
        all_job_states = self._jm.lookup_all_job_states(
            ignore_refresh_flag=ignore_refresh_flag
        )
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

    def __job_info(self, job_id_list):
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
        job_info = self._jm.lookup_job_info(job_id_list)
        self.send_comm_message(INFO, job_info)
        return job_info

    def _lookup_job_info(self, req: JobRequest) -> dict:
        return self.__job_info(req.job_id_list)

    def _lookup_job_info_batch(self, req: JobRequest) -> dict:
        job_ids = self._jm.update_batch_job(req.job_id)
        return self.__job_info(job_ids)

    def __job_states(self, job_id_list):
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
        return self.__job_states(req.job_id_list)

    def _lookup_job_states_batch(self, req: JobRequest) -> dict:
        try:
            job_ids = self._jm.update_batch_job(req.job_id)
        except JobIDException:
            self.send_comm_message(
                STATUS,
                {req.job_id: get_error_output_state(req.job_id)},
            )
            raise

        return self.__job_states(job_ids)

    def __modify_updates(self, job_id_list, update_type):
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
        if update_type == "start_job_update":
            update_refresh = True
        elif update_type == "stop_job_update":
            update_refresh = False
        else:
            raise ValueError("Unknown request")

        self._jm.modify_job_refresh(job_id_list, update_refresh)

        if update_refresh:
            self.start_job_status_loop()

        output_states = self._jm.get_job_states(job_id_list)
        self.send_comm_message(STATUS, output_states)

    def _modify_job_updates(self, req: JobRequest) -> None:
        self.__modify_updates(req.job_id_list, req.request)

    def _modify_job_updates_batch(self, req: JobRequest) -> None:
        job_ids = self._jm.update_batch_job(req.job_id)
        update_type = req.request.replace("_batch", "")
        self.__modify_updates(job_ids, update_type)

    def _cancel_jobs(self, req: JobRequest) -> None:
        """
        This cancels a running job.
        If there are no valid jobs, this raises a ValueError.
        If there's an error while attempting to cancel, this raises a NarrativeError.
        In the end, after a successful cancel, this finishes up by fetching and returning the
        job state with the new status.
        """
        cancel_results = self._jm.cancel_jobs(req.job_id_list)
        self.send_comm_message(STATUS, cancel_results)

    def _retry_jobs(self, req: JobRequest) -> None:
        retry_results = self._jm.retry_jobs(req.job_id_list)
        self.send_comm_message(RETRY, retry_results)
        self.send_comm_message(
            NEW,
            {
                JOB_ID_LIST: [
                    result["retry"]["jobState"]["job_id"]
                    for result in retry_results.values()
                    if "retry" in result
                ]
            },
        )

    def _get_job_logs(self, req: JobRequest) -> None:
        """
        This returns a set of job logs based on the info in the request.
        """
        log_output = self._jm.get_job_logs_for_list(
            req.job_id_list,
            num_lines=req.rq_data.get("num_lines", None),
            first_line=req.rq_data.get("first_line", 0),
            latest=req.rq_data.get("latest", False),
        )
        self.send_comm_message(LOGS, log_output)

    def _handle_comm_message(self, msg: dict) -> None:
        """
        Handles comm messages that come in from the other end of the KBaseJobs channel.
        Messages get translated into one or more JobRequest objects, which are then
        passed to the right handler, based on the request.

        A handler dictionary is created on JobComm creation.

        Any unknown request is returned over the channel with message type 'job_error', and a
        ValueError is raised.
        """
        with exc_to_msg(msg):
            requests = JobRequest.translate(msg)

            for request in requests:
                kblogging.log_event(
                    self._log, "handle_comm_message", {"msg": request.request}
                )
                if request.request in self._msg_map:
                    self._msg_map[request.request](request)
                else:
                    raise ValueError(f"Unknown KBaseJobs message '{request.request}'")

    def send_comm_message(self, msg_type: str, content: dict) -> None:
        """
        Sends a ipykernel.Comm message to the KBaseJobs channel with the given msg_type
        and content. These just get encoded into the message itself.
        """
        msg = {"msg_type": msg_type, "content": content}
        self._comm.send(msg)

    def send_error_message(
        self, err_type: str, req: Union[JobRequest, dict, str], content: dict = None
    ) -> None:
        """
        Sends a comm message over the KBaseJobs channel as an error. This will have msg_type as
        whatever the error type is, and include the original request in the message content as
        "source".

        req can be the original request message or its JobRequest form.
        Since the latter is made from the former, they have the same information.
        It can also be a string or None if this context manager is invoked outside of a JC request

        This sends a packet that looks like:
        {
            job_id or job_id_list or cell_id_list: (string or list of strings, if relevant),
            source: the original message that spawned the error,
            other fields about the error, dependent on the content.
        }
        """
        error_content = dict()
        if isinstance(req, JobRequest):
            error_content["source"] = req.request
            input_ = req.input()
            if input_:
                error_content[input_[0]] = input_[1]
        elif isinstance(req, dict):
            data = req.get("content", {}).get("data", {})
            error_content["source"] = data.get("request_type")
            # If req is still a dict, could have both job_id and job_id_list
            for attr in [JOB_ID, JOB_ID_LIST, CELL_ID_LIST]:
                if attr in data:
                    error_content[attr] = data[attr]
        elif isinstance(req, str) or req is None:
            error_content["source"] = req
        if content is not None:
            error_content.update(content)
        self.send_comm_message(err_type, error_content)


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
                ERROR,
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
                ERROR,
                self.req,
                {
                    "name": exc_type.__name__,
                    "message": str(exc_value),
                },
            )
