"""A notebook manager that uses the KBase workspace for storage.

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
from tornado.web import HTTPError
# IPython
from IPython import nbformat
from IPython.nbformat import (
    sign,
    validate,
    ValidationError
)
from IPython.html.services.contents.manager import ContentsManager
from IPython.utils.traitlets import (
    Unicode, 
    Dict, 
    Bool, 
    List, 
    TraitError
)
from IPython.utils import tz

# Local
from .manager_util import base_model
from .narrativeio import (
    KBaseWSManagerMixin, 
    PermissionsError
)
from .kbasecheckpoints import KBaseCheckpoints
import biokbase.narrative.ws_util as ws_util
from biokbase.workspace.client import Workspace
import biokbase.narrative.common.service as service
from biokbase.narrative.common import util
import biokbase.auth

#-----------------------------------------------------------------------------
# Classes
#-----------------------------------------------------------------------------

class KBaseWSManager(KBaseWSManagerMixin, ContentsManager):
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
    ws_regex = re.compile('^ws\.(?P<wsid>\d+)\.obj\.(?P<objid>\d+)(\.(?P<ver>\d+))?')
    # regex for parsing out fully qualified workspace name and object name
    ws_regex2 = re.compile('^(?P<wsname>[\w:]+)/(?P<objname>[\w]+)')
    # regex for par
    kbid_regex = re.compile('^(kb\|[a-zA-Z]+\..+)')
    # regex from pretty name path
    objid_regex = re.compile('^.*\s-\s(?P<obj_long_id>ws\.(?P<wsid>\d+)\.obj\.(?P<objid>\d+))\s-\s')

    # This is a regular expression to make sure that the workspace ID
    # doesn't contain non-legit characters in the object ID field
    # We use it like this to to translate names:
    # wsid_regex.sub('',"Hello! Freaking World! 123".replace(' ','_'))
    # to get an id of 'Hello_Freaking_World_123'
    # We will enforce validation on the narrative naming GUI, but this is
    # a safety net
    wsid_regex = re.compile('[\W]+', re.UNICODE)

    def __init__(self, *args, **kwargs):
        """Verify that we can connect to the configured WS instance"""
        super(KBaseWSManager, self).__init__(*args, **kwargs)
        if not self.kbasews_uri:
            raise HTTPError(412, u"Missing KBase workspace service endpoint URI.")

        # Map Narrative ids to notebook names
        mapping = Dict()
        # Map notebook names to Narrative ids
        rev_mapping = Dict()
        # Setup empty hash for session object
        self.kbase_session = {}
        # Init the session info we need.

    def _checkpoints_class_default(self):
        return KBaseCheckpoints

    def get_userid(self):
        """Return the current user id (if logged in), or None
        """
        t = biokbase.auth.Token()
        if (t is not None):
            return self.kbase_session.get('user_id', t.user_id)
        else:
            return self.kbase_session.get('user_id', None)

    def _clean_id(self, id):
        """Clean any whitespace out of the given id"""
        return self.wsid_regex.sub('', id.replace(' ', '_'))

    #####
    # API part 1: methods that must be implemented in subclasses.        
    #####
    def dir_exists(self, path):
        """If it's blank, just return True - 
           we'll be looking up the list of all Narratives from 
           that dir, so it's real."""
        if not path:
            return True
        else:
            return False

    def is_hidden(self, path):
        """We can only see what gets returned from Workspace lookup,
           so nothing should be hidden"""
        return False

    def file_exists(self, path):
        """We only support narratives right now, so look up
           a narrative from that path."""
        path = path.strip('/')
        obj_ref = self._obj_ref_from_path(path)
        if obj_ref is None:
            raise HTTPError(404, 'Path "{}" is not a valid Narrative path'.format(path))
        self.log.warn('looking up whether a narrative exists')
        print('got here.')
        try:
            self.log.warn('trying to get narrative {}'.format(obj_ref))
            return self.narrative_exists(obj_ref)
        except PermissionsError as e:
            self.log.warn('found a 403 error')
            raise HTTPError(403, "You do not have permission to view the narrative with id {}".format(path))
        # except Exception as e:
        #     self.log.debug('got a 500 error')
        #     raise HTTPError(500, e)

    def exists(self, path):
        """Looks up whether a directory or file path (i.e. narrative)
           exists"""
        path = path.strip('/')
        if not path: # it's a directory, for all narratives
            return True
        return self.file_exists(path)

    def _wsobj_to_model(self, nar, content=True):
        nar_id = 'ws.{}.obj.{}'.format(nar['wsid'], nar['objid'])
        model = base_model('{} - {} - {}'.format(nar['saved_by'], nar_id, nar['name']), nar_id)
        model['format'] = 'v3'
        model['last_modified'] = nar['save_date']
        model['type'] = 'notebook'

        # model = base_model('%s/%s' % (nar['notebook_id'], nar['name']))
        # model['format'] = 'v3'
        return model

    def _obj_ref_from_path(self, path):
        parsed = self._parse_path(path)
        if parsed is None:
            return None
        if 'wsid' not in parsed or 'objid' not in parsed:
            return None
        ref = '{}/{}'.format(parsed['wsid'], parsed['objid'])
        if parsed['ver'] is not None:
            ref = ref + '/{}'.format(parsed['ver'])
        return ref

    def _parse_path(self, path):
        m = self.ws_regex.match(path)
        if m is None:
            return None
        return dict(
            wsid=m.group('wsid'),
            objid=m.group('objid'),
            ver=m.group('ver')
        )

    def get(self, path, content=True, type=None, format=None):
        """Get the model of a file or directory with or without content."""
        path = path.strip('/')

        model = base_model(path, path)
        if self.exists(path) and type != 'directory':
            #It's a narrative object, so try to fetch it.
            obj_ref = self._parse_path(path)
            if not obj_ref:
                raise HTTPError(404, u'Unknown Narrative "{}"'.format(path))
            try:
                nar_obj = self.read_narrative('{}/{}'.format(obj_ref['wsid'], obj_ref['objid']), content)
                model['type'] = 'notebook'
                user = self.get_userid()
                if content:
                    model['format'] = 'json'
                    model['content'] = nbformat.reads(json.dumps(nar_obj['data']), 4)
                    util.kbase_env.narrative = 'ws.{}.obj.{}'.format(obj_ref['wsid'], obj_ref['objid'])
                    util.kbase_env.workspace = model['content'].metadata.ws_name
                if user is not None:
                    model['writable'] = self.narrative_writable('{}/{}'.format(obj_ref['wsid'], obj_ref['objid']), user)
            except HTTPError:
                raise
            except PermissionsError as e:
                raise HTTPError(403, e)
            except Exception as e:
                raise HTTPError(500, u'An error occurred while fetching your narrative: {}'.format(e))

        if not path or type == 'directory':
            #if it's the empty string, look up all narratives, treat them as a dir
            model['type'] = type
            model['format'] = 'json'
            if content:
                contents = []
                nar_list = self.list_narratives()
                for nar in nar_list:
                    contents.append(self._wsobj_to_model(nar, content=False))
                model['content'] = contents

        return model

    def save(self, model, path):
        """Save the file or directory and return the model with no content.

        Save implementations should call self.run_pre_save_hook(model=model, path=path)
        prior to writing any data.
        """
        path = path.strip('/')
        match = self.ws_regex.match(path)

        if 'type' not in model:
            raise HTTPError(400, u'No IPython model type provided')
        if model['type'] != 'notebook':
            raise HTTPError(400, u'We currently only support saving Narratives!')
        if 'content' not in model and model['type'] != 'directory':
            raise HTTPError(400, u'No Narrative content found while trying to save')

        self.log.debug("writing Narrative %s." % path)
        nb = nbformat.from_dict(model['content'])
        self.check_and_sign(nb, path)

        try:
            result = self.write_narrative(self._obj_ref_from_path(path), nb, self.get_userid())

            new_id = "ws.%s.obj.%s" % (result[1], result[2])
            util.kbase_env.narrative = new_id

            nb = result[0]
            self.validate_notebook_model(model)
            validation_message = model.get('message', None)

            model = self.get(path, content=False)
            if validation_message:
                model['message'] = validation_message
            return model

        except PermissionsError as err:
            raise HTTPError(403, err.message)
        except Exception as err:
            raise HTTPError(500, u'An error occurred while saving your Narrative: {}'.format(err))

    def delete_file(self, path):
        """Delete file or directory by path."""
        raise NotImplementedError('deletion not implemented yet')

    def rename_file(self, path, new_name):
        """Rename a file from old_path to new_path.
        This gets tricky in KBase since we don't deal with paths, but with
        actual file names. For now, assume that 'old_path' won't actually
        change, but the 'new_path' is actually the new Narrative name."""
        path = path.strip('/')

        try:
            self.rename_narrative(self._obj_ref_from_path(path), self.get_userid(), new_name)
        except PermissionsErr as err:
            raise HTTPError(403, err.message)
        except Exception as err:
            raise HTTPError(500, u'An error occurred while renaming your Narrative: {}'.format(err))

    # API part 2: methods that have useable default
    # implementations, but can be overridden in subclasses.
    def delete(self, path):
        """Delete a file/directory and any associated checkpoints."""
        path = path.strip('/')
        if not path:
            raise HTTPError(400, "Can't delete root")
        self.delete_file(path)
        self.checkpoints.delete_all_checkpoints(path)

    def rename(self, old_path, new_path):
        """Rename a file and any checkpoints associated with that file."""
        self.rename_file(old_path, new_path)
        self.checkpoints.rename_all_checkpoints(old_path, new_path)

    def update(self, model, path):
        """Update the file's path

        For use in PATCH requests, to enable renaming a file without
        re-uploading its contents. Only used for renaming at the moment.
        """
        path = path.strip('/')
        new_path = model.get('path', path).strip('/')
        if path != new_path:
            self.rename(path, new_path)
        model = self.get(new_path, content=False)
        return model

    # def info_string(self):
    #     return "Serving contents"

    def increment_filename(self, filename, path='', insert=''):
        """Increment a filename until it is unique.

        Parameters
        ----------
        filename : unicode
            The name of a file, including extension
        path : unicode
            The API path of the target's directory

        Returns
        -------
        name : unicode
            A filename that is unique, based on the input filename.
        """
        path = path.strip('/')
        basename, ext = os.path.splitext(filename)
        for i in itertools.count():
            if i:
                insert_i = '{}{}'.format(insert, i)
            else:
                insert_i = ''
            name = u'{basename}{insert}{ext}'.format(basename=basename,
                insert=insert_i, ext=ext)
            if not self.exists(u'{}/{}'.format(path, name)):
                break
        return name

    def validate_notebook_model(self, model):
        """Add failed-validation message to model"""
        try:
            validate(model['content'])
        except ValidationError as e:
            model['message'] = u'Notebook Validation failed: {}:\n{}'.format(
                e.message, json.dumps(e.instance, indent=1, default=lambda obj: '<UNKNOWN>'),
            )
        return model
    
    def new_untitled(self, path='', type='', ext=''):
        """Create a new untitled file or directory in path
        
        path must be a directory
        
        File extension can be specified.
        
        Use `new` to create files with a fully specified path (including filename).
        """
        path = path.strip('/')
        if not self.dir_exists(path):
            raise HTTPError(404, 'No such directory: %s' % path)
        
        model = {}
        if type:
            model['type'] = type
        
        if ext == '.ipynb':
            model.setdefault('type', 'notebook')
        else:
            model.setdefault('type', 'file')
        
        insert = ''
        if model['type'] == 'directory':
            untitled = self.untitled_directory
            insert = ' '
        elif model['type'] == 'notebook':
            untitled = self.untitled_notebook
            ext = '.ipynb'
        elif model['type'] == 'file':
            untitled = self.untitled_file
        else:
            raise HTTPError(400, "Unexpected model type: %r" % model['type'])
        
        name = self.increment_filename(untitled + ext, path, insert=insert)
        path = u'{0}/{1}'.format(path, name)
        return self.new(model, path)
    
    def new(self, model=None, path=''):
        """Create a new file or directory and return its model with no content.
        
        To create a new untitled entity in a directory, use `new_untitled`.
        """
        # TODO
        path = path.strip('/')
        if model is None:
            model = {}
        
        if path.endswith('.ipynb'):
            model.setdefault('type', 'notebook')
        else:
            model.setdefault('type', 'file')
        
        # no content, not a directory, so fill out new-file model
        if 'content' not in model and model['type'] != 'directory':
            if model['type'] == 'notebook':
                model['content'] = new_notebook()
                model['format'] = 'json'
            else:
                model['content'] = ''
                model['type'] = 'file'
                model['format'] = 'text'
        
        model = self.save(model, path)
        return model

    def copy(self, from_path, to_path=None):
        """Copy an existing file and return its new model.

        If to_path not specified, it will be the parent directory of from_path.
        If to_path is a directory, filename will increment `from_path-Copy#.ext`.

        from_path must be a full path to a file.
        """
        # TODO
        path = from_path.strip('/')
        if to_path is not None:
            to_path = to_path.strip('/')

        if '/' in path:
            from_dir, from_name = path.rsplit('/', 1)
        else:
            from_dir = ''
            from_name = path
        
        model = self.get(path)
        model.pop('path', None)
        model.pop('name', None)
        if model['type'] == 'directory':
            raise HTTPError(400, "Can't copy directories")
        
        if to_path is None:
            to_path = from_dir
        if self.dir_exists(to_path):
            name = copy_pat.sub(u'.', from_name)
            to_name = self.increment_filename(name, to_path, insert='-Copy')
            to_path = u'{0}/{1}'.format(to_path, to_name)
        
        model = self.save(model, to_path)
        return model

    def log_info(self):
        self.log.info(self.info_string())

    def trust_notebook(self, path):
        """Explicitly trust a notebook

        Parameters
        ----------
        path : string
            The path of a notebook
        """
        model = self.get(path)
        nb = model['content']
        self.log.warn("Trusting notebook %s", path)
        self.notary.mark_cells(nb, True)
        self.save(model, path)

    def check_and_sign(self, nb, path=''):
        """Check for trusted cells, and sign the notebook.

        Called as a part of saving notebooks.

        Parameters
        ----------
        nb : dict
            The notebook dict
        path : string
            The notebook's path (for logging)
        """
        if self.notary.check_cells(nb):
            self.notary.sign(nb)
        else:
            self.log.warn("Saving untrusted notebook %s", path)

    def mark_trusted_cells(self, nb, path=''):
        """Mark cells as trusted if the notebook signature matches.

        Called as a part of loading notebooks.

        Parameters
        ----------
        nb : dict
            The notebook object (in current nbformat)
        path : string
            The notebook's path (for logging)
        """
        trusted = self.notary.check_signature(nb)
        if not trusted:
            self.log.warn("Notebook %s is not trusted", path)
        self.notary.mark_cells(nb, trusted)

    def should_list(self, name):
        """Should this file/directory name be displayed in a listing?"""
        return not any(fnmatch(name, glob) for glob in self.hide_globs)

    def log_info(self):
        self.log.info("Service Narratives from the KBase Workspace service")
        pass

    # def info_string(self):
    #     return "Workspace Narrative Service with workspace endpoint at %s" % self.kbasews_uri