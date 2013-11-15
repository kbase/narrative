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
import sys
import time
# Third-party
import IPython.utils.traitlets as trt
# Local
from . import kbtypes

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


class URLS:
    workspace = "http://kbase.us/services/workspace"
    invocation = "https://kbase.us/services/invocation"

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

## Utility functions / classes


def is_sequence(arg):
    """Returns True only if input acts like a sequence, but does
    not act like a string.
    """
    return (not hasattr(arg, "strip") and
            hasattr(arg, "__getitem__") or
            hasattr(arg, "__iter__"))


def get_func_desc(fn):
    """Get function description from docstring.
    """
    doc, desc = fn.__doc__, []
    for line in doc.split("\n"):
        line = line.strip()
        if line == "":
            break
        desc.append(line)
    return ' '.join(desc)


def get_func_info(fn):
    """Get params and return from docstring
    """
    doc = fn.__doc__
    params, return_ = {}, {}
    param_order = []
    for line in doc.split("\n"):
        line = line.strip()
        if line.startswith(":param"):
            _, name, desc = line.split(":", 2)
            name = name[6:].strip()  # skip 'param '
            params[name] = {'desc': desc.strip()}
            param_order.append(name)
        elif line.startswith(":type"):
            _, name, desc = line.split(":", 2)
            name = name[5:].strip()  # skip 'type '
            if not name in params:
                raise ValueError("'type' without 'param' for {}".format(name))
            typeobj = eval(desc.strip())
            params[name]['type'] = typeobj
        elif line.startswith(":return"):
            _1, _2, desc = line.split(":", 2)
            return_['desc'] = desc
        elif line.startswith(":rtype"):
            _1, _2, desc = line.split(":", 2)
            typeobj = eval(desc.strip())
            return_['type'] = typeobj
    r_params = []
    for i, name in enumerate(param_order):
        type_ = params[name]['type']
        desc = params[name]['desc']
        r_params.append(type_(desc=desc))
    if return_ is None:
        r_output = None
    else:
        r_output = return_['type'](desc=return_['desc'])
    return r_params, r_output

## Service classes


class Service(trt.HasTraits):
    """Base Service class.
    """

    #: Name of the service; should be short identifier
    name = trt.Unicode()
    #: Description of the service
    desc = trt.Unicode()
    #: Version number of the service, see :class:`VersionNumber` for format
    version = kbtypes.VersionNumber()

    def __init__(self, **meta):
        trt.HasTraits.__init__(self)
        # set traits from 'meta', if present
        for key, val in meta.iteritems():
            if hasattr(self, key):
                setattr(self, key, val)
        # list of all methods
        self.methods = []

    def add_method(self, method=None, **kw):
        """Add one :class:`ServiceMethod`

        :param method: The method. If missing, create an instance from keywords.
        :type method: ServiceMethod or None
        :param kw: Keywords if creating a ServiceMethod
        :type kw: dict
        :return: The method (given or created)
        :rtype: ServiceMethod
        :raise: If method is None, anything raised by :class:`ServiceMethod` constructor
        """
        if not method:
            method = ServiceMethod(**kw)
        self.methods.append(method)
        return method

    def quiet(self, value=True):
        """Make all methods quiet.
        See :meth:`ServiceMethod.quiet`.
        """
        for m in self.methods:
            m.quiet(value)

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

    def unregister(self, observer):
        self.obs.remove(observer)

    def _event(self, name, *args):
        for obs in self.obs:
            getattr(obs, name)(*args)

    ## Events

    def reset(self):
        self._stage = 0
        self._done = False

    def advance(self, name):
        """Increments stage, giving it a name."""
        if not self._done:
            self._stage += 1
            self._event('stage', self._stage, self._stages, name)

    def started(self, params):
        """Start the process.
        Idempotent.
        """
        self._done = False
        self._event('started', params)

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
        self._event('stage', self._stage, self._stages, '')
        
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
        
    def stage(self, num, total, name):
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

    def stage(self, num, ttl, name):
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
    * P - progress ; rest of line is '<name>,<num>,<num>' meaning: stage name,current,total
    * E - error ; rest of line is JSON object with key/vals about the error.
          For details see the :class:`ServiceError` subclasses.

    Example:

    >>> subj = LifecycleSubject(stages=3)
    >>> lpr = LifecyclePrinter()
    >>> subj.register(lpr)
    >>> subj.started([])
    @@S
    >>> subj.advance("foo")
    @@Pfoo,1,3
    >>> subj.done()
    @@D

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

    def stage(self, n, total, name):
        self._write('P{},{:d},{:d}'.format(name, n, total))

    def error(self, code, err):
        self._write('E' + err.as_json())


class ServiceMethod(trt.HasTraits, LifecycleSubject):
    """A method of a service.
    
    Defines some metadata and a function, using :meth:`set_func`,
    to run the service. Call the class instance like a function
    to execute the service in its wrapped mode.

    Note that for services to be able to chain their results forward to
    the next called service, a method _must_ return a value.

    Example usage:

    >>> svc = Service()
    >>> def multiply(m, a,b): return a*b
    >>> meth = ServiceMethod(svc, quiet=True)
    >>> meth.set_func(multiply, (trt.CFloat(), trt.CFloat()), (trt.Float(),))
    >>> c = meth(9, 8)[0]
    >>> c
    72
    >>> # validation catches bad args, function isn't called
    >>> c = meth("strawberry", "alarmclock")
    >>> print(c)
    None

    """

    #: Name of the method; should be short identifier
    name = trt.Unicode()
    #: Description of the method
    desc = trt.Unicode()
    #: Parameters of method, a Tuple of traits
    params = trt.Tuple()
    #: Output of the method, a Tuple of traits
    outputs = trt.Tuple()

    def __init__(self, status_class=LifecycleHistory, quiet=False,
                 func=None, **meta):
        """Constructor.

        :param status_class: Subclass of LifecycleObserver to instantiate
                             and use by default for status queries.
                             Other observers can be used with :meth:`register`.
        :type status_class: type
        :param bool quiet: If True, don't add the printed output
        :param func: Function to auto-wrap, if present
        :param meta: Other key/value pairs to set as traits of the method.
        """
        LifecycleSubject.__init__(self)
        self._history = status_class(self)
        self.register(self._history)
        self._lpr = None
        self.quiet(quiet)
        # set traits from 'meta', if present
        for key, val in meta.iteritems():
            if hasattr(self, key):
                setattr(self, key, val)
        # Call set_func() with metadata from function
        # docstring, if function is given
        if func is not None:
            self.desc = get_func_desc(func)
            params, output = get_func_info(func)
            self.set_func(func, tuple(params), (output,))

    def quiet(self, value=True):
        """Control printing of status messages.
        """
        if value:
            if self._lpr:
                self.unregister(self._lpr)
                self._lpr = None
        else:
            if not self._lpr:
                self._lpr = LifecyclePrinter()
                self.register(self._lpr)

    def set_func(self, fn, params, outputs):
        """Set the main function to run, and its metadata.
        Although params and outputs are normally traits or
        subclasses of traits defined in kbtypes, the value
        None is also allowed for return values.

        :param fn: Function object to run
        :param params: tuple of traits describing input parameters
        :param outputs: tuple of traits, describing the output value(s)

        :raise: ServiceMethodParameterError, if function signature does not match
                ValueError, if None is given for a param
        """
        self.run = fn
        self.name = fn.__name__
        for i, p in enumerate(params):
            if p is None:
                raise ValueError("None is not allowed for a parameter type")
            p.name = "param{:d}".format(i)
        self.params = params
        for i, o in enumerate(outputs):
            o.name = "output{:d}".format(i)
        self.outputs = outputs
        self._one_output_ok = len(outputs) == 1

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
            self._validate(params, self.params)
            self.started(params)
            tmpresult = self.run(self, *params)
            if self._one_output_ok and not is_sequence(tmpresult):
                tmpresult = (tmpresult,)
            self._validate(tmpresult, self.outputs)
            result = tmpresult
            self.done()
        except ServiceMethodError, err:
            self.error(-2, err)
        except Exception, err:
            self.error(-1, ServiceMethodError(self, err))
        return result

    def _validate(self, values, specs):
        if len(values) != len(specs):
            raise ServiceMethodParameterError(self, "Wrong number of arguments. got={} wanted={}"
                                              .format(len(values), len(specs)))
        for val, spec in zip(values, specs):
            if spec is None:
                if val is not None:
                    err = "None expected, got {}".format(val)
                    raise ServiceMethodParameterError(self, "Argument type error: {}".format(err))
            else:
                try:
                    spec.validate(spec, val)
                except trt.TraitError, err:
                    raise ServiceMethodParameterError(self, "Argument type error: {}".format(err))

    def estimated_runtime(self, params=()):
        """Calculate estimated runtime, for the given parameters.

        :param tuple params: List of parameter values
        :return: Runtime, in seconds. Use -1 for "unknown"
        :rtype: double
        """
        return self._history.estimated_runtime(params)

    def as_json(self):
        d = {
            'name': self.name,
            'desc': self.desc,
            'params': [(p.name, p.info_text, p.get_metadata('desc')) for p in self.params],
            'outputs': [(p.name, p.info_text, p.get_metadata('desc')) for p in self.outputs]
        }
        return d

    trt_2_jschema = { 'a unicode string' : 'string',
                      'an int' : 'integer',
                      'a list or None' : 'array',
                      'a set or None' : 'array',
                      'a tuple or None' : 'array',
                      'a dict or None' : 'object',
                      'a float' : 'number',
                      'a boolean' : 'boolean'}
                             
    def as_json_schema(self):
        d = {
            'title': self.name,
            'type': 'object',
            'description': self.desc,
            'properties' : {
                'parameters': { p.name : {  'type': self.trt_2_jschema.get(p.info_text,'object'), 'description' : p.get_metadata('desc')} for p in self.params },
            },
            'returns': { p.name : { 'type' : self.trt_2_jschema.get(p.info_text,'object'), 'description' : p.get_metadata('desc')} for p in self.outputs}
        }
        return d

    def as_json_schema_dumps(self):
        return json.dumps(self.as_json_schema())

#############################################################################


def example():

    # New data type for a Person
    class Person(trt.Unicode):
        default_value = "Joe Schmoe"
        info_text = 'the name of a person'

        def validate(self, obj, value):
            trt.Unicode.validate(self, obj, value)

    # Function that does the work of the "pickup" method
    def pick_up_people(method, num, where_from, where_to, who):
        method.stages = 3
        if num < 1:
            raise ValueError("Can't pick up less than one person ({})".format(num))
        if num == 99:
            return 1, 2, 3
        print("{} called for {:d} people to be driven from {} to {}".format(who, num, where_from, where_to))
        time.sleep(0.5)
        method.advance("pickup: " + where_from)
        print("picking up {} and {:d} other bozos at {}".format(who, num - 1, where_from))
        time.sleep(0.5)
        method.advance('dropoff: ' + where_to)
        print("dropping off {} and {:d} other bozos at {}".format(who, num - 1, where_to))
        # for one return value, a list/tuple is optional
        if num < 5:
            return num
        else:
            return [num]

    # Create a new service
    service = Service(name="taxicab", desc="Yellow Cab taxi service", version="0.0.1-alpha")
    # Create and initialize a method in the service
    method = ServiceMethod(name="pickup", desc="Pick up people in a taxi")
    method.set_func(pick_up_people,
                    (trt.Int(1, desc="number of people"), trt.Unicode("", desc="Pick up location"),
                     trt.Unicode("", desc="main drop off location"),
                     Person("", desc="Person who called the taxi")),
                    (trt.Int([], desc="Number of people dropped off"),))
    service.add_method(method)

    hdr = lambda s: "\n### " + s + " ###\n"
    from pprint import pformat
    # An example of dumping out the service method metadata as JSON
    print(hdr("Metadata"))
    print pformat(method.as_json())

    # An example of dumping out the service method metadata as JSON
    print(hdr("JSON Schema Metadata"))
    print pformat(method.as_json_schema())

    # An example of dumping out the service method metadata as JSON
    print(hdr("JSON Schema Metadata (json.dumps()"))
    print method.as_json_schema_dumps()

    # An example of parameter validation
    print(hdr("Bad parameters"))
    r = method(1)
    assert(r is None)

    # An example of function error
    print(hdr("Function error"))
    r = method(0, "here", "there", "me")
    assert (r is None)

    # Failure, bad output
    print(hdr("Bad output type"))
    r = method(99, "here", "there", "me")
    assert (r is None)

    # The "happy path" example
    print(hdr("Success 1"))
    r = method(3, "Berkeley", "San Francisco", "Willie Brown")
    assert(r is not None)
    print(hdr("Success 2"))
    r = method(9, "Dubuque", "Tallahassee", "Cthulhu")
    assert (r is not None)


if __name__ == '__main__':
    example()
