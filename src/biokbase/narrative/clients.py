from biokbase.catalog.Client import Catalog
from biokbase.execution_engine2.execution_engine2Client import execution_engine2
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative_method_store.client import NarrativeMethodStore
from biokbase.service.Client import Client as ServiceClient
from biokbase.workspace.client import Workspace


def get(client_name, token=None):
    """Retrieve the client for a KBase service."""
    return __init_client(client_name, token=token)


def __init_client(client_name, token=None):
    if client_name == "workspace":
        return Workspace(URLS.workspace, token=token)
    if client_name == "execution_engine2":
        return execution_engine2(URLS.execution_engine2, token=token)
    if client_name == "narrative_method_store":
        return NarrativeMethodStore(URLS.narrative_method_store, token=token)
    if client_name == "service":
        return ServiceClient(URLS.service_wizard, use_url_lookup=True, token=token)
    if client_name == "catalog":
        return Catalog(URLS.catalog, token=token)

    raise ValueError(
        'Unknown client name "%s"\n' % client_name
        + "The following client names are recognised:\n"
        + 'Catalog: "catalog"\n'
        + 'Execution Engine 2: "execution_engine2"\n'
        + 'NMS: "narrative_method_store"\n'
        + 'Service Wizard: "service"\n'
        + 'Workspace: "workspace"'
    )
