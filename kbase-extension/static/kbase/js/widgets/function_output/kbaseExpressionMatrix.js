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
    'kb_common/jsonRpc/dynamicServiceClient',
		'kbase-generic-client-api',
    // For effect
    'bootstrap',
    'jquery-dataTables'
], function(
    Uuid,
    $,
    KBWidget,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    Config,
    DynamicServiceClient,
		GenericClient
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

            this.featureValues = new DynamicServiceClient({
                module: 'KBaseFeatureValues',
                url: Config.url('service_wizard'),
                token: auth.token
            });

            /*this.expressionUtils = new DynamicServiceClient({
                module: 'ExpressionAPI',
                url: Config.url('service_wizard'),
                token: auth.token,
                version : 'dev',
            });*/

            this.genericClient = new GenericClient(
              Config.url('service_wizard'),
              { token: auth.token, version : 'dev' }
            );

            /*this.expressionAPI = new expressionAPI(
                Config.url('service_wizard'),
                {'token': this.authToken()});*/
console.log("EU IS : ", this.genericClient, auth.token);
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
            var expressionMatrixRef = '16162/40/2';//this.options.workspaceID + '/' + this.options.expressionMatrixID;
            /*Promise.resolve(self.expressionAPI.get_enhancedFilteredExpressionMatrix({
                fem_objet_ref: expressionMatrixRef
            }))*/
            console.log("CALL ONE");
            self.genericClient.sync_call('ExpressionAPI.get_enhancedFilteredExpressionMatrix', [{
              fem_object_ref: expressionMatrixRef
            }] )
            .then( function (data) {
              console.log("I HAVE ME DATA : ", data);
              self.matrixStat = data[0].enhanced_FEM.data;
              self.render();
              self.loading(false);
            })

                /*.spread(function (data) {
                    self.matrixStat = data;
                    self.render();
                    self.loading(false);
                })*/
                .catch(function(error){
                console.log("FAILED WITH : ", error, expressionMatrixRef);
                    self.clientError(error);
                });
var oldStyleRef = this.options.workspaceID + '/' + this.options.expressionMatrixID;
console.log("OLD CALL", self.featureValues, oldStyleRef);
            self.featureValues.callFunc('get_matrix_stat', [{
                input_data: oldStyleRef
            }])
                .spread(function (data) {
console.log("OLD LOAD DATA : ", data);
                })
                .catch(function(error){
console.log("OLD CALL FAILED : ", error);
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
                .append(self.makeRow('Genome', $('<span />').append(matrixStat.mtx_descriptor.genome_name).css('font-style', 'italic')))
                .append(self.makeRow('Description', matrixStat.mtx_descriptor.description))
                .append(self.makeRow('# Conditions', matrixStat.mtx_descriptor.columns_count))
                .append(self.makeRow('# Features', matrixStat.mtx_descriptor.rows_count))
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
                    'sDom': 'lftip',
                    'aaData': self.buildConditionsTableData(),
                    'aoColumns': [
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

            $('<table id="'+pref+'genes-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($tabGenes)
                .dataTable({
                    sDom: 'lftip',
                    aaData: self.buildGenesTableData(),
                    aoColumns: [
                        { sTitle: 'Feature ID', mData: 'id'},
                        { sTitle: 'Function', mData: 'function'},
                        { sTitle: 'Min', mData:'min' },
                        { sTitle: 'Max', mData:'max' },
                        { sTitle: 'Average', mData:'avg' },
                        { sTitle: 'Std. Dev.', mData:'std'},
                        { sTitle: 'Missing Values?', mData:'missing_values' }
                    ]
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
                    min: stat.min ? stat.min.toFixed(2) : null,
                    max: stat.max ? stat.max.toFixed(2) : null,
                    avg: stat.avg ? stat.avg.toFixed(2) : null,
                    std: stat.std ? stat.std.toFixed(2) : null,
                    missing_values: stat.missing_values ? 'Yes' : 'No'
                });
            }
            return tableData;
        },

        buildGenesTableData: function(){
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
