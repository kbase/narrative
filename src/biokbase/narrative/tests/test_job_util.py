from biokbase.narrative.jobs.util import sanitize_all_states, sanitize_state
import unittest
from copy import deepcopy


cancelled_state = {
    "awe_job_state": "cancelled",
    "cell_id": "9e338b5d-e3b0-4e94-8aa0-e97c402416ab",
    "creation_time": 1557268961909,
    "finished": 0,
    "job_id": "1",
    "job_state": "cancelled",
    "run_id": "0d0203f2-58c5-4eb6-9ecb-8e44ba8a2308",
    "status": [
        "2019-05-07T22:42:41+0000",
        "cancelled",
        "canceled by user",
        None,
        None,
        0,
        0,
    ],
    "sub_jobs": [],
    "token_id": "5a8fcf6d-5e06-4a98-b56e-62bc2c095e69",
    "ujs_url": "https://ci.kbase.us/services/userandjobstate/",
}

queued_state = {
    "awe_job_state": "queued",
    "cell_id": "9e338b5d-e3b0-4e94-8aa0-e97c402416ab",
    "creation_time": 1557268961909,
    "finished": 0,
    "job_id": "2",
    "job_state": "queued",
    "run_id": "0d0203f2-58c5-4eb6-9ecb-8e44ba8a2308",
    "status": ["2019-05-07T22:42:41+0000", "queued", "started", None, None, 0, 0],
    "sub_jobs": [],
    "token_id": "5a8fcf6d-5e06-4a98-b56e-62bc2c095e69",
    "ujs_url": "https://ci.kbase.us/services/userandjobstate/",
}


class JobUtilTestCase(unittest.TestCase):
    def test_sanitize_state(self):
        sani_state = sanitize_state(deepcopy(cancelled_state))
        self.assertEqual(sani_state["job_state"], "canceled")
        self.assertEqual(sani_state["status"][1], "canceled")

        sani_state = sanitize_state(deepcopy(queued_state))
        self.assertEqual(sani_state["job_state"], "queued")
        self.assertEqual(sani_state["status"][1], "queued")

    def test_sanitize_state_no_status(self):
        state = {"job_state": "cancelled", "status": None}
        sani_state = sanitize_state(state)
        self.assertEqual(sani_state["job_state"], "canceled")
        self.assertIsNone(sani_state["status"])

    def test_sanitize_all_states(self):
        all_states = {
            "job_states": {"1": deepcopy(cancelled_state), "2": deepcopy(queued_state)}
        }
        sani_states = sanitize_all_states(all_states)
        self.assertEqual(sani_states["job_states"]["1"]["job_state"], "canceled")
        self.assertEqual(sani_states["job_states"]["1"]["status"][1], "canceled")
        self.assertEqual(sani_states["job_states"]["2"]["job_state"], "queued")
        self.assertEqual(sani_states["job_states"]["2"]["status"][1], "queued")

    def test_sanitize_all_states_none(self):
        all_states = {"job_states": {}}
        self.assertEqual(all_states, sanitize_all_states(all_states))


if __name__ == "__main__":
    unittest.main()
