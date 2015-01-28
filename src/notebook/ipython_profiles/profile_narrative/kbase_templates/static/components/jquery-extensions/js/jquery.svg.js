/* http://keith-wood.name/svg.html
   SVG for jQuery v1.4.5.
   Written by Keith Wood (kbwood{at}iinet.com.au) August 2007.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses. 
   Please attribute the author if you use it. */

(function (jQuery) { // Hide scope, no jQuery conflict
    
    /* Determine whether a given ActiveX control is available.
       @param  classId  (string) the ID for the ActiveX control
       @return  (boolean) true if found, false if not */
    function detectActiveX(classId) {
	try {
	    return !!(window.ActiveXObject && new ActiveXObject(classId));
	}
	catch (e) {
	    return false;
	}
    }

    /* SVG manager.
       Use the singleton instance of this class, jQuery.svg, 
       to interact with the SVG functionality. */
    function SVGManager() {
	this._settings = []; // Settings to be remembered per SVG object
	this._extensions = []; // List of SVG extensions added to SVGWrapper
	// for each entry [0] is extension name, [1] is extension class (function)
	// the function takes one parameter - the SVGWrapper instance
	this.regional = []; // Localisations, indexed by language, '' for default (English)
	this.regional[''] = {errorLoadingText: 'Error loading',
			     notSupportedText: 'This browser does not support SVG'};
	this.local = this.regional['']; // Current localisation
	this._uuid = new Date().getTime();
	this._renesis = detectActiveX('RenesisX.RenesisCtrl');
    }
        
    var PROP_NAME = 'svgwrapper';
    
    jQuery.extend(SVGManager.prototype, {
	/* Class name added to elements to indicate already configured with SVG. */
	markerClassName: 'hasSVG',
	
	/* SVG namespace. */
	svgNS: 'http://www.w3.org/2000/svg',
	/* XLink namespace. */
	xlinkNS: 'http://www.w3.org/1999/xlink',
	
	/* SVG wrapper class. */
	_wrapperClass: SVGWrapper,
	
	/* Camel-case versions of attribute names containing dashes or are reserved words. */
	_attrNames: {class_: 'class', in_: 'in',
		     alignmentBaseline: 'alignment-baseline', baselineShift: 'baseline-shift',
		     clipPath: 'clip-path', clipRule: 'clip-rule',
		     colorInterpolation: 'color-interpolation',
		     colorInterpolationFilters: 'color-interpolation-filters',
		     colorRendering: 'color-rendering', dominantBaseline: 'dominant-baseline',
		     enableBackground: 'enable-background', fillOpacity: 'fill-opacity',
		     fillRule: 'fill-rule', floodColor: 'flood-color',
		     floodOpacity: 'flood-opacity', fontFamily: 'font-family',
		     fontSize: 'font-size', fontSizeAdjust: 'font-size-adjust',
		     fontStretch: 'font-stretch', fontStyle: 'font-style',
		     fontVariant: 'font-variant', fontWeight: 'font-weight',
		     glyphOrientationHorizontal: 'glyph-orientation-horizontal',
		     glyphOrientationVertical: 'glyph-orientation-vertical',
		     horizAdvX: 'horiz-adv-x', horizOriginX: 'horiz-origin-x',
		     imageRendering: 'image-rendering', letterSpacing: 'letter-spacing',
		     lightingColor: 'lighting-color', markerEnd: 'marker-end',
		     markerMid: 'marker-mid', markerStart: 'marker-start',
		     stopColor: 'stop-color', stopOpacity: 'stop-opacity',
		     strikethroughPosition: 'strikethrough-position',
		     strikethroughThickness: 'strikethrough-thickness',
		     strokeDashArray: 'stroke-dasharray', strokeDashOffset: 'stroke-dashoffset',
		     strokeLineCap: 'stroke-linecap', strokeLineJoin: 'stroke-linejoin',
		     strokeMiterLimit: 'stroke-miterlimit', strokeOpacity: 'stroke-opacity',
		     strokeWidth: 'stroke-width', textAnchor: 'text-anchor',
		     textDecoration: 'text-decoration', textRendering: 'text-rendering',
		     underlinePosition: 'underline-position', underlineThickness: 'underline-thickness',
		     vertAdvY: 'vert-adv-y', vertOriginY: 'vert-origin-y',
		     wordSpacing: 'word-spacing', writingMode: 'writing-mode'},
	
	/* Add the SVG object to its container. */
	_attachSVG: function(container, settings) {
	    var svg = (container.namespaceURI == this.svgNS ? container : null);
	    container = (svg ? null : container);
	    if (jQuery(container || svg).hasClass(this.markerClassName)) {
		return;
	    }
	    if (typeof settings == 'string') {
		settings = {loadURL: settings};
	    }
	    else if (typeof settings == 'function') {
		settings = {onLoad: settings};
	    }
	    jQuery(container || svg).addClass(this.markerClassName);
	    try {
		if (!svg) {
		    svg = document.createElementNS(this.svgNS, 'svg');
		    svg.setAttribute('version', '1.1');
		    if (container.clientWidth > 0) {
			svg.setAttribute('width', container.clientWidth);
		    }
		    if (container.clientHeight > 0) {
			svg.setAttribute('height', container.clientHeight);
		    }
		    container.appendChild(svg);
		}
		this._afterLoad(container, svg, settings || {});
	    }
	    catch (e) {
		if (jQuery.browser.msie) {
		    if (!container.id) {
			container.id = 'svg' + (this._uuid++);
		    }
		    this._settings[container.id] = settings;
		    container.innerHTML = '<embed type="image/svg+xml" width="100%" ' +
			'height="100%" src="' + (settings.initPath || '') + 'blank.svg" ' +
			'pluginspage="http://www.adobe.com/svg/viewer/install/main.html"/>';
		}
		else {
		    container.innerHTML = '<p class="svg_error">' +
			this.local.notSupportedText + '</p>';
		}
	    }
	},
	
	/* SVG callback after loading - register SVG root. */
	_registerSVG: function() {
	    var i;
	    for (i = 0; i < document.embeds.length; i++) { // Check all
		var container = document.embeds[i].parentNode;
		if (!jQuery(container).hasClass(jQuery.svg.markerClassName) || // Not SVG
		    jQuery.data(container, PROP_NAME)) { // Already done
		    continue;
		}
		var svg = null;
		try {
		    svg = document.embeds[i].getSVGDocument();
		}
		catch(e) {
		    setTimeout(jQuery.svg._registerSVG, 250); // Renesis takes longer to load
		    return;
		}
		svg = (svg ? svg.documentElement : null);
		if (svg) {
		    jQuery.svg._afterLoad(container, svg);
		}
	    }
	},
	
	/* Post-processing once loaded. */
	_afterLoad: function(container, svg, settings) {
	    var settings = settings || this._settings[container.id];
	    this._settings[container ? container.id : ''] = null;
	    var wrapper = new this._wrapperClass(svg, container);
	    jQuery.data(container || svg, PROP_NAME, wrapper);
	    try {
		if (settings.loadURL) { // Load URL
		    wrapper.load(settings.loadURL, settings);
		}
		if (settings.settings) { // Additional settings
		    wrapper.configure(settings.settings);
		}
		if (settings.onLoad && !settings.loadURL) { // Onload callback
		    settings.onLoad.apply(container || svg, [wrapper]);
		}
	    }
	    catch (e) {
		alert(e);
	    }
	},
	
	/* Return the SVG wrapper created for a given container.
	   @param  container  (string) selector for the container or
	   (element) the container for the SVG object or
	   jQuery collection - first entry is the container
	   @return  (SVGWrapper) the corresponding SVG wrapper element, or null if not attached */
	_getSVG: function(container) {
	    container = (typeof container == 'string' ? jQuery(container)[0] :
			 (container.jquery ? container[0] : container));
	    return jQuery.data(container, PROP_NAME);
	},
	
	/* Remove the SVG functionality from a div.
	   @param  container  (element) the container for the SVG object */
	_destroySVG: function(container) {
	    var jQuerycontainer = jQuery(container);
	    if (!jQuerycontainer.hasClass(this.markerClassName)) {
		return;
	    }
	    jQuerycontainer.removeClass(this.markerClassName);
	    if (container.namespaceURI != this.svgNS) {
		jQuerycontainer.empty();
	    }
	    jQuery.removeData(container, PROP_NAME);
	},
	
	/* Extend the SVGWrapper object with an embedded class.
	   The constructor function must take a single parameter that is
	   a reference to the owning SVG root object. This allows the 
	   extension to access the basic SVG functionality.
	   @param  name      (string) the name of the SVGWrapper attribute to access the new class
	   @param  extClass  (function) the extension class constructor */
	addExtension: function(name, extClass) {
	    this._extensions.push([name, extClass]);
	},
	
	/* Does this node belong to SVG?
	   @param  node  (element) the node to be tested
	   @return  (boolean) true if an SVG node, false if not */
	isSVGElem: function(node) {
	    return (node.nodeType == 1 && node.namespaceURI == jQuery.svg.svgNS);
	}
    });
    
    /* The main SVG interface, which encapsulates the SVG element.
       Obtain a reference from jQuery().svg('get') */
    function SVGWrapper(svg, container) {
	this._svg = svg; // The SVG root node
	this._container = container; // The containing div
	for (var i = 0; i < jQuery.svg._extensions.length; i++) {
	    var extension = jQuery.svg._extensions[i];
	    this[extension[0]] = new extension[1](this);
	}
    }
    
    jQuery.extend(SVGWrapper.prototype, {

	/*
	  high level graphics
	*/

	/* Draw a donut slice.
	   @param center (int) radius of the full circle
	   @param inner (int) radius of the inner circle of the current slice
	   @param outer (int) radius of the outer circle of the current slice
	   @param startAngle (int) angle of the start of the slice (in degrees)
	   @param endAngle (int) angle of the end of the slice (in degrees)
	   @param settings (object) any key/value pairs for the SVG element
	   @return (element) the new shape node */
	donutslice: function(params) {
	    var center = params.center;
	    var inner = params.inner;
	    var outer = params.outer;
	    var startAngle = params.startAngle;
	    var endAngle = params.endAngle;
	    var settings = params.settings;

	    var r1 = ((outer - 1) / 2);
	    var r2 = ((inner - 1) / 2);

	    var startAngleRad = Math.PI*startAngle/180;
	    var endAngleRad = Math.PI*endAngle/180;

	    var x1inner = parseInt(center + r2*Math.cos(startAngleRad));
	    var y1inner = parseInt(center + r2*Math.sin(startAngleRad));

	    var x2inner = parseInt(center + r2*Math.cos(endAngleRad));
	    var y2inner = parseInt(center + r2*Math.sin(endAngleRad));

	    var x1outer = parseInt(center + r1*Math.cos(startAngleRad));
	    var y1outer = parseInt(center + r1*Math.sin(startAngleRad));

	    var x2outer = parseInt(center + r1*Math.cos(endAngleRad));
	    var y2outer = parseInt(center + r1*Math.sin(endAngleRad));

	    r1 = parseInt(r1);
	    r2 = parseInt(r2);

	    var path = "M"+x1inner+","+y1inner+"  L"+x1outer+","+y1outer+"  A"+r1+","+r1+" 0 0,1 "+x2outer+","+y2outer+" L"+x2inner+","+y2inner+"  A"+r2+","+r2+" 0 0,0 "+x1inner+","+y1inner;

	    return this.path(path, settings);
	},

	axis: function(params) {
	    var start = params.start; // start pixel of the axis in the SVG
	    var end = params.end; // end pixel of the axis in the SVG
	    var shift = params.shift; // shift from left (vertical) or top (horizontal) of the axis
	    var min = params.min == null ? 0 : params.min; // minimum value of the scale
	    var max = params.max == null ? 100 : params.max; // maximum value of the scale

	    var showLabels = params.showLabels == null ? true : false;
	    var labels = params.labels; // array of labels if the labels should not be the value
	    var labelRotation = params.labelRotation == null ? 0 : params.labelRotation; // degrees the labels should be rotated
	    var labelFontSize = params.labelFontSize == null ? 12 : params.labelFontSize;
	    var labelFontWeight = params.labelFontWeight == null ? 100 : params.labelFontWeight;
	    var labelFontFamily = params.labelFontFamily == null ? "Helvetica" : params.labelFontFamily;

	    var minorTicks = params.minorTicks == null ? 4 : params.minorTicks; // number of minor ticks between major ticks
	    var minorTickLength = params.minorTickLength == null ? 5 : params.minorTickLength;
	    var majorTickLength = params.majorTickLength == null ? 10 : params.majorTickLenght;
	    var minorTickShift = params.minorTickShift == null ? 0 : params.minorTickShift;
	    var majorTickShift = params.majorTickShift == null ? 0 : params.majorTickShift;
	    var majorTicks = params.majorTicks == null ? 10 : params.majorTicks; // number of major ticks on the axis
	    var scale = params.scale == null ? "linear" : params.scale;
	    var direction = params.direction == null ? "horizontal" : params.direction;

	    var length = end - start;

	    // create group
	    var g = this.group();

	    // create baseline
	    var x1 = direction == "horizontal" ? start : shift;
	    var y1 = direction == "horizontal" ? shift : start;
	    var x2 = direction == "horizontal" ? end : shift;
	    var y2 = direction == "horizontal" ? shift : end;
	    this.line(g, x1, y1, x2, y2, { stroke: "black", strokeWidth: 1 });

	    // create ticks
	    var tickpos = start;
	    x1 = direction == "horizontal" ? tickpos : shift + majorTickShift;
	    y1 = direction == "horizontal" ? shift + majorTickShift : tickpos;
	    x2 = direction == "horizontal" ? tickpos : shift + majorTickShift - majorTickLength;
	    y2 = direction == "horizontal" ? shift + majorTickShift + majorTickLength : tickpos;
	    var x1m = direction == "horizontal" ? tickpos : shift + minorTickShift;
	    var y1m = direction == "horizontal" ? shift + minorTickShift : tickpos;
	    var x2m = direction == "horizontal" ? tickpos : shift + minorTickShift - minorTickLength;
	    var y2m = direction == "horizontal" ? shift + minorTickShift + minorTickLength : tickpos;

	    var majorTickSpace = Math.floor(length / majorTicks);
	    var minorTickSpace = Math.floor(majorTickSpace / (minorTicks + 1));
	    
	    for (var i=0; i<=majorTicks; i++) {
		this.line(g, x1, y1, x2, y2, { stroke: "black", strokeWidth: 1 });
		if (showLabels) {
		    var text = (min + ((direction == "horizontal" ? i : majorTicks - i) * ((max - min) / majorTicks))).formatString();
		    if (labels && labels.length) {
			text = labels[i];
		    }
		    var lx = x1 + (direction == "horizontal" ? 0 : (-1 * (majorTickLength + majorTickShift) - 1));
		    var ly = y1 + parseInt(labelFontSize / (direction == "horizontal" ? 1 : 3)) + (direction == "horizontal" ?  (majorTickLength + majorTickShift + 1) : 0);
		    this.text(g, lx, ly, text, { textAnchor: (direction == "horizontal" ? (labelRotation == null ? "middle" : "end") : "end"), fontSize: labelFontSize+'px', stroke: "black", fontWeight: labelFontWeight, fontFamily: labelFontFamily, transform: (labelRotation == null ? "" : "rotate(-"+labelRotation+","+lx+","+ly+")") });
		}
		if (majorTicks != i) {
		    for (var h=0; h<minorTicks; h++) {
			if (direction == 'horizontal') {
			    x1m += minorTickSpace;
			    x2m += minorTickSpace;
			} else {
			    y1m += minorTickSpace;
			    y2m += minorTickSpace;
			}
			this.line(g, x1m, y1m, x2m, y2m, { stroke: "black", strokeWidth: 1 });
		    }
		}
		if (direction == 'horizontal') {
		    x1 += majorTickSpace;
		    x2 += majorTickSpace;
		} else {
		    y1 += majorTickSpace;
		    y2 += majorTickSpace;
		}
		if (direction == 'horizontal') {
		    x1m = x1;
		    x2m = x2;
		} else {
		    y1m = y1;
		    y2m = y2;
		}
	    }
	    
	    return g;
	},

	legend: function(params) {
	    var top = params.top == null ? 0 : params.top;
	    var left = params.left == null ? 0 : params.left;
	    var labels = params.labels;
	    var colors = params.colors;
	    var fontSize = params.fontSize == null ? 12 : params.fontSize;
	    var fontWeight = params.fontWeight == null ? "normal" : params.fontWeight;
	    var fontFamily = params.fontFamily == null ? "Helvetica" : params.fontFamily;
	    var labelSpacing = params.labelSpacing == null ? 10 : params.labelSpacing;

	    var g = this.group();
	    for (var i=0; i<labels.length; i++) {
		this.rect(g, left, top, fontSize, fontSize, { stroke: "white", strokeWidth: 0, fill: colors[i] });
		this.text(g, left + fontSize + fontSize, top + fontSize - 2, labels[i], { stroke: "black", fontSize: fontSize, fontFamily: fontFamily, fontWeight: fontWeight });
		top += fontSize + labelSpacing;
	    }

	    return g;
	},

	/*
	  end of high level graphics
	 */

	/* Retrieve the width of the SVG object. */
	_width: function() {
	    return (this._container ? this._container.clientWidth : this._svg.width);
	},
	
	/* Retrieve the height of the SVG object. */
	_height: function() {
	    return (this._container ? this._container.clientHeight : this._svg.height);
	},
	
	/* Retrieve the root SVG element.
	   @return  the top-level SVG element */
	root: function() {
	    return this._svg;
	},
	
	/* Configure a SVG node.
	   @param  node      (element, optional) the node to configure
	   @param  settings  (object) additional settings for the root
	   @param  clear     (boolean) true to remove existing attributes first,
	   false to add to what is already there (optional)
	   @return  (SVGWrapper) this root */
	configure: function(node, settings, clear) {
	    if (!node.nodeName) {
		clear = settings;
		settings = node;
		node = this._svg;
	    }
	    if (clear) {
		for (var i = node.attributes.length - 1; i >= 0; i--) {
		    var attr = node.attributes.item(i);
		    if (!(attr.nodeName == 'onload' || attr.nodeName == 'version' || 
			  attr.nodeName.substring(0, 5) == 'xmlns')) {
			node.attributes.removeNamedItem(attr.nodeName);
		    }
		}
	    }
	    for (var attrName in settings) {
		node.setAttribute(jQuery.svg._attrNames[attrName] || attrName, settings[attrName]);
	    }
	    return this;
	},
	
	/* Locate a specific element in the SVG document.
	   @param  id  (string) the element's identifier
	   @return  (element) the element reference, or null if not found */
	getElementById: function(id) {
	    return this._svg.ownerDocument.getElementById(id);
	},
	
	/* Change the attributes for a SVG node.
	   @param  element   (SVG element) the node to change
	   @param  settings  (object) the new settings
	   @return  (SVGWrapper) this root */
	change: function(element, settings) {
	    if (element) {
		for (var name in settings) {
		    if (settings[name] == null) {
			element.removeAttribute(jQuery.svg._attrNames[name] || name);
		    }
		    else {
			element.setAttribute(jQuery.svg._attrNames[name] || name, settings[name]);
		    }
		}
	    }
	    return this;
	},
	
	/* Check for parent being absent and adjust arguments accordingly. */
	_args: function(values, names, optSettings) {
	    names.splice(0, 0, 'parent');
	    names.splice(names.length, 0, 'settings');
	    var args = {};
	    var offset = 0;
	    if (values[0] != null && values[0].jquery) {
		values[0] = values[0][0];
	    }
	    if (values[0] != null && !(typeof values[0] == 'object' && values[0].nodeName)) {
		args['parent'] = null;
		offset = 1;
	    }
	    for (var i = 0; i < values.length; i++) {
		args[names[i + offset]] = values[i];
	    }
	    if (optSettings) {
		jQuery.each(optSettings, function(i, value) {
		    if (typeof args[value] == 'object') {
			args.settings = args[value];
			args[value] = null;
		    }
		});
	    }
	    return args;
	},
	
	/* Add a title.
	   @param  parent    (element or jQuery) the parent node for the new title (optional)
	   @param  text      (string) the text of the title
	   @param  settings  (object) additional settings for the title (optional)
	   @return  (element) the new title node */
	title: function(parent, text, settings) {
	    var args = this._args(arguments, ['text']);
	    var node = this._makeNode(args.parent, 'title', args.settings || {});
	    node.appendChild(this._svg.ownerDocument.createTextNode(args.text));
	    return node;
	},
	
	/* Add a description.
	   @param  parent    (element or jQuery) the parent node for the new description (optional)
	   @param  text      (string) the text of the description
	   @param  settings  (object) additional settings for the description (optional)
	   @return  (element) the new description node */
	describe: function(parent, text, settings) {
	    var args = this._args(arguments, ['text']);
	    var node = this._makeNode(args.parent, 'desc', args.settings || {});
	    node.appendChild(this._svg.ownerDocument.createTextNode(args.text));
	    return node;
	},
	
	/* Add a definitions node.
	   @param  parent    (element or jQuery) the parent node for the new definitions (optional)
	   @param  id        (string) the ID of this definitions (optional)
	   @param  settings  (object) additional settings for the definitions (optional)
	   @return  (element) the new definitions node */
	defs: function(parent, id, settings) {
	    var args = this._args(arguments, ['id'], ['id']);
	    return this._makeNode(args.parent, 'defs', jQuery.extend(
		(args.id ? {id: args.id} : {}), args.settings || {}));
	},
	
	/* Add a symbol definition.
	   @param  parent    (element or jQuery) the parent node for the new symbol (optional)
	   @param  id        (string) the ID of this symbol
	   @param  x1        (number) the left coordinate for this symbol
	   @param  y1        (number) the top coordinate for this symbol
	   @param  width     (number) the width of this symbol
	   @param  height    (number) the height of this symbol
	   @param  settings  (object) additional settings for the symbol (optional)
	   @return  (element) the new symbol node */
	symbol: function(parent, id, x1, y1, width, height, settings) {
	    var args = this._args(arguments, ['id', 'x1', 'y1', 'width', 'height']);
	    return this._makeNode(args.parent, 'symbol', jQuery.extend({id: args.id,
									viewBox: args.x1 + ' ' + args.y1 + ' ' + args.width + ' ' + args.height},
								       args.settings || {}));
	},
	
	/* Add a marker definition.
	   @param  parent    (element or jQuery) the parent node for the new marker (optional)
	   @param  id        (string) the ID of this marker
	   @param  refX      (number) the x-coordinate for the reference point
	   @param  refY      (number) the y-coordinate for the reference point
	   @param  mWidth    (number) the marker viewport width
	   @param  mHeight   (number) the marker viewport height
	   @param  orient    (string or int) 'auto' or angle (degrees) (optional)
	   @param  settings  (object) additional settings for the marker (optional)
	   @return  (element) the new marker node */
	marker: function(parent, id, refX, refY, mWidth, mHeight, orient, settings) {
	    var args = this._args(arguments, ['id', 'refX', 'refY',
					      'mWidth', 'mHeight', 'orient'], ['orient']);
	    return this._makeNode(args.parent, 'marker', jQuery.extend(
		{id: args.id, refX: args.refX, refY: args.refY, markerWidth: args.mWidth, 
		 markerHeight: args.mHeight, orient: args.orient || 'auto'}, args.settings || {}));
	},
	
	/* Add a style node.
	   @param  parent    (element or jQuery) the parent node for the new node (optional)
	   @param  styles    (string) the CSS styles
	   @param  settings  (object) additional settings for the node (optional)
	   @return  (element) the new style node */
	style: function(parent, styles, settings) {
	    var args = this._args(arguments, ['styles']);
	    var node = this._makeNode(args.parent, 'style', jQuery.extend(
		{type: 'text/css'}, args.settings || {}));
	    node.appendChild(this._svg.ownerDocument.createTextNode(args.styles));
	    if (jQuery.browser.opera) {
		jQuery('head').append('<style type="text/css">' + args.styles + '</style>');
	    }
	    return node;
	},
	
	/* Add a script node.
	   @param  parent    (element or jQuery) the parent node for the new node (optional)
	   @param  script    (string) the JavaScript code
	   @param  type      (string) the MIME type for the code (optional, default 'text/javascript')
	   @param  settings  (object) additional settings for the node (optional)
	   @return  (element) the new script node */
	script: function(parent, script, type, settings) {
	    var args = this._args(arguments, ['script', 'type'], ['type']);
	    var node = this._makeNode(args.parent, 'script', jQuery.extend(
		{type: args.type || 'text/javascript'}, args.settings || {}));
	    node.appendChild(this._svg.ownerDocument.createTextNode(args.script));
	    if (!jQuery.browser.mozilla) {
		jQuery.globalEval(args.script);
	    }
	    return node;
	},
	
	/* Add a linear gradient definition.
	   Specify all of x1, y1, x2, y2 or none of them.
	   @param  parent    (element or jQuery) the parent node for the new gradient (optional)
	   @param  id        (string) the ID for this gradient
	   @param  stops     (string[][]) the gradient stops, each entry is
	   [0] is offset (0.0-1.0 or 0%-100%), [1] is colour, 
	   [2] is opacity (optional)
	   @param  x1        (number) the x-coordinate of the gradient start (optional)
	   @param  y1        (number) the y-coordinate of the gradient start (optional)
	   @param  x2        (number) the x-coordinate of the gradient end (optional)
	   @param  y2        (number) the y-coordinate of the gradient end (optional)
	   @param  settings  (object) additional settings for the gradient (optional)
	   @return  (element) the new gradient node */
	linearGradient: function(parent, id, stops, x1, y1, x2, y2, settings) {
	    var args = this._args(arguments,
				  ['id', 'stops', 'x1', 'y1', 'x2', 'y2'], ['x1']);
	    var sets = jQuery.extend({id: args.id}, 
				     (args.x1 != null ? {x1: args.x1, y1: args.y1, x2: args.x2, y2: args.y2} : {}));
	    return this._gradient(args.parent, 'linearGradient', 
				  jQuery.extend(sets, args.settings || {}), args.stops);
	},
	
	/* Add a radial gradient definition.
	   Specify all of cx, cy, r, fx, fy or none of them.
	   @param  parent    (element or jQuery) the parent node for the new gradient (optional)
	   @param  id        (string) the ID for this gradient
	   @param  stops     (string[][]) the gradient stops, each entry
	   [0] is offset, [1] is colour, [2] is opacity (optional)
	   @param  cx        (number) the x-coordinate of the largest circle centre (optional)
	   @param  cy        (number) the y-coordinate of the largest circle centre (optional)
	   @param  r         (number) the radius of the largest circle (optional)
	   @param  fx        (number) the x-coordinate of the gradient focus (optional)
	   @param  fy        (number) the y-coordinate of the gradient focus (optional)
	   @param  settings  (object) additional settings for the gradient (optional)
	   @return  (element) the new gradient node */
	radialGradient: function(parent, id, stops, cx, cy, r, fx, fy, settings) {
	    var args = this._args(arguments,
				  ['id', 'stops', 'cx', 'cy', 'r', 'fx', 'fy'], ['cx']);
	    var sets = jQuery.extend({id: args.id}, (args.cx != null ?
						     {cx: args.cx, cy: args.cy, r: args.r, fx: args.fx, fy: args.fy} : {}));
	    return this._gradient(args.parent, 'radialGradient', 
				  jQuery.extend(sets, args.settings || {}), args.stops);
	},
	
	/* Add a gradient node. */
	_gradient: function(parent, name, settings, stops) {
	    var node = this._makeNode(parent, name, settings);
	    for (var i = 0; i < stops.length; i++) {
		var stop = stops[i];
		this._makeNode(node, 'stop', jQuery.extend(
		    {offset: stop[0], stopColor: stop[1]}, 
		    (stop[2] != null ? {stopOpacity: stop[2]} : {})));
	    }
	    return node;
	},
	
	/* Add a pattern definition.
	   Specify all of vx, vy, xwidth, vheight or none of them.
	   @param  parent    (element or jQuery) the parent node for the new pattern (optional)
	   @param  id        (string) the ID for this pattern
	   @param  x         (number) the x-coordinate for the left edge of the pattern
	   @param  y         (number) the y-coordinate for the top edge of the pattern
	   @param  width     (number) the width of the pattern
	   @param  height    (number) the height of the pattern
	   @param  vx        (number) the minimum x-coordinate for view box (optional)
	   @param  vy        (number) the minimum y-coordinate for the view box (optional)
	   @param  vwidth    (number) the width of the view box (optional)
	   @param  vheight   (number) the height of the view box (optional)
	   @param  settings  (object) additional settings for the pattern (optional)
	   @return  (element) the new pattern node */
	pattern: function(parent, id, x, y, width, height, vx, vy, vwidth, vheight, settings) {
	    var args = this._args(arguments, ['id', 'x', 'y', 'width', 'height',
					      'vx', 'vy', 'vwidth', 'vheight'], ['vx']);
	    var sets = jQuery.extend({id: args.id, x: args.x, y: args.y,
				      width: args.width, height: args.height}, (args.vx != null ?
										{viewBox: args.vx + ' ' + args.vy + ' ' + args.vwidth + ' ' + args.vheight} : {}));
	    return this._makeNode(args.parent, 'pattern', jQuery.extend(sets, args.settings || {}));
	},
	
	/* Add a clip path definition.
	   @param  parent  (element) the parent node for the new element (optional)
	   @param  id      (string) the ID for this path
	   @param  units   (string) either 'userSpaceOnUse' (default) or 'objectBoundingBox' (optional)
	   @return  (element) the new clipPath node */
	clipPath: function(parent, id, units, settings) {
	    var args = this._args(arguments, ['id', 'units']);
	    args.units = args.units || 'userSpaceOnUse';
	    return this._makeNode(args.parent, 'clipPath', jQuery.extend(
		{id: args.id, clipPathUnits: args.units}, args.settings || {}));
	},
	
	/* Add a mask definition.
	   @param  parent    (element or jQuery) the parent node for the new mask (optional)
	   @param  id        (string) the ID for this mask
	   @param  x         (number) the x-coordinate for the left edge of the mask
	   @param  y         (number) the y-coordinate for the top edge of the mask
	   @param  width     (number) the width of the mask
	   @param  height    (number) the height of the mask
	   @param  settings  (object) additional settings for the mask (optional)
	   @return  (element) the new mask node */
	mask: function(parent, id, x, y, width, height, settings) {
	    var args = this._args(arguments, ['id', 'x', 'y', 'width', 'height']);
	    return this._makeNode(args.parent, 'mask', jQuery.extend(
		{id: args.id, x: args.x, y: args.y, width: args.width, height: args.height},
		args.settings || {}));
	},
	
	/* Create a new path object.
	   @return  (SVGPath) a new path object */
	createPath: function() {
	    return new SVGPath();
	},
	
	/* Create a new text object.
	   @return  (SVGText) a new text object */
	createText: function() {
	    return new SVGText();
	},
	
	/* Add an embedded SVG element.
	   Specify all of vx, vy, vwidth, vheight or none of them.
	   @param  parent    (element or jQuery) the parent node for the new node (optional)
	   @param  x         (number) the x-coordinate for the left edge of the node
	   @param  y         (number) the y-coordinate for the top edge of the node
	   @param  width     (number) the width of the node
	   @param  height    (number) the height of the node
	   @param  vx        (number) the minimum x-coordinate for view box (optional)
	   @param  vy        (number) the minimum y-coordinate for the view box (optional)
	   @param  vwidth    (number) the width of the view box (optional)
	   @param  vheight   (number) the height of the view box (optional)
	   @param  settings  (object) additional settings for the node (optional)
	   @return  (element) the new node */
	svg: function(parent, x, y, width, height, vx, vy, vwidth, vheight, settings) {
	    var args = this._args(arguments, ['x', 'y', 'width', 'height',
					      'vx', 'vy', 'vwidth', 'vheight'], ['vx']);
	    var sets = jQuery.extend({x: args.x, y: args.y, width: args.width, height: args.height}, 
				     (args.vx != null ? {viewBox: args.vx + ' ' + args.vy + ' ' +
							 args.vwidth + ' ' + args.vheight} : {}));
	    return this._makeNode(args.parent, 'svg', jQuery.extend(sets, args.settings || {}));
	},
	
	/* Create a group.
	   @param  parent    (element or jQuery) the parent node for the new group (optional)
	   @param  id        (string) the ID of this group (optional)
	   @param  settings  (object) additional settings for the group (optional)
	   @return  (element) the new group node */
	group: function(parent, id, settings) {
	    var args = this._args(arguments, ['id'], ['id']);
	    return this._makeNode(args.parent, 'g', jQuery.extend({id: args.id}, args.settings || {}));
	},
	
	/* Add a usage reference.
	   Specify all of x, y, width, height or none of them.
	   @param  parent    (element or jQuery) the parent node for the new node (optional)
	   @param  x         (number) the x-coordinate for the left edge of the node (optional)
	   @param  y         (number) the y-coordinate for the top edge of the node (optional)
	   @param  width     (number) the width of the node (optional)
	   @param  height    (number) the height of the node (optional)
	   @param  ref       (string) the ID of the definition node
	   @param  settings  (object) additional settings for the node (optional)
	   @return  (element) the new node */
	use: function(parent, x, y, width, height, ref, settings) {
	    var args = this._args(arguments, ['x', 'y', 'width', 'height', 'ref']);
	    if (typeof args.x == 'string') {
		args.ref = args.x;
		args.settings = args.y;
		args.x = args.y = args.width = args.height = null;
	    }
	    var node = this._makeNode(args.parent, 'use', jQuery.extend(
		{x: args.x, y: args.y, width: args.width, height: args.height},
		args.settings || {}));
	    node.setAttributeNS(jQuery.svg.xlinkNS, 'href', args.ref);
	    return node;
	},
	
	/* Add a link, which applies to all child elements.
	   @param  parent    (element or jQuery) the parent node for the new link (optional)
	   @param  ref       (string) the target URL
	   @param  settings  (object) additional settings for the link (optional)
	   @return  (element) the new link node */
	link: function(parent, ref, settings) {
	    var args = this._args(arguments, ['ref']);
	    var node = this._makeNode(args.parent, 'a', args.settings);
	    node.setAttributeNS(jQuery.svg.xlinkNS, 'href', args.ref);
	    return node;
	},
	
	/* Add an image.
	   @param  parent    (element or jQuery) the parent node for the new image (optional)
	   @param  x         (number) the x-coordinate for the left edge of the image
	   @param  y         (number) the y-coordinate for the top edge of the image
	   @param  width     (number) the width of the image
	   @param  height    (number) the height of the image
	   @param  ref       (string) the path to the image
	   @param  settings  (object) additional settings for the image (optional)
	   @return  (element) the new image node */
	image: function(parent, x, y, width, height, ref, settings) {
	    var args = this._args(arguments, ['x', 'y', 'width', 'height', 'ref']);
	    var node = this._makeNode(args.parent, 'image', jQuery.extend(
		{x: args.x, y: args.y, width: args.width, height: args.height},
		args.settings || {}));
	    node.setAttributeNS(jQuery.svg.xlinkNS, 'href', args.ref);
	    return node;
	},
	
	/* Draw a path.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  path      (string or SVGPath) the path to draw
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	path: function(parent, path, settings) {
	    var args = this._args(arguments, ['path']);
	    return this._makeNode(args.parent, 'path', jQuery.extend(
		{d: (args.path.path ? args.path.path() : args.path)}, args.settings || {}));
	},
	
	/* Draw a rectangle.
	   Specify both of rx and ry or neither.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  x         (number) the x-coordinate for the left edge of the rectangle
	   @param  y         (number) the y-coordinate for the top edge of the rectangle
	   @param  width     (number) the width of the rectangle
	   @param  height    (number) the height of the rectangle
	   @param  rx        (number) the x-radius of the ellipse for the rounded corners (optional)
	   @param  ry        (number) the y-radius of the ellipse for the rounded corners (optional)
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	rect: function(parent, x, y, width, height, rx, ry, settings) {
	    var args = this._args(arguments, ['x', 'y', 'width', 'height', 'rx', 'ry'], ['rx']);
	    return this._makeNode(args.parent, 'rect', jQuery.extend(
		{x: args.x, y: args.y, width: args.width, height: args.height},
		(args.rx ? {rx: args.rx, ry: args.ry} : {}), args.settings || {}));
	},
	
	/* Draw a circle.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  cx        (number) the x-coordinate for the centre of the circle
	   @param  cy        (number) the y-coordinate for the centre of the circle
	   @param  r         (number) the radius of the circle
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	circle: function(parent, cx, cy, r, settings) {
	    var args = this._args(arguments, ['cx', 'cy', 'r']);
	    return this._makeNode(args.parent, 'circle', jQuery.extend(
		{cx: args.cx, cy: args.cy, r: args.r}, args.settings || {}));
	},
	
	/* Draw an ellipse.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  cx        (number) the x-coordinate for the centre of the ellipse
	   @param  cy        (number) the y-coordinate for the centre of the ellipse
	   @param  rx        (number) the x-radius of the ellipse
	   @param  ry        (number) the y-radius of the ellipse
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	ellipse: function(parent, cx, cy, rx, ry, settings) {
	    var args = this._args(arguments, ['cx', 'cy', 'rx', 'ry']);
	    return this._makeNode(args.parent, 'ellipse', jQuery.extend(
		{cx: args.cx, cy: args.cy, rx: args.rx, ry: args.ry}, args.settings || {}));
	},
	
	/* Draw a line.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  x1        (number) the x-coordinate for the start of the line
	   @param  y1        (number) the y-coordinate for the start of the line
	   @param  x2        (number) the x-coordinate for the end of the line
	   @param  y2        (number) the y-coordinate for the end of the line
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	line: function(parent, x1, y1, x2, y2, settings) {
	    var args = this._args(arguments, ['x1', 'y1', 'x2', 'y2']);
	    return this._makeNode(args.parent, 'line', jQuery.extend(
		{x1: args.x1, y1: args.y1, x2: args.x2, y2: args.y2}, args.settings || {}));
	},
	
	/* Draw a polygonal line.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  points    (number[][]) the x-/y-coordinates for the points on the line
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	polyline: function(parent, points, settings) {
	    var args = this._args(arguments, ['points']);
	    return this._poly(args.parent, 'polyline', args.points, args.settings);
	},
	
	/* Draw a polygonal shape.
	   @param  parent    (element or jQuery) the parent node for the new shape (optional)
	   @param  points    (number[][]) the x-/y-coordinates for the points on the shape
	   @param  settings  (object) additional settings for the shape (optional)
	   @return  (element) the new shape node */
	polygon: function(parent, points, settings) {
	    var args = this._args(arguments, ['points']);
	    return this._poly(args.parent, 'polygon', args.points, args.settings);
	},
	
	/* Draw a polygonal line or shape. */
	_poly: function(parent, name, points, settings) {
	    var ps = '';
	    for (var i = 0; i < points.length; i++) {
		ps += points[i].join() + ' ';
	    }
	    return this._makeNode(parent, name, jQuery.extend(
		{points: jQuery.trim(ps)}, settings || {}));
	},
	
	/* Draw text.
	   Specify both of x and y or neither of them.
	   @param  parent    (element or jQuery) the parent node for the text (optional)
	   @param  x         (number or number[]) the x-coordinate(s) for the text (optional)
	   @param  y         (number or number[]) the y-coordinate(s) for the text (optional)
	   @param  value     (string) the text content or
	   (SVGText) text with spans and references
	   @param  settings  (object) additional settings for the text (optional)
	   @return  (element) the new text node */
	text: function(parent, x, y, value, settings) {
	    var args = this._args(arguments, ['x', 'y', 'value']);
	    if (typeof args.x == 'string' && arguments.length < 4) {
		args.value = args.x;
		args.settings = args.y;
		args.x = args.y = null;
	    }
	    return this._text(args.parent, 'text', args.value, jQuery.extend(
		{x: (args.x && isArray(args.x) ? args.x.join(' ') : args.x),
		 y: (args.y && isArray(args.y) ? args.y.join(' ') : args.y)}, 
		args.settings || {}));
	},
	
	/* Draw text along a path.
	   @param  parent    (element or jQuery) the parent node for the text (optional)
	   @param  path      (string) the ID of the path
	   @param  value     (string) the text content or
	   (SVGText) text with spans and references
	   @param  settings  (object) additional settings for the text (optional)
	   @return  (element) the new text node */
	textpath: function(parent, path, value, settings) {
	    var args = this._args(arguments, ['path', 'value']);
	    var node = this._text(args.parent, 'textPath', args.value, args.settings || {});
	    node.setAttributeNS(jQuery.svg.xlinkNS, 'href', args.path);
	    return node;
	},
	
	/* Draw text. */
	_text: function(parent, name, value, settings) {
	    var node = this._makeNode(parent, name, settings);
	    if (typeof value == 'number') {
		value = value.toString();
	    }
	    if (typeof value == 'string') {
		node.appendChild(node.ownerDocument.createTextNode(value));
	    }
	    else {
		for (var i = 0; i < value._parts.length; i++) {
		    var part = value._parts[i];
		    if (part[0] == 'tspan') {
			var child = this._makeNode(node, part[0], part[2]);
			child.appendChild(node.ownerDocument.createTextNode(part[1]));
			node.appendChild(child);
		    }
		    else if (part[0] == 'tref') {
			var child = this._makeNode(node, part[0], part[2]);
			child.setAttributeNS(jQuery.svg.xlinkNS, 'href', part[1]);
			node.appendChild(child);
		    }
		    else if (part[0] == 'textpath') {
			var set = jQuery.extend({}, part[2]);
			set.href = null;
			var child = this._makeNode(node, part[0], set);
			child.setAttributeNS(jQuery.svg.xlinkNS, 'href', part[2].href);
			child.appendChild(node.ownerDocument.createTextNode(part[1]));
			node.appendChild(child);
		    }
		    else { // straight text
			node.appendChild(node.ownerDocument.createTextNode(part[1]));
		    }
		}
	    }
	    return node;
	},
	
	/* Add a custom SVG element.
	   @param  parent    (element or jQuery) the parent node for the new element (optional)
	   @param  name      (string) the name of the element
	   @param  settings  (object) additional settings for the element (optional)
	   @return  (element) the new custom node */
	other: function(parent, name, settings) {
	    var args = this._args(arguments, ['name']);
	    return this._makeNode(args.parent, args.name, args.settings || {});
	},
	
	/* Create a shape node with the given settings. */
	_makeNode: function(parent, name, settings) {
	    parent = parent || this._svg;
	    var node = this._svg.ownerDocument.createElementNS(jQuery.svg.svgNS, name);
	    for (var name in settings) {
		var value = settings[name];
		if (value != null && value != null && 
		    (typeof value != 'string' || value != '')) {
		    node.setAttribute(jQuery.svg._attrNames[name] || name, value);
		}
	    }
	    parent.appendChild(node);
	    return node;
	},
	
	/* Add an existing SVG node to the diagram.
	   @param  parent  (element or jQuery) the parent node for the new node (optional)
	   @param  node    (element) the new node to add or
	   (string) the jQuery selector for the node or
	   (jQuery collection) set of nodes to add
	   @return  (SVGWrapper) this wrapper */
	add: function(parent, node) {
	    var args = this._args((arguments.length == 1 ? [null, parent] : arguments), ['node']);
	    var svg = this;
	    args.parent = args.parent || this._svg;
	    args.node = (args.node.jquery ? args.node : jQuery(args.node));
	    try {
		if (jQuery.svg._renesis) {
		    throw 'Force traversal';
		}
		args.parent.appendChild(args.node.cloneNode(true));
	    }
	    catch (e) {
		args.node.each(function() {
		    var child = svg._cloneAsSVG(this);
		    if (child) {
			args.parent.appendChild(child);
		    }
		});
	    }
	    return this;
	},
	
	/* Clone an existing SVG node and add it to the diagram.
	   @param  parent  (element or jQuery) the parent node for the new node (optional)
	   @param  node    (element) the new node to add or
	   (string) the jQuery selector for the node or
	   (jQuery collection) set of nodes to add
	   @return  (element[]) collection of new nodes */
	clone: function(parent, node) {
	    var svg = this;
	    var args = this._args((arguments.length == 1 ? [null, parent] : arguments), ['node']);
	    args.parent = args.parent || this._svg;
	    args.node = (args.node.jquery ? args.node : jQuery(args.node));
	    var newNodes = [];
	    args.node.each(function() {
		var child = svg._cloneAsSVG(this);
		if (child) {
		    child.id = '';
		    args.parent.appendChild(child);
		    newNodes.push(child);
		}
	    });
	    return newNodes;
	},
	
	/* SVG nodes must belong to the SVG namespace, so clone and ensure this is so.
	   @param  node  (element) the SVG node to clone
	   @return  (element) the cloned node */
	_cloneAsSVG: function(node) {
	    var newNode = null;
	    if (node.nodeType == 1) { // element
		newNode = this._svg.ownerDocument.createElementNS(
		    jQuery.svg.svgNS, this._checkName(node.nodeName));
		for (var i = 0; i < node.attributes.length; i++) {
		    var attr = node.attributes.item(i);
		    if (attr.nodeName != 'xmlns' && attr.nodeValue) {
			if (attr.prefix == 'xlink') {
			    newNode.setAttributeNS(jQuery.svg.xlinkNS,
						   attr.localName || attr.baseName, attr.nodeValue);
			}
			else {
			    newNode.setAttribute(this._checkName(attr.nodeName), attr.nodeValue);
			}
		    }
		}
		for (var i = 0; i < node.childNodes.length; i++) {
		    var child = this._cloneAsSVG(node.childNodes[i]);
		    if (child) {
			newNode.appendChild(child);
		    }
		}
	    }
	    else if (node.nodeType == 3) { // text
		if (jQuery.trim(node.nodeValue)) {
		    newNode = this._svg.ownerDocument.createTextNode(node.nodeValue);
		}
	    }
	    else if (node.nodeType == 4) { // CDATA
		if (jQuery.trim(node.nodeValue)) {
		    try {
			newNode = this._svg.ownerDocument.createCDATASection(node.nodeValue);
		    }
		    catch (e) {
			newNode = this._svg.ownerDocument.createTextNode(
			    node.nodeValue.replace(/&/g, '&amp;').
				replace(/</g, '&lt;').replace(/>/g, '&gt;'));
		    }
		}
	    }
	    return newNode;
	},
	
	/* Node names must be lower case and without SVG namespace prefix. */
	_checkName: function(name) {
	    name = (name.substring(0, 1) >= 'A' && name.substring(0, 1) <= 'Z' ?
		    name.toLowerCase() : name);
	    return (name.substring(0, 4) == 'svg:' ? name.substring(4) : name);
	},
	
	/* Load an external SVG document.
	   @param  url       (string) the location of the SVG document or
	   the actual SVG content
	   @param  settings  (boolean) see addTo below or
	   (function) see onLoad below or
	   (object) additional settings for the load with attributes below:
	   addTo       (boolean) true to add to what's already there,
	   or false to clear the canvas first
	   changeSize  (boolean) true to allow the canvas size to change,
	   or false to retain the original
	   onLoad      (function) callback after the document has loaded,
	   'this' is the container, receives SVG object and
	   optional error message as a parameter
	   parent      (string or element or jQuery) the parent to load
	   into, defaults to top-level svg element
	   @return  (SVGWrapper) this root */
	load: function(url, settings) {
	    settings = (typeof settings == 'boolean' ? {addTo: settings} :
			(typeof settings == 'function' ? {onLoad: settings} :
			 (typeof settings == 'string' ? {parent: settings} : 
			  (typeof settings == 'object' && settings.nodeName ? {parent: settings} :
			   (typeof settings == 'object' && settings.jquery ? {parent: settings} :
			    settings || {})))));
	    if (!settings.parent && !settings.addTo) {
		this.clear(false);
	    }
	    var size = [this._svg.getAttribute('width'), this._svg.getAttribute('height')];
	    var wrapper = this;
	    // Report a problem with the load
	    var reportError = function(message) {
		message = jQuery.svg.local.errorLoadingText + ': ' + message;
		if (settings.onLoad) {
		    settings.onLoad.apply(wrapper._container || wrapper._svg, [wrapper, message]);
		}
		else {
		    wrapper.text(null, 10, 20, message);
		}
	    };
	    // Create a DOM from SVG content
	    var loadXML4IE = function(data) {
		var xml = new ActiveXObject('Microsoft.XMLDOM');
		xml.validateOnParse = false;
		xml.resolveExternals = false;
		xml.async = false;
		xml.loadXML(data);
		if (xml.parseError.errorCode != 0) {
		    reportError(xml.parseError.reason);
		    return null;
		}
		return xml;
	    };
	    // Load the SVG DOM
	    var loadSVG = function(data) {
		if (!data) {
		    return;
		}
		if (data.documentElement.nodeName != 'svg') {
		    var errors = data.getElementsByTagName('parsererror');
		    var messages = (errors.length ? errors[0].getElementsByTagName('div') : []); // Safari
		    reportError(!errors.length ? '???' :
				(messages.length ? messages[0] : errors[0]).firstChild.nodeValue);
		    return;
		}
		var parent = (settings.parent ? jQuery(settings.parent)[0] : wrapper._svg);
		var attrs = {};
		for (var i = 0; i < data.documentElement.attributes.length; i++) {
		    var attr = data.documentElement.attributes.item(i);
		    if (!(attr.nodeName == 'version' || attr.nodeName.substring(0, 5) == 'xmlns')) {
			attrs[attr.nodeName] = attr.nodeValue;
		    }
		}
		wrapper.configure(parent, attrs, !settings.parent);
		var nodes = data.documentElement.childNodes;
		for (var i = 0; i < nodes.length; i++) {
		    try {
			if (jQuery.svg._renesis) {
			    throw 'Force traversal';
			}
			parent.appendChild(wrapper._svg.ownerDocument.importNode(nodes[i], true));
			if (nodes[i].nodeName == 'script') {
			    jQuery.globalEval(nodes[i].textContent);
			}
		    }
		    catch (e) {
			wrapper.add(parent, nodes[i]);
		    }
		}
		if (!settings.changeSize) {
		    wrapper.configure(parent, {width: size[0], height: size[1]});
		}
		if (settings.onLoad) {
		    settings.onLoad.apply(wrapper._container || wrapper._svg, [wrapper]);
		}
	    };
	    if (url.match('<svg')) { // Inline SVG
		loadSVG(jQuery.browser.msie ? loadXML4IE(url) :
			new DOMParser().parseFromString(url, 'text/xml'));
	    }
	    else { // Remote SVG
		jQuery.ajax({url: url, dataType: (jQuery.browser.msie ? 'text' : 'xml'),
			     success: function(xml) {
				 loadSVG(jQuery.browser.msie ? loadXML4IE(xml) : xml);
			     }, error: function(http, message, exc) {
				 reportError(message + (exc ? ' ' + exc.message : ''));
			     }});
	    }
	    return this;
	},
	
	/* Delete a specified node.
	   @param  node  (element or jQuery) the drawing node to remove
	   @return  (SVGWrapper) this root */
	remove: function(node) {
	    node = (node.jquery ? node[0] : node);
	    node.parentNode.removeChild(node);
	    return this;
	},
	
	/* Delete everything in the current document.
	   @param  attrsToo  (boolean) true to clear any root attributes as well,
	   false to leave them (optional)
	   @return  (SVGWrapper) this root */
	clear: function(attrsToo) {
	    if (attrsToo) {
		this.configure({}, true);
	    }
	    while (this._svg.firstChild) {
		this._svg.removeChild(this._svg.firstChild);
	    }
	    return this;
	},
	
	/* Serialise the current diagram into an SVG text document.
	   @param  node  (SVG element) the starting node (optional)
	   @return  (string) the SVG as text */
	toSVG: function(node) {
	    node = node || this._svg;
	    return (typeof XMLSerializer == 'undefined' ? this._toSVG(node) :
		    new XMLSerializer().serializeToString(node));
	},
	
	/* Serialise one node in the SVG hierarchy. */
	_toSVG: function(node) {
	    var svgDoc = '';
	    if (!node) {
		return svgDoc;
	    }
	    if (node.nodeType == 3) { // Text
		svgDoc = node.nodeValue;
	    }
	    else if (node.nodeType == 4) { // CDATA
		svgDoc = '<![CDATA[' + node.nodeValue + ']]>';
	    }
	    else { // Element
		svgDoc = '<' + node.nodeName;
		if (node.attributes) {
		    for (var i = 0; i < node.attributes.length; i++) {
			var attr = node.attributes.item(i);
			if (!(jQuery.trim(attr.nodeValue) == '' || attr.nodeValue.match(/^\[object/) ||
			      attr.nodeValue.match(/^function/))) {
			    svgDoc += ' ' + (attr.namespaceURI == jQuery.svg.xlinkNS ? 'xlink:' : '') + 
				attr.nodeName + '="' + attr.nodeValue + '"';
			}
		    }
		}	
		if (node.firstChild) {
		    svgDoc += '>';
		    var child = node.firstChild;
		    while (child) {
			svgDoc += this._toSVG(child);
			child = child.nextSibling;
		    }
		    svgDoc += '</' + node.nodeName + '>';
		}
		else {
		    svgDoc += '/>';
		}
	    }
	    return svgDoc;
	}
    });
    
    /* Helper to generate an SVG path.
       Obtain an instance from the SVGWrapper object.
       String calls together to generate the path and use its value:
       var path = root.createPath();
       root.path(null, path.move(100, 100).line(300, 100).line(200, 300).close(), {fill: 'red'});
       or
       root.path(null, path.move(100, 100).line([[300, 100], [200, 300]]).close(), {fill: 'red'}); */
    function SVGPath() {
	this._path = '';
    }
    
    jQuery.extend(SVGPath.prototype, {
	/* Prepare to create a new path.
	   @return  (SVGPath) this path */
	reset: function() {
	    this._path = '';
	    return this;
	},
	
	/* Move the pointer to a position.
	   @param  x         (number) x-coordinate to move to or
	   (number[][]) x-/y-coordinates to move to
	   @param  y         (number) y-coordinate to move to (omitted if x is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	move: function(x, y, relative) {
	    relative = (isArray(x) ? y : relative);
	    return this._coords((relative ? 'm' : 'M'), x, y);
	},
	
	/* Draw a line to a position.
	   @param  x         (number) x-coordinate to move to or
	   (number[][]) x-/y-coordinates to move to
	   @param  y         (number) y-coordinate to move to (omitted if x is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	line: function(x, y, relative) {
	    relative = (isArray(x) ? y : relative);
	    return this._coords((relative ? 'l' : 'L'), x, y);
	},
	
	/* Draw a horizontal line to a position.
	   @param  x         (number) x-coordinate to draw to or
	   (number[]) x-coordinates to draw to
	   @param  relative  (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	horiz: function(x, relative) {
	    this._path += (relative ? 'h' : 'H') + (isArray(x) ? x.join(' ') : x);
	    return this;
	},
	
	/* Draw a vertical line to a position.
	   @param  y         (number) y-coordinate to draw to or
	   (number[]) y-coordinates to draw to
	   @param  relative  (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	vert: function(y, relative) {
	    this._path += (relative ? 'v' : 'V') + (isArray(y) ? y.join(' ') : y);
	    return this;
	},
	
	/* Draw a cubic Bézier curve.
	   @param  x1        (number) x-coordinate of beginning control point or
	   (number[][]) x-/y-coordinates of control and end points to draw to
	   @param  y1        (number) y-coordinate of beginning control point (omitted if x1 is array)
	   @param  x2        (number) x-coordinate of ending control point (omitted if x1 is array)
	   @param  y2        (number) y-coordinate of ending control point (omitted if x1 is array)
	   @param  x         (number) x-coordinate of curve end (omitted if x1 is array)
	   @param  y         (number) y-coordinate of curve end (omitted if x1 is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	curveC: function(x1, y1, x2, y2, x, y, relative) {
	    relative = (isArray(x1) ? y1 : relative);
	    return this._coords((relative ? 'c' : 'C'), x1, y1, x2, y2, x, y);
	},
	
	/* Continue a cubic Bézier curve.
	   Starting control point is the reflection of the previous end control point.
	   @param  x2        (number) x-coordinate of ending control point or
	   (number[][]) x-/y-coordinates of control and end points to draw to
	   @param  y2        (number) y-coordinate of ending control point (omitted if x2 is array)
	   @param  x         (number) x-coordinate of curve end (omitted if x2 is array)
	   @param  y         (number) y-coordinate of curve end (omitted if x2 is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	smoothC: function(x2, y2, x, y, relative) {
	    relative = (isArray(x2) ? y2 : relative);
	    return this._coords((relative ? 's' : 'S'), x2, y2, x, y);
	},
	
	/* Draw a quadratic Bézier curve.
	   @param  x1        (number) x-coordinate of control point or
	   (number[][]) x-/y-coordinates of control and end points to draw to
	   @param  y1        (number) y-coordinate of control point (omitted if x1 is array)
	   @param  x         (number) x-coordinate of curve end (omitted if x1 is array)
	   @param  y         (number) y-coordinate of curve end (omitted if x1 is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	curveQ: function(x1, y1, x, y, relative) {
	    relative = (isArray(x1) ? y1 : relative);
	    return this._coords((relative ? 'q' : 'Q'), x1, y1, x, y);
	},
	
	/* Continue a quadratic Bézier curve.
	   Control point is the reflection of the previous control point.
	   @param  x         (number) x-coordinate of curve end or
	   (number[][]) x-/y-coordinates of points to draw to
	   @param  y         (number) y-coordinate of curve end (omitted if x is array)
	   @param  relative  (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	smoothQ: function(x, y, relative) {
	    relative = (isArray(x) ? y : relative);
	    return this._coords((relative ? 't' : 'T'), x, y);
	},
	
	/* Generate a path command with (a list of) coordinates. */
	_coords: function(cmd, x1, y1, x2, y2, x3, y3) {
	    if (isArray(x1)) {
		for (var i = 0; i < x1.length; i++) {
		    var cs = x1[i];
		    this._path += (i == 0 ? cmd : ' ') + cs[0] + ',' + cs[1] +
			(cs.length < 4 ? '' : ' ' + cs[2] + ',' + cs[3] +
			 (cs.length < 6 ? '': ' ' + cs[4] + ',' + cs[5]));
		}
	    }
	    else {
		this._path += cmd + x1 + ',' + y1 + 
		    (x2 == null ? '' : ' ' + x2 + ',' + y2 +
		     (x3 == null ? '' : ' ' + x3 + ',' + y3));
	    }
	    return this;
	},
	
	/* Draw an arc to a position.
	   @param  rx         (number) x-radius of arc or
	   (number/boolean[][]) x-/y-coordinates and flags for points to draw to
	   @param  ry         (number) y-radius of arc (omitted if rx is array)
	   @param  xRotate    (number) x-axis rotation (degrees, clockwise) (omitted if rx is array)
	   @param  large      (boolean) true to draw the large part of the arc,
	   false to draw the small part (omitted if rx is array)
	   @param  clockwise  (boolean) true to draw the clockwise arc,
	   false to draw the anti-clockwise arc (omitted if rx is array)
	   @param  x          (number) x-coordinate of arc end (omitted if rx is array)
	   @param  y          (number) y-coordinate of arc end (omitted if rx is array)
	   @param  relative   (boolean) true for coordinates relative to the current point,
	   false for coordinates being absolute
	   @return  (SVGPath) this path */
	arc: function(rx, ry, xRotate, large, clockwise, x, y, relative) {
	    relative = (isArray(rx) ? ry : relative);
	    this._path += (relative ? 'a' : 'A');
	    if (isArray(rx)) {
		for (var i = 0; i < rx.length; i++) {
		    var cs = rx[i];
		    this._path += (i == 0 ? '' : ' ') + cs[0] + ',' + cs[1] + ' ' +
			cs[2] + ' ' + (cs[3] ? '1' : '0') + ',' +
			(cs[4] ? '1' : '0') + ' ' + cs[5] + ',' + cs[6];
		}
	    }
	    else {
		this._path += rx + ',' + ry + ' ' + xRotate + ' ' +
		    (large ? '1' : '0') + ',' + (clockwise ? '1' : '0') + ' ' + x + ',' + y;
	    }
	    return this;
	},
	
	/* Close the current path.
	   @return  (SVGPath) this path */
	close: function() {
	    this._path += 'z';
	    return this;
	},
	
	/* Return the string rendering of the specified path.
	   @return  (string) stringified path */
	path: function() {
	    return this._path;
	}
    });
    
    SVGPath.prototype.moveTo = SVGPath.prototype.move;
    SVGPath.prototype.lineTo = SVGPath.prototype.line;
    SVGPath.prototype.horizTo = SVGPath.prototype.horiz;
    SVGPath.prototype.vertTo = SVGPath.prototype.vert;
    SVGPath.prototype.curveCTo = SVGPath.prototype.curveC;
    SVGPath.prototype.smoothCTo = SVGPath.prototype.smoothC;
    SVGPath.prototype.curveQTo = SVGPath.prototype.curveQ;
    SVGPath.prototype.smoothQTo = SVGPath.prototype.smoothQ;
    SVGPath.prototype.arcTo = SVGPath.prototype.arc;
    
    /* Helper to generate an SVG text object.
       Obtain an instance from the SVGWrapper object.
       String calls together to generate the text and use its value:
       var text = root.createText();
       root.text(null, x, y, text.string('This is ').
       span('red', {fill: 'red'}).string('!'), {fill: 'blue'}); */
    function SVGText() {
	this._parts = []; // The components of the text object
    }
    
    jQuery.extend(SVGText.prototype, {
	/* Prepare to create a new text object.
	   @return  (SVGText) this text */
	reset: function() {
	    this._parts = [];
	    return this;
	},
	
	/* Add a straight string value.
	   @param  value  (string) the actual text
	   @return  (SVGText) this text object */
	string: function(value) {
	    this._parts[this._parts.length] = ['text', value];
	    return this;
	},
	
	/* Add a separate text span that has its own settings.
	   @param  value     (string) the actual text
	   @param  settings  (object) the settings for this text
	   @return  (SVGText) this text object */
	span: function(value, settings) {
	    this._parts[this._parts.length] = ['tspan', value, settings];
	    return this;
	},
	
	/* Add a reference to a previously defined text string.
	   @param  id        (string) the ID of the actual text
	   @param  settings  (object) the settings for this text
	   @return  (SVGText) this text object */
	ref: function(id, settings) {
	    this._parts[this._parts.length] = ['tref', id, settings];
	    return this;
	},
	
	/* Add text drawn along a path.
	   @param  id        (string) the ID of the path
	   @param  value     (string) the actual text
	   @param  settings  (object) the settings for this text
	   @return  (SVGText) this text object */
	path: function(id, value, settings) {
	    this._parts[this._parts.length] = ['textpath', value, 
					       jQuery.extend({href: id}, settings || {})];
	    return this;
	}
    });
    
    /* Attach the SVG functionality to a jQuery selection.
       @param  command  (string) the command to run (optional, default 'attach')
       @param  options  (object) the new settings to use for these SVG instances
       @return jQuery (object) for chaining further calls */
    jQuery.fn.svg = function(options) {
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (typeof options == 'string' && options == 'get') {
	    return jQuery.svg['_' + options + 'SVG'].apply(jQuery.svg, [this[0]].concat(otherArgs));
	}
	return this.each(function() {
	    if (typeof options == 'string') {
		jQuery.svg['_' + options + 'SVG'].apply(jQuery.svg, [this].concat(otherArgs));
	    }
	    else {
		jQuery.svg._attachSVG(this, options || {});
	    } 
	});
    };
    
    //====================
    /* Helper Functions */
    //====================

    /* Determine whether an object is an array. */
    function isArray(a) {
	return (a && a.constructor == Array);
    }
    
    /* Calculate log10 */
    function log10(val) {
	if (val == 0) {
	    return 0;
	}
	return Math.log(val) / Math.LN10;
    }
    
    /* Round a number to a given number of decimal points. */
    function roundNumber(num, dec) {
	return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    }

    // Singleton primary SVG interface
    jQuery.svg = new SVGManager();

    //============
    /* Graphing */
    //============
    
    jQuery.svg.addExtension('graph', SVGGraph);
    
    // Singleton primary SVG graphing interface
    jQuery.svg.graphing = new SVGGraphing();
    
    function SVGGraphing() {
	this.regional = [];
	this.regional[''] = {percentageText: 'Percentage'};
	this.region = this.regional[''];
    }
    
    jQuery.extend(SVGGraphing.prototype, {
	_chartTypes: [],
	
	/* Add a new chart rendering type to the package.
	   The rendering object must implement the following functions:
	   getTitle(), getDescription(), getOptions(), drawChart(graph).
	   @param  id         (string) the ID of this graph renderer
	   @param  chartType  (object) the object implementing this chart type */
	addChartType: function(id, chartType) {
	    this._chartTypes[id] = chartType;
	},
	
	/* Retrieve the list of chart types.
	   @return  (object[string]) the array of chart types indexed by ID */
	chartTypes: function() {
	    return this._chartTypes;
	}
    });
    
    /* Extension point for SVG graphing.
       Access through svg.graph. */
    function SVGGraph(wrapper) {
	this._wrapper = wrapper; // The attached SVG wrapper object
	this._drawNow = false; // True for immediate update, false to wait for redraw call
	for (var id in jQuery.svg.graphing._chartTypes) {
	    this._chartType = jQuery.svg.graphing._chartTypes[id]; // Use first graph renderer
	    break;
	}
	this._chartOptions = {}; // Extra options for the graph type
	// The graph title and settings
	this._title = {value: '', offset: 25, settings: {textAnchor: 'middle'}};
	this._area = [0.1, 0.1, 0.8, 0.9]; // The chart area: left, top, right, bottom,
	// > 1 in pixels, <= 1 as proportion
	this._chartFormat = {fill: 'none', stroke: 'black'}; // The formatting for the chart area
	this._gridlines = []; // The formatting of the x- and y-gridlines
	this._series = []; // The series to be plotted, each is an object
	this._onstatus = null; // The callback function for status updates
	this._chartCont = this._wrapper.svg(0, 0, 0, 0, {class_: 'svg-graph'}); // The main container for the graph
	
	this.xAxis = new SVGGraphAxis(this); // The main x-axis
	this.xAxis.title('', 40);
	this.yAxis = new SVGGraphAxis(this); // The main y-axis
	this.yAxis.title('', 40);
	this.x2Axis = null; // The secondary x-axis
	this.y2Axis = new SVGGraphAxis(this); // The secondary y-axis
	this.legend = new SVGGraphLegend(this); // The chart legend
	this._drawNow = true;
    }
    
    jQuery.extend(SVGGraph.prototype, {
	
	/* Useful indexes. */
	X: 0,
	Y: 1,
	W: 2,
	H: 3,
	L: 0,
	T: 1,
	R: 2,
	B: 3,
	
	/* Standard percentage axis. */
	_percentageAxis: new SVGGraphAxis(this, jQuery.svg.graphing.region.percentageText, 0, 100, 10, 0),
	
	/* Set or retrieve the container for the graph.
	   @param  cont  (SVG element) the container for the graph
	   @return  (SVGGraph) this graph object or
	   (SVG element) the current container (if no parameters) */
	container: function(cont) {
	    if (arguments.length == 0) {
		return this._chartCont;
	    }
	    this._chartCont = cont;
	    return this;
	},
	
	/* Set or retrieve the type of chart to be rendered.
	   See jQuery.svg.graphing.getChartTypes() for the list of available types.
	   @param  id       (string) the ID of the chart type
	   @param  options  (object) additional settings for this chart type (optional)
	   @return  (SVGGraph) this graph object or
	   (string) the chart type (if no parameters)
	   @deprecated  use type() */
	chartType: function(id, options) {
	    return (arguments.length == 0 ? this.type() : this.type(id, options));
	},
	
	/* Set or retrieve the type of chart to be rendered.
	   See jQuery.svg.graphing.getChartTypes() for the list of available types.
	   @param  id       (string) the ID of the chart type
	   @param  options  (object) additional settings for this chart type (optional)
	   @return  (SVGGraph) this graph object or
	   (string) the chart type (if no parameters) */
	type: function(id, options) {
	    if (arguments.length == 0) {
		return this._chartType;
	    }
	    var chartType = jQuery.svg.graphing._chartTypes[id];
	    if (chartType) {
		this._chartType = chartType;
		this._chartOptions = jQuery.extend({}, options || {});
	    }
	    this._drawGraph();
	    return this;
	},
	
	/* Set or retrieve additional options for the particular chart type.
	   @param  options  (object) the extra options
	   @return  (SVGGraph) this graph object or
	   (object) the chart options (if no parameters)
	   @deprecated  use options() */
	chartOptions: function(options) {
	    return(arguments.length == 0 ? this.options() : this.options(options));
	},
	
	/* Set or retrieve additional options for the particular chart type.
	   @param  options  (object) the extra options
	   @return  (SVGGraph) this graph object or
	   (object) the chart options (if no parameters) */
	options: function(options) {
	    if (arguments.length == 0) {
		return this._chartOptions;
	    }
	    this._chartOptions = jQuery.extend({}, options);
	    this._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the background of the graph chart.
	   @param  fill      (string) how to fill the chart background
	   @param  stroke    (string) the colour of the outline (optional)
	   @param  settings  (object) additional formatting for the chart background (optional)
	   @return  (SVGGraph) this graph object or
	   (object) the chart format (if no parameters)
	   @deprecated  use format() */
	chartFormat: function(fill, stroke, settings) {
	    return (arguments.length == 0 ? this.format() : this.format(fill, stroke, settings));
	},
	
	/* Set or retrieve the background of the graph chart.
	   @param  fill      (string) how to fill the chart background
	   @param  stroke    (string) the colour of the outline (optional)
	   @param  settings  (object) additional formatting for the chart background (optional)
	   @return  (SVGGraph) this graph object or
	   (object) the chart format (if no parameters) */
	format: function(fill, stroke, settings) {
	    if (arguments.length == 0) {
		return this._chartFormat;
	    }
	    if (typeof stroke == 'object') {
		settings = stroke;
		stroke = null;
	    }
	    this._chartFormat = jQuery.extend({fill: fill},
					      (stroke ? {stroke: stroke} : {}), settings || {});
	    this._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the main chart area.
	   @param  left    (number) > 1 is pixels, <= 1 is proportion of width or
	   (number[4]) for left, top, right, bottom
	   @param  top     (number) > 1 is pixels, <= 1 is proportion of height
	   @param  right   (number) > 1 is pixels, <= 1 is proportion of width
	   @param  bottom  (number) > 1 is pixels, <= 1 is proportion of height
	   @return  (SVGGraph) this graph object or
	   (number[4]) the chart area: left, top, right, bottom (if no parameters)
	   @deprecated use area() */
	chartArea: function(left, top, right, bottom) {
	    return (arguments.length == 0 ? this.area() : this.area(left, top, right, bottom));
	},
	
	/* Set or retrieve the main chart area.
	   @param  left    (number) > 1 is pixels, <= 1 is proportion of width or
	   (number[4]) for left, top, right, bottom
	   @param  top     (number) > 1 is pixels, <= 1 is proportion of height
	   @param  right   (number) > 1 is pixels, <= 1 is proportion of width
	   @param  bottom  (number) > 1 is pixels, <= 1 is proportion of height
	   @return  (SVGGraph) this graph object or
	   (number[4]) the chart area: left, top, right, bottom (if no parameters) */
	area: function(left, top, right, bottom) {
	    if (arguments.length == 0) {
		return this._area;
	    }
	    this._area = (isArray(left) ? left : [left, top, right, bottom]);
	    this._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the gridlines formatting for the graph chart.
	   @param  xSettings  (string) the colour of the gridlines along the x-axis, or
	   (object) formatting for the gridlines along the x-axis, or
	   null for none
	   @param  ySettings  (string) the colour of the gridlines along the y-axis, or
	   (object) formatting for the gridlines along the y-axis, or
	   null for none
	   @return  (SVGGraph) this graph object or
	   (object[2]) the gridlines formatting (if no parameters) */
	gridlines: function(xSettings, ySettings) {
	    if (arguments.length == 0) {
		return this._gridlines;
	    }
	    this._gridlines = [(typeof xSettings == 'string' ? {stroke: xSettings} : xSettings),
			       (typeof ySettings == 'string' ? {stroke: ySettings} : ySettings)];
	    if (this._gridlines[0] == null && this._gridlines[1] == null) {
		this._gridlines = [];
	    }
	    this._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the title of the graph and its formatting.
	   @param  value     (string) the title
	   @param  offset    (number) the vertical positioning of the title
           > 1 is pixels, <= 1 is proportion of width (optional)
	   @param  colour    (string) the colour of the title (optional)
	   @param  settings  (object) formatting for the title (optional)
	   @return  (SVGGraph) this graph object or
	   (object) value, offset, and settings for the title (if no parameters) */
	title: function(value, offset, colour, settings) {
	    if (arguments.length == 0) {
		return this._title;
	    }
	    if (typeof offset != 'number') {
		settings = colour;
		colour = offset;
		offset = null;
	    }
	    if (typeof colour != 'string') {
		settings = colour;
		colour = null;
	    }
	    this._title = {value: value, offset: offset || this._title.offset,
			   settings: jQuery.extend({textAnchor: 'middle'},
						   (colour ? {fill: colour} : {}), settings || {})};
	    this._drawGraph();
	    return this;
	},
	
	/* Add a series of values to be plotted on the graph.
	   @param  name         (string) the name of this series (optional)
	   @param  values       (number[]) the values to be plotted
	   @param  fill         (string) how the plotted values are filled
	   @param  stroke       (string) the colour of the plotted lines (optional)
	   @param  strokeWidth  (number) the width of the plotted lines (optional)
	   @param  settings     (object) additional settings for the plotted values (optional)
	   @return  (SVGGraph) this graph object */
	addSeries: function(name, values, fill, stroke, strokeWidth, settings) {
	    this._series.push(new SVGGraphSeries(
		this, name, values, fill, stroke, strokeWidth, settings));
	    this._drawGraph();
	    return this;
	},
	
	/* Retrieve the series wrappers.
	   @param  i  (number) the series index (optional)
	   @return  (SVGGraphSeries) the specified series or
	   (SVGGraphSeries[]) the list of series */
	series: function(i) {
	    return (arguments.length > 0 ? this._series[i] : null) || this._series;
	},
	
	/* Suppress drawing of the graph until redraw() is called.
	   @return  (SVGGraph) this graph object */
	noDraw: function() {
	    this._drawNow = false;
	    return this;
	},
	
	/* Redraw the entire graph with the current settings and values.
	   @return  (SVGGraph) this graph object */
	redraw: function() {
	    this._drawNow = true;
	    this._drawGraph();
	    return this;
	},
	
	/* Set the callback function for status updates.
	   @param  onstatus  (function) the callback function
	   @return  (SVGGraph) this graph object */
	status: function(onstatus) {
	    this._onstatus = onstatus;
	    return this;
	},
	
	/* Actually draw the graph (if allowed) based on the graph type set. */
	_drawGraph: function() {
	    if (!this._drawNow) {
		return;
	    }
	    while (this._chartCont.firstChild) {
		this._chartCont.removeChild(this._chartCont.firstChild);
	    }
	    if (!this._chartCont.parent) {
		this._wrapper._svg.appendChild(this._chartCont);
	    }
	    // Set sizes if not already there
	    if (!this._chartCont.width) {
		this._chartCont.setAttribute('width',
					     parseInt(this._chartCont.getAttribute('width'), 10) || this._wrapper._width());
	    }
	    else if (this._chartCont.width.baseVal) {
		this._chartCont.width.baseVal.value =
		    this._chartCont.width.baseVal.value || this._wrapper._width();
	    }
	    else {
		this._chartCont.width = this._chartCont.width || this._wrapper._width();
	    }
	    if (!this._chartCont.height) {
		this._chartCont.setAttribute('height',
					     parseInt(this._chartCont.getAttribute('height'), 10) || this._wrapper._height());
	    }
	    else if (this._chartCont.height.baseVal) {
		this._chartCont.height.baseVal.value =
		    this._chartCont.height.baseVal.value || this._wrapper._height();
	    }
	    else {
		this._chartCont.height = this._chartCont.height || this._wrapper._height();
	    }
	    this._chartType.drawGraph(this);
	},
	
	/* Decode an attribute value.
	   @param  node  the node to examine
	   @param  name  the attribute name
	   @return  the actual value */
	_getValue: function(node, name) {
	    return (!node[name] ? parseInt(node.getAttribute(name), 10) :
		    (node[name].baseVal ? node[name].baseVal.value : node[name]));
	},
	
	/* Draw the graph title - centred. */
	_drawTitle: function() {
	    this._wrapper.text(this._chartCont, this._getValue(this._chartCont, 'width') / 2,
			       this._title.offset, this._title.value, this._title.settings);
	},
	
	/* Calculate the actual dimensions of the chart area.
	   @param  area  (number[4]) the area values to evaluate (optional)
	   @return  (number[4]) an array of dimension values: left, top, width, height */
	_getDims: function(area) {
	    area = area || this._area;
	    var availWidth = this._getValue(this._chartCont, 'width');
	    var availHeight = this._getValue(this._chartCont, 'height');
	    var left = (area[this.L] > 1 ? area[this.L] : availWidth * area[this.L]);
	    var top = (area[this.T] > 1 ? area[this.T] : availHeight * area[this.T]);
	    var width = (area[this.R] > 1 ? area[this.R] : availWidth * area[this.R]) - left;
	    var height = (area[this.B] > 1 ? area[this.B] : availHeight * area[this.B]) - top;
	    return [left, top, width, height];
	},
	
	/* Draw the chart background, including gridlines.
	   @param  noXGrid  (boolean) true to suppress the x-gridlines, false to draw them (optional)
	   @param  noYGrid  (boolean) true to suppress the y-gridlines, false to draw them (optional)
	   @return  (element) the background group element */
	_drawChartBackground: function(noXGrid, noYGrid) {
	    var bg = this._wrapper.group(this._chartCont, {class_: 'background'});
	    var dims = this._getDims();
	    this._wrapper.rect(bg, dims[this.X], dims[this.Y], dims[this.W], dims[this.H], this._chartFormat);
	    if (this._gridlines[0] && this.yAxis._ticks.major && !noYGrid) {
		this._drawGridlines(bg, this.yAxis, true, dims, this._gridlines[0]);
	    }
	    if (this._gridlines[1] && this.xAxis._ticks.major && !noXGrid) {
		this._drawGridlines(bg, this.xAxis, false, dims, this._gridlines[1]);
	    }
	    return bg;
	},
	
	/* Draw one set of gridlines.
	   @param  bg      (element) the background group element
	   @param  axis    (SVGGraphAxis) the axis definition
	   @param  horiz   (boolean) true if horizontal, false if vertical
	   @param  dims    (number[]) the left, top, width, height of the chart area
	   @param  format  (object) additional settings for the gridlines */
	_drawGridlines: function(bg, axis, horiz, dims, format) {
	    var g = this._wrapper.group(bg, format);
	    var scale = (horiz ? dims[this.H] : dims[this.W]) / (axis._scale.max - axis._scale.min);
	    var major = Math.floor(axis._scale.min / axis._ticks.major) * axis._ticks.major;
	    major = (major < axis._scale.min ? major + axis._ticks.major : major);
	    while (major <= axis._scale.max) {
		var v = (horiz ? axis._scale.max - major : major - axis._scale.min) * scale +
		    (horiz ? dims[this.Y] : dims[this.X]);
		this._wrapper.line(g, (horiz ? dims[this.X] : v), (horiz ? v : dims[this.Y]),
				   (horiz ? dims[this.X] + dims[this.W] : v), (horiz ? v : dims[this.Y] + dims[this.H]));
		major += axis._ticks.major;
	    }
	},
	
	/* Draw the axes in their standard configuration.
	   @param  noX  (boolean) true to suppress the x-axes, false to draw it (optional) */
	_drawAxes: function(noX) {
	    var dims = this._getDims();
	    if (this.xAxis && !noX) {
		if (this.xAxis._title) {
		    this._wrapper.text(this._chartCont, dims[this.X] + dims[this.W] / 2,
				       dims[this.Y] + dims[this.H] + this.xAxis._titleOffset,
				       this.xAxis._title, this.xAxis._titleFormat);
		}
		this._drawAxis(this.xAxis, 'xAxis', dims[this.X], dims[this.Y] + dims[this.H],
			       dims[this.X] + dims[this.W], dims[this.Y] + dims[this.H]);
	    }
	    if (this.yAxis) {
		if (this.yAxis._title) {
		    this.yAxis._titleOffset = dims[this.X] - (this.yAxis._titleFontSize || 14);
		    this._wrapper.text(this._chartCont, 0, 0, this.yAxis._title, jQuery.extend({textAnchor: 'middle',
												transform: 'translate(' + (dims[this.X] - this.yAxis._titleOffset) + ',' +
												(dims[this.Y] + dims[this.H] / 2) + ') rotate(-90)'}, this.yAxis._titleFormat || {}));
		}
		this._drawAxis(this.yAxis, 'yAxis', dims[this.X], dims[this.Y],
			       dims[this.X], dims[this.Y] + dims[this.H]);
	    }
	    if (this.x2Axis && !noX) {
		if (this.x2Axis._title) {
		    this._wrapper.text(this._chartCont, dims[this.X] + dims[this.W] / 2,
				       dims[this.X] - this.x2Axis._titleOffset, this.x2Axis._title, this.x2Axis._titleFormat);
		}
		this._drawAxis(this.x2Axis, 'x2Axis', dims[this.X], dims[this.Y],
			       dims[this.X] + dims[this.W], dims[this.Y]);
	    }
	    if (this.y2Axis) {
		if (this.y2Axis._title) {
		    var titlePos = this._getValue(this._chartCont, 'width') - 10;
		    this._wrapper.text(this._chartCont, 0, 0, this.y2Axis._title, jQuery.extend({textAnchor: 'middle',
												 transform: 'translate(' + titlePos +
												 ',' + (dims[this.Y] + dims[this.H] / 2) + ') rotate(90)'}, this.y2Axis._titleFormat || {}));
		}
		this._drawAxis(this.y2Axis, 'y2Axis', dims[this.X] + dims[this.W], dims[this.Y],
			       dims[this.X] + dims[this.W], dims[this.Y] + dims[this.H]);
	    }
	},
	
	/* Draw an axis and its tick marks.
	   @param  axis  (SVGGraphAxis) the axis definition
	   @param  id    (string) the identifier for the axis group element
	   @param  x1    (number) starting x-coodinate for the axis
	   @param  y1    (number) starting y-coodinate for the axis
	   @param  x2    (number) ending x-coodinate for the axis
	   @param  y2    (number) ending y-coodinate for the axis */
	_drawAxis: function(axis, id, x1, y1, x2, y2) {
	    var horiz = (y1 == y2);
	    var gl = this._wrapper.group(this._chartCont, jQuery.extend({class_: id}, axis._lineFormat));
	    var gt = this._wrapper.group(this._chartCont, jQuery.extend({class_: id + 'Labels',
									 textAnchor: (horiz ? 'middle' : (id=='y2Axis' ? 'left' : 'end'))}, axis._labelFormat));
	    this._wrapper.line(gl, x1, y1, x2, y2);
	    if (axis._ticks.major) {
		var bottomRight = (x2 > (this._getValue(this._chartCont, 'width') / 2) &&
				   y2 > (this._getValue(this._chartCont, 'height') / 2));
		var scale = (horiz ? x2 - x1 : y2 - y1) / (axis._scale.max - axis._scale.min);
		var size = axis._ticks.size;
		var major = Math.floor(axis._scale.min / axis._ticks.major) * axis._ticks.major;
		major = (major < axis._scale.min ? major + axis._ticks.major : major);
		var minor = (!axis._ticks.minor ? axis._scale.max + 1 :
			     Math.floor(axis._scale.min / axis._ticks.minor) * axis._ticks.minor);
		minor = (minor < axis._scale.min ? minor + axis._ticks.minor : minor);
		var offsets = this._getTickOffsets(axis, bottomRight);
		var count = 0;
		while (major <= axis._scale.max || minor <= axis._scale.max) {
		    var cur = Math.min(major, minor);
		    var len = (cur == major ? size : size / 2);
		    var v = (horiz ? x1 : y1) +
			(horiz ? cur - axis._scale.min : axis._scale.max - cur) * scale;
		    this._wrapper.line(gl, (horiz ? v : x1 + len * offsets[0]),
				       (horiz ? y1 + len * offsets[0] : v),
				       (horiz ? v : x1 + len * offsets[1]),
				       (horiz ? y1 + len * offsets[1] : v));
		    if (cur == major) {
			var pretty_cur = cur;
			if (this.shortAxisLabels) {
			    pretty_cur = Math.floor(pretty_cur) + '';
			    if (pretty_cur.length > 12) {
				pretty_cur = cur / 1000000000000;
				pretty_cur = pretty_cur.formatString(1)+' T';
			    } else if (pretty_cur.length > 9) {
				pretty_cur = cur / 1000000000;
				pretty_cur = pretty_cur.formatString(1)+' G';
			    } else if (pretty_cur.length > 6) {
				pretty_cur = cur / 1000000;
				pretty_cur = pretty_cur.formatString(1)+' M';
			    } else if (pretty_cur.length > 3) {
				pretty_cur = cur / 1000;
				pretty_cur = pretty_cur.formatString(1)+' K';
			    }
			}

			var logtext = this._wrapper.createText().string('10').span(cur, {dy: -10, fontSize: 10});
			this._wrapper.text(gt, (horiz ? v : (id=='y2Axis' ? x1 + size : x1 - size)), (horiz ? y1 + 2 * size : v),
					   (axis._labels ? axis._labels[count++] : ((axis._scale.type == 'log') ? logtext : pretty_cur)));
		    }
		    
		    if (axis._scale.type == 'log') {
			major += (cur == major ? 1 : 0);
			minor += (cur == minor ? 1 : 0);
		    } else {
			major += (cur == major ? axis._ticks.major : 0);
			minor += (cur == minor ? axis._ticks.minor : 0);
		    }
		}
	    }
	},
	
	/* Calculate offsets based on axis and tick positions.
	   @param  axis         (SVGGraphAxis) the axis definition
	   @param  bottomRight  (boolean) true if this axis is appearing on the bottom or
	   right of the chart area, false if to the top or left
	   @return  (number[2]) the array of offset multipliers (-1..+1) */
	_getTickOffsets: function(axis, bottomRight) {
	    return [(axis._ticks.position == (bottomRight ? 'in' : 'out') ||
		     axis._ticks.position == 'both' ? -1 : 0),
		    (axis._ticks.position == (bottomRight ? 'out' : 'in') ||
		     axis._ticks.position == 'both' ? +1 : 0), ];
	},
	
	/* Retrieve the standard percentage axis.
	   @return  (SVGGraphAxis) percentage axis */
	_getPercentageAxis: function() {
	    this._percentageAxis._title = jQuery.svg.graphing.region.percentageText;
	    return this._percentageAxis;
	},
	
	/* Calculate the column totals across all the series. */
	_getTotals: function() {
	    var totals = [];
	    var numVal = (this._series.length ? this._series[0]._values.length : 0);
	    for (var i = 0; i < numVal; i++) {
		totals[i] = 0;
		for (var j = 0; j < this._series.length; j++) {
		    totals[i] += this._series[j]._values[i];
		}
	    }
	    return totals;
	},
	
	/* Draw the chart legend. */
	_drawLegend: function() {
	    if (!this.legend._show) {
		return;
	    }
	    var g = this._wrapper.group(this._chartCont, {class_: 'legend'});
	    var dims = this._getDims(this.legend._area);
	    this._wrapper.rect(g, dims[this.X], dims[this.Y], dims[this.W], dims[this.H],
			       this.legend._bgSettings);
	    var horiz = false;// dims[this.W] > dims[this.H];
	    var numSer = this._series.length;
	    var offset = (horiz ? dims[this.W] : dims[this.H]) / numSer;
	    var xBase = dims[this.X] + 5;
	    var yBase = dims[this.Y] + ((horiz ? dims[this.H] : offset) + this.legend._sampleSize) / 2;
	    for (var i = 0; i < numSer; i++) {
		var series = this._series[i];
		this._wrapper.rect(g, xBase + (horiz ? i * offset : 0),
				   yBase + (horiz ? 0 : i * offset) - this.legend._sampleSize,
				   this.legend._sampleSize, this.legend._sampleSize,
				   {fill: series._fill, stroke: series._stroke, strokeWidth: 1});
		this._wrapper.text(g, xBase + (horiz ? i * offset : 0) + this.legend._sampleSize + 5,
				   yBase + (horiz ? 0 : i * offset), series._name, this.legend._textSettings);
	    }
	},
	
	/* Show the current value status on hover. */
	_showStatus: function(elem, label, value) {
	    var status = this._onstatus;
	    if (this._onstatus) {
		jQuery(elem).hover(function(event) { status.apply(this, [label, value, 'mouseover', event]); },
				   function(event) { status.apply(this, ['', 0, 'mouseout', event]); });
		jQuery(elem).click(function(event) { status.apply(this, [label, value, 'click', event]); });
	    }
	}
    });
    
    /* Details about each graph series.
       @param  graph        (SVGGraph) the owning graph
       @param  name         (string) the name of this series (optional)
       @param  values       (number[]) the list of values to be plotted
       @param  fill         (string) how the series should be displayed
       @param  stroke       (string) the colour of the (out)line for the series (optional)
       @param  strokeWidth  (number) the width of the (out)line for the series (optional)
       @param  settings     (object) additional formatting settings (optional)
       @return  (SVGGraphSeries) the new series object */
    function SVGGraphSeries(graph, name, values, fill, stroke, strokeWidth, settings) {
	if (typeof name != 'string') {
	    settings = strokeWidth;
	    strokeWidth = stroke;
	    stroke = fill;
	    fill = values;
	    values = name;
	    name = null;
	}
	if (typeof stroke != 'string') {
	    settings = strokeWidth;
	    strokeWidth = stroke;
	    stroke = null;
	}
	if (typeof strokeWidth != 'number') {
	    settings = strokeWidth;
	    strokeWidth = null;
	}
	this._graph = graph; // The owning graph
	this._name = name || ''; // The name of this series
	this._values = values || []; // The list of values for this series
	this._axis = 1; // Which axis this series applies to: 1 = primary, 2 = secondary
	this._fill = fill || 'green'; // How the series is plotted
	this._stroke = stroke || 'black'; // The colour for the (out)line
	this._strokeWidth = strokeWidth || 1; // The (out)line width
	this._settings = settings || {}; // Additional formatting settings for the series
    }
    
    jQuery.extend(SVGGraphSeries.prototype, {
	
	/* Set or retrieve the name for this series.
	   @param  name    (string) the series' name
	   @return  (SVGGraphSeries) this series object or
	   (string) the series name (if no parameters) */
	name: function(name) {
	    if (arguments.length == 0) {
		return this._name;
	    }
	    this._name = name;
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the values for this series.
	   @param  name    (string) the series' name (optional)
	   @param  values  (number[]) the values to be graphed
	   @return  (SVGGraphSeries) this series object or
	   (number[]) the series values (if no parameters) */
	values: function(name, values) {
	    if (arguments.length == 0) {
		return this._values;
	    }
	    if (isArray(name)) {
		values = name;
		name = null;
	    }
	    this._name = name || this._name;
	    this._values = values;
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the formatting for this series.
	   @param  fill         (string) how the values are filled when plotted
	   @param  stroke       (string) the (out)line colour (optional)
	   @param  strokeWidth  (number) the line's width (optional)
	   @param  settings     (object) additional formatting settings for the series (optional)
	   @return  (SVGGraphSeries) this series object or
	   (object) formatting settings (if no parameters) */
	format: function(fill, stroke, strokeWidth, settings) {
	    if (arguments.length == 0) {
		return jQuery.extend({fill: this._fill, stroke: this._stroke,
				      strokeWidth: this._strokeWidth}, this._settings);
	    }
	    if (typeof stroke != 'string') {
		settings = strokeWidth;
		strokeWidth = stroke;
		stroke = null;
	    }
	    if (typeof strokeWidth != 'number') {
		settings = strokeWidth;
		strokeWidth = null;
	    }
	    this._fill = fill || this._fill;
	    this._stroke = stroke || this._stroke;
	    this._strokeWidth = strokeWidth || this._strokeWidth;
	    jQuery.extend(this._settings, settings || {});
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Return to the parent graph. */
	end: function() {
	    return this._graph;
	}
    });
    
    /* Details about each graph axis.
       @param  graph  (SVGGraph) the owning graph
       @param  title  (string) the title of the axis
       @param  min    (number) the minimum value displayed on this axis
       @param  max    (number) the maximum value displayed on this axis
       @param  major  (number) the distance between major ticks
       @param  minor  (number) the distance between minor ticks (optional)
       @return  (SVGGraphAxis) the new axis object */
    function SVGGraphAxis(graph, title, min, max, major, minor, type) {
	this._graph = graph; // The owning graph
	this._title = title || ''; // Title of this axis
	this._titleFormat = {}; // Formatting settings for the title
	this._titleOffset = 0; // The offset for positioning the title
	this._labels = null; // List of labels for this axis - one per possible value across all series
	this._labelFormat = {}; // Formatting settings for the labels
	this._lineFormat = {stroke: 'black', strokeWidth: 1}; // Formatting settings for the axis lines
	this._ticks = {major: major || 10, minor: minor || 0, size: 10, position: 'out'}; // Tick mark options
	this._scale = {min: min || 0, max: max || 100, type: type || 'linear' }; // Axis scale settings
	this._crossAt = 0; // Where this axis crosses the other one
    }
    
    jQuery.extend(SVGGraphAxis.prototype, {
	
	/* Set or retrieve the scale for this axis.
	   @param  min  (number) the minimum value shown
	   @param  max  (number) the maximum value shown
	   @return  (SVGGraphAxis) this axis object or
	   (object) min and max values (if no parameters) */
	scale: function(min, max, type) {
	    if (arguments.length == 0) {
		return this._scale;
	    }
	    this._scale.min = (type == 'log' && min != 0) ? log10(min) : min;
	    this._scale.max = (type == 'log' && max != 0) ? log10(max) : max;
	    this._scale.type = type || 'linear';
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the ticks for this axis.
	   @param  major     (number) the distance between major ticks
	   @param  minor     (number) the distance between minor ticks
	   @param  size      (number) the length of the major ticks (minor are half) (optional)
	   @param  position  (string) the location of the ticks:
	   'in', 'out', 'both' (optional)
	   @return  (SVGGraphAxis) this axis object or
	   (object) major, minor, size, and position values (if no parameters) */
	ticks: function(major, minor, size, position, type) {
	    if (arguments.length == 0) {
		return this._ticks;
	    }
	    if (typeof size == 'string') {
		position = size;
		size = null;
	    }
	    this._ticks.major = (type == 'log' && major != 0) ? 2 : major;
	    this._ticks.minor = (type == 'log' && minor != 0) ? 1 : minor;
	    this._ticks.size = size || this._ticks.size;
	    this._ticks.position = position || this._ticks.position;
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the title for this axis.
	   @param  title   (string) the title text
	   @param  offset  (number) the distance to offset the title position (optional)
	   @param  colour  (string) how to colour the title (optional) 
	   @param  format  (object) formatting settings for the title (optional)
	   @return  (SVGGraphAxis) this axis object or
	   (object) title, offset, and format values (if no parameters) */
	title: function(title, offset, colour, format) {
	    if (arguments.length == 0) {
		return {title: this._title, offset: this._titleOffset, format: this._titleFormat};
	    }
	    if (typeof offset != 'number') {
		format = colour;
		colour = offset;
		offset = null;
	    }
	    if (typeof colour != 'string') {
		format = colour;
		colour = null;
	    }
	    this._title = title;
	    this._titleOffset = (offset != null ? offset : this._titleOffset);
	    if (colour || format) {
		this._titleFormat = jQuery.extend(format || {}, (colour ? {fill: colour} : {}));
	    }
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the labels for this axis.
	   @param  labels  (string[]) the text for each entry
	   @param  colour  (string) how to colour the labels (optional) 
	   @param  format  (object) formatting settings for the labels (optional)
	   @return  (SVGGraphAxis) this axis object or
	   (object) labels and format values (if no parameters) */
	labels: function(labels, colour, format) {
	    if (arguments.length == 0) {
		return {labels: this._labels, format: this._labelFormat};
	    }
	    if (typeof colour != 'string') {
		format = colour;
		colour = null;
	    }
	    this._labels = labels;
	    if (colour || format) {
		this._labelFormat = jQuery.extend(format || {}, (colour ? {fill: colour} : {}));
	    }
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the line formatting for this axis.
	   @param  colour    (string) the line's colour
	   @param  width     (number) the line's width (optional)
	   @param  settings  (object) additional formatting settings for the line (optional)
	   @return  (SVGGraphAxis) this axis object or
	   (object) line formatting values (if no parameters) */
	line: function(colour, width, settings) {
	    if (arguments.length == 0) {
		return this._lineFormat;
	    }
	    if (typeof width == 'object') {
		settings = width;
		width = null;
	    }
	    jQuery.extend(this._lineFormat, {stroke: colour},
			  (width ? {strokeWidth: width} : {}), settings || {});
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Return to the parent graph. */
	end: function() {
	    return this._graph;
	}
    });
    
    /* Details about the graph legend.
       @param  graph         (SVGGraph) the owning graph
       @param  bgSettings    (object) additional formatting settings for the legend background (optional)
       @param  textSettings  (object) additional formatting settings for the legend text (optional)
       @return  (SVGGraphLegend) the new legend object */
    function SVGGraphLegend(graph, bgSettings, textSettings) {
	this._graph = graph; // The owning graph
	this._show = true; // Show the legend?
	this._area = [0.9, 0.1, 1.0, 0.9]; // The legend area: left, top, right, bottom,
	// > 1 in pixels, <= 1 as proportion
	this._sampleSize = 15; // Size of sample box
	this._bgSettings = bgSettings || {stroke: 'gray'}; // Additional formatting settings for the legend background
	this._textSettings = textSettings || {}; // Additional formatting settings for the text
    }
    
    jQuery.extend(SVGGraphLegend.prototype, {
	
	/* Set or retrieve whether the legend should be shown.
	   @param  show  (boolean) true to display it, false to hide it
	   @return  (SVGGraphLegend) this legend object or
	   (boolean) show the legend? (if no parameters) */
	show: function(show) {
	    if (arguments.length == 0) {
		return this._show;
	    }
	    this._show = show;
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Set or retrieve the legend area.
	   @param  left    (number) > 1 is pixels, <= 1 is proportion of width or
	   (number[4]) for left, top, right, bottom
	   @param  top     (number) > 1 is pixels, <= 1 is proportion of height
	   @param  right   (number) > 1 is pixels, <= 1 is proportion of width
	   @param  bottom  (number) > 1 is pixels, <= 1 is proportion of height
	   @return  (SVGGraphLegend) this legend object or
	   (number[4]) the legend area: left, top, right, bottom (if no parameters) */
	area: function(left, top, right, bottom) {
	    if (arguments.length == 0) {
		return this._area;
	    }
	    this._area = (isArray(left) ? left : [left, top, right, bottom]);
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Set or retrieve additional settings for the legend area.
	   @param  sampleSize    (number) the size of the sample box to display (optional)
	   @param  bgSettings    (object) additional formatting settings for the legend background
	   @param  textSettings  (object) additional formatting settings for the legend text (optional)
	   @return  (SVGGraphLegend) this legend object or
	   (object) bgSettings and textSettings for the legend (if no parameters) */
	settings: function(sampleSize, bgSettings, textSettings) {
	    if (arguments.length == 0) {
		return {sampleSize: this._sampleSize, bgSettings: this._bgSettings,
			textSettings: this._textSettings};
	    }
	    if (typeof sampleSize != 'number') {
		textSettings = bgSettings;
		bgSettings = sampleSize;
		sampleSize = null;
	    }
	    this._sampleSize = sampleSize || this._sampleSize;
	    this._bgSettings = bgSettings;
	    this._textSettings = textSettings || this._textSettings;
	    this._graph._drawGraph();
	    return this;
	},
	
	/* Return to the parent graph. */
	end: function() {
	    return this._graph;
	}
    });
    
    var barOptions = ['barWidth (number) - the width of each bar',
		      'barGap (number) - the gap between sets of bars'];

    /* Draw a deviation chart. */
    function SVGDeviationChart() {
    }
    
    jQuery.extend(SVGDeviationChart.prototype, {
	
	/* Retrieve the display title for this chart type.
	   @return  the title */
	title: function() {
	    return 'deviation chart';
	},
	
	/* Retrieve a description of this chart type.
	   @return  its description */
	description: function() {
	    return 'Compare sets of values as vertical bars with deviations in grouped categories.';
	},
	
	/* Retrieve a list of the options that may be set for this chart type.
	   @return  options list */
	options: function() {
	    return barOptions;
	},
	
	/* Actually draw the graph in this type's style.
	   @param  graph  (object) the SVGGraph object */
	drawGraph: function(graph) {
	    graph._drawChartBackground(true);
	    var barWidth = graph._chartOptions.barWidth || 10;
	    var barGap = graph._chartOptions.barGap || 10;
	    var numSer = graph._series.length;
	    var numVal = (numSer ? (graph._series[0])._values.length : 0);
	    var dims = graph._getDims();
	    var xScale = dims[graph.W] / ((numSer * barWidth + barGap) * numVal + barGap);
	    var yScale = dims[graph.H] / (graph.yAxis._scale.max - graph.yAxis._scale.min);
	    this._chart = graph._wrapper.group(graph._chartCont, {class_: 'chart'});
	    for (var i = 0; i < numSer; i++) {
		this._drawSeries(graph, i, numSer, barWidth, barGap, dims, xScale, yScale);
	    }
	    graph._drawTitle();
	    graph._drawAxes(true);
	    this._drawXAxis(graph, numSer, numVal, barWidth, barGap, dims, xScale);
	    graph._drawLegend();
	},
	
	/* Plot an individual series. */
	_drawSeries: function(graph, cur, numSer, barWidth, barGap, dims, xScale, yScale, type) {
	    var series = graph._series[cur];
	    var g; 
	    if (typeof(series._fill) == 'object') {
		g = graph._wrapper.group(this._chart,
					 jQuery.extend({class_: 'series' + cur, stroke: series._stroke,
							strokeWidth: series._strokeWidth}, series._settings || {}));
	    } else {
		g = graph._wrapper.group(this._chart,
					 jQuery.extend({class_: 'series' + cur, fill: series._fill, stroke: series._stroke,
							strokeWidth: series._strokeWidth}, series._settings || {}));
	    }
	    for (var i = 0; i < series._values.length; i++) {
		var xoffset = dims[graph.X] + xScale * (barGap + i * (numSer * barWidth + barGap) + (cur * barWidth));
		var data = series._values[i];

		var yshift = dims[graph.Y];

		// median - upper
		graph._wrapper.rect(g, xoffset + 1, Math.ceil((graph.yAxis._scale.max - data.upper) * yScale + yshift), parseInt(barWidth - 2), parseInt((data.upper - data.median) * yScale), 0, 0, { stroke: 'black', strokeWidth: 1, fill: series._fill[i] });
		
		// median - lower
		graph._wrapper.rect(g, xoffset + 1, parseInt((graph.yAxis._scale.max - data.median) * yScale + yshift), parseInt(barWidth - 2), parseInt((data.median - data.lower) * yScale), 0, 0, { stroke: 'black', strokeWidth: 1, fill: series._fill[i] });
		
		// max - upper
		graph._wrapper.line(g, xoffset + 1 + parseInt(barWidth / 6), parseInt((graph.yAxis._scale.max - data.max) * yScale + 1 + yshift), parseInt(xoffset + 1 + barWidth - 2 - parseInt(barWidth / 6)), parseInt((graph.yAxis._scale.max - data.max) * yScale + 1 + yshift), { stroke: 'black', strokeWidth: 1 });
		graph._wrapper.line(g, xoffset + parseInt(barWidth / 2), parseInt((graph.yAxis._scale.max - data.max) * yScale + 1 + yshift), parseInt(xoffset + parseInt(barWidth / 2)), parseInt((graph.yAxis._scale.max - data.upper) * yScale + 1 + yshift), { stroke: 'black', strokeWidth: 1, strokeDashArray: "2,2" });
		
		// lower - min
		graph._wrapper.line(g, xoffset + 1 + parseInt(barWidth / 6), parseInt((graph.yAxis._scale.max - data.min) * yScale - 1 + yshift), parseInt(xoffset + 1 + barWidth - 2 - parseInt(barWidth / 6)), parseInt((graph.yAxis._scale.max - data.min) * yScale - 1 + yshift), { stroke: 'black', strokeWidth: 1 });
		graph._wrapper.line(g, xoffset + parseInt(barWidth / 2), parseInt((graph.yAxis._scale.max - data.lower) * yScale - 1 + yshift), parseInt(xoffset + parseInt(barWidth / 2)), parseInt((graph.yAxis._scale.max - data.min) * yScale - 1 + yshift), { stroke: 'black', strokeWidth: 1, strokeDashArray: "2,2" });
		
	    }
	},
	
	/* Draw the x-axis and its ticks. */
	_drawXAxis: function(graph, numSer, numVal, barWidth, barGap, dims, xScale) {
	    var axis = graph.xAxis;
	    if (axis._title) {
		graph._wrapper.text(graph._chartCont, dims[graph.X] + dims[graph.W] / 2,
				    parseInt(graph._chartCont.attributes[3].value),//dims[graph.Y] + dims[graph.H] + axis._titleOffset,
				    axis._title, jQuery.extend({textAnchor: 'middle'}, axis._titleFormat || {}));
	    }
	    var gl = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxis'}, axis._lineFormat));
	    var labelTextAnchor = axis.labelRotation ? "end" : "middle";
	    var gt = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxisLabels',
									   textAnchor: labelTextAnchor}, axis._labelFormat));
	    graph._wrapper.line(gl, dims[graph.X], dims[graph.Y] + dims[graph.H],
				dims[graph.X] + dims[graph.W], dims[graph.Y] + dims[graph.H]);
	    if (axis._ticks.major) {
		var offsets = graph._getTickOffsets(axis, true);
		for (var i = 1; i < numVal; i++) {
		    var x = dims[graph.X] + xScale * (barGap / 2 + i * (numSer * barWidth + barGap));
		    graph._wrapper.line(gl, x, dims[graph.Y] + dims[graph.H] + offsets[0] * axis._ticks.size,
					x, dims[graph.Y] + dims[graph.H] + offsets[1] * axis._ticks.size);
		}
		for (var i = 0; i < numSer; i++) {
		    var x = dims[graph.X] + (xScale * barGap) + (barWidth / 2) + (i * (barGap * xScale));
		    graph._wrapper.text(gt, x, dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size,
					(axis._labels ? axis._labels[i] : graph._series[i]._name), (axis.labelRotation ? { textAnchor: "end", transform: "rotate("+axis.labelRotation+", "+x+", "+(dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size)+")"} : { textAnchor: "end", transform: "rotate(-50, "+x+", "+(dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size)+")"}));
		}
	    }
	}
    });
    
    /* Draw a standard grouped column bar chart. */
    function SVGColumnChart() {
    }
    
    jQuery.extend(SVGColumnChart.prototype, {
	
	/* Retrieve the display title for this chart type.
	   @return  the title */
	title: function() {
	    return 'Basic column chart';
	},
	
	/* Retrieve a description of this chart type.
	   @return  its description */
	description: function() {
	    return 'Compare sets of values as vertical bars with grouped categories.';
	},
	
	/* Retrieve a list of the options that may be set for this chart type.
	   @return  options list */
	options: function() {
	    return barOptions;
	},
	
	/* Actually draw the graph in this type's style.
	   @param  graph  (object) the SVGGraph object */
	drawGraph: function(graph) {
	    graph._drawChartBackground(true);
	    var barWidth = graph._chartOptions.barWidth || 10;
	    var barGap = graph._chartOptions.barGap || 10;
	    var numSer = graph._series.length;
	    var barCount = 0;
	    for (var i=0; i<numSer; i++) {
		if (! graph._series[i]._settings.hasOwnProperty('seriesType') || graph._series[i]._settings.seriesType!='line') {
		    barCount++;
		}
	    }
	    var numVal = (numSer ? (graph._series[0])._values.length : 0);
	    var dims = graph._getDims();
	    var xScale = dims[graph.W] / ((barCount * barWidth + barGap) * numVal + barGap);
	    var yScale = dims[graph.H] / (graph.yAxis._scale.max - graph.yAxis._scale.min);
	    var y2Scale = graph.y2Axis ? dims[graph.H] / (graph.y2Axis._scale.max - graph.y2Axis._scale.min) : 0;
	    this._chart = graph._wrapper.group(graph._chartCont, {class_: 'chart'});
	    var barNum = 0;
	    for (var i = 0; i < numSer; i++) {
		if (graph._series[i]._settings.isY2) {
		    this._drawSeries(graph, barNum, barCount, barWidth, barGap, dims, xScale, y2Scale);
		} else {
		    this._drawSeries(graph, barNum, barCount, barWidth, barGap, dims, xScale, yScale);
		}
		if (! graph._series[i]._settings.hasOwnProperty('seriesType') || graph._series[i]._settings.seriesType!='line') {
		    barNum++;
		}
	    }
	    graph._drawTitle();
	    graph._drawAxes(true);
	    this._drawXAxis(graph, barNum, numVal, barWidth, barGap, dims, xScale);
	    graph._drawLegend();
	},
	
	/* Plot an individual series. */
	_drawSeries: function(graph, cur, numSer, barWidth, barGap, dims, xScale, yScale, type) {
	    var series = graph._series[cur];
	    if (series._settings.hasOwnProperty('seriesType') && series._settings.seriesType=='line') {
		var path = graph._wrapper.createPath();
		var circles = [];
		for (var i = 0; i < series._values.length; i++) {
		    var x = dims[graph.X] + xScale * (barGap / 2 + (i + 0.5) * (numSer * barWidth + barGap));
		    var y = dims[graph.Y] + ((series._settings.isY2 ? graph.y2Axis._scale.max : graph.yAxis._scale.max) - series._values[i]) * yScale;
		    if (i === 0) {
			path.move(x, y);
		    }
		    else {
			path.line(x, y);
		    }
		    circles.push( [ x, y ]);
		}
		if (! series._settings.noLines) {
		    graph._wrapper.path(this._chart, path,
					jQuery.extend({id: 'series' + cur, fill: 'none', stroke: (series._stroke=="white") ? "black" : series._stroke,
						       strokeWidth: series._strokeWidth}, series._settings || {}));
		}
		for (i=0;i<circles.length;i++) {
		    var c = graph._wrapper.circle(this._chart, circles[i][0], circles[i][1], 3, { fill: 'white', strokeWidth: 1, stroke: (series._stroke=="white") ? "black" : series._stroke, onmouseover: "this.setAttribute('r', parseInt(this.getAttribute('r')) + 1)", onmouseout: "this.setAttribute('r', parseInt(this.getAttribute('r')) - 1)" });
		    graph._showStatus(c, series._name, series._values[i]);
		}
	    } else {
		var g; 
		if (typeof(series._fill) == 'object') {
		    g = graph._wrapper.group(this._chart,
					     jQuery.extend({class_: 'series' + cur, stroke: series._stroke,
							    strokeWidth: series._strokeWidth}, series._settings || {}));
		} else {
		    g = graph._wrapper.group(this._chart,
					     jQuery.extend({class_: 'series' + cur, fill: series._fill, stroke: series._stroke,
							    strokeWidth: series._strokeWidth}, series._settings || {}));
		}
		for (var i = 0; i < series._values.length; i++) {
		    var r = graph._wrapper.rect(g,
						dims[graph.X] + xScale * (barGap + i * (numSer * barWidth + barGap) + (cur * barWidth)),
						dims[graph.Y] + yScale * (graph.yAxis._scale.max - ((graph.yAxis._scale.type == 'log') ? log10(series._values[i]) : series._values[i])),
						xScale * barWidth, yScale * ((graph.yAxis._scale.type == 'log') ? log10(series._values[i]) : series._values[i]), (typeof(series._fill) == 'object') ? { fill: series._fill[i] } : {});
		    graph._showStatus(r, series._name, series._values[i]);
		}
	    }
	},
	
	/* Draw the x-axis and its ticks. */
	_drawXAxis: function(graph, numSer, numVal, barWidth, barGap, dims, xScale) {
	    var axis = graph.xAxis;
	    if (axis._title) {
		graph._wrapper.text(graph._chartCont, dims[graph.X] + dims[graph.W] / 2,
				    parseInt(graph._chartCont.attributes[3].value),//dims[graph.Y] + dims[graph.H] + axis._titleOffset,
				    axis._title, jQuery.extend({textAnchor: 'middle'}, axis._titleFormat || {}));
	    }
	    var gl = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxis'}, axis._lineFormat));
	    var labelTextAnchor = axis.labelRotation ? "end" : "middle";
	    var gt = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxisLabels',
									   textAnchor: labelTextAnchor}, axis._labelFormat));
	    graph._wrapper.line(gl, dims[graph.X], dims[graph.Y] + dims[graph.H],
				dims[graph.X] + dims[graph.W], dims[graph.Y] + dims[graph.H]);
	    if (axis._ticks.major) {
		var offsets = graph._getTickOffsets(axis, true);
		for (var i = 1; i < numVal; i++) {
		    var x = dims[graph.X] + xScale * (barGap / 2 + i * (numSer * barWidth + barGap));
		    graph._wrapper.line(gl, x, dims[graph.Y] + dims[graph.H] + offsets[0] * axis._ticks.size,
					x, dims[graph.Y] + dims[graph.H] + offsets[1] * axis._ticks.size);
		}
		for (var i = 0; i < numVal; i++) {
		    var x = dims[graph.X] + xScale * (barGap / 2 + (i + 0.5) * (numSer * barWidth + barGap));
		    graph._wrapper.text(gt, x, dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size,
					(axis._labels ? axis._labels[i] : '' + i), (axis.labelRotation ? { transform: "rotate("+axis.labelRotation+", "+x+", "+(dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size)+")"} : null));
		}
	    }
	}
    });
    
    /* Draw a stacked column bar chart. */
    function SVGStackedColumnChart() {
    }
    
    jQuery.extend(SVGStackedColumnChart.prototype, {
	
	/* Retrieve the display title for this chart type.
	   @return  the title */
	title: function() {
	    return 'Stacked column chart';
	},
	
	/* Retrieve a description of this chart type.
	   @return  its description */
	description: function() {
	    return 'Compare sets of values as vertical bars showing ' +
		'relative contributions to the whole for each category.';
	},
	
	/* Retrieve a list of the options that may be set for this chart type.
	   @return  options list */
	options: function() {
	    return barOptions;
	},
	
	/* Actually draw the graph in this type's style.
	   @param  graph  (object) the SVGGraph object */
	drawGraph: function(graph) {
	    var bg = graph._drawChartBackground(true, true);
	    var dims = graph._getDims();
	    if (graph._gridlines[0] && graph.xAxis._ticks.major) {
		graph._drawGridlines(bg, graph._getPercentageAxis(), true, dims, graph._gridlines[0]);
	    }
	    var barWidth = graph._chartOptions.barWidth || 10;
	    var barGap = graph._chartOptions.barGap || 10;
	    var numSer = graph._series.length;
	    var numVal = (numSer ? (graph._series[0])._values.length : 0);
	    var xScale = dims[graph.W] / ((barWidth + barGap) * numVal + barGap);
	    var yScale = dims[graph.H];
	    this._chart = graph._wrapper.group(graph._chartCont, {class_: 'chart'});
	    this._drawColumns(graph, numSer, numVal, barWidth, barGap, dims, xScale, yScale);
	    graph._drawTitle();
	    graph._wrapper.text(graph._chartCont, 0, 0, jQuery.svg.graphing.region.percentageText,
				jQuery.extend({textAnchor: 'middle', transform: 'translate(' +
					       (dims[graph.X] - graph.yAxis._titleOffset) + ',' +
					       (dims[graph.Y] + dims[graph.H] / 2) + ') rotate(-90)'}, graph.yAxis._titleFormat || {}));
	    var pAxis = jQuery.extend({}, graph._getPercentageAxis());
	    jQuery.extend(pAxis._labelFormat, graph.yAxis._labelFormat || {});
	    graph._drawAxis(pAxis, 'yAxis', dims[graph.X], dims[graph.Y],
			    dims[graph.X], dims[graph.Y] + dims[graph.H]);
	    this._drawXAxis(graph, numVal, barWidth, barGap, dims, xScale);
	    graph._drawLegend();
	},
	
	/* Plot all of the columns. */
	_drawColumns: function(graph, numSer, numVal, barWidth, barGap, dims, xScale, yScale) {
	    var totals = graph._getTotals();
	    var accum = [];
	    for (var i = 0; i < numVal; i++) {
		accum[i] = 0;
	    }
	    for (var s = 0; s < numSer; s++) {
		var series = graph._series[s];
		var g = graph._wrapper.group(this._chart,
					     jQuery.extend({class_: 'series' + s, fill: series._fill,
							    stroke: series._stroke, strokeWidth: series._strokeWidth},
							   series._settings || {}));
		for (var i = 0; i < series._values.length; i++) {
		    accum[i] += series._values[i];
		    var r = graph._wrapper.rect(g,
						dims[graph.X] + xScale * (barGap + i * (barWidth + barGap)),
						dims[graph.Y] + yScale * (totals[i] - accum[i]) / totals[i],
						xScale * barWidth, yScale * series._values[i] / totals[i]);
		    graph._showStatus(r, series._name,
				      roundNumber(series._values[i] / totals[i] * 100, 2));
		}
	    }
	},
	
	/* Draw the x-axis and its ticks. */
	_drawXAxis: function(graph, numVal, barWidth, barGap, dims, xScale) {
	    var axis = graph.xAxis;
	    if (axis._title) {
		graph._wrapper.text(graph._chartCont, dims[graph.X] + dims[graph.W] / 2,
				    dims[graph.Y] + dims[graph.H] + axis._titleOffset,
				    axis._title, jQuery.extend({textAnchor: 'middle'}, axis._titleFormat || {}));
	    }
	    var gl = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxis'}, axis._lineFormat));
	    var gt = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxisLabels',
									   textAnchor: 'middle'}, axis._labelFormat));
	    graph._wrapper.line(gl, dims[graph.X], dims[graph.Y] + dims[graph.H],
				dims[graph.X] + dims[graph.W], dims[graph.Y] + dims[graph.H]);
	    if (axis._ticks.major) {
		var offsets = graph._getTickOffsets(axis, true);
		for (var i = 1; i < numVal; i++) {
		    var x = dims[graph.X] + xScale * (barGap / 2 + i * (barWidth + barGap));
		    graph._wrapper.line(gl, x, dims[graph.Y] + dims[graph.H] + offsets[0] * axis._ticks.size,
					x, dims[graph.Y] + dims[graph.H] + offsets[1] * axis._ticks.size);
		}
		for (var i = 0; i < numVal; i++) {
		    var x = dims[graph.X] + xScale * (barGap / 2 + (i + 0.5) * (barWidth + barGap));
		    graph._wrapper.text(gt, x, dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size,
					(axis._labels ? axis._labels[i] : '' + i));
		}
	    }
	}
    });
    
    /* Draw a stacked column bar chart. */
    function SVGStackedAreaChart() {
    }
    
    jQuery.extend(SVGStackedAreaChart.prototype, {
	
	/* Retrieve the display title for this chart type.
	   @return  the title */
	title: function() {
	    return 'Stacked area chart';
	},
	
	/* Retrieve a description of this chart type.
	   @return  its description */
	description: function() {
	    return 'Compare sets of values as areas showing ' +
		'relative contributions to the whole for each category.';
	},
	
	/* Retrieve a list of the options that may be set for this chart type.
	   @return  options list */
	options: function() {
	    return barOptions;
	},
	
	/* Actually draw the graph in this type's style.
	   @param  graph  (object) the SVGGraph object */
	drawGraph: function(graph) {
	    var bg = graph._drawChartBackground(true, true);
	    var dims = graph._getDims();
	    if (graph._gridlines[0] && graph.xAxis._ticks.major) {
		graph._drawGridlines(bg, graph._getPercentageAxis(), true, dims, graph._gridlines[0]);
	    }
	    var numSer = graph._series.length;
	    var numVal = (numSer ? (graph._series[0])._values.length : 0);
	    var xScale = dims[graph.W] / numVal;
	    var yScale = dims[graph.H];
	    this._chart = graph._wrapper.group(graph._chartCont, {class_: 'chart'});
	    this._drawAreas(graph, numSer, numVal, dims, xScale, yScale);
	    graph._drawTitle();
	    graph._wrapper.text(graph._chartCont, 0, 0, jQuery.svg.graphing.region.percentageText,
				jQuery.extend({textAnchor: 'middle', transform: 'translate(' +
					       (dims[graph.X] - graph.yAxis._titleOffset) + ',' +
					       (dims[graph.Y] + dims[graph.H] / 2) + ') rotate(-90)'}, graph.yAxis._titleFormat || {}));
	    var pAxis = jQuery.extend({}, graph._getPercentageAxis());
	    jQuery.extend(pAxis._labelFormat, graph.yAxis._labelFormat || {});
	    graph._drawAxis(pAxis, 'yAxis', dims[graph.X], dims[graph.Y],
			    dims[graph.X], dims[graph.Y] + dims[graph.H]);
	    this._drawXAxis(graph, numVal, dims, xScale);
	    graph._drawLegend();
	},
	
	/* Plot all of the areas. */
	_drawAreas: function(graph, numSer, numVal, dims, xScale, yScale) {
	    var totals = graph._getTotals();
	    var accum = [];
	    var max = 0;
	    for (var i=0;i<totals.length;i++) {
		if (totals[i] > max) {
		    max = totals[i];
		}
	    }
	    for (var i = 0; i < numVal; i++) {
		accum[i] = 0;
	    }

	    var paths = [];
	    for (var s = 0; s < numSer; s++) {
		paths[s] = "";
		var series = graph._series[s];
		for (var i = 0; i < series._values.length; i++) {
		    accum[i] += series._values[i];
		    paths[s] += (i===0) ? "M" : "L";
		    var yVal = (dims[graph.Y] + yScale * (totals[i] - accum[i]) / totals[i]);
		    if (! graph.normalizeStackedArea) {
			yVal = dims[graph.Y] + yScale - (yScale / max * (accum[i] - series._values[i]));
		    }
		    paths[s] += (dims[graph.X] + xScale * i) + "," + yVal;
		    if (i == series._values.length - 1) {
			paths[s] += "L" + (dims[graph.X] + xScale * (i+1)) + "," + yVal;
		    }
		}

		if (s===0 && graph.normalizeStackedArea) {
		    paths[s] += "L"+(dims[graph.X] + xScale * series._values.length)+","+(dims[graph.Y] + dims[graph.H])+"L"+dims[graph.X]+","+(dims[graph.Y] + dims[graph.H]);
		} else {
		    for (var i = series._values.length - 1; i > -1 ; i--) {
			var yVal = (dims[graph.Y] + yScale * (totals[i] - accum[i] + series._values[i]) / totals[i]);
			if (! graph.normalizeStackedArea) {
			    yVal = dims[graph.Y] + yScale - (yScale / max * accum[i]);
			}
			if (i == series._values.length - 1) {
			    paths[s] += "L" + (dims[graph.X] + xScale * (i+1)) + "," + yVal;
			}
			paths[s] += "L"+(dims[graph.X] + xScale * i) + "," + yVal;
		    }
		}
	    }
	    for (i=0;i<paths.length;i++) {
		var series = graph._series[i];
		graph._wrapper.path(this._chart, paths[i], { fill: series._fill, stroke: series._stroke, strokeWidth: series._strokeWidth});
	    }
	},
	
	/* Draw the x-axis and its ticks. */
	_drawXAxis: function(graph, numVal, dims, xScale) {
	    var axis = graph.xAxis;
	    if (axis._title) {
		graph._wrapper.text(graph._chartCont, dims[graph.X] + dims[graph.W] / 2,
				    dims[graph.Y] + dims[graph.H] + axis._titleOffset,
				    axis._title, jQuery.extend({textAnchor: 'middle'}, axis._titleFormat || {}));
	    }
	    var gl = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxis'}, axis._lineFormat));
	    var gt = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxisLabels',
									   textAnchor: 'middle'}, axis._labelFormat));
	    graph._wrapper.line(gl, dims[graph.X], dims[graph.Y] + dims[graph.H],
				dims[graph.X] + dims[graph.W], dims[graph.Y] + dims[graph.H]);
	    
	    if (axis._ticks.major) {
		var offsets = graph._getTickOffsets(axis, true);
		for (var i = 1; i < numVal; i++) {
		    if (i % axis._ticks.major > 0) {
			continue;
		    }
		    var x = dims[graph.X] + xScale * i;
		    graph._wrapper.line(gl, x, dims[graph.Y] + dims[graph.H] + offsets[0] * axis._ticks.size,
					x, dims[graph.Y] + dims[graph.H] + offsets[1] * axis._ticks.size);
		}
		for (var i = 0; i < numVal; i++) {
		    if (i % axis._ticks.major > 0) {
			continue;
		    }
		    var x = dims[graph.X] + xScale * (i + 0.5);
		    graph._wrapper.text(gt, x, dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size,
					(axis._labels ? axis._labels[i] : '' + i));
		}
	    }
	}
    });
    
    /* Draw a standard grouped row bar chart. */
    function SVGRowChart() {
    }
    
    jQuery.extend(SVGRowChart.prototype, {
	
	/* Retrieve the display title for this chart type.
	   @return  the title */
	title: function() {
	    return 'Basic row chart';
	},
	
	/* Retrieve a description of this chart type.
	   @return  its description */
	description: function() {
	    return 'Compare sets of values as horizontal rows with grouped categories.';
	},
	
	/* Retrieve a list of the options that may be set for this chart type.
	   @return  options list */
	options: function() {
	    return barOptions;
	},
	
	/* Actually draw the graph in this type's style.
	   @param  graph  (object) the SVGGraph object */
	drawGraph: function(graph) {
	    var bg = graph._drawChartBackground(true, true);
	    var dims = graph._getDims();
	    graph._drawGridlines(bg, graph.yAxis, false, dims, graph._gridlines[0]);
	    var barWidth = graph._chartOptions.barWidth || 10;
	    var barGap = graph._chartOptions.barGap || 10;
	    var numSer = graph._series.length;
	    var numVal = (numSer ? (graph._series[0])._values.length : 0);
	    var xScale = dims[graph.W] / (graph.yAxis._scale.max - graph.yAxis._scale.min);
	    var yScale = dims[graph.H] / ((numSer * barWidth + barGap) * numVal + barGap);
	    this._chart = graph._wrapper.group(graph._chartCont, {class_: 'chart'});
	    for (var i = 0; i < numSer; i++) {
		this._drawSeries(graph, i, numSer, barWidth, barGap, dims, xScale, yScale);
	    }
	    graph._drawTitle();
	    this._drawAxes(graph, numSer, numVal, barWidth, barGap, dims, yScale);
	    graph._drawLegend();
	},
	
	/* Plot an individual series. */
	_drawSeries: function(graph, cur, numSer, barWidth, barGap, dims, xScale, yScale) {
	    var series = graph._series[cur];
	    var g = graph._wrapper.group(this._chart,
					 jQuery.extend({class_: 'series' + cur, fill: series._fill,
							stroke: series._stroke, strokeWidth: series._strokeWidth},
						       series._settings || {}));
	    for (var i = 0; i < series._values.length; i++) {
		var r = graph._wrapper.rect(g,
					    dims[graph.X] + xScale * (0 - graph.yAxis._scale.min),
					    dims[graph.Y] + yScale * (barGap + i * (numSer * barWidth + barGap) + (cur * barWidth)),
					    xScale * series._values[i], yScale * barWidth);
		graph._showStatus(r, series._name, series._values[i]);
	    }
	},
	
	/* Draw the axes for this graph. */
	_drawAxes: function(graph, numSer, numVal, barWidth, barGap, dims, yScale) {
	    // X-axis
	    var axis = graph.yAxis;
	    if (axis) {
		if (axis._title) {
		    graph._wrapper.text(graph._chartCont, dims[graph.X] + dims[graph.W] / 2,
					dims[graph.Y] + dims[graph.H] + axis._titleOffset, axis._title, axis._titleFormat);
		}
		graph._drawAxis(axis, 'xAxis', dims[graph.X], dims[graph.Y] + dims[graph.H],
				dims[graph.X] + dims[graph.W], dims[graph.Y] + dims[graph.H]);
	    }
	    // Y-axis
	    var axis = graph.xAxis;
	    if (axis._title) {
		graph._wrapper.text(graph._chartCont, 0, 0, axis._title, jQuery.extend({textAnchor: 'middle',
											transform: 'translate(' + (dims[graph.X] - axis._titleOffset) + ',' +
											(dims[graph.Y] + dims[graph.H] / 2) + ') rotate(-90)'}, axis._titleFormat || {}));
	    }
	    var gl = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'yAxis'}, axis._lineFormat));
	    var gt = graph._wrapper.group(graph._chartCont, jQuery.extend(
		{class_: 'yAxisLabels', textAnchor: 'end'}, axis._labelFormat));
	    graph._wrapper.line(gl, dims[graph.X], dims[graph.Y], dims[graph.X], dims[graph.Y] + dims[graph.H]);
	    if (axis._ticks.major) {
		var offsets = graph._getTickOffsets(axis, false);
		for (var i = 1; i < numVal; i++) {
		    var y = dims[graph.Y] + yScale * (barGap / 2 + i * (numSer * barWidth + barGap));
		    graph._wrapper.line(gl, dims[graph.X] + offsets[0] * axis._ticks.size, y,
					dims[graph.X] + offsets[1] * axis._ticks.size, y);
		}
		for (var i = 0; i < numVal; i++) {
		    var y = dims[graph.Y] + yScale * (barGap / 2 + (i + 0.5) * (numSer * barWidth + barGap));
		    graph._wrapper.text(gt, dims[graph.X] - axis._ticks.size, y,
					(axis._labels ? axis._labels[i] : '' + i));
		}
	    }
	}
    });
    
    /* Draw a stacked row bar chart. */
    function SVGStackedRowChart() {
    }
    
    jQuery.extend(SVGStackedRowChart.prototype, {
	
	/* Retrieve the display title for this chart type.
	   @return  the title */
	title: function() {
	    return 'Stacked row chart';
	},
	
	/* Retrieve a description of this chart type.
	   @return  its description */
	description: function() {
	    return 'Compare sets of values as horizontal bars showing ' +
		'relative contributions to the whole for each category.';
	},
	
	/* Retrieve a list of the options that may be set for this chart type.
	   @return  options list */
	options: function() {
	    return barOptions;
	},
	
	/* Actually draw the graph in this type's style.
	   @param  graph  (object) the SVGGraph object */
	drawGraph: function(graph) {
	    var bg = graph._drawChartBackground(true, true);
	    var dims = graph._getDims();
	    if (graph._gridlines[0] && graph.xAxis._ticks.major) {
		graph._drawGridlines(bg, graph._getPercentageAxis(), false, dims, graph._gridlines[0]);
	    }
	    var barWidth = graph._chartOptions.barWidth || 10;
	    var barGap = graph._chartOptions.barGap || 10;
	    var numSer = graph._series.length;
	    var numVal = (numSer ? (graph._series[0])._values.length : 0);
	    var xScale = dims[graph.W];
	    var yScale = dims[graph.H] / ((barWidth + barGap) * numVal + barGap);
	    this._chart = graph._wrapper.group(graph._chartCont, {class_: 'chart'});
	    this._drawRows(graph, numSer, numVal, barWidth, barGap, dims, xScale, yScale);
	    graph._drawTitle();
	    graph._wrapper.text(graph._chartCont, dims[graph.X] + dims[graph.W] / 2,
				dims[graph.Y] + dims[graph.H] + graph.xAxis._titleOffset,
				jQuery.svg.graphing.region.percentageText,
				jQuery.extend({textAnchor: 'middle'}, graph.yAxis._titleFormat || {}));
	    var pAxis = jQuery.extend({}, graph._getPercentageAxis());
	    jQuery.extend(pAxis._labelFormat, graph.yAxis._labelFormat || {});
	    graph._drawAxis(pAxis, 'xAxis', dims[graph.X], dims[graph.Y] + dims[graph.H],
			    dims[graph.X] + dims[graph.W], dims[graph.Y] + dims[graph.H]);
	    this._drawYAxis(graph, numVal, barWidth, barGap, dims, yScale);
	    graph._drawLegend();
	},
	
	/* Plot all of the rows. */
	_drawRows: function(graph, numSer, numVal, barWidth, barGap, dims, xScale, yScale) {
	    var totals = graph._getTotals();
	    var accum = [];
	    for (var i = 0; i < numVal; i++) {
		accum[i] = 0;
	    }
	    for (var s = 0; s < numSer; s++) {
		var series = graph._series[s];
		var g = graph._wrapper.group(this._chart,
					     jQuery.extend({class_: 'series' + s, fill: series._fill,
							    stroke: series._stroke, strokeWidth: series._strokeWidth},
							   series._settings || {}));
		for (var i = 0; i < series._values.length; i++) {
		    var r = graph._wrapper.rect(g,
						dims[graph.X] + xScale * accum[i] / totals[i],
						dims[graph.Y] + yScale * (barGap + i * (barWidth + barGap)),
						xScale * series._values[i] / totals[i], yScale * barWidth);
		    graph._showStatus(r, series._name,
				      roundNumber(series._values[i] / totals[i] * 100, 2));
		    accum[i] += series._values[i];
		}
	    }
	},
	
	/* Draw the y-axis and its ticks. */
	_drawYAxis: function(graph, numVal, barWidth, barGap, dims, yScale) {
	    var axis = graph.xAxis;
	    if (axis._title) {
		graph._wrapper.text(graph._chartCont, 0, 0, axis._title, jQuery.extend({textAnchor: 'middle',
											transform: 'translate(' + (dims[graph.X] - axis._titleOffset) + ',' +
											(dims[graph.Y] + dims[graph.H] / 2) + ') rotate(-90)'}, axis._titleFormat || {}));
	    }
	    var gl = graph._wrapper.group(graph._chartCont,
					  jQuery.extend({class_: 'yAxis'}, axis._lineFormat));
	    var gt = graph._wrapper.group(graph._chartCont,
					  jQuery.extend({class_: 'yAxisLabels', textAnchor: 'end'}, axis._labelFormat));
	    graph._wrapper.line(gl, dims[graph.X], dims[graph.Y],
				dims[graph.X], dims[graph.Y] + dims[graph.H]);
	    if (axis._ticks.major) {
		var offsets = graph._getTickOffsets(axis, false);
		for (var i = 1; i < numVal; i++) {
		    var y = dims[graph.Y] + yScale * (barGap / 2 + i * (barWidth + barGap));
		    graph._wrapper.line(gl, dims[graph.X] + offsets[0] * axis._ticks.size, y,
					dims[graph.X] + offsets[1] * axis._ticks.size, y);
		}
		for (var i = 0; i < numVal; i++) {
		    var y = dims[graph.Y] + yScale * (barGap / 2 + (i + 0.5) * (barWidth + barGap));
		    graph._wrapper.text(gt, dims[graph.X] - axis._ticks.size, y,
					(axis._labels ? axis._labels[i] : '' + i));
		}
	    }
	}
    });
    
    /* Draw a standard line chart. */
    function SVGLineChart() {
    }
    
    jQuery.extend(SVGLineChart.prototype, {
	
	/* Retrieve the display title for this chart type.
	   @return  the title */
	title: function() {
	    return 'Basic line chart';
	},
	
	/* Retrieve a description of this chart type.
	   @return  its description */
	description: function() {
	    return 'Compare sets of values as continuous lines.';
	},
	
	/* Retrieve a list of the options that may be set for this chart type.
	   @return  options list */
	options: function() {
	    return [];
	},
	
	/* Actually draw the graph in this type's style.
	   @param  graph  (object) the SVGGraph object */
	drawGraph: function(graph) {
	    graph._drawChartBackground();
	    var dims = graph._getDims();

	    graph.xAxis._scale.max = graph._series[0]._values.length - 1;

	    var xScale = dims[graph.W] / (graph.xAxis._scale.max - graph.xAxis._scale.min);
	    var yScale = dims[graph.H] / (graph.yAxis._scale.max - graph.yAxis._scale.min);
	    this._chart = graph._wrapper.group(graph._chartCont, {class_: 'chart'});
	    for (var i = 0; i < graph._series.length; i++) {
		this._drawSeries(graph, i, dims, xScale, yScale);
	    }
	    graph._drawTitle();
	    graph._drawAxes(true);
	    this._drawXAxis(graph, graph._series[0]._values.length, dims, xScale);
	    graph._drawLegend();
	},
	
	/* Plot an individual series. */
	_drawSeries: function(graph, cur, dims, xScale, yScale) {
	    var series = graph._series[cur];
	    var path = graph._wrapper.createPath();
	    var circles = [];
	    for (var i = 0; i < series._values.length; i++) {
		var x = dims[graph.X] + i * xScale;
		var y = dims[graph.Y] + (graph.yAxis._scale.max - series._values[i]) * yScale;
		if (i === 0) {
		    path.move(x, y);
		}
		else {
		    path.line(x, y);
		}
		circles.push( [ x, y ]);
	    }
	    if (! series._settings.noLines) {
		graph._wrapper.path(this._chart, path,
				    jQuery.extend({id: 'series' + cur, fill: 'none', stroke: (series._stroke=="white") ? "black" : series._stroke,
						   strokeWidth: series._strokeWidth}, series._settings || {}));
	    }
	    for (i=0;i<circles.length;i++) {
		var c = graph._wrapper.circle(this._chart, circles[i][0], circles[i][1], 3, { fill: 'white', strokeWidth: 1, stroke: (series._stroke=="white") ? "black" : series._stroke, onmouseover: "this.setAttribute('r', parseInt(this.getAttribute('r')) + 1)", onmouseout: "this.setAttribute('r', parseInt(this.getAttribute('r')) - 1)" });
		graph._showStatus(c, series._name, series._values[i]);
	    }
	},

	/* Draw the x-axis and its ticks. */
	_drawXAxis: function(graph, numVal, dims, xScale) {
	    var axis = graph.xAxis;
	    if (axis._title) {
		graph._wrapper.text(graph._chartCont, dims[graph.X] + dims[graph.W] / 2,
				    dims[graph.Y] + dims[graph.H] + axis._titleOffset,
				    axis._title, jQuery.extend({textAnchor: 'middle'}, axis._titleFormat || {}));
	    }
	    var gl = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxis'}, axis._lineFormat));
	    var labelTextAnchor = axis.labelRotation ? "end" : "middle";
	    var gt = graph._wrapper.group(graph._chartCont, jQuery.extend({class_: 'xAxisLabels',
									   textAnchor: labelTextAnchor}, axis._labelFormat));
	    graph._wrapper.line(gl, dims[graph.X], dims[graph.Y] + dims[graph.H],
				dims[graph.X] + dims[graph.W], dims[graph.Y] + dims[graph.H]);
	    if (axis._ticks.major) {
		var offsets = graph._getTickOffsets(axis, true);
		for (var i = 1; i < numVal; i++) {
		    var x = dims[graph.X] + xScale * i;
		    graph._wrapper.line(gl, x, dims[graph.Y] + dims[graph.H] + offsets[0] * axis._ticks.size,
					x, dims[graph.Y] + dims[graph.H] + offsets[1] * axis._ticks.size);
		}
		for (var i = 0; i < numVal; i++) {
		    var x = dims[graph.X] + xScale * i;
		    graph._wrapper.text(gt, x, dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size,
					(axis._labels ? axis._labels[i] : '' + i), (axis.labelRotation ? { transform: "rotate("+axis.labelRotation+", "+x+", "+(dims[graph.Y] + dims[graph.H] + 2 * axis._ticks.size)+")"} : null));
		}
	    }
	}
    });
    
    /* Draw a standard pie chart. */
    function SVGPieChart() {
    }
    
    jQuery.extend(SVGPieChart.prototype, {
	
	_options: ['explode (number or number[]) - indexes of sections to explode out of the pie',
		   'explodeDist (number) - the distance to move an exploded section',
		   'pieGap (number) - the distance between pies for multiple values'],
	
	/* Retrieve the display title for this chart type.
	   @return  the title */
	title: function() {
	    return 'Pie chart';
	},
	
	/* Retrieve a description of this chart type.
	   @return  its description */
	description: function() {
	    return 'Compare relative sizes of values as contributions to the whole.';
	},
	
	/* Retrieve a list of the options that may be set for this chart type.
	   @return  options list */
	options: function() {
	    return this._options;
	},
	
	/* Actually draw the graph in this type's style.
	   @param  graph  (object) the SVGGraph object */
	drawGraph: function(graph) {
	    graph._drawChartBackground(true, true);
	    this._chart = graph._wrapper.group(graph._chartCont, {class_: 'chart'});
	    var dims = graph._getDims();
	    this._drawSeries(graph, dims);
	    graph._drawTitle();
	    graph._drawLegend();
	},
	
	/* Plot all the series. */
	_drawSeries: function(graph, dims) {
	    var totals = graph._getTotals();
	    var numSer = graph._series.length;
	    var numVal = (numSer ? (graph._series[0])._values.length : 0);
	    var path = graph._wrapper.createPath();
	    var explode = []; //graph._chartOptions.explode || [];
	    explode = (isArray(explode) ? explode : [explode]);
	    var explodeDist = graph._chartOptions.explodeDist || 10;
	    var pieGap = (numVal <= 1 ? 0 : graph._chartOptions.pieGap || 10);
	    var xBase = (dims[graph.W] - (numVal * pieGap) - pieGap) / numVal / 2;
	    var yBase = dims[graph.H] / 2;
	    var radius = Math.min(xBase, yBase) - (explode.length > 0 ? explodeDist : 0);
	    var gt = graph._wrapper.group(graph._chartCont, jQuery.extend(
		{class_: 'xAxisLabels', textAnchor: 'middle'}, graph.xAxis._labelFormat));
	    var gl = [];
	    for (var i = 0; i < numVal; i++) {
		var cx = dims[graph.X] + xBase + (i * (2 * Math.min(xBase, yBase) + pieGap)) + pieGap;
		var cy = dims[graph.Y] + yBase;
		var curTotal = 0;
		for (var j = 0; j < numSer; j++) {
		    var series = graph._series[j];
		    if (i === 0) {
			gl[j] = graph._wrapper.group(this._chart, jQuery.extend({class_: 'series' + j,
										 fill: series._fill, stroke: series._stroke,
										 strokeWidth: series._strokeWidth}, series._settings || {}));
		    }
		    if (series._values[i] === 0) {
			continue;
		    }
		    var start = (curTotal / totals[i]) * 2 * Math.PI;
		    curTotal += series._values[i];
		    var end = (curTotal / totals[i]) * 2 * Math.PI;
		    var exploding = false;
		    for (var k = 0; k < explode.length; k++) {
			if (explode[k] == j) {
			    exploding = true;
			    break;
			}
		    }
		    var x = cx + (exploding ? explodeDist * Math.cos((start + end) / 2) : 0);
		    var y = cy + (exploding ? explodeDist * Math.sin((start + end) / 2) : 0);
		    var p = graph._wrapper.path(gl[j], path.reset().move(x, y).
						line(x + radius * Math.cos(start), y + radius * Math.sin(start)).
						arc(radius, radius, 0, (end - start < Math.PI ? 0 : 1), 1,
						    x + radius * Math.cos(end), y + radius * Math.sin(end)).close());
		    graph._showStatus(p, series._name,
				      roundNumber((end - start) / 2 / Math.PI * 100, 2));
		}
		if (graph.xAxis && graph.xAxis._labels[i]) {
		    graph._wrapper.text(gt, cx, dims[graph.Y] + dims[graph.H] + graph.xAxis._titleOffset,
					graph.xAxis._labels[i]);
		}
	    }
	}
    });
    
    // Basic chart types
    jQuery.svg.graphing.addChartType('column', new SVGColumnChart());
    jQuery.svg.graphing.addChartType('stackedColumn', new SVGStackedColumnChart());
    jQuery.svg.graphing.addChartType('row', new SVGRowChart());
    jQuery.svg.graphing.addChartType('stackedRow', new SVGStackedRowChart());
    jQuery.svg.graphing.addChartType('line', new SVGLineChart());
    jQuery.svg.graphing.addChartType('pie', new SVGPieChart());
    jQuery.svg.graphing.addChartType('stackedArea', new SVGStackedAreaChart());
    jQuery.svg.graphing.addChartType('deviation', new SVGDeviationChart());
    
    //============
    /* Plotting */
    //============
    
    jQuery.svg.addExtension('plot', SVGPlot);
    
    /* Extension point for SVG plotting.
       Access through svg.plot. */
    function SVGPlot(wrapper) {
	this._wrapper = wrapper; // The attached SVG wrapper object
	this._drawNow = false; // True for immediate update, false to wait for redraw call
	// The plot title and settings
	this._title = {value: '', offset: 25, settings: {textAnchor: 'middle'}};
	this._area = [0.1, 0.1, 0.8, 0.9]; // The chart area: left, top, right, bottom,
	// > 1 in pixels, <= 1 as proportion
	this._areaFormat = {fill: 'none', stroke: 'black'}; // The formatting for the plot area
	this._gridlines = []; // The formatting of the x- and y-gridlines
	this._equalXY = false; // True for equal-sized x- and y-units, false to fill available space
	this._functions = []; // The functions to be plotted, each is an object
	this.plotPoints = []; // The points to be plotted
	this._onstatus = null; // The callback function for status updates
	this._uuid = new Date().getTime();
	this._plotCont = this._wrapper.svg(0, 0, 0, 0, {class_: 'svg-plot'}); // The main container for the plot
	
	this.xAxis = new SVGPlotAxis(this); // The main x-axis
	this.xAxis.title('', 40);
	this.yAxis = new SVGPlotAxis(this); // The main y-axis
	this.yAxis.title('', 40);
	this.legend = new SVGPlotLegend(this); // The plot legend
	this._drawNow = true;
    }
    
    jQuery.extend(SVGPlot.prototype, {
	
	/* Useful indexes. */
	X: 0,
	Y: 1,
	W: 2,
	H: 3,
	L: 0,
	T: 1,
	R: 2,
	B: 3,
	
	/* Set or retrieve the container for the plot.
	   @param  cont  (SVG element) the container for the plot
	   @return  (SVGPlot) this plot object or
	   (SVG element) the current container (if no parameters) */
	container: function(cont) {
	    if (arguments.length === 0) {
		return this._plotCont;
	    }
	    this._plotCont = cont;
	    return this;
	},
	
	/* Set or retrieve the main plotting area.
	   @param  left    (number) > 1 is pixels, <= 1 is proportion of width or
	   (number[4]) for left, top, right, bottom
	   @param  top     (number) > 1 is pixels, <= 1 is proportion of height
	   @param  right   (number) > 1 is pixels, <= 1 is proportion of width
	   @param  bottom  (number) > 1 is pixels, <= 1 is proportion of height
	   @return  (SVGPlot) this plot object or
	   (number[4]) the plotting area: left, top, right, bottom (if no parameters) */
	area: function(left, top, right, bottom) {
	    if (arguments.length === 0) {
		return this._area;
	    }
	    this._area = (isArray(left) ? left : [left, top, right, bottom]);
	    this._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the background of the plot area.
	   @param  fill      (string) how to fill the area background
	   @param  stroke    (string) the colour of the outline (optional)
	   @param  settings  (object) additional formatting for the area background (optional)
	   @return  (SVGPlot) this plot object or
	   (object) the area format (if no parameters) */
	format: function(fill, stroke, settings) {
	    if (arguments.length === 0) {
		return this._areaFormat;
	    }
	    if (typeof stroke == 'object') {
		settings = stroke;
		stroke = null;
	    }
	    this._areaFormat = jQuery.extend({fill: fill},
					     (stroke ? {stroke: stroke} : {}), settings || {});
	    this._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the gridlines formatting for the plot area.
	   @param  xSettings  (string) the colour of the gridlines along the x-axis, or
	   (object) formatting for the gridlines along the x-axis, or
	   null for none
	   @param  ySettings  (string) the colour of the gridlines along the y-axis, or
	   (object) formatting for the gridlines along the y-axis, or
	   null for none
	   @return  (SVGPlot) this plot object or
	   (object[2]) the gridlines formatting (if no parameters) */
	gridlines: function(xSettings, ySettings) {
	    if (arguments.length === 0) {
		return this._gridlines;
	    }
	    this._gridlines = [(typeof xSettings == 'string' ? {stroke: xSettings} : xSettings),
			       (typeof ySettings == 'string' ? {stroke: ySettings} : ySettings)];
	    if (this._gridlines[0] === null && this._gridlines[1] === null) {
		this._gridlines = [];
	    }
	    this._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the equality of the x- and y-axes.
	   @param  value  (boolean) true for equal x- and y-units, false to fill the available space
	   @return  (SVGPlot) this plot object or
	   (boolean) the current setting (if no parameters) */
	equalXY: function(value) {
	    if (arguments.length === 0) {
		return this._equalXY;
	    }
	    this._equalXY = value;
	    return this;
	},
	
	/* Set or retrieve the title of the plot and its formatting.
	   @param  value     (string) the title
	   @param  offset    (number) the vertical positioning of the title
           > 1 is pixels, <= 1 is proportion of width (optional)
	   @param  colour    (string) the colour of the title (optional)
	   @param  settings  (object) formatting for the title (optional)
	   @return  (SVGPlot) this plot object or
	   (object) value, offset, and settings for the title (if no parameters) */
	title: function(value, offset, colour, settings) {
	    if (arguments.length === 0) {
		return this._title;
	    }
	    if (typeof offset != 'number') {
		settings = colour;
		colour = offset;
		offset = null;
	    }
	    if (typeof colour != 'string') {
		settings = colour;
		colour = null;
	    }
	    this._title = {value: value, offset: offset || this._title.offset,
			   settings: jQuery.extend({textAnchor: 'middle', fontSize: '15px' },
						   (colour ? {fill: colour} : {}), settings || {})};
	    this._drawPlot();
	    return this;
	},
	
	/* Add a function to be plotted on the plot.
	   @param  name         (string) the name of this series (optional)
	   @param  fn           (function) the function to be plotted
	   @param  range        (number[2]) the range of values to plot (optional)
	   @param  points       (number) the number of points to plot within this range (optional)
	   @param  stroke       (string) the colour of the plotted lines (optional)
	   @param  strokeWidth  (number) the width of the plotted lines (optional)
	   @param  settings     (object) additional settings for the plotted values (optional)
	   @return  (SVGPlot) this plot object */
	addFunction: function(name, fn, range, points, stroke, strokeWidth, settings) {
	    this._functions.push(new SVGPlotFunction(
		this, name, fn, range, points, stroke, strokeWidth, settings));
	    this._drawPlot();
	    return this;
	},
	
	/* Retrieve the function wrappers.
	   @param  i  (number) the function index (optional)
	   @return  (SVGPlotFunction) the specified function or
	   (SVGPlotFunction[]) the list of functions */
	functions: function(i) {
	    return (arguments.length > 0 ? this._functions[i] : null) || this._functions;
	},
	
	/* Suppress drawing of the plot until redraw() is called.
	   @return  (SVGPlot) this plot object */
	noDraw: function() {
	    this._drawNow = false;
	    return this;
	},
	
	/* Redraw the entire plot with the current settings and values.
	   @return  (SVGPlot) this plot object */
	redraw: function() {
	    this._drawNow = true;
	    this._drawPlot();
	    return this;
	},
	
	/* Set the callback function for status updates.
	   @param  onstatus  (function) the callback function
	   @return  (SVGPlot) this plot object */
	status: function(onstatus) {
	    this._onstatus = onstatus;
	    return this;
	},
	
	/* Actually draw the plot (if allowed). */
	_drawPlot: function() {
	    if (!this._drawNow) {
		return;
	    }
	    while (this._plotCont.firstChild) {
		this._plotCont.removeChild(this._plotCont.firstChild);
	    }
	    if (!this._plotCont.parent) {
		this._wrapper._svg.appendChild(this._plotCont);
	    }
	    // Set sizes if not already there
	    if (!this._plotCont.width) {
		this._plotCont.setAttribute('width',
					    parseInt(this._plotCont.getAttribute('width'), 10) || this._wrapper._width());
	    }
	    else if (this._plotCont.width.baseVal) {
		this._plotCont.width.baseVal.value =
		    this._plotCont.width.baseVal.value || this._wrapper._width();
	    }
	    else {
		this._plotCont.width = this._plotCont.width || this._wrapper._width();
	    }
	    if (!this._plotCont.height) {
		this._plotCont.setAttribute('height',
					    parseInt(this._plotCont.getAttribute('height'), 10) || this._wrapper._height());
	    }
	    else if (this._plotCont.height.baseVal) {
		this._plotCont.height.baseVal.value =
		    this._plotCont.height.baseVal.value || this._wrapper._height();
	    }
	    else {
		this._plotCont.height = this._plotCont.height || this._wrapper._height();
	    }
	    this._drawChartBackground();
	    var dims = this._getDims();
	    var clip = this._wrapper.other(this._plotCont, 'clipPath', {id: 'clip' + this._uuid});
	    this._wrapper.rect(clip, dims[this.X], dims[this.Y], dims[this.W], dims[this.H]);
	    this._plot = this._wrapper.group(this._plotCont,
					     {class_: 'foreground', clipPath: 'url(#clip' + this._uuid + ')'});
	    this._drawAxis(true);
	    this._drawAxis(false);
	    for (var i = 0; i < this._functions.length; i++) {
		this._plotFunction(this._functions[i], i);
	    }
	    if (this.plotPoints.length) {
		for (var i = 0; i < this.plotPoints.length; i++) {
		    if (this.connected) {
			this._plotConnectedPoints(this.plotPoints[i], i);
		    } else {
			this._plotPoints(this.plotPoints[i], i);
		    }
		}
	    }
	    this._drawTitle();
	    this._drawLegend();
	},
	
	/* Decode an attribute value.
	   @param  node  the node to examine
	   @param  name  the attribute name
	   @return  the actual value */
	_getValue: function(node, name) {
	    return (!node[name] ? parseInt(node.getAttribute(name), 10) :
		    (node[name].baseVal ? node[name].baseVal.value : node[name]));
	},
	
	/* Calculate the actual dimensions of the plot area.
	   @param  area  (number[4]) the area values to evaluate (optional)
	   @return  (number[4]) an array of dimension values: left, top, width, height */
	_getDims: function(area) {
	    var otherArea = (area !== null);
	    area = area || this._area;
	    var availWidth = this._getValue(this._plotCont, 'width');
	    var availHeight = this._getValue(this._plotCont, 'height');
	    var left = (area[this.L] > 1 ? area[this.L] : availWidth * area[this.L]);
	    var top = (area[this.T] > 1 ? area[this.T] : availHeight * area[this.T]);
	    var width = (area[this.R] > 1 ? area[this.R] : availWidth * area[this.R]) - left;
	    var height = (area[this.B] > 1 ? area[this.B] : availHeight * area[this.B]) - top;
	    if (this._equalXY && !otherArea) {
		var scale = Math.min(width / (this.xAxis._scale.max - this.xAxis._scale.min),
				     height / (this.yAxis._scale.max - this.yAxis._scale.min));
		width = scale * (this.xAxis._scale.max - this.xAxis._scale.min);
		height = scale * (this.yAxis._scale.max - this.yAxis._scale.min);
	    }
	    return [left, top, width, height];
	},
	
	/* Calculate the scaling factors for the plot area.
	   @return  (number[2]) the x- and y-scaling factors */
	_getScales: function() {
	    var dims = this._getDims();
	    return [dims[this.W] / (this.xAxis._scale.max - this.xAxis._scale.min),
		    dims[this.H] /  (this.yAxis._scale.max - this.yAxis._scale.min)];
	},
	
	/* Draw the chart background, including gridlines.
	   @param  noXGrid  (boolean) true to suppress the x-gridlines, false to draw them (optional)
	   @param  noYGrid  (boolean) true to suppress the y-gridlines, false to draw them (optional)
	   @return  (element) the background group element */
	_drawChartBackground: function(noXGrid, noYGrid) {
	    var bg = this._wrapper.group(this._plotCont, {class_: 'background'});
	    var dims = this._getDims();
	    this._wrapper.rect(bg, dims[this.X], dims[this.Y], dims[this.W], dims[this.H], this._areaFormat);
	    if (this._gridlines[0] && this.yAxis._ticks.major && !noYGrid) {
		this._drawGridlines(bg, true, this._gridlines[0], dims);
	    }
	    if (this._gridlines[1] && this.xAxis._ticks.major && !noXGrid) {
		this._drawGridlines(bg, false, this._gridlines[1], dims);
	    }
	    return bg;
	},
	
	/* Draw one set of gridlines.
	   @param  bg      (element) the background group element
	   @param  horiz   (boolean) true if horizontal, false if vertical
	   @param  format  (object) additional settings for the gridlines */
	_drawGridlines: function(bg, horiz, format, dims) {
	    var g = this._wrapper.group(bg, format);
	    var axis = (horiz ? this.yAxis : this.xAxis);
	    var scales = this._getScales();
	    var major = Math.floor(axis._scale.min / axis._ticks.major) * axis._ticks.major;
	    major += (major <= axis._scale.min ? axis._ticks.major : 0);
	    while (major < axis._scale.max) {
		var v = (horiz ? axis._scale.max - major : major - axis._scale.min) *
		    scales[horiz ? 1 : 0] + (horiz ? dims[this.Y] : dims[this.X]);
		this._wrapper.line(g, (horiz ? dims[this.X] : v), (horiz ? v : dims[this.Y]),
				   (horiz ? dims[this.X] + dims[this.W] : v), (horiz ? v : dims[this.Y] + dims[this.H]));
		major += axis._ticks.major;
	    }
	},
	
	/* Draw an axis, its tick marks, and title.
	   @param  horiz  (boolean) true for x-axis, false for y-axis */
	_drawAxis: function(horiz) {
	    var id = (horiz ? 'x' : 'y') + 'Axis';
	    var axis = (horiz ? this.xAxis : this.yAxis);
	    var axis2 = (horiz ? this.yAxis : this.xAxis);
	    var dims = this._getDims();
	    var scales = this._getScales();
	    var gl = this._wrapper.group(this._plot, jQuery.extend({class_: id}, axis._lineFormat));
	    var gt = this._wrapper.group(this._plot, jQuery.extend({class_: id + 'Labels',
								    textAnchor: (horiz ? 'middle' : 'end')}, axis._labelFormat));
	    var zero = (horiz ? axis2._scale.max : -axis2._scale.min) *
		scales[horiz ? 1 : 0] + (horiz ? dims[this.Y] : dims[this.X]);
	    this._wrapper.line(gl, (horiz ? dims[this.X] : zero), (horiz ? zero : dims[this.Y]),
			       (horiz ? dims[this.X] + dims[this.W] : zero),
			       (horiz ? zero : dims[this.Y] + dims[this.H]), { strokeWidth: 1.5 });
	    if (axis._ticks.major) {
		var size = axis._ticks.size;
		var major = Math.floor(axis._scale.min / axis._ticks.major) * axis._ticks.major;
		major = (major < axis._scale.min ? major + axis._ticks.major : major);
		var minor = (!axis._ticks.minor ? axis._scale.max + 1 :
			     Math.floor(axis._scale.min / axis._ticks.minor) * axis._ticks.minor);
		minor = (minor < axis._scale.min ? minor + axis._ticks.minor : minor);
		var offsets = [(axis._ticks.position == 'nw' || axis._ticks.position == 'both' ? -1 : 0),
			       (axis._ticks.position == 'se' || axis._ticks.position == 'both' ? +1 : 0)];
		while (major <= axis._scale.max || minor <= axis._scale.max) {
		    var cur = Math.min(major, minor);
		    var len = (cur == major ? size : size / 2);
		    var xy = (horiz ? cur - axis._scale.min : axis._scale.max - cur) *
			scales[horiz ? 0 : 1] + (horiz ? dims[this.X] : dims[this.Y]);
		    this._wrapper.line(this._plotCont, 
				       (horiz ? xy : zero + len * offsets[0]),
				       (horiz ? zero + len * offsets[0] : xy),
				       (horiz ? xy : zero + len * offsets[1]),
				       (horiz ? zero + len * offsets[1] : xy));
		    if (cur == major && cur !== 0) {
			
			// always plot the axis text at the very left / bottom of the plot
			var zeroo = (horiz ? dims[this.Y] + dims[this.H] : dims[this.X]);
			var logtext = this._wrapper.createText().string('10').span(cur, {dy: -10, fontSize: 10});
			this._wrapper.text(this._plotCont, (horiz ? xy : zeroo - size),
					   (horiz ? zeroo + size + 12 : xy + (size / 2)),
					   (axis._scale.type == 'log') ? logtext : ''+cur,
					   { textAnchor: (horiz ? 'middle' : 'end')});
		    }
		    major += (cur == major ? axis._ticks.major : 0);
		    minor += (cur == minor ? axis._ticks.minor : 0);
		    
		    // fix floating point error
		    var maj_str = major.toString();
		    var tick_str = axis._ticks.major.toString();
		    
		    // round to a maximum of 3 significant digits
		    if (tick_str.substr(tick_str.indexOf('.')+1).length > 3) {
			tick_str = tick_str.substr(0, tick_str.indexOf('.')+4);
		    }
		    
		    // fail if the max is smaller than the smallest number displayable with
		    // three significant digits
		    if (parseFloat(tick_str) < 0.001) {
			return;
		    }
		    if (maj_str.substr(maj_str.indexOf('.')+1).length > tick_str.substr(tick_str.indexOf('.')+1).length) {
			major = parseFloat(major.toFixed(tick_str.substr(tick_str.indexOf('.')+1).length));
		    }
		}
	    }
	    if (axis._title) {
		if (horiz) {
		    this._wrapper.text(this._plotCont, dims[this.X] + dims[this.W] / 2,
				       dims[this.Y] + dims[this.H] + axis._titleOffset,
				       axis._title, axis._titleFormat);
		} else {
		    this._wrapper.text(this._plotCont,
				       0,
				       0,
				       axis._title,
				       jQuery.extend({textAnchor: 'middle', transform: 'translate(' + (dims[this.X] - axis._titleOffset) + ',' + (dims[this.Y] + dims[this.H] / 2) + ') rotate(-90)'}, axis._titleFormat || {}));
		    
		}
	    }
	},
	
	/* Plot an individual function. */
	_plotFunction: function(fn, cur) {
	    var dims = this._getDims();
	    var scales = this._getScales();
	    var path = this._wrapper.createPath();
	    var range = fn._range || [this.xAxis._scale.min, this.xAxis._scale.max];
	    var xScale = (range[1] - range[0]) / fn._points;
	    var first = true;
	    for (var i = 0; i <= fn._points; i++) {
		var x = range[0] + i * xScale;
		if (x > this.xAxis._scale.max + xScale) {
		    break;
		}
		if (x < this.xAxis._scale.min - xScale) {
		    continue;
		}
		var px = (x - this.xAxis._scale.min) * scales[0] + dims[this.X];
		var py = dims[this.H] - ((fn._fn(x) - this.yAxis._scale.min) * scales[1]) + dims[this.Y];
		path[(first ? 'move' : 'line') + 'To'](px, py);
		first = false;
	    }
	    var p = this._wrapper.path(this._plot, path,
				       jQuery.extend({class_: 'fn' + cur, fill: 'none', stroke: fn._stroke,
						      strokeWidth: fn._strokeWidth}, fn._settings || {}));
	    this._showStatus(p, fn._name);
	},
	
	/* Plot a list of points */
	_plotPoints: function(points, series) {
	    var scales = this._getScales();
	    var dims = this._getDims();
	    var zerox = dims[0] - (this.xAxis._scale.min * scales[0]);
	    var zeroy = dims[1] + dims[3] + (this.yAxis._scale.min * scales[1]);
	    var psettings = { size: this.series[series].pointSize || 6, shape: this.series[series].shape, 'filled': this.series[series].filled || false, color: this.series[series].color };
	    for (i=0;i<points.length;i++) {
		var p = points[i];
		jQuery.extend(p, psettings);
		pxscaled = ((this.xAxis._scale.type == 'log') ? log10(p.x) : p.x );
		pyscaled = ((this.yAxis._scale.type == 'log') ? log10(p.y) : p.y )
		p.imgX = pxscaled * scales[0] + zerox;
		p.imgY = zeroy - (pyscaled * scales[1]);
		var title = p.title ? p.title : "";
		switch (p.shape) {
		case 'circle':
		    p.svg = this._wrapper.circle(this._plot, pxscaled * scales[0] + zerox, zeroy - (pyscaled * scales[1]), p.size / 2, { fill: p.filled ? p.color : 'none', strokeWidth: 1, stroke: p.color, title: title });
		    break;
		case 'square':
		    p.svg = this._wrapper.rect(this._plot, pxscaled * scales[0] + zerox - (p.size / 2), zeroy - (pyscaled * scales[1]) - (p.size / 2), p.size, p.size, { fill: p.filled ? p.color : 'none', strokeWidth: 1, stroke: p.color, title: title });
		    break;
		case 'triangle':
		    p.svg = this._wrapper.polygon(this._plot, [ [ pxscaled * scales[0] + zerox - (p.size / 2), zeroy - (pyscaled * scales[1]) - (p.size / 2) ],
								[ pxscaled * scales[0] + zerox + (p.size / 2), zeroy - (pyscaled * scales[1]) - (p.size / 2) ],
								[ pxscaled * scales[0] + zerox, zeroy - (pyscaled * scales[1]) + (p.size / 2) ] ], { fill: p.filled ? p.color : 'none', strokeWidth: 1, stroke: p.color, title: title });
		    break;
		}
	    }
	},
	
	/* Plot a list of points */
	_plotConnectedPoints: function(points, series) {
	    var scales = this._getScales();
	    var dims = this._getDims();
	    var zerox = dims[0] - (this.xAxis._scale.min * scales[0]);
	    var zeroy = dims[1] + dims[3] + (this.yAxis._scale.min * scales[1]);
	    var psettings = { size: 8, shape: this.series[series].shape, line: this.series[series].color || 'blue', fill: this.series[series].fillColor || 'black' };
	    for (i=0;i<points.length;i++) {
		var p = points[i];
		jQuery.extend(p, psettings);
		p.imgX = ((this.xAxis._scale.type == 'log') ? log10(p.x) : p.x ) * scales[0] + zerox;
		p.imgY = zeroy - (((this.yAxis._scale.type == 'log') ? log10(p.y) : p.y ) * scales[1]);
		if (i>0) {
		    this._wrapper.line(this._plot, ((this.xAxis._scale.type == 'log') ? log10(points[i-1].x) : points[i-1].x ) * scales[0] + zerox, zeroy - (((this.yAxis._scale.type == 'log') ? log10(points[i-1].y) : points[i-1].y ) * scales[1]), ((this.xAxis._scale.type == 'log') ? log10(p.x) : p.x ) * scales[0] + zerox, zeroy - (((this.yAxis._scale.type == 'log') ? log10(p.y) : p.y ) * scales[1]), { strokeWidth: 2, stroke: this.series[series].color || 'blue' });
		}
		if (this.showDots) {
		    var title = p.title ? p.title : "";
		    p.svg = this._wrapper.circle(this._plot, ((this.xAxis._scale.type == 'log') ? log10(p.x) : p.x ) * scales[0] + zerox, zeroy - (((this.yAxis._scale.type == 'log') ? log10(p.y) : p.y ) * scales[1]), p.size / 2, { fill: p.fill, strokeWidth: 2, stroke: p.line, onmouseover: "this.setAttribute('r', parseInt(this.getAttribute('r')) + 1)", onmouseout: "this.setAttribute('r', parseInt(this.getAttribute('r')) - 1)", title: title });
		}
	    }
	},
	
	pointsInBounds: function(x1, y1, x2, y2) {
	    var points = this.plotPoints;
	    var retval = [];
	    for (i=0;i<points.length;i++) {
		for (h=0;h<points[i].length;h++) {
		    if (points[i][h].imgX >= x1 && points[i][h].imgX <= x2 && points[i][h].imgY >= y1 && points[i][h].imgY <= y2) {
			points[i][h]['series'] = i;
			retval.push(points[i][h]);
		    }
		}
	    }
	    return retval;
	},
	
	/* Draw the plot title - centred. */
	_drawTitle: function() {
	    this._wrapper.text(this._plotCont, this._getValue(this._plotCont, 'width') / 2,
			       this._title.offset, this._title.value, this._title.settings);
	},
	
	/* Draw the chart legend. */
	_drawLegend: function() {
	    if (!this.legend._show) {
		return;
	    }
	    var g = this._wrapper.group(this._plotCont, {class_: 'legend'});
	    var dims = this._getDims(this.legend._area);
	    var horiz = false;// dims[this.W] > dims[this.H];
	    var numFn = this._functions.length || this.series.length;
	    var offset = (horiz ? dims[this.W] : dims[this.H]) / numFn;
	    var xBase = dims[this.X] + 5;
	    var yBase = dims[this.Y] + ((horiz ? dims[this.H] : offset) + this.legend._sampleSize) / 2;
	    for (var i = 0; i < numFn; i++) {
		var fn = this._functions.lenth ? this._functions[i] : this.series[i];
		this._wrapper.rect(g, xBase + (horiz ? i * offset : 0),
				   yBase + (horiz ? 0 : i * offset) - this.legend._sampleSize,
				   this.legend._sampleSize, this.legend._sampleSize, {fill: fn._stroke ? fn._stroke : fn.color });
		this._wrapper.text(g, xBase + (horiz ? i * offset : 0) + this.legend._sampleSize + 5,
				   yBase + (horiz ? 0 : i * offset), fn._name ? fn._name : fn.name, this.legend._textSettings);
	    }
	},
	
	/* Show the current value status on hover. */
	_showStatus: function(elem, label) {
	    var status = this._onstatus;
	    if (this._onstatus) {
		jQuery(elem).hover(function(evt) { status.apply(this, [label]); },
				   function() { status.apply(this, ['']); });
	    }
	}
    });
    
    /* Details about each plot function.
       @param  plot         (SVGPlot) the owning plot
       @param  name         (string) the name of this function (optional)
       @param  fn           (function) the function to be plotted
       @param  range        (number[2]) the range of values to be plotted (optional)
       @param  points       (number) the number of points to plot within this range (optional)
       @param  stroke       (string) the colour of the (out)line for the plot (optional)
       @param  strokeWidth  (number) the width of the (out)line for the plot (optional)
       @param  settings     (object) additional formatting settings (optional)
       @return  (SVGPlotFunction) the new plot function object */
    function SVGPlotFunction(plot, name, fn, range, points, stroke, strokeWidth, settings) {
	if (typeof name != 'string') {
	    settings = strokeWidth;
	    strokeWidth = stroke;
	    stroke = points;
	    points = range;
	    range = fn;
	    fn = name;
	    name = null;
	}
	if (!isArray(range)) {
	    settings = strokeWidth;
	    strokeWidth = stroke;
	    stroke = points;
	    points = range;
	    range = null;
	}
	if (typeof points != 'number') {
	    settings = strokeWidth;
	    strokeWidth = stroke;
	    stroke = points;
	    points = null;
	}
	if (typeof stroke != 'string') {
	    settings = strokeWidth;
	    strokeWidth = stroke;
	    stroke = null;
	}
	if (typeof strokeWidth != 'number') {
	    settings = strokeWidth;
	    strokeWidth = null;
	}
	this._plot = plot; // The owning plot
	this._name = name || ''; // Display name
	this._fn = fn || identity; // The actual function: y = fn(x)
	this._range = range; // The range of values plotted
	this._points = points || 100; // The number of points plotted
	this._stroke = stroke || 'black'; // The line colour
	this._strokeWidth = strokeWidth || 1; // The line width
	this._settings = settings || {}; // Any other settings
    }
    
    jQuery.extend(SVGPlotFunction.prototype, {
	
	/* Set or retrieve the name for this function.
	   @param  name    (string) the function's name
	   @return  (SVGPlotFunction) this plot function object or
	   (string) the function name (if no parameters) */
	name: function(name) {
	    if (arguments.length === 0) {
		return this._name;
	    }
	    this._name = name;
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the function to be plotted.
	   @param  name  (string) the function's name (optional)
	   @param  fn    (function) the function to be ploted
	   @return  (SVGPlotFunction) this plot function object or
	   (function) the actual function (if no parameters) */
	fn: function(name, fn) {
	    if (arguments.length === 0) {
		return this._fn;
	    }
	    if (typeof name == 'function') {
		fn = name;
		name = null;
	    }
	    this._name = name || this._name;
	    this._fn = fn;
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the range of values to be plotted.
	   @param  min  (number) the minimum value to be plotted
	   @param  max  (number) the maximum value to be plotted
	   @return  (SVGPlotFunction) this plot function object or
	   (number[2]) the value range (if no parameters) */
	range: function(min, max) {
	    if (arguments.length === 0) {
		return this._range;
	    }
	    this._range = (min === null ? null : [min, max]);
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the number of points to be plotted.
	   @param  value  (number) the number of points to plot
	   @return  (SVGPlotFunction) this plot function object or
	   (number) the number of points (if no parameters) */
	points: function(value) {
	    if (arguments.length === 0) {
		return this._points;
	    }
	    this._points = value;
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the formatting for this function.
	   @param  stroke       (string) the (out)line colour
	   @param  strokeWidth  (number) the line's width (optional)
	   @param  settings     (object) additional formatting settings for the function (optional)
	   @return  (SVGPlotFunction) this plot function object or
	   (object) formatting settings (if no parameters) */
	format: function(stroke, strokeWidth, settings) {
	    if (arguments.length === 0) {
		return jQuery.extend({stroke: this._stroke,
				      strokeWidth: this._strokeWidth}, this._settings);
	    }
	    if (typeof strokeWidth != 'number') {
		settings = strokeWidth;
		strokeWidth = null;
	    }
	    this._stroke = stroke || this._stroke;
	    this._strokeWidth = strokeWidth || this._strokeWidth;
	    jQuery.extend(this._settings, settings || {});
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Return to the parent plot. */
	end: function() {
	    return this._plot;
	}
    });
    
    /* Default function to plot.
       @param  x  (number) the input value
       @return  (number) the same value */
    function identity(x) {
	return x;
    }
    
    /* Details about each plot axis.
       @param  plot   (SVGPlot) the owning plot
       @param  title  (string) the title of the axis
       @param  min    (number) the minimum value displayed on this axis
       @param  max    (number) the maximum value displayed on this axis
       @param  major  (number) the distance between major ticks
       @param  minor  (number) the distance between minor ticks (optional)
       @return  (SVGPlotAxis) the new axis object */
    function SVGPlotAxis(plot, title, min, max, major, minor) {
	this._plot = plot; // The owning plot
	this._title = title || ''; // The plot's title
	this._titleFormat = { textAnchor: 'middle' }; // Formatting settings for the title
	this._titleOffset = 0; // The offset for positioning the title
	this._labelFormat = { }; // Formatting settings for the labels
	this._lineFormat = {stroke: 'black', strokeWidth: 1}; // Formatting settings for the axis lines
	this._ticks = {major: major || 10, minor: minor || 0, size: 10, position: 'both'}; // Tick mark options
	this._scale = {min: min || 0, max: max || 100}; // Axis scale settings
	this._crossAt = 0; // Where this axis crosses the other one. */
    }
    
    jQuery.extend(SVGPlotAxis.prototype, {
	
	/* Set or retrieve the scale for this axis.
	   @param  min  (number) the minimum value shown
	   @param  max  (number) the maximum value shown
	   @return  (SVGPlotAxis) this axis object or
	   (object) min and max values (if no parameters) */
	scale: function(min, max, type) {
	    if (arguments.length === 0) {
		return this._scale;
	    }
	    this._scale.min = (type == 'log' && min !== 0) ? log10(min) : min;
	    this._scale.max = (type == 'log' && max !== 0) ? log10(max) : max;
	    this._scale.type = type;
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the ticks for this axis.
	   @param  major     (number) the distance between major ticks
	   @param  minor     (number) the distance between minor ticks
	   @param  size      (number) the length of the major ticks (minor are half) (optional)
	   @param  position  (string) the location of the ticks:
	   'nw', 'se', 'both' (optional)
	   @return  (SVGPlotAxis) this axis object or
	   (object) major, minor, size, and position values (if no parameters) */
	ticks: function(major, minor, size, position, type) {
	    if (arguments.length === 0) {
		return this._ticks;
	    }
	    if (typeof size == 'string') {
		position = size;
		size = null;
	    }
	    this._ticks.major = (type == 'log' && major !== 0) ? 1 : major;
	    this._ticks.minor = (type == 'log' && minor !== 0) ? 1 : minor;
	    this._ticks.size = size || this._ticks.size;
	    this._ticks.position = position || this._ticks.position;
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the title for this axis.
	   @param  title   (string) the title text
	   @param  offset  (number) the distance to offset the title position (optional)
	   @param  colour  (string) how to colour the title (optional) 
	   @param  format  (object) formatting settings for the title (optional)
	   @return  (SVGPlotAxis) this axis object or
	   (object) title, offset, and format values (if no parameters) */
	title: function(title, offset, colour, format) {
	    if (arguments.length === 0) {
		return {title: this._title, offset: this._titleOffset, format: this._titleFormat};
	    }
	    if (typeof offset != 'number') {
		format = colour;
		colour = offset;
		offset = null;
	    }
	    if (typeof colour != 'string') {
		format = colour;
		colour = null;
	    }
	    this._title = title;
	    this._titleOffset = (offset !== null ? offset : this._titleOffset);
	    if (colour || format) {
		this._titleFormat = jQuery.extend(format || {}, (colour ? {fill: colour} : {}));
	    }
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the label format for this axis.
	   @param  colour  (string) how to colour the labels (optional) 
	   @param  format  (object) formatting settings for the labels (optional)
	   @return  (SVGPlotAxis) this axis object or
	   (object) format values (if no parameters) */
	format: function(colour, format) {
	    if (arguments.length === 0) {
		return this._labelFormat;
	    }
	    if (typeof colour != 'string') {
		format = colour;
		colour = null;
	    }
	    this._labelFormat = jQuery.extend(format || {}, (colour ? {fill: colour} : {}));
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the line formatting for this axis.
	   @param  colour    (string) the line's colour
	   @param  width     (number) the line's width (optional)
	   @param  settings  (object) additional formatting settings for the line (optional)
	   @return  (SVGPlotAxis) this axis object or
	   (object) line formatting values (if no parameters) */
	line: function(colour, width, settings) {
	    if (arguments.length === 0) {
		return this._lineFormat;
	    }
	    if (typeof width != 'number') {
		settings = width;
		width = null;
	    }
	    jQuery.extend(this._lineFormat, {stroke: colour, strokeWidth:
					     width || this._lineFormat.strokeWidth}, settings || {});
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Return to the parent plot. */
	end: function() {
	    return this._plot;
	}
    });
    
    /* Details about the plot legend.
       @param  plot          (SVGPlot) the owning plot
       @param  bgSettings    (object) additional formatting settings for the legend background (optional)
       @param  textSettings  (object) additional formatting settings for the legend text (optional)
       @return  (SVGPlotLegend) the new legend object */
    function SVGPlotLegend(plot, bgSettings, textSettings) {
	this._plot = plot; // The owning plot
	this._show = true; // Show the legend?
	this._area = [0.9, 0.1, 1.0, 0.9]; // The legend area: left, top, right, bottom,
	// > 1 in pixels, <= 1 as proportion
	this._sampleSize = 15; // Size of sample box
	this._bgSettings = bgSettings || {stroke: 'gray'}; // Additional formatting settings for the legend background
	this._textSettings = textSettings || {}; // Additional formatting settings for the text
    }
    
    jQuery.extend(SVGPlotLegend.prototype, {
	
	/* Set or retrieve whether the legend should be shown.
	   @param  show  (boolean) true to display it, false to hide it
	   @return  (SVGPlotLegend) this legend object or
	   (boolean) show the legend? (if no parameters) */
	show: function(show) {
	    if (arguments.length === 0) {
		return this._show;
	    }
	    this._show = show;
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve the legend area.
	   @param  left    (number) > 1 is pixels, <= 1 is proportion of width or
	   (number[4]) for left, top, right, bottom
	   @param  top     (number) > 1 is pixels, <= 1 is proportion of height
	   @param  right   (number) > 1 is pixels, <= 1 is proportion of width
	   @param  bottom  (number) > 1 is pixels, <= 1 is proportion of height
	   @return  (SVGPlotLegend) this legend object or
	   (number[4]) the legend area: left, top, right, bottom (if no parameters) */
	area: function(left, top, right, bottom) {
	    if (arguments.length === 0) {
		return this._area;
	    }
	    this._area = (isArray(left) ? left : [left, top, right, bottom]);
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Set or retrieve additional settings for the legend area.
	   @param  sampleSize    (number) the size of the sample box to display (optional)
	   @param  bgSettings    (object) additional formatting settings for the legend background
	   @param  textSettings  (object) additional formatting settings for the legend text (optional)
	   @return  (SVGPlotLegend) this legend object or
	   (object) bgSettings and textSettings for the legend (if no parameters) */
	settings: function(sampleSize, bgSettings, textSettings) {
	    if (arguments.length === 0) {
		return {sampleSize: this._sampleSize, bgSettings: this._bgSettings,
			textSettings: this._textSettings};
	    }
	    if (typeof sampleSize == 'object') {
		textSettings = bgSettings;
		bgSettings = sampleSize;
		sampleSize = null;
	    }
	    this._sampleSize = sampleSize || this._sampleSize;
	    this._bgSettings = bgSettings;
	    this._textSettings = textSettings || this._textSettings;
	    this._plot._drawPlot();
	    return this;
	},
	
	/* Return to the parent plot. */
	end: function() {
	    return this._plot;
	}
    });

    // css
    jQuery("<style>")
	.prop("type", "text/css")
	.html("\
svg:svg {\
    display: none;\
}\
\
.svg_error {\
    color: red;\
    font-weight: bold;\
}\
\
.marquee {\
    fill-opacity: 0.2;\
    stroke: #000;\
    stroke-dasharray: 2,4;\
    vector-effect:non-scaling-stroke;\
}")
	.appendTo("head");
    
})(jQuery);

//===================
/* Drag-Select-Box */
//===================
(function createMarquee(global){
    var svgNS = 'http://www.w3.org/2000/svg',
    svg   = document.createElementNS(svgNS,'svg'),
    pt    = svg.createSVGPoint();
    
    global.trackMarquee = function(forElement,onRelease,onDrag){
	forElement.addEventListener('mousedown',function(evt){
	    var point0 = getLocalCoordinatesFromMouseEvent(forElement,evt);
	    var marquee = document.createElementNS(svgNS,'rect');
	    marquee.setAttribute('class','marquee');
	    updateMarquee(marquee,point0,point0);
	    forElement.appendChild(marquee);
	    document.documentElement.addEventListener('mousemove',trackMouseMove,false);
	    document.documentElement.addEventListener('mouseup',stopTrackingMove,false);
	    function trackMouseMove(evt){
		var point1 = getLocalCoordinatesFromMouseEvent(forElement,evt);
		updateMarquee(marquee,point0,point1);
		if (onDrag) callWithBBox(onDrag,marquee);
	    }
	    function stopTrackingMove(){
		document.documentElement.removeEventListener('mousemove',trackMouseMove,false);
		document.documentElement.removeEventListener('mouseup',stopTrackingMove,false);
		forElement.removeChild(marquee);
		if (onRelease) callWithBBox(onRelease,marquee,forElement);
	    }
	},false);
    };
    
    function callWithBBox(func,rect,elem){
	var x = rect.getAttribute('x')*1,
        y = rect.getAttribute('y')*1,
        w = rect.getAttribute('width')*1,
        h = rect.getAttribute('height')*1;
	func(jQuery("#"+elem.parentNode.id).svg('get').plot.pointsInBounds(x,y,x+w,y+h));
    }
    
    function updateMarquee(rect,p0,p1){
	var xs = [p0.x,p1.x].sort(sortByNumber),
        ys = [p0.y,p1.y].sort(sortByNumber);
	rect.setAttribute('x',xs[0]);
	rect.setAttribute('y',ys[0]);
	rect.setAttribute('width', xs[1]-xs[0]);
	rect.setAttribute('height',ys[1]-ys[0]);
    }
    
    function getLocalCoordinatesFromMouseEvent(el,evt){
	pt.x = evt.clientX; pt.y = evt.clientY;
	return pt.matrixTransform(el.getScreenCTM().inverse());
    }
    
    function sortByNumber(a,b){ return a-b; }

    // Enable animation for all of these SVG numeric attributes -
    // named as svg-* or svg* (with first character upper case)
    jQuery.each(['x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2',
		 'stroke-width', 'strokeWidth', 'opacity', 'fill-opacity', 'fillOpacity',
		 'stroke-opacity', 'strokeOpacity', 'stroke-dashoffset', 'strokeDashOffset',
		 'font-size', 'fontSize', 'font-weight', 'fontWeight',
		 'letter-spacing', 'letterSpacing', 'word-spacing', 'wordSpacing'],
		function(i, attrName) {
		    var ccName = attrName.charAt(0).toUpperCase() + attrName.substr(1);
		    if (jQuery.cssProps) {
			jQuery.cssProps['svg' + ccName] = jQuery.cssProps['svg-' + attrName] = attrName;
		    }
		    jQuery.fx.step['svg' + ccName] = jQuery.fx.step['svg-' + attrName] = function(fx) {
			var realAttrName = jQuery.svg._attrNames[attrName] || attrName;
			var attr = fx.elem.attributes.getNamedItem(realAttrName);
			if (!fx.set) {
			    fx.start = (attr ? parseFloat(attr.nodeValue) : 0);
			    var offset = (jQuery.fn.jquery >= '1.6' ? '' :
					  fx.options.curAnim['svg' + ccName] || fx.options.curAnim['svg-' + attrName]);
			    if (/^[+-]=/.exec(offset)) {
				fx.end = fx.start + parseFloat(offset.replace(/=/, ''));
			    }
			    jQuery(fx.elem).css(realAttrName, '');
			    fx.set = true;
			}
			var value = (fx.pos * (fx.end - fx.start) + fx.start) + (fx.unit == '%' ? '%' : '');
			(attr ? attr.nodeValue = value : fx.elem.setAttribute(realAttrName, value));
		    };
		}
	       );

    // Enable animation for the SVG strokeDashArray attribute
    jQuery.fx.step['svgStrokeDashArray'] = jQuery.fx.step['svg-strokeDashArray'] =
	jQuery.fx.step['svgStroke-dasharray'] = jQuery.fx.step['svg-stroke-dasharray'] = function(fx) {
	    var attr = fx.elem.attributes.getNamedItem('stroke-dasharray');
	    if (!fx.set) {
		fx.start = parseDashArray(attr ? attr.nodeValue : '');
		var offset = (jQuery.fn.jquery >= '1.6' ? fx.end :
			      fx.options.curAnim['svgStrokeDashArray'] || fx.options.curAnim['svg-strokeDashArray'] ||
			      fx.options.curAnim['svgStroke-dasharray'] || fx.options.curAnim['svg-stroke-dasharray']);
		fx.end = parseDashArray(offset);
		if (/^[+-]=/.exec(offset)) {
		    offset = offset.split(/[, ]+/);
		    if (offset.length % 2 == 1) { // Must have an even number
			var len = offset.length;
			for (var i = 0; i < len; i++) { // So repeat
			    offset.push(offset[i]);
			}
		    }
		    for (var i = 0; i < offset.length; i++) {
			if (/^[+-]=/.exec(offset[i])) {
			    fx.end[i] = fx.start[i] + parseFloat(offset[i].replace(/=/, ''));
			}
		    }
		}
		fx.set = true;
	    }
	    var value = jQuery.map(fx.start, function(n, i) {
		return (fx.pos * (fx.end[i] - n) + n);
	    }).join(',');
	    (attr ? attr.nodeValue = value : fx.elem.setAttribute('stroke-dasharray', value));
	};

    /* Parse a strokeDashArray definition: dash, gap, ...
       @param  value  (string) the definition
       @return  (number[2n]) the extracted values */
    function parseDashArray(value) {
	var dashArray = value.split(/[, ]+/);
	for (var i = 0; i < dashArray.length; i++) {
	    dashArray[i] = parseFloat(dashArray[i]);
	    if (isNaN(dashArray[i])) {
		dashArray[i] = 0;
	    }
	}
	if (dashArray.length % 2 == 1) { // Must have an even number
	    var len = dashArray.length;
	    for (var i = 0; i < len; i++) { // So repeat
		dashArray.push(dashArray[i]);
	    }
	}
	return dashArray;
    }

    // Enable animation for the SVG viewBox attribute
    jQuery.fx.step['svgViewBox'] = jQuery.fx.step['svg-viewBox'] = function(fx) {
	var attr = fx.elem.attributes.getNamedItem('viewBox');
	if (!fx.set) {
	    fx.start = parseViewBox(attr ? attr.nodeValue : '');
	    var offset = (jQuery.fn.jquery >= '1.6' ? fx.end :
			  fx.options.curAnim['svgViewBox'] || fx.options.curAnim['svg-viewBox']);
	    fx.end = parseViewBox(offset);
	    if (/^[+-]=/.exec(offset)) {
		offset = offset.split(/[, ]+/);
		while (offset.length < 4) {
		    offset.push('0');
		}
		for (var i = 0; i < 4; i++) {
		    if (/^[+-]=/.exec(offset[i])) {
			fx.end[i] = fx.start[i] + parseFloat(offset[i].replace(/=/, ''));
		    }
		}
	    }
	    fx.set = true;
	}
	var value = jQuery.map(fx.start, function(n, i) {
	    return (fx.pos * (fx.end[i] - n) + n);
	}).join(' ');
	(attr ? attr.nodeValue = value : fx.elem.setAttribute('viewBox', value));
    };

    /* Parse a viewBox definition: x, y, width, height.
       @param  value  (string) the definition
       @return  (number[4]) the extracted values */
    function parseViewBox(value) {
	var viewBox = value.split(/[, ]+/);
	for (var i = 0; i < viewBox.length; i++) {
	    viewBox[i] = parseFloat(viewBox[i]);
	    if (isNaN(viewBox[i])) {
		viewBox[i] = 0;
	    }
	}
	while (viewBox.length < 4) {
	    viewBox.push(0);
	}
	return viewBox;
    }

    // Enable animation for the SVG transform attribute
    jQuery.fx.step['svgTransform'] = jQuery.fx.step['svg-transform'] = function(fx) {
	var attr = fx.elem.attributes.getNamedItem('transform');
	if (!fx.set) {
	    fx.start = parseTransform(attr ? attr.nodeValue : '');
	    fx.end = parseTransform(fx.end, fx.start);
	    fx.set = true;
	}
	var transform = '';
	for (var i = 0; i < fx.end.order.length; i++) {
	    switch (fx.end.order.charAt(i)) {
	    case 't':
		transform += ' translate(' +
		    (fx.pos * (fx.end.translateX - fx.start.translateX) + fx.start.translateX) + ',' +
		    (fx.pos * (fx.end.translateY - fx.start.translateY) + fx.start.translateY) + ')';
		break;
	    case 's':
		transform += ' scale(' +
		    (fx.pos * (fx.end.scaleX - fx.start.scaleX) + fx.start.scaleX) + ',' +
		    (fx.pos * (fx.end.scaleY - fx.start.scaleY) + fx.start.scaleY) + ')';
		break;
	    case 'r':
		transform += ' rotate(' +
		    (fx.pos * (fx.end.rotateA - fx.start.rotateA) + fx.start.rotateA) + ',' +
		    (fx.pos * (fx.end.rotateX - fx.start.rotateX) + fx.start.rotateX) + ',' +
		    (fx.pos * (fx.end.rotateY - fx.start.rotateY) + fx.start.rotateY) + ')';
		break;
	    case 'x':
		transform += ' skewX(' +
		    (fx.pos * (fx.end.skewX - fx.start.skewX) + fx.start.skewX) + ')';
	    case 'y':
		transform += ' skewY(' +
		    (fx.pos * (fx.end.skewY - fx.start.skewY) + fx.start.skewY) + ')';
		break;
	    case 'm':
		var matrix = '';
		for (var j = 0; j < 6; j++) {
		    matrix += ',' + (fx.pos * (fx.end.matrix[j] - fx.start.matrix[j]) + fx.start.matrix[j]);
		}				
		transform += ' matrix(' + matrix.substr(1) + ')';
		break;
	    }
	}
	(attr ? attr.nodeValue = transform : fx.elem.setAttribute('transform', transform));
    };

    /* Decode a transform string and extract component values.
       @param  value     (string) the transform string to parse
       @param  original  (object) the settings from the original node
       @return  (object) the combined transformation attributes */
    function parseTransform(value, original) {
	value = value || '';
	if (typeof value == 'object') {
	    value = value.nodeValue;
	}
	var transform = jQuery.extend({translateX: 0, translateY: 0, scaleX: 0, scaleY: 0,
				       rotateA: 0, rotateX: 0, rotateY: 0, skewX: 0, skewY: 0,
				       matrix: [0, 0, 0, 0, 0, 0]}, original || {});
	transform.order = '';
	var pattern = /([a-zA-Z]+)\(\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*[\s,]\s*([+-]?[\d\.]+)\s*[\s,]\s*([+-]?[\d\.]+)\s*)?)?)?\)/g;
	var result = pattern.exec(value);
	while (result) {
	    switch (result[1]) {
	    case 'translate':
		transform.order += 't';
		transform.translateX = parseFloat(result[2]);
		transform.translateY = (result[3] ? parseFloat(result[3]) : 0);
		break;
	    case 'scale':
		transform.order += 's';
		transform.scaleX = parseFloat(result[2]);
		transform.scaleY = (result[3] ? parseFloat(result[3]) : transform.scaleX);
		break;
	    case 'rotate':
		transform.order += 'r';
		transform.rotateA = parseFloat(result[2]);
		transform.rotateX = (result[3] ? parseFloat(result[3]) : 0);
		transform.rotateY = (result[4] ? parseFloat(result[4]) : 0);
		break;
	    case 'skewX':
		transform.order += 'x';
		transform.skewX = parseFloat(result[2]);
		break;
	    case 'skewY':
		transform.order += 'y';
		transform.skewY = parseFloat(result[2]);
		break;
	    case 'matrix':
		transform.order += 'm';
		transform.matrix = [parseFloat(result[2]), parseFloat(result[3]),
				    parseFloat(result[4]), parseFloat(result[5]),
				    parseFloat(result[6]), parseFloat(result[7])];
		break;
	    }
	    result = pattern.exec(value);
	}
	if (transform.order == 'm' && Math.abs(transform.matrix[0]) == Math.abs(transform.matrix[3]) &&
	    transform.matrix[1] != 0 && Math.abs(transform.matrix[1]) == Math.abs(transform.matrix[2])) {
	    // Simple rotate about origin and translate
	    var angle = Math.acos(transform.matrix[0]) * 180 / Math.PI;
	    angle = (transform.matrix[1] < 0 ? 360 - angle : angle);
	    transform.order = 'rt';
	    transform.rotateA = angle;
	    transform.rotateX = transform.rotateY = 0;
	    transform.translateX = transform.matrix[4];
	    transform.translateY = transform.matrix[5];
	}
	return transform;
    }

    // Enable animation for all of these SVG colour properties - based on jquery.color.js
    jQuery.each(['fill', 'stroke'],
		function(i, attrName) {
		    var ccName = attrName.charAt(0).toUpperCase() + attrName.substr(1);
		    jQuery.fx.step['svg' + ccName] = jQuery.fx.step['svg-' + attrName] = function(fx) {
			if (!fx.set) {
			    fx.start = jQuery.svg._getColour(fx.elem, attrName);
			    var toNone = (fx.end == 'none');
			    fx.end = (toNone ? jQuery.svg._getColour(fx.elem.parentNode, attrName) : jQuery.svg._getRGB(fx.end));
			    fx.end[3] = toNone;
			    jQuery(fx.elem).css(attrName, '');
			    fx.set = true;
			}
			var attr = fx.elem.attributes.getNamedItem(attrName);
			var colour = 'rgb(' + [
			    Math.min(Math.max(parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0], 10), 0), 255),
			    Math.min(Math.max(parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1], 10), 0), 255),
			    Math.min(Math.max(parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2], 10), 0), 255)
			].join(',') + ')';
			colour = (fx.end[3] && fx.state == 1 ? 'none' : colour);
			(attr ? attr.nodeValue = colour : fx.elem.setAttribute(attrName, colour));
		    }
		}
	       );

    /* Find this attribute value somewhere up the node hierarchy.
       @param  elem  (element) the starting element to find the attribute
       @param  attr  (string) the attribute name
       @return  (number[3]) RGB components for the attribute colour */
    jQuery.svg._getColour = function(elem, attr) {
	elem = jQuery(elem);
	var colour;
	do {
	    colour = elem.attr(attr) || elem.css(attr);
	    // Keep going until we find an element that has colour, or exit SVG
	    if ((colour != '' && colour != 'none') || elem.hasClass(jQuery.svg.markerClassName)) {
		break; 
	    }
	} while (elem = elem.parent());
	return jQuery.svg._getRGB(colour);
    };

    /* Parse strings looking for common colour formats.
       @param  colour  (string) colour description to parse
       @return  (number[3]) RGB components of this colour */
    jQuery.svg._getRGB = function(colour) {
	var result;
	// Check if we're already dealing with an array of colors
	if (colour && colour.constructor == Array) {
	    return (colour.length == 3 || colour.length == 4 ? colour : colours['none']);
	}
	// Look for rgb(num,num,num)
	if (result = /^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)jQuery/.exec(colour)) {
	    return [parseInt(result[1], 10), parseInt(result[2], 10), parseInt(result[3], 10)];
	}
	// Look for rgb(num%,num%,num%)
	if (result = /^rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)jQuery/.exec(colour)) {
	    return [parseFloat(result[1]) * 2.55, parseFloat(result[2]) * 2.55,
		    parseFloat(result[3]) * 2.55];
	}
	// Look for #a0b1c2
	if (result = /^#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})jQuery/.exec(colour)) {
	    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
	}
	// Look for #abc
	if (result = /^#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])jQuery/.exec(colour)) {
	    return [parseInt(result[1] + result[1], 16), parseInt(result[2] + result[2], 16),
		    parseInt(result[3] + result[3], 16)];
	}
	// Otherwise, we're most likely dealing with a named color
	return colours[jQuery.trim(colour).toLowerCase()] || colours['none'];
    };

    // The SVG named colours
    var colours = {
	'':						[255, 255, 255, 1],
	none:					[255, 255, 255, 1],
	aliceblue:				[240, 248, 255],
	antiquewhite:			[250, 235, 215],
	aqua:					[0, 255, 255],
	aquamarine:				[127, 255, 212],
	azure:					[240, 255, 255],
	beige:					[245, 245, 220],
	bisque:					[255, 228, 196],
	black:					[0, 0, 0],
	blanchedalmond:			[255, 235, 205],
	blue:					[0, 0, 255],
	blueviolet:				[138, 43, 226],
	brown:					[165, 42, 42],
	burlywood:				[222, 184, 135],
	cadetblue:				[95, 158, 160],
	chartreuse:				[127, 255, 0],
	chocolate:				[210, 105, 30],
	coral:					[255, 127, 80],
	cornflowerblue:			[100, 149, 237],
	cornsilk:				[255, 248, 220],
	crimson:				[220, 20, 60],
	cyan:					[0, 255, 255],
	darkblue:				[0, 0, 139],
	darkcyan:				[0, 139, 139],
	darkgoldenrod:			[184, 134, 11],
	darkgray:				[169, 169, 169],
	darkgreen:				[0, 100, 0],
	darkgrey:				[169, 169, 169],
	darkkhaki:				[189, 183, 107],
	darkmagenta:			[139, 0, 139],
	darkolivegreen:			[85, 107, 47],
	darkorange:				[255, 140, 0],
	darkorchid:				[153, 50, 204],
	darkred:				[139, 0, 0],
	darksalmon:				[233, 150, 122],
	darkseagreen:			[143, 188, 143],
	darkslateblue:			[72, 61, 139],
	darkslategray:			[47, 79, 79],
	darkslategrey:			[47, 79, 79],
	darkturquoise:			[0, 206, 209],
	darkviolet:				[148, 0, 211],
	deeppink:				[255, 20, 147],
	deepskyblue:			[0, 191, 255],
	dimgray:				[105, 105, 105],
	dimgrey:				[105, 105, 105],
	dodgerblue:				[30, 144, 255],
	firebrick:				[178, 34, 34],
	floralwhite:			[255, 250, 240],
	forestgreen:			[34, 139, 34],
	fuchsia:				[255, 0, 255],
	gainsboro:				[220, 220, 220],
	ghostwhite:				[248, 248, 255],
	gold:					[255, 215, 0],
	goldenrod:				[218, 165, 32],
	gray:					[128, 128, 128],
	grey:					[128, 128, 128],
	green:					[0, 128, 0],
	greenyellow:			[173, 255, 47],
	honeydew:				[240, 255, 240],
	hotpink:				[255, 105, 180],
	indianred:				[205, 92, 92],
	indigo:					[75, 0, 130],
	ivory:					[255, 255, 240],
	khaki:					[240, 230, 140],
	lavender:				[230, 230, 250],
	lavenderblush:			[255, 240, 245],
	lawngreen:				[124, 252, 0],
	lemonchiffon:			[255, 250, 205],
	lightblue:				[173, 216, 230],
	lightcoral:				[240, 128, 128],
	lightcyan:				[224, 255, 255],
	lightgoldenrodyellow:	[250, 250, 210],
	lightgray:				[211, 211, 211],
	lightgreen:				[144, 238, 144],
	lightgrey:				[211, 211, 211],
	lightpink:				[255, 182, 193],
	lightsalmon:			[255, 160, 122],
	lightseagreen:			[32, 178, 170],
	lightskyblue:			[135, 206, 250],
	lightslategray:			[119, 136, 153],
	lightslategrey:			[119, 136, 153],
	lightsteelblue:			[176, 196, 222],
	lightyellow:			[255, 255, 224],
	lime:					[0, 255, 0],
	limegreen:				[50, 205, 50],
	linen:					[250, 240, 230],
	magenta:				[255, 0, 255],
	maroon:					[128, 0, 0],
	mediumaquamarine:		[102, 205, 170],
	mediumblue:				[0, 0, 205],
	mediumorchid:			[186, 85, 211],
	mediumpurple:			[147, 112, 219],
	mediumseagreen:			[60, 179, 113],
	mediumslateblue:		[123, 104, 238],
	mediumspringgreen:		[0, 250, 154],
	mediumturquoise:		[72, 209, 204],
	mediumvioletred:		[199, 21, 133],
	midnightblue:			[25, 25, 112],
	mintcream:				[245, 255, 250],
	mistyrose:				[255, 228, 225],
	moccasin:				[255, 228, 181],
	navajowhite:			[255, 222, 173],
	navy:					[0, 0, 128],
	oldlace:				[253, 245, 230],
	olive:					[128, 128, 0],
	olivedrab:				[107, 142, 35],
	orange:					[255, 165, 0],
	orangered:				[255, 69, 0],
	orchid:					[218, 112, 214],
	palegoldenrod:			[238, 232, 170],
	palegreen:				[152, 251, 152],
	paleturquoise:			[175, 238, 238],
	palevioletred:			[219, 112, 147],
	papayawhip:				[255, 239, 213],
	peachpuff:				[255, 218, 185],
	peru:					[205, 133, 63],
	pink:					[255, 192, 203],
	plum:					[221, 160, 221],
	powderblue:				[176, 224, 230],
	purple:					[128, 0, 128],
	red:					[255, 0, 0],
	rosybrown:				[188, 143, 143],
	royalblue:				[65, 105, 225],
	saddlebrown:			[139, 69, 19],
	salmon:					[250, 128, 114],
	sandybrown:				[244, 164, 96],
	seagreen:				[46, 139, 87],
	seashell:				[255, 245, 238],
	sienna:					[160, 82, 45],
	silver:					[192, 192, 192],
	skyblue:				[135, 206, 235],
	slateblue:				[106, 90, 205],
	slategray:				[112, 128, 144],
	slategrey:				[112, 128, 144],
	snow:					[255, 250, 250],
	springgreen:			[0, 255, 127],
	steelblue:				[70, 130, 180],
	tan:					[210, 180, 140],
	teal:					[0, 128, 128],
	thistle:				[216, 191, 216],
	tomato:					[255, 99, 71],
	turquoise:				[64, 224, 208],
	violet:					[238, 130, 238],
	wheat:					[245, 222, 179],
	white:					[255, 255, 255],
	whitesmoke:				[245, 245, 245],
	yellow:					[255, 255, 0],
	yellowgreen:			[154, 205, 50]
    };

})(window);