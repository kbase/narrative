KBase "Services" API Quickstart
--------------------------------

What this document is
    This document provides a quick and dirty summary of how to add a new
    function to a KBase Narrative service.
    For more information, consult the :doc:`Tutorial </functions-tut>` and :doc:`API Reference </functions>`.

Steps
~~~~~

Wrapping your existing functions
in a KBase Narrative service that can be used by the Narrative will normally involve only
the following steps (for existing Python scripts):

#. Start a new Python module, which here we will call `my_service.py`, using the skeleton in `narrative/common/service_skeleton.py` as a starting point::

    $ mkdir narrative/
    $ cp narrative/common/service_skeleton.py narrative/services/my_service.py

#. Modify the NAME and VERSION lines in the skeleton, and the description in ``init``,
   to create a Service object::

    from biokbase.narrative.common.service import init_service, method, finalize_service
    from biokbase.narrative.common import kbtypes

    VERSION = (0, 0, 1)
    NAME = "MyExampleService"

    init_service(name=NAME, desc="This is an example", version=VERSION)
    
#. For each function, wrap the function implementation with a ``@method`` decorator, as shown 
   in the example function.
   Add a first argument to each function, which will be passed a method object::

    @method(name="MyExampleFunction")
    def _my_service_function(meth, param1, param2):
        ...function body goes here...

#. Add to the function a docstring (standard Python top-of-function comment) that
   contains a specific form of reStructured text markup indicating parameter types and return types::

    @method(name="MyExampleFunction")
    def _my_service_function(meth, param1, param2):
        """This is an example function.

        :param param1: Input Genome
        :type param1: kbtypes.Genome
        :param param2: Some text
        :type param2: kbtypes.Unicode
        :return: Workspace object ID
        :rtype: kbtypes.Unicode
        """
        meth.stages = 1  # for reporting progress
        result = None
        meth.advance("Only this one stage")
        return "result"
    
#. At the bottom of the file, 1 line of code to finalize the Service, which registers it 
   for the Narrative to discover it::

    finalize_service()
      
That's it! Steps 3-4 are repeated for each function in the service.

