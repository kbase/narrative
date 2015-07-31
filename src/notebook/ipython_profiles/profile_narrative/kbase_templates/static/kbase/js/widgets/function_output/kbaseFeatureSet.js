/**
 * Output widget for visualization of tree object (species trees and gene trees).
 * Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
'use strict';

define(['jquery',
        'kbwidget',
        'kbaseAuthenticatedWidget', 
        'jquery-dataTables',
        'jquery-dataTables-bootstrap',
        'knhx', 
        'widgetMaxWidthCorrection'], 
        function($) {
    $.KBWidget({
        name: 'kbaseFeatureSet',
        parent: 'kbaseAuthenticatedWidget',
        version: '0.0.1',
        options: {
            featureset_name: null,
            workspaceName: null,
            wsURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif"
        },

        loadingImage: "static/kbase/images/ajax-loader.gif",

        init: function(options) {
            this._super(options);

            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            if (options.workspaceids && options.workspaceids.length > 0) {
                var id = options.workspaceids[0].split('/');
                this.options.treeID = id[1];
                this.options.workspaceID = id[0];
            }

            this.$mainPanel = $("<div>").addClass("").hide();
            this.$elem.append(this.$mainPanel);

            if (!this.options.featureset_name) {
                this.renderError("No FeatureSet to render!");
            } else if (!this.options.workspaceName) {
                this.renderError("No workspace given!");
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
            this.loadFeatureSet();
        },
        

        features: null, // genomeId : [{fid: x, data: x}]

        loadFeatureSet: function() {
            var self = this;
            self.features = {};
            self.ws.get_objects([{ref:self.options.workspaceName+"/"+self.options.featureset_name}],
                function(data) {
                    var fs = data[0].data;
                    if(fs.description) {
                        self.$mainPanel.append($('<div>')
                            .append("<i>Description</i> - ")
                            .append(fs.description));
                    }

                    for (var fid in fs.elements) {
                        if (fs.elements.hasOwnProperty(fid)) {

                            for (var k=0; k<fs.elements[fid].length; k++) {
                                var gid = fs.elements[fid][k];
                                if(self.features.hasOwnProperty(gid)) {
                                    self.features[gid].push({'fid':fid});
                                } else {
                                    self.features[gid] = [{'fid':fid}];
                                }
                            }
                        }
                    }
                    self.getGenomeData();
                    self.$mainPanel.show();
                },
                function(error) {
                    self.loading(true);
                    self.renderError(error);

                });
        },

        
        genomeLookupTable: null, // genomeId: { featureId: indexInFeatureList }
        genomeObjectInfo: null, //{},
        featureTableData: null, // list for datatables

        getGenomeData: function() {
            var self = this;
            self.genomeLookupTable = {};
            self.genomeObjectInfo = {};
            self.featureTableData = [];
            // first get subdata for each of the genomes to build up the Feature ID to index lookup table
            var subdata_query = [];
            for(var gid in self.features) {
                subdata_query.push({ref:gid, included:['features/[*]/id']});
            }
            self.ws.get_object_subset(subdata_query,
                function(data) {
                    for (var k=0; k<data.length; k++) {
                        self.genomeObjectInfo[subdata_query[k].ref] = data[k].info;
                        self.genomeLookupTable[subdata_query[k].ref] = {}
                        for (var f=0; f<data[k].data.features.length; f++) {
                            self.genomeLookupTable[subdata_query[k].ref][data[k].data.features[f].id] = f; 
                        }
                    }

                    for(var gid in self.features) {
                        var included = [];
                        for(var f=0; f<self.features[gid].length; f++) {
                            var idx = self.genomeLookupTable[gid][self.features[gid][f].fid];
                            included.push('features/'+idx+'/id');
                            included.push('features/'+idx+'/type');
                            included.push('features/'+idx+'/function');
                            included.push('features/'+idx+'/aliases');
                        }

                        var subdata_query2 = [{ref:gid,included:included}];
                        self.ws.get_object_subset(subdata_query2,
                            function(featureData) {
                                var g = featureData[0].data;
                                // every feature we get back here is something in the list
                                for(var f=0; f<g.features.length; f++) {
                                    var aliases = "None";
                                    if(g.features[f].aliases) {
                                        if(g.features[f].aliases.length>0) { 
                                            aliases= g.features[f].aliases.join(', '); 
                                        }
                                    }

                                    self.featureTableData.push(
                                            {
                                                fid: '<a href="functional-site/#/dataview/'+
                                                            featureData[0].info[6]+'/'+featureData[0].info[1]+
                                                            '?sub=Feature&subid='+g.features[f].id + '">'+g.features[f].id+'</a>',
                                                gid: '<a href="functional-site/#/dataview/'+
                                                        featureData[0].info[6]+'/'+featureData[0].info[1]+
                                                        '" target="_blank">'+featureData[0].info[1]+"</a>",
                                                ali: aliases,
                                                type: g.features[f].type,
                                                func: g.features[f].function
                                            }
                                        );
                                }
                                self.renderFeatureTable(); // just rerender each time
                                self.loading(true);
                            },
                            function(error) {
                                self.loading(true);
                                self.renderError(error);
                            });
                    }

                },
                function(error) {
                    self.loading(true);
                    self.renderError(error);
                });

        },

        $featureTableDiv : null,
        renderFeatureTable: function() {
            var self = this;

            if(!self.$featureTableDiv) {
                self.$featureTableDiv = $('<div>').css({'margin':'5px'});
                self.$mainPanel.append(self.$featureTableDiv);
            }

            self.$featureTableDiv.empty();

            var $tbl = $('<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-left: 0px; margin-right: 0px;">')
                            .addClass("table table-bordered table-striped");
            self.$featureTableDiv.append($tbl);

            var sDom = "ft<ip>";
            if(self.featureTableData.length<=10) sDom = "ft<i>";

            var tblSettings = {
                "sPaginationType": "full_numbers",
                "iDisplayLength": 10,
                "sDom": sDom,
                "aaSorting": [[ 2, "asc" ], [0, "asc"]],
                "aoColumns": [
                                      {sTitle: "Feature ID", mData: "fid"},
                                      {sTitle: "Aliases", mData: "ali"},
                                      {sTitle: "Genome", mData: "gid"},
                                      {sTitle: "Type", mData: "type"},
                                      {sTitle: "Function", mData: "func"},
                                      ],
                                      "aaData": [],
                                      "oLanguage": {
                                          "sSearch": "Search features:",
                                          "sEmptyTable": "This FeatureSet is empty"
                                      }
                };
            var featuresTable = $tbl.dataTable(tblSettings);
            featuresTable.fnAddData(self.featureTableData);
        },

        renderError: function(error) {
            errString = "Sorry, an unknown error occurred";
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

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
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