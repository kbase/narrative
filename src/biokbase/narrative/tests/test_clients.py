"""Tests of the clients module."""

import pytest
from biokbase.installed_clients.CatalogClient import Catalog
from biokbase.installed_clients.execution_engine2Client import execution_engine2
from biokbase.installed_clients.NarrativeMethodStoreClient import NarrativeMethodStore
from biokbase.installed_clients.ServiceClient import Client as ServiceClient
from biokbase.installed_clients.WorkspaceClient import Workspace
from biokbase.narrative import clients

name_to_type_tests = [
    ("workspace", Workspace),
    ("execution_engine2", execution_engine2),
    ("narrative_method_store", NarrativeMethodStore),
    ("service", ServiceClient),
    ("catalog", Catalog),
]


@pytest.mark.parametrize(("client_name", "client_type"), name_to_type_tests)
def test_valid_clients(client_name, client_type):
    client = clients.get(client_name)
    assert isinstance(client, client_type)


@pytest.mark.parametrize("client_name", ["service_wizard", "ee2", "ws"])
def test_invalid_clients(client_name):
    with pytest.raises(ValueError, match="Unknown client name"):
        clients.get(client_name)
