/**
 * KBase widget to display a table of gene information.
 *
 * Expected input data, 'data', is an array:

    [
        [
            "kb|g.3899.c.3",
            "AT2G02480",
            "kb|g.3899.locus.8705",
            "AAA-type ATPase-like protein [Source:EMBL;Acc:AEC05585.1]"
        ],
        [
            "kb|g.3899.c.3",
            "AT2G16485",
            "kb|g.3899.locus.10216",
            "DNA binding / nucleic acid binding / protein binding / zinc ion binding protein [Source:EMBL;Acc:AEC06501.1]"
        ],
        ... etc ...
    ]
*/
(function( $, undefined ) {
    $.KBWidget({
        name: "GeneTableWidget",
        version: "0.1.0",
        options: {
            data: null
        },

        wsUrl: "http://kbase.us/services/workspace/",
        columns: ["Chromosome ID", "Source gene ID", "Gene ID", "Gene function"],

        init: function(options) {
            var self = this;
            this._super(options);
            var container = this.$elem;
            this.showTable(container, options.data);
        },

        showTable: function(elem, rows) {
            var table = $('<table/>')
                .addClass('table table-bordered')
                .css({'margin-left': 'auto', 'margin-right': 'auto'});
            var tr1 = $('<tr>');
            for (var th in this.columns) {
                tr1.append($('<th>').text(th));
            }
            table.append(tr1);
            for (var row in rows) {
                var tr = $('<tr>');
                for (var col in row) {
                    tr.append($('<td>').text(col));
                }
                table.append(tr);
            }
            elem.append(table);
        }
    });
}( jQuery ) );