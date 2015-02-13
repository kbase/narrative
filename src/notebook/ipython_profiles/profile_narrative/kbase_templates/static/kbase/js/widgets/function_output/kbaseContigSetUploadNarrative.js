(function( $, undefined ) {

$.KBWidget({
    name: "ContigSetUploadWidget",     
    parent: "kbaseAuthenticatedWidget",
    version: "1.0.0",
	token: null,
	ws_name: null,
	contig_set: null,
    options: {
    	ws_name: null,
    	contig_set: null
    },

    wsUrl: window.kbconfig.urls.workspace,
    uploadUrl: "https://kbase.us/services/xxx/uploader",

    init: function(options) {
        this._super(options);
        this.ws_name = options.ws_name;
        this.contig_set = options.contig_set;
        return this;
    },
    
    render: function() {
        var self = this;
        var container = this.$elem;
    	container.empty();
        if (self.token == null) {
        	container.append("<div>[Error] You're not logged in</div>");
        	return;
        }
    	var pref = this.uuid();
        var kbws = new Workspace(this.wsUrl, {'token': self.token});
    	var panel = $('<div>'+
    			'Contig Set Target ID: ' + self.contig_set + '<br><br>' +
    			'<form id="'+pref+'form" action="' + self.uploadUrl + '" enctype="multipart/form-data" method="post" target="'+pref+'hidden-iframe">'+
    			'<input type="hidden" name="token" value="' + self.token + '">'+
    			'<input type="hidden" name="ws" value="' + self.ws_name + '">'+
    			'<input type="hidden" name="id" value="' + self.contig_set + '">'+
    			'<input type="hidden" name="type" value="contigfasta">'+
    			'<input type="file" name="file"><br>'+
    			'<input type="submit" value="Upload">'+
    			'</form><br>'+
    			'<iframe id="'+pref+'frm" name="'+pref+'hidden-iframe" style="display: none; width:800px; height: 100px; overflow-x: scroll; overflow-y: scroll"></iframe>'+
    			'</div>');
    	container.append(panel);
    	var ifrm = document.getElementById(pref+'frm');
    	ifrm = (ifrm.contentWindow) ? ifrm.contentWindow : (ifrm.contentDocument.document) ? ifrm.contentDocument.document : ifrm.contentDocument;
    	ifrm.document.open();
    	ifrm.document.write("<html><body>Please wait...</body></html>");
    	ifrm.document.close();
    	$('#'+pref+'form').submit(function( event ) {
    		$('#'+pref+'frm').show();
    	});
        return this;
    },

    loggedInCallback: function(event, auth) {
        this.token = auth.token;
        this.render();
        return this;
    },

    loggedOutCallback: function(event, auth) {
        this.token = null;
        this.render();
        return this;
    },

    uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
            function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
    }
})
}( jQuery ) );
