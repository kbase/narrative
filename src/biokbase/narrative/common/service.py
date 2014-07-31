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
import traceback
# Third-party
import IPython.utils.traitlets as trt
from IPython.core.application import Application
# Local
from biokbase.narrative.common import kbtypes, kblogging

# Init logging.
_log = logging.getLogger(__name__)

## Globals

from url_config import URLS

# class Struct:
#     def __init__(self, **args):
#         self.__dict__.update(args)

# try:
#     nar_path = os.environ["NARRATIVEDIR"]
#     config_json = open(os.path.join(nar_path, "config.json")).read()
#     config = json.loads(config_json)
#     url_config = config[config['config']]  #fun, right?

#     URLS = Struct(**url_config)
# except:
#     url_dict = {
#         "workspace" : "https://kbase.us/services/ws/",
#         "invocation" : "https://kbase.us/services/invocation",
#         "fba" : "https://kbase.us/services/KBaseFBAModeling",
#         "genomeCmp" : "https://kbase.us/services/genome_comparison/jsonrpc",
#         "trees" : "http://dev19.berkeley.kbase.us:7047"
#     }
#     URLS = Struct(**url_dict)

# class URLS:
#     workspace = "https://kbase.us/services/ws/"
#     invocation = "https://kbase.us/services/invocation"
#     #fba = "http://140.221.84.183:7036"
#     fba = "https://kbase.us/services/KBaseFBAModeling"
#     genomeCmp = "http://140.221.85.57:8283/jsonrpc"

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


class DuplicateServiceError(ServiceError):
    pass


class ServiceMethodError(ServiceError):
    """Base class for all ServiceMethod errors"""

    def __init__(self, method, errmsg, tb=None):
        msg = "in function '{}': {}".format(method.name, errmsg)
        ServiceError.__init__(self, msg)
        self.add_info('method_name', method.name)
        if tb is not None:
            self.add_info('traceback',
                          self.traceback_dict(tb))

    TB_KEYS = 'filename', 'line', 'function', 'text'

    def traceback_dict(self, tb):
        """Extract and reformat traceback as a dict, for reporting in narrative.

        :param tb: List of stack trace entries.
        :type tb: list
        :return: List where each entry is converted into a dict with
                 key/value pairs corresponding to the quadruple given above.
        :rtype: dict
        """
        etb = traceback.extract_tb(tb)
        return [{self.TB_KEYS[i]: entry[i] for i in xrange(len(entry))}
                for entry in etb]


class ServiceMethodParameterError(ServiceMethodError):
    """Bad parameter for ServiceMethod."""

    def __init__(self, method, errmsg):
        msg = "bad parameter: " + errmsg
        ServiceMethodError.__init__(self, method, msg)
        self.add_info('details', errmsg)


class ServiceRegistryFormatError(ServiceMethodError):
    """Bad format for Service Registry."""

    def __init__(self, method, errmsg):
        msg = "bad registry format: " + errmsg
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
        # :param
        if line.startswith(":param"):
            _, name, desc = line.split(":", 2)
            name = name[6:].strip()  # skip 'param '
            params[name] = {'desc': desc.strip()}
            param_order.append(name)
        # :type (of parameter, should be in kbtypes)
        elif line.startswith(":type"):
            _, name, desc = line.split(":", 2)
            name = name[5:].strip()  # skip 'type '
            if not name in params:
                raise ValueError("'type' without 'param' for {}".format(name))
            typeobj = eval(desc.strip())
            params[name]['type'] = typeobj

        # :default (value of parameter)
        elif line.startswith(":default"):
            _, name, value = line.split(":", 2)
            name = name[8:].strip()  # skip 'default '
            if not name in params:
                raise ValueError("'default' without 'param' for {}".format(name))
            params[name]['default'] = value.strip() # XXX: should allow quoting

        # :ui_name (of parameter) - the name that should be displayed in the user interface
        elif line.startswith(":ui_name"):
            _, name, ui_name = line.split(":", 2)
            name = name[8:].strip()  # skip 'ui_name '
            if not name in params:
                raise ValueError("'ui_name' without 'param' for {}".format(name))
            ui_name = ui_name.strip()
            params[name]['ui_name'] = ui_name

        # :return - name of thing to return
        elif line.startswith(":return"):
            _1, _2, desc = line.split(":", 2)
            return_['desc'] = desc.strip()

        # :rtype - type of thing to return
        elif line.startswith(":rtype"):
            _1, _2, desc = line.split(":", 2)
            typeobj = eval(desc.strip())
            return_['type'] = typeobj

        # :input_widget - the default visualization widget for this method. 
        # Should be the name as it's invoked in Javascript.
        elif line.startswith(":input_widget"):
            _1, _2, widget = line.split(":", 2)
            return_['input_widget'] = widget.strip()

        # :output_widget - the visualization widget for this method. 
        # Should be the name as it's invoked in Javascript.
        elif line.startswith(":output_widget"):
            _1, _2, widget = line.split(":", 2)
            return_['output_widget'] = widget.strip()

        # :embed - True if the widget should be automatically embedded.
        # so, probably always True, but not necessarily
        elif line.startswith(":embed"):
            _1, _2, embed = line.split(":", 2)
            embed = eval(embed.strip())
            return_['embed_widget'] = embed
    r_params = []
    vis_info = {'input_widget': None,
                'output_widget': None,
                'embed_widget': True}
    for i, name in enumerate(param_order):
        type_ = params[name]['type']
        desc = params[name]['desc']
        ui_name = params[name].get('ui_name', name)  # use parameter name if no ui_name is given
        if 'default' in params[name]:
            # set default value
            dflt = params[name]['default']
            pvalue = type_(dflt, desc=desc, ui_name=ui_name)
        else:
            # no default value
            pvalue = type_(desc=desc, ui_name=ui_name)
        r_params.append(pvalue)
    if not return_:
        r_output = None
    else:
        r_output = return_['type'](desc=return_['desc'])
        vis_info = dict(vis_info.items() + return_.items())
    return r_params, r_output, vis_info

## Registry

_services = {}


def register_service(svc, name=None):
    """Register a service.

    This will fail if there is already a service registered by that name.
    If you want to replace a service, you must call :func:`unregister_service`
    and then this method.

    :param Service svc: Service object
    :param str name: Service name. If not present, use `svc.name`.
    :return: None
    :raise: DuplicateServiceError, if service already is registered
    """
    if name is None:
        name = svc.name
    if name in _services:
        raise DuplicateServiceError(name)
    _services[name] = svc


def unregister_service(svc=None, name=None):
    """Unregister a service.

    :param Service svc: Service object. If not present, use `name`.
    :param str name: Service name. If not present, use `svc.name`.
    :raise: ValueError if bad arguments, KeyError if service not found
    """
    if name is None:
        if svc is None:
            raise ValueError("Service object or name required")
        name = svc.name
        if name is None:
            raise ValueError("Service object has no name")
    del _services[name]


def get_service(name):
    """Get a registered service by name.

    :param str name: Service name
    :return: The service, or None
    :rtype: Service
    """
    return _services.get(name, None)


def get_all_services(as_json=False, as_json_schema=False):
    """Get all registered services, as objects (default) as JSON, or as JSON schema.

    :param bool as_json: If True, return JSON instead of objects. Supersedes as_json_schema.
    :param bool as_json_schema: If True, return JSON schema instead of objects.
    :return: dict of {service name : Service object or JSON}
    """
    if as_json or as_json_schema:
        if as_json:
            return json.dumps({name: inst.as_json() for name, inst in _services.iteritems()})
        else:
            return json.dumps({name: inst.as_json_schema() for name, inst in _services.iteritems()})
    else:
        return _services.copy()

## Service classes


class Service(trt.HasTraits):
    """Base Service class.
    """

    __all__ = dict()

    #: Name of the service; should be short identifier
    name = trt.Unicode()
    #: Description of the service
    desc = trt.Unicode()
    #: Version number of the service, see :class:`VersionNumber` for format
    version = kbtypes.VersionNumber()

    def __init__(self, **meta):
        """Initialize a Service instance.

        :param meta: Metadata keywords to set as attributes on the instance.
                     Special keywords are `name`, `desc`, and `version` (see
                     documentation for each).
        """
        trt.HasTraits.__init__(self)
        # set traits from 'meta', if present
        for key, val in meta.iteritems():
            if hasattr(self, key):
                setattr(self, key, val)
        # list of all methods
        self.methods = []
        # register the new instance so long as the service was
        # properly declared with a name
        if 'name' in meta:
            self.__class__.__all__[meta['name']] = self

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

    def get_method(self, name):
        """Get a service method, by name.

        :param str name: Method name
        :return: Method or None
        :rtype: ServiceMethod
        """
        for m in self.methods:
            #print("check vs {}".format(m.name))
            if m.name == name:
                return m
        print("didn't find {}".format(name))
        return None

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

    def as_json_schema(self):
        d = {
            'name': self.name,
            'desc': self.desc,
            'version': self.version,
            'methods': [m.as_json_schema() for m in self.methods]
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

    def debug(self, msg):
        """Debugging message.
        """
        self._event('debug', msg)

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

    def debug(self, msg):
        """Debugging message"""
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
        """Based on history and params, estimate runtime for function.

        """
        dur = self.get_durations()
        if len(dur) == 0:
            estimate = -1  # no @!$%# idea
        else:
            # dumb: ignore params, take mean
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

    def debug(self, msg):
        self._write('G' + msg)


class LifecycleLogger(LifecycleObserver):
    """Log lifecycle messages in a simple but structured format,
    to a file.
    """
    MAX_MSG_LEN = 240  # Truncate message to this length, in chars
                       # Actual display may be a bit longer to indicate
                       # that the message was indeed truncated.

    def __init__(self, name, debug=False):
        """Create a Python logging.Logger with the given name, under the existing
        IPython logging framework.

        :param name: Name of logger
        :type name: str
        :param debug: Whether to set debug as the log level
        :type debug: bool
        """
        self._name = name
        # use the IPython application singleton's 'log' trait
        # self._log = Application.instance().log
        self._log = kblogging.get_logger(name)
        if debug:
            self._log.setLevel(logging.DEBUG)
        else:
            self._log.setLevel(logging.INFO)
        self._is_debug = debug
        self._start_time = None

    def _write(self, level, event, msg):
        if msg and (len(msg) > self.MAX_MSG_LEN):
            msg = msg[:self.MAX_MSG_LEN] + " [..]"
        # replace newlines with softer dividers
        msg = msg.replace("\n\n", "\n").replace("\n", " // ").replace("\r", "")
        # log the whole tamale
        self._log.log(level, "{} {}".format(event, msg))

    def started(self, params):
        self._write(logging.INFO, "func.begin", "params={}".format(params))
        self._start_time = time.time()

    def done(self):
        t = time.time()
        if self._start_time is not None:
            dur = t - self._start_time
            self._start_time = None
        else:
            dur = -1
        self._write(logging.INFO, "func.end", "dur={:.3g}".format(dur))

    def stage(self, n, total, name):
        self._write(logging.INFO, "func.stage.{}".format(name),
                    "num={:d} total={:d}".format(n, total))

    def error(self, code, err):
        self._write(logging.ERROR, "func.error code={:d}".format(code), "msg={}".format(err))

    def debug(self, msg):
        if self._is_debug:
            self._write(logging.DEBUG, "func.debug", "msg={}".format(msg))


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
        self._observers = []  # keep our own list of 'optional' observers
        # set traits from 'meta', if present
        for key, val in meta.iteritems():
            if hasattr(self, key):
                setattr(self, key, val)
        # Call set_func() with metadata from function
        # docstring, if function is given
        if func is not None:
            self.desc = get_func_desc(func)
            params, output, vis_info = get_func_info(func)
            self.set_func(func, tuple(params), (output,), vis_info)
        # Set logging level. Do this last so it can use func. name
        self.quiet(quiet)

    def quiet(self, value=True):
        """Control printing of status messages.
        """
        if value:
            # make it quiet
            if self._observers:  # for idempotence
                map(self.unregister, self._observers)
                self._observers = []
        else:
            # make some noise
            if not self._observers:  # for idempotence
                self._observers = [LifecyclePrinter(),
                                   LifecycleLogger(self.name, debug=True)]
                map(self.register, self._observers)

    def set_func(self, fn, params, outputs, vis_info):
        """Set the main function to run, and its metadata.
        Although params and outputs are normally traits or
        subclasses of traits defined in kbtypes, the value
        None is also allowed for return values.

        :param fn: Function object to run
        :param params: tuple of traits describing input parameters
        :param outputs: tuple of traits, describing the output value(s)
        :param vis_info: visualization information, with two keys:
                           * 'widget':  Name of the default widget.
                           * 'embed_widget': Whether it should automatically be shown, default = True.
        :type vis_info: dict
        :raise: ServiceMethodParameterError, if function signature does not match
                ValueError, if None is given for a param
        """
        self.run = fn
        if self.name is None:
            self.name = fn.__name__

        # Handle parameters
        for i, p in enumerate(params):
            if p is None:
                raise ValueError("None is not allowed for a parameter type")
            p.name = "param{:d}".format(i)
        self.params = params

        # Handle outputs
        for i, o in enumerate(outputs):
            o.name = "output{:d}".format(i)

        # Set widget name
        self.input_widget = None
        if 'input_widget' in vis_info and vis_info['input_widget'] is not None:
            self.input_widget = vis_info['input_widget']

        self.output_widget = None
        if 'output_widget' in vis_info and vis_info['output_widget'] is not None:
            self.output_widget = vis_info['output_widget']

        # Set embed_widget
        self.embed_widget = True
        if 'embed' in vis_info and vis_info['embed_widget'] is not None:
            self.embed_widget = vis_info['embed_widget']

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
        except ServiceMethodError as err:
            self.error(-2, err)
        except Exception as err:
            tb = traceback.sys.exc_traceback
            self.error(-1, ServiceMethodError(self, err, tb=tb))

        # output object contains:
        # data
        # default widget name
        # whether it should automatically embed the result or not
        output_obj = {'data': result,
                      'widget': self.output_widget,
                      'embed': self.embed_widget}

        sys.stdout.write(json.dumps(output_obj))
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

    ## Utility functions

    @property
    def token(self):
        """Authorization token passed in from front-end.
        """
        return os.environ['KB_AUTH_TOKEN']

    @property
    def workspace_id(self):
        """Workspace ID passed in from front-end.
        """
        return os.environ['KB_WORKSPACE_ID']

    ## JSON serialization

    def as_json(self, formatted=False, **kw):
        d = {
            'name': self.name,
            'desc': self.desc,
            'input_widget': self.input_widget,
            'output_widget': self.output_widget,
            'params': [(p.name, p.get_metadata('ui_name'), str(p), p.get_metadata('desc')) for p in self.params],
            'outputs': [(p.name, str(p), p.get_metadata('desc')) for p in self.outputs]
        }
        if formatted:
            return json.dumps(d, **kw)
        return d

    trt_2_jschema = {'a unicode string': 'string',
                     'an int': 'integer',
                     'a list or None': 'array',
                     'a set or None': 'array',
                     'a tuple or None': 'array',
                     'a dict or None': 'object',
                     'a float': 'number',
                     'a boolean': 'boolean'}
                             
    def as_json_schema(self, formatted=False, **kw):
        d = {
            'title': self.name,
            'type': 'object',
            'description': self.desc,
            'properties': {
                'parameters': {p.name: {'type': self.trt_2_jschema.get(p.info(), str(p)),
                                        'description': p.get_metadata('desc'),
                                        'ui_name': p.get_metadata('ui_name'),
                                        'default': p.get_default_value()} for p in self.params},
                'widgets': {'input': self.input_widget, 'output': self.output_widget },
            },
            'returns': {p.name: {'type': self.trt_2_jschema.get(p.info(), str(p)),
                                 'description': p.get_metadata('desc')} for p in self.outputs}
        }
        if formatted:
            return json.dumps(d, **kw)
        return d

    def as_json_schema_dumps(self):
        return json.dumps(self.as_json_schema())


## Simplified, decorator-based, workflow

_curr_service = None


def init_service(**kw):
    """Call this first, to create & set service.

    All arguments must be keywords. See :class:`Service` and
    :meth:`Service.__init__`.
    """
    global _curr_service
    _curr_service = Service(**kw)


def configure_service(**kw):
    """Set service attributes given in input keywords.

    :raise: AttributeError if there is no such attribute,
            ValueError if service is not initialized
    """
    if _curr_service is None:
        raise ValueError("Attempt to configure service before init_service()")
    for key, value in kw.iteritems():
        setattr(_curr_service, key, value)


def method(name=None):
    """Decorator function for creating new services.

    Example usage::
    
        @method(name="MyMethod")
        def my_service(method, arg1, arg2, etc.):
            pass # method body goes here
    """
    if _curr_service is None:
        raise ValueError("Attempt to call @method decorator before init_service()")

    def wrap(fn, name=name):
        if name is None:
            name = fn.__name__
        wrapped_fn = _curr_service.add_method(name=name, func=fn)
        # copy docstring from original fn to wrapped fn, so that
        # interactive help, autodoc, etc. will show the 'real' docs.
        wrapped_fn.__doc__ = fn.__doc__
        return wrapped_fn
    return wrap


def finalize_service():
    """Call this last, to finalize and register the service.
    """
    global _curr_service
    register_service(_curr_service)
    _curr_service = None  # reset to un-initialized

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

    # Service creation
    # =================

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
    # Register service
    register_service(service)

    hdr = lambda s: "\n### " + s + " ###\n"

    # Service usage
    # ==============

    # Registry
    # --------
    # (pretend this is the start of a new module)
    # a. Show all registered services
    print(hdr("All registered service schema"))
    print(get_all_services(as_json_schema=True))
    # b. get service/method from registry
    method = get_service("taxicab").get_method("pickup")

    # JSON metadata
    # -------------
    print(hdr("JSON metadata"))
    print(method.as_json())
    print(hdr("JSON Metadata"))
    print(method.as_json(formatted=True, indent=2))
    print(hdr("JSON Schema Metadata"))
    print(method.as_json_schema(formatted=True, indent=2))

    # Validation
    # ----------
    print(hdr("Bad parameters"))
    r = method(1)
    assert(r is None)
    print(hdr("Function error"))
    r = method(0, "here", "there", "me")
    assert (r is None)
    # Failure, bad output
    print(hdr("Bad output type"))
    r = method(99, "here", "there", "me")
    assert (r is None)

    # Successful run
    # --------------
    print(hdr("Success 1"))
    r = method(3, "Berkeley", "San Francisco", "Willie Brown")
    assert(r is not None)
    print(hdr("Success 2"))
    r = method(9, "Dubuque", "Tallahassee", "Cthulhu")
    assert (r is not None)


if __name__ == '__main__':
    example()
