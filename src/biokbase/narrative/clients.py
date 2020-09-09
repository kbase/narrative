from biokbase.workspace.client import Workspace
from biokbase.narrative_method_store.client import NarrativeMethodStore
from biokbase.userandjobstate.client import UserAndJobState
from biokbase.catalog.Client import Catalog
from biokbase.service.Client import Client as ServiceClient
from biokbase.execution_engine2.execution_engine2Client import execution_engine2

from biokbase.narrative.common.url_config import URLS


def get(client_name, token=None):
    return __init_client(client_name, token=token)


def reset():
    __clients = dict()


def __init_client(client_name, token=None):
    if client_name == "workspace":
        c = Workspace(URLS.workspace, token=token)
    elif client_name == "narrative_method_store":
        c = NarrativeMethodStore(URLS.narrative_method_store, token=token)
    elif client_name == "user_and_job_state":
        c = UserAndJobState(URLS.user_and_job_state, token=token)
    elif client_name == "catalog":
        c = Catalog(URLS.catalog, token=token)
    elif client_name == "service" or client_name == "service_wizard":
        c = ServiceClient(URLS.service_wizard, use_url_lookup=True, token=token)
    elif (
        client_name == "execution_engine2"
        or client_name == "execution_engine"
        or client_name == "job_service"
    ):
        c = execution_engine2(URLS.execution_engine2, token=token)
    elif client_name == "job_service_mock":
        c = JobServiceMock()
    else:
        raise ValueError('Unknown client name "%s"' % client_name)

    return c


class JobServiceMock:
    def __init__(self):
        self.client = get("service")

    def check_job(self, job_id):
        return self.client.sync_call("narrative_job_mock.check_job", [job_id])[0]

    def check_jobs(self, params):
        return self.client.sync_call("narrative_job_mock.check_jobs", [params])[0]
