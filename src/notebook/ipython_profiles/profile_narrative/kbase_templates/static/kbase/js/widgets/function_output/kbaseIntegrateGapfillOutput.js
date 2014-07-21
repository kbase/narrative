
(function($, undefined) {
    $.KBWidget({
        
        name: 'kbaseIntegrateGapfillOutput',

        /*
         * Extending kbaseAuthenticatedWidget lets you use auth tokens
         * semi-automatically, assuming the page this is used in fires
         * the loggedIn.kbase, loggedOut.kbase, and loggedInQuery events.
         * These are usually fired by the kbaseLogin widget.
         *
         * this.user_id() = the logged in user id
         * this.authToken() = the current authentication token
         */
        parent: "kbaseAuthenticatedWidget",
        version: '1.0.0',
        options: 
            {
            "workspaceName":"",
            "originalModel":"",
            "originalModelRef":0,
            "startingNumRxns":0,
            "newModel":"",
            "newModelRef":0,
            "endingNumRxns":0
            },
        

        wsUrl: "https://kbase.us/services/workspace",
        loadingImage: "static/kbase/images/ajax-loader.gif",
        
        
        init: function(options) {
            this._super(options);
            return this.render(options);
        },

        render: function(options) {
            var self = this;
            var container = this.$elem;
            
            var n_rxns_added = parseInt(options.endingNumRxns) - parseInt(options.startingNumRxns);
            if (n_rxns_added==0) {
                container.append("Integration completed successfully, but no reactions were integrated.<br><br>");
                container.append("This may result if the gapfill solution reactions were already integrated ");
                container.append("into the input <br> model ("+options.originalModelRef+"), or if the solution ID you provided ");
                container.append("could not be found. <br><br>");
            } else {
                container.append("<b>Success!</b><br><br><i>"
                                 +n_rxns_added+" reactions integrated into model <b>"+
                                 options.newModel+"</b> ("+options.newModelRef+")<br><br>")
            }
            
            return this;
        },
    });
})(jQuery);