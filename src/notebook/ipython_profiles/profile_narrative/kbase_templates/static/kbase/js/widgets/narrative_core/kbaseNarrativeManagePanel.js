/**
 * Widget to display a table of data objects from a kbase workspace.
 *
 * TODO: Re-enable "readonly" mode by following instructions in isReadonlyWorkspace()
 *       (dan g. 10/30/2014)
 *
 * Options:
 *    wsId - the name of the workspace to show in this widget
 *    loadingImage - an image to show in the middle of the widget while loading data
 *    notLoggedInMsg - a string to put in the middle of the widget when not logged in.
 *
 * Triggers events:
 * dataUpdated.Narrative - when the loaded data table gets updated.
 * workspaceUpdated.Narrative - when the current workspace ID gets updated
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @author Dan Gunter <dkgunter@lbl.gov>
 * @public
 */
(function( $, undefined ) {

    $.KBWidget({
        name: "kbaseNarrativeManagePanel", 
        parent: "kbaseNarrativeControlPanel",
        version: "1.0.0",
        wsClient: null,
        table: null,
        tableData: [],
        $loginMessage: null,
        $errorMessage: null,
        $loading: null,
        isLoggedIn: false,
        narrWs: null, /* see setNarrWS */
        // The set of all data currently loaded into the widget
        loadedData: {},
        options: {
            title: 'Manage',
            loadingImage: "static/kbase/images/ajax-loader.gif",
            ws_url: "https://kbase.us/services/ws",
            nms_url: "https://kbase.us/services/narrative_method_store/rpc",
            ws_name: null,
            nar_name: null,
        },
        
        ws:null,
        manager:null,
        
        ws_name: null,
        nar_name: null,
        
        $mainPanel: null,
        $newNarrativeLink: null, // when a new narrative is created, gives a place to link to it
        
        init: function(options) {
            this._super(options);

            if (this.options.ws_name)  { this.ws_name = options.ws_name; }
            if (this.options.nar_name) { this.nar_name = options.nar_name; }

            if (window.kbconfig && window.kbconfig.urls) {
                this.options.ws_url = window.kbconfig.urls.workspace;
                this.options.nms_url = window.kbconfig.urls.narrative_method_store;
            }
            
            this.$mainPanel = $('<div>').css({'height':'300px'});
            this.body().append(this.$mainPanel);
            
            $(document).on(
                'setWorkspaceName.Narrative', $.proxy(function(e, info) {
                    console.log('manage panel -- setting ws to ' + info.wsId);
                    this.ws_name = info.wsId;
                    this.nar_name = info.narrController;
                    this.refresh();
                }, this)
            );
            
            this.landingPageMap = window.kbconfig.landing_page_map;
            
            if (this.ws_name && this.nar_name && this.ws) {
                this.refresh();
            }
            return this;
        },

        loggedInCallback: function(event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.manager = new NarrativeManager({ws_url:this.options.ws_url, nms_url:this.options.nms_url},auth);
            this.refresh();
            return this;
        },
        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.manager=null;
            this.refresh();
            return this;
        },
        
        refresh: function() {
            if (!self.$narPanel) {
                this.renderHeader();
            }
            this.loadDataAndRenderPanel();
        },
        
        
        narData: null,
        allNarInfo:null,
        
        loadDataAndRenderPanel: function() {
            var self = this;
            if (self.ws) {
                self.narData=null;
                self.ws.list_workspace_info(
                    {excludeGlobal:1},
                    function(wsList) {
                        self.narData={
                            mine:[],
                            shared:[]
                        };
                        self.allNarData=[];
                        /*WORKSPACE INFO
                            0: ws_id id
                            1: ws_name workspace
                            2: username owner
                            3: timestamp moddate,
                            4: int object
                            5: permission user_permission
                            6: permission globalread,
                            7: lock_status lockstat
                            8: usermeta metadata*/
                        var narRefsToLookup = []; var allNarInfo = [];
                        for (var i=0; i<wsList.length; i++) {
                            if (wsList[i][8]) { // must have metadata or else we skip
                                
                                // if it is temporary, we skip
                                if (wsList[i][8].is_temporary) {
                                    if (wsList[i][8].is_temporary === 'true') {
                                        continue;
                                    }
                                }
                                //must have the new narrative tag, or else we skip
                                if (wsList[i][8].narrative) {  
                                    var info={
                                            ws_info: wsList[i],
                                            nar_info: null,
                                            $div:null
                                    };
                                    if (wsList[i][2]===self._attributes.auth.user_id) {
                                        self.allNarData.push(info);
                                        self.narData.mine.push(info);
                                        narRefsToLookup.push({ref:info.ws_info[0]+"/"+wsList[i][8].narrative});
                                    } else if (wsList[i][5]==='a' || wsList[i][5]==='w' || wsList[i][5]==='r') {
                                        self.allNarData.push(info);
                                        self.narData.shared.push(info);
                                        narRefsToLookup.push({ref:info.ws_info[0]+"/"+wsList[i][8].narrative});
                                    }
                                }
                            }
                        }
                        self.ws.get_object_info(narRefsToLookup,1,
                                function(objList) {
                                    for(var i=0; i<objList.length; i++) {
                                        self.allNarData[i].nar_info = objList[i];
                                    }
                                    console.log(self.narData);
                                    self.renderPanel();
                                },
                                function(error) {
                                    console.error(error);
                                });
                    },
                    function (error) {
                        console.error(error);
                    }
                )
            }
        },
        
        renderHeader: function() {
            var self = this;
            if (self.$mainPanel) {
                self.$mainPanel.empty();
                
                $newNarrativeLink = $("<div>").css({'margin':'10px','text-align':'center'});
                self.$mainPanel.append(
                    $('<div>').css({'margin':'15px','text-align':'center'}).append(
                        self.makeNewNarrativeBtn()).append(
                        $newNarrativeLink));
                
                self.$newNarrativeLink = $('<div>');
                self.$mainPanel.append(self.$newNarrativeLink);
                
                self.$narPanel = $('<div>');
                self.$mainPanel.append(self.$narPanel);
                self.renderPanel();
            }
        },
        
        renderPanel: function() {
            var self = this;
            if (self.$narPanel && self.narData) {
                self.$narPanel.empty();
                
                self.$narPanel.append("<h2>Mine</h2>");
                for(var k=0; k<self.narData.mine.length; k++) {
                    if (!self.narData.mine[k].$div) {
                        self.narData.mine[k].$div = self.renderNarrativeDiv(self.narData.mine[k]);
                    }
                    self.$narPanel.append(self.narData.mine[k].$div);
                }
                
                
                self.$narPanel.append("<h2>Shared With Me</h2>");
                for(var k=0; k<self.narData.shared.length; k++) {
                    if (!self.narData.shared[k].$div) {
                        self.narData.shared[k].$div = self.renderNarrativeDiv(self.narData.shared[k]);
                    }
                    self.$narPanel.append(self.narData.shared[k].$div);
                }
            }
        },
        
        
        renderNarrativeDiv: function(data) {
            console.log(data);
            var $narDiv = $('<div>');
            var narRef = "ws."+data.ws_info[0]+".obj."+data.nar_info[0];
            var nameText = narRef;
            if (data.nar_info[10].name) {
                nameText = data.nar_info[10].name;
            }
            $narDiv.append('<a href="'+narRef+'" target="_blank">'+nameText+'</a>');
            return $narDiv;
        },
        
        
        makeNewNarrativeBtn: function() {
            var self = this;
            var $active = $('<span>').addClass('fa fa-plus').append(" New Narrative");
            var $working = $('<span>').append("Building Narrative...");
            var $btn =
                $('<button>').addClass('btn btn-default').append($active)
                    .on('click', function() {
                        $(this).prop('disabled', true).empty().append($working);
                        var button = this;
                        self.manager.createTempNarrative(
                            {
                                cells:[],
                                parameters:[],
                                importData : []
                            },
                            function(info) {
                                // info.ws_info   info.nar_info
                                console.log('created new narrative!');
                                console.log(info);
                                var newWsId = info.nar_info[6];
                                var newNarId = info.nar_info[0];
                                $newNarrativeLink.empty().append('<a href="ws.'+newWsId+'.obj.'+newNarId+'" target="_blank">Open your new Narrative.</a>');
                                $(button).prop('disabled', false).empty().append("Narrative Created");
                            },
                            function(error) {
                                alert('error!!'+error.error.message);
                                console.error('error');
                                $(button).prop('disabled', false).empty().append("Narrative Creation Error");
                            }
                        )
                    });
            
            return $btn;
        }
        
    });

})( jQuery );
