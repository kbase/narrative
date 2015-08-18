/**
 * Output widget to vizualize ClusterSet object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define(['jquery', 
		'kbwidget', 
		'kbaseAuthenticatedWidget', 
		'kbaseTabs',
		'jquery-dataTables',
		'jquery-dataTables-bootstrap'
//        ,'jquery-dataScroller'
		], function($) {
	$.KBWidget({
		name: 'kbaseExpressionFeatureClusters',
		parent: 'kbaseAuthenticatedWidget',
		version: '1.0.0',
		options: {
			clusterSetID: null,
			workspaceID: null,
			workspaceURL: window.kbconfig.urls.workspace,
			loadingImage: "static/kbase/images/ajax-loader.gif",
		},

		// Extracted data for vizualization
		clusterSet: null,
		expMatrixRef: null,
		expMatrixName: null,
		genomeRef: null,
		matrixRowIds: null,
		matrixColIds: null,
		genomeID: null,
		genomeName: null,
		features: null,
					
		init: function(options) {
			this._super(options);
			// Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);		
			return this;
		},

		loggedInCallback: function(event, auth) {

			
			// error if not properly initialized
			if (this.options.clusterSetID == null) {
				this.showMessage("[Error] Couldn't retrieve cluster set");
				return this;
			}

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

			var kbws = this.ws;
			var clusterSetRef = self.buildObjectIdentity(this.options.workspaceID, this.options.clusterSetID);

			kbws.get_objects([clusterSetRef], 
				function(data) {
					self.clusterSet = data[0].data;
					self.expMatrixRef = self.clusterSet.original_data;

					console.log("expMatrixRef", self.expMatrixRef);

					kbws.get_object_subset([					
							{ 'ref':self.expMatrixRef, 'included':['/genome_ref'] },
							{ 'ref':self.expMatrixRef, 'included':['/data/row_ids'] },
							{ 'ref':self.expMatrixRef, 'included':['/data/col_ids'] }
						], 
						function(data) {
							self.genomeRef = data[0].data.genome_ref;
							self.matrixRowIds = data[1].data.data.row_ids;
							self.matrixColIds = data[2].data.data.col_ids;	

							console.log("genomeRef", self.genomeRef);
							var jobGetGenomeData = kbws.get_object_subset([
									{ 'ref':self.genomeRef, 'included':['/id'] },
									{ 'ref':self.genomeRef, 'included':['/scientific_name'] },
									{ 'ref':self.genomeRef, 'included':['/features'] }								
								], 
								function(data){									
									self.genomeID = data[0].data.id;
									self.genomeName = data[1].data.scientific_name;
									self.features = data[2].data.features;
									console.log("genomeName", self.genomeName);
								}, 
								function(error){
									self.clientError(error);
								}
							);

							var jobGetMatrixName = kbws.get_object_info_new({
									'objects' : [{'ref' : self.expMatrixRef}],
									'includeMetadata' :0
								},
								function(data){
									self.expMatrixName = data[0][1];
									console.log("expMatrixName", self.expMatrixName);
								}
							);

							// Wait until all  jobs are done
							$.when.apply($, [jobGetMatrixName, jobGetGenomeData]).done( 
								function(){
									// Now we are ready to visualize it
									self.render();
								}
							);							

						}, 
						function(error){
							self.clientError(error);
						}
					);
				}, function(error){
					self.clientError(error);
				}
			);	
		},

		render: function(){
			var self = this;
            var $container = this.$elem;
			var pref = this.uuid();
			self.pref = pref;


			self.loading(false);

			///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
			$container.empty();
			var tabPane = $('<div id="'+pref+'tab-content">');
			$container.append(tabPane);

			tabPane.kbaseTabs({canDelete : true, tabs : []});                    
			///////////////////////////////////// Overview table ////////////////////////////////////////////           
			var tabOverview = $("<div/>");
			tabPane.kbaseTabs('addTab', {tab: 'Overview', content: tabOverview, canDelete : false, show: true});
			var tableOver = $('<table class="table table-striped table-bordered" '+
				'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+pref+'overview-table"/>');
			tabOverview.append(tableOver);
			tableOver
				.append( self.makeRow( 
					'Feature clusters', 
					self.clusterSet.feature_clusters.length ) ) 
				// .append( self.makeRow( 
				// 	'Condition clusters', 
				// 	self.clusterSet.condition_clusters.length ) )
				.append( self.makeRow( 
					'Genome', 
					$('<span />').append(self.genomeName).css('font-style', 'italic') ) )
				.append( self.makeRow( 
					'Source matrix: #conditions', 
					self.matrixColIds.length ) )
				.append( self.makeRow( 
					'Source matrix: #genes', 
					self.matrixRowIds.length ) )
				;

			///////////////////////////////////// Clusters tab ////////////////////////////////////////////          

			var $tabClusters = $("<div/>");
			tabPane.kbaseTabs('addTab', {tab: 'Clusters', content: $tabClusters, canDelete : false, show: false});

			///////////////////////////////////// Clusters table ////////////////////////////////////////////          

			self.buildActionMenu($container);
			$(document).mousedown( function(e){
				// Hide menu on mousedown only if we are not inside the menu
				if(e.toElement.getAttribute('methodInput') == null){
					self.$menu.hide();
				}
			});			

			var tableClusters = $('<table id="'+pref+'clusters-table" \
				class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
				</table>')
			.appendTo($tabClusters)
			.dataTable( {
			   "sDom": 'lftip',
				"aaData": self.buildClustersTableData(),
				 "aoColumns": [
					{ sTitle: "Cluster", mData:"clusterId" },
					{ sTitle: "Number of genes", mData:"size" },
					{ sTitle: "Mean correlation", mData:"meancor" },
                    { sTitle: "", mData: "rowIndex",
                        mRender: function ( rowIndex ) {
                        	return '<button class="btn btn-default ' + pref + 'action_button" rowIndex="' + rowIndex +'" >Action  <span class="caret"></span></button>';
                        }
                    }
				],
				"fnDrawCallback" :function(){
					// It should be done here because otherwise initially hidden buttons will not work
					self.registerActionButtonClick();
				}
			} );
		},

		registerActionButtonClick : function(){
			var self = this;
			var pref = self.pref;
			$('.' + pref + 'action_button').on('click', function(e){
				var $actionButton = $(e.toElement);
				var x = $actionButton.offset().left - $('#notebook-container').offset().left + e.toElement.offsetLeft;
				var y = $actionButton.offset().top - $('#notebook-container').offset().top + e.toElement.offsetHeight + e.toElement.offsetTop;				
				self.$menu
                    .data("invokedOn", $(e.target))
                    .css({
                        position: "absolute",                        
                        left: x,
                        top: y
                    })
                    .show()
                    .off('click')
                    .on('click', 'a', function (e) {
                        self.$menu.hide();
                
                        var $invokedOn = self.$menu.data("invokedOn");
                        var $selectedMenu = $(e.target);
                        var rowIndex = $invokedOn[0].getAttribute('rowIndex');
                        var methodInput = $selectedMenu[0].getAttribute('methodInput');

                        var geneIds = self.getClusterGeneIds(rowIndex);

						IPython.narrative.createAndRunMethod(methodInput, 
							{
								'input_expression_matrix':self.expMatrixName, 
								'input_gene_ids': geneIds.join(",")
							}
						);
                    });                
			});
		},

		getClusterGeneIds: function(rowIndex){
			var geneIds = [];
			for(var geneId in this.clusterSet.feature_clusters[rowIndex].id_to_pos){
				geneIds.push(geneId);
			}
			return geneIds;
		},

        getMenuPosition: function(mouse, direction, scrollDir) {
        	var self = this;

            var win = $(window)[direction](),
                scroll = $(window)[scrollDir](),
                menu = $(settings.menuSelector)[direction](),
                position = mouse + scroll;
                        
            // opening menu would pass the side of the page
            if (mouse + menu > win && menu < mouse) 
                position -= menu;
            
            return position;
        },

		buildClustersTableData: function(){
			var self = this;
			// var row_ids = self.expressionMatrix.data.row_ids;
			// var col_ids = self.expressionMatrix.data.col_ids;
			console.log('clusterSet',self.clusterSet);
			var feature_clusters  = self.clusterSet.feature_clusters;

			var tableData = [];

			for(var i = 0; i < feature_clusters.length; i++){
				tableData.push({
					clusterId: "cluster_" + i,
					size: Object.keys(feature_clusters[i].id_to_pos).length,
					meancor : feature_clusters[i].meancor.toFixed(2),
					rowIndex : i
				})
			}

			return tableData;
		},

	
		buildActionMenu: function($container){
			var $menu = $(' \
				<ul id="contextMenu" class="dropdown-menu" role="menu" style="display:none" > \
				    <li><a tabindex="-1" href="#" methodInput="view_expression_profile">View expression profile</a></li> \
				    <li><a tabindex="-1" href="#" methodInput="view_expression_pairwise_correlation">Show pairwise correltaion</a></li> \
				    <li><a tabindex="-1" href="#" methodInput="view_expression_heatmap">Browse conditions</a></li> \
				</ul> \
			');

				    // <li class="divider"></li> \
				    // <li><a tabindex="-1" href="#" methodInput="build_feature_set">Create a FeatureSet</a></li> \

			$container.append($menu);	
			this.$menu = $menu;
		},

		buildFeatureId2FeatureHash: function(){
			var self = this;
			var features = self.features;
			var id2features = {};
			for(var i in features){
				id2features[features[i].id] = features[i];
			}
			return id2features;
		},

		makeRow: function(name, value) {
			var $row = $("<tr/>")
					   .append($("<th />").css('width','20%').append(name))
					   .append($("<td />").append(value));
			return $row;
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