"""
This a conversion of Ranjan Priya's coex_network script into Python 2.7+

Authors:
    Steve Chan <sychan@lbl.gov>
    Dan Gunter <dkgunter@lbl.gov>
"""
__version__ = '0.1'

## Imports

# system
import json
import logging
from string import Template
import sys
import time
import uuid
# third-party
import requests

## Configure logging

_log = logging.getLogger("coex_network")
_log.setLevel(logging.DEBUG)
_h = logging.StreamHandler()
_h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
_log.addHandler(_h)

## Exception classes


class UploadException(Exception):
    pass


class SubmitException(Exception):
    pass


## Functions

def join_stripped(iterable):
    return ''.join((s.strip() for s in iterable))


def upload_file(uri, filename, att_content):
    file_contents = join_stripped(open(filename))
    data = {'upload': (filename, file_contents),
            'attributes': ('', att_content)}
    #_log.debug("upload.request data={}".format(data))
    r = requests.post("%s/node" % uri, files=data)
    response = json.loads(r.text)
    if response['data'] is None:
        raise UploadException("Response from upload has no data: {}".format(response))
    _log.debug("Response.json={}".format(response))
    try:
        return response['data']['id']
    except Exception as err:
        raise UploadException("Problem with parsing response from upload: {}".format(err))
    

def check_job_status(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    remain_tasks = response.get("data",dict()).get("remaintasks")
    return remain_tasks


def get_url_visualization(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    try:
        merged_csv_node = response["data"]["tasks"][3]["outputs"]["merged_list_json"]["node"]
    except Exception,e:
        raise Exception("Could not parse out merged_csv_node: %s" % e)
    url_viz = "http://140.221.85.95/gvisualize/%s" % merged_csv_node
    return url_viz


def get_output_files(uri, id_):
    url = "%s/job/%s" % (uri, id_)
    r = requests.get(url)
    response = json.loads(r.text)
    download_urls = []
    try:
        download_urls.append("data_filtered_csv: %s" %
                              response["data"]["tasks"][0]["outputs"]["data_filtered_csv"]["url"])
        download_urls.append("net_edge_csv: %s" %
                              response["data"]["tasks"][1]["outputs"]["net_edge_csv"]["url"])
        download_urls.append("module_csv: %s" %
                              response["data"]["tasks"][2]["outputs"]["module_csv"]["url"])
    except Exception, e:
        raise Exception("Parsing results: %s" % e)
    return download_urls


def submit_awe_job(uri, awe_job_document):
    _log.debug("Processed document:\n{}".format(awe_job_document))
    content = {'upload': ("awe_job", awe_job_document)}
    r = requests.post("{}/job".format(uri), files=content)
    response = json.loads(r.text)
    if response['data'] is None:
        raise SubmitException("Response from job submit has no data: {}".format(response))
    try:
        return(response['data']['id'])
    except Exception as e:
        raise SubmitException("Parsing response from job submit: {}".format(e))

## Global (configuration) variables

# Server URLs


class URLS:
    main = "http://140.221.84.236:8000/node"
    shock = "http://140.221.84.236:8000"
    awe = "http://140.221.84.236:8001/"

sessionID = str(uuid.uuid4())

# File types, names, and descriptions

files = {"expression": "Expression_Table.csv",
         "sample_id": "Sample_id.csv",
         "annotation": "Gene_Annotation.csv"}
files_desc = dict(expression="Expression data",
                  sample_id="Sample file",
                  annotation="Annotation file")

# Create metadata for each file type

metadata = {}
for file_type, file_name in files.iteritems():
    metadata[file_type] = {
        "pipeline": "coexpression network",
        "file_name": file_name,
        "file_type": "expression_file",
        "description": files_desc[file_type],
        "sessionID": sessionID
    }

coex_args = dict(
    coex_filter="-m anova -p 0.05 -u n -r y -d y",
    coex_net="-m simple -t edge -c 0.75 -r 0.8 -k 40 -p 50",
    coex_cluster2="-s 20 -c hclust -n simple -r 0.8 -k 40 -p 50 -d 0.99")

## MAIN ##

def main():
    """Create a narrative for co-expression network workflow

    1. User uploads multiple files to shock and remembers shock node IDs
    2. An AWE job script is created
    3. Job is submitted to awe service
    4. Node ids of output files are provided
    """
    _log.info("Uploading files to shock")
    shock_ids = {}
    for file_type, file_name in files.iteritems():
        _log.info("Uploading to {} :: {} = {}".format(URLS.shock, file_type, file_name))
        file_meta = str(metadata[file_type])
        shock_ids[file_type] = upload_file(URLS.shock, file_name, file_meta)
    _log.debug("Uploaded to shock. ids = {}".format(','.join(shock_ids.values())))

    # Read & substitute values into job spec
    awe_job = json.load(open("awe_job.json"))
    subst = shock_ids.copy()
    subst.update(coex_args)
    subst.update(dict(shock_uri=URLS.shock, session_id=sessionID))
    awe_job_str = Template(json.dumps(awe_job)).substitute(subst)

    # Submit job
    job_id = submit_awe_job(URLS.awe, awe_job_str)

    # Wait for job to complete
    _log.info("job.begin")
    while 1:
        time.sleep(5)
        count = check_job_status(URLS.awe, job_id)
        if count == 0:
            break
        _log.debug("job.run tasks_remaining={:d}".format(count))
    _log.info("job.end")

    #XXX: Never get past this point

    print("\n##############################\nDownload and visualize network output\n")

    print("\nURLs to download output files\n")
    download_urls = get_output_files(URLS.awe, job_id)
    print('\n'.join(['\t\t' + s for s in download_urls]))

    print("URL to visualize the network\n")
    viz_urls = get_url_visualization(URLS.awe, job_id)
    print('\n'.join(['\t\t' + s for s in viz_urls]))

    return 0

if __name__ == '__main__':
    sys.exit(main())
