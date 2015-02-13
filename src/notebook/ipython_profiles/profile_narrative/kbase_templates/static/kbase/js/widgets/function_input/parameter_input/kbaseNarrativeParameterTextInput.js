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
            parsedParameterSpec: null,
            wsObjSelectPageSize : 20,
            isInSidePanel: false
        },
        IGNORE_VERSION: true,

        // properties inherited from kbaseNarrativeParameterInput
        // $mainPanel:null,
        // spec:null,
        
        isUsingSelect2: false,
        enabled: true,
        isOutputName: false,
        required: true,
        validDataObjectList: [],
        allow_multiple:false,
        
        $rowsContainer: null,
        $addRowController: null,
        
        rowInfo: null,
        
        // set the widths of the columns
        nameColClass  : "col-md-2",
        inputColClass : "col-md-5",
        hintColClass  : "col-md-5",
        
        render: function() {
            var self = this;
            if (self.options.isInSidePanel) {
            	self.nameColClass  = "col-md-12";
                self.inputColClass = "col-md-12";
                self.hintColClass  = "col-md-12";
            }

            var spec = self.spec;
            
            // check if we need to allow multiple values
            self.allow_multiple = false;
            if (spec.allow_multiple) {
                if (spec.allow_multiple===true || spec.allow_multiple===1) {
                    self.allow_multiple = true;
                }
            }
            // check if this is a required field
            self.required= true;
            if (spec.optional) {
                self.required=false;
            }
            
            // check if this is an output name
            if (spec.text_options) {
                if (spec.text_options.is_output_name) {
                    self.isOutputName = true;
                }
            }
            
            //self.$mainPanel.addClass("kb-method-parameter-panel")
            //        .hover(function(){$(this).toggleClass('kb-method-parameter-panel-hover');});;
            
            self.rowInfo = [];
            self.$rowsContainer=$("<div>");
            self.$mainPanel.append(self.$rowsContainer);
            self.$addRowController = $('<div>');
            
            var d = spec.default_values;
            
            // based on whether we have one or allow multiple, render the output rows...
            if (!self.allow_multiple) {
                var defaultValue = '';
                if (spec.default_values) { if (spec.default_values.length >= 1) {
                        var d = spec.default_values; defaultValue = (d[0] !== '' && d[0] !== undefined) ? d[0] : '';
                }}
                self.addRow(defaultValue,true,true); 
            } else {
                // for multiple elements, hover on entire panel
                self.$mainPanel
                        .addClass("kb-method-parameter-row")
                        .mouseenter(function(){$(this).addClass('kb-method-parameter-row-hover');})
                        .mouseleave(function(){$(this).removeClass('kb-method-parameter-row-hover');});
                
                var defaultValue = '';
                if (spec.default_values) { if (spec.default_values.length >= 1) {
                        var d = spec.default_values; defaultValue = (d[0] !== '' && d[0] !== undefined) ? d[0] : '';
                }}
                self.addRow(defaultValue,true,false);
                if (spec.default_values) {
                    var d = spec.default_values;
                    for(var i=1; i<d.length; d++) {
                        defaultValue = (d[i] !== '' && d[i] !== undefined) ? d[i] : '';
                        self.addRow(defaultValue,false,false); 
                    }
                }
                self.addTheAddRowController();
            }
            self.refresh();
        },
        
        addTheAddRowController: function () {
            var self = this;
            var $nameCol = $('<div>').addClass(self.nameColClass).addClass("kb-method-parameter-name");
            if (self.options.isInSidePanel)
            	$nameCol.css({'text-align': 'left', 'padding-left': '10px'});
            var $buttonCol = $('<div>').addClass(self.inputColClass).addClass("kb-method-parameter-input").append(
                                $('<button>').addClass("kb-default-btn kb-btn-sm")
                                .append($('<span class="kb-parameter-data-row-add">').addClass("fa fa-plus"))
                                .append(" add another "+self.spec.ui_name)
                                .on("click",function() { self.addRow() }) );
            self.$addRowController = $('<div>').addClass("row kb-method-parameter-row").append($nameCol).append($buttonCol);
            self.$mainPanel.append(self.$addRowController)
        },
        
        
        removeRow : function(uuid) {
            var self = this;
            for(var i=0; i<self.rowInfo.length; i++) {
                if (self.rowInfo[i].uuid === uuid) {
                    self.rowInfo[i].$all.remove();
                    self.rowInfo.splice(i,1);
                    break;
                }
            }
        },
        
        /* row number should only be set when first creating this row */
        addRow : function(defaultValue, showHint, useRowHighlight) {
            var self = this;
            var spec = self.spec;
            
            var placeholder = '';
            if(spec.text_options) {
                if(spec.text_options.placeholder) {
                    placeholder = spec.text_options.placeholder;
                    placeholder = placeholder.replace(/(\r\n|\n|\r)/gm,"");
                }
            }
            if (!defaultValue) { defaultValue = ""; }
            
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
                        //this.validDataObjectList = []; - why was this here? ...
                    }
                }
            }
                
            var $feedbackTip = $("<span>").removeClass();
            if (self.required && showHint) {  // it must be required, and it must be the first element (showHint is only added on first row)
                $feedbackTip.addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
            }
                
            var $row = $('<div>').addClass("row kb-method-parameter-row");
            if (useRowHighlight) {
                $row.mouseenter(function(){$(this).addClass('kb-method-parameter-row-hover');})
                    .mouseleave(function(){$(this).removeClass('kb-method-parameter-row-hover');});
            }
                            
            var $nameCol = $('<div>').addClass(self.nameColClass).addClass("kb-method-parameter-name");
            if (self.options.isInSidePanel)
            	$nameCol.css({'text-align': 'left', 'padding-left': '10px'});
            if (showHint) { $nameCol.append(spec.ui_name); }
            var $inputCol = $('<div>').addClass(self.inputColClass).addClass("kb-method-parameter-input")
                                .append($('<div>').css({"width":"100%","display":"inline-block"}).append($input))
                                .append($('<div>').css({"display":"inline-block"}).append($feedbackTip));
            var $hintCol  = $('<div>').addClass(self.hintColClass).addClass("kb-method-parameter-hint");
            var uuidForRemoval = self.genUUID(); var $removalButton=null;
            if(showHint) {
                $hintCol.append(spec.short_hint);
                if (spec.description && spec.short_hint !== spec.description) {
                    $hintCol.append($('<span>').addClass('fa fa-info kb-method-parameter-info')
                                    .tooltip({title:spec.description, html:true}));
                }
            } else {
                $removalButton = $('<button>').addClass("kb-default-btn kb-btn-sm")
                                .append($('<span class="kb-parameter-data-row-remove">').addClass("fa fa-remove"))
                                .append(" remove "+spec.ui_name)
                                .on("click",function() { self.removeRow(uuidForRemoval); })
                $hintCol.append($removalButton);
            }
            $row.append($nameCol).append($inputCol).append($hintCol);
            var $errorPanel = $('<div>').addClass("kb-method-parameter-error-mssg").hide();
            var $errorRow = $('<div>').addClass('row')
                                .append($('<div>').addClass(self.nameColClass))
                                .append($errorPanel.addClass(self.inputColClass));
            
            var $allRowComponents = $('<div>').append($row).append($errorRow);
            self.$rowsContainer.append($allRowComponents);
            self.rowInfo.push({uuid: uuidForRemoval, $row:$row, $input:$input, $error:$errorPanel, $feedback:$feedbackTip, $all:$allRowComponents, $removalButton:$removalButton});
                
            /* for some reason, we need to actually have the input added to the main panel before this will work */
            if (self.isUsingSelect2) {
                if (placeholder === '') { placeholder = ' '; } // this allows us to cancel selections in select2
                this.setupSelect2($input, placeholder);
            }
            // if a default value is set, validate it.
            if (defaultValue) {
                this.isValid();
            }
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
                selectOnBlur: true,
                query: function (query) {
                    var data = {results:[]};
                    
                    // if there is a current selection (this is a bit of a hack) we
                    // prefill the input box so we don't have to do additional typing
                    if (query.term.trim()==="" && $input.select2('data') && $input.data('select2').kbaseHackLastSelection) {
                        var searchbox = $input.data('select2').search;
                        if (searchbox) {
                            $(searchbox).val($input.select2('data').text);
                            query.term = $input.select2('data').text;
                            $input.data('select2').kbaseHackLastSelection = null;
                        }
                    }
                    $input.data('select2').kbaseHackLastTerm = query.term;
                    
                    // populate the names from our valid data object list
                    var exactMatch = false;
                    if (self.validDataObjectList) {
                        for(var i=0; i<self.validDataObjectList.length; i++){
                            var d = self.validDataObjectList[i];
                            if (query.term.trim()!=="") {
                                if(self.select2Matcher(query.term,d.name)) {
                                    if (query.term === d.name) { exactMatch = true; }
                                    data.results.push({id:d.name, text:d.name, info:d.info});
                                }
                                // search metadata too
                                else if (d.info[10]) {
                                    for(var key in d.info[10]) {
                                        if (d.info[10].hasOwnProperty(key)) {
                                            if(self.select2Matcher(query.term,d.info[10][key])) {
                                                data.results.push({id:d.name, text:d.name,
                                                                  mm:key+' - '+d.info[10][key],info:d.info});
                                                // allow us to show metadata match!
                                            }
                                        }
                                    }
                                }
                                
                            } else {
                                data.results.push({id:d.name, text:d.name, info:d.info});
                            }
                        }
                    }
                    
                    //always allow the name if it is set as an output name, unshift it to the front...
                    if (query.term.trim()!=="") {
                        if(self.isOutputName && !exactMatch) {
                            data.results.unshift({id:query.term, text:query.term});
                        }
                    }
                    
                    // paginate results
                    var pageSize = self.options.wsObjSelectPageSize;
                    query.callback({results:data.results.slice((query.page-1)*pageSize, query.page*pageSize),
                                more:data.results.length >= query.page*pageSize });
                },
                
                formatSelection: function(object, container) {
                    var display = '<span class="kb-parameter-data-selection">'+object.text+'</span>';
                    return display;
                },
                formatResult: function(object, container, query) {
                    var display = '<span style="word-wrap:break-word;"><b>'+object.text+"</b></span>";
                    if (object.info) {
                        // we can add additional info here in the dropdown ...
                        display = display + " (v" + object.info[4]+")<br>";
                        if (object.mm) {
                            display = display + "&nbsp&nbsp&nbsp<i>"+object.mm+"</i><br>";
                        }
                        display = display + "&nbsp&nbsp&nbsp<i>updated " + self.getTimeStampStr(object.info[3])+"</i>";
                    }
                    return display;
                }
            })
            .on("select2-selecting",
                function(e) {
                    $input.data('select2').kbaseHackLastSelection = e.choice;
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
            if (!self.enabled) {
                return { isValid: true, errormssgs:[]}; // do not validate if disabled
            }
            var p= self.getParameterValue();
            if (p===null) { return { isValid: true, errormssgs:[]}; }
            var errorDetected = false;
            var errorMessages = [];
            if(p instanceof Array) {
            } else { p = [p]; }
            for(var i=0; i<p.length; i++) {
                var errorDetectedHere = false;
                if (p[i]===null) { continue; }
                pVal = p[i].trim();
                // if it is a required field and not empty, keep the required icon around but we have an error (only for the first element)
                if (pVal==='' && self.required && i===0) {
                    self.rowInfo[i].$row.removeClass("kb-method-parameter-row-error");
                    self.rowInfo[i].$feedback.removeClass().addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
                    self.rowInfo[i].$feedback.show();
                    self.rowInfo[i].$error.hide();
                    errorDetectedHere = true;
                    errorMessages.push("required field "+self.spec.ui_name+" missing.");
                } else {
                    if(self.spec.text_options) {
                        if (self.spec.text_options.validate_as) {
                            var fieldtype = self.spec.text_options.validate_as;
                            // int | float | nonnumeric | nospaces | none
                            if ("int" === fieldtype.toLowerCase()) {
                                if (pVal!=='') {
                                    var n = ~~Number(pVal);
                                    if(String(n) !== pVal) {
                                        self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                        self.rowInfo[i].$error.html("value must be an integer");
                                        self.rowInfo[i].$error.show();
                                        self.rowInfo[i].$feedback.removeClass();
                                        errorDetectedHere = true;
                                        errorMessages.push("value must be an integer in field "+self.spec.ui_name);
                                    }
                                    else {
                                        if (self.spec.text_options.max_int) {
                                            if (n>self.spec.text_options.max_int) {
                                                self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                                self.rowInfo[i].$error.html("the maximum value for this parameter is "+self.spec.text_options.max_int);
                                                self.rowInfo[i].$error.show();
                                                self.rowInfo[i].$feedback.removeClass();
                                                errorDetectedHere = true;
                                                errorMessages.push("the maximum value for this parameter is "+self.spec.text_options.max_int+" in " +self.spec.ui_name);
                                            }
                                        }
                                        if (self.spec.text_options.min_int) {
                                            if (n<self.spec.text_options.min_int) {
                                                self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                                self.rowInfo[i].$error.html("the minimum value for this parameter is "+self.spec.text_options.min_int);
                                                self.rowInfo[i].$error.show();
                                                self.rowInfo[i].$feedback.removeClass();
                                                errorDetectedHere = true;
                                                errorMessages.push("the minimum value for this parameter is "+self.spec.text_options.min_int+" in " +self.spec.ui_name);
                                            }
                                        }
                                    }
                                }
                            } else if ("float" === fieldtype.toLowerCase()) {
                                if(isNaN(pVal)) {
                                    self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                    self.rowInfo[i].$error.html("value must be numeric");
                                    self.rowInfo[i].$error.show();
                                    self.rowInfo[i].$feedback.removeClass();
                                    errorDetectedHere = true;
                                    errorMessages.push("value must be a number in field "+self.spec.ui_name);
                                }
                                else {
                                    var n = parseFloat(pVal);;
                                    if (self.spec.text_options.max_float) {
                                            if (n>self.spec.text_options.max_float) {
                                                self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                                self.rowInfo[i].$error.html("the maximum value for this parameter is "+self.spec.text_options.max_float);
                                                self.rowInfo[i].$error.show();
                                                self.rowInfo[i].$feedback.removeClass();
                                                errorDetectedHere = true;
                                                errorMessages.push("the maximum value for this parameter is "+self.spec.text_options.max_float+" in " +self.spec.ui_name);
                                            }
                                        }
                                        if (self.spec.text_options.min_float) {
                                            if (n<self.spec.text_options.min_float) {
                                                self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                                self.rowInfo[i].$error.html("the minimum value for this parameter is "+self.spec.text_options.min_float);
                                                self.rowInfo[i].$error.show();
                                                self.rowInfo[i].$feedback.removeClass();
                                                errorDetectedHere = true;
                                                errorMessages.push("the minimum value for this parameter is "+self.spec.text_options.min_float+" in " +self.spec.ui_name);
                                            }
                                        }
                                }
                            }
                        }
                        if (self.spec.text_options.valid_ws_types) {
                            if(self.spec.text_options.valid_ws_types.length>0) {
                                if (/\s/.test(pVal)) {
                                    if (self.rowInfo[i]) {
                                        self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                        self.rowInfo[i].$error.html("spaces are not allowed in data object names");
                                        self.rowInfo[i].$error.show();
                                        self.rowInfo[i].$feedback.removeClass();
                                    }
                                    errorDetectedHere = true;
                                    errorMessages.push("spaces are not allowed in data object names, in field "+self.spec.ui_name);
                                } else if (/^\d+$/.test(pVal)) {
                                    if (self.rowInfo[i]) {
                                        self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                        self.rowInfo[i].$error.html("data object names cannot be a number");
                                        self.rowInfo[i].$error.show();
                                        self.rowInfo[i].$feedback.removeClass();
                                    }
                                    errorDetectedHere = true;
                                    errorMessages.push("data object names cannot be a number, in field "+self.spec.ui_name);
                                } else if (!/^[a-z0-9|\.|\||_\-]*$/i.test(pVal)) {
                                    if (self.rowInfo[i]) {
                                        self.rowInfo[i].$row.addClass("kb-method-parameter-row-error");
                                        self.rowInfo[i].$error.html("object names can only include symbols: _ - . |");
                                        self.rowInfo[i].$error.show();
                                        self.rowInfo[i].$feedback.removeClass();
                                    }
                                    errorDetectedHere = true;
                                    errorMessages.push("object names can only include symbols: '_','-','.','|', in field "+self.spec.ui_name);
                                }
                            }
                        }
                    }
                }
                
                // no error, so we hide the error if any, and show the "accepted" icon if it is not empty
                if (!errorDetectedHere || !self.enabled) {
                    if (self.rowInfo[i]) {
                        self.rowInfo[i].$row.removeClass("kb-method-parameter-row-error");
                        self.rowInfo[i].$error.hide();
                        self.rowInfo[i].$feedback.removeClass();
                        if (pVal!=='') {
                            self.rowInfo[i].$feedback.removeClass().addClass('kb-method-parameter-accepted-glyph glyphicon glyphicon-ok');
                        }
                    }
                } else {
                    if (pVal==='' && self.required && i===0) {
                        //code
                    } else {
                        self.rowInfo[i].$feedback.removeClass().addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left');
                    }
                }
                if (errorDetectedHere) { errorDetected = true; }
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
            for(var i=0; i<this.rowInfo.length; i++) {
                if(this.isUsingSelect2) {
                    this.rowInfo[i].$input.select2('disable',true);
                } else {
                    this.rowInfo[i].$input.prop('disabled',true);
                }
                // stylize the row div
                this.rowInfo[i].$feedback.removeClass();
                if (this.rowInfo[i].$removalButton) { this.rowInfo[i].$removalButton.hide(); }
            }
            this.$addRowController.hide();
        },
        
        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function() {
            // enable the input
            this.enabled = true;
            for(var i=0; i<this.rowInfo.length; i++) {
                if(this.isUsingSelect2) {
                    this.rowInfo[i].$input.select2('enable',true);
                } else {
                    this.rowInfo[i].$input.prop('disabled', false);
                }
                if (this.rowInfo[i].$removalButton) { this.rowInfo[i].$removalButton.show(); }
            }
            this.$addRowController.show();
            this.isValid();
        },
        
        
        lockInputs: function() {
            if (this.enabled) {
                for(var i=0; i<this.rowInfo.length; i++) {
                    if(this.isUsingSelect2) {
                        this.rowInfo[i].$input.select2('disable',true);
                    } else {
                        this.rowInfo[i].$input.prop('disabled',true);
                    }
                }
            }
            for(var i=0; i<this.rowInfo.length; i++) {
                this.rowInfo[i].$feedback.removeClass();
                if (this.rowInfo[i].$removalButton) { this.rowInfo[i].$removalButton.hide(); }
            }
            this.$addRowController.hide();
        },
        unlockInputs: function() {
            if (this.enabled) {
                for(var i=0; i<this.rowInfo.length; i++) {
                    if(this.isUsingSelect2) {
                       this.rowInfo[i].$input.select2('enable',true);
                    } else {
                        this.rowInfo[i].$input.prop('disabled', false);
                    }
                    if (this.rowInfo[i].$removalButton) { this.rowInfo[i].$removalButton.show(); }
                }
            }
            this.$addRowController.show();
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
            if (value===null) { return; }
            if(value instanceof Array) {
            } else { value = [value]; }
            
            for(var i=0; i<value.length; i++) {
                var v = value[i].trim();
                if (i<this.rowInfo.length) {
                    if(v) { this.setSpecificRowValue(i,v) };
                } else {
                    this.addRow();
                    if(v) { this.setSpecificRowValue(i,value[i]) };
                }
            }
            this.isValid();
        },
        
        setSpecificRowValue: function(i,value) {
            if(this.isUsingSelect2) {
                if (this.enabled) {
                    this.rowInfo[i].$input.select2("data",{id:value, text:value});
                } else {
                    this.rowInfo[i].$input.select2('disable',false);
                    this.rowInfo[i].$input.select2("data",{id:value, text:value});
                    this.rowInfo[i].$input.select2('disable',true);
                }
            } else {
                this.rowInfo[i].$input.val(value);
            }
            
        },
        
        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.
         */
        getParameterValue: function() {
            // if this is an output, and there's only one row, and it's optional,
            // but it's not filled out, then we need a random name.
            if (this.spec.text_options && 
                this.spec.text_options.is_output_name === 1 && 
                this.rowInfo.length === 1 &&
                this.rowInfo[0].$input.val().length === 0 &&
                this.spec.optional === 1) {
//                this.setParameterValue(this.generateRandomOutputString());
            }
            
            // if this is optional, and not filled out, then we return null
            if (this.spec.optional === 1) {
                if (this.rowInfo.length===1) {
                    if (this.rowInfo[0].$input.val().trim().length===0) {
                        return null; // return null since this is optional an no values are set
                    }
                    if (this.allow_multiple) {
                        return [this.rowInfo[0].$input.val()];
                    }
                    return this.rowInfo[0].$input.val();
                }
                var value = [];
                for(var i=0; i<this.rowInfo.length; i++) {
                    if (this.rowInfo[0].$input.val().trim().length>0) {
                        value.push(this.rowInfo[i].$input.val()); // only push the value if it is not empty
                    }
                }
                if (value.length===0) { return null; } // return null since this is optional and nothing was set
                return value;
            }

            if (this.rowInfo.length===1) {
                if (this.allow_multiple) {
                    return [this.rowInfo[0].$input.val()];
                }
                return this.rowInfo[0].$input.val();
            }
            var value = [];
            for(var i=0; i<this.rowInfo.length; i++) {
                value.push(this.rowInfo[i].$input.val());
            }
            return value;
        },
        
        // edited from: http://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
        getTimeStampStr: function (objInfoTimeStamp) {
            var date = new Date(objInfoTimeStamp);
            var seconds = Math.floor((new Date() - date) / 1000);
            
            // f-ing safari, need to add extra ':' delimiter to parse the timestamp
            if (isNaN(seconds)) {
                var tokens = objInfoTimeStamp.split('+');  // this is just the date without the GMT offset
                var newTimestamp = tokens[0] + '+'+tokens[0].substr(0,2) + ":" + tokens[1].substr(2,2);
                date = new Date(newTimestamp);
                seconds = Math.floor((new Date() - date) / 1000);
                if (isNaN(seconds)) {
                    // just in case that didn't work either, then parse without the timezone offset, but
                    // then just show the day and forget the fancy stuff...
                    date = new Date(tokens[0]);
                    return this.monthLookup[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
                }
            }
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
        
        monthLookup : ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep","Oct", "Nov", "Dec"],
        
        // make a randomized string, assuming it's for an output.
        generateRandomOutputString: function(generProps) {
            var strArr = [];
            var symbols = 8
            if (generProps['symbols'])
                symbols = generProps['symbols'];
            for (var i=0; i<symbols; i++)
                strArr.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
            var ret = strArr.join('');
            if (generProps['prefix'])
                ret = generProps['prefix'] + ret;
            if (generProps['suffix'])
                ret = ret + str(generProps['suffix']);
            return ret;
        },

        prepareValueBeforeRun: function(methodSpec) {
            if (this.spec.text_options && 
                    this.spec.text_options.is_output_name === 1 && 
                    this.rowInfo.length === 1 &&
                    this.rowInfo[0].$input.val().length === 0 &&
                    this.spec.optional === 1) {
            	//var e = new Error('dummy');
            	//var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            	//	.replace(/^\s+at\s+/gm, '')
            	//	.replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            	//	.split('\n');
            	//console.log(stack);
            	var paramId = this.spec.id;
                var inputMapping = null;
                var isScript = false;
                var inputMapping = methodSpec['behavior']['kb_service_input_mapping'];
                if (!inputMapping) {
                    inputMapping = methodSpec['behavior']['script_input_mapping'];
                    isScript = true;
                }
                var generatedValueMapping = null;
                for (var i in inputMapping) {
                	mapping = inputMapping[i];
                    var aParamId = mapping['input_parameter'];
                    if (aParamId && aParamId === paramId && mapping['generated_value']) {
                    	generatedValueMapping = mapping['generated_value'];
                    	break;
                    }
                }
                if (generatedValueMapping) {
                	this.setParameterValue(this.generateRandomOutputString(generatedValueMapping));
                }
            }
        },

        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },
    });
    

})( jQuery );