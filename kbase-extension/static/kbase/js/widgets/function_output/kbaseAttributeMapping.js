/**
 * @public
 */
define([
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'kb_service/client/workspace',
    'common/runtime',
    'jquery-dataTables',
    'datatables.net-buttons',
    'datatables.net-buttons-bs',
    'datatables.net-buttons-html5',
    'datatables.net-buttons-colvis',
    'datatables.net-buttons-print',
    'knhx',
    'widgetMaxWidthCorrection',
], (KBWidget, $, Config, Workspace, Runtime) => {
    'use strict';
    return KBWidget({
        name: 'kbaseAttributeMapping',
        version: '0.0.1',
        options: {
            obj_ref: null,
            wsURL: Config.url('workspace'),
            loadingImage: Config.get('loading_gif'),
        },

        init: function (options) {
            this._super(options);

            this.options.obj_ref = this.options.upas.obj_ref;

            this.$messagePane = $('<div/>').addClass('kbwidget-message-pane kbwidget-hide-message');
            this.$elem.append(this.$messagePane);

            this.$mainPanel = $('<div>').hide();
            this.$elem.append(this.$mainPanel);

            if (!this.options.obj_ref) {
                this.renderError('No object to render!');
            } else {
                this.renderAndLoad();
            }

            return this;
        },

        renderAndLoad: function () {
            this.ws = new Workspace(this.options.wsURL, { token: Runtime.make().authToken() });
            this.loading(false);
            this.$mainPanel.hide();
            this.$mainPanel.empty();
            return this.loadData()
                .then((ret) => {
                    this.parseObj(ret.data[0].data);
                })
                .catch((error) => {
                    this.loading(true);
                    this.renderError(error);
                });
        },

        loadData: function () {
            return this.ws.get_objects2({ objects: [{ ref: this.options.obj_ref }] });
        },
        parseObj: function (ws_obj) {
            const cols = [{ title: 'ID' }];
            let rows;
            // Back compatible with ConditionSets
            if (typeof ws_obj.factors !== 'undefined') {
                ws_obj.factors.forEach((factor) => {
                    cols.push({ title: factor.factor });
                });
            } else if (typeof ws_obj.attributes !== 'undefined') {
                ws_obj.attributes.forEach((attributes) => {
                    cols.push({ title: attributes.attribute });
                });
            }

            // Back compatible with ConditionSets
            if (typeof ws_obj.conditions !== 'undefined') {
                rows = Object.keys(ws_obj.conditions).map((_id) => {
                    return [_id].concat(ws_obj.conditions[_id]);
                });
            } else if (typeof ws_obj.instances !== 'undefined') {
                rows = Object.keys(ws_obj.instances).map((_id) => {
                    return [_id].concat(ws_obj.instances[_id]);
                });
            }
            this.$mainPanel.show();
            this.renderTable(rows, cols);
            this.loading(true);
        },

        $tableDiv: null,
        renderTable: function (rows, cols) {
            if (!this.$tableDiv) {
                this.$tableDiv = $('<div>').css({ margin: '5px' });
                this.$mainPanel.append(this.$tableDiv);
            }

            this.$tableDiv.empty();

            const $tbl = $('<table>').addClass('table table-bordered table-striped');
            this.$tableDiv.append($tbl);

            const tblSettings = {
                scrollX: true,
                scrollCollapse: true,
                paging: true,
                dom: "<'row'<'col-sm-6'B><'col-sm-6'f>>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
                buttons: ['colvis', 'copy', 'csv', 'print'],
                order: [[0, 'asc']],
                columns: cols,
                data: rows,
            };
            this.conditionsTable = $tbl.DataTable(tblSettings);
        },

        renderError: function (error) {
            let errString = 'Sorry, an unknown error occurred';
            if (typeof error === 'string') {
                errString = error;
            } else if (error.error && error.error.message) {
                errString = error.error.message;
            }

            const $errorDiv = $('<div>')
                .addClass('alert alert-danger')
                .append('<b>Error:</b>')
                .append('<br>' + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
            console.error(error);
        },

        loading: function (doneLoading) {
            if (doneLoading) {
                this.hideMessage();
            } else {
                this.showMessage('<img src="' + this.options.loadingImage + '"/>');
            }
        },

        showMessage: function (message) {
            const span = $('<span/>').append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function () {
            this.$messagePane.empty();
        },

        destroy: function () {
            if (this.conditionsTable) {
                this.conditionsTable.destroy();
            }
        },
    });
});
