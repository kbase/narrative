/**
 * 
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeDataList',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            ws_name: null,
            ws_url:"https://kbase.us/services/ws",
            landing_page_url: "/functional-site/#/",
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            max_objs_to_render:2000,
            max_objs_to_prevent_filter_as_you_type_in_search:2000,
            max_objs_to_prevent_initial_sort:2000,
            max_name_length:22,
            refresh_interval:15000
        },

        ws_name: null,
        ws: null,
        ws_last_update_timestamp: null,
        
        
        $searchInput: null,
        $addDataButton:null,
        $controllerDiv: null,
        $mainListDiv:null,
        $loadingDiv:null,
        
        
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
            
            
            this.$controllerDiv = $('<div>');
            this.$elem.append(this.$controllerDiv);
            this.renderController();
            this.$loadingDiv = $('<div>').addClass('kb-data-loading')
                                 .append('<img src="' + this.options.loadingImage + '">');
            this.$elem.append(this.$loadingDiv);
            this.$mainListDiv = $('<div>').css({'overflow-x' : 'hidden', 'overflow-y':'auto', 'height':'290px'});
            this.$elem.append(this.$mainListDiv);
            
            
            if (this._attributes.auth) {
                this.ws = new Workspace(this.options.ws_url, this._attributes.auth);
            }
            var self = this;
            setInterval(function(){self.refresh()}, this.options.refresh_interval); // check if there is new data every 15 sec
            
            return this;
        },
        
        setWorkspace : function(ws_name) {
            //this.ws_name = "KBasePublicOntologies"; // for testing a bigish workspace
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
                                self.reloadWsData();
                            } else {
                                self.refreshTimeStrings();
                            }
                        } else {
                            self.ws_last_update_timestamp = workspace_info[3];
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
                        self.objectList[i].$div.find('.kb-data-list-date')
                            .html(self.getTimeStampStr(self.objectList[i].info[3]));
                    }
                }
            }
        },
        
        reloadWsData: function () {
            var self = this;
            if (self.ws_name && self.ws) {
                self.ws.list_objects({
                    workspaces : [self.ws_name],
                    includeMetadata: 1
                },
                function(infoList) {
                    // object_info:
                    // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                    // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                    // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                    // [9] : int size // [10] : usermeta meta
                    
                    // empty the existing object list first
                    self.objectList = [];
                    self.obj_data = {};
                    
                    for (var i=0; i<infoList.length; i++) {
                        // skip narrative objects
                        if (infoList[i][2].indexOf('KBaseNarrative') == 0) { continue; }
                        self.objectList.push(
                            {
                                $div:self.renderObjectRowDiv(infoList[i]),
                                info:infoList[i]
                            }
                        );
                        var typeKey = infoList[i][2].split("-")[0];
                        if (!(typeKey in self.obj_data)) { self.obj_data[typeKey]=[] }
                        self.obj_data[typeKey].push(infoList[i]);
                        
                    }
                    if (infoList.length<=self.options.max_objs_to_prevent_initial_sort) {
                        self.objectList.sort(function(a,b) {
                                if (a.info[3] > b.info[3]) return -1; // sort by date
                                if (a.info[3] < b.info[3]) return 1;  // sort by date
                                return 0;
                            });
                        self.$elem.find('#nar-data-list-default-sort-label').addClass('active');
                        self.$elem.find('#nar-data-list-default-sort-option').attr('checked');
                    }
                    
                    self.renderList();
                    
                    // if we have more than 2k objects, make them hit enter to search...
                    if (infoList.length>self.options.max_objs_to_prevent_filter_as_you_type_in_search) {
                        self.$searchInput.off("input change blur");
                        self.$searchInput.on("change blur",function() { self.search(); });
                    } else {
                        self.$searchInput.off("input change blur");
                        self.$searchInput.on("input change blur",function() { self.search(); });
                    }
                    
                    self.trigger('dataUpdated.Narrative');
                    
                }, 
                function(error) {
                    console.log(error);
                });
            }
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
            
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            var type_tokens = object_info[2].split('.')
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];
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
            
            
            var typeLink = '<a href="'+this.options.landing_page_url+'spec/module/'+type_module+'" target="_blank">' +type_module+"</a>.<wbr>" +
                           '<a href="'+this.options.landing_page_url+'spec/type/'+object_info[2]+'" target="_blank">' +(type_tokens[1].replace('-','&#8209;')) + '.' + type_tokens[2] + '</a>';
            var $moreRow  = $('<div>').addClass("kb-data-list-more-div").hide()
                                .append('<center><a href="'+this.options.landing_page_url+'objgraphview/'+object_info[7] +'/'+object_info[1] +'" target="_blank">'+
                                            'view provenance</a></center><br>')
                                .append(
                                    "<table>"
                                    +"<tr><th>Permament Id</th><td>" +object_info[6]+ "/" +object_info[0]+ "/" +object_info[4] + '</td></tr>'
                                    +"<tr><th>Full Type</th><td>"+typeLink+'</td></tr>'
                                    +"<tr><th>Saved by</th><td>"+object_info[5]+'</td></tr>'
                                    +metadataText
                                    +"</table>"
                                    );
            
            var $toggleAdvancedViewBtn = $('<span>').addClass('btn-xs')
                                            .html('<span class="glyphicon glyphicon-plus" style="color:#999" aria-hidden="true"/>')
                                            .mouseenter(function(){$(this).addClass('btn btn-default');})
                                            .mouseleave(function(){$(this).removeClass('btn btn-default');})
                                            .on('click',function() {
                                                var $more = $(this).closest(".kb-data-list-obj-row").find(".kb-data-list-more-div");
                                                if ($more.is(':visible')) {
                                                    $more.hide();
                                                    $(this).html('<span class="glyphicon glyphicon-plus" style="color:#999" aria-hidden="true" />');
                                                } else {
                                                    $more.show();
                                                    $(this).html('<span class="glyphicon glyphicon-minus" style="color:#999" aria-hidden="true" />');
                                                    
                                                }
                                            });
            
            var $mainDiv  = $('<div>').addClass('col-md-10 kb-data-list-info').css({padding:'0px',margin:'0px'})
                                .append($('<div>').append($('<table>').css({'width':'100%'})
                                        .append($('<tr>')
                                                .append($('<td>')
                                                    .append($name).append($version).append('<br>')
                                                    .append($type).append('<br>').append($date))
                                                .append($('<td>').css({'vertical-align':'bottom','text-align':'right'})
                                                    .append($toggleAdvancedViewBtn)))));
        
            var $row = $('<div>').addClass('row kb-data-list-obj-row')
                            .append($logoDiv)
                            .append($mainDiv)
                            .append($moreRow)
                            .mouseenter(function(){$(this).addClass('kb-data-list-obj-row-hover');})
                            .mouseleave(function(){$(this).removeClass('kb-data-list-obj-row-hover');});
            
            return $row;
        },
        
        
        renderList: function() {
            var self = this;
            self.$loadingDiv.show();
            self.$mainListDiv.children().detach();
            if (self.objectList.length>0) {
                for(var i=0; i<self.objectList.length; i++) {
                    self.$mainListDiv.append(self.objectList[i].$div);
                    // if more than a certain number, don't show them all
                    if (i>self.options.max_objs_to_render) {
                        self.$mainListDiv.append($('<div>').append(' '+(self.objectList.length-self.options.max_objs_to_render)+' more...'));
                        break;
                    }
                }
            } else {
                // todo: show an upload button or some other message
            }
            self.$loadingDiv.hide();
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
            var $upOrDown = $('<button class="btn btn-default btn-xs" type="button">').css({'margin-left':'5px'})
                                .append('<span class="glyphicon glyphicon-sort"aria-hidden="true" />')
                                .on('click',function() {
                                    self.reverseData();
                                });
            
            var $sortByGroup = $('<div data-toggle="buttons">')
                                    .addClass("btn-group btn-group-xs")
                                    .css({"margin":"2px"})
                                    .append($byDate)
                                    .append($byName)
                                    .append($byType);
            
            var $addDataBtn = $('<button>')
                                .addClass("btn btn-success")
                                .append('<span class="glyphicon glyphicon-plus" style="color:#fff" aria-hidden="true" /> Add Data')
                                .on('click',function() {
                                    self.trigger('toggleSidePanelOverlay.Narrative');
                                });
            
            self.$controllerDiv.append(
                $('<div>').addClass('row').css({'margin':'5px'})
                    .append($('<div>').addClass('col-xs-7').css({'margin':'0px','padding':'0px'})
                        .append("<div><small>sort by: </small></div>")
                        .append($sortByGroup)
                        .append($upOrDown))
                    .append($('<div>').addClass('col-xs-5').css({'margin':'0px','padding':'0px','text-align':'right'})
                        .append($addDataBtn)));           
            
            self.$searchInput = $('<input type="text">')
                                    .addClass('form-control')
                                    .on("input change blur",function() { self.search(); });
            var $searchDiv = $('<div>').addClass("input-group").css({'margin-bottom':'10px'})
                                .append(self.$searchInput)
                                .append($("<span>").addClass("input-group-addon")
                                            .append($("<span>")
                                                .addClass("glyphicon glyphicon-search")
                                                .css({'cursor':'pointer'})
                                                .on('click',function() {
                                                        self.search();
                                                    })  ));    
            self.$controllerDiv.append($searchDiv);
        },
        
        reverseData: function() {
            var self = this;
            if (!self.objectList) { return; }
            self.objectList.reverse();
            self.renderList();
            if(self.$searchInput.val().trim().length>0) {
                self.search();  // always refilter on the search term search if there is something there
            }
        },
        
        sortData: function(sortfunction) {
            var self = this;
            if (!self.objectList) { return; }
            //should add spinning wait bar .... doesn't really work because js is single threaded...
            //self.$loadingDiv.show();
            
            // start it off separately so we don't block
            //setTimeout(function() {
                self.objectList.sort(sortfunction);
                self.renderList();
                if(self.$searchInput.val().trim().length>0) {
                    self.search();  // always refilter on the search term search if there is something there
                }
            //}, 0);
        },
        
        search: function(term) {
            var self = this;
            if (!self.objectList) { return; }
            
            if (!term && self.$searchInput) {
                term = self.$searchInput.val();
            }
            
            if (term.trim().length>0) {
                
                // todo: should show searching indicator (could take several seconds if there is a lot of data)
                
                term = term.replace('.','\\.');  // dots are common in names, so don't match anything!! escape them
                var regex = new RegExp(term, 'i');
                
                
                if (self.objectList.length<self.options.max_objs_to_render) {
                    for(var k=0; k<self.objectList.length; k++) {
                        // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                        // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                        // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                        // [9] : int size // [10] : usermeta meta
                        var match = false;
                        var info = self.objectList[k].info;
                        if (regex.test(info[1])) { match = true; }
                        else if (regex.test(info[2])) { match = true; }
                        
                        if (match) { self.objectList[k].$div.show(); }
                        else { self.objectList[k].$div.hide(); }
                    }
                } else {
                    // then we do something stupid and remove them all and readd them - should refactor for performance later
                    self.$loadingDiv.show();
                    self.$mainListDiv.empty();
                    var n_matches = 0;
                    for(var k=0; k<self.objectList.length; k++) {
                        // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                        // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                        // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                        // [9] : int size // [10] : usermeta meta
                        var match = false;
                        var info = self.objectList[k].info;
                        if (regex.test(info[1])) { match = true; }
                        else if (regex.test(info[2])) { match = true; }
                        
                        if (match) {
                            self.$mainListDiv.append(self.objectList[k].$div);
                            self.objectList[k].$div.show();
                            n_matches++;
                        }
                        if (n_matches > self.options.max_objs_to_render) {
                            self.$mainListDiv.append($('<div>').append(' '+(n_matches-self.options.max_objs_to_render)+' more...'));
                            break;
                        }
                        
                    }
                    self.$loadingDiv.hide();
                } 
            } else {
                // no search, so show all
                if (self.objectList.length<self.options.max_objs_to_render) {
                    for(var k=0; k<self.objectList.length; k++) {
                        self.objectList[k].$div.show();
                    }
                } else {
                    self.renderList();
                }
            }
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
            
            if (type.length>0) {
                // pick one based on the first character
                return colors[ (type.charCodeAt(0)%colors.length) ];
            } else {
                return colors[0];
            }
            
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
                return "hours ago";
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
        }
        

    })

})(jQuery);
