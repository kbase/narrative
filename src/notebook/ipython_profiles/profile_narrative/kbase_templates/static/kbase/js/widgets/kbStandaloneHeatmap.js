/*
  Heatmap Renderer

  Displays a heatmap.

  Options
  
  width (int)
     Number of pixels the resulting image is wide. Default is 700

  height (int)
     Number of pixels the resulting image is high. This will be adjusted to at least rows * min_cell_height + legend and tree heights. Default is 600.

  tree_height (int)
     Number of pixels the dendogram tree for the columns is high. Default is 50.

  tree_width (int)
     Number of pixels the dendogram tree for the rows is wide. Default is 50.

  legend_height (int)
     Number of pixels for the column names. Default is 250.

  legend_width (int)
     Number of pixels for the row names. Default is 250.

  row_text_size (int)
     Number of pixels of the row text font size. Default is 15.

  col_text_size (int)
     Number of pixels of the column text font size. Default is 15.

  min_cell_height (int)
     Minimum number of pixels a row is high. This may cause the defined height of the resulting image to be overwritten. Default is 19.

  selectedRows (array of boolean)
     Returns an array that has a value of true for all row indices that are currently selected.

  data (object)
     columns (array of string)
        names of the columns
     rows (array of string)
        names of the rows
     colindex (array of int)
        1 based indices of the original column order. This converts the original order (columns) into the one ordered by distance.
     rowindex (array of int)
        1 based indices of the original row order. This converts the original order (rows) into the one ordered by distance.
     coldend (array of array of float)
        distance matrix for the columns
     rowdend (array of array of float)
        distance matrix for the rows
     data (array of array of float)
        normalized value matrix
*/
(function () {
    var root = this;
    var standaloneHeatmap = root.standaloneHeatmap = {
	about: {
	    name: "heatmap",
	    title: "Heatmap",
            author: "Tobias Paczian",
            version: "1.0",
            requires: [ "jquery.svg.js" ],
            defaults: {
		'width': 200,
		'height': 200,
		'tree_height': 50,
		'tree_width': 50,
		'legend_height': 80,
		'legend_width': 100,
		'row_text_size': 15,
		'col_text_size': 15,
		'min_cell_height': 19,
		'selectedRows': [],
		'selectedColumns': [],
		'cells': [] },
	    options: [
		{
		    text: [
			{ name: 'row_text_size', type: 'int', description: "font size of the row text in pixel", title: "row font size" },
			{ name: 'col_text_size', type: 'int', description: "font size of the column text in pixel", title: "column font size" },
			{ name: 'min_cell_height', type: 'int', description: "minimum height of a cell", title: "minimum cell height" }
		    ]
		},		
		{
		    layout: [ 
			{ name: 'height', type: 'int', description: "height of the plot", title: "height" },
			{ name: 'width', type: 'int', description: "width of the plot", title: "width" },
			{ name: 'tree_height', type: 'int', description: "height of the dendogram", title: "dendogram height" },
			{ name: 'tree_width', type: 'int', description: "width of the dendogram", title: "dendogram width" },
			{ name: 'legend_height', type: 'int', description: "height of the legend", title: "legend height" },
			{ name: 'legend_width', type: 'int', description: "width of the legend", title: "legend width" }
		    ]
		}
	    ]
	},
	exampleData: function () {
	    return { columns: ["4441619.3", "4441656.4", "4441620.3"], rows: ["Eukaryota", "unassigned", "Bacteria","Archaea"], data: [[0.338159580408187, 0.717179237742824, 0.514052821211353],[0.238159580408187, 0.317179237742824, 0.114052821211353],[0.553202346761363, 0.614080873307415, 0.555096325148052],[0.996159994861707, 0.940468112695288, 1]] };
        },

	create: function (params) {
	    var renderer = this;
	    if (! window.hasOwnProperty('rendererHeatmap')) {
		window.rendererHeatmap = [];
	    }
	    var instance = { settings: {},
			     index: params.index };
	    jQuery.extend(true, instance, renderer);
	    jQuery.extend(true, instance.settings, renderer.about.defaults, params);
	    window.rendererHeatmap.push(instance);

	    return instance;
	},

	render: function (index) {
	    var renderer = rendererHeatmap[index];

	    var min_height = (renderer.settings.data.rows.length * renderer.settings.min_cell_height) + renderer.settings.tree_height + renderer.settings.legend_height;
	    if (renderer.settings.height < min_height) {
		renderer.settings.height = min_height;
	    }
	    var min_width = (renderer.settings.data.columns.length * renderer.settings.min_cell_height) + renderer.settings.tree_width + renderer.settings.legend_width;
	    if (renderer.settings.width < min_width) {
		renderer.settings.width = min_width;
	    }

	    // get the target div
	    var target = renderer.settings.target;
	    target.innerHTML = "<div id='heatmap_div"+index+"'></div>";
	    target.firstChild.setAttribute('style', "width: "+ renderer.settings.width+"px; height: "+renderer.settings.height+"px;");
	    jQuery('#heatmap_div'+index).svg();
	    rendererHeatmap[index].drawImage(jQuery('#heatmap_div'+index).svg('get'), renderer.index);
	    
	    return renderer;
	},

	drawImage: function (svg, index) {
	    var renderer = rendererHeatmap[index];

	    // initialize shortcut variables
	    var numrows = renderer.settings.data.rows.length;
	    var numcols = renderer.settings.data.columns.length;
	    var boxwidth = parseInt((renderer.settings.width - renderer.settings.legend_width - renderer.settings.tree_width - 5) / numcols);
	    renderer.settings.boxwidth = boxwidth;
	    var boxheight = parseInt((renderer.settings.height - renderer.settings.legend_height - renderer.settings.tree_height - 5) / numrows);
	    renderer.settings.boxheight = boxheight;
	    var displaywidth = parseInt(renderer.settings.width - renderer.settings.legend_width - renderer.settings.tree_width - 5);
	    var displayheight = parseInt(renderer.settings.height - renderer.settings.legend_height - renderer.settings.tree_height - 5);

	    var x = 0;
	    var y = 0;
	    var rx = 0;
	    var ry = 0;
	    var width = 0;
	    var height = 0;
	    var settings = {fill: 'red', strokeWidth: 1, stroke: 'black'};
	    if (renderer.settings.data.hasOwnProperty('coldend') && renderer.settings.data.hasOwnProperty('colindex')) {
	        renderer.settings.data.colcluster = renderer.settings.data.coldend;
	    } else {
	        var col_result = renderer.cluster(renderer.transpose(renderer.settings.data.data));
	        renderer.settings.data.colcluster = col_result[0];
	        renderer.settings.data.colindex = col_result[1];
	    }
        if (renderer.settings.data.hasOwnProperty('rowdend') && renderer.settings.data.hasOwnProperty('rowindex')) {
            renderer.settings.data.rowcluster = renderer.settings.data.rowdend;
        } else {
	        var row_result = renderer.cluster(renderer.settings.data.data);
	        renderer.settings.data.rowcluster = row_result[0];
	        renderer.settings.data.rowindex = row_result[1];
        }
	    renderer.drawDendogram(svg, index, 0);
	    renderer.drawDendogram(svg, index, 1);

	    // draw the heatmap
	    for (var i=0;i<renderer.settings.data.data.length;i++) {
		// draw row text
		var textx = renderer.settings.tree_width + displaywidth + 5;
		var texty = renderer.settings.tree_height + renderer.settings.legend_height + (boxheight * (i+1) - parseInt((boxheight - renderer.settings.row_text_size) / 2)) - 2;
		var fontColor = "black";
		if (renderer.settings.selectedRows[i]) {
		    fontColor = "blue";
		}

		svg.text(null, textx, texty, ''+renderer.settings.data.rows[renderer.settings.data.rowindex[i]-1], { fill: fontColor, fontSize: renderer.settings.row_text_size+"px", onclick: "rendererHeatmap["+index+"].toggleSelected("+i+", "+index+", 0);", cursor: "pointer" });

		renderer.settings.cells.push([]);

		// draw cells
		for (var h=0;h<renderer.settings.data.data[i].length;h++) {
		    // draw column text
		    if (i==0) {
			var ctextx = renderer.settings.tree_width + (boxwidth * h) + (parseInt((boxwidth - renderer.settings.col_text_size) / 2)) + 12;
			var ctexty = renderer.settings.legend_height - 5;
			fontColor = "black";
			if (renderer.settings.selectedColumns[h]) {
			    fontColor = "blue";
			}
			svg.text(null, ctextx, ctexty, renderer.settings.data.columns[renderer.settings.data.colindex[h]-1], { fill: fontColor, fontSize: renderer.settings.col_text_size+"px", transform: "rotate(-90, "+ctextx+", "+ctexty+")", onclick: "rendererHeatmap["+index+"].toggleSelected("+h+", "+index+", 1);", cursor: "pointer" });
			
		    }

		    // calculate box margins
		    x = h * boxwidth + renderer.settings.tree_width;
		    width = boxwidth;
		    y = i * boxheight + renderer.settings.tree_height + renderer.settings.legend_height;
		    height = boxheight;

		    // calculate box color
		    var color = "black";
		    var adjusted_value = (renderer.settings.data.data[renderer.settings.data.rowindex[i]-1][renderer.settings.data.colindex[h]-1] * 2) - 1;
		    var cval = parseInt(255 * Math.abs(adjusted_value));
		    if (adjusted_value < 0) {
			color = "rgb("+cval+",0,0)";
		    } else {
			color = "rgb(0,"+cval+",0)";
		    }
		    settings.fill = color;
		    if (typeof renderer.settings.cellClicked == "function") {
			settings.onclick = "rendererHeatmap["+index+"].cellClick("+i+", "+h+", "+adjusted_value+", this, "+index+");";
		    }
		    if (typeof renderer.settings.cellHovered == "function") {
			settings.onmouseover = "rendererHeatmap["+index+"].cellHover(1, "+i+", "+h+", "+adjusted_value+", this, "+index+");";
			settings.onmouseout = "rendererHeatmap["+index+"].cellHover(0, "+i+", "+h+", "+adjusted_value+", this, "+index+");";
		    }

		    // draw the box
		    renderer.settings.cells[i][h] = svg.rect(null, x, y, width, height, rx, ry, settings);		    
		}
	    }
	},

	drawDendogram: function (svg, index, rotation) {
	    var renderer = rendererHeatmap[index];

	    var height = rotation ? renderer.settings.tree_width : renderer.settings.tree_height;
	    var data = rotation ? renderer.settings.data.rowcluster : renderer.settings.data.colcluster;
	    var cell_w = rotation ? renderer.settings.boxheight : renderer.settings.boxwidth;
	    var xshift = rotation ? renderer.settings.tree_height : renderer.settings.tree_width;
	    var yshift = renderer.settings.legend_height + renderer.settings.tree_height;
	    var interval = parseInt(height / data.depth);
	    var path = "";
	    if (rotation) {
		xshift++;
		for (var i=0;i<data.depth;i++) {
		    var curr_shift = 0 + yshift;
		    for (var h=0;h<data[i].length;h++) {
			var cluster = data[i][h];
			path += "M"+xshift+","+parseInt(curr_shift + ((cell_w * cluster.a) / 2))+"l-"+parseInt(interval)+",0";
			if (cluster.hasOwnProperty('b')) {
			    path += "l0,"+parseInt((cell_w * (cluster.a / 2)) + (cell_w * (cluster.b / 2)))+"l"+parseInt(interval)+",0";
			}
			curr_shift += cluster.b ? (cluster.a + cluster.b) * cell_w : cluster.a * cell_w;
		    }
		    xshift -= interval;
		}
	    } else {
		for (var i=0;i<data.depth;i++) {
		    var curr_shift = 0 + xshift;
		    for (var h=0;h<data[i].length;h++) {
			var cluster = data[i][h];
			path += "M"+parseInt(curr_shift + ((cell_w * cluster.a) / 2))+","+yshift+"l0,-"+parseInt(interval);
			if (cluster.hasOwnProperty('b')) {
			    path += "l"+parseInt((cell_w * (cluster.a / 2)) + (cell_w * (cluster.b / 2)))+",0l0,"+parseInt(interval);
			}
			curr_shift += cluster.b ? (cluster.a + cluster.b) * cell_w : cluster.a * cell_w;
		    }
		    yshift -= interval;
		}
	    }
	    svg.path(null, path, {fill:"none", stroke: "black" });
	},
	
	toggleSelected: function (row, index, dir) {
	    var renderer = rendererHeatmap[index];

	    if (dir) {
		if (typeof renderer.settings.colClicked == "function") {
		    renderer.settings.colClicked({ col: row, rendererIndex: index, label: renderer.settings.data.cols[renderer.settings.data.colindex[row]-1] });
		} else {
		    if (renderer.settings.selectedColumns[row]) {
			renderer.settings.selectedColumns[row] = 0;
		    } else {
			renderer.settings.selectedColumns[row] = 1;
		    }
		}
	    } else {
		if (typeof renderer.settings.rowClicked == "function") {
		    renderer.settings.rowClicked({ row: row, rendererIndex: index, label: renderer.settings.data.rows[renderer.settings.data.rowindex[row]-1] });
		} else {
		    if (renderer.settings.selectedRows[row]) {
			renderer.settings.selectedRows[row] = 0;
		    } else {
			renderer.settings.selectedRows[row] = 1;
		    }
		}
	    }

	    renderer.render();
	},

	cellClick: function (row, col, value, cell, index) {
	    var renderer = rendererHeatmap[index];
	    if (typeof renderer.settings.cellClicked == "function") {
		renderer.settings.cellClicked({row: row, col: col, value: value, cell: cell});
	    }
	},

	cellHover: function (over, row, col, value, cell, index) {
	    var renderer = rendererHeatmap[index];
	    if (typeof renderer.settings.cellHovered == "function") {
		renderer.settings.cellHovered({over: over, row: row, col: col, value: value, cell: cell});
	    }
	},

	normalize: function (data, min, max) {
	    var normdata = [];
	    min = min ? min : 0;
	    max = max ? max : 1;
	    for (var i=0;i<data.length;i++) {
		var dmin = data[i][0];
		var dmax = data[i][0];
		for (var h=0; h<data[i].length; h++) {
		    if (data[i][h] < dmin) {
			dmin = data[i][h];
		    }
		    if (data[i][h] > dmax) {
			dmax = data[i][h];
		    }
		}
		normdata[i] = [];
		for (var h=0;h<data[i][h].length;h++) {
		    normdata[i][h] = min + (x - dmin) * (dmax - min) / (dmax - dmin);
		}
	    }

	    return normdata;
	},

	clustsort: function (a, b) {
	    return a.amin - b.amin;
	},

	distance: function (data) {
	    var distances = {};
	    for (var i=0;i<data.length;i++) {
		distances[i] = {};
	    }
	    for (var i=0;i<data.length;i++) {
	    	for (var h=0;h<data.length;h++) {
	    	    if (i>=h) {
	    		continue;
	    	    }
	    	    var dist = 0;
	    	    for (var j=0;j<data[i].data[0].length;j++) {
	    		dist += Math.pow(data[i].data[0][j] - data[h].data[0][j], 2);
	    	    }
	    	    distances[i][h] = Math.pow(dist, 0.5);
	    	}
	    }	    
	    return distances;
	},

	transpose: function (data) {
	    var result = [];
	    for (var i=0;i<data.length;i++) {
		for (var h=0;h<data[i].length;h++) {
		    if (i==0) {
			result.push( [] );
		    }
		    result[h][i] = data[i][h];
		}
	    }
	    return result;
	},

	cluster: function (data) {
	    var num_avail = data.length;
	    var avail = {};
	    var clusters = [];
	    for (var i=0;i<data.length;i++) {
		clusters.push( { points: [ i ], data: [ data[i] ], basepoints: [ i ], level: [ 0 ] } );
		avail[i] = true;
	    }

	    // get the initial distances between all nodes
	    var distances = rendererHeatmap[0].distance(clusters);

	    // calculate clusters
	    var min;
	    var coords;
	    while (num_avail > 1) {
		var found = false;
	    	for (var i in distances) {
	    	    if (distances.hasOwnProperty(i)) {
	    		for (var h in distances[i]) {
	    		    if (distances[i].hasOwnProperty(h) && avail[i] && avail[h]) {
	    			min = distances[i][h];
	    			coords = [ i, h ];
				found = true;
	    			break;
	    		    }
	    		}
			if (found) {
	    		    break;
			}
	    	    }
	    	}
	    	for (var i in distances) {
	    	    if (distances.hasOwnProperty(i)) {
	    		for (var h in distances[i]) {
	    		    if (distances[i].hasOwnProperty(h)) {
	    			if (avail[i] && avail[h] && distances[i][h]<min) {
	    			    coords = [ i, h ];
				    min  = distances[i][h];
	    			}
	    		    }
	    		}
	    	    }
	    	}
	    	avail[coords[0]] = false;
	    	avail[coords[1]] = false;
	    	num_avail--;
	    	avail[clusters.length] = true;
		
		var sumpa = 0;
		var sumpb = 0
		for (var h=0;h<2;h++) {
		    for (var i=0;i<clusters[coords[h]].data.length;i++) {
			if (h==0) {
			    sumpa += clusters[coords[h]].data[i];
			} else {
			    sumpb += clusters[coords[h]].data[i];
			}
	    	    }
		}
		var pdata = [];
		var bpoints = [];
	    	for (var h=0;h<2;h++) {
		    var j = h;
		    if (sumpa > sumpb) {
			if (h==0) { j = 1; } else { j = 0; }
		    }
		    for (var i=0;i<clusters[coords[j]].data.length;i++) {
	    		pdata.push(clusters[coords[j]].data[i]);
	    	    }
		    for (var i=0;i<clusters[coords[j]].basepoints.length;i++) {
			bpoints.push(clusters[coords[j]].basepoints[i]);
		    }
	    	}
		var coord_a = coords[0];
		var coord_b = coords[1];
		if (sumpa > sumpb) {
		    var triangle = coord_a;
		    coord_a = coord_b;
		    coord_b = triangle;
		}
		coord_a = parseInt(coord_a);
		coord_b = parseInt(coord_b);

	    	clusters.push({ points: [ coord_a, coord_b ], data: pdata, basepoints: bpoints, level: [ Math.max.apply(null, clusters[coord_a].level) + 1, Math.max.apply(null, clusters[coord_b].level) + 1 ] });

	    	var row_a = [];
	    	for (var h=0;h<2;h++) {
	    	    for (var i=0;i<clusters[coords[h]].data.length;i++) {
	    		for (var j=0; j<clusters[coords[h]].data[i].length; j++) {
	    		    if (h==0 && i==0) {
	    			row_a[j] = 0;
	    		    }
	    		    row_a[j] += clusters[coords[h]].data[i][j];
	    		}
	    	    }
	    	}
	    	for (var i=0; i<row_a.length; i++) {
	    	    row_a[i] = row_a[i] / (clusters[coord_a].data.length + clusters[coord_b].data.length);
	    	}
	    	var index = clusters.length - 1;
		distances[index] = {};
	    	for (var h=0; h<index; h++) {
	    	    var row_b = [];
	    	    for (var i=0;i<clusters[h].data.length;i++) {
	    		for (var j=0; j<clusters[h].data[i].length; j++) {
	    		    if (i==0) {
	    			row_b[j] = 0;
	    		    }
	    		    row_b[j] += clusters[h].data[i][j];
	    		}
	    	    }
	    	    for (var i=0; i<row_b.length; i++) {
	    		row_b[i] = row_b[i] / clusters[h].data.length;
	    	    }
	    	    var dist = 0;
	    	    for (var i=0;i<row_a.length;i++) {
	    		dist += Math.pow(row_a[i] - row_b[i], 2);
	    	    }
	    	    distances[h][index] = Math.pow(dist, 0.5);
	    	}
	    }

	    // record the row order after clustering
	    var rowindex = [];
	    var cind = clusters.length - 1;
	    for (var i=0;i<clusters[cind].basepoints.length; i++) {
		rowindex.push(clusters[cind].basepoints[i] + 1);
	    }

	    // record the reverse row order for lookup
	    var roworder = {};
	    for (var i=0;i<rowindex.length;i++) {
		roworder[rowindex[i]] = i;
	    }

	    // get the depth
	    var depth = 0;
	    for (var i=0; i<clusters.length; i++) {
		if (clusters[i].level[0] && clusters[i].level[0] > depth) {
		    depth = clusters[i].level[0];
		}
		if (clusters[i].level[1] && clusters[i].level[1] > depth) {
		    depth = clusters[i].level[1];
		}
	    }

	    // format the cluster data for visualization
	    var clusterdata = { "depth": depth };
	    for (var i=0;i<clusterdata.depth;i++) {
		clusterdata[i] = [];
	    }
	    for (var i=data.length; i<clusters.length; i++) {

		// get the level this cluster is at
		var level = Math.max.apply(null, clusters[i].level) - 1;
		
		clusterdata[level].push({a: clusters[clusters[i].points[0]].data.length, b:clusters[clusters[i].points[1]].data.length, amin: roworder[Math.min.apply(null, clusters[clusters[i].points[0]].basepoints) + 1] });
		
		// draw single lines until we reach the next root
		if (clusters[i].level[0] != clusters[i].level[1]) {
		    var n = 0;
		    if (clusters[i].level[1] < clusters[i].level[0]) {
			n = 1;
		    }
		    for (var h=0;h<Math.abs(clusters[i].level[0] - clusters[i].level[1]);h++) {
			clusterdata[level - (h+1)].push({ a: clusters[clusters[i].points[n]].data.length, amin: roworder[Math.min.apply(null, clusters[clusters[i].points[n]].basepoints) + 1] });
		    }
		}
	    }

	    // sort the clusterdata
	    for (var i in clusterdata) {
	    	if (clusterdata.hasOwnProperty(i) && ! isNaN(i)) {
	    	    clusterdata[i].sort(rendererHeatmap[0].clustsort);
	    	}
	    }
	    
	    if (data.length < 20) {
		window.clustersx = clusters;
		window.clusterdatax = clusterdata;
	    }

	    return [clusterdata, rowindex];
	}
     }
}).call(this);
