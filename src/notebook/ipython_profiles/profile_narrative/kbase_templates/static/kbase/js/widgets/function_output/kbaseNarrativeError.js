/**
 * A simple widget intended to format and display errors that come from
 * the narrative kernel (these are typically back-end errors that
 * occur while running the function). The cause of these errors will
 * probably be either errors with user inputs, or errors while 
 * communicating with the KBase API.
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
(function($, undefined) {
    $.KBWidget({
        /* 
         * (required) Your widget should be named in CamelCase.
         */
        name: 'kbaseNarrativeError',

        /*
         * Extending kbaseAuthenticatedWidget lets you use auth tokens
         * semi-automatically, assuming the page this is used in fires
         * the loggedIn.kbase, loggedOut.kbase, and loggedInQuery events.
         * These are usually fired by the kbaseLogin widget.
         *
         * this.user_id() = the logged in user id
         * this.authToken() = the current authentication token
         */
        parent: 'kbaseWidget',

        /*
         * (optional) Widgets should be semantically versioned.
         * See http://semver.org
         */
        version: '1.0.0',

        /*
         * (optional) Widgets are implied to include an options structure.
         * It's useful to put default values here.
         */
        options: {
            error: {
                'msg' : 'An error occurred',
                'method_name' : 'No method',
                'type' : 'Error',
                'severity' : 'Catastrophic'
            },
        },

        /**
         * (required) This is the only required function for a KBase Widget.
         * @param {object} options - a structure containing the set of 
         * options to be passed to this widget.
         * @private
         */
        init: function(options) {
            /*
             * This should be the first line of your init function.
             * It registers the new widget, overriding existing options.
             *
             * The members of the options structure will become members of 
             * this.options, overriding any existing members.
             */
            this._super(options);

            /*
             * It is required to return this.
             */
            return this.render();
        },

        render: function() {
            var printMsg = this.options.error.msg;

            // for now, just truncate the error to 300 characters.
            if (printMsg.length > 300)
                printMsg = printMsg.substring(0, 300) + "...[error truncated]";

            this.$elem.append('Sorry, an error occurred<br>')
                      .append('In method: ' + this.options.error.method_name + '<br>')
                      .append('of type: ' + this.options.error.type + '<br>')
                      .append('severity: ' + this.options.error.severity + '<br>')
                      .append('Error Message: ')
                      .append($('<pre>').append(printMsg));
            return this;
        },
    });
})(jQuery);