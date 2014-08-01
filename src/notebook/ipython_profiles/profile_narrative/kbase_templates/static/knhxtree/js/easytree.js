function EasyTree(canvasId, treeString, nodeIdToNameMap, leafClickListener, nodeColorFunc) {
	
	var kn_g_tree = kn_parse(treeString);
	
	if (nodeIdToNameMap) {
		for (var nodePos in kn_g_tree.node) {
			var nodeId = kn_g_tree.node[nodePos].name;
			var nodeName = nodeIdToNameMap[nodeId];
			if (nodeName) {
				kn_g_tree.node[nodePos].id = nodeId;
				kn_g_tree.node[nodePos].name = nodeName;
			}
		}
	}
	
	if (nodeColorFunc) {
		for (var nodePos in kn_g_tree.node) {
			var node = kn_g_tree.node[nodePos];
			var color = nodeColorFunc(node, nodePos);
			if (color) {
				node.hl = color;
			}
		}
	}
	
	var kn_g_conf = new Object();
	var canvas = document.getElementById(canvasId);
	
    var conf = kn_g_conf;
    conf.c_box = new Array();
    conf.width = 1000; conf.height = 600;
    conf.xmargin = 20; conf.ymargin = 20;
    conf.fontsize = 8;
    conf.c_ext = "rgb(0,0,0)";
    conf.c_int = "rgb(255,0,0)";
    conf.c_line = '#444'; //"rgb(0,20,200)";
    conf.c_node = '#666'; //"rgb(20,20,20)";
    conf.c_active_node = "rgb(255,128,0)"
    conf.c_hl = "rgb(180, 210, 255)";
    conf.c_hidden = "rgb(0,200,0)";
    conf.c_regex = "rgb(0,128,0)";
//  conf.regex = ':S=([^:\\]]+)';
    conf.regex = ':B=([^:\\]]+)';
    conf.xskip = 3.0;
    conf.yskip = 14;
    conf.box_width = 6.0;
    conf.old_nh = null;
    conf.is_real = true;
    conf.is_circular = false;
    conf.show_dup = true;
    conf.runtime = 0;

    var changeLayoutX = 0;
    var changeLayoutY = 0;
    var changeLayoutW = 0;
    var changeLayoutH = 0;
    
    function plot(canvas, kn_g_tree, kn_g_conf) {
    	kn_plot_core(canvas, kn_g_tree, kn_g_conf);
        var text = "Change layout";
        var ctx = canvas.getContext("2d");
        CanvasTextFunctions.enable(ctx);
        ctx.strokeStyle = kn_g_conf.c_ext;
        ctx.fillStyle = "rgb(180, 245, 220)";
        var w = ctx.measureText(kn_g_conf.font, kn_g_conf.fontsize, text);
        var x = kn_g_conf.width - 80;
        var y = 1;
        var h = kn_g_conf.fontsize * 1.5 + 1;
        ctx.fillRect(x, y, w, h);
        ctx.drawText(kn_g_conf.font, kn_g_conf.fontsize, x, y + kn_g_conf.fontsize * .8 + kn_g_conf.fontsize / 3, text);
        changeLayoutX = x;
        changeLayoutY = y;
        changeLayoutW = w;
        changeLayoutH = h;
    }
    
    function changeLayout(isCircular) {
    	kn_g_conf.is_circular = isCircular;
    	kn_g_conf.height = kn_g_conf.is_circular? kn_g_conf.width : kn_g_conf.ymargin * 2 + kn_g_tree.n_tips * kn_g_conf.yskip;
    	canvas.height = kn_g_conf.height;
        kn_count_tips(kn_g_tree);
        kn_g_conf.is_real = kn_calxy(kn_g_tree, kn_g_conf.is_real);
        plot(canvas, kn_g_tree, kn_g_conf);
    }

    function ev_canvas(ev) {
        if (ev.layerX || ev.layerX == 0) { // Firefox
            ev._x = ev.layerX;
            ev._y = ev.layerY;
        } else if (ev.offsetX || ev.offsetX == 0) { // Opera
            ev._x = ev.offsetX;
            ev._y = ev.offsetY;
        }
        if (navigator.appName == "Microsoft Internet Explorer") { // for IE8
            /* When we click a node on the IE8 canvas, ev.offsetX gives
             * the offset inside the node instead of inside the canvas.
             * We have to do something nasty here... */
            var d = document.body;
            var o = document.getElementById("canvasContainer");
            ev._x = ev.clientX - (o.offsetLeft - d.scrollLeft) - 3;
            ev._y = ev.clientY - (o.offsetTop - d.scrollTop) - 3;
        }
        if (kn_g_tree) {
            var id = kn_get_node(kn_g_tree, kn_g_conf, ev._x, ev._y);
            if (id >= 0 && id < kn_g_tree.node.length) {
                var tree = kn_g_tree, conf = kn_g_conf, i = id;
                if (i < tree.node.length && tree.node[i].child.length) {
                	if (!tree.node[i].parent)
                		return;
                    tree.node[i].hidden = !tree.node[i].hidden;
                    var nn = tree.node.length;
                    tree.node = kn_expand_node(tree.node[tree.node.length-1]);
                    kn_count_tips(tree);
                    conf.is_real = kn_calxy(tree, conf.is_real);
                    kn_g_tree = tree; kn_g_conf = conf;
                    plot(canvas, tree, conf);
                } else if (leafClickListener) {
            		leafClickListener(kn_g_tree.node[id], id);
            	}
            } else {
            	var x = ev._x;
            	var y = ev._y;
            	if (x >= changeLayoutX && x < changeLayoutX + changeLayoutW &&
            			y >= changeLayoutY && y < changeLayoutY + changeLayoutH) {
            		changeLayout(!kn_g_conf.is_circular);
            	}
        	}
        }
    }

    var tree = kn_g_tree;
    if (tree.error) {
        if (tree.error & 1) alert("Parsing ERROR: missing left parenthesis!");
        else if (tree.error & 2) alert("Parsing ERROR: missing right parenthesis!");
        else if (tree.error & 4) alert("Parsing ERROR: missing brackets!");
        else alert("Unknown parsing ERROR: " + tree.error);
    } else {
    	conf.is_real = kn_calxy(tree, conf.is_real);
    	conf.height = conf.is_circular? conf.width : conf.ymargin * 2 + tree.n_tips * conf.yskip;
    	canvas.width = conf.width;
    	canvas.height = conf.height;
    	plot(canvas, tree, conf);

		// put the canvas in a container
		var o = document.createElement("div");
		o.setAttribute('id', 'canvasContainer');
		o.setAttribute('style', 'position: relative;');
		var canvas_parent = canvas.parentNode || canvas.parent;
		canvas_parent.removeChild(canvas);
		canvas_parent.appendChild(o);
		o.appendChild(canvas);
		
    	if (canvas.addEventListener) canvas.addEventListener('click', ev_canvas, false);
    	else canvas.attachEvent('onclick', ev_canvas);
    }
};