(function( $ ) {

    $(function() {
        $(document).on('loggedIn.kbase', function(event, token) {
            narrativeWsWidget.loggedIn(token);
        });

        $(document).on('loggedOut.kbase', function(event, token) {
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
            console.log(token);
            narrativeWsWidget.loggedIn(token);
        }
    });

})( jQuery );