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

  data (object)
     columns (array of string)
        names of the columns
     rows (array of array of string)
        hierarchy arrays for each row
     data (array of array of float)
        value matrix
*/

(function($, undefined) {
    $.KBWidget({
        name: 'DrilldownHeatmapWidget',
        version: '1.0.0',
        options: {
            'width': 200,
    		'height': 200,
    		'tree_height': 50,
    		'tree_width': 50,
    		'legend_height': 80,
    		'legend_width': 100,
    		'row_text_size': 15,
    		'col_text_size': 15,
    		'min_cell_height': 19,
    		'hierarchyLevel': 0,
    		'filter': null,
    		'cells': []
        },
        
        init: function(params) {
            var renderer = this;
    	    if (! window.hasOwnProperty('rendererHeatmap')) {
    		    window.rendererHeatmap = {};
    	    }
            var index = (Math.random() + 1).toString(36).substring(5);
            var instance = {
                'settings': {},
                'index': index
            };
    	    jQuery.extend(true, instance, renderer);
    	    jQuery.extend(true, instance.settings, renderer.options, params);
    	    window.rendererHeatmap[index] = instance;
    	    return instance.render(index);
        },
    	
    	render: function (index) {
    	    var renderer = window.rendererHeatmap[index];
    	    
    	    // calculate the drilldata
    	    renderer.drilldown(index);
    	    var min_height = (renderer.settings.drillrows.length * renderer.settings.min_cell_height) + renderer.settings.tree_height + renderer.settings.legend_height;
    	    if (renderer.settings.height < min_height) {
    		    renderer.settings.height = min_height;
    	    }
    	    var min_width = (renderer.settings.data.columns.length * renderer.settings.min_cell_height) + renderer.settings.tree_width + renderer.settings.legend_width;
    	    if (renderer.settings.width < min_width) {
    		    renderer.settings.width = min_width;
    	    }

    	    // get the target div
    	    var target = document.createElement('div');
    	    renderer.$elem.append(target);
    	    
    	    // set target div content
    	    var inner = "<a style='cursor: pointer;' onclick='while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}window.rendererHeatmap["+index+"].updateVis("+index+", 0, null);'>&raquo; All </a>";
    	    if (document.getElementById("heatmap_bread"+index)) {
    		    inner = document.getElementById("heatmap_bread"+index).innerHTML;
    	    }
    	    target.innerHTML = "<div id='heatmap_bread"+index+"'>"+inner+"</div><div id='heatmap_div"+index+"' style='width: "+ renderer.settings.width+"px; height: "+renderer.settings.height+"px;'></div>";
    	    jQuery('#heatmap_div'+index).svg();
    	    window.rendererHeatmap[index].drawImage(jQuery('#heatmap_div'+index).svg('get'), index);
            
    	    return renderer;
    	},
        
        updateVis: function(index, level, filter) {
    	    var renderer = window.rendererHeatmap[index];
    	    renderer.settings.filter = filter;
    	    renderer.settings.hierarchyLevel = level;
    	    renderer.render(index);
    	},
    	
    	drilldown: function (index) {
    	    var renderer = window.rendererHeatmap[index];

    	    // filter and group the data
    	    var data = renderer.settings.data.data;
    	    var rows = renderer.settings.data.rows;
    	    if (typeof rows[0] != 'object') {
    		    for (var i=0; i<rows.length; i++) {
    		        rows[i] = [ rows[i] ];
    		    }
    	    }
    	    var filter = renderer.settings.filter;
    	    var level = renderer.settings.hierarchyLevel;
    	    var hashdata = {};
    	    var maxdepth = {};
    	    for (var i=0; i<data.length; i++) {
    		    if (filter) {
    		        if (rows[i][level - 1] != filter) {
    			        continue;
    		        }
    		    }
    		    if (hashdata.hasOwnProperty(rows[i][level])) {
    		        for (var h=0; h<renderer.settings.data.columns.length; h++) {
    			        hashdata[rows[i][level]][h] += data[i][h];
    		        }
    		    } else {
    		        if ((level + 1) >= rows[i].length) {
    			        maxdepth[rows[i][level]] = true;
    		        } else {
    			        maxdepth[rows[i][level]] = false;
    		        }
    		        hashdata[rows[i][level]] = [];
    		        for (var h=0; h<renderer.settings.data.columns.length; h++) {
    			        hashdata[rows[i][level]][h] = data[i][h];
    		        }
    		    }
    	    }
    	    // create the output data structure
    	    var drillrows = [];
    	    var drilldata = [];
    	    var sortedrows = renderer.hashkeys(hashdata).sort();
    	    for (var i=0; i<sortedrows.length; i++) {
    		    drillrows.push(sortedrows[i]);
    		    drilldata.push(hashdata[sortedrows[i]]);
    	    }

    	    // normalize data matrix
    	    var maxes = [];
    	    for (var i=0; i<drilldata[0].length; i++) {
    		    maxes.push(0);
    	    }
    	    for (var i=0;i<drilldata.length;i++) {
    		    for (var h=0; h<drilldata[i].length; h++) {
    		        if (maxes[h]<drilldata[i][h]) {
    			        maxes[h] = drilldata[i][h];
    		        }
    		    }
    	    }
    	    for (var i=0;i<drilldata.length;i++) {
    		    for (var h=0; h<drilldata[i].length; h++) {
    		        drilldata[i][h] = drilldata[i][h] / maxes[h];
    		    }
    	    }

    	    // set the data properties
    	    renderer.settings.drillrows = drillrows;
    	    renderer.settings.drilldata = drilldata;
    	    renderer.settings.maxdepth  = maxdepth;
    	},
    	
    	drawImage: function (svg, index) {
    	    var renderer = window.rendererHeatmap[index];

    	    // initialize shortcut variables
    	    var numrows = renderer.settings.drillrows.length;
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

    	    var col_result = renderer.cluster(renderer.transpose(renderer.settings.drilldata));
    	    renderer.settings.data.colcluster = col_result[0];
    	    renderer.settings.data.colindex = col_result[1];
    	    var row_result = renderer.cluster(renderer.settings.drilldata);
    	    renderer.settings.data.rowcluster = row_result[0];
    	    renderer.settings.data.rowindex = row_result[1];
    	    renderer.drawDendogram(svg, index, 0);
    	    renderer.drawDendogram(svg, index, 1);

    	    // draw the heatmap
    	    for (var i=0;i<renderer.settings.drilldata.length;i++) {
    		    // draw row text
    		    var textx = renderer.settings.tree_width + displaywidth + 5;
    		    var texty = renderer.settings.tree_height + renderer.settings.legend_height + (boxheight * (i+1) - parseInt((boxheight - renderer.settings.row_text_size) / 2)) - 2;
    		    svg.text(null, textx, texty, ''+renderer.settings.drillrows[renderer.settings.data.rowindex[i]-1], { fill: "black", fontSize: renderer.settings.row_text_size+"px", onclick: "window.rendererHeatmap["+index+"].rowClick("+i+", "+index+");", cursor: "pointer" });
    		    renderer.settings.cells.push([]);
    		
    		    // draw cells
    		    for (var h=0;h<renderer.settings.drilldata[i].length;h++) {
    		        // draw column text
    		        if (i==0) {
    			        var ctextx = renderer.settings.tree_width + (boxwidth * h) + (parseInt((boxwidth - renderer.settings.col_text_size) / 2)) + 12;
    			        var ctexty = renderer.settings.legend_height - 5;
    			        svg.text(null, ctextx, ctexty, renderer.settings.data.columns[renderer.settings.data.colindex[h]-1], { fill: "black", fontSize: renderer.settings.col_text_size+"px", transform: "rotate(-90, "+ctextx+", "+ctexty+")", cursor: "pointer" });
    		        }

    		        // calculate box margins
    		        x = h * boxwidth + renderer.settings.tree_width;
    		        width = boxwidth;
    		        y = i * boxheight + renderer.settings.tree_height + renderer.settings.legend_height;
    		        height = boxheight;
                    
    		        // calculate box color
    		        var color = "black";
    		        var adjusted_value = (renderer.settings.drilldata[renderer.settings.data.rowindex[i]-1][renderer.settings.data.colindex[h]-1] * 2) - 1;
    		        var cval = parseInt(255 * Math.abs(adjusted_value));
    		        if (adjusted_value < 0) {
    			        color = "rgb("+cval+",0,0)";
    		        } else {
    			        color = "rgb(0,"+cval+",0)";
    		        }
    		        settings.fill = color;
    		        if (typeof renderer.settings.cellClicked == "function") {
    			        settings.onclick = "window.rendererHeatmap["+index+"].cellClick("+i+", "+h+", "+adjusted_value+", this, "+index+");";
    		        }
    		        if (typeof renderer.settings.cellHovered == "function") {
    			        settings.onmouseover = "window.rendererHeatmap["+index+"].cellHover(1, "+i+", "+h+", "+adjusted_value+", this, "+index+");";
    			        settings.onmouseout = "window.rendererHeatmap["+index+"].cellHover(0, "+i+", "+h+", "+adjusted_value+", this, "+index+");";
    		        }
                    
    		        // draw the box
    		        renderer.settings.cells[i][h] = svg.rect(null, x, y, width, height, rx, ry, settings);		    
    		    }
    	    }
    	},
    	
    	drawDendogram: function (svg, index, rotation) {
    	    var renderer = window.rendererHeatmap[index];

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
    	
    	rowClick: function (row, index) {
    	    var renderer = window.rendererHeatmap[index];
    	    if (renderer.settings.maxdepth[renderer.settings.drillrows[row]]) {
    		    alert('this is the maximum depth for this row');
    		    return;
    	    }
    	    renderer.settings.hierarchyLevel++;
    	    renderer.settings.filter = renderer.settings.drillrows[renderer.settings.data.rowindex[row] - 1];
    	    var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}window.rendererHeatmap['+index+'].updateVis('+index+', '+renderer.settings.hierarchyLevel+', \''+renderer.settings.filter+'\');">&raquo; '+renderer.settings.filter+' </a>';
    	    document.getElementById('heatmap_bread'+index).innerHTML += html;
    	    renderer.render(index);
    	},

    	cellClick: function (row, col, value, cell, index) {
    	    var renderer = window.rendererHeatmap[index];
    	    if (typeof renderer.settings.cellClicked == "function") {
    		    renderer.settings.cellClicked({row: row, col: col, value: value, cell: cell});
    	    }
    	},

    	cellHover: function (over, row, col, value, cell, index) {
    	    var renderer = window.rendererHeatmap[index];
    	    if (typeof renderer.settings.cellHovered == "function") {
    		    renderer.settings.cellHovered({over: over, row: row, col: col, value: value, cell: cell});
    	    }
    	},

        // clustsort: function (a, b) {
        //     return a.amin - b.amin;
        // },
    	
        // distance: function (data) {
        //     var distances = {};
        //     for (var i=0;i<data.length;i++) {
        //      distances[i] = {};
        //     }
        //     for (var i=0;i<data.length;i++) {
        //      for (var h=0;h<data.length;h++) {
        //          if (i>=h) {
        //              continue;
        //          }
        //          var dist = 0;
        //          for (var j=0;j<data[i].data[0].length;j++) {
        //              dist += Math.pow(data[i].data[0][j] - data[h].data[0][j], 2);
        //          }
        //          distances[i][h] = Math.pow(dist, 0.5);
        //      }
        //     }
        //     return distances;
        // },

    	transpose: function (data) {
    	    var result = [];
    	    for (i=0;i<data.length;i++) {
    		    for (h=0;h<data[i].length;h++) {
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
    	    for (i=0;i<data.length;i++) {
    		    clusters.push( { points: [ i ], data: [ data[i] ], basepoints: [ i ], level: [ 0 ] } );
    		    avail[i] = true;
    	    }

    	    // get the initial distances between all nodes
            // var distances = DrilldownHeatmapWidget.distance(clusters);
            var distances = {};
            for (var i=0;i<clusters.length;i++) {
                distances[i] = {};
            }
            for (var i=0;i<clusters.length;i++) {
                for (var h=0;h<clusters.length;h++) {
                    if (i>=h) {
                        continue;
                    }
                    var dist = 0;
                    for (var j=0;j<clusters[i].data[0].length;j++) {
                        dist += Math.pow(clusters[i].data[0][j] - clusters[h].data[0][j], 2);
                    }
                    distances[i][h] = Math.pow(dist, 0.5);
                }
            }
            
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

    	    	clusters.push({ points: [ coord_a, coord_b ], data: pdata, basepoints: bpoints, level: [ clusters[coord_a].level.max() + 1, clusters[coord_b].level.max() + 1 ] });

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
    		    var level = clusters[i].level.max() - 1;
    		    clusterdata[level].push({a: clusters[clusters[i].points[0]].data.length, b:clusters[clusters[i].points[1]].data.length, amin: roworder[clusters[clusters[i].points[0]].basepoints.min() + 1] });
                
    		    // draw single lines until we reach the next root
    		    if (clusters[i].level[0] != clusters[i].level[1]) {
    		        var n = 0;
    		        if (clusters[i].level[1] < clusters[i].level[0]) {
    			        n = 1;
    		        }
    		        for (var h=0;h<Math.abs(clusters[i].level[0] - clusters[i].level[1]);h++) {
    			        clusterdata[level - (h+1)].push({ a: clusters[clusters[i].points[n]].data.length, amin: roworder[clusters[clusters[i].points[n]].basepoints.min() + 1] });
    		        }
    		    }
    	    }

    	    // sort the clusterdata
    	    for (var i in clusterdata) {
    	    	if (clusterdata.hasOwnProperty(i) && ! isNaN(i)) {
                    clusterdata[i].sort( function (a, b) {
                        return a.amin - b.amin;
                    });
    	    	}
    	    }

    	    if (data.length < 20) {
    		    window.clustersx = clusters;
    		    window.clusterdatax = clusterdata;
    	    }

    	    return [clusterdata, rowindex];
    	},
    	
    	hashkeys: function(object) {
    	    if (object !== Object(object)) throw new TypeError('Invalid object');
    	    var keys = [];
    	    for (var key in object) {
    		    if (object.hasOwnProperty(key)) {
    		        keys[keys.length] = key;
    		    }
    	    }
    	    return keys;
    	}
    });
})(jQuery);
