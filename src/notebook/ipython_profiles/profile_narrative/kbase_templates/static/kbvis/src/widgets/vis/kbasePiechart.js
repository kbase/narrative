/*

*/

define('kbasePiechart',
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

	    name: "kbasePiechart",
	  parent: "kbaseVisWidget",

        version: "1.0.0",
        options: {
            overColor : 'blue',
        },

        _accessors : [

        ],

        renderChart : function() {

            if (this.dataset() == undefined) {
                return;
            }

            var bounds = this.chartBounds();
            var $pie  = this;

            var pieScale = d3.scale.linear()
                .domain([0,1])
                .range([0,360]);

            var scaledData = this.dataset().map(function (d) {return pieScale(d.value)});

            var pieLayout = d3.layout.pie();

            var pieData = pieLayout(scaledData);

            pieData.forEach(
                function (val, idx, pd) {
                    val.given = $pie.dataset()[idx];
                }
            );

            var diameter = bounds.size.width < bounds.size.height
                ? bounds.size.width
                : bounds.size.height;
            var radius = diameter / 2;

            var arcMaker = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(radius);

            var funkyTown = function() {

                this
                    .attr('d',      arcMaker)
                    .attr('fill',   function (d) { return d.given.color } )
                ;

                return this;

            };

            var labelTown = function() {

                this
                    .attr("transform", function(d) {
                        return "translate(" + arcMaker.centroid(d) + ")";
                    })
                    .attr("text-anchor", "middle")
                    .text(function(d) {
                        return d.given.label;
                    });
                return this;
            }

            //there is no mouse action on a line chart for now.
            var mouseAction = function() { return this };

            var pie = this.data('D3svg').select('.chart').selectAll('.pie').data([0]).enter().append('g')
                .attr('class', 'pie')
                .attr('transform',
                    'translate('
                        + (bounds.size.width / 2 - radius + radius)
                        + ','
                        + (bounds.size.height / 2 - radius + radius)
                        + ')'
                );

            var slices = pie.selectAll('.slice');

            slices
                .data(pieData)
                .enter()
                    .append('path')
                        .attr('class', 'slice')
                        .call(funkyTown)
            ;

            slices
                .data(pieData)
                    .call(mouseAction)
                    .transition()
                    .duration(500)
                    .call(funkyTown)
            ;

            slices
                .data(pieData)
                .exit()
                    .remove();

            var labels = pie.selectAll('.label');

            labels
                .data(pieData)
                .enter()
                    .append('text')
                        .attr('class', 'label')
                        .call(labelTown)
            ;

            labels
                .data(pieData)
                    .call(mouseAction)
                    .transition()
                    .duration(500)
                    .call(labelTown)
            ;

            labels
                .data(pieData)
                .exit()
                    .remove();


        },

        renderXAxis : function() {},
        renderYAxis : function() {},


    });

} );
