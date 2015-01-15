/**
 * KBase widget to display workspace object JSON.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'DataDump',
        version: '1.0.0',
        options: {
	    id: null,
	    ws: null,
	    auth: null
        },
	ws_url: window.kbconfig.urls.workspace,
	loading_image: "static/kbase/images/ajax-loader.gif",
        
	init: function(options) {
            this._super(options);
            return this.render();
        },
	
        render: function() {
	    var self = this;
	    var container = this.$elem;
	    var kbws = new Workspace(self.ws_url, {'token': self.options.auth});

	    container.empty();
	    container.append("<div><img src=\""+self.loading_image+"\">&nbsp;&nbsp;loading data...</div>");

	    kbws.get_objects([{ref: self.options.ws+"/"+self.options.id}], function(data) {
	        container.empty();
		var main = $('<div>');
		var str = JSON.stringify(data, undefined, 2);
		main.append($('<p>')
		    .css({'padding': '10px 20px'})
                    .append($('<pre>').text(str)));
		container.append(main);
	    }, function(data) {
		container.empty();
		var main = $('<div>');
		main.append($('<p>')
		    .css({'padding': '10px 20px'})
		    .text('[Error] '+data.error.message));
		container.append(main);
	    });
	    return self;
        }
    });
})(jQuery);
