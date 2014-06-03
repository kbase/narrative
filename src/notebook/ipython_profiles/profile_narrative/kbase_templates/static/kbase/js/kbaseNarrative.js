/**
 * Create narrative's workspace widget
 * 
 */
"use strict";


var narrative = {};
narrative.init = function() {

    /**
     * main function.
     */
    var token = null;

    $(document).on('loggedIn.kbase', function(event, token) {
        token = $('#signin-button').kbaseLogin('session', 'token');
    });

    $(document).on('loggedOut.kbase', function(event, token) {
        narr_ws.loggedOut(token);
    });

    var dataWidget = $('#kb-ws').kbaseWorkspaceDataDeluxe();
    dataWidget.showLoadingMessage('Waiting for Narrative to finish loading...');

    var functionWidget = $('#kb-function-panel').kbaseNarrativeFunctionPanel({ autopopulate: false });
    functionWidget.showLoadingMessage('Waiting for Narrative to finish loading...');

    /**
     * Initializes the environment, once we know the kernel has started.
     * There's an issue with the kernel starting asynchronously, without an event
     * to catch when it's done - if a command is passed to it before finishing, it errors out.
     *
     * To work around this, initEnvironment catches any error, and tries to run itself again after
     * a second.
     */
    var initEnvironment = function(token, workspaceId) {
        try {
            var cmd = "import os\n" +
                      "os.environ['KB_AUTH_TOKEN'] = '" + token + "'\n" +
                      "os.environ['KB_WORKSPACE_ID'] = '" + workspaceId + "'\n";
            IPython.notebook.kernel.execute(cmd, {}, {'silent' : true});
            IPython.notebook.set_autosave_interval(0);

            functionWidget.refresh();
        }
        catch (error) {
            setTimeout(function() {
                initEnvironment(token, workspaceId);
            }, 1000);
        }
    };

    /*
     * Once everything else is loaded and the Kernel is idle,
     * Go ahead and fill in the rest of the Javascript stuff.
     */
    $([IPython.events]).one('status_started.Kernel', function() {

        var workspaceId = null;
        if (IPython.notebook.metadata) {
            workspaceId = IPython.notebook.metadata.ws_name;                
        }
        token = $('#signin-button').kbaseLogin('session', 'token');

        if (workspaceId) {
            $('a#workspace-link').attr('href', $('a#workspace-link').attr('href') + 'objtable/' + workspaceId);
            dataWidget.setWorkspace(workspaceId);
        }

        // XXX: Should be renamed.... eventually?
        var narr_ws = $('#notebook_panel').kbaseNarrativeWorkspace({
            loadingImage: "/static/kbase/images/ajax-loader.gif",
            ws_id: IPython.notebook.metadata.ws_name
        });

        narr_ws.loggedIn(token);
        initEnvironment(token, workspaceId);
    });
};


