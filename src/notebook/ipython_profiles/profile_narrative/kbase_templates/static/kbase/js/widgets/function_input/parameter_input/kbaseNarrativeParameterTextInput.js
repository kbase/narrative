/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeParameterTextInput",
        parent: "kbaseNarrativeParameterInput",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            parsedParameterSpec: null
        },
        IGNORE_VERSION: true,

        // properties inherited from kbaseNarrativeParameterInput
        // $mainPanel:null,
        // spec:null,
        
        isUsingSelect2: false,
        enabled: true,
        isOutputName: false,
        validDataObjectList: null,
        //listLimit:20, // limit the number of dropdown items, not used...
        
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
            
            
            if (!allow_multiple) {
                // just one field, phew, this one should be easy    
                var d = spec.default_values;
                var defaultValue = (d[0] !== "" && d[0] !== undefined) ? d[0] + "'" : "";
                var form_id = spec.id;
                var $input=$('<input id="' + form_id + '" placeholder="' + defaultValue + '"' +
                        ' value="" type="text" style="width:100%"/>').addClass("form-control");
                
                if(spec.text_options) {
                    if (spec.text_options.valid_ws_types) {
                        if (spec.text_options.valid_ws_types.length>0) {
                            this.isUsingSelect2 = true;
                            $input =$('<input id="' + form_id + '" type="text" style="width:100%" />');
                            this.validDataObjectList = [{name:"genome2"},{name:"genome3"},{name:"genome4"},{name:"model1"},{name:"model2"}];
                            if (spec.text_options.is_output_name) {
                                this.isOutputName = true;
                            }
                        }
                    }
                }
                
                var $row = $('<div>').addClass("row kb-method-parameter-row")
                                .hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
                $row.append($('<div>').addClass("col-md-2").addClass("kb-method-parameter-name")
                                .append(spec.ui_name));
                $row.append($('<div>').addClass("col-md-4").addClass("kb-method-parameter-input")
                                .append($input));
                $row.append($('<div>').addClass("col-md-6").addClass("kb-method-parameter-hint")
                                .append(spec.short_hint));
                
                self.$mainPanel.append($row);
                
                /* for some reason, we need to actually have the input added to the main panel before this will work */
                if (this.isUsingSelect2) {
                    this.setupSelect2($input);
                }
                
                
            } else {
                // need to handle multiple fields- do something better!
            }
            
            
            /*var input_default = (p.default_values[0] !== "" && p.default_values[0] !== undefined) ?
                                    " placeholder='" + p.default_values[0] + "'" : "";
                input = "<input class='form-control' style='width: 95%' name='" + p.id + "'" + input_default +
                        " value='' type='text'></input>";

                var cellStyle = "border:none; vertical-align:middle;";
                inputDiv += "<tr style='" + cellStyle + "'>" + 
                                "<th style='" + cellStyle + " font-family: 'OxygenBold', sans-serif; font-weight: bold;>" + p.ui_name + "</th>" +
                                "<td style='" + cellStyle + " width: 40%;'>" + input + "</td>" +
                                "<td style='" + cellStyle + " color: #777;'>" + p.short_hint + "</td>" +
                            "</tr>";
            
            */
            
        },
        
        
        refresh: function() {
            var self = this;
            
            var needToMakeCall = false;
            var lookupTypes = [];
            var foundTypes = {};
            
            // could also check if we are using select2... that for now is only used for ws types
            if(self.spec.text_options) {
                if (self.spec.text_options.valid_ws_types) {
                    if(self.spec.text_options.valid_ws_types.length>0) {
                        var types = self.spec.text_options.valid_ws_types;
                        for(var i=0; i<types.length; i++) {
                            if (!foundTypes.hasOwnProperty(types[i])) {
                                lookupTypes.push(types[i]);
                                foundTypes[types[i]] = 1;
                                needToMakeCall = true;
                            }
                        }
                    }
                }
            }
            if (!needToMakeCall) { return; }
            
            // update the validDataObjectList 
            this.trigger('dataLoadedQuery.Narrative', [lookupTypes, this.IGNORE_VERSION, $.proxy(
                function(objects) {
                    // we know from each parameter what each input type is.
                    // we also know how many of each type there is.
                    // so, iterate over all parameters and fulfill cases as below.
                    // extract the object infos
                    var allObjInfo = [];
                    for (var typeName in objects) {
                        if (objects.hasOwnProperty(typeName)) {
                            for(var i=0; i<objects[typeName].length; i++) {
                                allObjInfo.push(objects[typeName][i]);
                            }
                        }
                    }
                    // sort them by date, then by name
                    allObjInfo.sort(function(a, b) {
                            if (a[3] > b[3]) return -1; // sort by date
                            if (a[3] < b[3]) return 1;  // sort by date
                            if (a[1] < b[1]) return -1; // sort by name
                            if (a[1] > b[1]) return 1;  // sort by name
                            return 0;
                        });
                    /* object info
                    0: id
                    1: name
                    2: type
                    3: timestamp
                    4: version
                    5: owner
                    6: ws id
                    7: ws name
                    8: checksum
                    9: size
                    10: metadata*/
                    
                    // populate the valid data object list
                    self.validDataObjectList = [];
                    for(var i=0; i<allObjInfo.length; i++) {
                        self.validDataObjectList.push({name:allObjInfo[i][1], info:allObjInfo[i]});
                    }
                    
                    // refresh the input options
                    if(this.isUsingSelect2) {
                        this.$elem.find("#"+this.spec.id).trigger("change");
                    }
                },
                this
            )]);
        },

        /* private method */
        setupSelect2: function ($input) {
            var self = this;
            $input.select2({
                matcher: self.select2Matcher,
                formatNoMatches: "No matching data found.",
                
                query: function (query) {
                    var data = {results:[]};
                
                    // populate the names from our valid data object list
                    if (self.validDataObjectList) {
                        for(var i=0; i<self.validDataObjectList.length; i++){
                            var d = self.validDataObjectList[i];
                            if (query.term.trim()!=="") {
                                if(self.select2Matcher(query.term,d.name)) {
                                    data.results.push({id:d.name, text:d.name});
                                }
                            } else {
                                data.results.push({id:d.name, text:d.name});
                            }
                        }
                    }
                    
                    //always allow the name they give if there was no match...
                    if (data.results.length===0) {
                        if (query.term.trim()!=="") {
                            if(this.isOutputName) {
                                data.results.push({id:query.term, text:query.term});
                            } else {
                                data.results.push({id:query.term, text:query.term+" (not found)"});
                            }
                        }
                    }
                    
                    query.callback(data);
                }
            });
        },
        /* private method */
        select2Matcher: function(term,text) {
            return text.toUpperCase().indexOf(term.toUpperCase())>=0;
        },
        
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
        disableParameterEditing: function() {
            // disable the input
            this.enabled = true;
            if(this.isUsingSelect2) {
                this.$elem.find("#"+this.spec.id).select2('disable',true);
            } else {
                this.$elem.find("#"+this.spec.id).prop('disabled',true);
            }
            // stylize the row div
        },
        
        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function() {
            // enable the input
            this.enabled = false;
            if(this.isUsingSelect2) {
                this.$elem.find("#"+this.spec.id).select2('disable',false);
            } else {
                this.$elem.find("#"+this.spec.id).prop('disabled', false);
            }
        },
        
        addInputListener: function(onChangeFunc) {
            if(this.isUsingSelect2) {
                this.$elem.find("#"+this.spec.id).on("change",onChangeFunc);
            } else {
                this.$elem.find("#"+this.spec.id).on("input",onChangeFunc);
            }
        },
        
        /*
         * An App (or a narrative that needs to auto populate certain fields) needs to set
         * specific parameter values based on the App spec, so we need a way to do this.
         */
        setParameterValue: function(value) {
            
            // todo: handle case where this is a multiple, we need to check if value array matches number of elements,
            // and if not we must do something special   ...
            if(this.isUsingSelect2) {
                if (this.enabled) {
                    this.$elem.find("#"+this.spec.id).select2("data",{id:value, text:value});
                } else {
                    this.$elem.find("#"+this.spec.id).select2('disable',false);
                    this.$elem.find("#"+this.spec.id).select2("data",{id:value, text:value});
                    this.$elem.find("#"+this.spec.id).select2('disable',true);
                    
                }
            } else {
                this.$elem.find("#"+this.spec.id).val(value);
            }
        },
        
        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.
         */
        getParameterValue: function() {
            var value = this.$elem.find("#"+this.spec.id).val();
            return value;
        },
        
        
    });

})( jQuery );