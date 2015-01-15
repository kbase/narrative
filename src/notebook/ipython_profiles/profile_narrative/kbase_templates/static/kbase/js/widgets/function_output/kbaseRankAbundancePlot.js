/**
 * KBase widget to display table of BIOM data
 */
(function($, undefined) {
    $.KBWidget({
            name: 'RankAbundancePlot',
            version: '1.0.0',
            options: {
	            id: null,
	            ws: null,
	            auth: null,
	            name: 0,
	            top: "10",
	            order: "average"
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
		            var rdata  = new Array(rownum);
		            // get matrix
		            if (biom['matrix_type'] == 'sparse') {
			            matrix = self.sparse2dense(biom['data'], biom['shape'][0], biom['shape'][1]);
		            } else {
			            matrix = biom['data'];
		            }
		            // get row data / stats
		            for (var r = 0; r < rownum; r++) {
		                var rowtemp = [ biom['rows'][r]['id'], 0, 0, 0 ]; // name, sum, average, max
                        for (var i = 0; i < colnum; i++) {
                            rowtemp[1] += matrix[r][i];
                            rowtemp.push(matrix[r][i])
                        }
                        rowtemp[2] = rowtemp[1] / colnum;
                        rowtemp[3] = Math.max.apply(null, matrix[r]);
		                rdata[r] = rowtemp;
	                }
	                var bardebug = new Array(10);
	                for (var i = 0; i < 10; i++) {
	                    bardebug[i] = rdata[i];
                    }
		            // sort by a metagenome or by sum / average / max
		            if (self.options.order == 'sum') {
		                rdata.sort(function(a,b) { return b[1] - a[1]; });
		            } else if (self.options.order == 'average') {
		                rdata.sort(function(a,b) { return b[2] - a[2]; });
	                } else if (self.options.order == 'max') {
	                    rdata.sort(function(a,b) { return b[3] - a[3]; });
                    } else {
                        var order_pos = 4;
		                if (isPositiveInteger(self.options.order)) {
		                    order_pos = parseInt(self.options.order, 10) + 3;
		                }
		                if ((order_pos - 1) > rdata.length) {
		                    order_pos = 4;
		                }
		                rdata.sort(function(a,b) { return b[order_pos] - a[order_pos]; });
                    }
		            // build data
		            var count = parseInt(self.options.top, 10);
		            var colors = GooglePalette(colnum);
		            var bardata = new Array(colnum);
		            var barlabels = new Array(count);
		            // names
		            for (var c = 0; c < colnum; c++) {
		                if (self.options.name == 0) {
		                    bardata[c] = {'name': biom['columns'][c]['id'], 'data': [], 'fill': colors[c]};
	                    } else {
	                        bardata[c] = {'name': biom['columns'][c]['name'], 'data': [], 'fill': colors[c]};
	                    }
	                }
		            // values
		            for (var r = 0; r < count; r++) {
		                barlabels[r] = rdata[r][0];
		                for (var c = 0; c < colnum; c++) {
		                    bardata[c]['data'].push(rdata[r][c+4]);
	                    }
	                }
			        // BARCHART
			        var glen = 0;
                    if (window.hasOwnProperty('rendererGraph') && rendererGraph.length) {
                        glen = rendererGraph.length;
                    }
			        container.append("<div id='outputGraph"+glen+"' style='width: 95%;'></div>");
			        var barTest = standaloneGraph.create({index: glen});
			        barTest.settings.target = document.getElementById("outputGraph"+glen);
			        barTest.settings.data = bardata;
			        barTest.settings.show_legend = true;
			        barTest.settings.x_labels = barlabels;
			        barTest.settings.x_labels_rotation = '340';
			        barTest.settings.height = 500;
			        barTest.settings.type = 'column';
			        barTest.render(glen);
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
	    
	    isPositiveInteger: function(str) {
            return /^[1-9]\d*$/.test(str);
        },

	    uuidv4: function(a,b) {
	        for (b=a=''; a++<36; b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');
	        return b;
	    }
    });
})(jQuery);
