/*

*/

(function( $, undefined ) {


    $.kbWidget("kbaseAuthenticatedWidget", 'kbaseWidget', {
        version: "1.0.0",
        _accessors : [
            {name : 'auth', setter: 'setAuth'},
            'sessionId',
            'authToken',
            'user_id',
            'loggedInCallback',
            'loggedOutCallback',
            'loggedInQueryCallback'
        ],
        options: {
            auth : undefined
        },

        init: function(options) {

            this._super(options);

            $(document).on(
                'loggedIn.kbase',
                $.proxy(function (e, auth) {
                    this.setAuth(auth);
                    if (this.loggedInCallback) {
                        this.loggedInCallback(e, auth);
                    }
                }, this)
            );

            $(document).on(
                'loggedOut.kbase',
                $.proxy(function (e) {
                    this.setAuth(undefined);
                    if (this.loggedOutCallback) {
                        this.loggedOutCallback(e);
                    }
                }, this)
            );

            $(document).trigger(
                'loggedInQuery',
                $.proxy(function (auth) {
                    this.setAuth(auth);

                    if (auth.kbase_sessionid) {
                        this.callAfterInit(
                            $.proxy(function() {
                                if (this.loggedInQueryCallback) {
                                    this.loggedInQueryCallback(auth)
                                }
                            }, this)
                        );
                    }
                }, this)
            );

            return this;

        },

        setAuth : function (newAuth) {
            this.setValueForKey('auth', newAuth);
            if (newAuth == undefined) {
                newAuth = {};
            }
            this.sessionId(newAuth.kbase_sessionid);
            this.authToken(newAuth.token);
            this.user_id(newAuth.user_id);
        },

        loggedInQueryCallback : function(args) {
            if (this.loggedInCallback) {
                this.loggedInCallback(undefined,args);
            }
        },

    });

}( jQuery ) );
