"""Exceptions and exception transformations."""

from typing import Any

from biokbase.execution_engine2.baseclient import ServerError as EEServerError
from requests.exceptions import HTTPError


class JobRequestException(ValueError):
    """Error related to job requests.

    Raised when a job request is invalid in some way; for example,
    if the required parameter(s) are empty (e.g. job_id or batch_id),
    if a job ID is not registered in JobManager._running_jobs, or
    it is not a batch ID as intended.
    Subclasses ValueError for except-clause backwards compatibility
    """

    def __init__(self: "JobRequestException", msg: str, *extra_args) -> None:
        """Initialise the error."""
        if extra_args:
            msg = f"{msg}: {extra_args[0]}"
        super().__init__(msg)


class NarrativeException(Exception):
    """The kind of exception that only a narrative could throw."""

    def __init__(
        self: "NarrativeException",
        code: int,
        message: str,
        name: str,
        source: str,
        error: str | None,
    ) -> None:
        """Initialise the error."""
        self.code = code
        self.message = message
        self.name = name
        self.source = source
        self.error = error

    def __str__(self: "NarrativeException") -> str:
        """Emit the error in a string form."""
        return self.message


def transform_job_exception(e: Exception, error: str | None = None) -> NarrativeException:
    """Transforms a job exception from one of several forms into something more obvious and manageable.

    Assigns a standard HTTP error code, regardless of error (500 if nothing else).

    Returns a slightly modified exception that

    Types of exceptions:
    ServerError - thrown by the server, usually due to a 500 (ish) exception
    HTTPError - a more mundane HTTP exception

    error is an optional message that will be passed to the resultant NarrativeException
    """
    service_not_found_error_codes = [404, 502, 503]
    service_timeout_error_codes = [504, 598, 599]
    service_internal_error_codes = [500]

    if isinstance(e, EEServerError):
        return NarrativeException(e.code, e.message, e.name, "ee2", error)

    if isinstance(e, HTTPError):
        code = e.response.status_code
        if code in service_not_found_error_codes:
            # service not found
            msg = "A KBase service is currently unavailable."
        elif code in service_timeout_error_codes:
            # service timeout
            msg = "There was a temporary network connection error."
        elif code in service_internal_error_codes:
            # internal error. dunno what to do.
            msg = "An internal error occurred in the KBase service."
        else:
            msg = "An untracked error occurred."
        return NarrativeException(e.response.status_code, msg, "HTTPError", "network", error)

    return NarrativeException(-1, str(e), type(e).__name__, "unknown", error)
