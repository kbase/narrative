/**
 * KBase widget to display text.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'DisplayTextWidget',
        version: '1.0.0',
        options: {
            header: '',
            text: '',
            error: ''
        },
        init: function(options) {
            this._super(options);
            return this.render();
        },
        render: function() {
            // creater main comtainer
            var main = $('<div>');
            // this is an error message
            if (this.options.error !== '') {
                main.append($('<div>')
                    .css({'padding': '10px 20px', 'background-color': 'rgba(255,0,0,0.25)'})
                    .append($('<pre>').text('ERROR:\n'+this.options.error)));
            } else {
                // add header
                if (this.options.header !== '') {
                    main.append($('<p>')
                        .css({'padding': '10px 20px'})
                        .append($('<h3>').text(this.options.header)));
                }
                // add text
                if (this.options.text !== '') {
                    main.append($('<p>')
                        .css({'padding': '10px 20px'})
                        .append($('<pre>').text(this.options.text)));
                }
            }
            // put container in cell
            this.$elem.append(main);
            return this;
        }
    });
})(jQuery);