"""
Test log proxy and kblogging
"""
__author__ = 'Dan Gunter'

import os
import signal
import sys
import time
import unittest

from biokbase.narrative.common import kblogging as kbl
from biokbase.narrative.common import log_proxy as proxy


class MainTestCase(unittest.TestCase):
    # name of var lines up with cmdline arg 'dest', don't change
    conf = "/tmp/kbase_logforward.conf"

    def setUp(self):
        self._config(['db: test', 'collection: kblog'])

    def _config(self, lines):
        text = '\n'.join(lines)
        with open(self.conf, 'w') as f:
            f.write(text)

    def test_run_proxy(self):
        pid = os.fork()
        if pid == 0:
            print("Run child")
            r = proxy.main(self)
            print("Child is done with status {:d}".format(r))
            raise unittest.SkipTest("forked child")
        else:
            time.sleep(1)
            print("Wait for child to start")
            # let it start
            time.sleep(4)
            # send it a HUP to stop it
            print("Send child ({:d}) a HUP".format(pid))
            os.kill(pid, signal.SIGHUP)
            # wait for it to stop
            print("Wait for child ({:d}) to stop".format(pid))
            cpid, r = os.waitpid(pid, 0)
            self.assertEqual(r, 0,
                             "Non-zero exit status ({:d}) from proxy".format(r))

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

if __name__ == '__main__':
    unittest.main()
