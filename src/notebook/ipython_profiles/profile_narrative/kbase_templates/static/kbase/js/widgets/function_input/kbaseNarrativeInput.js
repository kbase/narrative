/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeInput", 
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            method: null,
        },

        init: function(options) {
            this._super(options);

            // expects the method as a JSON string
            if (this.options.method)
                this.options.method = JSON.parse(this.options.method);
            
            return this;
        },

        getParameters: function() {
            return [ "returning parameter list" ];
        },

        getState: function() {
            return {};
        },

        loadState: function(state) {
            if (!state)
                return;
        },

    });

})( jQuery );