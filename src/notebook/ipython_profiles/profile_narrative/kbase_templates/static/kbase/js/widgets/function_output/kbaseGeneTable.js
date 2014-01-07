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
            table: null
        },

        wsUrl: "http://kbase.us/services/workspace/",
        columns: ["Chromosome ID", "Source gene ID", "Gene ID", "Gene function"],

        init: function(options) {
            console.debug("GeneTableWidget.init", options);
            var self = this;
            this._super(options);
            return this.render();
        },

        render: function() {
            console.debug("GeneTableWidget.showTable.start");
            var i, j;
            // Create table container.
            var table = $('<table>')
                .addClass('table table-bordered')
                .css({'margin-left': 'auto', 'margin-right': 'auto', 'border': '0'});
            var thead = $('<thead>'), tbody = $('<tbody>');
            thead.css({'background-color': '#EEEEEE', 'color': '#0D7876'});
            // Add header.
            var tr1 = $('<tr>').css({'border-top-color': '#DDDDDD'});
            for (i = 0; i < this.columns.length; i++) {
                tr1.append($('<th>').text(this.columns[i]));
            }
            thead.append(tr1);
            table.append(thead);
            // Add body.
            for (i = 0; i < this.options.table.length; i++) {
                var tr = $('<tr>'), row = this.options.table[i];
                for (j = 0; j < row.length; j++) {
                    tr.append($('<td>').text(row[j]));
                }
                tbody.append(tr);
            }
            table.append(tbody);
            // Put table in cell.
            this.$elem.append(table);
            console.debug("GeneTableWidget.showTable.end");
            return this;
        }
    });
}( jQuery ) );