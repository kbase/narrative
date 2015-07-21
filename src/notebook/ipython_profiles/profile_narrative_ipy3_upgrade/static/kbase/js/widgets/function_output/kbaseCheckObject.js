/**
 * KBase widget to display if workspace object exists.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'CheckObject',
        version: '1.0.0',
        options: {
	    id: null,
	    ws: null,
	    auth: null
        },
	ws_url: window.kbconfig.urls.workspace,
	loading_image: window.kbconfig.loading_gif,
        
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
	    console.log(self.options);

	    kbws.get_object_info([{ref: self.options.ws+"/"+self.options.id}], 0, function(data) {
	        container.empty();
		console.log(data);
		var main = $('<div>');
		var msg = "";
		if (data.length > 0) {
		    msg = "Object "+self.options.id+" sucessfully created in workspace "+self.options.ws;
		} else {
		    msg = "[Error] Object "+self.options.id+" not created in workspace "+self.options.ws;
		}
		main.append($('<p>')
		    .css({'padding': '10px 20px'})
                    .text(msg));
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
