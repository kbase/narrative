/*

*/

define('kbaseBarchart',
    [
        'jquery',
        'd3',
        'kbaseVisWidget',
        'RGBColor',
        'geometry_rectangle',
        'geometry_point',
        'geometry_size',
    ], function( $ ) {

    $.KBWidget({

	    name: "kbaseBarchart",
	  parent: "kbaseVisWidget",

        version: "1.0.0",
        options: {
            xScaleType  : 'ordinal',
            overColor : 'yellow',
        },

        _accessors : [

        ],

        defaultXDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            return this.dataset().map(function(d) { return d.bar });
        },

        defaultYDomain : function() {

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

        renderChart : function() {

            if (this.dataset() == undefined) {
                return;
            }

            var bounds = this.chartBounds();
            var $bar = this;

            var funkyTown = function(barScale, d, i) {
                this
                    .attr('width', barScale.rangeBand())
                    .attr('height', function(b, bi) {
                        return Math.abs($bar.yScale()(0) - $bar.yScale()(b))
                    })
                    .attr('x', function (b, j) {

                        var xId = d.bar;
                        if ($bar.options.useIDMapping) {
                            xId = $bar.xIDMap()[xId];
                        }

                        return $bar.xScale()(xId) + barScale(j);
                    } )
                    .attr('y', function (b, bi) {

                        var barHeight = b;
                        if (d.stacked && $.isArray(d.value)) {
                            barHeight = d3.sum(d.value.slice(0,bi+1));
                        }

                        return $bar.yScale()(Math.max(0,barHeight));
                    } )
                    .attr('fill', function(b,j) { return d.color[ j % d.color.length ] })
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
                                        return $bar.options.overColor;
                                    }
                                    else {
                                        return 'black';
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

                        if (label != undefined) {
                            $bar.showToolTip(
                                {
                                    label : label,
                                }
                            );
                        }
                    }
                })
                .on('mouseout', function(d) {
                    if ($bar.options.overColor) {
                        d3.select(this)
                            .transition()
                            .attr('stroke', 'none');

                        $bar.data('D3svg').select('.yPadding').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                   return 'black';
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

                    if (d.label != undefined && ! $.isArray(d.label)) {
                        d.label = [d.label];
                    }

                    var barDomain = d.value;
                    if (d.stacked && $.isArray(d.value)) {
                        barDomain = [d3.sum(d.value)];
                    }

                    var barScale = d3.scale.ordinal()
                        .domain(barDomain)
                        .rangeBands([0,$bar.xScale().rangeBand()], 0.05)
                    ;

                    d3.select(this).selectAll('.bar')
                        .data(d.value)
                        .enter()
                            .append('rect')
                            .attr('class', 'bar')
                            .call(function() { return funkyTown.call(this, barScale, d, i) } );

                    d3.select(this).selectAll('.bar')
                        .data(d.value)
                        .call(function() { return mouseAction.call(this, d,i) } )
                        .transition()
                        .duration($bar.options.transitionTime)
                            .call(function() { return funkyTown.call(this, barScale, d, i) } );

                })
                return this;
            }

            var chart = this.data('D3svg').select('.chart').selectAll('.barGroup');
            chart
                .data(this.dataset())
                .enter()
                    .append('g')
                    .attr('class', 'barGroup')
                        .call(groupAction)
                        ;

            chart
                .data(this.dataset())
                .call(groupAction)
            ;

            chart
                .data(this.dataset())
                .exit()
                    .remove()
            ;

            /*var barGroups = chart.selectAll('.bar')
                .data(this.dataset())
                .enter()
                    .append('rect')
                        .attr('class', 'bar')
                        .call(funkyTown)
            ;

            barGroups
                .data(this.dataset())
                    .call(mouseAction)
                    .transition()
                    .duration(500)
                        .call(funkyTown)
            ;*/

        },

        setXScaleRange : function(range, xScale) {

            if (xScale == undefined) {
                xScale = this.xScale();
            }
            xScale.rangeBands(range, 0.05);

            return xScale;
        },

        setYScaleRange : function(range, yScale) {
            return this._super(range.reverse(), yScale);
        },


    });

} );
