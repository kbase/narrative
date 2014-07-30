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

    var dataWidget = $('#kb-ws').kbaseWorkspaceDataDeluxe();
    dataWidget.showLoadingMessage('Waiting for Narrative to finish loading...');

    var functionWidget = $('#kb-function-panel').kbaseNarrativeFunctionPanel({ autopopulate: false });
    functionWidget.refreshAJAX();

    /*
     * Once everything else is loaded and the Kernel is idle,
     * Go ahead and fill in the rest of the Javascript stuff.
     */
    $([IPython.events]).one('status_started.Kernel', function() {

        var workspaceId = null;
        if (IPython && IPython.notebook && IPython.notebook.metadata) {
            workspaceId = IPython.notebook.metadata.ws_name;                
        }

        IPython.notebook.set_autosave_interval(0);

        if (workspaceId) {
            $('a#workspace-link').attr('href', $('a#workspace-link').attr('href') + 'objtable/' + workspaceId);
            dataWidget.setWorkspace(workspaceId);
        }

        // Should be renamed.... eventually?
        narr_ws = $('#notebook_panel').kbaseNarrativeWorkspace({
            loadingImage: "/static/kbase/images/ajax-loader.gif",
            ws_id: IPython.notebook.metadata.ws_name
        });
    });
};


