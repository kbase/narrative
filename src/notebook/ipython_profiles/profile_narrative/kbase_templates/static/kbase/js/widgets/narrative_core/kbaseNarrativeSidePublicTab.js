/**
 * "Import" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeSidePublicTab",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
        	addToNarrativeButton: null,
        	selectedItems: null,
        	landing_page_url: "/functional-site/#/", // !! always include trailing slash
            default_landing_page_url: "/functional-site/#/ws/json/" // ws_name/obj_name,
        },
        token: null,
        wsName: null,
        searchUrlPrefix: 'https://kbase.us/services/search/getResults',
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: "https://kbase.us/services/ws/",
        wsClient: null,
        categories: ['genomes', 'metagenomes', 'media', 'plant_gnms'
                     /*'gwas_populations', 'gwas_population_kinships', 'gwas_population_variations', 
                     'gwas_top_variations', 'gwas_population_traits', 'gwas_gene_lists'*/ ],
        categoryDescr: {  // search API category -> {}
        	'genomes': {name:'Genomes',type:'KBaseGenomes.Genome',ws:'KBasePublicGenomesV4',search:true},
        	'metagenomes': {name: 'Metagenomes',type:'KBaseCommunities.Metagenome',ws:'KBasePublicMetagenomes',search:true},
        	'media': {name:'Media',type:'KBaseBiochem.Media',ws:'KBaseMedia',search:false},
        	'plant_gnms': {name:'Plant Genomes',type:'KBaseGenomes.Genome',ws:'PlantCSGenomes',search:false}
        	/*'gwas_populations': {name:'GWAS Populations',type:'KBaseGwasData.GwasPopulation',ws:'KBasePublicGwasDataV2',search:true},
        	'gwas_population_kinships': {name:'GWAS Population Kinships',type:'KBaseGwasData.GwasPopulationKinship',ws:'KBasePublicGwasDataV2',search:true},
        	'gwas_population_variations': {name:'GWAS Population Variations',type:'KBaseGwasData.GwasPopulationVariation',ws:'KBasePublicGwasDataV2',search:true},
        	'gwas_top_variations': {name:'GWAS Top Variations',type:'KBaseGwasData.GwasTopVariations',ws:'KBasePublicGwasDataV2',search:true},
        	'gwas_population_traits': {name:'GWAS Population Traits',type:'KBaseGwasData.GwasPopulationTrait',ws:'KBasePublicGwasDataV2',search:true},
        	'gwas_gene_lists': {name:'GWAS Gene Lists',type:'KBaseGwasData.GwasGeneList',ws:'KBasePublicGwasDataV2',search:true}*/
        },
        mainListPanelHeight: '430px',
        maxNameLength: 60,
        totalPanel: null,
        resultPanel: null,
        objectList: null,
        currentCategory: null,
        currentQuery: null,
        currentPage: null,
        totalResults: null,
        itemsPerPage: 20,
        
        init: function(options) {
            this._super(options);
            var self = this;
            $(document).on(
            		'setWorkspaceName.Narrative', $.proxy(function(e, info) {
                        //console.log('side panel import tab -- setting ws to ' + info.wsId);
                        self.wsName = info.wsId;
            		}, this)
            );
            return this;
        },
        
        render: function() {
        	var self = this;
        	
            this.wsClient = new Workspace(this.wsUrl, {'token': this.token});
            var mrg = {'margin': '10px 0px 10px 0px'};
            var typeInput = $('<select class="form-control kb-import-filter">').css(mrg);
            for (var catPos in self.categories) {
            	var cat = self.categories[catPos];
            	var catName = self.categoryDescr[cat].name;
                typeInput.append('<option value="'+cat+'">'+catName+'</option>');
            }
            var typeFilter = $('<div class="col-sm-3">').append(typeInput);
            var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Filter data">').css(mrg);
            typeInput.change(function() {
            	self.searchAndRender(typeInput.val(), filterInput.val());
            });
            filterInput.keyup(function(e) {
            	self.searchAndRender(typeInput.val(), filterInput.val());
            });

            var searchFilter = $('<div class="col-sm-9">').append(filterInput);
            
            var header = $('<div class="row">').css({'margin': '0px 10px 0px 10px'}).append(typeFilter).append(searchFilter);
            self.$elem.append(header);
            self.totalPanel = $('<div>').css({'margin': '0px 0px 0px 10px'});
            self.$elem.append(self.totalPanel);
            self.resultPanel = $('<div>')
            	.css({'overflow-x' : 'hidden', 'overflow-y':'auto', 'height':this.mainListPanelHeight })
            	.on('scroll', function() {
            		if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
            			self.renderMore();
            		}
            	});
            self.$elem.append(self.resultPanel);
			self.searchAndRender(typeInput.val(), filterInput.val());
            return this;
        },

        searchAndRender: function(category, query) {
        	var self = this;
        	if (query) {
        		query = query.trim();
        		if (query.length == 0) {
        			query = '*';
        		} else if (query.indexOf('"') < 0) {
        			var parts = query.split(/\s+/);
        			for (var i in parts)
        				if (parts[i].indexOf('*', parts[i].length - 1) < 0)
        					parts[i] = parts[i] + '*';
        			query = parts.join(' ');
        		}
        	} else {
        		query = '*';
        	}
        	if (self.currentQuery && self.currentQuery === query && category === self.currentCategory)
        		return;
        	//console.log("Sending query: " + query);
        	self.totalPanel.empty();
        	self.resultPanel.empty();
        	self.totalPanel.append($('<span>').addClass("kb-data-list-type").append('<img src="'+this.loadingImage+'"/> searching...'));
            self.objectList = [];
        	self.currentCategory = category;
        	self.currentQuery = query;
        	self.currentPage = 0;
        	self.totalResults = null;
        	self.renderMore();
        },
        
        renderMore: function() {
        	var self = this;
        	var cat = self.categoryDescr[self.currentCategory];
        	if (!cat.search) {
        		if (self.currentPage > 0)
        			return;
            	self.currentPage++;
            	var type = cat.type;
            	var ws = cat.ws;
            	self.wsClient.list_objects({workspaces: [ws], type: type, includeMetadata: 1}, function(data) {
            		//console.log(data);
            		var query = self.currentQuery.replace(/[\*]/g,' ').trim().toLowerCase();
            		for (var i in data) {
            			var info = data[i];
                        // object_info:
                        // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                        // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                        // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                        // [9] : int size // [10] : usermeta meta
            			var name = info[1];
            			var metadata = {};
            			if (self.currentCategory === 'media') {
            				metadata['Size'] = info[9];
            			} else if (self.currentCategory === 'plant_gnms') {
            				if (info[10].Name) {
            					metadata['ID'] = name;
            					name = info[10].Name;
            				}
            				metadata['Source'] = info[10].Source;
            				metadata['Genes'] = info[10]['Number features'];
            			}
            			if (name.toLowerCase().indexOf(query) == -1)
            				continue;
            			self.objectList.push({
    						$div: null,
    						info: info,
    						id: name,
    						name: name,
    						metadata: metadata,
    						ws: cat.ws,
    						type: cat.type,
    						attached: false
    					});
    					self.attachRow(self.objectList.length - 1);
            		}
            		data.totalResults = self.objectList.length;
        			self.totalPanel.empty();
        			self.totalPanel.append($('<span>').addClass("kb-data-list-type")
        					.append("Total results: " + data.totalResults));
            	}, function(error) {
        			//console.log(error);
    				self.totalPanel.empty();
    				self.totalPanel.append($('<span>').addClass("kb-data-list-type").append("Total results: 0"));
                });
        	} else {
            	self.currentPage++;
        		self.search(self.currentCategory, self.currentQuery, self.itemsPerPage, self.currentPage, function(query, data) {
        			if (query !== self.currentQuery) {
        				//console.log("Skip results for: " + query);
        				return;
        			}
        			self.totalPanel.empty();
        			if (!self.totalResults) {
        				self.totalResults = data.totalResults;
        			}
        			if (self.currentCategory === 'genomes') {
        				for (var i in data.items) {
        					var id = data.items[i].genome_id;
        					var name = data.items[i].scientific_name;
        					var domain = data.items[i].domain;
        					var contigs = data.items[i].num_contigs
        					var genes = data.items[i].num_cds
        					self.objectList.push({
        						$div: null,
        						info: null,
        						id: id,
        						name: name,
        						metadata: {'Domain': domain, 'Contigs': contigs, 'Genes': genes},
        						ws: cat.ws,
        						type: cat.type,
        						attached: false
        					});
        					self.attachRow(self.objectList.length - 1);
        				}
        			} else if (self.currentCategory === 'metagenomes') {
        				for (var i in data.items) {
        					var id = data.items[i].object_name;
        					var name = data.items[i].metagenome_name;
        					var project = data.items[i].project_name;
        					var sample = data.items[i].sample_name;
        					self.objectList.push({
        						$div: null,
        						info: null,
        						id: id,
        						name: name,
        						metadata: {'Project': project, 'Sample': sample},
        						ws: cat.ws,
        						type: cat.type,
        						attached: false
        					});
        					self.attachRow(self.objectList.length - 1);
        				}
        			} /*else {
        				for (var i in data.items) {
        					var id = data.items[i].object_name;
        					var name = data.items[i].object_name;
        					var metadata = {};
        					if (self.currentCategory === 'gwas_populations') {
        						metadata['Genome'] = data.items[i].kbase_genome_name;
        						metadata['Source'] = data.items[i].source_genome_name;
        					} else if (self.currentCategory === 'gwas_population_kinships') {
        						metadata['Genome'] = data.items[i].kbase_genome_name;
        						metadata['Source'] = data.items[i].source_genome_name;
        					} else if (self.currentCategory === 'gwas_population_variations') {
        						metadata['Originator'] = data.items[i].originator;
        						metadata['Assay'] = data.items[i].assay;
        					} else if (self.currentCategory === 'gwas_top_variations') {
        						metadata['Trait'] = data.items[i].trait_name;
        						metadata['Ontology'] = data.items[i].trait_ontology_id;
        						metadata['Genome'] = data.items[i].kbase_genome_name;
        					} else if (self.currentCategory === 'gwas_population_traits') {
        						metadata['Trait'] = data.items[i].trait_name;
        						metadata['Ontology'] = data.items[i].trait_ontology_id;
        						metadata['Genome'] = data.items[i].kbase_genome_name;
        					} else if (self.currentCategory === 'gwas_gene_lists') {
        						metadata['Genes'] = data.items[i].gene_count;
        						metadata['SNPs'] = data.items[i].gene_snp_count;
        					}
        					self.objectList.push({
        						$div: null,
        						info: null,
        						id: id,
        						name: name,
        						metadata: metadata,
        						ws: cat.ws,
        						type: cat.type,
        						attached: false
        					});
        					self.attachRow(self.objectList.length - 1);
        				}
        			}*/
        			self.totalPanel.append($('<span>').addClass("kb-data-list-type")
        					.append("Total results: " + data.totalResults + " (" + self.objectList.length + " shown)"));
        		}, function(error) {
        			//console.log(error);
        			if (self.objectList.length == 0) {
        				self.totalPanel.empty();
        				self.totalPanel.append($('<span>').addClass("kb-data-list-type").append("Total results: 0"));
        			}
        		});
        	}
        },
        
        attachRow: function(index) {
            var obj = this.objectList[index];
            if (obj.attached) { return; }
            if (obj.$div) {
                this.resultPanel.append(obj.$div);
            } else {
                obj.$div = this.renderObjectRowDiv(obj);
                this.resultPanel.append(obj.$div);
            }
            obj.attached = true;
            this.n_objs_rendered++;
        },

        search: function (category, query, itemsPerPage, pageNum, ret, errorCallback) {
        	var url = this.searchUrlPrefix + '?itemsPerPage=' + itemsPerPage + '&' + 
        		'page=' + pageNum + '&q=' + query + '&category=' + category;
        	var promise = jQuery.Deferred();
        	jQuery.ajax(url, {
        		success: function (data) {
        			ret(query, data);
        			promise.resolve();
        		},
        		error: function(jqXHR, error){
        			if (errorCallback)
    					errorCallback(error);
        			promise.resolve();
        		},
        		headers: {},
        		type: "GET"
        	});
        	
        	return promise;
        },

        renderObjectRowDiv: function(object) {
            var self = this;
            var type_tokens = object.type.split('.')
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];
            
            var $addDiv =
                $('<div>').append(
                    $('<button>').addClass('btn btn-default')
                        .append($('<span>').addClass('fa fa-chevron-circle-left').append(' Add'))
                        .on('click',function() { // probably should move action outside of render func, but oh well
                            $(this).attr("disabled","disabled");
                            $(this).html('<img src="'+self.loadingImage+'">');
                            
                            var thisBtn = this;
                            var targetName = object.name;
                            if (!isNaN(targetName))
                            	targetName = self.categoryDescr[self.currentCategory].type.split('.')[1] + ' ' + targetName;
                            var targetName = targetName.replace(/[^a-zA-Z0-9|\.\-_]/g,'_');
                            //console.log(object.name + " -> " + targetName);
                            self.wsClient.copy_object({
                                to:   {ref: self.wsName + "/" + targetName},
                                from: {ref: object.ws +   "/" + object.id} },
                                function (info) {
                                    $(thisBtn).html('Added');
                                    self.trigger('updateDataList.Narrative');
                                },
                                function(error) {
                                    $(thisBtn).html('Error');
                                    console.error(error);
                                });
                            
                        }));
            
            var shortName = object.name; 
            var isShortened=false;
            if (shortName.length>this.maxNameLength) {
                shortName = shortName.substring(0,this.maxNameLength-3)+'...';
                isShortened=true;
            }
            var landingPageLink = this.options.default_landing_page_url + object.ws + '/' + object.id;
            var ws_landing_page_map = window.kbconfig.landing_page_map;
            if (ws_landing_page_map && ws_landing_page_map[type_module] && ws_landing_page_map[type_module][type]) {
            	landingPageLink = this.options.landing_page_url +
            			ws_landing_page_map[type_module][type] + "/" + object.ws + '/' + object.id;
            }
            var $name = $('<span>').addClass("kb-data-list-name").append('<a href="'+landingPageLink+'" target="_blank">' + shortName + '</a>');
            if (isShortened) { $name.tooltip({title:object.name, placement:'bottom'}); }
           
            var $btnToolbar = $('<span>').addClass('btn-toolbar pull-right').attr('role', 'toolbar').hide();
            var btnClasses = "btn btn-xs btn-default";
            var css = {'color':'#888'};
            var $openLandingPage = $('<span>')
                                        // tooltips showing behind pullout, need to fix!
                                        //.tooltip({title:'Explore data', 'container':'#'+this.mainListId})
                                        .addClass(btnClasses)
                                        .append($('<span>').addClass('fa fa-binoculars').css(css))
                                        .click(function(e) {
                                            e.stopPropagation();
                                            window.open(landingPageLink);
                                        });
                                        
            var $openProvenance = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        //.tooltip({title:'View data provenance and relationships', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-sitemap fa-rotate-90').css(css))
                                        .click(function(e) {
                                            e.stopPropagation();
                                            window.open(self.options.landing_page_url+'objgraphview/'+object.ws+'/'+object.id);
                                        });
            $btnToolbar.append($openLandingPage).append($openProvenance);
		
            var titleElement = $('<span>').css({'margin':'10px'}).append($btnToolbar.hide()).append($name);
            for (var key in object.metadata) {
            	var value = $('<span>').addClass("kb-data-list-type").append('&nbsp;&nbsp;' + key + ':&nbsp;' + object.metadata[key]);
            	titleElement.append('<br>').append(value);
            }
            
	    var $topTable = $('<table>')
                                 .css({'width':'100%','background':'#fff'})  // set background to white looks better on DnD
                                 .append($('<tr>')
                                         .append($('<td>')
                                                 .css({'width':'90px'})
                                                .append($addDiv.hide()))
                                         .append($('<td>')
                                                 .css({'width':'50px'})
                                                 .append($('<span>')
                                            		 	.addClass("kb-data-list-logo")
                                            		 	.css({'background-color':this.logoColorLookup(type)})
                                            		 	.append(type.substring(0,1))))
                                         .append($('<td>')
                                                 .append(titleElement)));
	    
	    var $row = $('<div>')
                                .css({margin:'2px',padding:'4px','margin-bottom': '5px'})
                                //.addClass('kb-data-list-obj-row')
                                .append($('<div>').addClass('kb-data-list-obj-row-main')
                                            .append($topTable))
                                // show/hide ellipses on hover, show extra info on click
                                .mouseenter(function(){
                                    //if (!$moreRow.is(':visible')) { $toggleAdvancedViewBtn.show(); }
                                    $addDiv.show();
                                    $btnToolbar.show();
                                })
                                .mouseleave(function(){
                                    //$toggleAdvancedViewBtn.hide();
                                    $addDiv.hide();
                                    $btnToolbar.hide();
                                });
                            
            var $rowWithHr = $('<div>')
                                    .append($('<hr>')
                                                .addClass('kb-data-list-row-hr')
                                                .css({'margin-left':'155px'}))
                                    .append($row);
            return $rowWithHr;
        },

        showError: function(error) {
        	console.log(error);
        	var errorMsg = error;
        	if (error.error && error.error.message)
        		errorMsg = error.error.message;
        	this.infoPanel.empty();
        	this.infoPanel.append('<span class="label label-danger">Error: '+errorMsg+'"</span>');
        },

        logoColorLookup:function(type) {
            var colors = [
                            '#F44336', //red
                            '#E91E63', //pink
                            '#9C27B0', //purple
                            '#673AB7', //deep purple
                            '#3F51B5', //indigo
                            '#2196F3', //blue
                            '#03A9F4', //light blue
                            '#00BCD4', //cyan
                            '#009688', //teal
                            '#4CAF50', //green
                            '#8BC34A', //lime green
                            '#CDDC39', //lime
                            '#FFEB3B', //yellow
                            '#FFC107', //amber
                            '#FF9800', //orange
                            '#FF5722', //deep orange
                            '#795548', //brown
                            '#9E9E9E', //grey
                            '#607D8B'  //blue grey
                         ];
            
            // first, if there are some colors we want to catch...
            switch (type) {
                case "Genome":
                    return '#2196F3'; //blue
                case "FBAModel":
                    return '#4CAF50'; //green
                case "FBA":
                    return '#F44336'; //red
                case "ContigSet":
                    return '#FF9800'; //orange
                case "ProteomeComparison":
                    return '#3F51B5'; //indigo
                case "Tree":
                    return '#795548'; //brown
            }
            
            // pick one based on the characters
            var code = 0;
            for(var i=0; i<type.length; i++) {
                code += type.charCodeAt(i);
            }
            return colors[ code % colors.length ];
        },
        
        showInfo: function(message, spinner) {
        	if (spinner)
        		message = '<img src="'+this.loadingImage+'"/> ' + message;
        	this.infoPanel.empty();
        	this.infoPanel.append(message);
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
        
        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        }
    });
})( jQuery );
