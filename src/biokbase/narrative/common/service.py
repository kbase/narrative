"""
KBase narrative service/function API.

The main class defined here is :class:`Service`, but
for running in the IPython notebook, services should inherit from :class:`IpService`, which implements communication channels to the front-end and remote KBase registries.

Subclasses should override the constructor to provide service metadata,
and the run() method to perform the desired work.

Sample usage::

    from biokbase.common.service import IpService

    class MyService(IpService):
    
        def __init__(self):
            IpService.__init__(self)
            self.name = "groovalicious"
            self.desc = "This service makes me want to dance"
            self.version = (1,0,1)
        
        def run(self, params):
            # do the work of the service.
            print("hello, world!")
            # at appropriate points, update status:
            self.status.advance()
            # on exit, status will be automatically updated again
            return ['list', 'of', 1, 'or', 'more', 'values']

"""
__author__ = ["Dan Gunter <dkgunter@lbl.gov>", "William Riehl <wjriehl@lbl.gov>"]
__version__ = "0.0.1"

## Imports
# Stdlib
import logging
import os
import re
import sys
# Third-party
from IPython.utils.traitlets import HasTraits, Unicode, TraitType

## Logging boilerplate

_log = logging.getLogger(__name__)
# turn on debugging by setting environment variable KBASE_DEBUG
if os.environ.get("KBASE_DEBUG", None):
    _log.setLevel(logging.DEBUG)
else:
    _log.setLevel(logging.WARN)
# set custom log format
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("%(levelname)s %(asctime)s %(module)s: %(message)s"))
_log.addHandler(_h)

## Globals

## Classes and functions

class VersionNumber(TraitType):
    """A trait for a (major, minor, patch) version tuple
    See http://semver.org/
    
    Values are accepted either as triples or strings e.g.
    (2,0,0) or "2.0.0". In either case, all 3 values must
    be provided. The first two values must be numeric, but
    the last one is a string or number, e.g. (2,0,"1-alpha+20131115")
    """

    default_value = "0.0.0"
    info_text = 'a version tuple (2,0,"1-rc3") or string "2.0.1rc3"'

    def validate(self, obj, value):
        if isinstance(value, tuple):
            if len(tuple) == 3:
                return value
        elif isinstance(value, basestring):
            v = re.match('([0-9]+)\.([0-9+])\.([0-9].*)', value)
            if v is not None:
                maj, minor, patch = v.groups()
                return (int(maj), int(minor), patch)
        self.error(obj, value)
    

class Lifecycle(object):
    """Interface that defines the lifecycle events of a service,
    in terms of callbacks. These callbacks will be used by the 
    :class:`IpService` to communicate with the IPython kernel,
    but they can also be extended to perform service-specific actions.    
    """
    def __init__(self, parent):
        self.parent = parent
        
    def on_start(self):
        """Called before execution starts"""
        pass
        
    def on_stage(self, num):
        """Called for stage changes"""
        pass
        
    def on_done(self):
        """Called on successful completion"""
        pass
        
    def on_error(self, code, msg):
        """Called on fatal error"""
        pass
        
class Service(HasTraits, Lifecycle):
    """Base Service class.

    Defines standard attributes, a run() method, and
    a status property. For behavior/usage of the status property,
    see :class:`Status`.
    """

    #: Name of the service; should be short identifier
    name = Unicode()
    #: Description of the service
    desc = Unicode()
    #: Version number of the service, see :class:`VersionNumber` for format
    version = VersionNumber()
    
    def __init__(self):
        self.status = Status(lifecycle=self)
        self.start, self.done, self.error = (self._status.start, self._status.done,
                                             self._status.error)
    def execute(self, params):
        """Wrapper for running the service. Subclasses
        should not redefine this unless they know what they are doing;
        instead override :meth:`run` in this class.
        """
        self.start()
        result = []
        try:
            result = self.run(params)
            self.done()
        except Exception, err:
            self.error(-1, "Fatal: {}".format(err))
        return result

    def run(self, params):
        """Actually run the service.
        
        :param params: Dictionary of parameters, form is up to service to define
        :type params: dict
        :result: A result object
        :rtype: ServiceResult
        """
        raise NotImplemented()


class Status(object):
    """Contains the current status of a running process.
    
    The basic model is that a process is in a 'stage', which is
    an integer starting at 1 and less than or equal to the total
    number of stages. Stages and total numbers of stages can
    change as long as the invariants 0 <= stage <= num_stages
    and 1 <= num_stages hold. Note that 0 is a special stage number
    meaning 'not yet started'.
    
    Uses a Lifecycle instance to provide callbacks for
    state changes.
    """
    def __init__(self, stages=1, lifecycle=None):
        if not isinstance(stages, int) or stages < 1:
            raise ValueError("Number of stages ({}) must be > 0".format(stages))
        if lifecycle is None:
            self._lc = Lifecycle(self)   # no-op obj
        else:
            self._lc = lifecycle
        self._stages = stages
        self._stage = 0
        self._done = False
        
    def start(self):
        """Start the process.
        Sets stage to 1 and calls :method:`Lifecycle.on_start()`.
        Idempotent.
        """
        if self._stage == 0 and not self._done:
            self._lc.on_start()
            self._stage = 1

    def advance(self):
        """Increments stage."""
        if not self._done:
            self.stage = self.stage + 1

    def done(self):
        """Done with process.
        Calls :method:`Lifecycle.on_done()`.
        Idempotent."""
        if not self._done:
            self._lc.on_done()
            self._done = True
        
    def error(self, code, msg):
        """Done with process due to an error.
        Calls :method:`Lifecycle.on_error()`.
        Idempotent."""
        if not self._done:
            self._lc.on_error(code, msg)
            self._done = True

    # get/set 'stage' property
    
    @property
    def stage(self):
        return self._stage

    @stage.setter
    def stage(self, value):
        if not isinstance(value, int):
            raise ValueError("stage ({}) must be an int")
        elif value < 0:
            raise ValueError("stage ({}) must be >= 0".format(value))
        elif value > self._stages:
            raise ValueError("stage ({}) must be <= num. stages ({})"
                             .format(value, self._stages))
        self._stage = value
        self._lc.on_stage(self._stage)
        
    # get/set 'stages' property

    @property
    def stages(self):
        return self._stages
        
    @stages.setter
    def stages(self, value):
        if not isinstance(value, int):
            raise ValueError("stages ({}) must be an int")
        elif value < 1:
            raise ValueError("stages ({}) must be >= 1".format(value))
        elif value < self._stage:
            raise ValueError("stages ({}) must be >= cur. stage ({})"
                             .format(value, self._stage))
        self._stages = value

##################################################################################

class IpService(Service):
    """Service that communicates with IPython kernel.
    """
    pass #XXX: Implement this
