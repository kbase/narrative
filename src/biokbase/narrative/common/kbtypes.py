"""
KBase data types
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '11/15/13'

## Imports
import json
import re
# Third-party
from IPython.utils.traitlets import HasTraits, TraitType, TraitError
from IPython.utils import traitlets as tls


class TypeMeta(object):
    """Mix-in so type metadata is easy to access and use.
    This should be added to the parent class list for all types.
    """
    def __str__(self):
        """Return name of class.
        """
        return self.__class__.__name__


class JsonTraits(HasTraits, TypeMeta):
    """Trait container that can serialize as JSON.
    Replacement for HasTraits.
    """
    def as_json(self):
        """Return all traits in dict.
        """
        d = {}
        for a, t in self.traits().iteritems():
            val = getattr(self, a)
            if hasattr(val, 'as_json'):
                d[a] = val.as_json()
            else:
                d[a] = val
        return d


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


class Numeric(tls.Float, TypeMeta):
    info_text = "a number"

    def validate(self, obj, value):
        """Silently coerce strings to numbers.
        """
        if isinstance(value, basestring):
            try:
                value = float(value)
            except ValueError:
                self.error(obj, value)
        return value


class Integer(tls.Integer, TypeMeta):
    info_text = "an integer"


class Unicode(tls.Unicode, TypeMeta):
    info_text = "a unicode string"


class List(tls.Unicode, TypeMeta):
    info_text = "List"


class WorkspaceObjectId(tls.Unicode, TypeMeta):
    info_text = "identifier for a workspace object"

# Plants / GWAS


class VariationDataProperties(JsonTraits):
    info_text = "Variation data properties"

    num_snps = Numeric(0, desc="Number of SNPs")
    num_individuals = Integer(0, desc="Number of individuals")
    snp_effect_annotation = tls.Unicode("", desc="Flag for SNP annotation: yes or no")
    individual_names = tls.List(tls.Unicode)


class VariationDataset(JsonTraits):
    info_text = "Variation dataset"

    name = tls.Unicode("no name", desc="Name")
    description = tls.Unicode("none", desc="Description")
    file_format = tls.Unicode("vcf", desc="File format")
    comments = tls.Unicode("", desc="Comments")
    kbase_genome_id = tls.Unicode("", desc="Genome identifier")
    kbase_genome_name = tls.Unicode("", desc="Genome name")
    shock_node_id = tls.Unicode("", desc="Shock node ID")
    properties = tls.Instance(VariationDataProperties, ())
    command_used = tls.Unicode("unspecified", desc= "Command")

    def __repr__(self):
        return json.dumps(self.as_json())


######### Microbes Narrative ###########

# Override __str__ to get a fully qualified type name.
class KBaseGenome1(tls.Unicode, TypeMeta):
    info_text = "KBaseGenomes.Genome-1.0"
    def __str__(self):
        return "KBaseGenomes.Genome-1.0"

class KBaseGenome3(tls.Unicode, TypeMeta):
    info_text = "KBaseGenomes.Genome-3.0"
    def __str__(self):
        return "KBaseGenomes.Genome-3.0"

class KBaseGenomesContigSet1(tls.Unicode, TypeMeta):
    info_text = "KBaseGenomes.ContigSet-1.0"
    def __str__(self):
        return "KBaseGenomes.ContigSet-1.0"

class KBaseBiochem_Media(tls.Unicode, TypeMeta):
    info_text = "KBaseBiochem.Media-1.0"
    def __str__(self):
        return "KBaseBiochem.Media-1.0"
    
# !!!!!!!!!!!!!!!  FBAModel and FBA version numbers will have to update when we move to production
class KBaseFBA_FBAModel(tls.Unicode, TypeMeta):
    info_text = "KBaseFBA.FBAModel-3.0"
    def __str__(self):
        return "KBaseFBA.FBAModel-3.0"
class KBaseFBA_FBA(tls.Unicode, TypeMeta):
    info_text = "KBaseFBA.FBA-4.0"
    def __str__(self):
        return "KBaseFBA.FBA-4.0"


class Genome(tls.Unicode, TypeMeta):
    info_text = "a genome"


class Media(tls.Unicode, TypeMeta):
    info_text = "some media"


class Model(tls.Unicode, TypeMeta):
    info_text = "an FBA model ID"


class ContigSet(tls.Unicode, TypeMeta):
    info_text = "a ContigSet"


class FBAResult(tls.Unicode, TypeMeta):
    info_text = "FBA result"


class FBA(tls.Unicode, TypeMeta):
    info_text = "FBA result"


class Gapfill(tls.Unicode, TypeMeta):
    info_text = "Gapfill set"


class PhenotypeSet(tls.Unicode, TypeMeta):
    info_text = "Phenotype data"


class PhenotypeSimulationSet(tls.Unicode, TypeMeta):
    info_text = "Phenotype simulation"

class ProteomeComparison(tls.Unicode, TypeMeta):
    info_text = "Proteome comparison result"
