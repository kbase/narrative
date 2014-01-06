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
    var renderer = Retina.Renderer.extend({
	about: {
	    name: "heatmap",
	    title: "Heatmap",
            author: "Tobias Paczian",
            version: "1.0",
            requires: [ "jquery.svg.js" ],
            defaults: {
		'width': 700,
		'height': 600,
		'tree_height': 50,
		'tree_width': 50,
		'legend_height': 250,
		'legend_width': 250,
		'row_text_size': 15,
		'col_text_size': 15,
		'min_cell_height': 19,
		'selectedRows': [],
		'data': {} }
	},
	exampleData: function () {
	    return { columns: ["4441619.3", "4441656.4", "4441620.3"], rows: ["Eukaryota", "unassigned", "Bacteria","Archaea"], data: [[0.238159580408187, 0.317179237742824, 0.114052821211353],[0.553202346761363, 0.614080873307415, 0.555096325148052],[0.996159994861707, 0.940468112695288, 1],[0.0842063017142708, 0, 0.202579077386122]], colindex: [ 3, 2, 1 ], rowindex: [ 2, 3, 1, 4 ], coldend: [ [ -1, -3, 0.0663059720008296 ], [ -2, 1, 0.121084448286984 ] ], rowdend: [ [ -2, -3, 0.26 ], [ -1, -4, 0.58 ], [ 1, 2, 0.87 ] ] };
        },

	render: function () {
	    renderer = this;
	    var index = renderer.index;

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
	    var index = 0;
	    while (document.getElementById('heatmap_div'+index)) {
		    index++;
	    }
	    target.innerHTML = "<div id='heatmap_div"+index+"'></div>";
	    target.firstChild.setAttribute('style', "width: "+ renderer.settings.width+"px; height: "+renderer.settings.height+"px;");
	    jQuery('#heatmap_div'+index).svg();
	    Retina.RendererInstances.heatmap[index].drawImage(jQuery('#heatmap_div'+index).svg('get'), renderer.index);
	    
	    return renderer;
	},

	drawImage: function (svg, index) {
	    renderer = Retina.RendererInstances.heatmap[index];

	    // initialize shortcut variables
	    var data = renderer.settings.data;
	    var numrows = data.rows.length;
	    var numcols = data.columns.length;
	    var boxwidth = parseInt((renderer.settings.width - renderer.settings.legend_width - renderer.settings.tree_width) / numcols);
	    renderer.settings.boxwidth = boxwidth;
	    var boxheight = parseInt((renderer.settings.height - renderer.settings.legend_height - renderer.settings.tree_height) / numrows);
	    renderer.settings.boxheight = boxheight;
	    var displaywidth = parseInt(renderer.settings.width - renderer.settings.legend_width - renderer.settings.tree_width);
	    var displayheight = parseInt(renderer.settings.height - renderer.settings.legend_height - renderer.settings.tree_height);

	    var x = 0;
	    var y = 0;
	    var rx = 0;
	    var ry = 0;
	    var width = 0;
	    var height = 0;
	    var settings = {fill: 'red', strokeWidth: 1, stroke: 'black'};

	    // draw the heatmap
	    for (i=0;i<data.data.length;i++) {
		// draw row text
		var textx = renderer.settings.tree_width + displaywidth + 5;
		var texty = renderer.settings.tree_height + renderer.settings.legend_height + (boxheight * (i+1) - parseInt((boxheight - renderer.settings.row_text_size) / 2));
		var fontColor = "black";
		if (renderer.settings.selectedRows[i]) {
		    fontColor = "blue";
		}
		svg.text(null, textx, texty, ''+data.rows[renderer.settings.data.rowindex[i]-1], { fill: fontColor, fontSize: renderer.settings.row_text_size+"px", onclick: "Retina.RendererInstances.heatmap["+index+"].toggleSelected("+i+", "+index+");" });

		// draw cells
		for (h=0;h<data.data[i].length;h++) {
		    // draw column text
		    if (i==0) {
			var ctextx = renderer.settings.tree_width + (boxwidth * h) + (parseInt((boxwidth - renderer.settings.col_text_size) / 2));
			var ctexty = renderer.settings.legend_height - 5;
			svg.text(null, ctextx, ctexty, data.columns[renderer.settings.data.colindex[h]-1], { fontSize: renderer.settings.col_text_size+"px", transform: "rotate(-90, "+ctextx+", "+ctexty+")" });
			
		    }

		    // calculate box margins
		    x = h * boxwidth + renderer.settings.tree_width;
		    width = boxwidth;
		    y = i * boxheight + renderer.settings.tree_height + renderer.settings.legend_height;
		    height = boxheight;

		    // calculate box color
		    var color = "black";
		    var adjusted_value = (data.data[renderer.settings.data.rowindex[i]-1][renderer.settings.data.colindex[h]-1] * 2) - 1;
		    var cval = parseInt(255 * Math.abs(adjusted_value));
		    if (adjusted_value < 0) {
			color = "rgb("+cval+",0,0)";
		    } else {
			color = "rgb(0,"+cval+",0)";
		    }
		    settings.fill = color;
		    settings.onclick = "Retina.RendererInstances.heatmap["+index+"].toggleSelected("+i+", "+index+");";

		    // draw the box
		    svg.rect(null, x, y, width, height, rx, ry, settings);		    
		}
	    }
	    
	    Retina.RendererInstances.heatmap[index].drawDendogram(svg, index, 0);
	    Retina.RendererInstances.heatmap[index].drawDendogram(svg, index, 1);
	},
	
	drawDendogram: function (svg, index, rotation) {
	    renderer = Retina.RendererInstances.heatmap[index];

	    var height = rotation ? renderer.settings.tree_width : renderer.settings.tree_height;
	    var data = rotation ? renderer.settings.data.rowdend : renderer.settings.data.coldend;
	    var d_array = rotation ? renderer.settings.data.rowindex : renderer.settings.data.colindex;
	    var cell_w = rotation ? renderer.settings.boxheight : renderer.settings.boxwidth;
	    var x = rotation ? 0 : renderer.settings.tree_width;
	    var y = rotation ? renderer.settings.height : renderer.settings.legend_height + renderer.settings.tree_height;
	    var interval = parseInt(height / data.length);
	    var pairs = new Array;
	    var path = "";
	    for (i=0;i<data.length;i++) {
		var r = { x: 0, y: 0, value: d_array.indexOf(Math.abs(data[i][0])) };
		var l = { x: 0, y: 0, value: d_array.indexOf(Math.abs(data[i][1])) };
		
		if (data[i][0] < 0 && data[i][1] < 0) {
		    r.x = (r.value * cell_w) + x + (cell_w / 2);
		    r.y = y;
		    l.x = (l.value * cell_w) + x + (cell_w / 2);
		    l.y = y;
		} 
		else {
		    if (data[i][0] < 0) {
			r.x = (r.value * cell_w) + x + (cell_w / 2);
			r.y = y;
		    } else {
			r.x = pairs[(data[i][0]-1)][0];
			r.y = pairs[(data[i][0]-1)][1];
		    }
		    if (data[i][1] < 0) {
			l.x = (l.value * cell_w) + x + (cell_w / 2);
			l.y = y;
		    } else {
			l.x = pairs[(data[i][1]-1)][0];
			l.y = pairs[(data[i][1]-1)][1];
		    }
		}
		
		var h = ((r.y-interval) < (l.y-interval)) ? (r.y-interval) : (l.y-interval);    
		path += "M"+parseInt(r.x)+","+parseInt(r.y)+"L"+parseInt(r.x)+","+parseInt(h)+"L"+parseInt(l.x)+","+parseInt(h)+"L"+parseInt(l.x)+","+parseInt(l.y);      
		pairs.push([((l.x+r.x)/2), h]);
	    }
	    if (rotation) {
		svg.path(null, path, {fill:"none", stroke: "black", transform: "rotate(-90) translate(-"+renderer.settings.height+",-"+(renderer.settings.height - renderer.settings.tree_width)+")" });
	    } else {
		svg.path(null, path, {fill:"none", stroke: "black" });
	    }
	},
	
	toggleSelected: function (row, index) {
	    renderer = Retina.RendererInstances.heatmap[index];

	    if (renderer.settings.selectedRows[row]) {
		renderer.settings.selectedRows[row] = 0;
	    } else {
		renderer.settings.selectedRows[row] = 1;
	    }

	    renderer.render();
	}
    });
}).call(this);
