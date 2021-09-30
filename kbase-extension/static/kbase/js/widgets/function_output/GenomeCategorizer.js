/**
 * Output widget to visualize a GenomeCategorizer object.
 * @public
 */

define([
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
    'datatables.net-buttons-print',
], (Uuid, $, KBWidget, kbaseAuthenticatedWidget, kbaseTabs, Config) => {
    'use strict';

    return KBWidget({
        name: 'GenomeCategorizer',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.2',
        options: {
            objID: null,
            workspaceID: null,
            loadingImage: Config.get('loading_gif'),
        },

        // Prefix for all div ids
        pref: null,
        token: null,
        trainingSetData: null,

        init: function (options) {
            this._super(options);
            this.pref = new Uuid(4).format();
            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);
            return this;
        },

        loggedInCallback: function (event, auth) {
            // error if not properly initialized
            if (this.options.upas.objID == null) {
                this.showMessage("[Error] Couldn't retrieve the object.");
                return this;
            }
            this.wsClient = new Workspace(Config.url('workspace'), { token: auth.token });

            // Let's go...
            this.loadAndRender();

            return this;
        },

        loggedOutCallback: function () {
            this.isLoggedIn = false;
            return this;
        },

        loadAndRender: function () {
            const self = this;
            self.loading(true);

            self.wsClient.get_objects([{ ref: this.options.upas.objID }]).then((res) => {
                self.objData = res[0]['data'];
                if (self.objData.training_set_ref) {
                    self.wsClient
                        .get_objects([{ ref: self.objData.training_set_ref }])
                        .then((res) => {
                            self.trainingSetData = res[0]['data'];
                            self.render();
                            self.loading(false);
                        });
                } else {
                    self.render();
                    self.loading(false);
                }
            });
        },

        render: function () {
            const self = this;
            const pref = this.pref;
            const container = this.$elem;
            const objData = this.objData;

            ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
            container.empty();
            const tabPane = $('<div id="' + pref + 'tab-content">');
            container.append(tabPane);

            const tabWidget = new kbaseTabs(tabPane, { canDelete: true, tabs: [] });
            ///////////////////////////////////// Overview table ////////////////////////////////////////////
            const tabOverview = $('<div/>');
            tabWidget.addTab({
                tab: 'Overview',
                content: tabOverview,
                canDelete: false,
                show: true,
            });
            const tableOver = $(
                '<table class="table table-striped table-bordered" ' +
                    'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' +
                    pref +
                    'overview-table"/>'
            );
            tabOverview.append(tableOver);
            tableOver
                .append(self.makeRow('Classifier Name', objData.classifier_name))
                .append(self.makeRow('Classifier Type', objData.classifier_type))
                .append(self.makeRow('Classifier description', objData.classifier_description))
                .append(self.makeRow('Attribute type', objData.attribute_type))
                .append(self.makeRow('Number of genomes', objData.number_of_genomes))
                .append(self.makeRow('Number of attributes', objData.number_of_attributes))
                .append(self.makeRow('TrainingSet', objData.training_set_ref));

            /////////////////////////////////// Training Set table ////////////////////////////////////////////

            if (this.trainingSetData) {
                const $tabColumns = $('<div/>');
                tabWidget.addTab({
                    tab: 'Training Set',
                    content: $tabColumns,
                    canDelete: false,
                    show: false,
                });

                $(
                    '<table id="' +
                        pref +
                        'column-table" class="table table-bordered table-striped" ' +
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;"></table>'
                )
                    .appendTo($tabColumns)
                    .dataTable({
                        dom: "<'row'<'col-sm-6'B><'col-sm-6'f>>t<'row'<'col-sm-4'i><'col-sm-8'lp>>",
                        data: self.buildTrainingSetData(),
                        buttons: ['copy', 'csv', 'print'],
                        columns: [
                            { title: 'Genome', data: 'name' },
                            { title: 'Class', data: 'class' },
                        ],
                    });
            }
        },

        buildTrainingSetData: function () {
            const objData = this.trainingSetData;
            const tableData = [];
            for (let i = 0; i < objData.classification_data.length; i++) {
                const desc = objData.classification_data[i];
                tableData.push({
                    id: desc.id,
                    name: desc.genome_name,
                    class: desc.genome_classification,
                });
            }
            return tableData;
        },

        makeRow: function (name, value) {
            const $row = $('<tr/>')
                .append($('<th />').css('width', '20%').append(name))
                .append($('<td />').append(value));
            return $row;
        },

        loading: function (isLoading) {
            if (isLoading) {
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            } else {
                this.hideMessage();
            }
        },

        showMessage: function (message) {
            const span = $('<span/>').append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function () {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },
    });
});
