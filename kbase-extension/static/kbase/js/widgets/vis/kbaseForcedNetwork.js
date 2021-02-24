/*

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseSearchControls',
		'd3',
		'kbaseVisWidget',
		'RGBColor',
		'geometry_rectangle',
		'geometry_point',
		'geometry_size'
	], (
		KBWidget,
		bootstrap,
		$,
		kbaseSearchControls,
		d3,
		kbaseVisWidget,
		RGBColor,
		geometry_rectangle,
		geometry_point,
		geometry_size
	) => {

    return KBWidget({

	    name: "kbaseForcedNetwork",
	  parent : kbaseVisWidget,

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

            /*nodeHighlightColor : 'yellow',
            nodeHighlightStrokeWeight : 3,
            edgeHighlightColor : 'yellow',
            edgeHighlightStrokeWeight : 3,

            relatedNodeHighlightColor : 'orange',
            relatedNodeHighlightStrokeWeight : 2,
            relatedEdgeHighlightColor : 'orange',
            relatedEdgeHighlightStrokeWeight : 2,
            highlightRelatedEdges : true,

            selectedNodeHighlightColor : 'yellow',
            selectedNodeStrokeWeight : 3,*/


            linkDistance : 100,
            charge : -10,

            xGutter     : 0,
            xPadding    : 0,
            yPadding    : 0,

            maxCurveWeight : 100,

            searchBox   : true,
            filter : false,
            cornerToolTip : false,

        },

        _accessors : [
            'forceLayout',
            'restart',
        ],

        defaultXDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            let min = 2.0 * d3.min(this.dataset().nodes.map( (d) => {return d.x}));
            if (min > 0) {
                min = 0;
            }

            return [
                min,
                2.0 * d3.max(this.dataset().nodes.map( (d) => {return d.x}))
            ];
        },

        defaultYDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            let min = 2.0 * d3.min(this.dataset().nodes.map( (d) => {return d.y}));
            if (min > 0) {
                min = 0;
            }

            return [
                min,
                2.0 * d3.max(this.dataset().nodes.map( (d) => {return d.y}))
            ];
        },

        appendUI : function ($elem) {
            this._super($elem);

            let mousedown = undefined;
            const chart = this.data('D3svg').select('.chart');
            const chartBounds = this.chartBounds();
            let selectionBox = undefined;

            const $force = this;
            let selectedNodes = [];

            chart
                .on('mousedown', function() {

                    if (d3.select(d3.event.target).attr('class') != 'background') {
                        return;
                    }
                    const coords = d3.mouse(this);
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
                        const coords = d3.mouse(this);
                        const mouseCoords = new Point(coords[0] + chartBounds.origin.x,coords[1] + chartBounds.origin.y);

                        const boxRect = mousedown.rectWithPoint(mouseCoords);

                        boxRect.origin.x -= chartBounds.origin.x;
                        boxRect.origin.y -= chartBounds.origin.y;

                        selectionBox.attr('x', boxRect.origin.x);
                        selectionBox.attr('y', boxRect.origin.y);
                        selectionBox.attr('width', boxRect.size.width);
                        selectionBox.attr('height', boxRect.size.height);

                        if (1){//! selectedNodes.length) {
                            const nodes = $force.forceLayout().nodes();

                            nodes.forEach(
                                (node, idx) => {

                                    const nodeRect = new Rectangle(
                                        new Point(node.x - node.radius, node.y - node.radius),
                                        new Size(node.radius * 2, node.radius * 2)
                                    );

                                    if (nodeRect.intersects(boxRect)) {
                                        selectedNodes.push(node);
                                        node.highlighted = 3;
                                    }
                                    else {
                                        node.highlighted = -1;
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

                    const coords = d3.mouse(this);
                    const mouseCoords = new Point(coords[0] + chartBounds.origin.x,coords[1] + chartBounds.origin.y);
                    const boxRect = mousedown.rectWithPoint(mouseCoords);

                    mousedown = undefined;
                    selectionBox = undefined;
                    chart.select('.selectionBox').remove();

                    selectedNodes.forEach(
                        (node, idx) => {
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
                 new kbaseSearchControls(this.$elem, {
                        context : this,
                        searchCallback : function(e, value, $force) {
                            $force.options.filterVal = new RegExp(value, 'i');
                            $force.restart()();
                        }
                    }
                );
                this.$elem.data('searchControls').addClass('col-md-6');
            }

            const bounds = this.chartBounds();
            const $force  = this;

            let nodes = this.data('D3svg').select('.chart').selectAll('.node');
            let tags  = this.data('D3svg').select('.chart').selectAll('.tag');
            let links = this.data('D3svg').select('.chart').selectAll('.edge');

            let forceLayout = this.forceLayout();
            if (forceLayout == undefined) {

                const tick = function() {

/*                    links.attr("x1", function(d) { return d.source.x; })
                         .attr("y1", function(d) { return d.source.y; })
                         .attr("x2", function(d) { return d.target.x; })
                         .attr("y2", function(d) { return d.target.y; });
*/

                      links.attr("d", (d) => {

                            if (d.curveStrength) {

                                const xDelta = d.target.x - d.source.x;
                                const yDelta = d.target.y - d.source.y;

                                const xCurveScale = d3.scale.linear()
                                    .domain([-$force.options.maxCurveWeight,$force.options.maxCurveWeight])
                                    .range([0,xDelta]);

                                const yCurveScale = d3.scale.linear()
                                    .domain([-$force.options.maxCurveWeight,$force.options.maxCurveWeight])
                                    .range([0,yDelta]);

                                const ctrlX = d.source.x + xCurveScale(d.curveStrength);
                                const ctrlY = d.target.y - yCurveScale(d.curveStrength);

                                const curve =
                                      " M" + d.source.x  + ',' + d.source.y
                                    + " Q" + ctrlX       + ',' + ctrlY
                                    + "  " + d.target.x  + ',' + d.target.y;

                                return curve;
                            }
                            else {
                                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
                            }
                      });

                    nodes.attr("cx", (d) => { return d.x; })
                         .attr("cy", (d) => { return d.y; });

                     tags.attr("x", (d) => { return d.x + (d.tagOffsetX || 0); })
                         .attr("y", (d) => { return d.y + (d.tagOffsetY || 0); });

                     tags.attr(
                        'fill-opacity',
                            (d) => {
                                let searchVal = d.search;
                                if (searchVal == undefined ) {
                                    searchVal = d.tag;
                                }
                                if ($force.options.filterVal == undefined || searchVal.match($force.options.filterVal)) {
                                    return 1.0;
                                }
                                else {
                                    return 0.25;
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
                        (link, index) => {
                            return link.charge || $force.options.charge;
                        }
                    )
                    .linkDistance(
                        (link, index) => {
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

                const mouseEdgeAction = function() {
                    this.on('mouseover', function(d) {

                        let coordinates = [0, 0];
                        coordinates = d3.mouse(this);
                        const x = coordinates[0];
                        const y = coordinates[1];

                        $force.showToolTip(
                            {
                                label : d.label || 'Node: ' + d.name,
                                event : {
                                    pageX : d3.event.pageX - ($force.options.cornerToolTip ? x + 300 : 0),
                                    pageY : d3.event.pageY
                                }
                            }
                        );

                        d.source.highlighted = 1;
                        d.target.highlighted = 1;
                        d.highlighted = 2;

                        $force.forceLayout().links().forEach(
                            (link, idx) => {
                                if (link.highlighted != 2) {
                                    link.highlighted = -1;
                                }
                            }
                        );

                        $force.forceLayout().nodes().forEach(
                            (node, idx) => {
                                if (node.highlighted != 2 && node.highlighted != 1) {
                                    node.highlighted = -1;
                                }
                            }
                        );

                        start();
                    })
                    .on('mouseout', (d) => {
                        $force.hideToolTip();
                        $force.forceLayout().links().forEach(
                            (link, idx) => {
                                link.highlighted = 0;
                                link.source.highlighted = 0;
                                link.target.highlighted = 0;
                            }
                        );

                        $force.forceLayout().nodes().forEach(
                            (node, idx) => {
                                node.highlighted = 0;
                            }
                        );
                        start();
                    })
                    .call(forceLayout.drag);
                    return this;
                };

                const edgeTown = function() {
                    this.attr("class", "edge")
                    .attr('stroke', (d) => {
                        return d.color || $force.options.lineColor
                    })
                    .attr('stroke-width', (d) => {
/*                        if (d.highlighted == 2) {
                            return $force.options.edgeHighlightStrokeWeight;
                        }
                        else if (d.highlighted == 1) {
                            return $force.options.relatedEdgeHighlightStrokeWeight;
                        }
                        else {*/
                            return d.weight || $force.options.lineWeight
//                        }
                    })
                    .attr('fill', 'none')
                    .attr(
                        'stroke-opacity',
                        (d) => {

                            if ($force.options.filterVal != undefined || d.highlighted == -1) {
                                if (d.highlighted == -1 || ! d.source.tag.match($force.options.filterVal) || ! d.target.tag.match($force.options.filterVal)) {
                                    return 0.25;
                                }
                            }

                            return 1.0;
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

                const mouseNodeAction = function() {
                    this.on('mouseover', function(d) {

                        let coordinates = [0, 0];
                        coordinates = d3.mouse(this);
                        const x = coordinates[0];
                        const y = coordinates[1];

                        $force.showToolTip(
                            {
                                label : d.label || 'Node: ' + d.name,
                                event : {
                                    pageX : d3.event.pageX - ($force.options.cornerToolTip ? x + 300 : 0),
                                    pageY : d3.event.pageY
                                }
                            }
                        );

                        $force.forceLayout().links().forEach(
                            (link, idx) => {
                                if (link.source == d) {
                                    link.target.highlighted = 1;
                                    link.highlighted = 1;
                                }

                                if (link.target == d) {
                                    link.source.highlighted = 1;
                                    link.highlighted = 1;
                                }

                                if (link.highlighted != 1) {
                                    link.highlighted = -1;
                                }
                            }
                        );

                        $force.forceLayout().nodes().forEach(
                            (node, idx) => {
                                if (node.highlighted != 1) {
                                    node.highlighted = -1;
                                }
                            }
                        );

                        d.highlighted = 2;

                        start();
                    })
                    .on('mouseout', (d) => {
                        $force.hideToolTip();
                        d.highlighted = 0;

                        $force.forceLayout().links().forEach(
                            (link, idx) => {
                                link.highlighted = 0;
                                link.source.highlighted = 0;
                                link.target.highlighted = 0;
                            }
                        );

                        $force.forceLayout().nodes().forEach(
                            (node, idx) => {
                                node.highlighted = 0;
                            }
                        );

                        start();
                    })
                    .on('mousedown', (d) => { d.fixed = false } )
                    .on('dblclick', (d) => { d.fixed = false } )
                    .on('mouseup',
                        (d) => {
                            if (d.x < bounds.origin.x || d.y < bounds.origin.y
                                || d.x > bounds.origin.x + bounds.size.width || d.y > bounds.origin.y + bounds.size.height) {
                                    d.fixed = false;
                            }
                            else {
                                d.fixed = true;
                            }
                        }
                    )
                   /* .attr(
                        'fill-opacity',
                        function(d) {
                            var searchVal = d.search;
                            if (searchVal == undefined ) {
                                searchVal = d.tag;
                            }

                            if ($force.options.filteredNodeColor != undefined
                                || $force.options.filterVal == undefined
                                || searchVal.match($force.options.filterVal)) {
                                return 1.0;
                            }
                            else {
                                return 0.25;
                            }
                        }
                    )
                    .attr(
                        'stroke-opacity',
                        function(d) {
                            var searchVal = d.search;
                            if (searchVal == undefined ) {
                                searchVal = d.tag;
                            }
                            if ($force.options.filterVal == undefined || searchVal.match($force.options.filterVal)) {
                                return 1.0;
                            }
                            else {
                                return 0.25;
                            }
                        }
                    )*/
                    .call(forceLayout.drag);
                    return this;
                };

                const nodeTown = function() {
                    this
                        .attr('r', (d) => { return d.radius || $force.options.nodeRadius })
                        .attr('fill', (d) => {

                            let searchVal = d.search;
                            if (searchVal == undefined ) {
                                searchVal = d.tag;
                            }

                            if (d.highlighted == 2) {
                                return d.highlightColor || $force.options.nodeHighlightColor
                                    || d.color || $force.options.nodeColor;
                            }
                            else if (d.highlighted == 1) {
                                return d.relatedHighlightColor || $force.options.relatedNodeHighlightColor
                                    || d.color || $force.options.nodeColor
                            }
                            else if (
                                ($force.options.filteredNodeColor != undefined
                                && $force.options.filterVal != undefined
                                && ! searchVal.match($force.options.filterVal)
                                || d.highlighted == -1)
                            ) {
                                //return $force.options.filteredNodeColor;
                                const rgb = RGBColor.prototype.rgbFromString(d.color || $force.options.nodeColor);
                                if (rgb) {
                                    const color = new RGBColor(rgb.r,rgb.g,rgb.b);
                                    return color.lightenBy(191).asString();
                                }
                                else {
                                    return $force.options.filteredNodeColor
                                        || d.color || $force.options.nodeColor;
                                }
                            }
                            else {
                                return d.color || $force.options.nodeColor;
                            }
                        })
                        .attr('stroke', (d) => {
                            //if (d.highlighted == 3) {
                            //    return d.selectedHighlightColor || $force.options.selectedNodeHighlightColor;
                            //}
                            //else {
                                return d.stroke || $force.options.nodeStrokeColor
                            //}
                        })
                        .attr('stroke-width', (d) => {
                            /*if (d.highlighted == 3) {
                                return d.selectedStrokeWeight || $force.options.selectedNodeStrokeWeight;
                            }
                            else {*/
                                return d.strokeWidth || $force.options.nodeStrokeWeight;
                            //}
                        })
                        .attr('data-name', (d) => { return d.name })
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


                const tagTown = function() {
                    this
                        .text((d) => { return d.tag })
                        .attr('text-anchor', 'middle')
                        .attr('alignment-baseline', 'middle')
                        .attr('style', (d) => { return d.tagStyle} )
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
