/**
 * Output widget to vizualize FeatureClusters object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define([
    'jquery',
    'base/js/namespace',
    'kbwidget',
    'narrativeConfig',
    'util/string',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseExpressionSparkline',
    'kbaseExpressionHeatmap',
    'kbaseExpressionPairwiseCorrelation',
    'kb_common/jsonRpc/genericClient',

    // For effect
    'jquery-dataTables',
    'bootstrap',
    'knhx',
    'kbaseTreechart',
    'css!widgets/function_output/kbaseExpressionFeatureClusters.css'
], (
    $,
    Jupyter,
    KBWidget,
    Config,
    StringUtil,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    kbaseExpressionSparkline,
    kbaseExpressionHeatmap,
    kbaseExpressionPairwiseCorrelation,
    ServiceClient
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseExpressionFeatureClusters',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            clusterSetID: null,
            workspaceID: null,
            loadingImage: Config.get('loading_gif'),
        },

        // Extracted data for visualization
        clusterSet: null,
        expMatrixRef: null,
        expMatrixName: null,
        genomeRef: null,
        featureMapping: null,
        matrixRowIds: null,
        matrixColIds: null,
        genomeID: null,
        genomeName: null,
        features: null,

        init: function (options) {
            this._super(options);
            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);
            return this;
        },

        loggedInCallback: function (event, auth) {
            // error if not properly initialized
            if (this.options.clusterSetID == null) {
                this.showMessage("[Error] Couldn't retrieve clusters");
                return this;
            }

            // Create a new workspace client
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
            this.ws = null;
            this.isLoggedIn = false;
            return this;
        },

        loadAndRender: function () {
            const self = this;

            self.loading(true);

            const clusterSetRef = this.options.upas.clusterSetID;

            // Note order of calls is important here; state is stored in the object.
            this.ws
                .callFunc('get_objects2', [
                    {
                        objects: [
                            {
                                ref: clusterSetRef,
                            },
                        ],
                    },
                ])
                .then(([result]) => {
                    // get_objects2 returns a list of ObjectData
                    // https://github.com/kbase/workspace_deluxe/blob/0964b09a95f9c617547d40c413d57598cd12d04c/workspace.spec#L1043
                    self.clusterSet = result.data[0].data;
                    self.expMatrixRef = self.clusterSet.original_data;

                    return self.ws
                        .callFunc('get_objects2', [
                            {
                                objects: [
                                    {
                                        ref: self.expMatrixRef,
                                        included: [
                                            '/genome_ref',
                                            '/feature_mapping',
                                            '/data/row_ids',
                                            '/data/col_ids',
                                        ],
                                    },
                                ],
                            },
                        ])
                        .then(
                            ([
                                {
                                    data: [matrixObj],
                                },
                            ]) => {
                                self.expMatrixName = matrixObj.info[1];
                                self.genomeRef = matrixObj.data.genome_ref;
                                self.featureMapping = matrixObj.data.feature_mapping;
                                self.matrixRowIds = matrixObj.data.data.row_ids;
                                self.matrixColIds = matrixObj.data.data.col_ids;

                                if (self.genomeRef) {
                                    return self.ws
                                        .callFunc('get_objects2', [
                                            {
                                                objects: [
                                                    {
                                                        ref: self.genomeRef,
                                                        included: [
                                                            '/id',
                                                            '/scientific_name',
                                                            '/features/[*]/id',
                                                            'features/[*]/type',
                                                            'features/[*]/function',
                                                            'features/[*]/functions',
                                                            'features/[*]/aliases',
                                                        ],
                                                    },
                                                ],
                                            },
                                        ])
                                        .then(
                                            ([
                                                {
                                                    data: [genomeObj],
                                                },
                                            ]) => {
                                                self.genomeID = genomeObj.info[1];
                                                self.genomeName = genomeObj.data.scientific_name;
                                                self.features = genomeObj.data.features;
                                                self.render();
                                            }
                                        )
                                        .catch((error) => {
                                            console.error(error);
                                            self.render();
                                        });
                                } else {
                                    self.render();
                                }
                            }
                        )
                        .catch((error) => {
                            console.error('ERROR', error);
                            self.clientError(error);
                        });
                })
                .catch((error) => {
                    console.error('ERROR', error);
                    self.clientError(error);
                });
        },

        render: function () {
            const self = this;
            const $container = this.$elem;
            const pref = StringUtil.uuid();
            self.pref = pref;

            self.loading(false);

            ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
            $container.empty();
            const tabPane = $('<div id="' + pref + 'tab-content">');
            $container.append(tabPane);

            const tabWidget = new kbaseTabs(tabPane, { canDelete: true, tabs: [] });
            ///////////////////////////////////// Overview table ////////////////////////////////////////////
            const tabOverview = $('<div style="margin-top: 10px;"/>');
            tabWidget.addTab({
                tab: 'Overview',
                content: tabOverview,
                canDelete: false,
                show: true,
            });
            const tableOver = $(
                '<table class="table table-striped table-bordered OverviewTable" ' +
                'id="' + pref + 'overview-table"/>'
            );
            tabOverview.append(tableOver);
            tableOver
                .append(self.makeRow('Feature clusters', self.clusterSet.feature_clusters.length))
                // .append( self.makeRow(
                // 	'Condition clusters',
                // 	self.clusterSet.condition_clusters.length ) )
                .append(
                    self.makeRow(
                        'Genome',
                        $('<span />').append(self.genomeName).css('font-style', 'italic')
                    )
                )
                .append(self.makeRow('Expression matrix', self.expMatrixName))
                .append(self.makeRow('Expression matrix: # conditions', self.matrixColIds.length))
                .append(self.makeRow('Expression matrix: # genes', self.matrixRowIds.length));

            ///////////////////////////////////// Clusters tab ////////////////////////////////////////////

            const $tabClusters = $('<div style="margin-top: 10px;"/>');
            tabWidget.addTab({
                tab: 'Clusters',
                content: $tabClusters,
                canDelete: false,
                show: false,
                whenShown: ($tab) => {
                    $clustersTable.DataTable().columns.adjust().draw();
                }
            });

            ///////////////////////////////////// Clusters table ////////////////////////////////////////////

            self.buildActionMenu($container);
            $(document).mousedown((e) => {
                // Hide menu on mousedown only if we are not inside the menu
                if (e.target.getAttribute('methodInput') == null) {
                    self.$menu.hide();
                }
            });

            const clusterTableData = self.buildClustersTableData();

            const $clustersTable = $(
                '<table id="' +
                pref +
                'clusters-table" \
                class="table table-bordered table-striped ClustersTable">\
                </table>'
            )
            
            $clustersTable.appendTo($tabClusters);

            $clustersTable.dataTable({
                sDom: 'lftip',
                aaData: clusterTableData,
                aoColumns: [
                    { sTitle: 'Pos.', mData: 'pos', width: '2em' },
                    { sTitle: 'Cluster', mData: 'clusterId' },
                    { sTitle: 'Number of genes', mData: 'size' },
                    { sTitle: 'Mean correlation', mData: 'meancor' },
                    {
                        sTitle: '',
                        mData: 'rowIndex',
                        mRender: function (rowIndex) {
                            return `<button class="btn btn-default ${pref}action_button" 
                                            data-rowindex="${rowIndex}">
                                        Explore Cluster  <span class="caret" />
                                    </button>`;
                        },
                        width: '15.5em',
                    },
                ],
                fnDrawCallback: onDraw,
            });

            function onDraw() {
                self.registerActionButtonClick(tabWidget);
                $clustersTable.find('[data-toggle="tooltip"]').tooltip();
                updateClusterLinks('clusters');
            }

            function updateClusterLinks(showClass) {
                $('.show-' + showClass + '_' + self.pref).unbind('click');
                $('.show-' + showClass + '_' + self.pref).click(function () {
                    const pos = $(this).data('pos');
                    const tabName = 'Cluster ' + pos;
                    if (tabWidget.hasTab(tabName)) {
                        tabWidget.showTab(tabName);
                        return;
                    }
                    const tabDiv = $('<div style="margin-top: 10px;"/>');
                    tabWidget.addTab({
                        tab: tabName,
                        content: tabDiv,
                        canDelete: true,
                        show: true,
                        deleteCallback: function (name) {
                            tabWidget.removeTab(name);
                        },
                    });
                    self.buildClusterFeaturesTable(tabDiv, pos);
                    tabWidget.showTab(tabName);
                });
            }

            ///////////////////////////////////// Features tab ////////////////////////////////////////////
            const featureTabDiv = $('<div style="margin-top: 10px;"/>');
            tabWidget.addTab({
                tab: 'Features',
                content: featureTabDiv,
                canDelete: false,
                show: false,
                whenShown: ($tab) => {
                    featureTabDiv.find('table').DataTable().columns.adjust().draw();
                }
            });
            self.buildClusterFeaturesTable(featureTabDiv, null, () => {
                updateClusterLinks('clusters2');
            });

            ///////////////////////////////////// Hierarchical dendrogram tab ////////////////////////////////////////////
            /*var newick = self.clusterSet.feature_dendrogram;
            if (newick) {
                var tree = kn_parse(newick);
                var root = self.transformKnhxTree(tree.root, 10);
                console.log(JSON.stringify(root.children[0].children[0].children[0].children[0]));
                var tabDendro = $("<div style='max-height: 600px;'/>");
                tabWidget.addTab({tab: 'Dendrogram', content: tabDendro, canDelete : false, show: false});
                var dendroPanel = $("<div/>");
                tabDendro.append(dendroPanel);
                 new kbaseTreechart(dendroPanel, {
                    lineStyle: 'square',
                    dataset: root
                });
            }*/
        },

        transformKnhxTree: function (node, scale) {
            const ret = {};
            if (node.d > 0) {
                ret.distance = node.d * scale;
            } else {
                ret.distance = 0;
            }
            if (node.child && node.child.length > 0) {
                const children = [];
                ret.children = children;
                for (let i = 0; i < node.child.length; i++)
                    children.push(this.transformKnhxTree(node.child[i], scale));
            } else {
                ret.name = 'Name: ' + node.name;
            }
            return ret;
        },

        registerActionButtonClick: function (tabWidget) {
            const self = this;
            const pref = self.pref;
            $('.' + pref + 'action_button').on('click', (e) => {
                let $actionButton = $(e.target);
                if ($actionButton.prop('tagName') !== 'BUTTON')
                    $actionButton = $actionButton.parent();
                const x = $actionButton.position().left;
                const y = $actionButton.position().top + $actionButton[0].offsetHeight;
                self.$menu
                    .data('invokedOn', $actionButton)
                    .css({
                        position: 'absolute',
                        left: x,
                        top: y,
                    })
                    .show()
                    .off('click')
                    .on('click', 'a', (e) => {
                        self.$menu.hide();

                        const $invokedOn = self.$menu.data('invokedOn');
                        const $selectedMenu = $(e.target);
                        const rowIndex = $invokedOn.data('rowindex');
                        const methodInput = $selectedMenu[0].getAttribute('methodInput');

                        if (methodInput === 'build_feature_set') {
                            /* exercise left for the reader */
                            /* IPython.narrative.createAndRunMethod(methodInput,
                            {
                              'input_genome':self.genomeID,
                              'input_feature_ids': geneIds.join(","),
                              'output_feature_set': self.options.clusterSetID + "_Cluster"+rowIndex+"_Features",
                              'description': 'Features were selected from Cluster ' + rowIndex + ' of a FeatureClusters data object '+
                                      'named ' + self.options.clusterSetID + '.'
                            }
                          ); */
                            Jupyter.narrative.addAndPopulateApp(
                                'KBaseFeatureValues/build_feature_set',
                                'release',
                                {
                                    input_genome: self.genomeRef,
                                    input_feature_ids: self.getClusterGeneIds(rowIndex),
                                    output_feature_set:
                                        self.options.clusterSetID +
                                        '_Cluster' +
                                        rowIndex +
                                        '_Features',
                                    description:
                                        'Features were selected from Cluster ' +
                                        rowIndex +
                                        ' of a FeatureClusters data object ' +
                                        'named ' +
                                        self.options.clusterSetID +
                                        '.',
                                }
                            );
                        } else {
                            const nameMap = {
                                view_expression_profile: 'Expression profile',
                                view_expression_pairwise_correlation: 'Pairwise correlation',
                                view_expression_heatmap: 'Heatmap',
                            };

                            const tabName = nameMap[methodInput] + ' for cluster_' + rowIndex;

                            const geneIds = self.getClusterGeneIds(rowIndex);

                            const $contentDiv = $('<div style="margin-top: 10px;" />');

                            tabWidget.addTab({
                                tab: tabName,
                                content: $contentDiv,
                                canDelete: true,
                                show: true,
                            });

                            const methodMap = {
                                view_expression_profile: kbaseExpressionSparkline,
                                view_expression_pairwise_correlation: kbaseExpressionPairwiseCorrelation,
                                view_expression_heatmap: kbaseExpressionHeatmap,
                            };

                            new methodMap[methodInput]($contentDiv, {
                                geneIds: geneIds.join(','),
                                expressionMatrixID: self.expMatrixName,
                                workspaceID: self.options.workspaceID,
                            });
                        }
                    });
            });
        },

        getClusterGeneIds: function (rowIndex) {
            const geneIds = [];
            for (const geneId in this.clusterSet.feature_clusters[rowIndex].id_to_pos) {
                geneIds.push(geneId);
            }
            return geneIds;
        },

        buildClustersTableData: function () {
            const self = this;
            // var row_ids = self.expressionMatrix.data.row_ids;
            // var col_ids = self.expressionMatrix.data.col_ids;
            const feature_clusters = self.clusterSet.feature_clusters;

            const tableData = [];

            let cluster;
            for (let i = 0; i < feature_clusters.length; i++) {
                cluster = feature_clusters[i];
                tableData.push({
                    pos: i,
                    clusterId: `<a class="show-clusters_${self.pref}" data-pos="${i}" style="cursor: pointer;">cluster_${i}</a>`,
                    size: Object.keys(cluster.id_to_pos).length,
                    meancor:
                        cluster.meancor == null || typeof cluster.meancor === 'undefined'
                            ? 'N/A'
                            : cluster.meancor.toFixed(3),
                    rowIndex: i,
                });
            }

            return tableData;
        },

        buildActionMenu: function ($container) {
            const $menu = $(
                ' \
                <ul id="contextMenu" class="dropdown-menu" role="menu" style="display:none; list-style:none; margin:0; padding-left: 0;" > \
                    <li><a tabindex="-1" href="#" methodInput="view_expression_profile">View expression profile</a></li> \
                    <li><a tabindex="-1" href="#" methodInput="view_expression_pairwise_correlation">View pairwise correlation</a></li> \
                    <li><a tabindex="-1" href="#" methodInput="view_expression_heatmap">View in sortable condition heatmap</a></li> \
                    <li class="divider"></li> \
                    <li><a tabindex="-1" href="#" methodInput="build_feature_set">Create a FeatureSet</a></li> \
                </ul> \
            '
            );

            /* XXX

          This doesn't work yet. It'll need to go up into the string above, inside the ul.

          The known issue is that it's trying to pass in an object reference (or name or whatever) into the create feature set app, but that
          was designed on the explicit assumption that it'd only be given names of objects within the current narrative. But this would hand in
          a full ref to an object in another workspace, which the app can't handle.

          Once the code is updated to allow something like that, we can re-enable it. The rest of the wiring should be ready to go.
        */

            // <li class="divider"></li> \
            // <li><a tabindex="-1" href="#" methodInput="build_feature_set">Create a FeatureSet</a></li> \

            $container.append($menu);
            this.$menu = $menu;
        },

        buildClusterFeaturesTable: function (tabDiv, pos, events) {
            const self = this;
            const tableData = [];
            const table = $(
                '<table class="table table-bordered table-striped ClusterFeaturesTable"></table>'
            );
            tabDiv.append(table);

            const id2features = self.buildFeatureId2FeatureHash();
            let min_cluster_pos = 0;
            let max_cluster_pos = self.clusterSet.feature_clusters.length - 1;
            if (pos != null) {
                min_cluster_pos = pos;
                max_cluster_pos = pos;
            }
            for (let cluster_pos = min_cluster_pos; cluster_pos <= max_cluster_pos; cluster_pos++)
                for (const rowId in self.clusterSet.feature_clusters[cluster_pos].id_to_pos) {
                    let fid = rowId;
                    if (self.featureMapping) {
                        fid = self.featureMapping[rowId];
                        if (!fid) fid = rowId;
                    }
                    let gid = '-';
                    let genomeRef = null;
                    if (self.genomeRef) {
                        genomeRef = self.genomeRef.split('/')[0] + '/' + self.genomeID;
                        gid =
                            '<a href="/#dataview/' +
                            genomeRef +
                            '" target="_blank">' +
                            self.genomeName +
                            '</a>';
                    }
                    let aliases = '-';
                    let type = '-';
                    let func = '-';
                    const feature = id2features[fid];
                    if (feature) {
                        if (feature.aliases && feature.aliases.length > 0) {
                            aliases = feature.aliases.join(', ');
                        }
                        if (feature.type) {
                            type = feature.type;
                        }
                        if (feature.function) {
                            func = feature.function;
                        }
                        if (feature.functions) {
                            func = feature.functions.join(', ');
                        }
                    }
                    if (genomeRef) {
                        fid = `<a href="/#dataview/${genomeRef}?sub=Feature&subid=${fid}" target="_blank">${fid}</a>`;
                    }
                    tableData.push({
                        fid,
                        cid: `<a class="show-clusters2_${self.pref}" data-pos="${cluster_pos}" style="cursor: pointer;">cluster_${cluster_pos}</a>`,
                        gid,
                        ali: aliases,
                        type,
                        func,
                    });
                }

            const columns = [];
            columns.push({ sTitle: 'Feature ID', mData: 'fid', width: '7em' });
            if (pos === null) {
                columns.push({ sTitle: 'Cluster', mData: 'cid', width: '7em' });
            }
            columns.push({ sTitle: 'Aliases', mData: 'ali' });
            columns.push({ sTitle: 'Genome', mData: 'gid'});
            // Leave this disabled approach to controlling width of this column
            // for now, while sorting out the best solution.
            // ,render: (data, type, row, meta) => {
            //     return $('<div>')
            //         .css('min-width', '15em')
            //         .html(data)
            //         .get(0)
            //         .outerHTML;
            // }});
            columns.push({ sTitle: 'Type', mData: 'type' });
            columns.push({ sTitle: 'Function', mData: 'func' });
            table.dataTable({
                sDom: 'lftip',
                aaData: tableData,
                aoColumns: columns,
                fnDrawCallback: events
            });

            return tabDiv;
        },

        buildFeatureId2FeatureHash: function () {
            return this.features.reduce((id2features, feature) => {
                id2features[feature.id] = feature;
                return id2features;
            }, {});
        },

        makeRow: function (name, value) {
            const $row = $('<tr>')
                .append($('<th>').css('width', '16em').css('text-align', 'left').append(name))
                .append($('<td>').append(value));
            return $row;
        },

        getData: function () {
            return {
                type: 'ExpressionMatrix',
                id: this.options.expressionMatrixID,
                workspace: this.options.workspaceID,
                title: 'Expression Matrix',
            };
        },

        loading: function (isLoading) {
            if (isLoading) this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            else this.hideMessage();
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

        clientError: function (error) {
            this.loading(false);
            this.showMessage(error.error.error);
        },
    });
});
