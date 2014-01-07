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
For
 all of my future analysis, I only want to work with those variations with a minor allele frequency more than 1%. So I need to filter out all those variations that have minor allele frequency less than 1%. This function filters the vcf file on the hadoop cluster,
 pushes the filtered file to shock and creates a new variation type object with the command that I used to generate this new object.


 Step3:Calculate
 Populations structure (Ranjan)
For
 Genome wide association analysis, I need a Population structure file which can be calculated from the variation data.


 Step4:Upload
 Trait/Phenotype data (Ranjan)
Now
 I have taken care of variation data and Population structure data. This is just a one time analysis and would be used for all the association analysis and candidate gene discovery I will be doing in future for trait datasets. So now I upload the sugar release
 trait data. It is a small tab delimited file. I create an object of the type trait. I will use the widget to enter the metadata related to the trait.

 Step5:Run
 Genome wide association analysis ( Ranjan)
Now
 I run the GWAS workflow and provide it the id of the objects I just created. The GWAS object has list of significant SNPs, pvalue, rank and FDR.

 Step6:Visualize
 significant SNPs (Shiran)
Now
 I want to visualize the distribution of snps and pvalues on a manhattan plot where the x-axis has the chromosome and position and y-axis has the -log pvalue.

 The
 plot looks interesting. There are peaks on chromosome 5, 6 and 14. So the genes of interest should lie in those regions.

 Step7:Identify
 genes close to the SNPs (Ranjan need to be modified for  workspace)
I
 would like a gene list and so I use the command variations_to_genes. I want to filter by pvalue and I want to look 5 kb around the snp for any gene.


 The
 region contains  70 genes. That is a big list of genes to work with. I want to prioritize my candidate gene list. I want to use other tools in KBase and explore that let me narrow done this gene list and help me identify the best set of genes to work with.

 Step8:Functional
 annotation of genes (Sunita, Shinjae, Shiran objects)
I
 want to look at the functional information for these 70 genes as well as gene ontology, pathways and pfam domains. Some of the genes related to cell wall look interesting. It would be interesting to see the expression profile of these and other genes.

 Step9:Expression
 profile of genes (Sunita, Vidya, Shinjae objects)
I
 want to look at the expression profile of these genes. I would select an experiment in poplar where researchers have done expression profiling in root, shoot, leaf, xylem, catkin, internode etc.

 10
 of these genes have very high expression in xylem as compared to other tissues. Looks promising. Two of them also have pfam domains related to cell wall. One of them is an unknown protein. Now I have a manageable gene list to work with.

 How
 researchers can use this:
Now
  I will go back to my lab and knock down these genes or overexpress them and report the results back.



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

# Service framework
from biokbase.narrative.common.service import init_service, method, finalize_service
from IPython.display import display, HTML
# Other KBase
from biokbase.GWAS.Client import GWAS
from biokbase.GWAS1.Client import GWAS1

from biokbase.narrative.common.kbutil import AweJob

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

AweJob.URL = URLS.awe

# Initialize
init_service(name=NAME, desc="Plants GWAS service", version=VERSION)


def _output_object(name):
    """Format an object ID as JSON output, for returning from a narr. function.
    """
    return json.dumps({'output': name})


@method(name="Create Gwas Population object")
def gwas_create_population_object(meth, GwasPopulation_file_id=None, output_population_object_name=None,
                                  GwasPopulation_description=None, kbase_genome_id=None, comment=None):
    """Create Gwas Population object from an uploaded Population file in the workspace.

    :param GwasPopulation_file_id:workspace_object_id of the uploaded Population file
    :type GwasPopulation_file_id: kbtypes.WorkspaceObjectId
    :param output_population_object_name:population id that will appear in workspace  
    :type output_population_object_name:kbtypes.WorkspaceObjectId
    :param GwasPopulation_description:A brief description of the population  
    :type GwasPopulation_description:kbtypes.Unicode
    :param kbase_genome_id: kbase genome id of the genome  
    :type kbase_genome_id:kbtypes.Genome
    :param comment: Comment 
    :type comment:kbtypes.Unicode
    :return: Number of jobs that were run
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("creating Population object")
    try:
        jid = gc.gwas_create_population_object(meth.workspace_id, GwasPopulation_file_id, output_population_object_name,
                                               GwasPopulation_description, kbase_genome_id,comment )
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob(meth, started="creating Population object", running="create Population object").run(jid[0])
    return _output_object('GwasPopulation_' + output_population_object_name)


@method(name="Create Gwas Population Trait object")
def gwas_create_population_trait_object(meth, GwasPopulation_obj_id=None, population_trait_file_id=None, protocol=None,
                                        comment=None, originator=None, output_trait_object_name=None,
                                        kbase_genome_id=None, trait_ontology_id=None, trait_name=None,
                                        unit_of_measure=None):
    """DESCRIPTION NEEDED.

    :param GwasPopulation_obj_id:Object id of the population data
    :type GwasPopulation_obj_id:kbtypes.WorkspaceObjectId
    :param population_trait_file_id:File id of uploaded trait file
    :type population_trait_file_id:kbtypes.WorkspaceObjectId
    :param protocol:A brief description of the experimental protocol used for measuring the trait  
    :type protocol:kbtypes.Unicode
    :param comment: Comment 
    :type comment:kbtypes.Unicode
    :param originator:Name of lab or PI  
    :type originator:kbtypes.Unicode
    :param output_trait_object_name:object_id that will appear in workspace  
    :type output_trait_object_name:kbtypes.WorkspaceObjectId
    :param kbase_genome_id: kbase genome id of the genome  
    :type kbase_genome_id:kbtypes.Genome
    :param trait_ontology_id: Trait ontology id
    :type trait_ontology_id:kbtypes.Unicode
    :param trait_name:Brief name of trait
    :type trait_name:kbtypes.Unicode
    :param unit_of_measure:Unit of measurement of trait
    :type unit_of_measure:kbtypes.Unicode
    :return: Number of jobs that were run
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("creating population trait oject")
    try:
        jid = gc.gwas_create_population_trait_object(meth.workspace_id, GwasPopulation_obj_id, population_trait_file_id, protocol, comment, originator, output_trait_object_name, kbase_genome_id, trait_ontology_id, trait_name, unit_of_measure)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob(meth, started="creating Population trait object", running="create Population trait object").run(jid[0])
    return _output_object('Trait_' + output_trait_object_name)


@method(name="Create GWAS Variation object")
def gwas_create_population_variation_object(meth,population_variation_file_shock_url=None, population_variation_file_shock_id=None, GwasPopulation_obj_id=None, assay=None, filetype=None,comment=None,  originator=None, output_variation_object_name=None, kbase_genome_id=None):
    """Create the GWAS variation object

    :param population_variation_file_shock_url:Shock URL  of the population variation file 140.221.84.236:8000 
    :type population_variation_file_shock_url: kbtypes.Unicode
    :param population_variation_file_shock_id:Shock id of the population variation file 6ae1267f-ba2d-4e7b-9c10-72eb137e8633
    :type population_variation_file_shock_id: kbtypes.Unicode
    :param GwasPopulation_obj_id:Object id of the population data with latitude, longitude etc.
    :type GwasPopulation_obj_id: kbtypes.WorkspaceObjectId
    :param assay:Assay used for genotyping (eg. short read sequencing, SNP array)  
    :type assay:kbtypes.Unicode
    :param filetype:type of file (eg. VCF). Only VCF currently supported  
    :type filetype:kbtypes.Unicode
    :param comment: Comment 
    :type comment:kbtypes.Unicode
    :param originator:Name of lab or PI  
    :type originator:kbtypes.Unicode
    :param output_variation_object_name:object_id that will appear in workspace  
    :type output_variation_object_name:kbtypes.WorkspaceObjectId
    :param kbase_genome_id: kbase genome id of the genome  
    :type kbase_genome_id:kbtypes.Genome
    :return: Number of jobs that were run
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("creating population variation oject")
    try:
        jid = gc.gwas_create_population_variation_object(meth.workspace_id,population_variation_file_shock_url, population_variation_file_shock_id, GwasPopulation_obj_id, assay, filetype, comment, originator, output_variation_object_name, kbase_genome_id )
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob(meth, started="creating Population variation object", running="create Population variation object").run(jid[0])
    return _output_object('Variation_' + output_variation_object_name)


@method(name="VCF-Filtering")
def maf(meth, maf=0.05, object_id=None):
    """DESCRIPTION NEEDED.

    :param maf: Minor allele frequency
    :type maf: kbtypes.Numeric
    :param object_id: Workspace object ID for DESCRIPTION NEEDED
    :type object_id: kbtypes.WorkspaceObjectId
    :return: Number of jobs that were run
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("submit job to filter VCF")
    try:
        jid = gc.filter_vcf(meth.workspace_id, object_id, maf)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob(meth, started="run VCF", running="VCF").run(jid[0])
    return _output_object(object_id + '-filter-' + maf)


@method(name="Calculate Kinship matrix")
def gwas_run_kinship(meth,  object_id=None):
    """DESCRIPTION NEEDED.

    :param object_id: Workspace object ID for the main vcf file
    :type object_id: kbtypes.WorkspaceObjectId
    :return: Number of jobs that were run
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("submit job to select_random_snps")
    try:
        jid = gc.gwas_run_kinship(meth.workspace_id, object_id )
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob(meth, started="Calculate Kinship matrix", running="Kinship matrix").run(jid[0])
    return _output_object(object_id + 'kinship-matrix')


@method(name="Run GWAS analysis MLM")
def gwas_run_gwas2(meth,  genotype_obj_id=None,  kinship_obj_id=None, trait_obj_id=None, pvalue_cutoff=None):
    """DESCRIPTION NEEDED.

   :param genotype_obj_id: Population variation object id
   :type genotype_obj_id: kbtypes.WorkspaceObjectId
   :param kinship_obj_id: kinship matrix object id
   :type kinship_obj_id: kbtypes.WorkspaceObjectId
   :param trait_obj_id: Trait object id
   :type trait_obj_id: kbtypes.WorkspaceObjectId
   :param pvalue_cutoff: Trait object id
   :type pvalue_cutoff: kbtypes.Numeric
   :return: Number of jobs that were run
   :rtype: kbtypes.Unicode
    """
    meth.stages = 3
    
    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("submit job to run GWAS analysis")
    try:
        jid = gc.gwas_run_gwas2(meth.workspace_id,  genotype_obj_id,  kinship_obj_id, trait_obj_id, pvalue_cutoff)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob(meth, started="GWAS analysis using tassel", running="GWAS analysis using tassel").run(jid[0])
    return _output_object('TopVariations' + trait_obj_id + pvalue_cutoff)


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
    meth.stages = 1
    meth.advance("Manhattan plot")
    token = meth.token
    return json.dumps({'token': token, 'workspaceID' : workspaceID, 'gwasObjectID': gwasObjectID })



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
