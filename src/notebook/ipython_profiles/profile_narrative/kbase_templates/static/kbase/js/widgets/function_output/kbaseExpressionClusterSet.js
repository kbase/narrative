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
		name: 'kbaseExpressionClusterSet',
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
			this.loadAndrender();           
		   
			return this;
		},

		loggedOutCallback: function(event, auth) {
			this.ws = null;
			this.isLoggedIn = false;
			return this;
		},

		loadAndrender: function(){

			var self = this;

			self.loading(true);

			var kbws = this.ws;
			var clusterSetRef = self.buildObjectIdentity(this.options.workspaceID, this.options.clusterSetID);

			console.log("kbws.get_objects([clusterSetRef]", clusterSetRef);
			kbws.get_objects([clusterSetRef], 
				function(data) {
					self.clusterSet = data[0].data;
					self.expMatrixRef = self.clusterSet.original_data;

					console.log("kbws.get_object_subset", self.expMatrixRef);

					kbws.get_object_subset([					
							{ 'ref':self.expMatrixRef, 'included':['/genome_ref'] },
							{ 'ref':self.expMatrixRef, 'included':['/data/row_ids'] },
							{ 'ref':self.expMatrixRef, 'included':['/data/col_ids'] }
						], 
						function(data) {
							self.genomeRef = data[0].data.genome_ref;
							self.matrixRowIds = data[1].data.data.row_ids;
							self.matrixColIds = data[2].data.data.col_ids;	

							console.log("kbws.get_object_subset", self.genomeRef);
							kbws.get_object_subset([
									{ 'ref':self.genomeRef, 'included':['/id'] },
									{ 'ref':self.genomeRef, 'included':['/scientific_name'] },
									{ 'ref':self.genomeRef, 'included':['/features'] }								
								], 
								function(data){									
									self.genomeID = data[0].data.id;
									self.genomeName = data[1].data.scientific_name;
									self.features = data[2].data.features;

									// Now we are ready to visualize it
									self.render();
								}, 
								function(error){
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
            var container = this.$elem;
			var pref = this.uuid();
			self.pref = pref;
			//console.log("self.pref = ", self.pref);


			self.loading(false);

			///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
			container.empty();
			var tabPane = $('<div id="'+pref+'tab-content">');
			container.append(tabPane);

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

			var tableClusters = $('<table id="'+pref+'clusters-table" \
				class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
				</table>')
			.appendTo($tabClusters)
			.dataTable( {
			   "sDom": 'lftip',
				"aaData": self.buildClustersTableData(),
				 "aoColumns": [
				//     {
				//         width: "1em",
				//         sortable: false,    
				//         title: '<input type="checkbox" id="'+pref+'conditions_check_all"/>',
				//         data: null,
				//         render: function ( data, type, row ) {
				//             return '<input type="checkbox" class="'+pref+'conditions_checkbox"/>';
				//         }
				//     }, 
					{ sTitle: "Cluster", mData:"clusterId" },
					{ sTitle: "Number of genes", mData:"size" },
					{ sTitle: "Mean correlation", mData:"meancor" },
				]
			} );
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
					meancor : feature_clusters[i].meancor
				})
			}

			return tableData;
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

		getData: function() {
			return {
				type: 'ExpressionMatrix',
				id: this.options.expressionMatrixID,
				workspace: this.options.workspaceID,
				title: 'Expression Matrix'
			};
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