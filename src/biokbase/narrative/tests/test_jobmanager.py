import unittest
import mock
import biokbase.narrative.jobs.jobmanager

"""
Tests for job management
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"


class MockComm(object):
    """
    Mock class for ipython.kernel.Comm
    """
    def __init__(self, *args, **kwargs):
        """Mock the init"""
        pass

    def on_msg(self, *args, **kwargs):
        """Mock the msg router"""
        pass

    def send(self, msg_type, content):
        """Mock sending a msg"""
        pass


class JobManagerTest(unittest.TestCase):
    @classmethod
    @mock.patch('biokbase.narrative.jobs.jobmanager.Comm', MockComm)
    def setUpClass(self):
        self.jm = biokbase.narrative.jobs.jobmanager.JobManager()
        self.jm._comm = MockComm()

    def test_init(self):
        pass

if __name__ == "__main__":
    unittest.main()
