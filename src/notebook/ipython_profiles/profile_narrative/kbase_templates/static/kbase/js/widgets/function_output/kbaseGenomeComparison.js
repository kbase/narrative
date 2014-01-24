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
    geneRows: 21,
    geneRowH: 21,

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
        var geneI = -1;
        var dirI = 1;
        var geneJ = -1;
        var dirJ = 1;

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
            	var sb = ' style="width: 27px;"';
            	table.append('<tr><td>' + 
            			'<center>' +
            			'<button id="'+pref+'btn-zi">Zoom +</button>'+
            			'&nbsp;' + 
            			'<button id="'+pref+'btn-zo">Zoom -</button>'+
            			'<br><br><table'+st+'><tr'+sr+'><td'+sd+'>' + 
            			'<button id="'+pref+'btn-mul"'+sb+'>&#8598;</button>'+
            			'</td><td'+sd+'>' +
            			'<button id="'+pref+'btn-mu"'+sb+'>&#8593;</button>'+
            			'</td><td'+sd+'>' + 
            			'<button id="'+pref+'btn-mur"'+sb+'>&#8599;</button>'+
            			'</td></tr><tr'+sr+'><td'+sd+'>' +
            			'<button id="'+pref+'btn-ml"'+sb+'>&#8592;</button>'+
            			'</td><td'+sd+'/><td'+sd+'>' +
            			'<button id="'+pref+'btn-mr"'+sb+'>&#8594;</button>'+
            			'</td></tr><tr'+sr+'><td'+sd+'>' + 
            			'<button id="'+pref+'btn-mdl"'+sb+'>&#8601;</button>'+
            			'</td><td'+sd+'>' +
            			'<button id="'+pref+'btn-md"'+sb+'>&#8595;</button>'+
            			'</td><td'+sd+'>' + 
            			'<button id="'+pref+'btn-mdr"'+sb+'>&#8600;</button>'+
            			'</td></tr></table></center>' +
            			'</td><td><table'+st+'><tr'+sr+'>' +
            			'<td width="'+(size+100)+'"'+sd+'>'+
            			'<div style="position:relative">'+
            			'<img id="'+pref+'img" src=""/>'+
            			'<div id="'+pref+'rect" style="position:absolute; z-index: 2; border: 1px; border-style: solid; border-color: red; background-color: transparent; display:none; pointer-events:none;"/>'+
            			'</div>'+
            			'</td>'+
            			'<td width="300"'+sd+'><table id="'+pref+'genes"'+st+'/></td></tr></table></td></tr>');
            	var refreshDetailedRect = function() {
            		var rect = $('#'+pref+'rect').append(rect);
            		if (geneI < 0 || geneJ < 0) {
            			rect.hide();
            			return;
            		}
            		var parentOffset = $('#'+pref+'img').offset();
            		var x = (geneI - imgI) * scale / 100;
            		var y = (geneJ - imgJ) * scale / 100;
            		if (x < 0 || x >= size || y < 0 || y >= size) {
            			rect.hide();
            			return;
            		}
            		var half = self.geneRows * scale / 200;
            		if (half < 1)
            			half = 1;
            		var ySize = Math.min(size, cmp.proteome2names.length * scale / 100);
            		var scrX = x + 35 - half - 1;  // + parentOffset.left 
            		var scrY = ySize + 1 - y - half - 1;  // + parentOffset.top;
        			rect.css({
        				'top': Math.round(scrY) + 'px',
        				'left': Math.round(scrX) + 'px',
        				'width': (1 + half * 2) + 'px',
        				'height': (1 + half * 2) + 'px'
        			});
        			rect.show();
            	};

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
            		refreshDetailedRect();
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
            	
            	var hitSearch = function(e) {
            		var scrX = e.pageX;
            		var scrY = e.pageY;
            		if ((!scrX) && (!scrY) && e.clientX && e.clientY) {
            			scrX = e.clientX + document.body.scrollLeft
            				+ document.documentElement.scrollLeft;
            			scrY = e.clientY + document.body.scrollTop
            				+ document.documentElement.scrollTop;
            		}
            		var parentOffset = $('#'+pref+'img').offset();
            		var relX = scrX - parentOffset.left - 35;
            		var relY = scrY - parentOffset.top;
            		var xSize = Math.min(size, cmp.proteome1names.length * scale / 100);
            		var ySize = Math.min(size, cmp.proteome2names.length * scale / 100);
            		var bestDist = -1;
            		var bestI = -1;
            		var bestJ = -1;
            		if (relX >= 0 && relX <= xSize && relY >= 0 && relY <= ySize) {
            			for (var i in cmp.data1) {
            				var x = (i - imgI) * scale / 100;
                    		if (x >= 0 && x < xSize && Math.abs(relX - x) <= 2) {
                    			//alert("x=" + x + ", i=" + i);
                				for (var tuplePos in cmp.data1[i]) {
                					var tuple = cmp.data1[i][tuplePos];
                					var j = tuple[0];
                    				var y = ySize + 1 - (j - imgJ) * scale / 100;
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
            	}
            	            	
            	var refreshGenes = function() {
            		var tbl = $('#'+pref+'genes');
            		tbl.empty();
            		if (geneI < 0 || geneJ < 0) {
            			refreshDetailedRect();
            			return;
            		}
            		var half = Math.floor(self.geneRows / 2);
            		var rowHalf = Math.floor(self.geneRowH / 2);
            		var svg = null;
            		//var upArrow = '<svg width="5" height="3"><line x1="2" y1="0" x2="2" y2="2"/></svg>';
            		var arrowI = '&#8595;';
            		var arrowJ = '&#8595;';
            		if (dirI < 0)
            			arrowI = '&#8593;';
            		if (dirJ < 0)
            			arrowJ = '&#8593;';
            		tbl.append('<tr'+sr+'>'+
            				'<td rowspan="'+(self.geneRows+2)+'" width="10" style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+pref+'btn-dirI"'+sb+'>'+arrowI+'</button></td>'+
            				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+pref+'btn-i-up"'+sb+'>&#8593;</button></td>'+
            				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+pref+'btn-both-up"'+sb+'>&#8593;&#8593;</button></td>'+
            				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+pref+'btn-j-up"'+sb+'>&#8593;</button></td>'+
            				'<td rowspan="'+(self.geneRows+2)+'" width="10" style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+pref+'btn-dirJ"'+sb+'>'+arrowJ+'</button></td>'+
            				'</tr>');
            		var svgLines = '';
            		for (var rowPos = 0; rowPos < self.geneRows; rowPos++) {
            			var i = geneI + (rowPos - half) * dirI;
            			var j = geneJ + (rowPos - half) * dirJ;
            			var labelI = "-";
            			var labelJ = "-";
            			if (i >= 0 && i < cmp.proteome1names.length)
            				labelI = cmp.proteome1names[i];
            			if (j >= 0 && j < cmp.proteome2names.length)
            				labelJ = cmp.proteome2names[j];
            			if (rowPos == half) {
            				labelI = '<font color="red">' + labelI + '</font>';
            				labelJ = '<font color="red">' + labelJ + '</font>';
            			}
            			var tdSt = ' style="border: 0px; margin: 0px; padding: 0px; font-size: 12px; height: '+self.geneRowH+'px; text-align: center; vertical-align: middle;"';
            			var tds = '<td '+tdSt+'>' + labelI + '</td>';
            			if (rowPos == 0)
            				tds += '<td id="'+pref+'glinks" rowspan="'+self.geneRows+'" width="30"'+sr+'/>';
            			tds += '<td '+tdSt+'>' + labelJ + '</td>';
            			tbl.append('<tr'+sr+'>'+tds+'</tr>');
            			var y1 = rowPos * (self.geneRowH + 0.2) + rowHalf;
        				for (var tuplePos in cmp.data1[i]) {
        					var tuple = cmp.data1[i][tuplePos];
        					var hitJ = tuple[0];
        					var hitPos = (hitJ - geneJ) * dirJ + half;
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
            				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+pref+'btn-i-dn"'+sb+'>&#8595;</button></td>'+
            				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+pref+'btn-both-dn"'+sb+'>&#8595;&#8595;</button></td>'+
            				'<td style="border: 0px; margin: 0px; padding: 0px; text-align: center; vertical-align: middle;"><button id="'+pref+'btn-j-dn"'+sb+'>&#8595;</button></td>'+
            				'</tr>');
    				var svgTd = $('#'+pref+'glinks');
    				var svgH = self.geneRows * self.geneRowH;
    				svgTd.append('<svg width="30" height="'+svgH+'">'+svgLines+'</svg>');
                	$('#'+pref+'btn-dirI').click(function() {
                		dirI *= -1;
                		refreshGenes();
                	});
                	$('#'+pref+'btn-i-up').click(function() {
                		geneI -= dirI;
                		refreshGenes();
                	});
                	$('#'+pref+'btn-both-up').click(function() {
                		geneI -= dirI;
                		geneJ -= dirJ;
                		refreshGenes();
                	});
                	$('#'+pref+'btn-j-up').click(function() {
                		geneJ -= dirJ;
                		refreshGenes();
                	});
                	$('#'+pref+'btn-dirJ').click(function() {
                		dirJ *= -1;
                		refreshGenes();
                	});
                	$('#'+pref+'btn-i-dn').click(function() {
                		geneI += dirI;
                		refreshGenes();
                	});
                	$('#'+pref+'btn-both-dn').click(function() {
                		geneI += dirI;
                		geneJ += dirJ;
                		refreshGenes();
                	});
                	$('#'+pref+'btn-j-dn').click(function() {
                		geneJ += dirJ;
                		refreshGenes();
                	});
                	refreshDetailedRect();
            	}
            	
            	$('#'+pref+'img').hover(
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
            			var msg = 'X-axis: ' + cmp.proteome1names[Number(hit.bestI)] + 
            				', Y-axis: ' + cmp.proteome2names[Number(hit.bestJ)] +
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
            			geneI = Number(hit.bestI);
            			geneJ = Number(hit.bestJ);
            		} else {
            			geneI = -1;
            			geneJ = -1;
            		}
            		refreshGenes();
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
    				clearInterval(self.timer);
        			alert("Error: " + data.error.message + ", service url: " + jobSrvUrl);
        		});
        	};
        	timeLst();
        	self.timer = setInterval(timeLst, 5000);
    	}
        return this;
    }  //end init

})
}( jQuery ) );
