/**
 * A decompartmentalized data table widget, factored out of the kbaseNarrativeDataPanel widget.
 * This is just a fancy datatables object that shows a single column (data id), with clickable buttons
 * that will trigger a dataInfoClicked.Narrative event.
 * It also has a Select element that allows the user to filter on object type, similar to the 
 * Workspace browser.
 * 
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeDataList',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            ws_name: null
        },

        ws_name: null,
        ws: null,
        
        
        $searchInput: null,
        $addDataButton:null,
        $controllerDiv: null,
        $mainListDiv:null,
        
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

            //console.log(this);
            
            this.$controllerDiv = $('<div>');
            this.$elem.append(this.$controllerDiv);
            this.renderController();
            this.$mainListDiv = $('<div>').css({'overflow-x' : 'hidden', 'overflow-y':'auto', 'height':'290px'});
            this.$elem.append(this.$mainListDiv);
            
            if (this._attributes.auth) {
                this.ws = new Workspace("https://kbase.us/services/ws", this._attributes.auth);
            }
            if(options.ws_name) { this.ws_name = "wstester1:home"; }
            this.reloadWsData();
            
            return this;
        },
        
        obj_list : [],
        
        setWorkspace : function(ws_name) {
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
                    // [0] : obj_id objid
                    // [1] : obj_name name
                    // [2] : type_string type
                    // [3] : timestamp save_date
                    // [4] : int version
                    // [5] : username saved_by
                    // [6] : ws_id wsid
                    // [7] : ws_name workspace
                    // [8] : string chsum
                    // [9] : int size
                    // [10] : usermeta meta
                    
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
                    self.objectList.sort(function(a,b) {
                            if (a.info[3] > b.info[3]) return -1; // sort by date
                            if (a.info[3] < b.info[3]) return 1;  // sort by date
                            return 0;
                        });
                    
                    self.renderList();
                    
                }, 
                function(error) {
                    console.log(error);
                });
            }
        },
        
        
        renderObjectRowDiv: function(object_info) {
            
            // object_info:
            // [0] : obj_id objid
            // [1] : obj_name name
            // [2] : type_string type
            // [3] : timestamp save_date
            // [4] : int version
            // [5] : username saved_by
            // [6] : ws_id wsid
            // [7] : ws_name workspace
            // [8] : string chsum
            // [9] : int size
            // [10] : usermeta meta
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
                                /*padding:'5px',
                                margin:'5px',
                                'background-color':'red',
                                'border-radius': '6px',
                                'font-weight': 'bold',
                                'font-size': '14pt',
                                'line-height': '15px',
                                'color': '#fff'*/
                            })
                            .append(type.substring(0,1));
            
            var text = '&nbsp<b>'+object_info[1]+'</b>&nbspv'+ object_info[4]+'<br>&nbsp&nbsp&nbsp' +type+'<br>&nbsp&nbsp&nbsp'+this.getTimeStampStr(object_info[3]);
            var $row = $('<div>').addClass('row kb-data-list-obj-row')
                            .append($('<div>').addClass('col-md-2').css({padding:'0px',margin:'0px'}).append(logo))
                            .append($('<div>').addClass('col-md-10').css({padding:'0px',margin:'0px'}).append(text));
            
            return $row;
        },
        
        
        renderList: function() {
            var self = this;
            self.$mainListDiv.empty();
            if (self.objectList.length>0) {
                for(var i=0; i<self.objectList.length; i++) {
                    self.$mainListDiv.append(self.objectList[i].$div);
                }
            } else {
                
            }
        },
        
        renderController: function() {
            var self = this;
            
            var $byDate = $('<label class="btn btn-default active">').addClass('btn btn-default active')
                                .append($('<input type="radio" name="options" id="option1" autocomplete="off" checked>'))
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
            
            var $sortByGroup = $('<div data-toggle="buttons">')
                                    .addClass("btn-group btn-group-xs")
                                    .css({"margin":"3px"})
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
                    .append($('<div>').addClass('col-xs-6').css({'margin':'0px','padding':'0px'})
                        .append("<small>sort by: </small>")
                        .append($sortByGroup))
                    .append($('<div>').addClass('col-xs-6').css({'margin':'0px','padding':'0px','text-align':'right'})
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
        
        sortData: function(sortfunction) {
            var self = this;
            if (!self.objectList) { return; }
            //should add spinning wait bar ....
            
            self.objectList.sort(sortfunction);
            self.renderList();
            
        },
        
        search: function(term) {
            var self = this;
            if (!self.objectList) { return; }
            
            if (!term && self.$searchInput) {
                term = self.$searchInput.val();
            }
            
            if (term.trim().length>0) {
                term = term.replace('.','\\.');  // dots are common in names, so don't match anything!! escape them
                var regex = new RegExp(term, 'i');
                
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
                // no search, so show all
                for(var k=0; k<self.objectList.length; k++) {
                    self.objectList[k].$div.show();
                }
            }
        },
        
        
        
        logoColorLookup:function(character) {
            var colors = [
                            '#d73027',
                            '#f46d43',
                            '#fdae61',
                            '#fee090',
                            '#e0f3f8',
                            '#abd9e9',
                            '#74add1',
                            '#4575b4'
                         ];
            if (character.length>0) {
                return colors[ (character.charCodeAt(0)%colors.length) ];
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
            this.$dataSelect.empty();
            if (!data || data.length === 0)
                return;

            // Add an 'all types' filter option that just shows everything.
            this.$dataSelect.append('<option value="">All Types</option>');

            var dataList = [];
            var dataKeys = Object.keys(data);
            // The types to be filtered should be alphabetically sorted
            dataKeys.sort();
            $.each(dataKeys, $.proxy(function(idx, key) {
                this.$dataSelect.append($('<option>')
                                          .attr('value', key)
                                          .append(key + ' (' + data[key].length + ')'));
                // Just grab everything from each type and throw it into the dataList array
                dataList = dataList.concat(data[key]);
            }, this));

            this.$dataTable.fnClearTable();
            this.$dataTable.fnAddData(dataList);
            // Once the table's rendered, we can bind the click events.
            // This would be trickier if we were paginating the table. But we're not!
            this.$dataTable.find('.kb-function-help').click(
                $.proxy(function(event) {
                    var ws = $(event.target).attr('data-ws');
                    var id = $(event.target).attr('data-id');
                    this.trigger('dataInfoClicked.Narrative', [ws, id]);
                }, 
                this)
            );
            this.$dataTable.find('[data-toggle="tooltip"]').tooltip({'placement':'right', container: 'body'});
        },

        // quick fix to adjust column header width on refresh.
        // should be called after it's rendered in the browser.
        poke: function() {
            this.$dataTable.fnAdjustColumnSizing();
        }
    })

})(jQuery);
