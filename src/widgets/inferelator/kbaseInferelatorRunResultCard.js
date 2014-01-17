(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseInferelatorRunResultCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            id: null,
            ws: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "Inferelator Run Result Overview",
            isInCard: false,
            width: 500,
            height: 450
        },

        newWorkspaceServiceUrl: "https://kbase.us/services/ws",//"http://140.221.84.209:7058/",

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

              this.workspaceClient = new Workspace(this.newWorkspaceServiceUrl, { 'token' : this.options.auth, 'user_id' : this.options.userId});

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
            this.workspaceClient.get_objects([{workspace: this.options.ws, name: this.options.id}], 
		    	function(data){
					self.collection = data[0];
					self.$elem.append("<h3>Inferelator Run Info</h3>");
			        self.$elem.append($("<div />").
					append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>").append("<td>ID</td><td>" + self.collection.data.id + "</td>"))
					    .append($("<tr/>").append("<td>Organism</td><td>" + self.collection.data.organism + "</td>"))
					    .append($("<tr/>").append("<td>List of regulators</td><td>" + self.collection.data.params.tf_list_ws_ref + "</td>"))
                                            .append($("<tr/>").append("<td>Expression data series</td><td>" + self.collection.data.params.expression_series_ws_ref + "</td>"))
                                            .append($("<tr/>").append("<td>Bi-cluster network</td><td>" + self.collection.data.params.cmonkey_run_result_ws_ref + "</td>"))
                                            .append($("<tr/>").append("<td>Number of hits</td><td>" + self.collection.data.hits.length + "</td>"))
					));
                    			        self.$elem.append("<h3>View hits</h3>");
					self.$elem.append($("<button class='btn btn-default'>Show hit list</button>")
	                	.on("click", 
	                    	function(event) {
								self.trigger("showInferelatorHits", { inferelatorrunresult: self.collection, event: event });
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
                type: "InferelatorRunResult",
                id: this.options.id,
                workspace: this.options.ws,
                auth: this.options.auth,
                userId: this.options.userId,
                title: "Inferelator Run Result Overview"
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
