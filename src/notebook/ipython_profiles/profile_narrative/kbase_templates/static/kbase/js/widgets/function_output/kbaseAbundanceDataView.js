/**
 * KBase widget to display table and boxplot of BIOM data
 */
(function($, undefined) {
    $.KBWidget({
        name: 'AbundanceDataView',
        parent: "kbaseAuthenticatedWidget",
        version: '1.0.0',
        token: null,
        options: {
	        id: null,
	        ws: null,
	        name: 0
        },
	    ws_url: window.kbconfig.urls.workspace,
	    loading_image: "static/kbase/images/ajax-loader.gif",
        
	    init: function(options) {
            this._super(options);
            return this;
        },
	
        render: function() {
	        var self = this;
	        var pref = this.uuidv4();

	        var container = this.$elem;
	        container.empty();
            if (self.token == null) {
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }
            container.append("<div><img src=\""+self.loading_image+"\">&nbsp;&nbsp;loading data...</div>");

	        var kbws = new Workspace(self.ws_url, {'token': self.token});
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
		            var tdata = [];
		            // get matrix
		            if (biom['matrix_type'] == 'sparse') {
			            matrix = self.sparse2dense(biom['data'], biom['shape'][0], biom['shape'][1]);
		            } else {
			            matrix = biom['data'];
		            }
		            // get column names
		            // build graph data
		            var divdata = new Array(colnum);
		            var colors = GooglePalette(colnum);
		            var clength = colnum + 1;
		            var cnames = new Array(clength)
		            cnames[0] = "Annotation";
		            for (var c = 0; c < colnum; c++) {
		                if (self.options.name == 0) {
			                cnames[c+1] = biom['columns'][c]['id'];
			                divdata[c] = {'name': biom['columns'][c]['id'], 'data': [], 'fill': colors[c]};
		                } else {
		                    if (biom['columns'][c].hasOwnProperty('name')) {
		                        cnames[c+1] = biom['columns'][c]['name'];
    		                    divdata[c] = {'name': biom['columns'][c]['name'], 'data': [], 'fill': colors[c]};
		                    } else {
		                        cnames[c+1] = biom['columns'][c]['id'];
    			                divdata[c] = {'name': biom['columns'][c]['id'], 'data': [], 'fill': colors[c]};
	                        }
		                }
		            }
		            // add values
		            var maxval = 0;
		            var tdata = new Array(rownum);
		            for (var r = 0; r < rownum; r++) {
			            tdata[r] = new Array(clength);
			            tdata[r][0] = biom['rows'][r]['id'];
			            for (var c = 0; c < colnum; c++) {
                            maxval = Math.max(maxval, matrix[r][c]);
                            divdata[c]['data'].push(matrix[r][c]);
			                var value = Math.round(matrix[r][c] * 1000) / 1000;
			                if (! value) {
				                value = "0";
			                }
                            tdata[r][c+1] = value;
			            }
		            }
		            // set tabs
		            var tlen = 0;
	    		    if (window.hasOwnProperty('rendererTable') && rendererTable.length) {
				        tlen = rendererTable.length;
			        }
			        var glen = 0;
                    if (window.hasOwnProperty('rendererGraph') && rendererGraph.length) {
                        glen = rendererGraph.length;
                    }
		            var tabs = "<ul class='nav nav-tabs'>"+
		                       "<li class='active'><a data-toggle='tab' href='#outputGraph"+glen+"'>BoxPlots</a></li>"+
		                       "<li><a data-toggle='tab' href='#outputTable"+tlen+"'>Abundance Table</a></li></ul>";
		            var divs = "<div class='tab-content'>"+
		                       "<div class='tab-pane active' id='outputGraph"+glen+"' style='width: 95%;'></div>"+
		                       "<div class='tab-pane' id='outputTable"+tlen+"' style='width: 95%;'></div></div>";
		            container.append(tabs+divs);
			        // TABLE
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
			        // DEVIATION PLOT
			        var ab_type = 'normalized';
			        if (maxval > 1) {
			            ab_type = 'raw';
			        }
                    var devTest = standaloneGraph.create({index: glen});
			        devTest.settings.target = document.getElementById("outputGraph"+glen);
                    devTest.settings.data = divdata;
                    devTest.settings.y_title = ab_type+' abundance';
                    devTest.settings.show_legend = false;
                    devTest.settings.height = 400;
                    devTest.settings.chartArea = [ 0.1, 0.1, 0.95, 0.8 ];
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
