/*

*/

define('kbaseScatterplot',
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

	    name: "kbaseScatterplot",
	  parent: "kbaseVisWidget",

        version: "1.0.0",
        options: {
            overColor : 'yellow',
        },

        _accessors : [

        ],

        defaultXDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            var min = 0.9 * d3.min(this.dataset().map( function(d) {return d.x}));
            if (min > 0) {
                min = 0;
            }

            return [
                min,
                1.1 * d3.max(this.dataset().map( function(d) {return d.x}))
            ];
        },

        defaultYDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            var min = 0.9 * d3.min(this.dataset().map( function(d) {return d.y}));
            if (min > 0) {
                min = 0;
            }

            return [
                min,
                1.1 * d3.max(this.dataset().map( function(d) {return d.y}))
            ];
        },

        renderChart : function() {

            if (this.dataset() == undefined) {
                return;
            }

            var bounds = this.chartBounds();
            var $scatter = this;

            var funkyTown = function() {
                this
                    .attr('cx',
                        function (d) {
                            return $scatter.xScale()(d.x)
                        }
                    )
                    .attr('cy',
                        function (d) {
                            return $scatter.yScale()(d.y)
                        }
                    )
                    .attr('r',
                        function (d) {
                            return d.weight
                        }
                    )
                    //.attr('y', function (d) { return $scatter.yScale()(d.y) })
                    .attr('fill',
                        function(d) {
                            return d.color;
                        }
                    )
            };

            var mouseAction = function() {

                this.on('mouseover', function(d) {

                    if ($scatter.options.overColor) {
                        d3.select(this)
                            .attr('stroke', $scatter.options.overColor)
                            .attr('stroke-width', 3);
                    }

                    var label = d.label
                        ? d.label
                        : d.weight + ' at (' + d.x + ',' + d.y + ')';

                    if (label != undefined) {
                        $scatter.showToolTip(
                            {
                                label : label,
                            }
                        );
                    }
                })
                .on('mouseout', function(d) {
                    if ($scatter.options.overColor) {
                        d3.select(this)
                            .transition()
                            .attr('stroke', 'none');
                    }

                    $scatter.data('D3svg').select('.yPadding').selectAll('g g text')
                        .attr("fill",
                            function(r,ri){
                               return 'black';
                            }
                    );
                    $scatter.hideToolTip();

                });
                return this;
            };

            var chart = this.data('D3svg').select('.chart').selectAll('.point');
            chart
                .data(this.dataset())
                .enter()
                    .append('circle')
                    .attr('class', 'point')
                    .call(funkyTown)
                    .call(mouseAction)
            ;
            chart.data(this.dataset())
                .exit().remove();

            chart
                .data(this.dataset())
                    .call(mouseAction)
                    .transition()
                    .duration(500)
                        .call(funkyTown)
            ;



        },

        setYScaleRange : function(range, yScale) {
            return this._super(range.reverse(), yScale);
        },


    });

} );
