define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseHistogram',
    'kbase-client-api',
    'kbaseTable',
    'bluebird',
    'kbaseExpressionVolcanoPlot',
    'kbaseTabs',
    'kb_service/client/workspace',
    'narrativeConfig',
    'common/runtime',
], function (
    KBWidget,
    bootstrap,
    $,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    kbaseHistogram,
    kbase_client_api,
    kbaseTable,
    Promise,
    KBaseExpressionVolcanoPlot,
    KBaseTabs,
    Workspace,
    Config,
    Runtime
) {
    'use strict';

    return KBWidget({
        name: 'kbaseDifferentialExpressionMatrixSetViewer',
        parent: kbaseAuthenticatedWidget,

        version: '1.0.0',

        init: function init(options) {
            this._super(options);

            var $self = this;
            $self.obj_ref = this.options.upas.obj_ref;

            var $volcanoDiv = $.jqElem('div');
            var $volcano = new KBaseExpressionVolcanoPlot($volcanoDiv, {
                diffExprMatrixSet_ref: this.obj_ref,
            });
            //this.$elem.append($volcanoDiv);

            var $tableDiv = $.jqElem('div')
                .append($.jqElem('i').addClass('fa fa-spinner fa-spin fa-2x'))
                .append(
                    '<br>Loading data... please wait...<br>Data processing may take upwards of 30 seconds, during which time this page may be unresponsive.<br><br>'
                );

            this.renderTable($tableDiv);

            var $tabsDiv = $.jqElem('div');
            var $tabs = new KBaseTabs($tabsDiv, {
                tabs: [
                    {
                        tab: 'Volcano Plot',
                        content: $volcanoDiv,
                    },
                    {
                        tab: 'Meta',
                        content: $tableDiv,
                    },
                ],
            });

            this.$elem.append($tabsDiv);
        },

        renderTable: function renderTable($tableDiv) {
            var kbws = new Workspace(Config.url('workspace'), {
                token: Runtime.make().authToken(),
            });

            kbws.get_objects([{ ref: this.obj_ref }], function (results) {
                $tableDiv.empty();
                $tableDiv.append('Label : ' + results[0].data.items[0].label);
            });
        },
    });
});
