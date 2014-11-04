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
            
            
            if (!allow_multiple) {
                // just one field, phew, this one should be easy    
                var d = spec.default_values;
                var defaultValue = (d[0] !== "" && d[0] !== undefined) ? d[0] + "'" : "";
                var form_id = spec.id;
                defaultValue = "v";
                var $input=$('<input id="' + form_id + '" placeholder="' + defaultValue + '"' +
                        ' value="" type="text" style="width:100%"/>').addClass("form-control");
                
                if(spec.text_options) {
                    if (spec.text_options.valid_ws_types) {
                        if (spec.text_options.valid_ws_types.length>0) {
                            this.isUsingSelect2 = true;
                            $input =$('<input id="' + form_id + '" type="text" style="width:100%" />');
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
                if (this.isUsingSelect2) {
                     self.$mainPanel.find("#"+form_id).select2({
                        query: function (query) {
                            var data = {results:[]};
                            
                            //always allow the name they give...
                            data.results.push({id:query.term, text:query.term});
                            
                            query.callback(data);
                        }
                    });
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
            //var method = this.options.method;
            //var params = method.parameters;
            //var lookupTypes = [];
            //var tempObj = {};
            //for (var i=0; i<params.length; i++) {
            //    var p = params[i];
            //    if (p.text_options.valid_ws_types.length > 0) {
            //        if (!tempObj.hasOwnProperty(p.text_options.valid_ws_types[0])) {
            //            lookupTypes.push(p.text_options.valid_ws_types[0]);
            //            tempObj[p.text_options.valid_ws_types[0]] = 1;
            //        } 
            //    }
            //}
            //
            //this.trigger('dataLoadedQuery.Narrative', [lookupTypes, this.IGNORE_VERSION, $.proxy(
            //    function(objects) {
            //        // we know from each parameter what each input type is.
            //        // we also know how many of each type there is.
            //        // so, iterate over all parameters and fulfill cases as below.
            //
            //        for (var i=0; i<params.length; i++) {
            //            var p = params[i];
            //
            //            // we're refreshing, not rendering, so assume that there's an
            //            // input with name = pid present.
            //            var $input = $($(this.$elem).find("[name=" + p.id + "]"));
            //            var objList = [];
            //
            //            /*
            //             * New sorting - by date, then alphabetically within dates.
            //             */
            //            var types = p.text_options.valid_ws_types;
            //            for (var j=0; j<types.length; j++) {
            //                if (objects[types[j]] && objects[types[j]].length > 0) {
            //                    objList = objList.concat(objects[types[j]]);
            //                }
            //            }
            //            objList.sort(function(a, b) {
            //                if (a[3] > b[3]) return -1;
            //                if (a[3] < b[3]) return 1;
            //                if (a[1] < b[1]) return -1;
            //                if (a[1] > b[1]) return 1;
            //                return 0;
            //            });
            //
            //            /* down to cases:
            //             * 1. (simple) objList is empty, $input doesn't have a list attribute.
            //             * -- don't do anything.
            //             * 2. objList is empty, $input has a list attribute.
            //             * -- no more data exists, so remove that list attribute and the associated datalist element
            //             * 3. objList is not empty, $input doesn't have a list attribute.
            //             * -- data exists, new datalist needs to be added and linked.
            //             * 4. objList is not empty, $input has a list attribute.
            //             * -- datalist needs to be cleared and updated.
            //             */
            //
            //            // case 1 - no data, input is unchanged
            //
            //            // case 2 - no data, need to clear input
            //            var datalistID = $input.attr('list');
            //            if (objList.length == 0 && datalistID) {
            //                $(this.$elem.find("#" + datalistID)).remove();
            //                $input.removeAttr('list');
            //                $input.val("");
            //            }
            //
            //            // case 3 - data, need new datalist
            //            // case 4 - data, need to update existing datalist
            //            else if (objList.length > 0) {
            //                var $datalist;
            //                if (!datalistID) {
            //                    datalistID = this.genUUID();
            //                    $input.attr('list', datalistID);
            //                    $datalist = $('<datalist>')
            //                                .attr('id', datalistID);
            //                    $input.after($datalist);
            //                }
            //                else {
            //                    $datalist = $(this.$elem.find("#" + datalistID));
            //                }
            //                $datalist.empty();
            //                for (var j=0; j<objList.length; j++) {
            //                    $datalist.append($('<option>')
            //                                     .attr('value', objList[j][1])
            //                                     .append(objList[j][1]));
            //                }
            //            }
            //        }
            //    },
            //    this
            //)]);
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
            
            //.each(function(key, field) {
		//if (field.value.trim() !== "") {
		//    state['readParams'].push(field.value);
		//}
            //});
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