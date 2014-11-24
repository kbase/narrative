/**
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeDataList',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            ws_name: null, // must be the WS name, not the WS Numeric ID
            
            ws_url:"https://kbase.us/services/ws",
            landing_page_url: "/functional-site/#/", // !! always include trailing slash
            default_landing_page_url: "/functional-site/#/ws/json/", // ws_name/obj_name,
            user_name_fetch_url:"https://kbase.us/services/genome_comparison/users?usernames=",
            
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            methodStoreURL: 'http://dev19.berkeley.kbase.us/narrative_method_store',

            ws_chunk_size:10000,  // this is the limit of the number of objects to retrieve from the ws on each pass
            ws_max_objs_to_fetch: 75000, // this is the total limit of the number of objects before we stop trying to get more
                                         // note that if there are more objects than this, then sorts/search filters may
                                         // not show accurate results
            
            objs_to_render_to_start:40, // initial number of rows to display
            objs_to_render_on_scroll:5, // number of rows to add when the user scrolls to the bottom, should be <=5, much more and
                                        // the addition of new rows becomes jerky
            
            max_objs_to_prevent_filter_as_you_type_in_search:50000, //if there are more than this # of objs, user must click search
                                                                    //instead of updating as you type
            
            max_objs_to_prevent_initial_sort:10000, // initial sort makes loading slower, so we can turn it off if
                                                    // there are more than this number of objects
            
            max_name_length:22,
            refresh_interval:60000
        },

        // private variables
        mainListPanelHeight : '300px',
        
        ws_name: null,
        ws: null,
        ws_last_update_timestamp: null,
        ws_obj_count: null,
        
        n_objs_rendered:0,
        
        ws_landing_page_map: {},
        real_name_lookup: {},
        
        $searchInput: null,
        $filterTypeSelect: null,
        availableTypes:{},
        
        $searchDiv: null,
        $sortByDiv: null,
        $filterTypeDiv: null,
        
        $addDataButton:null,
        $controllerDiv: null,
        $mainListDiv:null,
        $loadingDiv:null,
        
        methClient: null,

        obj_list : [],
        obj_data : {}, // old style - type_name : info
        
        /**
         * @method init
         * Builds the DOM structure for the widget.
         * Includes the tables and panel.
         * If any data was passed in (options.data), that gets shoved into the datatable.
         * @param {Object} - the options set.
         * @returns {Object} this shiny new widget.
         * @private
         */
        init: function(options) {
            this._super(options);
            var self = this;
            this.getLandingPageMap();  //start off this request so that we hopefully get something back right away
            
            this.$controllerDiv = $('<div>');
            this.$elem.append(this.$controllerDiv);
            this.renderController();
            this.$loadingDiv = $('<div>').addClass('kb-data-loading')
                                 .append('<img src="' + this.options.loadingImage + '">');
            this.$elem.append(this.$loadingDiv);
            this.$mainListDiv = $('<div>')
                .css({'overflow-x' : 'hidden', 'overflow-y':'auto', 'height':this.mainListPanelHeight})
                .on('scroll', function() {
                    if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                        self.renderMore();
                    }
                });
            this.$elem.append(this.$mainListDiv);
            
            if (this._attributes.auth) {
                this.ws = new Workspace(this.options.ws_url, this._attributes.auth);
            }
            setInterval(function(){self.refresh()}, this.options.refresh_interval); // check if there is new data every X ms
            
            this.showLoading();
            if (this.options.ws_name) {
                this.setWorkspace(this.options.ws_name);
            }
            if (window.kbconfig && window.kbconfig.urls) {
                this.options.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }
            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);
            
            return this;
        },
        
        setWorkspace : function(ws_name) {
            //this.ws_name = "janakacore"; // for testing a bigish workspace
            //this.ws_name = "KBasePublicGenomesV4"; // for testing a very big workspace
            this.ws_name = ws_name;
            this.refresh();
        },
        
        refresh: function() {
            var self = this;
            if (self.ws_name && self.ws) {
                self.ws.get_workspace_info({
                        workspace: this.ws_name
                    },
                    function(workspace_info) {
                        //[0] ws_id id, [1] ws_name workspace, [2] username owner, [3] timestamp moddate,
                        //[4] int object, [5] permission user_permission, [6] permission globalread,
                        //[7] lock_status lockstat, [8] usermeta metadata
                        //console.log('I have: '+self.ws_last_update_timestamp+ " remote has: "+workspace_info[3]);
                        if (self.ws_last_update_timestamp) {
                            if (self.ws_last_update_timestamp !== workspace_info[3]) {
                                self.ws_obj_count = workspace_info[4];
                                self.reloadWsData();
                            } else {
                                self.refreshTimeStrings();
                            }
                        } else {
                            self.ws_last_update_timestamp = workspace_info[3];
                            self.ws_obj_count = workspace_info[4];
                            self.reloadWsData();
                        }
                    },
                    function(error) {
                        // don't worry about it, just do nothing...
                    });
            } // else { we should probably do something if the user is not logged in or if the ws isn't set yet }
        },
        
        refreshTimeStrings: function() {
            var self = this;
            if (self.objectList.length>0) {
                if (self.objectList.length<self.options.max_objs_to_prevent_filter_as_you_type_in_search) {
                    for(var i=0; i<self.objectList.length; i++) {
                        if(self.objectList[i].$div) {
                            self.objectList[i].$div.find('.kb-data-list-date')
                                .html(self.getTimeStampStr(self.objectList[i].info[3]));
                        }
                    }
                }
            }
        },
        
        reloadWsData: function () {
            var self = this;
            if (self.ws_name && self.ws) {
                // empty the existing object list first
                self.objectList = [];
                self.obj_data = {};
                self.availableTypes = {};
                        
                self.getNextDataChunk(0);
            }
        },
        
        getNextDataChunk: function(skip) {
            var self = this;
            self.ws.list_objects({
                    workspaces : [self.ws_name],
                    includeMetadata: 1,
                    skip: skip,
                    limit: self.options.ws_chunk_size
                },
                function(infoList) {
                    // object_info:
                    // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                    // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                    // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                    // [9] : int size // [10] : usermeta meta
                    for (var i=0; i<infoList.length; i++) {
                        // skip narrative objects
                        if (infoList[i][2].indexOf('KBaseNarrative') == 0) { continue; }
                        self.objectList.push(
                            {
                                $div:null, //self.renderObjectRowDiv(infoList[i]), // we defer rendering the div until it is shown
                                info:infoList[i],
                                attached:false
                            }
                        );
                        var typeKey = infoList[i][2].split("-")[0];
                        if (!(typeKey in self.obj_data)) {
                            self.obj_data[typeKey]=[];
                        }
                        self.obj_data[typeKey].push(infoList[i]);
                        
                        var typeName = typeKey.split('.')[1];
                        if (!(typeName in self.availableTypes)) {
                            self.availableTypes[typeName] =
                                        {
                                            type:typeName,
                                            count:0
                                        };
                        }
                        self.availableTypes[typeName].count++;
                    }
                    
                    // if we have more than 2k objects, make them hit enter to search...
                    self.$searchInput.off("input change blur");
                    self.$searchInput.on("change blur",function() { self.search(); });
                    if (self.objectList.length<=self.options.max_objs_to_prevent_filter_as_you_type_in_search) {
                        self.$searchInput.on("input",function() { self.search(); });
                    }
                    
                    self.trigger('dataUpdated.Narrative');
                    
                    //LOGIC: we keep trying to get more until we reach the ws_obj_count or untill the max
                    // fetch count option, UNLESS the last call returned nothing, in which case we stop.
                    //IMPORTANT NOTE: IN RARE CASES THIS DOES NOT GAURANTEE THAT WE GET ALL OBJECTS FROM
                    //THIS WS!!  IF THERE IS A CHUNK THAT RETURNED NOTHING, THERE STILL MAY BE MORE
                    //OBJECTS DUE TO A BUG IN THE WORKSPACE THAT INCLUDES OLD VERSIONS AND DELETED VERSIONS
                    //BEFORE FILTERING OUT THE NUMBER - A BETTER TEMP FIX WOULD BE TO LIMIT THE NUMBER OF
                    //RECURSIONS TO 2 or 3 MAYBE...
                    if (self.objectList.length < self.ws_obj_count
                            && self.objectList.length < self.options.ws_max_objs_to_fetch
                            && infoList.length>0) {
                        self.getNextDataChunk(skip+self.options.ws_chunk_size);
                    } else {
                        if (self.objectList.length<=self.options.max_objs_to_prevent_initial_sort) {
                            self.objectList.sort(function(a,b) {
                                    if (a.info[3] > b.info[3]) return -1; // sort by date
                                    if (a.info[3] < b.info[3]) return 1;  // sort by date
                                    return 0;
                                });
                            self.$elem.find('#nar-data-list-default-sort-label').addClass('active');
                            self.$elem.find('#nar-data-list-default-sort-option').attr('checked');
                        }
                    }
                    
                    self.populateAvailableTypes();
                    self.renderList();
                    self.hideLoading();
                }, 
                function(error) {
                    console.log(error);
                });
            
        },
        
        getObjData: function(type, ignoreVersion) {
            if (type) {
                var dataSet = {};
                if (typeof type === 'string') {
                    type = [type];
                }
                for (var i=0; i<type.length; i++) {
                    if (this.obj_data[type[i]]) {
                        dataSet[type[i]]=this.obj_data[type[i]];
                    }
                }
                return dataSet;
            }
            return this.obj_data;  
        },
        
        renderObjectRowDiv: function(object_info) {
            var self = this;
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            var type_tokens = object_info[2].split('.')
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];
            var unversioned_full_type = type_module + '.' + type;
            var logo = $('<div>')
                            .addClass("kb-data-list-logo")
                            .css({'background-color':this.logoColorLookup(type)})
                            .append(type.substring(0,1));
            var shortName = object_info[1]; var isShortened=false;
            if (shortName.length>this.options.max_name_length) {
                shortName = shortName.substring(0,this.options.max_name_length-3)+'...';
                isShortened=true;
            }
            var $name = $('<span>').addClass("kb-data-list-name").append(shortName);
            if (isShortened) { $name.tooltip({title:object_info[1], placement:'bottom'}); }
                            
            var $version = $('<span>').addClass("kb-data-list-version").append('v'+object_info[4]);
            var $type = $('<span>').addClass("kb-data-list-type").append(type);
            var $date = $('<span>').addClass("kb-data-list-date").append(this.getTimeStampStr(object_info[3]));
            var $logoDiv  = $('<div>').addClass('col-md-2').css({padding:'0px',margin:'0px'}).append(logo)
            var metadata = object_info[10];
            var metadataText = '';
            for(var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    metadataText += '<tr><th>'+ key +'</th><td>'+ metadata[key] + '</td></tr>';
                }
            }
            
            var landingPageLink = this.options.default_landing_page_url +object_info[7]+ '/' + object_info[1];
            if (this.ws_landing_page_map) {
                if (this.ws_landing_page_map[type_module]) {
                    if (this.ws_landing_page_map[type_module][type]) {
                        landingPageLink = this.options.landing_page_url +
                            this.ws_landing_page_map[type_module][type] + "/" +
                            object_info[7]+ '/' + object_info[1];
                    }
                }
            }
            
            var $savedByUserSpan = $('<td>').addClass('kb-data-list-username-td');
            this.displayRealName(object_info[5],$savedByUserSpan);
            
            var typeLink = '<a href="'+this.options.landing_page_url+'spec/module/'+type_module+'" target="_blank">' +type_module+"</a>.<wbr>" +
                           '<a href="'+this.options.landing_page_url+'spec/type/'+object_info[2]+'" target="_blank">' +(type_tokens[1].replace('-','&#8209;')) + '.' + type_tokens[2] + '</a>';
            var $moreRow  = $('<div>').addClass("kb-data-list-more-div").hide()
                                .append($('<div>').css({'text-align':'center','margin':'5pt'})
                                            .append('<a href="'+landingPageLink+'" target="_blank">'+
                                                        'explore data</a>&nbsp&nbsp|&nbsp&nbsp')
                                            .append('<a href="'+this.options.landing_page_url+'objgraphview/'+object_info[7] +'/'+object_info[1] +'" target="_blank">'+
                                                        'view provenance</a><br>'))
                                .append(
                                    $('<table style="width=100%">')
                                        .append("<tr><th>Permament Id</th><td>" +object_info[6]+ "/" +object_info[0]+ "/" +object_info[4] + '</td></tr>')
                                        .append("<tr><th>Full Type</th><td>"+typeLink+'</td></tr>')
                                        .append($('<tr>').append('<th>Saved by</th>').append($savedByUserSpan))
                                        .append(metadataText));
            
            var $toggleAdvancedViewBtn = $('<span>').addClass('btn btn-default btn-xs kb-data-list-more-btn')
                .html('<span class="fa fa-plus" style="color:#999" aria-hidden="true"/>')
                .on('click',function() {
                        var $more = $(this).closest(".kb-data-list-obj-row").find(".kb-data-list-more-div");
                        if ($more.is(':visible')) {
                            $more.hide();
                            $(this).html('<span class="fa fa-plus" style="color:#999" aria-hidden="true" />');
                        } else {
                            self.getRichData(object_info,$moreRow);
                            $more.show();
                            $(this).html('<span class="fa fa-minus" style="color:#999" aria-hidden="true" />');
                        }
                    });
                    
            var $mainDiv  = $('<div>').addClass('col-md-10 kb-data-list-info').css({padding:'0px',margin:'0px'})
                                .append($('<div>').append($('<table>').css({'width':'100%'})
                                        .append($('<tr>')
                                                .append($('<td>').css({'width':'50%'})
                                                    .append($name).append($version).append('<br>')
                                                    .append($type).append('<br>').append($date))
                                                .append($('<td>').css({'vertical-align':'bottom','text-align':'right'})
                                                    .append($toggleAdvancedViewBtn)))));
        
            var $row = $('<div>').addClass('kb-data-list-obj-row')
                            .append($('<div>').addClass('row kb-data-list-obj-row-main')
                                        .append($logoDiv)
                                        .append($mainDiv))
                            .append($moreRow)
                            .mouseenter(function(){$(this).addClass('kb-data-list-obj-row-hover');})
                            .mouseleave(function(){$(this).removeClass('kb-data-list-obj-row-hover');});

            // Uncomment to re-enable DnD
            //this.addDragAndDrop($row);

            return $row;
        },
        
        // ============= DnD ==================

        addDragAndDrop: function($row) {
            // Add data drag-and-drop (jquery-ui)
            // allow data element to visually leave the left column
            $('#left-column').css('overflow', 'visible');
            $row.draggable({
                cursor: 'move',
                containment: '#site',
                helper: 'clone',
                start: this.dataDragged
            });
            $('#notebook-container').droppable({
                drop: this.dataDropped
            });

            return this;
        },

        dataDragged: function(event, ui) {
            console.debug("Gentlemen (?), start your dragging");
        },

        dataDropped: function(event, ui) {
            console.debug("Done dragging, sucka!");
            var elt = ui.draggable;
            // find nearest cell using jquery-nearest lib.
            var near_elt = $(elt).nearest('.cell');
            var near_idx = IPython.notebook.find_cell_index($(near_elt).data().cell);
            var cell = IPython.notebook.insert_cell_at_index('markdown', near_idx);
            var cell_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);});
            cell.rendered = false;
            // Extract metadata 
            var meta_fields = ['name', 'type', 'version'];
            var meta = _.object(meta_fields, _.map(meta_fields,
                function(f) {return $(elt).find('.kb-data-list-' + f).text()}));

            cell.set_text('<div id="' + cell_id + '">&nbsp;</div>');
            cell.render();
            // Insert the narrative data cell into the div we just rendered
            $('#' + cell_id).kbaseNarrativeDataCell(meta);
        },

        // ============= end DnD ================

        renderMore: function() {
            var self=this;
            if (self.objectList) {
                
                if (!self.searchFilterOn) { // if search filter is off, then we just are showing everything
                    var start = self.n_objs_rendered;
                    for(var i=start; i<self.objectList.length; i++) {
                        // only show them as we scroll to them
                        if (self.n_objs_rendered >= start+self.options.objs_to_render_on_scroll) {
                            break;
                        }
                        self.attachRow(i);
                    }
                    console.log('showing '+ self.n_objs_rendered + ' of ' + self.objectList.length);
                } else {
                    // search filter is on, so we have to base this on what is currently filtered
                    var start = self.n_filteredObjsRendered;
                    for(var i=start; i<self.currentMatch.length; i++) {
                        // only show them as we scroll to them
                        if (self.n_filteredObjsRendered >= start+self.options.objs_to_render_on_scroll) {
                            break;
                        }
                        self.attachRowElement(self.currentMatch[i]);
                        self.n_filteredObjsRendered++;
                    }
                    console.log('showing '+ self.n_filteredObjsRendered + ' of ' + self.currentMatch.length + ' objs matching search filter');
                }
            }
        },
        
        attachRow: function(index) {
            if (this.objectList[index].attached) { return; }
            if (this.objectList[index].$div) {
                this.$mainListDiv.append(this.objectList[index].$div);
            } else {
                this.objectList[index].$div = this.renderObjectRowDiv(this.objectList[index].info);
                this.$mainListDiv.append(this.objectList[index].$div);
            }
            this.objectList[index].attached = true;
            this.n_objs_rendered++;
        },
        attachRowElement: function(row) {
            if (row.attached) { return; } // return if we are already attached
            if (row.$div) {
                this.$mainListDiv.append(row.$div);
            } else {
                row.$div = this.renderObjectRowDiv(row.info);
                this.$mainListDiv.append(row.$div);
            }
            row.attached = true;
            this.n_objs_rendered++;
        },
        
        detachAllRows: function() {
            for (var i=0; i<this.objectList.length; i++) {
                this.detachRow(i);
            }
            this.$mainListDiv.children().detach();
            this.n_objs_rendered=0;
            this.renderedAll = false;
        },
        detachRow: function(index) {
            if (this.objectList[index].attached) {
                if (this.objectList[index].$div) {
                    this.objectList[index].$div.detach();
                }
                this.objectList[index].attached = false;
                this.n_objs_rendered--;
            }
        },
        
        
        renderList: function() {
            var self = this;
            self.showLoading();
            
            self.detachAllRows();
            
            if (self.objectList.length>0) {
                for(var i=0; i<self.objectList.length; i++) {
                    // only show up to the given number
                    if (i>=self.options.objs_to_render_to_start) {
                        self.n_objs_rendered = i;
                        break;
                    }
                    self.attachRow(i);
                }
            } else {
                // todo: show an upload button or some other message if there are no elements
            }
            
            self.hideLoading();
        },
        
        renderController: function() {
            var self = this;
            
            var $byDate = $('<label id="nar-data-list-default-sort-label" class="btn btn-default">').addClass('btn btn-default')
                                .append($('<input type="radio" name="options" id="nar-data-list-default-sort-option" autocomplete="off">'))
                                .append("date")
                                .on('click',function() {
                                    self.sortData(function(a,b) {
                                        if (a.info[3] > b.info[3]) return -1; // sort by date
                                        if (a.info[3] < b.info[3]) return 1;  // sort by date
                                        return 0;
                                    });
                                });
                                
            var $byName = $('<label class="btn btn-default">')
                                .append($('<input type="radio" name="options" id="option2" autocomplete="off">'))
                                .append("name")
                                .on('click',function() {
                                    self.sortData(function(a,b) {
                                        if (a.info[1].toUpperCase() < b.info[1].toUpperCase()) return -1; // sort by name
                                        if (a.info[1].toUpperCase() > b.info[1].toUpperCase()) return 1; 
                                        return 0;
                                    });
                                });
                                
            var $byType = $('<label class="btn btn-default">')
                                .append($('<input type="radio" name="options" id="option3" autocomplete="off">'))
                                .append("type")
                                .on('click',function() {
                                    self.sortData(function(a,b) {
                                        if (a.info[2].toUpperCase() > b.info[2].toUpperCase()) return -1; // sort by type
                                        if (a.info[2].toUpperCase() < b.info[2].toUpperCase()) return 1;
                                        return 0;
                                    });
                                });
            var $upOrDown = $('<button class="btn btn-default btn-sm" type="button">').css({'margin-left':'5px'})
                                .append('<span class="glyphicon glyphicon-sort" style="color:#777" aria-hidden="true" />')
                                .on('click',function() {
                                    self.reverseData();
                                });
            
            var $sortByGroup = $('<div data-toggle="buttons">')
                                    .addClass("btn-group btn-group-sm")
                                    .css({"margin":"2px"})
                                    .append($byDate)
                                    .append($byName)
                                    .append($byType);
            
            var $addDataBtn = $('<button>')
                                .addClass("btn btn-warning kb-data-list-get-data-button")
                                .append('<span class="fa fa-plus" style="color:#fff" aria-hidden="true" /> Get Data')
                                .on('click',function() {
//                                    self.trigger('toggleSidePanelOverlay.Narrative');

                                      // Lovely hack to make the 'Get Data' button behave like a method/app panel button.
                                      self.methClient.get_method_spec({ 'ids' : ['import_genome_data_generic'] },
                                          function(spec) {
                                              self.trigger('methodClicked.Narrative', spec[0]);
                                          },
                                          function(error) {
                                              self.showError(error);
                                          }
                                      );
                                });
            
            
            var $openSearch = $('<span>').addClass('btn btn-default kb-data-list-nav-buttons')
                .html('<span class="fa fa-search" style="color:#666" aria-hidden="true"/>')
                .on('click',function() {
                    if(!self.$searchDiv.is(':visible')) {
                        self.$searchDiv.show();
                        self.$sortByDiv.hide();
                        self.$filterTypeDiv.hide();
                    } else {
                        self.$searchDiv.hide();
                    }
                });
            var $openSort = $('<span>').addClass('btn btn-default kb-data-list-nav-buttons')
                .html('<span class="fa fa-sort-amount-asc" style="color:#666" aria-hidden="true"/>')
                .on('click',function() {
                    if(!self.$sortByDiv.is(':visible')) {
                        self.$sortByDiv.show();
                        self.$searchDiv.hide();
                        self.$filterTypeDiv.hide();
                    } else {
                        self.$sortByDiv.hide();
                    }
                });
            var $openFilter = $('<span>').addClass('btn btn-default kb-data-list-nav-buttons')
                .html('<span class="fa fa-filter" style="color:#666" aria-hidden="true"/>')
                .on('click',function() {
                    if(!self.$filterTypeDiv.is(':visible')) {
                        self.$filterTypeDiv.show();
                        self.$sortByDiv.hide();
                        self.$searchDiv.hide();
                    } else {
                        self.$filterTypeDiv.hide();
                    }
                });
            
            self.$searchInput = $('<input type="text">').addClass('form-control');
            self.$searchDiv = $('<div>').addClass("input-group").css({'margin-bottom':'10px'})
                                .append(self.$searchInput)
                                .append($("<span>").addClass("input-group-addon")
                                            .append($("<span>")
                                                .addClass("glyphicon glyphicon-search")
                                                .css({'cursor':'pointer'})
                                                .on('click',function() {
                                                        self.search();
                                                    })  ));

            self.$sortByDiv = $('<div>').css({'margin':'3px','margin-left':'5px','margin-bottom':'10px'})
                                .append("<small>sort by: </small>")
                                .append($sortByGroup)
                                .append($upOrDown);
            
            self.$filterTypeSelect = $('<select>').addClass("form-control")
                                        .append($('<option value="">'))
                                        .change(function() {
                                            var optionSelected = $(this).find("option:selected");
                                            var typeSelected  = optionSelected.val();
                                            //var textSelected   = optionSelected.text();
                                            self.filterByType(typeSelected);
                                        });
            
            self.$filterTypeDiv = $('<div>').css({'margin':'3px','margin-left':'5px','margin-bottom':'10px'})
                                .append(self.$filterTypeSelect);
                                
                                
            
            var $header = $('<div>').addClass('row').css({'margin':'5px'})
                    .append($('<div>').addClass('col-xs-7').css({'margin':'0px','padding':'0px'})
                        .append($openSearch)
                        .append($openSort)
                        .append($openFilter))
                    .append($('<div>').addClass('col-xs-5').css({'margin':'0px','padding':'0px','text-align':'right'})
                        .append($addDataBtn));
            
            
            self.$sortByDiv.hide();
            self.$searchDiv.hide();
            self.$filterTypeDiv.hide();
            
            var $filterDiv = $('<div>')
                                .append(self.$sortByDiv)
                                .append(self.$searchDiv)
                                .append(self.$filterTypeDiv);
                                
            self.$controllerDiv.append($header).append($filterDiv);
        },
        
        populateAvailableTypes: function() {
            var self = this;
            if (self.availableTypes && self.$filterTypeSelect) {
                
                var types = [];
                for(var type in self.availableTypes) {
                    if(self.availableTypes.hasOwnProperty(type)) {
                        types.push(type);
                    }
                }
                types.sort();
                
                self.$filterTypeSelect.empty();
                self.$filterTypeSelect.append($('<option value="">'));
                for(var i=0; i<types.length; i++) {
                    var countStr = " (".concat(self.availableTypes[types[i]].count).concat(" objects)");
                    self.$filterTypeSelect.append(
                        $('<option value="'+self.availableTypes[types[i]].type+'">')
                            .append(self.availableTypes[types[i]].type + countStr));
                }
            }
        },
        
        
        reverseData: function() {
            var self = this;
            if (!self.objectList) { return; }
            
            self.objectList.reverse();
            self.renderList();
            self.search();
            
            self.hideLoading();
        },
        
        sortData: function(sortfunction) {
            var self = this;
            if (!self.objectList) { return; }
            //should add spinning wait bar ....
            self.showLoading();
            
            self.objectList.sort(sortfunction);
            self.renderList();
            self.search();  // always refilter on the search term search if there is something there
            
            self.hideLoading();
            
            // go back to the top on sort
            self.$mainListDiv.animate({
                scrollTop:0
            }, 300); // fast = 200, slow = 600
        },
        
        
        currentMatch: [],
        currentTerm: '',
        searchFilterOn: false,
        n_filteredObjsRendered: null,
        
        search: function(term, type) {
            var self = this;
            if (!self.objectList) { return; }
            
            if (!term && self.$searchInput) {
                term = self.$searchInput.val();
            }
            
            // if type wasn't selected, then we try to get something that was set
            if (!type) {
                if (self.$filterTypeSelect) {
                    type = self.$filterTypeSelect.find("option:selected").val();
                }
            }
            
            term = term.trim();
            if (term.length>0 || type) {
                self.searchFilterOn = true;
                // todo: should show searching indicator (could take several seconds if there is a lot of data)
                // optimization => we filter existing matches instead of researching everything if the new
                // term starts with the last term searched for
                var newMatch = [];
                if (!self.currentTerm) {
                    // reset if currentTerm is null or empty
                    self.currentMatch = self.objectList;
                } else {
                    if (term.indexOf(self.currentTerm)!==0) {
                        self.currentMatch = self.objectList;
                    }
                }
                // clean the term for regex use
                term = term.replace(/\|/g,'\\|').replace(/\\\\\|/g,'|'); // bars are common in kb ids, so escape them unless we have \\|
                term = term.replace(/\./g,'\\.').replace(/\\\\\./g,'.'); // dots are common in names, so we escape them, but
                                                                         // if a user writes '\\.' we assume they want the regex '.'
                
                var regex = new RegExp(term, 'i');
                
                var n_matches = 0; self.n_filteredObjsRendered = 0;
                for(var k=0; k<self.currentMatch.length; k++) {
                    // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                    // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                    // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                    // [9] : int size // [10] : usermeta meta
                    var match = false;
                    var info = self.currentMatch[k].info;
                    if (regex.test(info[1])) { match = true; } // match on name
                    else if (regex.test(info[2].split('.')[1].split('-'))) { match = true; } // match on type name
                    else if (regex.test(info[5])) { match = true; } // match on saved_by user
                    
                    if (type) { // if type is defined, then our sort must also filter by the type
                        if (type !== info[2].split('-')[0].split('.')[1]) {
                            match = false; // no match if we are not the selected type!
                        }
                    }
                    
                    if (match) {
                        // matches must always switch to show if they are rendered
                        if (self.currentMatch[k].$div) {
                            self.currentMatch[k].$div.show();
                        }
                        
                        // todo: add check so we only show up to the number we render... switching to this will require that
                        // we revise the renderMore logic...
                        if (n_matches < self.options.objs_to_render_to_start) {
                            self.attachRowElement(self.currentMatch[k]);
                            self.n_filteredObjsRendered++;
                        }
                        
                        newMatch.push(self.currentMatch[k]);
                        n_matches++;
                    }
                    else {
                        if (self.currentMatch[k].$div) {
                            self.currentMatch[k].$div.hide();
                        }
                    }
                }
                self.currentMatch = newMatch; // update the current match
            } else {
                self.searchFilterOn = false;
                // no new search, so show all and render the list
                for(var k=0; k<self.objectList.length; k++) {
                    if (self.objectList[k].$div) {
                        self.objectList[k].$div.show();
                    }
                }
                self.renderList();
            }
            self.currentTerm = term;
        },
        
        
        filterByType: function(type) {
            var self = this;
            self.search(null,type);
        },
        
        getRichData: function(object_info,$moreRow) {
            var self = this;
            var $usernameTd = $moreRow.find(".kb-data-list-username-td");
            self.displayRealName(object_info[5],$usernameTd);
        },
        
        showLoading : function() {
            this.$loadingDiv.show();
            this.$mainListDiv.hide();
        },
        hideLoading : function() {
            this.$loadingDiv.hide();
            this.$mainListDiv.show();
        },
        
        displayRealName: function(username,$targetSpan) {
	    var self = this;
	    // todo : use globus to populate user names, but we use a hack because of globus CORS headers
	    if (self.ws) { // make sure we are logged in and have some things
		
                if (self.real_name_lookup[username]) {
                    $targetSpan.html(self.real_name_lookup[username]+" ("+username+")");
                } else {
                    self.real_name_lookup[username] = "..."; // set a temporary value so we don't search again
                    $targetSpan.html(username);
                    $.ajax({
                            type: "GET",
                            url: self.options.user_name_fetch_url + username + "&token="+self._attributes.auth.token,
                            dataType:"json",
                            crossDomain : true,
                            success: function(data,res,jqXHR) {
                                if (username in data['data'] && data['data'][username]['fullName']) {
                                    self.real_name_lookup[username] = data['data'][username]['fullName'];
                                    $targetSpan.html(self.real_name_lookup[username]+" ("+username+")");
                                }
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                //do nothing
                            }
                        })
                }
	    }
        },
        
        getLandingPageMap: function() {
            /**
             * Get the landing page map.
             * First, try getting it from /functional-site/landing_page_map.json.
             * If that fails, try /static/kbase/js/widgets/landing_page_map.json.
             */
            $.ajax({
                url: '/functional-site/landing_page_map.json',
                async: true,
                dataType: 'json',
                success: $.proxy(function(response) {
                    this.ws_landing_page_map = response;
                }, this),
                error: $.proxy(function(error) {
                    this.dbg("Unable to get standard landing page map, looking for backup...");
                    $.ajax({
                        url: '/static/kbase/js/ui-common/functional-site/landing_page_map.json',
                        async: true,
                        dataType: 'json',
                        success: $.proxy(function(response) {
                            this.ws_landing_page_map = response;
                        }, this),
                        error: $.proxy(function(error) {
                            this.dbg("Unable to get any landing page map! Landing pages mapping unavailable...");
                            this.ws_landing_page_map = null;
                        }, this)
                    })
                }, this)});
        },
        
        /**
         * @method loggedInCallback
         * This is associated with the login widget (through the kbaseAuthenticatedWidget parent) and
         * is triggered when a login event occurs.
         * It associates the new auth token with this widget and refreshes the data panel.
         * @private
         */
        loggedInCallback: function(event, auth) {
            this.ws = new Workspace(this.options.workspaceURL, auth);
            this.isLoggedIn = true;
            this.refresh();
            return this;
        },

        /**
         * @method loggedOutCallback
         * Like the loggedInCallback, this is triggered during a logout event (through the login widget).
         * It throws away the auth token and workspace client, and refreshes the widget
         * @private
         */
        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            this.refresh();
            return this;
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
        
        
        // edited from: http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
        getTimeStampStr: function (objInfoTimeStamp) {
            var date = new Date(objInfoTimeStamp);
            var seconds = Math.floor((new Date() - date) / 1000);
            var interval = Math.floor(seconds / 31536000);
            
            if (interval > 1) {
                return self.monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
            }
            interval = Math.floor(seconds / 2592000);
            if (interval > 1) {
                if (interval<4) {
                    return interval + " months ago";
                } else {
                    return this.monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
                }
            }
            interval = Math.floor(seconds / 86400);
            if (interval > 1) {
                return interval + " days ago";
            }
            interval = Math.floor(seconds / 3600);
            if (interval > 1) {
                return interval + " hours ago";
            }
            interval = Math.floor(seconds / 60);
            if (interval > 1) {
                return interval + " minutes ago";
            }
            return Math.floor(seconds) + " seconds ago";
        },
        
        monthLookup : ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep","Oct", "Nov", "Dec"],
        
        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }
    })

})(jQuery);
