/**
 * @public
 */
define([
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'jsonrpc/1.1/DynamicServiceClient',
    'jsonrpc/1.1/ServiceClient',
    'widgets/common/ErrorMessage',

    // for effect
    'jquery-dataTables',
    'knhx',
    'widgetMaxWidthCorrection',
    'bootstrap',
], (
    KBWidget,
    $,
    Config,
    kbaseAuthenticatedWidget,
    DynamicServiceClient,
    ServiceClient,
    $ErrorMessage
) => {
    'use strict';

    const TIMEOUT = 60000;

    return KBWidget({
        name: 'kbaseFeatureSet',
        parent: kbaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            featureset_name: null,
            workspaceName: null,
            wsURL: Config.url('workspace'),
            loadingImage: Config.get('loading_gif'),
        },

        init: function (options) {
            this._super(options);

            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            if (options.workspaceids && options.workspaceids.length > 0) {
                const id = options.workspaceids[0].split('/');
                this.options.treeID = id[1];
                this.options.workspaceID = id[0];
            }

            this.$mainPanel = $('<div>').attr('data-testid', 'main-panel').hide();
            this.$elem.append(this.$mainPanel);

            this.token = this.authToken();

            if (!this.options.featureset_name) {
                this.renderError('No FeatureSet to render!');
            } else if (!this.options.workspaceName) {
                this.renderError('No workspace given!');
            } else if (!this.options.kbCache && !this.authToken()) {
                this.renderError('No cache given, and not logged in!');
            }

            return this;
        },

        render: function () {
            this.genomeSearchAPI = new DynamicServiceClient({
                module: 'GenomeSearchUtil',
                url: Config.url('service_wizard'),
                token: this.token,
                timeout: TIMEOUT,
            });
            this.workspace = new ServiceClient({
                module: 'Workspace',
                url: Config.url('workspace'),
                token: this.token,
                timeout: TIMEOUT,
            });
            this.loadFeatureSet();
        },

        features: null,

        loadFeatureSet: function () {
            this.$mainPanel.hide();
            this.$mainPanel.empty();
            this.loading(true);
            this.features = {};
            this.workspace
                .callFunc('get_objects', [
                    {
                        ref: `${this.options.workspaceName}/${this.options.featureset_name}`,
                    },
                ])
                .then((data) => {
                    const featureSet = data[0].data;
                    if (featureSet.description) {
                        this.$mainPanel.append(
                            $('<div>')
                                .attr('data-testid', 'description')
                                .append($('<i>').attr('data-testid', 'label').text('Description: '))
                                .append(
                                    $('<span>')
                                        .attr('data-testid', 'value')
                                        .text(featureSet.description)
                                )
                        );
                    }

                    for (const fid in featureSet.elements) {
                        if (fid in featureSet.elements) {
                            for (let k = 0; k < featureSet.elements[fid].length; k++) {
                                const gid = featureSet.elements[fid][k];
                                if (gid in this.features) {
                                    this.features[gid].push(fid);
                                } else {
                                    this.features[gid] = [fid];
                                }
                            }
                        }
                    }
                    this.$mainPanel.show();
                    return this.getGenomeData();
                })
                .catch((error) => {
                    console.error('error!', error);
                    this.loading(false);
                    this.renderError(error);
                });
        },

        search: function (genome_ref, query, limit) {
            return this.genomeSearchAPI
                .callFunc('search', {
                    ref: genome_ref,
                    structured_query: query,
                    sort_by: [['contig_id', 1]],
                    start: 0,
                    limit: limit,
                })
                .then((result) => {
                    return result;
                });
        },

        genomeLookupTable: null,
        genomeObjectInfo: null,
        featureTableData: null,

        getGenomeData: function () {
            if (Object.keys(this.features).length === 0) {
                this.loading(false);
                this.showMessage('This feature set is empty.');
                return Promise.resolve();
            }

            this.genomeLookupTable = {};
            this.genomeObjectInfo = {};
            this.featureTableData = [];
            // We fetch the data with nested promises, to preserve order and parallelize the requests.
            // Then the results are dissected and used to update structures in this object, and finally
            // invoking a render.
            //
            // "this.features" is an object whose keys are genome object references (gid), and
            // whose values are lists of feature ids (fid).
            //
            // For each pair of gid and fid we need to fetch the genome object information from the workspace
            // and the feature info from the genome search api.
            //
            // To keep this all sorted out, and in the original order, we do this as an array of promises for
            // each pair, and each pair itself is an array of the actual api calls which are themselves promises.

            // get the object info for all feature-containing objects.
            const objectRefs = Object.keys(this.features);
            return this.workspace
                .callFunc('get_object_info3', {
                    objects: objectRefs.map((ref) => {
                        return {
                            ref,
                        };
                    }),
                })
                .then((result) => {
                    return Promise.all(
                        result.infos.map((info) => {
                            const [, typeName, ,] = info[2].split(/[.-]/);

                            const objectRef = [info[6], info[0], info[4]].join('/');
                            const featuresToFind = this.features[objectRef];

                            return Promise.all([
                                (() => {
                                    switch (typeName) {
                                        case 'Genome':
                                            return this.search(
                                                objectRef,
                                                { feature_id: featuresToFind },
                                                featuresToFind.length
                                            ).then(({ features }) => {
                                                return features;
                                            });
                                        case 'AnnotatedMetagenomeAssembly':
                                            return Promise.resolve(
                                                featuresToFind.map((feature_id) => {
                                                    return {
                                                        feature_id,
                                                        aliases: { na: 'na' },
                                                        feature_type: 'na',
                                                        function: 'na',
                                                    };
                                                })
                                            );
                                    }
                                })(),
                                objectRef,
                                typeName,
                                info,
                            ]);
                        })
                    );
                })
                .then((result) => {
                    const unsupportedTypeAttributes =
                        'title="Features not yet fully supported for AnnotatedMetagenomeAssembly" style="font-style: italic; color: gray; cursor: help;"';
                    for (const [features, objectRef, objectType, objectInfo] of result) {
                        const objectName = objectInfo[1];
                        for (const feature of features) {
                            if (objectType === 'AnnotatedMetagenomeAssembly') {
                                // This is a special case because AMAs are not fully supported yet.
                                this.featureTableData.push({
                                    fid: `<a href='/#dataview/${objectRef}?sub=Feature&subid=${feature.feature_id}' target='_blank'>${feature.feature_id}</a>`,
                                    objectType,
                                    gid: `<a href='/#dataview/${objectRef}' target='_blank'>${objectName}</a>`,
                                    aliases: `<span ${unsupportedTypeAttributes}>${Object.keys(
                                        feature.aliases
                                    ).join(', ')}</a>`,
                                    type: `<span ${unsupportedTypeAttributes}>${feature.feature_type}</a>`,
                                    func: `<span ${unsupportedTypeAttributes}>${feature.function}</a>`,
                                });
                            } else {
                                this.featureTableData.push({
                                    fid: `<a href='/#dataview/${objectRef}?sub=Feature&subid=${feature.feature_id}' target='_blank'>${feature.feature_id}</a>`,
                                    objectType,
                                    gid: `<a href='/#dataview/${objectRef}' target='_blank'>${objectName}</a>`,
                                    aliases: Object.keys(feature.aliases).join(', '),
                                    type: feature.feature_type,
                                    func: feature.function,
                                });
                            }
                        }
                    }
                })
                .then(() => {
                    this.loading(false);
                    this.renderFeatureTable(); // just rerender each time
                });
        },

        $featureTableDiv: null,
        renderFeatureTable: function () {
            if (!this.$featureTableDiv) {
                this.$featureTableDiv = $('<div>').css({ margin: '5px' });
                this.$mainPanel.append(this.$featureTableDiv);
            }

            this.$featureTableDiv.empty();

            const $tbl = $(
                '<table style="width: 100%;">'
            ).addClass('table table-bordered table-striped');
            this.$featureTableDiv.append($tbl);

            const sDom = `ft<${this.featureTableData.length <= 10 ? 'i' : 'ip'}>`;

            const tblSettings = {
                sPaginationType: 'full_numbers',
                iDisplayLength: 10,
                sDom: sDom,
                aaSorting: [
                    [2, 'asc'],
                    [0, 'asc'],
                ],
                aoColumns: [
                    { sTitle: 'Feature ID', mData: 'fid' },
                    { sTitle: 'Type', mData: 'type' },
                    { sTitle: 'Aliases', mData: 'aliases' },
                    { sTitle: 'Function', mData: 'func' },
                    { sTitle: 'Container Object', mData: 'gid' },
                    { sTitle: 'Type', mData: 'objectType' },
                ],
                aaData: [],
                oLanguage: {
                    sSearch: 'Search features:',
                    sEmptyTable: 'This FeatureSet is empty',
                },
            };
            const featuresTable = $tbl.dataTable(tblSettings);
            featuresTable.fnAddData(this.featureTableData);
        },

        renderError: function (error) {
            this.$elem.empty();
            this.$elem.append($ErrorMessage(error));
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

        loading: function (loading) {
            if (loading) {
                this.showMessage(`<img src='${this.options.loadingImage}' alt='Loading'/>`);
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

        loggedInCallback: function (event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function () {
            this.render();
            return this;
        },
    });
});
