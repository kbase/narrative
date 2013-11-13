"""
KBase narrative service and method API.

The main class defined here is :class:`Service`, but
for running in the IPython notebook, services should inherit from :class:`IpService`, which implements communication channels to the front-end and remote KBase registries.

Subclasses should override the constructor to provide service metadata,
and the run() method to perform the desired work.

Sample usage::

    from biokbase.common.service import Service

    class TaxiService(Service):
    
        def __init__(self):
            Service.__init__(self)
            self.name = "groovalicious"
            self.desc = "This service makes me want to dance"
            self.version = (1,0,1)

    class PickUp(ServiceMethod):
        
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
from collections import deque
import json
import logging
import os
import re
import time
# Third-party
import IPython.utils.traitlets as trt

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


class VersionNumber(trt.TraitType):
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
    

class Service(trt.HasTraits):
    """Base Service class.
    """

    #: Name of the service; should be short identifier
    name = trt.Unicode()
    #: Description of the service
    desc = trt.Unicode()
    #: Version number of the service, see :class:`VersionNumber` for format
    version = VersionNumber()

    def __init__(self, **meta):
        trt.HasTraits.__init__(self)
        # set traits from 'meta', if present
        for key, val in meta.iteritems():
            if hasattr(self, key):
                setattr(self, key, val)
        # list of all methods
        self.methods = []

    def add(self, m):
        self.methods.append(m)

    def as_json(self):
        d = {
            'name': self.name,
            'desc': self.desc,
            'version': self.version,
            'methods': [m.as_json() for m in self.methods]
        }
        return d


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
        self.obs.append(observer)
        
    def _event(self, name, *args):
        for obs in self.obs:
            getattr(obs, name)(*args)

    ## Events

    def advance(self):
        """Increments stage."""
        if not self._done:
            self._stage += 1
            self._event('stage', self._stage, self._stages)

    def started(self, params):
        """Start the process.
        Sets stage to 1.
        Idempotent.
        """
        if self._stage == 0 and not self._done:
            self._stage = 1
        self._event('started', params)
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
    def started(self, params):
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
    """Record duration between start/end in lifecycle events.
    """
    def __init__(self, method, max_save=1000):
        self._method = method
        self._t = [None, None]
        self._p = None
        self._hist = deque()  # each item: (t0, t1, dur, [params])
        self._maxlen = max_save

    def get_durations(self):
        """Past durations of the method.

        :return: All the past durations, in seconds
        :rtype: iterable of double
        """
        return (x[2] for x in self._hist)

    def started(self, params):
        """Called when execution starts
        """
        self._t[0] = time.time()
        self._p = params
        
    def done(self):
        """Called on successful completion
        """
        self._t[1] = time.time()
        dur = self._t[1] - self._t[0]
        self._hist.append(tuple(self._t + [dur, self._p]))
        if len(self._hist) > self._maxlen:
            self._hist.popleft()
    
    def error(self, code, msg):
        """Called on fatal error"""
        pass

    def estimated_runtime(self, params):
        """Based on history and params, estimate runtime for service.

        """
        dur = self._history.get_durations()
        if len(dur) == 0:
            estimate = -1  # no @!$%# idea
        else:
            # dumb: ignore params
            estimate = sum(dur) / len(dur)
        return estimate


class ServiceMethod(trt.HasTraits, LifecycleSubject):
    """A method of a service.
    
    Defines standard attributes, a run() method, and
    a status property. For behavior/usage of the status property,
    see :class:`Status`.
    """

    #: Name of the method; should be short identifier
    name = trt.Unicode()
    #: Description of the method
    desc = trt.Unicode()
    #: Parameters of method, a Tuple of traits
    params = trt.Tuple()

    def __init__(self, parent, history_class=ServiceMethodHistory, **meta):
        """Constructor.
        """
        LifecycleSubject.__init__(self)
        self._parent = parent
        self._history = history_class(self)
        self.register(self._history)
        # set traits from 'meta', if present
        for key, val in meta.iteritems():
            if hasattr(self, key):
                setattr(self, key, val)

    def estimated_runtime(self, params=()):
        return self._history.estimated_runtime(params)

    def execute(self, *params):
        """Wrapper for running the service.
        """
        self._validate(params)
        self.started(params)
        result = []
        try:
            result = self.run(params)
            self.done()
        except Exception, err:
            self.error(-1, "Fatal: {}".format(err))
        return result

    def set_func(self, fn, params):
        """Set the main function to run.

        :param fn: Function object to run
        :param params: Tuple() of traits

        :raise: ValueError, if function signature does not match
        """
        self.run = fn
        self.name = fn.__name__
        for i, p in enumerate(params):
            p.name = "param{:d}".format(i)
        self.params = params

    def _validate(self, p):
        if len(p) != len(self.params):
            raise ValueError("Wrong number of arguments. got={} wanted={}".format(len(p), len(self.params)))
        for obj, spec in zip(p, self.params):
            try:
                spec.validate(spec, obj)
            except trt.TraitError, err:
                raise ValueError("Argument type error: {}".format(err))

    def as_json(self):
        d = {
            'name': self.name,
            'desc': self.desc,
            'params': [(p.name, p.info_text, p.get_metadata('desc')) for p in self.params]
        }
        return d

#############################################################################


def pick_up_people(num, where_from, where_to):
    print("Pick up {:d} people at {} and drive to {}".format(num, where_from, where_to))


class Person(trt.Unicode):
    default_value = "Joe Schmoe"
    info_text = 'the name of a person'

    def validate(self, obj, value):
        trt.Unicode.validate(self, obj, value)


def example():
    service = Service(name="taxicab", desc="yellow cab", version="0.0.1-alpha")
    method = ServiceMethod(service, name="pickup", desc="Pick up people in a taxi")
    method.set_func(pick_up_people,
                    (trt.Int(1, desc="number of people"), trt.Unicode("", desc="Pick up location"),
                     trt.Unicode("", desc="main drop off location"),
                     Person("", desc="Person who called the taxi")))
    service.add(method)
    service.add(ServiceMethod(service, name="circle", desc="Drive around in circles"))
    #
    print(json.dumps(service.as_json(), indent=2))
    #
    try:
        method.execute(1)
    except ValueError, err:
        print("as expected, validation failed: {}".format(err))
    #
    try:
        method.execute(1, "here", 3.14, "me")
    except ValueError, err:
        print("as expected, validation failed: {}".format(err))
    #
    method.execute(1, "here", "there", "dang")
    print("it worked!")

if __name__ == '__main__':
    example()