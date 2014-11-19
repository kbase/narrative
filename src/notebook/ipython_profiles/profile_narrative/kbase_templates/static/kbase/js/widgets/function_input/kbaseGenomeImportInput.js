/**
 * Input widget for import genomes into workspace.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "GenomeImportWidget",
        parent: "kbaseNarrativeMethodInput",
        version: "1.0.0",
        options: {
        },

        init: function(options) {
            this._super(options);
            // render and refresh are done in super-class.
            return this;
        }/*,

        addParameterDiv: function(paramPos, paramSpec, $stepDiv, $optionsDiv, $advancedOptionsDiv, isAdvanced) {
        	console.log('addParameterDiv: parameter pos: '+paramPos+', id: "'+
            		paramSpec.id+'", type: "'+paramSpec.field_type);
        }*/
    });

})( jQuery );