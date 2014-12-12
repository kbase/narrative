/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeParameterInput",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            parsedParameterSpec: null
        },
        IGNORE_VERSION: true,

        $mainPanel:null,
        spec:null,
        
        init: function(options) {
            this._super(options);

            this.spec = options.parsedParameterSpec;
            
            this.$mainPanel = $("<div>");
            this.$elem.append(this.$mainPanel);
            this.render();
            
            return this;
        },
        
        render: function() {
            this.$mainPanel.append("A parameter is not being displayed correctly.");
            console.error("Incorrect Parameter Spec:");
            console.error(this.spec);
        },
        
        getState: function() {
            return this.getParameterValue();
        },

        loadState: function(state) {
            if (!state)
                return;
            this.setParameterValue(state);
        },
        
        refresh: function() {
        
        },

        /*
         * This is called when this method is run to allow you to check if the parameters
         * that the user has entered is correct.  You need to return an object that indicates
         * if the input is valid, or if not, if there are any error messages.  When this is
         * called, you should visually indicate which parameters are invalid by marking them
         * red (see kbaseNarrativeMethodInput for default styles).
         */
        isValid: function() {
           return { isValid: false, errormssgs: ["A parameter is not specified properly."] }; 
        },
        
        /*
         * Necessary for Apps to disable editing parameters that are automatically filled
         * from a previous step.  Returns nothing.
         */
        disableParameterEditing: function() {
            
        },
        
        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function() {
            
        },
        
        /*
         * An App (or a narrative that needs to auto populate certain fields) needs to set
         * specific parameter values based on the App spec, so we need a way to do this.
         */
        setParameterValue: function(value) {
            
        },
        
        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.  If the parameter is not valid.
         */
        getParameterValue: function() {
            return "";
        },
        
        /*
         * This function is invoked every time we run app or method. This is the difference between it
         * and getParameterValue() which could be invoked many times before running (e.g. when widget 
         * is rendered). 
         */
        prepareValueBeforeRun: function(methodSpec) {
        	
        }
        
    });

})( jQuery );