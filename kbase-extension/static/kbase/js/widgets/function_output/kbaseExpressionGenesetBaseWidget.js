/**
 * Base class for viewers visualizaing expression of a set of genes from various aspects
 *
 * The descendant classes should override:
 * 1. getSubmatrixParams - to set params for get_submatrix_stat method from the KBaseFeatureValues service
 * 2. buildWidget - to create a custom visuzualization
 *
 *
 *
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define([
    'kbwidget',
    'jquery',
    'uuid',
    'kbaseAuthenticatedWidget',
    'narrativeConfig',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    'widgets/common/ErrorView',
    'widgets/common/LoadingMessage',

    // Loaded for effect
    'jquery-dataTables',
    'kbaseFeatureValues-client-api',
    'bootstrap',
    'kbaseTabs',
], (
    KBWidget,
    $,
    Uuid,
    kbaseAuthenticatedWidget,
    Config,
    DynamicServiceClient,
    ServiceClient,
    $ErrorView,
    $LoadingMessage
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseExpressionGenesetBaseWidget',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            workspaceID: null,
            expressionMatrixID: null,
            geneIds: null,
            input_featureset: null,
        },
        // Prefix for all div ids
        pref: null,
        // Matrix set stat
        submatrixStat: null,
        init: function (options) {
            this._super(options);
            this.pref = new Uuid(4).format();

            // console.log('INIT', options);

            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            return this;
        },
        loggedInCallback: function (event, auth) {
            this.featureValues = new DynamicServiceClient({
                module: 'KBaseFeatureValues',
                url: Config.url('service_wizard'),
                token: auth.token,
            });
            this.ws = new ServiceClient({
                module: 'Workspace',
                url: Config.url('workspace'),
                token: auth.token,
            });

            // Let's go...
            this.loadAndRender();
            return this;
        },
        loggedOutCallback: function () {
            this.isLoggedIn = false;
            return this;
        },
        setTestParameters: function () {
            this.options.workspaceID = '645';
            this.options.expressionMatrixID = '9';
            this.options.geneIds =
                'VNG0001H,VNG0002G,VNG0003C,VNG0006G,VNG0013C,VNG0014C,VNG0361C,VNG0518H,VNG0868H,VNG0289H,VNG0852C';
        },
        // To be overridden to specify additional parameters
        getSubmatrixParams: function () {
            const self = this;
            self.setTestParameters();
            let features = [];
            if (self.options.geneIds) {
                features = $.map(self.options.geneIds.split(','), $.trim);
            }
            return {
                input_data: self.options.workspaceID + '/' + self.options.expressionMatrixID,
                row_ids: features,
                // specify your additional parameters
            };
        },
        loadAndRender: function () {
            const self = this;
            self.loading(true);

            async function getSubmatrixStatsAndRender() {
                const smParams = self.getSubmatrixParams();

                // some parameter checking
                if (!smParams.row_ids || smParams.row_ids.length === 0) {
                    self.renderError(
                        'No Features or FeatureSet selected.  Please include at least one Feature from the data.'
                    );
                    return;
                }

                try {
                    const [data] = await self.featureValues.callFunc('get_submatrix_stat', [
                        smParams,
                    ]);
                    self.submatrixStat = data;
                    self.render();
                    self.loading(false);
                } catch (ex) {
                    self.renderError(ex);
                }
            }

            // if a feature set is defined, use it.
            if (self.options.featureset) {
                return self.ws
                    .callFunc('get_objects', [
                        [
                            {
                                ref: self.options.workspaceID + '/' + self.options.featureset,
                            },
                        ],
                    ])
                    .spread((fdata) => {
                        const fs = fdata[0].data;
                        if (!self.options.geneIds) {
                            self.options.geneIds = '';
                        }

                        for (const fid in fs.elements) {
                            // this always comes from an rpc call, which is
                            // always a plain object ({}.constructor).
                            if (Object.prototype.hasOwnPrototype.call(fs.elements, fid)) {
                                if (self.options.geneIds) {
                                    self.options.geneIds += ',';
                                }
                                self.options.geneIds += fid;
                            }
                        }
                        getSubmatrixStatsAndRender();
                    })
                    .catch((error) => {
                        console.error('got it not xx!!', error);
                        self.renderError(error);
                    });
            } else {
                return getSubmatrixStatsAndRender();
            }
        },
        render: function () {
            const $overviewContainer = $('<div>');
            this.$elem.append($overviewContainer);
            this.renderOverview($overviewContainer);

            // Separator
            this.$elem.append($('<div style="margin-top:1em"></div>'));

            const $vizContainer = $('<div>');
            this.$elem.append($vizContainer);
            this.buildWidget($vizContainer);
        },
        renderOverview: function ($container) {
            const pref = this.pref;

            const $overviewSwitch = $('<a/>')
                .html('[Show/Hide Selected Features]')
                .css('cursor', 'pointer');
            $container.append($overviewSwitch);

            const $overviewContainer = $('<div hidden style="margin:1em 0 4em 0"/>');
            $container.append($overviewContainer);

            const geneData = this.buildGenesTableData();
            const iDisplayLength = 10;
            let style = 'lftip';
            if (geneData.length <= iDisplayLength) {
                style = 'fti';
            }

            $overviewContainer.append(
                $(
                    '<table id="' +
                        pref +
                        'genes-table"  \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>'
                ).dataTable({
                    sDom: style,
                    iDisplayLength: iDisplayLength,
                    aaData: geneData,
                    aoColumns: [
                        { sTitle: 'Name', mData: 'id', width: '10em' },
                        { sTitle: 'Function', mData: 'function' },
                        { sTitle: 'Min', mData: 'min' },
                        { sTitle: 'Max', mData: 'max' },
                        { sTitle: 'Avg', mData: 'avg' },
                        { sTitle: 'Std', mData: 'std' },
                        { sTitle: 'Missing', mData: 'missing_values' },
                    ],
                    oLanguage: {
                        sEmptyTable: 'No genes found!',
                        sSearch: 'Search: ',
                    },
                })
            );

            $overviewSwitch.click(() => {
                $overviewContainer.toggle();
            });
        },
        buildGenesTableData: function () {
            const submatrixStat = this.submatrixStat;
            const tableData = [];
            const stats = submatrixStat.row_set_stats;
            for (let i = 0; i < submatrixStat.row_descriptors.length; i++) {
                const desc = submatrixStat.row_descriptors[i];
                const gene_function = desc.properties['function'];
                tableData.push({
                    index: desc.index,
                    id: desc.id,
                    name: desc.name || '-',
                    function: gene_function || '-',
                    min: stats.mins[i] ? stats.mins[i].toFixed(2) : null,
                    max: stats.maxs[i] ? stats.maxs[i].toFixed(2) : null,
                    avg: stats.avgs[i] ? stats.avgs[i].toFixed(2) : null,
                    std: stats.stds[i] ? stats.stds[i].toFixed(2) : null,
                    missing_values: stats.missing_values[i],
                });
            }
            return tableData;
        },
        // To be overriden
        buildWidget: null,

        makeRow: function (name, value) {
            const $row = $('<tr/>')
                .append($('<th />').css('width', '20%').append(name))
                .append($('<td />').append(value));
            return $row;
        },
        loading: function (isLoading) {
            if (isLoading) {
                this.showMessage($LoadingMessage('Loading...'));
            } else {
                this.hideMessage();
            }
        },
        showMessage: function ($message) {
            this.$messagePane.html($message);
            this.$messagePane.show();
        },
        hideMessage: function () {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },
        renderError: function (error) {
            this.loading(false);
            this.$elem.empty();
            this.$elem.html($ErrorView(error));
        },
        buildObjectIdentity: function (workspaceID, objectID, objectVer, wsRef) {
            const obj = {};
            if (wsRef) {
                obj['ref'] = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID)) obj['wsid'] = workspaceID;
                else obj['workspace'] = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID)) obj['objid'] = objectID;
                else obj['name'] = objectID;

                if (objectVer) obj['ver'] = objectVer;
            }
            return obj;
        },
    });
});
