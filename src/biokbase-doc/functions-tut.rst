Building Narrative Functions Tutorial
======================================

What this document is
    This document gives a brief tutorial on how to wrap a function or script into the narrative,
    and link it to interactive visualization widgets.
    For an even briefer summary, see the :doc:`Quickstart </functions-quick>`, and for API details
    consult the :doc:`API reference </functions>`.

What this document is **not**
    A tutorial on how to make widgets or use the KBase API. This assumes that you’re at least passably familiar with the KBase widget API and the Python version of the KBase service API. This also isn’t a tutorial on how to get the Narrative working. Steve's slides and the Readme in the root of the Narrative repo should help with that.

**Contents**

* :ref:`overview`
* :ref:`services`
* :ref:`wrapping functions`
* :ref:`output widgets`
* :ref:`locations`


A little background
    The KBase Narrative is built on the `IPython notebook`_ technology. To quote that page:

        The IPython Notebook is a web-based interactive computational environment
        where you can combine code execution, text, mathematics, plots and rich media into a single document.

    So, the Narrative is that, plus point-and-click access to KBase functions and data, integrated
    with KBase search and social functions. With a cherry on top!
    
.. _IPython notebook: http://ipython.org/notebook.html

.. _overview:

Overview
--------

The general idea is this - the developer wraps their Narrative functions into a Python-based service using a few simple templates. This wrapping includes providing the name of the (default) widget for visualizing the output, and possibly a custom widget for input. Finally, the wrapper needs to return the data object that the output widget expects to see. Everything else gets populated automatically.

.. _services:

Narrative “Services”
---------------------

Narrative functions are packaged together into service modules, of presumably related functions. See, for example, service_skeleton.py in

    <narrative_root>/src/biokbase/narrative/common

The top chunk of the file describes components of the service. Each of the imported modules and the ``init_service()`` statement are required for the service to function and be registered with the IPython Kernel.

They all end with a ``finalize_service()`` statement.

Once finalized, they all get registered as part of the biokbase.narrative.common.service apparatus, and automatically made visible to the user in the narrative UI.

Note that for your service to be loaded, it must be stored with a unique name in the  

    <narrative_root>/src/biokbase/narrative/services
    
directory.

Each Narrative service requires most of the pieces in service_skeleton.py. It should start with a docstring describing the service, (__author__ and __date__ are optional). It should import, at the minimum, biokbase.narrative.common.service and biokbase.narrative.common.kbtypes. And it should define a global VERSION variable (with three numerical elements to represent Semantic Versioning), and NAME variable.


.. _wrapping functions:

Wrapping Functions
-------------------

Each service is composed of at least one method, that gets registered through a combination of a Python decorator,
and some special formatting in the method’s docstring. The terms "function" and "method" are a little conflated here.
"Function" refers to what a user would interact with on the Narrative side, and "method" is the actual bit of Python
code (Python calls ‘em methods) in the service.

We might need to normalize our vocabulary a bit, but the differences really only matter while wrapping your function call.

Decorator
^^^^^^^^^^

The decorator for each method has the following format:
@method(name=”My Function”)
This declares the following method as a narrative function, and registers your given name into a function; the user will see the name you give as the clickable element in the interface.

Building a function
^^^^^^^^^^^^^^^^^^^^

When declaring your function, you can give it any number of parameters, but the first is the ServiceMethod object representing the method itself. Yes, this is a little meta, but it’ll make sense below.

For example, the ``my_service_function`` method in *service_skeleton.py* has three variables: meth, param1, param2. The meth parameter allows for some useful features, while the proceeding parameters are what you’ll be basing your functions calls on.

Specifically, while your function is running, you can use meth to update the user interface along the way. First, set the number of steps your function will do with::

    meth.stages = N  # (N is an integer > 0)

As you proceed to different stages, you can communicate to the user what’s happening with::

    meth.advance(“About to do the next step!”)

...or whatever string makes sense there.

Useful functions and variables
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Auth Tokens and Workspace IDs:
You can fetch the current authorization token 
and the current workspace from the ``method`` passed as the first
argument to your wrapped function::

	token, workspace_id = meth.token, meth.workspace_id

Docstring formatting
^^^^^^^^^^^^^^^^^^^^^

The docstring at the head of your method will contain all the information about your method that needs to get passed to the user interface. This includes:

* Parameter :ref:`names and descriptions <p-desc>`
* Parameter :ref:`types <p-type>` (typed object vs. string, etc.)
* Return object :ref:`description <r-desc>` and :ref:`type <r-type>`
* Type of returned object
* Which KBase widget to use for visualization

These use the following format:

Parameters
~~~~~~~~~~
.. _p-desc:

Description
    ``:param param1: Description of parameter``
    
    The first line declares a new parameter and should appear before saying anything else about it.
    ``param1`` should match one of the parameters in your Python method.
    The parameters description should not include any line breaks.

.. _p-type:

Type
    ``:type param1: kbtypes.<Type>``
    
    The type line declares the type of parameter you have. These are all in 
    
        *<narrative_root>*/src/biokbase/narrative/common/services/kbtypes.py
        
    For just a plain string, use ``kbtypes.Unicode``.

    .. note:: The list of KBase types in the ``kbtypes`` module will be continuously updated as time goes on, especially as the new Workspace and Typed Objects services approach deployment.

.. _p-ui:

UI Name
    ``:ui_name param1: Param 1``
    
    This line declares how the parameter is labeled. While the description above might be a
    little more, er, descriptive, this is intended to be a brief label. Like, *Genome ID* or *FASTQ file name*

.. important:: Each parameter you want the user to be able to input should be detailed using the above format, otherwise it won’t appear in the interface.

Outputs
~~~~~~~~
.. _r-desc:

Description
    ``:return: Something being returned``
    
    This is just a description for what the returned object is.

.. _r-type:

Type
    ``:rtype: kbtypes.<Type>``
    
    As above, this is the type of object that gets returned by the service

Widget
    ``:output_widget: <WidgetName>``
    
    This is the name of the widget you want your generated output to be fed in to. Note that this is the same name as the widget is invoked via Javascript, NOT its file name (in most cases they should be the same). E.g., if you make a call like ``$(“#myTarget”).kbaseOutputWidget()``, then ``kbaseOutputWidget`` should go here.

    Alternately, there is a default output widget that just prints the output on the screen in a formatted JSON pretty-print kind of way, 
    and might be useful for debugging your method before getting into the details of widget development.


Function Output
^^^^^^^^^^^^^^^

Your function links its output directly into a widget. That is, whatever format your widget requires should be the format of your returned data, wrapped into JSON.

All widgets are expected to consume a JSON object as input. Consider how you instantiate a widget. It looks something like this, right?

.. code-block:: javascript

    $(“#myTarget”).kbaseOutputWidget(
        { 
            objectId: “myObjectId”, 
            otherInputs : {...} 
        }
    );

The return line from your function, then, should look like this:
**[Python code]**:: 

    result = { “objectID” : “myObjectId”, “otherInputs” : {...} }
    return json.dumps(result)

This will then send to your output widget the inputs that you expect to see.


.. _output widgets:

Linking to Output Widgets
-------------------------

As detailed above, you need to do three things to link your function to an output widget.

* Put your widget’s name in the ``:output_widget:`` docstring tag.
* Format your function’s output to be a stringified JSON dump.
* Plug your widget’s declaration into notebook.html

For that third step, until we get the `require.js` handles and a CDN for the widget code in place, just copy your output widget code (ugh, I know…) to 

    *<narrative_root>*/src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/js/widgets/function_output

and link them to the narrative with the following templated HTML script tag:

.. code-block:: html+jinja

	<script src=”{{ static_url(“kbase/js/widgets/function_output/YOUR_WIDGET_HERE.js”) }}”
	        type=”text/javascript” charset=”utf-8”></script>

The static_url() command just routes the page to 

    *<narrative_root>*/src/notebook/ipython_profiles/profile_narrative/kbase_templates/static

And that’s it! The output from your new function should load up in the narrative.



.. _loading narrative:

Loading into your narrative instance
------------------------------------

If you’re developing locally in some branch of the narrative repo (you probably are), you’ll need to update your virtual environment with any backend changes and restart the narrative before any changes will become active. To update your instance, do the following.

#. If you haven't 'activated' the virtual environment, do so from a prompt:
   $ source ./<venv-root>/bin/activate
#. From *<narrative_root>*/src, run the following to update:
   $ python setup.py install || abort
#. Restart your narrative as usual:
   $ run_notebook.sh notebook
   

.. _locations:

Where to put your stuff
-----------------------

* Narrative services and related:

<narrative_root>/src/biokbase/narrative/common/services/your_service.py

* Output widgets:

<narrative_root>/src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/js/widgets/function_output

* Linking into the narrative:

<narrative_root>/src/notebook/ipython_profiles/profile_narrative/kbase_templates/notebook.html

Under the comment ``<!-- function output JS widgets -->``

.. note:: This will soon [#f1]_ be replaced by require.js - this document will be updated when it is.

.. [#f1] for vague values of "soon". Hopefully next week.
