/**
 * Create narrative's workspace widget
 * 
 */

(function( $ ) {

    var narr_ws = null;
    var authToken = null;

    /**
     * Connecting to KBase..
     */
    var kbaseConnecting = function() {
        console.debug("Connecting.begin");
        $("#main-container").addClass("pause");
        $("#kb-ws-guard").addClass("pause");
        console.debug("Connecting.end");
    };

    /** Once connected */
    var kbaseConnected = function() {
        console.debug("kbaseConnected!");
        $('#main-container').removeClass('pause');
        $('#kb-ws-guard').removeClass('pause').css("display", "none");
        authToken = $("#login-widget").kbaseLogin("session", "token");
    };

    /**
     * main function.
     */
    $(function() {
        kbaseConnecting();

        $(document).on('loggedIn.kbase', function(event, token) {
            kbaseConnected();
        });

        $(document).on('loggedOut.kbase', function(event, token) {
            narr_ws.loggedOut(token);
            kbaseConnecting();
        });

        var token = $("#login-widget").kbaseLogin("session", "token");
        if (token) {
            console.debug("Authorization token found");
            kbaseConnected();
        }

        /*
         * Once everything else is loaded and the Kernel is idle,
         * Go ahead and fill in the rest of the Javascript stuff.
         */
        $([IPython.events]).one('status_idle.Kernel', function() {
            var workspaceId = IPython.notebook.metadata.ws_name;

            $('#kb-ws').kbaseWorkspaceDataDeluxe({ 'wsId': workspaceId });
            // Build the list of available functions.
            $('#kb-function-panel').kbaseNarrativeFunctionPanel({});

            // XXX: Should be renamed.... eventually?
            narr_ws = $('#notebook_panel').kbaseNarrativeWorkspace({
                loadingImage: "/static/kbase/images/ajax-loader.gif",
                ws_id: IPython.notebook.metadata.ws_name
            });


            narr_ws.loggedIn(token);
            var cmd = "import os\n" +
                      "os.environ['KB_AUTH_TOKEN'] = '" + token + "'\n" +
                      "os.environ['KB_WORKSPACE_ID'] = '" + workspaceId + "'\n";
            IPython.notebook.kernel.execute(cmd, {}, {'silent' : true});

            IPython.notebook.set_autosave_interval(0);
        });

    });

})( jQuery );

// Some additional JS code that we need to run unreleated to the workspace widget
// Set the autosave interval to 5 minutes
//setTimeout( function() {IPython.notebook.set_autosave_interval(300);},2000);
