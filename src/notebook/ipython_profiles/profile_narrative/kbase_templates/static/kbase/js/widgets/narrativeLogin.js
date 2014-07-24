/**
 * Flow.
 * 1. User goes to "their" page (narratives, newsfeeds, w/e).
 * 2. Widget inits.
 * 3. If User isn't logged in (widget doesn't get a token):
 *    a. Hide everything.
 *    b. Modal with login prompt.
 *    c. If cancel, return to kbase.us
 *    d. If login okay, login user and... what? Reload page? Continue with page population?
 * 4. If User is logged in, continue. Everything's peachy.
 * 5. Widget sits in T/R corner.
 * Could probably use big chunks of Jim's code. But his layout stuff needs rewriting.
 */

(function( $, undefined ) {

    $(function() {
        // set the auth token by calling the kernel execute method on a function in
        // the magics module

        // function set_cookie() {
        //    var c = $("#signin-button").kbaseLogin('get_kbase_cookie');
        //    $.cookie('kbase_session',
        //     'un=' + c.user_id
        //     + '|'
        //     + 'kbase_sessionid=' + c.kbase_sessionid
        //     + '|'
        //     + 'user_id=' + c.user_id
        //     + '|'
        //     + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
        //     { path: '/'});
        //    $.cookie('kbase_session',
        //     'un=' + c.user_id
        //     + '|'
        //     + 'kbase_sessionid=' + c.kbase_sessionid
        //     + '|'
        //     + 'user_id=' + c.user_id
        //     + '|'
        //     + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
        //     { path: '/',
        //       domain: 'kbase.us' });
        // };

//         function login_change() {
// //            window.location.reload();
// //            set_cookie();
//         };

        // var clear_cookie = function() {
        //     $.removeCookie('kbase_session',{ path: '/', domain: 'kbase.us' });
        // };

        var set_token = function () {
            // grab the token from the handler, since it isn't passed in with args
//            set_cookie();
            var tok = $("#signin-button").kbaseLogin('session','token');

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

        var loginWidget = $("#signin-button").kbaseLogin({ 
            login_callback: function(args) {
//                set_cookie();
                // If the notebook kernel's initialized, tell it to set the token.
                if (IPython.notebook) {
                    set_token();
                } else {
                    console.log( "IPython.notebook not set, cannot set token on backend");
                }
            },

            logout_callback: function(args) {
                // If the notebook kernel's initialized, tell it to clear the token in 
                // the ipython kernel using special handler
                if (IPython.notebook) {
//                    $.removeCookie( 'kbase_session');
                    var cmd = "biokbase.narrative.magics.clear_token()";
                    IPython.notebook.kernel.execute( cmd );
                }

                window.location.href = "http://kbase.us";
            },

            prior_login_callback: function(args) {
                $(".whiteout-pane").remove();

//                set_cookie();
                // Do actual login once the kernel is up - only an issue for prior_login
                $([IPython.events]).on('status_started.Kernel', set_token);
            },
        });

        $('#signin-button').css('padding', '0');  // Jim!

        if (loginWidget.token() === undefined) {
//            clear_cookie();
            // include hiding div.
            loginWidget.openDialog();
        }
    });

})( jQuery );