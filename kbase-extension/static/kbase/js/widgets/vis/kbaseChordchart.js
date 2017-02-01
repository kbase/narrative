/*

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'd3',
		'kbaseVisWidget',
		'RGBColor',
		'geometry_rectangle',
		'geometry_point',
		'geometry_size',
		'kbasePiechart'
	], function(
		KBWidget,
		bootstrap,
		$,
		d3,
		kbaseVisWidget,
		RGBColor,
		geometry_rectangle,
		geometry_point,
		geometry_size,
		kbasePiechart
	) {

    return KBWidget({

	    name: "kbaseChordchart",
	  parent : kbasePiechart,

        version: "1.0.0",
        options: {
            chordPadding : 0.10,
            xOffset : 0,
            yOffset : 0,
            innerRadius : -25,
            outerRadius : -25,
            strokeWidth : .5,
            strokeColor : 'black',
            choppedGroups : false,
            sortGroups : undefined,
            drawArcs : true,
            drawChords : true,
            sortSubgroups : d3.descending,
            chordColorScale : function(idx,data,$chord) {
                return $chord.options.colorScale(idx, data, $chord);
            },
        },

        _accessors : [
            'calculatedPieData'
        ],

        init : function(options) {
            this._super(options);
            return this;
        },

        pieData : function() {
            return this.calculatedPieData();
        },

        startingChordPosition : function(d, idx) {

            if (this.initialized) {

                if (idx < this.lastChordData.length - 1) {
                    return {
                        source : {startAngle : this.lastChordData[idx + 1].source.startAngle, endAngle : this.lastChordData[idx + 1].source.startAngle},
                        target : {startAngle : this.lastChordData[idx + 1].target.startAngle, endAngle : this.lastChordData[idx + 1].target.startAngle},
                    }
                }
                else {
                    return {
                        source : {startAngle : this.options.endAngle, endAngle: this.options.endAngle},
                        target : {startAngle : this.options.endAngle, endAngle: this.options.endAngle},
                    }

                }
            }

            //the first line animates the wedges in place, the second animates from the top, the third draws them rendered
            else if (this.options.startingPosition == 'slice') {
                return {
                    source : {startAngle : d.source.startAngle, endAngle : d.source.startAngle},
                    target : {startAngle : d.target.startAngle, endAngle : d.target.startAngle},
                };
            }
            else if (this.options.startingPosition == 'top') {
                return {
                    source : {startAngle : this.options.startAngle, endAngle : this.options.startAngle},
                    target : {startAngle : this.options.startAngle, endAngle : this.options.startAngle},
                }
            }
            else if (this.options.startingPosition == 'final') {
                return {
                    source : {startAngle : d.source.startAngle, endAngle : d.source.endAngle},
                    target : {startAngle : d.target.startAngle, endAngle : d.target.endAngle},
                }
            }

        },

        sliceAction : function($chord) {

            var superMethod = this.parent.prototype.sliceAction;

            superMethod = superMethod.call(this, $chord);

            ;

            return function() {
                this.call(superMethod);
                return this;
            };
        },

        renderChart : function() {

            var bounds = this.chartBounds();
            var $chord  = this;

            var chordLayout = d3.layout.chord()
                .padding( this.options.chordPadding )
                .sortGroups(this.options.sortGroups)
                .sortSubgroups(this.options.sortSubgroups)
                .matrix( $chord.dataset() );

            var chordGroups = chordLayout.groups();
            var newChordGroups = [];

            //Oh, god. This is going to suck. The results will be awesome, but this is going to suck.
            //iterate through the chord groups and chop each piece up into constituent arcs. This way
            //we can color each segment in the arc slightly differently.

            $.each(
                chordGroups,
                function (idx, val) {
                    //chord layout cannot accept start/end angles. So we have to fudge it.
                    val.startAngle += $chord.options.startAngle;
                    val.endAngle += $chord.options.startAngle;

                    var valLength = val.endAngle - val.startAngle;

                    val.data = {};

                    if ($chord.options.choppedGroups) {

                        var startAngle = val.startAngle;

                        var row = $chord.dataset()[idx].slice();

                        var total = 0;

                        row.forEach(
                            function(d) {
                                total += d;
                            }
                        );

                        var color = val.data.color || $chord.options.chordColorScale(idx, val.data, $chord);

                        var rgbColor = d3.rgb(color);

                        var colorSpread = .15;

                        var darkColor = rgbColor.darker(colorSpread);
                        var lightColor = rgbColor.brighter(colorSpread);

                        var rowColorScale = d3.scale.linear()
                            .domain([0,1])
                            .range([darkColor, lightColor]);

                        var colorScale = $chord.options.colorScale;

                        row.sort($chord.options.sortSubgroups).forEach(
                            function(d, idx2) {

                                var distance = valLength * d / total;
                                var endAngle = startAngle + distance;

                                var newData = $.extend(true, {}, val.data);
                                newData.color = rowColorScale(idx2);

                                newChordGroups.push(
                                    {
                                        startAngle  : startAngle,
                                        endAngle    : endAngle,
                                        index       : val.index,
                                        value       : val.value,
                                        data        : newData,
                                    }
                                );

                                startAngle = endAngle;
                            }
                        );

                    }
                    else {
                        newChordGroups.push(val);
                    }
                }
            );

            /*$.each(
                chordGroups,
                function (idx, val) {
                    //chord layout cannot accept start/end angles. So we have to fudge it.
                    val.startAngle += $chord.options.startAngle;
                    val.endAngle += $chord.options.startAngle;
                    val.data = {};
                }
            );*/

            this.calculatedPieData(newChordGroups);

            //defer to the super class to draw the wedges. We're going to draw the chords now.
            if (this.options.drawArcs) {
                this._super();
            }

            var fillScale = d3.scale.ordinal()
                .domain(d3.range(4))
                .range(["#000000", "#FFDD89", "#957244", "#F26223"]);

                if (this.options.drawChords) {

                var chordG = this.data('D3svg').select( this.region('chart') ).selectAll('.chords').data([0]);
                chordG.enter().insert('g', '.labelG')
                    .attr('class', 'chords')
                    .attr('transform',
                        'translate('
                            + (bounds.size.width / 2 + this.options.xOffset)
                            + ','
                            + (bounds.size.height / 2 + this.options.yOffset)
                            + ')'
                    );

                var innerRadius = this.innerRadius();
                var outerRadius = this.outerRadius();

                var arcMaker = d3.svg.arc()
                    .innerRadius( innerRadius )
                    .outerRadius( outerRadius );

                var newChords = [];
                //$.each(
                //    chordLayout.chords(),

                chordLayout.chords().forEach(
                    function(val, idx) {
                    //function (idx, val) {

                        newVal = $.extend(true, {}, val);
                        newVal.data = {};

                        newVal.source.startAngle   += $chord.options.startAngle;
                        newVal.source.endAngle     += $chord.options.startAngle;
                        newVal.target.startAngle   += $chord.options.startAngle;
                        newVal.target.endAngle     += $chord.options.startAngle;


                        newChords.push( newVal );

                        var colorIdx = newVal.source.index;

                        if (newVal.target.value > newVal.source.value) {
                            colorIdx = newVal.target.index;
                        }
                        newVal.data.colorIdx = colorIdx;

                    }
                );


                var funkyTown = function() {
                    this
                        .attr('fill-opacity', .67)
                        .attr("fill", function(d, idx) { return d.data.color || $chord.options.colorScale(d.data.colorIdx, d.data, $chord) })
                        .attr('stroke', 'black')
                        .attr('stroke-width', .5)
    //                    .attr("d", d3.svg.chord().radius(innerRadius))
                        .attr("fill-opacity", .5)
                    //.on("mouseover", fade(.1))
                    //.on("mouseout", fade(1))
                    ;

                    if (this.attrTween) {
                        this
                            .attrTween("d", function(d, idx) {

                                if (this._current == undefined) {
                                    this._current = $chord.startingChordPosition(d, idx);
                                }

                                var interpolate = d3.interpolate(this._current, d);

                                this._current = interpolate(0);
                                return function(t) {
                                    var chord = d3.svg.chord().radius(innerRadius)(interpolate(t));
                                    return chord;
                                };
                            })
                        ;
                    }

                    return this;
                };

                var transitionTime = this.initialized || this.options.startingPosition != 'final'
                    ? this.options.transitionTime
                    : 0;

                var chords = chordG
                //.append("g")
                  //  .attr("class", "chord")
                    .selectAll("path")
                        .data(newChords);
                chords
                    .enter()
                        .append("path")
                            .attr("fill", function(d) { return fillScale(d.target.index); })
                ;

                chords
                    .transition().duration(transitionTime)
                    .call(funkyTown)
                    .call($chord.endall, function() {
                        $chord.lastChordData = chordLayout.chords;
                    });
                ;

                chords
                    .exit()
                    .remove();
            }

            //now we add these MOTHERFUCKING TICK MARKS.

            //all ticks and labels go into a single group. Set that up.
            var tickG = this.data('D3svg').select( this.region('chart') ).selectAll('.ticks').data([0]);
            tickG.enter().insert('g', '.labelG')
                .attr('class', 'ticks')
            tickG
                .attr('transform',
                    'translate('
                        + (bounds.size.width / 2 + this.options.xOffset)
                        + ','
                        + (bounds.size.height / 2 + this.options.yOffset)
                        + ')'
                );

            var tickArcs = tickG
                .selectAll('.tickArcs')
                .data( chordLayout.groups )
            ;

            tickArcs
                .enter()
                    .append('g')
                    .attr('class', 'tickArcs')
            ;

            tickArcs.exit().transition().duration(transitionTime).attr('opacity', 0)
                .each('end', function(d) { d3.select(this).remove() } )
            ;
            //.remove();

            var tickGs = tickArcs.selectAll('g').data(groupTicks);
            var tickGEnter = tickGs.enter().append('g').attr('opacity', 1);
            tickGEnter.append('line');
            tickGEnter.append('text');

            tickGs.exit()
            .transition().duration(transitionTime).attr('opacity', 0)
                .each('end', function(d) { d3.select(this).remove() } )
            ;
            //.remove();
                //.transition().duration(transitionTime)
                //.each('end', function(d) { d3.select(this).remove() });

            /*tickGs.attr('transform', function(d) {
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                    + "translate(" + outerRadius + ",0)";
            });*/

            tickGs
                .transition().duration(transitionTime)
                .attrTween('transform', function(d, idx) {
                    if (this._current == undefined) {
                        this._current = $chord.startingChordPosition(d,idx);
                    }

                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        return "rotate(" + (d2.angle * 180 / Math.PI - 90) + ")"
                            + "translate(" + outerRadius + ",0)";
                    }
                });

            tickGs.select('line')
                .attr("x1", 1)
                .attr("y1", 0)
                .attr("x2", 5)
                .attr("y2", 0)
                .style("stroke", "#000")
                .attr('stroke-opacity', function (d) { return d3.select(this).attr('stroke-opacity') || 0 });
            tickGs.select('line').transition().duration(transitionTime).attr('stroke-opacity', 1);

            tickGs.select('text')
                .attr("x", 8)
                .attr("dy", ".35em")
                .attr("transform", function(d) { return (d.angle % (2 * Math.PI)) > Math.PI ? "rotate(180)translate(-16)" : null; })
                .style("text-anchor", function(d) { return (d.angle % (2 * Math.PI))  > Math.PI ? "end" : null; })
                .text(function(d) { return d.label; })
                .attr('opacity', function (d) { return d3.select(this).attr('opacity') || 0 });
            tickGs.select('text').transition().duration(transitionTime).attr('opacity', 1);



function groupTicks(d) {
  var k = (d.endAngle - d.startAngle) / d.value;
  return d3.range(0, d.value, 1000).map(function(v, i) {
    return {
      angle: v * k + d.startAngle,
      label: i % 5 ? null : v / 1000 + "k"
    };
  });
}

function fade(opacity) {
  return function(g, i) {
        chord.selectAll(".chord path")
        .filter(function(d) { return d.source.index != i && d.target.index != i; })
      .transition()
        .style("opacity", opacity);
  };
}

        },


        renderXAxis : function() {},
        renderYAxis : function() {},


    });

} );
