import unittest
from unittest import mock
import os

import biokbase.narrative.jobs.jobcomm
import biokbase.narrative.jobs.jobmanager
from biokbase.narrative.jobs.jobcomm import JobRequest
from .util import TestConfig
from .narrative_mock.mockcomm import MockComm
from .narrative_mock.mockclients import get_mock_client


config = TestConfig()
job_info = config.load_json_file(config.get('jobs', 'ee2_job_info_file'))


class JobCommTestCase(unittest.TestCase):
    @classmethod
    @mock.patch('biokbase.narrative.jobs.jobcomm.Comm', MockComm)
    @mock.patch('biokbase.narrative.jobs.jobcomm.jobmanager.clients.get', get_mock_client)
    def setUpClass(cls):
        cls.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        cls.job_ids = list(job_info.keys())
        os.environ['KB_WORKSPACE_ID'] = config.get('jobs', 'job_test_wsname')
        cls.jm.initialize_jobs(start_lookup_thread=False)

        cls.jc = biokbase.narrative.jobs.jobcomm.JobComm()
        cls.jc._comm = MockComm()

    def setUp(self):
        self.jc._comm.clear_message_cache()

    def test_send_comm_msg_ok(self):
        self.jc.send_comm_message("some_msg", {"foo": "bar"})
        msg = self.jc._comm.last_message
        self.assertDictEqual(msg, {"content": None, "data": {"content": {"foo": "bar"}, "msg_type": "some_msg"}})
        self.jc._comm.clear_message_cache()

    def test_start_stop_job_status_loop(self):
        self.assertFalse(self.jc._running_lookup_loop)
        self.assertIsNone(self.jc._lookup_timer)

        self.jc.start_job_status_loop()
        msg = self.jc._comm.last_message
        self.assertIsNotNone(msg)
        self.assertTrue(self.jc._running_lookup_loop)
        self.assertIsNotNone(self.jc._lookup_timer)

        self.jc.stop_job_status_loop()
        self.assertFalse(self.jc._running_lookup_loop)
        self.assertIsNone(self.jc._lookup_timer)

    @mock.patch('biokbase.narrative.jobs.jobcomm.jobmanager.clients.get', get_mock_client)
    def test_lookup_all_job_states_ok(self):
        req = JobRequest({
            "content": {
                "data": {
                    "request_type": "all_status"
                }
            }
        })
        states = self.jc.lookup_all_job_states(req)

        self.assertIsNone(self.jc._comm.last_message)
        states = self.jc.lookup_all_job_states(req, send_message=True)
        msg = self.jc._comm.last_message
        self.assertEqual(states, msg["data"]["content"])
        self.assertEqual("job_status_all", msg["data"]["msg_type"])

    def test_handle_comm_message_bad(self):
        with self.assertRaises(ValueError) as e:
            self.jc._handle_comm_message({"foo": "bar"})
        self.assertIn("Improperly formatted job channel message!", str(e.exception))
        with self.assertRaises(ValueError) as e:
            self.jc._handle_comm_message({"content": {"data": {"request_type": None}}})
        self.assertIn("Missing request type in job channel message!", str(e.exception))

    def test_handle_comm_message_unknown(self):
        unknown = "NotAJobRequest"
        with self.assertRaises(ValueError) as e:
            self.jc._handle_comm_message({"content": {"data": {"request_type": unknown}}})
        self.assertIn(f"Unknown KBaseJobs message '{unknown}'", str(e.exception))

    def test_handle_all_states_msg(self):
        req = {
            "content": {
                "data": {
                    "request_type": "all_status"
                }
            }
        }
        self.jc._handle_comm_message(req)
        msg = self.jc._comm.last_message
        self.assertEqual(msg["data"]["msg_type"], "job_status_all")



class JobRequestTestCase(unittest.TestCase):
    def test_request_ok(self):
        rq_msg = {
            "msg_id": "some_id",
            "content": {
                "data": {
                    "request_type": "a_request"
                }
            }
        }
        rq = JobRequest(rq_msg)
        self.assertEqual(rq.msg_id, "some_id")
        self.assertEqual(rq.request, "a_request")
        self.assertIsNone(rq.job_id)

    def test_request_no_data(self):
        rq_msg = {
            "msg_id": "some_id",
            "content": {}
        }
        with self.assertRaises(ValueError) as e:
            JobRequest(rq_msg)
        self.assertIn("Improperly formatted job channel message!", str(e.exception))

    def test_request_no_req(self):
        rq_msg = {
            "msg_id": "some_id",
            "content": {
                "data": {
                    "request_type": None
                }
            }
        }
        rq_msg2 = {
            "msg_id": "some_other_id",
            "content": {
                "data": {}
            }
        }
        for msg in [rq_msg, rq_msg2]:
            with self.assertRaises(ValueError) as e:
                JobRequest(rq_msg)
            self.assertIn("Missing request type in job channel message!", str(e.exception))

