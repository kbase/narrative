define([
    'jquery',
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'bluebird',
    'bootstrap',
    'plotly',
    'narrativeConfig',
    'kbase-generic-client-api',
    'kbase-client-api'
], function(
    $,
    KBWidget,
    KBaseAuthenticatedWidget,
    Promise,
    Bootstrap,
    Plotly,
    Config,
    GenericClient
) {
    'use strict';
    return KBWidget ({
        name: 'kbaseBinnedContigs',
        parent: KBaseAuthenticatedWidget,
        options: {
            obj_ref: null,
        },
        token: null,

        init: function(options) {
            this._super(options);
            return this;
        },

        render: function() {
            // set up clients
            this.setUpClients();
            // set up structure
            this.renderStructure();
            // --get data-- (will be updated with various client calls)
            this.getData();
            // render data
            this.renderData();
        },

        setUpClients: function() {
            this.genericClient = new GenericClient(Config.url('service_wizard'), this.token, null, null);
            this.wsClient = new Workspace(Config.url('workspace'), this.token);
        },

        renderStructure: function() {
            this.$elem.append('I wanna view some binned contigs!');
        },

        renderData: function() {

        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
        }
    });
});
