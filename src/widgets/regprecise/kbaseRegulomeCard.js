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
            width: "auto",
            height: "auto"
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

//            this.workspaceClient = new workspaceService(this.workspaceURL);
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
					self.$elem.append($("<h4 />").append("Regulome Info"));
        			        self.$elem.append($("<div />").
                				append($("<table/>").addClass("invtable")
                        			    .append($("<tr/>")
                                                        .append($("<td/>").append("ID"))
                                                        .append($("<td/>").addClass("invtable-boldcell").append(self.collection.data.regulome_id)))
                        			    .append($("<tr/>")
                                                        .append($("<td/>").append("Source"))
                                                        .append($("<td/>").addClass("invtable-emcell").append(self.collection.data.regulome_source)))
                        			    .append($("<tr/>")
                                                        .append($("<td/>").append("Genome name"))
                                                        .append($("<td/>").addClass("invtable-emcell").append(self.collection.data.genome.genome_name)))
                        			    .append($("<tr/>")
                                                        .append($("<td/>").append("Genome ID"))
                                                        .append($("<td/>").addClass("invtable-boldcell").append("<a href='#/genomes/cs/" + self.collection.data.genome.genome_id + "'>" + self.collection.data.genome.genome_id +"</a>")))
                        			    .append($("<tr/>")
                                                        .append($("<td/>").append("Genome reference"))
                                                        .append($("<td/>").addClass("invtable-boldcell").append(self.collection.data.genome.genome_ref)))
                        			    .append($("<tr/>")
                                                        .append($("<td/>").append("NCBI Taxonomy ID"))
                                                        .append($("<td/>").addClass("invtable-boldcell").append("<a href='http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=" + self.collection.data.genome.ncbi_taxonomy_id + "'>" + self.collection.data.genome.ncbi_taxonomy_id + "</a>")))
                    			));
					
					self.$elem.append($("<h4 />").append("Regulons"));

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
                type: "Regulome",
                id: this.options.id,
                ws: this.options.ws,
                title: "Regulome Overview"
            };
        },

    });
})( jQuery );
