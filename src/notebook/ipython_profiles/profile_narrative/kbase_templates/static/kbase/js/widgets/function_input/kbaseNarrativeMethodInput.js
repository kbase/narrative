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

        // list of objects in the form {id:"param_id", widget: ... } to ensure we preserve
        // parameter ordering
        parameters: null,
        // maps parameter id to widget for fast lookup of widget
        parameterIdLookup : {},
        
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
            this.parameterIdLookup = {};
            var hasAdvancedOption = false;
            for (var i=0; i<params.length; i++) {
                var paramSpec = params[i];
                var $stepDiv = $('<div>');
                
                // check what kind of parameter here.
                if (paramSpec.field_type === "text") {
                    var textInputWidget = $stepDiv["kbaseNarrativeParameterTextInput"]({loadingImage: this.options.loadingImage, parsedParameterSpec: params[i]});
                    this.parameters.push({id:paramSpec.id, widget:textInputWidget});
                    this.parameterIdLookup[paramSpec.id] = textInputWidget;
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
        
        
        /*
         * This is called when this method is run to allow you to check if the parameters
         * that the user has entered is correct.  You need to return an object that indicates
         * if the input is valid, or if not, if there are any error messages.  When this is
         * called, you should visually indicate which parameters are invalid by marking them
         * red (see kbaseNarrativeMethodInput for default styles).
         */
        isValid: function() {
            var isValidRet = { isValid:true, errormssgs: [] };
            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    var parameterStatus = this.parameters[i].widget.isValid();
                    if (!parameterStatus.isValid) {
                        isValidRet.isValid = false;
                        for(var e = 0; e<parameterStatus.errormssgs.length; e++) {
                            isValidRet.errormssgs.push(parameterStatus.errormssgs[e]);
                        }
                    }
                }
            }
            return isValidRet; 
        },
        
        /*
         * Necessary for Apps to disable editing parameters that are automatically filled
         * from a previous step.  Returns nothing.
         */
        disableParameterEditing: function(parameterId) {
            if (this.parameterIdLookup) {
                var widget = this.parameterIdLookup[parameterId];
                if (widget) {
                    if (typeof widget.disableParameterEditing === 'function') {
                        widget.disableParameterEditing();
                    }
                }
            }
        },
        
        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function(parameterId) {
            if (this.parameterIdLookup) {
                var widget = this.parameterIdLookup[parameterId];
                if (widget) {
                    if (typeof widget.enableParameterEditing === 'function') {
                        widget.enableParameterEditing();
                    }
                }
            }
        },
        
        /*
         * An App (or a narrative that needs to auto populate certain fields) needs to set
         * specific parameter values based on the App spec, so we need a way to do this.
         */
        setParameterValue: function(parameterId, value) {
            if (this.parameterIdLookup) {
                var widget = this.parameterIdLookup[parameterId];
                if (widget) {
                    if (typeof widget.setParameterValue(value) === 'function') {
                        widget.setParameterValue(value);
                    }
                }
            }
        },
        
        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.  If the parameter is not valid.
         */
        getParameterValue: function(parameterId) {
            var value = null;
            if (this.parameterIdLookup) {
                var widget = this.parameterIdLookup[parameterId];
                if (widget) {
                    value = widget.getParameterValue();
                }
            }
            return value;
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
            var values = [];
            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    var value = this.parameters[i].widget.getParameterValue();
                    values.push( { id:this.parameters[i].id, value:value } );
                }
            }
            return values;
        },
        
        
        lockInputs: function() {
            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    this.parameters[i].widget.lockInputs();
                }
            }
        },
        unlockInputs: function() {
            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    this.parameters[i].widget.unlockInputs();
                }
            }
        },
        
        
        
        /**
         * allows an app or other higher-level function to attach a listener on a a parameter
         * so that when it changes, something else can be updated.
         */
        addInputListener: function(parameterId, onChangeFunc) {
            if (this.parameterIdLookup) {
                var widget = this.parameterIdLookup[parameterId];
                if (widget) {
                    value = widget.addInputListener(onChangeFunc);
                }
            }
        },
        
        
        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }
    });

})( jQuery );