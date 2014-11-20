/**
 * Input widget for import genomes into workspace.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "GenomeImportWidget",
        parent: "kbaseTabbedInput",
        version: "1.0.0",
        options: {
        },
        init: function(options) {
            this._super(options);
            return this;
        },
    });
})( jQuery );