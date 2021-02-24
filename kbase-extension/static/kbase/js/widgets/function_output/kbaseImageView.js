/**
 * KBase widget to display an image.
 */
(function($, undefined) {
    return KBWidget({
        name: 'ImageViewWidget',
        version: '1.0.0',
        options: {
            header: null,
            type: 'png',
            width: '300',
            legend: null,
            data: null
        },
        init: function(options) {
            this._super(options);
            return this.render();
        },
        render: function() {
            // creater main comtainer
            const main = $('<div>');
            // Create header message
            if (this.options.header !== null) {
                main.append($('<p>')
                    .css({'padding': '10px 20px'})
                    .append($('<pre>').text(this.options.header)));
            }
            // Create image
            if (this.options.data !== null) {
                const src = "data:image/"+this.options.type+";base64,"+this.options.data;
                const img = $('<img>')
                    .attr({'src': src, 'alt': 'Embedded Image'})
                    .css({'height': 'auto', 'width': 'auto', 'max-width': this.options.width+'px'});
                // add legend
                if (this.options.legend !== null) {
                    // create elements
                    const leg_src = "data:image/"+this.options.type+";base64,"+this.options.legend;
                    const leg_img = $('<img>')
                        .attr({'src': leg_src, 'alt': 'Embedded Image'})
                        .css({'height': 'auto', 'width': 'auto', 'max-width': '175px'});
                    const table = $('<table>')
                        .css({'margin-left': 'auto', 'margin-right': 'auto', 'border': '0'});
                    const tr = $('<tr>');
                    const td_leg = $('<td>');
                    const td_img = $('<td>');
                    // build them
                    td_leg.append(leg_img);
                    td_img.append(img);
                    tr.append(td_leg);
                    tr.append(td_img);
                    table.append(tr);
                    main.append(table);
                } else {
                    main.append(img);
                }
            }
            // put container in cell
            this.$elem.append(main);
            return this;
        }
    });
})(jQuery);