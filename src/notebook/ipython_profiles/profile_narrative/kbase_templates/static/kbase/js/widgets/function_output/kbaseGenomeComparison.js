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

    wsUrl: "http://kbase.us/services/workspace/",
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
        var imgI = 0;
        var imgJ = 0;
        var scale = null;
        var stepPercent = 25;

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
            	var st = ' style="border: 0px; margin: 0px; padding: 0px;"';
            	var sr = ' style="border: 0px; margin: 0px; padding: 0px;"';
            	var sd = ' style="border: 0px; margin: 0px; padding: 1px;"';
            	table.append('<tr><td>' + 
            			'<center>' +
            			'<button id="'+pref+'btn-zi">Zoom +</button>'+
            			'&nbsp;' + 
            			'<button id="'+pref+'btn-zo">Zoom -</button>'+
            			'<br><br><table'+st+'><tr'+sr+'><td'+sd+'>' + 
            			'<button id="'+pref+'btn-mul">&#8598;</button>'+
            			'</td><td'+sd+'>' +
            			'<button id="'+pref+'btn-mu">&#8593;</button>'+
            			'</td><td'+sd+'>' + 
            			'<button id="'+pref+'btn-mur">&#8599;</button>'+
            			'</td></tr><tr'+sr+'><td'+sd+'>' +
            			'<button id="'+pref+'btn-ml">&#8592;</button>'+
            			'</td><td'+sd+'/><td'+sd+'>' +
            			'<button id="'+pref+'btn-mr">&#8594;</button>'+
            			'</td></tr><tr'+sr+'><td'+sd+'>' + 
            			'<button id="'+pref+'btn-mdl">&#8601;</button>'+
            			'</td><td'+sd+'>' +
            			'<button id="'+pref+'btn-md">&#8595;</button>'+
            			'</td><td'+sd+'>' + 
            			'<button id="'+pref+'btn-mdr">&#8600;</button>'+
            			'</td></tr></table></center>' +
            			'</td><td id="'+pref+'img-td"><img id="'+pref+'img" src=""/></td></tr>');
            	var refreshImage = function() {
            		var maxI = imgI + size * 100 / scale;
            		if (maxI > cmp.proteome1names.length)
                		maxI = cmp.proteome1names.length;
            		var maxJ = imgJ + size * 100 / scale;
            		if (maxJ > cmp.proteome2names.length)
            			maxJ = cmp.proteome2names.length;
            		imgI = maxI - size * 100 / scale;
            		imgJ = maxJ - size * 100 / scale;
            		if (imgI < 0)
            			imgI = 0;
            		if (imgJ < 0)
            			imgJ = 0;
            		imgI = Math.round(imgI);
            		imgJ = Math.round(imgJ);
            		var img = self.cmpImgUrl + "?ws=" + options.ws_name + "&id=" + options.ws_id + "&x=" + imgI + 
            				"&y=" + imgJ + "&w=" + size + "&sp=" + scale + "&token=" + encodeURIComponent(options.token);
            		$('#'+pref+'img').attr('src', img);
            	};
            	refreshImage();
            	$('#'+pref+'btn-zi').click(function() {
            		var xSize = Math.min(size, cmp.proteome1names.length * scale / 100);
            		var ySize = Math.min(size, cmp.proteome2names.length * scale / 100);
            		var centerI = imgI + xSize * 50 / scale;
            		var centerJ = imgJ + ySize * 50 / scale;
            		scale *= 1.5;
            		imgI = centerI - size * 50 / scale;
            		imgJ = centerJ - size * 50 / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-zo').click(function() {
            		var xSize = Math.min(size, cmp.proteome1names.length * scale / 100);
            		var ySize = Math.min(size, cmp.proteome2names.length * scale / 100);
            		var centerI = imgI + xSize * 50 / scale;
            		var centerJ = imgJ + ySize * 50 / scale;
            		scale /= 1.5;
            		imgI = centerI - size * 50 / scale;
            		imgJ = centerJ - size * 50 / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-mul').click(function() {
            		imgJ += size * stepPercent / scale;
            		imgI -= size * stepPercent / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-mu').click(function() {
            		imgJ += size * stepPercent / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-mur').click(function() {
            		imgJ += size * stepPercent / scale;
            		imgI += size * stepPercent / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-ml').click(function() {
            		imgI -= size * stepPercent / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-mr').click(function() {
            		imgI += size * stepPercent / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-mdl').click(function() {
            		imgJ -= size * stepPercent / scale;
            		imgI -= size * stepPercent / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-md').click(function() {
            		imgJ -= size * stepPercent / scale;
            		refreshImage();
            	});
            	$('#'+pref+'btn-mdr').click(function() {
            		imgJ -= size * stepPercent / scale;
            		imgI += size * stepPercent / scale;
            		refreshImage();
            	});
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
