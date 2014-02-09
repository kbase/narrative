/*

*/

define('kbaseLinechart',
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

	    name: "kbaseLinechart",
	  parent: "kbaseVisWidget",

        version: "1.0.0",
        options: {
            overColor : 'yellow',
            width : 3,
            lineCap : 'round',
            color : 'black',

        },

        _accessors : [

        ],

        defaultXDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }


            return [
                0.9 * d3.min(
                    this.dataset(),
                    function (l) {
                        return d3.min(l.values.map(function(d) { return d.x }))
                    }
                ),
                1.1 * d3.max(
                    this.dataset(),
                    function (l) {
                        return d3.max(l.values.map(function(d) { return d.x }))
                    }
                )
            ];
        },

        defaultYDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            return [
                0.9 * d3.min(
                    this.dataset(),
                    function (l) {
                        return d3.min(l.values.map(function(d) { return d.y }))
                    }
                ),
                1.1 * d3.max(
                    this.dataset(),
                    function (l) {
                        return d3.max(l.values.map(function(d) { return d.y }))
                    }
                )
            ];
        },

        renderChart : function() {

            if (this.dataset() == undefined) {
                return;
            }

            var bounds = this.chartBounds();
            var $line  = this;

            var lineMaker = d3.svg.line()
                .x(function(d) { return $line.xScale()(d.x) })
                .y(function(d) { return $line.yScale()(d.y) });

            var funkyTown = function() {

                this
                    .attr('d',              function(d) {return lineMaker(d.values) })
                    .attr('stroke',         function (d) { return d.color || $line.options.color } )
                    .attr('fill',           'none')
                    .attr('stroke-width',   function (d) {return d.width || $line.options.width} )
                    .attr('stroke-linecap',   function (d) {return d.linecap || $line.options.lineCap} )
                    .attr('stroke-dasharray',   function (d) {return d.dasharray } )
                ;

                return this;

            };

            var mouseAction = function() {

                this.on('mouseover', function(d) {
                    if ($line.options.overColor) {
                        d3.select(this)
                            .attr('stroke', $line.options.overColor)
                            .attr('stroke-width', (d.width || $line.options.width) + 5);
                    }

                    if (d.label) {
                        $line.showToolTip(
                            {
                                label : d.label,
                            }
                        );
                    }

                })
                .on('mouseout', function(d) {
                    if ($line.options.overColor) {
                        d3.select(this)
                            .attr('stroke',         function (d) { return d.color || $line.options.color } )
                            .attr('stroke-width',   d.width || $line.options.width );

                        $line.hideToolTip();

                    }
                })
                return this;
            };

            var chart = this.data('D3svg').select('.chart').selectAll('.line');

            chart
                .data(this.dataset())
                .enter()
                    .append('path')
                        .attr('class', 'line')
                        .call(funkyTown)
                        .call(mouseAction)
                ;

                chart
                    .data(this.dataset())
                        .call(mouseAction)
                        .transition()
                        .duration(this.options.transitionTime)
                        .call(funkyTown)
                ;

                chart
                    .data(this.dataset())
                    .exit()
                        .remove();

        },

        setYScaleRange : function(range, yScale) {
            return this._super(range.reverse(), yScale);
        },


    });

} );
