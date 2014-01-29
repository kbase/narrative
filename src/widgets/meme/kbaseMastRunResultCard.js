(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseMastRunResultCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            id: null,
            ws: null,
            auth: null,
            userId: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "MAST Run Result Overview",
            isInCard: false,
            width: 400
        },

//        workspaceURL: "https://kbase.us/services/workspace",
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
             * Threshold
             * Number of hits
             */
            var self = this;
//            this.workspaceClient.get_object({"id" : this.options.mast_run_result_id, "type" : "MastRunResult", "workspace": this.options.workspace_id},
            this.workspaceClient.get_objects([{workspace: this.options.ws, name: this.options.id}], 

	    		function(data){
					self.mastresult = data[0];
					var d = new Date(parseInt(self.mastresult.data.timestamp));
					var creationMonth = d.getMonth()+1;
					self.$elem.append("<h3>MAST Run Info</h3>");
			        self.$elem.append($("<div />").
					append($("<table/>").addClass("kbgo-table")
					    .append($("<tr/>").append("<td>ID</td><td>" + self.mastresult.data.id + "</td>"))
					    .append($("<tr/>").append("<td>Created: </td><td>" + creationMonth +"/"+ d.getDate() +"/"+ d.getFullYear() +" "+ d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds() + "</td>"))
					    .append($("<tr/>").append("<td>Threshold</td><td>" + self.mastresult.data.mt + "</td>"))
						.append($("<tr/>").append("<td>Number of hits</td><td>" + self.mastresult.data.hits.length + "</td>"))
					));

                            					self.$elem.append($("<span />").append("<br><button class='btn btn-default'>Show MAST run parameters</button>")
	                	.on("click", 
	                    	function(event) {
								self.trigger("showMastRunParameters", { mastresult: self.mastresult, event: event });
	                    })
	                );

			        self.$elem.append("<h3>View hits</h3>");
					self.$elem.append($("<button class='btn btn-default'>Show hit list</button>")
	                	.on("click", 
	                    	function(event) {
								self.trigger("showMastHits", { mastresult: self.mastresult, event: event });
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
                type: "MastRunResult",
                id: this.options.id,
                workspace: this.options.ws,
                auth: this.options.auth,
                userId: this.options.userId,
                title: "MAST Run Result Overview"
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
