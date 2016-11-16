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
    'util/display',
    'kbase-generic-client-api'
], function (
    Promise,
    KBWidget,
    bootstrap,
    $,
    kbaseAuthenticatedWidget,
    Config,
    KBaseClientApi,
    StringUtil,
    DisplayUtil,
    GenericClient
) {
    'use strict';
    return KBWidget({
        /*
        * (required) Your widget should be named in CamelCase.
        */
        name: 'kbaseReadsViewer',
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        token: null,
        width: 1150,
        options: {
            obj_ref: null,
//            wsId: null,
            wsName: null,
            objId: null,
            jobId: null,
            data: null
        },

        init: function(options) {
            this._super(options);
            return this;
        },

        render: function() {
            if (this.options.obj_ref) {
                this.reference = this.options.obj_ref;
            }
            else{
                if (this.options._obj_info) {
                    this.reference =  this.options.wsName + '/' + this.options.objId + '/' + this.options._obj_info['version'];
                } else {
                    this.reference =  this.options.wsName + '/' + this.options.objId;
                }
            }
            Promise.resolve(this.client.sync_call("ReadsAPI.get_reads_info_all_formatted",[{workspace_obj_ref: this.reference}]))
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
                $divs = $('<div class="tab-content" style="margin-top: 15px">'),
                $overviewTable = $('<table class="table table-striped table-bordered table-hover" style="margin-left: auto; margin-right: auto; word-wrap: break-word; table-layout: fixed;"/>').append($('<colgroup>').append('<col span="1" style="width: 25%">')),
                $statsTable = $('<table class="table table-striped table-bordered table-hover" style="margin-left: auto; margin-right: auto; word-wrap: break-word; table-layout: fixed;"/>').append($('<colgroup>').append('<col span="1" style="width: 25%">'));

            function get_table_row(key, value) {
                return $('<tr>').append($('<td>').append($('<b>' + key + '</b>'))).append($('<td>').append(value));
            }
            // Build the overview table

            $overviewTable.append(get_table_row(
                'Name',
                '<a href="/#dataview/' + this.reference + '" target="_blank">' +
                this.reads["Name"] +'</a>'
            ));
            // leave out version for now, because that is not passed into data widgets


            $overviewTable.append(get_table_row('Number of Reads', this.reads['Number_of_Reads']));
            $statsTable.append(get_table_row('Number of Reads', this.reads['Number_of_Reads']));

            $overviewTable.append(get_table_row('Type', this.reads["Type"]));

            /* KEEP COMMENTED OUT UNTIL UPLOADER WEB FORM ALLOWS THE USER TO SPECIFY
            if(this.reads["data"].hasOwnProperty("read_size")){
                $overviewTable.append(get_table_row('Read Size', this.reads["data"]['read_size'].toLocaleString() ));
            }else{
                $overviewTable.append(get_table_row('Read Size', "Not Specified"));
            }
            if (this.reads["data"].hasOwnProperty("strain")) {
                $overviewTable.append(get_table_row('Species/Taxa', this.reads["data"]['strain']['genus'] + " " +
                this.reads["data"]['strain']['species'] + " " +
                this.reads["data"]['strain']['strain'] ));
            }
            else {
                $overviewTable.append(get_table_row('Species/Taxa', 'Not specified' ));
            }
            */

            $overviewTable.append(get_table_row('Platform', this.reads['Platform'] ));
            $overviewTable.append(get_table_row('Single Genome', this.reads['Single_Genome'] ));

            if (this.reads["Type"] === "Paired End") {
                $overviewTable.append(get_table_row('Insert Size Mean', this.reads['Insert_Size_Mean'] ));
                $overviewTable.append(get_table_row('Insert Size Std Dev', this.reads['Insert_Size_Std_Dev'] ));
                $overviewTable.append(get_table_row('Outward Read Orientation', this.reads['Outward_Read_Orientation'] ));
            }
            $divs.append($('<div id="' + tab_ids.overview + '" class="tab-pane active">').append($overviewTable));

            //Stats portion
            $statsTable.append(get_table_row('Total Number of Bases', this.reads['Total_Number_of_Bases']));
            $statsTable.append(get_table_row('Mean Read Length', this.reads['Mean_Read_Length']));
            $statsTable.append(get_table_row('Read Length Std Dev', this.reads['Read_Length_Std_Dev']));
            $statsTable.append(get_table_row('Number of Duplicate Reads(%)',this.reads['Number_of_Duplicate_Reads']));
            $statsTable.append(get_table_row('Phred Type', this.reads['Phred_Type']));
            $statsTable.append(get_table_row('Quality Score Mean (Std Dev)',this.reads['Quality_Score_Mean_Std_Dev']));
            $statsTable.append(get_table_row('Quality Score (Min/Max)',this.reads['Quality_Score_Min_Max']));
            $statsTable.append(get_table_row('GC Percentage', this.reads['GC_Percentage']));
            $statsTable.append(get_table_row('Base Percentages', this.reads['Base_Percentages']));

            $divs.append($('<div id="' + tab_ids.stats + '" class="tab-pane">').append($statsTable));
            $container.append($tabs);
            $container.append($divs);

        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;

            this.url = Config.url('service_wizard');
            this.client = new GenericClient(this.url, auth); // just put this where the workspace client init code is
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
