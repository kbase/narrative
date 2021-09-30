define(['jquery', 'kbwidget'], ($) => {
    $.KBWidget({
        name: 'kbaseAuthenticatedWidget',
        _accessors: [
            { name: 'auth', setter: 'setAuth' },
            'sessionId',
            'authToken',
            'user_id',
            'loggedInCallback',
            'loggedOutCallback',
            'loggedInQueryCallback',
        ],
        options: {
            auth: undefined,
        },

        init: function (options) {
            this._super(options);
            $(document).on('loggedIn.kbase', (e, auth) => {
                if (this.loggedInCallback) {
                    this.loggedInCallback(e, { token: '' });
                }
            });

            $(document).on('loggedOut.kbase', (e) => {
                if (this.loggedOutCallback) {
                    this.loggedOutCallback(e);
                }
            });

            this.callAfterInit(() => {
                if (this.loggedInQueryCallback) {
                    this.loggedInQueryCallback({ token: '' });
                }
            });

            return this;
        },

        loggedInQueryCallback: function (args) {
            if (this.loggedInCallback) {
                this.loggedInCallback(undefined, args);
            }
        },
    });
});
