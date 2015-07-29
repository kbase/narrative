/**
 * Widget for viewing and modifying narrative share settings
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
define(['jquery', 'kbwidget', 'kbaseAuthenticatedWidget', 'select2'], function( $ ) {
    $.KBWidget({
        name: "kbaseNarrativeSharePanel", 
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        
        options: {
            ws_url: "https://kbase.us/services/ws",
            user_profile_url: "https://kbase.us/services/user_profile/rpc",
            user_page_link:"/functional-site/#/people/",
            loadingImage: window.kbconfig.loading_gif,
            ws_name_or_id: null,
            max_name_length: 35,
            max_list_height: '250px',
            add_user_input_width: '200px'
        },
        
        ws:null, // workspace client
        user_profile:null, //user_profile client
        
        $mainPanel:null,
        $notificationPanel:null,
        
        init: function(options) {
            this._super(options);
            
            // always overwrite based on kbconfig
            if (window.kbconfig && window.kbconfig.urls) {
                this.options.ws_url = window.kbconfig.urls.workspace;
                this.options.user_profile_url = window.kbconfig.urls.user_profile;
            }
            
            this.$notificationPanel = $('<div>');
            this.$elem.append(this.$notificationPanel);
        
            this.$mainPanel = $('<div>');
            this.$elem.append(this.$mainPanel);
            this.showWorking("loading narrative information");
            this.getInfoAndRender();
            
            if (!this.options.ws_name_or_id) {
                $(document).on(
                    'setWorkspaceName.Narrative', $.proxy(function(e, info) {
                        this.options.ws_name_or_id = info.wsId;
                        this.refresh();
                    }, this)
                );
            }
            
            return this;
        },

        my_user_id: null,
        
        loggedInCallback: function(event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.user_profile = new UserProfile(this.options.user_profile_url, auth);
            this.my_user_id = auth.user_id;
            this.refresh();
            return this;
        },
        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.user_profile = null;
            this.my_user_id = null;
            this.refresh();
            return this;
        },
        
        
        ws_info: null,
        ws_permissions: null,
        user_data: {},
        
        all_users: null,
        
        getInfoAndRender: function() {
            var self = this;
            if (self.ws && self.options.ws_name_or_id) {
                var wsIdentity = {};
                if (this.options.ws_name_or_id) {
                    if(/^[1-9]\d*$/.test(this.options.ws_name_or_id)) {
                        wsIdentity.id = parseInt(this.options.ws_name_or_id);
                    } else {
                        wsIdentity.workspace = this.options.ws_name_or_id;
                    }
                }
                // first get ws info
                self.ws.get_workspace_info(wsIdentity,
                    function(info) {
                        self.ws_info = info;
                        self.ws.get_permissions(wsIdentity,
                            function(perm) {
                                self.ws_permissions = [];
                                self.user_data = {};
                                
                                var usernameList = [self.my_user_id];
                                var usernames = self.my_user_id + ",";
                                for(var u in perm) {
                                    if (perm.hasOwnProperty(u)) {
                                        if (u!=='*') {
                                            self.ws_permissions.push([u,perm[u]]);
                                            usernames += u+',';
                                            usernameList.push(u);
                                        }
                                    }
                                }
                                self.user_profile.lookup_globus_user(usernameList,
                                    function(data) {
                                        self.user_data = data;
                                        self.render();
                                    },
                                    function(error) {
                                        console.error(error);
                                        self.render();
                                    });
                            },
                            function(error){self.reportError(error);}
                            );
                    },
                    function(error){self.reportError(error);});
            }
        },
        /*

WORKSPACE INFO
0: ws_id id
1: ws_name workspace
2: username owner
3: timestamp moddate,
4: int object
5: permission user_permission
6: permission globalread,
7: lock_status lockstat
8: usermeta metadata

 
*/
        isPrivate:true, // set if this ws is private or public
        render: function() {
            var self = this;
            if (self.ws_info && self.ws_permissions) {
                self.$mainPanel.empty();
            
                var globalReadStatus = '<strong><span class="fa fa-lock" style="margin-right:10px"></span>Private</strong>';
                var globalReadClass = "alert alert-info";
                self.isPrivate = true;
                if (self.ws_info[6]==='r') {
                    self.isPrivate = false;
                    globalReadClass = "alert alert-success";
                    globalReadStatus = '<strong><span class="fa fa-unlock" style="margin-right:10px"></span>Public</strong>';
                }
            
                var $topDiv = $('<div>')
                        .addClass(globalReadClass)
                        .css({'text-align':'center','padding':'10px','margin':'5px'})
                        .append(globalReadStatus);
                self.$mainPanel.append($topDiv);
                
                var $togglePublicPrivate = $('<div>').css({'text-align':'center'}).hide();
                if (self.isPrivate) {
                    $togglePublicPrivate.append($('<a>').append('make public?')
                        .on('click',function() {
                            self.showWorking("updating permissions...");
                            self.ws.set_global_permission(
                                {id: self.ws_info[0], new_permission:'r' },
                                function() { self.refresh();},
                                function(error) {
                                    console.log(error);
                                    self.refresh();
                                }
                            );
                        }));
                } else {
                    $togglePublicPrivate.append($('<a>').append('make private?')
                        .on('click',function() {
                            self.showWorking("updating permissions...");
                            self.ws.set_global_permission(
                                {id: self.ws_info[0], new_permission:'n' },
                                function() { self.refresh();},
                                function(error){self.reportError(error); self.refresh(); }
                            );
                        }));
                }
                self.$mainPanel.append($togglePublicPrivate);
                
                var $meDiv = $('<div>').css({'margin':'5px','margin-top':'20px'});
                var status = "You do not have access to this Narrative.";
                var isOwner = false;
                if (self.ws_info[2]===self.my_user_id) {
                    status="You own this Narrative. You can edit it and share it with other users.";
                    isOwner = true;
                    $togglePublicPrivate.show();
                } else if (self.ws_info[5]==='a') {
                    status="You can edit and share this Narrative.";
                    isOwner = true;  // not really, but set this so we show sharing controls
                    $togglePublicPrivate.show();
                } else if (self.ws_info[5]==='w') {
                    status="You can edit this Narrative, but you cannot share it.";
                } else if (self.ws_info[5]==='r' || self.ws_info[6]==='r') { // either you can read it, or it is globally readable
                    status="You can view this Narrative, but you cannot edit or share it.";
                } 
                var display = self.renderUserIconAndName(self.my_user_id,null,true);
                $meDiv.append(display[0],display[1]);
                $meDiv.append($('<div>').css({'margin-top':'10px'}).append(status));
                self.$mainPanel.append($meDiv);
            
                if (isOwner) {
                    var $addUsersDiv = $('<div>').css({'margin-top':'10px'});
                    var $input = $('<input>').attr('type','text').css({'width':self.options.add_user_input_width});
                    
                    var $addAction =
                        $('<div>').addClass('btn-group')
                            .append($('<button>').addClass('btn btn-default dropdown-toggle ')
                                .attr('type','button').attr('data-toggle','dropdown').attr('aria-expanded','false')
                                .append('<span class="fa fa-caret-down"></span>'))
                            .append($('<ul>').addClass('dropdown-menu pull-right').attr('role','menu')
                                    // TODO: pull-right is deprecated, use dropdown-menu-right when bootstrap updates
                                    .append($('<li>').append(
                                        $('<a>').append('Add with view privileges')
                                            .on('click',function() {
                                                var data = $input.select2("data");
                                                self.showWorking("updating permissions...");
                                                var users = [];
                                                for(var i=0; i<data.length; i++) {
                                                    if(data[i].id.trim()!=='') {
                                                        users.push(data[i].id.trim());
                                                    }
                                                }
                                                self.ws.set_permissions(
                                                    {id: self.ws_info[0], new_permission:'r', users:users },
                                                    function() { self.refresh();},
                                                    function(error){self.reportError(error); self.refresh(); }
                                                );
                                            })))
                                    .append($('<li>').append($('<a>').append('Add with edit privileges')
                                            .on('click',function() {
                                                var data = $input.select2("data");
                                                self.showWorking("updating permissions...");
                                                var users = [];
                                                for(var i=0; i<data.length; i++) {
                                                    if(data[i].id.trim()!=='') {
                                                        users.push(data[i].id.trim());
                                                    }
                                                }
                                                self.ws.set_permissions(
                                                    {id: self.ws_info[0], new_permission:'w', users:users },
                                                    function() { self.refresh();},
                                                    function(error){self.reportError(error); self.refresh(); }
                                                );
                                            })))
                                    .append($('<li>').append($('<a>').append('Add with edit/share privileges')
                                            .on('click',function() {
                                                var data = $input.select2("data");
                                                self.showWorking("updating permissions...");
                                                var users = [];
                                                for(var i=0; i<data.length; i++) {
                                                    if(data[i].id.trim()!=='') {
                                                        users.push(data[i].id.trim());
                                                    }
                                                }
                                                self.ws.set_permissions(
                                                    {id: self.ws_info[0], new_permission:'a', users:users },
                                                    function() { self.refresh();},
                                                    function(error){self.reportError(error); self.refresh(); }
                                                );
                                            }))));
                    
                    $addUsersDiv.append(
                        $('<table>').css({'width':'100%'})
                            .append($('<tr>')
                                .append($('<td>').append($input))
                                .append($('<td>').append($addAction))));
                    
                    self.setupSelect2($input,'share with...');
                    self.$mainPanel.append($addUsersDiv);
                }
            
            
            
                var $othersDiv = $('<div>').css({
                        'margin-top':'15px',
                        'max-height':self.options.max_list_height,
                        'overflow-y':'auto',
                        'overflow-x':'hidden'
                        });
                var $tbl = $('<table>');
                $othersDiv.append($tbl);
                
                // sort
                self.ws_permissions.sort(function(a,b) {
                    if (a[1]!==b[1]) { // based on privilege first
                        var aLevel = 0; var bLevel = 0;
                        if(a[1]==='a') { aLevel=1; }
                        else if(a[1]==='w') { aLevel=2; }
                        else if(a[1]==='r') { aLevel=3; }
                        if(b[1]==='a') { bLevel=1; }
                        else if(b[1]==='w') { bLevel=2; }
                        else if(b[1]==='r') { bLevel=3; }
                        if(aLevel<bLevel) return -1;
                        if(aLevel>bLevel) return 1;
                    } // then on user name
                    if(a[0]<b[0]) return -1;
                    if(a[0]>b[0]) return 1;
                    return 0;
                });
                
                // show all other users
                for (var i=0; i<self.ws_permissions.length; i++) {
                    if (self.ws_permissions[i][0] !== self.my_user_id && self.ws_permissions[i][0] !== '*') {
                        var $select;
                        if (isOwner) {
                            var thisUser = self.ws_permissions[i][0];
                            // note that we can simply add a space since usernames cannot have spaces
                            $select = $('<select>').addClass('form-control kb-share-user-permissions-dropdown')
                                .append($('<option>').val(thisUser+' ---r').append('can view'))
                                .append($('<option>').val(thisUser+' ---w').append('can edit'))
                                .append($('<option>').val(thisUser+' ---a').append('can edit/share'))
                                .append($('<option>').val(thisUser+' ---n').append('remove access'))
                                .val(thisUser+' ---'+self.ws_permissions[i][1])
                                .on('change', function() {
                                    self.showWorking("updating permissions...");
                                    var tokens = $(this).val().split(' ---');
                                    self.ws.set_permissions(
                                        {
                                            id: self.ws_info[0],
                                            new_permission: tokens[1],
                                            users: [tokens[0]]
                                        },
                                        function () {
                                            self.refresh();
                                        },
                                        function(error){self.reportError(error); self.refresh(); }
                                    );
                                    
                                });
                        } else {
                            $select = $('<div>').addClass('form-control kb-share-user-permissions-dropdown');
                            if (self.ws_permissions[i][1]==='r') { $select.append('can view'); }
                            if (self.ws_permissions[i][1]==='w') { $select.append('can edit'); }
                            if (self.ws_permissions[i][1]==='a') { $select.append('can edit/share'); }
                        }
                        var user_display = self.renderUserIconAndName(self.ws_permissions[i][0],null,true);
                        $tbl.append(
                            $('<tr>')
                                .append($('<td>')
                                        .append(user_display[0]))
                                .append($('<td>').css({'padding':'4px','padding-top':'6px'})
                                        .append(user_display[1]).append($select)));
                    }
                }
                self.$mainPanel.append($othersDiv);
            }
        },
        
        
        /* private method - note: if placeholder is empty, then users cannot cancel a selection*/
        setupSelect2: function ($input, placeholder) {
            var self = this;
            var noMatchesFoundStr = "Search by Name or Username";//"no users found";
            $input.select2({
                matcher: self.select2Matcher,
                formatNoMatches: noMatchesFoundStr,
                placeholder:placeholder,
                allowClear: true,
                multiple: true,
                query: function (query) {
                    
                    var term = query.term.trim();
                    var results = [];
                    
                    if (term.length>=2) {
                        self.user_profile.filter_users({filter:term},
                            function(users) {
                                if (users.length>0) {
                                    for (var k=0; k<users.length; k++) {
                                        results.push({id:users[k].username, text:users[k].realname, found:true});
                                    }
                                    query.callback({results:results});
                                } else {
                                    // no matches in our profile, see if there was a globus match...
                                    term = term.toLowerCase();
                                    if(!/[^a-z0-9]/.test(term) ) {
                                        self.user_profile.lookup_globus_user([term],
                                            function(data) {
                                                if (data.hasOwnProperty(term)) {
                                                    results.push({id:term, text:data[term].fullName, found:false});
                                                } else {
                                                    results.push({id:term, text:term, found:false});
                                                }
                                                query.callback({results:results});
                                            },
                                            function(error) {
                                                // something went really wrong
                                                console.error(error);
                                                self.render();
                                                results.push({id:term, text:term, found:false});
                                                query.callback({results:results});
                                            });
                                    } else {
                                        results.push({id:term, text:term, found:false});
                                        query.callback({results:results});
                                    }
                                }
                            },
                            function(error) {
                                results.push({id:term,text:term, found:false});
                                console.error(error);
                                query.callback({results:results}); 
                            });
                    } else {
                       query.callback({results:results}); 
                    }
                },
                
                formatSelection: function(object, container) {
                    if (object.found) {
                        var toShow = self.renderUserIconAndName(object.id, object.text);
                        return $('<div>').append(toShow[0]).append(toShow[1].css({'white-space':'normal'})).html(); // wrapped in a div that we drop
                    }
                    return "<b>"+object.text+"</b> (not found)";
                },
                formatResult: function(object, container, query) {
                    if (object.found) {
                        var toShow = self.renderUserIconAndName(object.id, object.text);
                        // hack on a hack on a hack!
                        return $('<div>').append(toShow[0]).append(toShow[1].html()).html(); // wrapped in a div that we drop
                    }
                    return "<b>"+object.text+"</b> (not found)";
                }
            });
        },
        
        showWorking: function(message) {
            this.$mainPanel.empty();
            this.$mainPanel.append('<br><br><div style="text-align:center"><img src="' + this.options.loadingImage
                                   + '"><br>' + message + '</div>');
        },
        
        reportError: function(error) {
            console.error(error);
            this.$notificationPanel.append(
                $('<div>').addClass('alert alert-danger alert-dismissible').attr('role','alert')
                    .append('<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>')
                    .append('<strong>Error: </strong> '+error.error.message)
            );
        },
        
        refresh: function() {
            this.getInfoAndRender();    
        },
        
        colors : [
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
        ],
        
        renderUserIconAndName: function(username, realName, turnOnLink) {
            var code = 0;
            for(var i=0; i<username.length; i++) {
                code += username.charCodeAt(i);
            }
            var userColor = this.colors[ code % this.colors.length ];
            var $span =  $("<span>").addClass("fa fa-user").css({'color':userColor});
            
            var userString = username;
            if (username === this.my_user_id) {
                userString = " Me ("+username+")";
            } else if (realName) {
                userString = " "+realName+" ("+username+")";
            } else if (this.user_data[username]) {
                userString = " "+this.user_data[username].fullName+" ("+username+")";
            }
            
            var shortName = userString; var isShortened=false;
            if (userString.length>this.options.max_name_length) {
                shortName = shortName.substring(0,this.options.max_name_length-3)+'...';
                isShortened=true;
            }
            var $name =  $("<span>").css({'color':userColor, 'white-space':'nowrap'}).append(shortName);
            if (isShortened) { $name.tooltip({title:userString, placement:'bottom'}); }
            
            if (turnOnLink) {
                $name =  $('<a href="'+this.options.user_page_link+username+'" target="_blank">').append(
                            $("<span>").css({'color':userColor, 'white-space':'nowrap'}).append(shortName));
            }
            return [$span,$name];
        }
        
    });

});
