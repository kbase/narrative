(function($, undefined) {
    $.KBWidget({
        name: 'kbaseTree',
        parent: 'kbaseAuthenticatedWidget',
        version: '0.0.1',
        options: {
            treeID: null,
            workspaceID: null,
            kbCache: null,
            treeServiceURL: "http://140.221.85.58:8284/",
            workspaceURL: "http://140.221.84.209:7058/",
            loadingImage: "static/kbase/images/ajax-loader.gif",
            height: null,
        },

        init: function(options) {
            this._super(options);

//            this.options.kbCache = null;

            if (!this.options.treeID) {
                this.renderError("No tree to render!");
            }
            else if (!this.options.workspaceID) {
                this.renderError("No workspace given!");
            }
            else if (!this.options.kbCache && !this.authToken()) {
                this.renderError("No cache given, and not logged in!");
            }

            else {
                if (!this.options.kbCache)
                    this.wsClient = new Workspace(this.options.workspaceURL, {token: this.authToken()});

                this.$messagePane = $("<div/>")
                                    .addClass("kbwidget-message-pane kbwidget-hide-message");
                this.$elem.append(this.$messagePane);

                this.treeClient = new Tree(this.options.treeServiceURL);

                this.canvasId = "knhx-canvas-" + this.uuid();
                this.$canvas = $('<div>')
                               .append($('<canvas id="' + this.canvasId + '">'));
                if (this.options.height) {
                    this.$canvas.css({'max-height':this.options.height, 'overflow':'scroll'});
                }
                this.$elem.append(this.$canvas);

                knhx_init(this.canvasId, null);
                this.render();
            }

            return this;
        },

        render: function() {
            this.loading(false);
            var prom;

            var objId = this.buildObjectIdentity(this.options.workspaceID, this.options.treeID);
            if (this.options.kbCache)
                prom = this.options.kbCache.req('ws', 'get_objects', [objId]);
            else
                prom = this.wsClient.get_objects([objId]);

            $.when(prom).done($.proxy(function(objArr) {
                var tree = objArr[0].data;
                var idMap = {};
                $.each(tree.id_map, function(key, value) {
                    idMap[key] = value[1].replace(/[\(\)]/g, '_');
                });

                this.treeClient.replace_node_names(tree.species_tree.trim(), idMap, 
                    $.proxy(function(relabeledTree) {
                        kn_actions.plot(relabeledTree);
                        this.loading(true);
                    }, this),
                    $.proxy(function(error) {
                        kn_actions.plot(tree.species_tree);
                        this.loading(true);
                        this.dbg("error while relabeling tree");
                    }, this)
                );
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
                title: 'Genome Tree'
            };
        },

        buildObjectIdentity: function(workspaceID, objectID) {
            var obj = {};
            if (/^\d+$/.exec(workspaceID))
                obj['wsid'] = workspaceID;
            else
                obj['workspace'] = workspaceID;

            // same for the id
            if (/^\d+$/.exec(objectID))
                obj['objid'] = objectID;
            else
                obj['name'] = objectID;
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

    });
})( jQuery );