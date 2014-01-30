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
            width: 600,
            height: 550
        },

//        workspaceURL: "https://kbase.us/services/workspace",
        newWorkspaceServiceUrl: "https://kbase.us/services/ws",//"http://140.221.84.209:7058/",

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.id === null) {
                //throw an error
                return;
            }


//          this.workspaceClient = new workspaceService(this.workspaceURL);
            this.workspaceClient = new Workspace(this.newWorkspaceServiceUrl, { 'token' : this.options.auth, 'user_id' : this.options.userId});

	    var container = $('<div id="container" />');
	    this.$elem.append(container);

            this.tableLoading = $('<div id="table-loading" style="text-align: center; margin-top: 60px;"><img src="assets/img/ajax-loader.gif" /><p class="text-muted">Loading...<p></div>');
            container.append(this.tableLoading);
            
            this.contentDiv = $('<div id="table-container" />');
            this.contentDiv.addClass('hide');                
            container.append(this.contentDiv);


            this.workspaceClient.get_objects([{workspace: this.options.ws, name: this.options.id}], 
		    	function(data){
					self.collection = data[0];
					self.contentDiv.append("<h4>cMonkey Run Info</h4>");
                                        self.workspaceClient.get_object_info([{ref: self.collection.data.parameters.series_ref},
                                                                              {ref: self.collection.data.parameters.genome_ref}, 
                                                                              {ref: self.collection.data.parameters.operome_ref}, 
                                                                              {ref: self.collection.data.parameters.network_ref}], 
                                             0, 
                                            function(data){
                                                self.expression_info = data[0];
                                                self.genome_info = data[1];
                                                self.operome_info = data[2];
                                                self.string_info = data[3];
                                                
                                                self.contentDiv.append($("<div />").
                                                    append($("<table/>").addClass("kbgo-table")
                                                    .append($("<tr/>").append("<td>Object name</td><td>" + self.collection.data.id + "</td>"))
                                		    .append($("<tr/>").append("<td>Run started </td><td>" + self.collection.data.start_time + "</td>"))
                                        	    .append($("<tr/>").append("<td>Run finished </td><td>" + self.collection.data.finish_time + "</td>"))
//                                                    .append($("<tr/>").append("<td>Expression data reference</td><td>" + self.expression_info[7] + "/" + self.expression_info[1] + "</td>"))
//                                                    .append($("<tr/>").append("<td>Genome reference</td><td><a href = '#/genome/" + self.genome_info[7] + "/" + self.genome_info[1] +"'>" + self.genome_info[7] + "/" + self.genome_info[1] + "</a></td>"))
//                                                    .append($("<tr/>").append("<td>Operons data reference</td><td>" + self.operome_info[7] + "/" + self.operome_info[1] + "</td>"))
//                                                    .append($("<tr/>").append("<td>STRING data reference</td><td>" + self.string_info[7] + "/" + self.string_info[1] + "</td>"))
                                                    .append($("<tr/>").append("<td>Number of clusters</td><td>" + self.collection.data.network.clusters_number + "</td>"))
                                                    .append($("<tr/>").append("<td>Number of genes</td><td>" + self.collection.data.network.rows_number + "</td>"))
                                                    .append($("<tr/>").append("<td>Number of conditions</td><td>" + self.collection.data.network.columns_number + "</td>"))
        					));

        					self.contentDiv.append("<h4>Input data</h4>");

                                                self.contentDiv.append("<div>" + 
                                                    "Expression series: <strong>" + self.expression_info[7] + "/" + self.expression_info[1] + "</strong><br/>" +
                                                    "Genome: <strong><a href = '#/genomes/" + self.genome_info[7] + "/" + self.genome_info[1] +"'>" + self.genome_info[7] + "/" + self.genome_info[1] + "</a></strong><br/>" +
                                                    "Operons: <strong>" + self.operome_info[7] + "/" + self.operome_info[1] + "</strong><br/>" +
                                                    "STRING data: <strong>" + self.string_info[7] + "/" + self.string_info[1] + "</strong></div>" );

                                                self.contentDiv.append("<h4>View clusters</h4>");
                                                
            					var $dropdown = $("<select />");
                        			for (var cluster in self.collection.data.network.clusters) {						
                                			$dropdown.append("<option id='" + cluster + "'>"+self.collection.data.network.clusters[cluster].id+"; residual = " + self.collection.data.network.clusters[cluster].residual.toFixed(4) + "; genes = " + self.collection.data.network.clusters[cluster].gene_ids.length + "; conditions = " + self.collection.data.network.clusters[cluster].sample_ws_ids.length + " </option>");
                                        	}
                                                self.$elem.append($dropdown);
                                                self.$elem.append($("<button class='btn btn-default'>Show Cluster</button>")
                                                    .on("click", 
                                                        function(event) {
                                                            $(self.$elem.selector + " > select option:selected").each(function() {
                                                            self.trigger("showCmonkeyCluster", { cluster: self.collection.data.network.clusters[$(this).attr("id")], event: event });
                                                        });
                                                    })
                                                );
                                                
                                            },
                                            function(data) {
                                                self.contentDiv.remove();
                                                self.loading(false);
                                                self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
                                                return;
                                            }
                                        )



				self.loading(false);

                        },

			    function(data) {
                                self.contentDiv.remove();
                                self.loading(false);
                                self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
                                return;
                            }
		    );

            return this;
        },

        loading: function(flag) {
            if (flag) {
                this.tableLoading.removeClass('hide');
                this.contentDiv.addClass('hide');                
            } else {
                this.contentDiv.removeClass('hide');
                this.tableLoading.addClass('hide');
            }
        },

        getData: function() {
            return {
                type: "CmonkeyRunResult",
                id: this.options.id,
                workspace: this.options.ws,
                auth: this.options.auth,
                userId: this.options.userId,
                title: "cMonkey Run Result Overview"
            };
        },

    });
})( jQuery );
