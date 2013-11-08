"""
KBase narrative service/function API.

Every Service that gets wrapped into a Narrative service should implement
the abstract base class, Service.
"""
__author__ = ["Dan Gunter <dkgunter@lbl.gov>", "William Riehl <wjriehl@lbl.gov>"]
__version__ = "0.0.1"

## Imports
# Stdlib
import abc
import logging
import os
import sys

## Logging boilerplate

_log = logging.getLogger(__name__)
# turn on debugging by setting environment variable KBASE_DEBUG
if os.environ.get("KBASE_DEBUG", None):
    _log.setLevel(logging.DEBUG)
else:
    _log.setLevel(logging.WARN)
# set custom log format
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s %(module)s: %(message)s"))
_log.addHandler(_h)

## Globals

## Classes and functions

class Service:
    __metaclass__ abc.ABCMeta
    # example of abc stuff

    # Optional
    @abstractmethod
    def run(self, params):
        "Run the service"
        pass # may have an implementation, if desired

    # Required - all service functions should have a name.
    @abstractproperty
    def name(self):
        "Get service name (read-only)"
        return self._name

    # If the service has inputs, it should return, as a JSON object
    # (schema follows in later notes) what its inputs are.
    #
    # If it doesn't have inputs, this should return an empty JSON object.
    @abstractproperty
    def input(self):
        "Inputs the service requires (read-only)"
        return self._inputs

    # As with inputs, every Service or Function should produce some
    # kind of output. 
    @abstractproperty
    def output(self):
        "Outputs the service provides (read-only)"
        return self._outputs