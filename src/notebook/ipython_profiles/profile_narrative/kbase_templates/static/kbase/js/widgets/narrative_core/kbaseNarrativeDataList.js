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
            default_landing_page_url: "/functional-site/#/json/", // ws_name/obj_name,

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

            max_name_length:33,
            refresh_interval:30000,

            parentControlPanel: null
        },

        // private variables
        mainListPanelHeight : '340px',

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
        mainListId:null,
        $loadingDiv:null,

        methClient: null,

        obj_list : [],
        obj_data : {}, // old style - type_name : info

        my_user_id: null,

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
            this.mainListId=this.genUUID();
            this.$mainListDiv = $('<div id='+this.mainListId+'>')
                .css({'overflow-x' : 'hidden', 'overflow-y':'auto', 'height':this.mainListPanelHeight })
                .on('scroll', function() {
                    if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                        self.renderMore();
                    }
                });

            this.$addDataButton = $('<span>').addClass('kb-data-list-add-data-button fa fa-plus fa-2x')
                                    .css({'position':'absolute', bottom:'15px', right:'25px', 'z-index':'5'})
                                    .click(function() {
                                        self.trigger('hideGalleryPanelOverlay.Narrative');
                                        self.trigger('toggleSidePanelOverlay.Narrative', self.options.parentControlPanel.$overlayPanel);
                                    });
            var $mainListDivContainer = $('<div>').css({'position':'relative'})
                                            .append(this.$mainListDiv)
                                            .append(this.$addDataButton.hide());
            this.$elem.append($mainListDivContainer);

            if (window.kbconfig === undefined || window.kbconfig.urls === undefined ||
                window.kbconfig.icons === undefined) {
              // bail out now
              alert("Failed to load base configuration! Aborting narrative now.");
              window.location = "/"; //XXX: Need to load the error page!!
            }
            this.options.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            this.options.ws_url = window.kbconfig.urls.workspace;
            this.data_icons = window.kbconfig.icons.data;
            this.icon_colors = window.kbconfig.icons.colors;



            if (this._attributes.auth) {
                this.ws = new Workspace(this.options.ws_url, this._attributes.auth);
            }
            setInterval(function(){self.refresh();}, this.options.refresh_interval); // check if there is new data every X ms

            // listener for refresh
            $(document).on('updateDataList.Narrative', function() {
                self.refresh()
            })

            this.showLoading();
            if (this.options.ws_name) {
                this.setWorkspace(this.options.ws_name);
            }

            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);

            return this;
        },

        setWorkspace : function(ws_name) {
            this.ws_name = ws_name;
            //this.ws_name = "janakacore"; // for testing a bigish workspace
            //this.ws_name = "KBasePublicGenomesV4"; // for testing a very big workspace
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
                                self.ws_last_update_timestamp = workspace_info[3];
                                self.ws_obj_count = workspace_info[4];
                                self.reloadWsData();
                            } else {
                                //console.log('updating times');
                                self.refreshTimeStrings();
                            }
                        } else {
                            self.ws_last_update_timestamp = workspace_info[3];
                            self.ws_obj_count = workspace_info[4];
                            self.reloadWsData();
                        }
                    },
                    function(error) {
                        console.error(error);

                        self.$mainListDiv.show();
                        self.$mainListDiv.empty();
                        self.$mainListDiv.append($('<div>').css({'color':'#F44336','margin':'10px'})
                                                 .append('Error: '+error.error.message));
                        self.hideLoading();
                    });
            }
            else {
              // XXX: We should probably DO something
              var where = "kbaseNarrativeDataList.refresh";
              if (!self.ws) {
                KBError(where, "workspace not connected");
              }
              else {
                KBError(where, "workspace name is empty");
              }
            }
        },

        refreshSpecificObject: function() {

        },

        refreshTimeStrings: function() {
            var self = this; var newTime; var oldTime;
            if (self.objectList) {
                for(var i=0; i<self.objectList.length; i++) {
                    if(self.objectList[i].$div) {
                        newTime = self.getTimeStampStr(self.objectList[i].info[3]);
                        oldTime = self.objectList[i].$div.find('.kb-data-list-date').text();
                        if (newTime !== oldTime) {
                            self.objectList[i].$div.find('.kb-data-list-date').text(newTime);
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
                    //BUT WHATEVER YOU DO PLEASE REMEMBER TO USE CAPITAL LETTERS EXTENSIVELY
                    //OTHERWISE PEOPLE MIGHT NOT NOTICE WHAT YOU ARE SAYING AND THAT WOULD
                    //BE EXTREMELY ANNOYING!!!! SERIOUSLY!!!
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
                    console.error(error);
                    KBError("kbaseNarrativeDataList.getNextDataChunk",
                            error.error.message);
                    self.$mainListDiv.show();
                    self.$mainListDiv.empty();
                    self.$mainListDiv.append($('<div>').css({'color':'#F44336','margin':'10px'})
                                             .append('Error: '+error.error.message));
                    self.hideLoading();
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

        $currentSelectedRow : null,
        selectedObject: null,
        setSelected: function($selectedRow, object_info) {
            var self = this;
            if (self.$currentSelectedRow) {
                self.$currentSelectedRow.removeClass('kb-data-list-obj-row-selected');
            }
            if (object_info[0]===self.selectedObject) {
                self.$currentSelectedRow = null;
                self.selectedObject = null;
                self.trigger('removeFilterMethods.Narrative');
            } else {
                $selectedRow.addClass('kb-data-list-obj-row-selected');
                self.$currentSelectedRow = $selectedRow;
                self.selectedObject = object_info[0];
                self.trigger('filterMethods.Narrative','type:'+object_info[2].split('-')[0].split('.')[1]);
            }
        },


        addDataControls: function(object_info, $alertContainer) {
            var self = this;
            var $btnToolbar = $('<span>')
                                        .addClass('btn-toolbar')
                                        .attr('role', 'toolbar');

            var btnClasses = "btn btn-xs btn-default";
            var css = {'color':'#888'};

                                /*.append($('<div>').css({'text-align':'center','margin':'5pt'})
                                            .append('<a href="'+landingPageLink+'" target="_blank">'+
                                                        'explore data</a>&nbsp&nbsp|&nbsp&nbsp')
                                            .append('<a href="'+this.options.landing_page_url+'objgraphview/'+object_info[7] +'/'+object_info[1] +'" target="_blank">'+
                                                        'view provenance</a><br>'))*/

            var $openLandingPage = $('<span>')
                                        .tooltip({title:'Explore data', 'container':'#'+this.mainListId})
                                        .addClass(btnClasses)
                                        .append($('<span>').addClass('fa fa-binoculars').css(css))
                                        .click(function(e) {
                                            e.stopPropagation(); $alertContainer.empty();
                                            var typeTokens = object_info[2].split('-')[0].split('.');
                                            var landingPageLink = self.options.default_landing_page_url +object_info[7]+ '/' + object_info[1];
                                            if (self.ws_landing_page_map) {
                                                if (self.ws_landing_page_map[typeTokens[0]]) {
                                                    if (self.ws_landing_page_map[typeTokens[0]][typeTokens[1]]) {
                                                        landingPageLink = self.options.landing_page_url +
                                                            self.ws_landing_page_map[typeTokens[0]][typeTokens[1]] + "/" +
                                                            object_info[7]+ '/' + object_info[1];
                                                    }
                                                }
                                            }
                                            window.open(landingPageLink);
                                        });

            var $openHistory = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'View history to revert changes', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-history').css(css))
                                        .click(function(e) {
                                            e.stopPropagation(); $alertContainer.empty();

                                            if (self.ws_name && self.ws) {
                                                self.ws.get_object_history({ref:object_info[6]+"/"+object_info[0]},
                                                    function(history) {
                                                        $alertContainer.append($('<div>')
                                                            .append($('<button>').addClass('kb-data-list-cancel-btn')
                                                                        .append('Hide History')
                                                                        .click(function() {$alertContainer.empty();} )));
                                                        history.reverse();
                                                        var $tbl = $('<table>').css({'width':'100%'});
                                                        for(var k=0; k<history.length;k++) {
                                                            var $revertBtn = $('<button>').append('v'+history[k][4]).addClass('kb-data-list-btn');
                                                            if (k==0) {
                                                                $revertBtn.tooltip({title:'Current Version', 'container':'body',placement:'bottom'});
                                                            } else {
                                                                var revertRef = {wsid:history[k][6], objid:history[k][0], ver:history[k][4]};
                                                                (function(revertRefLocal) {
                                                                    $revertBtn.tooltip({title:'Revert to this version?', 'container':'body',placement:'bottom'})
                                                                        .click(function() {
                                                                            self.ws.revert_object(revertRefLocal,
                                                                                function(reverted_obj_info) {
                                                                                    self.refresh();
                                                                                }, function(error) {
                                                                                    console.error(error);
                                                                                    $alertContainer.empty();
                                                                                    $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                                                                                });
                                                                        }); })(revertRef);
                                                            }
                                                            $tbl.append($('<tr>')
                                                                        .append($('<td>').append($revertBtn))
                                                                        .append($('<td>').append('Saved by '+history[k][5]+'<br>'+self.getTimeStampStr(history[k][3])))
                                                                        .append($('<td>').append($('<span>').css({margin:'4px'}).addClass('fa fa-info pull-right'))
                                                                                 .tooltip({title:history[k][2]+'<br>'+history[k][8]+'<br>'+history[k][9]+' bytes', container:'body',html:true,placement:'bottom'}))
                                                                                );
                                                        }
                                                        $alertContainer.append($tbl);
                                                    },
                                                    function(error) {
                                                        console.error(error);
                                                        $alertContainer.empty();
                                                        $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                                                    });
                                            }


                                        });

            var $openProvenance = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'View data provenance and relationships', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-sitemap fa-rotate-90').css(css))
                                        .click(function(e) {
                                            e.stopPropagation(); $alertContainer.empty();
                                            window.open(self.options.landing_page_url+'objgraphview/'+object_info[7]+'/'+object_info[1]);
                                        });
            var $download = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'Export / Download data', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-download').css(css))
                                        .click(function(e) {
                                            e.stopPropagation(); $alertContainer.empty();
                                            var type = object_info[2].split('-')[0];
                                            var wsId = object_info[7];
                                            var objId = object_info[1];
                                            var downloadPanel = $('<div>');
                                            $alertContainer.append(downloadPanel);
                                            downloadPanel.kbaseNarrativeDownloadPanel({token: self._attributes.auth.token, type: type, wsId: wsId, objId: objId});
                                        });

            var $rename = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'Rename data', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-font').css(css))
                                        .click(function(e) {
                                            e.stopPropagation(); $alertContainer.empty();
                                            var $newNameInput = $('<input type="text">').addClass('form-control').val(object_info[1]);
                                            $alertContainer.append($('<div>')
                                                .append($('<div>').append("Warning: Apps using the old name may break."))
                                                .append($('<div>').append($newNameInput))
                                                .append($('<button>').addClass('kb-data-list-btn')
                                                            .append('Rename')
                                                            .click(function() {
                                                                if (self.ws_name && self.ws) {
                                                                    self.ws.rename_object({
                                                                            obj: {ref:object_info[6]+"/"+object_info[0]},
                                                                            new_name: $newNameInput.val()
                                                                        },
                                                                        function(renamed_info) {
                                                                            self.refresh();
                                                                        },
                                                                        function(error) {
                                                                            console.error(error);
                                                                            $alertContainer.empty();
                                                                            $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                                                                        });
                                                                }
                                                            }))
                                                .append($('<button>').addClass('kb-data-list-cancel-btn')
                                                            .append('Cancel')
                                                            .click(function() {$alertContainer.empty();} )));
                                        });
            var $delete = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'Delete data'})
                                        .append($('<span>').addClass('fa fa-trash-o').css(css))
                                        .click(function(e) {
                                            e.stopPropagation();
                                            $alertContainer.empty();
                                            $alertContainer.append($('<div>')
                                                .append($('<span>').append('Are you sure?'))
                                                .append($('<button>').addClass('kb-data-list-btn')
                                                            .append('Delete')
                                                            .click(function() {
                                                                if (self.ws_name && self.ws) {
                                                                    self.ws.rename_object({
                                                                            obj: {ref:object_info[6]+"/"+object_info[0]},
                                                                            new_name: object_info[1].split('-deleted-')[0] + "-deleted-"+(new Date()).getTime()
                                                                        },
                                                                        function(renamed_info) {
                                                                            self.ws.delete_objects([{ref:object_info[6]+"/"+object_info[0]}],
                                                                                function() {
                                                                                    self.refresh();
                                                                                },
                                                                                function(error) {
                                                                                    console.error(error);
                                                                                    $alertContainer.empty();
                                                                                    $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                                                                                });
                                                                        },
                                                                        function(error) {
                                                                            console.error(error);
                                                                            $alertContainer.empty();
                                                                            $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                                                                        });
                                                                }
                                                            }))
                                                .append($('<button>').addClass('kb-data-list-cancel-btn')
                                                            .append('Cancel')
                                                            .click(function() {$alertContainer.empty();} )));
                                        });

            $btnToolbar
                .append($openLandingPage)
                .append($openHistory)
                .append($openProvenance)
                .append($download)
                .append($rename)
                .append($delete);

            return $btnToolbar;
        },


        renderObjectRowDiv: function(object_info, object_key) {
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
            var icons = this.data_icons;
            var icon = _.has(icons, type) ? icons[type] : icons['DEFAULT'];
            var icon_cls = icon.join(' ');
            var $logo = $('<div>')
              // background circle
              .addClass("fa-stack fa-2x").css({'cursor':'pointer'})
              .append($('<i>')
                .addClass("fa fa-circle fa-stack-2x")
                .css({'color':this.logoColorLookup(type)}));
            // add stack of font-awesome icons
            _.each(icon, function(cls) {
              $logo.append($('<i>')
                .addClass("fa fa-inverse fa-stack-1x " + cls));
            });
            // add behavior
            $logo.click(function(e) {
                e.stopPropagation();
                self.insertViewer(object_key);
            });

            var shortName = object_info[1]; var isShortened=false;
            if (shortName.length>this.options.max_name_length) {
                shortName = shortName.substring(0,this.options.max_name_length-3)+'...';
                isShortened=true;
            }
            var $name = $('<span>').addClass("kb-data-list-name").append(shortName)
                            .css({'cursor':'pointer'})
                            .click(function(e) {
                                e.stopPropagation();
                                self.insertViewer(object_key);
                            });
            if (isShortened) { $name.tooltip({title:object_info[1], placement:'bottom', delay: { show: 750, hide: 0 } }); }

            var $version = $('<span>').addClass("kb-data-list-version").append('v'+object_info[4]);
            var $type = $('<span>').addClass("kb-data-list-type").append(type);

            var $date = $('<span>').addClass("kb-data-list-date").append(this.getTimeStampStr(object_info[3]));
            var $byUser = $('<span>').addClass("kb-data-list-edit-by");
            if (object_info[5] !== self.my_user_id) {
                $byUser.append(' by '+object_info[5])
                    .click(function(e) {
                        e.stopPropagation();
                        window.open(self.options.landing_page_url+'people/'+object_info[5]);
                    });
            }
            var metadata = object_info[10];
            var metadataText = '';
            for(var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    metadataText += '<tr><th>'+ key +'</th><td>'+ metadata[key] + '</td></tr>';
                }
            }
            if (type==='Genome') {
                if (metadata.hasOwnProperty('Name')) {
                    $type.text(type+': '+metadata['Name']);
                }
            }

            var $savedByUserSpan = $('<td>').addClass('kb-data-list-username-td');
            this.displayRealName(object_info[5],$savedByUserSpan);

            var $alertDiv = $('<div>').css({'text-align':'center','margin':'10px 0px'});
            var typeLink = '<a href="'+this.options.landing_page_url+'spec/module/'+type_module+'" target="_blank">' +type_module+"</a>.<wbr>" +
                           '<a href="'+this.options.landing_page_url+'spec/type/'+object_info[2]+'" target="_blank">' +(type_tokens[1].replace('-','&#8209;')) + '.' + type_tokens[2] + '</a>';
            var $moreRow  = $('<div>').addClass("kb-data-list-more-div").hide()
                                .append($('<div>').css({'text-align':'center','margin':'5pt'})
                                            .append(self.addDataControls(object_info,$alertDiv)).append($alertDiv))
                                .append(
                                    $('<table style="width:100%;">')
                                        .append("<tr><th>Permament Id</th><td>" +object_info[6]+ "/" +object_info[0]+ "/" +object_info[4] + '</td></tr>')
                                        .append("<tr><th>Full Type</th><td>"+typeLink+'</td></tr>')
                                        .append($('<tr>').append('<th>Saved by</th>').append($savedByUserSpan))
                                        .append(metadataText));

            var $toggleAdvancedViewBtn = $('<span>').addClass("kb-data-list-more")//.addClass('btn btn-default btn-xs kb-data-list-more-btn')
                .hide()
                .html('<span class="fa fa-ellipsis-h" style="color:#999" aria-hidden="true"/>');
            var toggleAdvanced = function() {
                    if (self.selectedObject == object_info[0] && $moreRow.is(':visible')) {
                        // assume selection handling occurs before this is called
                        // so if we are now selected and the moreRow is visible, leave it...
                        return;
                    }
                    if ($moreRow.is(':visible')) {
                        $moreRow.slideUp('fast');
                        $toggleAdvancedViewBtn.show();
                    } else {
                        self.getRichData(object_info,$moreRow);
                        $moreRow.slideDown('fast');
                        $toggleAdvancedViewBtn.hide();
                    }
                };

            var $mainDiv  = $('<div>').addClass('kb-data-list-info').css({padding:'0px',margin:'0px'})
                                .append($name).append($version).append('<br>')
                                .append($type).append('<br>').append($date).append($byUser)
                                .append($toggleAdvancedViewBtn)
                                .click(
                                    function() {
                                        self.setSelected($(this).closest('.kb-data-list-obj-row'),object_info);
                                        toggleAdvanced();
                                    });

            var $topTable = $('<table>').attr('kb-oid', object_key)
                             .css({'width':'100%','background':'#fff'})  // set background to white looks better on DnD
                             .append($('<tr>')
                                     .append($('<td>')
                                             .css({'width':'15%'})
                                             .append($logo))
                                     .append($('<td>')
                                             .append($mainDiv)));

            var $row = $('<div>').addClass('kb-data-list-obj-row')
                            .append($('<div>').addClass('kb-data-list-obj-row-main')
                                        .append($topTable))
                            .append($moreRow)
                            // show/hide ellipses on hover, show extra info on click
                            .mouseenter(function(){
                                if (!$moreRow.is(':visible')) { $toggleAdvancedViewBtn.show(); }
                            })
                            .mouseleave(function(){ $toggleAdvancedViewBtn.hide(); });


            // Drag and drop
            this.addDragAndDrop($topTable);

            var $rowWithHr = $('<div>')
                                .append($('<hr>')
                                            .addClass('kb-data-list-row-hr')
                                            .css({'margin-left':'65px'}))
                                .append($row);

            return $rowWithHr;
        },

        // ============= DnD ==================

        addDragAndDrop: function($row) {

            var self = this;

            // Add data drag-and-drop (jquery-ui)
            // allow data element to visually leave the left column
            //$('#left-column').css('overflow', 'visible');
            $row.draggable({
                cursor: 'move',
                containment: '#main-container',
                helper: function() {
                            var w = $row.width(); // get orig. width
                            var $elt = $row.clone();
                            $elt.addClass("kb-data-inflight");
                            // append to root container, to help with z-index
                            $("#notebook-container").prepend($elt);
                            // reset width (was: 100%)
                            $elt.width(w);
                            return $elt; }
                //start: this.dataDragged
            });

            // Dropping data directly onto the notebook. (As opposed to on input fields)
            $('#notebook-container').droppable({
                drop: function(event, ui) {
                    var $elt = $(ui.draggable);
                    // Insert cell onto narrative canvas near drop point:
                    // (a) find nearest cell using 'jquery-nearest'
                    var $near_elt = $($elt.nearest('.cell'));
                    var near_idx = 0;
                    if ($near_elt == null || $near_elt.data() == null) {
                      // no cell found, so place at top
                    }
                    else {
                      // (b) map that cell back to an index
                      near_idx = IPython.notebook.find_cell_index($near_elt.data().cell);
                    }
                    // var cell = IPython.notebook.insert_cell_at_index('markdown', near_idx);
                    // // Add unique id attr. to cell
                    // var cell_id = self.genUUID();
                    // cell.rendered = false;
                    // cell.set_text('<div id="' + cell_id + '">&nbsp;</div>');
                    // cell.render();
                    // // Get object info
                    var key = $elt.attr('kb-oid');
                    var obj = _.findWhere(self.objectList, {key: key});
                    console.debug('drag-n-drop: key=' + key, obj);
                    var info = self.createInfoObject(obj.info);
                    // // Insert the narrative data cell into the div we just rendered
                    // $('#' + cell_id).kbaseNarrativeDataCell({cell: cell, info: info});
                    self.trigger('createViewerCell.Narrative', {
                        'nearCellIdx': near_idx,
                        'widget': 'kbaseNarrativeDataCell',
                        'info' : info
                    });
                }
            });

            // Add tooltip to indicate this functionality
            $row.attr({'data-toggle': 'tooltip',
                       'data-placement': 'top',
                        'title': 'Drag onto narrative &rarr;'});
            $row.tooltip({delay: { show: 1500, hide: 0 }, html: true});

            return this;
        },

        /**
         * Helper function to create named object attrs from
         * list of fields returned from Workspace service.
         */
        createInfoObject: function(info) {
          return _.object(['id', 'name', 'type', 'save_date', 'version',
                           'saved_by', 'ws_id', 'ws_name', 'chsum', 'size',
                           'meta'], info);
        },

        // ============= end DnD ================

        insertViewer: function(key) {
            var self = this;
            var cell = IPython.notebook.get_selected_cell();
            var near_idx = 0;
            if (cell) {
            	near_idx = IPython.notebook.find_cell_index(cell);
            	$(cell.element).off('dblclick');
            	$(cell.element).off('keydown');
            }
            console.log(cell, near_idx);

            //var cell_id = self.genUUID();
            //cell.rendered = false;
            //cell.set_text('<div id="' + cell_id + '">&nbsp;</div>');
            //cell.render();

            var obj = _.findWhere(self.objectList, {key: key});
            var info = self.createInfoObject(obj.info);
            // Insert the narrative data cell into the div we just rendered
            //$('#' + cell_id).kbaseNarrativeDataCell({cell: cell, info: info});
            self.trigger('createViewerCell.Narrative', {
                'nearCellIdx': near_idx,
                'widget': 'kbaseNarrativeDataCell',
                'info' : info
            });

        },

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
                        if (self.objectList[i].key == undefined) {
                            self.objectList[i].key = self.genUUID();
                        }
                        self.attachRow(i);
                    }
                    //console.log('showing '+ self.n_objs_rendered + ' of ' + self.objectList.length);
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
                    //console.log('showing '+ self.n_filteredObjsRendered + ' of ' + self.currentMatch.length + ' objs matching search filter');
                }
            }
        },

        attachRow: function(index) {
            var obj = this.objectList[index];
            if (obj.attached) { return; }
            if (obj.$div) {
                this.$mainListDiv.append(obj.$div);
            } else {
                obj.$div = this.renderObjectRowDiv(obj.info, obj.key);
                this.$mainListDiv.append(obj.$div);
            }
            obj.attached = true;
            this.n_objs_rendered++;
        },

        attachRowElement: function(row) {
            if (row.attached) { return; } // return if we are already attached
            if (row.$div) {
                this.$mainListDiv.append(row.$div);
            } else {
                row.$div = this.renderObjectRowDiv(row.info, row.key);
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
                for(var i=0; i < self.objectList.length; i++) {
                    // only show up to the given number
                    if (i >= self.options.objs_to_render_to_start) {
                        self.n_objs_rendered = i;
                        break;
                    }
                    // If object does not have a key, define one.
                    // This will be used for 'id' of rendered element.
                    // But do *not* replace an existing key.
                    if (self.objectList[i].key == undefined) {
                        self.objectList[i].key = self.genUUID();
                    }
                    self.attachRow(i);
                }
                this.$addDataButton.show();
            } else {
                // todo: show an upload button or some other message if there are no elements
                self.$mainListDiv.append($('<div>').css({'text-align':'center','margin':'20pt'})
                                         .append("This Narrative has no data yet.<br><br>")
                                         .append($("<span>").append('Add Data').addClass('btn btn-lg kb-data-list-add-data-text-button')
                                                 .click(function() {
                                                        self.trigger('hideGalleryPanelOverlay.Narrative');
                                                        self.trigger('toggleSidePanelOverlay.Narrative', self.options.parentControlPanel.$overlayPanel);
                                                    })));
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

            // var $addDataBtn = $('<button>')
            //                     .addClass("btn btn-warning kb-data-list-get-data-button")
            //                     .append('<span class="fa fa-plus" style="color:#fff" aria-hidden="true" /> Add Data')
            //                     .on('click',function() {
            //                         self.trigger('toggleSidePanelOverlay.Narrative');
            //                     });



            var $openSearch = $('<span>')
                .addClass('btn btn-xs btn-default')
                .tooltip({title:'Search data in narrative', 'container':'body', delay: { "show": 400, "hide": 50 }})
                .append('<span class="fa fa-search"></span>')
                .on('click',function() {
                    if(!self.$searchDiv.is(':visible')) {
                        self.$searchDiv.show();
                        self.$sortByDiv.hide();
                        self.$filterTypeDiv.hide();
                    } else {
                        self.$searchDiv.hide();
                    }
                });

            var $openSort = $('<span>')
                .addClass('btn btn-xs btn-default')
                .tooltip({title:'Sort data list', 'container':'body', delay: { "show": 400, "hide": 50 }})
                .append('<span class="fa fa-sort-amount-asc"></span>')
                .on('click',function() {
                    if(!self.$sortByDiv.is(':visible')) {
                        self.$sortByDiv.show();
                        self.$searchDiv.hide();
                        self.$filterTypeDiv.hide();
                    } else {
                        self.$sortByDiv.hide();
                    }
                });

            var $openFilter = $('<span>')
                .addClass('btn btn-xs btn-default')
                .tooltip({title:'Filter data by type', 'container':'body', delay: { "show": 400, "hide": 50 }})
                .append('<span class="fa fa-filter"></span>')
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
                                            self.filterByType(typeSelected);
                                        });

            self.$filterTypeDiv = $('<div>').css({'margin':'3px','margin-left':'5px','margin-bottom':'10px'})
                                .append(self.$filterTypeSelect);

            var $header = $('<div>');
            if(self.options.parentControlPanel) {
                self.options.parentControlPanel.addButtonToControlPanel($openSearch);
                self.options.parentControlPanel.addButtonToControlPanel($openSort);
                self.options.parentControlPanel.addButtonToControlPanel($openFilter);
            }
            else {
                $header.addClass('row').css({'margin':'5px'})
                    .append($('<div>').addClass('col-xs-12').css({'margin':'0px','padding':'0px','text-align':'right'})
                        .append($openSearch)
                        .append($openSort)
                        .append($openFilter))
            }


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
                var runningCount = 0;
                for(var i=0; i<types.length; i++) {
                    runningCount += self.availableTypes[types[i]].count;
                    var countStr = '';
                    if(self.availableTypes[types[i]].count==1) {
                        countStr = " (".concat(self.availableTypes[types[i]].count).concat(" object)");
                    } else {
                        countStr = " (".concat(self.availableTypes[types[i]].count).concat(" objects)");
                    }
                    self.$filterTypeSelect.append(
                        $('<option value="'+self.availableTypes[types[i]].type+'">')
                            .append(self.availableTypes[types[i]].type + countStr));
                }
                if (runningCount==1) {
                    self.$filterTypeSelect.prepend($('<option value="">').append("Show All Types ("+runningCount+" object)"));
                } else {
                    self.$filterTypeSelect.prepend($('<option value="">').append("Show All Types ("+runningCount+" objects)"));
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

                    if (!match && info[10]) { // match on metadata values
                        for(var metaKey in info[10]) {
                            if (info[10].hasOwnProperty(metaKey)) {
                                if (regex.test(info[10][metaKey])) { match = true; break; }
                                else if (regex.test(metaKey+"::"+info[10][metaKey])) {
                                    match = true; break;
                                }
                            }
                        }
                    }


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
                    $targetSpan.html(self.real_name_lookup[username]+' (<a href="'+self.options.landing_page_url+'people/'+username+'" target="_blank">'+username+"</a>)");
                } else {
                    self.real_name_lookup[username] = "..."; // set a temporary value so we don't search again
                    $targetSpan.html('<a href="'+self.options.landing_page_url+'people/'+username+'" target="_blank">'+username+"</a>");
                    $.ajax({
                            type: "GET",
                            url: self.options.user_name_fetch_url + username + "&token="+self._attributes.auth.token,
                            dataType:"json",
                            crossDomain : true,
                            success: function(data,res,jqXHR) {
                                if (username in data['data'] && data['data'][username]['fullName']) {
                                    self.real_name_lookup[username] = data['data'][username]['fullName'];
                                    $targetSpan.html(self.real_name_lookup[username]+' (<a href="'+self.options.landing_page_url+'people/'+username+'" target="_blank">'+username+"</a>)");
                                }
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                //do nothing
                            }
                        });
                }
	    }
        },

        getLandingPageMap: function() {
            this.ws_landing_page_map = window.kbconfig.landing_page_map;
        },

        /**
         * @method loggedInCallback
         * This is associated with the login widget (through the kbaseAuthenticatedWidget parent) and
         * is triggered when a login event occurs.
         * It associates the new auth token with this widget and refreshes the data panel.
         * @private
         */
        loggedInCallback: function(event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            //this.user_profile = new UserProfile(this.options.user_profile_url, auth);
            this.my_user_id = auth.user_id;
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
            this.my_user_id = null;
            this.refresh();
            return this;
        },

        logoColorLookup:function(type) {
          var code = 0;
          for (var i=0; i < type.length; code += type.charCodeAt(i++));
          return this.icon_colors[ code % this.icon_colors.length ];
        },

        // edited from: http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
        getTimeStampStr: function (objInfoTimeStamp) {
            var date = new Date(objInfoTimeStamp);
            var seconds = Math.floor((new Date() - date) / 1000);

            // f-ing safari, need to add extra ':' delimiter to parse the timestamp
            if (isNaN(seconds)) {
                var tokens = objInfoTimeStamp.split('+');  // this is just the date without the GMT offset
                var newTimestamp = tokens[0] + '+'+tokens[0].substr(0,2) + ":" + tokens[1].substr(2,2);
                date = new Date(newTimestamp);
                seconds = Math.floor((new Date() - date) / 1000);
                if (isNaN(seconds)) {
                    // just in case that didn't work either, then parse without the timezone offset, but
                    // then just show the day and forget the fancy stuff...
                    date = new Date(tokens[0]);
                    return this.monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
                }
            }

            var interval = Math.floor(seconds / 31536000);
            if (interval > 1) {
                return this.monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
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
