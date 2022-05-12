import copy
import re
import unittest

from biokbase.narrative.jobs.util import load_job_constants, merge, merge_inplace


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


class MergeTest(unittest.TestCase):
    def _check(self, d0: dict, d1: dict, exp_merge: dict):
        d0_copy = copy.deepcopy(d0)
        d1_copy = copy.deepcopy(d1)
        merge_inplace(d0, d1)
        self.assertEqual(
            d0,
            exp_merge
        )
        self.assertEqual(
            d1,
            d1_copy
        )
        d0 = copy.deepcopy(d0_copy)
        dmerge = merge(d0, d1)
        self.assertEqual(
            dmerge,
            exp_merge
        )
        self.assertEqual(d0, d0_copy)
        self.assertEqual(d1, d1_copy)

    def test_merge_inplace__empty(self):
        d0 = {}
        d1 = {}
        self._check(
            d0,
            d1,
            {}
        )

    def test_merge_inplace__d0_empty(self):
        # flat
        d0 = {}
        d1 = {"level00": "l00"}
        self._check(
            d0,
            d1,
            {"level00": "l00"}
        )

        # nested
        d0 = {}
        d1 = {
            "level00": "l00",
            "level01": {
                "level10": "l10"
            }
        }
        self._check(
            d0,
            d1,
            {
                "level00": "l00",
                "level01": {
                    "level10": "l10"
                }
            }
        )

    def test_merge_inplace__d1_empty(self):
        # flat
        d0 = {"level00": "l00"}
        d1 = {}
        self._check(
            d0,
            d1,
            {"level00": "l00"}
        )

        # nested
        d0 = {
            "level00": "l00",
            "level01": {
                "level10": "l10"
            }
        }
        d1 = {}
        self._check(
            d0,
            d1,
            {
                "level00": "l00",
                "level01": {
                    "level10": "l10"
                }
            }
        )

    def test_merge_inplace__flat(self):
        d0 = {
            "level00": "l00",
            "level01": "l01"
        }
        d1 = {
            "level01": "l01_",
            "level02": "l02"
        }
        self._check(
            d0,
            d1,
            {
                "level00": "l00",
                "level01": "l01_",
                "level02": "l02"
            }
        )

    def test_merge_inplace__nested(self):
        d0 = {
            "level00": {
                "level10": {
                    "level20": "l20",
                    "level21": "l21",
                    "level23": {
                        "level30": "l30"
                    }
                }
            },
            "level01": "l01"
        }
        d1 = {
            "level00": {
                "level10": {
                    "level21": "l21_",
                    "level22": "l22",
                    "level24": {
                        "level30": "l30"
                    }
                }
            },
            "level01": "l01_"
        }
        self._check(
            d0,
            d1,
            {
                "level00": {
                    "level10": {
                        "level20": "l20",
                        "level21": "l21_",
                        "level22": "l22",
                        "level23": {
                            "level30": "l30"
                        },
                        "level24": {
                            "level30": "l30"
                        }
                    }
                },
                "level01": "l01_"
            }
        )

    def test_merge_inplace__xor_dicts(self):
        d0 = {
            "level00": {}
        }
        d1 = {
            "level00": "l00",
            "level01": "l01"
        }
        with self.assertRaisesRegex(
            ValueError,
            re.escape("For key level00: is_dict(v0) xor is_dict(v1)")
        ):
            merge_inplace(d0, d1)

    def test_random(self):
        d0 = {
            "level00": "l00",
            "level01": {
                "level10": {
                    "level20": "l20"
                }
            },
            "level02": "l02"
        }
        d1 = {
            "level01": {
                "level10": {
                    "level20": "l20_"
                }
            }
        }
        self._check(
            d0,
            d1,
            {
                "level00": "l00",
                "level01": {
                    "level10": {
                        "level20": "l20_"
                    }
                },
                "level02": "l02"
            }
        )


if __name__ == "__main__":
    unittest.main()
