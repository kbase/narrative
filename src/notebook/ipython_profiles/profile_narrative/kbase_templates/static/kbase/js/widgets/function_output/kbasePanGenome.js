/**
 *  widget to display a pangenome object
 * 
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbasePanGenome",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
        	ws: null,
        	name: null,
            loadingImage: "static/kbase/images/ajax-loader.gif"
        },

        pref: null,
        wsUrl: "https://kbase.us/services/ws/",  //"http://dev04.berkeley.kbase.us:7058",
        token: null,
        kbws: null,
        geneIndex: {}, // {genome_ref -> {feature_id -> feature_index}}
        genomeNames: {}, // {genome_ref -> genome_name}
        loaded: false,
        	
        init: function(options) {
            this._super(options);
            this.pref = this.genUUID();
            var auth = this.authToken();
            if (auth)
            	this.token = auth;
        	var container = this.$elem;
        	container.empty();
        	container.append("<div><img src=\""+this.options.loadingImage+"\">&nbsp;&nbsp;loading pan-genome data...</div>");
            this.render();
            return this;
        },

        render: function() {
        	var self = this;
        	var ws = this.options.ws;
        	var name = this.options.name;            

        	var container = this.$elem;

        	if (this.token == null) {
            	container.empty();
        		container.append("<div>[Error] You're not logged in</div>");
        		return;
        	}

        	this.kbws = new Workspace(self.wsUrl, {'token': self.token});

        	var prom = this.kbws.get_objects([{workspace:ws, name: name}])
        	$.when(prom).done(function(data) {
        		if (self.loaded)
        			return;
        		self.loaded = true;
        		container.empty();
        		var data = data[0].data;
        		buildTable(data)
        	}).fail(function(e){
        		container.empty();
        		container.append('<div class="alert alert-danger">'+
        				e.error.message+'</div>');
        	});

        	function buildTable(data) {
        		//console.log(data);

        		self.cacheGeneFunctions(data.genome_refs);

        		var table = $('<table cellpadding="0" cellspacing="0" border="0" class="table table-bordered ' +
        				'table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">');
        		var tabs = container.kbTabs({tabs: [{name: 'Orthologs', content: table, active: true}]});

        		var tableSettings = {
        				"sPaginationType": "full_numbers",
        				"iDisplayLength": 10,
        				"aaData": data.orthologs,
        				"aaSorting": [[ 3, "desc" ]],
        				"aoColumns": [
        				              { "sTitle": "Function", 'mData': 'function'},
        				              { "sTitle": "ID", 'mData': 'id'}, //"sWidth": "10%"
        				              { "sTitle": "Type", 'mData': 'type'},
        				              { "sTitle": "Ortholog Count", 'mData': function(d) {
        				            	  return '<a class="show-orthologs" data-id="'+d.id+'">'
        				            	  +d.orthologs.length+'</a>'
        				              }
        				              }
        				              ],
        				              "oLanguage": {
        				            	  "sEmptyTable": "No objects in workspace",
        				            	  "sSearch": "Search: "
        				              },
        				              'fnDrawCallback': events
        		}


        		// create the table
        		table.dataTable(tableSettings);

        		function events() {
        			// event for clicking on ortholog count
        			$('.show-orthologs').unbind('click');
        			$('.show-orthologs').click(function() {
        				var id = $(this).data('id');
        				var info = 'blah blah';
        				var ortholog = getOrthologInfo(id);
        				var tabContent = self.buildOrthoTable(ortholog);
        				tabs.addTab({name: id, content: tabContent, removable: true});
        			})
        		}

        		// work in progress
        		function getOrthologInfo(id) {
        			//console.log(data)
        			for (var i in data.orthologs) {
        				if (data.orthologs[i].id == id) {
        					//console.log('match');
        					var ort_list = data.orthologs[i];
        					//console.log(ort_list);
        					return ort_list;
        				}
        			}
        		}
        	}

        	return this;
        },

        cacheGeneFunctions: function(genomeRefs) {
        	var self = this;
        	var req = [];
        	for (var i in genomeRefs) {
        		req.push({ref: genomeRefs[i], included: ["scientific_name", "features/[*]/id"]});
        	}
        	var prom = this.kbws.get_object_subset(req);
        	$.when(prom).done(function(data) {
        		//var data = data[0].data;
        		//console.log(data);
        		for (var genomePos in genomeRefs) {
        			var ref = genomeRefs[genomePos];
        			self.genomeNames[ref] = data[genomePos].data.scientific_name;
        			var geneIdToIndex = {};
        			for (var genePos in data[genomePos].data.features) {
        				var geneId = data[genomePos].data.features[genePos].id;
        				geneIdToIndex[geneId] = genePos;
        			}
        			self.geneIndex[ref] = geneIdToIndex;
        		}
        	}).fail(function(e){
        		console.log("Error caching genes: " + e.error.message);
        	});
        },

        buildOrthoTable: function(ortholog) {
        	console.log(ortholog);
        	var self = this;
        	var tab = $("<div><img src=\""+this.options.loadingImage+"\">&nbsp;&nbsp;loading pan-genome data...</div>");
        	var req = [];
        	for (var i in ortholog.orthologs) {
        		var genomeRef = ortholog.orthologs[i][2];
        		var featureId = ortholog.orthologs[i][0];
        		var featurePos = self.geneIndex[genomeRef][featureId];
        		req.push({ref: genomeRef, included: ["features/" + featurePos]});
        	}
        	var prom = this.kbws.get_object_subset(req);
        	$.when(prom).done(function(data) {
        		console.log(data);
        		buildOrthoTableLoaded(data, tab);
        	}).fail(function(e){
        		console.log("Error caching genes: " + e.error.message);
        	});
        	return tab;
        },

        buildOrthoTableLoaded: function(genes, tab) {

    		var table = $('<table cellpadding="0" cellspacing="0" border="0" class="table table-bordered ' +
    				'table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">');
    		tab.append(table);
        	var tableSettings = {
        			"sPaginationType": "bootstrap",
        			"iDisplayLength": 10,
        			"aaData": data.orthologs,
        			"aaSorting": [[ 3, "desc" ]],
        			"aoColumns": [
        			              { "sTitle": "Function", 'mData': 'function'},
        			              { "sTitle": "ID", 'mData': 'id'}, //"sWidth": "10%"
        			              { "sTitle": "Type", 'mData': 'type'},
        			              { "sTitle": "Ortholog Count", 'mData': function(d) {
        			            	  return '<a class="show-orthologs" data-id="'+d.id+'">'
        			            	  +d.orthologs.length+'</a>'
        			              },
        			              },
        			              ],
        			              "oLanguage": {
        			            	  "sEmptyTable": "No objects in workspace",
        			            	  "sSearch": "Search: "
        			              },
        			              'fnDrawCallback': events
        	}


        	// create the table
        	table.dataTable(tableSettings);

        	function events() {
        		// event for clicking on ortholog count
        		$('.show-orthologs').unbind('click');
        		$('.show-orthologs').click(function() {
        			var id = $(this).data('id');
        			var info = 'blah blah';
        			tabs.addTab({name: id, content: 'Coming soon', removable: true});
        		})
        	}

        	// work in progress
        	function getOrthologInfo(id) {
        		console.log(data)
        		for (var i in data) {
        			if (data[i].id == id) {
        				console.log('match')

        				var ort_list = data.orthologs
        				return ort_list
        			}
        		}
        	}
        },

        getData: function() {
        	return {title:"Pan-genome orthologs",id:this.options.name, workspace:this.options.ws};
        },

        loggedInCallback: function(event, auth) {
        	this.token = auth.token;
        	this.render();
        	return this;
        },

        loggedOutCallback: function(event, auth) {
        	this.token = null;
        	this.render();
        	return this;
        },
        
        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }

    });

})( jQuery );