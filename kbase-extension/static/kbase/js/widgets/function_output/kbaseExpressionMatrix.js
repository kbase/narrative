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
        name: 'kbaseExpressionMatrix',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.2',
        options: {
            expressionMatrixID: null,
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
            if (this.options.expressionMatrixID == null) {
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
            var expressionMatrixRef = this.options.upas.expressionMatrixID;

            // this is the "old" method that loads up the Conditions table and some of the values in the Overview table
            var get_matrix_stat_promise = self.genericClient.sync_call('KBaseFeatureValues.get_matrix_stat', [{
                input_data: expressionMatrixRef
            }]);

            // this is the "new" method that loads an enhanced filter expression matrix, with an enhanced feature table that also
            // contains q-value and fold change columns. Unfortunately, at the time that this widget went out, the service was fairly
            // twitchy and prone to falling over - there were auth token issues that were resolved, but 502 bad gateway errors are
            // still cropping up fairly often, which diminishes user experience.
            //
            // so there are a couple of bandaids in here to fall back on the old table data if this widget is deployed and the expression api
            // service goes down.
            var enhancedFilter_promise = self.genericClient.sync_call('ExpressionAPI.get_enhancedFilteredExpressionMatrix', [{
              fem_object_ref: expressionMatrixRef
            }] );

            // first thing we do is our old get_matrix_stat call, which we need for the conditions table.
            get_matrix_stat_promise
              .then( function (res) {

                self.matrixStat     = res[0];
                // the number of features was defined in the old method call.

                self.numFeatures = self.matrixStat.mtx_descriptor.rows_count;

                // now we see if our expression api enhanced filter call works. If it did, then we keep a
                // record of that object and update our numFeatures. That number *should* always be the same, but better
                // safe than sorry
                enhancedFilter_promise.then(function(res) {
                  self.enhancedFeatures = res[0].enhanced_FEM.data;
                  self.numFeatures      = self.enhancedFeatures.values.length;
                })
                // once we've checked that enhancedFilter_promise, then no matter what we render our widget and flag that we're no longer loading
                .finally( function() {
                  self.render();
                  self.loading(false);
                })
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
            var enhancedFeatures = this.enhancedFeatures;

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
                .append(self.makeRow('Genome', $('<span />').append(matrixStat.mtx_descriptor.genome_name).css('font-style', 'italic')))
                .append(self.makeRow('Description', matrixStat.mtx_descriptor.description))
                .append(self.makeRow('# Conditions', matrixStat.mtx_descriptor.columns_count))
                .append(self.makeRow('# Features', self.numFeatures))
                .append(self.makeRow('Scale', matrixStat.mtx_descriptor.scale))
                .append(self.makeRow('Value type', matrixStat.mtx_descriptor.type))
                .append(self.makeRow('Row normalization', matrixStat.mtx_descriptor.row_normalization))
                .append(self.makeRow('Column normalization', matrixStat.mtx_descriptor.col_normalization));

            /////////////////////////////////// Conditions tab ////////////////////////////////////////////

            var $tabConditions = $('<div/>');
            tabWidget.addTab({tab: 'Conditions', content: $tabConditions, canDelete : false, show: false});

            ///////////////////////////////////// Conditions table ////////////////////////////////////////////

            $tabConditions.append(
                $('<div style="font-size: 1.2em; width:100%; text-align: center;">Browse Conditions</div>')
            );
            $tabConditions.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">Statistics calculated across all features in a condition</div>')
            );


            $('<table id="'+pref+'conditions-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($tabConditions)
                .dataTable( {
                    'dom': '<\'row\'<\'col-sm-6\'B><\'col-sm-6\'f>>t<\'row\'<\'col-sm-4\'i><\'col-sm-8\'lp>>',
                    'aaData': self.buildConditionsTableData(),
                    'buttons': ['copy', 'csv', 'print'],
                    'columns': [
                        { sTitle: 'Condition ID', mData:'name' },
                        { sTitle: 'Min', mData:'min' },
                        { sTitle: 'Max', mData:'max' },
                        { sTitle: 'Average', mData:'avg' },
                        { sTitle: 'Std. Dev.', mData:'std'},
                        { sTitle: 'Missing Values?',  mData:'missing_values' }
                    ]
                } );

            ///////////////////////////////////// Genes tab ////////////////////////////////////////////
            var $tabGenes = $('<div/>');
            tabWidget.addTab({tab: 'Features', content: $tabGenes, canDelete : false, show: false});

            ///////////////////////////////////// Genes table ////////////////////////////////////////////

            $tabGenes.append(
                $('<div style="font-size: 1.2em; width:100%; text-align: center;">Browse Features</div>')
            );
            $tabGenes.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">Statistics calculated across all conditions for the feature</div>')
            );

            /* XXX - due to the notes up above about the ExpressionAPI sometimes failing, we keep track of what the old columns were in the table, as well as
                     the new columns from the new method. Then a smidge later, we look to see if we have an enhancedFeatures object. If we do, then we use
                     the new columns, and if not then we fall back to the old columns, since we're using the old method.
            */
            var oldFeatureTableColumns =
              [
                  { sTitle: 'Feature ID', mData: 'id'},
                  { sTitle: 'Function', mData: 'function'},
                  { sTitle: 'Min', mData:'min' },
                  { sTitle: 'Max', mData:'max' },
                  { sTitle: 'Average', mData:'avg' },
                  { sTitle: 'Std. Dev.', mData:'std'},
                  { sTitle: 'Missing Values?', mData:'missing_values' },
                  { sTitle: 'Fold Change', mData:'fold-change' },
                  { sTitle: 'Q Value', mData:'q-value' }
              ]
            ;

            var newFeatureTableColumns =
              [
                  { sTitle: 'Feature ID', mData: 'id'},
                  { sTitle: 'Function', mData: 'description'},
                  { sTitle: 'Min', mData:'min' },
                  { sTitle: 'Max', mData:'max' },
                  { sTitle: 'Average', mData:'mean' },
                  { sTitle: 'Std. Dev.', mData:'std_dev'},
                  { sTitle: 'Missing Values?', mData:'is_missing_values' },
                  { sTitle: 'Fold Change', mData:'fold-change' },
                  { sTitle: 'Q Value', mData:'q-value' }
              ]
            ;

            var featureTableColumns = self.enhancedFeatures
              ? newFeatureTableColumns
              : oldFeatureTableColumns;



            $('<table id="'+pref+'genes-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($tabGenes)
                .dataTable({
                    dom: '<\'row\'<\'col-sm-6\'B><\'col-sm-6\'f>>t<\'row\'<\'col-sm-4\'i><\'col-sm-8\'lp>>',
                    aaData: self.buildGenesTableData(),
                    aoColumns: featureTableColumns,
                    buttons: ['copy', 'csv', 'print']
                });
        },

        buildConditionsTableData: function(){
            var matrixStat = this.matrixStat;
            var tableData = [];
            for(var i = 0; i < matrixStat.column_descriptors.length; i++){
                var desc = matrixStat.column_descriptors[i];
                var stat = matrixStat.column_stats[i];
                tableData.push({
                    index: desc.index,
                    id: desc.id,
                    name: desc.name,
                    min: typeof stat.min.toFixed === "function" ? stat.min.toFixed(2) : stat.min,
                    max: typeof stat.max.toFixed === "function" ? stat.max.toFixed(2) : stat.max,
                    avg: typeof stat.avg.toFixed === "function" ? stat.avg.toFixed(2) : stat.avg,
                    std: typeof stat.std.toFixed === "function" ? stat.std.toFixed(2) : stat.avg,
                    missing_values: stat.missing_values ? 'Yes' : 'No'
                });
            }
            return tableData;
        },

        buildGenesTableData: function(){

            var enhancedFeatures = this.enhancedFeatures;

            /* XXX - finally in here, we look to see if we have our enhancedFeatures object. If we don't then we're going to bow out
                     and fall back to 'oldBuildGenesTableData', which was the old method accessing the old data, just renamed. If we
                     *do* have data, then we just continue on and build our table.
            */
            if (enhancedFeatures === undefined) {
              return this.oldBuildGenesTableData();
            }

            var tableData = [];

            var key_to_idx_map = [];
            for (var i = 0; i < enhancedFeatures.col_ids.length; i++) {
              key_to_idx_map[ enhancedFeatures.col_ids[i] ] = i;
            }

            for (var i = 0; i < enhancedFeatures.values.length; i++) {

              var fold_change = enhancedFeatures.values[i][ key_to_idx_map['fold-change'] ];
              if ($.isNumeric(fold_change)) {
                fold_change = fold_change.toFixed(2);
              }
              var q_value = enhancedFeatures.values[i][ key_to_idx_map['q-value'] ];
              if ($.isNumeric(q_value)) {
                q_value = q_value.toFixed(2);
              }

              tableData.push(
                {
                  index             : i,
                  id                : enhancedFeatures.row_ids[i],
                  description       : enhancedFeatures.values[i][ key_to_idx_map['description'] ],
                  min               : enhancedFeatures.values[i][ key_to_idx_map['min'] ].toFixed(2),
                  max               : enhancedFeatures.values[i][ key_to_idx_map['max'] ].toFixed(2),
                  mean              : enhancedFeatures.values[i][ key_to_idx_map['mean'] ].toFixed(2),
                  std_dev           : enhancedFeatures.values[i][ key_to_idx_map['std_dev'] ].toFixed(2),
                  is_missing_values : enhancedFeatures.values[i][ key_to_idx_map['is_missing_values'] ],
                  'fold-change'     : fold_change,
                  'q-value'         : q_value
                }
              )
            };

            return tableData;
        },

        oldBuildGenesTableData: function(){
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
                        function : desc.properties.function || '-',
                        min: $.isNumeric(stat.min) ? stat.min.toFixed(2) : null,
                        max: $.isNumeric(stat.max) ? stat.max.toFixed(2) : null,
                        avg: $.isNumeric(stat.avg) ? stat.avg.toFixed(2) : null,
                        std: $.isNumeric(stat.std) ? stat.std.toFixed(2) : null,
                        missing_values: stat.missing_values ? 'Yes' : 'No',
                        'fold-change' : 'enhanced features not available right now',
                        'q-value' : 'enhanced features not available right now'
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
                id: this.options.expressionMatrixID,
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
