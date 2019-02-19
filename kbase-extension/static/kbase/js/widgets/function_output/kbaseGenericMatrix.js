/**
 * Output widget to vizualize GenericMatrix object.
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
    // For effect
    'bluebird',
    'bootstrap',
    'jquery-dataTables',
    'datatables.net-buttons',
    'datatables.net-buttons-bs',
    'datatables.net-buttons-html5',
    'datatables.net-buttons-print',
    'datatables.net-buttons-colvis',
], function(
    Uuid,
    $,
    KBWidget,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    Config,
    GenericClient
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

        // Matrix data to be visualized
        matrixStat: null,
        colAttributeData: null,
        rowAttributeData: null,
        colMapping: null,
        rowMapping: null,

        init: function(options) {
            this._super(options);
            this.pref = new Uuid(4).format();
            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            return this;
        },

        loggedInCallback: function(event, auth) {

            // error if not properly initialized
            if (this.options.upas.matrixID == null) {
                this.showMessage('[Error] Couldn\'t retrieve the matrix.');
                return this;
            }
            this.loading(true);
            this.wsClient = new Workspace(Config.url('workspace'), {token: auth.token});

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
            let self = this;
            const matrixRef = this.options.upas.matrixID;

            let get_matrix_stat_promise = self.genericClient.sync_call('KBaseFeatureValues.get_matrix_stat', [{
                input_data: matrixRef
            }]);
            self.wsClient.get_objects2({
                objects: [{ref: matrixRef, included: [
                    'col_attributemapping_ref',
                    'row_attributemapping_ref',
                    'col_mapping',
                    'row_mapping',
                ]}],
            }).then(function (res) {
                let col_attribute_prom, row_attribute_prom;
                let data = res.data[0].data;
                if (data.col_attributemapping_ref) {
                    col_attribute_prom = self.wsClient.get_objects2(
                        {'objects': [{ref: data.col_attributemapping_ref}]})
                };
                if (data.row_attributemapping_ref) {
                    row_attribute_prom = self.wsClient.get_objects2(
                        {'objects': [{ref: data.row_attributemapping_ref}]})
                };
                self.colMapping = data.col_mapping;
                self.rowMapping = data.row_mapping;
                Promise.all([get_matrix_stat_promise, col_attribute_prom, row_attribute_prom]).then(
                    function (res2) {
                        self.matrixStat = res2[0][0];
                        self.colAttributeData = res2[1] ? res2[1].data[0].data : null;
                        self.rowAttributeData = res2[2] ? res2[2].data[0].data : null;
                        self.render();
                        self.loading(false);
              });
            }).catch(function(error){
                self.clientError(error);
            });
        },

        render: function() {
            let self = this;
            let pref = this.pref;
            let container = this.$elem;
            let matrixStat = this.matrixStat;
            let jqueryTblConfig = {
                    'dom': "<'row'<'col-sm-6'B><'col-sm-6'f>>t<'row'<'col-sm-4'i><'col-sm-8'lp>>",
                    'buttons': ['copy', 'csv', 'print', 'colvis'],
                };

            ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
            container.empty();
            let tabPane = $('<div id="'+pref+'tab-content">');
            container.append(tabPane);

            let tabWidget = new kbaseTabs(tabPane, {canDelete : true, tabs : []});
            ///////////////////////////////////// Overview table ////////////////////////////////////////////
            let tabOverview = $('<div/>');
            tabWidget.addTab({tab: 'Overview', content: tabOverview, canDelete : false, show: true});
            let tableOver = $('<table class="table table-striped table-bordered" '+
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

            let $tabColumns = $('<div/>');
            tabWidget.addTab({tab: 'Columns', content: $tabColumns, canDelete : false, show: false});

            ///////////////////////////////////// Column table ////////////////////////////////////////////
            $tabColumns.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">' +
                    'Statistics calculated across all rows in a column</div>')
            );

            $('<table id="'+pref+'column-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($tabColumns)
                .dataTable(Object.assign(self.buildColumnTableData(), jqueryTblConfig));

            ///////////////////////////////////// Rows tab ////////////////////////////////////////////
            let $tabRows = $('<div/>');
            tabWidget.addTab({tab: 'Rows', content: $tabRows, canDelete : false, show: false});

            ///////////////////////////////////// Rows table ////////////////////////////////////////////
            $tabRows.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">' +
                    'Statistics calculated across all columns for the row</div>')
            );

            $('<table id="'+pref+'row-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($tabRows)
                .dataTable(Object.assign(self.buildRowTableData(), jqueryTblConfig));
        },

        buildColumnTableData: function(){
            let matrixStat = this.matrixStat;
            let tableData = [];
            let tableColumns = [{ title: 'Column ID'}];
            if (this.colAttributeData) {
                this.colAttributeData.attributes.forEach(
                    attr => {tableColumns.push({'title': attr.attribute})})
            };

            for(let i = 0; i < matrixStat.column_descriptors.length; i++){
                let desc = matrixStat.column_descriptors[i];
                let stat = matrixStat.column_stats[i];
                let tableRow = [desc.id];
                if (this.colAttributeData) {
                    if (this.colMapping) {
                        tableRow = tableRow.concat(
                            this.colAttributeData.instances[this.colMapping[desc.id]]
                        );
                    } else {
                        tableRow = tableRow.concat(this.colAttributeData.instances[desc.id]);
                    }
                }
                tableRow.push(
                    $.isNumeric(stat.min) ? stat.min.toFixed(2) : null,
                    $.isNumeric(stat.max) ? stat.max.toFixed(2) : null,
                    $.isNumeric(stat.avg) ? stat.avg.toFixed(2) : null,
                    $.isNumeric(stat.std) ? stat.std.toFixed(2) : null,
                    stat.missing_values ? 'Yes' : 'No'
                );
                tableData.push(tableRow);
            }
            tableColumns.push(
                { title: 'Min'},
                { title: 'Max'},
                { title: 'Average'},
                { title: 'Std. Dev.'},
                { title: 'Missing Values?'}
                );
            return {data: tableData, columns: tableColumns};
        },

        buildRowTableData: function(){
            let matrixStat = this.matrixStat;
            let tableData = [];
            let tableColumns = [{ title: 'Row ID'}];
            if (this.rowAttributeData) {
                this.rowAttributeData.attributes.forEach(
                    attr => {tableColumns.push({'title': attr.attribute})})
            };

            for(let i = 0; i < matrixStat.row_descriptors.length; i++){
                let desc = matrixStat.row_descriptors[i];
                let stat = matrixStat.row_stats[i];
                let tableRow = [desc.id];
                if (this.rowAttributeData) {
                    if (this.rowMapping) {
                        tableRow = tableRow.concat(
                            this.rowAttributeData.instances[this.rowMapping[desc.id]]
                        );
                    } else {
                        tableRow = tableRow.concat(this.rowAttributeData.instances[desc.id]);
                    }
                }
                tableRow.push(
                    $.isNumeric(stat.min) ? stat.min.toFixed(2) : null,
                    $.isNumeric(stat.max) ? stat.max.toFixed(2) : null,
                    $.isNumeric(stat.avg) ? stat.avg.toFixed(2) : null,
                    $.isNumeric(stat.std) ? stat.std.toFixed(2) : null,
                    stat.missing_values ? 'Yes' : 'No'
                );
                tableData.push(tableRow);
            }
            tableColumns.push(
                { title: 'Min'},
                { title: 'Max'},
                { title: 'Average'},
                { title: 'Std. Dev.'},
                { title: 'Missing Values?'}
                );
            return {data: tableData, columns: tableColumns};
        },

        makeRow: function(name, value) {
            let $row = $('<tr/>')
                .append($('<th />').css('width','20%').append(name))
                .append($('<td />').append(value));
            return $row;
        },

        loading: function(isLoading) {
            if (isLoading) {
                this.showMessage('<img src=\'' + this.options.loadingImage + '\'/>');
            } else {
                this.hideMessage();
            }
        },

        showMessage: function(message) {
            let span = $('<span/>').append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        clientError: function(error){
            this.loading(false);
            // TODO: Don't know that this is a service error; should
            // inspect the error object.
            this.showMessage(error.message);
        }

    });
});
