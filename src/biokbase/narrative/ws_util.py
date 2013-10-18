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
from biokbase.workspaceService.Client import workspaceService

# regex for parsing out workspace_id and object_id from
# a "kb|ws.{workspace}.{object}" string
ws_regex = re.compile( '^kb\|ws\.(?P<wsid>\w+)\.(?P<objid>\w+)')

# Exception for a malformed workspace ID see regex above
class BadWorkspaceID( Exception ):
    pass

# List of fields returned by the list_workspace_objects function
list_ws_obj_fields = ['id','type','moddate','instance','command',
                      'lastmodifier','owner','workspace','ref','chsum',
                      'metadata']

# object type for a project tag object
ws_tag_type = 'workspace_meta'

# object name for project tag
ws_tag = { 'project' : '_project' }

def get_wsobj_meta( wsclient, token, objtype="Narrative", perm=None, ws=None ):
    """
    Takes an initialized workspace client and a token. Defaults to searching for
    Narrative types in any workspace that the token has at least read access to.

    If the perm field is specified then the workspaces will be filtered by that
    permission value - if perm='a' then search all workspaces where the token
    provides administrative access

    If the ws field is specified then it will return the workspace metadata
    for only the workspace specified

    Returns a dictionary of object descriptions - the key is a workspace id of
    the form "kb|ws.{workspace_id}.{object_id}" and the values are dictionaries
    keyed on the list_ws_obj_field list above.
    """
    # This query is generally kind of slow, so we do some basic loop
    # optimizations - doing it with functional operators would be faster
    # but the slowdown is mostly due to network latency for all the
    # requests that have to go over the wire. Try to be space efficient
    # by using generators and simple for loops
    if ws is None:
        wslist1 = wsclient.list_workspaces( { 'auth' : token })
        if perm is None:
            wslist2 = (w[0] for w in wslist1 if w[4] != u'n')
        else:
            wslist2 = (w[0] for w in wslist1 if w[4] == perm)
    else:
        wslist2 = [ws]
    my_narratives = {}
    list_ws_obj = wsclient.list_workspace_objects
    fields = list_ws_obj_fields
    for w in wslist2:
        res = list_ws_obj({ 'auth' : token, 'type' : objtype, 'workspace' : w})
        for obj in res:
            my_narratives["kb|ws.%s.%s" % (w,obj[0])] = dict(zip(fields,obj))
    return my_narratives

def get_wsobj( wsclient, token, ws_id, objtype=None):
    """
    This is just a wrapper for the workspace get_object call.

    Takes an initialized workspace client and a token and a workspace ID
    of the form "kb|ws.{ws_id}.{object id}" and returns the following:
    { 'data' : {actual data contained in the object},
      'metadata' : { a dictionary version of the object metadata }}

    if type is not specified then an extra lookup for object metadata
    is required, this can be shortcut by passing in the object type
    """
    match = ws_regex.match( ws_id)
    if not match:
        raise BadWorkspaceID( "%s does not match workspace ID format kb|ws.{workspace}.{object}" % ws_id)
    ws = match.group(1)
    objid = match.group(2)
    if objtype is None:
        obj_meta = get_wsobj_meta( wsclient, token, ws=ws )
        if ws_id in obj_meta:
            objtype = obj_meta[ws_id]['type']
        else:
            raise BadWorkspaceID( "Could not find object named %s in workspace %s" % (objid,ws))
    res = wsclient.get_object( dict( auth=token, workspace=ws, id=objid, type=objtype))
    res['metadata'] = dict(zip(list_ws_obj_fields, res['metadata']))
    return res

# Tag a workspace as a project, if there is an error, let it propagate up
def check_project_tag( wsclient, workspace, token):
    try:
        tag = wsclient.get_objectmeta( { 'auth' : token,
                                         'workspace' : workspace,
                                         'id' : ws_tag['project'],
                                         'type' : ws_tag_type});
    except biokbase.workspaceService.Client.ServerError, e:
        # If it is a not found error, create it, otherwise reraise
        if e.message.find('not found'):
            ws_meta = wsclient.save_object( { 'workspace' : workspace,
                                              'auth' : token,
                                              'type' :ws_tag_type,
                                              'id' : ws_tag['project'],
                                              'data' : { 'description' : 'Tag! You\'re a project!'},
                                              'metadata' : {},
                                              'default_permission' : 'n'});
        else:
            raise e
    return True


def check_homews( wsclient, user_id, token):
    """
    Helper routine to make sure that the user's home workspace is built. Putting it here
    so that when/if it changes we only have a single place to change things.
    Takes a wsclient and token, will check for the existence of the home workspace and
    create it if necessary. Will pass along any exceptions. Will also make sure that
    it is tagged with a workspace_meta object named "_project"
    """
    try:
        homews = "%s_home" % user_id
        ws_meta = wsclient.get_workspacemeta( { 'auth' : token,
                                                'workspace' : homews})
    except biokbase.workspaceService.Client.ServerError, e:
        # If it is a not found error, create it, otherwise reraise
        if e.message.find('not found'):
            ws_meta = wsclient.create_workspace( { 'workspace' : homews,
                                                   'auth' : token,
                                                   'default_permission' : 'n'})
            return homews
        else:
            raise e
    if ws_meta:
        check_project_tag( wsclient, homews, token)
        return homews
    else:
        raise Exception('Unable to find or create home workspace: %s' % homews)
