/**
 * @class KBaseContigBrowser
 *
 * A KBase widget that displays an interactive view of a single contig. It 
 * comes with hooks for navigating up and downstream, and a number of
 * different view and styling options.
 *
 * Note: this relies on kbaseContigBrowser.css in order to be pretty.
 * 
 *       @example
 *       // Setting up the browser:
 *       var browser = $("#browserDiv").KBaseContigBrowser({
 *                                           contig: "kb|g.0.c.1",
 *                                           centerFeature: "kb|g.0.peg.3742",
 *                                           start: <first base>,
 *                                           length: <default num bases>,
 *
 *                                           onClickFunction: function(feature) { ... },
 *                                           onClickUrl: "http://kbase.us/....",
 *                                           allowResize: true,
 *                                           svgWidth: <pixels>,
 *                                           svgHeight: <pixels>,
 *                                           trackMargin: <pixels>,
 *                                           trackThickness: <pixels>,
 *                                           leftMargin: <pixels>,
 *                                           topMargin: <pixels>,
 *                                           arrowSize: <pixels>
 *                                       });
 *
 *        // And making buttons to control it:
 *        $("#contigFirstBase").click(function() { genomeWidget.moveLeftEnd(); });
 *        $("#contigLastBase").click(function()  { genomeWidget.moveRightEnd(); });
 *        $("#contigStepPrev").click(function()  { genomeWidget.moveLeftStep(); });
 *        $("#contigStepNext").click(function()  { genomeWidget.moveRightStep(); });
 *        $("#contigZoomIn").click(function()    { genomeWidget.zoomIn(); });
 *        $("#contigZoomOut").click(function()   { genomeWidget.zoomOut(); });
 */ 

(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseContigBrowser", 
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            contig: null,
            centerFeature: null,
            onClickUrl: null,
            allowResize: true,

            svgWidth: 500,              // all numbers = pixels.
            svgHeight: 100,
            trackMargin: 5,
            trackThickness: 15,
            leftMargin: 5,
            topMargin: 20,
            arrowSize: 10,

            start: 1,                   // except these two - they're contig positions
            length: 10000,

            embedInCard: false,
            showButtons: false,
            cardContainer: null,
            onClickFunction: null,

            width: 550,
            title: "Contig Browser"
        },

        cdmiURL: "http://kbase.us/services/cdmi_api",
        proteinInfoURL: "http://kbase.us/services/protein_info_service",
        workspaceURL: "http://kbase.us/services/workspace",
        tooltip: null,
        operonFeatures: [],
        $messagePane: null,

        init: function(options) {
            this._super(options);

            // 1. Check that needed options are present (basically contig)
            if (this.options.contig === null) {
                // throw an error.
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.proteinInfoClient = new ProteinInfo(this.proteinInfoURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);

            this.options.title += " - " + this.options.contig;
            this.render();

            var self = this;
            if (this.options.showButtons) {
                this.$elem.KBaseContigBrowserButtons({ browser: self });
            }

            this.options.onClickFunction = function(svgElement, feature) {
                self.trigger("featureClick", { feature: feature, featureElement: svgElement} );
            }
            return this;
        },


        /**
         * 
         */
        render: function() {
            this.loading(false);

            // tooltip inspired from
            // https://gist.github.com/1016860
            this.tooltip = d3.select("body")
                             .append("div")
                             .classed("kbcb-tooltip", true);

            // Init the SVG container to be the right size.
            this.svg = d3.select(this.$elem[0])
                         .append("svg")
                         .attr("width", this.options.svgWidth)
                         .attr("height", this.options.svgHeight)
                         .classed("kbcb-widget", true);

            this.trackContainer = this.svg.append("g");

            this.xScale = d3.scale.linear()
                            .domain([this.options.start, this.options.start + this.options.length])
                            .range([0, this.options.svgWidth]);

            this.xAxis = d3.svg.axis()
                           .scale(this.xScale)
                           .orient("top")
                           .tickFormat(d3.format(",.0f"));

            this.axisSvg = this.svg.append("g")
                               .attr("class", "kbcb-axis")
                               .attr("transform", "translate(0, " + this.options.topMargin + ")")
                               .call(this.xAxis);

            var self = this;
            $(window).on("resize", function() {
                self.resize();
            });

            // Kickstart the whole thing
            if (this.options.centerFeature != null)
                this.setCenterFeature(this.options.centerFeature);

            this.setContig();

            return this;
        },

        /**
         * An internal class used to define and calculate which features belong on which tracks.
         * A 'track' in this case is a horizontal representation of features on a contig. If
         * two features overlap on the contig, then they belong on separate tracks.
         *
         * This is only used internally to shuffle the features and avoid visual overlapping.
         */
        track: function() {
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
        },

        /**
         * Updates the internal representation of a contig to match what should be displayed.
         */
        setContig : function(contigId) {
            // If we're getting a new contig, then our central feature (if we have one)
            // isn't on it. So remove that center feature and its associated operon info.
            if (contigId && this.options.contig !== contigId) {
                this.options.centerFeature = null;
                this.operonFeatures = [];
                this.options.contig = contigId;
            }

            var self = this;

            this.cdmiClient.contigs_to_lengths([this.options.contig], function(contigLength) {
                self.contigLength = parseInt(contigLength[self.options.contig]);
                self.options.start = 0;
                if (self.options.length > self.contigLength)
                    self.options.length = self.contigLength;
            });

            if (this.options.centerFeature) {
                this.setCenterFeature();
            }
            else {
                this.update();
            }
        },

        setCenterFeature : function(centerFeature) {
            // if we're getting a new center feature, make sure to update the operon features, too.
            if (centerFeature)
                this.options.centerFeature = centerFeature;

            var self = this;
            this.proteinInfoClient.fids_to_operons([this.options.centerFeature],
                // on success
                function(operonGenes) {
                    self.operonFeatures = operonGenes[self.options.centerFeature];
                    self.update();
                },
                // on error
                function(error) {
                    self.throwError(error);
                }
            );
        },

        setGenome : function(genomeId) {
            this.options.genomeId = genomeId;
            var genomeList = cdmiAPI.genomes_to_contigs([genomeId], function(genomeList) {
                setContig(this.genomeList[genomeId][0]);
            });
        },

        setRange : function(start, length) {
            // set range and re-render
            this.options.start = start;
            this.options.length = length;
            this.update();
        },

        /*
         * Figures out which track each feature should be on, based on starting point and length.
         */
        processFeatures : function(features) {
            var tracks = [];
            tracks[0] = this.track(); //init with one track.

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

            // var self = this;
            // if (this.options.centerFeature) {
            //     operonGenes = this.proteinInfoClient.fids_to_operons([this.options.centerFeature], 
            //         //on success
            //         function(operonGenes) {
            //             operonGenes = operonGenes[self.options.centerFeature];

            //         }
            //     );
            // }

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
                    tracks[next] = this.track();
                    tracks[next].addRegion(feature.feature_location);
                    feature.track = next;
                }
            }

            this.numTracks = tracks.length;
            return features;
        },

        update : function(useCenter) {

            // exposes 'this' to callbacks through closure.
            // otherwise 'this' refers to the state within the closure.
            // ... i think. This kinda tangle makes my head hurt.
            // Either way, this is the deepest chain of callbacks in here, so it should be okay.
            var self = this;

            var renderFromCenter = function(feature) {
                if (feature) {
                    feature = feature[self.options.centerFeature];
                    self.options.start = Math.max(0, Math.floor(parseInt(feature.feature_location[0][1]) + (parseInt(feature.feature_location[0][3])/2) - (self.options.length/2)));
                }
                else {
                    window.alert("Error: fid '" + self.options.centerFeature + "' not found! Continuing with original range...");
                }
                self.cdmiClient.region_to_fids([self.options.contig, self.options.start, '+', self.options.length], getFeatureData);
            };

            var getFeatureData = function(fids) {
                self.cdmiClient.fids_to_feature_data(fids, getOperonData);
            };

            var getOperonData = function(features) {
                if(self.options.centerFeature) {
                    for (var j in features) {
                        for (var i in self.operonFeatures) {
                            if (features[j].feature_id === self.operonFeatures[i])
                                features[j].isInOperon = 1;
                        }
                    }
                }
                self.renderFromRange(features);
            };

            if (self.options.centerFeature && useCenter)
                self.cdmiClient.fids_to_feature_data([self.options.centerFeature], renderFromCenter);
            else
                self.cdmiClient.region_to_fids([self.options.contig, self.options.start, '+', self.options.length], getFeatureData);
        },

        adjustHeight : function() {
            var neededHeight = this.numTracks * 
                               (this.options.trackThickness + this.options.trackMargin) + 
                               this.options.topMargin + this.options.trackMargin;

            if (neededHeight > this.svg.attr("height")) {
                this.svg.attr("height", neededHeight);
            }
        },

        renderFromRange : function(features) {
            features = this.processFeatures(features);

            // expose 'this' to d3 anonymous functions through closure
            var self = this;

            if (this.options.allowResize)
                this.adjustHeight();

            var trackSet = this.trackContainer.selectAll("path")
                                              .data(features, function(d) { return d.feature_id; });

            trackSet.enter()
                    .append("path")
                         .classed("kbcb-feature", true)  // incl feature_type later (needs call to get_entity_Feature?)
                         .classed("kbcb-operon", function(d) { return self.isOperonFeature(d); })
                         .classed("kbcb-center", function(d) { return self.isCenterFeature(d); })
                         .attr("id", function(d) { return d.feature_id; })
                         .on("mouseover", 
                                function(d) { 
                                    d3.select(this).style("fill", d3.rgb(d3.select(this).style("fill")).darker()); 
                                    self.tooltip = self.tooltip.text(d.feature_id + ": " + d.feature_function);
                                    return self.tooltip.style("visibility", "visible"); 
                                }
                            )
                         .on("mouseout", 
                                function() { 
                                    d3.select(this).style("fill", d3.rgb(d3.select(this).style("fill")).brighter()); 
                                    return self.tooltip.style("visibility", "hidden"); 
                                }
                            )
                         .on("mousemove", 
                                function() { 
                                    return self.tooltip.style("top", (d3.event.pageY+15) + "px").style("left", (d3.event.pageX-10)+"px");
                                }
                            )
                         .on("click", 
                                function(d) { 
                                    if (self.options.onClickFunction) {
                                        self.options.onClickFunction(this, d);
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
                              .domain([self.options.start, self.options.start + self.options.length]);
            
            

            self.xAxis = self.xAxis
                             .scale(self.xScale);
            
            self.axisSvg.call(self.xAxis);
            
            self.resize();
            this.loading(true);
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

            if (width > this.options.arrowSize) {
                // line to arrow top-back
                path += " L" + (left+(width-this.options.arrowSize)) + " " + top +
                // line to arrow tip
                        " L" + (left+width) + " " + (top+height/2) +
                // line to arrow bottom-back
                        " L" + (left+(width-this.options.arrowSize)) + " " + (top+height) +
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

            if (width > this.options.arrowSize) {
                // line to arrow top-back
                path += " L" + (left+this.options.arrowSize) + " " + top +
                // line to arrow tip
                        " L" + left + " " + (top+height/2) +
                // line to arrow bottom-back
                        " L" + (left+this.options.arrowSize) + " " + (top+height) +
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

            return (x - this.options.start) / this.options.length * this.options.svgWidth + this.options.leftMargin;    
        },

        calcYCoord : function(location, track) {
            return this.options.topMargin + this.options.trackMargin + (this.options.trackMargin * track) + (this.options.trackThickness * track);
        },

        calcWidth : function(location) {
            return location[3] / this.options.length * this.options.svgWidth;
        },

        calcHeight : function(location) {
            return this.options.trackThickness;
        },

        isCenterFeature : function(feature) {
            return feature.feature_id === this.options.centerFeature;
        },

        isOperonFeature : function(feature) {
            return feature.isInOperon;
        },

        calcFillColor : function(feature) {
            if (feature.feature_id === this.options.centerFeature)
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

            // if (d3.select(element).attr("id") === feature.feature_id &&
            //  d3.select(element).classed("highlight")) {
            //  this.recenter(feature);
            // }
            // else {
            //  d3.select(".highlight")
            //    .classed("highlight", false)
            //    .style("fill", function(d) { return calcFillColor(d); } );

            //  d3.select(element)
            //    .classed("highlight", true)
            //    .style("fill", "yellow");
            // }
        },

        recenter : function(feature) {
            centerFeature = feature.feature_id;
            if (this.options.onClickUrl)
                this.options.onClickUrl(feature.feature_id);
            else
                this.update(true);
        },      

        resize : function() {
            var newWidth = Math.min(this.$elem.parent().width(), this.options.svgWidth);
            this.svg.attr("width", newWidth);
        },

        moveLeftEnd : function() {
            this.options.start = 0;
            this.update();
        },

        moveLeftStep : function() {
            this.options.start = Math.max(0, this.options.start - Math.ceil(this.options.length/2));
            this.update();
        },

        zoomIn : function() {
            this.options.start = Math.min(this.contigLength-Math.ceil(this.options.length/2), this.options.start + Math.ceil(this.options.length/4));
            this.options.length = Math.max(1, Math.ceil(this.options.length/2));
            this.update();
        },

        zoomOut : function() {
            this.options.length = Math.min(this.contigLength, this.options.length*2);
            this.options.start = Math.max(0, this.options.start - Math.ceil(this.options.length/4));
            if (this.options.start + this.options.length > this.contigLength)
                this.options.start = this.contigLength - this.options.length;
            this.update();
        },

        moveRightStep : function() {
            this.options.start = Math.min(this.options.start + Math.ceil(this.options.length/2), this.contigLength - this.options.length);
            this.update();
        },

        /**
         * Moves the viewport to the right end (furthest downstream) of the contig, maintaining the 
         * current view window size.
         * @method
         */
        moveRightEnd : function() {
            this.options.start = this.contigLength - this.options.length;
            this.update();
        },

        loading: function(doneLoading) {
            if (doneLoading)
                this.hideMessage();
            else
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },

        getData: function() {
            return {
                type: "Contig",
                id: this.options.contig,
                workspace: this.options.workspaceID
            };
        },

    });

})( jQuery );