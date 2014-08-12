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

(function($, undefined) {
    $.KBWidget({
        name: 'GraphWidget',
        version: '1.0.0',
        options: {
            'type': 'column', // [ column, stackedColumn, row, stackedRow, line, pie, stackedArea ]
    		'title': '',
    		'title_color': 'black',
    		'title_settings': { fontSize: '15px' },
    		'x_title': '',
    		'y_title': '',
    		'x_title_color': 'black',
    		'y_title_color': 'black',
    		'x_labels': [],
    		'x_labels_rotation': null,
    		'y_labels': [],
    		'y_scale': 'linear',
    		'x_tick_interval': 0,
    		'y_tick_interval': 30,
    		'x_labeled_tick_interval': 1,
    		'y_labeled_tick_interval': 5,
    		'default_line_color': 'black',
    		'default_line_width': 1,
    		'show_legend': false,
    		'legend_position': 'left',
    		'show_grid': false,
    		'short_axis_labels': false,
    		'normalize_stacked_area': true,
    		'width': 800,
    		'height': 400
        },
        
        init: function(params) {
            var renderer = this;
    	    if (! window.hasOwnProperty('rendererGraph')) {
    		    window.rendererGraph = [];
    	    }
    	    var instance = {
    	        settings: {},
    		    index: params.index
    		};
    	    jQuery.extend(true, instance, renderer);
    	    jQuery.extend(true, instance.settings, renderer.options, params);
    	    window.rendererGraph.push(instance);
    	    return instance.render(params.index);
        },
        
        render: function (index) {
    	    var renderer = window.rendererGraph[index];

    	    // get the target div
    	    var target = document.createElement('div');
    	    var index = renderer.index;
    	    renderer.$elem.append(target);
    	    
    	    // set target div content    	    
    	    target.innerHTML = "<div id='graph_div"+index+"'></div>";
    	    target.firstChild.setAttribute('style', "width: "+ renderer.settings.width+"px; height: "+renderer.settings.height+"px;");
    	    jQuery('#graph_div'+index).svg();
    	    window.rendererGraph[index].drawImage(index, jQuery('#graph_div'+index).svg('get'));
            
    	    return renderer;
    	},
    	
    	hover: function (title, value, event, e) {
    	    var id = e.currentTarget.ownerSVGElement.ownerSVGElement.parentNode.id;
    	    var index = id.substr(9);
    	    var renderer = window.rendererGraph[index];
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
    	
    	drawImage: function (index, svg) {
    	    var renderer = window.rendererGraph[index];
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
    	    for (i=0; i<renderer.settings.data.length; i++) {
    		    for (h=0; h<renderer.settings.data[i].data.length; h++) {
    		        if (parseFloat(renderer.settings.data[i].data[h]) > max) {
    			        max = parseFloat(renderer.settings.data[i].data[h]);
    		        }
    		    }
    	    }
    	    
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
    		    svg.graph.noDraw().addSeries( renderer.settings.data[i].name, renderer.settings.data[i].data, null, renderer.settings.data[i].lineColor || 'white', renderer.settings.data[i].lineWidth || renderer.settings.default_line_width);
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

    	    if (renderer.settings.y_labels.length) {
    		    svg.graph.xAxis.labels(renderer.settings.y_labels); 
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
    	    var chartOptions = { };

    	    svg.graph.status(window.rendererGraph[renderer.index].hover);

    	    svg.graph.noDraw(). 
    		legend.show(renderer.settings.show_legend).area(renderer.settings.legendArea ? renderer.settings.legendArea : legendAreas[chartLegend]).end();
    	    for (i=0; i< renderer.settings.data.length; i++) {
    		    svg.graph.noDraw().series(i).format(renderer.settings.data[i].fill || fills[i]).end();
    	    }
    	    svg.graph.noDraw().area(renderer.settings.chartArea ? renderer.settings.chartArea : chartAreas[chartLegend]).
    		type(chartType, chartOptions).redraw();
    	}
    });
})(jQuery);
    	
    	