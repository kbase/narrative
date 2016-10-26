/**
 * This is a simple template for building KBase Narrative Widgets.
 * KBase Widgets are based around the jQuery widget extension architecture,
 * and are also instantiated as such.
 *
 * Your widget will need (at minimum) a unique name, a parent to inherit 
 * from, a semantic version, an 'options' structure, and an init() function
 * that returns itself.
 *
 * Details are described below.
 *
 * Instantiating a widget is done using a code form like this:
 * $("#myElement").MyWidget({ option1: value1, option2:value2 });
 *
 * Instantiating this widget within the narrative just requires the output
 * of a function that is run in the IPython Kernel to output the widget and
 * the set of options it requires. Examples to follow.
 *
 * This version of the widget template includes authentication options for
 * free - you shouldn't need to handle passing in user ids or auth tokens.
 * These are referenced by the functions:
 * this.user_id();
 * and
 * this.authToken();
 *
 * @see kbaseAuthenticatedWidget.js
 * @public
 */
define (
	[
                'bluebird',
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseAuthenticatedWidget',
                'narrativeConfig',
                'kbase-client-api',
		'jquery-dataTables',
		'jquery-dataTables-bootstrap',
	        'kbaseTabs',
	        'kbaseTable'
	], function(
                Promise,
		KBWidget,
		bootstrap,
		$,
		kbaseAuthenticatedWidget,
                Config,
                KBaseClientApi,
		jquery_dataTables,
		jquery_dataTables_bootstrap,
                kbaseTabs,
	        kbaseTable
	) {
    return KBWidget({
        /* 
         * (required) Your widget should be named in CamelCase.
         */
        name: 'kbaseDefaultNarrativeOutput',
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        token: null,
	width: 1150,
        options: {
            wsId: null,
            wsName: null,
	    objId: null,
            jobId: null,
	    data: null
        },

        /*
         * Extending kbaseAuthenticatedWidget lets you use auth tokens
         * semi-automatically, assuming the page this is used in fires
         * the loggedIn.kbase, loggedOut.kbase, and loggedInQuery events.
         * These are usually fired by the kbaseLogin widget.
         *
         * this.user_id() = the logged in user id
         * this.authToken() = the current authentication token
         */
        

        /**
         * (required) This is the only required function for a KBase Widget.
         * @param {object} options - a structure containing the set of 
         * options to be passed to this widget.
         * @private
         */
        init: function(options) {
            /*
             * This should be the first line of your init function.
             * It registers the new widget, overriding existing options.
             *
             * The members of the options structure will become members of 
             * this.options, overriding any existing members.
             */
            this._super(options);
	    this.wsUrl = Config.url('workspace');
            /*
             * It is required to return this.
             */
            return this;
        },

        /**
         * (not required)
         * I prefer to keep initialization and rendering code separate, but
         * that's just a style thing. You can do whatever the widget requires.
         */
        render: function() {
	    var s = this.options.data,
		errorMsg = '';
	    if (this.options._obj_info){
		this.reference =  this.options.wsName + '/' + this.options.objId + '/' + this.options._obj_info['version'];
	    }else{
		this.reference =  this.options.wsName + '/' + this.options.objId;
	    }
	    Promise.resolve(this.wsClient.get_objects([{ref: this.reference}]))
            .then(function(results) {
                this.reads = results[0];
//		this.$elem.append('<div>' + JSON.stringify(this.reads) + '</div>');
		this.renderBasicTable();
		console.log(this.reads);
            }.bind(this))
            .catch(function(error) {
		console.error("Render Function Error : ", error);
		if (error && typeof error === 'object'){
                    if(error.error) {
			errorMssg = JSON.stringify(error.error);
			if(error.error.message){
                            errorMssg = error.error.message;
                            if(error.error.error){
				errorMssg += '<br><b>Error Trace:</b>:' + error.error.error;
                            }
			} else {
                            errorMssg = JSON.stringify(error.error);
			}
                    } else { errorMssg = error.message; }
		}
		else{ errorMssg = "Undefined error"}
		this.$elem.append('<div>'+errorMssg+'</div>')
            });

            return this;
        },

        renderBasicTable: function() {
	    var $self = this,
                $container = this.$elem,
                reads_type = '',
		tab_ids = {
		    'overview': 'reads-overview-' + $self.get_uuid4(),
		    'stats': 'reads-stats-' + $self.get_uuid4()
	        },
		$tabs = $('<ul class="nav nav-tabs">' +
                              '<li class="active"><a data-toggle="tab" href="#' + tab_ids.overview + '">Overview</a></li>' +
                              '<li><a data-toggle="tab" href="#' + tab_ids.stats + '">Stats</a></li>' +
			  '</ul>'),
                $divs = $('<div class="tab-content">'),
                $overviewTable = $('<table class="table table-striped table-bordered table-hover" style="margin-left: auto; margin-right: auto;"/>'),
                $statsTable = $('<table class="table table-striped table-bordered table-hover" style="margin-left: auto; margin-right: auto;"/>');
//            $container.empty();

//            var $tabPane = $('<div>');
//            $container.append($tabPane);

            function get_table_row(key, value) {
                return $('<tr>').append($('<td>').append(key)).append($('<td>').append(value));
            }

            // Build the overview table
	    console.log("OPTIONS:" + this.options);

	    if (this.reads["info"][2].startsWith("KBaseFile.PairedEndLibrary")){
		reads_type = 'Paired End'
	    } else if (this.reads["info"][2].startsWith("KBaseFile.SingleEndLibrary")){
		reads_type = 'Single End'
	    }


	    $overviewTable.append(get_table_row(
		'Name',
                '<a href="/#dataview/' + this.reference + '" target="_blank">' 
		    + this.reads["info"][1] +'</a>' ));
            // leave out version for now, because that is not passed into data widgets

            if(this.reads["data"].hasOwnProperty("read_count")){
                $overviewTable.append(get_table_row('Number of Reads', this.reads["data"]['read_count'].toLocaleString() ));
                $statsTable.append(get_table_row('Number of Reads', this.reads["data"]['read_count'].toLocaleString() ));
            }else{
                $overviewTable.append(get_table_row('Number of Reads', "Not Specified"));
                $statsTable.append(get_table_row('Number of Reads', "Not Specified"));
            }

	    $overviewTable.append(get_table_row('Type', reads_type ));

/* KEEP COMMENTED OUT UNTIL UPLOADER WEB FORM ALLOWS THE USE TO SPECIFY
	    if (this.reads["data"].hasOwnProperty("strain")){
		$overviewTable.append(get_table_row('Species/Taxa', this.reads["data"]['strain']['genus'] + " " + 
						    this.reads["data"]['strain']['species'] + " " + 
						    this.reads["data"]['strain']['strain'] ));
	    }
	    else{
		$overviewTable.append(get_table_row('Species/Taxa', 'Not specified' ));
	    }
*/

	    $overviewTable.append(get_table_row('Platform', this.reads["data"]['sequencing_tech'] ));

	    if(this.reads["data"].hasOwnProperty("single_genome")){
		display_value = "No";
		if (this.reads["data"]['read_size'] === 1 ){
		    display_value = "Yes";
		}
		$overviewTable.append(get_table_row('Single Genome', display_value ));
	    }else{
		$overviewTable.append(get_table_row('Single Genome', "Not Specified"));
	    }

	    if (reads_type === "Paired End"){
		if(this.reads["data"].hasOwnProperty("insert_size_mean")){
		    $overviewTable.append(get_table_row('Insert Size Mean', this.reads["data"]['insert_size_mean'] ));
		}else{
		    $overviewTable.append(get_table_row('Insert Size Mean', "Not Specified"));
		}

		if(this.reads["data"].hasOwnProperty("insert_size_std_dev")){
		    $overviewTable.append(get_table_row('Insert Size Std Dev', this.reads["data"]['insert_size_std_dev'] ));
		}else{
		    $overviewTable.append(get_table_row('Insert Size Std Dev', "Not Specified"));
		}

		var display_value = "No";//temp value for display purposes

		if(this.reads["data"].hasOwnProperty("read_orientation_outward")){
		    display_value = "No";
		    if (this.reads["data"]['read_orientation_outward'] === 1 ){
			display_value = "Yes";
		    }
		    $overviewTable.append(get_table_row('Outward Read Orientation', display_value ));
		}else{
		    $overviewTable.append(get_table_row('Outward Read Orientation', "Not Specified"));
		}
	    }

	    $divs.append($('<div id="' + tab_ids.overview + '" class="tab-pane active">').append($overviewTable))

            if(this.reads["data"].hasOwnProperty("read_size")){
                $statsTable.append(get_table_row('Total Number of Bases', this.reads["data"]['read_size'].toLocaleString() ));
            }else{
                $statsTable.append(get_table_row('Total Number of Bases', "Not Specified"));
            }

            if(this.reads["data"].hasOwnProperty("read_length_mean")){
                $statsTable.append(get_table_row('Mean Read Length', this.reads["data"]['read_length_mean'].toLocaleString() ));
            }else{
                $statsTable.append(get_table_row('Mean Read Length', "Not Specified"));
            }

            if(this.reads["data"].hasOwnProperty("read_length_stdev")){
                $statsTable.append(get_table_row('Read Length Std Dev', this.reads["data"]['read_length_stdev'].toLocaleString() ));
            }else{
                $statsTable.append(get_table_row('Read Length Std Dev', "Not Specified"));
            }

            if(this.reads["data"].hasOwnProperty("number_of_duplicates")){
		var dup_percentage = (this.reads["data"]['number_of_duplicates'].toLocaleString() / this.reads["data"]["read_size"]) * 100;
                $statsTable.append(get_table_row('Number of Duplicate Reads(%)', 
						 this.reads["data"]['number_of_duplicates'].toLocaleString() + " (" + dup_percentage.toFixed(2) + "%)"
						 ));
            }else{
                $statsTable.append(get_table_row('Number of Duplicate Reads', "Not Specified"));
            }

            if(this.reads["data"].hasOwnProperty("phred_type")){
                $statsTable.append(get_table_row('Phred Type', this.reads["data"]['phred_type'] ));
            }else{
                $statsTable.append(get_table_row('Phred Type', "Not Specified"));
            }
	    
            if((this.reads["data"].hasOwnProperty("qual_mean")) && (this.reads["data"].hasOwnProperty("qual_stdev"))) {
                $statsTable.append(get_table_row('Quality Score Mean (Std Dev)', 
						 this.reads["data"]['qual_mean'].toFixed(2) + " (" +
						 this.reads["data"]['qual_stdev'].toFixed(2) + ")"));
            }
	    
            if((this.reads["data"].hasOwnProperty("qual_min")) && (this.reads["data"].hasOwnProperty("qual_max"))){
                $statsTable.append(get_table_row('Quality Score (Min/Max)', 
						 this.reads["data"]['qual_min'].toFixed(2) + " / " + 
						 this.reads["data"]['qual_max'].toFixed(2)));
		
	    }


            if(this.reads["data"].hasOwnProperty("gc_content")){
                $statsTable.append(get_table_row('GC Percentage', (this.reads["data"]['gc_content'] * 100).toFixed(2) + "%" ));
            }else{
                $statsTable.append(get_table_row('GC Percentage', "Not Specified"));
            }
	    
	    if(this.reads["data"].hasOwnProperty("base_percentages")){
		var keys = [];
		for (var key in this.reads["data"]["base_percentages"]){
		    keys.push(key);
		}
		keys.sort();
		var len = keys.length,
		    base_percentages = "",
		    N_base_percentage = "";
		for (i = 0; i < len; i++){
		    percent = (this.reads["data"]["base_percentages"][keys[i]]).toFixed(2);
		    if (keys[i] === "N"){
			N_base_percentage += keys[i] + " (" + percent + "%)";
		    }else{
			base_percentages += keys[i] + " (" + percent + "%), ";
		    }
		}
		if (N_base_percentage === ""){
		    base_percentages = base_percentages.slice(0,-2);
		}else{
		    base_percentages += N_base_percentage;
		}
		$statsTable.append(get_table_row('Base Percentages', base_percentages));
	    }
	    $divs.append($('<div id="' + tab_ids.stats + '" class="tab-pane">').append($statsTable))
	    $container.append($tabs);
	    $container.append($divs);

	},
/*
		if (this.reads["data"].hasOwnProperty("source")){
		    if(this.reads["data"]["source"].hasOwnProperty("source")){
			$overviewTable.append(get_table_row('Source', this.reads["data"]['source']['source']));
		    }else{
			$overviewTable.append(get_table_row('Source', "Not Specified"));
		    }

		    if(this.reads["data"]["source"].hasOwnProperty("source_id")){
			$overviewTable.append(get_table_row('Source ID', this.reads["data"]['source']['source_id']));
		    }else{
			$overviewTable.append(get_table_row('Source ID', "Not Specified"));
		    }

		    if(this.reads["data"]["source"].hasOwnProperty("project_id")){
			$overviewTable.append(get_table_row('Project ID', this.reads["data"]['source']['project_id']));
		    }else{
			$overviewTable.append(get_table_row('Project ID', "Not Specified"));
		    }
		}else{
		    $overviewTable.append(get_table_row('Source', 'Not specified' ));
		    $overviewTable.append(get_table_row('Source ID', 'Not specified' ));
		    $overviewTable.append(get_table_row('Project ID', 'Not specified' ));
		}
		
		if(this.reads["data"].hasOwnProperty("gc_content")){
		    $overviewTable.append(get_table_row('GC Content', this.reads["data"]['gc_content'] ));
		}else{
		    $overviewTable.append(get_table_row('GC Content', "Not Specified"));
		}

		if(this.reads["data"].hasOwnProperty("interleaved")){
		    display_value = "No";
		    if (this.reads["data"]['interleaved'] === 1 ){
			display_value = "Yes";
		    }
		    $overviewTable.append(get_table_row('Interleaved', display_value ));
		}else{
		    $overviewTable.append(get_table_row('Interleaved', "Not Specified"));
		}
		
		var library_1_label = "Library"
		if(this.reads["data"].hasOwnProperty("lib2")){
		    library_1_label = "Left Library"
		}
		$overviewTable.append(get_table_row(library_1_label + ' Type', this.reads["data"]["lib1"]["type"]));
		$overviewTable.append(get_table_row(library_1_label + ' File Size', this.reads["data"]["lib1"]["size"]));
		if(this.reads["data"]["lib1"]["file"].hasOwnProperty("file_name")){
		    $overviewTable.append(get_table_row(library_1_label + ' File Name', this.reads["data"]["lib1"]["file"]["file_name"]));
		}else{
		    $overviewTable.append(get_table_row(library_1_label + ' File Name', "Not Specified"));
		}

		if(this.reads["data"].hasOwnProperty("lib2")){
		    $overviewTable.append(get_table_row('Right Library Type', this.reads["data"]["lib2"]["type"]));
		    $overviewTable.append(get_table_row('Right Library File Size', this.reads["data"]["lib2"]["size"]));
		    if(this.reads["data"]["lib1"]["file"].hasOwnProperty("file_name")){
			$overviewTable.append(get_table_row('Right Library File Name', this.reads["data"]["lib2"]["file"]["file_name"]));
		    }else{
			$overviewTable.append(get_table_row('Right Lbrary File Name', "Not Specified"));
		    }
		}
*/

        get_uuid4: function() {
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	       	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	       	return v.toString(16);
	    });
	},


        loggedInCallback: function(event, auth) {
            this.token = auth.token;

	    this.wsClient = new Workspace(this.wsUrl, auth);
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        },

    });
});
