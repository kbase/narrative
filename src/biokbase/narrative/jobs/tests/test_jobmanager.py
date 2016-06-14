"""
Tests for job management
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

import unittest
import mock
from biokbase.narrative.jobs import JobManager

jm = JobManager()
jm.initialize_jobs([])