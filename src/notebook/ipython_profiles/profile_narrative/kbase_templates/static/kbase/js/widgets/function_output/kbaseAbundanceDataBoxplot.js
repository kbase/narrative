/**
 * KBase widget to display table of BIOM data
 */
(function($, undefined) {
    $.KBWidget({
            name: 'AbundanceDataBoxplot',
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
		            var colnum = biom['columns'].length;
		            var rownum = biom['rows'].length;
		            // get matrix
		            if (biom['matrix_type'] == 'sparse') {
			            matrix = self.sparse2dense(biom['data'], biom['shape'][0], biom['shape'][1]);
		            } else {
			            matrix = biom['data'];
		            }
		            // build data
		            var divdata = new Array(colnum);
		            var colors = GooglePalette(colnum);
		            // names
		            for (var c = 0; c < colnum; c++) {
		                if (self.options.name == 0) {
		                    divdata[c] = {'name': biom['columns'][c]['id'], 'data': [], 'fill': colors[c]};
	                    } else {
	                        divdata[c] = {'name': biom['columns'][c]['name'], 'data': [], 'fill': colors[c]};
	                    }
	                }
		            // values
		            for (var r = 0; r < rownum; r++) {
		                for (var c = 0; c < colnum; c++) {
		                    divdata[c]['data'].push(matrix[r][c]);
	                    }
	                }
                    // DEVIATION PLOT
			        var glen = 0;
                    if (window.hasOwnProperty('rendererGraph') && rendererGraph.length) {
                        glen = rendererGraph.length;
                    }
			        container.append("<div id='outputGraph"+glen+"' style='width: 95%;'></div>");
                    var devTest = standaloneGraph.create({index: glen});
			        devTest.settings.target = document.getElementById("outputGraph"+glen);
                    devTest.settings.data = divdata;
                    devTest.settings.show_legend = true;
			        devTest.settings.height = 400;
			        devTest.settings.type = "deviation";
                    devTest.render(glen);
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
