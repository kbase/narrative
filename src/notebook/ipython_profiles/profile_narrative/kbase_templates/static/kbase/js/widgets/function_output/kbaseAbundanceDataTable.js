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
	            auth: null,
	            name: 0
        },
	    ws_url: window.kbconfig.urls.workspace,
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
		            cnames[0] = "Annotation";
		            for (var c = 0; c < biom['columns'].length; c++) {
		                if (self.options.name == 0) {
			                cnames[c+1] = biom['columns'][c]['id'];
		                } else {
		                    cnames[c+1] = biom['columns'][c]['name'];
		                }
		            }
		            // add values
		            var tdata = new Array(matrix.length);
		            for (var r = 0; r < matrix.length; r++) {
			            tdata[r] = new Array(clength);
			            tdata[r][0] = biom['rows'][r]['id'];
			            for (var c = 0; c < matrix[r].length; c++) {
			                var value = matrix[r][c];
			                if (! value) {
				                value = "0";
			                }
			                tdata[r][c+1] = value
			            }
		            }
			        // TABLE
                    var tlen = 0;
	    		    if (window.hasOwnProperty('rendererTable') && rendererTable.length) {
				        tlen = rendererTable.length;
			        }
	   		        container.append("<div id='outputTable"+tlen+"' style='width: 95%;'></div>");
	   		        var tableTest = standaloneTable.create({index: tlen});
	  		        tableTest.settings.target = document.getElementById("outputTable"+tlen);
	    		    tableTest.settings.data = { header: cnames, data: tdata };
			        tableTest.settings.filter = { 0: { type: "text" } };
			        var mw = [ 120 ];
			        for (var i=1; i<cnames.length; i++) {
				        mw.push(130);
			        }
			        tableTest.settings.minwidths = mw;
			        tableTest.render(tlen);
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
		        dense[i] = Array.apply(null, new Array(cmax)).map(Number.prototype.valueOf, 0);
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
