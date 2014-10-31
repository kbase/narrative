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
        
        
        render: function() {
            var self = this;
            spec = self.spec;
            console.log(this.spec);
            
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
                
                var input='<input class="form-control" style="width: 95%" name="' + spec.id + '" placeholder="' + defaultValue + '"' +
                        ' value="" type="text"></input>';
                
                var $row = $('<div>').addClass("row").css({"margin":"10px"});
                
                $row.append($('<div>').addClass("col-md-2").css({"vertical-align":"middle", "text-align":"right"})
                                .append("<b>"+spec.ui_name+"</b>"));
                
                $row.append($('<div>').addClass("col-md-4")
                                .append(input));
                
                $row.append($('<div>').addClass("col-md-6")
                                .append(spec.short_hint));
                
                self.$mainPanel.append($row);
                
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
        
        
    });

})( jQuery );