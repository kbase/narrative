/**
 * Output widget to visualize a Reads Alignment object.
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
        name: 'kbaseAlignment',
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
                self.objData = res[0]['data'];
                self.objData.alignment_stats['total_reads'] =
                    self.objData.alignment_stats['mapped_reads'] +
                    self.objData.alignment_stats['unmapped_reads'];
                self.render();
                self.loading(false);
            });
        },

        render: function() {
            var self = this;
            var pref = this.pref;
            var container = this.$elem;
            var objData = this.objData;

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
                .append(self.makeRow('Aligned Using', objData.aligned_using))
                .append(self.makeRow('Aligner Version', objData.aligner_version))
                .append(self.makeRow('Library Type', objData.library_type))
                .append(self.makeRow('Total Reads',
                    objData.alignment_stats.total_reads.toLocaleString()))
                .append(self.makeRow('Unmapped Reads', self.formatPercentage(
                    objData.alignment_stats.unmapped_reads,
                    objData.alignment_stats.total_reads)))
                .append(self.makeRow('Mapped Reads', self.formatPercentage(
                    objData.alignment_stats.mapped_reads,
                    objData.alignment_stats.total_reads)))
                .append(self.makeRow('Multiple Alignments', self.formatPercentage(
                    objData.alignment_stats.multiple_alignments,
                    objData.alignment_stats.mapped_reads)))
                .append(self.makeRow('Singletons', self.formatPercentage(
                    objData.alignment_stats.singletons,
                    objData.alignment_stats.mapped_reads)));
        },

        formatPercentage: function(value, total) {
            var percent = (value / total * 100).toFixed(2);
            return value.toLocaleString() + ' (' + percent + '%)'
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
