import os
import json


class Struct:

    def __init__(self, **args):
        self._urls = {}
        self._urls.update(args)

    def get_url(self, key):
        return self._urls[key]

    def __getattr__(self, key):
        return self._urls[key]

    def __str__(self):
        return str(self._urls)

    def __repr__(self):
        return str(self._urls)

try:
    nar_path = os.environ["NARRATIVE_DIR"]
    config_json = open(os.path.join(nar_path, "src", "config.json")).read()
    config = json.loads(config_json)
    url_config = config[config['config']]  # fun, right?

    URLS = Struct(**url_config)
except:
    url_dict = {
        "workspace": "https://kbase.us/services/ws/",
        "invocation": "https://kbase.us/services/invocation",
        "fba": "https://kbase.us/services/KBaseFBAModeling",
        "genomeCmp": "https://kbase.us/services/genome_comparison/jsonrpc",
        "trees": "https://kbase.us/services/trees",
        "log_proxy_port": 32001,
        "log_proxy_host": "172.17.42.1"
    }
    URLS = Struct(**url_dict)