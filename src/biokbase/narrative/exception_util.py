from requests.exceptions import HTTPError
from biokbase.execution_engine2.baseclient import ServerError as EEServerError


class JobRequestException(ValueError):
    """
    Raised when a job request is invalid in some way; for example,
    if the required parameter(s) are empty (e.g. job_id or batch_id),
    if a job ID is not registered in JobManager._running_jobs, or
    it is not a batch ID as intended.
    Subclasses ValueError for except-clause backwards compatibility
    """

    def __init__(self, msg, *a):
        if a:
            msg = f"{msg}: {a[0]}"
        super().__init__(msg)


class NarrativeException(Exception):
    def __init__(self, code, message, name, source, error):
        self.code = code
        self.message = message
        self.name = name
        self.source = source
        self.error = error

    def __str__(self):
        return self.message


def transform_job_exception(e, error=None):
    """
    Transforms a job exception from one of several forms into
    something more obvious and manageable.

    Assigns a standard HTTP error code, regardless of error (500 if nothing else).

    Returns a slightly modified exception that

    Types of exceptions:
    ServerError - thrown by the server, usually due to a 500 (ish) exception
    HTTPError - a more mundane HTTP exception

    error is an optional message that will be passed to the resultant
    NarrativeException
    """
    if isinstance(e, EEServerError):
        return NarrativeException(e.code, e.message, e.name, "ee2", error)
    elif isinstance(e, HTTPError):
        code = e.response.status_code
        if code == 404 or code == 502 or code == 503:
            # service not found
            msg = "A KBase service is currently unavailable."
        elif code == 504 or code == 598 or code == 599:
            # service timeout
            msg = "There was a temporary network connection error."
        elif code == 500:
            # internal error. dunno what to do.
            msg = "An internal error occurred in the KBase service."
        else:
            msg = "An untracked error occurred."
        return NarrativeException(
            e.response.status_code, msg, "HTTPError", "network", error
        )
    else:
        return NarrativeException(-1, str(e), "Exception", "unknown", error)
