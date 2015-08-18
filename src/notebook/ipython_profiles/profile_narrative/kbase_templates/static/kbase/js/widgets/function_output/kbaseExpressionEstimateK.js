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

            $("<div>").html('Estimated K (based on highest quality score) = ' + data.best_k).appendTo(this.$elem);

            var $kDistributionDiv = $("<div>");
            this.$elem.append($kDistributionDiv);
            this.buildKDistributionPlot($kDistributionDiv);

            var $help = $('<div>').append(
                "The quality of the cluster results for a value of <i>k</i> can be approximated by the Average Silhouette Score." +
                "  Silhouette scores/coeffecients are calculated for each point over a range of [-1,1].  Values near 1 indicate the" +
                " point is far away from neighboring clusters.  Values near 0 indicate that the point is near the boundry of " +
                "a neighboring cluster. Values less than 0 indicate that the point is probably misclassified."
            );

            this.$elem.append($help);
            this.$elem.append($('<div style="width : 5px; height : 5px">'));
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
            
            $lineChartDiv = $("<div style = 'width : 500px; height : 300px'>");
            $containerDiv.append($lineChartDiv);
            $lineChartDiv.kbaseLinechart(
                {
                    scaleAxes       : true,

                    xLabel      : 'Values of K',
                    yLabel      : 'Estimated Quality (Avg. Silhoette score)',

                    xLabelRegion : 'yPadding',
                    yLabelRegion : 'xPadding',
                    xAxisColor : '#444',
                    yAxisColor : '#444',
                    xPadding : 80,
                    yPadding : 60,

                    overColor : null,

                    dataset : [
                        {
                            strokeColor : 'blue',
                            values : values,
                            width: 1
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