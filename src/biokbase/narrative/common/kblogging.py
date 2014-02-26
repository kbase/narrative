"""
Common narrative logging functions
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '1/30/14'

import logging
import os

_log = logging.getLogger("biokbase")  # root of hierarchy

# Turn on debugging by setting environment variable KBASE_DEBUG.
if os.environ.get("KBASE_DEBUG", None):
    _log.setLevel(logging.DEBUG)
else:
    _log.setLevel(logging.WARN)

# Set default log format.
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("%(levelname)s %(asctime)s %(module)s: %(message)s"))
_log.addHandler(_h)
