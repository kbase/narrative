"""
Standalone utility methods for Python tests
"""
import unittest
from biokbase.narrative.common.util import make_ranges

__author__ = "Bill Riehl <wjriehl@lbl.gov>"


class UtilTestCase(unittest.TestCase):
    # Before test:
    # - Log in (for tests that need a valid login)
    # also sets the token in the environment variable.
    test_token = None
    private_token = None

    # Test make_batches

    def test_make_batches_normal_cases(self):
        # Args: total_size, range_size
        cases = [
            {"input": [0, 1], "expected": []},
            {"input": [1, 1], "expected": [[0, 1]]},
            {"input": [10, 10], "expected": [[0, 10]]},
            {"input": [10, 5], "expected": [[0, 5], [5, 10]]},
            {"input": [10, 3], "expected": [[0, 3], [3, 6], [6, 9], [9, 10]]},
        ]
        for case in cases:
            self.assertEqual(make_ranges(*case["input"]), case["expected"])

    def test_make_batches_arg_error_cases(self):
        # Args: total_size, range_size
        cases = [
            {"input": [1, 0]},
            {"input": [0, 0]},
            {"input": [1, -1]},
            {"input": [-1, 1]},
            {"input": [-1, -1]},
        ]
        for case in cases:
            with self.assertRaises(ValueError):
                make_ranges(*case["input"])


if __name__ == "__main__":
    unittest.main()
