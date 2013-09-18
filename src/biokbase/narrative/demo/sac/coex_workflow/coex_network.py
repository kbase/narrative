"""

   This a conversion of Ranjan Priya's coex_network script into Python 2.7+

   sychan@lbl.gov
    dkgunter@lbl.gov
"""
# system
import json
import logging
import pprint
import sys
import time
# third-party
import requests

## configure logging
_log = logging.getLogger("coex_network")
_log.setLevel(logging.DEBUG)
_log.addHandler(logging.StreamHandler())

class UploadException(Exception): pass


"""
sub upload_file {
	my ($uri, $filename, $att_content) = @_;
	open (FH,$filename) || die "Could not find $filename";
	my @lines = <FH>;
	close FH;
	my $file_contents = join('',@lines);
	my $json = new JSON;
        # Perl UserAgent code
	my $browser= LWP::UserAgent->new; # http version 
	my $req = HTTP::Request->new( 'POST', $uri );
        #  Send POST request - was it a redirect as expected
	my $response = $browser->post(
			"$uri/node",                                # URI should start with   https to use https service protocol 
			Content_Type => 'multipart/form-data',
			Content => [ upload => [undef, $filename, Content=>$file_contents ], attributes => [undef, $filename, Content=>$att_content] ]
			);

	my $response_hash = $json->decode( $response->content );
	my $id = $response_hash->{"data"}->{"id"};
	return $id;
}

"""

def upload_file(uri, filename, att_content):
    f = open(filename)
    file_contents = ''.join((s.strip() for s in f))
    data = {'upload': (filename, file_contents),
            'attributes': ('', filename, {'Content': att_content})}
    _log.debug("upload.request data={}".format(data))
    r = requests.post("%s/node" % uri, files=data)
    response = json.loads(r.text)
    if response['data'] is None:
        raise UploadException("Response from upload has no data: {}".format(response))
    _log.debug("Response.json={}".format(response))
    try:
        return response['data']['id']
    except Exception as err:
        raise UploadException("Problem with parsing response from upload: {}".format(err))
    

"""
sub check_job_status {
	my ($uri, $id) = @_;
	my $json = new JSON;
# Perl UserAgent code
	my $browser = LWP::UserAgent->new; # http version
#		my $req = HTTP::Request->new( 'POST', "$uri/job/$id" );
	my $url = "$uri/job/$id";
	my $response = $browser->get( $url );

	my $response_hash = $json->decode( $response->content );
	my $remain_tasks = $response_hash->{"data"}->{"remaintasks"};
	return $remain_tasks;
}
"""

def check_job_status( uri, id):
    url = "%s/job/%s" % (uri,id)
    r = requests.get(url)
    response = json.reads( r.text)
    remain_tasks = response.get("data",dict()).get("remaintasks")
    return remain_tasks

"""
sub get_url_visualization {

        my ($uri, $id) = @_;
        my $json = new JSON;
# Perl UserAgent code
        my $browser = LWP::UserAgent->new; # http version
        my $url = "$uri/job/$id";
        my $response = $browser->get( $url );

        my $response_hash = $json->decode( $response->content );
	my $merged_csv_node = $response_hash->{"data"}->{"tasks"}->[3]->{"outputs"}->{"merged_list_json"}->{"node"};
        my $url_viz = "http://140.221.85.95/gvisualize/$merged_csv_node";
        return $url_viz;
}
"""

def get_url_visualization( uri, id):
    url = "%s/job/%s" % (uri,id)
    r = requests.get(url)
    response = json.reads( r.text)
    try:
        merged_csv_node = response["data"]["tasks"][3]["outputs"]["merged_list_json"]["node"]
    except Exception,e:
        raise Exception("Could not parse out merged_csv_node: %s" % e)
    url_viz = "http://140.221.85.95/gvisualize/%s" % merged_csv_node
    return url_viz

"""
sub get_output_files {
	my ($uri, $id) = @_;
	my $json = new JSON;
# Perl UserAgent code
	my $browser = LWP::UserAgent->new; # http version
#		my $req = HTTP::Request->new( 'POST', "$uri/job/$id" );
	my $url = "$uri/job/$id";
	my $response = $browser->get( $url );

	my $response_hash = $json->decode( $response->content );
#	my $remain_tasks = $response_hash->{"data"}->{"remaintasks"};

#Get download urls for all outfile types
my @download_urls = ();

my $data_filtered_csv=$response_hash->{"data"}->{"tasks"}->[0]->{"outputs"}->{"data_filtered_csv"}->{"url"};
push (@download_urls, "data_filtered_csv: $data_filtered_csv");

my $net_edge_csv=$response_hash->{"data"}->{"tasks"}->[1]->{"outputs"}->{"net_edge_csv"}->{"url"};
push (@download_urls, "net_edge_csv: $net_edge_csv");

my $module_csv=$response_hash->{"data"}->{"tasks"}->[2]->{"outputs"}->{"module_csv"}->{"url"};
push (@download_urls, "module_csv: $module_csv");


	return \@download_urls;
}
"""

def get_output_files( uri, id):
    url = "%s/job/%s" % (uri,id)
    r = requests.get(url)
    response = json.reads( r.text)
    download_urls = ()
    try:
        download_urls.append( "data_filtered_csv: %s" %
                              response["data"]["tasks"][0]["outputs"]["data_filtered_csv"]["url"])
        download_urls.append( "net_edge_csv: %s" %
                              response["data"]["tasks"][1]["outputs"]["net_edge_csv"]["url"])
        download_urls.append( "module_csv: %s" %
                              response["data"]["tasks"][2]["outputs"]["module_csv"]["url"])
    except Exception, e:
        raise Exception( "Could not parse results properly: %s" % e)
    return download_urls


"""
sub submit_awe_job {

	my ($uri, $awe_job_document) = @_;


	my $json = new JSON;


# Perl UserAgent code
	my $browser = LWP::UserAgent->new; # http version
	#my $req = HTTP::Request->new( 'POST', "$uri/job" );
#  Send POST request - was it a redirect as expected
	my $response = $browser->post(
			"$uri/job",                                # URI should start with   https to use https service protocol
			Content_Type => 'multipart/form-data',
			Content => [ upload => [undef, "awe_job", Content=>$awe_job_document ] ]
			);

	my $response_hash = $json->decode( $response->content );
	my $id = $response_hash->{"data"}->{"id"};
	return $id;
}
"""

def submit_awe_job(uri, awe_job_document):
    data = {'upload': ('', "awe_job", {'Content': awe_job_document})}
    r = requests.post("{}/job".format(uri), files=data)
    response = json.loads(r.text)
    if response['data'] is None:
        raise UploadException("Response from upload has no data: {}".format(response))
    try:
        return(response['data']['id'])
    except Exception, e:
        raise UploadException("Problem with parsing response from upload: {}".format(e))

#########################
### End of SUB PROCEDURES
#########################


#This script will be used to create a narrative for co-expression network workflow

# Step 1
#User uploads multiple files to shock and remembers shock node IDs

#Step 2
#An awe job script is created

#Step 3 
#Job is submitted to awe service

#Step 4
#Node ids of output files are provided

"""

my $uri = "http://140.221.84.236:8000/node";
my $shock_uri = "http://140.221.84.236:8000";
my $awe_uri = "http://140.221.84.236:8001/";
my $sessionID = "xyz-123-abc"; #Randome string generated

"""

class URLS:
   main = "http://140.221.84.236:8000/node"
   shock = "http://140.221.84.236:8000"
   awe = "http://140.221.84.236:8001/"

sessionID = "xyz-123-abc"  #Random string generated


"""
#Getting user input. Both for file uploads and parameters to submit for awe
my $expression_file = "Expression_Table.csv";
my $sample_id_file  = "Sample_id.csv";
my $annotation_file = "Gene_Annotation.csv";

my $user_input_coex_filter    = "-m anova -p 0.05 -u n -r y -d y";
my $user_input_coex_net       = "-m simple -t edge -c 0.75 -r 0.8 -k 40 -p 50";
my $user_input_coex_cluster2  = "-s 20 -c hclust -n simple -r 0.8 -k 40 -p 50 -d 0.99";

"""

files = {"expression": "Expression_Table.csv",
         "sample_id": "Sample_id.csv",
         "annotation": "Gene_Annotation.csv"}
files_desc = dict(expression="Expression data",
                  sample_id="Sample file",
                  annotation="Annotation file")


class ARGS:
    coex_filter = "-m anova -p 0.05 -u n -r y -d y"
    coex_net = "-m simple -t edge -c 0.75 -r 0.8 -k 40 -p 50"
    coex_cluster2 = "-s 20 -c hclust -n simple -r 0.8 -k 40 -p 50 -d 0.99"



"""
#Preparing metadata for expression_file for upload to shock

my $expression_file_metadata=<<END;
{
	"pipeline":"coexpression network",
		"file_name": "$expression_file",
		"file_type": "expression_file",
		"description": "Input Expression data",
		"sessionID": "$sessionID"
}
END
my $sample_id_file_metadata=<<END;
{
	"pipeline":"coexpression network",
		"file_name": "$sample_id_file",
		"file_type": "sample_id_file",
		"description": "Input Sample file",
		"sessionID": "$sessionID"
}
END
my $annotation_file_metadata=<<END;
{
	"pipeline":"coexpression network",
		"file_name": "$annotation_file",
		"file_type": "annotation_file",
		"description": "Input Annotation file",
		"sessionID": "$sessionID"
}
END
"""

metadata = {}
for file_type, file_name in files.iteritems():
    metadata[file_type] = {
        "pipeline": "coexpression network",
        "file_name": file_name,
        "file_type": "expression_file",
        "description": files_desc[file_type],
        "sessionID": sessionID
    }

#my $att_content = join('',@lines2);
"""
print "Uploading files to shock\n";
print "Uploading Expression Table: $expression_file\n";
my $expression_file_shock_id = upload_file ($shock_uri, $expression_file, $expression_file_metadata);      
print "Uploading Sample ID file: $sample_id_file\n";
my $sample_id_file_shock_id = upload_file ($shock_uri, $sample_id_file, $sample_id_file_metadata);      
print "Uploading Annotation file: $annotation_file \n";
my $annotation_file_shock_id = upload_file ($shock_uri, $annotation_file, $annotation_file_metadata);      
print "Input File uploads complete\n";

my $awe_job_document =<<END;

.. see awe_job.json ..

my $id = submit_awe_job($awe_uri, $awe_job_document);
print "Submitted Job to awe server\n";
my $task_remain = -1;

while ($task_remain !=0){
	$task_remain = check_job_status($awe_uri, $id);
	print "Tasks remaining: $task_remain\n";
	sleep(5);
}
#my $id = "c544f64e-2572-4da3-8e9b-cabd184a1ed8";
my $url_array_ref = get_output_files ($awe_uri, $id);
print "Job successfully completed\n";

 foreach my $url (@$url_array_ref){
  print "\t\t$url\n";
 }

    my $url_viz = get_url_visualization($awe_uri, $id);
      print "\t\t$url_viz\n";
"""
def main():
    _log.info("Uploading files to shock")
    shock_ids = {}
    for file_type, file_name in files.iteritems():
        _log.info("Uploading to {} :: {} = {}".format(URLS.shock, file_type, file_name))
        file_meta = str(metadata[file_type])
        shock_ids[file_type] = upload_file(URLS.shock, file_name, file_meta)
    _log.debug("Uploaded to shock. ids = {}".format(','.join(shock_ids.values())))

    awe_job = json.load(open("awe_job.json"))
    final_tasks = []
    subst = shock_ids.copy()
    subst['shock_uri'] = URLS.shock
    subst['session_id'] = sessionID
    for task in awe_job["tasks"]:
        for key1 in ('inputs', 'outputs'):
            for key2 in task[key1]:
                for key3 in task[key1][key2]:
                    task[key1][key2][key3] = task[key1][key2][key3].format(**subst)
        final_tasks.append(task)
    awe_job['tasks'] = final_tasks
    pprint.pprint(awe_job)
    job_id = submit_awe_job(URLS.awe, awe_job)

    _log.info("job.begin")
    while 1:
        time.sleep(5)
        count = check_job_status(URLS.awe, job_id)
        if count == 0:
            break
        _log.debug("job tasks remaining: {:d}".format(count))
    _log.info("job.end")

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
