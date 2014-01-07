"""
Plants GWAS service.

Step1:
Upload Population Variation Data   (Ranjan,
 Shinjae, Shiran)

 For smaller datasets: User
 uploads variation data using Narrative upload button in the browser.

 For larger datasets: Upload
 the variation data to kbase cloud. My data lies on JGI (NERSC) machine. Since the file size (200 G) is too big to be uploaded using a browser, I upload the data to the shock data store. It has a very simple way to upload the data to shock. I login to the nersc
 machine and upload the merged vcf file using the curl command. I remember the shock id of the uploaded file.

 curl
 -X POST [ -F "attributes=@<path_to_json>" ( -F "upload=@<path_to_data_file>" || -F "path=<path_to_file>") ] http://<host>[:<port>]/node

 The file upload took 4 hours and the returned shock id was xxxxxxxxxxxxx



 Step2:
Filter Population variation data
  (Ranjan)

For  all of my future analysis, I only want to work with those variations with
a minor allele frequency more than 1%.  So I need to filter out all those
variations that have minor allele frequency less than 1%. This function
filters the vcf file on the hadoop cluster,  pushes the filtered file to shock
and creates a new variation type object with the command that I used to
generate this new object.


 Step3:Calculate
 Populations structure (Ranjan)

For  Genome wide association analysis, I need a Population structure file
which can be calculated from the variation data.


 Step4:Upload
 Trait/Phenotype data (Ranjan)

Now  I have taken care of variation data and Population structure data. This
is just a one time analysis and would be used for all the association analysis
and candidate gene discovery I will be doing in future for trait datasets. So
now I upload the sugar release  trait data. It is a small tab delimited file.
I create an object of the type trait. I will use the widget to enter the
metadata related to the trait.

 Step5:Run
 Genome wide association analysis ( Ranjan)

Now  I run the GWAS workflow and provide it the id of the objects I just
created. The GWAS object has list of significant SNPs, pvalue, rank and FDR.

 Step6:Visualize
 significant SNPs (Shiran, Mustafa)
Now
 I want to visualize the distribution of snps and pvalues on a manhattan plot where the x-axis has the chromosome and position and y-axis has the -log pvalue.

 The
 plot looks interesting. There are peaks on chromosome 5, 6 and 14. So the genes of interest should lie in those regions.

 Step7:Identify
 genes close to the SNPs (Mustafa, Ranjan)

I  would like a gene list and so I use the command variations_to_genes. I want
to filter by pvalue and I want to look 5 kb around the snp for any gene.


 Theregioncontains70genes.Thatisabiglistofgenestoworkwith.Iwanttoprioritizemyc
 andidategenelist.IwanttouseothertoolsinKBaseandexplorethatletmenarrowdonethis
 genelistandhelpmeidentifythebestsetofgenestoworkwith.

 Step8:Functional
 annotation of genes (Sunita, Shinjae, Shiran objects)

I  want to look at the functional information for these 70 genes as well as
gene ontology, pathways and pfam domains. Some of the genes related to cell
wall look interesting. It would be interesting to see the expression profile
of these and other genes.

 Step9:Expression
 profile of genes (Sunita, Vidya, Shinjae objects)

I  want to look at the expression profile of these genes. I would select an
experiment in poplar where researchers have done expression profiling in root,
shoot, leaf, xylem, catkin, internode etc.

 10 ofthesegeneshaveveryhighexpressioninxylemascomparedtoothertissues.Lookspro
 mising.Twoofthemalsohavepfamdomainsrelatedtocellwall.Oneofthemisanunknownprot
 ein.NowIhaveamanageablegenelisttoworkwith.

 How  researchers can use this: Now   I will go back to my lab and knock down
these genes or overexpress them and report the results back.



 Other things we can do

 1. Population statistics
2. Functional SNP prediction
3. Co-expression network analysis on gene set
4. Gene ontology enrichment of output gene
 set
5. Functional annotation of novel proteins
6. Pathway analysis of output gene set
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '12/12/13'

## Imports

# Stdlib
import json
import time

# Third party
import requests

# Service framework
from biokbase.narrative.common.service import init_service, method, finalize_service

# Other KBase
from biokbase.GWAS.Client import GWAS
from biokbase.GWAS1.Client import GWAS1

## Exceptions


class GWASException(Exception):
    pass

## Globals

VERSION = (0, 0, 1)
NAME = "GWAS"


class URLS:
    _host = '140.221.84.248'
    main = "http://{40.221.84.236:8000/node"
    shock = "http://140.221.84.236:8000"
    awe = "http://140.221.85.171:7080"
    expression = "http://{}:7075".format(_host)
    workspace = "http://kbase.us/services/workspace"
    ids = "http://kbase.us/services/idserver"
    cdmi = "http://kbase.us/services/cdmi_api"
    ontology = "http://kbase.us/services/ontology_service"
    gwas = "http://140.221.85.171:7086"
    gwas1 = "http://140.221.85.95:7086"
    ujs = "http://140.221.85.171:7083"

# Initialize
init_service(name=NAME, desc="Plants GWAS service", version=VERSION)

@method(name="Filter Minor Allele Frequencies")
def filter_maf(meth, maf=0.05, vd_oid=None):
    """Filter out all those variations that have minor allele frequency 
    less than the given quantity.

    :param maf: Minimum Minor Allele Frequency (MAF)
    :type maf: kbtypes.Numeric
    :param vd_oid: Target workspace object ID for the population data.
    :type vd_oid: kbtypes.WorkspaceObjectId
    :return: Workspace object ID for the variation data
    :rtype: kbtypes.WorkspaceObjectId
    """
    meth.debug("starting function")
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("submit job to filter VCF file")
    try:
        jid = gc.filter_vcf(meth.workspace_id, vd_oid, maf)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    meth.advance("running job to filter VCF file")
    completed, njobs = 0, _job_count(jid)
    meth.stages += njobs
    while completed < njobs:
        meth.debug("sleeping 5 sec in wait-for-jobs loop")
        time.sleep(5)
        remaining = _job_count(jid)
        while completed < (njobs - remaining):
            completed += 1
            meth.advance("job to filter VCF file: {:d}/{:d} tasks completed".format(completed, njobs))
    return vd_oid


def _job_count(id_):
    """Get count of jobs remaining in AWE.
    """
    url = "%s/job/%s" % (URLS.awe, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    remain_tasks = response.get("data", dict()).get("remaintasks")
    return remain_tasks

@method(name="Population structure")
def pop_struct(meth, vd_oid=None):
    """Create new population structure file from the 
    population variation data.

    :param vd_oid: Workspace object ID specifying the population data.
    :type vd_oid: kbtypes.WorkspaceObjectId
    :return: Workspace object ID specifying the population structure file.
    :rtype: kbtypes.WorkspaceObjectId
    """
    # XXX: What parameters are needed?
    # XXX: What gets executed and returned?
    meth.debug("starting function")
    meth.stages = 1
    meth.advance("doing something..")
    return "fake_pop_struct_id"

@method(name="Sugar release trait")
def create_trait(meth, p1=None):
    """Create an object for a sugar release trait.

    :param p1: Dummy parameter
    :type p1: kbtypes.Unicode
    :return: Workspace ID of the new trait object
    :rtype: kbtypes.WorkspaceObjectId
    """
    # XXX: What parameters are needed?
    # XXX: What gets executed and returned?
    meth.debug("starting function")
    meth.stages = 1
    meth.advance("doing something..")
    return "fake_trait_id"

@method(name="Run GWAS")
def run_gwas(meth, ps_oid=None, trait_oid=None):
    """Run genome-wide association study (GWAS) workflow, creating a
    GWAS object that has a list of significant SNPs, pvalue, rank and FDR.

    :param ps_oid: Workspace ID of population structure object
    :type ps_oid: kbtypes.WorkspaceObjectId
    :param trait_oid: Workspace ID of trait object
    :type trait_oid: kbtypes.WorkspaceObjectId
    :return: Workspace ID of GWAS object
    :rtype: kbtypes.WorkspaceObjectId
    """
    # XXX: What parameters are needed?
    # XXX: What gets executed and returned?
    meth.debug("starting function")
    meth.stages = 1
    meth.advance("doing something..")
    return "fake_gwas_id"

@method(name="Gene list")
def gene_list(meth, pvalue=None, snp_dist=5000):
    """Call 'variations_to_genes' to get a gene list, and filter by
    the given p-value and look 'snp_dist' around the SNP for any gene.

    :param pvalue: p-value
    :type pvalue: kbtypes.Numeric
    :param snp_dist: SNP distance
    :type snp_dist: kbtypes.Numeric
    :return: Workspace ID of a list of genes
    :rtype: kbtypes.WorkspaceObjectId
    """
    # XXX: What (other) parameters are needed?
    # XXX: What gets executed and returned?
    meth.debug("starting function")
    meth.stages = 1
    meth.advance("doing something..")
    return "fake_gene_list_id"

@method(name="Trait Manhattan Plot")
def trait_manhattan_plot(meth, workspaceID=None, gwasObjectID=None):
    """
    Visualize significant SNPs from GWAS study on the manhattan plot. On the X-axis of the plot are all contigs, and on the Y-axis is pvalue of SNPs-association for the trait.

    :param workspaceID: workspaceID
    :type workspaceID: kbtypes.Unicode
    :param gwasObjectID: gwas result objectID
    :type gwasObjectID: kbtypes.Unicode
    :return: Workspace objectID of gwas results
    :rtype: kbtypes.Unicode
    :output_widget: Manhattan
    """
    meth.debug("starting function")
    meth.stages = 1
    meth.advance("doing something..")
    token = meth.token
    return json.dumps({ 'token': token, 'workspaceID' : workspaceID, 'gwasObjectID' : gwasObjectID })

@method(name="GWAS Variation To Genes")
def gwas_variations_to_genes(meth, workspaceID=None, gwasObjectID=None, pmin=2, distance=1000):
    """
    Get 

    :param workspaceID: workspaceID
    :type workspaceID: kbtypes.Unicode
    :param gwasObjectID: gwas result objectID
    :type gwasObjectID: kbtypes.Unicode
    :param pmin: minimum pvalue (-log10)
    :type gwasObjectID: kbtypes.Numeric
    :param distance: distance in bp around SNP to look for genes 
    :type gwasObjectID: kbtypes.Numeric
    :return: Workspace objectID of gwas results
    :rtype: kbtypes.Unicode
    """
    meth.debug("starting function")
    meth.stages = 1

    meth.advance("init GWAS service")
    gc = GWAS1(URLS.gwas1, token=meth.token)

    try:
        gl_oid = gc.gwas_variation_to_genes(meth.workspace_id, vd_oid, pmin, distance)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    meth.stages += 1
    return gl_oid



# Finalize (registers service)
finalize_service()
