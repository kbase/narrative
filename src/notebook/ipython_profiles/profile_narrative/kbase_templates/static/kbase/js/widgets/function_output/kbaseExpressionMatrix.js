/**
 * Output widget to vizualize ExpressionMatrix object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define(['jquery', 
		'kbwidget', 
		'kbaseAuthenticatedWidget', 
		'kbaseTabs',
		'jquery-dataTables',
		'jquery-dataTables-bootstrap',
		'kbaseFeatureValues-client-api'
//        ,'jquery-dataScroller'
		], function($) {
	$.KBWidget({
		name: 'kbaseExpressionMatrix',
		parent: 'kbaseAuthenticatedWidget',
		version: '1.0.2',
		options: {
			expressionMatrixID: null,
			workspaceID: null,

            // Service URL: should be in window.kbconfig.urls.
            // featureValueURL: 'http://localhost:8889',
            featureValueURL: 'https://ci.kbase.us/services/feature_values/jsonrpc',

			loadingImage: "static/kbase/images/ajax-loader.gif"
		},

		// Prefix for all div ids
		pref: null,

		// KBaseFeatureValue client
		featureValueClient: null,

		// Matrix data to be visualized
		matrixStat: null,

		init: function(options) {
			this._super(options);
			this.pref = this.uuid();

			// Create a message pane
			this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
			this.$elem.append(this.$messagePane);    

			return this;
		},

		loggedInCallback: function(event, auth) {

			// error if not properly initialized
			if (this.options.expressionMatrixID == null) {
				this.showMessage("[Error] Couldn't retrieve expression matrix.");
				return this;
			}

           // Build a client
            this.featureValueClient = new KBaseFeatureValues(this.options.featureValueURL, auth);           
		   
			// Let's go...
			this.loadAndRender();           
		   
			return this;
		},

		loggedOutCallback: function(event, auth) {
			this.isLoggedIn = false;
			return this;
		},

		loadAndRender: function(){
			var self = this;

			self.loading(true);
			var expressionMatrixRef = this.options.workspaceID + "/" + this.options.expressionMatrixID;
			self.featureValueClient.get_matrix_stat({input_data: expressionMatrixRef},
				function(data){
					// console.log(data);
					self.matrixStat = data;
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
			var pref = this.pref;
			var container = this.$elem;
			var matrixStat = this.matrixStat;

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
					'Genome', 
					$('<span />').append(matrixStat.mtx_descriptor.genome_name).css('font-style', 'italic') ) )
				.append( self.makeRow( 
					'Description', 
					matrixStat.mtx_descriptor.description ) )
				.append( self.makeRow( 
					'# Conditions', 
					matrixStat.mtx_descriptor.columns_count ) )
				.append( self.makeRow( 
					'# Features', 
					matrixStat.mtx_descriptor.rows_count ) )
				.append( self.makeRow( 
					'Scale', 
					matrixStat.mtx_descriptor.scale ) )
				.append( self.makeRow( 
					'Value type', 
					matrixStat.mtx_descriptor.type) )
				.append( self.makeRow( 
					'Row normalization', 
					matrixStat.mtx_descriptor.row_normalization) )
				.append( self.makeRow( 
					'Column normalization', 
					matrixStat.mtx_descriptor.col_normalization) );

			/////////////////////////////////// Conditions tab ////////////////////////////////////////////          

			var $tabConditions = $("<div/>");
			tabPane.kbaseTabs('addTab', {tab: 'Conditions', content: $tabConditions, canDelete : false, show: false});

			///////////////////////////////////// Conditions table ////////////////////////////////////////////  

			$tabConditions.append(
                $('<div style="font-size: 1.2em; width:100%; text-align: center;">Browse Conditions</div>')
            );
            $tabConditions.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">Statistics calculated across all features in a condition</div>')
            );


			var tableConditions = $('<table id="'+pref+'conditions-table" \
				class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
				</table>')
				.appendTo($tabConditions)
				.dataTable( {
				   "sDom": 'lftip',
					"aaData": self.buildConditionsTableData(),
					"aoColumns": [
						{ sTitle: "Condition ID", mData:"name" },
						{ sTitle: "Min", mData:"min" },
						{ sTitle: "Max", mData:"max" },
						{ sTitle: "Average", mData:"avg" },
						{ sTitle: "Std. Dev.", mData:"std"},
						{ sTitle: "Missing Values?",  mData:"missing_values" }
					]
				} );

			///////////////////////////////////// Genes tab ////////////////////////////////////////////          
			var $tabGenes = $("<div/>");
			tabPane.kbaseTabs('addTab', {tab: 'Genes', content: $tabGenes, canDelete : false, show: false});

			///////////////////////////////////// Genes table ////////////////////////////////////////////          

			$tabGenes.append(
                $('<div style="font-size: 1.2em; width:100%; text-align: center;">Browse Features</div>')
            );
            $tabGenes.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">Statistics calculated across all conditions for the feature</div>')
            );

			var tableGenes = $('<table id="'+pref+'genes-table" \
				class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
				</table>')
				.appendTo($tabGenes)
				.dataTable( {
				   "sDom": 'lftip',
					"aaData": self.buildGenesTableData(),
					"aoColumns": [
						{ sTitle: "Feature ID", mData: "id"},
						{ sTitle: "Function", mData: "function"},
						{ sTitle: "Min", mData:"min" },
						{ sTitle: "Max", mData:"max" },  
						{ sTitle: "Avgerage", mData:"avg" },                                                      
						{ sTitle: "Std. Dev.", mData:"std"},
						{ sTitle: "Missing Values?", mData:"missing_values" }
					]
				} );
		},

		buildConditionsTableData: function(){
			var matrixStat = this.matrixStat;
			var tableData = [];
			for(var i = 0; i < matrixStat.column_descriptors.length; i++){
				var desc = matrixStat.column_descriptors[i];
				var stat = matrixStat.column_stats[i];
				tableData.push(
					{
						'index': desc.index,
						'id': desc.id,
						'name': desc.name,
						'min': stat.min === null? ' ' : stat.min.toFixed(2),
						'max': stat.max === null? ' ' : stat.max.toFixed(2),
						'avg': stat.avg === null? ' ' : stat.avg.toFixed(2),
						'std': stat.std === null? ' ' : stat.std.toFixed(2),
						'missing_values': stat.missing_values ? 'Yes' : 'No'
					}
				);
			}
			return tableData;
		},

		buildGenesTableData: function(){
			var matrixStat = this.matrixStat;
			var tableData = [];

			for(var i = 0; i < matrixStat.row_descriptors.length; i++){
				var desc = matrixStat.row_descriptors[i];
				var stat = matrixStat.row_stats[i];

				var gene_function = desc.properties['function'];
				tableData.push(
					{
						'index': desc.index,
						'id': desc.id,
						'name': desc.name,
						'function' : gene_function ? gene_function : ' ',
						'min': stat.min === null? ' ' : stat.min.toFixed(2),
						'max': stat.max === null? ' ' : stat.max.toFixed(2),
						'avg': stat.avg === null? ' ' : stat.avg.toFixed(2),
						'std': stat.std === null? ' ' : stat.std.toFixed(2),
						'missing_values': stat.missing_values ? 'Yes' : 'No'
					}
				);
			}
			return tableData;
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