"""
KBase narrative service and method API.

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
    

class Service(HasTraits):
    """Base Service class.
    """

    #: Name of the service; should be short identifier
    name = Unicode()
    #: Description of the service
    desc = Unicode()
    #: Version number of the service, see :class:`VersionNumber` for format
    version = VersionNumber()

class LifecycleSubject(object):
    """Contains the current status of a running process.
    
    The basic model is that a process is in a 'stage', which is
    an integer starting at 1 and less than or equal to the total
    number of stages. Stages and total numbers of stages can
    change as long as the invariants 0 <= stage <= num_stages
    and 1 <= num_stages hold. Note that 0 is a special stage number
    meaning 'not yet started'.
        """
    def __init__(self, stages=1):
        if not isinstance(stages, int) or stages < 1:
            raise ValueError("Number of stages ({}) must be > 0".format(stages))
        self._stages = stages
        self._stage = 0
        self._done = False
        self.obs = []
        
    def register(self, observer):
        self.obs.append(observers)
        
    def _event(self, name, *args):
        if name in events:
            for obs in self.obs:
                getattr(obs, name)(*args)

    ## Events

    def advance(self):
        """Increments stage."""
        if not self._done:
            self.stage = self.stage + 1
            self._event('stage', self._stage, self._stages)

    def started(self):
        """Start the process.
        Sets stage to 1.
        Idempotent.
        """
        if self._stage == 0 and not self._done:
            self._stage = 1
        self._event('started')
        self._event('stage', self._stage, self._stages)

    def done(self):
        """Done with process.
        Calls :method:`Lifecycle.on_done()`.
        Idempotent."""
        if not self._done:
            self._done = True
            self._event('done')
        
    def error(self, code, msg):
        """Done with process due to an error.
        Calls :method:`Lifecycle.on_error()`.
        Idempotent."""
        if not self._done:
            self._done = True
            self._event('error', code, msg)

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
        self._event('stage', self._stage, self._stages)
        
    # get/set 'stages' (number of stages) property

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


class LifecycleObserver(object):
    """Interface that defines the lifecycle events of a service,
    in terms of callbacks. These callbacks will be used by the 
    :class:`IpService` to communicate with the IPython kernel,
    but they can also be extended to perform service-specific actions.    
    """
    def started(self):
        """Called before execution starts"""
        pass
        
    def stage(self, num, total):
        """Called for stage changes"""
        pass
        
    def done(self):
        """Called on successful completion"""
        pass
        
    def error(self, code, msg):
        """Called on fatal error"""
        pass


class ServiceMethodHistory(LifecycleObserver):
    
    XXX: make this only one per service/method combination,
    XXX: so it is really a history..
    
    def __init__(self, method, max_save=1000):
        self._method = method
        self._t = [None, None]
        self._dur = -1
        
    def get_durations(self):
        This should return a list of tuples
          (start_time, duration, (params))

    def started(self):
        """Called before execution starts"""
        self._t[0] = time.time()
        
    def done(self):
        """Called on successful completion"""
        self._t[1] = time.time()
    
    def error(self, code, msg):
        """Called on fatal error"""
        pass



class ServiceMethod(HasTraits, LifecycleSubject):
    """A method of a service.
    
    Defines standard attributes, a run() method, and
    a status property. For behavior/usage of the status property,
    see :class:`Status`.
    """
    def __init__(self, service):
        """Constructor.
        
        :param service: Parent service
        :type service: Service
        """
        LifecycleSubject.__init__(self)
        self.service = service
        self._history = ServiceMethodHistory()
        self.register(self._history)

    def execute(self, params):
        """Wrapper for running the service. Subclasses
        should not redefine this unless they know what they are doing;
        instead override :meth:`run` in this class.
        """
        self.event('started')
        result = []
        try:
            result = self.run(params)
            self.event('done')
        except Exception, err:
            self.event('error', -1, "Fatal: {}".format(err))
        return result

    def run(self, params):
        """Actually run the service method.
        
        :param params: Dictionary of parameters, form is up to method to define
        :type params: dict
        :result: A result object
        :rtype: Result
        """
        raise NotImplemented()


    def estimate_runtime(self, params):
        """Based on history and params, estimate runtime for service.
        
        """
        return -1  # no @!$%# idea
        
        
##################################################################################

class IpService(Service):
    """Service that communicates with IPython kernel.
    """
    pass #XXX: Implement this
