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
            error: '',
            padding: '10px 20px'
        },
        init: function(options) {
            this._super(options);
            this.padding = options.padding;
            return this.render();
        },
        render: function() {
            // creater main comtainer
            var main = $('<div>').css({'max-height': '600px', 'overflow-y': 'scroll'});
            // add header
            if (this.options.header !== '') {
                main.append($('<div>')
                    .css({'padding': this.padding})
                    .append($('<h3>').text(this.options.header)));
            }
            // add text
            if (this.options.text !== '') {
                main.append($('<div>')
                    .css({'font-size': 'small'})
                    .append($('<pre>').text(this.options.text)));
            }
            // add error
            if (this.options.error !== '') {
                main.append($('<div>')
                    .css({'font-size': 'small', 'padding': '10px 20px', 'background-color': 'rgba(255,0,0,0.25)'})
                    .append($('<pre>').text('ERROR:\n'+this.options.error)));
            }
            // put container in cell
            this.$elem.append(main);
            return this;
        }
    });
})(jQuery);