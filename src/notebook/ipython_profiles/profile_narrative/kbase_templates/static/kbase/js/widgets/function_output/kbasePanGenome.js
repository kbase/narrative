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
            loadingImage: "static/kbase/images/ajax-loader.gif",
            withExport: false
        },

        pref: null,
        wsUrl: "https://kbase.us/services/ws/",  //"http://dev04.berkeley.kbase.us:7058",
        token: null,
        kbws: null,
        geneIndex: {},   // {genome_ref -> {feature_id -> feature_index}}
        genomeNames: {}, // {genome_ref -> genome_name}
        genomeRefs: {},  // {genome_ref -> workspace/genome_object_name}
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
        		var tab = $("<div/>");
        		if (self.options.withExport) {
        			tab.append("<p><b>Please choose ortholog and push 'Export' "+
        						"button on opened ortholog tab.</b></p><br>");
        		}
        		tab.append(table);
        		
        		var tabPane = $('<div id="'+self.pref+'tab-content">');
        		container.append(tabPane);
        		tabPane.kbaseTabs({canDelete : true, tabs : []});

        		//var tabs = container.kbTabs({tabs: [{name: 'Orthologs', content: tab, active: true}]});

    			tabPane.kbaseTabs('addTab', {tab: 'Orthologs', content: tab, canDelete : false, show: true});

        		var tableSettings = {
        				"sPaginationType": "full_numbers",
        				"iDisplayLength": 10,
        				"aaData": data.orthologs,
        				"aaSorting": [[ 3, "desc" ]],
        				"aoColumns": [
        				              { "sTitle": "Function", 'mData': 'function'},
        				              { "sTitle": "ID", 'mData': function(d) {
        				            	  return '<a class="show-orthologs_'+self.pref+'" data-id="'+d.id+'">'
        				            	  +d.id+'</a>'
        				              }},
        				              { "sTitle": "Type", 'mData': 'type'},
        				              { "sTitle": "Ortholog Count", 'mData': function(d) {
        				            	  return ''+d.orthologs.length
        				              }}
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
        			$('.show-orthologs_'+self.pref).unbind('click');
        			$('.show-orthologs_'+self.pref).click(function() {
        				var id = $(this).data('id');
            			if (tabPane.kbaseTabs('hasTab', id)) {
            				tabPane.kbaseTabs('showTab', id);
            				return;
            			}
        				var ortholog = getOrthologInfo(id);
        				var tabContent = self.buildOrthoTable(id, ortholog);
        				tabPane.kbaseTabs('addTab', {tab: id, content: tabContent, canDelete : true, show: true});
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
        			self.genomeRefs[ref] = data[genomePos].info[7] + "/" + data[genomePos].info[1];
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

        buildOrthoTable: function(orth_id, ortholog) {
        	var self = this;
        	var tab = $("<div><img src=\""+this.options.loadingImage+"\">&nbsp;&nbsp;loading gene data...</div>");
        	var req = [];
        	for (var i in ortholog.orthologs) {
        		var genomeRef = ortholog.orthologs[i][2];
        		var featureId = ortholog.orthologs[i][0];
        		var featurePos = self.geneIndex[genomeRef][featureId];
        		req.push({ref: genomeRef, included: ["features/" + featurePos]});
        	}
        	var prom = this.kbws.get_object_subset(req);
        	$.when(prom).done(function(data) {
        		var genes = [];
        		for (var i in data) {
        			var feature = data[i].data.features[0];
        			var genomeRef = req[i].ref;
        			feature["genome_ref"] = genomeRef;
        			var ref = self.genomeRefs[genomeRef];
        			var genome = self.genomeNames[genomeRef];
        			var id = feature.id;
        			var func = feature['function'];
        			if (!func)
        				func = '-';
        			var seq = feature.protein_translation;
        			var len = seq ? seq.length : 'no translation';
        			genes.push({ref: ref, genome: genome, id: id, func: func, len: len, original: feature});
        		}
        		self.buildOrthoTableLoaded(orth_id, genes, tab);
        	}).fail(function(e){
        		console.log("Error caching genes: " + e.error.message);
        	});
        	return tab;
        },

        buildOrthoTableLoaded: function(orth_id, genes, tab) {
        	var pref2 = this.genUUID();
        	var self = this;
        	tab.empty();
    		var table = $('<table cellpadding="0" cellspacing="0" border="0" class="table table-bordered ' +
    				'table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">');
    		if (self.options.withExport) {
    			tab.append('<p><b>Name of feature set object:</b>&nbsp;'+
    					'<input type="text" id="input_'+pref2+'" '+
    					'value="'+self.options.name+'.'+orth_id+'.featureset" style="width: 350px;"/>'+
    					'&nbsp;<button id="btn_'+pref2+'">Export</button><br>'+
    					'<font size="-1">(only features with protein translations will be exported)</font></p><br>'
    			);
    		}
    		tab.append(table);
        	var tableSettings = {
        			"sPaginationType": "full_numbers",
        			"iDisplayLength": 10,
        			"aaData": genes,
        			"aaSorting": [[ 1, "asc" ]],
        			"aoColumns": [
        			              { "sTitle": "Genome", 'mData': function(d) {
        			            	  return '<a class="show-genomes_'+pref2+'" data-id="'+d.ref+'">'+d.genome+'</a>'
        			              }},
        			              { "sTitle": "ID", 'mData': function(d) {
        			            	  return '<a class="show-genes_'+pref2+'" data-id="'+d.ref+"/"+d.id+'">'+d.id+'</a>'
        			              }},
        			              { "sTitle": "Function", 'mData': 'func'},
        			              { "sTitle": "Protein sequence length", 'mData': 'len'},
        			              ],
        			              "oLanguage": {
        			            	  "sEmptyTable": "No objects in workspace",
        			            	  "sSearch": "Search: "
        			              },
        			              'fnDrawCallback': events2
        	}

        	// create the table
        	table.dataTable(tableSettings);
    		if (self.options.withExport) {
    			$('#btn_'+pref2).click(function (e) {
    				var target_obj_name = $("#input_"+pref2).val();
    				if (target_obj_name.length == 0) {
    					alert("Error: feature set object name shouldn't be empty");
    					return;
    				}
    				self.exportFeatureSet(orth_id, target_obj_name, genes);
    			});
    		}        	
        	function events2() {
        		$('.show-genomes_'+pref2).unbind('click');
        		$('.show-genomes_'+pref2).click(function() {
        			var id = $(this).data('id');
            		var url = "/functional-site/#/genomes/" + id;
                    window.open(url, '_blank');
        		})
        		$('.show-genes_'+pref2).unbind('click');
        		$('.show-genes_'+pref2).click(function() {
        			var id = $(this).data('id');
            		var url = "/functional-site/#/genes/" + id;
                    window.open(url, '_blank');
        		})
        	}
        },

        exportFeatureSet: function(orth_id, target_obj_name, genes) {
        	var elements = {};
        	var size = 0;
        	for (var i in genes) {
        		var gene = genes[i];
        		if (gene.original.protein_translation) {
        			elements["" + i] = {data: gene.original};
        			size++;
        		}
        	}
        	var featureSet = {description: 'Feature set exported from pan-genome "' + 
        			this.options.name + '", otholog "' + orth_id + '"', elements: elements};
        	this.kbws.save_objects({workspace: this.options.ws, objects: 
        		[{type: "KBaseSearch.FeatureSet", name: target_obj_name, data: featureSet}]}, 
        		function(data) {
        			alert("Feature set object containing " + size + " genes " +
        					"was successfuly exported");
        		},
        		function(err) {
        			alert("Error: " + err.error.message);
        		}
        	);
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