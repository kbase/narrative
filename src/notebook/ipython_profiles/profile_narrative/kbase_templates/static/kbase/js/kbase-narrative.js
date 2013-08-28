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

        narrativeWsWidget = $("#narrative-workspace-view").kbaseNarrativeWorkspace({
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

        // set the auth token by calling the kernel execute method on a function in
        // the magics module

        var set_token = function () {
            // grab the token from the handler, since it isn't passed in with args
            var tok = $("#login-widget").kbaseLogin('session','token');
            console.log( "Logging in");

            // set the token in the ipython kernel using special handler
            var cmd = "biokbase.narrative.magics.set_token( '" + tok + "')";

            // make sure the shell_channel is ready, otherwise sleep for .5 sec
            // and then try it. We use the ['kernel'] attribute deref in case
            // because at parse time the kernel attribute may not be ready
            if (IPython.notebook['kernel'].shell_channel.readyState == 1) {
                IPython.notebook['kernel'].execute( cmd );
            } else {
                console.log( "Pausing for 500 ms before calling handler");
                setTimeout( function() { IPython.notebook['kernel'].execute( cmd ); }, 500 );
            }
        };


        $("#login-widget").kbaseLogin({ 
            style: "text",

            login_callback: function(args) {
                set_token();
            },

            logout_callback: function(args) {
                // flag as not logged in.
                // clear the token in the ipython kernel using special handler
                console.log( "Logging out");
                var cmd = "biokbase.narrative.magics.clear_token()";
                IPython.notebook.kernel.execute( cmd );

            },

            prior_login_callback: function(args) {
                // Do actual login once the kernel is up - only an issue for prior_login
                $([IPython.events]).on('status_started.Kernel', set_token);
            },
        });
    });

})( jQuery );