(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseBambiRunResultCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            bambi_run_result_id: null,
            workspace_id: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "BAMBI Run Result Overview",
            isInCard: false,
            width: 450
        },

//        workspaceURL: "https://kbase.us/services/workspace",
        newWorkspaceServiceUrl: "https://kbase.us/services/ws",//"http://140.221.84.209:7058/",
        
        init: function(options) {
            this._super(options);
            if (this.options.bambi_run_result_id === null) {
                //throw an error
                return;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

//            this.workspaceClient = new workspaceService(this.workspaceURL);
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
            this.workspaceClient.get_objects([{workspace: this.options.workspace_id, name: this.options.bambi_run_result_id}], 
            		    	function(data){
					self.collection = data[0];
					var d = new Date(parseInt(self.collection.data.timestamp));
					var creationMonth = d.getMonth()+1;
					self.$elem.append("<h3>BAMBI Run Info</h3>");
			        self.$elem.append($("<div />").
					append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>").append("<td>ID</td><td>" + self.collection.data.id + "</td>"))
					    .append($("<tr/>").append("<td>Created: </td><td>" + creationMonth +"/"+ d.getDate() +"/"+ d.getFullYear() +" "+ d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds() + "</td>"))
						.append($("<tr/>").append("<td>Number of motifs</td><td>" + self.collection.data.motifs.length + "</td>"))
					));
					self.$elem.append("<h3>View motifs</h3>");

					var $dropdown = $("<select />");
					for (var motif in self.collection.data.motifs) {						
						$dropdown.append("<option id='" + motif + "'>"+ self.collection.data.motifs[motif].description + "</option>");
					}
					self.$elem.append($dropdown);
					self.$elem.append($("<button class='btn btn-default'>Show Motif</button>")
	                	.on("click", 
	                    	function(event) {
								$(self.$elem.selector + " > select option:selected").each(function() {
    //                      	console.log(event);
								self.trigger("showBambiMotif", { motif: self.collection.data.motifs[$(this).attr("id")], event: event });
	                        });
	                    })
	                );
						
					self.$elem.append($("<span />").append("<br><button class='btn btn-default'>Show BAMBI run parameters</button>")
	                	.on("click", 
	                    	function(event) {
								self.trigger("showBambiRunParameters", { collection: self.collection, event: event });
	                    })
	                );
	              
					self.$elem.append($("<span />").append("<br><button class='btn btn-default'>Show BAMBI raw output</button>")
	                	.on("click", 
	                    	function(event) {
								self.trigger("showBambiRawOutput", { raw_output: self.collection.data.raw_output, event: event });
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
                type: "BambiRunResult",
                id: this.options.bambi_run_result_id,
                workspace: this.options.workspace_id,
                title: "BAMBI Run Result Overview"
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
