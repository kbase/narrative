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
        required: true,
        validDataObjectList: null,
        //listLimit:20, // limit the number of dropdown items, not used...
        rowDivs: null,
        
        render: function() {
            var self = this;
            console.log(this.spec);
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
                var placeholder = '';
                self.required= true;
                if(spec.text_options) {
                    if(spec.text_options.placeholder) {
                        placeholder = spec.text_options.placeholder;
                        placeholder = placeholder.replace(/(\r\n|\n|\r)/gm,"");
                    }
                    if (spec.optional) {
                        self.required=false;
                    }
                }
                
                var defaultValue = (d[0] !== "" && d[0] !== undefined) ? d[0] : "";
                var form_id = spec.id;
                var $input= $('<input id="' + form_id + '" placeholder="' + placeholder + '"' +
                        ' value="'+defaultValue+'" type="text" style="width:100%"/>').addClass("form-control")
                        .on("input",function() { self.isValid() });
                
                if(spec.text_options) {
                    if (spec.text_options.valid_ws_types) {
                        if (spec.text_options.valid_ws_types.length>0) {
                            self.isUsingSelect2 = true;
                            $input =$('<input id="' + form_id + '" type="text" style="width:100%" />')
                                .on("change",function() { self.isValid() });
                            this.validDataObjectList = [];
                            if (spec.text_options.is_output_name) {
                                this.isOutputName = true;
                            }
                        }
                    }
                }
                
                var $feedbackTip = $("<span>").removeClass();
                if (self.required) {
                    $feedbackTip.addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
                }
                
                var $row = $('<div>').addClass("row kb-method-parameter-row")
                                .hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
                $row.append($('<div>').addClass("col-md-2").addClass("kb-method-parameter-name")
                                .append(spec.ui_name));
                $row.append($('<div>').addClass("col-md-4").addClass("kb-method-parameter-input")
                                .append($('<div>').css({"width":"100%","display":"inline-block"}).append($input))
                                .append($('<div>').css({"display":"inline-block"}).append($feedbackTip)));
                $row.append($('<div>').addClass("col-md-6").addClass("kb-method-parameter-hint")
                                .append(spec.short_hint));
                
                var $errorPanel = $('<div>').addClass("kb-method-parameter-error-mssg").hide();
                var $errorRow = $('<div>').addClass('row')
                                    .append($('<div>').addClass("col-md-2"))
                                    .append($errorPanel.addClass("col-md-4"));
                
                self.$mainPanel.append($row);
                self.$mainPanel.append($errorRow);
                self.rowDivs.push({$row:$row, $error:$errorPanel, $feedback:$feedbackTip});
                
                /* for some reason, we need to actually have the input added to the main panel before this will work */
                if (this.isUsingSelect2) {
                    if (placeholder === '') {
                        placeholder = ' '; // this allows us to cancel selections in select2
                    }
                    this.setupSelect2($input, placeholder);
                }
                
                
            } else {
                // need to handle multiple fields- do something better!
                self.$mainPanel.append("<div>multiple input fields not yet supported</div>");
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
                    if(self.isUsingSelect2) {
                        self.$elem.find("#"+this.spec.id).trigger("change");
                    }
                },
                this
            )]);
        },

        
        /* private method - note: if placeholder is empty, then users cannot cancel a selection*/
        setupSelect2: function ($input, placeholder, defaultValue) {
            var self = this;
            var noMatchesFoundStr = "No matching data found.";
            if (self.isOutputName) {
                noMatchesFoundStr = "Enter a name for the output data object.";
            }
            $input.select2({
                matcher: self.select2Matcher,
                formatNoMatches: noMatchesFoundStr,
                placeholder:placeholder,
                allowClear: true,
                query: function (query) {
                    var data = {results:[]};
                    
                    // populate the names from our valid data object list
                    if (self.validDataObjectList) {
                        for(var i=0; i<self.validDataObjectList.length; i++){
                            var d = self.validDataObjectList[i];
                            if (query.term.trim()!=="") {
                                if(self.select2Matcher(query.term,d.name)) {
                                    data.results.push({id:d.name, text:d.name, info:d.info});
                                }
                            } else {
                                data.results.push({id:d.name, text:d.name, info:d.info});
                            }
                        }
                    }
                    
                    //always allow the name they give if there was no match...
                    if (data.results.length===0) {
                        if (query.term.trim()!=="") {
                            if(self.isOutputName) {
                                data.results.push({id:query.term, text:query.term});
                            } else {
                                data.results.push({id:query.term, text:query.term+" (not found)"});
                            }
                        }
                    }
                    
                    query.callback(data);
                },
                
                formatResult: function(object, container, query) {
                    var display = "<b>"+object.text+"</b>";
                    if (object.info) {
                        // we can add additional info here in the dropdown ...
                        display = display + " (v" + object.info[4]+")<br>&nbsp&nbsp&nbsp<i>updated " + self.getTimeStampStr(object.info[3]);
                        
                    }
                    return display;
                }
            });
            
            if (defaultValue) {
                $input.select2("data",{id:defaultValue, text:defaultValue});
            }
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
            var self = this;
            
            var p= self.getParameterValue();
            var errorDetected = false;
            if(value instanceof Array) {
                // todo: handle this case when there are multiple fields
            } else {
                // if it is a required field and not empty, keep the required icon around but we have an error
                if (p.trim()==='' && self.required) {
                    self.rowDivs[0].$row.removeClass("kb-method-parameter-row-error");
                    self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
                    self.rowDivs[0].$feedback.show();
                    errorDetected = true;
                }
                if (p==="bad") {
                    if (self.rowDivs[0]) {
                        self.rowDivs[0].$row.addClass("kb-method-parameter-row-error");
                        self.rowDivs[0].$error.html("The input 'bad' is bad, enter something different.");
                        self.rowDivs[0].$error.show();
                        self.rowDivs[0].$feedback.removeClass();
                        errorDetected = true;
                    }
                }
                if(self.spec.text_options) {
                    if (self.spec.text_options.validate_as) {
                        var fieldtype = self.spec.text_options.validate_as;
                        // int | float | nonnumeric | nospaces | none
                        if ("int" === fieldtype.toLowerCase()) {
                                //code
                        } else if ("float" === fieldtype.toLowerCase()) {
                                //code
                        } else if ("nonnumeric" === fieldtype.toLowerCase()) {
                                //code
                        }
                    }
                }
                
                // no error, so we hide the error if any, and show the "accepted" icon if it is not empty
                if (!errorDetected || !self.enabled) {
                    if (self.rowDivs[0]) {
                        self.rowDivs[0].$row.removeClass("kb-method-parameter-row-error");
                        self.rowDivs[0].$error.hide();
                        self.rowDivs[0].$feedback.removeClass();
                        if (p.trim()!=='') {
                            self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-accepted-glyph glyphicon glyphicon-ok');
                        }
                    }
                } else {
                    if (p.trim()==='' && self.required) {
                        //code
                    } else {
                        self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left');
                    }
                }
            }
            //return { isValid: !errorDetected, errormssgs:[]};
            return { isValid: true, errormssgs: [] }; 
        },
        
        /*
         * Necessary for Apps to disable editing parameters that are automatically filled
         * from a previous step.  Returns nothing.
         */
        disableParameterEditing: function() {
            // disable the input
            this.enabled = false;
            if(this.isUsingSelect2) {
                this.$elem.find("#"+this.spec.id).select2('disable',true);
            } else {
                this.$elem.find("#"+this.spec.id).prop('disabled',true);
            }
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
            if(this.isUsingSelect2) {
                this.$elem.find("#"+this.spec.id).select2('enable',true);
            } else {
                this.$elem.find("#"+this.spec.id).prop('disabled', false);
            }
            this.isValid();
        },
        
        
        lockInputs: function() {
            if (this.enabled) {
                if(this.isUsingSelect2) {
                    this.$elem.find("#"+this.spec.id).select2('disable',true);
                } else {
                    this.$elem.find("#"+this.spec.id).prop('disabled',true);
                }
            }
            // stylize the row div
            if (this.rowDivs) {
                this.rowDivs[0].$feedback.removeClass();
            }
        },
        unlockInputs: function() {
            if (this.enabled) {
                if(this.isUsingSelect2) {
                    this.$elem.find("#"+this.spec.id).select2('enable',true);
                } else {
                    this.$elem.find("#"+this.spec.id).prop('disabled', false);
                }
            }
            this.isValid();
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
        
        
        
        
        
        
        // edited from: http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
        getTimeStampStr: function (objInfoTimeStamp) {
            var date = new Date(objInfoTimeStamp);
            var seconds = Math.floor((new Date() - date) / 1000);
            var interval = Math.floor(seconds / 31536000);
            
            if (interval > 1) {
                return self.monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
            }
            interval = Math.floor(seconds / 2592000);
            if (interval > 1) {
                if (interval<4) {
                    return interval + " months";
                } else {
                    return this.monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
                }
            }
            interval = Math.floor(seconds / 86400);
            if (interval > 1) {
                return interval + " days ago";
            }
            interval = Math.floor(seconds / 3600);
            if (interval > 1) {
                return interval + " hours ago";
            }
            interval = Math.floor(seconds / 60);
            if (interval > 1) {
                return interval + " minutes ago";
            }
            return Math.floor(seconds) + " seconds ago";
        },
        
        monthLookup : ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep","Oct", "Nov", "Dec"]
        
    });

})( jQuery );