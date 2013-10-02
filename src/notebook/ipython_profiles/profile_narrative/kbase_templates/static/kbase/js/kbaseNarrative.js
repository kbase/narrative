/**
 * Create narrative's workspace widget
 * 
 */

(function( $ ) {

    /**
     * Wait for IPython notebook to exist.
     */
    $(function() {
        console.debug("waitForIPython.begin");
        if (typeof IPython == 'undefined' ||
            typeof IPython.notebook == 'undefined' ||
            typeof IPython.notebook.metadata == 'undefined') {
            setTimeout(this._waitForIpython, 300);
        }
        console.debug("waitForIPython.end");
    });
    /**
     * main function.
     */
    $(function() {
        $(document).on('loggedIn.kbase', function(event, token) {
            console.debug("logged in");
            narrativeWsWidget.loggedIn(token);
        });

        $(document).on('loggedOut.kbase', function(event, token) {
            console.debug("logged out")
            narrativeWsWidget.loggedOut(token);
        });
        var $ws = $('#kb-ws');
        var narrativeWsWidget = $ws
            .kbaseNarrativeWorkspace({
              loadingImage: "/static/kbase/images/ajax-loader.gif",
              controlsElem: $ws.find('.kb-controls'),
              tableElem: $ws.find('.kb-table')
        });

        var token = $("#login-widget").kbaseLogin("session", "token");
        if (token) {
            console.debug("auth token",token);
            narrativeWsWidget.loggedIn(token);
        }
    });

})( jQuery );