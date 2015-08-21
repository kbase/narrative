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
			avgWindow: null,
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
                    self.render();
                    self.loading(false);
                },
                function(error){
                    self.clientError(error);
                }
            );
        },

		render: function(){
		    var self = this;
            var data = this.data;

            $("<div>").html('Estimated K (based on highest quality score) = ' + data.best_k).appendTo(this.$elem);
            var $kDistributionDiv = $("<div>");
            
            var $textField = $("<input type='text' size='6'/>");
            var $sliderButton = $('<button class="btn btn-default">Refresh</button>')
            var $sliderDiv = $("<div/>");
            $sliderDiv.append('<br>Moving Average Window Size:&nbsp;&nbsp;');
            $sliderDiv.append($textField);
            $sliderDiv.append('&nbsp;&nbsp;');
            $sliderDiv.append($sliderButton);
            this.$elem.append($sliderDiv);
            $sliderButton.click(function() {
                var avgWindow = parseInt($textField.val());
                if (!avgWindow)
                    avgWindow = null;
                if(avgWindow<0)
                    avgWindow = null;
                if(avgWindow === null)
                    $textField.val('');
                self.options.avgWindow = avgWindow;
                self.buildKDistributionPlot($kDistributionDiv);
            }); 
            $textField.keyup(function(event) {
                if(event.keyCode == 13) {
                    $sliderButton.click();
                }
            });
            if (self.options.avgWindow)
                $textField.val(self.options.avgWindow);
            
            this.$elem.append($kDistributionDiv);
            this.buildKDistributionPlot($kDistributionDiv);

            var $help = $('<div>').append(
                "The quality of a K-means clustering result for a specific value of <i>k</i> "+
                "can be approximated by the Average Silhouette Width. Silhouette Width "+
                "is calculated for each point and results in a value in the range " +
                "[-1,1]. Values near 1 indicate the point is far away from neighboring " +
                "clusters. Values near 0 indicate that the point lies between two " +
                "clusters. Values less than 0 indicate that the point is probably in " +
                "the wrong cluster.  The Moving Average window size can be set to smooth " +
                "the curve by averaging each Silhoutte Width value with nearby values."
            );

            this.$elem.append($help);
            this.$elem.append($('<div style="width : 5px; height : 5px">'));
		},
        
        buildKDistributionPlot: function($containerDiv){
            $containerDiv.empty();
            var avgWindow = this.options.avgWindow;
            var data = this.data;
            var values = [];
            for(var i = 0; i < data.estimate_cluster_sizes.length; i++){
                var val = data.estimate_cluster_sizes[i];
                var valY = val[1];
                if (avgWindow) {
                    valY = 0;
                    var minPos = Math.max(0, i - Math.round(avgWindow / 2 - 0.5));
                    var maxPos = Math.min(data.estimate_cluster_sizes.length, minPos + avgWindow);
                    for (var pos = minPos; pos < maxPos; pos++)
                        valY += data.estimate_cluster_sizes[pos][1];
                    valY /= (maxPos - minPos);
                }
                values.push({
                    x : val[0],
                    y : valY
                });
            }
            
            $lineChartDiv = $("<div style = 'width : 500px; height : 300px'>");
            $containerDiv.append($lineChartDiv);
            $lineChartDiv.kbaseLinechart(
                {
                    scaleAxes       : true,

                    xLabel      : 'Values of K',
                    yLabel      : 'Estimated Quality (Avg. Silhoette Width)',

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