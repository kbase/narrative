"""
KBase narrative service/function API.
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

    @abstractmethod
    def run(self, params):
        "Run the service"
        pass # may have an implementation, if desired

    @abstractproperty
    def name(self):
        "Get service name (read-only)"
        return self._name
    # etc.


