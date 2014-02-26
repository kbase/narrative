/**
 * KBase widget to display an image.
 */
(function($, undefined) {
    $.KBWidget({
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
            var main = $('<div>');
            // Create header message
            if (this.options.header !== null) {
                main.append($('<p>')
                    .css({'padding': '10px 20px'})
                    .append($('<pre>').text(this.options.header)));
            }
            // Create image
            if (this.options.data !== null) {
                var src = "data:image/"+this.options.type+";base64,"+this.options.data;
                var img = $('<img>')
                    .attr({'src': src, 'alt': 'Embedded Image'})
                    .css({'height': 'auto', 'width': 'auto', 'max-width': this.options.width+'px'});
                // add legend
                if (this.options.legend !== null) {
                    // create elements
                    var leg_src = "data:image/"+this.options.type+";base64,"+this.options.legend;
                    var leg_img = $('<img>')
                        .attr({'src': leg_src, 'alt': 'Embedded Image'})
                        .css({'height': 'auto', 'width': 'auto', 'max-width': '175px'});
                    var table = $('<table>')
                        .css({'margin-left': 'auto', 'margin-right': 'auto', 'border': '0'});
                    var tr = $('<tr>');
                    var td_leg = $('<td>');
                    var td_img = $('<td>');
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
        },

    });
})(jQuery);