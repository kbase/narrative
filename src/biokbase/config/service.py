import glob
import json
import os
import sys
import time
# Third-party
import requests

class ServiceConfig(object):
    class CheckResult(object):
        """Result of checking a service.
        For ones that fail, status code is 0 for network errors and an HTTP code
        for HTTP errors.
        """
        def __init__(self, service, url, elapsed, code=200, error=""):
            self.service, self.url, self.elapsed = service, url, elapsed
            self.status_code, self.reason = code, error
        def is_success(self):
            return self.status_code == 200
        def is_network_failure(self):
            return self.status_code == 0
        def __str__(self):
            ok = ("failed", "succeeded")[self.is_success()]
            e = [" ({})".format(self.reason), ""][self.is_success()]
            return "{} [{}] {} = {}{}".format(ok, self.status_code, self.service, self. url, e)
        __repr__  = __str__

    def __init__(self, basepath=None):
        d = json.load(open(os.path.join(basepath, "services.json")))
        self.mode = d['config']
        self.conf = d[self.mode]
        self.services = {k:v for k,v in self.conf.items()
                                          if hasattr(v, 'startswith') and v.startswith("http")}

    def check_all(self):
        """Check all services. This may take a while.
        Runs as a generator that yields a ServiceConfig.CheckResult object.
        """
        for service in sorted(self.services.keys()):
            yield self.check(service)

    def check(self, service):
        """Check one service.
        TODO: Replace generic HTTP GET with service-specific operation.
        """
        url = self.services[service]
        try:
            t0 = time.time()
            r = requests.get(url, timeout=4)
            t1 = time.time()
            if r.status_code == 200:
                return self.CheckResult(service, url, t1 - t0)
            else:
                return self.CheckResult(service, url, -1, r.status_code, r.reason)
        except Exception, e:
            return self.CheckResult(service, url,  -1, 0, e)
    
    def __str__(self):
        s = "Mode '{}':\n".format(self. mode)
        for k in sorted(self.conf.keys()):
            s += "  {:32} {}\n".format(k, self.conf[k])
        return s
