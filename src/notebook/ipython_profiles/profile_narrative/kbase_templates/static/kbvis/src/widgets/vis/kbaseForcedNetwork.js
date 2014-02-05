/*

*/

define('kbaseForcedNetwork',
    [
        'jquery',
        'kbaseSearchControls',
        'd3',
        'kbaseVisWidget',
        'RGBColor',
        'geometry_rectangle',
        'geometry_point',
        'geometry_size',
    ], function( $ ) {

    $.KBWidget({

	    name: "kbaseForcedNetwork",
	  parent: "kbaseVisWidget",

        version: "1.0.0",
        options: {
            overColor : 'blue',
            nodeColor : 'gray',
            lineColor : 'gray',
            lineWeight : 3,
            nodeStrokeColor : 'black',
            nodeStrokeWeight : 1,
            nodeRadius : 10,

            filteredNodeColor : '#BFBFBF',

            nodeHighlightColor : 'yellow',
            nodeHighlightStrokeWeight : 3,
            edgeHighlightColor : 'yellow',
            edgeHighlightStrokeWeight : 3,

            relatedNodeHighlightColor : 'orange',
            relatedNodeHighlightStrokeWeight : 2,
            relatedEdgeHighlightColor : 'orange',
            relatedEdgeHighlightStrokeWeight : 2,


            linkDistance : 100,
            charge : -10,

            xGutter     : 0,
            xPadding    : 0,
            yPadding    : 0,

            maxCurveWeight : 100,

            searchBox   : true,
            filter : false,

        },

        _accessors : [
            'forceLayout',
            'restart',
        ],

        defaultXDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            var min = 2.0 * d3.min(this.dataset().nodes.map( function(d) {return d.x}));
            if (min > 0) {
                min = 0;
            }

            return [
                min,
                2.0 * d3.max(this.dataset().nodes.map( function(d) {return d.x}))
            ];
        },

        defaultYDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            var min = 2.0 * d3.min(this.dataset().nodes.map( function(d) {return d.y}));
            if (min > 0) {
                min = 0;
            }

            return [
                min,
                2.0 * d3.max(this.dataset().nodes.map( function(d) {return d.y}))
            ];
        },

        appendUI : function ($elem) {
            this._super($elem);

            var mousedown = undefined;
            var chart = this.data('D3svg').select('.chart');
            var chartBounds = this.chartBounds();
            var selectionBox = undefined;

            var $force = this;
            var selectedNodes = [];

            chart
                .on('mousedown', function() {

                    if (d3.select(d3.event.target).attr('class') != 'background') {
                        return;
                    }
                    var coords = d3.mouse(this);
                    mousedown = new Point(coords[0] + chartBounds.origin.x,coords[1] + chartBounds.origin.y);

                    selectionBox = chart.append('rect')
                        .attr('class', 'selectionBox')
                        .attr('x', mousedown.x)
                        .attr('y', mousedown.y)
                        .attr('width', 0)
                        .attr('height', 0)
                        .attr('stroke', '#222')
                        .attr('stroke-width', '3')
                        .attr('fill', new RGBColor(0,0,0).asStringWithAlpha(0.1))
                })
                .on('mousemove', function() {
                    if (mousedown != undefined) {
                        var coords = d3.mouse(this);
                        var mouseCoords = new Point(coords[0] + chartBounds.origin.x,coords[1] + chartBounds.origin.y);

                        var boxRect = mousedown.rectWithPoint(mouseCoords);

                        boxRect.origin.x -= chartBounds.origin.x;
                        boxRect.origin.y -= chartBounds.origin.y;

                        selectionBox.attr('x', boxRect.origin.x);
                        selectionBox.attr('y', boxRect.origin.y);
                        selectionBox.attr('width', boxRect.size.width);
                        selectionBox.attr('height', boxRect.size.height);

                        if (1){//! selectedNodes.length) {
                            var nodes = $force.forceLayout().nodes();

                            nodes.forEach(
                                function (node, idx) {

                                    var nodeRect = new Rectangle(
                                        new Point(node.x - node.radius, node.y - node.radius),
                                        new Size(node.radius * 2, node.radius * 2)
                                    );

                                    if (nodeRect.intersects(boxRect)) {
                                        selectedNodes.push(node);
                                        node.highlighted = 2;
                                    }
                                    else {
                                        node.highlighted = 0;
                                    }

                                }
                            );

                            $force.restart()();
                        }

                    }
                })
                .on('mouseup', function() {

                    if (mousedown == undefined) {
                        return;
                    }

                    var coords = d3.mouse(this);
                    var mouseCoords = new Point(coords[0] + chartBounds.origin.x,coords[1] + chartBounds.origin.y);
                    var boxRect = mousedown.rectWithPoint(mouseCoords);

                    mousedown = undefined;
                    selectionBox = undefined;
                    chart.select('.selectionBox').remove();

                    selectedNodes.forEach(
                        function (node, idx) {
                            node.highlighted = false;
                        }
                    );

                    selectedNodes = [];

                    $force.restart()();

                });

            return this;

        },

        renderChart : function() {

            if (this.dataset() == undefined) {
                return;
            }

            if (this.options.filter) {
                this.$elem.kbaseSearchControls(
                    {
                        context : this,
                        searchCallback : function(e, value, $force) {
                            $force.options.filterVal = new RegExp(value, 'i');
                            $force.restart()();
                        }
                    }
                );
                this.$elem.data('searchControls').addClass('col-md-6');
            }

            var bounds = this.chartBounds();
            var $force  = this;

            var nodes = this.data('D3svg').select('.chart').selectAll('.node');
            var tags  = this.data('D3svg').select('.chart').selectAll('.tag');
            var links = this.data('D3svg').select('.chart').selectAll('.edge');

            var forceLayout = this.forceLayout();
            if (forceLayout == undefined) {

                var tick = function() {

/*                    links.attr("x1", function(d) { return d.source.x; })
                         .attr("y1", function(d) { return d.source.y; })
                         .attr("x2", function(d) { return d.target.x; })
                         .attr("y2", function(d) { return d.target.y; });
*/

                      links.attr("d", function(d) {

                            if (d.curveStrength) {

                                var xDelta = d.target.x - d.source.x;
                                var yDelta = d.target.y - d.source.y;

                                var xCurveScale = d3.scale.linear()
                                    .domain([-$force.options.maxCurveWeight,$force.options.maxCurveWeight])
                                    .range([0,xDelta]);

                                var yCurveScale = d3.scale.linear()
                                    .domain([-$force.options.maxCurveWeight,$force.options.maxCurveWeight])
                                    .range([0,yDelta]);

                                var ctrlX = d.source.x + xCurveScale(d.curveStrength);
                                var ctrlY = d.target.y - yCurveScale(d.curveStrength);

                                var curve =
                                      " M" + d.source.x  + ',' + d.source.y
                                    + " Q" + ctrlX       + ',' + ctrlY
                                    + "  " + d.target.x  + ',' + d.target.y;

                                return curve;
                            }
                            else {
                                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
                            }
                      });

                    nodes.attr("cx", function(d) { return d.x; })
                         .attr("cy", function(d) { return d.y; });

                     tags.attr("x", function(d) { return d.x + (d.tagOffsetX || 0); })
                         .attr("y", function(d) { return d.y + (d.tagOffsetY || 0); });

                     tags.attr(
                        'fill-opacity',
                            function(d) {
                                if ($force.options.filterVal == undefined || d.tag.match($force.options.filterVal)) {
                                    return '100%';
                                }
                                else {
                                    return '25%';
                                }
                            }
                        )
                    ;

                };

                forceLayout = d3.layout.force()
                    .nodes($force.dataset().nodes)
                    .links($force.dataset().edges)
                    .size([bounds.size.width, bounds.size.height])
                    .charge(
                        function(link, index) {
                            return link.charge || $force.options.charge;
                        }
                    )
                    .linkDistance(
                        function(link, index) {
                            return link.linkDistance || $force.options.linkDistance;
                        }
                    )
                    .on("tick", tick);

                this.forceLayout(forceLayout);
            }
            else {
                this.forceLayout().nodes(this.dataset().nodes);
                this.forceLayout().links(this.dataset().edges);
                $force.restart()();
                return;
            }


            var start = function() {
                links = links.data(
                    forceLayout.links()//,
                    //function(d) { return d.source.name + "-" + d.target.name }
                );

                var mouseEdgeAction = function() {
                    this.on('mouseover', function(d) {
                        $force.showToolTip(
                            {
                                label : d.label || d.source.name + ' to ' + d.target.name,
                            }
                        );
                        d.source.highlighted = 2;
                        d.target.highlighted = 2;
                        d.highlighted = 2;
                        start();
                    })
                    .on('mouseout', function(d) {
                        $force.hideToolTip();
                        d.source.highlighted = 0;
                        d.target.highlighted = 0;
                        d.highlighted = 0;
                        start();
                    })
                    .call(forceLayout.drag);
                    return this;
                };

                var edgeTown = function() {
                    this.attr("class", "edge")
                    .attr('stroke', function(d) {
                        if (d.highlighted == 2) {
                            return $force.options.edgeHighlightColor;
                        }
                        else if (d.highlighted == 1) {
                            return $force.options.relatedEdgeHighlightColor;
                        }
                        else {
                            return d.color || $force.options.lineColor
                        }
                    })
                    .attr('stroke-width', function(d) {
                        if (d.highlighted == 2) {
                            return $force.options.edgeHighlightStrokeWeight;
                        }
                        else if (d.highlighted == 1) {
                            return $force.options.relatedEdgeHighlightStrokeWeight;
                        }
                        else {
                            return d.weight || $force.options.lineWeight
                        }
                    })
                    .attr('fill', 'none')
                    .attr(
                        'stroke-opacity',
                        function(d) {

                            if ($force.options.filterVal != undefined) {
                                if (! d.source.tag.match($force.options.filterVal) || ! d.target.tag.match($force.options.filterVal)) {
                                    return '25%';
                                }
                            }

                            return '100%';
                        }
                    )
                    ;
                    return this;
                };

                links
                    .enter()
                    //.insert("line", ".node")
                    .insert('path', '.node')
                    .call(mouseEdgeAction)
                    .call(edgeTown);

                links
                    .call(mouseEdgeAction)
                    .transition()
                    .duration(100)
                        .call(edgeTown);

                links
                    .exit()
                    .remove();

                nodes = nodes.data(
                    forceLayout.nodes()//,
                    //function(d) { return d.name}
                );

                var mouseNodeAction = function() {
                    this.on('mouseover', function(d) {
                        $force.showToolTip(
                            {
                                label : d.label || 'Node: ' + d.name,
                            }
                        );

                        $force.forceLayout().links().forEach(
                            function(link, idx) {
                                if (link.source == d) {
                                    link.target.highlighted = 1;
                                    link.highlighted = 1;
                                }
                                if (link.target == d) {
                                    link.source.highlighted = 1;
                                    link.highlighted = 1;
                                }
                            }
                        );

                        d.highlighted = 2;

                        start();
                    })
                    .on('mouseout', function(d) {
                        $force.hideToolTip();
                        d.highlighted = 0;

                        $force.forceLayout().links().forEach(
                            function(link, idx) {
                                link.highlighted = 0;
                                link.source.highlighted = 0;
                                link.target.highlighted = 0;
                            }
                        );

                        start();
                    })
                    .on('mousedown', function(d) { d.fixed = false } )
                    .on('dblclick', function(d) { d.fixed = false } )
                    .on('mouseup',
                        function(d) {
                            if (d.x < bounds.origin.x || d.y < bounds.origin.y
                                || d.x > bounds.origin.x + bounds.size.width || d.y > bounds.origin.y + bounds.size.height) {
                                    d.fixed = false;
                            }
                            else {
                                d.fixed = true;
                            }
                        }
                    )
                    .attr(
                        'fill-opacity',
                        function(d) {
                            if ($force.options.filteredNodeColor != undefined
                                || $force.options.filterVal == undefined
                                || d.tag.match($force.options.filterVal)) {
                                return '100%';
                            }
                            else {
                                return '25%';
                            }
                        }
                    )
                    .attr(
                        'stroke-opacity',
                        function(d) {
                            if ($force.options.filterVal == undefined || d.tag.match($force.options.filterVal)) {
                                return '100%';
                            }
                            else {
                                return '25%';
                            }
                        }
                    )
                    .call(forceLayout.drag);
                    return this;
                };

                var nodeTown = function() {
                    this
                        .attr('r', function(d) { return d.radius || $force.options.nodeRadius })
                        .attr('fill', function (d) {
                            if (
                                $force.options.filteredNodeColor != undefined
                                && $force.options.filterVal != undefined
                                && ! d.tag.match($force.options.filterVal)
                            ) {
                                return $force.options.filteredNodeColor;
                            }
                            else {
                                return d.color || $force.options.nodeColor;
                            }
                        })
                        .attr('stroke', function(d) {
                            if (d.highlighted == 2) {
                                return $force.options.nodeHighlightColor;
                            }
                            else if (d.highlighted == 1) {
                                return $force.options.relatedNodeHighlightColor;
                            }
                            else {
                                return d.stroke || $force.options.nodeStrokeColor
                            }
                        })
                        .attr('stroke-width', function(d) {
                            if (d.highlighted == 2) {
                                return $force.options.nodeHighlightStrokeWeight;
                            }
                            else if (d.highlighted == 1) {
                                return $force.options.relatedNodeHighlightStrokeWeight;
                            }
                            else {
                                return d.strokeWidth || $force.options.nodeStrokeWeight;
                            }
                        })
                        .attr('data-name', function(d) { return d.name })
                    ;

                    return this;
                };

                nodes
                    .enter()
                    .append("circle")
                        .attr("class", 'node')
                        .call(nodeTown)
                        .call(mouseNodeAction);

                nodes
                    .call(mouseNodeAction)
                    .transition()
                    .duration(100)
                        .call(nodeTown);

                nodes
                    .exit()
                    .remove();


                tags = tags.data(
                    forceLayout.nodes()
                );


                var tagTown = function() {
                    this
                        .text(function (d) { return d.tag })
                        .attr('text-anchor', 'middle')
                        .attr('alignment-baseline', 'middle')
                        .attr('style', function(d) { return d.tagStyle} )
                    ;

                    return this;
                };

                tags
                    .enter()
                    .append("text")
                        .attr("text", 'tag')
                        .call(tagTown)
                        .call(mouseNodeAction)
                ;

                tags
                    .call(mouseNodeAction)
                    .transition()
                    .duration(100)
                        .call(tagTown)
                ;

                tags
                    .exit()
                    .remove();

                forceLayout.start();
            }

            $force.restart(start);

            start();


        },

        renderXAxis : function() {},
        renderYAxis : function() {},


    });

} );
