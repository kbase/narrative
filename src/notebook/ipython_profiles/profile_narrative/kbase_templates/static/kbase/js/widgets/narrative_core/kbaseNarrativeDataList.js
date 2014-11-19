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
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            max_objs_to_render:2000,
            max_objs_to_prevent_filter_as_you_type_in_search:2000,
            max_objs_to_prevent_initial_sort:2000
        },

        ws_name: null,
        ws: null,
        
        
        $searchInput: null,
        $addDataButton:null,
        $controllerDiv: null,
        $mainListDiv:null,
        $loadingDiv:null,
        
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
            if(options.ws_name) { this.ws_name = "wstester1:home"; }
            this.reloadWsData();
            
            return this;
        },
        
        obj_list : [],
        
        setWorkspace : function(ws_name) {
            //this.ws_name = "KBasePublicOntologies"; // for testing a bigish workspace
            this.ws_name = ws_name;
            this.reloadWsData();
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
                    
                    for (var i=0; i<infoList.length; i++) {
                        // skip narrative objects
                        if (infoList[i][2].indexOf('KBaseNarrative') == 0) { continue; }
                        self.objectList.push(
                            {
                                $div:self.renderObjectRowDiv(infoList[i]),
                                info:infoList[i]
                            }
                        );
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
                    
                }, 
                function(error) {
                    console.log(error);
                });
            }
        },
        
        
        renderObjectRowDiv: function(object_info) {
            
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            var type = object_info[2].split('.')[1].split('-')[0];
            var logo = $('<div>')
                            .css({
                                'width':'30pt',
                                'height':'30pt',
                                'color':'#fff',
                                'background-color':this.logoColorLookup(type),
                                'border-radius': '50%',
                                'border-style' : 'solid',
                                'border-width' : '1px',
                                'border-color' : '#555',
                                'text-align':'center',
                                'display':'inline-block',
                                'padding-top':'6pt',
                                'font-size':'18pt',
                                'font-weight':'bold',
                                'text-shadow': '-1px 0 #777, 0 1px #777, 1px 0 #777, 0 -1px #777'
                            })
                            .append(type.substring(0,1));
            
            var text = '&nbsp<b>'+object_info[1]+'</b>&nbspv'+ object_info[4]+'<br>&nbsp&nbsp&nbsp' +type+'<br>&nbsp&nbsp&nbsp'+this.getTimeStampStr(object_info[3]);
            var $row = $('<div>').addClass('row kb-data-list-obj-row')
                            .append($('<div>').addClass('col-md-2').css({padding:'0px',margin:'0px'}).append(logo))
                            .append($('<div>').addClass('col-md-10').css({padding:'0px',margin:'0px'}).append(text))
                            .hover(function(){$(this).toggleClass('kb-data-list-obj-row-hover');});
            
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
            /*var colors = [
                            '#d73027',
                            '#f46d43',
                            '#fdae61',
                            '#fee090',
                            '#e0f3f8',
                            '#abd9e9',
                            '#74add1',
                            '#4575b4'
                         ];*/
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
                            '#FFEB3B',  //yellow
                            '#FFC107',  //amber
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
                // pick one based
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
                    return interval + " months";
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
        },
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        

        /**
         * Sets the data to be shown in this widget.
         * @param {Object} data - this is expected to be a mapping from data type to array of data.
         * e.g.:
         * {
         *   'data_type' : [
         *                   [ 'workspace', 'object name', 'data_type' ],
         *                   [ 'workspace', 'object name', 'data_type' ],
         *                 ],
         *   'data_type2' : [
         *                    [ 'workspace', 'object name', 'data_type' ],
         *                    [ 'workspace', 'object name', 'data_type' ],
         *                  ]
         * }
         *
         * The extra 'data_type' in the elements is a little redundant, but it speeds up pre-processing
         * by allowing this widget to just dump everything in the table, and is necessary to be in the 
         * table's row for filtering (though it's currently invisible).
         * @private
         */
        setData: function(data) {
            
        }

    })

})(jQuery);
