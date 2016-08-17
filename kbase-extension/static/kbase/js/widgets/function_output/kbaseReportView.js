/**
 * Basic viz for a basic report type.
 * @public
 */

define(
    [
        'kbwidget',
        'bootstrap',
        'jquery',
        'kbaseAuthenticatedWidget',
        'narrativeConfig',
        'util/string',
        
        'jquery-dataTables',
        'jquery-dataTables-bootstrap',
        'kbase-client-api'
    ], function (
    KBWidget,
    bootstrap,
    $,
    kbaseAuthenticatedWidget,
    Config,
    StringUtil
        
    ) {
    return KBWidget({
        name: 'kbaseReportView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            workspace_name: null,
            report_name: null,
            report_window_line_height: 10,
            showReportText: true,
            showCreatedObjects: false,
            inNarrative: true, // todo: toggles whether data links show in narrative or new page

            wsURL: Config.url('workspace'),
        },
        // workspace client
        ws: null,
        init: function (options) {
            this._super(options);

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.$mainPanel = $("<div>");
            this.$elem.append(this.$mainPanel);

            return this;
        },
        loggedInCallback: function (event, auth) {

            // Build a client
            this.ws = new Workspace(this.options.wsURL, auth);

            // Let's go...
            this.loadAndRender();
            return this;
        },
        loggedOutCallback: function (event, auth) {
            this.isLoggedIn = false;
            return this;
        },
        reportData: null,
        loadAndRender: function () {
            var self = this;
            self.loading(true);

            // var objIdentity = self.buildObjectIdentity(this.options.workspace_name, this.options.report_name, null, null);
            var objIdentity = {ref: this.options.report_ref};
            self.ws.get_objects([objIdentity],
                function (data) {
                    self.reportData = data[0].data;
                    self.render();
                }, function (error) {
                self.clientError(error);
            });
        },
        render: function () {
            var self = this;

            // Handle warnings?
            if (self.reportData.warnings) {
                if (self.reportData.warnings.length > 0) {
                    var $warningPanel = $('<div style="max-height:100px;overflow-y:auto;margin:0px 5px 5px 10px;">')
                    var warnings = self.reportData.warnings;
                    if (warnings.length >= 5) {
                        $warningPanel.append($('<div>').css('margin', '5px').append('[' + warnings.length + 'Warnings]'))
                    }
                    for (var k = 0; k < warnings.length; k++) {
                        $warningPanel.append(
                            $('<div>').css('margin', '0px 5px 5px 10px').append(
                            $('<span>').addClass('label label-warning')
                            .append(warnings[k])));
                    }
                    self.$mainPanel.append($warningPanel);
                }
            }

            if (self.options.showReportText) {
                var $report_window = $('<textarea style="width:100%;font-family:Monaco,monospace;font-size:9pt;color:#555;resize:vertical;" rows="' +
                    self.options.report_window_line_height + '" readonly>')
                    .append(self.reportData.text_message);
                self.$mainPanel.append($report_window);
            }

            if (self.options.showCreatedObjects) {
                if (self.reportData.objects_created) {
                    if (self.reportData.objects_created.length > 0) {

                        var objsCreated = self.reportData.objects_created;

                        var objIds = []
                        for (var i = 0; i < objsCreated.length; i++) {
                            objIds.push({'ref': objsCreated[i].ref})
                        }
                        self.ws.get_object_info_new({'objects': objIds},
                            function (objInfo) {

                                var pref = StringUtil.uuid();
                                var displayData = [];
                                var dataNameToInfo = {};
                                for (var k = 0; k < objInfo.length; k++) {

                                    //var $name = $('<a>').append(objInfo[k][1]);
                                    /* TODO: we need code something like this to show data objects on click
                                     var obj = _.findWhere(self.objectList, {key: key});
                                     var info = self.createInfoObject(obj.info);
                                     // Insert the narrative data cell into the div we just rendered
                                     new kbaseNarrativeDataCell(//$('#' + cell_id), {cell: cell, info: info});
                                     self.trigger('createViewerCell.Narrative', {
                                     'nearCellIdx': near_idx,
                                     'widget': 'kbaseNarrativeDataCell',
                                     'info' : info
                                     });*/

                                    displayData.push({
                                        'name': '<a class="report_row_' + pref + '" data-objname="' + objInfo[k][1] + '">' + objInfo[k][1] + '</a>',
                                        'type': objInfo[k][2].split('-')[0].split('.')[1],
                                        'fullType': objInfo[k][2],
                                        'description': objsCreated[k].description ? objsCreated[k].description : '',
                                        'ws_info': objInfo[k]
                                    });
                                    dataNameToInfo[objInfo[k][1]] = objInfo[k];
                                }

                                function reportRowEvents() {
                                    $('.report_row_' + pref).unbind('click');
                                    $('.report_row_' + pref).click(function () {
                                        var objName = [$(this).data('objname')];
                                        self.openViewerCell(dataNameToInfo[objName]);
                                    });
                                }

                                var iDisplayLength = 5;
                                var sDom = "ft<ip>";
                                var $tblDiv = $('<div>').css('margin-top', '10px');
                                self.$mainPanel.append($tblDiv);
                                if (displayData.length <= iDisplayLength) {
                                    var $objTable = $('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;">');

                                    displayData.sort(function (a, b) {
                                        return a.name < b.name;
                                    });
                                    var color = '#555';
                                    $objTable.append($('<tr>')
                                        .append('<th style="width:30%;color:' + color + ';"><b>Created Object Name</b></th>')
                                        .append('<th style="width:20%;color:' + color + ';"><b>Type</b></th>')
                                        .append('<th style="color:' + color + ';"><b>Description</b></th>'));
                                    for (var k = 0; k < displayData.length; k++) {
                                        $objTable.append($('<tr>')
                                            .append('<td style="width:30%;color:' + color + ';">' + displayData[k].name + '</td>')
                                            .append('<td style="width:20%;color:' + color + ';">' + displayData[k].type + '</td>')
                                            .append('<td style="color:' + color + ';">' + displayData[k].description + '</td>'));
                                    }
                                    $tblDiv.append($objTable)
                                    reportRowEvents();
                                } else {
                                    var $tbl = $('<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-left: 0px; margin-right: 0px;">')
                                        .addClass("table table-bordered table-striped");
                                    $tblDiv.append($tbl);

                                    var sDom = "ft<ip>";

                                    var tblSettings = {
                                        "sPaginationType": "full_numbers",
                                        "iDisplayLength": iDisplayLength,
                                        "sDom": sDom,
                                        "aaSorting": [[0, "asc"]],
                                        "aoColumns": [
                                            {sTitle: "<b>Created Object Name</b>", mData: "name", sWidth: "30%"},
                                            {sTitle: "<b>Type</b>", mData: "type", sWidth: "20%"},
                                            {sTitle: "<b>Description</b>", mData: "description"}
                                        ],
                                        "aaData": [],
                                        "oLanguage": {
                                            "sSearch": "Search: ",
                                            "sEmptyTable": "No created objects."
                                        }
                                    };
                                    var objTable = $tbl.dataTable(tblSettings);
                                    objTable.fnAddData(displayData);


                                    var $objTable = $('<table ' +
                                        'class="table table-bordered table-striped" style="width:100%;margin-left:0px; margin-right:0px;">' +
                                        '</table>')
                                        .dataTable({
                                            "sPaginationType": "full_numbers",
                                            "sDom": sDom,
                                            "iDisplayLength": iDisplayLength,
                                            "aaSorting": [[0, "asc"], [1, "asc"]],
                                            "aaData": displayData,
                                            "aoColumns": [
                                                {sTitle: "Created Object Name", mData: "name", sWidth: "20%"},
                                                {sTitle: "Type", mData: "type", sWidth: "20%"},
                                                {sTitle: "Description", mData: "description"}
                                            ],
                                            "oLanguage": {
                                                "sEmptyTable": "No objects specified!",
                                                "sSearch": "Search Created Objects: "
                                            },
                                            "fnDrawCallback": reportRowEvents
                                        });
                                    //$tblDiv.append($objTable)
                                }

                            }, function (error) {
                            console.error(error);
                        });
                    }
                }
            }

            this.loading(false);
        },
        openViewerCell: function (ws_info) {
            var self = this;
            var cell = Jupyter.notebook.get_selected_cell();
            var near_idx = 0;
            if (cell) {
                near_idx = Jupyter.notebook.find_cell_index(cell);
                $(cell.element).off('dblclick');
                $(cell.element).off('keydown');
            }
            var info = self.createInfoObject(ws_info);
            self.trigger('createViewerCell.Narrative', {
                'nearCellIdx': near_idx,
                'widget': 'kbaseNarrativeDataCell',
                'info': info
            });
        },
        createInfoObject: function (info) {
            return _.object(['id', 'name', 'type', 'save_date', 'version',
                'saved_by', 'ws_id', 'ws_name', 'chsum', 'size',
                'meta'], info);
        },
        loading: function (isLoading) {
            if (isLoading) {
                this.showMessage('<i class="fa fa-spinner fa-spin"></i>');
            } else {
                this.hideMessage();
            }
        },
        showMessage: function (message) {
            var span = $("<span/>").append(message);
            this.$messagePane.append(span);
            this.$messagePane.show();
        },
        hideMessage: function () {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },
        clientError: function (error) {
            this.loading(false);
            var errString = "Unknown error.";
            console.error(error);
            if (typeof error === "string")
                errString = error;
            else if (error.error && error.error.message)
                errString = error.error.message;
            else if (error.error && error.error.error && typeof error.error.error === 'string') {
                errString = error.error.error;
            }

            var $errorDiv = $("<div>")
                .addClass("alert alert-danger")
                .append("<b>Error:</b>")
                .append("<br>" + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
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
        },
    });
});
