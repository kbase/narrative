/*

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'd3',
		'kbaseVisWidget'
	], function(
		KBWidget,
		bootstrap,
		$,
		d3,
		kbaseVisWidget
	) {

    return KBWidget({

	    name: "GeneDistribution",
	  parent : kbaseVisWidget,

        version: "1.0.0",
        options: {
            xScaleType  : 'ordinal',
            overColor : 'yellow',
            strokeWidth : '2',

            xGutter : 0,
            yGutter : 0,
            xPadding : 0,
            yPadding : 0,
            debug : false,

            colorScale : function(idx) {

                var c1 = d3.scale.category20();
                var c2 = d3.scale.category20b();
                var c3 = d3.scale.category20c();

                return function(idx) {

                    if (idx < 20 || idx >= 60) {
                        var color = c1(idx % 20)
                        return color;
                    }
                    else if (idx < 40) {
                        return c2(idx % 20)
                    }
                    else if (idx < 60) {
                        return c3(idx % 20)
                    }
                }
            },

            inset : 5,
            colorDomain : [0,100],

            transitionTime : 200,

        },

        _accessors : [

        ],

        binColorScale : function(data, maxColor) {

            var max = 0;

            data.forEach(
                function (bin, idx) {
                    if (bin.results) {
                        if (bin.results.count > max) {
                            max = bin.results.count;
                        }
                    }
                }
            )

            return d3.scale.linear()
                .domain([0, max])
                .range(['#FFFFFF', maxColor])
        },

        renderXAxis : function() {},
        renderYAxis : function() {},

        domain : function(data) {

            var start =  1000000;
            var end   = -1000000;

            for (var i = 0; i < data.length; i++) {

                if (data[i].end > end) {
                    end = data[i].end
                }

                if (data[i].start < start) {
                    start = data[i].start
                }

            }

            return [start, end];

        },

        regionDomain : function(data) {

            var length = 0;
            var lastVal = {end : 0}
            data.forEach(
                function (val, idx) {
                    length += val.size;
                    val.start = lastVal.end;
                    val.end = val.start + val.size;
                    lastVal = val;
                }
            )

            return [0, length];
        },

        renderChart : function() {

            if (this.dataset() == undefined) {
                return;
            }
            var bounds = this.chartBounds();

            var regionDomain = this.regionDomain( this.dataset() );

            var scale = d3.scale.linear()
                .domain(regionDomain)
                .range([0, bounds.size.width]);

            var $gd = this;

            var mouseAction = function(d, i) {
                this.on('mouseover', function(b, j) {
                    if ($gd.options.tooltip) {
                        $gd.options.tooltip(b);
                    }
                    else if (b.start && b.regionObj.name) {
                        score = b.results ? b.results.count : 0;
                        if (score) {
                            $gd.showToolTip({label : "bin starting at : " + b.start + ' for ' + b.regionObj.name + ' score is ' + score})
                        }
                    }
                })
                .on('mouseout', function(b,j) {
                    $gd.hideToolTip()
                });
                return this;
            }

            var bins = [];

            this.dataset().forEach(
                function(region, idx) {
                    region._bins.forEach(
                        function(bin, idx) {
                            bin.regionObj = region;
                            bins.push(bin);
                        }
                    )
                }
            );


            var transitionTime = this.initialized
                ? this.options.transitionTime
                : 0;

            var regionsSelection = this.D3svg().select( this.region('chart') ).selectAll('.regions').data([0]);
            regionsSelection.enter().append('g').attr('class', 'regions');

            var regionSelection = regionsSelection.selectAll('.region').data(this.dataset(), function(d) { return d.name} );

            regionSelection
                .enter()
                    .append('rect')
                        .attr('class', 'region')
                        .attr('opacity', 0)
//                        .attr('transform', function (d) {return "translate(" + scale(d.start) + ",0)"})
                        .attr('x', bounds.size.width)
                        .attr('y', 0)
                        .attr('width', 0)
                        .attr('height', bounds.size.height)


            regionSelection
                .call(function(d) { return mouseAction.call(this, d) } )
                .transition()
                .duration(transitionTime)
                    .attr('opacity', 1)
                    .attr('x', function(d) {return scale(d.start) })
                    .attr('width', function(d) { return scale( (d.size) ) } )
                    .attr('fill', function(d, i) {
                        var colorScale = d3.scale.linear().domain([0,1]).range(['#FFFFFF', $gd.colorForRegion(d.name)])
                        return colorScale(0.25);
                     })

            regionSelection
                .exit()
                    .transition()
                    .duration(transitionTime)
                        .attr('opacity', 0)
                        .attr('x', bounds.size.width + 1)
                        .attr('width', 0)
                        .each('end', function(d) { d3.select(this).remove() })

            var binsSelection = this.D3svg().select( this.region('chart') ).selectAll('.bins').data([0]);
            binsSelection.enter().append('g').attr('class', 'bins');

            var binSelection = binsSelection.selectAll('.bin').data(bins);

            binSelection
                .enter()
                    .append('rect')
                        .attr('class', 'bin')
                        .attr('opacity', 0)
                        .attr('x', bounds.size.width)
                        .attr('y', 0)
                        .attr('width', 0)
                        .attr('height', bounds.size.height)

            binSelection
                .call(function(d) { return mouseAction.call(this, d) } )
                .transition()
                .duration(transitionTime)
                    .attr('opacity', function(d) { return d.results ? 1 : 0} )
                   .attr('x', function(d) { return scale(d.start + d.regionObj.start) })
                    .attr('width', function(d) { return scale( (d.end - d.start) ) } )
                    .attr('fill', function(d, i) { return $gd.colorForRegion(d.region) })

            binSelection
                .exit()
                    .transition()
                    .duration(transitionTime)
                        .attr('opacity', 0)
                        .attr('x', bounds.size.width + 1)
                        .attr('width', 0)
                        .each('end', function(d) { d3.select(this).remove() })

            this.initialized = true;

        },

        colorForRegion : function(region, colorScale) {
            var map = this.regionColors;
            if (map == undefined) {
                map = this.regionColors = {colorScale : this.options.colorScale()};
            }

            if (map[region] == undefined) {
                map[region] = map.colorScale(d3.keys(map).length);
            }

            return map[region];

        },


    });

} );
