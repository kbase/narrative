from requests.exceptions import HTTPError
from biokbase.NarrativeJobService.Client import ServerError as NJSServerError
from biokbase.userandjobstate.baseclient import ServerError as UJSServerError

class NarrativeException(Exception):
    def __init__(self, code, message, name, source):
        self.code = code
        self.message = message
        self.name = name
        self.source = source

    def __str__(self):
        return self.message

def transform_job_exception(e):
    """
    Transforms a job exception from one of several forms into
    something more obvious and manageable.

    Assigns a standard HTTP error code, regardless of error (500 if nothing else).

    Returns a slightly modified exception that

    Types of exceptions:
    ServerError - thrown by the server, usually due to a 500 (ish) exception
    HTTPError - a more mundane HTTP exception
    """
    if isinstance(e, NJSServerError):
        return NarrativeException(e.code, e.message, e.name, 'njs')
    elif isinstance(e, UJSServerError):
        return NarrativeException(e.code, e.message, e.name, 'ujs')
    elif isinstance(e, HTTPError):
        code = e.response.status_code
        if code == 404 or code == 502 or code == 503:
            # service not found
            msg = 'A KBase service is currently unavailable.'
        elif code == 504 or code == 598 or code == 599:
            # service timeout
            msg = 'There was a temporary network connection error.'
        elif code == 500:
            # internal error. dunno what to do.
            msg = 'An internal error occurred in the KBase service.'
        else:
            msg = 'An untracked error occurred.'
        return NarrativeException(e.response.status_code, msg, 'HTTPError', 'network')
    else:
        return NarrativeException(-1, str(e), 'Exception', 'unknown')