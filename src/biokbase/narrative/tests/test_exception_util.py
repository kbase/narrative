import unittest
from biokbase.narrative.exception_util import (
    NarrativeException,
    transform_job_exception
)
from biokbase.NarrativeJobService.baseclient import ServerError as NJSServerError
from biokbase.userandjobstate.baseclient import ServerError as UJSServerError
from requests.exceptions import HTTPError
import requests


class ExceptionUtilTestCase(unittest.TestCase):
    def test_transform_njs_err(self):
        code = 1000
        message = "some error message"
        name = "NJSError"
        njs_err = NJSServerError(name, code, message)
        nar_err = transform_job_exception(njs_err)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, 'njs')

    def test_transform_ujs_err(self):
        code = 1000
        message = "some error message"
        name = "UJSError"
        ujs_err = UJSServerError(name, code, message)
        nar_err = transform_job_exception(ujs_err)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, 'ujs')

    def test_transform_http_err_unavailable(self):
        codes = [404, 502, 503]
        message = "A KBase service is currently unavailable."
        name = "HTTPError"
        for c in codes:
            res = requests.Response()
            res.status_code = c
            err = HTTPError("http error", response=res)
            nar_err = transform_job_exception(err)
            self.assertEqual(nar_err.code, c)
            self.assertEqual(nar_err.message, message)
            self.assertEqual(nar_err.name, name)
            self.assertEqual(nar_err.source, 'network')

    def test_transform_http_err_timeout(self):
        codes = [504, 598, 599]
        message = "There was a temporary network connection error."
        name = "HTTPError"
        for c in codes:
            res = requests.Response()
            res.status_code = c
            err = HTTPError("http error", response=res)
            nar_err = transform_job_exception(err)
            self.assertEqual(nar_err.code, c)
            self.assertEqual(nar_err.message, message)
            self.assertEqual(nar_err.name, name)
            self.assertEqual(nar_err.source, 'network')

    def test_transform_http_err_internal(self):
        code = 500
        message = "An internal error occurred in the KBase service."
        name = "HTTPError"
        res = requests.Response()
        res.status_code = code
        err = HTTPError("http error", response=res)
        nar_err = transform_job_exception(err)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, 'network')

    def test_transform_http_err_unknown(self):
        code = 666
        message = "An untracked error occurred."
        name = "HTTPError"
        res = requests.Response()
        res.status_code = code
        err = HTTPError("http error", response=res)
        nar_err = transform_job_exception(err)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, 'network')
