(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseRegulomeCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            id: null,
            ws: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "Regulome Overview",
            isInCard: false,
            width: 600,
            height: 550
        },

//        workspaceURL: "https://kbase.us/services/workspace",
        newWorkspaceServiceUrl: "https://kbase.us/services/ws",//"https://kbase.us/services/ws/",

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
					self.$elem.append("<h3>Regulome Info</h3>");
			        self.$elem.append($("<div />").
					append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>").append("<td>ID</td><td>" + self.collection.data.regulome_id + "</td>"))
					    .append($("<tr/>").append("<td>Source</td><td>" + self.collection.data.regulome_source + "</td>"))
					    .append($("<tr/>").append("<td>Genome name</td><td>" + self.collection.data.genome.genome_name + "</td>"))
					    .append($("<tr/>").append("<td>Genome ID</td><td>" + self.collection.data.genome.genome_id + "</td>"))
					    .append($("<tr/>").append("<td>Genome reference</td><td>" + self.collection.data.genome.genome_ref + "</td>"))
					    .append($("<tr/>").append("<td>NCBI Taxonomy ID</td><td>" + self.collection.data.genome.ncbi_taxonomy_id + "</td>"))
					));
					self.$elem.append("<h3>View regulons</h3>");

					var $dropdown = $("<select />");
					for (var regulon in self.collection.data.regulons) {						
						$dropdown.append("<option id='" + regulon + "'>"+self.collection.data.regulons[regulon].regulon_id+"; regulator = " + self.collection.data.regulons[regulon].regulator.regulator_name + " </option>");
					}
					self.$elem.append($dropdown);
					self.$elem.append($("<button class='btn btn-default'>Show Regulon</button>")
                                            .on("click", 
                                                function(event) {
                                                    $(self.$elem.selector + " > select option:selected").each(function() {
    //                                              console.log(event);
                                                    self.trigger("showRegulon", { regulon: self.collection.data.regulons[$(this).attr("id")], event: event });
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
                type: "Regulome",
                id: this.options.id,
                ws: this.options.ws,
                title: "Regulome Overview"
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
