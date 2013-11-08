KBase narrative service/function
=================================

.. currentmodule:: biokbase.narrative.common.service

This describes the abstract and concrete Python API for KBase services.

Each service should be self-describing and long-running services (which, in terms of interactive operation, is most of them) should provide intermediate progress indications. Thus, the minimal requirements of services are:

- service metadata
    - version [x.y.z]
    - name
    - description
    - list of parameters `*`
    - list of outputs `*`
    - status
- parameter metadata `*`
    - name
    - type
    - description
- output metadata `*`
    - [name], type, description
    - [name] may be replaced by position in a list
- status
    - success/failure
    - if failure, then a (code, message) pair should describe it

We have specified these requirements in a Python class, :class:`Service`, whose documentation is below. Items marked with a `*` in the above list are not yet (fully) implemented in this code. For running in the IPython notebook, services should inherit from :class:`IpService`, which implements communication channels to the front-end and remote KBase registries.

API Documentation
==================

.. automodule:: biokbase.narrative.common.service

.. autoclass:: Service
	:members: name, desc, version, run, execute
	
.. autoclass:: Lifecycle
	:members: on_start, on_stage, on_done, on_error
	
.. autoclass:: VersionNumber(number)
    
.. autoclass:: IpService