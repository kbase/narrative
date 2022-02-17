/**
 * Widget for displaying a list of Narratives and basic narrative management (copy, delete, share)
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
define([
    'jquery',
    'base/js/namespace',
    'narrativeConfig',
    'util/display',
    'bluebird',
    'kbwidget',
    'kbaseNarrativeControlPanel',
    'kbaseNarrativeSharePanel',
    'kbase-client-api',
    'kb_service/client/workspace',
    'kbase-generic-client-api',
    'util/timeFormat',
    'api/auth',
], (
    $,
    Jupyter,
    Config,
    DisplayUtil,
    Promise,
    KBWidget,
    ControlPanel,
    kbaseNarrativeSharePanel,
    KBaseClientAPI,
    Workspace,
    GenericClient,
    TimeFormat,
    Auth
) => {
    'use strict';
    return new KBWidget({
        name: 'kbaseNarrativeManagePanel',
        parent: ControlPanel,
        version: '1.0.0',
        wsClient: null,
        table: null,
        tableData: [],
        $loginMessage: null,
        $errorMessage: null,
        $loading: null,
        isLoggedIn: false,
        narrWs: null /* see setNarrWS */,
        // The set of all data currently loaded into the widget
        loadedData: {},
        options: {
            title: 'Narratives',
            loadingImage: Config.get('loading_gif'),
            ws_url: Config.url('workspace'),
            nms_url: Config.url('narrative_method_store'),
            profile_page_url: Config.url('profile_page'),
            nar_name: null,
            new_narrative_link: '/#narrativemanager/new',
        },
        ws: null,
        manager: null,
        serviceClient: null,
        ws_name: null,
        nar_name: null,
        $mainPanel: null,
        $newNarrativeLink: null, // when a new narrative is created, gives a place to link to it
        hasBeenActivated: false,

        init: function (options) {
            this._super(options);

            this.$mainPanel = $('<div>');
            this.body().append(this.$mainPanel);

            // the string name of the workspace.
            this.ws_name = Jupyter.narrative.getWorkspaceName();

            $([Jupyter.events]).on('notebook_saved.Notebook', () => {
                this.refresh();
            });

            // doesn't need a title, so just hide it to avoid padding.
            // yes, it's a hack. mea culpa.
            this.$elem.find('.kb-title').hide();
            return this;
        },

        my_user_id: null,
        activate: function () {
            if (!this.hasBeenActivated) {
                this.refresh();
                this.hasBeenActivated = true;
            }
        },

        loggedInCallback: function (event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth);

            this.my_user_id = auth.user_id;
            if (this.options.autopopulate) {
                this.refresh();
                this.hasBeenActivated = true;
            }
            return this;
        },
        loggedOutCallback: function () {
            this.ws = null;
            this.my_user_id = null;
            return this;
        },
        refresh: function () {
            if (!this.$narPanel) {
                this.renderHeader();
            }
            this.loadDataAndRenderPanel();
        },

        narData: null,
        tempNars: null,
        oldStyleWs: null,

        loadDataAndRenderPanel: function () {
            if (!this.ws) {
                return;
            }
            this.showLoading();
            this.narData = null;
            // look up all Narratives this user has access to.
            const proms = [
                Promise.resolve(
                    this.serviceClient.sync_call('NarrativeService.list_narratives', [
                        { type: 'mine' },
                    ])
                ),
                Promise.resolve(
                    this.serviceClient.sync_call('NarrativeService.list_narratives', [
                        { type: 'shared' },
                    ])
                ),
            ];
            let permsToLookup = [];
            Promise.all(proms)
                .spread((mine, shared) => {
                    // Manage the output from looking up narratives
                    this.narData = {
                        mine: mine[0].narratives,
                        shared: shared[0].narratives,
                    };
                    // Find out who and what permissions are available
                    permsToLookup = [
                        ...this.narData.mine.map((info) => {
                            return { id: info.ws[0] };
                        }),
                        ...this.narData.shared.map((info) => {
                            return { id: info.ws[0] };
                        }),
                    ];
                    const newProms = [];
                    for (let i = 0; i < permsToLookup.length; i += 1000) {
                        newProms.push(
                            Promise.resolve(
                                this.ws.get_permissions_mass({
                                    workspaces: permsToLookup.slice(i, i + 1000),
                                })
                            )
                        );
                    }
                    return Promise.all(newProms);
                })
                .then((permsData) => {
                    const perms = permsData.reduce((accumulator, cur) => {
                        return accumulator.concat(cur.perms);
                    }, []);
                    this.wsPerms = {};
                    perms.map((perm, idx) => {
                        this.wsPerms[permsToLookup[idx].id] = perm;
                    });
                })
                .then(() => {
                    // get the names of all ws owners
                    const owners = {};
                    this.narData.shared.map((info) => (owners[info.ws[2]] = 1));
                    const auth = Auth.make({ url: Config.url('auth') });
                    return auth.getUserNames(auth.getAuthToken(), Object.keys(owners));
                })
                .then((users) => {
                    this.narData.owners = users;
                })
                .then(() => {
                    this.renderPanel();
                })
                .catch((err) => {
                    console.error(err);
                });
        },

        showLoading: function () {
            this.$narPanel.html(
                '<br><center><img src="' + this.options.loadingImage + '"/></center><br>'
            );
        },

        renderHeader: function () {
            if (this.$mainPanel) {
                this.$mainPanel.empty();

                const $msgPanel = $('<div>').css({ margin: '10px', 'text-align': 'center' });
                const $newNarrPanel = $('<div>').css({ margin: '10px', 'text-align': 'center' });
                this.$copyThisNarrBtn = this.makeCopyThisNarrativeBtn($msgPanel);
                this.$mainPanel.append(
                    $('<div>')
                        .css({ margin: '10px', 'text-align': 'center' })
                        .append(this.makeNewNarrativeBtn($newNarrPanel))
                        .append(this.$copyThisNarrBtn)
                        .append($msgPanel)
                        .append($newNarrPanel)
                );
                this.$narPanel = $('<div>');
                this.$mainPanel.append(this.$narPanel);
            }
        },

        advancedSetNarLookup: {},
        sortNarrativesFunc: function (a, b) {
            if (a.error && b.error) {
                return 0;
            }
            if (a.error) {
                return 1;
            }
            if (b.error) {
                return -1;
            }
            return b.nar[3].localeCompare(a.nar[3]);
        },

        renderPanel: function () {
            const self = this,
                divider = '<hr class="kb-data-list-row-hr">';

            if (self.$narPanel && self.narData) {
                self.$narPanel.children().detach(); // this will also hide any loading messages if they exist

                if (self.narData.mine.length > 0) {
                    self.$narPanel.append(
                        $('<div>').append(
                            $('<div>').addClass('kb-nar-manager-titles').append('My Narratives')
                        )
                    );
                    self.narData.mine.sort(self.sortNarrativesFunc);
                    for (let k = 0; k < self.narData.mine.length; k++) {
                        if (!self.narData.mine[k].$div) {
                            self.narData.mine[k].$div = self.renderNarrativeDiv(
                                self.narData.mine[k]
                            );
                        }
                        self.$narPanel.append(divider);
                        self.$narPanel.append(self.narData.mine[k].$div);
                    }
                }

                if (self.narData.shared.length > 0) {
                    self.narData.shared.sort(self.sortNarrativesFunc);
                    self.$narPanel.append(
                        $('<div>').append(
                            $('<div>').addClass('kb-nar-manager-titles').append('Shared With Me')
                        )
                    );
                    for (let k = 0; k < self.narData.shared.length; k++) {
                        if (!self.narData.shared[k].$div) {
                            self.narData.shared[k].$div = self.renderNarrativeDiv(
                                self.narData.shared[k]
                            );
                        }
                        self.$narPanel.append(divider);
                        self.$narPanel.append(self.narData.shared[k].$div);
                    }
                }
            }
        },
        setInteractionError: function ($interactionPanel, errorMessage) {
            const $error = $('<span>').css({ color: '#F44336' }).append(errorMessage);
            this.setInteractionPanel($interactionPanel, 'Error', $error);
        },

        setInteractionPanel: function ($interactionPanel, title, body) {
            $interactionPanel.find('[data-element="title"]').html(title);
            $interactionPanel.find('[data-element="body"]').append(body);
        },

        toggleInteractionPanel: function ($interactionPanel, mode) {
            // If same mode, then strip down and hide the panel.
            const currentMode = $interactionPanel.data('mode');
            if (currentMode === mode) {
                $interactionPanel.find('[data-element="title"]').empty();
                $interactionPanel.find('[data-element="body"]').empty();
                $interactionPanel.hide();
                $interactionPanel.data('mode', 'inactive');
                $interactionPanel
                    .closest('.kb-data-list-obj-row')
                    .find('[data-button="' + mode + '"]')
                    .button('toggle');
                return false;
            }

            // If panel is not being used, just show it, if it is, then just
            // empty it but leave it open.
            if ($interactionPanel.data('mode') !== 'inactive') {
                $interactionPanel
                    .closest('.kb-data-list-obj-row')
                    .find('[data-button="' + currentMode + '"]')
                    .button('toggle');
                $interactionPanel.hide();
                $interactionPanel.find('[data-element="body"]').empty();
                $interactionPanel.find('[data-element="title"]').empty();
            }
            $interactionPanel
                .closest('.kb-data-list-obj-row')
                .find('[data-button="' + mode + '"]')
                .button('toggle');
            $interactionPanel.show();
            $interactionPanel.data('mode', mode);

            return true;
        },
        addDataControls: function (object_info, $interactionPanel, ws_info, isError) {
            const self = this;
            const $btnToolbarGroup = $('<div>')
                .addClass('btn-group pull-right')
                .attr('role', 'group');
            const $btnToolbar = $('<span>')
                .addClass('btn-toolbar')
                .attr('role', 'toolbar')
                .append($btnToolbarGroup);

            const btnClasses = 'btn btn-subtle btn-default';

            const $openHistory = $('<button>');
            if (!isError) {
                $openHistory
                    .addClass(btnClasses)
                    .attr('type', 'button')
                    .attr('data-button', 'history')
                    .tooltip({
                        title: 'View narrative history to revert changes',
                        container: 'body',
                    })
                    .append($('<span>').addClass('fa fa-history'))
                    .click((e) => {
                        e.stopPropagation();

                        const opened = self.toggleInteractionPanel($interactionPanel, 'history');
                        if (!opened) {
                            return;
                        }

                        if (self.ws_name && self.ws) {
                            self.ws.get_object_history(
                                { ref: object_info[6] + '/' + object_info[0] },
                                (history) => {
                                    history.reverse();
                                    let isCurrent = false;
                                    if (self.ws_name === ws_info[1]) {
                                        isCurrent = true;
                                    }
                                    const $tbl = $('<table>').css({ width: '100%' });
                                    for (let k = 0; k < history.length; k++) {
                                        const $revertBtn = $('<button>')
                                            .append('v' + history[k][4])
                                            .addClass('kb-data-list-btn');
                                        if (k === 0) {
                                            $revertBtn.tooltip({
                                                title: 'Current Version',
                                                container: 'body',
                                                placement: 'bottom',
                                            });
                                        } else if (history[k][4] === 1) {
                                            $revertBtn.tooltip({
                                                title: 'Cannot revert to first unsaved version',
                                                container: 'body',
                                                placement: 'bottom',
                                            });
                                        } else {
                                            const revertRef = {
                                                wsid: history[k][6],
                                                objid: history[k][0],
                                                ver: history[k][4],
                                            };
                                            (function (revertRefLocal) {
                                                $revertBtn
                                                    .tooltip({
                                                        title: 'Revert to this version?',
                                                        placement: 'bottom',
                                                    })
                                                    .click(() => {
                                                        self.ws.revert_object(
                                                            revertRefLocal,
                                                            (reverted_obj_info) => {
                                                                // update the workspace info with the specified name
                                                                self.ws.alter_workspace_metadata(
                                                                    {
                                                                        wsi: { id: ws_info[0] },
                                                                        new: {
                                                                            narrative_nice_name:
                                                                                reverted_obj_info[10]
                                                                                    .name,
                                                                        },
                                                                    },
                                                                    () => {
                                                                        if (isCurrent) {
                                                                            window.location.reload();
                                                                        } else {
                                                                            self.refresh();
                                                                        }
                                                                    },
                                                                    (error) => {
                                                                        const errorMessage =
                                                                            'Narrative reverted, but a minor data update error occured.' +
                                                                            error.error.message;
                                                                        console.error(
                                                                            errorMessage,
                                                                            error
                                                                        );
                                                                        self.setInteractionError(
                                                                            $interactionPanel,
                                                                            errorMessage
                                                                        );
                                                                    }
                                                                );
                                                            },
                                                            (error) => {
                                                                const errorMessage =
                                                                    'Error! ' + error.error.message;
                                                                console.error(errorMessage, error);
                                                                self.setInteractionError(
                                                                    $interactionPanel,
                                                                    errorMessage
                                                                );
                                                            }
                                                        );
                                                    });
                                            })(revertRef);
                                        }
                                        let summary = self.getNarSummary(history[k]);
                                        if (summary) {
                                            summary = '<br>' + summary;
                                        }
                                        $tbl.append(
                                            $('<tr>')
                                                .append($('<td>').append($revertBtn))
                                                .append(
                                                    $('<td>').append(
                                                        TimeFormat.getTimeStampStr(
                                                            history[k][3],
                                                            true
                                                        ) +
                                                            ' by ' +
                                                            history[k][5] +
                                                            summary
                                                    )
                                                )
                                                .append(
                                                    $('<td>')
                                                        .append(
                                                            $('<span>')
                                                                .css({ margin: '4px' })
                                                                .addClass('fa fa-info pull-right')
                                                        )
                                                        .tooltip({
                                                            title:
                                                                history[k][2] +
                                                                '<br>' +
                                                                history[k][10].name +
                                                                '<br>' +
                                                                history[k][8] +
                                                                '<br>' +
                                                                history[k][9] +
                                                                ' bytes',
                                                            container: 'body',
                                                            html: true,
                                                            placement: 'bottom',
                                                        })
                                                )
                                        );
                                    }
                                    self.setInteractionPanel(
                                        $interactionPanel,
                                        'Version History',
                                        $tbl
                                    );
                                },
                                (error) => {
                                    let msg = 'An unknown error occurred';
                                    if (error.error && error.error.message) {
                                        msg = error.error.message;
                                    }
                                    const errorMessage = 'Error! ' + msg;
                                    console.error(errorMessage, error);
                                    self.setInteractionError($interactionPanel, errorMessage);
                                }
                            );
                        }
                    });
            }

            const $copy = $('<button>');
            if (!isError) {
                $copy
                    .addClass(btnClasses)
                    .tooltip({ title: 'Copy Narrative and Data', container: 'body' })
                    .attr('data-button', 'copy')
                    .append($('<span>').addClass('fa fa-copy'))
                    .click((e) => {
                        e.stopPropagation();

                        const opened = self.toggleInteractionPanel($interactionPanel, 'copy');
                        if (!opened) {
                            return;
                        }

                        const $newNameInput = $('<input type="text">')
                            .addClass('form-control')
                            .val(ws_info[8].narrative_nice_name + ' - Copy')
                            .on('focus', () => {
                                Jupyter.narrative.disableKeyboardManager();
                            })
                            .on('blur', () => {
                                Jupyter.narrative.enableKeyboardManager();
                            });

                        const $copyDiv = $('<div>').append(
                            $('<div>')
                                .append($('<div>').append('Enter a name for the new Narrative'))
                                .append($('<div>').append($newNameInput))
                                .append(
                                    $('<button>')
                                        .addClass('kb-data-list-btn')
                                        .append('Copy')
                                        .click(function () {
                                            $(this).prop('disabled', true);
                                            self.copyNarrative(
                                                object_info[6] + '/' + object_info[0],
                                                $newNameInput.val()
                                            )
                                                .then(() => {
                                                    self.refresh();
                                                })
                                                .catch((error) => {
                                                    self.setInteractionError(
                                                        $interactionPanel,
                                                        'Sorry, an error occurred while copying!'
                                                    );
                                                    console.error(error);
                                                });
                                        })
                                )
                                .append(
                                    $('<button>')
                                        .addClass('kb-data-list-cancel-btn')
                                        .append('Cancel')
                                        .click(() => {
                                            self.toggleInteractionPanel($interactionPanel, 'copy');
                                        })
                                )
                        );
                        self.setInteractionPanel($interactionPanel, 'Copy Narrative', $copyDiv);
                    });
            }

            const $delete = $('<button>');
            if (!isError) {
                $delete
                    .addClass(btnClasses)
                    .attr('data-button', 'delete')
                    .tooltip({ title: 'Delete Narrative', container: 'body' })
                    .append($('<span>').addClass('fa fa-trash-o'))
                    .click((e) => {
                        e.stopPropagation();

                        const opened = self.toggleInteractionPanel($interactionPanel, 'delete');
                        if (!opened) {
                            return;
                        }

                        let warningMsg = 'Are you sure?';
                        let isCurrent = false;
                        if (self.ws_name === ws_info[1]) {
                            isCurrent = true;
                            warningMsg =
                                'Warning - you are currently viewing this Narrative!<br>You will be redirected to another Narrative if deleted.  Are you sure?';
                        }

                        const $deleteDiv = $('<div>')
                            .append($('<div>').append(warningMsg))
                            .append(
                                $('<button>')
                                    .addClass('kb-data-list-btn')
                                    .append('Delete')
                                    .click(() => {
                                        if (self.ws_name && self.ws) {
                                            self.ws.delete_workspace(
                                                { id: ws_info[0] },
                                                () => {
                                                    if (isCurrent) {
                                                        window.location.replace(
                                                            '/#narrativemanager/start'
                                                        );
                                                    } else {
                                                        self.refresh();
                                                    }
                                                },
                                                (error) => {
                                                    const errorMessage =
                                                        'Error! ' + error.error.message;
                                                    console.error(error);
                                                    self.setInteractionError(
                                                        $interactionPanel,
                                                        errorMessage
                                                    );
                                                }
                                            );
                                        }
                                    })
                            )
                            .append(
                                $('<button>')
                                    .addClass('kb-data-list-cancel-btn')
                                    .append('Cancel')
                                    .click(() => {
                                        self.toggleInteractionPanel($interactionPanel, 'delete');
                                    })
                            );
                        self.setInteractionPanel($interactionPanel, 'Delete Narrative', $deleteDiv);
                    });
            }

            $btnToolbarGroup.append($openHistory).append($copy).append($delete);

            return $btnToolbar;
        },
        renderNarrativeDiv: function (data) {
            /* data looks like:
             * {
                 ws_info: [array of ws info],
                 nar_info: [array of nar info]

               }
             */

            const self = this;

            let isCurrent = false,
                isError = false;
            if (this.ws_name === data.ws[1]) {
                isCurrent = true;
            }

            const $narDiv = $('<div>').addClass('kb-data-list-obj-row');

            const $dataCol = $('<td>').css({ 'text-align': 'left', 'vertical-align': 'top' });
            const $ctrCol = $('<td>').css({
                'text-align': 'right',
                'vertical-align': 'top',
                width: '80px',
            });
            const $ctrContent = $('<div>').css({ 'min-height': '60px' });
            $ctrCol.append($ctrContent);

            const $interactionPanel = $('<div>')
                .addClass('panel panel-default')
                .append(
                    $('<div>')
                        .addClass('panel-heading')
                        .append($('<span>').addClass('panel-title').attr('data-element', 'title'))
                        .append(
                            $('<button>')
                                .attr('type', 'button')
                                .addClass('close pull-right')
                                .attr('aria-label', 'Close')
                                .append($('<span>').attr('aria-hidden', 'true').html('&times;'))
                                .on('click', () => {
                                    self.toggleInteractionPanel(
                                        $interactionPanel,
                                        $interactionPanel.data('mode')
                                    );
                                })
                        )
                )
                .append($('<div>').addClass('panel-body').attr('data-element', 'body'))
                .data('mode', 'inactive')
                .hide();

            const narRef = 'ws.' + data.ws[0] + '.obj.' + data.ws[8].narrative;
            let nameText = narRef;
            let version = '';
            if (data.nar && data.nar[10].name) {
                nameText = data.nar[10].name;
                version = ' v' + data.nar[4];
            } else if (data.error && data.ws[8].narrative_nice_name) {
                nameText = data.ws[8].narrative_nice_name + ' (' + nameText + ')';
            }
            const $version = $('<span>').addClass('kb-data-list-version').append(version);
            const $priv = $('<span>')
                .css({ color: '#999', 'margin-left': '8px' })
                .prop('data-toggle', 'tooltip')
                .prop('data-placement', 'right');
            if (data.ws[5] === 'r') {
                $priv.addClass('fa fa-lock').prop('title', 'read-only');
            } else if (data.ws[5] === 'w' || data.ws[5] === 'a') {
                $priv.addClass('fa fa-pencil').prop('title', 'you can edit');
            }

            const $nameLink = $('<a href="' + narRef + '" target="_blank">');
            if (isCurrent) {
                $nameLink.append(
                    $('<span>')
                        .addClass('fa fa-circle')
                        .css({ 'margin-right': '3px', color: '#4BB856' })
                        .tooltip({ title: 'You are viewing this Narrative now' })
                );
            } else if (data.error) {
                $nameLink.append(
                    $('<span>')
                        .addClass('fa fa-circle')
                        .css({ 'margin-right': '3px', color: '#F44336' })
                        .tooltip({ title: 'This narrative has been corrupted.' })
                );
            }
            $nameLink.text(nameText).append($version).append($priv);
            $dataCol.append(
                $('<div>')
                    .addClass('kb-data-list-name')
                    .css({ 'white-space': 'normal', cursor: 'pointer' })
                    .append($nameLink)
            );

            // only display the rest if there was no error
            if (!data.error) {
                const $usrNameSpan = $('<span>').addClass('kb-data-list-type').append(data.ws[2]);
                if (data.ws[2] !== this._attributes.auth.user_id) {
                    $dataCol.append($usrNameSpan).append('<br>');
                    DisplayUtil.displayRealName(
                        data.ws[2],
                        $usrNameSpan,
                        this.narData.owners[data.ws[2]]
                    );
                }
                const summary = this.getNarSummary(data.nar);
                if (summary) {
                    $dataCol.append(
                        $('<span>').addClass('kb-data-list-narinfo').append(summary).append('<br>')
                    );
                }
                $dataCol.append(
                    $('<span>')
                        .addClass('kb-data-list-type')
                        .append(TimeFormat.getTimeStampStr(data.nar[3], true))
                );

                // Render the share toolbar layout.
                // it consists of just one button
                // var $shareContainer = $('<div>').hide();

                /* this is so gross */
                const $shareToolbarGroup = $('<div>')
                    .addClass('btn-group pull-right')
                    .attr('role', 'group');
                const $shareToolbar = $('<span>')
                    .addClass('btn-toolbar')
                    .attr('role', 'toolbar')
                    .append($shareToolbarGroup);
                $ctrContent.append($shareToolbar);

                let shareCount = -1; // our user is always going to be included, but will bump the count, since it's not "shared"
                const perms = this.wsPerms[data.ws[0]];
                shareCount += Object.keys(perms).length;
                if (perms['*']) {
                    shareCount--;
                }

                // should really put this in the addDatacontrols; so refactor at some point!
                $shareToolbarGroup.append(
                    $('<button>')
                        .addClass('btn btn-subtle btn-default')
                        .attr('data-button', 'share')
                        .tooltip({ title: 'View share settings', container: 'body' })
                        .append($('<span>').addClass('fa fa-share-alt'))
                        .append(' ' + shareCount)
                        .on('click', () => {
                            if (!self.toggleInteractionPanel($interactionPanel, 'share')) {
                                return;
                            }

                            const $sharingDiv = $('<div>');
                            self.setInteractionPanel(
                                $interactionPanel,
                                'Share Settings',
                                $sharingDiv
                            );
                            new kbaseNarrativeSharePanel($sharingDiv, {
                                ws_name_or_id: data.ws[0],
                                max_list_height: 'none',
                                add_user_input_width: '280px',
                            });
                        })
                );
            } else if (data.error) {
                isError = true;
                let errorMessage;
                if (data.error_msg) {
                    errorMessage = 'This Narrative has been corrupted: ' + data.error_msg;
                } else {
                    errorMessage = 'This Narrative has been corrupted.';
                }
                $dataCol.append(
                    $('<span>').addClass('kb-data-list-narrative-error').append(errorMessage)
                );
            }
            const $btnToolbar = self.addDataControls(data.nar, $interactionPanel, data.ws, isError);

            if (!isError) {
                // Set up basic interactivity -- hide and show controls with mouseover.
                $ctrContent.append($btnToolbar.hide());
                $narDiv
                    .mouseenter(() => {
                        $btnToolbar.show();
                    })
                    .mouseleave(() => {
                        if ($interactionPanel.data('mode') === 'inactive') {
                            $btnToolbar.hide();
                        }
                    });
            }

            $narDiv
                .append(
                    $('<table>')
                        .css({ width: '100%' })
                        .append($('<tr>').append($dataCol).append($ctrCol))
                )
                .append($interactionPanel);

            const $narDivContainer = $('<div>').append($narDiv);

            return $narDivContainer;
        },

        makeCopyThisNarrativeBtn: function ($alertContainer) {
            /* Flow -
             * 1. Click button.
             * 2. Button goes dim, turns into "Copying.." message.
             * 3. Shows input area, pre-populates with name.
             * 4. Shows "Copy" and "Cancel" buttons.
             * 5. text area below those for errors.
             * 6. Click "Copy" - shows 'copying...' text in message area
             *    - error? show error in message area
             *    - success? hide everything, clear text, refresh()
             * 7. Click "Cancel" - same as success.
             */

            const setButtonWorking = function (isWorking) {
                if (isWorking) {
                    $initCopyBtn.prop('disabled', true).empty().append('Copying Narrative...');
                } else {
                    $initCopyBtn
                        .prop('disabled', false)
                        .empty()
                        .append('<span class="fa fa-copy"></span> Copy This Narrative');
                    $doCopyBtn.prop('disabled', false);
                    $cancelBtn.prop('disabled', false);
                }
            };

            /* Clicking this should disable it, then show the passed $alertContainer
             */
            const $initCopyBtn = $('<button>')
                .addClass('kb-primary-btn')
                .click(() => {
                    setButtonWorking(true);
                    $newNameInput.val(Jupyter.notebook.get_notebook_name() + ' - Copy');
                    $alertContainer.slideDown();
                });

            /* This is the input box for the new narrative name.
             * Gets pre-populated with the current narrative name + "- copy"
             * When empty, prompts to enter a name with a tooltip, and disables the copy btn.
             */
            const $newNameInput = $('<input type="text">')
                .addClass('form-control')
                .tooltip({
                    title: 'Please enter a name.',
                    container: 'body',
                    placement: 'right',
                    trigger: 'manual',
                })
                .on('focus', () => {
                    Jupyter.narrative.disableKeyboardManager();
                })
                .on('blur', () => {
                    Jupyter.narrative.enableKeyboardManager();
                })
                .on('input', () => {
                    const v = $newNameInput.val();
                    if (!v) {
                        $newNameInput.tooltip('show');
                        $doCopyBtn.prop('disabled', true);
                    } else {
                        $newNameInput.tooltip('hide');
                        $doCopyBtn.prop('disabled', false);
                    }
                });

            const $errorMessage = $('<div>').css({ color: '#F44336' });

            /*
             * Does the actual copy and displays the error if that happens.
             */
            const $doCopyBtn = $('<button>')
                .addClass('kb-primary-btn')
                .append('Copy')
                .click(() => {
                    $errorMessage.empty();
                    $doCopyBtn.prop('disabled', true);
                    $cancelBtn.prop('disabled', true);
                    Jupyter.narrative
                        .getNarrativeRef()
                        .then((narrativeRef) => {
                            return this.copyNarrative(narrativeRef, $newNameInput.val());
                        })
                        .then(() => {
                            $alertContainer.hide();
                            setButtonWorking(false);
                            this.refresh();
                        })
                        .catch((error) => {
                            if (error && error.error && error.error.message) {
                                $errorMessage.append(error.error.message);
                            } else {
                                $errorMessage.append(
                                    'Sorry, an error occurred while copying. Please try again.'
                                );
                            }
                            $doCopyBtn.prop('disabled', false);
                            $cancelBtn.prop('disabled', false);
                        });
                });

            const $cancelBtn = $('<button>')
                .addClass('kb-default-btn')
                .append('Cancel')
                .click(() => {
                    $doCopyBtn.prop('disabled', false);
                    $alertContainer.slideUp();
                    $newNameInput.tooltip('hide');
                    setButtonWorking(false);
                });

            setButtonWorking(false);
            $alertContainer
                .append(
                    $('<div>')
                        .append($('<div>').append('Enter a name for the new Narrative'))
                        .append($('<div>').append($newNameInput))
                        .append($doCopyBtn)
                        .append($cancelBtn)
                        .append($errorMessage)
                )
                .hide();

            return $initCopyBtn;
        },

        /**
         * @method
         * @private
         * Copies the existing Narrative into a new one with a new name.
         * Performs the following chained async steps.
         * 0. Preflight - makes sure the user's logged in, and we have the
         *    required workspace ref for the narrative.
         * 1. Get the Narrative object. with ws.get_objects
         * 2. Clone the workspace, but LEAVE OUT the current Narrative. We'll make a new one
         *    that isn't littered by previous versions that'll be broken on revert.
         * 3. Update the narrative object with references to the new workspace, strip out
         *    any existing jobs, and save it to the new workspace.
         * 4. Update the new workspace's metadata so it references the new Narrative.
         */
        copyNarrative: function (workspaceRef, newName) {
            let preCheckError = null;
            if (!this.ws) {
                preCheckError = 'Cannot copy - please sign in again.';
            } else if (!workspaceRef) {
                preCheckError =
                    'Cannot copy - cannot find Narrative id. Please refresh the page and try again.';
            }
            if (preCheckError) {
                return Promise.reject(preCheckError);
            }
            // name of the narrative object in the workspace. used for closure.

            return Promise.resolve(
                this.serviceClient.sync_call('NarrativeService.copy_narrative', [
                    {
                        workspaceRef: workspaceRef,
                        newName: newName,
                    },
                ])
            ).then((result) => {
                result = result[0];
                return {
                    status: 'success',
                    url: [
                        window.location.origin,
                        '/narrative/ws.',
                        result.newWsId,
                        '.obj.',
                        result.newNarId,
                    ].join(''),
                };
            });
        },

        makeNewNarrativeBtn: function ($msgPanel) {
            const activeStr = '<span class="fa fa-plus"></span> New Narrative',
                workingStr = 'Building...',
                doneStr = 'Link below',
                errorStr = 'Error!';
            const $btn = $('<button>')
                .addClass('kb-primary-btn')
                .append(activeStr)
                .on('click', () => {
                    $btn.prop('disabled', true).empty().append(workingStr);
                    Promise.resolve(
                        this.serviceClient.sync_call('NarrativeService.create_new_narrative', [
                            { includeIntroCell: 1 },
                        ])
                    )
                        .then((results) => {
                            $btn.empty().append(doneStr);
                            const url = '/narrative/' + results[0].narrativeInfo.obj_id;
                            const $newNarrLink = $('<a>')
                                .attr('href', url)
                                .attr('target', '_blank')
                                .append('Click here to open your new temporary Narrative.')
                                .click(() => {
                                    $msgPanel.slideUp();
                                    $btn.empty().append(activeStr).prop('disabled', false);
                                });
                            $msgPanel.empty().append($newNarrLink).slideDown();
                        })
                        .catch((error) => {
                            console.error(error);
                            const $errorAlert = $('<div>')
                                .addClass('alert alert-danger')
                                .attr('role', 'alert');
                            const $dismissBtn = $(
                                '<button type="button" class="close" aria-label="Close">'
                            )
                                .append('<span aria-hidden="true">&times;</span>')
                                .click(() => {
                                    $errorAlert.remove();
                                    $msgPanel.slideUp();
                                    $btn.empty().append(activeStr).prop('disabled', false);
                                });
                            $errorAlert
                                .append($dismissBtn)
                                .append(
                                    'Sorry, an error occurred while creating your new Narrative. Please try again.'
                                );
                            $btn.empty().append(errorStr);
                            $msgPanel.empty().append($errorAlert).slideDown();
                        });
                });
            return $btn;
        },

        getNarSummary: function (nar_info) {
            const summary = [],
                counts = {
                    apps: 0,
                    md: 0,
                    code: 0,
                    viewers: 0,
                };
            if (nar_info[10].methods) {
                const content = JSON.parse(nar_info[10].methods);
                counts.apps += content.app.length + content.method.length;
                counts.viewers += content.output;
                counts.code += content.ipython.code;
                counts.md += content.ipython.markdown;
            }
            Object.keys(nar_info[10]).forEach((key) => {
                if (key === 'jupyter.markdown') {
                    counts.md += nar_info[10][key];
                } else if (key.startsWith('method.') || key.startsWith('app.')) {
                    counts.apps += parseInt(nar_info[10][key]);
                }
            });
            if (counts.apps > 0) {
                summary.push(counts.apps + ' App' + (counts.apps > 1 ? 's' : ''));
            }
            if (counts.viewers > 0) {
                summary.push(counts.viewers + ' Viewer' + (counts.viewers > 1 ? 's' : ''));
            }
            if (counts.code > 0) {
                summary.push(counts.code + ' Code Cell' + (counts.code > 1 ? 's' : ''));
            }
            if (counts.markdown > 0) {
                summary.push(counts.markdown + ' Md Cell' + (counts.markdown > 1 ? 's' : ''));
            }
            return summary.join(', ');
        },
    });
});
