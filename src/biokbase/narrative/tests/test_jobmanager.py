"""
Tests for job management
"""
import unittest
from unittest import mock
import biokbase.narrative.jobs.jobmanager
from biokbase.narrative.jobs.job import Job
from .util import ConfigTests
import os
from IPython.display import HTML
from .narrative_mock.mockclients import get_mock_client, get_failing_mock_client
from biokbase.narrative.exception_util import NarrativeException

__author__ = "Bill Riehl <wjriehl@lbl.gov>"

config = ConfigTests()
job_info = config.load_json_file(config.get("jobs", "ee2_job_info_file"))


@mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
def phony_job():
    return Job.from_state(
        "phony_job",
        {"params": [], "service_ver": "0.0.0"},
        "kbasetest",
        "NarrativeTest/test_editor",
        tag="dev",
    )


def create_jm_message(r_type, job_id=None, data={}):
    data["request_type"] = r_type
    data["job_id"] = job_id
    return {"content": {"data": data}}


class JobManagerTest(unittest.TestCase):
    @classmethod
    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def setUpClass(cls):
        cls.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        cls.job_ids = list(job_info.keys())
        os.environ["KB_WORKSPACE_ID"] = config.get("jobs", "job_test_wsname")

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def setUp(self):
        self.jm.initialize_jobs()

    def validate_status_message(self, msg):
        core_keys = set(["widget_info", "owner", "state", "spec"])
        state_keys = set(
            ["user", "authstrat", "wsid", "status", "updated", "job_input"]
        )
        if not core_keys.issubset(set(msg.keys())):
            print(
                "Missing core key(s) - [{}]".format(
                    ", ".join(core_keys.difference(set(msg.keys())))
                )
            )
            return False
        if not state_keys.issubset(set(msg["state"].keys())):
            print(
                "Missing status key(s) - [{}]".format(
                    ", ".join(state_keys.difference(set(msg["state"].keys())))
                )
            )
            return False
        return True

    def test_get_job_good(self):
        job_id = self.job_ids[0]
        job = self.jm.get_job(job_id)
        self.assertEqual(job_id, job.job_id)

    def test_get_job_bad(self):
        with self.assertRaises(ValueError):
            self.jm.get_job("not_a_job_id")

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_list_jobs_html(self):
        jobs_html = self.jm.list_jobs()
        self.assertIsInstance(jobs_html, HTML)
        html = jobs_html.data
        print(html)
        self.assertIn("<td>5d64935ab215ad4128de94d6</td>", html)
        self.assertIn("<td>NarrativeTest/test_editor</td>", html)
        self.assertIn("<td>2019-08-26 ", html)
        self.assertIn(":54:48</td>", html)
        self.assertIn("<td>fake_test_user</td>", html)
        self.assertIn("<td>completed</td>", html)
        self.assertIn("<td>Not started</td>", html)
        self.assertIn("<td>Incomplete</td>", html)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_cancel_job_good(self):
        new_job = phony_job()
        job_id = new_job.job_id
        self.jm.register_new_job(new_job)
        self.jm.cancel_job(job_id)

    def test_cancel_job_bad(self):
        with self.assertRaises(ValueError):
            self.jm.cancel_job(None)

    @mock.patch("biokbase.narrative.jobs.jobmanager.clients.get", get_mock_client)
    def test_lookup_all_job_states(self):
        states = self.jm.lookup_all_job_states()
        self.assertEqual(len(states), 2)

        states = self.jm.lookup_all_job_states(ignore_refresh_flag=True)
        self.assertEqual(len(states), 3)

    # @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    # def test_job_status_fetching(self):
    #     self.jm._handle_comm_message(create_jm_message("all_status"))
    #     msg = self.jm._comm.last_message
    #     job_data = msg.get('data', {}).get('content', {})
    #     job_ids = list(job_data.keys())
    #     # assert that each job info that's flagged for lookup gets returned
    #     jobs_to_lookup = [j for j in self.jm._running_jobs.keys()]
    #     self.assertCountEqual(job_ids, jobs_to_lookup)
    #     for job_id in job_ids:
    #         self.assertTrue(self.validate_status_message(job_data[job_id]))
    #     self.jm._comm.clear_message_cache()

    # @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    # def test_single_job_status_fetch(self):
    #     new_job = phony_job()
    #     self.jm.register_new_job(new_job)
    #     self.jm._handle_comm_message(create_jm_message("job_status", new_job.job_id))
    #     msg = self.jm._comm.last_message
    #     self.assertEqual(msg['data']['msg_type'], "job_status")
    #     # self.assertTrue(self.validate_status_message(msg['data']['content']))
    #     self.jm._comm.clear_message_cache()

    # Should "fail" based on sent message.
    # def test_job_message_bad_id(self):
    #     self.jm._handle_comm_message(create_jm_message("foo", job_id="not_a_real_job"))
    #     msg = self.jm._comm.last_message
    #     self.assertEqual(msg['data']['msg_type'], 'job_does_not_exist')

    def test_cancel_job_lookup(self):
        pass

    # @mock.patch('biokbase.narrative.jobs.jobmanager.clients.get', get_mock_client)
    # def test_stop_single_job_lookup(self):
    #     # Set up and make sure the job gets returned correctly.
    #     new_job = phony_job()
    #     phony_id = new_job.job_id
    #     self.jm.register_new_job(new_job)
    #     self.jm._handle_comm_message(create_jm_message("start_job_update", job_id=phony_id))
    #     self.jm._handle_comm_message(create_jm_message("stop_update_loop"))

    #     self.jm._lookup_all_job_status()
    #     msg = self.jm._comm.last_message
    #     self.assertTrue(phony_id in msg['data']['content'])
    #     self.assertEqual(msg['data']['content'][phony_id].get('listener_count', 0), 1)
    #     self.jm._comm.clear_message_cache()
    #     self.jm._handle_comm_message(create_jm_message("stop_job_update", job_id=phony_id))
    #     self.jm._lookup_all_job_status()
    #     msg = self.jm._comm.last_message
    #     self.assertTrue(self.jm._running_jobs[phony_id]['refresh'] == 0)
    #     self.assertIsNone(msg)

    @mock.patch(
        "biokbase.narrative.jobs.jobmanager.clients.get", get_failing_mock_client
    )
    def test_initialize_jobs_ee2_fail(self):
        # init jobs should fail. specifically, ee2.check_workspace_jobs should error.
        with self.assertRaises(NarrativeException) as e:
            self.jm.initialize_jobs()
        self.assertIn("Job lookup failed", str(e.exception))


if __name__ == "__main__":
    unittest.main()
