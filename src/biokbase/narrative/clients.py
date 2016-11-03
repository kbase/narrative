from biokbase.workspace.client import Workspace
from biokbase.NarrativeJobService.Client import NarrativeJobService
from biokbase.narrative_method_store.client import NarrativeMethodStore
from biokbase.userandjobstate.client import UserAndJobState
from biokbase.catalog.Client import Catalog
from biokbase.service.Client import Client as ServiceClient

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
    elif client_name == 'user_and_job_state':
        c = UserAndJobState(URLS.user_and_job_state)
    elif client_name == 'catalog':
        c = Catalog(URLS.catalog)
    elif client_name == 'service':
        c = ServiceClient(URLS.service_wizard, use_url_lookup=True)

    else:
        raise ValueError('Unknown client name "%s"' % client_name)

    __clients[client_name] = c
    return c
