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
 */

(function( $, undefined ) {

    $(function() {
        // set the auth token by calling the kernel execute method on a function in
        // the magics module

        var setToken = function () {
            var doKernelCall = function(cmd) {

                var kernelCallback = function(type, content, etc) {
                    console.log('KERNEL CALLBACK : "' + type + '"');
                    console.log(content);
                    if (etc)
                        console.log(etc);
                };

                var callbacks = {
                    'execute_reply' : function(content) { kernelCallback('execute_reply', content); },
                    'output' : function(msgType, content) { kernelCallback('output', msgType, content); },
                    'clear_output' : function(content) { kernelCallback('clear_output', content); },
                    'set_next_input' : function(text) { kernelCallback('set_next_input', text); },
                    'input_request' : function(content) { kernelCallback('input_request', content); },
                };

                IPython.notebook.kernel.execute( cmd, callbacks, {silent: true} );

            };

            var initKernelEnvCommand = function(token) {
                var cmd = "import os";

                if (IPython.notebook.metadata && IPython.notebook.metadata.name) {
                    cmd += "\nos.environ['KB_NARRATIVE'] = '" +
                           IPython.notebook.metadata.name + "'"
                }

                var wsName = "Unknown";
                if (IPython.notebook.metadata && IPython.notebook.metadata.ws_name)
                    wsName = IPython.notebook.metadata.ws_name;

                cmd += "\nos.environ['KB_WORKSPACE_ID'] = '" + wsName + "'" +
                       "\nfrom biokbase.narrative.services import *" +  // timing is everything!
                       "\nos.environ['KB_AUTH_TOKEN'] = '" + token + "'";

                return cmd;
            }

            var registerLoginCommand = function(token) {
                var token = $("#signin-button").kbaseLogin('session', 'token');

                var cmd = "\nimport biokbase" +
                          "\nimport biokbase.narrative" +
                          "\nimport biokbase.narrative.magics" +   // slap on that duct tape!
                          "\nbiokbase.narrative.magics.set_token('" + token + "')";

                return cmd;
            };

            var runInitSteps = function(token) {
                doKernelCall(initKernelEnvCommand(token));
                doKernelCall(registerLoginCommand(token));
            };

            // grab the token from the handler, since it isn't passed in with args
            var token = $("#signin-button").kbaseLogin('session', 'token');
            window.kb = new KBCacheClient(token);

            // make sure the shell_channel is ready, otherwise sleep for .5 sec
            // and then try it. We use the ['kernel'] attribute deref in case
            // because at parse time the kernel attribute may not be ready
            if (IPython.notebook.kernel.shell_channel.readyState == 1) {
                runInitSteps(token);
            } else {
                console.log("Pausing for 500 ms before passing credentials to kernel");
                setTimeout( function() { runInitSteps(token); }, 500 );
            }
        };

        var loginWidget = $("#signin-button").kbaseLogin({ 
            login_callback: function(args) {
                // If the notebook kernel's initialized, tell it to set the token.
                if (IPython && IPython.notebook) {
                    setToken();
                } else {
                    console.log("IPython.notebook not set, cannot set token on backend");
                }
            },

            logout_callback: function(args) {
                // If the notebook kernel's initialized, tell it to clear the token in 
                // the ipython kernel using special handler
                if (IPython && IPython.notebook) {
                    var cmd = "biokbase.narrative.magics.clear_token()" + 
                              "import os\n" +
                              "del os.environ['KB_AUTH_TOKEN']\n" + 
                              "del os.environ['KB_WORKSPACE_ID']";
                    IPython.notebook.kernel.execute( cmd );
                }

                window.location.href = "/";
            },

            prior_login_callback: function(args) {
                // Do actual login once the kernel is up - only an issue for prior_login
                $([IPython.events]).one('status_started.Kernel', setToken);
            },
        });

        $('#signin-button').css('padding', '0');  // Jim!

        if (loginWidget.token() === undefined) {
            // include hiding div.
            loginWidget.openDialog();
        }
    });

})( jQuery );