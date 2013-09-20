use strict;
use Data::Dumper;
use JSON;
use Getopt::Long;
use LWP::UserAgent;
use HTTP::Request;
use HTTP::Response;
use HTTP::Request::Common qw(POST);
use HTML::Parser;
use MIME::Base64;

##################
### SUB PROCEDURES
##################
sub upload_file {

	my ($uri, $filename, $att_content) = @_;

	open (FH,$filename) || die "Could not find $filename";
	my @lines = <FH>;
	close FH;
	my $file_contents = join('',@lines);


	my $json = new JSON;


# Perl UserAgent code
	my $browser = LWP::UserAgent->new; # http version 
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


my $uri = "http://140.221.84.236:8000/node";
my $shock_uri = "http://140.221.84.236:8000";
my $awe_uri = "http://140.221.84.236:8001/";
my $sessionID = "xyz-123-abc"; #Randome string generated




#Getting user input. Both for file uploads and parameters to submit for awe
my $expression_file = "Expression_Table.csv";
my $sample_id_file  = "Sample_id.csv";
my $annotation_file = "Gene_Annotation.csv";

my $user_input_coex_filter    = "-m anova -p 0.05 -u n -r y -d y";
my $user_input_coex_net       = "-m simple -t edge -c 0.75 -r 0.8 -k 40 -p 50";
my $user_input_coex_cluster2  = "-s 20 -c hclust -n simple -r 0.8 -k 40 -p 50 -d 0.99";


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

#Preparing metadata for sample_id_file for upload to shock
my $sample_id_file_metadata=<<END;
{
	"pipeline":"coexpression network",
		"file_name": "$sample_id_file",
		"file_type": "sample_id_file",
		"description": "Input Sample file",
		"sessionID": "$sessionID"
}  
END

#Preparing metadata for annotation_file for upload to shock
my $annotation_file_metadata=<<END;
{
	"pipeline":"coexpression network",
		"file_name": "$annotation_file",
		"file_type": "annotation_file",
		"description": "Input Annotation file",
		"sessionID": "$sessionID"
}
END





#my $att_content = join('',@lines2);

print "Uploading files to shock\n";

print "Uploading Expression Table: $expression_file\n";
my $expression_file_shock_id = upload_file ($shock_uri, $expression_file, $expression_file_metadata);      


print "Uploading Sample ID file: $sample_id_file\n";
my $sample_id_file_shock_id = upload_file ($shock_uri, $sample_id_file, $sample_id_file_metadata);      


print "Uploading Annotation file: $annotation_file \n";
my $annotation_file_shock_id = upload_file ($shock_uri, $annotation_file, $annotation_file_metadata);      

print "Input File uploads complete\n";



my $awe_job_document =<<END;


{
	"info": {
		"pipeline": "coex-example",
			"name": "testcoex",
			"project": "default",
			"user": "default",
			"clientgroups":"",
			"sessionId":"$sessionID"
	}, 
		"tasks": [
		{
			"cmd": {
				"args": "-i \@data_csv --output=data_filtered_csv  --sample_index=\@sample_id_csv  $user_input_coex_filter", 
				"description": "filtering", 
				"name": "coex_filter"
			}, 
			"dependsOn": [], 
			"inputs": {
				"data_csv": {
					"host": "$shock_uri",
					"node": "$expression_file_shock_id"
				},
				"sample_id_csv": {
					"host": "$shock_uri",
					"node": "$sample_id_file_shock_id"
				}
			}, 
			"outputs": {
				"data_filtered_csv": {
					"host": "$shock_uri"
				}
			},
			"taskid": "0",
			"skip": 0,
			"totalwork": 1                
		},
		{
			"cmd": {
				"args": "-i \@data_filtered_csv -o net_edge_csv -m simple -t edge $user_input_coex_net", 
				"description": "coex network", 
				"name": "coex_net"
			}, 
			"dependsOn": ["0"], 
			"inputs": {
				"data_filtered_csv": {
					"host": "$shock_uri",
					"origin": "0"
				}
			}, 
			"outputs": {
				"net_edge_csv": {
					"host": "$shock_uri"
				}
			},
			"taskid": "1",
			"skip": 0, 
			"totalwork": 1
		},
		{
			"cmd": {
				"args": "-i \@data_filtered_csv -o module_csv  -c hclust -n simple $user_input_coex_cluster2", 
				"description": "clustering", 
				"name": "coex_cluster2"
			}, 
			"dependsOn": ["1"], 
			"inputs": {
				"data_filtered_csv": {
					"host": "$shock_uri",
					"origin": "0"
				}
			}, 
			"outputs": {
				"hclust_tree_method=hclust.txt": {
					"host": "$shock_uri"
				},
				"module_network_edgelist_method=hclust.csv": {
					"host": "$shock_uri"
				},
				"module_csv": {
					"host": "$shock_uri"
				}
			},
			"taskid": "2",
			"skip": 0,
			"totalwork": 1
		},
		{
			"cmd": {
				"args": "-m \@module_csv -e \@net_edge_csv -a \@annotation_csv -o merged_list_json -u $shock_uri/node -s $sessionID", 
				"description": "clustering", 
				"name": "merge_csv"
			}, 
			"dependsOn": ["2"], 
			"inputs": {
				"module_csv": {
					"host": "$shock_uri",
					"origin": "2"
				},
				"net_edge_csv": {
					"host": "$shock_uri",
					"origin": "1"
				},
				"annotation_csv": {
					"host": "$shock_uri",
					"node": "$annotation_file_shock_id"
				}
			}, 
			"outputs": {
				"merged_list_json": {
					"host": "$shock_uri"
				}
			},
			"taskid": "3",
			"skip": 0,
			"totalwork": 1
		}
	]
}
END



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


print "\n##############################\nDownload and visualize network output\n";
print "\nURLs to download output files\n";

 foreach my $url (@$url_array_ref){
  print "\t\t$url\n";
 }


print "URL to visualize the network\n";
 my $url_viz = get_url_visualization($awe_uri, $id);
  print "\t\t$url_viz\n";
