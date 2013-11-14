Narrative Service Python API
================================

.. currentmodule:: biokbase.narrative.common.service

.. contents::

Introduction
-------------

This describes the abstract and concrete Python API for KBase services.

Terminology
^^^^^^^^^^^^

_`service`
    A group of related service methods

_`method` *or* _`service method`
    A parameterized function, optionally returning a result.

Requirements
^^^^^^^^^^^^^

Each `service method`_ should be self-describing, and long-running services
(which, in terms of interactive operation, is most of them) should provide
intermediate progress indications. Thus, the minimal requirements of service methods are:

- service metadata
    - version [x.y.z]
    - name
    - description
    - list of parameters
    - list of outputs `*`
    - status
- parameter metadata
    - name
    - type
    - description
- output metadata `*`
    - [name], type, description
    - [name] may be replaced by position in a list
- status
    - success/failure
    - if failure, then an exception with named fields will be returned

We have specified these requirements in a Python class, :class:`Service`, whose documentation is below.
Items marked with a `*` in the above list are not yet (fully) implemented in this code.



API Documentation
------------------

.. automodule:: biokbase.narrative.common.service

Exceptions
^^^^^^^^^^

.. autoclass:: ServiceError

.. autoclass:: ServiceMethodError

.. autoclass:: ServiceMethodParameterError

Services
^^^^^^^^

The two classes that new service methods will need to instantiate are
the :class:`Service` (one per group of methods) and :class:`ServiceMethod`.
For example::

    # import our own module
    from biokbase.narrative.common.services import Service, ServiceMethod
    # use IPython "traitlets" to do validation of parameters
    import IPython.utils.traitlets as trt
    # create a "taxicab" service
    service = Service(name="taxicab", desc="Yellow Cab taxi service", version="0.0.1-alpha")
    # create a method for picking up people in the taxicab
    method = ServiceMethod(service, name="pickup", desc="Pick up people in a taxi")
    # set the actual function and the metadata about its parameters
    method.set_func(pick_up_people,
                    (trt.Int(1, desc="number of people"), trt.Unicode("", desc="Pick up location"),
                     trt.Unicode("", desc="main drop off location"),
                     Person("", desc="Person who called the taxi")))
    # add that method to the service
    service.add(method)
    # note: everything up to this point is one-time setup
    # now, execute the method
    result = method(1, "here", "there", "somebody")
    print("it worked!")

.. autoclass:: Service
    :members: name, desc, version

.. autoclass:: ServiceMethod
    :members: set_func, __call__, estimated_runtime,
              started, advance, done, error

.. autoclass:: VersionNumber(number)

Lifecycle events
^^^^^^^^^^^^^^^^^

The lifecycle events for the service method execution, i.e. from start to done or error,
are coded with the subject/observer pattern. Most people won't need to do anything with these
classes, but they are designed to be extensible. Since :class:`ServiceMethod` inherits from
:class:`LifecycleSubject`, new observers that take actions based on events can be added
at any time. The base classes are below.

.. autoclass:: LifecycleSubject
    :members:

.. autoclass:: LifecycleObserver
    :members:

Built-in observers
~~~~~~~~~~~~~~~~~~~

The two default observers are for history of the timings, and communicating
the current status back to the front end.

.. autoclass:: LifecycleHistory
    :members:

.. autoclass:: LifecyclePrinter
    :members:
