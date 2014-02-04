
# KBase data types
# (no docstring because this module is autodoc-ed).

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


class KBaseBiochem_Media(tls.Unicode, TypeMeta):
    info_text = "KBaseBiochem.Media-1.0"
    def __str__(self):
        return "KBaseBiochem.Media-1.0"

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

class Communities(object):
    """Communities module"""
    class Profile(tls.Unicode, TypeMeta):
        """Profile type"""
        info_text = "Communities.Profile"
        class v1_0(tls.Unicode, TypeMeta):
            """Profile is a general data type while Profile::Stats and Profile::Table are based on Profile but with additional data and methods"""
            info_text = "Communities.Profile-1.0"
    class DataHandle(tls.Unicode, TypeMeta):
        """DataHandle type"""
        info_text = "Communities.DataHandle"
        class v1_0(tls.Unicode, TypeMeta):
            """DataHandle object"""
            info_text = "Communities.DataHandle-1.0"
    class Metagenome(tls.Unicode, TypeMeta):
        """Metagenome type"""
        info_text = "Communities.Metagenome"
        class v1_0(tls.Unicode, TypeMeta):
            """Metagenome object"""
            info_text = "Communities.Metagenome-1.0"
    class ProfileTable(tls.Unicode, TypeMeta):
        """ProfileTable type"""
        info_text = "Communities.ProfileTable"
        class v1_0(tls.Unicode, TypeMeta):
            """ProfileTable object"""
            info_text = "Communities.ProfileTable-1.0"
    class List(tls.Unicode, TypeMeta):
        """List type"""
        info_text = "Communities.List"
        class v1_0(tls.Unicode, TypeMeta):
            """List object"""
            info_text = "Communities.List-1.0"
    class Collection(tls.Unicode, TypeMeta):
        """Collection type"""
        info_text = "Communities.Collection"
        class v1_0(tls.Unicode, TypeMeta):
            """Collection object"""
            info_text = "Communities.Collection-1.0"
    class Project(tls.Unicode, TypeMeta):
        """Project type"""
        info_text = "Communities.Project"
        class v1_0(tls.Unicode, TypeMeta):
            """Project object"""
            info_text = "Communities.Project-1.0"
    class SequenceFile(tls.Unicode, TypeMeta):
        """SequenceFile type"""
        info_text = "Communities.SequenceFile"
        class v1_0(tls.Unicode, TypeMeta):
            """SequenceFile object"""
            info_text = "Communities.SequenceFile-1.0"
    class ProfileStats(tls.Unicode, TypeMeta):
        """ProfileStats type"""
        info_text = "Communities.ProfileStats"
        class v1_0(tls.Unicode, TypeMeta):
            """ProfileStats object"""
            info_text = "Communities.ProfileStats-1.0"
    class Data(tls.Unicode, TypeMeta):
        """Data type"""
        info_text = "Communities.Data"
        class v1_0(tls.Unicode, TypeMeta):
            """Data object"""
            info_text = "Communities.Data-1.0"

class MEME(object):
    """MEME module"""
    class MemePSPMCollection(tls.Unicode, TypeMeta):
        """MemePSPMCollection type"""
        info_text = "MEME.MemePSPMCollection"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents collection of MemePSPMs"""
            info_text = "MEME.MemePSPMCollection-1.0"
    class MemePSPM(tls.Unicode, TypeMeta):
        """MemePSPM type"""
        info_text = "MEME.MemePSPM"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a position-specific probability matrix fot MEME motif"""
            info_text = "MEME.MemePSPM-1.0"
    class MastRunResult(tls.Unicode, TypeMeta):
        """MastRunResult type"""
        info_text = "MEME.MastRunResult"
        class v1_1(tls.Unicode, TypeMeta):
            """Represents result of a single MAST run"""
            info_text = "MEME.MastRunResult-1.1"
    class MemeSite(tls.Unicode, TypeMeta):
        """MemeSite type"""
        info_text = "MEME.MemeSite"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a particular site from MEME motif description"""
            info_text = "MEME.MemeSite-1.0"
    class MastHit(tls.Unicode, TypeMeta):
        """MastHit type"""
        info_text = "MEME.MastHit"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a particluar MAST hit"""
            info_text = "MEME.MastHit-1.0"
    class TomtomRunResult(tls.Unicode, TypeMeta):
        """TomtomRunResult type"""
        info_text = "MEME.TomtomRunResult"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents result of a single TOMTOM run"""
            info_text = "MEME.TomtomRunResult-1.0"
    class MemeRunResult(tls.Unicode, TypeMeta):
        """MemeRunResult type"""
        info_text = "MEME.MemeRunResult"
        class v1_1(tls.Unicode, TypeMeta):
            """Represents results of a single MEME run"""
            info_text = "MEME.MemeRunResult-1.1"

class Cmonkey(object):
    """Cmonkey module"""
    class CmonkeyRunResult(tls.Unicode, TypeMeta):
        """CmonkeyRunResult type"""
        info_text = "Cmonkey.CmonkeyRunResult"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents data from a single run of cMonkey"""
            info_text = "Cmonkey.CmonkeyRunResult-1.0"

class KBaseExpression(object):
    """KBaseExpression module"""
    class ExpressionSample(tls.Unicode, TypeMeta):
        """ExpressionSample type"""
        info_text = "KBaseExpression.ExpressionSample"
        class v1_0(tls.Unicode, TypeMeta):
            """Data structure for the workspace expression sample.  The Expression Sample typed object."""
            info_text = "KBaseExpression.ExpressionSample-1.0"
    class ExpressionSeries(tls.Unicode, TypeMeta):
        """ExpressionSeries type"""
        info_text = "KBaseExpression.ExpressionSeries"
        class v1_0(tls.Unicode, TypeMeta):
            """Data structure for the workspace expression series.  The ExpressionSeries typed object."""
            info_text = "KBaseExpression.ExpressionSeries-1.0"
    class ExpressionReplicateGroup(tls.Unicode, TypeMeta):
        """ExpressionReplicateGroup type"""
        info_text = "KBaseExpression.ExpressionReplicateGroup"
        class v1_0(tls.Unicode, TypeMeta):
            """Simple Grouping of Samples that belong to the same replicate group.  ExpressionReplicateGroup typed object."""
            info_text = "KBaseExpression.ExpressionReplicateGroup-1.0"
    class ExpressionPlatform(tls.Unicode, TypeMeta):
        """ExpressionPlatform type"""
        info_text = "KBaseExpression.ExpressionPlatform"
        class v1_0(tls.Unicode, TypeMeta):
            """Data structure for the workspace expression platform.  The ExpressionPlatform typed object."""
            info_text = "KBaseExpression.ExpressionPlatform-1.0"

class KBaseGenomes(object):
    """KBaseGenomes module"""
    class ProbabilisticAnnotation(tls.Unicode, TypeMeta):
        """ProbabilisticAnnotation type"""
        info_text = "KBaseGenomes.ProbabilisticAnnotation"
        class v1_0(tls.Unicode, TypeMeta):
            """Object to carry alternative functions and probabilities for genes in a genome"""
            info_text = "KBaseGenomes.ProbabilisticAnnotation-1.0"
    class ContigSet(tls.Unicode, TypeMeta):
        """ContigSet type"""
        info_text = "KBaseGenomes.ContigSet"
        class v1_1(tls.Unicode, TypeMeta):
            """Type spec for the "ContigSet" object"""
            info_text = "KBaseGenomes.ContigSet-1.1"
    class Genome(tls.Unicode, TypeMeta):
        """Genome type"""
        info_text = "KBaseGenomes.Genome"
        class v1_0(tls.Unicode, TypeMeta):
            """Genome object holds much of the data relevant for a genome in KBase"""
            info_text = "KBaseGenomes.Genome-1.0"
    class MetagenomeAnnotation(tls.Unicode, TypeMeta):
        """MetagenomeAnnotation type"""
        info_text = "KBaseGenomes.MetagenomeAnnotation"
        class v1_0(tls.Unicode, TypeMeta):
            """Structure for the "MetagenomeAnnotation" object"""
            info_text = "KBaseGenomes.MetagenomeAnnotation-1.0"

class KBasePhenotypes(object):
    """KBasePhenotypes module"""
    class PhenotypeSet(tls.Unicode, TypeMeta):
        """PhenotypeSet type"""
        info_text = "KBasePhenotypes.PhenotypeSet"
        class v2_0(tls.Unicode, TypeMeta):
            """PhenotypeSet object contains a set of phenotype objects"""
            info_text = "KBasePhenotypes.PhenotypeSet-2.0"
    class PhenotypeSimulationSet(tls.Unicode, TypeMeta):
        """PhenotypeSimulationSet type"""
        info_text = "KBasePhenotypes.PhenotypeSimulationSet"
        class v1_0(tls.Unicode, TypeMeta):
            """PhenotypeSimulationSet object holds data on simulations of many phenotypes"""
            info_text = "KBasePhenotypes.PhenotypeSimulationSet-1.0"

class Empty(object):
    """Empty module"""
    class AType(tls.Unicode, TypeMeta):
        """AType type"""
        info_text = "Empty.AType"
        class v0_1(tls.Unicode, TypeMeta):
            """@optional foo"""
            info_text = "Empty.AType-0.1"

class KBaseCommunities(object):
    """KBaseCommunities module"""
    class Metagenome(tls.Unicode, TypeMeta):
        """Metagenome type"""
        info_text = "KBaseCommunities.Metagenome"
        class v1_0(tls.Unicode, TypeMeta):
            """metagenome_id, metagenome_name,project,sample,sequence_type are required, everything else optional"""
            info_text = "KBaseCommunities.Metagenome-1.0"

class KBasePPI(object):
    """KBasePPI module"""
    class InteractionDataset(tls.Unicode, TypeMeta):
        """InteractionDataset type"""
        info_text = "KBasePPI.InteractionDataset"
        class v1_0(tls.Unicode, TypeMeta):
            """This is a denormalized version of an entire PPI dataset,"""
            info_text = "KBasePPI.InteractionDataset-1.0"
    class Interaction(tls.Unicode, TypeMeta):
        """Interaction type"""
        info_text = "KBasePPI.Interaction"
        class v1_0(tls.Unicode, TypeMeta):
            """searchable kb_id;"""
            info_text = "KBasePPI.Interaction-1.0"

class KBaseOntology(object):
    """KBaseOntology module"""
    class Ontology(tls.Unicode, TypeMeta):
        """Ontology type"""
        info_text = "KBaseOntology.Ontology"
        class v1_0(tls.Unicode, TypeMeta):
            """Structure for Ontology object"""
            info_text = "KBaseOntology.Ontology-1.0"
    class GeneAnnotations(tls.Unicode, TypeMeta):
        """GeneAnnotations type"""
        info_text = "KBaseOntology.GeneAnnotations"
        class v1_0(tls.Unicode, TypeMeta):
            """Structure for GeneAnnotations"""
            info_text = "KBaseOntology.GeneAnnotations-1.0"
    class Mapping(tls.Unicode, TypeMeta):
        """Mapping type"""
        info_text = "KBaseOntology.Mapping"
        class v2_0(tls.Unicode, TypeMeta):
            """Mapping object holds data on subsystems and complexes"""
            info_text = "KBaseOntology.Mapping-2.0"

class KBaseNetworks(object):
    """KBaseNetworks module"""
    class Network(tls.Unicode, TypeMeta):
        """Network type"""
        info_text = "KBaseNetworks.Network"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a network"""
            info_text = "KBaseNetworks.Network-1.0"
    class InteractionSet(tls.Unicode, TypeMeta):
        """InteractionSet type"""
        info_text = "KBaseNetworks.InteractionSet"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a set of interactions"""
            info_text = "KBaseNetworks.InteractionSet-1.0"

class KBaseFBA(object):
    """KBaseFBA module"""
    class Gapfilling(tls.Unicode, TypeMeta):
        """Gapfilling type"""
        info_text = "KBaseFBA.Gapfilling"
        class v2_0(tls.Unicode, TypeMeta):
            """GapFilling object holds data on the formulations and solutions of a gapfilling analysis"""
            info_text = "KBaseFBA.Gapfilling-2.0"
    class FBA(tls.Unicode, TypeMeta):
        """FBA type"""
        info_text = "KBaseFBA.FBA"
        class v2_0(tls.Unicode, TypeMeta):
            """FBA object holds the formulation and results of a flux balance analysis study"""
            info_text = "KBaseFBA.FBA-2.0"
    class ReactionSensitivityAnalysis(tls.Unicode, TypeMeta):
        """ReactionSensitivityAnalysis type"""
        info_text = "KBaseFBA.ReactionSensitivityAnalysis"
        class v1_0(tls.Unicode, TypeMeta):
            """Object for holding reaction knockout sensitivity results"""
            info_text = "KBaseFBA.ReactionSensitivityAnalysis-1.0"
    class FBAModel(tls.Unicode, TypeMeta):
        """FBAModel type"""
        info_text = "KBaseFBA.FBAModel"
        class v2_0(tls.Unicode, TypeMeta):
            """FBAModel object"""
            info_text = "KBaseFBA.FBAModel-2.0"
    class Gapgeneration(tls.Unicode, TypeMeta):
        """Gapgeneration type"""
        info_text = "KBaseFBA.Gapgeneration"
        class v2_0(tls.Unicode, TypeMeta):
            """GapGeneration object holds data on formulation and solutions from gapgen analysis"""
            info_text = "KBaseFBA.Gapgeneration-2.0"
    class ModelTemplate(tls.Unicode, TypeMeta):
        """ModelTemplate type"""
        info_text = "KBaseFBA.ModelTemplate"
        class v2_0(tls.Unicode, TypeMeta):
            """ModelTemplate object holds data on how a model is constructed from an annotation"""
            info_text = "KBaseFBA.ModelTemplate-2.0"

class Inferelator(object):
    """Inferelator module"""
    class InferelatorRunResult(tls.Unicode, TypeMeta):
        """InferelatorRunResult type"""
        info_text = "Inferelator.InferelatorRunResult"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents data from a single run of Inferelator"""
            info_text = "Inferelator.InferelatorRunResult-1.0"
    class GeneList(tls.Unicode, TypeMeta):
        """GeneList type"""
        info_text = "Inferelator.GeneList"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a list of gene ids"""
            info_text = "Inferelator.GeneList-1.0"

class ProbabilisticAnnotation(object):
    """ProbabilisticAnnotation module"""
    class RxnProbs(tls.Unicode, TypeMeta):
        """RxnProbs type"""
        info_text = "ProbabilisticAnnotation.RxnProbs"
        class v1_0(tls.Unicode, TypeMeta):
            """Object to hold reaction probabilities for a genome."""
            info_text = "ProbabilisticAnnotation.RxnProbs-1.0"
    class ProbAnno(tls.Unicode, TypeMeta):
        """ProbAnno type"""
        info_text = "ProbabilisticAnnotation.ProbAnno"
        class v1_0(tls.Unicode, TypeMeta):
            """Object to carry alternative functions and probabilities for genes in a genome"""
            info_text = "ProbabilisticAnnotation.ProbAnno-1.0"

class KBaseRegulation(object):
    """KBaseRegulation module"""
    class Regulome(tls.Unicode, TypeMeta):
        """Regulome type"""
        info_text = "KBaseRegulation.Regulome"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents regulome - collection of regulons for a given genome"""
            info_text = "KBaseRegulation.Regulome-1.0"

class KBaseAssembly(object):
    """KBaseAssembly module"""
    class SingleEndLibrary(tls.Unicode, TypeMeta):
        """SingleEndLibrary type"""
        info_text = "KBaseAssembly.SingleEndLibrary"
        class v1_0(tls.Unicode, TypeMeta):
            """SingleEndLibrary object"""
            info_text = "KBaseAssembly.SingleEndLibrary-1.0"
    class Handle(tls.Unicode, TypeMeta):
        """Handle type"""
        info_text = "KBaseAssembly.Handle"
        class v1_0(tls.Unicode, TypeMeta):
            """@optional file_name type url remote_md5 remote_sha1"""
            info_text = "KBaseAssembly.Handle-1.0"
    class AssemblyInput(tls.Unicode, TypeMeta):
        """AssemblyInput type"""
        info_text = "KBaseAssembly.AssemblyInput"
        class v1_0(tls.Unicode, TypeMeta):
            """@optional paired_end_libs single_end_libs references expected_coverage expected_coverage estimated_genome_size dataset_prefix dataset_description"""
            info_text = "KBaseAssembly.AssemblyInput-1.0"
    class ReferenceAssembly(tls.Unicode, TypeMeta):
        """ReferenceAssembly type"""
        info_text = "KBaseAssembly.ReferenceAssembly"
        class v1_0(tls.Unicode, TypeMeta):
            """@optional reference_name"""
            info_text = "KBaseAssembly.ReferenceAssembly-1.0"
    class PairedEndLibrary(tls.Unicode, TypeMeta):
        """PairedEndLibrary type"""
        info_text = "KBaseAssembly.PairedEndLibrary"
        class v1_0(tls.Unicode, TypeMeta):
            """@optional handle_2 insert_size_mean insert_size_std_dev interleaved read_orientation_outward"""
            info_text = "KBaseAssembly.PairedEndLibrary-1.0"

class KBaseSearch(object):
    """KBaseSearch module"""
    class FeatureSet(tls.Unicode, TypeMeta):
        """FeatureSet type"""
        info_text = "KBaseSearch.FeatureSet"
        class v1_3(tls.Unicode, TypeMeta):
            """Type spec for the "FeatureSet" object"""
            info_text = "KBaseSearch.FeatureSet-1.3"
    class Contig(tls.Unicode, TypeMeta):
        """Contig type"""
        info_text = "KBaseSearch.Contig"
        class v1_0(tls.Unicode, TypeMeta):
            """Type spec for a "Contig" subobject in the "ContigSet" object"""
            info_text = "KBaseSearch.Contig-1.0"
    class ContigSet(tls.Unicode, TypeMeta):
        """ContigSet type"""
        info_text = "KBaseSearch.ContigSet"
        class v1_0(tls.Unicode, TypeMeta):
            """Type spec for the "ContigSet" object"""
            info_text = "KBaseSearch.ContigSet-1.0"
    class Genome(tls.Unicode, TypeMeta):
        """Genome type"""
        info_text = "KBaseSearch.Genome"
        class v1_3(tls.Unicode, TypeMeta):
            """Genome object holds much of the data relevant for a genome in KBase"""
            info_text = "KBaseSearch.Genome-1.3"
    class Feature(tls.Unicode, TypeMeta):
        """Feature type"""
        info_text = "KBaseSearch.Feature"
        class v1_0(tls.Unicode, TypeMeta):
            """Structure for a single feature of a Genome"""
            info_text = "KBaseSearch.Feature-1.0"

class BAMBI(object):
    """BAMBI module"""
    class BambiRunResult(tls.Unicode, TypeMeta):
        """BambiRunResult type"""
        info_text = "BAMBI.BambiRunResult"
        class v1_3(tls.Unicode, TypeMeta):
            """Represents results of a BAMBI run"""
            info_text = "BAMBI.BambiRunResult-1.3"

class KBaseGwasData(object):
    """KBaseGwasData module"""
    class GwasGeneList(tls.Unicode, TypeMeta):
        """GwasGeneList type"""
        info_text = "KBaseGwasData.GwasGeneList"
        class v1_0(tls.Unicode, TypeMeta):
            """Gwasgenelist has the list of genes obtained on the basis of significant snp list"""
            info_text = "KBaseGwasData.GwasGeneList-1.0"
    class GwasPopulationVariation(tls.Unicode, TypeMeta):
        """GwasPopulationVariation type"""
        info_text = "KBaseGwasData.GwasPopulationVariation"
        class v1_0(tls.Unicode, TypeMeta):
            """Details of nucleotide variation in the population"""
            info_text = "KBaseGwasData.GwasPopulationVariation-1.0"
    class GwasPopulation(tls.Unicode, TypeMeta):
        """GwasPopulation type"""
        info_text = "KBaseGwasData.GwasPopulation"
        class v1_0(tls.Unicode, TypeMeta):
            """GwasPopulation object stores metadata for each ecotype/germplasm in the population"""
            info_text = "KBaseGwasData.GwasPopulation-1.0"
    class GwasPopulationTrait(tls.Unicode, TypeMeta):
        """GwasPopulationTrait type"""
        info_text = "KBaseGwasData.GwasPopulationTrait"
        class v1_0(tls.Unicode, TypeMeta):
            """GwasPopulationTrait object contains trait details for one trait in a population"""
            info_text = "KBaseGwasData.GwasPopulationTrait-1.0"
    class GwasPopulationKinship(tls.Unicode, TypeMeta):
        """GwasPopulationKinship type"""
        info_text = "KBaseGwasData.GwasPopulationKinship"
        class v1_0(tls.Unicode, TypeMeta):
            """GwasPopulationKinship has population kinship matrix"""
            info_text = "KBaseGwasData.GwasPopulationKinship-1.0"
    class GwasTopVariations(tls.Unicode, TypeMeta):
        """GwasTopVariations type"""
        info_text = "KBaseGwasData.GwasTopVariations"
        class v1_0(tls.Unicode, TypeMeta):
            """List of significant snps and pvalues obtained after gwas analysis"""
            info_text = "KBaseGwasData.GwasTopVariations-1.0"

class KBaseBiochem(object):
    """KBaseBiochem module"""
    class Biochemistry(tls.Unicode, TypeMeta):
        """Biochemistry type"""
        info_text = "KBaseBiochem.Biochemistry"
        class v2_0(tls.Unicode, TypeMeta):
            """Biochemistry object"""
            info_text = "KBaseBiochem.Biochemistry-2.0"
    class Media(tls.Unicode, TypeMeta):
        """Media type"""
        info_text = "KBaseBiochem.Media"
        class v1_0(tls.Unicode, TypeMeta):
            """Media object"""
            info_text = "KBaseBiochem.Media-1.0"
    class BiochemistryStructures(tls.Unicode, TypeMeta):
        """BiochemistryStructures type"""
        info_text = "KBaseBiochem.BiochemistryStructures"
        class v1_0(tls.Unicode, TypeMeta):
            """BiochemistryStructures object"""
            info_text = "KBaseBiochem.BiochemistryStructures-1.0"

class KBaseNarrative(object):
    """KBaseNarrative module"""
    class Cell(tls.Unicode, TypeMeta):
        """Cell type"""
        info_text = "KBaseNarrative.Cell"
        class v2_0(tls.Unicode, TypeMeta):
            """Cell object"""
            info_text = "KBaseNarrative.Cell-2.0"
    class Worksheet(tls.Unicode, TypeMeta):
        """Worksheet type"""
        info_text = "KBaseNarrative.Worksheet"
        class v2_0(tls.Unicode, TypeMeta):
            """Worksheet object"""
            info_text = "KBaseNarrative.Worksheet-2.0"
    class Narrative(tls.Unicode, TypeMeta):
        """Narrative type"""
        info_text = "KBaseNarrative.Narrative"
        class v2_0(tls.Unicode, TypeMeta):
            """Narrative object"""
            info_text = "KBaseNarrative.Narrative-2.0"

class MAK(object):
    """MAK module"""
    class MAKParameters(tls.Unicode, TypeMeta):
        """MAKParameters type"""
        info_text = "MAK.MAKParameters"
        class v1_1(tls.Unicode, TypeMeta):
            """MAK algorithm and discovery strategy parameters"""
            info_text = "MAK.MAKParameters-1.1"
    class ExpressionDataSample(tls.Unicode, TypeMeta):
        """ExpressionDataSample type"""
        info_text = "MAK.ExpressionDataSample"
        class v1_0(tls.Unicode, TypeMeta):
            """ExpressionDataSample represents set of expression data"""
            info_text = "MAK.ExpressionDataSample-1.0"
    class ExpressionDataPoint(tls.Unicode, TypeMeta):
        """ExpressionDataPoint type"""
        info_text = "MAK.ExpressionDataPoint"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents a particular data point from gene expression data set"""
            info_text = "MAK.ExpressionDataPoint-1.0"
    class MAKResult(tls.Unicode, TypeMeta):
        """MAKResult type"""
        info_text = "MAK.MAKResult"
        class v2_1(tls.Unicode, TypeMeta):
            """Represents data from a single run of MAK"""
            info_text = "MAK.MAKResult-2.1"
    class MAKBicluster(tls.Unicode, TypeMeta):
        """MAKBicluster type"""
        info_text = "MAK.MAKBicluster"
        class v1_0(tls.Unicode, TypeMeta):
            """Bicluster"""
            info_text = "MAK.MAKBicluster-1.0"
    class ExpressionDataSeries(tls.Unicode, TypeMeta):
        """ExpressionDataSeries type"""
        info_text = "MAK.ExpressionDataSeries"
        class v1_0(tls.Unicode, TypeMeta):
            """ExpressionDataSeries represents collection of expression data samples"""
            info_text = "MAK.ExpressionDataSeries-1.0"
    class MAKBiclusterSet(tls.Unicode, TypeMeta):
        """MAKBiclusterSet type"""
        info_text = "MAK.MAKBiclusterSet"
        class v1_0(tls.Unicode, TypeMeta):
            """Bicluster set"""
            info_text = "MAK.MAKBiclusterSet-1.0"

class KBaseSequences(object):
    """KBaseSequences module"""
    class SequenceSet(tls.Unicode, TypeMeta):
        """SequenceSet type"""
        info_text = "KBaseSequences.SequenceSet"
        class v1_0(tls.Unicode, TypeMeta):
            """Represents set of sequences"""
            info_text = "KBaseSequences.SequenceSet-1.0"
#@AUTO_END


class Regenerator(object):
    """Regenerate self with AUTO section filled in.
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
        """Regenerate the file.
        """
        import tempfile
        types = self.get_types()
        if types is None:
            return 1
        ofile = tempfile.NamedTemporaryFile(delete=False)
        self._log.debug("output file name={}".format(ofile.name))
        if self._args.bfile:
            try:
                bfile = open(self._args.bfile, 'w')
            except IOError as err:
                self._log.critical("Cannot open backup file '{}': {}. Abort"
                                   .format(self.args.bfile, err))
                return -1
            self._log.debug("backup file name={}".format(bfile.name))
        else:
            bfile = None
        return self.write_output(ofile, bfile, types)

    def get_types(self):
        """Connect to workspace and retrieve type metadata.

        :return: None for failure, or type information, structured like:
           {
            ModuleName: {
              TypeName: {
                 Version1: {description: "text"},
                 Version2: {description: "text"},
                 etc.
              },
              <more types..>
            },
            <more modules..>
          }
        :rtype: dict or None
        """
        from util import Workspace2, WorkspaceException

        try:
            a = self._args
            ws = Workspace2(url=a.url, user_id=a.user, password=a.password)
            types = ws.types(strip_version=False, info_keys=['description'])
        except WorkspaceException:
            self._log.critical("Cannot connect to workspace at '{}'".format(a.url))
            return None

        # Group versions together under the type name,
        # so Python classes can do the same.
        for modname in types.keys():
            modtypes = {}
            for namever, info in types[modname].iteritems():
                name, ver = namever.split('-')
                if name in modtypes:
                    modtypes[name][ver] = info
                else:
                    modtypes[name] = {ver: info}
            types[modname] = modtypes

        return types

    def write_output(self, w, w2, types):
        import os
        # Open file(s)
        pfile = open(__file__, 'r')

        # Write Python statements to output.
        pre, post, where = [], [], -1
        for line in pfile:
            if w2:  # backup verbatim
                w2.write(line)
            if where == -1:
                w.write(line)
                if line.startswith('#@AUTO_BEGIN'):
                    where = 0
                    self.write_types(w, types)
            elif where == 0:
                if line.startswith("#@AUTO_END"):
                    w.write(line)
                    where = 1
            else:
                w.write(line)

        # Close output files
        w.close()
        if w2:
            w2.close()

        # Error if we didn't find the special section.
        if where != 1:
            self._log.critical("kbtypes module is missing @AUTO_{}"
                               .format(('END', 'BEGIN')[where == -1]))
            try:
                os.unlink(w.name)
            except OSError:
                pass
            return 1

        # Move newly created file on top of old one.
        mv_cmd = "/bin/mv {} {}".format(w.name, pfile.name)
        self._log.info("Update file with command: {}".format(mv_cmd))
        result = os.system(mv_cmd)
        if result != 0:
            self._log.critical("Could not update {}: Command '{}' failed: {}."
                               .format(pfile.name, mv_cmd, os.strerror(result)))
        return result

    def write_types(self, w, types):
        """Write out new type info.

        :param w: Output file
        :type w: file-like object
        :param types: Information to write, in format returned by :meth:`get_types`.
        :type types: dict or None
        """
        ind, parents = ' ' * 4, 'tls.Unicode, TypeMeta'
        # A class for each module
        for modname, typeinfo in types.iteritems():
            w.write("\nclass {c}(object):\n".format(c=modname))
            # add docstring to Sphinx autodoc will show it
            w.write('{i}"""{c} module"""\n'.format(i=ind, c=modname))
            # A nested class for each type
            for name, versions in typeinfo.iteritems():
                w.write("{i}class {c}({p}):\n".format(i=ind, c=name, p=parents))
                # add docstring to Sphinx autodoc will show it
                w.write('{i}{i}"""{c} type"""\n'.format(i=ind, c=name))
                w.write("{i}{i}info_text = \"{m}.{d}\"\n".format(i=ind, m=modname, d=name))
                # A nested class for each version of each type
                for ver, info in versions.iteritems():
                    typename = "{}-{}".format(name, ver)
                    pyver = "v" + ver.replace('.', '_')
                    desc = info['description'].strip()
                    first_line = desc.find('\n')
                    desc = desc[:first_line].strip() if first_line > 0 else desc
                    if not desc:
                        desc = "{} object".format(name)
                    w.write("{i}{i}class {c}({p}):\n".format(i=ind, c=pyver, p=parents))
                    w.write('{i}{i}{i}"""{d}"""\n'.format(i=ind, d=desc))
                    w.write("{i}{i}{i}info_text = \"{m}.{d}\"\n".format(i=ind, m=modname, d=typename))


def main():
    import argparse

    pr = argparse.ArgumentParser("Auto-generate types and update file contents")
    pr.add_argument("-b", "--backup", dest="bfile", metavar="FILE", help="Backup original file to FILE", default=None)
    pr.add_argument("-u", "--url", dest="url", help="WS url", default=None, required=True)
    pr.add_argument("-U", "--user", dest="user", help="auth user name", required=True)
    pr.add_argument("-P", "--password", dest="password", help="auth password", required=True)
    pr.add_argument("-v", "--verbose", dest="vb", action="count", default=0, help="Be more verbose")
    args = pr.parse_args()
    regen = Regenerator(args)
    return regen.run()

if __name__ == "__main__":
    import sys
    sys.exit(main())
