/**
 * @public
 */
'use strict';

define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'jquery-dataTables',
    'knhx',
    'widgetMaxWidthCorrection',
    'GenomeSearchUtil-client-api',
], (KBWidget, bootstrap, $, Config, kbaseAuthenticatedWidget) => {
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

        render: function () {
            this.ws = new Workspace(this.options.wsURL, { token: this.token });
            this.genomeSearchAPI = new GenomeSearchUtil(Config.url('service_wizard'), {
                token: this.token,
            });
            this.loading(false);
            this.$mainPanel.hide();
            this.$mainPanel.empty();
            this.loadFeatureSet();
        },

        features: null, // genomeId : [{fid: x, data: x}]

        loadFeatureSet: function () {
            const self = this;
            self.features = {};
            self.ws.get_objects(
                [{ ref: self.options.workspaceName + '/' + self.options.featureset_name }],
                (data) => {
                    const fs = data[0].data;
                    if (fs.description) {
                        self.$mainPanel.append(
                            $('<div>').append('<i>Description</i> - ').append(fs.description)
                        );
                    }

                    for (const fid in fs.elements) {
                        if (fs.elements.hasOwnProperty(fid)) {
                            for (let k = 0; k < fs.elements[fid].length; k++) {
                                const gid = fs.elements[fid][k];
                                if (self.features.hasOwnProperty(gid)) {
                                    self.features[gid].push(fid);
                                } else {
                                    self.features[gid] = [fid];
                                }
                            }
                        }
                    }
                    self.getGenomeData();
                    self.$mainPanel.show();
                },
                (error) => {
                    self.loading(true);
                    self.renderError(error);
                }
            );
        },

        search: function (genome_ref, query, limit) {
            return this.genomeSearchAPI.search({
                ref: genome_ref,
                structured_query: query,
                sort_by: [['contig_id', 1]],
                start: 0,
                limit: limit,
            });
        },

        genomeLookupTable: null, // genomeId: { featureId: indexInFeatureList }
        genomeObjectInfo: null, //{},
        featureTableData: null, // list for datatables

        getGenomeData: function () {
            const self = this;
            self.genomeLookupTable = {};
            self.genomeObjectInfo = {};
            self.featureTableData = [];
            for (var gid in self.features) {
                const query = { feature_id: self.features[gid] };
                self.search(gid, { feature_id: self.features[gid] }, self.features[gid].length)
                    .then((results) => {
                        for (const f in results.features) {
                            const feature = results.features[f];
                            self.featureTableData.push({
                                fid:
                                    '<a href="/#dataview/' +
                                    gid +
                                    '?sub=Feature&subid=' +
                                    feature.feature_id +
                                    '" target="_blank">' +
                                    feature.feature_id +
                                    '</a>',
                                gid:
                                    '<a href="/#dataview/' +
                                    gid +
                                    '" target="_blank">' +
                                    gid +
                                    '</a>',
                                ali: Object.keys(feature.aliases).join(', '),
                                type: feature.feature_type,
                                func: feature.function,
                            });
                        }
                        self.renderFeatureTable(); // just rerender each time
                        self.loading(true);
                    })
                    .fail((e) => {
                        console.error(e);
                    });
            }
            if (Object.keys(self.features).length === 0) {
                self.loading(true);
                self.showMessage('This feature set is empty.');
            }
        },

        $featureTableDiv: null,
        renderFeatureTable: function () {
            const self = this;

            if (!self.$featureTableDiv) {
                self.$featureTableDiv = $('<div>').css({ margin: '5px' });
                self.$mainPanel.append(self.$featureTableDiv);
            }

            self.$featureTableDiv.empty();

            const $tbl = $(
                '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-left: 0px; margin-right: 0px;">'
            ).addClass('table table-bordered table-striped');
            self.$featureTableDiv.append($tbl);

            let sDom = 'ft<ip>';
            if (self.featureTableData.length <= 10) sDom = 'ft<i>';

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
                    { sTitle: 'Aliases', mData: 'ali' },
                    { sTitle: 'Genome', mData: 'gid' },
                    { sTitle: 'Type', mData: 'type' },
                    { sTitle: 'Function', mData: 'func' },
                ],
                aaData: [],
                oLanguage: {
                    sSearch: 'Search features:',
                    sEmptyTable: 'This FeatureSet is empty',
                },
            };
            const featuresTable = $tbl.dataTable(tblSettings);
            featuresTable.fnAddData(self.featureTableData);
        },

        renderError: function (error) {
            let errString = 'Sorry, an unknown error occurred';
            if (typeof error === 'string') errString = error;
            else if (error.error && error.error.message) errString = error.error.message;

            const $errorDiv = $('<div>')
                .addClass('alert alert-danger')
                .append('<b>Error:</b>')
                .append('<br>' + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
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

        loading: function (doneLoading) {
            if (doneLoading) this.hideMessage();
            else this.showMessage("<img src='" + this.options.loadingImage + "'/>");
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
            if (this.token == null) {
                this.token = auth.token;
                this.render();
            }
            return this;
        },

        loggedOutCallback: function (event, auth) {
            this.render();
            return this;
        },
    });
});
