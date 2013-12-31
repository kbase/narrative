# Developer notes #

## Locations for development code

./src/notebook/ipython_profiles/profile_narrative/kbase_templates/static/kbase/js/widgets
	- kbase-narrative.js : where the magic happens

## Conventions

### Home workspace

<username>_home

e.g. dang_home

### Metadata for notebook

    {
       narrative_id: 'string' #identifier (MongoDB '_id') for associated narrative object
    }

## SAC demo

see: src/biokbase/narrative/demo


## Python notebook notes

handlers inherit from tornado.web.RequestHandler, but actually from classes in core.handlers : IPythonHandler:AuthenticatedHandler:RequestHandler:web.RequestHandler

The IPythonHandler {hence: IPH} has a 'settings' attr that it uses to retrieve its configuration. 

the IPH has convenience methods for template rendering with jinja, get_template() and render_template(), that takes care of names and namespaces.

each handlers file has default_handlers[] var that lists what is loaded

in notebookapp.py, NotebookWebApplication {hence: NWA} has init_handlers() that loads the (hardcoded) list of core handlers and associates these with URLs

the NWA is instantiated in NotebookApp.init_webapp()
this function also sets up the listening on ports

NotebookApp.start() actually starts to run the server, but NotebookApp.launch_instance is the attribute called, which is defined in core.application.BaseIPythonApplication which inherits from IPython.config.application.Application

Notebook manager is services/notebooks/nbmanager.py
This defines the base class NotebookManager that loads, saves, etc. the notebook 

