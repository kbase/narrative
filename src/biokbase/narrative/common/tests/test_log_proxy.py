"""
Test log proxy and kblogging
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'

import logging
import os
import signal
import sys
import time
import unittest

from biokbase.narrative.common import log_proxy as proxy


class MainTestCase(unittest.TestCase):
    # name of var lines up with cmdline arg 'dest', don't change
    conf = "/tmp/kbase_logforward.conf"
    vb = 0
    smpcfg = "sample"
    meta = None

    def setUp(self):
        self._config(['db: test', 'collection: kblog'])
        if proxy.g_log is None:
            proxy.g_log = logging.getLogger(proxy.LOGGER_NAME)

    def _config(self, lines):
        text = '\n'.join(lines)
        with open(self.conf, 'w') as f:
            f.write(text)

    def test_run_proxy(self):
        pid = os.fork()
        if pid == 0:
            #print("Run child")
            proxy.run(self)
        else:
            time.sleep(1)
            #print("Wait for child to start")
            # let it start
            time.sleep(4)
            # send it a HUP to stop it
            #print("Send child ({:d}) a HUP".format(pid))
            os.kill(pid, signal.SIGHUP)
            # wait for it to stop
            #print("Wait for child ({:d}) to stop".format(pid))
            cpid, r = os.waitpid(pid, 0)
            self.failUnless(r < 2,
                             "Bad exit status ({:d}) from proxy".format(r))

    def test_configuration(self):
        # empty
        self._config([])
        self.assertRaises(ValueError, proxy.DBConfiguration, self.conf)
        # missing collection
        self._config(['db: test'])
        self.assertRaises(KeyError, proxy.DBConfiguration, self.conf)
        # bad db name
        self._config(['db: 1test', 'collection: kblog'])
        self.assertRaises(ValueError, proxy.DBConfiguration, self.conf)
        # bad db name
        self._config(['db: test.er', 'collection: kblog'])
        self.assertRaises(ValueError, proxy.DBConfiguration, self.conf)
        # too long
        self._config(['db: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                      'collection: bbbbbbbbbbbbbbbbbbcccccccccccccccccccccccc'
                      'ddddddddddddddddddddddddddddddd'])
        self.assertRaises(ValueError, proxy.DBConfiguration, self.conf)
        # bad collection
        self._config(['db: test', 'collection: kb$log'])
        self.assertRaises(ValueError, proxy.DBConfiguration, self.conf)
        # user, no pass
        self._config(['db: test', 'collection: kblog', 'user: joe'])
        self.assertRaises(KeyError, proxy.DBConfiguration, self.conf)

class LogRecordTest(unittest.TestCase):
    def setUp(self):
        if proxy.g_log is None:
            proxy.g_log = logging.getLogger(proxy.LOGGER_NAME)

    def test_basic(self):
        for input in {}, {"message": "hello"}:
            kbrec = proxy.DBRecord(input)
        kbrec = proxy.DBRecord({"message": "greeting;Hello=World"})
        self.assertEqual(kbrec.record['event'], 'greeting')
        self.assertEqual(kbrec.record['Hello'], 'World')

    def test_strict(self):
        for inp in ({"xanthium": 12},
                    {12: "xanthium"},
                    {"message": "Hello=World;greeting"}):
            kbrec = proxy.DBRecord(inp)
            self.assertRaises(ValueError,
                              proxy.DBRecord,
                              inp, strict=True)

if __name__ == '__main__':
    unittest.main()
