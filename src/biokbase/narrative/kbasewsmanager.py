"""A notebook manager that uses the KBase workspace for storage.

Based on Travis Harrison's shocknbmanager and the azurenbmanager

Authors:

* Steve Chan <sychan@lbl.gov>
* Bill Riehl <wjriehl@lbl.gov>

Copyright (C) 2013 The Regents of the University of California
Department of  Energy contract-operators of the Lawrence Berkeley National Laboratory
1 Cyclotron Road, Berkeley,  CA 94720 

Copyright (C) 2013 The KBase Project

Distributed unspecified open source license as of 9/27/2013  

"""
# System
import datetime
import dateutil.parser
import os
import json
import re
import importlib
# Third-party
from unicodedata import normalize
from tornado import web
# IPython
from IPython.html.services.notebooks.nbmanager import NotebookManager
from IPython.config.configurable import LoggingConfigurable
from IPython.nbformat import current
from IPython.utils.traitlets import Unicode, Dict, Bool, List, TraitError
from IPython.utils import tz
# Local
import biokbase.narrative.ws_util as ws_util
from biokbase.workspace.client import Workspace
import biokbase.narrative.common.service as service
from biokbase.narrative.common import util
import biokbase.auth

#-----------------------------------------------------------------------------
# Classes
#-----------------------------------------------------------------------------

class KBaseWSNotebookManager(NotebookManager):
    """
    A notebook manager that uses the KBase workspace for storage.

    The Workspace backend simply adds a few metadata fields into the
    notebook object and pushes it into the workspace as the 'data'
    part of a workspace object

    Additional metadata fields
    {
        'id' : User specified title for the narrative alphanumerica + _
        'creator' : {username of the creator of this notebook},
        'description' : 'description of notebook',
        'data_dependencies' : { list of kbase id strings }
        'format' : self.node_format
        'workspace' : the workspace that it was loaded from or saved to
    }

    This handler expects that on every request, the session attribute for an
    instance will be populated by the front end handlers. That's gross, but
    that's what we're running with for now.
    Note: you'll probably see "That's gross, but..." a lot in this rev of the
    code

    Notebooks are identified with workspace identifiers of the format
    {workspace_name}.{object_name}

    Object format:
    (New)
    {
        'dependencies' : List of workspace refs,
        'notebook' : {
            <mostly, the IPython notebook object>,
            'metadata' : 
        }
    }

    """
    kbasews_uri = Unicode(service.URLS.workspace, config=True, help='Workspace service endpoint URI')

    ipynb_type = Unicode('ipynb')
    allowed_formats = List([u'json'])
    node_format = ipynb_type
    ws_type = Unicode(ws_util.ws_narrative_type, config=True, help='Type to store narratives within workspace service')

    # regex for parsing out workspace_id and object_id from
    # a "ws.{workspace}.{object}" string
    ws_regex = re.compile('^ws\.(?P<wsid>\d+)\.obj\.(?P<objid>\d+)')
    # regex for parsing out fully qualified workspace name and object name
    ws_regex2 = re.compile('^(?P<wsname>[\w:]+)/(?P<objname>[\w]+)')
    # regex for par
    kbid_regex = re.compile('^(kb\|[a-zA-Z]+\..+)')

    # This is a regular expression to make sure that the workspace ID
    # doesn't contain non-legit characters in the object ID field
    # We use it like this to to translate names:
    # wsid_regex.sub('',"Hello! Freaking World! 123".replace(' ','_'))
    # to get an id of 'Hello_Freaking_World_123'
    # We will enforce validation on the narrative naming GUI, but this is
    # a safety net
    wsid_regex = re.compile('[\W]+', re.UNICODE)    

    def __init__(self, **kwargs):
        """Verify that we can connect to the configured WS instance"""
        super(NotebookManager, self).__init__(**kwargs)
        if not self.kbasews_uri:
            raise web.HTTPError(412, u"Missing KBase workspace service endpoint URI.")

        # Verify we can poke the Workspace service at that URI by just checking its
        # version
        try:
            wsclient = self.wsclient()
            wsclient.ver()
        except Exception as e:
            raise web.HTTPError(500, u"Unable to connect to workspace service"
                                     u" at %s: %s " % (self.kbasews_uri, e))
        
        # Map Narrative ids to notebook names
        mapping = Dict()
        # Map notebook names to Narrative ids
        rev_mapping = Dict()
        # Setup empty hash for session object
        self.kbase_session = {}

    def get_userid(self):
        """Return the current user id (if logged in), or None
        """
        t = biokbase.auth.Token()
        if (t is not None):
            return self.kbase_session.get('user_id', t.user_id)
        else:
            return self.kbase_session.get('user_id', None)

    def wsclient(self):
        """Return a workspace client object for the workspace
        endpoint in kbasews_uri
        """
        return Workspace(self.kbasews_uri)

    def _clean_id(self, id):
        """Clean any whitespace out of the given id"""
        return self.wsid_regex.sub('', id.replace(' ', '_'))
            
    def list_notebooks(self):
        """List all notebooks in WSS
        For the ID field, we use "{ws_id}.{obj_id}"
        The obj_id field is sanitized version of document.ipynb.metadata.name

        Returns a list of dicts with two keys: 'name' and 'notebook_id'. 'name'
        should be of the format 'workspace name/Narrative name' and id should have 
        the format 'ws.###.obj.###'
        """
        self.log.debug("Listing Narratives")
        self.log.debug("kbase_session = %s" % str(self.kbase_session))
        wsclient = self.wsclient()
        all = ws_util.get_wsobj_meta(wsclient)

        self.mapping = {
            ws_id: "%s/%s" % (all[ws_id]['workspace'],all[ws_id]['meta'].get('name',"undefined"))
            for ws_id in all.keys()
        }
        self.rev_mapping = {self.mapping[ws_id] : ws_id for ws_id in self.mapping.keys()}
        data = [dict(notebook_id = it[0], name = it[1]) for it in self.mapping.items()]
        data = sorted(data, key=lambda item: item['name'])
        return data

    def new_notebook(self):
        """
        Create an empty notebook and push it into the workspace without an object_id
        or name, so that the WSS generates a new object ID for us. Then return
        that.

        This will likely only be called as a developer tool from http://<base url>/narrative
        or from starting up locally.
        """
        wsclient = self.wsclient()
        user_id = self.get_userid()

        # Verify that our own home workspace exists, note that we aren't doing this
        # as a general thing for other workspaces
        #
        # This is needed for running locally - a workspace is required.
        try:
            (homews, homews_id) = ws_util.check_homews(wsclient, user_id)
        except Exception as e:
            raise web.HTTPError(401, u'User must be logged in to access their workspaces')

        # Have IPython create a new, empty notebook
        nb = current.new_notebook()
        new_name = normalize('NFC', u"Untitled %s" % (datetime.datetime.now().strftime("%y%m%d_%H%M%S")))
        new_name = self._clean_id(new_name)

        # Add in basic metadata to the ipynb object
        try:
            nb.metadata.ws_name = os.environ.get('KB_WORKSPACE_ID', homews)
            nb.metadata.creator = user_id
            nb.metadata.type = self.ws_type
            nb.metadata.description = ''
            nb.metadata.name = new_name
            nb.metadata.data_dependencies = []
            nb.metadata.job_ids = { 'methods' : [], 'apps' : [] }
            nb.metadata.format = self.node_format
        except Exception as e:
            raise web.HTTPError(400, u'Unexpected error setting notebook attributes: %s' %e)
        try:
            wsobj = { 
                      'type' : self.ws_type,
                      'data' : nb,
                      'provenance' : [],
                      'meta' : nb.metadata.copy(),
                    }
            # We flatten the data_dependencies array into a json string so that the
            # workspace service will accept it
            wsobj['meta']['data_dependencies'] = json.dumps(wsobj['meta']['data_dependencies'])
            # Same for jobs list
            wsobj['meta']['job_ids'] = json.dumps(wsobj['meta']['job_ids'])
            wsid = homews_id
            self.log.debug("calling ws_util.put_wsobj")
            res = ws_util.put_wsobj(wsclient, wsid, wsobj)
            self.log.debug("save_object returned %s" % res)
        except Exception as e:
            raise web.HTTPError(500, u'%s saving Narrative: %s' % (type(e),e))
        # use "ws.ws_id.obj.object_id" as the identifier
        id = "ws.%s.obj.%s" % (res['wsid'], res['objid'])
        self._set_narrative_env(id)
        # update the mapping
        self.list_notebooks()
        return id

    def delete_notebook_id(self, notebook_id):
        """Delete a notebook's id in the mapping."""
        self.log.debug("delete_notebook_id(%s)"%(notebook_id))
        user_id = self.get_userid()
        if user_id is None:
            raise web.HTTPError(400, u'Cannot determine valid user identity!')
        if notebook_id in self.mapping:
            name = self.mapping[notebook_id]
            super(KBaseWSNotebookManager, self).delete_notebook_id(notebook_id)

    def notebook_exists(self, notebook_id):
        """Does a Narrative with notebook_id exist?

        Returns True if a Narrative with id notebook_id (format = ws.XXX.obj.YYY) exists,
        and returns False otherwise.
        """
        user_id = self.get_userid()
        if user_id is None:
            raise web.HTTPError(400, u'Cannot determine valid user identity!')
        # Look for it in the currently loaded map
        exists = super(KBaseWSNotebookManager, self).notebook_exists(notebook_id)
        self.log.debug("notebook_exists(%s) = %s"%(notebook_id,exists))
        if not exists:
            # The notebook doesn't exist among the notebooks we've loaded, lets see
            # if it exists at all in the workspace service
            self.log.debug("Checking other workspace")
            m = self.ws_regex.match(notebook_id)
            if not m:
                return False
            self.log.debug("Checking other workspace %s for %s"%(m.group('wsid'),m.group('objid')))
            objmeta = ws_util.get_wsobj_meta(self.wsclient(), ws_id=m.group('wsid'))
            if notebook_id in objmeta:
                self.mapping[notebook_id] = notebook_id
                return True
            else:
                return False
        return exists
    
    def get_name(self, notebook_id):
        """Get a notebook name, raising 404 if not found"""
        self.log.debug("Checking for name of Narrative %s")
        self.list_notebooks()
        try:
            name = self.mapping[notebook_id]
            self.log.debug("get_name(%s) = %s" % (notebook_id, name))
        except KeyError:
            raise web.HTTPError(404, u'Narrative does not exist: %s' % notebook_id)
        return name

    def read_notebook_object(self, notebook_id):
        """Get the Notebook representation of a notebook by notebook_id.

        There are now new and legacy versions of Narratives that need to be handled.
        The old version just included the Notebook object as the Narrative object, 
        with an optional Metadata field.

        The new version has a slightly more structured Metadata field, with a
        required data_dependencies array.

        This really shouldn't affect reading the object much, but should be kept
        in mind.
        """
        self.log.debug("Reading Narrative %s." % notebook_id)
        user_id = self.get_userid()
        if user_id is None:
            raise web.HTTPError(400, u'Missing user identity from kbase_session object')
        try:
            wsobj = ws_util.get_wsobj(self.wsclient(), notebook_id, self.ws_type)
        except ws_util.BadWorkspaceID, e:
            raise web.HTTPError(500, u'Narrative %s not found: %s' % (notebook_id, e))

        if 'notebook' in wsobj['data']:
            #
            jsonnb = json.dumps['data']['notebook']
        else:
            jsonnb = json.dumps(wsobj['data'])

        nb = current.reads(jsonnb, u'json')

        # Set the notebook metadata workspace to the workspace this came from
        nb.metadata.ws_name = wsobj['metadata']['workspace']

        last_modified = dateutil.parser.parse(wsobj['metadata']['save_date'])
        self.log.debug("Narrative successfully read" )
        # Stash last read NB in env
        self._set_narrative_env(notebook_id)
        os.environ['KB_WORKSPACE_ID'] = nb.metadata.ws_name
        return last_modified, nb

    # def extract_data_dependencies(self, nb):
    #     """
    #     This is an internal method that parses out the cells in the notebook nb
    #     and returns an array of type:value parameters based on the form input
    #     specification and the values entered by the user.

    #     I the cell metadata, we look under:
    #     kb-cell.method.properties.parameters.paramN.type

    #     for anything that isn't a string or numeric, and we combine that type with
    #     the corresponding value found under 
    #     kb-cell.widget_state[0].state.paramN

    #     We create an array of type:value pairs from the params and return that
    #     """
    #     # set of types that we ignore
    #     ignore = set(['string','Unicode','Numeric','Integer','List','a number'])
    #     deps = set()
    #     # What default workspace are we going to use?
    #     ws = os.environ.get('KB_WORKSPACE_ID',nb.metadata.ws_name)
    #     for wksheet in nb.get('worksheets'):
    #         for cell in wksheet.get('cells'):
    #             try:
    #                 allparams = cell['metadata']['kb-cell']['method']['properties']['parameters']
    #             except KeyError:
    #                 continue
    #             params = [param for param in allparams.keys() if allparams[param]['type'] not in ignore]
    #             try:
    #                 paramvals = cell['metadata']['kb-cell']['widget_state'][0]['state']
    #             except KeyError:
    #                 continue
    #             for param in params:
    #                 try:
    #                     paramval = paramvals[param]
    #                     # Is this a fully qualified workspace name?
    #                     if (self.ws_regex.match(paramval) or
    #                         self.ws_regex2.match(paramval) or
    #                         self.kbid_regex.match(paramval)):
    #                         dep = "%s %s" % (allparams[param]['type'], paramval)
    #                     else:
    #                         dep = "%s %s" % (allparams[param]['type'], paramval)
    #                     deps.add(dep)
    #                 except KeyError:
    #                     continue
    #     return list(deps)

    def write_notebook_object(self, nb, notebook_id=None):
        """Save an existing notebook object by notebook_id."""
        self.log.debug("writing Narrative %s." % notebook_id)
        wsclient = self.wsclient()
        user_id = self.get_userid()
        if user_id is None:
            raise web.HTTPError(400, u'Cannot determine user identity from '
                                     u'session information')
    
        # we don't rename anymore--- we only set the name in the metadata
        #try:
        #    new_name = normalize('NFC', nb.metadata.name)
        #except AttributeError:
        #    raise web.HTTPError(400, u'Missing Narrative name')
        #new_name = self._clean_id(new_name)
        
        
        # Verify that our own home workspace exists, note that we aren't doing this
        # as a general thing for other workspaces
        wsclient = self.wsclient()
        (homews, homews_id) = ws_util.check_homews(wsclient, user_id)
        # Carry over some of the metadata stuff from ShockNBManager
        try:
            if not hasattr(nb.metadata, 'name'):
                nb.metadata.name = 'Untitled'
            if not hasattr(nb.metadata, 'ws_name'):
                nb.metadata.ws_name = os.environ.get('KB_WORKSPACE_ID',homews)
            if not hasattr(nb.metadata, 'creator'):
                nb.metadata.creator = user_id
            if not hasattr(nb.metadata, 'type'):
                nb.metadata.type = self.ws_type
            if not hasattr(nb.metadata, 'description'):
                nb.metadata.description = ''
            # These are now stored on the front end explicitly as a list of object references
            # This gets auto-updated on the front end, and is easier to manage.
            if not hasattr(nb.metadata, 'data_dependencies'):
                nb.metadata.data_dependencies = list()
            if not hasattr(nb.metadata, 'job_ids'):
                nb.metadata.job_ids = { 'methods' : [], 'apps' : [] }
            nb.metadata.format = self.node_format

        except Exception as e:
            raise web.HTTPError(400, u'Unexpected error setting Narrative attributes: %s' %e)
        
        ## new approach, step 1: update current ws metadata
        try:
            updated_metadata = {
                "is_temporary":"false",
                "narrative_nice_name":nb.metadata.name
            };
            ws_util.alter_workspace_metadata(wsclient, notebook_id, updated_metadata)
        except Exception as e:
            raise web.HTTPError(500, u'%s saving Narrative: %s' % (type(e),e))
        
        ## new approach, step 2: save ws object
        try:
            # 'wsobj' = the ObjectSaveData type from the workspace client
            # requires type, data (the Narrative typed object), provenance,
            # optionally, user metadata
            #
            # requires ONE AND ONLY ONE of objid (existing object id, number) or name (string)
            wsobj = { 
                      'type' : self.ws_type,
                      'data' : nb,
                      'provenance' : [
                        {
                            'service' : 'narrative',
                            'description': 'saved through the narrative interface'
                        }
                        ],
                      'meta' : nb.metadata.copy(),
                    }
            # We flatten the data_dependencies array into a json string so that the
            # workspace service will accept it
            wsobj['meta']['data_dependencies'] = json.dumps(wsobj['meta']['data_dependencies'])
            wsobj['meta']['job_ids'] = json.dumps(wsobj['meta']['job_ids'])

            # If we're given a notebook id, try to parse it for the save parameters
            if notebook_id:
                m = self.ws_regex.match(notebook_id)
            else:
                m = None

            if m:
                # wsid, objid = ws.XXX.obj.YYY
                wsid = m.group('wsid')
                wsobj['objid'] = m.group('objid')
            elif nb.metadata.ws_name == homews:
                wsid = homews_id
                #wsobj['name'] = new_name
            else:
                wsid = ws_util.get_wsid(nb.metadata.ws_name)
                #wsobj['name'] = new_name

            self.log.debug("calling ws_util.put_wsobj")
            res = ws_util.put_wsobj(wsclient, wsid, wsobj)
            self.log.debug("save_object returned %s" % res)

            # we no longer update names
            # Now that we've saved the object, if its Narrative name (new_name) has changed,
            # update that in the Workspace
            #if (res['name'] != new_name):
            #    identity = { 'wsid' : res['wsid'], 'objid' : res['objid'] }
            #    res = ws_util.rename_wsobj(wsclient, identity, new_name)

        except Exception as e:
            raise web.HTTPError(500, u'%s saving Narrative: %s' % (type(e),e))
        # use "ws.ws_id.obj.object_id" as the identifier
        id = "ws.%s.obj.%s" % (res['wsid'], res['objid'])
        self.mapping[id] = "%s/%s" % (res['workspace'], res['name'])
        self._set_narrative_env(id)
        return id

    def delete_notebook(self, notebook_id):
        """Delete notebook by notebook_id."""
        self.log.debug("deleting Narrative %s" % notebook_id)
        wsclient = self.wsclient()
        user_id = self.get_userid()
        if user_id is None:
            raise web.HTTPError(400, u'Cannot determine user identity from session information')
        if notebook_id is None:
            raise web.HTTPError(400, u'Missing Narrative id')
        self.log.debug("deleting Narrative %s", notebook_id)
        m = self.ws_regex.match(notebook_id)
        if m:
            res = ws_util.delete_wsobj(wsclient, m.group('wsid'),m.group('objid'))
            self.log.debug("delete object result: %s" % res)
        else:
            raise ws_util.BadWorkspaceID(notebook_id)
        self.delete_notebook_id(notebook_id)

    # public checkpoint API
    # The workspace service handles versioning and has every ancient version stored
    # in it - support for that will be handled by a workspace browser tool, and
    # not the narrative
    def create_checkpoint(self, notebook_id):
        """Create a checkpoint from the current state of a notebook"""
        # only the one checkpoint ID:
        checkpoint_id = u"checkpoint"
        chkpt_created = datetime.datetime.utcnow()
        self._set_narrative_env(notebook_id)
        # This is a no-op for now
        # return the checkpoint info
        return { 'checkpoint_id' : checkpoint_id , 'last_modified' : chkpt_created }


    def list_checkpoints(self, notebook_id):
        """
        list the checkpoints for a given notebook
        this is a no-op for now.
        """
        return []
    
    def restore_checkpoint(self, notebook_id, checkpoint_id):
        """restore a notebook to a checkpointed state"""
        pass

    def delete_checkpoint(self, notebook_id, checkpoint_id):
        """delete a notebook's checkpoint"""
        pass

    def log_info(self):
        self.log.info("Service Narratives from the KBase Workspace service")
        pass

    def info_string(self):
        return "Workspace Narrative Service with workspace endpoint at %s" % self.kbasews_uri

    def _set_narrative_env(self, id_):
        """Set the narrative id into the environment"""
        util.kbase_env.narrative = id_
#
# This is code that patches the regular expressions used in the default routes
# of tornado handlers. IPython installs handlers that recognize a UUID as the
# kbase notebook id, but we're using workspace_name.object_id so the routes
# need to be updated otherwise you can't reach the handlers.
#
# We use these to modify the routes installed by the notebook
# handlers in the main IPython code without having to change the IPython code
# directly
#
def handler_route_replace(handlers,oldre,newre):
    """ Look for a regex in a tornado routing table and replace it with a new one"""
    if len(handlers) > 0:
        findre = re.escape(oldre)
        for i in range(0,len(handlers)):
            (route,handler) = handlers[i]
            route2 = re.sub(findre,newre,route)
            if route2 != route:
                handlers[i] = (route2,handler)

# Patch the url regex to match our workspace identifiers
import IPython.html.base.handlers

tgt_handlers = ('IPython.html.notebook.handlers',
                'IPython.html.services.notebooks.handlers')
for handlerstr in tgt_handlers:
    IPython.html.base.handlers.app_log.debug("Patching routes in %s.default_handler" % handlerstr)
    handler = importlib.import_module(handlerstr)
    handler_route_replace(handler.default_handlers, r'(?P<notebook_id>\w+-\w+-\w+-\w+-\w+)',r'(?P<notebook_id>ws\.\d+\.obj\.\d+)')

# Load the plupload handler
import upload_handler
upload_handler.insert_plupload_handler()
