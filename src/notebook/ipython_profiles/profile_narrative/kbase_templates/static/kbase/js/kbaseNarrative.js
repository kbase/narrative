/**
 * Create narrative's workspace widget
 * 
 */

(function( $ ) {

    var narr_ws = null;

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
        if (narr_ws == null) {
            var $ws = $('#kb-ws');
            narr_ws = $ws
                .kbaseNarrativeWorkspace({
                  loadingImage: "/static/kbase/images/ajax-loader.gif",
                  controlsElem: $ws.find('.kb-controls'),
                  tableElem: $ws.find('.kb-table')
            });
        }
        var token = $("#login-widget").kbaseLogin("session", "token");
        narr_ws.loggedIn(token);
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

        $([IPython.events]).on('notebook_loaded.Notebook', function() {
            IPython.notebook.set_autosave_interval(300);
        });

    });

})( jQuery );

// Some additional JS code that we need to run unreleated to the workspace widget
// Set the autosave interval to 5 minutes
//setTimeout( function() {IPython.notebook.set_autosave_interval(300);},2000);
