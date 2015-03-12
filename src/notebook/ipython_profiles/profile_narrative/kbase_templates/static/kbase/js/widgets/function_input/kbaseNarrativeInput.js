/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

define(['jquery', 'kbwidget', 'kbaseAuthenticatedWidget'], function( $ ) {
    $.KBWidget({
        name: "kbaseNarrativeInput",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            method: null,
        },
        IGNORE_VERSION: true,

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

        refresh: function() {

        },

        /*  NEW METHODS TO HANDLE NEW APP BEHAVIOR AND METHOD/APP SPECS */
        
        
        /*
         * This is called when this method is run to allow you to check if the parameters
         * that the user has entered is correct.  You need to return an object that indicates
         * if the input is valid, or if not, if there are any error messages.  When this is
         * called, you should visually indicate which parameters are invalid by marking them
         * red (see kbaseNarrativeMethodInput for default styles).
         */
        isValid: function() {
           return { isValid: true, errormssgs: [] }; 
        },
        
        /*
         * Necessary for Apps to disable editing parameters that are automatically filled
         * from a previous step.  Returns nothing.
         */
        disableParameterEditing: function(parameterId) {
            
        },
        
        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function(parameterId) {
            
        },
        
        /*
         * An App (or a narrative that needs to auto populate certain fields) needs to set
         * specific parameter values based on the App spec, so we need a way to do this.
         */
        setParameterValue: function(parameterId, value) {
            
        },
        
        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.  If the parameter is not valid.
         */
        getParameterValue: function(parameterId) {
            return null;
        },
        
        
        /*
         * When we actually run the method, we need all the parameter inputs.  This should return
         * an array of objects, where each object has 'id' and 'value' defined giving the parameter ID
         * and parameter value.
         */
        getAllParameterValues: function() {
            /*  should be in the form:
             *      [
             *          { id: 'param1', value: 'MyGenome' },
             *          ...
             *      ]
             *  
             */
            return [ ];
        },
        
        
        lockInputs: function() {
            
        },
        unlockInputs: function() {
            
        },
        
        /*
         * This function is invoked every time we run app or method. This is the difference between it
         * and getAllParameterValues/getParameterValue which could be invoked many times before running 
         * (e.g. when widget is rendered). 
         */
        prepareDataBeforeRun: function() {
        	
        }
        
    });
});