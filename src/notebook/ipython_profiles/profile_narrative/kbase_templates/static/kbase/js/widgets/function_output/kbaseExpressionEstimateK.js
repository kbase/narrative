/**
 * Output widget to vizualize ExpressionMatrix object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define(['jquery', 
		'kbwidget', 
		'kbaseAuthenticatedWidget', 
        'kbaseLinechart'
		], function($) {
	$.KBWidget({
		name: 'kbaseExpressionEstimateK',
		parent: 'kbaseAuthenticatedWidget',
		version: '1.0.0',
		options: {
			estimateKResultID: null,
			workspaceID: null,
			workspaceURL: window.kbconfig.urls.workspace,
			loadingImage: "static/kbase/images/ajax-loader.gif",
		},
        data : null,

		init: function(options) {
			this._super(options);
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);		

			return this;
		},

		loggedInCallback: function(event, auth) {


			// Create a new workspace client
			this.ws = new Workspace(this.options.workspaceURL, auth);
		   
			// Let's go...
			this.loadAndRender();           
		   
			return this;
		},

        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            return this;
        },



        loadAndRender: function(){
            var self = this;
            self.loading(true);
            var ref = self.buildObjectIdentity(this.options.workspaceID, this.options.estimateKResultID);

            self.ws.get_objects(
                [ref],
                function(data){
                    self.data = data[0].data;
                    console.log("data", self.data);
                    self.render();
                    self.loading(false);
                },
                function(error){
                    self.clientError(error);
                }
            );
        },

		render: function(){
            var data = this.data;

            $("<div/>").html('Estimated K = ' + data.best_k).appendTo(this.$elem);

            var $kDistributionDiv = $("<div/>");
            this.$elem.append($kDistributionDiv);
            this.buildKDistributionPlot($kDistributionDiv);
		},
        
        buildKDistributionPlot: function($containerDiv){
            var data = this.data;
            var values = [];
            for(var i = 0; i < data.estimate_cluster_sizes.length; i++){
                var val = data.estimate_cluster_sizes[i];
                values.push({
                    x : val[0],
                    y : val[1]
                });
            }
            
            $lineChartDiv = $("<div style = 'width : 500px; height : 300px'></div>");
            $containerDiv.append($lineChartDiv);
            $lineChartDiv.kbaseLinechart(
                {
                    scaleAxes       : true,

                    // xLabel      : 'Some useful experiment',
                    // yLabel      : 'Meaningful data',

                    dataset : [
                        {
                            color : 'green',
                            label : 'Silhouette',
                            values : values,
                        }
                    ],
                }
            );              
        },        

		loading: function(isLoading) {
			if (isLoading)
				this.showMessage("<img src='" + this.options.loadingImage + "'/>");
			else
				this.hideMessage();                
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

		clientError: function(error){
			this.loading(false);
			this.showMessage(error.error.error);
		}        

	});
});