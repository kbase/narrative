(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseMemeRunResultCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            meme_run_result_id: null,
            workspace_id: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "MEME Run Result Overview",
            isInCard: false,
            width: 400
        },

//        workspaceURL: "https://kbase.us/services/workspace",
        workspaceURL: "http://140.221.84.170:7058/",

        init: function(options) {
            this._super(options);
            if (this.options.meme_run_result_name === null) {
                //throw an error
                return;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.workspaceClient = new workspaceService(this.workspaceURL);

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
            this.workspaceClient.get_objects([{"obj_name" : this.options.meme_run_result_name, "type" : "MemeRunResult", "ws_name": this.options.workspace_name}], 
		    	function(data){
					self.collection = data[0];
					rawOutput = self.collection.data.raw_output;
					var d = new Date(parseInt(self.collection.data.timestamp));
					var creationMonth = d.getMonth()+1;
					self.$elem.append("<h3>MEME Run Info</h3>");
			        self.$elem.append($("<div />").
					append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>").append("<td>ID</td><td>" + self.collection.data.id + "</td>"))
					    .append($("<tr/>").append("<td>Created: </td><td>" + creationMonth +"/"+ d.getDate() +"/"+ d.getFullYear() +" "+ d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds() + "</td>"))
						.append($("<tr/>").append("<td>Number of motifs</td><td>" + self.collection.data.motifs.length + "</td>"))
					));
					self.$elem.append("<h3>View motifs</h3>");

					var $dropdown = $("<select />");
					for (var motif in self.collection.data.motifs) {
						rawOutput+=self.collection.data.motifs[motif].raw_output;
						$dropdown.append("<option id='" + motif + "'> Motif " + self.collection.data.motifs[motif].id + " ("+ self.collection.data.motifs[motif].sites.length +" sites)</option>");
					}
					self.$elem.append($dropdown);
					self.$elem.append($("<button class='btn btn-default'>Show Motif</button>")
	                	.on("click", 
                                    function(event) {
					$(self.$elem.selector + " > select option:selected").each(function() {
                                          console.log(event);
                                            self.trigger("showMemeMotif", { motif: self.collection.data.motifs[$(this).attr("id")], event: event });
                                        });
                                    })
                                );
						
					self.$elem.append($("<span />").append("<br><button class='btn btn-default'>Show MEME run parameters</button>")
	                	.on("click", 
	                    	function(event) {
								self.trigger("showMemeRunParameters", { collection: self.collection, event: event });
	                    })
	                );
	              
					self.$elem.append($("<span />").append("<br><button class='btn btn-default'>Show MEME raw output</button>")
	                	.on("click", 
	                    	function(event) {
								self.trigger("showMemeRawOutput", { memeOutput: rawOutput, event: event });
	                    })
	                );
			    },

			    self.rpcError
		    );
            this.hideMessage();
            return this;
        },


        getData: function() {
            return {
                type: "MemeRunResult",
                id: this.options.meme_run_result_id,
                workspace: this.options.workspace_id,
                title: "MEME Run Result Overview"
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
