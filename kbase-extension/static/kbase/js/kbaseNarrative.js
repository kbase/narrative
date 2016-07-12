/*global define,KBError,KBFatal,window*/
/*jslint white: true,browser: true*/

/**
 * This is the entry point for the Narrative's front-end. It initializes
 * the login session, fires up the data and function widgets, and creates
 * the kbaseNarrativeWorkspace wrapper around the Jupyter notebook that
 * does fun things like manage widgets and cells and kernel events to talk to them.
 *
 * To set global variables, use: Jupyter.narrative.<name> = value
 */

define(
    [
        'jquery',
        'bootstrap',
        'bluebird',
        'handlebars',
        'narrativeConfig',
        'kbaseNarrativeSidePanel',
        'kbaseNarrativeOutputCell',
        'kbaseNarrativeWorkspace',
        'kbaseNarrativeMethodCell',
        'kbaseAccordion',
        'kbaseLogin',
        'kbaseNarrativeSharePanel',
        'kbase-client-api',
        'kbaseNarrativePrestart',
        'ipythonCellMenu',
        'base/js/namespace',
        'base/js/events',
        'base/js/keyboard',
        'notebook/js/notebook',
        'util/display',
        'util/bootstrapDialog',
        'text!kbase/templates/update_dialog_body.html',
        'narrativeLogin',
        'common/ui',
        'common/html'
    ], function (
    $,
    Bootstrap,
    Promise,
    Handlebars,
    Config,
    KBaseNarrativeSidePanel,
    KBaseNarrativeOutputCell,
    KBaseNarrativeWorkspace,
    KBaseNarrativeMethodCell,
    KBaseAccordion,
    KBaseLogin,
    KBaseNarrativeSharePanel,
    KBaseClient,
    KBaseNarrativePrestart,
    KBaseCellToolbar,
    Jupyter,
    Events,
    Keyboard,
    Notebook,
    DisplayUtil,
    BootstrapDialog,
    UpdateDialogBodyTemplate,
    NarrativeLogin,
    UI,
    html
    ) {
    'use strict';

    KBaseNarrativePrestart.loadDomEvents();
    KBaseNarrativePrestart.loadGlobals();

    /**
     * @constructor
     * The base, namespaced Narrative object. This is mainly used at start-up time, and
     * gets injected into the Jupyter namespace.
     *
     * Most of its methods below - init, registerEvents, initAboutDialog, initUpgradeDialog,
     * checkVersion, updateVersion - are set up at startup time.
     * This is all done by an injection into static/notebook/js/main.js where the
     * Narrative object is set up, and Narrative.init is run.
     *
     * But, this also has a noteable 'Save' method, that implements another Narrative-
     * specific piece of functionality. See Narrative.prototype.saveNarrative below.
     */
    var Narrative = function () {
        // Maximum narrative size that can be stored in the workspace.
        // This is set by nginx on the backend - this variable is just for
        // communication on error.
        this.maxNarrativeSize = "10 MB";

        // the controller is an instance of kbaseNarrativeWorkspace, which
        // controls widget management and KBase method execution
        this.narrController = null;

        this.sidePanel = null;

        // If true, this narrative is read only
        this.readonly = false;

        // The user's current session token.
        this.authToken = null;

        // How often to check for a new version in ms (not currently used)
        this.versionCheckTime = 6000 * 60 * 1000;

        this.versionHtml = 'KBase Narrative';

        // The currently selected Jupyter cell.
        this.selectedCell = null;

        // The version of the Narrative UI (semantic version)
        this.currentVersion = Config.get('version');

        //
        this.dataViewers = null;

        // User Profile KBase client.
        this.profileClient = new UserProfile(Config.url('user_profile'));

        // Used for mapping from user id -> user name without having to it
        // up again every time.
        this.cachedUserIds = {};
        this.workspaceRef = null;
        this.workspaceId = null;
        this.sidePanel = null;

        // The set of currently instantiated KBase Widgets.
        // key = cell id, value = Widget object itself.
        this.kbaseWidgets = {};

        Jupyter.keyboard_manager.disable();
        return this;
    };

    /**
     * A wrapper around the Jupyter.notebook.kernel.execute() function.
     * If any KBase widget needs to make a kernel call, it should go through here.
     * ...when it's done.
     */
    Narrative.prototype.executeKernelCall = function () {
        console.info('no-op for now');
    };

    // Wrappers for the Jupyter/Jupyter function so we only maintain it in one place.
    Narrative.prototype.disableKeyboardManager = function () {
        Jupyter.keyboard_manager.disable();
    };

    Narrative.prototype.enableKeyboardManager = function () {
        Jupyter.keyboard_manager.enable();
    };

    /**
     * Registers Narrative responses to a few Jupyter events - mainly some
     * visual effects for managing when the cell toolbar should be shown,
     * and when saving is being done, but it also disables the keyboard
     * manager when KBase cells are selected.
     */
    Narrative.prototype.registerEvents = function () {
        $([Jupyter.events]).on('before_save.Notebook', function () {
            $('#kb-save-btn').find('div.fa-save').addClass('fa-spin');
        });
        $([Jupyter.events]).on('notebook_saved.Notebook', function () {
            $('#kb-save-btn').find('div.fa-save').removeClass('fa-spin');
        });
        $([Jupyter.events]).on('kernel_idle.Kernel', function () {
            $("#kb-kernel-icon").removeClass().addClass('fa fa-circle-o');
        });
        $([Jupyter.events]).on('kernel_busy.Kernel', function () {
            $("#kb-kernel-icon").removeClass().addClass('fa fa-circle');
        });

        // $([Jupyter.events]).on('create.Cell', function(event, data) {
        //     // this.showJupyterCellToolbar(data.cell);
        // }.bind(this));

        $([Jupyter.events]).on('delete.Cell', function () {
            this.enableKeyboardManager();
        }.bind(this));

        $([Jupyter.events]).on('notebook_save_failed.Notebook', function (event, data) {
            $('#kb-save-btn').find('div.fa-save').removeClass('fa-spin');
            this.saveFailed(event, data);
        }.bind(this));
    };


    /**
     * Initializes the sharing panel and sets up the events
     * that show and hide it.
     */
    Narrative.prototype.initSharePanel = function () {
        var sharePanel = $('<div>');
        var shareWidget = new KBaseNarrativeSharePanel(sharePanel, {
            ws_name_or_id: this.getWorkspaceName()
        });
        $('#kb-share-btn').popover({
            trigger: 'click',
            html: true,
            placement: 'bottom',
            content: function () {
                // we do not allow users to leave thier narratives untitled
                if (Jupyter.notebook) {
                    var narrName = Jupyter.notebook.notebook_name;
                    if (narrName.trim().toLowerCase() === 'untitled' || narrName.trim().length === 0) {
                        Jupyter.save_widget.rename_notebook({notebook: Jupyter.notebook});
                        return "<br><br>Please name your Narrative before sharing.<br><br>";
                    }
                    this.disableKeyboardManager();
                }

                //!! arg!! I have to refresh to get reattach the events, which are lost when
                //the popover is hidden!!!  makes it a little slower because we refetch permissions from ws each time
                shareWidget.refresh();
                return sharePanel;
            }.bind(this)
        });
    };

    /**
     */
    function renderSettingsDialog(settings) {
        var t = html.tag,
            div = t('div'), input = t('input'), label = t('label'), p = t('p');
            
        return  div([
            p({}, [
                'These settings apply to and are saved with this Narrative. Changes ',
                'made here will not affect existing Narratives or new Narratives that you ',
                'may create.'
            ]),
            p({style: {fontStyle: 'italic'}}, [
                'Please note that you will need to refresh the browser in order to ',
                'enable any changes.'
            ]),
            div({class: 'form-horizontal settings-dialog'}, [
                div({class: 'form-group'}, [
                    div({class: 'col-md-8 checkbox'}, [
                        label([
                            input({
                                type: 'checkbox', 
                                name: 'advanced', 
                                value: 'advanced', 
                                checked: settings.advanced
                            }), 
                            'Use Advanced features'
                        ])
                    ]),
                    div({class: 'col-md-4'})
                ]),
               div({class: 'form-group'}, [
                    div({class: 'col-md-8 checkbox'}, [
                        label([
                            input({
                                type: 'checkbox', 
                                name: 'developer', 
                                value: 'developer',
                                checked: settings.developer
                            }), 
                            'Use Developer features'
                        ])
                    ]),
                    div({class: 'col-md-4'})
                ])
            ])
        ]);
    }
    
    /*
     * Given an inner node, which is probably a button, inspect the contents
     * of the submitted form.
     * Note - this is a cheap implementation just to get something up 
     * to play with.
     */
    // TODO: add matches to the mustard.js test
    function findParent(node, selector) {
        if (node.matches(selector)) {
            return node;
        }
        if (node === document.body) {
            return null;
        }
        return findParent(node.parentNode, selector);
    }
    function doCheckSettings(innerNode) {
        var dialogNode = findParent(innerNode, '.modal-dialog');
        
        if (!dialogNode) {
            console.error('COULD NOT FIND PAREnT NOde');
            throw new Error('Could not find the parent node!');
        }
        
        var settings = {};
        var advanced = dialogNode.querySelector('[name="advanced"]').checked;
        settings.advanced = advanced;
        
        var developer = dialogNode.querySelector('[name="developer"]').checked;
        settings.developer = developer;
        
        return settings;
    }
    
    function doSaveSettings(settings) {
        var existingSettings = Jupyter.notebook.metadata.kbase.userSettings;
        Object.keys(settings).forEach(function (key) {
            existingSettings[key] = settings[key];
        })
        Jupyter.notebook.metadata.kbase.userSettings = existingSettings;
        Jupyter.notebook.save_checkpoint();
    }

    function showSettingsDialog() {
        var ui = UI.make({node: document.body}),
            existingSettings = Jupyter.notebook.metadata.kbase.userSettings;
        
        if (!existingSettings) {
            existingSettings = {};
            Jupyter.notebook.metadata.kbase.userSettings = {};
        }
        ui.showDialog({
            title: 'Narrative User Settings',
            body: renderSettingsDialog(existingSettings),
            buttons: [
                {
                    icon: 'file',
                    label: 'Save Settings',
                    action: 'save',
                    handler: function (e) {
                        return doCheckSettings(e.target);
                    }
                }
            ]
        })
            .then(function (result) {
                if (result.action === 'save') {
                    doSaveSettings(result.result);
                }
            });
    }

    Narrative.prototype.initSettingsDialog = function () {
        //var sharePanel = $('<div>');
        //var shareWidget = new KBaseNarrativeSharePanel(sharePanel, {
        //    ws_name_or_id: this.getWorkspaceName()
        //});

        var settingsButtonNode = document.getElementById('kb-settings-btn');
        if (!settingsButtonNode) {
            return;
        }

        settingsButtonNode.addEventListener('click', function (e) {
            showSettingsDialog();
        });

    };


    /**
     * The "Upgrade your container" dialog should be made available when
     * there's a more recent version of the Narrative ready to use. This
     * dialog then lets the user shut down their existing Narrative container.
     */
    Narrative.prototype.initUpgradeDialog = function () {
        var bodyTemplate = Handlebars.compile(UpdateDialogBodyTemplate);

        var $cancelBtn = $('<button type="button" data-dismiss="modal">')
            .addClass('btn btn-default')
            .append('Cancel');
        var $upgradeBtn = $('<button type="button" data-dismiss="modal">')
            .addClass('btn btn-success')
            .append('Update and Reload')
            .click(function (e) {
                this.updateVersion();
            }.bind(this));

        var upgradeDialog = new BootstrapDialog({
            title: 'New Narrative version available!',
            buttons: [$cancelBtn, $upgradeBtn]
        });
        $('#kb-update-btn').click(function () {
            upgradeDialog.show();
        });
        this.checkVersion()
            .then(function (ver) {
                upgradeDialog.setBody(bodyTemplate({
                    currentVersion: this.currentVersion,
                    newVersion: ver ? ver.version : "No new version",
                    releaseNotesUrl: Config.get('release_notes')
                }));
                if (ver && ver.version && this.currentVersion !== ver.version) {
                    $('#kb-update-btn').fadeIn('fast');
                }
            }.bind(this));
    };

    /**
     * Looks up what is the current version of the Narrative.
     * This should eventually get rolled into a Narrative Service method call.
     */
    Narrative.prototype.checkVersion = function () {
        // look up new version here.
        return Promise.resolve($.ajax({
            url: Config.url('version_check'),
            async: true,
            dataType: 'text',
            crossDomain: true,
            cache: false
        })).then(function (ver) {
            return Promise.try(function () {
                ver = $.parseJSON(ver);
                return ver;
            });
        }).catch(function (error) {
            console.error('Error while checking for a version update: ' + error.statusText);
            KBError('Narrative.checkVersion', 'Unable to check for a version update!');
        });
    };

    Narrative.prototype.createShutdownDialogButtons = function () {
        var $shutdownButton = $('<button>')
            .attr({type: 'button', 'data-dismiss': 'modal'})
            .addClass('btn btn-danger')
            .append('Okay. Shut it all down!')
            .click(function () {
                this.updateVersion();
            }.bind(this));

        var $reallyShutdownPanel = $('<div style="margin-top:10px">')
            .append('This will shutdown your Narrative session and close this window.<br><b>Any unsaved data in any open Narrative in any window WILL BE LOST!</b><br>')
            .append($shutdownButton)
            .hide();

        var $firstShutdownBtn = $('<button>')
            .attr({type: 'button'})
            .addClass('btn btn-danger')
            .append('Shutdown')
            .click(function () {
                $reallyShutdownPanel.slideDown('fast');
            });

        var $cancelButton = $('<button type="button" data-dismiss="modal">')
            .addClass('btn btn-default')
            .append('Dismiss')
            .click(function () {
                $reallyShutdownPanel.hide();
            });

        return {
            cancelButton: $cancelButton,
            firstShutdownButton: $firstShutdownBtn,
            finalShutdownButton: $shutdownButton,
            shutdownPanel: $reallyShutdownPanel
        };
    };

    Narrative.prototype.initAboutDialog = function () {
        var $versionDiv = $('<div>')
            .append('<b>Version:</b> ' + Config.get('version'));
        $versionDiv.append('<br><b>Git Commit:</b> ' + Config.get('git_commit_hash') + ' -- ' + Config.get('git_commit_time'));
        $versionDiv.append('<br>View release notes on <a href="' + Config.get('release_notes') + '" target="_blank">Github</a>');

        var urlList = Object.keys(Config.get('urls')).sort();
        var $versionTable = $('<table>')
            .addClass('table table-striped table-bordered');
        $.each(urlList,
            function (idx, val) {
                var url = Config.url(val).toString();
                // if url looks like a url (starts with http), include it.
                // ignore job proxy and submit ticket
                if (val === 'narrative_job_proxy' || val === 'submit_jira_ticket') {
                    return;
                }
                if (url && url.toLowerCase().indexOf('http') === 0) {
                    $versionTable.append($('<tr>')
                        .append($('<td>').append(val))
                        .append($('<td>').append(url)));
                }
            }
        );
        var $verAccordionDiv = $('<div style="margin-top:15px">');
        $versionDiv.append($verAccordionDiv);

        var verAccordion = new KBaseAccordion($verAccordionDiv, {
            elements: [{
                    title: 'KBase Service URLs',
                    body: $versionTable
                }]
        });

        var shutdownButtons = this.createShutdownDialogButtons();
        var aboutDialog = new BootstrapDialog({
            title: 'KBase Narrative Properties',
            body: $versionDiv,
            buttons: [
                shutdownButtons.cancelButton,
                shutdownButtons.firstShutdownButton,
                shutdownButtons.shutdownPanel
            ]
        });

        $('#kb-about-btn').click(function () {
            aboutDialog.show();
        });
    };

    Narrative.prototype.initShutdownDialog = function () {
        var shutdownButtons = this.createShutdownDialogButtons();

        var shutdownDialog = new BootstrapDialog({
            title: 'Shutdown and restart narrative?',
            body: $('<div>').append('Shutdown and restart your Narrative session? Any unsaved changes in any open Narrative in any window WILL BE LOST!'),
            buttons: [
                shutdownButtons.cancelButton,
                shutdownButtons.finalShutdownButton
            ]
        });

        $('#kb-shutdown-btn').click(function () {
            shutdownDialog.show();
        });
    };

    Narrative.prototype.saveFailed = function (event, data) {
        $('#kb-save-btn').find('div.fa-save').removeClass('fa-spin');
        Jupyter.save_widget.set_save_status('Narrative save failed!');

        var errorText;
        // 413 means that the Narrative is too large to be saved.
        // currently - 4/6/2015 - there's a hard limit of 4MB per KBase Narrative.
        // Any larger object will throw a 413 error, and we need to show some text.
        if (data.xhr.status === 413) {
            errorText = 'Due to current system constraints, a Narrative may not exceed ' +
                this.maxNarrativeSize + ' of text.<br><br>' +
                'Errors of this sort are usually due to excessive size ' +
                'of outputs from Code Cells, or from large objects ' +
                'embedded in Markdown Cells.<br><br>' +
                'Please decrease the document size and try to save again.';
        } else if (data.xhr.responseText) {
            var $error = $($.parseHTML(data.xhr.responseText));
            errorText = $error.find('#error-message > h3').text();

            if (errorText) {
                /* gonna throw in a special case for workspace permissions issues for now.
                 * if it has this pattern:
                 *
                 * User \w+ may not write to workspace \d+
                 * change the text to something more sensible.
                 */

                var res = /User\s+(\w+)\s+may\s+not\s+write\s+to\s+workspace\s+(\d+)/.exec(errorText);
                if (res) {
                    errorText = "User " + res[1] + " does not have permission to save to workspace " + res[2] + ".";
                }
            }
        } else {
            errorText = 'An unknown error occurred!';
        }

        Jupyter.dialog.modal({
            title: "Narrative save failed!",
            body: $('<div>').append(errorText),
            buttons: {
                OK: {
                    class: "btn-primary",
                    click: function () {
                        return;
                    }
                }
            },
            open: function () {
                var that = $(this);
                // Upon ENTER, click the OK button.
                that.find('input[type="text"]').keydown(function (event) {
                    if (event.which === Keyboard.keycodes.enter) {
                        that.find('.btn-primary').first().click();
                    }
                });
                that.find('input[type="text"]').focus();
            }
        });
    };

    /**
     * This is the Narrative front end initializer. It should only be run directly after
     * the app_initialized.NotebookApp event has been fired.
     *
     * It does the following steps:
     * 1. Registers event listeners on Jupyter events such as cell selection, insertion,
     *    deletion, etc.
     * 2. Initializes the Core UI dialogs that depend on configuration information (About,
     *    Upgrade, and Shutdown)
     * 3. Initializes the
     */
    // This should not be run until AFTER the notebook has been loaded!
    // It depends on elements of the Notebook metadata.
    Narrative.prototype.init = function () {
        this.registerEvents();
        this.initAboutDialog();
        this.initUpgradeDialog();
        this.initShutdownDialog();
        // NAR-271 - Firefox needs to be told where the top of the page is. :P
        window.scrollTo(0, 0);

        this.authToken = NarrativeLogin.loginWidget($('#signin-button')).token();

        /* Clever extension to $.event from StackOverflow
         * Lets us watch DOM nodes and catch when a widget's node gets nuked.
         * http://stackoverflow.com/questions/2200494/jquery-trigger-event-when-an-element-is-removed-from-the-dom
         *
         * We bind a jQuery event to a node. Call it 'destroyed'.
         * When that event is no longer bound (i.e. when the node is removed, OR when .unbind is called)
         * it triggers the 'remove' function. Lets us keep track of when widgets get removed
         * in the registerWidget function below.
         */
        $.event.special.destroyed = {
            remove: function (o) {
                if (o.handler) {
                    o.handler();
                }
            }
        };

        $([Jupyter.events]).on('notebook_loaded.Notebook', function () {
            // Disable autosave so as not to spam the Workspace.
            Jupyter.notebook.set_autosave_interval(0);
            KBaseCellToolbar.register(Jupyter.notebook);
            Jupyter.CellToolbar.activate_preset("KBase");
            Jupyter.CellToolbar.global_show();

            if (Jupyter.notebook && Jupyter.notebook.metadata) {
                var creatorId = Jupyter.notebook.metadata.creator || 'KBase User';
                DisplayUtil.displayRealName(creatorId, $('#kb-narr-creator'));

                // This puts the cell menu in the right place.
                $([Jupyter.events]).trigger('select.Cell', {cell: Jupyter.notebook.get_selected_cell()});
            }
            if (this.getWorkspaceName() !== null) {
                this.initSharePanel();

                this.initSettingsDialog();

                var wsInfo = window.location.href.match(/ws\.(\d+)\.obj\.(\d+)/);
                if (wsInfo && wsInfo.length === 3) {
                    this.workspaceRef = wsInfo[1] + '/' + wsInfo[2];
                    this.workspaceId = wsInfo[1];
                }

                this.sidePanel = new KBaseNarrativeSidePanel($('#kb-side-panel'), {autorender: false});
                // init the controller
                this.narrController = new KBaseNarrativeWorkspace($('#notebook_panel'), {
                    ws_id: this.getWorkspaceName()
                });
                this.narrController.render()
                    .finally(function () {
                        this.sidePanel.render();
                        $('#kb-wait-for-ws').remove();
                    }.bind(this));

                $([Jupyter.events]).on('kernel_ready.Kernel',
                    function () {
                        console.log('Kernel Ready! Initializing Job Channel...');
                        this.sidePanel.$jobsWidget.initCommChannel();
                        // this.initCommChannel();
                    }.bind(this)
                    );
            } else {
                KBFatal('Narrative.init', 'Unable to locate workspace name from the Narrative object!');
                $('#kb-wait-for-ws').remove();
            }
        }.bind(this));
    };

    /**
     * @method
     * @public
     * This manually deletes the Docker container that this Narrative runs in, if there is one.
     * If it can't, or if this is being run locally, it pops up an alert saying so.
     */
    Narrative.prototype.updateVersion = function () {
        var user = NarrativeLogin.loginWidget($('#signin-button')).session('user_id');
        Promise.resolve($.ajax({
            contentType: 'application/json',
            url: '/narrative_shutdown/' + user,
            type: 'DELETE',
            crossDomain: true
        }))
            .then(function () {
                setTimeout(function () {
                    location.reload(true);
                }, 200);
            })
            .catch(function (error) {
                window.alert('Unable to update your Narrative session\nError: ' + error.status + ': ' + error.statusText);
                console.error(error);
            });
    };

    /**
     * @method
     * @public
     * This triggers a save, but saves all cell states first.
     */
    Narrative.prototype.saveNarrative = function () {
        this.narrController.saveAllCellStates();
        Jupyter.notebook.save_checkpoint();
    };

    /**
     * @method
     * @public
     * Insert a new method into the narrative, set it as active, populate the
     * parameters, and run it.  This is useful for widgets that need to trigger
     * some additional narrative action, such as creating a FeatureSet from
     * a selected set of Features in a widget, or computing a statistic on a
     * subselection made from within a widget.
     */
    Narrative.prototype.createAndRunMethod = function (method_id, parameters) {
        //first make a request to get the method spec of a particular method
        //getFunctionSpecs.Narrative is implemented in kbaseNarrativeMethodPanel
        var request = {methods: [method_id]};
        var self = this;
        self.narrController.trigger('getFunctionSpecs.Narrative', [request,
            function (specs) {
                // do nothing if the method could not be found
                var errorMsg = 'Method ' + method_id + ' not found and cannot run.';
                if (!specs) {
                    console.error(errorMsg);
                    return;
                }
                if (!specs.methods) {
                    console.error(errorMsg);
                    return;
                }
                if (!specs.methods[method_id]) {
                    console.error(errorMsg);
                    return;
                }
                // put the method in the narrative by simulating a method clicked in kbaseNarrativeMethodPanel
                self.narrController.trigger('methodClicked.Narrative', specs.methods[method_id]);

                // the method initializes an internal method input widget, but rendering and initializing is
                // async, so we have to wait and check back before we can load the parameter state.
                // TODO: update kbaseNarrativeMethodCell to return a promise to mark when rendering is complete
                var newCell = Jupyter.notebook.get_selected_cell();
                var newCellIdx = Jupyter.notebook.get_selected_index();
                var newWidget = new KBaseNarrativeMethodCell($('#' + $(newCell.get_text())[0].id));
                var updateStateAndRun = function () {
                    if (newWidget.$inputWidget) {
                        // if the $inputWidget is not null, we are good to go, so set the parameters
                        newWidget.loadState(parameters);
                        // make sure the new cell is still selected, then run the method
                        Jupyter.notebook.select(newCellIdx);
                        newWidget.runMethod();
                    } else {
                        // not ready yet, keep waiting
                        window.setTimeout(updateStateAndRun, 500);
                    }
                };
                // call the update and run after a short deplay
                window.setTimeout(updateStateAndRun, 50);
            }
        ]);
    };

    Narrative.prototype.getWorkspaceName = function () {
        return Jupyter.notebook.metadata.ws_name || null;
    };

    Narrative.prototype.lookupUserProfile = function (username) {
        return DisplayUtil.lookupUserProfile(username);
    };

    /**
     * A little bit of a riff on the Jupyter "find_cell_index".
     * Every KBase-ified cell (App, Method, Output) has a unique identifier.
     * This can be used to find the closest cell element - its index is the
     * Jupyter cell index (inferred somewhat from find_cell_index which calls
     * get_cell_elements, which does this searching).
     */
    Narrative.prototype.getCellIndexByKbaseId = function (id) {
        return $('#' + id).closest('.cell').not('.cell .cell').index();
    };

    Narrative.prototype.getCellByKbaseId = function (id) {
        return Jupyter.notebook.get_cell(this.getCellIndexByKbaseId(id));
    };

    /**
     * Jupyter doesn't auto select cells on creation, so this
     * is a helper that does so. It then returns the cell object
     * that gets created.
     */
    Narrative.prototype.insertAndSelectCellBelow = function (cellType, index) {
        return this.insertAndSelectCell(cellType, 'below', index);
    };

    Narrative.prototype.insertAndSelectCellAbove = function (cellType, index) {
        return this.insertAndSelectCell(cellType, 'above', index);
    };

    Narrative.prototype.insertAndSelectCell = function (cellType, direction, index) {
        var newCell;
        if (direction === 'below') {
            newCell = Jupyter.notebook.insert_cell_below(cellType, index);
        } else {
            newCell = Jupyter.notebook.insert_cell_above(cellType, index);
        }
        Jupyter.notebook.focus_cell(newCell);
        Jupyter.notebook.select(Jupyter.notebook.find_cell_index(newCell));
        this.scrollToCell(newCell);

        return newCell;
    };

    Narrative.prototype.scrollToCell = function (cell, select) {
        var $elem = $('#notebook-container');
        $elem.animate({scrollTop: cell.element.offset().top + $elem.scrollTop() - $elem.offset().top}, 400);
        if (select) {
            Jupyter.notebook.focus_cell(cell);
            Jupyter.notebook.select(Jupyter.notebook.find_cell_index(cell));
        }
    };

    /**
     * if setHidden === true, then always hide
     * if setHidden === false (not null or undefined), then always show
     * if the setHidden variable isn't present, then just toggle
     */
    Narrative.prototype.toggleSidePanel = function (setHidden) {
        var delay = 'fast';
        var hidePanel = setHidden;
        if (hidePanel === null || hidePanel === undefined) {
            hidePanel = $('#left-column').is(':visible') ? true : false;
        }
        if (hidePanel) {
            $('#left-column').trigger('hideSidePanelOverlay.Narrative');
            $('#left-column').hide('slide', {
                direction: 'left',
                easing: 'swing',
                complete: function () {
                    $('#kb-side-toggle-in').show(0);
                }
            }, delay);
            // Move content flush left-ish
            $('#notebook-container').animate(
                {left: 0},
                {
                    easing: 'swing',
                    duration: delay
                }
            );
        } else {
            $('#kb-side-toggle-in').hide(0, function () {
                $('#left-column').show('slide', {
                    direction: 'left',
                    easing: 'swing'
                }, delay);
                $('#notebook-container').animate({left: 380}, {easing: 'swing', duration: delay});
            });
        }
    };

    /**
     * Registers a KBase widget with the Narrative controller. This lets the
     * controller iterate over the widgets it knows about, so it can do group
     * operations on them.
     */
    Narrative.prototype.registerWidget = function (widget, cellId) {
        this.kbaseWidgets[cellId] = widget;
        $('#' + cellId).bind('destroyed', function () {
            this.removeWidget(cellId);
        }.bind(this));
    };

    Narrative.prototype.removeWidget = function (cellId) {
        delete this.kbaseWidgets[cellId];
    };

    return Narrative;
});
