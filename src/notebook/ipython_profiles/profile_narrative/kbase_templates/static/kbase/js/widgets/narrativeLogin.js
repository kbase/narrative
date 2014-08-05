/**
 * Uses the user's login information to initialize the IPython environment.
 * This should be one of the very first functions to be run on the page, as it sets up
 * the login widget, and wires the environment together.
 * @author Bill Riehl wjriehl@lbl.gov
 */

(function( $, undefined ) {

    $(function() {
        var escapeParamString = function(str) {
            return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
        };

        /* set the auth token by calling the kernel execute method on a function in
         * the magics module
         */
        var setEnvironment = function () {

            // Inline function that does a kernel call and sets callbacks for each event.
            var doKernelCall = function(cmd) {

                // Very simple callback function that dumps its message to console.
                // This only gets run at page-reload, and is good for checking errors.
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

            /**
             * Formats a command that initializes the IPython kernel environment using
             * KBase and Narrative information. Specifically, this puts the Narrative name,
             * user token, and workspace name in the environment.
             */
            var initKernelEnvCommand = function(token) {
                var cmd = "import os";

                if (IPython.notebook.metadata && IPython.notebook.metadata.name) {
                    cmd += "\nos.environ['KB_NARRATIVE'] = '" + escapeParamString(IPython.notebook.metadata.name) + "'"
                }

                var wsName = "Unknown";
                if (IPython.notebook.metadata && IPython.notebook.metadata.ws_name)
                    wsName = IPython.notebook.metadata.ws_name;

                cmd += "\nos.environ['KB_WORKSPACE_ID'] = '" + escapeParamString(wsName) + "'" +
                       "\nos.environ['KB_AUTH_TOKEN'] = '" + token + "'";

                return cmd;
            }

            /**
             * Formats a command that *only* registers a user auth token with the back
             * end. This is temporarily a separate kernel call, as it makes a call to
             * Globus Online. So, if that call fails, the environment will still be set up.
             */
            var registerLoginCommand = function(token) {
                var token = $("#signin-button").kbaseLogin('session', 'token');

                // importing things line by line will trap any intermediate errors.
                // especially with the set_token() command
                var cmd = "\nimport biokbase" +
                          "\nimport biokbase.narrative" +
                          "\nimport biokbase.narrative.magics" +
                          "\nbiokbase.narrative.magics.set_token('" + token + "')";

                return cmd;
            };

            /**
             * Runs the initialization steps.
             */
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

        /**
         * Initialize the login widget and bind login/logout callbacks
         */
        var loginWidget = $("#signin-button").kbaseLogin({ 
            /* If the notebook kernel's initialized, tell it to set the token.
             * This really only gets called when the user does a login on the Narrative page.
             * And since the user needs to be logged in already to get to the Narrative (in production),
             * This shouldn't get called, pretty much ever.
             * So having it fail if no IPython.notebook is present is okay here.
             */
            login_callback: function(args) {
                if (IPython && IPython.notebook) {
                    setEnvironment();
                } else {
                    console.error("IPython.notebook not set, cannot set token on backend");
                }
            },

            /* If the notebook is present, tell it to clear the token and environment vars,
             * Then redirect to the root page.
             */
            logout_callback: function(args) {
                if (IPython && IPython.notebook) {
                    var cmd = "biokbase.narrative.magics.clear_token()" + 
                              "import os\n" +
                              "del os.environ['KB_AUTH_TOKEN']\n" + 
                              "del os.environ['KB_WORKSPACE_ID']";
                    IPython.notebook.kernel.execute( cmd );
                }
                window.location.href = "/";
            },

            /* This is the main path to starting up. Since the user should be coming in already logged
             * in, this will get invoked. It sets up a single-use event that sets up the environment
             * with KBase necessities once the Kernel itself is activated. It also waits 500ms
             * before doing so, due to some lag in processing (hopefully fixed in a later version
             * of IPython).
             */
            prior_login_callback: function(args) {
                // Do actual login once the kernel is up - only an issue for prior_login
                $([IPython.events]).one('status_started.Kernel', function() {
                    setTimeout( function() { setEnvironment(); }, 500 );
                });
            },
        });

        $('#signin-button').css('padding', '0');  // Jim!

        if (loginWidget.token() === undefined) {
            // include hiding div.
            loginWidget.openDialog();
        }
    });

})( jQuery );