/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseDefaultNarrativeInput", 
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            method: null,
        },

        init: function(options) {
            this._super(options);

            // expects the method as a JSON string
            if (this.options.method)
                this.options.method = JSON.parse(this.options.method);
            
            this.render();
            return this;
        },

        /**
         * Builds the input div for a function cell, based on the given method object.
         * @param {Object} method - the method being constructed around.
         * @returns {String} an HTML string describing the available parameters for the cell.
         * @private
         */
        render: function() {

            // figure out all types from the method
            var method = this.options.method;
            
            var params = method.properties.parameters;
            var lookupTypes = [];
            for (var p in params) {
                lookupTypes.push(params[p].type);
            }
            this.trigger('dataLoadedQuery.Narrative', [lookupTypes, $.proxy(
                function(objects) {
                    var inputDiv = "<div class='kb-cell-params'><table class='table'>";
                    var params = method.properties.parameters;
                    for (var i=0; i<Object.keys(params).length; i++) {
                        var pid = 'param' + i;
                        var p = params[pid];

                        var input = "";
//                        console.log(objects);
                        if (objects[p.type] && objects[p.type].length > 0) {
                            var objList = objects[p.type];
                            objList.sort(function(a, b) {
                                if (a[0] < b[0])
                                    return -1;
                                if (a[0] > b[0])
                                    return 1;
                                return 0;
                            });

                            input = "<select name='" + pid + "' > ";
                            for (var j=0; j<objects[p.type].length; j++) {
                                input += "<option value='" + objList[j][0] + "'>" + objList[j][0] + "</option>";
                            }
                            input += "</select>";
                        }

                        else {
                            input = "<input name='" + pid + "' value='' type='text'></input>";
                        }
                        inputDiv += "<tr style='border:none'>" + 
                                        "<td style='border:none'>" + p.ui_name + "</td>" + 
                                        "<td style='border:none'>" + input + "</td>" +
                                        "<td style='border:none'>" + p.description + "</td>" +
                                    "</tr>";
                    }
                    inputDiv += "</table></div>";
                    this.$elem.append(inputDiv);
                },
                this
            )]);
        },
    });

})( jQuery );