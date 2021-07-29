/**
 * Prototype Genome View widget.
 * Early prototype made during some refactoring on a Friday afternoon.
 *
 * Bill Riehl
 * wjriehl@lbl.gov
 * October 25, 2013
 */
define(['kbwidget', 'jquery', 'bootstrap'], (KBWidget, $, bootstrap) => {
    return KBWidget({
        name: 'GenomeView',

        version: '1.0.0',
        options: {
            data: null,
        },

        init: function (options) {
            this._super(options);

            const data = this.options.data;

            const tableRow = function (a, b) {
                return $('<tr>')
                    .append('<td>' + a + '</td>')
                    .append('<td>' + b + '</td>');
            };

            const calcGC = function (gc, total) {
                if (gc > 1) gc = gc / total;
                return (100 * gc).toFixed(2);
            };

            const $metaTable = $('<table>')
                .addClass('table table-striped table-bordered')
                .css({ 'margin-left': 'auto', 'margin-right': 'auto', width: '100%' })
                .append(tableRow('<b>ID</b>', '<b>' + data[0] + '</b>'))
                .append(tableRow('Scientific Name', data[10].scientific_name))
                .append(tableRow('Size', data[10].size + ' bp'))
                .append(tableRow('GC Content', calcGC(data[10].gc, data[10].size) + '%'))
                .append(tableRow('Number Features', data[10].number_features))
                .append(tableRow('Location', data[7]));

            this.$elem.append($metaTable);

            return this;
        },
    });
});
