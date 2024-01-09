import pytest
from biokbase.catalog.Client import Catalog as Catalog_Client
from biokbase.execution_engine2.execution_engine2Client import (
    execution_engine2 as EE2_Client,
)
from biokbase.narrative import clients
from biokbase.narrative_method_store.client import NarrativeMethodStore as NMS_Client
from biokbase.service.Client import Client as Service_Client
from biokbase.workspace.client import Workspace as WS_Client

name_to_type_tests = [
    ("workspace", WS_Client),
    ("execution_engine2", EE2_Client),
    ("narrative_method_store", NMS_Client),
    ("service", Service_Client),
    ("catalog", Catalog_Client),
]


@pytest.mark.parametrize(("client_name", "client_type"), name_to_type_tests)
def test_valid_clients(client_name, client_type):
    client = clients.get(client_name)
    assert isinstance(client, client_type)


@pytest.mark.parametrize("client_name", ["service_wizard", "ee2", "ws"])
def test_invalid_clients(client_name):
    with pytest.raises(ValueError, match="Unknown client name"):
        clients.get(client_name)
