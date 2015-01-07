/**
 * KBase widget to display an image.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'DataDump',
        version: '1.0.0',
        options: {
            data: null
        },
        init: function(options) {
            this._super(options);
            return this.render();
        },
        render: function() {
	    var main = $('<div>');
	    var str = JSON.stringify(this.options.data, undefined, 2);
	    main.append($('<p>')
		.css({'padding': '10px 20px'})
		.append($('<pre>').text(this.options.header)));
	    
            this.$elem.append(main);
            return this;
        }
    });
})(jQuery);
