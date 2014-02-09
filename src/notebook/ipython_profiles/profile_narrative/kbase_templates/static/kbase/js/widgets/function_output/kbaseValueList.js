/**
 * KBase widget to display a list of arbitrary values.
 *
 * Expected input data is JSON with one key, values, whose value is a list.
 * Each list item is a pair, key and value.
 * For example:
 {'values':
    [
        [ "my value", "the value" ],
        [ "my other value", 123 ],
        ..etc..
    ]
 }
*/
(function( $, undefined ) {
    $.KBWidget({
        name: "ValueListWidget",
        version: "0.1.0",
        options: {
            values: null
        },

        wsUrl: "https://kbase.us/services/ws/",

        init: function(options) {
            var vals = options.values;
            console.debug("ValueListWidget.init.start values=", vals);
            this._super(options);
            // on error, may be called with null
            if (vals !== null && vals.length > 0) {
                this.render();
            }
            else {
                this.$elem.html("No result");
            }
            console.debug("ValueListWidget.init.end");
            return this;
        },

        render: function() {
            console.debug("ValueListWidget.render.start");
            var i;
            // Create table container.
            var table = $('<table>')
                .addClass('table table-condensed');
            table.css({'border': '0', 'border-width': '0'});
            var tbody = $('<tbody>');
            //thead.css({'background-color': '#EEEEEE', 'color': '#0D7876'});
            // Add body.
            var vals = this.options.values;
            for (i = 0; i < vals.length; i++) {
                var tr = $('<tr>').css({'border': '0px'})
                    .append($('<td>').css({'color': '#2A6496', 'border': '0'}).text(vals[i][0]))  // key
                    .append($('<td>').css({'border': '0'}).text(vals[i][1]));                     // value
                tbody.append(tr);
            }
            table.append(tbody);
            // Put table in cell.
            this.$elem.append(table);
            console.debug("ValueListWidget.render.end");
            return this;
        }
    });
}( jQuery ) );