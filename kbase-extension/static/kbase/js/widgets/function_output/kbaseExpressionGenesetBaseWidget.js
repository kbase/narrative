/**
 * Base class for viewers visualizaing expression of a set of genes from various aspects
 *
 * The descendant classes should override:
 * 1. getSubmtrixParams - to set params for get_submatrix_stat method from the KBaseFeatureValues service
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
    'bootstrap',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'narrativeConfig',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    // Loaded for effect
    'jquery-dataTables',
    'kbaseFeatureValues-client-api'
], function (
    KBWidget,
    bootstrap,
    $,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    Config,
    DynamicServiceClient,
    ServiceClient
) {
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
            loadingImage: 'static/kbase/images/ajax-loader.gif'
        },
        // Prefix for all div ids
        pref: null,
        // KBaseFeatureValue client
        featureValueClient: null,
        // Matrix set stat
        submatrixStat: null,
        init: function (options) {
            this._super(options);
            this.pref = this.uuid();

            // Create a message pane
            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            return this;
        },
        loggedInCallback: function (event, auth) {
            this.featureValues = new DynamicServiceClient({
                module: 'KBaseFeatureValues',
                url: Config.url('service_wizard'),
                token: auth.token
            });
            this.ws = new ServiceClient({
                module: 'Workspace',
                url: Config.url('workspace'),
                token: auth.token
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
            this.options.geneIds = 'VNG0001H,VNG0002G,VNG0003C,VNG0006G,VNG0013C,VNG0014C,VNG0361C,VNG0518H,VNG0868H,VNG0289H,VNG0852C';
        },
        // To be overriden to specify additional parameters
        getSubmtrixParams: function () {
            var self = this;
            self.setTestParameters();
            var features = [];
            if (self.options.geneIds) {
                features = $.map(self.options.geneIds.split(','), $.trim);
            }
            return{
                input_data: self.options.workspaceID + '/' + self.options.expressionMatrixID,
                row_ids: features,
                // specify your additional parameters
            };
        },
        loadAndRender: function () {
            var self = this;
            self.loading(true);

            function getSubmatrixStatsAndRender() {
                var smParams = self.getSubmtrixParams();

                // some parameter checking
                if (!smParams.row_ids || smParams.row_ids.length === 0) {
                    self.clientError('No Features or FeatureSet selected.  Please include at least one Feature from the data.');
                    return;
                }
                self.featureValues.callFunc('get_submatrix_stat', [smParams])
                    .spread(function (data) {
                        self.submatrixStat = data;
                        self.render();
                        self.loading(false);
                    })
                    .catch(function (error) {
                        self.clientError(error);
                    });
            }

            // if a feature set is defined, use it.
            if (self.options.featureset) {
                self.ws.callFunc('get_objects', [[{
                    ref: self.options.workspaceID + '/' + self.options.featureset
                }]])
                    .spread(function (fdata) {
                        var fs = fdata[0].data;
                        if (!self.options.geneIds) {
                            self.options.geneIds = '';
                        }

                        for (var fid in fs.elements) {
                            if (fs.elements.hasOwnProperty(fid)) {
                                if (self.options.geneIds) {
                                    self.options.geneIds += ',';
                                }
                                self.options.geneIds += fid;
                                //        for now we ignore which genome it came from, just use the ids
                                //        for (var k=0; k<fs.elements[fid].length; k++) {
                                //            var gid = fs.elements[fid][k];
                                //        }
                            }
                        }
                        getSubmatrixStatsAndRender();
                    })
                    .catch(function (error) {
                        self.clientError(error);
                    });
            } else {
                getSubmatrixStatsAndRender();
            }
        },
        render: function () {
            var $overviewContainer = $('<div/>');
            this.$elem.append($overviewContainer);
            this.buildOverviewDiv($overviewContainer);

            // Separator
            this.$elem.append($('<div style="margin-top:1em"></div>'));

            var $vizContainer = $('<div/>');
            this.$elem.append($vizContainer);
            this.buildWidget($vizContainer);
        },
        buildOverviewDiv: function ($containerDiv) {
            var self = this;
            var pref = this.pref;

            var $overviewSwitch = $('<a/>').html('[Show/Hide Selected Features]');
            $containerDiv.append($overviewSwitch);

            var $overvewContainer = $('<div hidden style="margin:1em 0 4em 0"/>');
            $containerDiv.append($overvewContainer);

            var geneData = self.buildGenesTableData();
            var iDisplayLength = 10;
            var style = 'lftip';
            if (geneData.length <= iDisplayLength) {
                style = 'fti';
            }

            $overvewContainer.append($('<table id="' + pref + 'genes-table"  \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .dataTable({
                    'sDom': style,
                    'iDisplayLength': iDisplayLength,
                    'aaData': geneData,
                    'aoColumns': [
                        {sTitle: 'Name', mData: 'id'},
                        {sTitle: 'Function', mData: 'function'},
                        {sTitle: 'Min', mData: 'min'},
                        {sTitle: 'Max', mData: 'max'},
                        {sTitle: 'Avg', mData: 'avg'},
                        {sTitle: 'Std', mData: 'std'},
                        {sTitle: 'Missing', mData: 'missing_values'}
                    ],
                    'oLanguage': {
                        'sEmptyTable': 'No genes found!',
                        'sSearch': 'Search: '
                    }
                }));

            $overviewSwitch.click(function () {
                $overvewContainer.toggle();
            });
        },
        buildGenesTableData: function () {
            var submatrixStat = this.submatrixStat;
            var tableData = [];
            var stat = submatrixStat.row_set_stats;
            for (var i = 0; i < submatrixStat.row_descriptors.length; i++) {
                var desc = submatrixStat.row_descriptors[i];

                var gene_function = desc.properties['function'];
                tableData.push(
                    {
                        'index': desc.index,
                        'id': desc.id,
                        'name': desc.name ? desc.name : ' ',
                        'function': gene_function ? gene_function : ' ',
                        'min': stat.mins[i] ? stat.mins[i].toFixed(2) : null,
                        'max': stat.maxs[i] ? stat.maxs[i].toFixed(2) : null,
                        'avg': stat.avgs[i] ? stat.avgs[i].toFixed(2) : null,
                        'std': stat.stds[i] ? stat.stds[i].toFixed(2) : null,
                        'missing_values': stat.missing_values[i]
                    }
                );
            }
            return tableData;
        },
        // To be overriden
        buildWidget: null,

        makeRow: function (name, value) {
            var $row = $('<tr/>')
                .append($('<th />').css('width', '20%').append(name))
                .append($('<td />').append(value));
            return $row;
        },
        loading: function (isLoading) {
            if (isLoading)
                this.showMessage('<img src=\'' + this.options.loadingImage + '\'/>');
            else
                this.hideMessage();
        },
        showMessage: function (message) {
            var span = $('<span/>').append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },
        hideMessage: function () {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },
        clientError: function (error) {
            this.loading(false);
            var errString = 'Unknown error.';
            console.error(error);
            if (typeof error === 'string')
                errString = error;
            else if (error.error && error.error.message)
                errString = error.error.message;
            else if (error.error && error.error.error && typeof error.error.error === 'string') {
                errString = error.error.error;
                if (errString.indexOf('java.lang.NullPointerException') > -1 &&
                    errString.indexOf('buildIndeces(KBaseFeatureValuesImpl.java:708)') > -1) {
                    // this is a null pointer due to an unknown feature ID.  TODO: handle this gracefully
                    errString = 'Feature IDs not found.<br><br>';
                    errString += 'Currently all Features included in a FeatureSet must be present' +
                        ' in the Expression Data Matrix.  Please rebuild the FeatureSet ' +
                        'so that it only includes these features.  This is a known issue ' +
                        'and will be fixed shortly.';
                }
            }

            var $errorDiv = $('<div>')
                .addClass('alert alert-danger')
                .append('<b>Error:</b>')
                .append('<br>' + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },
        uuid: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
                function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
        },
        buildObjectIdentity: function (workspaceID, objectID, objectVer, wsRef) {
            var obj = {};
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
        }

    });
});
