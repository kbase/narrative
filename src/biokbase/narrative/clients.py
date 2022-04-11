from biokbase.workspace.client import Workspace
from biokbase.narrative_method_store.client import NarrativeMethodStore
from biokbase.catalog.Client import Catalog
from biokbase.service.Client import Client as ServiceClient
from biokbase.execution_engine2.execution_engine2Client import execution_engine2
from biokbase.narrative.common.url_config import URLS


def get(client_name, token=None):
    return __init_client(client_name, token=token)


def reset():
    # this is never used
    pass


def __init_client(client_name, token=None):
    if client_name == "workspace":
        c = Workspace(URLS.workspace, token=token)
    elif client_name == "execution_engine2":
        c = execution_engine2(URLS.execution_engine2, token=token)
    elif client_name == "narrative_method_store":
        c = NarrativeMethodStore(URLS.narrative_method_store, token=token)
    elif client_name == "service":
        c = ServiceClient(URLS.service_wizard, use_url_lookup=True, token=token)
    elif client_name == "catalog":
        c = Catalog(URLS.catalog, token=token)
    else:
        raise ValueError(
            'Unknown client name "%s"\n' % client_name
            + "The following client names are recognised:\n"
            + 'Catalog: "catalog"\n'
            + 'Execution Engine 2: "execution_engine2"\n'
            + 'NMS: "narrative_method_store"\n'
            + 'Service Wizard: "service"\n'
            + 'Workspace: "workspace"'
        )

    return c
