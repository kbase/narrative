/**
 * @public
 */

define(['jquery', 'kbwidget', 'kbaseNarrativeParameterInput', 'select2', 'handlebars'], function( $ ) {
    $.KBWidget({
        name: "kbaseNarrativeParameterTextSubdataInput",
        parent: "kbaseNarrativeParameterInput",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            parsedParameterSpec: null,
            wsObjSelectPageSize : 20,
            isInSidePanel: false,
            wsURL: window.kbconfig.urls.workspace,
            kbaseMethodInputWidget: null
        },
        IGNORE_VERSION: true,

        // properties inherited from kbaseNarrativeParameterInput
        // $mainPanel:null,
        // spec:null,
        
        enabled: true,
        required: true,
        validDataObjectList: [],
        allow_multiple: null,
        
        $rowsContainer: null,
        $addRowController: null,
        
        rowInfo: null,
        
        // set the widths of the columns
        nameColClass  : "col-md-2",
        inputColClass : "col-md-5",
        hintColClass  : "col-md-5",
        
        ws : null,
        initWsClient: function() {
            if(this.authToken){
                this.ws = new Workspace(this.options.wsURL, {token: this.authToken()});
            } else {
                error('kbaseNarrativeParameterTextSubdataInput not properly initialized - no auth token found')
            }
        },


        render: function() {
            var self = this;
            var spec = self.spec;

            self.initWsClient();

            // initialize autofill data and fetch
            self.autofillData = [];
            self.firstLookup = true;
            self.fetchSubData();

            if (self.options.isInSidePanel) {
            	self.nameColClass  = "col-md-12";
                self.inputColClass = "col-md-12";
                self.hintColClass  = "col-md-12";
            }

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
            
            // check if this is a multiselection
            var multiselection = false;
            if (spec.textsubdata_options) {
                if (spec.textsubdata_options.multiselection) {
                    multiselection = spec.textsubdata_options.multiselection;
                }
            }
            
            self.rowInfo = [];
            self.$rowsContainer=$("<div>");
            self.$mainPanel.append(self.$rowsContainer);
            self.$addRowController = $('<div>');
            
            var d = spec.default_values;
            
            // based on whether we have one or allow multiple, render the output rows...
            // if multiselection is on, only allow a single input row
            if (!self.allow_multiple || multiselection) {
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
        

        autofillData: null,
        isFetching: null,
        lastLookup: null,
        firstLookup: null,

        fetchSubData: function(doneCallback) {
            var self = this;
            var spec = self.spec;

            if(!self.ws) return;
            if(!spec.textsubdata_options) return;
            if(!spec.textsubdata_options.subdata_selection) return;
            if(!spec.textsubdata_options.subdata_selection.subdata_included) return;
            if(!spec.textsubdata_options.subdata_selection.path_to_subdata) return;

            var path_to_subdata = spec.textsubdata_options.subdata_selection.path_to_subdata;
            var selection_id = spec.textsubdata_options.subdata_selection.selection_id;
            var selection_description = spec.textsubdata_options.subdata_selection.selection_description;
            var subdata_included = spec.textsubdata_options.subdata_selection.subdata_included;
            var text_template = spec.textsubdata_options.subdata_selection.description_template;
            if(!text_template) {
                text_template = "";
                if(selection_description) {
                    for(var sd=0; sd<selection_description.length; sd++) {
                        text_template += " - {{"+selection_description[sd]+"}}";
                    }
                }
            }

            // if we have an absolute ws obj, then go right there
            if(spec.textsubdata_options.subdata_selection.constant_ref) {

                // if autofillData is already set, then we don't have to do anything!!
                if(self.autofillData) { 
                    if(self.autofillData.length>0) { 
                        if(doneCallback) { doneCallback(); }
                        return; 
                    } 
                }
                // if we are already fetching data and waiting for things to return, then don't do it again!
                if(self.isFetching) {
                    if(doneCallback) { doneCallback(); }
                    return;
                }
                self.isFetching = true;

                var query = [];
                for(var i=0; i<spec.textsubdata_options.subdata_selection.constant_ref.length; i++) {
                    query.push({ref:spec.textsubdata_options.subdata_selection.constant_ref[i], included:subdata_included});
                }
                self.ws.get_object_subset(query,
                    function(result) {
                        self.processSubdataQueryResult(result, path_to_subdata, selection_id, 
                                                        selection_description, true, text_template);
                        self.isFetching = false;
                        if(doneCallback) { doneCallback(); }
                    },
                    function(error) {
                        console.error(error);
                        self.isFetching = false;
                        if(doneCallback) { doneCallback(); }
                    });
            }
            // otherwise we have to look at a parameter value to populate the list
            else if(spec.textsubdata_options.subdata_selection.parameter_id) {
                // if we are fetching, then stop
                if(self.isFetching) {
                    if(doneCallback) { doneCallback(); }
                    return;
                }

                // get the parameter value, and quit if we've already seen it
                var param = self.options.kbaseMethodInputWidget
                                .getParameterValue(spec.textsubdata_options.subdata_selection.parameter_id);
                if(self.lastLookup) {
                    if(self.lastLookup === param) {
                        if(doneCallback) { doneCallback(); }
                        return;
                    }
                }
                self.lastLookup = param;


                // if the parameter is actually defined, then continue
                if(param){
                    if(!self.firstLookup) { self.clearInput(); }
                    autofillData=[];
                    self.firstLookup = false;
                    self.isFetching = true;
                    self.trigger('workspaceQuery.Narrative', 
                        function(ws_name) {
                            var query = []
                            if(typeof param === 'string') {
                                query.push({ref:ws_name+'/'+param, included:subdata_included});
                            } else if(param instanceof Array) {
                                for(var i=0; i<param.length; i++) {
                                    query.push({ref:ws_name+'/'+param[i], included:subdata_included});
                                }
                            } else {
                                console.error('parameter is not the correct type for populating a subdata parameter');
                                self.isFetching = false;
                                if(doneCallback) { doneCallback(); }
                                return;
                            }
                            // reset the autofill data and fetch again
                            self.autofillData = [];
                            self.ws.get_object_subset(query,
                                function(result) {
                                    self.processSubdataQueryResult(result, path_to_subdata, selection_id, 
                                                                    selection_description, false, text_template);
                                    self.isFetching = false;
                                    if(doneCallback) { doneCallback(); }
                                },
                                function(error) {
                                    console.error(error);
                                    self.isFetching = false;
                                    if(doneCallback) { doneCallback(); }
                                });
                        });

                    
                } else {
                    // parameter was not defined yet, so finish up (could show a message in dropdown box)
                    if(!self.firstLookup) { self.clearInput(); }
                    self.autofillData=[];
                    if(doneCallback) { doneCallback(); }
                    return;
                }
            }

        },

        processSubdataQueryResult : function(result, path_to_subdata, selection_id, selection_description, includeWsId, text_template) {
            var self = this;

            var hb_template = Handlebars.compile(text_template);

            // loop over subdata from every object
            for(var r=0; r<result.length; r++) {
                var subdata = result[r].data;
                var datainfo = result[r].info;

                for(var p=0; p<path_to_subdata.length; p++) {
                    subdata = subdata[path_to_subdata[p]];
                }

                if(subdata instanceof Array) {
                    for(var k=0; k<subdata.length; k++) {
                        var dname = datainfo[1];
                        if(includeWsId) { dname = datainfo[6] + '/' + datainfo[1]; }
                        var autofill = {
                            id: subdata[k][selection_id],
                            desc: hb_template(subdata[k]),
                            dref: datainfo[6] + '/' + datainfo[0] + '/' + datainfo[4],
                            dname: dname
                        };
                        self.autofillData.push(autofill);
                    }
                } else {
                    for(var key in subdata) {
                        if(subdata.hasOwnProperty(key)) {
                            var dname = datainfo[1];
                            if(includeWsId) { dname = datainfo[6] + '/' + datainfo[1]; }
                            var autofill = {
                                id: key,
                                desc: hb_template(subdata[k]),
                                dref: datainfo[6] + '/' + datainfo[0] + '/' + datainfo[4],
                                dname: dname
                            };
                            self.autofillData.push(autofill);
                        }
                    }
                }
            }

            //console.debug(self.autofillData);
        },


        clearInput: function () {
            var self = this;
            for(var i=0; i<self.rowInfo.length; i++) {
                self.setSpecificRowValue(i,'');
            }
            this.isValid();
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
            if(spec.textsubdata_options) {
                if(spec.textsubdata_options.placeholder) {
                    placeholder = spec.textsubdata_options.placeholder;
                    placeholder = placeholder.replace(/(\r\n|\n|\r)/gm,"");
                }
            }
            if (!defaultValue) { defaultValue = ""; }
            
            var form_id = spec.id;
            var $input= $input =$('<input id="' + form_id + '" type="text" style="width:100%" />')
                                    .on("change",function() { self.isValid() });


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
            if (placeholder === '') { placeholder = ' '; } // this allows us to cancel selections in select2
            this.setupSelect2($input, placeholder, defaultValue, 
                spec.textsubdata_options.multiselection,
                spec.textsubdata_options.show_src_obj,
                spec.textsubdata_options.allow_custom);

            // if a default value is set, validate it.
            if (defaultValue) {
                this.isValid();
            }
        },
        
        refresh: function() {
            var self = this;
            self.fetchSubData();
        },

        
        /* private method - note: if placeholder is empty, then users cannot cancel a selection*/
        setupSelect2: function ($input, placeholder, defaultValue, multiselection,
                                    show_src_obj, allow_custom) {
            var self = this;
            var noMatchesFoundStr = "No matching data found or loaded yet.";

            var multiple = false;
            if(multiselection) multiple=true;
            if(show_src_obj===null) show_src_obj = true;
            if(allow_custom===null) allow_custom = false;
            $input.select2({
                matcher: self.select2Matcher,
                formatNoMatches: noMatchesFoundStr,
                placeholder:placeholder,
                allowClear: true,
                selectOnBlur: true,
                multiple:multiple,
                tokenSeparators: [',', ' '],
                query: function (query) {
                    var data = {results:[]};
                    
                    self.fetchSubData(
                        function() {
                            // if there is a current selection (this is a bit of a hack) we
                            // prefill the input box so we don't have to do additional typing
                            if (!multiple && query.term.trim()==="" && $input.select2('data') && $input.data('select2').kbaseHackLastSelection) {
                                var searchbox = $input.data('select2').search;
                                if (searchbox) {
                                    $(searchbox).val($input.select2('data').id);
                                    query.term = $input.select2('data').id;
                                    $input.data('select2').kbaseHackLastSelection = null;
                                }
                            }
                            $input.data('select2').kbaseHackLastTerm = query.term;
                            
                            // populate the names from our valid data object list
                            var exactMatch = false;
                            if (self.autofillData) {
                                for(var i=0; i<self.autofillData.length; i++){
                                    var d = self.autofillData[i];
                                    var text = '';
                                    if(d.desc) { text = d.desc; }
                                    if (query.term.trim()!=="") {
                                        if(self.select2Matcher(query.term, d.id) ||
                                            self.select2Matcher(query.term, text) ||
                                            self.select2Matcher(query.term, d.dname)) {
                                                data.results.push({id:d.id, text:text, 
                                                    dref:d.dref, dname:d.dname});
                                        }
                                    } else {
                                        data.results.push({id:d.id, text:text, 
                                                    dref:d.dref, dname:d.dname});
                                    }
                                }
                            }
                            
                            //allow custom names if specified and multiselect is off (for some reason
                            //custome fields don't work in multiselect mode) then unshift it to the front...
                            if (allow_custom && !multiple && query.term.trim()!=="") {
                                data.results.unshift({id:query.term, text:''});
                            }

                            // paginate results
                            var pageSize = self.options.wsObjSelectPageSize;
                            query.callback({results:data.results.slice((query.page-1)*pageSize, query.page*pageSize),
                                        more:data.results.length >= query.page*pageSize });
                        });
                },
                
                formatSelection: function(object, container) {
                    var display = '<span class="kb-parameter-data-selection">'+object.id+'</span>';
                    return display;
                },
                formatResult: function(object, container, query) {
                    var display = '<span style="word-wrap:break-word;"><b>'+object.id+'</b>';
                    if(object.text) display+= object.text;
                    if(show_src_obj && object.dname)
                        display += '<br>&nbsp&nbsp&nbsp&nbsp&nbsp<i>in ' + object.dname + '</i>';
                    display += '</span>';
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
                this.rowInfo[i].$input.select2('disable',true);
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
                this.rowInfo[i].$input.select2('enable',true);
                if (this.rowInfo[i].$removalButton) { this.rowInfo[i].$removalButton.show(); }
            }
            this.$addRowController.show();
            this.isValid();
        },
        
        
        lockInputs: function() {
            if (this.enabled) {
                for(var i=0; i<this.rowInfo.length; i++) {
                    this.rowInfo[i].$input.select2('disable',true);
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
                    this.rowInfo[i].$input.select2('enable',true);
                    if (this.rowInfo[i].$removalButton) { this.rowInfo[i].$removalButton.show(); }
                }
            }
            this.$addRowController.show();
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
            var setValue = {id:value, text:value};
            if(this.spec.textsubdata_options.multiselection) {
                var valueList = value.split(',');
                setValue = [];
                for(var k=0; k<valueList.length; k++) {
                    setValue.push({id:valueList[k],text:valueList[k]});
                }
            }
            if (this.enabled) {
                this.rowInfo[i].$input.select2("data",setValue);
            } else {
                this.rowInfo[i].$input.select2('disable',false);
                this.rowInfo[i].$input.select2("data",setValue);
                this.rowInfo[i].$input.select2('disable',true);
            }
        },
        
        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.
         */
        getParameterValue: function() {
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
        
        prepareValueBeforeRun: function(methodSpec) {

        },

        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },
    });
});