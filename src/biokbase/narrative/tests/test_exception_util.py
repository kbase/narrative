import unittest

import requests
from requests.exceptions import HTTPError

from biokbase.execution_engine2.baseclient import ServerError as EEServerError
from biokbase.narrative.exception_util import transform_job_exception

ERROR_MSG = "some error message"

HTTP_ERROR = "HTTPError"
HTTP_ERROR_MSG = "http error message"


class ExceptionUtilTestCase(unittest.TestCase):
    def test_transform_ee2_err(self):
        code = 1000
        message = ERROR_MSG
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
        message = ERROR_MSG
        name = "EEError"
        error = "Unable to perform some request"
        ee2_err = EEServerError(name, code, message)
        nar_err = transform_job_exception(ee2_err, error)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, "ee2")
        self.assertEqual(nar_err.error, error)

    def test_transform_http_err_unavailable(self):
        codes = [404, 502, 503]
        message = "A KBase service is currently unavailable."
        name = HTTP_ERROR
        for c in codes:
            res = requests.Response()
            res.status_code = c
            err = HTTPError(HTTP_ERROR_MSG, response=res)
            nar_err = transform_job_exception(err)
            self.assertEqual(nar_err.code, c)
            self.assertEqual(nar_err.message, message)
            self.assertEqual(nar_err.name, name)
            self.assertEqual(nar_err.source, "network")
            self.assertIsNone(nar_err.error)

    def test_transform_http_err_timeout(self):
        codes = [504, 598, 599]
        message = "There was a temporary network connection error."
        name = HTTP_ERROR
        for c in codes:
            res = requests.Response()
            res.status_code = c
            err = HTTPError(HTTP_ERROR_MSG, response=res)
            nar_err = transform_job_exception(err)
            self.assertEqual(nar_err.code, c)
            self.assertEqual(nar_err.message, message)
            self.assertEqual(nar_err.name, name)
            self.assertEqual(nar_err.source, "network")
            self.assertIsNone(nar_err.error)

    def test_transform_http_err_internal(self):
        code = 500
        message = "An internal error occurred in the KBase service."
        name = HTTP_ERROR
        res = requests.Response()
        res.status_code = code
        err = HTTPError(HTTP_ERROR_MSG, response=res)
        nar_err = transform_job_exception(err)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, "network")
        self.assertIsNone(nar_err.error)

    def test_transform_http_err_unknown(self):
        code = 666
        message = "An untracked error occurred."
        name = HTTP_ERROR
        res = requests.Response()
        res.status_code = code
        err = HTTPError(HTTP_ERROR_MSG, response=res)
        nar_err = transform_job_exception(err)
        self.assertEqual(nar_err.code, code)
        self.assertEqual(nar_err.message, message)
        self.assertEqual(nar_err.name, name)
        self.assertEqual(nar_err.source, "network")
        self.assertIsNone(nar_err.error)
