(function( $, undefined ) {

$.KBWidget({
    name: "GenomeComparisonWidget",     
    version: "1.0.0",
    options: {
    	token: null,
    	ws_name: null,
    	job_id: null,
    	ws_id: null
    },

    wsUrl: "http://140.221.84.209:7058/",
    jobSrvUrl: "http://140.221.84.180:7083/",
    cmpImgUrl: "http://140.221.85.98:8284/image",
    timer: null,

    init: function(options) {
        var self = this;
        this._super(options);
        var container = this.$elem;
    	var pref = (new Date()).getTime();
        var kbws = new workspaceService(this.wsUrl);
        var jobSrv = new UserAndJobState(this.jobSrvUrl, {'token': options.token});
        var size = 500;
        var scale = null;

        var dataIsReady = function() {
            kbws.get_object({auth: options.token, workspace: options.ws_name, id: options.ws_id, 
            				 type: 'ProteomeComparison'}, function(data) {
            	$('.loader-table').remove();
            	var cmp = data.data;
            	var table = $('<table/>')
            		.addClass('table table-bordered')
            		.css({'margin-left': 'auto', 'margin-right': 'auto'});
            	container.append(table);
            	var createTableRow = function(name, value) {
            		return "<tr><td>" + name + "</td><td>" + value + "</td></tr>";
            	};
            	table.append(createTableRow("Comparison object", options.ws_id));
            	table.append(createTableRow("Genome1 (x-axis)", cmp.genome1id + " (" + cmp.proteome1names.length + " genes)"));
            	table.append(createTableRow("Genome2 (y-axis)", cmp.genome2id + " (" + cmp.proteome2names.length + " genes)"));
            	scale = size * 100 / Math.max(cmp.proteome1names.length, cmp.proteome2names.length);
            	var img = self.cmpImgUrl + "?ws=" + options.ws_name + "&id=" + options.ws_id + "&x=0&y=0&w=" + 
            		size + "&sp=" + scale + "&token=" + encodeURIComponent(options.token);
            	table.append(createTableRow('', '<img src="'+img+'"/>'));
            	//table.append('<tr><td id="'+pref+'btns-td"/><td id="'+pref+'img-td"><img src="'+img+'"/></td></tr>'));
            	//var btnsTd = $('#'+pref+'btns-td');
            	//var btnZoomIn = btnsTd.append("<button>Zoom in</button");
            }, function(data) {
    			alert("Error: " + data.error.message)
            });
        };
    	if (options.job_id == null) {
    		dataIsReady();
    	} else {
        	var panel = $('<div class="loader-table"/>');
        	container.append(panel);
        	var table = $('<table class="table table-striped table-bordered" \
        			style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
        	panel.append(table);
        	table.append('<tr><td>Job was created with id</td><td>'+options.job_id+'</td></tr>');
        	table.append('<tr><td>Output result will have the id</td><td>'+options.ws_id+'</td></tr>');
        	table.append('<tr><td>Current job state is</td><td id="'+pref+'job"></td></tr>');
        	var timeLst = function(event) {
        		jobSrv.get_job_status(options.job_id, function(data) {
        			var status = data[2];
        			var complete = data[5];
        			var wasError = data[6];
    				var tdElem = $('#'+pref+'job');
    				tdElem.html(status);
        			if (complete === 1) {
        				clearInterval(self.timer);
        				if (wasError === 0) {
            				dataIsReady();
        				}
        			}
        		}, function(data) {
        			alert("Error: " + data.error.message)
        		});
        	};
        	timeLst();
        	self.timer = setInterval(timeLst, 5000);
    	}
        return this;
    }  //end init

})
}( jQuery ) );
