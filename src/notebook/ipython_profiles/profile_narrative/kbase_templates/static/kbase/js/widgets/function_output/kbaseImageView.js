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
                    .text(this.options.header))
            }
            // Create image
            if (this.options.data !== null) {
                var src = "data:image/"+this.options.type+";base64,"+this.options.data;
                var img = $('<img>')
                    .attr({'src': src, 'alt': 'Embedded Image'})
                    .css({'height': 'auto', 'width': 'auto', 'max-width': this.options.width+'px'});
                main.append(img)
            }
            // put container in cell
            this.$elem.append(main);
            return this;
        },

    });
})(jQuery);