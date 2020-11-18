/**
 * @public
 */
define ([
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/dynamicServiceClient',

    // for effect
    'jquery-dataTables',
    'knhx',
    'widgetMaxWidthCorrection',
    'bootstrap',
], function (
    KBWidget,
    $,
    Config,
    kbaseAuthenticatedWidget,
    GenericClient,
    DynamicServiceClient
) {
    'use strict';
    return KBWidget({
        name: 'kbaseFeatureSet',
        parent : kbaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            featureset_name: null,
            workspaceName: null,
            wsURL: Config.url('workspace'),
            loadingImage: Config.get('loading_gif'),
        },

        init: function(options) {
            this._super(options);

            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            if (options.workspaceids && options.workspaceids.length > 0) {
                const id = options.workspaceids[0].split('/');
                this.options.treeID = id[1];
                this.options.workspaceID = id[0];
            }

            this.$mainPanel = $('<div>').addClass('').hide();
            this.$elem.append(this.$mainPanel);

            if (!this.options.featureset_name) {
                this.renderError('No FeatureSet to render!');
            } else if (!this.options.workspaceName) {
                this.renderError('No workspace given!');
            } else if (!this.options.kbCache && !this.authToken()) {
                this.renderError('No cache given, and not logged in!');
            } else {
                this.token = this.authToken();
                this.render();
            }

            return this;
        },

        render: function() {
            this.genomeSearchAPI = new DynamicServiceClient({
                module: 'GenomeSearchUtil',
                url: Config.url('service_wizard'), 
                token: this.token
            });
            this.workspace = new GenericClient({
                module: 'Workspace',
                url: Config.url('workspace'), 
                token: this.token
            });
            this.$mainPanel.hide();
            this.$mainPanel.empty();
            this.loadFeatureSet();
        },

        features: null, 

        loadFeatureSet: function() {
            this.features = {};
            this.loading(true);
            this.workspace.callFunc('get_objects', [[{
                ref: this.options.workspaceName+'/'+this.options.featureset_name
            }]])
                .then(([data]) => {
                    const fs = data[0].data;
                    if(fs.description) {
                        this.$mainPanel.append($('<div>')
                            .append('<i>Description</i> - ')
                            .append(fs.description));
                    }

                    for (const fid in fs.elements) {
                        if (fid in fs.elements) {
                            for (let k=0; k<fs.elements[fid].length; k++) {
                                const gid = fs.elements[fid][k];
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
                    console.log('error!', error);
                    this.loading(false);
                    this.renderError(error);
                });
        },

        search: function(genome_ref, query, limit) {
            return this.genomeSearchAPI.callFunc('search', [{
                ref: genome_ref,
                structured_query: query,
                sort_by: [['contig_id',1]],
                start: 0,
                limit: limit
            }])
                .then(([result]) => {
                    return result;
                });
        },

        genomeLookupTable: null, // genomeId: { featureId: indexInFeatureList }
        genomeObjectInfo: null, //{},
        featureTableData: null, // list for datatables

        getGenomeData: function() {
            if (Object.keys(this.features).length === 0) {
                this.loading(false);
                this.showMessage('This feature set is empty.');
                return Promise.resolve();
            }

            this.genomeLookupTable = {};
            this.genomeObjectInfo = {};
            this.featureTableData = [];
            return Promise.all(
                Array.from(Object.entries(this.features)).map(([gid, features]) => {
                    const query = {'feature_id': features}
                    return Promise.all([
                        // the features 
                        this.search(gid, query, features.length),
                        // the genome object id
                        gid,
                        // The genome object info
                        this.workspace.callFunc('get_object_info3', [{
                            objects: [{
                                ref: gid
                            }]
                        }])
                            .then(([result]) => {
                                // unpack from the results array.
                                return result;
                            })
                    ]);
                })
            )
            .then((results) => {
                for (const [result, gid, genomeObjectInfo] of results) {
                    const objectName = genomeObjectInfo.infos[0][1];
                    for (const feature of result.features) {
                        this.featureTableData.push(
                            {
                                fid: '<a href="/#dataview/'+gid+
                                            '?sub=Feature&subid='+feature.feature_id + '" target="_blank">'+
                                            feature.feature_id+'</a>',
                                gid: '<a href="/#dataview/'+gid+
                                        '" target="_blank">'+objectName+'</a>',
                                ali: Object.keys(feature.aliases).join(', '),
                                type: feature.feature_type,
                                func: feature.function
                            }
                        );
                    }
                }
                this.loading(false);
                this.renderFeatureTable(); // just rerender each time
            });
        },

        $featureTableDiv : null,
        renderFeatureTable: function() {
            if (!this.$featureTableDiv) {
                this.$featureTableDiv = $('<div>').css({'margin':'5px'});
                this.$mainPanel.append(this.$featureTableDiv);
            }

            this.$featureTableDiv.empty();

            const $tbl = $('<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-left: 0px; margin-right: 0px;">')
                .addClass('table table-bordered table-striped');
            this.$featureTableDiv.append($tbl);

            const sDom = `ft<${this.featureTableData.length <= 10 ? 'i' : 'ip'}>`;

            const tblSettings = {
                sPaginationType: 'full_numbers',
                iDisplayLength: 10,
                sDom: sDom,
                aaSorting: [[ 2, 'asc' ], [0, 'asc']],
                aoColumns: [
                    {sTitle: 'Feature ID', mData: 'fid'},
                    {sTitle: 'Aliases', mData: 'ali'},
                    {sTitle: 'Genome', mData: 'gid'},
                    {sTitle: 'Type', mData: 'type'},
                    {sTitle: 'Function', mData: 'func'},
                ],
                aaData: [],
                oLanguage: {
                    sSearch: 'Search features:',
                    sEmptyTable: 'This FeatureSet is empty'
                }
            };
            const featuresTable = $tbl.dataTable(tblSettings);
            featuresTable.fnAddData(this.featureTableData);
        },

        renderError: function(error) {
            let errString;
            if (typeof error === 'string') {
                errString = error;
            } else if (error.error && error.error.message) {
                errString = error.error.message;
            } else {
                errString = error.message;
            }

            const $errorDiv = $('<div>')
                .addClass('alert alert-danger')
                .append('<b>Error:</b>')
                .append('<br>' + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },

        buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
            const obj = {};
            if (wsRef) {
                obj['ref'] = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID))
                    obj['wsid'] = workspaceID;
                else
                    obj['workspace'] = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID))
                    obj['objid'] = objectID;
                else
                    obj['name'] = objectID;

                if (objectVer)
                    obj['ver'] = objectVer;
            }
            return obj;
        },

        loading: function(loading) {
            if (loading) {
                this.showMessage('<img src=\'' + this.options.loadingImage + '\'/>');
            } else {
                this.hideMessage();
            }
        },

        showMessage: function(message) {
            const span = $('<span/>').append(message);
            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        loggedInCallback: function(event, auth) {
            if (this.token == null) {
                this.token = auth.token;
                this.render();
            }
            return this;
        },

        loggedOutCallback: function() {
            this.render();
            return this;
        }
    });
});
