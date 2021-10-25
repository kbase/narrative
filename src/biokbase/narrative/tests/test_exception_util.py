import unittest
from biokbase.narrative.exception_util import (
    NarrativeException,
    transform_job_exception,
)
from biokbase.execution_engine2.baseclient import ServerError as EEServerError
from biokbase.userandjobstate.baseclient import ServerError as UJSServerError
from requests.exceptions import HTTPError
import requests


class ExceptionUtilTestCase(unittest.TestCase):
    def test_transform_ee2_err(self):
        code = 1000
        message = "some error message"
        name = "EEError"
        ee2_err = EEServerError(name, code, message)
        nar_err = transform_job_exception(ee2_err)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, "ee2")
        self.assertIsNone(nar_err.error)

    def test_transform_ee2_err__with_error(self):
        code = 1000
        message = "some error message"
        name = "EEError"
        error = "Unable to perform some request"
        ee2_err = EEServerError(name, code, message)
        nar_err = transform_job_exception(ee2_err, error)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, "ee2")
        self.assertEqual(nar_err.error, error)

    def test_transform_ujs_err(self):
        code = 1000
        message = "some error message"
        name = "UJSError"
        ujs_err = UJSServerError(name, code, message)
        nar_err = transform_job_exception(ujs_err)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, "ujs")
        self.assertIsNone(nar_err.error)

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
            self.assertEqual(nar_err.source, "network")
            self.assertIsNone(nar_err.error)

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
            self.assertEqual(nar_err.source, "network")
            self.assertIsNone(nar_err.error)

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
        self.assertEqual(nar_err.source, "network")
        self.assertIsNone(nar_err.error)

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
        self.assertEqual(nar_err.source, "network")
        self.assertIsNone(nar_err.error)
