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
		'knhx',
		'widgetMaxWidthCorrection'
	], function(
		KBWidget,
		bootstrap,
		$,
		Config,
		kbaseAuthenticatedWidget,
		jquery_dataTables,
		knhx,
		widgetMaxWidthCorrection
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
            self.ws.get_objects([{ref:self.options.obj_ref}],
                function(data) {
                    var cs = data[0].data;
                    for (var index = 0; index < cs.factors.length; ++index) {
                        // init with optional values
                        var row = {"unit": "", "unit_ont_ref": "", "unit_ont_id": ""};
                        for (var key in cs.conditions){
                            row[key] = cs.conditions[key][index]
                        }
                        self.conditionTableData.push(Object.assign(row, cs.factors[index]));
                    }
                    self.conditions = cs.conditions;
                    self.renderConditionTable();
                    self.loading(true);
                    self.$mainPanel.show();
                },
                function(error) {
                    self.loading(true);
                    self.renderError(error);

                });
        },
        conditionTableData: [], // list for datatables

        $conditionTableDiv : null,
        renderConditionTable: function() {
            var self = this;

            if(!self.$conditionTableDiv) {
                self.$conditionTableDiv = $('<div>').css({'margin':'5px'});
                self.$mainPanel.append(self.$conditionTableDiv);
            }

            self.$conditionTableDiv.empty();

            var $tbl = $('<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-left: 0px; margin-right: 0px;">')
                            .addClass("table table-bordered table-striped");
            self.$conditionTableDiv.append($tbl);

            var sDom = "ft<ip>";
            if(self.conditionTableData.length<=10) sDom = "ft<i>";

            var tblSettings = {
                "sPaginationType": "full_numbers",
                "iDisplayLength": 10,
                "sDom": sDom,
                "aaSorting": [[0, "asc"]],
                "aoColumns": [
                    {sTitle: "Factor", mData: "factor"},
                    {sTitle: "Ontology Ref", mData: "factor_ont_ref"},
                    {sTitle: "Ontology ID", mData: "factor_ont_id"},
                    {sTitle: "Unit", mData: "unit"},
                    {sTitle: "Unit Ontology Ref", mData: "unit_ont_ref"},
                    {sTitle: "Unit Ontology ID", mData: "unit_ont_id"}
                ],
                "aaData": [],
                "oLanguage": {
                    "sSearch": "Search Factors:",
                    "sEmptyTable": "This FeatureSet is empty"
                }
                };
            for (var key in self.conditions){
                tblSettings['aoColumns'].push(
                    {sTitle: key, mData: key})
            }
            var ConditionsTable = $tbl.dataTable(tblSettings);
            ConditionsTable.fnAddData(self.conditionTableData);
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

        buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
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
