/*

*/

(function( $, undefined ) {


    $.kbWidget("kbaseAuthenticatedWidget", 'kbaseWidget', {
        version: "1.0.0",
        options: {

        },

        init: function(options) {

            this._super(options);

            if (options.$loginbox) {
                this.$loginbox = options.$loginbox;
            }
            else {
                throw "Cannot create authenticated widget w/o login box!";
            }

            return this;

        },

        sessionId : function() {
            return this.$loginbox.sessionId();
        },

    });

}( jQuery ) );
