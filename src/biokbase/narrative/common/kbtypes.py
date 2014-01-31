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
    """
    info_text = "unknown-0.0"

    def __str__(self):
        return self.info_text


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


#: Alias for type errors
KBTypeError = TraitError

#: Narrative-specific types


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
    command_used = tls.Unicode("unspecified", desc="Command")

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

#@AUTO_BEGIN

class Inferelator(object):
    class InferelatorRunResult(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents data from a single run of Inferelator"""
            info_text = "InferelatorRunResult-1.0"
    class GeneList(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a list of gene ids"""
            info_text = "GeneList-1.0"

class MEME(object):
    class MemeSite(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a particular site from MEME motif description"""
            info_text = "MemeSite-1.0"
    class MemePSPM(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a position-specific probability matrix fot MEME motif"""
            info_text = "MemePSPM-1.0"
    class MastHit(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a particluar MAST hit"""
            info_text = "MastHit-1.0"
    class MemePSPMCollection(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents collection of MemePSPMs"""
            info_text = "MemePSPMCollection-1.0"
    class TomtomRunResult(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents result of a single TOMTOM run"""
            info_text = "TomtomRunResult-1.0"
    class MemeRunResult(object):
        class v1_1(tls.Unicode, TypeMeta):
            """Represents results of a single MEME run"""
            info_text = "MemeRunResult-1.1"
    class MastRunResult(object):
        class v1_1(tls.Unicode, TypeMeta):
            """Represents result of a single MAST run"""
            info_text = "MastRunResult-1.1"

class KBaseSearch(object):
    class Contig(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Type spec for a "Contig" subobject in the "ContigSet" object"""
            info_text = "Contig-1.0"
    class Genome(object):
        class v1_3(tls.Unicode, TypeMeta):
            """Genome object holds much of the data relevant for a genome in KBase"""
            info_text = "Genome-1.3"
    class Feature(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Structure for a single feature of a Genome"""
            info_text = "Feature-1.0"
    class ContigSet(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Type spec for the "ContigSet" object"""
            info_text = "ContigSet-1.0"
    class FeatureSet(object):
        class v1_3(tls.Unicode, TypeMeta):
            """Type spec for the "FeatureSet" object"""
            info_text = "FeatureSet-1.3"

class Cmonkey(object):
    class CmonkeyRunResult(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents data from a single run of cMonkey"""
            info_text = "CmonkeyRunResult-1.0"

class KBaseNarrative(object):
    class Narrative(object):
        class v2_0(tls.Unicode, TypeMeta):
            """Narrative object"""
            info_text = "Narrative-2.0"
    class Worksheet(object):
        class v2_0(tls.Unicode, TypeMeta):
            """Worksheet object"""
            info_text = "Worksheet-2.0"
    class Cell(object):
        class v2_0(tls.Unicode, TypeMeta):
            """Cell object"""
            info_text = "Cell-2.0"

class KBaseExpression(object):
    class ExpressionSample(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Data structure for the workspace expression sample.  The Expression Sample typed object."""
            info_text = "ExpressionSample-1.0"
    class ExpressionSeries(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Data structure for the workspace expression series.  The ExpressionSeries typed object."""
            info_text = "ExpressionSeries-1.0"
    class ExpressionReplicateGroup(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Simple Grouping of Samples that belong to the same replicate group.  ExpressionReplicateGroup typed object."""
            info_text = "ExpressionReplicateGroup-1.0"
    class ExpressionPlatform(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Data structure for the workspace expression platform.  The ExpressionPlatform typed object."""
            info_text = "ExpressionPlatform-1.0"

class KBaseCommunities(object):
    class Metagenome(object):
        class v1_0(tls.Unicode, TypeMeta):
            """metagenome_id, metagenome_name,project,sample,sequence_type are required, everything else optional"""
            info_text = "Metagenome-1.0"

class KBasePhenotypes(object):
    class PhenotypeSet(object):
        class v1_0(tls.Unicode, TypeMeta):
            """PhenotypeSet object contains a set of phenotype objects"""
            info_text = "PhenotypeSet-1.0"
    class PhenotypeSimulationSet(object):
        class v1_0(tls.Unicode, TypeMeta):
            """PhenotypeSimulationSet object holds data on simulations of many phenotypes"""
            info_text = "PhenotypeSimulationSet-1.0"

class KBaseGenomes(object):
    class Genome(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Genome object holds much of the data relevant for a genome in KBase"""
            info_text = "Genome-1.0"
    class ContigSet(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Type spec for the "ContigSet" object"""
            info_text = "ContigSet-1.0"

class KBaseRegulation(object):
    class Regulome(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents regulome - collection of regulons for a given genome"""
            info_text = "Regulome-1.0"

class KBaseOntology(object):
    class Mapping(object):
        class v2_0(tls.Unicode, TypeMeta):
            """Mapping object holds data on subsystems and complexes"""
            info_text = "Mapping-2.0"

class KBaseFBA(object):
    class FBAModel(object):
        class v1_0(tls.Unicode, TypeMeta):
            """FBAModel object"""
            info_text = "FBAModel-1.0"
    class FBA(object):
        class v1_0(tls.Unicode, TypeMeta):
            """FBA object holds the formulation and results of a flux balance analysis study"""
            info_text = "FBA-1.0"
    class Gapfilling(object):
        class v1_0(tls.Unicode, TypeMeta):
            """GapFilling object holds data on the formulations and solutions of a gapfilling analysis"""
            info_text = "Gapfilling-1.0"
    class ModelTemplate(object):
        class v1_0(tls.Unicode, TypeMeta):
            """ModelTemplate object holds data on how a model is constructed from an annotation"""
            info_text = "ModelTemplate-1.0"
    class Gapgeneration(object):
        class v1_0(tls.Unicode, TypeMeta):
            """GapGeneration object holds data on formulation and solutions from gapgen analysis"""
            info_text = "Gapgeneration-1.0"

class KBasePPI(object):
    class InteractionDataset(object):
        class v1_0(tls.Unicode, TypeMeta):
            """This is a denormalized version of an entire PPI dataset,"""
            info_text = "InteractionDataset-1.0"
    class Interaction(object):
        class v1_0(tls.Unicode, TypeMeta):
            """searchable kb_id;"""
            info_text = "Interaction-1.0"

class BAMBI(object):
    class BambiRunResult(object):
        class v1_3(tls.Unicode, TypeMeta):
            """Represents results of a BAMBI run"""
            info_text = "BambiRunResult-1.3"

class KBaseGwasData(object):
    class GwasPopulationKinship(object):
        class v1_0(tls.Unicode, TypeMeta):
            """GwasPopulationKinship has population kinship matrix"""
            info_text = "GwasPopulationKinship-1.0"
    class GwasPopulationVariation(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Details of nucleotide variation in the population"""
            info_text = "GwasPopulationVariation-1.0"
    class GwasPopulation(object):
        class v1_0(tls.Unicode, TypeMeta):
            """GwasPopulation object stores metadata for each ecotype/germplasm in the population"""
            info_text = "GwasPopulation-1.0"
    class GwasGeneList(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Gwasgenelist has the list of genes obtained on the basis of significant snp list"""
            info_text = "GwasGeneList-1.0"
    class GwasTopVariations(object):
        class v1_0(tls.Unicode, TypeMeta):
            """List of significant snps and pvalues obtained after gwas analysis"""
            info_text = "GwasTopVariations-1.0"
    class GwasPopulationTrait(object):
        class v1_0(tls.Unicode, TypeMeta):
            """GwasPopulationTrait object contains trait details for one trait in a population"""
            info_text = "GwasPopulationTrait-1.0"

class KBaseSequences(object):
    class SequenceSet(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents set of sequences"""
            info_text = "SequenceSet-1.0"

class ProbabilisticAnnotation(object):
    class RxnProbs(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Object to hold reaction probabilities for a genome."""
            info_text = "RxnProbs-1.0"
    class ProbAnno(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Object to carry alternative functions and probabilities for genes in a genome"""
            info_text = "ProbAnno-1.0"

class MAK(object):
    class MAKResult(object):
        class v2_1(tls.Unicode, TypeMeta):
            """Represents data from a single run of MAK"""
            info_text = "MAKResult-2.1"
    class ExpressionDataPoint(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a particular data point from gene expression data set"""
            info_text = "ExpressionDataPoint-1.0"
    class ExpressionDataSeries(object):
        class v1_0(tls.Unicode, TypeMeta):
            """ExpressionDataSeries represents collection of expression data samples"""
            info_text = "ExpressionDataSeries-1.0"
    class ExpressionDataSample(object):
        class v1_0(tls.Unicode, TypeMeta):
            """ExpressionDataSample represents set of expression data"""
            info_text = "ExpressionDataSample-1.0"
    class MAKBiclusterSet(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Bicluster set"""
            info_text = "MAKBiclusterSet-1.0"
    class MAKBicluster(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Bicluster"""
            info_text = "MAKBicluster-1.0"
    class MAKParameters(object):
        class v1_1(tls.Unicode, TypeMeta):
            """MAK algorithm and discovery strategy parameters"""
            info_text = "MAKParameters-1.1"

class KBaseNetworks(object):
    class Network(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a network"""
            info_text = "Network-1.0"
    class InteractionSet(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a set of interactions"""
            info_text = "InteractionSet-1.0"

class KBaseBiochem(object):
    class BiochemistryStructures(object):
        class v1_0(tls.Unicode, TypeMeta):
            """BiochemistryStructures object"""
            info_text = "BiochemistryStructures-1.0"
    class Media(object):
        class v1_0(tls.Unicode, TypeMeta):
            """Media object"""
            info_text = "Media-1.0"
    class Biochemistry(object):
        class v2_0(tls.Unicode, TypeMeta):
            """Biochemistry object"""
            info_text = "Biochemistry-2.0"
#@AUTO_END


def regenerate(args):
    """Regenerate self with AUTO section filled in.
    """
    from util import Workspace2, WorkspaceException
    import os, tempfile
    import logging

    logging.basicConfig()
    _log = logging.getLogger(__name__)
    if args.vb > 0:
        _log.setLevel((logging.INFO, logging.DEBUG)[min(args.vb, 1)])

    # Connect to workspace and query type metadata.
    try:
        ws = Workspace2(url=args.url, user_id=args.user, password=args.password)
        types = ws.types(strip_version=False, info_keys=['description'])
    except WorkspaceException as err:
        _log.critical("Cannot connect to workspace at '{}'".format(args.url))
        return 1

    # Open and position in output file.
    pfile = open(__file__, 'r')
    w = tempfile.NamedTemporaryFile(delete=False)
    if args.bfile:
        try:
            w2 = open(args.bfile, 'w')
        except IOError as err:
            _log.critical("Cannot open backup file '{}': {}. Abort".format(args.bfile, err))
            return -1
    else:
        w2 = None
    _log.debug("tempfile name={}".format(w.name))
    pre, post, where = [], [], -1
    for line in pfile:
        if w2:  # backup verbatim
            w2.write(line)
        if where == -1:
            w.write(line)
            if line.startswith('#@AUTO_BEGIN'):
                where = 0
                write_types(w, types)
        elif where == 0:
            if line.startswith("#@AUTO_END"):
                w.write(line)
                where = 1
        else:
            w.write(line)

    w.close()
    if w2:
        w2.close()

    if where != 1:
        _log.critical("kbtypes module is missing @AUTO_{}".format(('END', 'BEGIN')[where == -1]))
        os.unlink(w.name)
        return 1

    # Update
    mv_cmd = "/bin/mv {} {}".format(w.name, pfile.name)
    _log.info("Update file with command: {}".format(mv_cmd))
    result = os.system(mv_cmd)
    if result != 0:
        _log.critical("Could not update {}: Command '{}' failed: {}."
                      .format(pfile.name, mv_cmd, os.strerror(result)))

    return result


def write_types(w, types):
    """Write out new type info.
    """
    ind = ' ' * 4
    for modname, typeinfo in types.iteritems():
        w.write("\nclass {c}(object):\n".format(c=modname))
        for typename, info in typeinfo.iteritems():
            name, ver = typename.split('-')
            w.write("{i}class {c}(object):\n".format(i=ind, c=name))
            pyver = "v" + ver.replace('.', '_')
            desc = info['description'].strip()
            first_line = desc.find('\n')
            desc = desc[:first_line].strip() if first_line > 0 else desc
            if not desc:
                desc = "{} object".format(name)
            w.write("{i}{i}class {c}(tls.Unicode, TypeMeta):\n".format(i=ind, c=pyver))
            w.write('{i}{i}{i}"""{d}"""\n'.format(i=ind, d=desc))
            w.write("{i}{i}{i}info_text = \"{d}\"\n".format(i=ind, d=typename))


def main():
    import argparse

    pr = argparse.ArgumentParser("Auto-generate types and update file contents")
    pr.add_argument("-b", "--backup", dest="bfile", metavar="FILE", help="Backup original file to FILE", default=None)
    pr.add_argument("-u", "--url", dest="url", help="WS url", default=None, required=True)
    pr.add_argument("-U", "--user", dest="user", help="auth user name", required=True)
    pr.add_argument("-P", "--password", dest="password", help="auth password", required=True)
    pr.add_argument("-v", "--verbose", dest="vb", action="count", default=0, help="Be more verbose")
    args = pr.parse_args()
    return regenerate(args)

if __name__ == "__main__":
    import sys
    sys.exit(main())