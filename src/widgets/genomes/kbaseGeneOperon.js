/**
 * Shows general gene info.
 * Such as its name, synonyms, annotation, publications, etc.
 *
 * Gene "instance" info (e.g. coordinates on a particular strain's genome)
 * is in a different widget.
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGeneOperon",
        parent: "kbaseWidget",
        version: "1.0.0",

        options: {
            featureID: null,
            auth: null,
            loadingImage: null,

            svgWidth: 500,              // all numbers = pixels.
            svgHeight: 100,
            trackMargin: 5,
            trackThickness: 15,
            leftMargin: 5,
            topMargin: 20,
            arrowSize: 10,

            start: 0,
            length: 0,
            width: 550,
            
        },

        cdmiURL: "https://kbase.us/services/cdmi_api",
        workspaceURL: "https://kbase.us/services/workspace",
        proteinInfoURL: "https://kbase.us/services/protein_info_service",

        init: function(options) {
            this._super(options);
            console.log("fid");
            console.log(this.options.featureID);

            if (this.options.featureID === null) {
                //throw an error.
                return this;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);
            this.proteinInfoClient = new ProteinInfo(this.proteinInfoURL);

            return this.render();
        },

        renderOld: function(options) {
            if (this.options.loadingImage)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");

            var self = this;
            this.proteinInfoClient.fids_to_operons([this.options.featureID],
                function(operons) {
                    operons = operons[self.options.featureID];

                    var operonStr = "Feature not part of an operon.";
                    if (operons && operons.length > 1) {
                        operonStr = "";
                        for (var i in operons) {
                            operonStr += operons[i] + " ";
                        }
                    }
                    self.$elem.append(operonStr);

                    self.hideMessage();
                },

                this.clientError
            );

            return this;
        },

        /**
         * 
         */
        render: function() {
            if (this.options.loadingImage)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");



            var self = this;
            this.proteinInfoClient.fids_to_operons([this.options.featureID],
                function(operon) {
                    operon = operon[self.options.featureID];

                    var operonStr = "Feature not part of an operon.";
                    if (operon && operon.length > 1) {
                        // tooltip inspired from
                        // https://gist.github.com/1016860
                        self.tooltip = d3.select("body")
                                         .append("div")
                                         .classed("kbcb-tooltip", true);

                        // Init the SVG container to be the right size.
                        self.svg = d3.select(self.$elem[0])
                                     .append("svg")
                                     .attr("width", self.options.svgWidth)
                                     .attr("height", self.options.svgHeight)
                                     .classed("kbcb-widget", true);

                        self.trackContainer = self.svg.append("g");

                        self.xScale = d3.scale.linear()
                                        .domain([self.options.start, self.options.start + self.options.length])
                                        .range([0, self.options.svgWidth]);

                        self.xAxis = d3.svg.axis()
                                       .scale(self.xScale)
                                       .orient("top")
                                       .tickFormat(d3.format(",.0f"));

                        self.axisSvg = self.svg.append("g")
                                           .attr("class", "kbcb-axis")
                                           .attr("transform", "translate(0, " + self.options.topMargin + ")")
                                           .call(self.xAxis);
                        self.cdmiClient.fids_to_feature_data(operon, 
                            function(features) {
                                self.renderFromRange(features);
                            }, self.clientError);

                        // console.log(operons);
                        // operonStr = "";
                        // for (var i in operons) {
                        //     operonStr += operons[i] + " ";
                        // }
                    }
                    else
                        self.$elem.append(operonStr);

                    self.hideMessage();
                },

                this.clientError
            );


            // var self = this;
            // $(window).on("resize", function() {
            //     self.resize();
            // });

            // Kickstart the whole thing
            // if (this.options.centerFeature != null)
            //     this.setCenterFeature(this.options.centerFeature);

//            this.setContig();

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
                    var end = (feature_location[i][2] === "+" ? start + length - 1
                                                              : start - length + 1);
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
                        if (! ( (start <= region[0] && end <= region[0]) ||
                                 start >= region[1] && end >= region[1]))
                            return true;

                        // if ((start >= region[0] && start <= region[1]) ||
                        //     (end >= region[0] && end <= region[1]) ||
                        //     (start <= region[0] && end >= region[1])) {
                        //     return true;
                        // }
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


            // Foreach feature...
            for (var j=0; j<features.length; j++) {
                var feature = features[j];

                // Look for an open spot in each track, fill it in the first one we get to, and label that feature with the track.
                // var start = Number(feature.feature_location[0][1]);
                // var length = Number(feature.feature_location[0][3]);
                // var end;

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

            // since we're only rendering the given features, calculate this.options.start and this.options.length from them.
            // start should be the left-most base position of all features
            // length = difference between the start and the end position of all features
            var leftBase = Infinity;
            var rightBase = -Infinity;
            for (var fid in features) {
                var feature = features[fid];
                for (var i=0; i<feature.feature_location.length; i++) {
                    var loc = feature.feature_location[i];
                    var featureLeft = Number(loc[1]);
                    if (loc[2] === '-')
                        featureLeft -= Number(loc[3]) + 1;

                    var featureRight = Number(loc[1]);
                    if (loc[2] === '+')
                        featureRight += Number(loc[3]) - 1;

                    if (featureLeft < leftBase)
                        leftBase = featureLeft;

                    if (featureRight > rightBase)
                        rightBase = featureRight;
                }
            }

            this.options.start = leftBase;
            this.options.length = rightBase - leftBase + 1;

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
                                    self.trigger("featureClick", { feature: d, featureElement: this} )
                                    // this.options.onClickFunction = function(svgElement, feature) {
                                    //     self.trigger("featureClick", { feature: feature, featureElement: svgElement} );
                                    // }


                                    // if (self.options.onClickFunction) {
                                    //     self.options.onClickFunction(this, d);
                                    // }
                                    // else {
                                    //     self.highlight(this, d); 
                                    // }
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
                x = location[1] - location[3] + 1;

            return (x - this.options.start) / this.options.length * this.options.svgWidth; // + this.options.leftMargin;    
        },

        calcYCoord : function(location, track) {
            return this.options.topMargin + this.options.trackMargin + (this.options.trackMargin * track) + (this.options.trackThickness * track);
        },

        calcWidth : function(location) {
            return Math.floor((location[3]-1) / this.options.length * this.options.svgWidth);
        },

        calcHeight : function(location) {
            return this.options.trackThickness;
        },

        isCenterFeature : function(feature) {
            return feature.feature_id === this.options.featureID;
        },

        isOperonFeature : function(feature) {
            return true;
        },

        getData: function() {
            return {
                type: "Operon",
                id: this.options.featureID,
                workspace: this.options.workspaceID,
                title: "Operon"
            };
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

        clientError: function(error) {
            console.debug(error);
        },
    })
})( jQuery );