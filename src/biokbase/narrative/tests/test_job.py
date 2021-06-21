import unittest
import mock
from biokbase.narrative.jobs.job import Job
from .util import ConfigTests
from .narrative_mock.mockclients import get_mock_client
from contextlib import contextmanager
from io import StringIO
import sys


@contextmanager
def capture_stdout():
    new_out, new_err = StringIO(), StringIO()
    old_out, old_err = sys.stdout, sys.stderr
    try:
        sys.stdout, sys.stderr = new_out, new_err
        yield sys.stdout, sys.stderr
    finally:
        sys.stdout, sys.stderr = old_out, old_err


config = ConfigTests()
test_jobs = config.load_json_file(config.get("jobs", "ee2_job_info_file"))


class JobTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        info = next(iter(test_jobs.values()))

        cls.job_id = info["job_id"]
        param_info = info["job_input"]

        cls.app_id = param_info["app_id"]
        cls.app_version = param_info.get("service_ver", "0.0.1")
        cls.cell_id = param_info.get("narrative_cell_info", {}).get("cell_id")
        cls.inputs = None
        cls.meta = dict()
        cls.owner = info["user"]
        cls.parent_job_id = "parent_job"
        cls.run_id = param_info.get("narrative_cell_info", {}).get("run_id")
        cls.tag = param_info.get("narrative_cell_info", {}).get("tag", "dev")
        cls.token_id = "temp_token"

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def _mocked_job(self, job_attrs=[]):
        job_kwargs = {}

        for arg in [
            "app_version",
            "cell_id",
            "parent_job_id",
            "run_id",
            "tag",
            "token_id",
        ]:
            if not len(job_attrs) or "no_" + arg not in job_attrs:
                job_kwargs[arg] = getattr(self, arg)

        job = Job(self.job_id, self.app_id, self.inputs, self.owner, **job_kwargs)

        return job

    def test_job_init(self):
        job = self._mocked_job()

        for attr in [
            "job_id",
            "app_id",
            "inputs",
            "owner",
            "app_version",
            "cell_id",
            "meta",
            "parent_job_id",
            "run_id",
            "tag",
            "token_id",
        ]:
            self.assertEqual(getattr(job, attr), getattr(self, attr))

    def test_job_init_defaults(self):
        job = self._mocked_job(
            [
                "no_app_version",
                "no_cell_id",
                "no_parent_job_id",
                "no_run_id",
                "no_tag",
                "no_token_id",
            ]
        )

        for attr in ["job_id", "app_id", "inputs", "owner", "meta"]:
            self.assertEqual(getattr(job, attr), getattr(self, attr))

        for attr in ["app_version", "cell_id", "parent_job_id", "run_id", "token_id"]:
            self.assertEqual(getattr(job, attr), None)

        self.assertEqual(job.tag, "release")

    def test_job_from_state(self):
        job_info = {"params": self.inputs, "service_ver": self.app_version}
        job = Job.from_state(
            self.job_id,
            job_info,
            self.owner,
            self.app_id,
            tag=self.tag,
            cell_id=self.cell_id,
            run_id=self.run_id,
            token_id=self.token_id,
            parent_job_id=self.parent_job_id,
        )

        for attr in [
            "job_id",
            "app_id",
            "inputs",
            "owner",
            "app_version",
            "cell_id",
            "meta",
            "parent_job_id",
            "run_id",
            "token_id",
            "tag",
        ]:
            self.assertEqual(getattr(job, attr), getattr(self, attr))

    def test_job_from_state_defaults(self):
        job_info = {"params": self.inputs, "service_ver": self.app_version}
        job = Job.from_state(
            "another_job",
            job_info,
            self.owner,
            self.app_id,
        )
        for attr in ["app_id", "inputs", "owner", "app_version", "meta"]:
            self.assertEqual(getattr(job, attr), getattr(self, attr))

        for attr in ["cell_id", "parent_job_id", "run_id", "token_id"]:
            self.assertEqual(getattr(job, attr), None)

        self.assertEqual(job.job_id, "another_job")
        self.assertEqual(job.tag, "release")

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_job_info(self):
        job = self._mocked_job()
        info_str = "App name (id): Test Editor (NarrativeTest/test_editor)\nVersion: 0.0.1\nStatus: completed\nInputs:\n------\n"
        with capture_stdout() as (out, err):
            job.info()
            self.assertIn(info_str, out.getvalue().strip())

    def test_repr(self):
        job = self._mocked_job()
        job_str = job.__repr__()
        self.assertIn(job.job_id, job_str)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_repr_js(self):
        job = self._mocked_job()
        js_out = job._repr_javascript_()
        self.assertIsInstance(js_out, str)
        # spot check to make sure the core pieces are present. needs the
        # element.html part, job_id, and widget
        self.assertIn("element.html", js_out)
        self.assertIn(job.job_id, js_out)
        self.assertIn("kbaseNarrativeJobStatus", js_out)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_job_finished(self):
        job = self._mocked_job()
        self.assertTrue(job.is_finished())

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_state(self):
        job = self._mocked_job()
        state = job.state()

        self.assertEqual(state["job_id"], job.job_id)
        self.assertIn("status", state)
        self.assertIn("updated", state)
        for arg in ["cell_id", "parent_job_id", "run_id", "token_id"]:
            self.assertEqual(state[arg], getattr(self, arg))
        self.assertNotIn("job_input", state)

        # to do - add a test to only fetch from _last_state if it's populated and in a final state
        job.state()

        job.job_id = "not_a_job_id"
        job._last_state = None  # force it to look up.
        # with self.assertRaises(Exception) as e:
        #     job.state()
        # self.assertIn("Unable to fetch info for job", str(e.exception))

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_show_output_widget(self):
        job = self._mocked_job()
        job.show_output_widget()

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_log(self):
        # Things set up by the mock:
        # 1. There's 100 total log lines
        # 2. Each line has its line number embedded in it
        total_lines = 100
        job = self._mocked_job()
        logs = job.log()
        # we know there's 100 lines total, so roll with it that way.
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), total_lines)
        for i in range(len(logs[1])):
            line = logs[1][i]
            self.assertIn("is_error", line)
            self.assertIn("line", line)
            self.assertIn(str(i), line["line"])
        # grab the last half
        offset = 50
        logs = job.log(first_line=offset)
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), offset)
        for i in range(total_lines - offset):
            self.assertIn(str(i + offset), logs[1][i]["line"])
        # grab a bite from the middle
        num_fetch = 20
        logs = job.log(first_line=offset, num_lines=num_fetch)
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), num_fetch)
        for i in range(num_fetch):
            self.assertIn(str(i + offset), logs[1][i]["line"])
        # should normalize negative numbers properly
        logs = job.log(first_line=-5)
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), total_lines)
        logs = job.log(num_lines=-5)
        self.assertEqual(logs[0], total_lines)
        self.assertEqual(len(logs[1]), 0)

    @mock.patch("biokbase.narrative.jobs.job.clients.get", get_mock_client)
    def test_parameters(self):
        job = self._mocked_job()
        params = job.parameters()
        self.assertIsNotNone(params)

        job.inputs = None
        params2 = job.parameters()
        self.assertIsNotNone(params2)
        self.assertEqual(params, params2)

        job.job_id = "not_a_job_id"
        job.inputs = None
        with self.assertRaises(Exception) as e:
            job.parameters()
        self.assertIn("Unable to fetch parameters for job", str(e.exception))
