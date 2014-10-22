/**
 * This is the entry point for the Narrative's front-end. It initializes
 * the login session, fires up the data and function widgets, and creates
 * the kbaseNarrativeWorkspace wrapper around the IPython notebook that 
 * does fun things like manage widgets and cells and kernel events to talk to them.
 */
"use strict";


var narrative = {};
narrative.init = function() {
    var token = null;
    var narr_ws = null;

    var versionStr = 'KBase Narrative<br>Alpha version';
    if (window.kbconfig && 
        window.kbconfig.name && 
        window.kbconfig.version)
        versionStr = window.kbconfig.name + '<br>' + window.kbconfig.version;
    $('.version-stamp').empty().html(versionStr);

    var $dataWidget = $('#kb-ws').kbaseNarrativeDataPanel();
    $dataWidget.showLoadingMessage('Waiting for Narrative to finish loading...');

    var $functionWidget = $('#kb-function-panel').kbaseNarrativeFunctionPanel({ autopopulate: false });
    $functionWidget.refreshFromService();

    var jobsWidget = $('#kb-jobs-panel').kbaseNarrativeJobsPanel({ autopopulate: false });
    jobsWidget.showLoadingMessage('Waiting for Narrative to finish loading...');

    /*
     * Once everything else is loaded and the Kernel is idle,
     * Go ahead and fill in the rest of the Javascript stuff.
     */
    $([IPython.events]).one('status_started.Kernel', function() {
        // NAR-271 - Firefox needs to be told where the top of the page is. :P
        window.scrollTo(0,0);

        var workspaceId = null;
        if (IPython && IPython.notebook && IPython.notebook.metadata) {
            workspaceId = IPython.notebook.metadata.ws_name;
        }

        if (workspaceId) {
            $('a#workspace-link').attr('href', $('a#workspace-link').attr('href') + 'objects/' + workspaceId);
            $dataWidget.setWorkspace(workspaceId);
        }

        // Should be renamed.... eventually?
        narr_ws = $('#notebook_panel').kbaseNarrativeWorkspace({
            loadingImage: "/static/kbase/images/ajax-loader.gif",
            ws_id: IPython.notebook.metadata.ws_name
        });

        // still needs to wait ~500ms for some godawful reason.
        setTimeout( function() { jobsWidget.refresh(); }, 500);
    });
};
