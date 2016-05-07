from biokbase.workspace.client import Workspace
from biokbase.NarrativeJobService.Client import NarrativeJobService
from biokbase.narrative_method_store.client import NarrativeMethodStore

from biokbase.narrative.common.url_config import URLS
__clients = dict()

def get(client_name):
    if client_name in __clients:
        return __clients[client_name]

    else:
        return __init_client(client_name)

def __init_client(client_name):
    if client_name == 'workspace':
        c = Workspace(URLS.workspace)
    elif client_name == 'job_service':
        c = NarrativeJobService(URLS.job_service)
    elif client_name == 'narrative_method_store':
        c = NarrativeMethodStore(URLS.narrative_method_store)

    else:
        raise ValueError('Unknown client name "%s"' % client_name)

    __clients[client_name] = c
    return c