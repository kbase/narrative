"""
KBase data types
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '11/15/13'

## Imports
import re
# Third-party
from IPython.utils.traitlets import TraitType, TraitError
from IPython.utils.traitlets import Unicode, Float


class TypeMeta(object):
    """Mix-in so type metadata is easy to access and use.
    This should be added to the parent class list for all types.
    """
    def __str__(self):
        """Return name of class.
        """
        return self.__class__.__name__


#: Our alias for type errors
KBTypeError = TraitError

## Types


class VersionNumber(TraitType, TypeMeta):
    """A trait for a (major, minor, patch) version tuple
    See http://semver.org/

    Values are accepted either as triples or strings e.g.
    (2,0,0) or "2.0.0". In either case, all 3 values must
    be provided. The first two values must be numeric, but
    the last one is a string or number, e.g. (2,0,"1-alpha+20131115").

    The first two are converted to integers, and the last one is
    converted to a string. So the validated value is always of the
    form (int, int, str).
    """

    default_value = (0, 0, 0)
    info_text = 'a version tuple (2,0,"1-rc3") or string "2.0.1rc3"'

    MATCH_RE = r'(\d+)\.(\d+)\.(\d\S*)'

    def validate(self, obj, value):
        # validate tuple. first 2 values are always converted to integers
        if isinstance(value, tuple):
            if len(value) != 3:
                self.error(obj, value)
            result = list(value)  # build return value here
            # allow only non-negative integers for first two numbers
            try:
                if filter(lambda x: int(x) < 0, value[:2]):
                    self.error(obj, value)
            except ValueError:
                self.error(obj, value)
            result[0], result[1] = int(value[0]), int(value[1])
            # last number must be non-negative integer or str starting with digit
            v = str(value[2])
            if re.match('\d', v) is None:
                self.error(obj, value)
            result[2] = v
            return tuple(result)
        elif isinstance(value, basestring):
            v = re.match(self.MATCH_RE, value)
            if v is not None:
                maj, minor, patch = v.groups()
                return int(maj), int(minor), patch
        self.error(obj, value)


class Genome(Unicode, TypeMeta):
    info_text = "a genome"


class Media(Unicode, TypeMeta):
    info_text = "some media"


class Numeric(Float, TypeMeta):
    info_text = "a number"
