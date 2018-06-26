/**
 * @public
 */
'use strict';

define (
    [
        'kbwidget',
        'bootstrap',
        'jquery',
        'narrativeConfig',
        'kbaseAuthenticatedWidget',
        'jquery-dataTables',
        'datatables.net-buttons',
        'datatables.net-buttons-bs',
        'datatables.net-buttons-html5',
        'datatables.net-buttons-colvis',
        'datatables.net-buttons-print',
        'knhx',
        'widgetMaxWidthCorrection'
    ], function(
        KBWidget,
        bootstrap,
        $,
        Config,
        kbaseAuthenticatedWidget
    ) {
    return KBWidget({
        name: 'kbaseConditionSet',
        parent : kbaseAuthenticatedWidget,
        version: '0.0.1',
        options: {
            obj_ref: null,
            wsURL: Config.url('workspace'),
            loadingImage: Config.get('loading_gif')
        },

        init: function(options) {
            this._super(options);

            this.options.obj_ref = this.options.upas.obj_ref;

            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.$mainPanel = $("<div>").addClass("").hide();
            this.$elem.append(this.$mainPanel);

            if (!this.options.obj_ref) {
                this.renderError("No ConditionSet to render!");
            } else if (!this.options.kbCache && !this.authToken()) {
                this.renderError("No cache given, and not logged in!");
            } else {
                this.token = this.authToken();
                this.render();
            }

            return this;
        },

        render: function() {
            this.ws = new Workspace(this.options.wsURL, {token: this.token});
            this.loading(false);
            this.$mainPanel.hide();
            this.$mainPanel.empty();
            this.loadConditionSet();
        },

        conditions: {},
        factors: {},

        loadConditionSet: function() {
            var self = this;
            self.ws.get_objects2({objects: [{ref: self.options.obj_ref}]},
                function(ret) {
                    console.log(ret);
                    var cs = ret.data[0].data;
                    var cols = [{title: "Sample ID"}];
                    cs.factors.forEach(function(factor){
                        cols.push({title: factor.factor});
                    });
                    var rows = Object.keys(cs.conditions).map(function(_id) {
                        return [_id].concat(cs.conditions[_id]);
                    });
                    self.$mainPanel.show();
                    self.renderConditionTable(rows, cols);
                    self.loading(true);
                },
                function(error) {
                    self.loading(true);
                    self.renderError(error);

                });
        },
        $conditionTableDiv : null,
        renderConditionTable: function(rows, cols) {
            var self = this;

            if(!self.$conditionTableDiv) {
                self.$conditionTableDiv = $('<div>').css({'margin':'5px'});
                self.$mainPanel.append(self.$conditionTableDiv);
            }

            self.$conditionTableDiv.empty();

            var $tbl = $('<table>')
                            .addClass("table table-bordered table-striped");
            self.$conditionTableDiv.append($tbl);

            var tblSettings = {
                scrollX: true,
                scrollCollapse: true,
                paging: true,
                dom: "Bft<ip>",
                buttons: ['colvis', 'copy', 'csv', 'print'],
                order: [[0, "asc"]],
                columns: cols,
                data: rows
                };
            var ConditionsTable = $tbl.DataTable(tblSettings);
            //ConditionsTable.draw();
        },

        renderError: function(error) {
            var errString = "Sorry, an unknown error occurred";
            if (typeof error === "string")
                errString = error;
            else if (error.error && error.error.message)
                errString = error.error.message;

            var $errorDiv = $("<div>")
                            .addClass("alert alert-danger")
                            .append("<b>Error:</b>")
                            .append("<br>" + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },

        loading: function(doneLoading) {
            if (doneLoading)
                this.hideMessage();
            else
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

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

        loggedOutCallback: function(event, auth) {
            this.render();
            return this;
        }

    });
});
