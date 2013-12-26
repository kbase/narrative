(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseCmonkeyRunResultCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            id: null,
            ws: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "cMonkey Run Result Overview",
            isInCard: false,
            width: 550
        },

//        workspaceURL: "https://kbase.us/services/workspace",
        newWorkspaceServiceUrl: "http://140.221.84.209:7058/",

        init: function(options) {
            this._super(options);
            if (this.options.id === null) {
                //throw an error
                return;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

//            this.workspaceClient = new workspaceService(this.workspaceURL);
              this.workspaceClient = new Workspace(this.newWorkspaceServiceUrl);

            return this.render();
        },

        render: function(options) {
            this.showMessage("<img src='" + this.options.loadingImage + "'/>");

            /**
             * Fields to show:
             * ID
             * Timestamp
             * Number of motifs
             */
            var self = this;
//            this.workspaceClient.get_object({"id" : this.options.cmonkey_run_result_id, "type" : "CmonkeyRunResult", "workspace": this.options.workspace_id}, 
            this.workspaceClient.get_objects([{workspace: this.options.ws, name: this.options.id}], 
		    	function(data){
					self.collection = data[0];
					self.$elem.append("<h3>cMonkey Run Info</h3>");
			        self.$elem.append($("<div />").
					append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>").append("<td>ID</td><td>" + self.collection.data.id + "</td>"))
					    .append($("<tr/>").append("<td>Created: </td><td>" + self.collection.data.start_time + "</td>"))
                                            .append($("<tr/>").append("<td>Organism</td><td>" + self.collection.data.organism + "</td>"))
                                            .append($("<tr/>").append("<td>Number of clusters</td><td>" + self.collection.data.clusters_number + "</td>"))
                                            .append($("<tr/>").append("<td>Number of genes</td><td>" + self.collection.data.rows_number + "</td>"))
                                            .append($("<tr/>").append("<td>Number of conditions</td><td>" + self.collection.data.columns_number + "</td>"))
					));
					self.$elem.append("<h3>View clusters</h3>");

					var $dropdown = $("<select />");
					for (var cluster in self.collection.data.network.clusters) {						
						$dropdown.append("<option id='" + cluster + "'>"+self.collection.data.network.clusters[cluster].id+"; residual = " + self.collection.data.network.clusters[cluster].residual + "; genes = " + self.collection.data.network.clusters[cluster].gene_ids.length + "; conditions = " + self.collection.data.network.clusters[cluster].dataset_ids.length + " </option>");
					}
					self.$elem.append($dropdown);
					self.$elem.append($("<button class='btn btn-default'>Show Cluster</button>")
                                            .on("click", 
                                                function(event) {
                                                    $(self.$elem.selector + " > select option:selected").each(function() {
    //                                              console.log(event);
                                                    self.trigger("showCmonkeyCluster", { cluster: self.collection.data.network.clusters[$(this).attr("id")], event: event });
                                    });
                                })
                            );
						
                        },

			    function(data) {
                                $('.loader-table').remove();
                                self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
                                return;
                            }
		    );
            this.hideMessage();
            return this;
        },


        getData: function() {
            return {
                type: "CmonkeyRunResult",
                id: this.options.id,
                ws: this.options.ws,
                title: "cMonkey Run Result Overview"
            };
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },

        rpcError: function(error) {
            console.log("An error occurred: " + error);
        }
	
    });
})( jQuery );
