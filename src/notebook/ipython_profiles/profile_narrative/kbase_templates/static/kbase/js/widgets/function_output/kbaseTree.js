/**
 * Output widget for visualization of tree object (species trees and gene trees).
 * Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

(function($, undefined) {
    $.KBWidget({
        name: 'kbaseTree',
        parent: 'kbaseAuthenticatedWidget',
        version: '0.0.1',
        options: {
            treeID: null,
            workspaceID: null,
            treeObjVer: null,
            kbCache: null,
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif",
            height: null,
        },

        pref: null,
        timer: null,
        loadingImage: "static/kbase/images/ajax-loader.gif",
        token: null,

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();

            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            if (options.workspaceids && options.workspaceids.length > 0) {
                id = options.workspaceids[0].split('/');
                this.options.treeID = id[1];
                this.options.workspaceID = id[0];
            }

            if (!this.options.treeID) {
                this.renderError("No tree to render!");
            } else if (!this.options.workspaceID) {
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
        	this.wsClient = new Workspace(this.options.workspaceURL, {token: this.token});
            this.loading(false);
            this.loadTree();
        },
        
        loadTree: function() {
            var prom;
            var objId = this.buildObjectIdentity(this.options.workspaceID, this.options.treeID, this.options.treeObjVer, null);
            if (this.options.kbCache)
                prom = this.options.kbCache.req('ws', 'get_objects', [objId]);
            else
                prom = this.wsClient.get_objects([objId]);

            var self = this;
            
            $.when(prom).done($.proxy(function(objArr) {
                self.$elem.empty();

                var canvasDivId = "knhx-canvas-div-" + self.pref;
                self.canvasId = "knhx-canvas-" + self.pref;
                self.$canvas = $('<div id="'+canvasDivId+'">')
                               .append($('<canvas id="' + self.canvasId + '">'));
                
                if (self.options.height) {
                    self.$canvas.css({'max-height':self.options.height, 'overflow':'scroll'});
                }
                self.$elem.append(self.$canvas);

                watchForWidgetMaxWidthCorrection(canvasDivId);

                var tree = objArr[0].data;

                var refToInfoMap = {};
                var objIdentityList = [];
                if (tree.ws_refs) {
                	for (var key in tree.ws_refs) {
                		objIdentityList.push({ref: tree.ws_refs[key]['g'][0]});
                	}
                }
                if (objIdentityList.length > 0) {
                	$.when(self.wsClient.get_object_info(objIdentityList)).done(function(data) {
                		for (var i in data) {
                			var objInfo = data[i];
                			refToInfoMap[objIdentityList[i].ref] = objInfo;
                		}
                	}).fail(function(err) {
                		console.log("Error getting genomes info:");
                		console.log(err);
                	});
                }
                new EasyTree(self.canvasId, tree.tree, tree.default_node_labels, function(node) {
                	if ((!tree.ws_refs) || (!tree.ws_refs[node.id])) {
                		var node_name = tree.default_node_labels[node.id];
                		if (node_name.indexOf('/') > 0) {  // Gene label
                    		var url = "/functional-site/#/genes/" + self.options.workspaceID + "/" + node_name;
                            window.open(url, '_blank');
                		}
                		return;
                	}
                	var ref = tree.ws_refs[node.id]['g'][0];
                	var objInfo = refToInfoMap[ref];
                	if (objInfo) {
                		var url = "/functional-site/#/dataview/" + objInfo[7] + "/" + objInfo[1];
                        window.open(url, '_blank');
                	}
                }, function(node) {
                	if (node.id && node.id.indexOf("user") == 0)
                		return "#0000ff";
            		return null;
                });
                self.loading(true);
            }, this));
            $.when(prom).fail($.proxy(function(error) { this.renderError(error); }, this));
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

        getData: function() {
            return {
                type: 'Tree',
                id: this.options.treeID,
                workspace: this.options.workspaceID,
                title: 'Tree'
            };
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
})( jQuery );