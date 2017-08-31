"""
Tests for job management
"""
import unittest
import mock
import biokbase.narrative.jobs.jobmanager
from biokbase.narrative.jobs.job import Job
from util import TestConfig
import os
from IPython.display import HTML
from narrative_mock.mockclients import get_mock_client
from narrative_mock.mockcomm import MockComm

__author__ = "Bill Riehl <wjriehl@lbl.gov>"

config = TestConfig()
job_info = config.load_json_file(config.get('jobs', 'job_info_file'))
# job_info = read_json_file(config.get('jobs', 'job_info_file'))


# def get_mock_client(client_name):
#     return MockClients()


@mock.patch('biokbase.narrative.jobs.job.clients.get', get_mock_client)
def phony_job():
    return Job.from_state('phony_job',
                          {'params': [], 'service_ver': '0.0.0'},
                          'kbasetest',
                          'NarrativeTest/test_editor',
                          tag='dev')


def create_jm_message(r_type, job_id=None, data={}):
    data['request_type'] = r_type
    data['job_id'] = job_id
    return {
        "content": {
            "data": data
        }
    }


class JobManagerTest(unittest.TestCase):
    @classmethod
    @mock.patch('biokbase.narrative.jobs.jobmanager.Comm', MockComm)
    @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    def setUpClass(self):
        self.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        self.jm._comm = MockComm()
        self.job_ids = job_info.get('job_param_info', {}).keys()
        os.environ['KB_WORKSPACE_ID'] = config.get('jobs', 'job_test_wsname')

        self.jm.initialize_jobs(start_lookup_thread=False)

    def validate_status_message(self, msg):
        core_keys = set(['widget_info', 'owner', 'state', 'spec'])
        state_keys = set(['canceled', 'cell_id', 'creation_time', 'exec_start_time',
                          'finished', 'job_id', 'job_state', 'run_id', 'status'])
        if not core_keys.issubset(set(msg.keys())):
            print("Missing core key(s) - [{}]".format(', '.join(core_keys.difference(set(msg.keys())))))
            return False
        if not state_keys.issubset(set(msg['state'].keys())):
            print("Missing status key(s) - [{}]".format(', '.join(state_keys.difference(set(msg['state'].keys())))))
            return False
        return True

    def test_send_comm_msg(self):
        self.jm._send_comm_message('foo', 'bar')
        msg = self.jm._comm.last_message
        self.assertDictEqual(msg, {'content': None, 'data': {'content': 'bar', 'msg_type': 'foo'}})
        self.jm._comm.clear_message_cache()

    def test_get_job_good(self):
        job_id = self.job_ids[0]
        job = self.jm.get_job(job_id)
        self.assertEqual(job_id, job.job_id)

    def test_get_job_bad(self):
        with self.assertRaises(ValueError):
            self.jm.get_job('not_a_job_id')

    def test_get_jobs_list(self):
        running_jobs = self.jm.get_jobs_list()
        self.assertIsInstance(running_jobs, list)

    def test_list_jobs_html(self):
        jobs_html = self.jm.list_jobs()
        self.assertIsInstance(jobs_html, HTML)

    @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    def test_cancel_job_good(self):
        new_job = phony_job()
        job_id = new_job.job_id
        self.jm.register_new_job(new_job)
        self.jm.cancel_job(job_id)
        self.jm.delete_job(job_id)

    def test_cancel_job_bad(self):
        with self.assertRaises(ValueError):
            self.jm.cancel_job(None)

    @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    def test_job_status_control(self):
        self.jm._handle_comm_message(create_jm_message("start_update_loop"))
        self.jm._handle_comm_message(create_jm_message("stop_update_loop"))

    @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    def test_job_status_fetching(self):
        self.jm._handle_comm_message(create_jm_message("all_status"))
        msg = self.jm._comm.last_message
        job_data = msg.get('data', {}).get('content', {})
        job_ids = job_data.keys()
        # assert that each job info that's flagged for lookup gets returned
        jobs_to_lookup = [j for j in self.jm._running_jobs.keys()]
        self.assertItemsEqual(job_ids, jobs_to_lookup)
        for job_id in job_ids:
            self.assertTrue(self.validate_status_message(job_data[job_id]))
        self.jm._comm.clear_message_cache()

    @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    def test_single_job_status_fetch(self):
        new_job = phony_job()
        self.jm.register_new_job(new_job)
        self.jm._handle_comm_message(create_jm_message("job_status", new_job.job_id))
        msg = self.jm._comm.last_message
        self.assertEquals(msg['data']['msg_type'], "job_status")
        self.assertTrue(self.validate_status_message(msg['data']['content']))
        self.jm.delete_job(new_job.job_id)
        self.jm._comm.clear_message_cache()

    # Should "fail" based on sent message.
    def test_job_message_bad_id(self):
        self.jm._handle_comm_message(create_jm_message("foo", job_id="not_a_real_job"))
        msg = self.jm._comm.last_message
        self.assertEquals(msg['data']['msg_type'], 'job_does_not_exist')

    def test_cancel_job_lookup(self):
        pass

    @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    def test_stop_single_job_lookup(self):
        # Set up and make sure the job gets returned correctly.
        new_job = phony_job()
        phony_id = new_job.job_id
        self.jm.register_new_job(new_job)
        self.jm._handle_comm_message(create_jm_message("start_job_update", job_id=phony_id))
        self.jm._handle_comm_message(create_jm_message("stop_update_loop"))

        self.jm._lookup_all_job_status()
        msg = self.jm._comm.last_message
        self.assertTrue(phony_id in msg['data']['content'])
        self.assertEquals(msg['data']['content'][phony_id].get('listener_count', 0), 1)
        self.jm._comm.clear_message_cache()
        self.jm._handle_comm_message(create_jm_message("stop_job_update", job_id=phony_id))
        self.jm._lookup_all_job_status()
        msg = self.jm._comm.last_message
        self.assertTrue(self.jm._running_jobs[phony_id]['refresh'] == 0)
        self.assertIsNone(msg)


if __name__ == "__main__":
    unittest.main()
