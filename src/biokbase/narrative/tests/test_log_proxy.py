"""
Test log proxy and kblogging
"""
import logging
import os
import signal
import time
import unittest

import pytest
from biokbase.narrative.common import log_proxy

__author__ = "Dan Gunter <dkgunter@lbl.gov>"


class MainTestCase(unittest.TestCase):
    # name of var lines up with cmdline arg 'dest', don't change
    conf = "/tmp/kbase_logforward.conf"
    vb = 0
    smpcfg = "sample"
    meta = None

    def setUp(self):
        self._config(["db: test", "collection: kblog"])
        if log_proxy.g_log is None:
            log_proxy.g_log = logging.getLogger(log_proxy.LOGGER_NAME)

    def _config(self, lines):
        text = "\n".join(lines)
        with open(self.conf, "w") as f:
            f.write(text)

    def test_run_proxy(self):
        pid = os.fork()
        if pid == 0:
            print("Run child")
            log_proxy.run(self)
        else:
            time.sleep(1)
            print("Wait for child to start")
            # let it start
            time.sleep(4)
            # send it a HUP to stop it
            print(f"Send child ({pid:d}) a HUP")
            os.kill(pid, signal.SIGHUP)
            # wait for it to stop
            print(f"Wait for child ({pid:d}) to stop")
            cpid, r = os.waitpid(pid, 0)
            print(f"cpid, r: {cpid}, {r}")
            assert r < 2, f"Bad exit status ({r:d}) from proxy"

    def test_configuration(self):
        # empty
        self._config([])
        with pytest.raises(ValueError):
            log_proxy.DBConfiguration(self.conf)
        # , proxy.DBConfiguration, self.conf)
        # missing collection
        self._config(["db: test"])
        with pytest.raises(KeyError):
            log_proxy.DBConfiguration(self.conf)
        # bad db name
        self._config(["db: 1test", "collection: kblog"])
        with pytest.raises(ValueError):
            log_proxy.DBConfiguration(self.conf)
        # bad db name
        self._config(["db: test.er", "collection: kblog"])
        with pytest.raises(ValueError):
            log_proxy.DBConfiguration(self.conf)
        # too long
        self._config(
            [
                "db: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "collection: bbbbbbbbbbbbbbbbbbcccccccccccccccccccccccc"
                "ddddddddddddddddddddddddddddddd",
            ]
        )
        with pytest.raises(ValueError):
            log_proxy.DBConfiguration(self.conf)
        # bad collection
        self._config(["db: test", "collection: kb$log"])
        with pytest.raises(ValueError):
            log_proxy.DBConfiguration(self.conf)
        # user, no pass
        self._config(["db: test", "collection: kblog", "user: joe"])
        with pytest.raises(KeyError):
            log_proxy.DBConfiguration(self.conf)


class LogRecordTest(unittest.TestCase):
    def setUp(self):
        if log_proxy.g_log is None:
            log_proxy.g_log = logging.getLogger(log_proxy.LOGGER_NAME)

    def test_basic(self):
        for inpt in {}, {"message": "hello"}:
            log_proxy.DBRecord(inpt)
        kbrec = log_proxy.DBRecord({"message": "greeting;Hello=World"})
        assert kbrec.record["event"] == "greeting"
        assert kbrec.record["Hello"] == "World"

    def test_strict(self):
        for inp in (
            {"xanthium": 12},
            {12: "xanthium"},
            {"message": "Hello=World;greeting"},
        ):
            log_proxy.DBRecord(inp)
            with pytest.raises(ValueError):
                log_proxy.DBRecord(inp, strict=True)


if __name__ == "__main__":
    unittest.main()
