"""Module to get KBase service clients."""

from functools import cache

from biokbase.installed_clients.CatalogClient import Catalog
from biokbase.installed_clients.execution_engine2Client import execution_engine2
from biokbase.installed_clients.NarrativeMethodStoreClient import NarrativeMethodStore
from biokbase.installed_clients.ServiceClient import Client as ServiceClient
from biokbase.installed_clients.WorkspaceClient import Workspace
from biokbase.narrative.common.url_config import URLS


def get(
    client_name: str, token: str | None = None
) -> Workspace | execution_engine2 | NarrativeMethodStore | ServiceClient | Catalog:
    """Retrieve the client for a KBase service."""
    return __init_client(client_name, token=token)


def __init_client(
    client_name: str, token: str | None = None
) -> Workspace | execution_engine2 | NarrativeMethodStore | ServiceClient | Catalog:
    """Return a client for one of the KBase servives."""
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

    err_msg = (
        f'Unknown client name "{client_name}"\n'
        + "The following client names are recognised:\n"
        + 'Catalog: "catalog"\n'
        + 'Execution Engine 2: "execution_engine2"\n'
        + 'NMS: "narrative_method_store"\n'
        + 'Service Wizard: "service"\n'
        + 'Workspace: "workspace"'
    )

    raise ValueError(err_msg)
