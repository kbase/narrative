(function( $, undefined ) {
    $.KBWidget({
        name: "MetagenomeListUploadWidget",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        ws: null,
        id: null,
        token: null,
        options: {
            ws: null,
            id: null
        },
        wsUrl: "https://kbase.us/services/ws/",

        init: function(options) {
            this._super(options);
            this.ws = options.ws;
            this.id = options.id;
            return this;
        },
        
        render: function() {
            var self = this;
        	var pref = this.uuid();

            var container = this.$elem;
        	container.empty();
            if (self.token == null) {
            	container.append("<div>[Error] You're not logged in</div>");
            	return;
            }

            container.append('<table class="table table-striped table-bordered" \
            		style="margin-left: auto; margin-right: auto;" id="'+pref+'mglu-table"/>');
            var table = $('#'+pref+'mglu-table');
            table.append('<tr><td>Target Workspace</td><td>' + self.ws + '</td></tr>');
            table.append('<tr><td>Target Metagenome List Name</td><td>' + self.id + '</td></tr>');
            table.append('<tr><td>URL prefix</td> \
            		<td><input id="'+pref+'mglu-tf" type="text" style="width:100%;"></td></tr>');
            table.append('<tr><td>Data to store<br>(one ID per line)</td> \
            		<td><textarea id="'+pref+'mglu-ta" style="width:100%;" cols="80" rows="8"></textarea></td></tr>');
            container.append('<button class="btn" id="'+pref+'mglu-btn">Save in workspace</button>');
            container.append('&nbsp;<button class="btn" id="'+pref+'xmpl-btn">Show an example in text area above</button>');
            $('#'+pref+'mglu-btn').click(function() {
            	var urlPref = "" + $('#'+pref+'mglu-tf').val();
            	if (urlPref.length > 0 && urlPref.substr(urlPref.length-1) != "/") {
            		urlPref += "/";
            	}
            	var val = $('#'+pref+'mglu-ta').val();
            	var lines = val.split(/\r\n|\r|\n/g);
            	var data = [];
            	for (var pos in lines) {
            		var line = lines[pos];
            		if (line == '')
            			continue;
            		data.push({URL: urlPref+line, ID: line});
            	}
            	var today = new Date();
            	var dd = today.getDate();
            	var mm = today.getMonth()+1;
            	var yyyy = today.getFullYear();
            	var hours = today.getHours();
            	var minutes = today.getMinutes();
            	var seconds = today.getSeconds();
            	if (dd<10) {dd='0'+dd;}
            	if (mm<10) {mm='0'+mm;}
            	date = ''+yyyy+'-'+mm+'-'+dd+' '+hours+':'+minutes+':'+seconds;
            	var mgl = {
            			created: date,
            			name: self.id,
            			type: 'list',
            			members: data
            	};
            	var kbws = new Workspace(self.wsUrl, {'token': self.token});
            	kbws.save_objects({workspace: self.ws, objects: [{type: 'Communities.Collection', name: self.id, data: mgl}]}, function(data) {
            		alert('Data was successfuly stored in workspace');
            	}, function(data) {
            		alert('Error: ' + data.error.message);
            	});
            });
            $('#'+pref+'xmpl-btn').click(function() {
            	$('#'+pref+'mglu-tf').val("http://kbase.us/services/communities/metagenome/");
            	var text = "mgm4549802.3\nmgm4549784.3\nmgm4549797.3\nmgm4549806.3\nmgm4549812.3\n";
            	var val = $('#'+pref+'mglu-ta').val();
            	if (val != "")
            		val += "\n";
            	val += text;
            	$('#'+pref+'mglu-ta').val(val);
            });
            return this;
        },
        
        getData: function() {
        	return {
        		type: "NarrativeMetagenomeListUploadCard",
        		id: this.ws + "." + this.id,
        		workspace: this.options.ws_name,
        		title: "Metagenome List Upload Widget"
        	};
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
    });
})( jQuery );
