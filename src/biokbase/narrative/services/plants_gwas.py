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
import requests

# Service framework
from biokbase.narrative.common.service import init_service, method, finalize_service

# Other KBase
from biokbase.GWAS.Client import GWAS

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
    ujs = "http://140.221.85.171:7083"

# Initialize
init_service(name=NAME, desc="Plants GWAS service", version=VERSION)

@method(name="M_stands A_for F_something")
def maf(meth, maf=0.05, object_id=None):
    """DESCRIPTION NEEDED.

    :param maf: DESCRIPTION NEEDED
    :type maf: kbtypes.Numeric
    :param object_id: Workspace object ID for DESCRIPTION NEEDED
    :type object_id: kbtypes.Unicode
    :return: Number of jobs that were run
    :rtype: kbtypes.Numeric
    """
    meth.stages = 3

    meth.advance("init GWAS service")
    gc = GWAS(URLS.gwas, token=meth.token)

    meth.advance("submit job to filter VCF")
    jid = gc.filter_vcf(maf, meth.workspace_id, object_id)
    if not jid:
        meth.error("submit job failed")
        return 0

    meth.advance("run VCF")
    completed, njobs = 0, _job_count(jid)
    meth.stages += njobs
    while completed < njobs:
        time.sleep(5)
        remaining = _job_count(jid)
        while completed < (njobs - remaining):
            completed += 1
            meth.advance("VCF: {:d}/{:d} jobs completed".format(completed, njobs))
    return njobs


def _job_count(id_):
    """Get count of jobs remaining in AWE.
    """
    url = "%s/job/%s" % (URLS.awe, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    remain_tasks = response.get("data", dict()).get("remaintasks")
    return remain_tasks

# Finalize (registers service)
finalize_service()
