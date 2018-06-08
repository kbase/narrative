define([
    'jquery',
    'kbwidget',
    'kbaseAuthenticatedWidget'
], function (
    $,
    KBWidget,
    kbaseAuthenticatedWidget
) {
    'use strict';
    return KBWidget({
        name: 'kbaseDefaultObjectView',
        parent: kbaseAuthenticatedWidget,
        options: {
            upas: []
        },

        init: function(options) {
            this._super(options);
        },

        // expects a list of upas.
        render: function(upas) {
            if (!this.token) {
                // some generic not-logged-in message
                this.$elem.append('not logged in');
            }
            else if (!upas) {
                // some generic placeholder
                this.$elem.append('no objects to display');
            }
            this.$elem.append('displaying objects');
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render(this.options.upas);
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        },

    });
});