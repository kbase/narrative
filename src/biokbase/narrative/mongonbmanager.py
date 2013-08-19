"""A notebook manager that uses mongodb for storage.

Based on Travis Harrison's shocknbmanager and the azurenbmanager

Authors:

* Steve Chan <sychan@lbl.gov>
"""

#-----------------------------------------------------------------------------
#  Copyright (C) 2013  The KBase Project
#
#  Distributed unspecified open source license as of 8/14/2013
#  
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import datetime
import dateutil.parser
import io
import os
import glob
import shutil
import json
from bson.json_util import dumps

from unicodedata import normalize

from tornado import web
from pymongo import MongoClient
from pymongo.read_preferences import ReadPreference

from IPython.html.services.notebooks.nbmanager import NotebookManager
from IPython.config.configurable import LoggingConfigurable
from IPython.nbformat import current
from IPython.utils.traitlets import Unicode, Dict, Bool, List, TraitError
from IPython.utils import tz

#-----------------------------------------------------------------------------
# Classes
#-----------------------------------------------------------------------------

class MongoNotebookManager(NotebookManager):

    # The MongoDB backend simply wraps the JSON notebook in a enclosing dict
    # and pushes it into MongoDB. The dict has the following fields
    # {
    #     '_id' : {mongodb UUID - we set it manually using notebook_id},
    #     'owner' : {username of the owner of this notebook},
    #     'doc_type' : (ipynb_chkpt|ipynb),
    #     'ipynb' : { actual ipython notebook hash },
    #     'created' : { creation/update timestamp }
    # }

    mongodb_uri = Unicode('mongodb://localhost/', config=True, help='MongoDB connection URI')
    mongodb_database = Unicode('narrative', config=True, help='MongoDB database')
    mongodb_collection = Unicode('notebooks', config=True, help='MongoDB collection')
    checkpoint_id = Unicode('%(username)_ipynb_checkpoints',config=True,
                            help="""The MongoDB notebook_name in which to keep notebook checkpoints
        This is a python string format that supports the following mapping keys
        username : username of the user using the notebook
        time : Current time as an integer (int(time.time())
        By default, it is %(username)_ipynb_checkpoints
        """
                            )
    ipynb_type = Unicode(u'ipynb')
    chkpt_type = Unicode(u'ipynb_chkpt')
    allowed_formats = List([u'json'])
    node_format = ipynb_type

    def __init__(self, **kwargs):
        """Verify that we can connect to the MongoDB instance"""
        super( MongoNotebookManager, self).__init__(**kwargs)
        if not self.mongodb_uri:
            raise web.HTTPError(412, u"Missing MongoDB connection URI.")
        if not self.mongodb_database:
            raise web.HTTPError(412, u"Missing MongoDB database.")
        if not self.mongodb_collection:
            raise web.HTTPError(412, u"Missing MongoDB collection.")
        try:
            self.mclient = MongoClient( self.mongodb_uri, read_preference = ReadPreference.PRIMARY_PREFERRED)
            self.db = self.mclient[self.mongodb_database]
            self.collection = self.db[self.mongodb_collection]
        except Exception as e:
            raise web.HTTPError( 500, u"Unable to connect to MongoDB service: %s " % e)
        # setup a mapping dict for MongoDB/notebook_id <-> Notebook name
        mapping = Dict()
        # Map notebook names to notebook_ids
        rev_mapping = Dict()
    
            
    def list_notebooks(self):
        """List all notebooks in MongoDB.
        The _id field used by MongoDB is a UUID like the notebook_id, so
        we directly use the notebook_id for the MongoDB _id field
        The name field is coming out of document.ipynb.metadata.name
        """

        all_ipynb = self.collection.find( {'doc_type' : self.ipynb_type})
        all2 = list( all_ipynb)
        self.mapping = { doc['_id'] : doc['ipynb']['metadata']['name'] for doc in all2 }
        self.rev_mapping = { doc['ipynb']['metadata']['name'] : doc['_id'] for doc in all2 }

        data = [ dict(notebook_id = it[0], name = it[1]) for it in self.mapping.items()]
        data = sorted(data, key=lambda item: item['name'])
        return data

    def new_notebook_id(self, name):
        """Generate a new notebook_id for a name and store its mappings."""
        notebook_id = super(MongoNotebookManager, self).new_notebook_id(name)
        self.rev_mapping[name] = notebook_id
        return notebook_id

    def delete_notebook_id(self, notebook_id):
        """Delete a notebook's id in the mapping."""
        name = self.mapping[notebook_id]
        super(MongoNotebookManager, self).delete_notebook_id(notebook_id)
        del self.rev_mapping[name]

    def notebook_exists(self, notebook_id):
        """Does a notebook exist?"""
        exists = super(MongoNotebookManager, self).notebook_exists(notebook_id)
        if not exists:
            return False
        path = self.get_path_by_name(self.mapping[notebook_id])
        return os.path.isfile(path)
    
    def get_name(self, notebook_id):
        """get a notebook name, raising 404 if not found"""
        try:
            name = self.mapping[notebook_id]
        except KeyError:
            raise web.HTTPError(404, u'Notebook does not exist: %s' % notebook_id)
        return name

    def read_notebook_object(self, notebook_id):
        """Get the Notebook representation of a notebook by notebook_id."""

        doc = self.collection.find_one( { '_id' : notebook_id })
        if doc is None:
            raise web.HTTPError(500, u'Notebook % not found' % notebook_id)
        # Convert from MongoDB doc to plain JSON and then conver to notebook format
        jsonnb = dumps( doc['ipynb'] )
        nb = current.reads( jsonnb, u'json')
        last_modified = dateutil.parser.parse(doc['created'])
        return last_modified, nb
    
    def write_notebook_object(self, nb, notebook_id=None):
        """Save an existing notebook object by notebook_id."""
        try:
            new_name = normalize('NFC', nb.metadata.name)
        except AttributeError:
            raise web.HTTPError(400, u'Missing notebook name')
        # Carry over some of the metadata stuff from ShockNBManager
        try:
            if notebook_id is None:
                notebook_id = self.new_notebook_id(new_name)
            if not hasattr(nb.metadata, 'owner'):
                nb.metadata.owner = 'public'
            if not hasattr(nb.metadata, 'type'):
                nb.metadata.type = 'generic'
            if not hasattr(nb.metadata, 'description'):
                nb.metadata.description = ''
            nb.metadata.created = datetime.datetime.utcnow().isoformat()
            nb.metadata.format = self.node_format
        except Exception as e:
            raise web.HTTPError(400, u'Unexpected error setting notebook attributes: %s' %e)
        if notebook_id not in self.mapping:
            raise web.HTTPError(404, u'Notebook does not exist: %s' % notebook_id)

        try:
            doc = { '_id' : notebook_id,
                    'owner' : nb.metadata.owner,
                    'doc_type' : self.ipynb_type,
                    'created' : nb.metadata.created,
                    'ipynb' : nb
                    }
            id = self.collection.save( doc, manipulate = True, safe=True)
        except Exception as e:
            raise web.HTTPError(500, u'Error saving notebook: %s' % e)
        self.mapping[id] = new_name
        return id

    def delete_notebook(self, notebook_id):
        """Delete notebook by notebook_id."""
        if notebook_id is None:
            raise web.HTTPError(400, u'Missing notebookd_id')
        doc = self.collection.find_one( { '_id' : notebook_id });
        if doc is None:
            raise web.HTTPError(404, u'Notebook not found')
        self.log.debug("unlinking notebook %s", notebook_id)
        self.collection.remove( { '_id' : notebook_id })
        self.delete_notebook_id(notebook_id)

    # public checkpoint API
    
    def create_checkpoint(self, notebook_id):
        """Create a checkpoint from the current state of a notebook"""
        #nb_path = self.get_path(notebook_id)
        # only the one checkpoint ID:
        #checkpoint_id = u"checkpoint"
        #cp_path = self.get_checkpoint_path(notebook_id, checkpoint_id)
        #self.log.debug("creating checkpoint for notebook %s", notebook_id)
        #if not os.path.exists(self.checkpoint_dir):
        #    os.mkdir(self.checkpoint_dir)
        #shutil.copy2(nb_path, cp_path)
        
        # return the checkpoint info
        #return self.get_checkpoint_info(notebook_id, checkpoint_id)
        pass

    def list_checkpoints(self, notebook_id):
        """list the checkpoints for a given notebook
        
        This notebook manager currently only supports one checkpoint per notebook.
        """
        #checkpoint_id = u"checkpoint"
        #path = self.get_checkpoint_path(notebook_id, checkpoint_id)
        #if not os.path.exists(path):
        #    return []
        #else:
        #    return [self.get_checkpoint_info(notebook_id, checkpoint_id)]
        pass
    
    def restore_checkpoint(self, notebook_id, checkpoint_id):
        """restore a notebook to a checkpointed state"""
        #self.log.info("restoring Notebook %s from checkpoint %s", notebook_id, checkpoint_id)
        #nb_path = self.get_path(notebook_id)
        #cp_path = self.get_checkpoint_path(notebook_id, checkpoint_id)
        #if not os.path.isfile(cp_path):
        #    self.log.debug("checkpoint file does not exist: %s", cp_path)
        #    raise web.HTTPError(404,
        #        u'Notebook checkpoint does not exist: %s-%s' % (notebook_id, checkpoint_id)
        #    )
        # ensure notebook is readable (never restore from an unreadable notebook)
        #last_modified, nb = self.read_notebook_object_from_path(cp_path)
        #shutil.copy2(cp_path, nb_path)
        #self.log.debug("copying %s -> %s", cp_path, nb_path)
        pass

    def delete_checkpoint(self, notebook_id, checkpoint_id):
        """delete a notebook's checkpoint"""
        #path = self.get_checkpoint_path(notebook_id, checkpoint_id)
        #if not os.path.isfile(path):
        #    raise web.HTTPError(404,
        #        u'Notebook checkpoint does not exist: %s-%s' % (notebook_id, checkpoint_id)
        #    )
        #self.log.debug("unlinking %s", path)
        #os.unlink(path)
        pass

    def log_info(self):
        self.log.info("Serving notebooks from MongoDB URI %s" %self.mongodb_uri)
        self.log.info("Serving notebooks from MongoDB db %s" %self.mongodb_database)
        self.log.info("Serving notebooks from MongoDB collection %s" %self.mongodb_collection)

    def info_string(self):
        return "Serving notebooks from mongodb database %s and collection %s" % (self.mongodb_database,
                                                                                 self.mongodb_collection)
