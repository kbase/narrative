#!/usr/bin/env python

import os, shutil, traceback
from collection import Collection
from ipyTools import *

class Project(Collection):
    """Class representation of Project object:
         "id"             : [ 'string', 'unique object identifier' ],
         "name"           : [ 'string', 'human readable identifier' ],
         "libraries"      : [ 'list',  ['reference library', 'a list of references to the related library objects'] ],
         "samples"        : [ 'list',  ['reference sample', 'a list of references to the related sample objects'] ],
         "analyzed"       : [ 'list',  ['reference metagenome', 'a list of references to the related metagenome objects'] ],
         "description"    : [ 'string', 'a short, comprehensive description of the project' ],
         "funding_source" : [ 'string', 'the official name of the source of funding of this project' ],
         "pi"             : [ 'string', 'the first and last name of the principal investigator of the project' ],
         "metadata"       : [ 'hash',   'key value pairs describing metadata' ],
         "created"        : [ 'date',   'time the object was first created' ],
         "version"        : [ 'integer','version of the object' ],
         "url"            : [ 'uri',    'resource location of this object instance' ],
         "status"         : [ 'cv',     [ ['public', 'object is public'],
        						           ['private', 'object is private'] ] ]
    """
    def __init__(self, pid, stats=True, auth=None, def_name=None, cache=False):
        # set project
        self._cfile = Ipy.CCH_DIR+'/'+pid+'.json'
        project = None
        if cache and os.path.isfile(self._cfile):
            # try load from cache if given
            try:
                project = json.load(open(self._cfile, 'rU'))
                if Ipy.DEBUG:
                    sys.stdout.write("project %s loaded from cached file (%s)\n"%(pid, self._cfile))
            except:
                pass
        if project is None:
            # load from api
            project = self._get_project(pid, auth)
            if project and cache and os.path.isdir(Ipy.CCH_DIR):
                # save to cache if given
                try:
                    json.dump(project, open(self._cfile, 'w'))
                    if Ipy.DEBUG:
                        sys.stdout.write("project %s saved to cached file (%s)\n"%(mgid, self._cfile))
                except:
                    pass
        if project is not None:
            for key, val in project.iteritems():
                setattr(self, key, val)
        else:
            self.id = pid
            self.name = None
            return
        # hack to get variable name
        if def_name == None:
            try:
                (filename,line_number,function_name,text)=traceback.extract_stack()[-2]
                def_name = text[:text.find('=')].strip()
            except:
                pass
        self.defined_name = def_name
        # call collection init - from cache if given
        Collection.__init__(self, self.mgids(), stats=stats, auth=auth, def_name=self.defined_name, cache=cache)
    
    def _get_project(self, pid, auth):
        if Ipy.DEBUG:
            sys.stdout.write("Loading project %s from API ...\n"%pid)
        return obj_from_url(Ipy.API_URL+'/project/'+pid+'?verbosity=full', auth)

    def mgids(self):
        mlist = []
        if hasattr(self, 'analyzed'):
            mlist = map(lambda x: x[0], self.analyzed)
        return mlist
