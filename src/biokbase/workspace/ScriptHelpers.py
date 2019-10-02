import os
import sys
from ConfigParser import ConfigParser
from biokbase.auth import kb_config
#from biokbase.userandjobstate.client import UserAndJobState

def getKBaseCfg():
    cfg = ConfigParser()
    if os.path.exists(kb_config):
        try:
            cfg.read(kb_config)
        except Exception, e:
            print 'Error while reading INI file %s: %s' % (kb_config, e)
    if not cfg.has_section('workspace_deluxe'):
        cfg.add_section('workspace_deluxe')
        with open(kb_config, 'w') as configfile:
            cfg.write(configfile)
    return cfg

def user_workspace(newWs = None):
    if newWs is not None:
        currentWs = newWs
        #if 'KB_RUNNING_IN_IRIS' not in os.environ:
        cfg = getKBaseCfg()
        try:
            userId = cfg.get('authentication','user_id')
        except:
            userId = 'public'
        cfg.set('workspace_deluxe', userId+'-current-workspace', currentWs)
        with open(kb_config, 'w') as configfile:
            cfg.write(configfile)
        #else:
        #    ujs = UserAndJobState()
        #    ujs.set_state('Workspace', 'current-workspace', currentWs)
    else:
        #if 'KB_RUNNING_IN_IRIS' not in os.environ:
        cfg = getKBaseCfg()
        try:
            userId = cfg.get('authentication','user_id')
        except:
            userId = 'public'
        try:
            currentWs = cfg.get('workspace_deluxe', userId+'-current-workspace')
        except:
            # for compatibility, look for the old style workspace config variable 
            try:
                currentWs = cfg.get('workspace_deluxe', 'workspace')
                cfg.set('workspace_deluxe',userId+'-current-workspace', currentWs)
                cfg.remove_option('workspace_deluxe','workspace')
                with open(kb_config, 'w') as configfile:
                    cfg.write(configfile)
            except:
                sys.stderr.write('\nWorkspace has not been set!\nRun ws-workspace [WORKSPACE_NAME] to set your workspace.\n\n')
                return None
        #else:
        #    ujs = UserAndJobState()
        #    try:
        #        currentWs = ujs.get_state('Workspace', 'current-workspace', 0)
        #    except: # Could be explicit about the exception to catch
        #        sys.stderr.write('\nWorkspace has not been set!\nRun ws-workspace [WORKSPACE_NAME] to set your workspace.\n\n')
        #        return None
    return currentWs

def parseObjectMeta(metaTuple):
    metaDict = dict()
    metaDict['id'] = metaTuple[0]
    metaDict['type'] = metaTuple[1]
    metaDict['moddate'] = metaTuple[2]
    metaDict['instance'] = metaTuple[3]
    metaDict['command'] = metaTuple[4]
    metaDict['lastmodifier'] = metaTuple[5]
    metaDict['owner'] = metaTuple[6]
    metaDict['workspace'] = metaTuple[7]
    metaDict['reference'] = metaTuple[8]
    metaDict['chsum'] = metaTuple[9]
    metaDict['metadata'] = metaTuple[10]
    return metaDict

def printObjectMeta(metaTuple):
    metaDict = parseObjectMeta(metaTuple)
    print 'Object Name: '+metaDict['id']
    print 'Type: '+metaDict['type']
    print 'Instance: '+str(metaDict['instance'])
    print 'Workspace: '+metaDict['workspace']
    print 'Owner: '+metaDict['owner']
    print 'Moddate: '+metaDict['moddate']
    #print 'Last cmd: '+metaDict['command']
    print 'Modified by: '+metaDict['lastmodifier']
    #print 'Perm ref: '+metaDict['reference']
    print 'Checksum: '+metaDict['chsum']
    if 'metadata' in metaDict:
        for key in metaDict['metadata']:
            print key+': '+metaDict['metadata'][key]
    return

def parseObjectInfo(infoTuple):
    infoDict = dict()
    infoDict['id'] = infoTuple[0]
    infoDict['name'] = infoTuple[1]
    infoDict['type'] = infoTuple[2]
    infoDict['save_date'] = infoTuple[3]
    infoDict['version'] = infoTuple[4]
    infoDict['saved_by'] = infoTuple[5]
    infoDict['wsid'] = infoTuple[6]
    infoDict['workspace'] = infoTuple[7]
    infoDict['chsum'] = infoTuple[8]
    infoDict['size'] = infoTuple[9]
    infoDict['metadata'] = infoTuple[10]
    return infoDict

def printObjectInfo(infoTuple):
    infoDict = parseObjectInfo(infoTuple)
    print 'Object Name: '+infoDict['name']
    print 'Object ID: '+str(infoDict['id'])
    print 'Type: '+infoDict['type']
    print 'Version: '+str(infoDict['version'])
    print 'Workspace: '+infoDict['workspace']
    print 'Save Date: '+infoDict['save_date']
    print 'Saved by: '+infoDict['saved_by']
    print 'Checksum: '+infoDict['chsum']
    print 'Size(bytes): '+str(infoDict['size'])
    print 'User Meta Data: '
    if 'metadata' in infoDict:
        if len(infoDict['metadata']) == 0:
            print '  none.'
        for key in infoDict['metadata']:
            print '  '+key+': '+infoDict['metadata'][key]
    else:
        print '  none.'
    return

def parseWorkspaceInfo(infoTuple):
    infoDict = dict()
    infoDict['id'] = infoTuple[0]
    infoDict['workspace'] = infoTuple[1]
    infoDict['owner'] = infoTuple[2]
    infoDict['moddate'] = infoTuple[3]
    infoDict['objects'] = infoTuple[4]
    infoDict['user_permission'] = infoTuple[5]
    infoDict['globalread'] = infoTuple[6]
    return infoDict

def printWorkspaceInfo(infoTuple):
    infoDict = parseObjectInfo(infoTuple)
    print 'Workspace Name: '+infoDict['workspace']
    print 'Workspace ID: '+infoDict['id']
    print 'Owner: '+infoDict['owner']
    print 'Moddate: '+infoDict['moddate']
    print 'Objects: '+str(infoDict['objects'])
    print 'User permission: '+infoDict['user_permission']
    print 'Global permission:'+infoDict['global_permission']
    return

def parseWorkspaceMeta(metaTuple):
    metaDict = dict()
    metaDict['id'] = metaTuple[0]
    metaDict['owner'] = metaTuple[1]
    metaDict['moddate'] = metaTuple[2]
    metaDict['objects'] = metaTuple[3]
    metaDict['user_permission'] = metaTuple[4]
    metaDict['global_permission'] = metaTuple[5]
    return metaDict

def printWorkspaceMeta(metaTuple):
    metaDict = parseWorkspaceMeta(metaTuple)
    print 'Workspace ID: '+metaDict['id']
    print 'Owner: '+metaDict['owner']
    print 'Moddate: '+metaDict['moddate']
    print 'Objects: '+str(metaDict['objects'])
    print 'User permission: '+metaDict['user_permission']
    print 'Global permission:'+metaDict['global_permission']
    return
