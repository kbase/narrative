/* global define */
/* eslint-env browser */
/**
 * Widget for displaying a list of Narratives and basic narrative management (copy, delete, share)
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
define([
    'jquery',
    'base/js/namespace',
    'narrativeConfig',
    'narrativeManager',
    'util/display',
    'bluebird',
    'kbwidget',
    'kbaseNarrativeControlPanel',
    'api/NewWorkspace',
    'kbase-generic-client-api'
], function (
    $,
    Jupyter,
    Config,
    NarrativeManager,
    DisplayUtil,
    Promise,
    KBWidget,
    ControlPanel,
    NewWorkspace,
    GenericClient
) {
    'use strict';
    return new KBWidget({
        name: "kbaseNarrativeManagePanel",
        parent : ControlPanel,
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
            loadingImage: Config.get('loading_gif'),
            ws_url: Config.url('workspace'),
            nms_url: Config.url('narrative_method_store'),
            profile_page_url: Config.url('profile_page'),
            nar_name: null,
            new_narrative_link: "/#narrativemanager/new"
        },
        ws: null,
        manager: null,
        serviceClient: null,
        ws_name: null,
        nar_name: null,
        $mainPanel: null,
        $newNarrativeLink: null, // when a new narrative is created, gives a place to link to it

        init: function (options) {
            this._super(options);

            this.$mainPanel = $('<div>');
            this.body().append(this.$mainPanel);

            // the string name of the workspace.
            this.ws_name = Jupyter.narrative.getWorkspaceName();

            // the workspace ref of this Narrative object. (w/o version)
            this.workspaceRef = Jupyter.narrative.workspaceRef;
            this.workspaceId = Jupyter.narrative.workspaceId;

            $(document).on(
                'copyThis.Narrative', function (e, panel, active, jump) {
                    console.debug("CopyThisNarrative triggered, params=",
                        {panel: panel, active: active, jump: jump});
                    this.copyThisNarrative(panel, active, jump)
                }.bind(this)
            );

            $([Jupyter.events]).on(
                'notebook_saved.Notebook', function (e) {
                    this.refresh();
                }.bind(this)
            );

            // doesn't need a title, so just hide it to avoid padding.
            // yes, it's a hack. mea culpa.
            this.$elem.find('.kb-title').hide();
            return this;
        },

        my_user_id: null,
        loggedInCallback: function (event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.manager = new NarrativeManager({ws_url: this.options.ws_url, nms_url: this.options.nms_url}, auth);
            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth);

            this.my_user_id = auth.user_id;
            this.refresh();
            return this;
        },
        loggedOutCallback: function (event, auth) {
            this.ws = null;
            this.manager = null;
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
        allNarInfo: null,
        tempNars: null,
        oldStyleWs: null,
        loadDataAndRenderPanel: function () {
            if (!this.ws)
                return;
            this.narData = null;
            var narRefsToLookup = [];
            var wsPermsToLookup = [];
            this.showLoading();

            /**
             * Loading and rendering flow.
             * 1. Get users workspace infos (owned and shared, not global)
             * 2. Look at metadata for 'narrative' tag - if present, that ws has a Narrative.
             *    a. Add the object id in that tag to the narRefsToLookUp var.
             *    b. Add that ws to wsPermsToLookup
             * 3. Make a pile of Promises.
             *    a. One to fetch all object info for those Narratives (assuming it's under 10000, that'll get fixed if it gets larger)
             *    b. One for each batch of 1000 workspaces to get permissions for
             */
            var wsInfoProm = Promise.resolve(this.ws.list_workspace_info({excludeGlobal: 1}));

            var narDataProm = wsInfoProm
            .then(function (wsList) {
                this.narData = {
                    mine: [],
                    shared: [],
                    pub: [],
                    temp: [],
                    allWs: []
                };
                this.allNarData = [];
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
                var allNarInfo = [];
                for (var i = 0; i < wsList.length; i++) {
                    if (wsList[i][8]) { // must have metadata or else we skip

                        // if it is temporary, we skip
                        if (wsList[i][8].is_temporary) {
                            if (wsList[i][8].is_temporary === 'true') {
                                this.narData.temp.push({ws_info: wsList[i]});
                                continue;
                            }
                        }
                        //must have the new narrative tag, or else we skip
                        if (wsList[i][8].narrative) {
                            var info = {
                                ws_info: wsList[i],
                                nar_info: null,
                                $div: null
                            };
                            if (wsList[i][2] === this._attributes.auth.user_id) {
                                this.allNarData.push(info);
                                this.narData.mine.push(info);
                                narRefsToLookup.push({ref: info.ws_info[0] + "/" + wsList[i][8].narrative});
                                wsPermsToLookup.push({id: info.ws_info[0]});
                            } else if (wsList[i][5] === 'a' || wsList[i][5] === 'w' || wsList[i][5] === 'r') {
                                this.allNarData.push(info);
                                this.narData.shared.push(info);
                                narRefsToLookup.push({ref: info.ws_info[0] + "/" + wsList[i][8].narrative});
                                wsPermsToLookup.push({id: info.ws_info[0]});
                            }
                        }
                        if (wsList[i][5] === 'a' || wsList[i][5] === 'w') {
                            // allWs is used for advanced management options, which we only
                            // have if we have admin or write access
                            this.narData.allWs.push({ws_info: wsList[i]});
                        }
                    }
                }
                var newProms = []
                /*
                 * set up Promises - first is for all Narrative object info, rest are for WS permissions
                 */
                if (narRefsToLookup.length > 0) {
                    var objInfoProm = Promise.resolve(this.ws.get_object_info_new({objects: narRefsToLookup, includeMetadata: 1, ignoreErrors: 1}));
                    newProms.push(objInfoProm);

                    for (var i=0; i<wsPermsToLookup.length; i+=1000) {
                        newProms.push(Promise.resolve(this.ws.get_permissions_mass({workspaces: wsPermsToLookup.slice(i, i+1000)})));
                    }
                }
                return Promise.all(newProms);
            }.bind(this))
            .then(function(results) { //objList = results[0], rest are permList chunks
                /*
                 * Now we have a set of objects and permissions for each narrative.
                 * The arrays are in the same order, so keep them parallel when the permission list gets merged.
                 */
                var objList = results.shift();
                var permList = [];
                for (var i=0; i<results.length; i++) {
                    permList = permList.concat(results[i].perms);
                }
                // If no narratives, we're done!
                if (!objList)
                    return;

                var errorProms = [];
                /*
                 * Go through each object and permission pair, merge them together in this.allNarData.
                 * If it's not a Narrative object, then create an error.
                 * In the end, allNarData will be a list like this:
                 * {
                 *   nar_info: { get_object_info_new result },
                 *   perms : { get_permissions_mass result },
                 *   error : boolean
                 * }
                 */
                for (var i = 0; i < objList.length; i++) {
                    this.allNarData[i].perms = permList[i];
                    if (objList[i] !== null && objList[i][2].indexOf('KBaseNarrative.Narrative') === 0) {
                        this.allNarData[i].nar_info = objList[i];
                    } else {
                        // If this isn't a KBaseNarrative.Narrative, then it's wrong!
                        // look up the object, and expect to see an error.
                        // This is all done as a set of promises, so they'll get dealt with when theyre returned.
                        this.allNarData[i].error = true;
                        var errorIndex = i;

                        errorProms.push(Promise.resolve(this.ws.get_object_info_new({
                            objects: [narRefsToLookup[errorIndex]],
                            includeMetadata: 1,
                            ignoreErrors: 0
                        }))
                        .then(function(error_obj_info) {
                            if (error_obj_info[0][2].indexOf('KBaseNarrative.Narrative') === 0) {
                                // this should not work!! but if it does, fine, remove the error and save the info
                                this.allNarData[errorIndex].error = false;
                                this.allNarData[errorIndex].nar_info = error_obj_info[0];
                            } else {
                                // could give an error message here stating that the workspace is pointing to a non-narrative object
                                //this.allNarData[errorIndex].error_msg = error.error.message;
                            }
                        }.bind(this))
                        .catch(function(error) {
                            this.allNarData[errorIndex].error_msg = error.error.message;
                            this.allNarData[errorIndex].$div = null;
                        }.bind(this)));
                    }
                }
                return Promise.all(errorProms);
            }.bind(this))
            .then(function() {
                // At this stage, this.allNarData should be fully populated.
                this.renderPanel();
            }.bind(this))
            .catch(function(error) {
                console.error(error);
            });
        },

        showLoading: function () {
            this.$narPanel.html('<br><center><img src="' + this.options.loadingImage + '"/></center><br>');
        },

        renderHeader: function () {
            var self = this;
            if (self.$mainPanel) {
                self.$mainPanel.empty();

                var $msgPanel = $("<div>").css({'margin': '10px', 'text-align': 'center'});
                self.$copyThisNarrBtn = self.makeCopyThisNarrativeBtn($msgPanel);
                self.$mainPanel.append(
                    $('<div>').css({'margin': '10px', 'text-align': 'center'})
                    .append(self.makeNewNarrativeBtn())
                    .append(self.$copyThisNarrBtn)
                    .append($msgPanel));

                self.$narPanel = $('<div>');
                self.$mainPanel.append(self.$narPanel);
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
            if (a.nar_info[3] > b.nar_info[3])
                return -1; // sort by date
            if (a.nar_info[3] < b.nar_info[3])
                return 1;  // sort by date
            return 0;
        },

        renderPanel: function () {
            var self = this,
                divider = '<hr class="kb-data-list-row-hr">';

            if (self.$narPanel && self.narData) {
                self.$narPanel.children().detach(); // this will also hide any loading messages if they exist

                if (self.narData.mine.length > 0) {
                    self.$narPanel.append($('<div>').append($('<div>').addClass('kb-nar-manager-titles').append("My Narratives")));
                    self.narData.mine.sort(self.sortNarrativesFunc);
                    for (var k = 0; k < self.narData.mine.length; k++) {
                        if (!self.narData.mine[k].$div) {
                            self.narData.mine[k].$div = self.renderNarrativeDiv(self.narData.mine[k]);
                        }
                        self.$narPanel.append(divider);
                        self.$narPanel.append(self.narData.mine[k].$div);
                    }
                }

                if (self.narData.shared.length > 0) {
                    self.narData.shared.sort(self.sortNarrativesFunc);
                    self.$narPanel.append($('<div>').append($('<div>').addClass('kb-nar-manager-titles').append("Shared With Me")));
                    for (var k = 0; k < self.narData.shared.length; k++) {
                        if (!self.narData.shared[k].$div) {
                            self.narData.shared[k].$div = self.renderNarrativeDiv(self.narData.shared[k]);
                        }
                        self.$narPanel.append(divider);
                        self.$narPanel.append(self.narData.shared[k].$div);
                    }
                }


                // ADVANCED TAB: allows users to set the default narrative for any workspace
                var $advancedDiv = $('<div>').hide();
                var $advLink = $('<h4>').append("Show Advanced Controls");
                self.$narPanel.append($('<div>').append($('<span>').append($("<a>").append($advLink)))
                    .css({'text-align': 'center', 'cursor': 'pointer'})
                    .on('click', function () {
                        if ($advancedDiv.is(":visible")) {
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
                    $('<div>').addClass('form-group').css({'text-align': 'center'})
                    .append($('<label for="setPrimaryNarSelectWs">').append("Set Active Narrative for Workspace"))
                    .append($selectWsContainer)
                    .append($selectNarContainer)
                    .append($setBtn));

                self.narData.allWs.sort(function (a, b) {
                    if (a.ws_info[1].toLowerCase() > b.ws_info[1].toLowerCase())
                        return 1; // sort by name
                    if (a.ws_info[1].toLowerCase() < b.ws_info[1].toLowerCase())
                        return -1;  // sort by name
                    return 0;
                });

                for (var k = 0; k < self.narData.allWs.length; k++) {
                    var info = self.narData.allWs[k].ws_info;
                    $selectWsContainer.append($('<option value="' + info[1] + '">').append(info[1] + ' (id=' + info[0] + ')'));
                }
                $selectWsContainer.on('change',
                    function () {
                        $selectNarContainer.empty();
                        self.ws.list_objects({
                            workspaces: [$selectWsContainer.val()],
                            type: "KBaseNarrative.Narrative",
                            includeMetadata: 1
                        },
                            function (objList) {
                                if (objList.length == 0) {
                                    $selectNarContainer.append($('<option value="none">').append('No Narratives'));
                                    $setBtn.prop('disabled', true);
                                    $selectNarContainer.prop('disabled', true);
                                    return;
                                }
                                $setBtn.prop('disabled', false);
                                $selectNarContainer.prop('disabled', false);

                                // sort by date
                                objList.sort(function (a, b) {
                                    if (a[3] > b[3])
                                        return -1; // sort by date
                                    if (a[3] < b[3])
                                        return 1;  // sort by date
                                    return 0;
                                });
                                self.advancedSetNarLookup = {};
                                // add the list to the select
                                for (var i = 0; i < objList.length; i++) {
                                    var narDispName = objList[i][1];
                                    if (objList[i][10].name) {
                                        narDispName = objList[i][10].name;
                                    }
                                    self.advancedSetNarLookup[objList[i][0]] = narDispName;
                                    $selectNarContainer.append($('<option value="' + objList[i][0] + '">')
                                        .append(narDispName + ' (id=' + objList[i][0] + ')'));
                                }
                            },
                            function (error) {
                                console.error(error);
                            });

                        $selectNarContainer.show();
                        $setBtn.show();
                    });
                $selectWsContainer.change();
                $setBtn.on('click',
                    function () {
                        // should only get here if it was a valid WS/Nar combo
                        var ws = $selectWsContainer.val();
                        var nar = $selectNarContainer.val();
                        $(this).prop('disabled', true).empty().append("please wait...");
                        // should probably be moved to NarrativeManager
                        self.ws.alter_workspace_metadata({
                            wsi: {workspace: ws},
                            new : {
                                'narrative': nar,
                                'is_temporary': 'false',
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
        setInteractionError: function ($interactionPanel, errorMessage) {
            var $error = $('<span>')
                .css({'color': '#F44336'})
                .append(errorMessage);
            this.setInteractionPanel($interactionPanel, 'Error', $error);
        },
        setInteractionPanel: function ($interactionPanel, title, body) {
            $interactionPanel.find('[data-element="title"]').html(title);
            $interactionPanel.find('[data-element="body"]').append(body);
        },
        toggleInteractionPanel: function ($interactionPanel, mode) {
            // If same mode, then strip down and hide the panel.
            var currentMode = $interactionPanel.data('mode');
            if (currentMode === mode) {
                $interactionPanel.find('[data-element="title"]').empty();
                $interactionPanel.find('[data-element="body"]').empty();
                // $interactionPanel.slideToggle('fast');
                $interactionPanel.hide();
                $interactionPanel.data('mode', 'inactive');
                $interactionPanel.closest('.kb-data-list-obj-row').find('[data-button="' + mode + '"]').button('toggle');
                return false;
            }

            // If panel is not being used, just show it, if it is, then just
            // empty it but leave it open.
            if ($interactionPanel.data('mode') !== 'inactive') {
                $interactionPanel.closest('.kb-data-list-obj-row').find('[data-button="' + currentMode + '"]').button('toggle');
                $interactionPanel.hide();
                $interactionPanel.find('[data-element="body"]').empty();
                $interactionPanel.find('[data-element="title"]').empty();
            }
            $interactionPanel.closest('.kb-data-list-obj-row').find('[data-button="' + mode + '"]').button('toggle');
            // $interactionPanel.slideToggle('fast');
            $interactionPanel.show();
            $interactionPanel.data('mode', mode);

            return true;
        },
        addDataControls: function (object_info, $interactionPanel, ws_info, isError) {
            var self = this;
            var $btnToolbarGroup = $('<div>')
                .addClass('btn-group pull-right')
                .attr('role', 'group');
            var $btnToolbar = $('<span>')
                .addClass('btn-toolbar')
                .attr('role', 'toolbar')
                .append($btnToolbarGroup);

            var btnClasses = "btn btn-subtle btn-default";

            var $openHistory = $('<button>');
            if (!isError) {
                $openHistory
                    .addClass(btnClasses)
                    .attr('type', 'button')
                    .attr('data-button', 'history')
                    .tooltip({title: 'View narrative history to revert changes', 'container': 'body'})
                    .append(
                        $('<span>')
                        .addClass('fa fa-history')
                        )
                    .click(function (e) {
                        e.stopPropagation();

                        var opened = self.toggleInteractionPanel($interactionPanel, 'history');
                        if (!opened) {
                            return;
                        }

                        if (self.ws_name && self.ws) {
                            self.ws.get_object_history({ref: object_info[6] + "/" + object_info[0]},
                                function (history) {
                                    history.reverse();
                                    var isCurrent = false;
                                    if (self.ws_name === ws_info[1]) {
                                        isCurrent = true;
                                    }
                                    var $tbl = $('<table>').css({'width': '100%'});
                                    for (var k = 0; k < history.length; k++) {
                                        var $revertBtn = $('<button>').append('v' + history[k][4]).addClass('kb-data-list-btn');
                                        if (k === 0) {
                                            $revertBtn.tooltip({title: 'Current Version', 'container': 'body', placement: 'bottom'});
                                        } else if (history[k][4] === 1) {
                                            $revertBtn.tooltip({title: 'Cannot revert to first unsaved version', 'container': 'body', placement: 'bottom'});
                                        } else {
                                            var revertRef = {wsid: history[k][6], objid: history[k][0], ver: history[k][4]};
                                            (function (revertRefLocal) {
                                                $revertBtn.tooltip({title: 'Revert to this version?', placement: 'bottom'})
                                                    .click(function () {
                                                        self.ws.revert_object(revertRefLocal,
                                                            function (reverted_obj_info) {
                                                                // update the workspace info with the specified name
                                                                self.ws.alter_workspace_metadata({
                                                                    wsi: {id: ws_info[0]},
                                                                    new : {'narrative_nice_name': reverted_obj_info[10].name}},
                                                                    function () {
                                                                        if (isCurrent) {
                                                                            window.location.reload();
                                                                        } else {
                                                                            self.refresh();
                                                                        }
                                                                    },
                                                                    function (error) {
                                                                        var errorMessage = "Narrative reverted, but a minor data update error occured." + error.error.message;
                                                                        console.log(errorMessage);
                                                                        console.log(error);
                                                                        self.setInteractionError($interactionPanel, errorMessage);

                                                                    });
                                                            }, function (error) {
                                                            var errorMessage = "Error! " + error.error.message;
                                                            console.log(errorMessage);
                                                            console.error(error);
                                                            self.setInteractionError($interactionPanel, errorMessage);
                                                        });
                                                    });
                                            })(revertRef);
                                        }
                                        var summary = self.getNarSummary(history[k]);
                                        if (summary) {
                                            summary = '<br>' + summary;
                                        }
                                        $tbl.append($('<tr>')
                                            .append($('<td>').append($revertBtn))
                                            .append($('<td>').append(self.getTimeStampStr(history[k][3]) + ' by ' + history[k][5] + summary))
                                            .append($('<td>').append($('<span>').css({margin: '4px'}).addClass('fa fa-info pull-right'))
                                                .tooltip({title: history[k][2] + '<br>' + history[k][10].name + '<br>' + history[k][8] + '<br>' + history[k][9] + ' bytes', container: 'body', html: true, placement: 'bottom'}))
                                            );
                                    }
                                    self.setInteractionPanel($interactionPanel, 'Version History', $tbl);
                                },
                                function (error) {
                                    var errorMessage = "Error! " + error.error.message;
                                    console.log(errorMessage);
                                    console.error(error);
                                    self.setInteractionError($interactionPanel, errorMessage);
                                });
                        }
                    });
            }

            var $copy = $('<button>');
            if (!isError) {
                $copy
                    .addClass(btnClasses)
                    .tooltip({title: 'Copy Narrative and Data', 'container': 'body'})
                    .attr('data-button', 'copy')
                    .append(
                        $('<span>')
                        .addClass('fa fa-copy')
                        )
                    .click(function (e) {
                        e.stopPropagation();

                        var opened = self.toggleInteractionPanel($interactionPanel, 'copy');
                        if (!opened) {
                            return;
                        }

                        var $newNameInput = $('<input type="text">')
                            .addClass('form-control')
                            .val(ws_info[8].narrative_nice_name + ' - Copy')
                            .on('focus', function () {
                                Jupyter.narrative.disableKeyboardManager();
                            })
                            .on('blur', function () {
                                Jupyter.narrative.enableKeyboardManager();
                            });

                        var $copyDiv = $('<div>')
                            .append(
                                $('<div>')
                                .append(
                                    $('<div>').append("Enter a name for the new Narrative")
                                    )
                                .append(
                                    $('<div>').append($newNameInput)
                                    )
                                .append($('<button>')
                                    .addClass('kb-data-list-btn')
                                    .append('Copy')
                                    .click(function () {
                                        $(this).prop("disabled", true);
                                        self.copyThisNarrative($newNameInput.val())
                                        .then(function() {
                                            self.refresh();
                                        })
                                        .catch(function(error) {
                                            self.setInteractionError($interactionPanel, "Sorry, an error occurred while copying!");
                                            console.error(error);
                                        });
                                    }))
                                .append($('<button>').addClass('kb-data-list-cancel-btn')
                                    .append('Cancel')
                                    .click(function () {
                                        self.toggleInteractionPanel($interactionPanel, 'copy');
                                    }))
                                );
                        self.setInteractionPanel($interactionPanel, 'Copy Narrative', $copyDiv);
                    });
            }

            var $delete = $('<button>');
            if (!isError) {
                $delete
                    .addClass(btnClasses)
                    .attr('data-button', 'delete')
                    .tooltip({title: 'Delete Narrative', 'container': 'body'})
                    .append($('<span>').addClass('fa fa-trash-o'))
                    .click(function (e) {
                        e.stopPropagation();

                        var opened = self.toggleInteractionPanel($interactionPanel, 'delete');
                        if (!opened) {
                            return;
                        }

                        var warningMsg = 'Are you sure?';
                        var isCurrent = false;
                        if (self.ws_name === ws_info[1]) {
                            isCurrent = true;
                            warningMsg = 'Warning - you are currently viewing this Narrative!<br>You will be redirected to another Narrative if deleted.  Are you sure?';
                        }

                        var $deleteDiv = $('<div>')
                            .append($('<div>').append(warningMsg))
                            .append($('<button>')
                                .addClass('kb-data-list-btn')
                                .append('Delete')
                                .click(function () {
                                    if (self.ws_name && self.ws) {
                                        self.ws.delete_workspace({id: ws_info[0]},
                                            function () {
                                                if (isCurrent) {
                                                    window.location.replace('/#narrativemanager/start');
                                                } else {
                                                    self.refresh();
                                                }
                                            },
                                            function (error) {
                                                var errorMessage = "Error! " + error.error.message;
                                                console.log(errorMessage);
                                                console.error(error);
                                                self.setInteractionError($interactionPanel, errorMessage);
                                            });
                                    }
                                }))
                            .append($('<button>').addClass('kb-data-list-cancel-btn')
                                .append('Cancel')
                                .click(function () {
                                    self.toggleInteractionPanel($interactionPanel, 'delete')
                                }));
                        self.setInteractionPanel($interactionPanel, 'Delete Narrative', $deleteDiv);
                    });
            }

            $btnToolbarGroup
                .append($openHistory)
                .append($copy)
                .append($delete);

            return $btnToolbar;
        },
        renderNarrativeDiv: function (data) {
            var self = this,
                isError = false;

            var isCurrent = false;
            if (this.ws_name === data.ws_info[1]) {
                isCurrent = true;
            }

            var $narDiv = $('<div>').addClass('kb-data-list-obj-row');

            var $tbl = $('<table>').css({'width': '100%'});
            var $dataCol = $('<td>').css({'text-align': 'left', 'vertical-align': 'top'});
            var $ctrCol = $('<td>').css({'text-align': 'right', 'vertical-align': 'top', 'width': '80px'});
            var $ctrContent = $('<div>').css({'min-height': '60px'});
            $ctrCol.append($ctrContent);

            var $interactionPanel = $('<div>')
                .addClass('panel panel-default')
                .append(
                    $('<div>')
                    .addClass('panel-heading')
                    .append(
                        $('<span>')
                        .addClass('panel-title')
                        .attr('data-element', 'title')
                        )
                    .append(
                        $('<button>')
                        .attr('type', 'button')
                        .addClass('close pull-right')
                        .attr('aria-label', 'Close')
                        .append($('<span>').attr('aria-hidden', 'true').html('&times;'))
                        .on('click', function (e) {
                            self.toggleInteractionPanel($interactionPanel, $interactionPanel.data('mode'));
                        })
                    )
                )
                .append(
                    $('<div>')
                    .addClass('panel-body')
                    .attr('data-element', 'body')
                    )
                .data('mode', 'inactive')
                .hide();

            var narRef = "ws." + data.ws_info[0] + ".obj." + data.ws_info[8].narrative;
            var nameText = narRef;
            var version = '';
            if (data.nar_info && data.nar_info[10].name) {
                nameText = data.nar_info[10].name;
                version = 'v' + data.nar_info[4];
            } else if (data.error && data.ws_info[8].narrative_nice_name) {
                nameText = data.ws_info[8].narrative_nice_name + ' (' + nameText + ')';
            }
            var $version = $('<span>').addClass("kb-data-list-version").append(version);
            var $priv = $('<span>').css({'color': '#999', 'margin-left': '8px'}).prop('data-toggle', 'tooltip').prop('data-placement', 'right');
            if (data.ws_info[5] === 'r') {
                $priv.addClass('fa fa-lock').prop('title', 'read-only');
            } else if (data.ws_info[5] === 'w' || data.ws_info[5] === 'a') {
                $priv.addClass('fa fa-pencil').prop('title', 'you can edit');
            }

            var $nameLink = $('<a href="' + narRef + '" target="_blank">');
            if (isCurrent) {
                $nameLink.append($('<span>').addClass('fa fa-circle').css({'margin-right': '3px', 'color': '#4BB856'})
                    .tooltip({title: 'You are viewing this Narrative now'}));
            } else if (data.error) {
                $nameLink.append($('<span>').addClass('fa fa-circle').css({'margin-right': '3px', 'color': '#F44336'})
                    .tooltip({title: 'This narrative has been corrupted.'}));
            }
            $nameLink.append(nameText).append($version).append($priv);
            $dataCol.append($('<div>').addClass('kb-data-list-name').css({'white-space': 'normal', 'cursor': 'pointer'}).append($nameLink));

            // only display the rest if there was no error
            if (!data.error) {
                var $usrNameSpan = $('<span>').addClass('kb-data-list-type').append(data.ws_info[2]);
                if (data.ws_info[2] === this._attributes.auth.user_id) {
                } else {
                    $dataCol.append($usrNameSpan).append('<br>');
                    DisplayUtil.displayRealName(data.ws_info[2], $usrNameSpan);
                }
                var summary = this.getNarSummary(data.nar_info);
                if (summary) {
                    $dataCol.append($('<span>')
                        .addClass('kb-data-list-narinfo')
                        .append(summary)
                        // REMOVE MORE INFO: needs a rethink, because these methods have versions now....
                        /*.click(
                            function () {
                                var opened = self.toggleInteractionPanel($interactionPanel, 'info');
                                if (!opened) {
                                    return;
                                }

                                var $infoDiv = $('<div>')
                                    .append(self.getNarContent(data.nar_info));


                                // var $infoDiv = self.getNarContent(data.nar_info);
                                self.setInteractionPanel($interactionPanel, 'Narrative Info', $infoDiv);
                            })*/
                        .append('<br>'));
                }
                $dataCol.append($('<span>').addClass('kb-data-list-type').append(this.getTimeStampStr(data.nar_info[3])));


                // Render the share toolbar layout.
                // it consists of just one button
                // var $shareContainer = $('<div>').hide();

                /* this is so gross */
                var $shareToolbarGroup = $('<div>')
                    .addClass('btn-group pull-right')
                    .attr('role', 'group');
                var $shareToolbar = $('<span>')
                    .addClass('btn-toolbar')
                    .attr('role', 'toolbar')
                    .append($shareToolbarGroup);
                $ctrContent.append($shareToolbar);

                var shareCount = 0;
                for (var usr in data.perms) {
                    if (data.perms.hasOwnProperty(usr)) {
                        if (usr === '*') {
                            continue;
                        }
                        shareCount++;
                    }
                }
                // should really put this in the addDatacontrols; so refactor at some point!
                $shareToolbarGroup.append(
                    $('<button>')
                    .addClass('btn btn-subtle btn-default')
                    .attr('data-button', 'share')
                    .tooltip({title: 'View share settings', 'container': 'body'})
                    .append($('<span>')
                        .addClass('fa fa-share-alt'))
                    .append(' ' + shareCount)
                    .on('click', function () {
                        if (!self.toggleInteractionPanel($interactionPanel, 'share')) {
                            return;
                        }

                        var $sharingDiv = $('<div>');
                        self.setInteractionPanel($interactionPanel, 'Share Settings', $sharingDiv);
                         new kbaseNarrativeSharePanel($sharingDiv, {
                            ws_name_or_id: data.ws_info[0],
                            max_list_height: 'none',
                            add_user_input_width: '280px'
                        });
                    })
                );
            } else if (data.error) {
                isError = true;
                var errorMessage;
                if (data.error_msg) {
                    errorMessage = 'This Narrative has been corrupted: ' + data.error_msg;
                } else {
                    errorMessage = 'This Narrative has been corrupted.';
                }
                $dataCol
                    .append($('<span>')
                        .addClass('kb-data-list-narrative-error')
                        .append(errorMessage));
            }
            var $btnToolbar = self.addDataControls(data.nar_info, $interactionPanel, data.ws_info, isError);

            if (!isError) {
                // Set up basic interactivity -- hide and show controls with mouseover.
                $ctrContent.append($btnToolbar.hide());
                $narDiv
                    .mouseenter(function () {
                        $btnToolbar.show();
                    })
                    .mouseleave(function () {
                        if ($interactionPanel.data('mode') === 'inactive') {
                            $btnToolbar.hide();
                        }
                    });
            }

            $narDiv
                .append($('<table>')
                    .css({'width': '100%'})
                    .append($('<tr>')
                        .append($dataCol)
                        .append($ctrCol)))
                .append($interactionPanel);
            //.append($alertContainer)
            //.append($shareContainer);

            var $narDivContainer = $('<div>')
                .append($narDiv);

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

            var setButtonWorking = function(isWorking) {
                if (isWorking) {
                    $initCopyBtn.prop('disabled', true)
                                 .empty()
                                 .append('Copying Narrative...');
                }
                else {
                    $initCopyBtn.prop('disabled', false)
                                 .empty()
                                 .append('<span class="fa fa-copy"></span> Copy This Narrative');
                    $doCopyBtn.prop('disabled', false);
                    $cancelBtn.prop('disabled', false);
                }
            };

            /* Clicking this should disable it, then show the passed $alertContainer
             */
            var $initCopyBtn = $('<button>')
                .addClass('kb-primary-btn')
                .click(function(e) {
                    setButtonWorking(true);
                    $newNameInput.val(Jupyter.notebook.get_notebook_name() + ' - Copy')
                    $alertContainer.slideDown();
                });

            /* This is the input box for the new narrative name.
             * Gets pre-populated with the current narrative name + "- copy"
             * When empty, prompts to enter a name with a tooltip, and disables the copy btn.
             */
            var $newNameInput = $('<input type="text">')
                .addClass('form-control')
                .tooltip({title: 'Please enter a name.',
                          container: 'body',
                          placement: 'right',
                          trigger: 'manual'})
                .on('focus', function () {
                    Jupyter.narrative.disableKeyboardManager();
                })
                .on('blur', function () {
                    Jupyter.narrative.enableKeyboardManager();
                })
                .on('input', function() {
                    var v = $newNameInput.val();
                    if (!v) {
                        $newNameInput.tooltip('show');
                        $doCopyBtn.prop('disabled', true);
                    }
                    else {
                        $newNameInput.tooltip('hide');
                        $doCopyBtn.prop('disabled', false);
                    }
                });

            var $errorMessage = $('<div>').css({'color': '#F44336'});

            /*
             * Does the actual copy and displays the error if that happens.
             */
            var $doCopyBtn = $('<button>')
                             .addClass('kb-primary-btn')
                             .append('Copy')
                             .click(function(e) {

                                $errorMessage.empty();
                                $doCopyBtn.prop('disabled', true);
                                $cancelBtn.prop('disabled', true);
                                this.copyThisNarrative($newNameInput.val())
                                .then(function(result) {
                                    $alertContainer.hide();
                                    setButtonWorking(false);
                                    this.refresh();
                                    console.log(result);
                                }.bind(this))
                                .catch(function(error) {
                                    if (error && error.error && error.error.message) {
                                        $errorMessage.append(error.error.message);
                                    }
                                    else {
                                        $errorMessage.append('Sorry, an error occurred while copying. Please try again.');
                                    }
                                    $doCopyBtn.prop('disabled', false);
                                    $cancelBtn.prop('disabled', false);
                                })
                             }.bind(this))

            var $cancelBtn = $('<button>')
                             .addClass('kb-default-btn')
                             .append('Cancel')
                             .click(function () {
                                $doCopyBtn.prop('disabled', false);
                                $alertContainer.slideUp();
                                $newNameInput.tooltip('hide');
                                setButtonWorking(false);
                             });

            setButtonWorking(false);
            $alertContainer.append(
                $('<div>')
                .append($('<div>').append("Enter a name for the new Narrative"))
                .append($('<div>').append($newNameInput))
                .append($doCopyBtn)
                .append($cancelBtn)
                .append($errorMessage)
            ).hide();

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
        copyThisNarrative: function (newName) {
            var preCheckError = null;
            if (!this.ws) {
                preCheckError = "Cannot copy - please sign in again.";
            }
            else if (!this.workspaceRef) {
                preCheckError = "Cannot copy - cannot find Narrative id. Please refresh the page and try again.";
            }
            else if (!this.workspaceId) {
                preCheckError = "Cannot copy - cannot find Narrative data id. Please refresh the page and try again.";
            }
            if (preCheckError) {
                return Promise.reject(preCheckError);
            }
            // name of the narrative object in the workspace. used for closure.

            return Promise.resolve(this.serviceClient.sync_call(
                'NarrativeService.copy_narrative',
                [{
                    workspaceRef: this.workspaceRef,
                    newName: newName
                }]
            ))
            .then(function(result) {
                return {
                    status: 'success',
                    url: [window.location.origin,
                          '/narrative/ws.',
                          result.newWsId,
                          '.obj.',
                          result.newNarId].join('')
                };
            });
        },

        makeNewNarrativeBtn: function () {
            var self = this;
            var active = '<span class="fa fa-plus"></span> New Narrative';
            var $working = $('<span>').append("Building Narrative...");
            var $btn =
                $('<button>').addClass('kb-primary-btn').append(active)
                .on('click', function () {
                    // just open the link, don't do the work here...
                    window.open(self.options.new_narrative_link);
                });

            return $btn;
        },
        getNarSummary: function (nar_info) {
            var summary = '';
            if (nar_info[10].methods) {
                var content = JSON.parse(nar_info[10].methods);
                var summaryCounts = [];
                var appCount = 0;
                var methodCount = 0;
                for (var a in content.app) {
                    if (content.app.hasOwnProperty(a)) {
                        appCount += content.app[a];
                    }
                }
                if (appCount === 1) {
                    summaryCounts.push('1 App');
                } else if (appCount > 1) {
                    summaryCounts.push(appCount + ' Apps');
                }

                for (var m in content.method) {
                    if (content.method.hasOwnProperty(m)) {
                        methodCount += content.method[m];
                    }
                }
                if (methodCount === 1) {
                    summaryCounts.push('1 Method');
                } else if (methodCount > 1) {
                    summaryCounts.push(methodCount + ' Methods');
                }

                if (content.output === 1) {
                    summaryCounts.push('1 Result');
                } else if (content.output > 1) {
                    summaryCounts.push(content.output + ' Results');
                }

                if (content.ipython.code === 1) {
                    summaryCounts.push('1 Code Cell');
                } else if (content.ipython.code > 1) {
                    summaryCounts.push(content.ipython.code + ' Code Cells');
                }

                if (content.ipython.markdown === 1) {
                    summaryCounts.push('1 Md Cell');
                } else if (content.ipython.markdown > 1) {
                    summaryCounts.push(content.ipython.markdown + ' Md Cells');
                }


                if (summaryCounts.length > 0) {
                    summary = summaryCounts.join(', ');
                } else {
                    summary = 'Empty Narrative';
                }
            }
            return summary;
        },
        getNarContent: function (nar_info) {
            var self = this;

            var specsToLookup = {apps: [], methods: []};
            if (nar_info[10].methods) {
                var content = JSON.parse(nar_info[10].methods);
                var apps = [];
                var methods = [];
                var appCount = 0;
                var methodCount = 0;
                for (var a in content.app) {
                    if (content.app.hasOwnProperty(a)) {
                        apps.push({name: a, count: content.app[a]});
                        specsToLookup.apps.push(a);
                    }
                }
                for (var m in content.method) {
                    if (content.method.hasOwnProperty(m)) {
                        methods.push({name: m, count: content.method[m]});
                        specsToLookup.methods.push(m);
                    }
                }
            }

            if ((apps.length + methods.length) === 0) {
                if (nar_info[10].description) {
                    $container.append('<br><b>Description</b><br><div style="text-align:left;">' + nar_info[10].description + '</div>');
                }
                return "<br>No Apps or Methods in this Narrative.<br>";
            }

            var $container = $('<div>').css({'width': '100%'});
            if (!self.appMethodSpecRef) {
                self.trigger('getFunctionSpecs.Narrative', [specsToLookup,
                    function (specLookup) {
                        //todo: sort here based on counts or name?
                        if (nar_info[10].description) {
                            $container.append('<br><b>Description</b><br><div style="text-align:left;">' + nar_info[10].description + '</div>');
                        }

                        if (apps.length > 0) {
                            $container.append('<br><b>Apps</b><br>');
                            var $apptbl = $('<table>').css({'width': '100%'});
                            for (var k = 0; k < apps.length; k++) {
                                var link = '<a href="/#narrativestore/app/' + apps[k].name + '" target="_blank">' + apps[k].name + '</a>';
                                if (specLookup.apps[apps[k].name]) {
                                    link = '<a href="/#narrativestore/app/' + apps[k].name + '" target="_blank">' + specLookup.apps[apps[k].name].info.name + '</a>';
                                }
                                $apptbl.append($('<tr>')
                                    .append($('<td>').append(link))
                                    .append($('<td>').append(apps[k].count)));
                            }
                            $container.append($apptbl);
                        }

                        if (methods.length > 0) {
                            $container.append('<br><b>Methods</b><br>');
                            var $methodtbl = $('<table>').css({'width': '100%'});
                            for (var k = 0; k < methods.length; k++) {
                                var link = '<a href="/#narrativestore/method/' + methods[k].name + '" target="_blank">' + methods[k].name + '</a>';
                                if (specLookup.methods[methods[k].name]) {
                                    link = '<a href="/#narrativestore/method/' + methods[k].name + '" target="_blank">' + specLookup.methods[methods[k].name].info.name + '</a>';
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
                var newTimestamp = tokens[0] + '+' + tokens[0].substr(0, 2) + ":" + tokens[1].substr(2, 2);
                date = new Date(newTimestamp);
                seconds = Math.floor((new Date() - date) / 1000);
                if (isNaN(seconds)) {
                    // just in case that didn't work either, then parse without the timezone offset, but
                    // then just show the day and forget the fancy stuff...
                    date = new Date(tokens[0]);
                    return this.monthLookup[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
                }
            }

            // keep it simple, just give a date
            return this.monthLookup[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
        },
        monthLookup: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        /* we really need to stop all this copy pasting */

    });
});
