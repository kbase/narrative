/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeParameterDropdownInput",
        parent: "kbaseNarrativeParameterInput",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            parsedParameterSpec: null,
            isInSidePanel: false
        },
        IGNORE_VERSION: true,

        // properties inherited from kbaseNarrativeParameterInput
        // $mainPanel:null,
        // spec:null,
        
        enabled: true,
        required: true,
        rowDivs: null,
        
        render: function() {
            var self = this;
            //console.log(this.spec);
            var spec = self.spec;
            
            // check if we need to allow multiple values
            var allow_multiple = false;
            if (spec.allow_multiple) {
                if (spec.allow_multiple===true || spec.allow_multiple===1) {
                    allow_multiple = true;
                }
            }
            
            self.rowDivs = [];
            if (!allow_multiple) {
                // just one field, phew, this one should be easy    
                var d = spec.default_values;
                self.required= true;
                
                var defaultValue = (d[0] !== "" && d[0] !== undefined) ? d[0] : "";
                var form_id = spec.id;
                var $dropdown= $('<select id="'+form_id+'">').css({width:"100%"})
                                .on("change",function() { self.isValid() });
                
                var foundOptions = false;
                /* HOW IT SHOULD BE!!! */
                  if(spec.dropdown_options) {
                    if (spec.dropdown_options.options) {
                        for (var k=0; k<spec.dropdown_options.options.length; k++) {
                            var opt = spec.dropdown_options.options[k];
                            if (opt.id && opt.ui_name) {
                                $dropdown.append($('<option value="'+opt.id+'">').append(opt.ui_name));
                                foundOptions = true;
                            } else if (opt.value && opt.display) {  // id was misnamed, should have been value
                                $dropdown.append($('<option value="'+opt.value+'">').append(opt.display));
                                foundOptions = true;
                            }
                        }
                    }
                }
                if(spec.dropdown_options) {
                    if (spec.dropdown_options.ids_to_options) {
                        $dropdown.empty();
                        for (var optId in spec.dropdown_options.ids_to_options) {
                            if(spec.dropdown_options.ids_to_options.hasOwnProperty(optId)){
                                var opt = spec.dropdown_options.ids_to_options[optId];
                                $dropdown.append($('<option value="'+optId+'">').append(opt));
                                foundOptions = true;
                            }
                        }
                    }
                }
                
                if (!foundOptions) {
                    $dropdown.append($('<option value="">').append("no options found in method spec"));
                }
                
                var $feedbackTip = $("<span>").removeClass();
                if (self.required) {
                    $feedbackTip.addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
                }
                
                // set the widths of the columns
                var nameColClass  = "col-md-2";
                var inputColClass = "col-md-5";
                var hintColClass  = "col-md-5";
                if (self.options.isInSidePanel) {
                    var inputColClass = "col-md-6";
                    var hintColClass  = "col-md-4";
                }
                
                var $row = $('<div>').addClass("row kb-method-parameter-row")
                                .hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
                var $nameCol = $('<div>').addClass(nameColClass).addClass("kb-method-parameter-name")
                                    .append(spec.ui_name);
                var $inputCol = $('<div>').addClass(inputColClass).addClass("kb-method-parameter-input")
                                .append($('<div>').css({"width":"100%","display":"inline-block"}).append($dropdown))
                                .append($('<div>').css({"display":"inline-block"}).append($feedbackTip));
                var $hintCol  = $('<div>').addClass(hintColClass).addClass("kb-method-parameter-hint")
                                .append(spec.short_hint);
                $row.append($nameCol).append($inputCol).append($hintCol);
                
                var $errorPanel = $('<div>').addClass("kb-method-parameter-error-mssg").hide();
                var $errorRow = $('<div>').addClass('row')
                                    .append($('<div>').addClass(nameColClass))
                                    .append($errorPanel.addClass(inputColClass));
                
                self.$mainPanel.append($row);
                self.$mainPanel.append($errorRow);
                self.rowDivs.push({$row:$row, $error:$errorPanel, $feedback:$feedbackTip});
                
                /* for some reason, we need to actually have the input added to the main panel before this will work */
                this.setupSelect2($dropdown,"",defaultValue);
                
                // for dropdowns, we always validate (because it adds the green check feedback)
                this.isValid();
                
            } else {
                // need to handle multiple fields- do something better!
                self.$mainPanel.append("<div>multiple dropdown fields not yet supported</div>");
            }
        },
        
        
        refresh: function() {
            // we don't allow types to be displayed, so we don't have to refresh
        },

        
        /* private method - note: if placeholder is empty, then users cannot cancel a selection*/
        setupSelect2: function ($input, placeholder, defaultValue) {
            var self = this;
            var noMatchesFoundStr = "No matching data found.";
            if (self.isOutputName) {
                noMatchesFoundStr = "Enter a name for the output data object.";
            }
            $input.select2({
                minimumResultsForSearch: -1,
                //placeholder:placeholder,
                //allowClear: true,
                formatSelection: function(object, container) {
                    var display = '<span class="kb-parameter-data-selection">'+object.text+'</span>';
                    return display;
                },
                //formatResult: function(object, container, query) {
                //    var display = "<b>"+object.text+"</b>";
                //    return display;
                //}
            });
            
            if (defaultValue) {
                $input.select2("val",defaultValue);
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
            var self = this;
            if (!self.enabled) {
                return { isValid: true, errormssgs:[]}; // do not validate if disabled
            }
            var p= self.getParameterValue();
            var errorDetected = false;
            var errorMessages = [];
            if(p instanceof Array) {
                // todo: handle this case when there are multiple fields
            } else {
                if (p) {
                    p = p.trim();
                    // if it is a required selection and is empty, keep the required icon around but we have an error
                    if (p==='' && self.required) {
                        self.rowDivs[0].$row.removeClass("kb-method-parameter-row-error");
                        self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
                        self.rowDivs[0].$feedback.show();
                        self.rowDivs[0].$error.hide();
                        errorDetected = true;
                        errorMessages.push("required field "+self.spec.ui_name+" missing.");
                    }
                    
                    // no error, so we hide the error if any, and show the "accepted" icon if it is not empty
                    if (!errorDetected) {
                        if (self.rowDivs[0]) {
                            self.rowDivs[0].$row.removeClass("kb-method-parameter-row-error");
                            self.rowDivs[0].$error.hide();
                            self.rowDivs[0].$feedback.removeClass();
                            if (p!=='') {
                                self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-accepted-glyph glyphicon glyphicon-ok');
                            }
                        }
                    }
                } else {
                    // something went wrong...  possibly no options set in the spec?
                }
            }
            return { isValid: !errorDetected, errormssgs:errorMessages};
        },
        
        /*
         * Necessary for Apps to disable editing parameters that are automatically filled
         * from a previous step.  Returns nothing.
         */
        disableParameterEditing: function() {
            // disable the input
            this.enabled = false;
            this.$elem.find("#"+this.spec.id).select2('disable',true);
            // stylize the row div
            if (this.rowDivs) {
                this.rowDivs[0].$feedback.removeClass();
            }
        },
        
        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function() {
            // enable the input
            this.enabled = true;
            this.$elem.find("#"+this.spec.id).select2('enable',true);
            this.isValid();
        },
        
        
        lockInputs: function() {
            if (this.enabled) {
                this.$elem.find("#"+this.spec.id).select2('disable',true);
            }
            // stylize the row div
            if (this.rowDivs) {
                this.rowDivs[0].$feedback.removeClass();
            }
        },
        unlockInputs: function() {
            if (this.enabled) {
                this.$elem.find("#"+this.spec.id).select2('enable',true);
            }
            this.isValid();
        },
        
        
        
        addInputListener: function(onChangeFunc) {
            this.$elem.find("#"+this.spec.id).on("change",onChangeFunc);
        },
        
        /*
         * An App (or a narrative that needs to auto populate certain fields) needs to set
         * specific parameter values based on the App spec, so we need a way to do this.
         */
        setParameterValue: function(value) {
            // todo: handle case where this is a multiple, we need to check if value array matches number of elements,
            // and if not we must do something special   ...
            if (this.enabled) {
                this.$elem.find("#"+this.spec.id).select2("val",value);
            } else {
                this.$elem.find("#"+this.spec.id).select2('disable',false);
                this.$elem.find("#"+this.spec.id).select2("val",value);
                this.$elem.find("#"+this.spec.id).select2('disable',true);
            }
            this.isValid();
        },
        
        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.
         */
        getParameterValue: function() {
            var value = this.$elem.find("#"+this.spec.id).val();
            return value;
        }
        
    });

})( jQuery );