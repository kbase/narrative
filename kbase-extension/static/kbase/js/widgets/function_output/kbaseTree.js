/**
 * Output widget for visualization of tree object (species trees and gene trees).
 * Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

define(['jquery', 
        'narrativeConfig',
        'util/string',
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'knhx', 
        'widgetMaxWidthCorrection'], 
function($,
         Config,
         StringUtil) {
    $.KBWidget({
        name: 'kbaseTree',
        parent: 'kbaseAuthenticatedWidget',
        version: '0.0.1',
        options: {
            treeID: null,
            workspaceID: null,
            treeObjVer: null,
            kbCache: null,
            workspaceURL: Config.url('workspace'),
            loadingImage: Config.get('loading_gif'),
            height: null,
        },

        pref: null,
        timer: null,
        token: null,

        init: function(options) {
            this._super(options);
            this.pref = StringUtil.uuid();

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
                
                function EasyTreeForNarrative(canvasId, treeString, nodeIdToNameMap, leafClickListener, nodeColorFunc) {
                    
                    var kn_g_tree = kn_parse(treeString);
                    
                    if (nodeIdToNameMap) {
                        for (var nodePos in kn_g_tree.node) {
                            var nodeId = kn_g_tree.node[nodePos].name;
                            var nodeName = nodeIdToNameMap[nodeId];
                            if (nodeName) {
                                kn_g_tree.node[nodePos].id = nodeId;
                                kn_g_tree.node[nodePos].name = nodeName;
                            }
                        }
                    }
                    
                    if (nodeColorFunc) {
                        for (var nodePos in kn_g_tree.node) {
                            var node = kn_g_tree.node[nodePos];
                            var color = nodeColorFunc(node, nodePos);
                            if (color) {
                                node.hl = color;
                            }
                        }
                    }
                    
                    var kn_g_conf = new Object();
                    var canvas = document.getElementById(canvasId);
                    
                    var conf = kn_g_conf;
                    conf.c_box = new Array();
                    conf.width = 1000; conf.height = 600;
                    conf.xmargin = 20; conf.ymargin = 20;
                    conf.fontsize = 8;
                    conf.c_ext = "rgb(0,0,0)";
                    conf.c_int = "rgb(255,0,0)";
                    conf.c_line = '#444'; //"rgb(0,20,200)";
                    conf.c_node = '#666'; //"rgb(20,20,20)";
                    conf.c_active_node = "rgb(255,128,0)"
                    conf.c_hl = "rgb(180, 210, 255)";
                    conf.c_hidden = "rgb(0,200,0)";
                    conf.c_regex = "rgb(0,128,0)";
                //  conf.regex = ':S=([^:\\]]+)';
                    conf.regex = ':B=([^:\\]]+)';
                    conf.xskip = 3.0;
                    conf.yskip = 14;
                    conf.box_width = 6.0;
                    conf.old_nh = null;
                    conf.is_real = true;
                    conf.is_circular = false;
                    conf.show_dup = true;
                    conf.runtime = 0;

                    var changeLayoutX = 0;
                    var changeLayoutY = 0;
                    var changeLayoutW = 0;
                    var changeLayoutH = 0;
                    
                    function plot(canvas, kn_g_tree, kn_g_conf) {
                        kn_plot_core(canvas, kn_g_tree, kn_g_conf);
                        var text = "Change layout";
                        var ctx = canvas.getContext("2d");
                        CanvasTextFunctions.enable(ctx);
                        ctx.strokeStyle = kn_g_conf.c_ext;
                        ctx.fillStyle = "rgb(180, 245, 220)";
                        var w = ctx.measureText(kn_g_conf.font, kn_g_conf.fontsize, text);
                        var x = kn_g_conf.width - 80;
                        var y = 1;
                        var h = kn_g_conf.fontsize * 1.5 + 1;
                        ctx.fillRect(x, y, w, h);
                        ctx.drawText(kn_g_conf.font, kn_g_conf.fontsize, x, y + kn_g_conf.fontsize * .8 + kn_g_conf.fontsize / 3, text);
                        changeLayoutX = x;
                        changeLayoutY = y;
                        changeLayoutW = w;
                        changeLayoutH = h;
                    }
                    
                    function changeLayout(isCircular) {
                        kn_g_conf.is_circular = isCircular;
                        kn_g_conf.height = kn_g_conf.is_circular? kn_g_conf.width : kn_g_conf.ymargin * 2 + kn_g_tree.n_tips * kn_g_conf.yskip;
                        canvas.height = kn_g_conf.height;
                        kn_count_tips(kn_g_tree);
                        kn_g_conf.is_real = kn_calxy(kn_g_tree, kn_g_conf.is_real);
                        plot(canvas, kn_g_tree, kn_g_conf);
                    }

                    function ev_canvas(ev) {
                        if (navigator.appName == "Microsoft Internet Explorer") { // for IE8
                            /* When we click a node on the IE8 canvas, ev.offsetX gives
                             * the offset inside the node instead of inside the canvas.
                             * We have to do something nasty here... */
                            var d = document.body;
                            var o = document.getElementById("canvasContainer");
                            ev._x = ev.clientX - (o.offsetLeft - d.scrollLeft) - 3;
                            ev._y = ev.clientY - (o.offsetTop - d.scrollTop) - 3;
                        } else {
                            var scrX = ev.pageX;
                            var scrY = ev.pageY;
                            if ((!scrX) && (!scrY) && ev.clientX && ev.clientY) {
                                scrX = ev.clientX + document.body.scrollLeft
                                    + document.documentElement.scrollLeft;
                                scrY = ev.clientY + document.body.scrollTop
                                    + document.documentElement.scrollTop;
                            }
                            var elemPos = $('#canvasContainer_' + canvasId).position();
                            var ncPos = $('#notebook-container').position();
                            ev._x = scrX - (ncPos.left + elemPos.left);
                            ev._y = scrY - (ncPos.top + elemPos.top);
                        }
                        if (kn_g_tree) {
                            var id = kn_get_node(kn_g_tree, kn_g_conf, ev._x, ev._y);
                            if (id >= 0 && id < kn_g_tree.node.length) {
                                var tree = kn_g_tree, conf = kn_g_conf, i = id;
                                if (i < tree.node.length && tree.node[i].child.length) {
                                    if (!tree.node[i].parent)
                                        return;
                                    tree.node[i].hidden = !tree.node[i].hidden;
                                    var nn = tree.node.length;
                                    tree.node = kn_expand_node(tree.node[tree.node.length-1]);
                                    kn_count_tips(tree);
                                    conf.is_real = kn_calxy(tree, conf.is_real);
                                    kn_g_tree = tree; kn_g_conf = conf;
                                    plot(canvas, tree, conf);
                                } else if (leafClickListener) {
                                    leafClickListener(kn_g_tree.node[id], id);
                                }
                            } else {
                                var x = ev._x;
                                var y = ev._y;
                                if (x >= changeLayoutX && x < changeLayoutX + changeLayoutW &&
                                        y >= changeLayoutY && y < changeLayoutY + changeLayoutH) {
                                    changeLayout(!kn_g_conf.is_circular);
                                }
                            }
                        }
                    }

                    var tree = kn_g_tree;
                    if (tree.error) {
                        if (tree.error & 1) alert("Parsing ERROR: missing left parenthesis!");
                        else if (tree.error & 2) alert("Parsing ERROR: missing right parenthesis!");
                        else if (tree.error & 4) alert("Parsing ERROR: missing brackets!");
                        else alert("Unknown parsing ERROR: " + tree.error);
                    } else {
                        conf.is_real = kn_calxy(tree, conf.is_real);
                        conf.height = conf.is_circular? conf.width : conf.ymargin * 2 + tree.n_tips * conf.yskip;
                        canvas.width = conf.width;
                        canvas.height = conf.height;
                        plot(canvas, tree, conf);

                        // put the canvas in a container
                        var o = document.createElement("div");
                        o.setAttribute('id', 'canvasContainer_' + canvasId);
                        o.setAttribute('style', 'position: relative;');
                        var canvas_parent = canvas.parentNode || canvas.parent;
                        canvas_parent.removeChild(canvas);
                        canvas_parent.appendChild(o);
                        o.appendChild(canvas);
                        
                        if (canvas.addEventListener) canvas.addEventListener('click', ev_canvas, false);
                        else canvas.attachEvent('onclick', ev_canvas);
                    }
                };
                
                new EasyTreeForNarrative(self.canvasId, tree.tree, tree.default_node_labels, function(node) {
                	if ((!tree.ws_refs) || (!tree.ws_refs[node.id])) {
                		var node_name = tree.default_node_labels[node.id];
                		if (node_name.indexOf('/') > 0) {  // Gene label
                		    var parts = node_name.split("/");
                    		var url = "/#dataview/" + self.options.workspaceID + "/" + parts[0] + "?sub=Feature&subid=" + parts[1];
                            window.open(url, '_blank');
                		}
                		return;
                	}
                	var ref = tree.ws_refs[node.id]['g'][0];
                	var objInfo = refToInfoMap[ref];
                	if (objInfo) {
                		var url = "/#dataview/" + objInfo[7] + "/" + objInfo[1];
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