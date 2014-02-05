/*

*/

define('kbaseHeatmap',
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

	    name: "kbaseHeatmap",
	  parent: "kbaseVisWidget",

        version: "1.0.0",
        options: {
            xScaleType  : 'ordinal',
            yScaleType  : 'ordinal',
            yGutter     : 50,
            yPadding    : 5,

            xPadding    : 50,
            xGutter     : 5,
            overColor   : '#999900',

        },

        _accessors : [
            'spectrum',
        ],

        init : function(options) {
            this._super(options);

            return this;
        },

        setSpectrum : function(newSpectrum) {
            this.spectrum(
                d3.scale.ordinal()
                    .domain(d3.range(0,1))
                    .range(newSpectrum)
            );
        },

        defaultXDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            return this.dataset().map(function(d) { return d.x });
        },

        defaultYDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            return this.dataset().map(function(d) { return d.y });
        },

        setXScaleRange : function(range, xScale) {
            if (xScale == undefined) {
                xScale = this.xScale();
            }
            xScale.rangeBands(range);

            return xScale;
        },

        setYScaleRange : function(range, yScale) {

            if (yScale == undefined) {
                yScale = this.yScale();
            }

            yScale.rangeBands(range);

            return yScale;
        },

        renderXAxis : function() {

            if (this.xScale() == undefined || this.xScale().domain == undefined) {
                return;
            }

            var xAxis =
                d3.svg.axis()
                    .scale(this.xScale())
                    .orient('top');

            var gxAxis = this.data('D3svg').select('.yGutter').select('.xAxis');

            if (gxAxis[0][0] == undefined) {
                gxAxis = this.data('D3svg').select('.yGutter')
                    .append('g')
                        .attr('class', 'xAxis axis')
                        .attr("transform", "translate(0," + this.yGutterBounds().size.height + ")")
            }

            var $hm = this;
            gxAxis
                .transition()
                .call(xAxis)
                .selectAll("text")
                    .attr("transform", function (d, i) {
                        var bounds = $hm.yGutterBounds();
                        //bullshit hardwired magic numbers. The xAxis is "known"(?) to position @ (0,-9)
                        //arbitrarily rotate around -12 because it looks right. I got nothin'.
                        //then we move it 5 pixels to the right, which in our rotate coordinate system is
                        //5 pixels up. Whee!
                        return "rotate(-90,0,-12) translate(30,0)";// translate(2,3)";
                    })
            ;


        },

        renderXLabel : function() {
            var yGutterBounds = this.yGutterBounds();

            var xLabeldataset = [this.xLabel()];

            var xLabel = this.data('D3svg').select('.yPadding').selectAll('.xLabel');
            xLabel
                .data(xLabeldataset)
                    .text( this.xLabel() )
                .enter()
                    .append('text')
                        .attr('class', 'xLabel')
                        .attr('x', yGutterBounds.size.width / 2)
                        .attr('y', yGutterBounds.size.height / 2 + 3)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '11px')
                        .attr('font-family', 'sans-serif')
                        .attr('fill', 'black')
                        .text(this.xLabel());
            ;

        },

        renderChart : function() {

            var $hm = this;
            var bounds = this.chartBounds();

            if (this.dataset() == undefined) {
                return;
            }

            var xGridLines = [];
            $.each(
                $hm.xScale().domain(),
                function (idx, xVal) {
                    xGridLines.push(
                        {
                            x : $hm.xScale()(xVal),
                            y : 0
                        }
                    )
                }
            );
            var yGridLines = [];
            $.each(
                $hm.yScale().domain(),
                function (idx, yVal) {
                    yGridLines.push(
                        {
                            x : 0,
                            y : $hm.yScale()(yVal),
                        }
                    )
                }
            );

            xGridLines.push(
                {
                    x : xGridLines[xGridLines.length - 1].x + $hm.xScale().rangeBand(),
                    y : 0
                }
            );

            yGridLines.push(
                {
                    x : 0,
                    y : yGridLines[yGridLines.length - 1].y + $hm.yScale().rangeBand(),
                }
            );

            var grid = this.data('D3svg').select('.chart').selectAll('.grid');
            grid
                .data(xGridLines)
                .enter()
                    .append('line')
                        .attr('class', 'grid')
                        .attr('x1', function (d) { return d.x })
                        .attr('y1', function (d) { return d.y })
                        .attr('x2', function (d) { return d.x })
                        .attr('y2', function (d) { return $hm.yScale().rangeBand() * $hm.yScale().domain().length })
                        .attr('stroke', 'gray')
                        .attr('stroke-width', 1)
            ;
            grid
                .data(yGridLines)
                .enter()
                    .append('line')
                        .attr('class', 'grid')
                        .attr('x1', function (d) { return d.x })
                        .attr('y1', function (d) { return d.y })
                        .attr('x2', function (d) { return $hm.xScale().rangeBand() * $hm.xScale().domain().length }) //bounds.size.width })
                        .attr('y2', function (d) { return d.y})
                        .attr('stroke', 'gray')
                        .attr('stroke-width', 1)
            ;


        var funkyTown = function() {
            this
                .attr('x',
                    function (d) {
                        var xId = d.x;
                        if ($hm.options.useIDMapping) {
                            xId = $hm.xIDMap()[xId];
                        }
                        return $hm.xScale()(xId)
                    }
                )
                .attr('y',
                    function (d) {
                        var yId = d.y;
                        if ($hm.options.useIDMapping) {
                            yId = $hm.yIDMap()[yId];
                        }
                        return $hm.yScale()(yId)
                    }
                )
                //.attr('y', function (d) { return $hm.yScale()(d.y) })
                //.attr('opacity', function (d) { return d.value })
                .attr('width', $hm.xScale().rangeBand())
                .attr('height', $hm.yScale().rangeBand())
                .attr('fill',
                    function(d) {

                        var colorScale = d3.scale.linear()
                            .domain([0,1])
                            .range(['white', d.color]);

                        return colorScale(d.value);

                        return d.color;
                    }
                );
            return this;
        }

            var mouseAction = function() {
                this.on('mouseover', function(d) {
                    if ($hm.options.overColor) {
                        d3.select(this)
                            //.attr('fill', $hm.options.overColor)
                            .attr('stroke', $hm.options.overColor)
//                            .attr('opacity', '100%')
                            .attr('stroke-width', 5);

                        $hm.data('D3svg').select('.yGutter').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                    var xId = d.x;
                                    if ($hm.options.useIDMapping) {
                                        xId = $hm.xIDMap()[xId];
                                    }
                                    if (r == xId) {
                                        return $hm.options.overColor;
                                    }
                                }
                        );

                        $hm.data('D3svg').select('.xPadding').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                    var yId = d.y;
                                    if ($hm.options.useIDMapping) {
                                        yId = $hm.yIDMap()[yId];
                                    }
                                    if (r == yId) {
                                        return $hm.options.overColor;
                                    }
                                }
                        );

                        var xId = d.x;
                        if ($hm.options.useIDMapping) {
                            xId = $hm.xIDMap()[xId];
                        }
                        var yId = d.y;
                        if ($hm.options.useIDMapping) {
                            yId = $hm.yIDMap()[yId];
                        }

                        $hm.showToolTip(
                            {
                                label : d.label || 'Value for: ' + xId + ' - ' + yId + '<br>is ' + d.value,
                            }
                        );

                    }
                })
                .on('mouseout', function(d) {
                    if ($hm.options.overColor) {
                        d3.select(this)
                            //.transition()
                            //.attr('fill', d.color)
//                            .attr('opacity', function (d) { return d.value })
                            .attr('stroke', 0);

                        $hm.data('D3svg').select('.yGutter').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                   return 'black';
                                }
                        );

                        $hm.data('D3svg').select('.xPadding').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                   return 'black';
                                }
                        );

                        $hm.hideToolTip();

                    }
                })
                return this;
            };

            var chart = this.data('D3svg').select('.chart').selectAll('.cell');
            chart
                .data(this.dataset())
                .enter()
                    .append('rect')
                    .attr('class', 'cell')
                    .call(funkyTown)
                    .call(mouseAction)
            ;
            chart
                .data(this.dataset())
                    .call(mouseAction)
                    .transition()
                    .duration(500)
                        .call(funkyTown)
            ;

            chart
                .data(this.dataset())
                .exit()
                    .remove();

        },


    });

} );
