"""
Root of all services.

"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '12/11/13'

import biokbase.narrative.common.service as service
# load all modules in services dir (see services/__init__.py),
# which will register themselves on import
from biokbase.narrative.services import *

# SERVICE_JSON_FILE = "services.json"
# SERVICE_JSON_SCHEMA_FILE = "services_schema.json"

class Generator:
    """Generate a file with JSON Schema (or optionally just JSON) 
    representing all Service definitions
    """

    def __init__(self, args):
        """Constructor.

        :param args: Command-line args
        :type args: argparse.Namespace
        """
        import logging
        self._log = None
        # Set up logging.
        logging.basicConfig()
        self._log = logging.getLogger(__name__)
        if args.vb > 0:
            self._log.setLevel((logging.INFO, logging.DEBUG)[min(args.vb, 1)])
        self._args = args

    def run(self):
        """Build the JSON/Schema.
        If there's a file to write to, try to do so.
        If not, just dump to stdout
        """
        if (self._args.as_json):
            self._log.debug("Getting services as json")
            all_services = service.get_all_services(as_json=True)
        else:
            self._log.debug("Getting services as json schema")
            all_services = service.get_all_services(as_json_schema=True)

        if (self._args.pretty):
            self._log.debug("Pretty-print formatting output")
            import json
            all_services = json.dumps(json.loads(all_services), indent=4,
                                      separators=(',', ': '))

        if (self._args.file is not None):
            self._log.debug("Writing output")
            try:
                outfile = open(self._args.file, 'w')
                outfile.write(all_services)
                outfile.close()
            except IOError as e:
                self._log.critical("Error while trying to write output: {}".format(e.strerror))
                return 1
        else:
            print all_services

        return 0


def main():
    import argparse

    pr = argparse.ArgumentParser("Auto-generate the JSON Schema that describes service modules. This defaults to building JSON Schema, but with the -j tag will build JSON")
    pr.add_argument("-j", "--json", dest="as_json", action="store_true", help="Build as JSON, not JSON Schema")
    pr.add_argument("-f", "--file", dest="file", metavar="FILE", help="Write output to FILE", default=None)
    pr.add_argument("-p", "--pretty", dest="pretty", action="store_true", help="Pretty-print output")
    pr.add_argument("-v", "--verbose", dest="vb", action="count", help="Be more verbose", default=0)
    args = pr.parse_args()
    gen = Generator(args)
    return gen.run()

if __name__ == "__main__":
    import sys
    sys.exit(main())