/**
 * This is the entry point for the Narrative's front-end. It initializes
 * the login session, fires up the data and function widgets, and creates
 * the kbaseNarrativeWorkspace wrapper around the IPython notebook that
 * does fun things like manage widgets and cells and kernel events to talk to them.
 */
"use strict";

// Bind all page buttons right at startup.
(function() {
    $(document).on('workspaceIdQuery.Narrative', function(e, callback) {
        if (callback) {
            callback(workspaceId);
        }
    });

    // bind menubar buttons
    $('#kb-save-btn').click(function(e) {
        if (IPython && IPython.notebook) {
            var narrName = IPython.notebook.notebook_name;
            // we do not allow users to leave their narratives untitled
            if (narrName.trim().toLowerCase()==='untitled' || narrName.trim().length === 0) {
                IPython.save_widget.rename_notebook("Please name your Narrative before saving.", false);
            } else {
                IPython.notebook.save_checkpoint();
            }
        }
    });
    $('#kb-narr-name #name').click(function(e) {
        if (IPython && IPython.save_widget) {
            IPython.save_widget.rename_notebook("Rename your Narrative.", true);
            var narrName = IPython.notebook.notebook_name;
            // this code needs to move to the save widget since rename_notebook is async!!
            //$('#kb-narr-name #name').text(narrName);
        }
    });
    $('#kb-kernel-int-btn').click(function(e) {
        if (IPython && IPython.notebook && IPython.notebook.kernel) {
            IPython.notebook.kernel.interrupt();
        }
    });
    $('#kb-kernel-ref-btn').click(function(e) {
        if (IPython && IPython.notebook && IPython.notebook.kernel) {
            IPython.notebook.kernel.restart();
        }
    });
    $('#kb-del-btn').click(function(e) {
        if (IPython && IPython.notebook)
            IPython.notebook.delete_cell();
    });
    $('#kb-jira-btn').attr('href', window.kbconfig.urls.submit_jira_ticket + '%20' + window.kbconfig.version);
    $('#kb-status-btn').attr('href', window.kbconfig.urls.status_page);

    var $dataList = $('<div>');
    var $shareWidget = $dataList["kbaseNarrativeSharePanel"]({});
    $('#kb-share-btn').popover({
        html : true,
        placement : "bottom",
        //title: function() {
        //    return "Share this Narrative & Data";
        //},
        content: function() {
            // we do not allow users to leave thier narratives untitled
            if (IPython && IPython.notebook) {
                var narrName = IPython.notebook.notebook_name;
                if (narrName.trim().toLowerCase()==='untitled' || narrName.trim().length === 0) {
                    IPython.save_widget.rename_notebook("Your Narrative must be named before you can share it with others.", false);
                    return "<br><br>Please name your Narrative before sharing.<br><br>"
                }
            }

            //!! arg!! I have to refresh to get reattach the events, which are lost when
            //the popover is hidden!!!  makes it a little slower because we refetch permissions from ws each time
            $shareWidget.refresh();
            return $dataList;
        }
    });

    $('#kb-add-code-cell').click(function() { IPython.notebook.insert_cell_below('code'); })
    $('#kb-add-md-cell').click(function() { IPython.notebook.insert_cell_below('markdown'); })

})();

/**
 * Error logging for detectable failure conditions.
 * Logs go through the kernel and thus are sent to the
 * main KBase logging facility (Splunk, as of this writing).
 *
 * Usage:
 *    KBFail(<is_it_fatal>, "what you were doing", "what happened");
 * Returns: false if IPython not initialized yet, true otherwise
 */
var _kb_failed_once = false;
var KBFail = function(is_fatal, where, what) {
    if (!IPython || !IPython.notebook || !IPython.notebook.kernel) {
        return false;
    }
    var code = "";
    if (_kb_failed_once == false) {
        code += "from biokbase.narrative.common import kblogging\n";
        _kb_failed_once = true;
    }
    code += "kblogging.NarrativeUIError(";
    if (is_fatal) {
        code += "True,";
    }
    else {
        code += "False,";
    }
    if (where) {
        code += 'where="' + where + '"';
    }
    if (what) {
        if (where) { code += ", "; }
        code += 'what="' + what + '"';
    }
    code += ")\n";
    // Log the failure
    try {
        IPython.notebook.kernel.execute(code, null, {store_history: false});        
    }
    catch (err) {
        // wait half a second and try one more time.
        console.log(err);
        setTimeout( function() { IPython.notebook.kernel.execute(code, null, {store_history: false}); }, 500 );
    }    
    return true;
}
/**
 * Syntactic sugar for logging error vs. fatal error.
 *
 * Same as KBFail() with boolean flag replaced by different names
 * for the function.
 */
var KBError = function(where, what) {
  return KBFail(false, where, what);
}
var KBFatal = function(where, what) {
  return KBFail(true, where, what);
}

var Narrative = function() {
    this.narr_ws = null;
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
                                            .append($('<span>').append(' is now available. Click "Update and Reload" to reload with the latest version!')))
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

    $('[data-toggle="tooltip"]').tooltip()
    /*
     * Before we get everything loading, just grey out the whole %^! page
     */
    var $sidePanel = $('#kb-side-panel').kbaseNarrativeSidePanel({ autorender: false });

    /*
     * Once everything else is loaded and the Kernel is idle,
     * Go ahead and fill in the rest of the Javascript stuff.
     */
    $([IPython.events]).one('status_started.Kernel', function() {
        // NAR-271 - Firefox needs to be told where the top of the page is. :P
        window.scrollTo(0,0);
        
        IPython.notebook.set_autosave_interval(0);
        IPython.CellToolbar.activate_preset("KBase");

        var ws_name = null;
        if (IPython && IPython.notebook && IPython.notebook.metadata) {
            ws_name = IPython.notebook.metadata.ws_name;
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
        if (ws_name) {
            /* It's ON like DONKEY KONG! */
            $('a#workspace-link').attr('href', $('a#workspace-link').attr('href') + 'objects/' + ws_name);
            var narr_ws = $('#notebook_panel').kbaseNarrativeWorkspace({
                loadingImage: "/static/kbase/images/ajax-loader.gif",
                ws_id: IPython.notebook.metadata.ws_name
            });
            $sidePanel.render();
            $(document).trigger('setWorkspaceName.Narrative', {'wsId' : ws_name, 'narrController': narr_ws});
        }
        else {
            // ?
        }
    });
};

Narrative.prototype.updateVersion = function() {
    $('#kb-save-btn').trigger('click');
    var user = $('#signin-button').kbaseLogin('session', 'user_id');
    var prom = $.ajax({
        contentType: 'applcation/json',
        url: '/narrative_shutdown/' + user,
        type: 'DELETE',
        crossDomain: true
    });
    prom.done(function(jqXHR, response, status) {
        setTimeout(function() { location.reload(true); }, 200);
    });
    prom.fail(function(jqXHR, response, error) {
        alert('Unable to reset your Narrative session\nError: ' + jqXHR.status + ' ' + error);
    });
};