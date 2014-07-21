(function( $, undefined ) {

$.KBWidget({
    name: "GenomeComparisonWidget",
    parent: "kbaseAuthenticatedWidget",
    version: "1.0.0",
	ws_name: null,
	job_id: null,
	ws_id: null,
    options: {
    	ws_name: null,
    	job_id: null,
    	ws_id: null
    },

    wsUrl: "https://kbase.us/services/ws/",  //"http://dev04.berkeley.kbase.us:7058",
    jobSrvUrl: "https://kbase.us/services/userandjobstate/",
    cmpImgUrl: "https://kbase.us/services/genome_comparison/image",  //"http://dev06.berkeley.kbase.us:8283/image",
    loadingImage: "static/kbase/images/ajax-loader.gif",
    timer: null,
    geneRows: 21,
    geneRowH: 21,
	pref: null,
    size: 500,
    imgI: 0,
    imgJ: 0,
    scale: null,
    stepPercent: 25,
    geneI: -1,
    dirI: 1,
    geneJ: -1,
    dirJ: 1,
    cmp: null,
    cmp_ref: null,

    init: function(options) {
        this._super(options);
        this.ws_name = options.ws_name;
        this.job_id = options.job_id;
        this.ws_id = options.ws_id;
    	this.pref = this.uuid();
        return this;
    },
    
    render: function() {
        var self = this;
        var container = this.$elem;
    	container.empty();
        if (!self.authToken()) {
        	container.append("<div>[Error] You're not logged in</div>");
        	return;
        }

        var kbws = new Workspace(this.wsUrl, {'token': self.authToken()});
        var jobSrv = new UserAndJobState(this.jobSrvUrl, {'token': self.authToken()});

        var dataIsReady = function() {
        	var cmp_ref = self.cmp_ref;
        	if (!cmp_ref)
        		cmp_ref = self.ws_name + "/" + self.ws_id;
            kbws.get_objects([{ref: cmp_ref}], function(data) {
            	self.cmp = data[0].data;
            	var info = data[0].info;
            	self.cmp_ref = info[6] + "/" + info[0] + "/" + info[4];
            	cmpIsLoaded();
        	}, function(data) {
            	var tdElem = $('#'+self.pref+'job');
				tdElem.html("Error accessing comparison object: " + data.error.message);
            });
        };
        var cmpIsLoaded = function() {
        	container.empty();
            container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading comparison data...</div>");
        	kbws.get_object_subset([{ref: self.cmp.genome1ref, included: ["scientific_name"]},
        	                        {ref: self.cmp.genome2ref, included: ["scientific_name"]}], function(data) {
            	var genome1id = data[0].data.scientific_name;
            	var genome2id = data[1].data.scientific_name;
        		container.empty();
            	var table = $('<table/>')
            		.addClass('table table-bordered')
            		.css({'margin-left': 'auto', 'margin-right': 'auto'});
            	container.append(table);
            	var createTableRow = function(name, value) {
            		return "<tr><td>" + name + "</td><td>" + value + "</td></tr>";
            	};
            	var count1hits = 0;
    			for (var i in self.cmp.data1) {
    				if (self.cmp.data1[i].length > 0)
    					count1hits++;
    			}
            	var count2hits = 0;
    			for (var i in self.cmp.data2) {
    				if (self.cmp.data2[i].length > 0)
    					count2hits++;
    			}
            	table.append(createTableRow("Comparison object", self.ws_id));
            	table.append(createTableRow("Genome1 (x-axis)", genome1id + 
            			" (" + self.cmp.proteome1names.length + " genes, " + count1hits + " have hits)"));
            	table.append(createTableRow("Genome2 (y-axis)", genome2id + 
            			" (" + self.cmp.proteome2names.length + " genes, " + count2hits + " have hits)"));
            	if (self.scale == null)
            		self.scale = self.size * 100 / Math.max(self.cmp.proteome1names.length, self.cmp.proteome2names.length);
            	var st = ' style="border: 0px; margin: 0px; padding: 0px;"';
            	var sr = ' style="border: 0px; margin: 0px; padding: 0px;"';
            	var sd = ' style="border: 0px; margin: 0px; padding: 1px;"';
            	var sb = ' style="width: 27px;"';
            	table.append('<tr><td>' + 
            			'<center>' +
            			'<button id="'+self.pref+'btn-zi">Zoom +</button>'+
            			'&nbsp;' + 
            			'<button id="'+self.pref+'btn-zo">Zoom -</button>'+
            			'<br><br><table'+st+'><tr'+sr+'><td'+sd+'>' + 
            			'<button id="'+self.pref+'btn-mul"'+sb+'>&#8598;</button>'+
            			'</td><td'+sd+'>' +
            			'<button id="'+self.pref+'btn-mu"'+sb+'>&#8593;</button>'+
            			'</td><td'+sd+'>' + 
            			'<button id="'+self.pref+'btn-mur"'+sb+'>&#8599;</button>'+
            			'</td></tr><tr'+sr+'><td'+sd+'>' +
            			'<button id="'+self.pref+'btn-ml"'+sb+'>&#8592;</button>'+
            			'</td><td'+sd+'/><td'+sd+'>' +
            			'<button id="'+self.pref+'btn-mr"'+sb+'>&#8594;</button>'+
            			'</td></tr><tr'+sr+'><td'+sd+'>' + 
            			'<button id="'+self.pref+'btn-mdl"'+sb+'>&#8601;</button>'+
            			'</td><td'+sd+'>' +
            			'<button id="'+self.pref+'btn-md"'+sb+'>&#8595;</button>'+
            			'</td><td'+sd+'>' + 
            			'<button id="'+self.pref+'btn-mdr"'+sb+'>&#8600;</button>'+
            			'</td></tr></table></center>' +
            			'</td><td><table'+st+'><tr'+sr+'>' +
            			'<td width="'+(self.size+100)+'"'+sd+'>'+
            			'<div style="position:relative">'+
            			'<img id="'+self.pref+'img" src=""/>'+
            			'<div id="'+self.pref+'rect" style="position:absolute; z-index: 2; border: 1px; border-style: solid; border-color: red; background-color: transparent; display:none; pointer-events:none;"/>'+
            			'</div>'+
            			'</td>'+
            			'<td width="300"'+sd+'><table id="'+self.pref+'genes"'+st+'/></td></tr></table></td></tr>');
            	self.refreshImage();
            	var zoom = function(mult) {
            		var xSize = Math.min(self.size, self.cmp.proteome1names.length * self.scale / 100);
            		var ySize = Math.min(self.size, self.cmp.proteome2names.length * self.scale / 100);
            		var centerI = self.imgI + xSize * 50 / self.scale;
            		var centerJ = self.imgJ + ySize * 50 / self.scale;
            		self.scale *= mult;
            		self.imgI = centerI - self.size * 50 / self.scale;
            		self.imgJ = centerJ - self.size * 50 / self.scale;
            		self.refreshImage();
            	};
            	$('#'+self.pref+'btn-zi').click(function() {
            		zoom(1.5);
            	});
            	$('#'+self.pref+'btn-zo').click(function() {
            		zoom(1.0/1.5);
            	});
            	var move = function(yUp,xRt) {
            		self.imgJ += yUp * self.size * self.stepPercent / self.scale;
            		self.imgI += xRt * self.size * self.stepPercent / self.scale;
            		self.refreshImage();
            	};
            	$('#'+self.pref+'btn-mul').click(function() {
            		move(1,-1);
            	});
            	$('#'+self.pref+'btn-mu').click(function() {
            		move(1,0);
            	});
            	$('#'+self.pref+'btn-mur').click(function() {
            		move(1,1);
            	});
            	$('#'+self.pref+'btn-ml').click(function() {
            		move(0,-1);
            	});
            	$('#'+self.pref+'btn-mr').click(function() {
            		move(0,1);
            	});
            	$('#'+self.pref+'btn-mdl').click(function() {
            		move(-1,-1);
            	});
            	$('#'+self.pref+'btn-md').click(function() {
            		move(-1,0);
            	});
            	$('#'+self.pref+'btn-mdr').click(function() {
            		move(-1,1);
            	});
            	
            	var hitSearch = function(e) {
            		var scrX = e.pageX;
            		var scrY = e.pageY;
            		if ((!scrX) && (!scrY) && e.clientX && e.clientY) {
            			scrX = e.clientX + document.body.scrollLeft
            				+ document.documentElement.scrollLeft;
            			scrY = e.clientY + document.body.scrollTop
            				+ document.documentElement.scrollTop;
            		}
            		var parentOffset = $('#'+self.pref+'img').offset();
            		var relX = scrX - parentOffset.left - 35;
            		var relY = scrY - parentOffset.top;
            		var xSize = Math.min(self.size, self.cmp.proteome1names.length * self.scale / 100);
            		var ySize = Math.min(self.size, self.cmp.proteome2names.length * self.scale / 100);
            		var bestDist = -1;
            		var bestI = -1;
            		var bestJ = -1;
            		if (relX >= 0 && relX <= xSize && relY >= 0 && relY <= ySize) {
            			for (var i in self.cmp.data1) {
            				var x = (i - self.imgI) * self.scale / 100;
                    		if (x >= 0 && x < xSize && Math.abs(relX - x) <= 2) {
                    			//alert("x=" + x + ", i=" + i);
                				for (var tuplePos in self.cmp.data1[i]) {
                					var tuple = self.cmp.data1[i][tuplePos];
                					var j = tuple[0];
                    				var y = ySize + 1 - (j - self.imgJ) * self.scale / 100;
                            		if (y >= 0 && y < ySize && Math.abs(relY - y) <= 2) {
                            			var dist = Math.sqrt((relX - x) * (relX - x) + (relY - y) * (relY - y));
                            			if (bestDist < 0 || bestDist > dist) {
                            				bestDist = dist;
                            				bestI = i;
                            				bestJ = j;
                            			}
                            		}
                				}
                    		}
            			}
            		}
            		return {scrX: scrX, scrY: scrY, relX: relX, relY: relY, bestDist: bestDist, bestI: bestI, bestJ: bestJ};
            	};
            	            	
            	$('#'+self.pref+'img').hover(
            			function() {
            				$('#widget-tooltip').show();
            			},
            			function() {
            				$('#widget-tooltip').hide();
            			}
            	).mousemove(function(e) {
            		var hit = hitSearch(e);
    				var tip = $('#widget-tooltip');
            		if (Number(hit.bestDist) >= 0) {
            			var msg = 'X-axis: ' + self.cmp.proteome1names[Number(hit.bestI)] + 
            				', Y-axis: ' + self.cmp.proteome2names[Number(hit.bestJ)] +
            				'<br>click to see detailes...';
            			tip.html(msg);
            			tip.css({
            				'top': (Number(hit.scrY) + 10) + 'px',
            				'left': (Number(hit.scrX) + 10) + 'px'
            			});
            			tip.show();
            			return;
            		}
    				tip.hide();
        			tip.html('');
            	}).click(function(e) {
            		var hit = hitSearch(e);
            		if (Number(hit.bestDist) >= 0) {
            			self.geneI = Number(hit.bestI);
            			self.geneJ = Number(hit.bestJ);
            		} else {
            			self.geneI = -1;
            			self.geneJ = -1;
            		}
            		self.refreshGenes();
            	});
            }, function(data) {
            	var tdElem = $('#'+self.pref+'job');
				tdElem.html("Error accessing genome objects: " + data.error.message);
            });
        };
    	if (self.job_id == null || self.cmp_ref != null) {
    		dataIsReady();
    	} else {
        	var panel = $('<div class="loader-table"/>');
        	container.append(panel);
        	var table = $('<table class="table table-striped table-bordered" \
        			style="margin-left: auto; margin-right: auto;" id="'+self.pref+'overview-table"/>');
        	panel.append(table);
        	table.append('<tr><td>Job was created with id</td><td>'+self.job_id+'</td></tr>');
        	table.append('<tr><td>Output result will have the id</td><td>'+self.ws_id+'</td></tr>');
        	table.append('<tr><td>Current job state is</td><td id="'+self.pref+'job"></td></tr>');
        	var timeLst = function(event) {
        		jobSrv.get_job_status(self.job_id, function(data) {
        			var status = data[2];
        			var complete = data[5];
        			var wasError = data[6];
    				var tdElem = $('#'+self.pref+'job');
    				tdElem.html(status);
				if (status === 'running') {
					tdElem.html(status+"... &nbsp &nbsp <img src=\""+self.loadingImage+"\">");
                                }
        			if (complete === 1) {
        				clearInterval(self.timer);
					
        				if (wasError === 0) {
        					dataIsReady();
        				}
        			}
        		}, function(data) {
    				clearInterval(self.timer);
    				var tdElem = $('#'+self.pref+'job');
    				tdElem.html("Error accessing job status: " + data.error.message);
        		});
        	};
        	timeLst();
        	self.timer = setInterval(timeLst, 5000);
    	}
        return this;
    },

	refreshDetailedRect: function() {
        var self = this;
		var rect = $('#'+self.pref+'rect').append(rect);
		if (self.geneI < 0 || self.geneJ < 0) {
			rect.hide();
			return;
		}
		var parentOffset = $('#'+self.pref+'img').offset();
		var x = (self.geneI - self.imgI) * self.scale / 100;
		var y = (self.geneJ - self.imgJ) * self.scale / 100;
		if (x < 0 || x >= self.size || y < 0 || y >= self.size) {
			rect.hide();
			return;
		}
		var half = self.geneRows * self.scale / 200;
		if (half < 1)
			half = 1;
		var ySize = Math.min(self.size, self.cmp.proteome2names.length * self.scale / 100);
		var scrX = x + 35 - half - 1;  // + parentOffset.left 
		var scrY = ySize + 1 - y - half - 1;  // + parentOffset.top;
		rect.css({
			'top': Math.round(scrY) + 'px',
			'left': Math.round(scrX) + 'px',
			'width': (1 + half * 2) + 'px',
			'height': (1 + half * 2) + 'px'
		});
		rect.show();
	},

	refreshImage: function() {
        var self = this;
		var maxI = self.imgI + self.size * 100 / self.scale;
		if (maxI > self.cmp.proteome1names.length)
    		maxI = self.cmp.proteome1names.length;
		var maxJ = self.imgJ + self.size * 100 / self.scale;
		if (maxJ > self.cmp.proteome2names.length)
			maxJ = self.cmp.proteome2names.length;
		self.imgI = maxI - self.size * 100 / self.scale;
		self.imgJ = maxJ - self.size * 100 / self.scale;
		if (self.imgI < 0)
			self.imgI = 0;
		if (self.imgJ < 0)
			self.imgJ = 0;
		self.imgI = Math.round(self.imgI);
		self.imgJ = Math.round(self.imgJ);
		var img = self.cmpImgUrl + "?ws=" + self.ws_name + "&id=" + self.ws_id + "&x=" + self.imgI + 
				"&y=" + self.imgJ + "&w=" + self.size + "&sp=" + self.scale + "&token=" + encodeURIComponent(self.authToken());
		$('#'+self.pref+'img').attr('src', img);
		self.refreshDetailedRect();
	},

	refreshGenes: function() {
        var self = this;
		var tbl = $('#'+self.pref+'genes');
		tbl.empty();
		if (self.geneI < 0 || self.geneJ < 0) {
			self.refreshDetailedRect();
			return;
		}
		var half = Math.floor(self.geneRows / 2);
		var rowHalf = Math.floor(self.geneRowH / 2);
		var svg = null;
		//var upArrow = '<svg width="5" height="3"><line x1="2" y1="0" x2="2" y2="2"/></svg>';
		var arrowI = '&#8595;';
		var arrowJ = '&#8595;';
		if (self.dirI < 0)
			arrowI = '&#8593;';
		if (self.dirJ < 0)
			arrowJ = '&#8593;';
    	var st = ' style="border: 0px; margin: 0px; padding: 0px;"';
    	var sr = ' style="border: 0px; margin: 0px; padding: 0px;"';
    	var sd = ' style="border: 0px; margin: 0px; padding: 1px;"';
    	var sb = ' style="width: 27px;"';
		tbl.append('<tr'+sr+'>'+
				'<td rowspan="'+(self.geneRows+2)+'" width="10" style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+self.pref+'btn-dirI"'+sb+'>'+arrowI+'</button></td>'+
				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+self.pref+'btn-i-up"'+sb+'>&#8593;</button></td>'+
				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+self.pref+'btn-both-up"'+sb+'>&#8593;&#8593;</button></td>'+
				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+self.pref+'btn-j-up"'+sb+'>&#8593;</button></td>'+
				'<td rowspan="'+(self.geneRows+2)+'" width="10" style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+self.pref+'btn-dirJ"'+sb+'>'+arrowJ+'</button></td>'+
				'</tr>');
		var svgLines = '';
		for (var rowPos = 0; rowPos < self.geneRows; rowPos++) {
			var i = self.geneI + (rowPos - half) * self.dirI;
			var j = self.geneJ + (rowPos - half) * self.dirJ;
			var labelI = "-";
			var labelJ = "-";
			if (i >= 0 && i < self.cmp.proteome1names.length)
				labelI = self.cmp.proteome1names[i];
			if (j >= 0 && j < self.cmp.proteome2names.length)
				labelJ = self.cmp.proteome2names[j];
			if (rowPos == half) {
				labelI = '<font color="red">' + labelI + '</font>';
				labelJ = '<font color="red">' + labelJ + '</font>';
			}
			var tdSt = ' style="border: 0px; margin: 0px; padding: 0px; font-size: 12px; height: '+self.geneRowH+'px; text-align: center; vertical-align: middle;"';
			var tds = '<td '+tdSt+'>' + labelI + '</td>';
			if (rowPos == 0)
				tds += '<td id="'+self.pref+'glinks" rowspan="'+self.geneRows+'" width="30"'+sr+'/>';
			tds += '<td '+tdSt+'>' + labelJ + '</td>';
			tbl.append('<tr'+sr+'>'+tds+'</tr>');
			var y1 = rowPos * (self.geneRowH + 0.2) + rowHalf;
			for (var tuplePos in self.cmp.data1[i]) {
				var tuple = self.cmp.data1[i][tuplePos];
				var hitJ = tuple[0];
				var hitPos = (hitJ - self.geneJ) * self.dirJ + half;
				if (hitPos >= 0 && hitPos < self.geneRows) {
					var y2 = hitPos * (self.geneRowH + 0.2) + rowHalf;
					var dash = '';
					if (tuple[2] < 100)
						dash = ' stroke-dasharray="5, 5"';
					svgLines += '<line x1="0" y1="'+y1+'" x2="30" y2="'+y2+'"'+dash+' style="stroke:rgb(0,0,0);stroke-width:1"/>';
				}
			}
		}
		tbl.append('<tr'+sr+'>'+
				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+self.pref+'btn-i-dn"'+sb+'>&#8595;</button></td>'+
				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+self.pref+'btn-both-dn"'+sb+'>&#8595;&#8595;</button></td>'+
				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+self.pref+'btn-j-dn"'+sb+'>&#8595;</button></td>'+
				'</tr>');
		var svgTd = $('#'+self.pref+'glinks');
		var svgH = self.geneRows * self.geneRowH;
		svgTd.append('<svg width="30" height="'+svgH+'">'+svgLines+'</svg>');
    	$('#'+self.pref+'btn-dirI').click(function() {
    		self.dirI *= -1;
    		self.refreshGenes();
    	});
    	$('#'+self.pref+'btn-i-up').click(function() {
    		self.geneI -= self.dirI;
    		self.refreshGenes();
    	});
    	$('#'+self.pref+'btn-both-up').click(function() {
    		self.geneI -= self.dirI;
    		self.geneJ -= self.dirJ;
    		self.refreshGenes();
    	});
    	$('#'+self.pref+'btn-j-up').click(function() {
    		self.geneJ -= self.dirJ;
    		self.refreshGenes();
    	});
    	$('#'+self.pref+'btn-dirJ').click(function() {
    		self.dirJ *= -1;
    		self.refreshGenes();
    	});
    	$('#'+self.pref+'btn-i-dn').click(function() {
    		self.geneI += self.dirI;
    		self.refreshGenes();
    	});
    	$('#'+self.pref+'btn-both-dn').click(function() {
    		self.geneI += self.dirI;
    		self.geneJ += self.dirJ;
    		self.refreshGenes();
    	});
    	$('#'+self.pref+'btn-j-dn').click(function() {
    		self.geneJ += self.dirJ;
    		self.refreshGenes();
    	});
    	self.refreshDetailedRect();
	},

    loggedInCallback: function(event, auth) {
        //this.token = auth.token;
        this.render();
        return this;
    },

    loggedOutCallback: function(event, auth) {
        //this.token = null;
        this.render();
        return this;
    },

    getState: function() {
        var self = this;
    	if (self.scale == null)
    		self.scale = self.size * 100 / Math.max(self.cmp.proteome1names.length, self.cmp.proteome2names.length);
        var state = {
        		imgI: self.imgI,
        	    imgJ: self.imgJ,
        	    scale: self.scale,
        	    geneI: self.geneI,
        	    dirI: self.dirI,
        	    geneJ: self.geneJ,
        	    dirJ: self.dirJ,
        	    cmp_ref: self.cmp_ref
        };
        return state;
    },

    loadState: function(state) {
        if (!state)
            return;
        var self = this;
		self.imgI = state.imgI;
	    self.imgJ = state.imgJ;
	    self.scale = state.scale;
	    self.geneI = state.geneI;
	    self.dirI = state.dirI;
	    self.geneJ = state.geneJ;
	    self.dirJ = state.dirJ;
	    self.cmp_ref = state.cmp_ref;
    	if (self.scale == null)
    		self.scale = self.size * 100 / Math.max(self.cmp.proteome1names.length, self.cmp.proteome2names.length);
    	if (!self.cmp) {
    		self.render();
    	} else {
    		self.refreshImage();
    		self.refreshGenes();
    	}
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
