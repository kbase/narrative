import copy
import threading
from typing import List, Union
import time
from ipykernel.comm import Comm
from biokbase.narrative.jobs.util import load_job_constants
from biokbase.narrative.jobs.jobmanager import JobManager
from biokbase.narrative.exception_util import NarrativeException, JobRequestException
from biokbase.narrative.common import kblogging


(PARAM, MESSAGE_TYPE) = load_job_constants()

UNKNOWN_REASON = "Unknown reason"

CELLS_NOT_PROVIDED_ERR = "cell_id_list not provided"
ONE_INPUT_TYPE_ONLY_ERR = "Please provide one of job_id, job_id_list, or batch_id"

INVALID_REQUEST_ERR = "Improperly formatted job channel message!"
MISSING_REQUEST_TYPE_ERR = "Missing request type in job channel message!"

LOOKUP_TIMER_INTERVAL = 5


class JobRequest:
    """
    A small wrapper for job comm channel request data.
    This generally comes in the form of a packet from the kernel Comm object.
    It is expected to be a dict of the format:
    {
        content: {
            'comm_id': <some string>,
            'data': {
                'request_type': job function requested
                'job_id': optional
                'job_id_list': optional
                'batch_id': optional
            }
        }
    }

    This little wrapper fills two roles:
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
    request_type    str     the function to perform. This isn't strictly controlled
                            here, but by JobComm._handle_comm_message.
    rq_data         dict    the actual data of the request. Contains the request
                            type and other parameters specific to the function to be
                            performed

    The IDs of the job(s) to perform the function on (optional):
    job_id          str
    job_id_list     list(str)
    batch_id        str
    """

    INPUT_TYPES = [PARAM["JOB_ID"], PARAM["JOB_ID_LIST"], PARAM["BATCH_ID"]]

    def __init__(self, rq: dict):
        rq = copy.deepcopy(rq)
        self.raw_request = rq
        self.msg_id = rq.get("msg_id")  # might be useful later?
        self.rq_data = rq.get("content", {}).get("data")
        if not self.rq_data:
            raise JobRequestException(INVALID_REQUEST_ERR)
        self.request_type = self.rq_data.get("request_type")
        if not self.request_type:
            raise JobRequestException(MISSING_REQUEST_TYPE_ERR)

        input_type_count = 0
        for input_type in self.INPUT_TYPES:
            if input_type in self.rq_data:
                input_type_count += 1
        if input_type_count > 1:
            raise JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)

    @property
    def job_id(self):
        if PARAM["JOB_ID"] in self.rq_data:
            return self.rq_data[PARAM["JOB_ID"]]
        raise JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)

    @property
    def job_id_list(self):
        if PARAM["JOB_ID_LIST"] in self.rq_data:
            return self.rq_data[PARAM["JOB_ID_LIST"]]
        if PARAM["JOB_ID"] in self.rq_data:
            return [self.rq_data[PARAM["JOB_ID"]]]
        raise JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)

    @property
    def batch_id(self):
        if PARAM["BATCH_ID"] in self.rq_data:
            return self.rq_data[PARAM["BATCH_ID"]]
        raise JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)

    def has_job_ids(self):
        return any([input_type in self.rq_data for input_type in self.INPUT_TYPES])

    def has_batch_id(self):
        return PARAM["BATCH_ID"] in self.rq_data

    @property
    def cell_id_list(self):
        if PARAM["CELL_ID_LIST"] in self.rq_data:
            return self.rq_data[PARAM["CELL_ID_LIST"]]
        raise JobRequestException(CELLS_NOT_PROVIDED_ERR)

    @property
    def ts(self):
        """This param is completely optional"""
        return self.rq_data.get(PARAM["TS"])


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
                MESSAGE_TYPE["CANCEL"]: self._cancel_jobs,
                MESSAGE_TYPE["CELL_JOB_STATUS"]: self._get_job_states_by_cell_id,
                MESSAGE_TYPE["INFO"]: self._get_job_info,
                MESSAGE_TYPE["LOGS"]: self._get_job_logs,
                MESSAGE_TYPE["RETRY"]: self._retry_jobs,
                MESSAGE_TYPE["START_UPDATE"]: self._modify_job_updates,
                MESSAGE_TYPE["STATUS"]: self._get_job_states,
                MESSAGE_TYPE["STATUS_ALL"]: self._get_all_job_states,
                MESSAGE_TYPE["STOP_UPDATE"]: self._modify_job_updates,
            }

    def _get_job_ids(self, req: JobRequest) -> List[str]:
        """
        Extract the job IDs from a job request object

        :param req: the job request to take the IDs from
        :type req: JobRequest

        :return: list of job IDs
        :rtype: List[str]
        """
        if not req.has_job_ids():
            raise JobRequestException(ONE_INPUT_TYPE_ONLY_ERR)
        if req.has_batch_id():
            return self._jm.update_batch_job(req.batch_id)
        return req.job_id_list

    def start_job_status_loop(
        self,
        init_jobs: bool = False,
        cell_list: List[str] = None,
    ) -> None:
        """
        Starts the job status lookup loop, which runs every LOOKUP_TIMER_INTERVAL seconds.

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
                    "source": getattr(e, "source", "jc.start_job_status_loop"),
                    "request": getattr(e, "request", "jc.start_job_status_loop"),
                    "name": getattr(e, "name", type(e).__name__),
                    "message": getattr(e, "message", UNKNOWN_REASON),
                    "error": "Unable to get initial jobs list",
                    "code": getattr(e, "code", -1),
                }
                self.send_comm_message(MESSAGE_TYPE["ERROR"], error)
                # if job init failed, set the lookup loop var back to False and return
                self._running_lookup_loop = False
                return
        if self._lookup_timer is None:
            self._lookup_job_status_loop()

    def stop_job_status_loop(self) -> None:
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
        all_job_states = self._get_all_job_states()
        if len(all_job_states) == 0 or not self._running_lookup_loop:
            self.stop_job_status_loop()
        else:
            self._lookup_timer = threading.Timer(
                LOOKUP_TIMER_INTERVAL, self._lookup_job_status_loop
            )
            self._lookup_timer.start()

    def _get_all_job_states(
        self, req: JobRequest = None, ignore_refresh_flag: bool = False
    ) -> dict:
        """
        Fetches status of all jobs in the current workspace and sends them to the front end.
        req can be None, as it's not used.
        """
        all_job_states = self._jm.get_all_job_states(
            ignore_refresh_flag=ignore_refresh_flag
        )
        self.send_comm_message(MESSAGE_TYPE["STATUS_ALL"], all_job_states)
        return all_job_states

    def _get_job_states_by_cell_id(self, req: JobRequest) -> dict:
        """
        Fetches status of all jobs associated with the given cell ID(s).

        :param req: job request object with the cell_id_list param set
        :type req: JobRequest, optional

        :return: dictionary in the form
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
        :rtype: dict
        """
        cell_job_states = self._jm.get_job_states_by_cell_id(
            cell_id_list=req.cell_id_list
        )
        self.send_comm_message(MESSAGE_TYPE["CELL_JOB_STATUS"], cell_job_states)
        return cell_job_states

    def _get_job_info(self, req: JobRequest) -> dict:
        """
        Gets job information for a list of job IDs.

        Job info for a given job ID is in the form:
        {
            "app_id": string in the form "<module>/<name>",
            "app_name": string,
            "job_id": string,
            "job_params": dictionary,
            "batch_id": string | None,
        }

        Jobs that cannot be found in the `_running_jobs` index will return
        {
            "job_id": string,
            "error": "Cannot find job with ID <job_id>"
        }

        :param req: job request with a list of job IDs
        :type req: JobRequest
        :return: dictionary containing job info for each input job, indexed by job ID
        :rtype: dict
        """
        job_id_list = self._get_job_ids(req)
        job_info = self._jm.get_job_info(job_id_list)
        self.send_comm_message(MESSAGE_TYPE["INFO"], job_info)
        return job_info

    def _get_send_job_states(self, job_id_list: list, ts: int = None) -> dict:
        """
        Retrieves the job states for the supplied job_ids.

        See Job.output_state() for details of job state structure.

        If the ts parameter is present, only jobs that have been updated since that time are returned.

        Jobs that cannot be found in the `_running_jobs` index will return
        {
            "job_id": string,
            "error": "Cannot find job with ID <job_id>"
        }

        :param job_id_list: job IDs to retrieve job states for
        :type job_id_list: list
        :param ts: timestamp, in the format generated by time.time_ns(); defaults to None
        :type ts: int, optional

        :return: dictionary of job states, indexed by job ID
        :rtype: dict
        """
        output_states = self._jm.get_job_states(job_id_list, ts)
        self.send_comm_message(MESSAGE_TYPE["STATUS"], output_states)
        return output_states

    def get_job_state(self, job_id: str) -> dict:
        """
        Retrieve the job state for a single job.

        This differs from the _get_job_state (underscored version) in that
        it just takes a job_id string, not a JobRequest.

        :param job_id: the job ID to get the state for
        :type job_id: string

        :return: dictionary of job states, indexed by job ID
        :rtype: dict
        """
        return self._get_send_job_states([job_id])

    def _get_job_states(self, req: JobRequest) -> dict:
        """
        Retrieves the job states for the supplied job_ids.

        See Job.output_state() for details of job state structure.

        :param req: job request with a list of job IDs
        :type req: JobRequest

        :return: dictionary of job states, indexed by job ID
        :rtype: dict
        """
        job_id_list = self._get_job_ids(req)
        return self._get_send_job_states(job_id_list, req.ts)

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
        if update_type == MESSAGE_TYPE["START_UPDATE"]:
            update_refresh = True
        elif update_type == MESSAGE_TYPE["STOP_UPDATE"]:
            update_refresh = False
        else:
            # this should be impossible
            raise JobRequestException("Unknown request")

        self._jm.modify_job_refresh(job_id_list, update_refresh)

        if update_refresh:
            self.start_job_status_loop()

        output_states = self._jm.get_job_states(job_id_list)
        self.send_comm_message(MESSAGE_TYPE["STATUS"], output_states)
        return output_states

    def _cancel_jobs(self, req: JobRequest) -> dict:
        """
        Cancel a job or list of jobs. After sending the cancellation request, the job states
        are refreshed and their new output states returned.

        See JobManager.cancel_jobs() for more details.

        :param req: job request containing job ID or list of job IDs to be cancelled
        :type req: JobRequest

        :return: job output states, indexed by job ID
        :rtype: dict
        """
        job_id_list = self._get_job_ids(req)
        cancel_results = self._jm.cancel_jobs(job_id_list)
        self.send_comm_message(MESSAGE_TYPE["STATUS"], cancel_results)
        return cancel_results

    def _retry_jobs(self, req: JobRequest) -> dict:
        """
        Retry a job or list of jobs.

        See JobManager.retry_jobs() for more details.

        :param req: job request containing job ID or list of job IDs to be retried
        :type req: JobRequest

        :return: job retry data, indexed by job ID
        :rtype: dict
        """
        job_id_list = self._get_job_ids(req)
        retry_results = self._jm.retry_jobs(job_id_list)
        self.send_comm_message(MESSAGE_TYPE["RETRY"], retry_results)
        return retry_results

    def _get_job_logs(self, req: JobRequest) -> dict:
        """
        Fetch the logs for a job or list of jobs.

        See JobManager.get_job_logs_for_list() for more details.

        :param req: job request containing job ID or list of job IDs to fetch logs for
        :type req: JobRequest

        :return: job log data, indexed by job ID
        :rtype: dict
        """
        job_id_list = self._get_job_ids(req)
        log_output = self._jm.get_job_logs_for_list(
            job_id_list,
            num_lines=req.rq_data.get(PARAM["NUM_LINES"], None),
            first_line=req.rq_data.get(PARAM["FIRST_LINE"], 0),
            latest=req.rq_data.get(PARAM["LATEST"], False),
        )
        self.send_comm_message(MESSAGE_TYPE["LOGS"], log_output)
        return log_output

    def _handle_comm_message(self, msg: dict) -> dict:
        """
        Handle incoming messages on the KBaseJobs channel.

        Messages get translated into one or more JobRequest objects, which are then
        passed to the right handler, based on the request.

        A handler dictionary is created on JobComm creation.

        Any unknown request is returned over the channel with message type 'job_error', and a
        JobRequestException is raised.

        :param msg: incoming comm message
        :type msg: dict

        :raises JobRequestException: if the message type is not recognised

        :return: result of running the appropriate method; generally this is a dictionary
        of job data indexed by job ID.
        :rtype: dict
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
        if msg_type == MESSAGE_TYPE["STATUS"]:
            content["last_checked"] = time.time_ns()

        msg = {"msg_type": msg_type, "content": content}
        self._comm.send(msg)

    def send_error_message(
        self, req: Union[JobRequest, dict, str], content: dict = None
    ) -> None:
        """
        Sends an error message over the KBaseJobs channel. This will have msg_type set to
        ERROR ('job_error'), and include the original request in the message content as
        "source".

        req can be the original request message or its JobRequest form.
        Since the latter is made from the former, they have the same information.
        It can also be a string or None if this context manager is invoked outside of a JC request

        Job error messages have the format:

        {
            "msg_type": "job_error",
            "content": {
                "source": request type from original incoming comm request, if available, else an arbitrary str/NoneType,
                "request": request data from original incoming comm request, if available, else an arbitrary str/NoneType,
                **{any extra error information}
            }
        }

        :param req: job request context, either a job request received over the channel or a string
        :type req:          JobRequest, dict, str, or NoneType
        :param content: dictionary of extra data to include in the error message, defaults to None
        :type content: dict, optional
        """
        error_content = {}
        if isinstance(req, JobRequest):
            error_content["request"] = req.rq_data
            error_content["source"] = req.request_type
        elif isinstance(req, dict):
            data = req.get("content", {}).get("data", {})
            error_content["request"] = data
            error_content["source"] = data.get("request_type")
        elif isinstance(req, str) or req is None:
            error_content["request"] = req
            error_content["source"] = req

        if content:
            error_content.update(content)

        self.send_comm_message(MESSAGE_TYPE["ERROR"], error_content)


class exc_to_msg:
    """
    This is a context manager to wrap around JobComm code in order to catch any exception,
    send it back as a comm error messages, and then re-raise that exception
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
        If an exception is caught during execution in the JobComm code,
        this will send back a comm error message like:
        {
            "msg_type": "job_error",
            "content": {
                "source": request type from original incoming comm request, if available, else an arbitrary str/NoneType,
                "request": request data from original incoming comm request, if available, else an arbitrary str/NoneType,
                "name": exception name,  # e.g., ValueError
                "message": exception message,  # e.g. "Something specifically went wrong!"
                #---------- Below, for NarrativeException only -----------
                "error": exception error attribute,  # e.g. "Unable to complete this request"
                "code": exception code attribute,  # e.g., -1
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
