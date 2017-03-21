/*global define*/
/*jslint white: true*/
/**
 * Widget for viewing and modifying narrative share settings
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
define ([
    'bluebird',
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'select2'
], function (
        Promise,
        KBWidget,
        bootstrap,
        $,
        Config,
        kbaseAuthenticatedWidget
) {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeSharePanel',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            ws_url: Config.url('workspace'),
            user_profile_url: Config.url('user_profile'),
            loadingImage: Config.get('loading_gif'),
            user_page_link: Config.url('profile_page'),
            ws_name_or_id: null,
            max_name_length: 35,
            max_list_height: '250px',
            add_user_input_width: '200px'
        },
        ws: null, // workspace client
        user_profile: null, //user_profile client

        $mainPanel: null,
        $notificationPanel: null,
        init: function (options) {
            this._super(options);
            this.$notificationPanel = $('<div>');
            this.$elem.append(this.$notificationPanel);

            this.$mainPanel = $('<div>');
            this.$elem.append(this.$mainPanel);
            this.showWorking("loading narrative information");
            // this.getInfoAndRender();

            if (!this.options.ws_name_or_id) {
                //fail!
            }

            return this;
        },
        my_user_id: null,
        loggedInCallback: function (event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.user_profile = new UserProfile(this.options.user_profile_url, auth);
            this.my_user_id = auth.user_id;
            this.refresh();
            return this;
        },
        loggedOutCallback: function (event, auth) {
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
        getInfoAndRender: function () {
            if (!this.ws || !this.options.ws_name_or_id) {
                return;
            }
            var wsIdentity = {};
            if (this.options.ws_name_or_id) {
                if (/^[1-9]\d*$/.test(this.options.ws_name_or_id)) {
                    wsIdentity.id = parseInt(this.options.ws_name_or_id);
                } else {
                    wsIdentity.workspace = this.options.ws_name_or_id;
                }
            }


            // first get ws info
            Promise.resolve(this.ws.get_workspace_info(wsIdentity))
            .then(function (info) {
                this.ws_info = info;
                return Promise.resolve(this.ws.get_permissions(wsIdentity));
            }.bind(this))
            .then(function (perm) {
                this.ws_permissions = [];
                this.user_data = {};
                var usernameList = [ this.my_user_id ];
                for (var u in perm) {
                    if (perm.hasOwnProperty(u)) {
                        if (u !== '*') {
                            this.ws_permissions.push([u, perm[u]]);
                            usernameList.push(u);
                        }
                    }
                }
                return Promise.resolve(this.user_profile.lookup_globus_user(usernameList));
            }.bind(this))
            .then(function (data) {
                this.user_data = data;
            }.bind(this))
            .catch(function(error) {
                console.error(error);
                this.reportError(error);
            })
            .finally(function() {
                this.render();
            }.bind(this));
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
        isPrivate: true, // set if this ws is private or public
        render: function () {
            var self = this;
            if (!self.ws_info || !self.ws_permissions) {
                return;
            }
            self.$mainPanel.empty();

            var globalReadStatus = '<strong><span class="fa fa-lock" style="margin-right:10px"></span>Private</strong>';
            var globalReadClass = "alert alert-info";
            self.isPrivate = true;
            if (self.ws_info[6] === 'r') {
                self.isPrivate = false;
                globalReadClass = "alert alert-success";
                globalReadStatus = '<strong><span class="fa fa-unlock" style="margin-right:10px"></span>Public</strong>';
            }

            var $topDiv = $('<div>')
                .addClass(globalReadClass)
                .css({'text-align': 'center', 'padding': '10px', 'margin': '5px'})
                .append(globalReadStatus);
            self.$mainPanel.append($topDiv);

            var $togglePublicPrivate = $('<div>').css({'text-align': 'center'}).hide();
            if (self.isPrivate) {
                $togglePublicPrivate.append($('<a>').append('make public?')
                    .on('click', function () {
                        self.showWorking("updating permissions...");
                        self.ws.set_global_permission(
                            {id: self.ws_info[0], new_permission: 'r'},
                            function () {
                                self.refresh();
                            },
                            function (error) {
                                console.log(error);
                                self.refresh();
                            }
                        );
                    }));
            } else {
                $togglePublicPrivate.append($('<a>').append('make private?')
                    .on('click', function () {
                        self.showWorking("updating permissions...");
                        self.ws.set_global_permission(
                            {id: self.ws_info[0], new_permission: 'n'},
                            function () {
                                self.refresh();
                            },
                            function (error) {
                                self.reportError(error);
                                self.refresh();
                            }
                        );
                    }));
            }
            self.$mainPanel.append($togglePublicPrivate);

            var $meDiv = $('<div>').css({'margin': '5px', 'margin-top': '20px'});
            var status = "You do not have access to this Narrative.";
            var isOwner = false;
            if (self.ws_info[2] === self.my_user_id) {
                status = "You own this Narrative. You can edit it and share it with other users.";
                isOwner = true;
                $togglePublicPrivate.show();
            } else if (self.ws_info[5] === 'a') {
                status = "You can edit and share this Narrative.";
                isOwner = true;  // not really, but set this so we show sharing controls
                $togglePublicPrivate.show();
            } else if (self.ws_info[5] === 'w') {
                status = "You can edit this Narrative, but you cannot share it.";
            } else if (self.ws_info[5] === 'r' || self.ws_info[6] === 'r') { // either you can read it, or it is globally readable
                status = "You can view this Narrative, but you cannot edit or share it.";
            }
            var display = self.renderUserIconAndName(self.my_user_id, null, true);
            $meDiv.append(display[0], display[1]);
            $meDiv.append($('<div>').css({'margin-top': '10px'}).append(status));
            self.$mainPanel.append($meDiv);

            if (isOwner) {
                var $addUsersDiv = $('<div>').css({'margin-top': '10px'});
                var $input = $('<select multiple data-placeholder="Share with...">')
                    .addClass('kb-share-select');

                var $addAction =
                    $('<div>')
                    .addClass('btn-group')
                    .append($('<button>')
                        .addClass('btn btn-default dropdown-toggle ')
                        .attr('type', 'button')
                        .attr('data-toggle', 'dropdown')
                        .attr('aria-expanded', 'false')
                        .append('<span class="fa fa-caret-down"></span>'))
                    .append($('<ul>')
                        .addClass('dropdown-menu pull-right')
                        .attr('role', 'menu')
                        // TODO: pull-right is deprecated, use dropdown-menu-right when bootstrap updates
                        .append($('<li>').append(
                            $('<a>').append('Add with view privileges')
                            .on('click', function () {
                                var data = $input.select2("data");
                                self.showWorking("updating permissions...");
                                var users = [];
                                for (var i = 0; i < data.length; i++) {
                                    if (data[i].id.trim() !== '') {
                                        users.push(data[i].id.trim());
                                    }
                                }
                                self.ws.set_permissions(
                                    {id: self.ws_info[0], new_permission: 'r', users: users},
                                    function () {
                                        self.refresh();
                                    },
                                    function (error) {
                                        self.reportError(error);
                                        self.refresh();
                                    }
                                );
                            })))
                        .append($('<li>').append($('<a>').append('Add with edit privileges')
                            .on('click', function () {
                                var data = $input.select2("data");
                                self.showWorking("updating permissions...");
                                var users = [];
                                for (var i = 0; i < data.length; i++) {
                                    if (data[i].id.trim() !== '') {
                                        users.push(data[i].id.trim());
                                    }
                                }
                                self.ws.set_permissions(
                                    {id: self.ws_info[0], new_permission: 'w', users: users},
                                    function () {
                                        self.refresh();
                                    },
                                    function (error) {
                                        self.reportError(error);
                                        self.refresh();
                                    }
                                );
                            })))
                        .append($('<li>').append($('<a>').append('Add with edit/share privileges')
                            .on('click', function () {
                                var data = $input.select2("data");
                                self.showWorking("updating permissions...");
                                var users = [];
                                for (var i = 0; i < data.length; i++) {
                                    if (data[i].id.trim() !== '') {
                                        users.push(data[i].id.trim());
                                    }
                                }
                                self.ws.set_permissions(
                                    {id: self.ws_info[0], new_permission: 'a', users: users},
                                    function () {
                                        self.refresh();
                                    },
                                    function (error) {
                                        self.reportError(error);
                                        self.refresh();
                                    }
                                );
                            }))));

                $addUsersDiv.append($('<div>')
                    .append($input)
                    .append($addAction));

                self.setupSelect2($input);
                self.$mainPanel.append($addUsersDiv);
            }

            var $othersDiv = $('<div>').css({
                'margin-top': '15px',
                'max-height': self.options.max_list_height,
                'overflow-y': 'auto',
                'overflow-x': 'hidden'
            });
            var $tbl = $('<table>');
            $othersDiv.append($tbl);

            // sort
            self.ws_permissions.sort(function (a, b) {
                var getPermLevel = function(perm) {
                    switch (perm) {
                        case 'a':
                            return 1;
                        case 'w':
                            return 2;
                        case 'r':
                            return 3;
                        default:
                            return 0;
                    }
                };
                if (a[1] !== b[1]) { // based on privilege first
                    return getPermLevel(a[1]) - getPermLevel(b[1]);
                } // then on user name
                if (a[0] < b[0])
                    return -1;
                if (a[0] > b[0])
                    return 1;
                return 0;
            });

            // show all other users
            for (var i = 0; i < self.ws_permissions.length; i++) {
                if (self.ws_permissions[i][0] !== self.my_user_id && self.ws_permissions[i][0] !== '*') {
                    var $select;
                    if (isOwner) {
                        var thisUser = self.ws_permissions[i][0];
                        // note that we can simply add a space since usernames cannot have spaces
                        $select = $('<select>').addClass('form-control kb-share-user-permissions-dropdown')
                            .append($('<option>').val(thisUser + ' ---r').append('can view'))
                            .append($('<option>').val(thisUser + ' ---w').append('can edit'))
                            .append($('<option>').val(thisUser + ' ---a').append('can edit/share'))
                            .append($('<option>').val(thisUser + ' ---n').append('remove access'))
                            .val(thisUser + ' ---' + self.ws_permissions[i][1])
                            .on('change', function () {
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
                                    function (error) {
                                        self.reportError(error);
                                        self.refresh();
                                    }
                                );

                            });
                    } else {
                        $select = $('<div>').addClass('form-control kb-share-user-permissions-dropdown');
                        if (self.ws_permissions[i][1] === 'r') {
                            $select.append('can view');
                        }
                        if (self.ws_permissions[i][1] === 'w') {
                            $select.append('can edit');
                        }
                        if (self.ws_permissions[i][1] === 'a') {
                            $select.append('can edit/share');
                        }
                    }
                    var user_display = self.renderUserIconAndName(self.ws_permissions[i][0], null, true);
                    $tbl.append(
                        $('<tr>')
                        .append($('<td>')
                            .append(user_display[0]))
                        .append($('<td>').css({'padding': '4px', 'padding-top': '6px'})
                            .append(user_display[1]).append($select)));
                }
            }
            self.$mainPanel.append($othersDiv);
        },
        /* private method - note: if placeholder is empty, then users cannot cancel a selection*/
        setupSelect2: function ($input) {
            var self = this;
            var noMatchesFoundStr = 'Search by Name or Username';//"no users found";

            $.fn.select2.amd.require([
                'select2/data/array',
                'select2/utils'
            ], function(ArrayData, Utils) {
                function CustomData ($element, options) {
                    CustomData.__super__.constructor.call(this, $element, options);
                }
                Utils.Extend(CustomData, ArrayData);

                CustomData.prototype.query = function(params, callback) {
                    var term = params.term || '';
                    term = term.trim();
                    if (term.length >= 2) {
                        Promise.resolve(self.user_profile.filter_users({filter: term}))
                        .then(function(users) {
                            var results = [];
                            users.forEach(function(user) {
                                results.push({
                                    id: user.username,
                                    text: user.realname,
                                    found: true
                                });
                            });
                            return Promise.try(function() { return results; });
                        })
                        .then(function(results) {
                            if (results.length === 0) {
                                term = term.toLowerCase();
                                if (!/[^a-z0-9]/.test(term)) {
                                    return Promise.resolve(self.user_profile.lookup_globus_user([term]))
                                    .then(function(data) {
                                        var res = {
                                            id: term,
                                            text: term,
                                            found: false
                                        };
                                        if (data.hasOwnProperty(term)) {
                                            res.text = data[term].fullName;
                                        }
                                        return Promise.try(function() { return results; });
                                    });
                                } else {
                                    return Promise.try(function() {
                                        return [];
                                    });
                                }
                            } else {
                                return Promise.try(function() { return results; });
                            }
                        })
                        .then(function (results) {
                            if (results.length === 0) {
                                results = [{
                                    id: term,
                                    text: term,
                                    found: false
                                }];
                            }
                            callback({ results: results });
                        });
                    }
                    else {
                        callback({ results: [] });
                    }
                };

                $input.select2({
                    formatNoMatches: noMatchesFoundStr,
                    placeholder: function() {
                        return $(this).data('placeholder');
                    },
                    multiple: true,
                    dataAdapter: CustomData,
                    minimumResultsForSearch: 0,
                    language: {
                        noResults: function () {
                            return noMatchesFoundStr;
                        }
                    },
                    templateSelection: function (object) {
                        if (object.found) {
                            var toShow = self.renderUserIconAndName(object.id, object.text);
                            return $('<span>').append(toShow[0]).append(toShow[1].css({'white-space': 'normal'})).css({'width': '100%'});
                        }
                        return $('<b>' + object.text + '</b> (not found)');
                    },
                    templateResult: function (object) {
                        if (object.found) {
                            var toShow = self.renderUserIconAndName(object.id, object.text);
                            return $('<span>').append(toShow[0]).append(toShow[1]);
                        }
                        return $('<b>' + object.text + '</b> (not found)');
                    }
                });
                $input.trigger('change');
            });
        },
        showWorking: function (message) {
            this.$mainPanel.empty();
            this.$mainPanel.append('<br><br><div style="text-align:center"><img src="' + this.options.loadingImage
                + '"><br>' + message + '</div>');
        },
        reportError: function (error) {
            console.error(error);
            this.$notificationPanel.append(
                $('<div>').addClass('alert alert-danger alert-dismissible').attr('role', 'alert')
                .append('<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>')
                .append('<strong>Error: </strong> ' + error.error.message)
                );
        },
        refresh: function () {
            this.getInfoAndRender();
        },
        colors: [
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
            '#FFC107', //amber
            '#FF9800', //orange
            '#FF5722', //deep orange
            '#795548', //brown
            '#9E9E9E', //grey
            '#607D8B'  //blue grey
        ],
        renderUserIconAndName: function (username, realName, turnOnLink) {
            var code = 0;
            for (var i = 0; i < username.length; i++) {
                code += username.charCodeAt(i);
            }
            var userColor = this.colors[ code % this.colors.length ];
            var $span = $("<span>").addClass("fa fa-user").css({'color': userColor});

            var userString = username;
            if (username === this.my_user_id) {
                userString = " Me (" + username + ")";
            } else if (realName) {
                userString = " " + realName + " (" + username + ")";
            } else if (this.user_data[username]) {
                userString = " " + this.user_data[username].fullName + " (" + username + ")";
            }

            var shortName = userString;
            var isShortened = false;
            if (userString.length > this.options.max_name_length) {
                shortName = shortName.substring(0, this.options.max_name_length - 3) + '...';
                isShortened = true;
            }
            var $name = $("<span>").css({'color': userColor, 'white-space': 'nowrap'}).append(shortName);
            if (isShortened) {
                $name.tooltip({title: userString, placement: 'bottom'});
            }

            if (turnOnLink) {
                $name = $('<a href="' + this.options.user_page_link + username + '" target="_blank">').append(
                    $("<span>").css({'color': userColor, 'white-space': 'nowrap'}).append(shortName));
            }
            return [$span, $name];
        }

    });

});
