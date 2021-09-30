/**
 * Base class for viewers visualizaing expression of a set of conditions from various aspects
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
    'jquery',
    'narrativeConfig',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kb_common/jsonRpc/dynamicServiceClient',
    // For effect
    'bootstrap',
    'jquery-dataTables',
    'kbaseFeatureValues-client-api',
], ($, Config, KBWidget, kbaseAuthenticatedWidget, kbaseTabs, DynamicServiceClient) => {
    'use strict';

    return KBWidget({
        name: 'kbaseExpressionConditionsetBaseWidget',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            workspaceID: null,

            expressionMatrixID: null,
            conditionIds: null,

            loadingImage: 'static/kbase/images/ajax-loader.gif',
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
            this.options.conditionIds =
                'ni__0500um_vs_NRC-1c,ni__1500um_vs_NRC-1c,ura3_Mn_1500um_b_vs_NRC-1d.sig';
        },

        // To be overriden to specify additional parameters
        getSubmtrixParams: function () {
            const self = this;
            self.setTestParameters();
            let conditions = [];
            if (self.options.conditionIds) {
                conditions = $.map(self.options.conditionIds.split(','), $.trim);
            }
            return {
                input_data: self.options.workspaceID + '/' + self.options.expressionMatrixID,
                column_ids: conditions,
                fl_column_set_stat: 1,
                // specify your additional parameters
            };
        },

        loadAndRender: function () {
            const self = this;
            self.loading(true);

            const getSubmatrixStatsAndRender = function () {
                const smParams = self.getSubmtrixParams();

                // some parameter checking
                if (!smParams.column_ids || smParams.column_ids.length === 0) {
                    self.clientError(
                        'No Conditions selected.  Please include at least one Condition from the data.'
                    );
                    return;
                }

                self.featureValues
                    .callFunc('get_submatrix_stat', [smParams])
                    .spread((data) => {
                        self.submatrixStat = data;
                        self.render();
                        self.loading(false);
                    })
                    .error((err) => {
                        self.clientError(err);
                    });
            };
            getSubmatrixStatsAndRender();
        },

        render: function () {
            const $overviewContainer = $('<div/>');
            this.$elem.append($overviewContainer);
            this.buildOverviewDiv($overviewContainer);

            // Separator
            this.$elem.append($('<div style="margin-top:1em"></div>'));

            const $vizContainer = $('<div/>');
            this.$elem.append($vizContainer);
            this.buildWidget($vizContainer);
        },

        buildOverviewDiv: function ($containerDiv) {
            const self = this;
            const pref = this.pref;

            const $overviewSwitch = $('<a/>').html('[Show/Hide Selected Conditions]');
            $containerDiv.append($overviewSwitch);

            const $overviewContainer = $('<div hidden style="margin:1em 0 4em 0"/>');
            $containerDiv.append($overviewContainer);

            const conditionsData = self.buildConditionsTableData();
            const iDisplayLength = 10;
            let style = 'lftip';
            if (conditionsData.length <= iDisplayLength) {
                style = 'fti';
            }

            $overviewContainer.append(
                $(
                    '<table id="' +
                        pref +
                        'condition-table"  \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>'
                ).dataTable({
                    sDom: style,
                    iDisplayLength: iDisplayLength,
                    aaData: conditionsData,
                    aoColumns: [
                        { sTitle: 'Name', mData: 'id' },
                        // { sTitle: "Function", mData: "function"},
                        { sTitle: 'Min', mData: 'min' },
                        { sTitle: 'Max', mData: 'max' },
                        { sTitle: 'Avg', mData: 'avg' },
                        { sTitle: 'Std', mData: 'std' },
                        { sTitle: 'Missing', mData: 'missing_values' },
                    ],
                    oLanguage: {
                        sEmptyTable: 'No conditions found!',
                        sSearch: 'Search: ',
                    },
                })
            );

            $overviewSwitch.click(() => {
                $overviewContainer.toggle();
            });
        },

        buildConditionsTableData: function () {
            const submatrixStat = this.submatrixStat;
            const tableData = [];
            const stat = submatrixStat.column_set_stat;
            //console.log(submatrixStat);
            for (let i = 0; i < submatrixStat.column_descriptors.length; i++) {
                const desc = submatrixStat.column_descriptors[i];

                tableData.push({
                    index: desc.index,
                    id: desc.id,
                    name: desc.name ? desc.name : ' ',
                    min: stat.mins[i] == null ? ' ' : stat.mins[i].toFixed(2),
                    max: stat.maxs[i] == null ? ' ' : stat.maxs[i].toFixed(2),
                    avg: stat.avgs[i] == null ? ' ' : stat.avgs[i].toFixed(2),
                    std: stat.stds[i] == null ? ' ' : stat.stds[i].toFixed(2),
                    missing_values: stat.missing_values[i],
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

        clientError: function (error) {
            this.loading(false);
            let errString = 'Unknown error.';
            console.error(error);
            if (typeof error === 'string') errString = error;
            else if (error.error && error.error.message) errString = error.error.message;
            else if (error.error && error.error.error && typeof error.error.error === 'string') {
                errString = error.error.error;
                if (
                    errString.indexOf('java.lang.NullPointerException') > -1 &&
                    errString.indexOf('buildIndeces(KBaseFeatureValuesImpl.java:708)') > -1
                ) {
                    // this is a null pointer due to an unknown feature ID.  TODO: handle this gracefully
                    errString = 'Feature IDs not found.<br><br>';
                    errString +=
                        'Currently all Features included in a FeatureSet must be present' +
                        ' in the Expression Data Matrix.  Please rebuild the FeatureSet ' +
                        'so that it only includes these features.  This is a known issue ' +
                        'and will be fixed shortly.';
                }
            }

            const $errorDiv = $('<div>')
                .addClass('alert alert-danger')
                .append('<b>Error:</b>')
                .append('<br>' + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },

        uuid: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0,
                    v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
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
