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
        searchUrlPrefix: 'http://kbase.us/services/search/getResults',
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: "https://kbase.us/services/ws/",
        wsClient: null,
        categories: ['genomes', 'media'],
        categoryDescr: {  // search API category -> {}
        	'genomes': {name:'Genomes',type:'KBaseGenomes.Genome',ws:'KBasePublicGenomesV4',search:true},
        	'media': {name:'Media',type:'KBaseBiochem.Media', ws:'KBaseMedia',search:false}
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
        				if (parts[i].indexOf('*', parts[i] - 1) < 0)
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
            			if (name.toLowerCase().indexOf(query) == -1)
            				continue;
            			self.objectList.push({
    						$div: null,
    						info: info,
    						id: name,
    						name: name,
    						metadata: {'Size': info[9]},
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
        			//console.log(data);
        			if (!self.totalResults) {
        				self.totalResults = data.totalResults;
        			}
        			if (self.currentCategory === 'genomes') {
        				for (var i in data.items) {
        					var id = data.items[i].genome_id;
        					var name = data.items[i].scientific_name;
        					var domain = data.items[i].domain;
        					//self.options.addToNarrativeButton.prop('disabled', false);
        					self.objectList.push({
        						$div: null,
        						info: null,
        						id: id,
        						name: name,
        						metadata: {'Domain': domain},
        						ws: cat.ws,
        						type: cat.type,
        						attached: false
        					});
        					self.attachRow(self.objectList.length - 1);
        				}
        			}
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
                $('<div>').addClass('col-md-2').append(
                    $('<button>').addClass('btn btn-default')
                        .append($('<span>').addClass('fa fa-chevron-circle-left').append(' Add'))
                        .on('click',function() { // probably should move action outside of render func, but oh well
                            $(this).attr("disabled","disabled");
                            $(this).html('<img src="'+self.loadingImage+'">');
                            
                            var thisBtn = this;
                            var targetName = object.name.replace(/[^a-zA-Z0-9|\.\-_]/g,'_');
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
           
            /*var metadata = object.metadata;
            var metadataText = '';
            for(var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    metadataText += '<tr><td>'+ key +'</td><td>'+ metadata[key] + '</td></tr>';
                }
            }
            var $moreRow  = $('<div>').addClass("kb-data-list-more-div").hide()
                                .append($('<div>').css({'text-align':'center','margin':'5pt'})
                                            .append('<a href="'+landingPageLink+'" target="_blank">'+
                                                        'explore data</a>&nbsp&nbsp|&nbsp&nbsp')
                                            .append('<a href="'+this.options.landing_page_url+'objgraphview/'+object.ws + '/' + object.id +'" target="_blank">'+
                                                        'view provenance</a><br>'))
                                .append(
                                    $('<table style="width=100%">')
                                        .append(metadataText));
            var $toggleAdvancedViewBtn = $('<span>').addClass('btn btn-default btn-xs kb-data-list-more-btn')
                .html('<span class="fa fa-plus" style="color:#999" aria-hidden="true"/>')
                .on('click',function() {
                        var $more = $(this).closest(".kb-data-list-obj-row").find(".kb-data-list-more-div");
                        if ($more.is(':visible')) {
                            $more.slideToggle('fast');
                            $(this).html('<span class="fa fa-plus" style="color:#999" aria-hidden="true" />');
                        } else {
                            $more.slideToggle('fast');
                            $(this).html('<span class="fa fa-minus" style="color:#999" aria-hidden="true" />');
                        }
                    });*/
                    
            var titleElement = $('<span>').css({'margin':'10px'}).append($name).append('<br>');
            for (var key in object.metadata) {
            	var value = $('<span>').addClass("kb-data-list-type").append('&nbsp;&nbsp;' + key + ':&nbsp;' + object.metadata[key]);
            	titleElement.append(value);
            }
            var $mainDiv  = $('<div>').addClass('col-md-10 kb-data-list-info')
            			.css({'padding-left': '0px'})
            			.append($('<table>')
                             .css({'width':'100%'})
                             .append($('<tr>')
                                     .append($('<td>')
                                             .css({'width':'5%'})
                                             .append(
                                            		 $('<span>')
                                            		 	.addClass("kb-data-list-logo")
                                            		 	.css({'background-color':this.logoColorLookup(type)})
                                            		 	.append(type.substring(0,1)))
                                      )
                                      .append($('<td>').append(titleElement))
                              )
                         );
            var $row = $('<div>').css({'margin':'5px'}).append(
                            $('<div>').addClass('row kb-data-list-obj-row-main')
                                .append($addDiv)
                                .append($mainDiv));
            return $row;
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
