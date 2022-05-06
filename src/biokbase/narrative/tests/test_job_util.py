import unittest

from biokbase.narrative.jobs.util import load_job_constants


class JobUtilTestCase(unittest.TestCase):
    def test_load_job_constants__no_file(self):
        file_path = [
            "src",
            "biokbase",
            "narrative",
            "tests",
            "data",
            "job_constants",
            "does_not_exist.json",
        ]
        with self.assertRaises(FileNotFoundError):
            load_job_constants(file_path)

    def test_load_job_constants__missing_section(self):
        file_path = [
            "src",
            "biokbase",
            "narrative",
            "tests",
            "data",
            "job_constants",
            "job_config-missing-datatype.json",
        ]
        with self.assertRaisesRegex(
            ValueError, "job_config.json is missing the 'message_types' config section"
        ):
            load_job_constants(file_path)

    def test_load_job_constants__missing_value(self):
        file_path = [
            "src",
            "biokbase",
            "narrative",
            "tests",
            "data",
            "job_constants",
            "job_config-missing-item.json",
        ]
        with self.assertRaisesRegex(
            ValueError,
            "job_config.json is missing the following values for params: BATCH_ID, FIRST_LINE, JOB_ID, LATEST, NUM_LINES, TS",
        ):
            load_job_constants(file_path)

    def test_load_job_constants__valid(self):
        # the live file!
        (params, message_types) = load_job_constants()
        for item in ["BATCH_ID", "JOB_ID"]:
            self.assertIn(item, params)
        for item in ["STATUS", "RETRY", "INFO", "ERROR"]:
            self.assertIn(item, message_types)


if __name__ == "__main__":
    unittest.main()
