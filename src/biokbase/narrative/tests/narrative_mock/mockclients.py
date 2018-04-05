from ..util import TestConfig


class MockClients(object):
    """
    Mock KBase service clients as needed for Narrative backend tests.

    These are specially put together to handle common use cases, and in some cases, expected test
    inputs (e.g. special workspace names)

    Will likely be removed (or modified, at least), when a minified KBase deploy becomes available.
    Then we don't need to mock as much.
    """
    def __init__(self):
        self.config = TestConfig()
        self.job_info = self.config.load_json_file(self.config.get('jobs', 'job_info_file'))
        self.test_job_id = self.config.get('app_tests', 'test_job_id')

    # ----- User and Job State functions -----

    def list_jobs2(self, params):
        return self.job_info.get('job_info')

    def delete_job(self, job):
        return "bar"

    # ----- Narrative Method Store functions ------

    def list_methods_spec(self, params):
        return self.config.load_json_file(self.config.get('specs', 'app_specs_file'))

    def list_categories(self, params):
        return self.config.load_json_file(self.config.get('specs', 'type_specs_file'))

    # ----- Workspace functions -----

    def get_workspace_info(self, params):
        if params.get('workspace', '') != 'invalid_workspace':
            return [12345, 'foo', 'bar']
        else:
            raise Exception('not found')

    def get_object_info_new(self, params):
        infos = [[5, u'Sbicolor2', u'KBaseGenomes.Genome-12.3', u'2017-03-31T23:42:59+0000', 1,
                  u'wjriehl', 18836, u'wjriehl:1490995018528', u'278abf8f0dbf8ab5ce349598a8674a6e',
                  109180038, None]]
        ret_val = infos * len(params.get('objects', [0]))
        return ret_val

    def get_object_info3(self, params):
        infos = [[5, u'Sbicolor2', u'KBaseGenomes.Genome-12.3', u'2017-03-31T23:42:59+0000', 1,
                  u'wjriehl', 18836, u'wjriehl:1490995018528', u'278abf8f0dbf8ab5ce349598a8674a6e',
                  109180038, None]]
        paths = [['18836/5/1']]
        num_objects = len(params.get('objects', [0]))
        return {
            'infos': infos * num_objects,
            'paths': paths * num_objects
        }

    # ----- Narrative Job Service functions -----

    def run_job(self, params):
        return self.test_job_id

    def cancel_job(self, job_id):
        return "done"

    def get_job_params(self, job_id):
        return [self.job_info.get('job_param_info', {}).get(job_id, None)]

    def check_job(self, job_id):
        return self.job_info.get('job_status_info', {}).get(job_id, None)

    def check_jobs(self, params):
        states = dict()
        job_params = dict()
        for job_id in params['job_ids']:
            states[job_id] = self.job_info.get('job_status_info', {}).get(job_id, {})
        if params.get('with_job_params', 0) == 1:
            for job_id in params['job_ids']:
                job_params[job_id] = self.job_info.get('job_param_info', {}).get(job_id, None)
        ret = {
            'job_states': states
        }
        if len(job_params) > 0:
            ret['job_params'] = job_params
        return ret


def get_mock_client(client_name):
    return MockClients()
