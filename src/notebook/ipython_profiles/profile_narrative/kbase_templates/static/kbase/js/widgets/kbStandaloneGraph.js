/*
  Graph Renderer

  Displays a graph of pie / bar charts with an optional legend.

  Options

  type (STRING)
      Defines the display type of the graph, can be one of
        pie
        column
        stackedColumn
        row
        stackedRow
        line
	stackedArea
      Default is column.

  title (STRING)
      Title string written at the top of the graph
  
  title_color (CSS Color Value)
      Color of the title text. Default is black.

  title_settings (SVG settings object)
      SVG settings for the title.

  x_title (STRING)
      Title written below the x-axis.

  y_title (STRING)
      Title written to the left of the y-axis.

  x_title_color (CSS Color Value)
      Color of the x-axis title string. Default is black.

  y_title_color (CSS Color Value)
      Color of the y-axis title string. Default is black.

  x_labels (ARRAY of STRING)
      List of the labels at the ticks of the x-axis.

  x_labels_rotation (STRING)
      A string representing the number of degrees to rotate the labels on the x-axis. Default is 0.

  y_labels (ARRAY of STRING)
      List of the labels at the ticks of the y-axis. If no list is passed will use the y-valus.

  x_tick_interval (INT)
      Determines how many ticks are actually drawn on the x-axis. Default is 0.

  y_tick_interval (INT)
      Determines how many ticks are actually drawn on the y-axis. Default is 30.
  
  x_labeled_tick_interval (INT)
      Determines which ticks on the x-axis get labels. Default is 1.

  y_labeled_tick_interval (INT)
      The number of y-axis ticks that get labels. Default is 5.

  default_line_color (CSS Color Value)
      Determines the color of lines if not specified for an individual line. Default is black.

  default_line_width (INT)
      Number of pixels lines should be wide if not specified for an individual line. Default is 1.

  show_legend (BOOLEAN)
      Turns the display of the legend on / off. Default ist true.

  legend_position (STRING)
      Can be one of
        left
        right
        top
        bottom

  chartArea (ARRAY of FLOAT)
     The values passed correspond to the left, top, width and height of the chart area respectively. The position is relative to the top left corner of the containing div. Values less than 1 are interpreted as fractions. Values greater than 1 are interpreted as absolute pixel values. Note that the labels are drawn to the left and bottom of these margins.

  legendArea (ARRAY of FLOAT)
      If this parameter is set, the legend_position parameter will not be used. Instead pass an array of floats. The values correspond to the left, top, width and height of the legend area respectively. The position is relative to the top left corner of the containing div. Values less than 1 are interpreted as fractions. Values greater than 1 are interpreted as absolute pixel values.
  
  width (INT)
      The width of the graph in pixel (including legend).
  
  height (INT)
      The height of the graph in pixel (including legend).

  data (ARRAY of OBJECT)
      List of data series. Each series has a name and a data attribute. The data attribute is a list of y-values for the series.

  onclick (FUNCTION)
      The passed function will be called when a bar / pie slice is clicked. It will receive an object with the attributes
        series - the name of the series this bar belongs to
        value  - the value of the bar
        label  - the label of the bar
        item   - the svg element that was clicked
        index  - the zero based index of this bar within its series
        series_index - the zero based index of this series

  normalize_stacked_area (boolean)
      If set to false the stacked area chart will not normalize the values
*/
(function () {
    var root = this;
    var standaloneGraph = root.standaloneGraph = {
	about: {
	    name: "graph",
	    title: "Graph",
            author: "Tobias Paczian",
            version: "1.0",
            defaults: {
		'type': 'column', // [ column, stackedColumn, row, stackedRow, line, pie, stackedArea, deviation ]
		'title': '',
		'title_color': 'black',
		'title_settings': { fontSize: '15px' },
		'x_title': '',
		'y_title': '',
		'y2_title': '',
		'x_title_color': 'black',
		'y_title_color': 'black',
		'y2_title_color': 'black',
		'x_labels': [],
		'x_labels_rotation': null,
		'y_labels': [],
		'y_scale': 'linear',
		'y2_labels': [],
		'y2_scale': 'linear',
		'x_tick_interval': 0,
		'y_tick_interval': 30,
		'y2_tick_interval': 30,
		'x_labeled_tick_interval': 1,
		'y_labeled_tick_interval': 5,
		'y2_labeled_tick_interval': 5,
		'default_line_color': 'black',
		'default_line_width': 1,
		'show_legend': false,
		'legend_position': 'right',
		'show_grid': false,
		'short_axis_labels': false,
		'normalize_stacked_area': true,
		'width': 800,
		'height': 400
	    },
	    options: [
		{ general:
		  [
		      { name: 'type', type: 'select', description: "type of the graph", title: "type", options: [
			  { value: "column", selected: true },
			  { value: "stackedColumn", label: "stacked column" },
			  { value: "row" },
			  { value: "stackedRow", label: "stacked row" },
			  { value: "line" },
			  { value: "pie" },
			  { value: "stackedArea", label: "stacked area" },
			  { value: "deviation", label: "deviation" } ] },
		      { name: 'default_line_color', type: 'color', description: "default color of the data lines of the graph", title: "default line color" },
		      { name: 'default_line_width', type: 'int', description: "default width of the data lines of the graph in pixel", title: "default line width" },
		      { name: 'show_grid', type: 'select', description: "sets whether grid is displayed or not", title: "show grid", options: [
			  { value: 0, selected: true, label: "no" },
			  { value: 1, label: "yes" } ] }    
		  ]
		},
		{ text:
		  [
		      { name: 'title', type: 'text', description: "title string of the graph", title: "title" },
		      { name: 'title_color', type: 'color', description: "color of the title string of the graph", title: "title color" },
		      { name: 'x_title', type: 'text', description: "title of the x-axis of the graph", title: "x title" },
		      { name: 'y_title', type: 'text', description: "title of the y-axis of the graph", title: "y title" },
		      { name: 'x_title_color', type: 'color', description: "color of the title of the x-axis of the graph", title: "x title color" },
		      { name: 'y_title_color', type: 'color', description: "color of the title of the y-axis of the graph", title: "y title color" },
		      { name: 'x_labels_rotation', type: 'int', description: "rotation in degrees of the x-axis labels", title: "x label rotation" }
		  ]
		},
		{ layout:
		  [
		      { name: 'width', type: 'int', description: "width of the graph in pixel", title: "width" },
		      { name: 'height', type: 'int', description: "height of the graph in pixel", title: "height" },
		      { name: 'show_legend', type: 'select', description: "sets whether the legend is displayed or not",
			title: "show legend", options: [
			    { value: 0, selected: true, label: "no" },
			    { value: 1, label: "yes" } ] },
		      { name: 'legend_position', 
			type: 'select',
			description: "position of the legend",
			title: "legend position",
			options: [ { value: "left", selected: true },
				   { value: "right" },
				   { value: "top" },
				   { value: "bottom" } ] }
		  ]
		},
		{ axes:
		  [
		      { name: 'y_scale', type: 'select', description: "type of the scale of the y-axis",
			title: "y scale", options: [
			    { value: "linear", selected: true },
			    { value: "log" } ] },
		      { name: 'x_tick_interval', type: 'int',
			description: "pixel distance of the minor tickmarks on the x-axis", title: "minor x ticks" },
		      { name: 'y_tick_interval', type: 'int',
			description: "pixel distance of the minor tickmarks on the y-axis", title: "minor y ticks" },
		      { name: 'x_labeled_tick_interval', type: 'int',
			description: "pixel distance of the major tickmarks on the x-axis", title: "major x ticks" },
		      { name: 'y_labeled_tick_interval', type: 'int',
			description: "pixel distance of the major tickmarks on the y-axis", title: "major y ticks" },
		      { name: 'short_axis_labels', type: 'select',
			description: "sets whether the axis labels should be shortened or not", title: "short axis labels", options: [
			    { value: 0, selected: true, label: "no" },
			    { value: 1, label: "yes" } ] },
		  ]
		}
	    ]
	},
	exampleData: function () {
	    return [ { "name": 'IE', "data": [95, 91, 78, 66] },
		     { "name": 'Netscape', "data": [3, 12, 18, 18] },
		     { "name": 'Firefox', "data": [0, 4, 8, 9] },
		     { "name": 'Chrome', "data": [0, 8, 18, 22] },
		     { "name": 'Gecko', "data": [1, 2, 3, 33] } ];
        },

	create: function (params) {
	    var renderer = this;
	    if (! window.hasOwnProperty('rendererGraph')) {
		window.rendererGraph = [];
	    }
	    var instance = { settings: {},
			     index: params.index };
	    jQuery.extend(true, instance, renderer);
	    jQuery.extend(true, instance.settings, renderer.about.defaults, params);
	    window.rendererGraph.push(instance);

	    return instance;
	},

	render: function (index) {
	    var renderer = rendererGraph[index];

	    // get the target div
	    var target = renderer.settings.target;
	    var index = renderer.index;
	    target.innerHTML = "<div id='graph_div"+index+"'></div>";
	    target.firstChild.setAttribute('style', "width: "+ renderer.settings.width+"px; height: "+renderer.settings.height+"px;");
	    jQuery('#graph_div'+index).svg();

	    var cmax = 0;
	    if (renderer.settings.type == 'deviation' && ! renderer.settings.data[0].data.hasOwnProperty('upper')) {
		renderer.calculateData(renderer.settings.data, index);
		cmax = renderer.cmax;
	    }

	    rendererGraph[index].drawImage(jQuery('#graph_div'+index).svg('get'), cmax, index);
	    
	    return renderer;
	},
	hover: function (title, value, event, e) {
	    var id = e.currentTarget.ownerSVGElement.ownerSVGElement.parentNode.id;
	    var index = id.substr(9);
	    var renderer = rendererGraph[index];
	    var svg = jQuery('#'+id).svg('get');
	    if (title) {
		jQuery(this, svg.root()).attr('fill-opacity', .8);
		jQuery(this, svg.root()).attr('title', title+": "+value);
	    } else {
		jQuery(this, svg.root()).attr('fill-opacity', 1);
	    }
	    if (event == 'click') {
		var num = parseInt(this.parentElement.className.baseVal.substr(this.parentElement.className.baseVal.search(/\d+/)));
		svg.graph.options({ explode: [ num ], explodeDist: 15 });

		if (typeof(renderer.settings.onclick) == "function") {
		    var label = "";
		    var i;
		    for (i=0;i<this.parentElement.children.length;i++) {
			if (this.parentElement.children[i] === this) {
			    if (this.getAttribute('r')) {
				i--;
			    }
			    label = svg.graph.xAxis.labels().labels[i];
			    break;
			}
		    }
		    renderer.settings.onclick({rendererIndex: index, series: title, value: value, label: label, item: this, index: i, series_index: num, svg: svg });
		}
	    }
	},
	drawImage: function (svg, cmax, index) {
	    var renderer = rendererGraph[index];
	    var chartAreas = [ [ 0.1, 0.1, 0.95, 0.9 ],   // no legend
			       [ 0.2, 0.1, 0.95, 0.9 ],   // legend left
			       [ 0.1, 0.1, 0.75, 0.9 ],   // legend right
			       [ 0.1, 0.25, 0.9, 0.9 ],   // legend top
			       [ 0.1, 0.1, 0.9, 0.8  ] ]; // legend bottom

	    var legendAreas = [ [ 0.0, 0.0, 0.0, 0.0     ],   // no legend
				[ 0.005, 0.1, 0.125, 0.5 ],   // left
				[ 0.8, 0.1, 0.97, 0.5    ],   // right
				[ 0.2, 0.1, 0.8, 0.2     ],   // top
				[ 0.2, 0.9, 0.8, 0.995   ] ]; // bottom

	    var fills = [ 'url(#fadeBlue)', 'url(#fadeRed)', 'url(#fadeGreen)', 'url(#fadeYellow)', 'url(#fadeLightblue)', 'url(#fadePurple)' ];
	    
	    var colors = [ '#0044CC', // blue
			   '#BD362F', // red
			   '#51A351', // green
			   '#F89406', // yellow
			   '#2F96B4', // lightblue
			   '#bd2fa6'  // purple 
			 ];
	    
	    var defs = svg.defs();
	    var max = 0;
	    var y2max = 0;
	    for (i=0; i<renderer.settings.data.length; i++) {
		for (h=0; h<renderer.settings.data[i].data.length; h++) {
		    if (renderer.settings.data[i].settings && renderer.settings.data[i].settings.isY2) {
			if (parseFloat(renderer.settings.data[i].data[h]) > y2max) {
			    y2max = parseFloat(renderer.settings.data[i].data[h]);
			}
		    } else { 
			if (parseFloat(renderer.settings.data[i].data[h]) > max) {
			    max = parseFloat(renderer.settings.data[i].data[h]);
			}
		    }
		}
	    }
	    max = cmax || max;
	    
	    svg.linearGradient(defs, 'fadeRed', [[0, '#EE5F5B'], [1, '#BD362F']]); 
	    svg.linearGradient(defs, 'fadeBlue', [[0, '#0088CC'], [1, '#0044CC']]); 
	    svg.linearGradient(defs, 'fadeGreen', [[0, '#62C462'], [1, '#51A351']]);
	    svg.linearGradient(defs, 'fadeYellow', [[0, '#FBB450'], [1, '#F89406']]);
	    svg.linearGradient(defs, 'fadeLightblue', [[0, '#5BC0DE'], [1, '#2F96B4']]);
	    svg.linearGradient(defs, 'fadePurple', [[0, '#ee5be0'], [1, '#bd2fa6']]);

	    svg.graph.shortAxisLabels = renderer.settings.short_axis_labels;
	    svg.graph.normalizeStackedArea = renderer.settings.normalize_stacked_area;

	    svg.graph.noDraw().title(renderer.settings.title, renderer.settings.title_color, renderer.settings.title_settings);
	    svg.graph.noDraw().format('white', renderer.settings.show_grid ? 'gray' : 'white' );
	    if (renderer.settings.show_grid) {
		svg.graph.noDraw().gridlines({stroke: 'gray', strokeDashArray: '2,2'}, 'gray');
	    }

	    for (i=0;i<renderer.settings.data.length;i++) {
		svg.graph.noDraw().addSeries( renderer.settings.data[i].name, renderer.settings.data[i].data, null, renderer.settings.data[i].lineColor || 'white', renderer.settings.data[i].lineWidth || renderer.settings.default_line_width, renderer.settings.data[i].settings ? renderer.settings.data[i].settings : {});
	    }
	    
	    svg.graph.xAxis.title(renderer.settings.x_title, renderer.settings.x_title_color).
		ticks(renderer.settings.x_labeled_tick_interval, renderer.settings.x_tick_interval).
		scale(0, 3);
	    if (renderer.settings.x_labels.length) {
		svg.graph.xAxis.labelRotation = renderer.settings.x_labels_rotation;
		svg.graph.xAxis.labels(renderer.settings.x_labels);
	    }
	    svg.graph.yAxis.
		title(renderer.settings.y_title, renderer.settings.y_title_color).
		ticks(parseInt(max / renderer.settings.y_labeled_tick_interval), parseInt(max / renderer.settings.y_tick_interval), 'log').
		scale(0,max,renderer.settings.y_scale);

	    if (renderer.settings.hasY2) {
		svg.graph.y2Axis.
		    title(renderer.settings.y2_title || "", renderer.settings.y2_title_color).
		    ticks(parseInt(y2max / renderer.settings.y2_labeled_tick_interval), parseInt(y2max / renderer.settings.y2_tick_interval), 'log').
		    scale(0,y2max,renderer.settings.y2_scale);
		if (renderer.settings.y2_labels.length) {
		    svg.graph.y2Axis.labels(renderer.settings.y2_labels); 
		}
	    } else {
		svg.graph.y2Axis = null;
	    }
	    
	    if (renderer.settings.y_labels.length) {
		svg.graph.yAxis.labels(renderer.settings.y_labels); 
	    }
	    svg.graph.legend.settings({fill: 'white', stroke: 'white'}); 
	    
	    var chartType = renderer.settings.type;
	    var chartLegend = 0;
	    if (renderer.settings.show_legend) {
		switch (renderer.settings.legend_position) {
		case 'left': chartLegend = 1; 
		    break;
		case 'right': chartLegend = 2;
		    break;
		case 'top': chartLegend = 3;
		    break;
		case 'bottom': chartLegend = 4;
		    break;
		};
	    }
	    var chartOptions = { barWidth: renderer.settings.barWidth || 25 };
	    	    
	    svg.graph.status(rendererGraph[index].hover);

	    svg.graph.noDraw(). 
		legend.show(renderer.settings.show_legend).area(renderer.settings.legendArea ? renderer.settings.legendArea : legendAreas[chartLegend]).end();
	    for (i=0; i< renderer.settings.data.length; i++) {
		svg.graph.noDraw().series(i).format(renderer.settings.data[i].fill || fills[i]).end();
	    }
	    svg.graph.noDraw().area(renderer.settings.chartArea ? renderer.settings.chartArea : chartAreas[chartLegend]).
		type(chartType, chartOptions).redraw();
	},
	calculateData: function (data, index) {
	    var renderer = rendererGraph[index];
	    var fivenumbers = [];
	    var min = data[0].data[0];
	    var max = data[0].data[0];
	    
	    for (var i=0;i<data.length;i++) {
		data[i].data = data[i].data.sort(function (a, b) {
		    return a - b;
		});
		if (data[i].data[0] < min) {
		    min = data[i].data[0];
		}
		if (data[i].data[data[i].length - 1] > max) {
		    max = data[i].data[data[i].length - 1];
		}
		fivenumbers[i] = [];
		fivenumbers[i]['min'] = data[i].data[0];
		fivenumbers[i]['max'] = data[i].data[data[i].data.length - 1];
		var boxarray = [];
		if (data[i].data.length % 2 == 1) {
		    var med = parseInt(data[i].data.length / 2);
		    fivenumbers[i]['median'] = data[i].data[med];
		    if ((med + 1) % 2 == 1) {
			fivenumbers[i]['lower'] = data[i].data[parseInt((med + 1) / 2)];
			fivenumbers[i]['upper'] = data[i].data[med + parseInt((med + 1) / 2)];
		    } else {
			fivenumbers[i]['lower'] = ((data[i].data[(med + 1) / 2]) + (data[i].data[((med + 1) / 2) + 1])) / 2;
			fivenumbers[i]['upper'] = ((data[i].data[med + ((med + 1) / 2) - 1]) + (data[i].data[med + ((med + 1) / 2)])) / 2;
		    }
		} else {
		    var medup = data[i].data.length / 2;
		    var medlow = (data[i].data.length / 2) - 1;
		    fivenumbers[i]['median'] = (data[i].data[medlow] + data[i].data[medup]) / 2;
		    if (medup % 2 == 1) {
			fivenumbers[i]['lower'] = data[i].data[medlow / 2];
			fivenumbers[i]['upper'] = data[i].data[medup + (medlow / 2)];
		    } else {
			fivenumbers[i]['lower'] = (data[i].data[(medup / 2) - 1] + data[i].data[medup / 2]) / 2;
			fivenumbers[i]['upper'] = (data[i].data[medup + (medup / 2) - 1] + data[i].data[medup + (medup / 2)]) / 2;
		    }
		}
	    }

	    for (var i=0; i<data.length; i++) {
		renderer.settings.data[i].data = [ fivenumbers[i] ];
	    }
	    renderer.cmax = max;
	}
    }
}).call(this);
