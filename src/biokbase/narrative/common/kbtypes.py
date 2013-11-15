"""
KBase data types
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '11/15/13'

## Imports
import re
# Third-party
from IPython.utils.traitlets import *   # XXX: probably bad idea

## Types


class VersionNumber(TraitType):
    """A trait for a (major, minor, patch) version tuple
    See http://semver.org/

    Values are accepted either as triples or strings e.g.
    (2,0,0) or "2.0.0". In either case, all 3 values must
    be provided. The first two values must be numeric, but
    the last one is a string or number, e.g. (2,0,"1-alpha+20131115")
    """

    default_value = "0.0.0"
    info_text = 'a version tuple (2,0,"1-rc3") or string "2.0.1rc3"'

    def validate(self, obj, value):
        if isinstance(value, tuple):
            if len(value) == 3:
                return value
        elif isinstance(value, basestring):
            v = re.match(r'([0-9]+)\.([0-9+])\.([0-9]\S*)', value)
            if v is not None:
                maj, minor, patch = v.groups()
                return (int(maj), int(minor), patch)
        self.error(obj, value)


class Genome(Unicode):
    pass
