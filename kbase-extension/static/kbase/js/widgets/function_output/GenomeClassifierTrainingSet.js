/**
 * Output widget to visualize GenomeClassifierTrainingSet object.
 * @public
 */

define ([
    'uuid',
    'jquery',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'narrativeConfig',
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
    Config
) {
    'use strict';

    return KBWidget({
        name: 'GenomeClassifierTrainingSet',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.2',
        options: {
            objID: null,
            workspaceID: null,
            loadingImage: Config.get('loading_gif')
        },

        // Prefix for all div ids
        pref: null,
        token: null,
        trainingSetData: null,

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
            if (this.options.upas.objID == null) {
                this.showMessage('[Error] Couldn\'t retrieve the object.');
                return this;
            }
            this.wsClient = new Workspace(Config.url('workspace'), {token: auth.token});

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

            self.wsClient.get_objects(
                [{ref: this.options.upas.objID}]
            ).then( function (res) {
                self.trainingSetData = res[0]['data'];
                self.render();
                self.loading(false);
            });
        },

        render: function() {
            var self = this;
            var pref = this.pref;
            var container = this.$elem;
            var objData = this.trainingSetData;

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
                .append(self.makeRow('Training Set Name', objData.name))
                .append(self.makeRow('Training Set description', objData.description))
                .append(self.makeRow('Classification type', objData.classification_type))
                .append(self.makeRow('Number of genomes', objData.number_of_genomes))
                .append(self.makeRow('Number of Classes', objData.number_of_classes));

            /////////////////////////////////// Training Set table ////////////////////////////////////////////

            var $tabColumns = $('<div/>');
            tabWidget.addTab({
                tab: 'Training Set',
                content: $tabColumns,
                canDelete: false,
                show: false
            });

            $('<table id="' + pref + 'column-table" class="table table-bordered table-striped" ' +
                'style="width: 100%; margin-left: 0px; margin-right: 0px;"></table>')
                .appendTo($tabColumns)
                .dataTable({
                    'dom': "<'row'<'col-sm-6'B><'col-sm-6'f>>t<'row'<'col-sm-4'i><'col-sm-8'lp>>",
                    'data': self.buildTrainingSetData(),
                    'buttons': ['copy', 'csv', 'print'],
                    'columns': [
                        {title: 'Genome', data: 'name'},
                        {title: 'Class', data: 'class'}
                    ]
                });
        },

        buildTrainingSetData: function(){
            var objData = this.trainingSetData;
            var tableData = [];
            for(var i = 0; i < objData.classification_data.length; i++){
                var desc = objData.classification_data[i];
                tableData.push({
                    id: desc.id,
                    name: desc.genome_name,
                    class: desc.genome_classification
                });
            }
            return tableData;
        },

        makeRow: function(name, value) {
            var $row = $('<tr/>')
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
            var span = $('<span/>').append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        }
    });
});
