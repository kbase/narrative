/**
 * KBase widget to display kegg map.
 data = mg_data = [ 
    { ko_id: int, ko_id: int, ko_id: int, ... },
    { ko_id: int, ko_id: int, ko_id: int, ... }
 ]
 
 */
(function($, undefined) {
    $.KBWidget({
        name: 'KeggMapWidget',
        version: '1.0.0',
        index: Math.floor((Math.random()*1000)+1),
        imagepath: '../../../images/keggmap.png',
        options: {
            'header': null,
		    'width': 1200,
		    'data': null,
		    'image': null,
		    'div': null
		},
        
        init: function(options) {
            this._super(options);
            return this.render();
        },
        
        render: function () {
            // get this
            var renderer = this;
            
            // scaling
            var orig_x = 3695;
    	    var orig_y = 2250;
    	    var ratio = orig_y / orig_x;
    	    renderer.options.factor = renderer.options.width / orig_x;
    	    var height = parseInt(renderer.options.width * ratio);
    	    renderer.options.height = height;

    	    // get the target div
    	    var target = document.createElement('div');
    	    var index = renderer.index;
    	    
    	    if (renderer.options.header != null) {
                var text = document.createElement('p');
                text.setAttribute('style', "padding: 10px 20px;");
                text.innerHTML = renderer.options.header;
                target.appendChild(text);
    	    }
    	    
    	    if (renderer.options.data == null) {
    	        renderer.$elem.append(target);
                return this;
    	    }
    	    
    	    if (renderer.options.image == null) {
    		    var image = document.createElement('img');
    		    image.setAttribute('src', renderer.imagepath);
    		    image.addEventListener('load', function(event){event.target.nextSibling.style.top=event.target.offsetTop+"px";});
    		    target.appendChild(image);
    		    renderer.options.image = image;
    	    }
    	    renderer.options.image.setAttribute('style', "width: "+ renderer.options.width+"px;");
    	    
    	    if (renderer.options.div == null) {
    		    var div = document.createElement('div');
    		    div.setAttribute('id', 'map_div'+index);//top: "+renderer.options.image.offsetTop+"px; 
    		    div.setAttribute('style', "position: absolute; left: "+renderer.options.image.offsetLeft+"px;");
    		    renderer.options.div = div;
    		    target.appendChild(div);
    	    }

    	    renderer.options.div.style.width = renderer.options.width+"px";
    	    renderer.options.div.style.height = renderer.options.height+"px";
    	    renderer.options.div.setAttribute('class', "");
    	    renderer.options.div.innerHTML = "";
    	    jQuery('#map_div'+index).svg();
    	    renderer.drawImage(jQuery('#map_div'+index).svg('get'), renderer.options.data);
            
            renderer.$elem.append(target);
            return this;
        },
        
        hover: function (id, event) {
    	    var svg = jQuery('#map_div'+this.index).svg('get');
    	},
    	
    	drawImage: function (svg, mg_data) {
    	    var renderer = this;
    	    for (k=0; k<2; k++) {
    		    for (i in mg_data[k]) {
    		        if (mg_data[k].hasOwnProperty(i)) {
    			        if (renderer.keggpolydata.hasOwnProperty(i)) {
    			            var alist = renderer.keggpolydata[i];
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
    				            path.move(parseInt(a[0] * renderer.options.factor), parseInt(a[1] * renderer.options.factor));
    				            for (h=2;h<a.length;h+=2) {
    				                path.line(parseInt(a[h] * renderer.options.factor), parseInt(a[h+1] * renderer.options.factor));
    				            }
    				            svg.path(null, path, {fill: color, stroke: color, strokeWidth: 2, title: abu });
    			            }
    			        }
    		        }
    		    }
    	    }
    	},
    	
    	keggpolydata: 

    });
})(jQuery);