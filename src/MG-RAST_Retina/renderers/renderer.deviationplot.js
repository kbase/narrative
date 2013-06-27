/*
  Deviation-Plot Renderer

  Displays a deviation plot.

  Options

  
*/
(function () {
    var renderer = Retina.Renderer.extend({
	about: {
	    name: "deviationplot",
	    title: "Deviation-Plot",
            author: "Tobias Paczian",
            version: "1.0",
            requires: [ "jquery.svg.js" ],
            defaults: {
		'width': 400,
		'height': 80,
		'data': [ ] }
	},
	exampleData: function () {
	    return [ 358.14, 519.87, 250.20, 432.74, 278.04, 356.20, 1000, 1, 500, 520, 510, 450, 480, 500, 500, 500, 500 ];
        },
	
	render: function () {
	    renderer = this;

	    // do the calculations
	    var data = renderer.settings.data;
	    renderer.settings.val = data[0];
	    renderer.settings.min = data[0];
	    renderer.settings.max = data[0];
	    var sum = 0;
	    for (i=0;i<data.length;i++) {
		if (data[i] < renderer.settings.min) {
		    renderer.settings.min = data[i];
		}
		if (data[i] > renderer.settings.max) {
		    renderer.settings.max = data[i];
		}
		sum += data[i];
	    }
	    renderer.settings.mean = sum / data.length;
	    var variance = 0;
	    for (i=0;i<data.length;i++) {
		variance += Math.pow(data[i] - renderer.settings.mean, 2);
	    }
	    variance = variance / (data.length - 1);
	    renderer.settings.stdv = Math.pow(variance, 0.5);

	    // get the target div
	    var target = renderer.settings.target;
	    var index = 0;
	    while (document.getElementById('deviationplot_div'+index)) {
		index++;
	    }
	    target.innerHTML = "<div id='deviationplot_div"+index+"'></div>";
	    target.firstChild.setAttribute('style', "width: "+ renderer.settings.width+"px; height: "+renderer.settings.height+"px;");
	    jQuery('#deviationplot_div'+index).svg();
	    Retina.RendererInstances.deviationplot[renderer.index].drawImage(jQuery('#deviationplot_div'+index).svg('get'), renderer.index);
	    
	    return renderer;
	},
	
	drawImage: function (svg, index) {
	    renderer = Retina.RendererInstances.deviationplot[index];

	    var colors = { 'darkblue': '#8caad8',
			   'mediumblue': '#a8bfe2',
			   'lightblue': '#d9e3f2',
			   'border': '#789cd2',
			   'mean': '#3f72bf',
			   'mark': '#ff0000' };
	    
	    var padding = parseInt(renderer.settings.height / 4);
	    var factor = renderer.settings.width / (renderer.settings.max - renderer.settings.min);
	    
	    // main rectangle
	    svg.rect(1, padding, renderer.settings.width - 2, renderer.settings.height - (padding * 2), 0, 0, {fill: colors['lightblue'], stroke: colors['darkblue'], strokeWidth: 2});
	    
	    // 2 std dv
	    svg.rect(((renderer.settings.mean - (2 * renderer.settings.stdv)) - renderer.settings.min) * factor, padding, 4 * renderer.settings.stdv * factor, renderer.settings.height - (padding * 2), 0, 0, {fill: colors['mediumblue'], stroke: colors['border'], strokeWidth: 2});
	    
	    // std dv
	    svg.rect(((renderer.settings.mean - renderer.settings.stdv) - renderer.settings.min) * factor, padding, 2 * renderer.settings.stdv * factor, renderer.settings.height - (padding * 2), 0, 0, {fill: colors['darkblue'], stroke: colors['border'], strokeWidth: 2});
	    
	    // mean
	    svg.line((renderer.settings.mean - renderer.settings.min) * factor, padding, (renderer.settings.mean - renderer.settings.min) * factor, renderer.settings.height - padding, { strokeWidth: 2, strokeDashArray: "6,2", stroke: colors['mean'] }); 
	    
	    // mark
	    svg.line((renderer.settings.val - renderer.settings.min) * factor, padding, (renderer.settings.val - renderer.settings.min) * factor, renderer.settings.height - padding, { stroke: colors['mark'], strokeWidth: 2, title: renderer.settings.val });
	    svg.circle((renderer.settings.val - renderer.settings.min) * factor, padding - 6, 3, { stroke: colors['mark'], fill: colors['mark'], title: renderer.settings.val });
	    
	    // 2 σ -
	    svg.text(((renderer.settings.mean - (2 * renderer.settings.stdv)) - renderer.settings.min) * factor, padding - 5, "2σ", { fontSize: '10px', textAnchor: 'middle' });
	    
	    // σ -
	    svg.text(((renderer.settings.mean - renderer.settings.stdv) - renderer.settings.min) * factor, padding - 5, "σ", { fontSize: '10px', textAnchor: 'middle' });
	    
	    // μ
	    svg.text((renderer.settings.mean - renderer.settings.min) * factor, padding - 5, "μ", { fontSize: '10px', textAnchor: 'middle' });
	    
	    // σ +
	    svg.text(((renderer.settings.mean + renderer.settings.stdv) - renderer.settings.min) * factor, padding - 5, "σ", { fontSize: '10px', textAnchor: 'middle' });
	    
	    // 2 σ +
	    svg.text(((renderer.settings.mean + (2 * renderer.settings.stdv)) - renderer.settings.min) * factor, padding - 5, "2σ", { fontSize: '10px', textAnchor: 'middle' });
	    
	    // min
	    svg.text(0, renderer.settings.height - padding + 12, renderer.settings.min.formatString(2), { fontSize: '10px' });
	    
	    // max
	    svg.text(renderer.settings.width, renderer.settings.height - padding + 12, renderer.settings.max.formatString(2), { fontSize: '10px', textAnchor: 'end' });
	    
	    // mean
	    svg.text((renderer.settings.mean - renderer.settings.min) * factor, renderer.settings.height - padding + 12, renderer.settings.mean.formatString(2), { fontSize: '10px', textAnchor: 'middle' });
	    
	}
    });
}).call(this);