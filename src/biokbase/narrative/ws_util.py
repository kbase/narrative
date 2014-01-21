"""
Some helper functions for workspace stuff
"""
#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import datetime
import dateutil.parser
import json
import re
import biokbase
import biokbase.workspaceService

# regex for parsing out workspace_id and object_id from
# a "kb|ws.{workspace}.{object}" string
ws_regex = re.compile( '^kb\|ws\.(?P<wsid>\d+)\.(?P<objid>\d+)')

# Exception for a malformed workspace ID see regex above
class BadWorkspaceID( Exception ):
    pass

# Exception for a workspace object not found see regex above
class BadWorkspaceID( Exception ):
    pass


# List of fields returned by the list_workspace_objects function
list_ws_obj_fields = ['id','type','moddate','instance','command',
                      'lastmodifier','owner','workspace','ref','chsum',
                      'metadata','objid']

# The list_workspace_objects method has been deprecated, the
# list_objects method is the current primary method for fetching
# objects, and has a different field list
list_objects_fields = [ 'objid','name','type','save_date','ver','saved_by','wsid','workspace',
                        'chsum','size','meta']
obj_field = dict(zip(list_objects_fields,range(len(list_objects_fields))))

# object type for a project tag object
ws_tag_type = 'KBaseNarrative.Metadata'

# object type for a project tag object
ws_narrative_type = 'KBaseNarrative.Narrative'

# object name for project tag
ws_tag = { 'project' : 'project_meta' }

def get_wsobj_meta( wsclient, objtype=ws_narrative_type, ws_id=None ):
    """
    Takes an initialized workspace client. Defaults to searching for
    Narrative types in any workspace that the token has at least read access to.

    If the ws field is specified then it will return the workspace metadata
    for only the workspace specified

    Returns a dictionary of object descriptions - the key is a workspace id of
    the form "kb|ws.{workspace_id}.obj.{object_id}" and the values are dictionaries
    keyed on the list_ws_obj_field list above.
    """
    if ws_id is None:
        res = wsclient.list_objects( { 'type' : objtype,
                                       'includeMetadata' : 1} )
    else:
        res = wsclient.list_objects( { 'type' : objtype,
                                       'includeMetadata' : 1,
                                       'ids' : [ws_id]} )
    my_narratives = {}
    for obj in res:
        my_narratives["kb|ws.%s.obj.%s" % (obj[obj_field['wsid']],obj[obj_field['objid']])] = dict(zip(list_objects_fields,obj))
    return my_narratives

def get_wsobj( wsclient, ws_id, objtype=None):
    """
    This is just a wrapper for the workspace get_objects call.

    Takes an initialized workspace client and a workspace ID
    of the form "kb|ws.{ws_id}.obj.{object id}" and returns the following:
    { 'data' : {actual data contained in the object},
      'metadata' : { a dictionary version of the object metadata },
      ... all the fields that are normally returned in a ws ObjectData type
      }

    if type is not specified then an extra lookup for object metadata
    is required, this can be shortcut by passing in the object type
    """
    match = ws_regex.match( ws_id)
    if not match:
        raise BadWorkspaceID( "%s does not match workspace ID format kb|ws.{workspace id}.obj.{object id}" % ws_id)
    ws = match.group(1)
    objid = match.group(2)
    objs = wsclient.get_objects( [dict( wsid=ws, objid=objid)])
    if len(objs) < 1:
        raise BadWorkspaceID( "%s could not be found" % ws_id)
    elif len(objs) > 1:
        raise BadWorkspaceID( "%s non-unique! Weird!!!" % ws_id)
    res=objs[0]
    res['metadata'] = dict(zip(list_objects_fields,objs[0]['info']))
    return res

# Tag a workspace as a project, if there is an error, let it propagate up
def check_project_tag( wsclient, ws_id):
    try:
        tag = wsclient.get_object_info( [{ 'wsid' : ws_id,
                                           'name' : ws_tag['project']}],
                                        0);
    except biokbase.workspaceService.Client.ServerError, e:
        # If it is a not found error, create it, otherwise reraise
        if e.message.find('not found'):
            obj_save_data = { 'name' : ws_tag['project'],
                              'type' :ws_tag_type,
                              'data' : { 'description' : 'Tag! You\'re a project!'},
                              'meta' : {},
                              'provenance' : [],
                              'hidden' : 1}
            ws_meta = wsclient.save_objects( { 'id' : ws_id,
                                               'objects' : [obj_save_data]});
        else:
            raise e
    return True


def check_homews( wsclient, user_id):
    """
    Helper routine to make sure that the user's home workspace is built. Putting it here
    so that when/if it changes we only have a single place to change things.
    Takes a wsclient and token, will check for the existence of the home workspace and
    create it if necessary. Will pass along any exceptions. Will also make sure that
    it is tagged with a workspace_meta object named "_project"
    """
    try:
        homews = "%s:home" % user_id
        workspace_identity = { 'workspace' : homews }
        ws_meta = wsclient.get_workspace_info( workspace_identity)
    except biokbase.workspaceService.Client.ServerError, e:
        # If it is a not found error, create it, otherwise reraise
        if e.message.find('not found'):
            ws_meta = wsclient.create_workspace( { 'workspace' : homews,
                                                   'globalread' : 'n',
                                                   'description' : 'User home workspace'})
        else:
            raise e
    if ws_meta:
        check_project_tag( wsclient, ws_meta[0])
        # return the textual name and the numeric ws_id
        return ws_meta[1],ws_meta[0]
    else:
        raise Exception('Unable to find or create home workspace: %s' % homews)
