/* global Workspace */
/**
 * Widget for viewing and modifying narrative share settings
 * @author Michael Sneddon <mwsneddon@lbl.gov>, Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define([
    'bluebird',
    'kbwidget',
    'bootstrap',
    'jquery',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'api/auth',
    'util/string',
    'select2',
], (Promise, KBWidget, bootstrap, $, Config, kbaseAuthenticatedWidget, Auth, StringUtil) => {
    'use strict';
    const className = 'kb-share-panel';

    return KBWidget({
        name: 'kbaseNarrativeSharePanel',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            ws_url: Config.url('workspace'),
            groups_url: Config.url('groups'),
            loadingImage: Config.get('loading_gif'),
            user_page_link: Config.url('profile_page'),
            ws_name_or_id: null,
            max_name_length: 35,
            add_user_input_width: '200px',
            wsID: Config.get('workspaceId'),
        },
        ws: null, // workspace client
        narrOwner: null,
        $mainPanel: null,
        $notificationPanel: null,
        init: function (options) {
            this._super(options);
            this.$notificationPanel = $('<div>');
            this.$elem.append(this.$notificationPanel);
            this.$mainPanel = $('<div>').addClass(className);
            this.$elem.append(this.$mainPanel);
            this.showWorking('loading narrative information');

            if (!this.options.ws_name_or_id) {
                //fail!
            }
            return this;
        },
        my_user_id: null,
        orgList: null,
        narrativeOrgList: null,

        loggedInCallback: function (event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.authClient = Auth.make({ url: Config.url('auth') });
            this.my_user_id = auth.user_id;

            const p1 = this.fetchOrgs(this.authClient.getAuthToken());
            const p2 = this.fetchNarrativeOrgs(this.options.wsID, this.authClient.getAuthToken());
            Promise.all([p1, p2]).then(() => {
                this.refresh();
            });
            return this;
        },
        loggedOutCallback: function () {
            this.ws = null;
            this.authClient = null;
            this.my_user_id = null;
            this.orgList = null;
            this.narrativeOrgList = null;
            this.refresh();
            return this;
        },

        /**
         * fetch organizations that user is associated.
         * @param {string} token  authorization token
         */
        fetchOrgs: function (token) {
            const groupUrl = this.options.groups_url + '/member';
            return fetch(groupUrl, {
                method: 'GET',
                mode: 'cors',
                json: true,
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((response) => {
                    this.orgList = response;
                })
                .catch((error) =>
                    console.error('Error while fetching groups associated with the user:', error)
                );
        },
        /**
         * fetch organization info from id
         * extract logo url and map it to org id with org name.
         * @param {string} org org id
         * @param {string} token auth token
         * @param {Map} map empty map
         */
        fetchOrgLogoUrl: function (org, token, map) {
            map.set(org.id, [org.name]);
            const groupUrl = this.options.groups_url + '/group/' + org.id;
            return fetch(groupUrl, {
                method: 'GET',
                mode: 'cors',
                json: true,
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((response) => {
                    const arr = map.get(org.id);
                    map.set(org.id, [arr, response.custom.logourl]);
                    this.narrativeOrgList = map;
                })
                .catch((error) => console.error('Error while fetching group info:', error));
        },
        /**
         * fetch organizations that workspace is associated.
         * @param {int} wsID workspace id
         * @param {string} token  authorization token
         */
        fetchNarrativeOrgs: function (wsID, token) {
            const groupUrl =
                this.options.groups_url + '/group?resourcetype=workspace&resource=' + wsID;
            return fetch(groupUrl, {
                method: 'GET',
                mode: 'cors',
                json: true,
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((response) => {
                    const orgInfoMap = new Map();
                    return Promise.all(
                        response.map((org) => this.fetchOrgLogoUrl(org, token, orgInfoMap))
                    );
                })
                .catch((error) =>
                    console.error(
                        'Error while fetching groups associated with the workspace:',
                        error
                    )
                );
        },

        ws_info: null,
        ws_permissions: null,
        user_data: {},
        all_users: null,
        getInfoAndRender: function () {
            const self = this;
            if (!self.ws || !self.options.ws_name_or_id) {
                return;
            }
            const wsIdentity = {};
            if (self.options.ws_name_or_id) {
                if (/^[1-9]\d*$/.test(self.options.ws_name_or_id)) {
                    wsIdentity.id = parseInt(self.options.ws_name_or_id);
                } else {
                    wsIdentity.workspace = self.options.ws_name_or_id;
                }
            }

            Promise.resolve(self.ws.get_workspace_info(wsIdentity))
                .then((info) => {
                    self.ws_info = info;
                    self.narrOwner = info[2];
                    return Promise.resolve(self.ws.get_permissions(wsIdentity));
                })
                .then((perm) => {
                    self.ws_permissions = [];
                    self.user_data = {};
                    const usernameList = [self.my_user_id];
                    Object.keys(perm).forEach((u) => {
                        if (u === '*') {
                            return;
                        }
                        self.ws_permissions.push([u, perm[u]]);
                        usernameList.push(u);
                    });
                    return self.authClient.getUserNames(
                        self.authClient.getAuthToken(),
                        usernameList
                    );
                })
                .then((data) => {
                    self.user_data = data;
                })
                .catch((error) => {
                    console.error(error);
                    self.reportError(error);
                })
                .finally(() => {
                    self.render();
                });
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
            const self = this;
            if (!self.ws_info || !self.ws_permissions) {
                return;
            }
            self.$mainPanel.empty();

            let globalReadStatus = `<strong><span class="fa fa-lock ${className}__global_read_icon"></span>Private</strong>`;
            let globalReadClass = `${className}__global_read_status alert`;
            self.isPrivate = true;
            if (self.ws_info[6] === 'r') {
                self.isPrivate = false;
                globalReadClass += ' alert-success';
                globalReadStatus = `<strong><span class="fa fa-unlock ${className}__global_read_icon"></span>Public</strong>`;
            } else {
                globalReadClass += ' alert-info';
            }

            const $topDiv = $('<div>').addClass(globalReadClass).append(globalReadStatus);
            self.$mainPanel.append($topDiv);

            const $togglePublicPrivate = self.makePublicPrivateToggle().hide();
            self.$mainPanel.append($togglePublicPrivate);

            // meDiv
            const $meDiv = $('<div>').addClass(`${className}__my_access`);
            let status = 'You do not have access to this Narrative.';
            let isAdmin = false;
            let isOwner = false;
            if (self.narrOwner === self.my_user_id) {
                status =
                    'You can edit and share this Narrative with other users or request to add to an organization.';
                isAdmin = true;
                isOwner = true;
                $togglePublicPrivate.show();
            } else if (self.ws_info[5] === 'a') {
                status =
                    'You can edit and share this Narrative, but you cannot request to add to an organization.';
                isAdmin = true; // not really, but set this so we show sharing controls
                $togglePublicPrivate.show();
            } else if (self.ws_info[5] === 'w') {
                status = 'You can edit this Narrative, but you cannot share it.';
            } else if (self.ws_info[5] === 'r' || self.ws_info[6] === 'r') {
                // either you can read it, or it is globally readable
                status = 'You can view this Narrative, but you cannot edit or share it.';
            }
            $meDiv.append(status);
            if (isAdmin) {
                $meDiv.append(
                    $('<p>')
                        .addClass(`${className}__doi_request`)
                        .append(
                            'Please email <a href="mailto:engage@kbase.us">engage@kbase.us</a> for a DOI prior to publishing.</p>'
                        )
                );
            }
            self.$mainPanel.append($meDiv);

            /**
             * Tabs to select share with users or org
             *     - $tab1 for sharing user
             *     - $tab2 for sharing with org
             */
            const $tabDiv = $('<div>').addClass(`${className}__tabs`);

            // make divs for each tab.
            const $tab1 = createTab(true, true, 'Users');

            $tab1.click(function () {
                tabSwitch($(this), $tab2);
                $shareWithOrgDiv.css('display', 'none');
                $shareWithUserDiv.css('display', 'inherit');
            });
            $tabDiv.append($tab1);

            const $tab2 = createTab(false, false, 'Orgs');
            $tab2.click(function () {
                tabSwitch($(this), $tab1);
                $shareWithOrgDiv.css('display', 'inherit');
                $shareWithUserDiv.css('display', 'none');
            });
            $tabDiv.append($tab2);

            function createTab(isLeft, isSelected, text) {
                let classes = `${className}__tabs__share`;
                if (isSelected) {
                    classes += ' selected';
                }
                classes += isLeft ? ' left' : ' right';
                return $(`<div class="${classes}">`).append(text);
            }

            function tabSwitch(tab, otherTab) {
                tab.addClass('selected');
                otherTab.removeClass('selected');
            }

            self.$mainPanel.append($tabDiv);
            // end of share tabs

            /**
             * Tab content div /$tabContent
             *     - share with user div /$shareWithUserDiv
             *     - share with org div /$shareWithOrgDiv
             */
            const $tabContent = $(`<div class="${className}__tabs__content">`);

            const $shareWithUserDiv = $('<div id="shareWUser" class="content">').css({
                display: 'inherit',
            });
            const $shareWithOrgDiv = $('<div id="shareWOrg" class="content">').css({
                display: 'none',
            });

            // Content of Share with Org (Request to add to Org) Div
            if (isOwner) {
                const $addOrgDiv = $('<div>');
                const $inputOrg = $(
                    '<select single data-placeholder="Associate with..." id="orgInput">'
                ).addClass('form-control kb-share-select');
                $inputOrg.append('<option></option>'); // option is needed for placeholder to work.

                const $applyOrgBtn = $('<button>')
                    .addClass(`btn btn-primary disabled ${className}__btn_apply_orgs`)
                    .append('Apply')
                    .click(function () {
                        if (!$(this).hasClass('disabled')) {
                            const org = $inputOrg.select2('data');
                            const orgID = org[0]['id'];
                            self.requestAddNarrative(self.authClient.getAuthToken(), orgID);
                        }
                    });

                self.orgSetupSelect2($inputOrg);

                $addOrgDiv.append($inputOrg).append($applyOrgBtn);

                $inputOrg.on('select2:select', () => {
                    if ($inputOrg.select2('data').length > 0) {
                        $applyOrgBtn.removeClass('disabled');
                    }
                });
                $inputOrg.on('select2:unselect', () => {
                    if ($inputOrg.select2('data').length === 0) {
                        $applyOrgBtn.addClass('disabled');
                    }
                });

                $addOrgDiv.find('span.select2-selection--single');
                $shareWithOrgDiv.append($addOrgDiv); // put addOrgDiv into shareWithOrgDiv

                // if there are orgs already associated with the narrative, add the org list.
                if (this.narrativeOrgList) {
                    const $narrativeOrgsDiv = $('<table>').addClass(`${className}__orgs_table`);
                    this.narrativeOrgList.forEach((value, key) => {
                        const url = window.location.origin + '/#org/' + key;
                        const $href = $('<a>').attr('href', url);
                        const $logo = $('<img>')
                            .attr('src', value[1])
                            .addClass(`${className}__org_icon`);
                        $href.append($logo).append(value[0]);
                        const $tr = $('<tr>').append($href);
                        $narrativeOrgsDiv.append($tr);
                    });
                    $shareWithOrgDiv.append($narrativeOrgsDiv); // put list of narrative div
                }
            } else {
                $shareWithOrgDiv.append(
                    `<p class="${className}__org_owner_message">You must be the owner to request to add this narrative.</p>`
                );
            } // end of if(isOwner)

            // content of share with user div
            if (isAdmin) {
                const $addUsersDiv = $('<div>');
                const $input = $('<select multiple data-placeholder="Share with...">').addClass(
                    'form-control kb-share-select'
                );

                const $permSelect = $('<select>')
                    .append($('<option value="r">').append('View only'))
                    .append($('<option value="w">').append('Edit and save'))
                    .append($('<option value="a">').append('Edit, save, and share'));

                const $applyBtn = $('<button>')
                    .addClass('btn btn-primary disabled')
                    .append('Apply')
                    .click(function () {
                        if (!$(this).hasClass('disabled')) {
                            const users = $input.select2('data');
                            const perm = $permSelect.val();
                            self.updateUserPermissions(users, perm);
                        }
                    });

                $addUsersDiv.append($input).append($permSelect).append($applyBtn);

                self.setupSelect2($input);
                $permSelect.select2({
                    minimumResultsForSearch: Infinity,
                });
                $input.on('select2:select', () => {
                    if ($input.select2('data').length > 0) {
                        $applyBtn.removeClass('disabled');
                    }
                });
                $input.on('select2:unselect', () => {
                    if ($input.select2('data').length === 0) {
                        $applyBtn.addClass('disabled');
                    }
                });

                $shareWithUserDiv.append($addUsersDiv);
            } // end of if(isAdmin)

            // add share with.., divs to tab content
            $tabContent.append($shareWithUserDiv, $shareWithOrgDiv);
            // add tab content to the main panel
            self.$mainPanel.append($tabContent);
            // end of Tab content divs

            // div contains other users sharing the narrative
            const $othersDiv = $('<div>').addClass(`${className}__shared_users_table`);
            const $tbl = $('<table>');
            $othersDiv.append($tbl);

            // sort
            self.ws_permissions.sort((a, b) => {
                const getPermLevel = function (perm) {
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
                if (a[1] !== b[1]) {
                    // based on privilege first
                    return getPermLevel(a[1]) - getPermLevel(b[1]);
                } // then on user name
                if (a[0] < b[0]) return -1;
                if (a[0] > b[0]) return 1;
                return 0;
            });

            // show all other users
            for (let i = 0; i < self.ws_permissions.length; i++) {
                if (
                    self.ws_permissions[i][0] === self.my_user_id ||
                    self.ws_permissions[i][0] === '*'
                ) {
                    continue;
                }
                let $select;
                let $removeBtn = null;
                const thisUser = self.ws_permissions[i][0];
                if (isAdmin && thisUser !== self.narrOwner) {
                    $select = $('<select>')
                        .addClass('form-control kb-share-user-permissions-dropdown')
                        .attr('user', thisUser)
                        .append($('<option>').val('r').append('can view'))
                        .append($('<option>').val('w').append('can edit'))
                        .append($('<option>').val('a').append('can edit/share'))
                        .val(self.ws_permissions[i][1])
                        .on('change', function () {
                            self.showWorking('updating permissions...');
                            self.updateUserPermissions(
                                [{ id: $(this).attr('user') }],
                                $(this).val()
                            );
                        });
                    $removeBtn = $('<span>')
                        .attr('user', thisUser)
                        .addClass('btn btn-xs btn-danger')
                        .append($('<span>').addClass('fa fa-times'))
                        .click(function () {
                            self.updateUserPermissions([{ id: $(this).attr('user') }], 'n');
                        });
                } else {
                    $select = $('<div>').addClass(
                        'form-control kb-share-user-permissions-dropdown'
                    );
                    if (thisUser === self.narrOwner) {
                        $select.append('owns this Narrative');
                    } else if (self.ws_permissions[i][1] === 'w') {
                        $select.append('can edit');
                    } else if (self.ws_permissions[i][1] === 'a') {
                        $select.append('can edit/share');
                    } else {
                        $select.append('can view');
                    }
                }
                const user_display = self.renderUserIconAndName(
                    self.ws_permissions[i][0],
                    null,
                    true
                );
                const $userRow = $('<tr>')
                    .append($('<td>').addClass('user_icon'))
                    .append(user_display[0])
                    .append($('<td>').addClass('user_name').append(user_display[1]))
                    .append($('<td>').addClass('user_perm_select').append($select));
                if ($removeBtn) {
                    $userRow.append($('<td>').addClass('user_remove_btn').append($removeBtn));
                }
                $tbl.append($userRow);
            }
            $shareWithUserDiv.append($othersDiv);
        },

        /**
         * Send request to add narrative to a organization.
         * Returns either {"complete": true} or a Request with the additional field "complete" with a value of false.
         * @param {string} token // authorization token
         */

        requestAddNarrative: function (token, orgID) {
            const ws_id = this.ws_info[0];
            const groupResourceUrl =
                this.options.groups_url + '/group/' + orgID + '/resource/workspace/' + ws_id;
            fetch(groupResourceUrl, {
                method: 'POST',
                mode: 'cors',
                json: true,
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((response) => {
                    if (response.error) {
                        this.reportError(response);
                    }
                })
                .catch((error) => {
                    console.error('Error while sending request to add narrative:', error);
                    if (error) {
                        this.reportError(error);
                    }
                });
        },

        /**
         * Updates user permissions to the current Narrative.
         * userData: list of objects. This typically comes from Select2, so it has some baggage.
         *           We just need the 'id' property.
         * newPerm: string, one of [a (all), w (write), r (read), n (none)].
         *          Gets applied to all users.
         */
        updateUserPermissions: function (userData, newPerm) {
            const users = [];
            for (let i = 0; i < userData.length; i++) {
                if (userData[i].id.trim() !== '') {
                    users.push(userData[i].id.trim());
                }
            }
            if (users.length === 0) {
                return;
            }
            this.showWorking('updating permissions...');
            Promise.resolve(
                this.ws.set_permissions({
                    id: this.ws_info[0],
                    new_permission: newPerm,
                    users: users,
                })
            )
                .catch(function (error) {
                    this.reportError(error);
                })
                .finally(() => {
                    this.refresh();
                });
        },

        makePublicPrivateToggle: function () {
            let commandStr = 'make public?';
            let newPerm = 'r';
            const self = this;
            if (!self.isPrivate) {
                commandStr = 'make private?';
                newPerm = 'n';
            }
            return $('<a href="#">' + commandStr + '</a>').click((e) => {
                e.preventDefault();
                self.showWorking('updating permissions...');
                Promise.resolve(
                    self.ws.set_global_permission({
                        id: self.ws_info[0],
                        new_permission: newPerm,
                    })
                )
                    .catch((error) => {
                        self.reportError(error);
                    })
                    .finally(() => {
                        self.refresh();
                    });
            });
        },

        /* private method - note: if placeholder is empty, then users cannot cancel a selection*/
        setupSelect2: function ($input) {
            const self = this;
            const noMatchesFoundStr = 'Search by Name or Username';

            $.fn.select2.amd.require(
                ['select2/data/array', 'select2/utils'],
                (ArrayData, Utils) => {
                    function CustomData($element, options) {
                        CustomData.__super__.constructor.call(this, $element, options);
                    }
                    Utils.Extend(CustomData, ArrayData);

                    CustomData.prototype.query = function (params, callback) {
                        let term = params.term || '';
                        term = term.trim();
                        if (term.length >= 2) {
                            Promise.resolve(self.authClient.searchUserNames(null, term)).then(
                                (users) => {
                                    let results = [];
                                    Object.keys(users).forEach((username) => {
                                        if (username !== self.my_user_id) {
                                            results.push({
                                                id: username,
                                                text: users[username],
                                                found: true,
                                            });
                                        }
                                    });
                                    if (results.length === 0) {
                                        results = [
                                            {
                                                id: term,
                                                text: term,
                                                found: false,
                                            },
                                        ];
                                    }
                                    callback({ results: results });
                                }
                            );
                        } else {
                            callback({ results: [] });
                        }
                    };

                    $input.select2({
                        formatNoMatches: noMatchesFoundStr,
                        placeholder: function () {
                            return $(this).data('placeholder');
                        },
                        delay: 250,
                        width: '40%',
                        dataAdapter: CustomData,
                        minimumResultsForSearch: 0,
                        language: {
                            noResults: function () {
                                return noMatchesFoundStr;
                            },
                        },
                        templateSelection: function (object) {
                            if (object.found) {
                                const toShow = self.renderUserIconAndName(
                                    object.id,
                                    object.text,
                                    false,
                                    true
                                );
                                return $('<span>')
                                    .addClass(`${className}__share_user_selected`)
                                    .append(toShow[0])
                                    .append(toShow[1]);
                            }
                            return $('<b>' + object.text + '</b> (not found)');
                        },
                        templateResult: function (object) {
                            if (object.found) {
                                const toShow = self.renderUserIconAndName(object.id, object.text);
                                return $('<span>').append(toShow[0]).append(toShow[1]);
                            }
                            return $('<b>' + object.text + '</b> (not found)');
                        },
                    });
                    $input.trigger('change');
                }
            );
        },
        // setting up Select2 for inputOrg
        orgSetupSelect2: function ($inputOrg) {
            const self = this;
            const orgList = self.orgList;
            const orgData = [];
            const noMatchedOrgFoundStr = 'Search by Organization name';

            $.fn.select2.amd.require(['select2/data/array', 'select2/utils'], () => {
                if (!orgList) return;
                orgList.forEach((org) => {
                    orgData.push({ id: org.id, text: org.name });
                });
                $inputOrg.select2({
                    formatNoMatches: noMatchedOrgFoundStr,
                    placeholder: function () {
                        return $(this).data('placeholder');
                    },
                    delay: 250,
                    width: '40%',
                    data: orgData,
                    minimumResultsForSearch: 0,
                    allowClear: true,
                    language: {
                        noResults: function () {
                            return noMatchedOrgFoundStr;
                        },
                    },
                });
                $inputOrg.trigger('change');
            });
        },

        showWorking: function (message) {
            this.$mainPanel.empty();
            this.$mainPanel.append(
                '<br><br><div style="text-align:center"><img src="' +
                    this.options.loadingImage +
                    '"><br>' +
                    message +
                    '</div>'
            );
        },
        reportError: function (error) {
            console.error(error);
            this.$notificationPanel.append(
                $('<div>')
                    .addClass('alert alert-danger alert-dismissible')
                    .attr('role', 'alert')
                    .append(
                        '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>'
                    )
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
            '#607D8B', //blue grey
        ],
        renderUserIconAndName: function (username, realName, turnOnLink, wrapName) {
            let code = 0;
            for (let i = 0; i < username.length; i++) {
                code += username.charCodeAt(i);
            }
            const userColor = this.colors[code % this.colors.length];
            const $span = $('<span>').addClass('fa fa-user').css({ color: userColor });

            let userString = username;
            if (username === this.my_user_id) {
                userString = ' Me (' + username + ')';
            } else if (realName) {
                userString = ' ' + realName + ' (' + username + ')';
            } else if (this.user_data[username]) {
                userString = ' ' + this.user_data[username] + ' (' + username + ')';
            }

            let shortName = userString;
            let isShortened = false;
            if (userString.length > this.options.max_name_length) {
                shortName = shortName.substring(0, this.options.max_name_length - 3) + '...';
                isShortened = true;
            }
            const nameClass = wrapName ? `wrap` : `nowrap`;
            let $name = $('<span>')
                .addClass(`${className}__${nameClass}`)
                .css({ color: userColor })
                .append(StringUtil.escape(shortName));
            if (isShortened) {
                $name.tooltip({ title: userString, placement: 'bottom' });
            }

            if (turnOnLink) {
                $name = $(
                    '<a href="' + this.options.user_page_link + username + '" target="_blank">'
                ).append(
                    $('<span>')
                        .addClass(`${className}__${nameClass}`)
                        .css({ color: userColor })
                        .append(StringUtil.escape(shortName))
                );
            }
            return [$span, $name];
        },
    });
});
