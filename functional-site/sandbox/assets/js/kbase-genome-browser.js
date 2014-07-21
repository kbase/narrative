/*
 * KBase Genome Browser Widget
 * ---------------------------
 * This is designed as a widget to be inserted where ever it's needed.
 * 
 * Usage:
 * ContigWidget.makeContigWidget(options, onFinishCallback)
 *
 * In order for this to work properly, it needs either a 'feature' or 'contig' option.
 * A feature is just a KBase feature ID. If this is given, the browser will start centered
 * around that feature (inferring the contig from the feature), ignoring the 'start' option.
 * Note that this also overrides the 'contig' option. If both are given, then the feature is used.
 * 
 * A contig is a KBase contig ID. If this is given, then it uses the (optional) start and length
 * parameters to initialize a starting window.
 * 
 * Once the widget is constructed (this is an asynchronous process), onFinishCallback is invoked
 * with the widget as the only parameter. You can do whatever you want with it there - store it
 * as a global, make it respond to some event handler, etc.
 * 
 * List of options:
 * contig            - ID of the contig to display
 * feature           - ID of the feature to center on
 * svgHeight         - height of SVG in pixels (default 1000)
 * svgWidth          - width of SVG in pixels (default 100)
 * target            - target div id for the SVG (default 'body')
 * start             - starting base to display (default 1)
 * length            - number of bases to display (default 10000)
 * arrowSize		 - length of the arrow in pixels (default 10)
 * trackThickness    - width of a track (e.g. the height of each contig arrow)
 * onClickUrl		 - URL to be directed to when a feature is clicked 
 * onClickFunction   - specific function to be called when a feature is clicked
 * allowResize		 - if 'true', allow the track SVG to automatically resize itself to fit its containing div
 * btnZoomIn		 - the id of the button that should trigger a zoom in event
 * btnZoomOut        - the id of the button that should trigger a zoom out event
 * btnFirstBase      - id of the button that shows the browser from the first base
 * btnLastBase       - id of the button that moves the viewer to the last base
 * btnStepPrev		 - id of the button that steps the viewer toward the first base
 * btnStepPrev       - id of the button that steps the viewer toward the last base
 *   
 * 
 * Example:
 * ContigWidget.makeContigWidget(
 *		{ 
 *			'target'	   : 'browser',
 *			'svgWidth'     : 1000,
 *			'svgHeight'    : 100,
 *			'feature'      : thefid,
 *			'onClickUrl'   : 'feature_tab_menu.html?id=',
 *			'allowResize'  : true,
 *			'btnZoomIn'    : 'contigZoomIn',
 *			'btnZoomOut'   : 'contigZoomOut',
 *			'btnFirstBase' : 'contigFirstBase',
 *			'btnLastBase'  : 'contigLastBase',
 *			'btnStepPrev'  : 'contigStepPrev',
 *			'btnStepNext'  : 'contigStepNext'
 *		},
 *		function(widget) {
 *			$('a[data-toggle="tab"]').on('shown', function(event) {
 *				if (event.target.href.indexOf("#contig-nav") != -1) {
 *					widget.resize();
 *				}
 *			});
 *		}
 *	)
 *
 * Bill Riehl
 * wjriehl@lbl.gov
 * Lawrence Berkeley National Lab
 * October 23, 2012
 * -------------------------------
 * Updated April 19, 2013
 */

var ContigWidget = (function () {

	// global API definitions
	var apiURL = "http://www.kbase.us/services/cdmi_api/";
	var proteinInfoURL = "http://kbase.us/services/protein_info_service/";
	var cdmiAPI = new CDMI_API(apiURL);
	var entityAPI = new CDMI_EntityAPI(apiURL);
	var proteinInfoAPI = new ProteinInfo(proteinInfoURL);


	// tooltip inspired from
	// https://gist.github.com/1016860
	var tooltip = d3.select("body")
					.append("div")
					.style("position", "absolute")
					.style("z-index", "10")
					.style("visibility", "hidden")
					.style("opacity", "0.8")
					.style("background-color", "#222222")
					.style("color", "#FFF")
					.style("padding", "0.5em")
					.text("");

	// Make a track object.
	var track = function() {
		var that = {};

		that.regions = [];
		that.min = Infinity;
		that.max = -Infinity;
		that.numRegions = 0;

		that.addRegion = function(feature_location) {
			for (var i=0; i<feature_location.length; i++) {

				var start = Number(feature_location[i][1]);
				var length = Number(feature_location[i][3]);
				var end = start + length;

				if (start > end) {
					var x = end;
					end = start;
					start = x;
				}

				this.regions.push([start, end]);
				if (start < this.min)
					this.min = start;
				if (end > this.max)
					this.max = end;
				this.numRegions++;
			}
		};

		that.hasOverlap = function(feature_location) {
			for (var i=0; i<feature_location.length; i++) {
				var start = Number(feature_location[i][1]);
				var length = Number(feature_location[i][3]);
				var end = (feature_location[i][2] === "+" ? start + length - 1 :
															start - length + 1);

				// double check the orientation
				if (start > end) {
					var x = end;
					end = start;
					start = x;
				}

				/* cases:
				 * simple ones:
				 *  [start, end] [min]
				 *  [max] [start, end]
				 * less simple:
				 *  look over all regions
				 */
				for (var ii=0; ii<this.regions.length; ii++) {
					var region = this.regions[ii];
					// region = [start,end] pair
					if ((start >= region[0] && start <= region[1]) ||
						(end >= region[0] && end <= region[1]) ||
						(start <= region[0] && end >= region[1])) {
						return true;
					}
				}
				
			}
			return false;
		};

		return that;
	};

	var constructWidget = function(contig, options) {

		var contigWidget = {
			numTracks : 0,
			centerFeature : "",
			svgWidth : 1000,
			svgHeight : 500,
			trackMargin : 5,
			trackThickness : 15,
			leftMargin : 5,
			topMargin : 20,
			arrowSize : 10,
			allowResize : false,
			start : 1,
			length : 10000,
			target : "body",

			updateContig : function(contigId) {
				this.contig = contigId;
				var self = this;

				cdmiAPI.contigs_to_lengths([this.contig], function(contigLength) {
					self.contigLength = parseInt(contigLength[self.contig]);
					self.start = 0;
					if (self.length > self.contigLength)
						self.length = self.contigLength;
				});
			},

			setGenome : function(genomeId) {
				this.genomeId = genomeId;
				var genomeList = cdmiAPI.genomes_to_contigs([genomeId], function(genomeList) {
					// populate the contig dropdown with the list of contigs, and start with the first one.
					setContig(this.genomeList[genomeId][0]);
				});
			},

			setContig : function(contigId) {
				// set contig info and re-render
				this.updateContig(contigId);
				this.updateWidget();
			},

			setRange : function(start, length) {
				// set range and re-render
				this.start = start;
				this.length = length;
				this.updateWidget();
			},

			/*
			 * Figures out which track each feature should be on, based on starting point and length.
			 */
			processFeatures : function(features) {
				var tracks = [];
				tracks[0] = track(); //init with one track.

				// First, transform features into an array instead of an object.
				// eg., take it from {'fid' : <feature object>, 'fid' : <feature object> }
				// to [<feature object>, <feature object> ... ]

				var feature_arr = [];
				for (fid in features) {
					feature_arr.push(features[fid]);
				}

				features = feature_arr;

				// First, sort the features by their start location (first pass = features[fid].feature_location[0][1], later include strand)
				features.sort(function(a, b) {
					return a.feature_location[0][1] - b.feature_location[0][1];
				});

				var self = this;
				if (this.centerFeature) {
					operonGenes = proteinInfoAPI.fids_to_operons([this.centerFeature], 
						//on success
						function(operonGenes) {
							operonGenes = operonGenes[self.centerFeature];

						}
					);
				}

				// Foreach feature...
				for (var j=0; j<features.length; j++) {
					var feature = features[j];

					// Look for an open spot in each track, fill it in the first one we get to, and label that feature with the track.
					var start = Number(feature.feature_location[0][1]);
					var length = Number(feature.feature_location[0][3]);
					var end;

					if (feature.feature_location[0][2] === "+") {
						end = start + length - 1;
					}
					else {
						start = start - length + 1;
						end = start + length;
					}

					for (var i=0; i<tracks.length; i++) {
						if (!(tracks[i].hasOverlap(feature.feature_location))) {
							tracks[i].addRegion(feature.feature_location);
							feature.track = i;
							break;
						}
					}
					// if our feature doesn't have a track yet, then they're all full in that region.
					// So make a new track and this feature to it!
					if (feature.track === undefined) {
						var next = tracks.length;
						tracks[next] = track();
						tracks[next].addRegion(feature.feature_location);
						feature.track = next;
					}
				}

				numTracks = tracks.length;
				return features;
			},

			updateWidget : function(useCenter) {
				// updates the widget based on loaded info.
				// fetches all feature info in the range and renders the d3 object.
				$("#contigBrowserLoading").removeClass("hidden");
				$("#contigBrowserContainer").addClass("hidden");

				// exposes 'this' to callbacks through closure.
				// otherwise 'this' refers to the state within the closure.
				// ... i think. This kinda tangle makes my head hurt.
				// Either way, this is the deepest chain of callbacks in here, so it should be okay.
				var self = this;


				var renderFromCenter = function(feature) {
					if (feature) {
						feature = feature[centerFeature];
						self.start = Math.max(0, Math.floor(parseInt(feature.feature_location[0][1]) + (parseInt(feature.feature_location[0][3])/2) - (self.length/2)));
					}
					else {
						window.alert("Error: fid '" + this.centerFeature + "' not found! Continuing with original range...");
					}
					cdmiAPI.region_to_fids([self.contig, self.start, '+', self.length], getFeatureData);
				};

				var getFeatureData = function(fids) {
			 		cdmiAPI.fids_to_feature_data(fids, getOperonData);
				};

				var getOperonData = function(features) {
					if(self.centerFeature) {
						proteinInfoAPI.fids_to_operons([self.centerFeature],
							function(operonGenes) {
								operonGenes = operonGenes[self.centerFeature];
								for (var j in features) {
									for (var i in operonGenes)
									{
										if (features[j].feature_id === operonGenes[i])
											features[j].isInOperon = 1;
									}
								}

								self.renderFromRange(features);
							}
						);
					}
					else {
						self.renderFromRange(features);
					}
				};

				if (self.centerFeature && useCenter)
					cdmiAPI.fids_to_feature_data([self.centerFeature], renderFromCenter);
				else
					cdmiAPI.region_to_fids([self.contig, self.start, '+', self.length], getFeatureData);
			},

			adjustHeight : function() {
				var neededHeight = this.numTracks * (this.trackThickness + this.trackMargin) + this.topMargin + this.trackMargin;

				if (neededHeight > d3.select("#contigWidget").attr("height")) {
					d3.select("#contigWidget")
					  .attr("height", neededHeight);
				}
			},

			renderFromRange : function(features) {
				features = this.processFeatures(features);

				// expose 'this' to d3 anonymous functions through closure
				var self = this;

				if (this.allowResize)
					this.adjustHeight();

				var trackSet = this.trackContainer.selectAll("path")
								                  .data(features, function(d) { return d.feature_id; });

				trackSet.enter()
		  			 	.append("path")
		      			 	 .attr("class", "feature")  // incl feature_type later (needs call to get_entity_Feature?)
				  			 .attr("id", function(d) { return d.feature_id; })
							 .attr("stroke", "black")
							 .attr("fill", function(d) { return self.calcFillColor(d); })
							 .on("mouseover", 
							 		function(d) { 
							 			d3.select(this).style("fill", d3.rgb(d3.select(this).style("fill")).darker()); 
							 			tooltip = tooltip.text(d.feature_id + ": " + d.feature_function);
							 			return tooltip.style("visibility", "visible"); 
							 		}
							 	)
							 .on("mouseout", 
							 		function() { 
							 			d3.select(this).style("fill", d3.rgb(d3.select(this).style("fill")).brighter()); 
							 			return tooltip.style("visibility", "hidden"); 
							 		}
							 	)
							 .on("mousemove", 
							 		function() { 
							 			return tooltip.style("top", (d3.event.pageY+15) + "px").style("left", (d3.event.pageX-10)+"px");
							 		}
							 	)
							 .on("click", 
							 		function(d) { 
							 			if (self.onClickFunction) {
							 				self.onClickFunction(this, d);
							 			}
							 			else {
							 				self.highlight(this, d); 
							 			}
							 		}
							 	);

				trackSet.exit()
						.remove();

				trackSet.attr("d", function(d) { return self.featurePath(d); });



				
				self.xScale = self.xScale
						  		  .domain([self.start, self.start + self.length]);
				
				

				self.xAxis = self.xAxis
							     .scale(self.xScale);
		        
				self.axisSvg.call(self.xAxis);
		        
				$("#contigBrowserLoading").addClass("hidden");
				$("#contigBrowserContainer").removeClass("hidden");
				self.resize();
			},

			featurePath : function(feature) {
				var path = "";

				var coords = [];

				// draw an arrow for each location.
				for (var i=0; i<feature.feature_location.length; i++) {
					var location = feature.feature_location[i];

					var left = this.calcXCoord(location);
					var top = this.calcYCoord(location, feature.track);
					var height = this.calcHeight(location);
					var width = this.calcWidth(location);

					coords.push([left, left+width]);

					if (location[2] === '+')
						path += this.featurePathRight(left, top, height, width) + " ";
					else
						path += this.featurePathLeft(left, top, height, width) + " ";
				}

				// if there's more than one path, connect the arrows with line segments
				if (feature.feature_location.length > 1) {
					// sort them
					coords.sort(function(a, b) {
						return a[0] - b[0];
					});

					var mid = this.calcYCoord(feature.feature_location[0], feature.track) + 
							  this.calcHeight(feature.feature_location[0])/2;

					for (var i=0; i<coords.length-1; i++) {
						path += "M" + coords[i][1] + " " + mid + " L" + coords[i+1][0] + " " + mid + " Z ";
					}
					// connect the dots
				}
				return path;
			},

			featurePathRight : function(left, top, height, width) {
				// top left
				var path = "M" + left + " " + top;

				if (width > this.arrowSize) {
					// line to arrow top-back
					path += " L" + (left+(width-this.arrowSize)) + " " + top +
					// line to arrow tip
							" L" + (left+width) + " " + (top+height/2) +
					// line to arrow bottom-back
							" L" + (left+(width-this.arrowSize)) + " " + (top+height) +
					// line to bottom-left edge
							" L" + left + " " + (top+height) + " Z";
				}
				else {
					// line to arrow tip
					path += " L" + (left+width) + " " + (top+height/2) +
					// line to arrow bottom
							" L" + left + " " + (top+height) + " Z";
				}
				return path;
			},

			featurePathLeft : function(left, top, height, width) {
				// top right
				var path = "M" + (left+width) + " " + top;

				if (width > this.arrowSize) {
					// line to arrow top-back
					path += " L" + (left+this.arrowSize) + " " + top +
					// line to arrow tip
							" L" + left + " " + (top+height/2) +
					// line to arrow bottom-back
							" L" + (left+this.arrowSize) + " " + (top+height) +
					// line to bottom-right edge
							" L" + (left+width) + " " + (top+height) + " Z";
				}
				else {
					// line to arrow tip
					path += " L" + left + " " + (top+height/2) +
					// line to arrow bottom
							" L" + (left+width) + " " + (top+height) + " Z";
				}
				return path;
			},

			calcXCoord : function(location) {
				var x = location[1];
				if (location[2] === "-")
					x = location[1] - location[3];

				return (x - this.start) / this.length * this.svgWidth + this.leftMargin;	
			},

			calcYCoord : function(location, track) {
				return this.topMargin + this.trackMargin + (this.trackMargin * track) + (this.trackThickness * track);
			},

			calcWidth : function(location) {
				return location[3] / this.length * this.svgWidth;
			},

			calcHeight : function(location) {
				return this.trackThickness;
			},

			calcFillColor : function(feature) {
				if (feature.feature_id === this.centerFeature)
					return "#00F";
				if (feature.isInOperon === 1)
					return "#0F0";
				return "#F00";
				// should return color based on feature type e.g. CDS vs. PEG vs. RNA vs. ...
			},

			highlight : function(element, feature) {
				// unhighlight others - only highlight one at a time.
				// if ours is highlighted, recenter on it.

				
				this.recenter(feature);
				return; // skip the rest for now.

				if (d3.select(element).attr("id") === feature.feature_id &&
					d3.select(element).classed("highlight")) {
					this.recenter(feature);
				}
				else {
					d3.select(".highlight")
					  .classed("highlight", false)
					  .style("fill", function(d) { return calcFillColor(d); } );

					d3.select(element)
					  .classed("highlight", true)
					  .style("fill", "yellow");
				}
			},

			recenter : function(feature) {
				centerFeature = feature.feature_id;
				if (this.onClickUrl)
					this.onClickUrl(feature.feature_id);
				else
					this.updateWidget(true);
			},

			init : function() {

				// initialize the widget DOM & SVG elements. Buttons and such.
				// then make the widget.
				if (this.target.charAt[0] !== '#')
					this.target = "#" + this.target;

				// Init the SVG container to be the right size.
				this.svg = d3.select(this.target)
							 .append("svg")
							 .attr("width", this.svgWidth)
							 .attr("height", this.svgHeight)
							 .attr("id", "contigWidget");

				this.trackContainer = this.svg.append("g");

				this.xScale = d3.scale.linear()
						  		.domain([this.start, this.start + this.length])
						  		.range([0, this.svgWidth]);

				this.xAxis = d3.svg.axis()
							   .scale(this.xScale)
							   .orient("top")
							   .tickFormat(d3.format(",.0f"));

				this.axisSvg = this.svg.append("g")
								   .attr("class", "axis")
								   .attr("transform", "translate(0, " + this.topMargin + ")")
								   .call(this.xAxis);

				this.updateWidget(true);

				var self = this;
				$(window).on("resize", function() {
				    self.resize();
				});

				$(this.target).on('shown')

				this.resize();
				return this;
			},

			resize : function() {
				var newWidth = Math.min($("#contigWidget").parent().width(), this.svgWidth);
				this.svg.attr("width", newWidth);
			},

			moveLeftEnd : function() {
				this.start = 0;
				this.updateWidget();
			},

			moveLeftStep : function() {
				this.start = Math.max(0, this.start - Math.ceil(this.length/2));
				this.updateWidget();
			},

			zoomIn : function() {
				this.start = Math.min(this.contigLength-Math.ceil(this.length/2), this.start + Math.ceil(this.length/4));
				this.length = Math.max(1, Math.ceil(this.length/2));
				this.updateWidget();
			},

			zoomOut : function() {
				this.length = Math.min(this.contigLength, this.length*2);
				this.start = Math.max(0, this.start - Math.ceil(this.length/4));
				if (this.start + this.length > this.contigLength)
					this.start = this.contigLength - this.length;
				this.updateWidget();
			},

			moveRightStep : function() {
				this.start = Math.min(this.start + Math.ceil(this.length/2), this.contigLength - this.length);
				this.updateWidget();
			},

			moveRightEnd : function() {
				this.start = this.contigLength - this.length;
				this.updateWidget();
			},
		};

		var keyList = Object.keys(options);
		for (var key in keyList) {
			if (keyList[key] === "onClickUrl") {
				contigWidget.onClickUrl = function(id) {
					window.open(options.onClickUrl + id, "_self");
				}
			} else if (keyList[key] === "feature") {
				contigWidget.centerFeature = options.feature;
			} else if (keyList[key] === "btnZoomIn") {
				// register the zoom in onClick event with that id
				$("#" + options.btnZoomIn).click(function() {
					contigWidget.zoomIn();
				});
			} else if (keyList[key] === "btnZoomOut") {
				$("#" + options.btnZoomOut).click(function() {
					contigWidget.zoomOut();
				});
			} else if (keyList[key] === "btnFirstBase") {
				$("#" + options.btnFirstBase).click(function() {
					contigWidget.moveLeftEnd();
				});
			} else if (keyList[key] === "btnLastBase") {
				$("#" + options.btnLastBase).click(function() {
					contigWidget.moveRightEnd();
				});
			} else if (keyList[key] === "btnStepPrev") {
				$("#" + options.btnStepPrev).click(function() {
					contigWidget.moveLeftStep();
				});
			} else if (keyList[key] === "btnStepNext") {
				$("#" + options.btnStepNext).click(function() {
					contigWidget.moveRightStep();
				})
			}

			else {
				contigWidget[keyList[key]] = options[keyList[key]];
			}
		}



		contigWidget.updateContig(contig);

		return contigWidget;
	}



	/**
	 * function: genomeWidget(contig, start, length, target)
	 * params:
	 *   contig = KBase id of the desired contig
	 *   start = starting base of the contig for rendering (i.e. left side of the widget)
	 *   length = length of the contig region of interest in bp
	 *   target = the DOM target id for the widget
	 */


	 /**
	  * available options:
	  *
	  * svgHeight         - height of SVG in pixels
	  * svgWidth          - width of SVG in pixels
	  * target            - target div id for the SVG
	  * contig **         - ID of the contig to display
	  * start             - starting base to display
	  * length            - number of bases to display
	  * feature **        - ID of the feature to center on
	  * arrowSize		  - length of the arrow in pixels
	  * trackThickness    - width of a track (e.g. the height of each contig arrow)
	  * onClickUrl		  - URL to be directed to when a feature is clicked 
	  * onClickFunction   - specific function to be called when a feature is clicked
	  * allowResize		  - if 'true', allow the track SVG to automatically resize itself to fit its containing div
	  * btnZoomIn		  - the id of the button that should trigger a zoom in event
	  * btnZoomOut        - the id of the button that should trigger a zoom out event
	  * btnFirstBase      - id of the button that shows the browser from the first base
	  * btnLastBase       - id of the button that moves the viewer to the last base
	  * btnStepPrev		  - id of the button that steps the viewer toward the first base
	  * btnStepPrev       - id of the button that steps the viewer toward the last base
	  *
	  * Note that 'contig' and 'feature' are mutually exclusive.
	  * If a feature ID is given, then the browser centers on that, and ignores the contig.
	  * If a contig ID is given (and NOT a feature ID), then it is displayed from the 'start' base.
	  * If neither of those are given, then an error is thrown.
	  */


	var makeContigWidget = function(options, onFinish) {
		/* Logic:
		 * If there's a feature and no contig, get the feature data and send everything to
		 * makeContigWidgetFromFeature
		 *
		 * If there'a a contig and not feature, send it to
		 * makeContigWidgetFromContig
		 * 
		 * If 
		 */

		if (!options) {
			window.alert("Error: 'options' parameter missing!\nUnable to construct contig viewer!");
			return;
		}

		var widget;

		if (options.hasOwnProperty("feature")) {
			// keep the same length, but center the widget around the given feature.
			// throw an error if it isn't found.

			centerFeature = options.feature;

			// figure out contig from the feature id
			var featureData = cdmiAPI.fids_to_feature_data([centerFeature], 
			
				function(featureData) {
					options.contig = featureData[centerFeature].feature_location[0][0];
					var widget = constructWidget(options.contig, options);
					widget = widget.init();

					if (onFinish)
						onFinish(widget);
				},

				function(error) {
					window.alert("Error: unknown Feature ID: '" + centerFeature + "'");
				}
			);
		}
		else if (options.hasOwnProperty("contig")) {
			// use the contig to set things up.
			var contig = options.contig;
			var widget = constructWidget(contig, options);
			widget = widget.init(); 

			if(onFinish)
				onFinish(widget);
		}
		else {
			window.alert("Error: contig information not found!\nUnable to construct contig viewer!");
		}
	};

	return {
		makeContigWidget: makeContigWidget,
	};
})();