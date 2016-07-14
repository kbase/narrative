define(['jquery', 'kbwidget'],
function($) {
    $.KBWidget({
        name: 'kbaseAuthenticatedWidget',
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
                function(e, auth) {
                    if (this.loggedInCallback) {
                        this.loggedInCallback(e, {token: ""});
                    }
                }.bind(this)
            );

            $(document).on(
                'loggedOut.kbase',
                function(e) {
                    if (this.loggedOutCallback) {
                        this.loggedOutCallback(e);
                    }
                }.bind(this)
            );

            this.callAfterInit(function() {
                if (this.loggedInQueryCallback) {
                    this.loggedInQueryCallback({token: ""});
                }
            }.bind(this));

            return this;

        },

        loggedInQueryCallback : function(args) {
            if (this.loggedInCallback) {
                this.loggedInCallback(undefined,args);
            }
        },

    })
});
