/*
  KEGG map Renderer

  Displays a KEGG overview map and colors it.

  Options

*/
(function () {
    var renderer = Retina.Renderer.extend({
	about: {
	    name: "keggmap",
	    title: "KEGG map",
            author: "Tobias Paczian",
            version: "1.0",
            requires: [ "jquery.svg.js" ],
            defaults: {
		'width': 1200,
		'data': [ ],
		'image': null,
		'div': null }
	},
	exampleData: function () {
	    return [ ];
        },
	render: function () {
	    renderer = this;

	    var orig_x = 3695;
	    var orig_y = 2250;
	    var ratio = orig_y / orig_x;
	    renderer.settings.factor = renderer.settings.width / orig_x;
	    var height = parseInt(renderer.settings.width * ratio);
	    renderer.settings.height = height;

	    // get the target div
	    var target = renderer.settings.target;
	    var index = renderer.index;
	    
	    if (renderer.settings.image == null) {
		var image = document.createElement('img');
		image.setAttribute('src', 'images/keggmap.png');
		image.addEventListener('load', function(event){event.target.nextSibling.style.top=event.target.offsetTop+"px";});
		target.appendChild(image);
		renderer.settings.image = image;
	    }
	    renderer.settings.image.setAttribute('style', "width: "+ renderer.settings.width+"px;");

	    if (renderer.settings.div == null) {
		var div = document.createElement('div');
		div.setAttribute('id', 'map_div'+index);//top: "+renderer.settings.image.offsetTop+"px; 
		div.setAttribute('style', "position: absolute; left: "+renderer.settings.image.offsetLeft+"px;");
		renderer.settings.div = div;
		target.appendChild(div);
	    }

	    renderer.settings.div.style.width = renderer.settings.width+"px";
	    renderer.settings.div.style.height = renderer.settings.height+"px";

	    if (! stm.DataStore.hasOwnProperty('keggpolydata_loaded')) {
		jQuery.getJSON("data/keggdata.json", function(data) {
		    stm.DataStore.keggpolydata = data;
		    stm.DataStore.keggpolydata_loaded = true;
		}).then(function(){renderer.render();});
		return renderer;
	    }

	    renderer.settings.div.setAttribute('class', "");
	    renderer.settings.div.innerHTML = "";
	    jQuery('#map_div'+index).svg();
	    Retina.RendererInstances.keggmap[index].drawImage(jQuery('#map_div'+index).svg('get'), renderer.settings.data);
	    
	    return renderer;
	},
	hover: function (id, event) {
	    var svg = jQuery('#map_div'+renderer.index).svg('get');
	},
	drawImage: function (svg, mg_data) {
	    console.log(mg_data);
	    console.log(svg);
	    for (k=0; k<2; k++) {
		for (i in mg_data[k]) {
		    if (mg_data[k].hasOwnProperty(i)) {
			if (stm.DataStore.keggpolydata.hasOwnProperty(i)) {
			    var alist = stm.DataStore.keggpolydata[i];
			    var color = "#00D900";
			    var abu = "abundance: "+ mg_data[k][i];
			    if (k==1) {
				color = "#0000D9";
				if (mg_data[0].hasOwnProperty(i)) {
				    color = "#00D9D9";
				    abu = "abundance: "+mg_data[0][i] + " - " + mg_data[1][i];
				}
			    } else {
				if (mg_data[1].hasOwnProperty(i)) {
				    color = "#00D9D9";
				    abu = "abundance: "+mg_data[0][i] + " - " + mg_data[1][i];
				}	
			    }
			    for (j=0;j<alist.length;j++) {
				var a = alist[j];
				var path = svg.createPath();			    
				path.move(parseInt(a[0] * renderer.settings.factor), parseInt(a[1] * renderer.settings.factor));
				for (h=2;h<a.length;h+=2) {
				    path.line(parseInt(a[h] * renderer.settings.factor), parseInt(a[h+1] * renderer.settings.factor));
				}
				svg.path(null, path, {fill: color, stroke: color, strokeWidth: 2, title: abu });
			    }
			}
		    }
		}
	    }
	}
    });
}).call(this);
