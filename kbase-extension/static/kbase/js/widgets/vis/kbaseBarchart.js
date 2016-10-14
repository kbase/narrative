/*

                    var bars = [];

                    for (var i = 0; i < 20; i++) {
                        bars.push(
                            {
                                bar   : i,
                                color : ['#00BBBB', '#0000FF','#00BBBB', '#0000FF'],
                                value : [Math.random() * 10, Math.random() * 20,Math.random() * 10, Math.random() * 30]
                            }
                        );
                    }

                    var $bar =  new kbaseBarchart($('#barchart').css({width : '800px', height : '500px'}), {
                            scaleAxes   : true,

                            xLabel      : 'Survey Data',
                            //yLabel      : 'Meaningful data',
                            hGrid       : true,

                            dataset : bars,

                        }

                    );

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
		'geometry_size'
	], function(
		KBWidget,
		bootstrap,
		$,
		d3,
		kbaseVisWidget,
		RGBColor,
		geometry_rectangle,
		geometry_point,
		geometry_size
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseBarchart",
	  parent : kbaseVisWidget,

        version: "1.0.0",
        options: {
            xScaleType  : 'ordinal',
            overColor : 'yellow',
            strokeWidth : 2,
            zeroLine : false,

            zeroLineColor : 'black',
            zeroLineWidth : 1,
        },

        _accessors : [

        ],

        defaultXDomain : function defaultXDomain () {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            return this.dataset().map(function(d) { return d.bar });
        },

        defaultYDomain : function defaultYDomain () {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            var min = 0.9 * d3.min(
                    this.dataset().map(
                        function(d) {
                            if ($.isArray(d.value)) {
                                if (d.stacked) {
                                    return d3.sum(d.value);
                                }
                                else {
                                    return d3.min(d.value);
                                }
                            }
                            else {
                                return d.value
                            }
                        }
                    )
                );

            if (min > 0) {
                min = 0;
            }

            return [
                min,
                1.1 * d3.max(
                    this.dataset().map(
                        function(d) {
                            if ($.isArray(d.value)) {
                                if (d.stacked) {
                                    return d3.sum(d.value);
                                }
                                else {
                                    return d3.max(d.value);
                                }
                            }
                            else {
                                return d.value
                            }
                        }
                    )
                )
            ];
        },

        extractLegend : function extractLegend (dataset) {

            var legend = [];
            dataset.forEach(
                function(bar, idx) {
                    if (! $.isArray(bar.color) ) {
                        legend.push(
                            {
                                color : bar.color,
                                label : bar.bar,
                            }
                        )
                    }
                }
            )

            this.setLegend(legend);

        },

        renderChart : function renderChart () {

            if (this.dataset() == undefined) {
                return;
            }

            var bounds = this.chartBounds();
            var $bar = this;

            var transitionTime = this.initialized
                ? this.options.transitionTime
                : 0;

            var funkyTown = function(barScale, d, i, init) {

                if (init) {
                    this
                        //.attr('width', 0)
                        //.attr('height', 0)
                        //.attr('x', bounds.origin.x + bounds.size.width)
                        .attr('x', function(b, j) {
                            var xId = d.bar;
                            if ($bar.options.useIDMapping) {
                                xId = $bar.xIDMap()[xId];
                            }

                            return $bar.xScale()(xId) + barScale(d.stacked ? 0 : j);
                        })
                        .attr('y', bounds.origin.x + bounds.size.height)
                        .attr('height', 0)
                        .attr('opacity', 0)
                }
                else {

                    this
                        .attr('x', function (b, j) {

                            var xId = d.bar;
                            if ($bar.options.useIDMapping) {
                                xId = $bar.xIDMap()[xId];
                            }

                            return $bar.xScale()(xId) + barScale(d.stacked ? 0 : j);
                        } )
                        .attr('opacity', 1)
                        .attr('y', function (b, bi) {

                            var barHeight = b;
                            if (d.stacked && $.isArray(d.value)) {
                                barHeight = d3.sum(d.value.slice(0,bi+1));
                            }

                            return $bar.yScale()(Math.max(0,barHeight));
                        } )
                        .attr('height', function(b, bi) {
                            return Math.abs($bar.yScale()(0) - $bar.yScale()(b))
                        })
                }

                this

                    .attr('width', barScale.rangeBand())
                    .attr('fill', function(b,j) { return d.color[ j % d.color.length ] })
                    .attr('stroke', function(b,j) { return d.stroke ? d.stroke[ j % d.stroke.length ] : 'none' })
                    .attr('stroke-width', function(b,j) { return d.strokeWidth || $bar.options.strokeWidth })
                    .attr('data-fill', function(b,j) { return d.color[ j % d.color.length ] });

                return this;
            };

            var mouseAction = function(d,i) {

                this.on('mouseover', function(b,j) {

                    var xId = d.bar;
                    if ($bar.options.useIDMapping) {
                        xId = $bar.xIDMap()[xId];
                    }

                    if ($bar.options.overColor) {
                        d3.select(this)
                            .attr('stroke', $bar.options.overColor)
                            .attr('stroke-width', 3);

                        $bar.data('D3svg').select('.yPadding').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                    if (r == xId) {
                                        this.oldFill = d3.select(this).attr('fill');
                                        this.hasOldFill = true;
                                        return $bar.options.overColor;
                                    }
                                    else {
                                        return d3.select(this).attr('fill');
                                    }
                                }
                        );

                        var xIdLabel = xId;
                        if (d.value.length > 1) {
                            xIdLabel += '[' + (j + 1) + ']';
                        }

                        var label = d.label != undefined
                            ? d.label[j % d.label.length]
                            : xIdLabel + ' is ' + d.value[j % d.value.length];//'pop up information!';

                        var tooltip = d.tooltip
                            ? d.tooltip[j % d.tooltip.length]
                            : label;

                        if (label != undefined) {
                            $bar.showToolTip(
                                {
                                    label : tooltip,
                                }
                            );
                        }
                    }
                })
                .on('mouseout', function(b,j) {
                    if ($bar.options.overColor) {
                        d3.select(this)
                            .transition()
                            .attr('stroke', function(c) {return d.stroke ? d.stroke[ j % d.stroke.length ] : 'none' })
                            .attr('stroke-width', function(c) { return d.strokeWidth || $bar.options.strokeWidth })

                        $bar.data('D3svg').select('.yPadding').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                    if (this.hasOldFill) {
                                        this.hasOldFill = false;
                                        return this.oldFill;
                                    }
                                    else {
                                        return d3.select(this).attr('fill');
                                    }
                                }
                        );
                        $bar.hideToolTip();

                    }
                });
                return this;
            };

            var groupAction = function() {
                this.each(function (d, i) {

                    if (d.value != undefined && ! $.isArray(d.value)) {
                        d.value = [d.value];
                    }

                    if (d.color != undefined && ! $.isArray(d.color)) {
                        d.color = [d.color];
                    }

                    if (d.stroke != undefined && ! $.isArray(d.stroke)) {
                        d.stroke = [d.stroke];
                    }

                    if (d.label != undefined && ! $.isArray(d.label)) {
                        d.label = [d.label];
                    }

                    if (d.tooltip != undefined && ! $.isArray(d.tooltip)) {
                        d.tooltip = [d.tooltip];
                    }

                    //var barDomain = d.value;
                    //if (d.stacked && $.isArray(d.value)) {
                    //    barDomain = [d3.sum(d.value)];
                    //}

                    var barDomain = [0];
                    if (! d.stacked) {
                        var idx = 0;

                        for (idx = 0; idx < d.value.length; idx++) {
                            barDomain.push(idx);
                        }
                    }

                    var barScale = d3.scale.ordinal()
                        .domain(barDomain)
                        //.range([0,$bar.xScale().rangeBand()])
                        .rangeBands([0,$bar.xScale().rangeBand()], 0.05)
                    ;

                    var barScale2 = d3.scale.ordinal()
                        .domain(barDomain)
                        //.range([85])
                        .rangeBands([0,85], 0.05)
                    ;

                    d3.select(this).selectAll('.barcharBar')
                        .data(d.value)
                        .enter()
                            .append('rect')
                            .attr('class', 'barcharBar')
                            .call(function() { return funkyTown.call(this, barScale, d, i, true) } );

                    d3.select(this).selectAll('.barcharBar')
                        .data(d.value)
                        .call(function() { return mouseAction.call(this, d,i) } )
                        .transition()
                        .duration(transitionTime)
                            .call(function() { return funkyTown.call(this, barScale, d, i) } );

                    d3.select(this).selectAll('.barcharBar')
                        .data(d.value)
                        .exit()
                        .transition().duration(transitionTime)
                            .attr('x', bounds.origin.x + bounds.size.width)
                            .attr('opacity', 0)
                        //.each('end', function(d) { d3.select(this).remove() } )

                })
                return this;
            }

            if (this.options.hGrid && this.yScale) {
                var yAxis =
                    d3.svg.axis()
                    .scale(this.yScale())
                    .orient('left')
                    .tickSize(0 - bounds.size.width)
                    .outerTickSize(0)
                    .tickFormat('');

                var gyAxis = this.D3svg().select(this.region('chart')).select('.yAxis');

                if (gyAxis[0][0] == undefined) {
                    gyAxis = this.D3svg().select(this.region('chart'))
                        .append('g')
                        .attr('class', 'yAxis axis')
                        .attr("transform", "translate(" + 0 + ",0)")
                }

                gyAxis.transition().call(yAxis);
                gyAxis.selectAll('line').style('stroke', 'lightgray');
            }

            var chart = this.D3svg().select( this.region('chart') ).selectAll('.barGroup');

            chart
                .data(this.dataset(), $bar.uniqueness() )
                .enter()
                    .append('g')
                    .attr('class', 'barGroup')
                        .call(groupAction)
                        ;

            chart
                .data(this.dataset(), $bar.uniqueness() )
                .call(groupAction)
            ;

            chart
                .data(this.dataset(), $bar.uniqueness() )
                .exit()
                    .call(
                        function nuke () {
                            this.each(function (d, i) {

                                d3.select(this).selectAll('.barcharBar')
                                    .transition()
                                    .duration(transitionTime)
                                        .attr('y', function (d) {
                                            /*var x = d3.select(this).attr('x');
                                            var xDest = x < bounds.origin.x + bounds.size.width / 2
                                                ? bounds.origin.x
                                                : bounds.origin.x + bounds.size.width;*/
                                            return bounds.origin.x + bounds.size.height;
                                        })
                                        .attr('opacity', 0)
                                        .each('end', function() {d3.select(this.parentNode).remove() } )
                            })
                        }
                    )
            ;

            if (this.options.zeroLine) {


                var zeroLine = this.D3svg().select( this.region('chart') ).selectAll('.zeroLine');

                zeroLine
                    .data([0])
                        .enter()
                            .append('line')
                                .attr('class', 'zeroLine')
                                .attr('x1', 0)
                                .attr('x2', bounds.size.width)
                                .attr('stroke', $bar.options.zeroLineColor)
                                .attr('stroke-width', $bar.options.zeroLineWidth)
                                .attr('y1', $bar.yScale()(0))
                                .attr('y2', $bar.yScale()(0))

                zeroLine
                    .data([0])
                        .transition()
                        .duration(transitionTime)
                            .attr('y1', $bar.yScale()(0))
                            .attr('y2', $bar.yScale()(0))
            }

            this.initialized = true;

        },

        setXScaleRange : function setXScaleRange (range, xScale) {

            if (xScale == undefined) {
                xScale = this.xScale();
            }
            xScale.rangeBands(range, 0.05);

            return xScale;
        },

        setYScaleRange : function setYScaleRange (range, yScale) {
            return this._super(range.reverse(), yScale.nice());

        },


    });

} );
