/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeMethodInput",
        parent: "kbaseNarrativeInput",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
        },

        init: function(options) {
            this._super(options);

            this.render();
            this.refresh();
            return this;
        },

        // list of objects in the form {id:"param_id", widget: ... }
        parameters: null,
        
        /**
         * Builds the input div for a function cell, based on the given method object.
         * @param {Object} method - the method being constructed around.
         * @returns {String} an HTML string describing the available parameters for the cell.
         * @private
         */
        render: function() {
            // figure out all types from the method
            var method = this.options.method;
            var params = method.parameters;

            var $inputParameterContainer = $('<div>');
            var $optionsDiv = $('<div>');
            var $advancedOptionsDiv = $('<div>')
            
            this.parameters = [];
            var hasAdvancedOption = false;
            for (var i=0; i<params.length; i++) {
                var paramSpec = params[i];
                var $stepDiv = $('<div>');
                
                // check what kind of parameter here.
                if (paramSpec.field_type === "text") {
                    var textInputWidget = $stepDiv["kbaseNarrativeParameterTextInput"]({loadingImage: this.options.loadingImage, parsedParameterSpec: params[i]});
                    this.parameters.push({id:paramSpec.id, widget:textInputWidget});
                } else {
                    // this is what we should do:  this.getErrorDiv()
                    $stepDiv.append('<span class="label label-danger">Parameter '+paramSpec.id+
                                    ' not displaying properly, invalid parameter type: "'+paramSpec.field_type+'"</span>');
                }
                
                // If it is an advanced option, then we must place it in the correct div
                var isAdvanced = false;
                if (paramSpec.advanced) {
                    if (paramSpec.advanced === true || paramSpec.advanced === 1) {
                        isAdvanced = true;
                    }
                }
                if (isAdvanced) {
                    $advancedOptionsDiv.append($stepDiv);
                    hasAdvancedOption = true;
                } else {
                    $optionsDiv.append($stepDiv);
                }
            }
            $inputParameterContainer.append($optionsDiv);
            
            var $advancedOptionsControllerRow = $("<div>").addClass("row").css({"margin":"5px"});
            if (hasAdvancedOption) {
                $advancedOptionsControllerRow.append($("<div>").addClass("col-md-12")
                                                     .append("<center><b><i>advanced options</i></b></center>"));
                $inputParameterContainer.append($advancedOptionsControllerRow);
                $inputParameterContainer.append($advancedOptionsDiv);
            } else {
                $advancedOptionsControllerRow.append($("<div>").addClass("col-md-12")
                                                     .append("<center><b><i>no advanced options</i></b></center>"));
                $inputParameterContainer.append($advancedOptionsControllerRow);
            }
            
            this.$elem.append($inputParameterContainer);
            
        },

        /**
         *OLD STYLE: we keep this for compatibility, but you should use new get parameter values!!!
         * Returns a list of parameters in the order in which the given method
         * requires them.
         * @return {Array} an array of strings - one for each parameter
         * @public
         */
        getParameters: function() {
            var paramList = [];
            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    paramList.push(this.parameters[i].widget.getParameterValue());
                }
            }
            return paramList;
        },

        /**
         * Returns an object representing the state of this widget.
         * In this particular case, it is a list of key-value pairs, like this:
         * { 
         *   'param0' : 'parameter value',
         *   'param1' : 'parameter value'
         * }
         * with one key/value for each parameter in the defined method.
         */
        getState: function() {
            var state = {};

            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    var id = this.parameters[i].id;
                    state[id] = this.parameters[i].widget.getState();
                }
            }
            
            return state;
        },

        /**
         * Adjusts the current set of parameters based on the given state.
         * Doesn't really do a whole lot of type checking yet, but it's assumed that
         * a state will be loaded from an object generated by getState.
         */
        loadState: function(state) {
            if (!state)
                return;

            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    var id = this.parameters[i].id;
                    if (state.hasOwnProperty(id)) {
                        this.parameters[i].widget.loadState(state[id]);
                    }
                }
            }
        },

        /**
         * Refreshes the input fields for this widget. I.e. if any of them reference workspace
         * information, those fields get refreshed without altering any other inputs.
         */
        refresh: function() {
            
            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    this.parameters[i].widget.refresh();
                }
            }
            

        },
        
        
        /* input types */
        
        
        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }
    });

})( jQuery );