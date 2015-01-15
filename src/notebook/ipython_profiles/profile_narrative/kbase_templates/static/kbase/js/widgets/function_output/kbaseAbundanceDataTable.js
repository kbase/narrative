/**
 * KBase widget to display table of BIOM data
 */
(function($, undefined) {
    $.KBWidget({
        name: 'AbundanceDataTable',
        version: '1.0.0',
        options: {
	    id: null,
	    ws: null,
	    auth: null
        },
	ws_url: "https://kbase.us/services/ws/",
	loading_image: "static/kbase/images/ajax-loader.gif",
        
	init: function(options) {
            this._super(options);
            return this.render();
        },
	
        render: function() {
	    var self = this;
	    var pref = this.uuidv4();
	    var container = this.$elem;
	    var kbws = new Workspace(self.ws_url, {'token': self.options.auth});

	    container.empty();
	    container.append("<div><img src=\""+self.loading_image+"\">&nbsp;&nbsp;loading data...</div>");

	    kbws.get_objects([{ref: self.options.ws+"/"+self.options.id}], function(data) {
	        container.empty();
		// parse data
		if (data.length == 0) {
		    var msg = "[Error] Object "+self.options.id+" does not exist in workspace "+self.options.ws;
		    container.append('<div><p>'+msg+'>/p></div>');
		} else {
		    var biom = data[0]['data'];
		    var matrix = [];
		    var tdata = [];
		    // get matrix
		    if (biom['matrix_type'] == 'sparse') {
			matrix = self.sparse2dense(biom['data'], biom['shape'][0], biom['shape'][1]);
		    } else {
			matrix = biom['data'];
		    }
		    // get column names
		    var clength = biom['columns'].length + 1;
		    var cnames = new Array(clength)
		    cnames[0] = {sTitle: "Annotation"};
		    for (var c = 0; c < biom['columns'].length; c++) {
			cnames[c+1] = {sTitle: biom['columns'][c]['id']};
		    }
		    // add values
		    var tdata = new Array(matrix.length);
		    for (var r = 0; r < matrix.length; r++) {
			tdata[r] = new Array(clength);
			tdata[r][0] = biom['rows'][r]['id'];
			for (var c = 0; c < matrix[r].length; c++) {
			    var value = matrix[r][c];
			    if (! value) {
				value = 0;
			    }
			    tdata[r][c+1] = value
			}
		    }
		    // create table
		    var table_opts = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aoColumns": cnames,
                        "aaData": tdata,
                        "oLanguage": {
                            "sSearch": "Search annotations:",
                            "sEmptyTable": "No annotations found."
                        }
                    };
		    container.append('<div><table cellpadding="0" cellspacing="0" border="0" id="'+pref+'_table" class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/></div>');
		    $('#'+pref+'_table').dataTable(table_opts);
		}
	    }, function(data) {
		container.empty();
		var main = $('<div>');
		main.append($('<p>')
		    .css({'padding': '10px 20px'})
		    .text('[Error] '+data.error.message));
		container.append(main);
	    });
	    return self;
        },

	sparse2dense: function(sparse, rmax, cmax) {
	    var dense = new Array(rmax);
	    for (var i = 0; i < rmax; i++) {
		dense[i] = new Array(cmax);
	    }
	    // 0 values are undefined
	    for (var i = 0; i < sparse.length; i++) {
		dense[ sparse[i][0] ][ sparse[i][1] ] = sparse[i][2];
	    }
	    return dense;
	},

	uuidv4: function(a,b) {
	    for (b=a=''; a++<36; b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');
	    return b;
	}
    });
})(jQuery);
