/**
 * This is the entry point for the Narrative's front-end. It initializes
 * the login session, fires up the data and function widgets, and creates
 * the kbaseNarrativeWorkspace wrapper around the IPython notebook that
 * does fun things like manage widgets and cells and kernel events to talk to them.
 *
 * To set global variables, use: IPython.narrative.<name> = value
 */
"use strict";

define(['jquery', 'kbaseNarrativeSidePanel', 
        'kbaseNarrativeOutputCell', 'kbaseNarrativeWorkspace'], 
        function( $ ) {

/**
 * @constructor
 * The base, namespaced Narrative object. This is mainly used at start-up time, and
 * gets injected into the IPython namespace.
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
    this.narrController = null;
    this.readonly = false; /* whether whole narrative is read-only */
    this.authToken = null;
    this.versionCheckTime = 6000*60*1000;
    this.versionHtml = 'KBase Narrative<br>Alpha version';
    this.selectedCell = null;
    this.currentVersion = window.kbconfig.version;

    return this;
};

Narrative.prototype.showIPythonCellToolbar = function(cell) {
    if (this.selectedCell && cell != this.selectedCell)
        this.selectedCell.celltoolbar.hide();
    this.selectedCell = cell;
    // show the new one
    if (this.selectedCell && !this.selectedCell.metadata['kb-cell'])
        this.selectedCell.celltoolbar.show();
};

Narrative.prototype.registerEvents = function() {
    $([IPython.events]).on('status_idle.Kernel',function () {
        $("#kb-kernel-icon").removeClass().addClass('fa fa-circle-o');
    });

    $([IPython.events]).on('status_busy.Kernel',function () {
        $("#kb-kernel-icon").removeClass().addClass('fa fa-circle');
    });

    $([IPython.events]).on('select.Cell', $.proxy(function(event, data) {
        this.showIPythonCellToolbar(data.cell);
    }, this));

    $([IPython.events]).on('create.Cell', $.proxy(function(event, data) {
        this.showIPythonCellToolbar(data.cell);
    }, this));

    $([IPython.events]).on('delete.Cell', $.proxy(function(event, data) {
        this.showIPythonCellToolbar(IPython.notebook.get_selected_cell());
    }, this));
};

Narrative.prototype.initUpgradeDialog = function() {
    var $newVersion = $('<span>')
                      .append('<b>No new version</b>');  // init to the current version
    var $cancelBtn = $('<button type="button" data-dismiss="modal">')
                     .addClass('btn btn-default')
                     .append('Cancel');
    var $upgradeBtn = $('<button type="button" data-dismiss="modal">')
                      .addClass('btn btn-success')
                      .append('Update and Reload')
                      .click($.proxy(function(e) {
                          this.updateVersion();
                      }, this));
    var $upgradeModal = $('<div tabindex=-1 role="dialog" aria-hidden="true">')
                        .addClass('modal fade')
                        .append($('<div>')
                                .addClass('modal-dialog')
                                .append($('<div>')
                                    .addClass('modal-content')
                                    .append($('<div>')
                                            .addClass('modal-header')
                                            .append($('<h4>')
                                                    .addClass('modal-title')
                                                    .attr('id', 'kb-version-label')
                                                    .append('New Narrative Version available!')))
                                    .append($('<div>')
                                            .addClass('modal-body')
                                            .append($('<span>').append('Your current version of the Narrative is <b>' + this.currentVersion + '</b>. Version '))
                                            .append($newVersion)
                                            .append($('<span>').append(' is now available.<br><br>' + 
                                                                       'See <a href="' + window.kbconfig.release_notes + '" target="_blank">here</a> for current release notes.<br>' +
                                                                       'Click "Update and Reload" to reload with the latest version!<br><br>' + 
                                                                       '<b>Any unsaved data in any open Narrative in any window WILL BE LOST!</b>')))
                                    .append($('<div>')
                                            .addClass('modal-footer')
                                            .append($('<div>')
                                                    .append($cancelBtn)
                                                    .append($upgradeBtn)))));
    $('#kb-update-btn').click(function(event) {
        $upgradeModal.modal('show');
    });
    this.checkVersion($newVersion);
    // ONLY CHECK AT STARTUP FOR NOW.
    // setInterval(function() {
    //     self.checkVersion($newVersion);
    // }, this.versionCheckTime);
};

Narrative.prototype.checkVersion = function($newVersion) {
    // look up new version here.
    var self = this;
    $.ajax({
        url: window.kbconfig.urls.version_check,
        async: true,
        dataType: 'text',
        crossDomain: true,
        cache: false,
        success: function(ver) {
            ver = $.parseJSON(ver);
            if (self.currentVersion !== ver.version) {
                $newVersion.empty().append('<b>' + ver.version + '</b>');
                $('#kb-update-btn').fadeIn('fast'); 
            }
        },
        fail: function(err) {
            console.log('err');
        }
    });
};

Narrative.prototype.initAboutDialog = function() {
    if (window.kbconfig &&
        window.kbconfig.name &&
        window.kbconfig.version) {
        var $versionDiv = $('<div>')
                          .append('<b>Version:</b> ' + window.kbconfig.version);
        if (window.kbconfig.git_commit_hash && window.kbconfig.git_commit_time)
            $versionDiv.append('<br><b>Git Commit:</b> ' + window.kbconfig.git_commit_hash + ' -- ' + window.kbconfig.git_commit_time);
        if (window.kbconfig.release_notes)
            $versionDiv.append('<br>View release notes on <a href="' + window.kbconfig.release_notes + '" target="_blank">Github</a>');

        if (window.kbconfig.urls) {
            var urlList = Object.keys(window.kbconfig.urls).sort();
            var $versionTable = $('<table>')
                                .addClass('table table-striped table-bordered');
            $.each(urlList,
                function(idx, val) {
                    var url = window.kbconfig.urls[val].toString();
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
        }
    }

    var $shutdownButton = $('<button>')
                          .attr({'type':'button', 'data-dismiss':'modal'})
                          .addClass('btn btn-danger')
                          .append('Okay. Shut it all down!')
                          .click($.proxy(function(e) {
                              this.updateVersion();
                          }, this));
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

    var $versionModal = $('<div tabindex=-1 role="dialog" aria-labelledby="kb-version-label" aria-hidden="true">')
                        .addClass('modal fade')
                        .append($('<div>')
                                .addClass('modal-dialog')
                                .append($('<div>')
                                    .addClass('modal-content')
                                    .append($('<div>')
                                            .addClass('modal-header')
                                            .append($('<h4>')
                                                    .addClass('modal-title')
                                                    .attr('id', 'kb-version-label')
                                                    .append('KBase Narrative Properties')))
                                    .append($('<div>')
                                            .addClass('modal-body')
                                            .append($versionDiv))
                                    .append($('<div>')
                                            .addClass('modal-footer')
                                            .append($('<div>')
                                                    .append($('<button type="button" data-dismiss="modal">')
                                                            .addClass('btn btn-default')
                                                            .append('Dismiss')
                                                            .click(function(e) {
                                                                $reallyShutdownPanel.hide();
                                                            }))
                                                    .append($firstShutdownBtn))
                                            .append($reallyShutdownPanel))));

    $('#kb-about-btn').click(function(event) {
        $versionModal.modal('show');
    });
    $('#notebook').append($versionModal);
};

Narrative.prototype.init = function() {
    this.registerEvents();
    this.initAboutDialog();
    this.initUpgradeDialog();

    $('[data-toggle="tooltip"]').tooltip();

    /*
     * Once everything else is loaded and the Kernel is idle,
     * Go ahead and fill in the rest of the Javascript stuff.
     */
    $([IPython.events]).one('status_started.Kernel', $.proxy(function() {
        /*
         * Before we get everything loading, just grey out the whole %^! page
         */
        var $sidePanel = $('#kb-side-panel').kbaseNarrativeSidePanel({ autorender: false });

        // NAR-271 - Firefox needs to be told where the top of the page is. :P
        window.scrollTo(0,0);
        
        IPython.notebook.set_autosave_interval(0);
        IPython.CellToolbar.activate_preset("KBase");

        this.ws_name = null;
        if (IPython && IPython.notebook && IPython.notebook.metadata) {
            this.ws_name = IPython.notebook.metadata.ws_name;
            var narrname = IPython.notebook.notebook_name;
            var username = IPython.notebook.metadata.creator;
            $('#kb-narr-name #name').text(narrname);
            $('#kb-narr-creator').text(username);
            $('.kb-narr-namestamp').css({'display':'block'});

            var token = null;
            if (window.kb && window.kb.token)
                token = window.kb.token;

            $.ajax({
                type: 'GET',
                url: 'https://kbase.us/services/genome_comparison/users?usernames=' + username + '&token=' + token,
                dataType: 'json',
                crossDomain: true,
                success: function(data, res, jqXHR) {
                    if (username in data.data && data.data[username].fullName) {
                        var fullName = data.data[username].fullName;
                        $('#kb-narr-creator').text(fullName + ' (' + username + ')');
                    }
                }
            });

            // This puts the cell menu in the right place.
            $([IPython.events]).trigger('select.Cell', {cell: IPython.notebook.get_selected_cell()});
        }
        if (this.ws_name) {
            /* It's ON like DONKEY KONG! */
            $('a#workspace-link').attr('href', $('a#workspace-link').attr('href') + 'objects/' + this.ws_name);
            this.narrController = $('#notebook_panel').kbaseNarrativeWorkspace({
                loadingImage: "/static/kbase/images/ajax-loader.gif",
                ws_id: IPython.notebook.metadata.ws_name
            });
            $sidePanel.render();
            $(document).trigger('setWorkspaceName.Narrative', {'wsId' : this.ws_name, 'narrController': this.narrController});
        }
        else {
            KBFatal("Narrative.init", "Unable to locate workspace name from the Narrative object!");
        }
    }, this));
};

Narrative.prototype.updateVersion = function() {
    var user = $('#signin-button').kbaseLogin('session', 'user_id');
    var prom = $.ajax({
        contentType: 'application/json',
        url: '/narrative_shutdown/' + user,
        type: 'DELETE',
        crossDomain: true
    });
    prom.done(function(jqXHR, response, status) {
        setTimeout(function() { location.reload(true); }, 200);
    });
    prom.fail(function(jqXHR, response, error) {
        alert('Unable to update your Narrative session\nError: ' + jqXHR.status + ' ' + error);
    });
};

/**
 * @method
 * @public
 * This triggers a save, but does a few steps first:
 * ....or, it will soon.
 * for now, it just passes through to the usual save.
 */
Narrative.prototype.saveNarrative = function() {
    IPython.notebook.save_checkpoint();
};

return Narrative;
});