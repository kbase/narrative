import unittest

import biokbase.narrative.clients as clients
from biokbase.catalog.Client import Catalog as Catalog_Client
from biokbase.execution_engine2.execution_engine2Client import (
    execution_engine2 as EE2_Client,
)
from biokbase.narrative_method_store.client import NarrativeMethodStore as NMS_Client
from biokbase.service.Client import Client as Service_Client
from biokbase.workspace.client import Workspace as WS_Client


class ClientsTestCase(unittest.TestCase):
    def test_valid_clients(self):
        name_to_type = {
            "workspace": WS_Client,
            "execution_engine2": EE2_Client,
            "narrative_method_store": NMS_Client,
            "service": Service_Client,
            "catalog": Catalog_Client,
        }

        for client_name, client_type in name_to_type.items():
            client = clients.get(client_name)
            self.assertIsInstance(client, client_type)

    def test_invalid_clients(self):
        invalid_names = ["service_wizard", "ee2", "ws"]

        for name in invalid_names:
            with self.assertRaisesRegex(ValueError, "Unknown client name"):
                clients.get(name)
