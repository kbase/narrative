(function( $ ) {

    $(function() {
        $(document).on('loggedIn.kbase', function(event, token) {
            narrativeWsWidget.loggedIn(token);
            narrativeUploadWidget.loggedIn(token);
        });

        $(document).on('loggedOut.kbase', function(event, token) {
            narrativeWsWidget.loggedOut(token);
            narrativeUploadWidget.loggedOut(token);
        });

        var narrativeWsWidget = $("#narrative-workspace-view").kbaseNarrativeWorkspace({
            tabs: [
                { 
                    name: "Narrative",
                    workspace: "KBaseFBA"
                },
                {
                    name: "Workspace",
                    workspace: "bill_models"
                },
                {
                    name: "Project",
                    workspace: "billbootcamp"
                }
            ],
            loadingImage: "/static/kbase/images/ajax-loader.gif"
        });

        narrativeUploadWidget = $("#data-add-btn").kbaseUploadWidget({});

        var token = $("#login-widget").kbaseLogin("session", "token");
        if (token) {
            narrativeWsWidget.loggedIn(token);
            narrativeUploadWidget.loggedIn(token);
        }


    });

})( jQuery );