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
 significant SNPs (Mustafa, Shiran)
Now
 I want to visualize the distribution of snps and pvalues on a manhattan plot where the x-axis has the chromosome and position and y-axis has the -log pvalue.

 The
 plot looks interesting. There are peaks on chromosome 5, 6 and 14. So the genes of interest should lie in those regions.

 Step7:Identify
 genes close to the SNPs (Mustafa, Ranjan)
I
 would like a gene list and so I use the command variations_to_genes. I want to filter by pvalue and I want to look 5 kb around the snp for any gene.


 The
 region contains  70 genes. That is a big list of genes to work with. I want to prioritize my candidate gene list. I want to use other tools in KBase and explore that let me narrow done this gene list and help me identify the best set of genes to work with.

 Step8:Functional
 annotation of genes (Sunita, Shinjae, Mustafa, Shiran objects)
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
from biokbase.narrative.common.util import AweJob, Workspace2


## Exceptions


class GWASException(Exception):
    pass

## Globals

VERSION = (0, 0, 1)
NAME = "GWAS Services"


class URLS:
    _host = '140.221.84.248'
    main = "http://{40.221.84.236:8000/node"
    shock = "http://140.221.84.236:8000"
    awe = "http://140.221.85.171:7080"
    expression = "http://{}:7075".format(_host)
    #workspace = "https://kbase.us/services/ws/"
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


@method(name="SNP-Filtering")
def maf(meth, maf=0.05, object_id=None):
    """Perform filtering on Minor allele frequency (MAF).
    Minor allele frequency (MAF) refers to the frequency at which the least common
    <a href="http://en.wikipedia.org/wiki/Allele">allele</a> occurs in a given population.

    :param maf: Minor allele frequency
    :type maf: kbtypes.Numeric
    :param object_id: Workspace object id of type GWASPopulationVariation
    :type object_id: kbtypes.WorkspaceObjectId
    :return: Workspace ID of filtered data
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("submit job to filter SNPs")
    try:
        jid = gc.filter_vcf(meth.workspace_id, object_id, maf)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not jid:
        raise GWASException(2, "submit job failed, no job id")

    AweJob(meth, started="Filter SNPs", running="Filtering SNPs").run(jid[0])
    return _output_object(object_id + '-filter-' + maf)


@method(name="Calculate Kinship matrix")
def gwas_run_kinship(meth,  object_id=None):
    """Computes the n by n kinship matrix for a set of n related subjects.
        The kinship matrix defines pairwise genetic relatedness among individuals and is estimated by using all genotyped markers.
        This requires the filtered SNPs as input.

    :param object_id: Workspace object ID for the filtered SNPs
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
    """Computes association between each SNP and a trait of interest that has been scored across a large number of individuals. This method takes Filtered SNP object, kinship matrix, trait object, p-value cutoff as input and computes association using mixed linear model as implemented in <a href='http://www.maizegenetics.net/'>TASSEL</a>

   :param genotype_obj_id: Workspace object id for the filtered SNPs
   :type genotype_obj_id: kbtypes.WorkspaceObjectId
   :param kinship_obj_id: Workspace object id for kinship matrix
   :type kinship_obj_id: kbtypes.WorkspaceObjectId
   :param trait_obj_id: Workspace object id for trait
   :type trait_obj_id: kbtypes.WorkspaceObjectId
   :param pvalue_cutoff: p-value cutoff
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
    return _output_object('TopVariations' + trait_obj_id + '-' + pvalue_cutoff)


@method(name="Manhattan Plot Widget")
def trait_manhattan_plot(meth, workspace_id=None, gwasObjectID=None):
    """Widget to visualize top SNPs related to a trait on the manhattan plot. On the X-axis of the plot are all contigs, and on the Y-axis is -log10(pvalue) of SNPs-association for the trait.

    :param workspaceID: workspace_id of SNPs (TopVariations) object
    :type workspaceID: kbtypes.Unicode
    :param gwasObjectID: Workspace object id of type TopVariations (Output of GWAS step)
    :type gwasObjectID: kbtypes.Unicode
    :return: Workspace objectID of gwas results
    :rtype: kbtypes.Unicode
    :output_widget: Manhattan
    """
    meth.stages = 1
    meth.advance("Manhattan plot")
    token = meth.token
    if not workspace_id:
        meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
        workspace_id = meth.workspace_id

    return json.dumps({'token': token, 'workspaceID': workspace_id, 'gwasObjectID': gwasObjectID })


@method(name="GWAS SNPs To Genes")
def gwas_variation_to_genes(meth, workspace_id=None, gwasObjectID=None, pmin=None, distance=None):
    """This method takes the top SNPs obtained after GWAS analysis as input (TopVariations) object, -log (pvalue) cutoff and a distance parameter as input. For each significant SNP that passes the p-value cutoff, genes are searched in the window specified by the distance parameter

    :param workspace_id: workspace name (if empty, defaults to current workspace)
    :type workspace_id: kbtypes.Unicode
    :param gwasObjectID: TopVariations object id with SNPs
    :type gwasObjectID: kbtypes.Unicode
    :param pmin: minimum pvalue (-log10)
    :type pmin: kbtypes.Numeric
    :param distance: distance in base pairs around SNP to look for genes
    :type distance: kbtypes.Numeric
    :return: Workspace objectID of gwas results
    :rtype: kbtypes.Unicode
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)
    meth.advance("SNPs to Genes")
    if not workspace_id:
        meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
        workspace_id = meth.workspace_id
    
    try:
        gl_oid = gc.gwas_variation_to_genes(workspace_id, gwasObjectID, pmin, distance)
    except Exception as err:
        raise GWASException("submit job failed: {}".format(err))
    if not gl_oid:
        raise GWASException(2, "submit job failed, no job id")

    meth.advance("Creating object")
    h= 'Genelist.' + gwasObjectID + '-' + pmin
    return json.dumps({ 'output':  h })



GENE_TABLE_OBJECT_TYPE = "KBaseGwasData.GwasGeneList"
@method(name="Gene table Widget")
def gene_table(meth, workspace_id=None, obj_id=None):
    """This method takes GWASGeneList type object as input and displays gene list along with functional annotation in a table.

    :param workspace_id: Workspace name (if empty, defaults to current workspace)
    :type workspace_id: kbtypes.Unicode
    :param obj_id: Gene's workspace object identifier.
    :type obj_id: kbtypes.Unicode
    :return: Rows for display
    :rtype: kbtypes.Unicode
    :output_widget: GeneTableWidget
    """
    meth.stages = 1
    meth.advance("Retrieve gene from workspace")
    if not workspace_id:
        meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
        workspace_id = meth.workspace_id
    ws = Workspace2(token=meth.token, wsid=workspace_id)
    raw_data = ws.get(obj_id)     #, objtype=GENE_TABLE_OBJECT_TYPE, instance=0)
    genes = raw_data['data']['genes']
    header = ["Chromosome ID", "Source gene ID", "Gene ID", "Gene function"]
    data = {'table': [header] + genes}
    return json.dumps(data)

GENE_NETWORK_OBJECT_TYPE = "KBaseGwasData.GwasGeneList"

@method(name="Gene network Widget")
def gene_network(meth, workspace_id=None, obj_id=None):
    """This method takes GWASGeneList type object as input, searches KBase indexed co-expression networks where these genes are present and builds internal networks formed by genes in the gene list.
        
    :param workspace_id: Workspace name (if empty, defaults to current workspace)
    :type workspace_id: kbtypes.Unicode
    :param obj_id: Gene List workspace object identifier.
    :type obj_id: kbtypes.Unicode
    :return: Rows for display
    :rtype: kbtypes.Unicode
    :output_widget: kbasePlantsNetworkNarrative
    """
    meth.stages = 1
    meth.advance("Retrieve gene from workspace")
    if not workspace_id:
        meth.debug("Workspace ID is empty, setting to current ({})".format(meth.workspace_id))
        workspace_id = meth.workspace_id
    ws = Workspace2(token=meth.token, wsid=workspace_id)
    raw_data = ws.get(obj_id) #, objtype=GENE_TABLE_OBJECT_TYPE, instance=0)
    data = {'input': raw_data}
    return json.dumps(data)



# Finalize (registers service)
finalize_service()
