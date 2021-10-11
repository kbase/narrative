import unittest
from biokbase.narrative.common.util import make_ranges

class UtilTestCase(unittest.TestCase):
    def test_make_batches_normal_cases(self):
        # Args: total_size, range_size
        cases = [
            {"args": [0, 1], "expected": []},
            {"args": [1, 1], "expected": [[0, 1]]},
            {"args": [10, 10], "expected": [[0, 10]]},
            {"args": [10, 5], "expected": [[0, 5], [5, 10]]},
            {"args": [10, 3], "expected": [[0, 3], [3, 6], [6, 9], [9, 10]]},
        ]
        for case in cases:
            self.assertEqual(make_ranges(*case["args"]), case["expected"])

    def test_make_batches_arg_error_cases(self):
        # Args: total_size, range_size
        cases = [
            {"args": [1, 0]},
            {"args": [0, 0]},
            {"args": [1, -1]},
            {"args": [-1, 1]},
            {"args": [-1, -1]},
        ]
        for case in cases:
            with self.assertRaises(ValueError):
                make_ranges(*case["args"])


if __name__ == "__main__":
    unittest.main()
