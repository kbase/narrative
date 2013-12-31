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
    var renderer = Retina.Renderer.extend({
	about: {
	    name: "plot",
	    title: "Plot",
            author: "Tobias Paczian",
            version: "1.0",
            requires: [ "jquery.svg.js" ],
            defaults: {
		'title': '',
		'title_color': 'black',
		'default_line_color': 'black',
		'default_line_width': 1,
		'show_legend': true,
		'legend_position': 'left',
		'series': [],
		'connected': true,
		'show_dots': true,
		'width': 800,
		'height': 400,
		'x_min': 0,
		'x_max': 100,
		'y_min': 0,
		'y_max': 100,
		'x_scale': 'linear',
		'y_scale': 'linear',
		'x_title': '',
		'y_title': '',
		'x_titleOffset': 35,
		'y_titleOffset': 45,
		'titleOffset': 0,
		'drag_select': null,
		'data': [ ] }
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
	
	render: function () {
	    renderer = this;
	    
	    // get the target div
	    var target = renderer.settings.target;
	    var index = 0;
	    while (document.getElementById('plot_div'+index)) {
		index++;
	    }
	    target.innerHTML = "<div id='plot_div"+index+"'></div>";
	    target.firstChild.setAttribute('style', "width: "+ renderer.settings.width+"px; height: "+renderer.settings.height+"px;");
	    jQuery('#plot_div'+index).svg().bind('dragstart', function(event) { event.preventDefault(); });
	    Retina.RendererInstances.plot[renderer.index].svg = jQuery('#plot_div'+index).svg('get');
	    Retina.RendererInstances.plot[renderer.index].drawImage(Retina.RendererInstances.plot[renderer.index].svg, renderer.index);

	    if (renderer.settings.drag_select && typeof(renderer.settings.drag_select) == 'function') {
		var svg = document.getElementById('plot_div'+index).firstChild;
		trackMarquee(svg, renderer.settings.drag_select);
	    }

	    return renderer;
	},
	
	drawImage: function (svg, index) {
	    renderer = Retina.RendererInstances.plot[index];
	    
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
    });
}).call(this);
