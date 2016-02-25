/**
 * This is the entry point for the Narrative's front-end. It initializes
 * the login session, fires up the data and function widgets, and creates
 * the kbaseNarrativeWorkspace wrapper around the Jupyter notebook that
 * does fun things like manage widgets and cells and kernel events to talk to them.
 *
 * To set global variables, use: Jupyter.narrative.<name> = value
 */
define([
    'jquery', 
    'bluebird',
    'handlebars',
    'narrativeConfig',
    'kbaseNarrativeSidePanel', 
    'kbaseNarrativeOutputCell', 
    'kbaseNarrativeWorkspace',
    'kbaseNarrativeMethodCell',
    'narrativeLogin',
    'kbase-client-api',
    'kbaseNarrativePrestart',
    'ipythonCellMenu',
    'base/js/events',
    'notebook/js/notebook',
    'util/display',
    'util/bootstrapDialog',
    'text!kbase/templates/update_dialog_body.html',
    'jquery-nearest'
], 
function($,
         Promise,
         Handlebars,
         Config,
         kbaseNarrativeSidePanel,
         kbaseNarrativeOutputCell,
         kbaseNarrativeWorkspace,
         kbaseNarrativeMethodCell,
         narrativeLogin,
         kbaseClient,
         kbaseNarrativePrestart,
         kbaseCellToolbar,
         events,
         Notebook,
         DisplayUtil,
         BootstrapDialog,
         UpdateDialogBodyTemplate) {
    'use strict';

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
    var Narrative = function() {
        this.maxNarrativeSize = "10 MB";
        this.narrController = null;
        this.readonly = false; /* whether whole narrative is read-only */
        this.authToken = null;
        this.versionCheckTime = 6000*60*1000;
        this.versionHtml = 'KBase Narrative';
        this.selectedCell = null;
        this.currentVersion = Config.get('version');
        this.dataViewers = null;
        this.profileClient = new UserProfile(Config.url('user_profile'));
        this.cachedUserIds = {};

        Jupyter.keyboard_manager.disable();
        return this;
    };

    Narrative.prototype.makeKernelCall = function() {

    };

    // Wrappers for the Jupyter/Jupyter function so we only maintain it in one place.
    Narrative.prototype.disableKeyboardManager = function() {
        Jupyter.keyboard_manager.disable();
    };

    Narrative.prototype.enableKeyboardManager = function() {
        // Jupyter.keyboard_manager.enable();
    };

    /**
     * Registers Narrative responses to a few Jupyter events - mainly some
     * visual effects for managing when the cell toolbar should be shown, 
     * but it also disables the keyboard manager when KBase cells are selected.
     */
    Narrative.prototype.registerEvents = function() {
        $([Jupyter.events]).on('before_save.Notebook', function() {
            $('#kb-save-btn').find('div.fa-save').addClass('fa-spin');
        });
        $([Jupyter.events]).on('notebook_saved.Notebook', function() {
            $('#kb-save-btn').find('div.fa-save').removeClass('fa-spin');
        });
        $([Jupyter.events]).on('kernel_idle.Kernel',function () {
            $("#kb-kernel-icon").removeClass().addClass('fa fa-circle-o');
        });

        $([Jupyter.events]).on('kernel_busy.Kernel',function () {
            $("#kb-kernel-icon").removeClass().addClass('fa fa-circle');
        });

        $([Jupyter.events]).on('create.Cell', function(event, data) {
            // this.showJupyterCellToolbar(data.cell);
        }.bind(this));

        $([Jupyter.events]).on('delete.Cell', function(event, data) {
            this.enableKeyboardManager();
        }.bind(this));

        $([Jupyter.events]).on('notebook_save_failed.Notebook', function(event, data) {
            $('#kb-save-btn').find('div.fa-save').removeClass('fa-spin');
            this.saveFailed(event, data);
        }.bind(this));

    };

    Narrative.prototype.initSharePanel = function() {
        var $sharePanel = $('<div>');
        var $shareWidget = $sharePanel.kbaseNarrativeSharePanel({
            ws_name_or_id: this.getWorkspaceName()
        });
        $('#kb-share-btn').popover({
            trigger: 'click',
            html : true,
            placement : "bottom",
            content: function() {
                // we do not allow users to leave thier narratives untitled
                if (Jupyter && Jupyter.notebook) {
                    var narrName = Jupyter.notebook.notebook_name;
                    if (narrName.trim().toLowerCase()==='untitled' || narrName.trim().length === 0) {
                        Jupyter.save_widget.rename_notebook({notebook: Jupyter.notebook}); //"Your Narrative must be named before you can share it with others.", false);
                        return "<br><br>Please name your Narrative before sharing.<br><br>"
                    }
                    Jupyter.narrative.disableKeyboardManager();
                }

                //!! arg!! I have to refresh to get reattach the events, which are lost when
                //the popover is hidden!!!  makes it a little slower because we refetch permissions from ws each time
                $shareWidget.refresh();
                return $sharePanel;
            }
        });
    }

    /**
     * The "Upgrade your container" dialog should be made available when 
     * there's a more recent version of the Narrative ready to use. This
     * dialog then lets the user shut down their existing Narrative container.
     */
    Narrative.prototype.initUpgradeDialog = function() {
        var bodyTemplate = Handlebars.compile(UpdateDialogBodyTemplate);

        var $cancelBtn = $('<button type="button" data-dismiss="modal">')
                         .addClass('btn btn-default')
                         .append('Cancel');
        var $upgradeBtn = $('<button type="button" data-dismiss="modal">')
                          .addClass('btn btn-success')
                          .append('Update and Reload')
                          .click(function(e) {
                              this.updateVersion();
                          }.bind(this));

        var upgradeDialog = new BootstrapDialog({
            title: 'New Narrative version available!',
            buttons: [$cancelBtn, $upgradeBtn]
        });
        $('#kb-update-btn').click(function(event) {
            upgradeDialog.show();
        });
        this.checkVersion()
        .then(function(ver) {
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
    Narrative.prototype.checkVersion = function($newVersion) {
        // look up new version here.
        var self = this;
        return Promise.resolve($.ajax({
            url: Config.url('version_check'),
            async: true,
            dataType: 'text',
            crossDomain: true,
            cache: false
        })).then(function(ver) {
            return Promise.try(function() {
                ver = $.parseJSON(ver);
                return ver;
            })
        }).catch(function(error) {
            console.error('Error while checking for a version update: ' + error.statusText);
            KBError('Narrative.checkVersion', 'Unable to check for a version update!');
        });
    };

    Narrative.prototype.createShutdownDialogButtons = function () {
        var $shutdownButton = $('<button>')
                              .attr({'type':'button', 'data-dismiss':'modal'})
                              .addClass('btn btn-danger')
                              .append('Okay. Shut it all down!')
                              .click(function(e) {
                                  this.updateVersion();
                              }.bind(this));

        var $reallyShutdownPanel = $('<div style="margin-top:10px">')
                                   .append('This will shutdown your Narrative session and close this window.<br><b>Any unsaved data in any open Narrative in any window WILL BE LOST!</b><br>')
                                   .append($shutdownButton)
                                   .hide();

        var $firstShutdownBtn = $('<button>')
                                .attr({'type':'button'})
                                .addClass('btn btn-danger')
                                .append('Shutdown')
                                .click(function(e) {
                                    $reallyShutdownPanel.slideDown('fast');
                                });

        var $cancelButton = $('<button type="button" data-dismiss="modal">')
                            .addClass('btn btn-default')
                            .append('Dismiss')
                            .click(function(e) {
                                $reallyShutdownPanel.hide();
                            });

        return {
            cancelButton: $cancelButton, 
            firstShutdownButton: $firstShutdownBtn,
            finalShutdownButton: $shutdownButton,
            shutdownPanel: $reallyShutdownPanel
        };
    };

    Narrative.prototype.initAboutDialog = function() {
        var $versionDiv = $('<div>')
                          .append('<b>Version:</b> ' + Config.get('version'));
        $versionDiv.append('<br><b>Git Commit:</b> ' + Config.get('git_commit_hash') + ' -- ' + Config.get('git_commit_time'));
        $versionDiv.append('<br>View release notes on <a href="' + Config.get('release_notes') + '" target="_blank">Github</a>');

        var urlList = Object.keys(Config.get('urls')).sort();
        var $versionTable = $('<table>')
                            .addClass('table table-striped table-bordered');
        $.each(urlList,
            function(idx, val) {
                var url = Config.url(val).toString();
                // if url looks like a url (starts with http), include it.
                // ignore job proxy and submit ticket
                if (val === 'narrative_job_proxy' || val === 'submit_jira_ticket')
                    return;
                if (url && url.toLowerCase().indexOf('http') == 0) {
                    var $testTarget = $('<td>');
                    $versionTable.append($('<tr>')
                                         .append($('<td>').append(val))
                                         .append($('<td>').append(url)));
                }
            }
        );
        var $verAccordion = $('<div style="margin-top:15px">');
        $verAccordion.kbaseAccordion({
            elements: [{
                title: 'KBase Service URLs',
                body: $versionTable
            }]
        })
        $versionDiv.append($verAccordion);

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

        $('#kb-about-btn').click(function(event) {
            aboutDialog.show();
        });
    };

    Narrative.prototype.initShutdownDialog = function() {
        var shutdownButtons = this.createShutdownDialogButtons();

        var shutdownDialog = new BootstrapDialog({
            title: 'Shutdown and restart narrative?',
            body: $('<div>').append('Shutdown and restart your Narrative session? Any unsaved changes in any open Narrative in any window WILL BE LOST!'),
            buttons: [
                shutdownButtons.cancelButton,
                shutdownButtons.finalShutdownButton
            ]
        });

        $('#kb-shutdown-btn').click(function() {
            shutdownDialog.show();
        });
    };

    Narrative.prototype.saveFailed = function(event, data) {
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
        }
        else if (data.xhr.responseText) {
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
        }
        else {
            errorText = 'An unknown error occurred!';
        }

        Jupyter.dialog.modal({
            title: "Narrative save failed!",
            body: $('<div>').append(errorText),
            buttons : {
                "OK": {
                    class: "btn-primary",
                    click: function () {
                    }
                }
            },
            open : function (event, ui) {
                var that = $(this);
                // Upon ENTER, click the OK button.
                that.find('input[type="text"]').keydown(function (event, ui) {
                    if (event.which === utils.keycodes.ENTER) {
                        that.find('.btn-primary').first().click();
                    }
                });
                that.find('input[type="text"]').focus();
            }
        });
    };

    // This should not be run until AFTER the notebook has been loaded!
    // It depends on elements of the Notebook metadata.
    Narrative.prototype.init = function() {
        this.registerEvents();
        this.initAboutDialog();
        this.initUpgradeDialog();
        this.initShutdownDialog();

        // var $sidePanel = $('#kb-side-panel').kbaseNarrativeSidePanel({ autorender: false });

        // NAR-271 - Firefox needs to be told where the top of the page is. :P
        window.scrollTo(0,0);
        
        // Disable autosave so as not to spam the Workspace.
        Jupyter.notebook.set_autosave_interval(0);
        kbaseCellToolbar.register(Jupyter.notebook);
        Jupyter.CellToolbar.activate_preset("KBase");
        Jupyter.CellToolbar.global_show();

        this.authToken = $('#signin-button').kbaseLogin('token');

        if (Jupyter && Jupyter.notebook && Jupyter.notebook.metadata) {
            var creatorId = Jupyter.notebook.metadata.creator || 'KBase User';
            DisplayUtil.displayRealName(creatorId, $('#kb-narr-creator'));

            // This puts the cell menu in the right place.
            $([Jupyter.events]).trigger('select.Cell', {cell: Jupyter.notebook.get_selected_cell()});
        }
        if (this.getWorkspaceName() !== null) {
            this.initSharePanel();

            var $sidePanel = $('#kb-side-panel').kbaseNarrativeSidePanel({ autorender: false });
            // init the controller
            this.narrController = $('#notebook_panel').kbaseNarrativeWorkspace({
                ws_id: this.getWorkspaceName()
            });
            this.narrController.render()
            .finally(function() {
                $sidePanel.render();
                $('#kb-wait-for-ws').remove();
            });
        }
        else {
            KBFatal('Narrative.init', 'Unable to locate workspace name from the Narrative object!');
            $('#kb-wait-for-ws').remove();
        }
    };

    /**
     * @method
     * @public
     * This manually deletes the Docker container that this Narrative runs in, if there is one.
     * If it can't, or if this is being run locally, it pops up an alert saying so.
     */
    Narrative.prototype.updateVersion = function() {
        var user = $('#signin-button').kbaseLogin('session', 'user_id');
        Promise.resolve($.ajax({
            contentType: 'application/json',
            url: '/narrative_shutdown/' + user,
            type: 'DELETE',
            crossDomain: true
        }))
        .then(function() {
            setTimeout(function() { location.reload(true); }, 200);
        })
        .catch(function(error) {
            alert('Unable to update your Narrative session\nError: ' + error.status + ': ' + error.statusText);
            console.error(error);
        });
    };

    /**
     * @method
     * @public
     * This triggers a save, but saves all cell states first.
     */
    Narrative.prototype.saveNarrative = function() {
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
    Narrative.prototype.createAndRunMethod = function(method_id, parameters) {
        //first make a request to get the method spec of a particular method
        //getFunctionSpecs.Narrative is implemented in kbaseNarrativeMethodPanel
        var request = { methods:[method_id] };
        var self = this;
        self.narrController.trigger('getFunctionSpecs.Narrative', [request,
            function(specs) {
                // do nothing if the method could not be found
                var errorMsg = 'Method '+method_id+' not found and cannot run.';
                if(!specs) { console.error(errorMsg); return; }
                if(!specs.methods) { console.error(errorMsg); return; }
                if(!specs.methods[method_id]) { console.error(errorMsg); return; }
                // put the method in the narrative by simulating a method clicked in kbaseNarrativeMethodPanel
                self.narrController.trigger('methodClicked.Narrative', specs.methods[method_id]);

                // the method initializes an internal method input widget, but rendering and initializing is
                // async, so we have to wait and check back before we can load the parameter state.
                // TODO: update kbaseNarrativeMethodCell to return a promise to mark when rendering is complete
                var newCell = Jupyter.notebook.get_selected_cell();
                var newCellIdx = Jupyter.notebook.get_selected_index();
                var newWidget = $('#'+$(newCell.get_text())[0].id).kbaseNarrativeMethodCell();
                var updateStateAndRun = function(state) {
                    if(newWidget.$inputWidget) {
                        // if the $inputWidget is not null, we are good to go, so set the parameters
                        newWidget.loadState(parameters);
                        // make sure the new cell is still selected, then run the method
                        Jupyter.notebook.select(newCellIdx);
                        newWidget.runMethod();
                    } else {
                        // not ready yet, keep waiting
                        window.setTimeout(updateStateAndRun,500);
                    }
                };
                // call the update and run after a short deplay
                window.setTimeout(updateStateAndRun,50);
            }
        ]);
    };

    Narrative.prototype.getWorkspaceName = function() {
        return Jupyter.notebook.metadata.ws_name || null;
    };

    Narrative.prototype.lookupUserProfile = function(username) {
        return displayUtil.lookupUserProfile(username);
    };

    /**
     * A little bit of a riff on the Jupyter "find_cell_index". 
     * Every KBase-ified cell (App, Method, Output) has a unique identifier.
     * This can be used to find the closest cell element - its index is the 
     * Jupyter cell index (inferred somewhat from find_cell_index which calls 
     * get_cell_elements, which does this searching).
     */
    Narrative.prototype.getCellIndexByKbaseId = function(id) {
        return $('#' + id).closest('.cell').not('.cell .cell').index();
    };

    Narrative.prototype.getCellByKbaseId = function(id) {
        return Jupyter.notebook.get_cell(this.getCellIndexByKbaseId(id));
    };

    /**
     * Jupyter doesn't auto select cells on creation, so this
     * is a helper that does so. It then returns the cell object
     * that gets created.
     */
    Narrative.prototype.insertAndSelectCellBelow = function(cellType, index) {
        return this.insertAndSelectCell(cellType, 'below');
    };

    Narrative.prototype.insertAndSelectCellAbove = function(cellType, index) {
        return this.insertAndSelectCell(cellType, 'above');
    };

    Narrative.prototype.insertAndSelectCell = function(cellType, direction, index) {
        var newCell;
        if (direction === 'below')
            newCell = Jupyter.notebook.insert_cell_below(cellType, index);
        else
            newCell = Jupyter.notebook.insert_cell_above(cellType, index);
        Jupyter.notebook.focus_cell(newCell);
        Jupyter.notebook.select(Jupyter.notebook.find_cell_index(newCell));
        this.scrollToCell(newCell);

        return newCell;
    };

    Narrative.prototype.scrollToCell = function(cell, select) {
        var $elem = $('#notebook-container');
        $elem.animate({ scrollTop: cell.element.offset().top + $elem.scrollTop() - $elem.offset().top }, 400);
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
    Narrative.prototype.toggleSidePanel = function(setHidden) {
        var delay = 'fast';
        var hidePanel = setHidden;
        if (hidePanel === null || hidePanel === undefined)
            hidePanel = $('#left-column').is(':visible') ? true : false;
        if (hidePanel) {
            $('#left-column').trigger('hideSidePanelOverlay.Narrative');
            $('#left-column').hide('slide', {
                direction: 'left', 
                easing: 'swing', 
                complete: function() { 
                    $('#kb-side-toggle-in').show('slide', {
                        direction: 'left',
                        easing: 'swing',
                    }, delay);
                }
            }, delay);
            // Move content flush left-ish
            $('#notebook-container').animate(
                {left: 0}, 
                { 
                  easing: 'swing', 
                  duration: delay,
                }
            );
        }
        else {
            $('#kb-side-toggle-in').hide('slide', {
                direction: 'left',
                easing: 'swing',
                complete: function() {
                    $('#left-column').show('slide', {
                        direction: 'left', 
                        easing: 'swing'
                    }, delay);
                    $('#notebook-container').animate({left: 380}, {easing: 'swing', duration: delay});
                }
            }, delay);
            // Move content flush left-ish
        }
    };

    return Narrative;
});