/**
 * Output widget to vizualize ExpressionMatrix object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define ([
    'uuid',
    'jquery',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'narrativeConfig',
		'kbase-generic-client-api',
    'bluebird',
    // For effect
    'bootstrap',
    'jquery-dataTables',
    'datatables.net-buttons',
    'datatables.net-buttons-bs',
    'datatables.net-buttons-html5',
    'datatables.net-buttons-print'
], function(
    Uuid,
    $,
    KBWidget,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    Config,
    GenericClient,
    Promise
) {
    'use strict';

    return KBWidget({
        name: 'kbaseGenericMatrix',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.2',
        options: {
            matrixID: null,
            workspaceID: null,
            loadingImage: Config.get('loading_gif')
        },

        // Prefix for all div ids
        pref: null,

        // KBaseFeatureValue client
        featureValueClient: null,

        // Matrix data to be visualized
        matrixStat: null,

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();
            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            return this;
        },

        loggedInCallback: function(event, auth) {

            // error if not properly initialized
            if (this.options.matrixID == null) {
                this.showMessage('[Error] Couldn\'t retrieve expression matrix.');
                return this;
            }

            this.genericClient = new GenericClient(
              Config.url('service_wizard'),
              { token: auth.token }
            );

            // Let's go...
            this.loadAndRender();

            return this;
        },

        loggedOutCallback: function() {
            this.isLoggedIn = false;
            return this;
        },

        loadAndRender: function(){
            var self = this;

            self.loading(true);
            var matrixRef = this.options.upas.matrixID;

            // this is the "old" method that loads up the Conditions table and some of the values in the Overview table
            var get_matrix_stat_promise = self.genericClient.sync_call('KBaseFeatureValues.get_matrix_stat', [{
                input_data: matrixRef
            }]);

            // first thing we do is our old get_matrix_stat call, which we need for the conditions table.
            get_matrix_stat_promise
              .then( function (res) {
                self.matrixStat = res[0];
                self.render();
                self.loading(false);
              })
              .catch(function(error){
                self.clientError(error);
              });
        },

        render: function() {
            var self = this;
            var pref = this.pref;
            var container = this.$elem;
            var matrixStat = this.matrixStat;

            ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
            container.empty();
            var tabPane = $('<div id="'+pref+'tab-content">');
            container.append(tabPane);

            var tabWidget = new kbaseTabs(tabPane, {canDelete : true, tabs : []});
            ///////////////////////////////////// Overview table ////////////////////////////////////////////
            var tabOverview = $('<div/>');
            tabWidget.addTab({tab: 'Overview', content: tabOverview, canDelete : false, show: true});
            var tableOver = $('<table class="table table-striped table-bordered" '+
                'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+pref+'overview-table"/>');
            tabOverview.append(tableOver);
            tableOver
                .append(self.makeRow('Description', matrixStat.mtx_descriptor.description))
                .append(self.makeRow('# Columns', matrixStat.mtx_descriptor.columns_count))
                .append(self.makeRow('# Rows', matrixStat.mtx_descriptor.rows_count))
                .append(self.makeRow('Scale', matrixStat.mtx_descriptor.scale))
                .append(self.makeRow('Value type', matrixStat.mtx_descriptor.type))
                .append(self.makeRow('Row normalization', matrixStat.mtx_descriptor.row_normalization))
                .append(self.makeRow('Column normalization', matrixStat.mtx_descriptor.col_normalization))
                .append(self.makeRow('Genome', $('<span />').append(matrixStat.mtx_descriptor.genome_name).css('font-style', 'italic')));

            /////////////////////////////////// Column tab ////////////////////////////////////////////

            var $tabColumns = $('<div/>');
            tabWidget.addTab({tab: 'Columns', content: $tabColumns, canDelete : false, show: false});

            ///////////////////////////////////// Column table ////////////////////////////////////////////
            $tabColumns.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">Statistics calculated across all rows in a column</div>')
            );


            $('<table id="'+pref+'column-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($tabColumns)
                .dataTable( {
                    'dom': '<\'row\'<\'col-sm-6\'B><\'col-sm-6\'f>>t<\'row\'<\'col-sm-4\'i><\'col-sm-8\'lp>>',
                    'data': self.buildColumnTableData(),
                    'buttons': ['copy', 'csv', 'print'],
                    'columns': [
                        { sTitle: 'Column ID', mData:'name' },
                        { sTitle: 'Min', mData:'min' },
                        { sTitle: 'Max', mData:'max' },
                        { sTitle: 'Average', mData:'avg' },
                        { sTitle: 'Std. Dev.', mData:'std'},
                        { sTitle: 'Missing Values?',  mData:'missing_values' }
                    ]
                } );

            ///////////////////////////////////// Rows tab ////////////////////////////////////////////
            var $tabRows = $('<div/>');
            tabWidget.addTab({tab: 'Rows', content: $tabRows, canDelete : false, show: false});

            ///////////////////////////////////// Rows table ////////////////////////////////////////////
            $tabRows.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">Statistics calculated across all columns for the row</div>')
            );

            $('<table id="'+pref+'row-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($tabRows)
                .dataTable({
                    dom: '<\'row\'<\'col-sm-6\'B><\'col-sm-6\'f>>t<\'row\'<\'col-sm-4\'i><\'col-sm-8\'lp>>',
                    data: self.buildRowTableData(),
                    columns: [
                        { sTitle: 'Row ID', mData: 'id'},
                        { sTitle: 'Min', mData:'min' },
                        { sTitle: 'Max', mData:'max' },
                        { sTitle: 'Average', mData:'avg' },
                        { sTitle: 'Std. Dev.', mData:'std'},
                        { sTitle: 'Missing Values?', mData:'missing_values' }
                        ],
                    buttons: ['copy', 'csv', 'print']
                });
        },

        buildColumnTableData: function(){
            var matrixStat = this.matrixStat;
            var tableData = [];
            for(var i = 0; i < matrixStat.column_descriptors.length; i++){
                var desc = matrixStat.column_descriptors[i];
                var stat = matrixStat.column_stats[i];
                tableData.push({
                    index: desc.index,
                    id: desc.id,
                    name: desc.name,
                    min: stat.min ? stat.min.toFixed(2) : null,
                    max: stat.max ? stat.max.toFixed(2) : null,
                    avg: stat.avg ? stat.avg.toFixed(2) : null,
                    std: stat.std ? stat.std.toFixed(2) : null,
                    missing_values: stat.missing_values ? 'Yes' : 'No'
                });
            }
            return tableData;
        },

        buildRowTableData: function(){
            var matrixStat = this.matrixStat;
            var tableData = [];
            for(var i = 0; i < matrixStat.row_descriptors.length; i++){
                var desc = matrixStat.row_descriptors[i];
                var stat = matrixStat.row_stats[i];
                tableData.push(
                    {
                        index: desc.index,
                        id: desc.id,
                        name: desc.name,
                        min: stat.min ? stat.min.toFixed(2) : null,
                        max: stat.max ? stat.max.toFixed(2) : null,
                        avg: stat.avg ? stat.avg.toFixed(2) : null,
                        std: stat.std ? stat.std.toFixed(2) : null,
                        missing_values: stat.missing_values ? 'Yes' : 'No'
                    }
                );
            }
            return tableData;
        },

        makeRow: function(name, value) {
            var $row = $('<tr/>')
                .append($('<th />').css('width','20%').append(name))
                .append($('<td />').append(value));
            return $row;
        },

        getData: function() {
            return {
                type: 'ExpressionMatrix',
                id: this.options.matrixID,
                workspace: this.options.workspaceID,
                title: 'Expression Matrix'
            };
        },

        loading: function(isLoading) {
            if (isLoading) {
                this.showMessage('<img src=\'' + this.options.loadingImage + '\'/>');
            } else {
                this.hideMessage();
            }
        },

        showMessage: function(message) {
            var span = $('<span/>').append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        uuid: function() {
            return new Uuid(4).format();
        },

        buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
            var obj = {};
            if (wsRef) {
                obj.ref = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID))
                    obj.wsid = workspaceID;
                else
                    obj.workspace = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID))
                    obj.objid = objectID;
                else
                    obj.name = objectID;

                if (objectVer)
                    obj.ver = objectVer;
            }
            return obj;
        },

        clientError: function(error){
            this.loading(false);
            // TODO: Don't know that this is a service error; should
            // inspect the error object.
            this.showMessage(error.message);
        }

    });
});
