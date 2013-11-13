KBase narrative service/function
=================================

.. currentmodule:: biokbase.narrative.common.service

This describes the abstract and concrete Python API for KBase services.

Terminology
-----------

_`service`
    A group of related service methods

_`method` *or* _`service method`
    A parameterized function, optionally returning a result.

Requirements
------------

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


Example usage
-------------

Example usage is shown below::

    service = Service(name="taxicab", desc="Yellow Cab taxi service", version="0.0.1-alpha")
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
    except ServiceMethodParameterError, err:
        print("as expected, validation failed:\n{}".format(err.as_json()))
    #
    try:
        method.execute(1, "here", 3.14, "me")
    except ServiceMethodParameterError, err:
        print("as expected, validation failed:\n{}".format(err.as_json()))
    #
    method.execute(1, "here", "there", "dang")
    print("it worked!")


API Documentation
=================

.. automodule:: biokbase.narrative.common.service

Exceptions
----------

.. autoclass:: ServiceError

.. autoclass:: ServiceMethodError

.. autoclass:: ServiceMethodParameterError

.. autoclass:: Service
	:members: name, desc, version, run, execute
	
.. autoclass:: Lifecycle
	:members: on_start, on_stage, on_done, on_error
	
.. autoclass:: VersionNumber(number)
    
.. autoclass:: IpService