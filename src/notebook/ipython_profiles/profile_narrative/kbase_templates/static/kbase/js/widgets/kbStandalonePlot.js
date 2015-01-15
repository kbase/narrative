/*
  Plot Renderer

  Displays a two dimensional plot.

  Options

  title (STRING)
      Title string written at the top of the plot
  
  title_color (CSS Color Value)
      Color of the title text. Default is black.

  default_line_color (CSS Color Value)
      Determines the color of lines if not specified for an individual line. Default is black.

  default_line_width (INT)
      Number of pixels lines should be wide if not specified for an individual line. Default is 1.
  
  width (INT)
      The width of the graph in pixel (including legend).
  
  height (INT)
      The height of the graph in pixel (including legend).

  show_dots (BOOLEAN)
      display circles at the data points (for connected mode only)

  connected (BOOLEAN)
      connect the dots. This will disable the shape attribute of the series.

  data (OBJECT)
      series (OBJECT)
        name (STRING) - name of the series
	color (CSS Color value) - color of the series
	shape [ 'cicrle', 'triangle', 'square' ] - shape of the points (connected==false only)
      points (ARRAY of OBJECT)
        x (FLOAT) - x coordinate
	y (FLOAT) - y coordinate

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

  x_min (FLOAT)
      minimum x value

  y_min (FLOAT)
      minimum y value

  x_max (FLOAT)
      maximim x value

  y_max (FLOAT)
      maximum y value

  x_title (STRING)
      title of the x axis

  y_title (STRING)
      title of the y axis

  x_scale (STRING)
      can be either 'linear' or 'log', default is linear.

  y_scale (STRING)
      can be either 'linear' or 'log', default is linear

  x_titleOffset (INT)
      pixels offset of the x axis title, default is 35.

  y_titleOffset (INT)
      pixels offset of the y axis title, default is 45.

  titleOffset (INT)
      pixels offset of the plot title

  drag_select (FUNCTION)
      function to be called for drag select. This function will get passed an array of the selected points.
  
*/
(function () {
    var root = this;
    var standalonePlot = root.standalonePlot = {
	about: {
	    name: "plot",
	    title: "Plot",
            author: "Tobias Paczian",
            version: "1.0",
            defaults: {
		'title': '',
		'title_color': 'black',
		'default_line_color': 'black',
		'default_line_width': 1,
		'show_legend': true,
		'legend_position': 'right',
		'series': [],
		'connected': true,
		'show_dots': true,
		'width': 800,
		'height': 400,
		'x_min': undefined,
		'x_max': undefined,
		'y_min': undefined,
		'y_max': undefined,
		'x_scale': 'linear',
		'y_scale': 'linear',
		'x_title': '',
		'y_title': '',
		'x_titleOffset': 35,
		'y_titleOffset': 45,
		'titleOffset': 0,
		'drag_select': null,
		'data': undefined },
	    options: [
		{ general:
		  [
		      { name: 'default_line_color', type: 'color', description: "default color of the data lines of the plot",
			title: "default line color" },
		      { name: 'default_line_width', type: 'int', description: "default width of the data lines of the plot in pixel",
			title: "default line width" },
		      { name: 'connected', type: 'bool', description: "sets whether the data points are connected or not",
			title: "connected", defaultTrue: true },
		      { name: 'show_dots', type: 'bool', description: "sets whether the data points are displayed or not",
			title: "show dots", defaultTrue: true },
		  ]
		},
		{ text:
		  [
		      { name: 'title', type: 'text', description: "title string of the plot", title: "title" },
		      { name: 'title_color', type: 'color', description: "color of the title string of the plot", title: "title color" },
		      { name: 'x_title', type: 'text', description: "title of the x-axis of the plot", title: "x title" },
		      { name: 'y_title', type: 'text', description: "title of the y-axis of the plot", title: "y title" },
		      { name: 'x_titleOffset', type: 'int', description: "title offset from the x-axis", title: "x title offset" },
		      { name: 'y_titleOffset', type: 'int', description: "title offset from the y-axis", title: "y title offset" },
		      { name: 'titleOffset', type: 'int', description: "title offset from the top", title: "title offset" },
		  ]
		},
		{ layout:
		  [
		      { name: 'show_legend', type: 'bool', description: "sets whether the legend is displayed or not",
			title: "show legend", defaultTrue: true },
		      { name: 'width', type: 'int', description: "width of the plot in pixel", title: "width" },
		      { name: 'height', type: 'int', description: "height of the plot in pixel", title: "height" },
		      { name: 'legend_position', type: 'select',
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
		      { name: 'x_min', type: 'int', description: "minimum value of the x-axis", title: "x min" },
		      { name: 'x_max', type: 'int', description: "maximum value of the x-axis", title: "x max" },
		      { name: 'y_min', type: 'int', description: "minimum value of the y-axis", title: "y min" },
		      { name: 'y_max', type: 'int', description: "maximum value of the y-axis", title: "y max" },
		      
		      { name: 'y_scale', type: 'select', description: "type of the scale of the y-axis",
			title: "y scale", options: [
			    { value: "linear", selected: true },
			    { value: "log" } ] },
		      { name: 'x_scale', type: 'select', description: "type of the scale of the x-axis",
			title: "x scale", options: [
			    { value: "linear", selected: true },
			    { value: "log" } ] }
		  ]
		}
	    ]
	},
	exampleData: function () {
	    return { series: [ { name: "cool", color: 'blue', shape: 'circle' },
			       { name: "uncool", color: 'red', shape: 'square' },
			       { name: "semi-cool", color: 'orange', shape: 'triangle' } ],
		     points: [ [ { x: 0.5,  y: 7 },
				 { x: 0.15,  y: 5  },
				 { x: 0.5, y: 15  } ],
			       [ { x: 0,  y: 0 },
				 { x: 0.25,  y: 35  },
				 { x: 0.35, y: 90  } ],
			       [ { x: 0.8,  y: 80 },
				 { x: 0.49,  y: 50  },
				 { x: 0.15, y: 10  } ]
			     ] };
        },

	create: function (params) {
	    var renderer = this;
	    if (! window.hasOwnProperty('rendererPlot')) {
		window.rendererPlot = [];
	    }
	    var instance = { settings: {},
			     index: params.index };
	    jQuery.extend(true, instance, renderer);
	    jQuery.extend(true, instance.settings, renderer.about.defaults, params);
	    window.rendererPlot.push(instance);

	    return instance;
	},
	
	render: function (index) {
	    var renderer = rendererPlot[index];
	    
	    // get the target div
	    var target = renderer.settings.target;
	    target.innerHTML = "<div id='plot_div"+index+"'></div>";
	    target.firstChild.setAttribute('style', "width: "+ renderer.settings.width+"px; height: "+renderer.settings.height+"px;");
	    jQuery('#plot_div'+index).svg().bind('dragstart', function(event) { event.preventDefault(); });
	    rendererPlot[index].svg = jQuery('#plot_div'+index).svg('get');
	    rendererPlot[index].drawImage(rendererPlot[index].svg, index);

	    if (renderer.settings.drag_select && typeof(renderer.settings.drag_select) == 'function') {
		var svg = document.getElementById('plot_div'+index).firstChild;
		trackMarquee(svg, renderer.settings.drag_select);
	    }

	    return renderer;
	},

	niceNum: function (range, round) {
            var exponent = Math.floor(Math.log10(range)); /** exponent of range */
            var fraction = range / Math.pow(10, exponent); /** fractional part of range */
            var niceFraction; /** nice, rounded fraction */
	    
            if (round) {
		if (fraction < 1.5) {
                    niceFraction = 1;
		} else if (fraction < 3) {
                    niceFraction = 2;
		} else if (fraction < 7) {
                    niceFraction = 5;
		} else {
                    niceFraction = 10;
		}
            } else {
		if (fraction <= 1) {
                    niceFraction = 1;
		} else if (fraction <= 2) {
                    niceFraction = 2;
		} else if (fraction <= 5) {
                    niceFraction = 5;
		} else {
                    niceFraction = 10;
		}
            }
	    
            return niceFraction * Math.pow(10, exponent);
	},
	
	/* get a nice scale, min, max and tick interval */
	niceScale: function (params) {
 	    var minPoint = params.min;
	    var maxPoint = params.max;
	    var maxTicks = params.ticks || 10;
	    var range = rendererPlot[0].niceNum(maxPoint - minPoint, false);
	    var tickSpacing = rendererPlot[0].niceNum(range / (maxTicks - 1), true);
	    var niceMin = Math.floor(minPoint / tickSpacing) * tickSpacing;;
	    var niceMax = Math.ceil(maxPoint / tickSpacing) * tickSpacing;
	    
	    return { min: niceMin, max: niceMax, space: tickSpacing };
	},
	
	drawImage: function (svg, index) {
	    var renderer = rendererPlot[index];
	    
	    var chartAreas  = [ [ 0.1, 0.1, 0.95, 0.9 ],
				[ 0.2, 0.1, 0.95, 0.9 ],
				[ 0.1, 0.1, 0.8, 0.9 ],
				[ 0.1, 0.25, 0.9, 0.9 ],
				[ 0.1, 0.1, 0.9, 0.8 ] ]; 
	    var legendAreas = [ [ 0.0, 0.0, 0.0, 0.0 ],
				[ 0.005, 0.1, 0.125, 0.5 ],
				[ 0.85, 0.1, 0.97, 0.5 ],
				[ 0.2, 0.1, 0.8, 0.2 ],
				[ 0.2, 0.9, 0.8, 0.995 ] ]; 
	    
	    var colors = [ '#BD362F', // red
			   '#0044CC', // blue
			   '#51A351', // green
			   '#F89406', // yellow
			   '#2F96B4', // lightblue
			   '#bd2fa6'  // purple 
			 ];

	    if (renderer.settings.x_min === undefined) {
		var x_min = undefined;
		var x_max = undefined;
		var y_min = undefined;
		var y_max = undefined;
		for (var i=0; i<renderer.settings.data.points.length; i++) {
		    for (var h=0; h<renderer.settings.data.points[i].length; h++) {
			if (x_min === undefined || renderer.settings.data.points[i][h].x < x_min) x_min = renderer.settings.data.points[i][h].x;
			if (x_max === undefined || renderer.settings.data.points[i][h].x > x_max) x_max = renderer.settings.data.points[i][h].x;
			if (y_min === undefined || renderer.settings.data.points[i][h].y < y_min) y_min = renderer.settings.data.points[i][h].y;
			if (y_max === undefined || renderer.settings.data.points[i][h].y > y_max) y_max = renderer.settings.data.points[i][h].y;
		    }
		}
		var sx = rendererPlot[0].niceScale({min: x_min, max: x_max});
		renderer.settings.x_min = sx.min;
		renderer.settings.x_max = sx.max;
		var sy = rendererPlot[0].niceScale({min: y_min, max: y_max});
		renderer.settings.y_min = sy.min;
		renderer.settings.y_max = sy.max;
	    }
	    
	    svg.plot.noDraw().title(renderer.settings.title, renderer.settings.titleOffset, renderer.settings.title_color, renderer.settings.title_settings);
	    for (i=0;i<renderer.settings.data.length;i++) {
		var d = renderer.settings.data[i];
	    }
	    
	    svg.plot.plotPoints = renderer.settings.data.points;
	    svg.plot.connected = renderer.settings.connected;
	    svg.plot.showDots = renderer.settings.show_dots;
	    svg.plot.series = renderer.settings.data.series;

	    svg.plot.noDraw().format('white', 'gray').gridlines({stroke: 'gray', strokeDashArray: '2,2'}, 'gray'); 
	    svg.plot.xAxis.scale(renderer.settings.x_min, renderer.settings.x_max, renderer.settings.x_scale).ticks(parseFloat((renderer.settings.x_max - renderer.settings.x_min) / 10), parseFloat((renderer.settings.x_max - renderer.settings.x_min) / 5), 8, 'sw', renderer.settings.x_scale).title(renderer.settings.x_title, renderer.settings.x_titleOffset); 
	    svg.plot.yAxis.scale(renderer.settings.y_min, renderer.settings.y_max, renderer.settings.y_scale).ticks(parseFloat((renderer.settings.y_max - renderer.settings.y_min) / 10), parseFloat((renderer.settings.y_max - renderer.settings.y_min) / 5), 8, 'sw', renderer.settings.y_scale).title(renderer.settings.y_title, renderer.settings.y_titleOffset);
	    svg.plot.legend.settings({fill: 'white', stroke: 'gray'});
	    
	    var plotLegend = 0;
	    if (renderer.settings.show_legend) {
		switch (renderer.settings.legend_position) {
		case 'left': plotLegend = 1; 
		    break;
		case 'right': plotLegend = 2;
		    break;
		case 'top': plotLegend = 3;
		    break;
		case 'bottom': plotLegend = 4;
		    break;
		default: plotLegend = 1;
		    break;
		}
	    }
	    svg.plot.noDraw(). 
		legend.show(plotLegend).area(renderer.settings.legendArea ? renderer.settings.legendArea : legendAreas[plotLegend]).end().
		area(renderer.settings.chartArea ? renderer.settings.chartArea : chartAreas[plotLegend]).redraw();
	}
     }
}).call(this);
