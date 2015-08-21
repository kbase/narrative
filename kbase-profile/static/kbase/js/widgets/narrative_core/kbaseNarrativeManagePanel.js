/**
 * Widget for displaying a list of Narratives and basic narrative management (copy, delete, share)
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
define(['jquery', 
        'NarrativeManager', 
        'narrativeConfig',
        'kbwidget', 
        'kbaseNarrativeControlPanel'], function( $, NarrativeManager ) {
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
            title: 'Narratives',
            loadingImage: window.kbconfig.loading_gif,
            ws_url: "https://kbase.us/services/ws",
            nms_url: "https://kbase.us/services/narrative_method_store/rpc",
            user_name_fetch_url:"https://kbase.us/services/genome_comparison/users?usernames=",
            landing_page_url: "/functional-site/#/", // !! always include trailing slash
            ws_name: null,
            nar_name: null,
            new_narrative_link:"/functional-site/#/narrativemanager/new"
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
            
            this.$mainPanel = $('<div>')//.css({'height':'600px'});
            this.body().append(this.$mainPanel);
            
            $(document).on(
                'setWorkspaceName.Narrative', $.proxy(function(e, info) {
                    this.ws_name = info.wsId;
                    this.nar_name = info.narrController;
                    this.refresh();
                }, this)
            );

            $(document).on(
              'copyThis.Narrative', $.proxy(function(e, panel, active, jump) {
                  console.debug("CopyThisNarrative triggered, params=",
                    {panel: panel, active: active, jump: jump});
                  this.copyThisNarrative(panel, active, jump);
              }, this)
            );

            $([IPython.events]).on(
                'notebook_saved.Notebook', $.proxy(function(e) {
                    this.refresh();
                }, this)
            );
            
            this.landingPageMap = window.kbconfig.landing_page_map;
            
            if (this.ws_name && this.nar_name && this.ws) {
                this.refresh();
            }
            return this;
        },

        
        my_user_id: null,
        
        loggedInCallback: function(event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.manager = new NarrativeManager({ws_url:this.options.ws_url, nms_url:this.options.nms_url},auth);
            this.my_user_id = auth.user_id;
            if (this.ws_name && this.nar_name)
                this.refresh();
            return this;
        },
        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.manager=null;
            this.my_user_id = null;
//            this.refresh();
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
        tempNars:null,
        oldStyleWs:null,
        
        loadDataAndRenderPanel: function() {
            var self = this;
            if (self.ws) {
                self.narData=null;
                self.showLoading();
                self.ws.list_workspace_info(
                    {excludeGlobal:1},
                    function(wsList) {
                        self.narData={
                            mine:[],
                            shared:[],
                            pub:[],
                            temp:[],
                            allWs:[]
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
                                        self.narData.temp.push({ws_info:wsList[i]});
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
                                if (wsList[i][5]==='a' || wsList[i][5]==='w') {
                                    // allWs is used for advanced management options, which we only
                                    // have if we have admin or write access
                                    self.narData.allWs.push({ws_info:wsList[i]});
                                }
                            }
                        }
                        if (narRefsToLookup.length === 0)
                            return self.renderPanel();
                        self.ws.get_object_info_new({objects:narRefsToLookup,includeMetadata:1,ignoreErrors:1},
                                function(objList) {
                                    for(var i=0; i<objList.length; i++) {
                                        if (objList[i]!==null && objList[i][2].indexOf('KBaseNarrative.Narrative')===0) {
                                            self.allNarData[i].nar_info = objList[i];
                                        } else {
                                            console.error('Corrupted Workspace: ');
                                            console.error('Searching for narrative: ', narRefsToLookup[i], ' but got: ', objList[i]);
                                            self.allNarData[i].error = true;
                                            (function(errorIndex) {
                                                self.ws.get_object_info_new({objects:[narRefsToLookup[errorIndex]],includeMetadata:1,ignoreErrors:0},
                                                    function(error_obj_info) {
                                                        if(error_obj_info[0][2].indexOf('KBaseNarrative.Narrative')===0) {
                                                        // this should not work!! but if it does, fine, remove the error and save the info
                                                            self.allNarData[errorIndex].error = false;
                                                            self.allNarData[errorIndex].nar_info = error_obj_info[0];
                                                        } else {
                                                            // could give an error message here stating that the workspace is pointing to a non-narrative object
                                                            //self.allNarData[errorIndex].error_msg = error.error.message;
                                                        }
                                                    },
                                                    function(error) {
                                                        // this shouldn't happen often, so if it does, just take the time to refresh
                                                        self.allNarData[errorIndex].error_msg = error.error.message;
                                                        self.allNarData[errorIndex].$div = null;
                                                        self.renderPanel();
                                                    });
                                            })(i);
                                        }
                                    }
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
        
        showLoading: function() {
            this.$narPanel.html('<br><center><img src="'+this.options.loadingImage+'"/></center><br>');
        },
        
        renderHeader: function() {
            var self = this;
            if (self.$mainPanel) {
                self.$mainPanel.empty();
                
                var $msgPanel = $("<div>").css({'margin':'10px','text-align':'center'});
                self.$mainPanel.append(
                    $('<div>').css({'margin':'15px','text-align':'center'})
                        .append(self.makeNewNarrativeBtn())
                        .append(self.makeCopyThisNarrativeBtn($msgPanel))
                        .append($msgPanel));
                
                self.$narPanel = $('<div>');
                self.$mainPanel.append(self.$narPanel);
            }
        },
        
        advancedSetNarLookup: {},
        
        sortNarrativesFunc : function(a,b) {
            if (a.error && b.error) { return 0; }
            if (a.error) { return 1; }
            if (b.error) { return -1; }
            if (a.nar_info[3] > b.nar_info[3]) return -1; // sort by date
            if (a.nar_info[3] < b.nar_info[3]) return 1;  // sort by date
            return 0;
        },
        
        
        renderPanel: function() {
            var self = this;
            
            if (self.$narPanel && self.narData) {
                self.$narPanel.children().detach(); // this will also hide any loading messages if they exist
                
                if (self.narData.mine.length>0) {
                    self.$narPanel.append($('<div>').append($('<div>').addClass('kb-nar-manager-titles').append("My Narratives")));
                    self.narData.mine.sort(self.sortNarrativesFunc);
                    for(var k=0; k<self.narData.mine.length; k++) {
                        if (!self.narData.mine[k].$div) {
                            self.narData.mine[k].$div = self.renderNarrativeDiv(self.narData.mine[k]);
                        }
                        self.$narPanel.append(self.narData.mine[k].$div);
                    }
                }
                
                if (self.narData.shared.length>0) {
                    self.narData.shared.sort(self.sortNarrativesFunc);
                    self.$narPanel.append($('<div>').append($('<div>').addClass('kb-nar-manager-titles').append("Shared With Me")));
                    for(var k=0; k<self.narData.shared.length; k++) {
                        if (!self.narData.shared[k].$div) {
                            self.narData.shared[k].$div = self.renderNarrativeDiv(self.narData.shared[k]);
                        }
                        self.$narPanel.append(self.narData.shared[k].$div);
                    }
                }
                
                
                // ADVANCED TAB: allows users to set the default narrative for any workspace
                var $advancedDiv = $('<div>').hide();
                var $advLink = $('<h4>').append("Show Advanced Controls");
                self.$narPanel.append($('<div>').append($('<span>').append($("<a>").append($advLink)))
                                        .css({'text-align':'center','cursor':'pointer'})
                                        .on('click', function() {
                                            if ($advancedDiv.is(":visible") ) {
                                                $advancedDiv.hide();
                                                $advLink.html("Show Advanced Controls");
                                            } else {
                                                $advancedDiv.show();
                                                $advLink.html("Hide Advanced Controls");
                                            }
                                        }));
                self.$narPanel.append($advancedDiv);
                
                
                var $selectWsContainer = $('<select id="setPrimaryNarSelectWs">').addClass('form-control');
                var $selectNarContainer = $('<select id="setPrimaryNarSelectNar">').addClass('form-control').hide();
                var $setBtn = $('<button>').addClass('btn btn-default').append('Set this Narrative').hide();
                var $setPrimary = $('<div>').append(
                    $('<div>').addClass('form-group').css({'text-align':'center'})
                        .append($('<label for="setPrimaryNarSelectWs">').append("Set Active Narrative for Workspace"))
                        .append($selectWsContainer)
                        .append($selectNarContainer)
                        .append($setBtn));
                
                self.narData.allWs.sort(function(a,b) {
                    if (a.ws_info[1].toLowerCase() > b.ws_info[1].toLowerCase()) return 1; // sort by name
                    if (a.ws_info[1].toLowerCase() < b.ws_info[1].toLowerCase()) return -1;  // sort by name
                    return 0;
                });
                
                for(var k=0; k<self.narData.allWs.length; k++) {
                    var info = self.narData.allWs[k].ws_info;
                    $selectWsContainer.append($('<option value="'+info[1]+'">').append(info[1] + ' (id='+info[0]+')'));
                }
                $selectWsContainer.on('change',
                    function() {
                        $selectNarContainer.empty();
                        self.ws.list_objects({
                                workspaces: [$selectWsContainer.val()],
                                type:"KBaseNarrative.Narrative",
                                includeMetadata:1
                            },
                            function(objList) {
                                if (objList.length==0) {
                                    $selectNarContainer.append($('<option value="none">').append('No Narratives'));
                                    $setBtn.prop('disabled', true);
                                    $selectNarContainer.prop('disabled', true);
                                    return;
                                }
                                $setBtn.prop('disabled', false);
                                $selectNarContainer.prop('disabled', false);
                                
                                // sort by date
                                objList.sort(function(a,b) {
                                    if (a[3] > b[3]) return -1; // sort by date
                                    if (a[3] < b[3]) return 1;  // sort by date
                                    return 0;
                                });
                                self.advancedSetNarLookup = {};
                                // add the list to the select
                                for(var i=0; i<objList.length; i++) {
                                    var narDispName = objList[i][1];
                                    if (objList[i][10].name) {
                                        narDispName = objList[i][10].name;
                                    }
                                    self.advancedSetNarLookup[objList[i][0]] = narDispName;
                                    $selectNarContainer.append($('<option value="'+objList[i][0]+'">')
                                                                .append(narDispName + ' (id='+objList[i][0]+')'));
                                }
                            },
                            function(error) {
                                console.error(error);
                            });
                        
                        $selectNarContainer.show();
                        $setBtn.show();
                    });
                $selectWsContainer.change();
                $setBtn.on('click',
                    function() {
                        // should only get here if it was a valid WS/Nar combo
                        var ws = $selectWsContainer.val();
                        var nar = $selectNarContainer.val();
                        $(this).prop('disabled', true).empty().append("please wait...");
                        // should probably be moved to NarrativeManager
                        self.ws.alter_workspace_metadata({
                                wsi:{workspace:ws},
                                new: {
                                    'narrative' : nar,
                                    'is_temporary' : 'false',
                                    'narrative_nice_name': self.advancedSetNarLookup[nar]
                                }
                            },
                            function (args) {
                                self.loadDataAndRenderPanel();  
                            },
                            function name(error) {
                                $setBtn.html("error...");
                                console.error(error);
                            }
                        );
                    });
                $advancedDiv.append($setPrimary);
            }
        },
        
        addDataControls: function(object_info, $alertContainer, ws_info, isError) {
            var self = this;
            var $btnToolbar = $('<span>')
                                        .addClass('btn-toolbar')
                                        .attr('role', 'toolbar');
            
            var btnClasses = "btn btn-xs btn-default";
            var css = {'color':'#888', 'margin':'0px'};
                                        
            var $openHistory = $('<span>');
            if (!isError) {
                $openHistory
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'View narrative history to revert changes', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-history').css(css))
                                        .click(function(e) {
                                            e.stopPropagation(); $alertContainer.empty(); $alertContainer.show();
                                            
                                            if (self.ws_name && self.ws) {
                                                self.ws.get_object_history({ref:object_info[6]+"/"+object_info[0]},
                                                    function(history) {
                                                        history.reverse();
                                                        $alertContainer.append($('<div>')
                                                            .append($('<button>').addClass('kb-data-list-cancel-btn')
                                                                        .append('Hide History')
                                                                        .click(function() {$alertContainer.empty();} )));
                                                        var isCurrent = false;
                                                        if(self.ws_name === ws_info[1]) {
                                                            isCurrent = true;
                                                        }
                                                        var $tbl = $('<table>').css({'width':'100%'});
                                                        for(var k=0; k<history.length;k++) {
                                                            var $revertBtn = $('<button>').append('v'+history[k][4]).addClass('kb-data-list-btn');
                                                            if (k==0) {
                                                                $revertBtn.tooltip({title:'Current Version', 'container':'body',placement:'bottom'});
                                                            } else if(history[k][4]==1) {
                                                                $revertBtn.tooltip({title:'Cannot revert to first unsaved version', 'container':'body',placement:'bottom'});
                                                            } else {
                                                                var revertRef = {wsid:history[k][6], objid:history[k][0], ver:history[k][4]};
                                                                (function(revertRefLocal) {
                                                                    $revertBtn.tooltip({title:'Revert to this version?',placement:'bottom'})
                                                                        .click(function() {
                                                                            self.ws.revert_object(revertRefLocal,
                                                                                function(reverted_obj_info) {
                                                                                    // update the workspace info with the specified name
                                                                                    self.ws.alter_workspace_metadata({
                                                                                        wsi:{id:ws_info[0]},
                                                                                        new:{'narrative_nice_name':reverted_obj_info[10].name}},
                                                                                        function() {
                                                                                            if (isCurrent) {
                                                                                                window.location.reload();
                                                                                            } else {
                                                                                                self.refresh();
                                                                                            }
                                                                                        },
                                                                                        function(error) {
                                                                                            console.error(error);
                                                                                            $alertContainer.empty();
                                                                                            $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Narrative reverted, but a minor data update error occured."+error.error.message));
                                                                                        });
                                                                                }, function(error) {
                                                                                    console.error(error);
                                                                                    $alertContainer.empty();
                                                                                    $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                                                                                });
                                                                        }); })(revertRef);
                                                            }
                                                            var summary = self.getNarSummary(history[k]);
                                                            if (summary) { summary = '<br>'+summary; }
                                                            $tbl.append($('<tr>')
                                                                        .append($('<td>').append($revertBtn))
                                                                        .append($('<td>').append(self.getTimeStampStr(history[k][3]) + ' by ' + history[k][5] + summary))
                                                                        .append($('<td>').append($('<span>').css({margin:'4px'}).addClass('fa fa-info pull-right'))
                                                                                 .tooltip({title:history[k][2]+'<br>'+history[k][10].name+'<br>'+history[k][8]+'<br>'+history[k][9]+' bytes', container:'body',html:true,placement:'bottom'}))
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
            }
                                        
            /*var $openProvenance = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'View data provenance and relationships', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-sitemap fa-rotate-90').css(css))
                                        .click(function(e) {
                                            e.stopPropagation(); $alertContainer.empty();
                                            window.open(self.options.landing_page_url+'objgraphview/'+object_info[7]+'/'+object_info[1]);
                                        });*/
            /*var $download = $('<span>')
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'Export / Download data', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-download').css(css))
                                        .click(function(e) {
                                            e.stopPropagation(); $alertContainer.empty();
                                            $alertContainer.append('Coming soon');
                                        });*/
            
            var $copy = $('<span>');
            if (!isError) {
                $copy
                    .addClass(btnClasses).css(css)
                    .tooltip({title:'Copy Narrative and Data', 'container':'body'})
                    .append($('<span>').addClass('fa fa-copy').css(css))
                    .click(function(e) {
                        e.stopPropagation(); $alertContainer.empty(); $alertContainer.show();
                        var $newNameInput = $('<input type="text">').addClass('form-control').val(ws_info[8].narrative_nice_name+ ' - Copy');
                        $alertContainer.append(
                            $('<div>').append(
                                $('<div>').append("Enter a name for the new Narrative"))
                                    .append($('<div>').append($newNameInput))
                                    .append($('<button>').addClass('kb-data-list-btn')
                                        .append('Copy')
                                        .click(function() {
                                            $(this).prop("disabled",true);
                                            var newMeta = ws_info[8];
                                            newMeta['narrative_nice_name'] = $newNameInput.val();
                                            
                                            var id = new Date().getTime();
                                            var ws_name = self.my_user_id + ":" + id;
                                            
                                            self.ws.clone_workspace({
                                                        wsi: {id:ws_info[0]},
                                                        workspace: ws_name,
                                                        meta: newMeta
                                                    },
                                                    function(new_ws_info) {
                                                        // we have to match based on names because when cloning, the object id is not preserved!!! arg!
                                                        var new_narrative_ref = new_ws_info[0]+"/"+ object_info[1]; //new_ws_info[8].narrative;
                                                        // ok, a lot of work just to update the narrative name in the metadata
                                                        self.ws.get_objects([{ref:new_narrative_ref}],
                                                            function(data) {
                                                                data = data[0]; // only one thing should be returned
                                                                var new_nar_metadata = data.info[10];
                                                                new_nar_metadata.name = newMeta['narrative_nice_name'];
                                                                data.data.metadata.name = newMeta['narrative_nice_name'];
                                                                
                                                                // set workspace metadata to point to the correct object id since they can change on clone!!
                                                                self.ws.alter_workspace_metadata({
                                                                        wsi:{id:new_ws_info[0]},
                                                                        new: {'narrative' : String(data.info[0]) }
                                                                    },
                                                                    function () {
                                                                        // so much work just to update this name!
                                                                        self.ws.save_objects({id:new_ws_info[0],objects:[
                                                                            {
                                                                                type:data.info[2],
                                                                                data:data.data,
                                                                                provenance:data.provenance,
                                                                                name:data.info[1],
                                                                                meta:new_nar_metadata
                                                                            }
                                                                            ]},
                                                                            function(info) {
                                                                                console.log('copying complete',info);
                                                                                self.refresh();
                                                                            },
                                                                            function(error) {
                                                                                console.error(error);
                                                                                $alertContainer.empty();
                                                                                $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! Copied successfully, but error on rename."+error.error.message));
                                                                            });
                                                                    
                                                                    },
                                                                    function (error) {
                                                                        console.log('Error when setting ws metadata!', error);
                                                                    });
                                                                
                                                                
                                                            },
                                                            function(error) {
                                                                console.error(error);
                                                                $alertContainer.empty();
                                                                $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! Copied successfully, but error on rename."+error.error.message));
                                                            })
                                                    },
                                                    function(error) {
                                                        console.error(error);
                                                        $alertContainer.empty();
                                                        $alertContainer.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                                                    });
                                            }))
                                    .append($('<button>').addClass('kb-data-list-cancel-btn')
                                        .append('Cancel')
                                        .click(function() {$alertContainer.empty();} )));
                });
            }
            
            var $delete = $('<span>') 
                                        .addClass(btnClasses).css(css)
                                        .tooltip({title:'Delete Narrative', 'container':'body'})
                                        .append($('<span>').addClass('fa fa-trash-o').css(css))
                                        .click(function(e) {
                                            e.stopPropagation();
                                            $alertContainer.empty(); $alertContainer.show();
                                            
                                            var warningMsg = 'Are you sure?'; var isCurrent = false;
                                            if(self.ws_name === ws_info[1]) {
                                                isCurrent = true;
                                                warningMsg = 'Warning - you are currently viewing this Narrative!<br>You will be redirected to another Narrative if deleted.  Are you sure?';
                                            }
                                            
                                            $alertContainer.append($('<div>')
                                                .append($('<div>').append(warningMsg))
                                                .append($('<button>').addClass('kb-data-list-btn')
                                                            .append('Delete')
                                                            .click(function() {
                                                                if (self.ws_name && self.ws) {
                                                                    self.ws.delete_workspace({ id: ws_info[0] },
                                                                        function() {
                                                                            if (isCurrent) {
                                                                                window.location.replace(self.options.landing_page_url+'narrativemanager/start');
                                                                            } else {
                                                                                self.refresh();
                                                                            }
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
                .append($openHistory)
                //.append($openProvenance)
                //.append($download)
                .append($copy)
                .append($delete);
            
            return $btnToolbar;
        },
        
        
        renderNarrativeDiv: function(data) {
            var self = this;
            
            var isCurrent = false;
            if(this.ws_name === data.ws_info[1]) {
                isCurrent = true;
            }
            
            var $narDiv = $('<div>').addClass('kb-data-list-obj-row');
            
            var $tbl = $('<table>').css({'width':'100%'});
            var $dataCol = $('<td>').css({'text-align':'left','vertical-align':'top'});
            var $ctrCol = $('<td>').css({'text-align':'right','vertical-align':'top', 'width':'80px'});
            var $ctrContent = $('<div>').css({'min-height':'60px'});
            $ctrCol.append($ctrContent);
            
            var $alertContainer=$('<div>').addClass('kb-data-list-more-div').css({'text-align':'center','margin':'5px'}).hide();
            
            var narRef = "ws."+data.ws_info[0]+".obj."+data.ws_info[8].narrative;
            var nameText = narRef; var version='';
            if (data.nar_info && data.nar_info[10].name) {
                nameText = data.nar_info[10].name;
                version = 'v'+data.nar_info[4];
            } else if (data.error && data.ws_info[8].narrative_nice_name) {
                nameText = data.ws_info[8].narrative_nice_name + ' ('+nameText+')';
            }
            var $version = $('<span>').addClass("kb-data-list-version").append(version);
            var $priv = $('<span>').css({'color':'#999','margin-left':'8px'}).prop('data-toggle','tooltip').prop('data-placement','right');
             if (data.ws_info[5]==='r') {
                $priv.addClass('fa fa-lock').prop('title','read-only');
            } else if (data.ws_info[5]==='w' || data.ws_info[5]==='a') {
                $priv.addClass('fa fa-pencil').prop('title','you can edit');
            }
            
            var $nameLink =  $('<a href="'+narRef+'" target="_blank">');
            if (isCurrent) {
                 $nameLink.append($('<span>').addClass('fa fa-circle').css({'margin-right':'3px','color':'#4BB856'})
                                    .tooltip({title:'You are viewing this Narrative now'}));
            } else if (data.error) {
                 $nameLink.append($('<span>').addClass('fa fa-circle').css({'margin-right':'3px','color':'#F44336'})
                                    .tooltip({title:'This narrative has been corrupted.'}));
            }
            $nameLink.append(nameText).append($version).append($priv);
            $dataCol.append($('<div>').addClass('kb-data-list-name').css({'white-space':'normal', 'cursor':'pointer'}).append($nameLink));
            
            // only disply the rest if there was no error
            if (!data.error) {
                var $usrNameSpan = $('<span>').addClass('kb-data-list-type').append(data.ws_info[2]);
                if(data.ws_info[2]===this._attributes.auth.user_id) {
                } else {
                    $dataCol.append($usrNameSpan).append('<br>');
                    this.displayRealName(data.ws_info[2], $usrNameSpan);
                }
                var summary = this.getNarSummary(data.nar_info);
                if (summary) {
                    $dataCol.append($('<span>').addClass('kb-data-list-narinfo').append(summary)
                                    .click(
                                        function() {
                                            $alertContainer.empty(); $alertContainer.show();
                                            $alertContainer.append($('<div>')
                                                                .append($('<button>').addClass('kb-data-list-cancel-btn')
                                                                            .append('Hide Narrative Info')
                                                                            .click(function() {$alertContainer.empty();} )));
                                            $alertContainer.append(self.getNarContent(data.nar_info));
                                        })
                                    .append('<br>'));
                }
                $dataCol.append($('<span>').addClass('kb-data-list-type').append(this.getTimeStampStr(data.nar_info[3])));
                
                var $shareContainer = $('<div>').hide();
                var $shareToolbar = $('<span>').addClass('btn-toolbar').attr('role', 'toolbar');
                $ctrContent.append($shareToolbar);
                this.ws.get_permissions({id:data.ws_info[0]},
                    function(perm) {
                        var shareCount = 0;
                        for(var usr in perm) {
                            if (perm.hasOwnProperty(usr)) {
                                if (usr === '*') { continue; }
                                shareCount++;
                            }
                        }
                        // should really put this in the addDatacontrols; so refactor at some point!
                        $shareToolbar.append(
                            $('<span>')
                            .addClass('btn btn-xs btn-default')
                            .css({'color':'#888', 'margin':'0px'})
                            .tooltip({title:'View share settings', 'container':'body'})
                            .append($('<span>')
                                    .addClass('fa fa-share-alt')
                                    .css({'color':'#888','margin':'0px','font-size':'10pt'}))
                            .append(' '+shareCount)
                            .on('click',function() {
                                $alertContainer.hide();
                                $shareContainer.slideToggle('fast');
                                if($shareContainer.is(':empty')) {
                                    var $share = $('<div>');
                                    // just use the share panel, max height is practically unlimited because we are already
                                    // in a scrollable pane
                                    $share.kbaseNarrativeSharePanel({ws_name_or_id:data.ws_info[0],max_list_height:'none', add_user_input_width:'280px'});
                                    $shareContainer.append($share);
                                }
                            })
                        );
                    },
                    function(error) {
                        console.error('error getting permissions for manage panel');
                        console.error(error);
                    });
            
                var $btnToolbar = self.addDataControls(data.nar_info,$alertContainer, data.ws_info);
                $ctrContent.append($btnToolbar.hide());
                $narDiv
                    .mouseenter(function(){ $btnToolbar.show(); })
                    .mouseleave(function(){ $btnToolbar.hide(); });
            } else if (data.error) {
                if(data.error_msg) {
                    $dataCol.append($('<span>').addClass('kb-data-list-narrative-error').append(
                                 'This Narrative has been corrupted: '+data.error_msg));
                } else {
                    $dataCol.append($('<span>').addClass('kb-data-list-narrative-error').append(
                                 'This Narrative has been corrupted.'));
                }
                var $btnToolbar = self.addDataControls(data.nar_info,$alertContainer, data.ws_info, true);
                $ctrContent.append($btnToolbar);
                $narDiv
                    .mouseenter(function(){ $btnToolbar.show(); })
                    .mouseleave(function(){ $btnToolbar.hide(); });
            }
            $narDiv.append($('<table>').css({'width':'100%'})
                           .append($('<tr>').append($dataCol).append($ctrCol)));
            $narDiv.append($alertContainer);
            $narDiv.append($shareContainer);
            
            var $narDivContainer = $('<div>').append($('<hr>').addClass('kb-data-list-row-hr').css({'margin-left':'15px'}))
                                        .append($narDiv);
            
            return $narDivContainer;
        },
        
        
        makeCopyThisNarrativeBtn: function($alertContainer) {
            var self = this;
            var active = '<span class="fa fa-copy"></span> Copy Narrative';
//            var $active = $('<span>').addClass('fa fa-copy').append(" Copy Narrative");
            var $working = $('<span>').append("Copying Narrative...");

            var $btn = $('<button>').addClass('kb-primary-btn')
              .append(active)
              .on('click', function (e) {
                  e.stopPropagation();
                  var $cpyBtn = $(this);
                  $cpyBtn.prop('disabled', true).empty().append($working);
                  self.copyThisNarrative($alertContainer, active, null);
              });
            return $btn;
        },

        copyThisNarrative: function($dialog, active, $jump_btn) {
            var self = this;
            $dialog.empty(); // in case user canceled earlier
            self.ws.get_workspace_info({workspace: self.ws_name},
              function(ws_info) {
                  self.ws.get_object_info_new({objects:[{ref: ws_info[0] + '/' + ws_info[8]['narrative']}], includeMetadata:1},
                    function(object_info_list) {
                        var object_info = object_info_list[0];
                        var $newNameInput = $('<input type="text">').addClass('form-control')
                          .val(ws_info[8]['narrative_nice_name']+' - Copy');
                        $dialog.append(
                            $('<div>').append(
                                $('<div>').append("Enter a name for the new Narrative"))
                                    .append($('<div>').append($newNameInput))
                                    .append($('<button>').addClass('btn btn-info')
                                        .css({'margin-top': '10px'})
                                        .append('Copy')
                                        .click(function() {
                                            var $thisBtn = $(this);
                                            $thisBtn.prop("disabled",true);
                                            var newMeta = ws_info[8];
                                            newMeta['narrative_nice_name'] = $newNameInput.val();

                                            var id = new Date().getTime();
                                            var ws_name = self.my_user_id + ":" + id;

                                            self.ws.clone_workspace({
                                                        wsi: {id:ws_info[0]},
                                                        workspace: ws_name,
                                                        meta: newMeta
                                                    },
                                                    function(new_ws_info) {
                                                        // we have to match based on names because when cloning, the object id is not preserved!!! arg!
                                                        var new_narrative_ref = new_ws_info[0]+"/"+ object_info[1]; //new_ws_info[8].narrative;
                                                        // ok, a lot of work just to update the narrative name in the metadata
                                                        self.ws.get_objects([{ref:new_narrative_ref}],
                                                            function(data) {
                                                                data = data[0]; // only one thing should be returned
                                                                var new_nar_metadata = data.info[10];
                                                                new_nar_metadata.name = newMeta['narrative_nice_name'];
                                                                data.data.metadata.name = newMeta['narrative_nice_name'];

                                                                // set workspace metadata to point to the correct object id since they can change on clone!!
                                                                self.ws.alter_workspace_metadata({
                                                                        wsi:{id:new_ws_info[0]},
                                                                        new: {'narrative' : String(data.info[0]) }
                                                                    },
                                                                    function () {
                                                                        // so much work just to update this name!
                                                                        self.ws.save_objects({id:new_ws_info[0],objects:[
                                                                            {
                                                                                type:data.info[2],
                                                                                data:data.data,
                                                                                provenance:data.provenance,
                                                                                name:data.info[1],
                                                                                meta:new_nar_metadata
                                                                            }
                                                                            ]},
                                                                            function(info) {
                                                                                console.log('copying complete',info);
                                                                                $dialog.empty();
                                                                                if (active) {
                                                                                    $thisBtn.prop('disabled', false).empty().append(active);
                                                                                    self.refresh();
                                                                                }
                                                                                if ($jump_btn) {
                                                                                    var name = info[0][10].name;
                                                                                    var copy_id = "ws." + info[0][6] + ".obj." + info[0][0];
                                                                                    var oldpath = window.location.pathname;
                                                                                    var parts = oldpath.split('/');
                                                                                    parts.pop();                    // pop off old id
                                                                                    parts.push(copy_id);            // add new one
                                                                                    var newpath = parts.join('/'); // rejoin as a path
                                                                                    var newurl = window.location.protocol + '//' + window.location.host + newpath;
                                                                                    $dialog.append($('<div>').html('Created new copy: <i>' + name + '</i>'));
                                                                                    $dialog.append($jump_btn);
                                                                                    $jump_btn.click(function() {
                                                                                        window.location.replace(newurl);
                                                                                    });
                                                                                }
                                                                            },
                                                                            function(error) {
                                                                                console.error(error);
                                                                                $dialog.empty();
                                                                                $dialog.append($('<span>').css({'color':'#F44336'}).append("Error! Copied successfully, but error on data update. "+error.error.message));
                                                                            });

                                                                    },
                                                                    function (error) {
                                                                        console.error(error);
                                                                        $dialog.empty();
                                                                        $dialog.append($('<span>').css({'color':'#F44336'}).append("Error! Copied successfully, but error on data update. "+error.error.message));
                                                                    });


                                                            },
                                                            function(error) {
                                                                console.error(error);
                                                                $dialog.empty();
                                                                $dialog.append($('<span>').css({'color':'#F44336'}).append("Error! Copied successfully, but error on rename. "+error.error.message));
                                                            })
                                                    },
                                                    function(error) {
                                                        console.error(error);
                                                        $dialog.empty();
                                                        $dialog.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                                                    });
                                            }))
                          .append(active ?
                            $('<button>').addClass('kb-data-list-cancel-btn')
                              .append('Cancel')
                                .click(function() {
                                    $cpyBtn.prop('disabled', false).empty().append(active);
                                    $dialog.empty();
                                } ) : ''));
                    },
                    function(error) {
                        console.error(error);
                        $dialog.empty();
                        $dialog.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
                    });
            },
            function(error) {
                console.error(error);
                $dialog.empty();
                $dialog.append($('<span>').css({'color':'#F44336'}).append("Error! "+error.error.message));
            });
        },

        makeNewNarrativeBtn: function() {
            var self = this;
            var active = '<span class="fa fa-plus"></span> New Narrative';
            // !!! Putting text inside the span with font awesome classes will 
            // cause the browser to use its default font.
//            var $active = $('<span>').addClass('fa fa-plus').append(" New Narrative");
            var $working = $('<span>').append("Building Narrative...");
            var $btn =
                $('<button>').addClass('kb-primary-btn').append(active)
                    .on('click', function() {
                        // just open the link, don't do the work here...
                        window.open(self.options.new_narrative_link);
                    });
            
            return $btn;
        },
        
        getNarSummary : function(nar_info) {
            var summary = '';
            if (nar_info[10].methods) {
                var content = JSON.parse(nar_info[10].methods);
                var summaryCounts = [];
                var appCount=0; var methodCount=0;
                for(var a in content.app) {
                    if (content.app.hasOwnProperty(a)) {
                        appCount+= content.app[a];
                    }
                }
                if (appCount===1) { summaryCounts.push('1 App'); }
                else if (appCount>1) { summaryCounts.push(appCount+' Apps');}
                                                            
                for(var m in content.method) {
                    if (content.method.hasOwnProperty(m)) {
                        methodCount+= content.method[m];
                    }
                }
                if (methodCount===1) { summaryCounts.push('1 Method'); }
                else if (methodCount>1) { summaryCounts.push(methodCount+' Methods');}
                                                            
                if (content.output ===1) { summaryCounts.push('1 Result'); }
                else if (content.output >1) { summaryCounts.push(content.output + ' Results'); }
                
                if (content.ipython.code ===1) { summaryCounts.push('1 Code Cell'); }
                else if (content.ipython.code >1) { summaryCounts.push(content.ipython.code + ' Code Cells'); }
                                                            
                if (content.ipython.markdown ===1) { summaryCounts.push('1 Md Cell'); }
                else if (content.ipython.markdown >1) { summaryCounts.push(content.ipython.markdown + ' Md Cells'); }
                                                            
                                                            
                if (summaryCounts.length>0) {
                    summary = summaryCounts.join(', ');
                } else {
                    summary = 'Empty Narrative';
                }
            }
            return summary;
        },
        
        getNarContent: function(nar_info) {
            var self = this;
            console.log(nar_info);
            
            var specsToLookup = {apps:[],methods:[]};
            if (nar_info[10].methods) {
                var content = JSON.parse(nar_info[10].methods);
                var apps = []; var methods = [];
                var appCount=0; var methodCount=0;
                for(var a in content.app) {
                    if (content.app.hasOwnProperty(a)) {
                        apps.push({name:a,count:content.app[a]});
                        specsToLookup.apps.push(a);
                    }
                }
                for(var m in content.method) {
                    if (content.method.hasOwnProperty(m)) {
                        methods.push({name:m,count:content.method[m]});
                        specsToLookup.methods.push(m);
                    }
                }
            }
            
            if ((apps.length + methods.length) ===0) {
                if (nar_info[10].description) {
                    $container.append('<br><b>Description</b><br><div style="text-align:left;">'+nar_info[10].description+'</div>');
                }
                return "<br>No Apps or Methods in this Narrative.<br>";
            }
            
            var $container = $('<div>').css({'width':'100%'});
            if (!self.appMethodSpecRef) {
                self.trigger('getFunctionSpecs.Narrative', [specsToLookup,
                        function(specLookup) {
                            //todo: sort here based on counts or name?
                            //console.log(specLookup);
                            if (nar_info[10].description) {
                                $container.append('<br><b>Description</b><br><div style="text-align:left;">'+nar_info[10].description+'</div>');
                            }
                            
                            if (apps.length>0) {
                                $container.append('<br><b>Apps</b><br>');
                                var $apptbl = $('<table>').css({'width':'100%'});
                                for(var k=0; k<apps.length; k++) {
                                    var link = '<a href="'+self.options.landing_page_url+'narrativestore/app/'+apps[k].name+'" target="_blank">'+apps[k].name+'</a>';
                                    if (specLookup.apps[apps[k].name]) {
                                        link = '<a href="'+self.options.landing_page_url+'narrativestore/app/'+apps[k].name+'" target="_blank">'+specLookup.apps[apps[k].name].info.name+'</a>';
                                    }
                                    $apptbl.append($('<tr>')
                                            .append($('<td>').append(link))
                                            .append($('<td>').append(apps[k].count)));
                                }
                                $container.append($apptbl);
                            }
                            
                            if (methods.length>0) {
                                $container.append('<br><b>Methods</b><br>');
                                var $methodtbl = $('<table>').css({'width':'100%'});
                                for(var k=0; k<methods.length; k++) {
                                    var link = '<a href="'+self.options.landing_page_url+'narrativestore/method/'+methods[k].name+'" target="_blank">'+methods[k].name+'</a>';
                                    if (specLookup.methods[methods[k].name]) {
                                        link = '<a href="'+self.options.landing_page_url+'narrativestore/method/'+methods[k].name+'" target="_blank">'+specLookup.methods[methods[k].name].info.name+'</a>';
                                    }
                                    $methodtbl.append($('<tr>')
                                            .append($('<td>').append(link))
                                            .append($('<td>').append(methods[k].count)));
                                }
                                $container.append($methodtbl);
                            }
                            $container.append('<br>');
                        }]);
            }
            return $container;
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
            
            // keep it simple, just give a date
            return this.monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
        },
        
        monthLookup : ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep","Oct", "Nov", "Dec"],
        
        /* we really need to stop all this copy pasting */
        real_name_lookup: {},
        displayRealName: function(username,$targetSpan) {
	    var self = this;
	    if (self.ws) { // make sure we are logged in and have some things
		
                if (self.real_name_lookup[username] && self.real_name_lookup[username] !=="...") {
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
                        });
                }
	    }
        }
        
    });

});
