/**
* KBase Reads viewer.
* A widget for viewing info about a KBaseFile.PairedEndLibrary or KBaseFile.SingleEndLibrary
* @public
*/
define ([
    'bluebird',
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',
    'kbase-client-api',
    'util/string',
    'util/display'
], function (
    Promise,
    KBWidget,
    bootstrap,
    $,
    kbaseAuthenticatedWidget,
    Config,
    KBaseClientApi,
    StringUtil,
    DisplayUtil
) {
    'use strict';
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

        init: function(options) {
            this._super(options);
            this.wsUrl = Config.url('workspace');

            return this;
        },

        render: function() {
            if (this.options._obj_info) {
                this.reference =  this.options.wsName + '/' + this.options.objId + '/' + this.options._obj_info['version'];
            } else {
                this.reference =  this.options.wsName + '/' + this.options.objId;
            }
            Promise.resolve(this.wsClient.get_objects([{ref: this.reference}]))
            .then(function(results) {
                this.reads = results[0];
                //		this.$elem.append('<div>' + JSON.stringify(this.reads) + '</div>');
                this.renderBasicTable();
            }.bind(this))
            .catch(function(error) {
                var errorMsg = 'No further information available',
                    errorTrace = undefined;
                console.error("Render Function Error : ", error);
                if (error && typeof error === 'object') {
                    if(error.error) {
                        errorMsg = JSON.stringify(error.error);
                        if(error.error.message) {
                            errorMsg = error.error.message;
                            if(error.error.error) {
                                errorTrace = error.error.error;
                            }
                        } else {
                            errorMsg = JSON.stringify(error.error);
                        }
                    } else {
                        errorMsg = error.message;
                    }
                }
                else {
                    errorMsg = "Undefined error";
                }
                this.$elem.append(
                    DisplayUtil.createError(
                        'Sorry, an error occurred while retrieving your data',
                        errorMsg,
                        errorTrace
                    ));
            }.bind(this));

            return this;
        },

        renderBasicTable: function() {
            var $container = this.$elem,
                reads_type = '',
                tab_ids = {
                    'overview': 'reads-overview-' + StringUtil.uuid(),
                    'stats': 'reads-stats-' + StringUtil.uuid()
                },
                $tabs = $('<ul class="nav nav-tabs">' +
                    '<li class="active"><a data-toggle="tab" href="#' + tab_ids.overview + '">Overview</a></li>' +
                    '<li><a data-toggle="tab" href="#' + tab_ids.stats + '">Stats</a></li>' +
                    '</ul>'
                ),
                $divs = $('<div class="tab-content">'),
                $overviewTable = $('<table class="table table-striped table-bordered table-hover" style="margin-left: auto; margin-right: auto; word-wrap: break-word; table-layout: fixed;"/>').append($('<colgroup>').append('<col span="1" style="width: 25%">')),
                $statsTable = $('<table class="table table-striped table-bordered table-hover" style="margin-left: auto; margin-right: auto; word-wrap: break-word; table-layout: fixed;"/>').append($('<colgroup>').append('<col span="1" style="width: 25%">'));

            function get_table_row(key, value) {
                return $('<tr>').append($('<td>').append($('<b>' + key + '</b>'))).append($('<td>').append(value));
            }

            // Build the overview table
            if (this.reads["info"][2].startsWith("KBaseFile.PairedEndLibrary")) {
                reads_type = 'Paired End';
            } else if (this.reads["info"][2].startsWith("KBaseFile.SingleEndLibrary")) {
                reads_type = 'Single End';
            }

            $overviewTable.append(get_table_row(
                'Name',
                '<a href="/#dataview/' + this.reference + '" target="_blank">' +
                this.reads["info"][1] +'</a>'
            ));
            // leave out version for now, because that is not passed into data widgets

            if(this.reads["data"].hasOwnProperty("read_count")) {
                $overviewTable.append(get_table_row('Number of Reads', this.reads["data"]['read_count'].toLocaleString() ));
                $statsTable.append(get_table_row('Number of Reads', this.reads["data"]['read_count'].toLocaleString() ));
            } else {
                $overviewTable.append(get_table_row('Number of Reads', "Not Specified"));
                $statsTable.append(get_table_row('Number of Reads', "Not Specified"));
            }

            $overviewTable.append(get_table_row('Type', reads_type ));

            /* KEEP COMMENTED OUT UNTIL UPLOADER WEB FORM ALLOWS THE USER TO SPECIFY
            if (this.reads["data"].hasOwnProperty("strain")) {
                $overviewTable.append(get_table_row('Species/Taxa', this.reads["data"]['strain']['genus'] + " " +
                this.reads["data"]['strain']['species'] + " " +
                this.reads["data"]['strain']['strain'] ));
            }
            else {
                $overviewTable.append(get_table_row('Species/Taxa', 'Not specified' ));
            }
            */

            $overviewTable.append(get_table_row('Platform', this.reads["data"]['sequencing_tech'] ));

            if (this.reads["data"].hasOwnProperty("single_genome")) {
                display_value = "No";
                if (this.reads["data"]['read_size'] === 1 ) {
                    display_value = "Yes";
                }
                $overviewTable.append(get_table_row('Single Genome', display_value ));
            } else {
                $overviewTable.append(get_table_row('Single Genome', "Not Specified"));
            }

            if (reads_type === "Paired End") {
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

            $divs.append($('<div id="' + tab_ids.overview + '" class="tab-pane active">').append($overviewTable));

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
            } else {
                $statsTable.append(get_table_row('Number of Duplicate Reads', "Not Specified"));
            }

            if (this.reads["data"].hasOwnProperty("phred_type")){
                $statsTable.append(get_table_row('Phred Type', this.reads["data"]['phred_type'] ));
            } else {
                $statsTable.append(get_table_row('Phred Type', "Not Specified"));
            }

            if ((this.reads["data"].hasOwnProperty("qual_mean")) && (this.reads["data"].hasOwnProperty("qual_stdev"))) {
                $statsTable.append(get_table_row('Quality Score Mean (Std Dev)',
                this.reads["data"]['qual_mean'].toFixed(2) + " (" +
                this.reads["data"]['qual_stdev'].toFixed(2) + ")"));
            }

            if ((this.reads["data"].hasOwnProperty("qual_min")) && (this.reads["data"].hasOwnProperty("qual_max"))){
                $statsTable.append(get_table_row('Quality Score (Min/Max)',
                this.reads["data"]['qual_min'].toFixed(2) + " / " +
                this.reads["data"]['qual_max'].toFixed(2)));
            }


            if (this.reads["data"].hasOwnProperty("gc_content")) {
                $statsTable.append(get_table_row('GC Percentage', (this.reads["data"]['gc_content'] * 100).toFixed(2) + "%" ));
            } else {
                $statsTable.append(get_table_row('GC Percentage', "Not Specified"));
            }

            if (this.reads["data"].hasOwnProperty("base_percentages")) {
                var keys = [];
                for (var key in this.reads["data"]["base_percentages"]) {
                    keys.push(key);
                }
                keys.sort();
                var len = keys.length,
                    percent,
                    base_percentages = "",
                    N_base_percentage = "";
                for (var i = 0; i < len; i++){
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
            $divs.append($('<div id="' + tab_ids.stats + '" class="tab-pane">').append($statsTable));
            $container.append($tabs);
            $container.append($divs);

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
