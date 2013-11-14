"""
KBase narrative service and method API.

The main classes defined here are :class:`Service` and :class:`ServiceMethod`.

See :func:`example` for an example of usage.
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
import sys
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

## Exceptions


class ServiceError(Exception):
    """Base class for Service errors.
    Should not normally be instantiated directly.
    """

    def __init__(self, errmsg):
        Exception.__init__(self, errmsg)
        self._info = {
            'severity': 'FATAL',
            'type': self.__class__.__name__,
            'msg': str(errmsg)
        }

    def add_info(self, k, v):
        self._info[k] = v

    def as_json(self):
        return json.dumps(self._info)


class ServiceMethodError(ServiceError):
    """Base class for all ServiceMethod errors"""

    def __init__(self, method, errmsg):
        msg = "in ServiceMethod '{}': {}".format(method.name, errmsg)
        ServiceError.__init__(self, msg)
        self.add_info('method_name', method.name)


class ServiceMethodParameterError(ServiceMethodError):
    """Bad parameter for ServiceMethod."""

    def __init__(self, method, errmsg):
        msg = "bad parameter: " + errmsg
        ServiceMethodError.__init__(self, method, msg)
        self.add_info('details', errmsg)

## Custom traits


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
    

## Service classes


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
        self.reset()
        self.obs = []

    def register(self, observer):
        self.obs.append(observer)
        
    def _event(self, name, *args):
        for obs in self.obs:
            getattr(obs, name)(*args)

    ## Events

    def reset(self):
        self._stage = 0
        self._done = False

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
        self._stage, self._done = 1, False
        self._event('started', params)
        self._event('stage', self._stage, self._stages)

    def done(self):
        """Done with process.
        Idempotent.
        """
        if not self._done:
            self._done = True
            self._event('done')
        
    def error(self, code, err):
        """Done with process due to an error.
        Idempotent.
        """
        if not self._done:
            self._done = True
            self._event('error', code, err)

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
        
    def error(self, code, err):
        """Called on fatal error"""
        pass


class LifecycleHistory(LifecycleObserver):
    """Record duration between start/end in lifecycle events.
    """
    def __init__(self, method, max_save=1000):
        self._method = method
        self._t = [None, None]
        self._p = None
        self._hist = deque()  # each item: (t0, t1, dur, [params])
        self._maxlen = max_save
        self._cur_stage, self._nstages = 0, 0

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

    def stage(self, num, ttl):
        self._cur_stage = num
        self._nstages = ttl

    def done(self):
        """Called on successful completion
        """
        self._t[1] = time.time()
        dur = self._t[1] - self._t[0]
        self._hist.append(tuple(self._t + [dur, self._p]))
        if len(self._hist) > self._maxlen:
            self._hist.popleft()
    
    def error(self, code, err):
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


class LifecyclePrinter(LifecycleObserver):
    """Observe lifecycle events and print out messages to stdout.
    This allows the front-end to get the current status of the process
    by simply looking for 'special' lines on stdout.

    After the prefix there is a 1-letter code:

    * S - started
    * D - done
    * P - progress ; rest of line is '<num>/<num>' meaning current/total
    * E - error ; rest of line is JSON object with key/vals about the error.
          For details see the :class:`ServiceError` subclasses.
    """
    #: Special prefixes for output to stdout
    #: that indicates the status of the process.
    SPECIAL_PFX = '@@'

    def _write(self, s):
        sys.stdout.write(self.SPECIAL_PFX + s + "\n")
        sys.stdout.flush()

    def started(self, params):
        self._write('S')

    def done(self):
        self._write('D')

    def stage(self, n, total):
        self._write('P{:d}/{:d}'.format(n, total))

    def error(self, code, err):
        self._write('E' + err.as_json())


class ServiceMethod(trt.HasTraits, LifecycleSubject):
    """A method of a service.
    
    Defines some metadata and a function, using :meth:`set_func`,
    to run the service. Call the class instance like a function
    to execute the service in its wrapped mode.

    Example usage::

        >>> svc = Service()
        >>> def multiply(a,b): return a*b
        >>> meth = ServiceMethod(svc)
        >>> meth.set_func(multiply)
        >>> c = meth(9, 8)
        >>> c
        72


    """

    #: Name of the method; should be short identifier
    name = trt.Unicode()
    #: Description of the method
    desc = trt.Unicode()
    #: Parameters of method, a Tuple of traits
    params = trt.Tuple()

    def __init__(self, parent, status_class=LifecycleHistory, **meta):
        """Constructor.

        :param Service parent: The Service that this method belongs to
        :param status_class: Subclass of LifecycleObserver to instantiate
                             and use by default for status queries.
                             Other observers can be used with :meth:`register`.
        :type status_class: type
        :param meta: Other key/value pairs to set as traits of the method.
        """
        LifecycleSubject.__init__(self)
        self._parent = parent
        self._history = status_class(self)
        self.register(self._history)
        self.register(LifecyclePrinter())  # sends status back to front-end
        # set traits from 'meta', if present
        for key, val in meta.iteritems():
            if hasattr(self, key):
                setattr(self, key, val)

    def estimated_runtime(self, params=()):
        """Calculate estimated runtime, for the given parameters.

        :param tuple params: List of parameter values
        :return: Runtime, in seconds. Use -1 for "unknown"
        :rtype: double
        """
        return self._history.estimated_runtime(params)

    def __call__(self, *params):
        """Run the method when the class instance is called like
        a function.

        :param params: List of parameters for the method
        :return: From function given with :meth:`set_func`
        :raise: ServiceMethodParameterError, if parameters don't validate
        """
        result = None
        self.reset()
        try:
            self._validate(params)
            self.started(params)
            result = self.run(self, *params)
            self.done()
        except ServiceMethodError, err:
            self.error(-2, err)
        except Exception, err:
            self.error(-1, ServiceMethodError(self, err))
        return result

    def set_func(self, fn, params):
        """Set the main function to run.

        :param fn: Function object to run
        :param params: Tuple() of traits

        :raise: ServiceMethodParameterError, if function signature does not match
        """
        self.run = fn
        self.name = fn.__name__
        for i, p in enumerate(params):
            p.name = "param{:d}".format(i)
        self.params = params

    def _validate(self, p):
        if len(p) != len(self.params):
            raise ServiceMethodParameterError(self, "Wrong number of arguments. got={} wanted={}".format(len(p), len(self.params)))
        for obj, spec in zip(p, self.params):
            try:
                spec.validate(spec, obj)
            except trt.TraitError, err:
                raise ServiceMethodParameterError(self, "Argument type error: {}".format(err))

    def as_json(self):
        d = {
            'name': self.name,
            'desc': self.desc,
            'params': [(p.name, p.info_text, p.get_metadata('desc')) for p in self.params]
        }
        return d

#############################################################################


def pick_up_people(method, num, where_from, where_to, who):
    method.stages = 3
    if num < 1:
        raise ValueError("Can't pick up less than one person ({})".format(num))
    print("{} called for {:d} people to be driven from {} to {}".format(who, num, where_from, where_to))
    time.sleep(2)
    method.advance()
    print("picking up {} and {:d} other bozos at {}".format(who, num-1, where_from))
    time.sleep(2)
    method.advance()
    print("dropping off {} and {:d} other bozos at {}".format(who, num-1, where_to))
    return [num]


class Person(trt.Unicode):
    default_value = "Joe Schmoe"
    info_text = 'the name of a person'

    def validate(self, obj, value):
        trt.Unicode.validate(self, obj, value)


def example():
    service = Service(name="taxicab", desc="Yellow Cab taxi service", version="0.0.1-alpha")
    method = ServiceMethod(service, name="pickup", desc="Pick up people in a taxi")
    method.set_func(pick_up_people,
                    (trt.Int(1, desc="number of people"), trt.Unicode("", desc="Pick up location"),
                     trt.Unicode("", desc="main drop off location"),
                     Person("", desc="Person who called the taxi")))
    service.add(method)
    service.add(ServiceMethod(service, name="circle", desc="Drive around in circles"))
    #
    hdr = lambda s: "\n### " + s + " ###\n"
    print(hdr("Bad parameters"))
    r = method(1)
    assert(r is None)

    print(hdr("Function error"))
    r = method(0, "here", "there", "me")
    assert (r is None)

    print(hdr("Success"))
    r = method(3, "Berkeley", "San Francisco", "Willie Brown")
    assert(r is not None)

if __name__ == '__main__':
    example()