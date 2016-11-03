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

    return KBWidget({

    name: "kbaseTreechart",
    parent : kbaseVisWidget,

    version: "1.0.0",
    options: {
        debug: false,

        xGutter: 0,
        xPadding: 0,
        yGutter: 0,
        yPadding: 0,

        bgColor: 'none',

        red: undefined,
        blue: undefined,

        distance: 100,

        redBlue: false,

        strokeWidth: 1.5,
        transitionTime: 500,
        lineStyle: 'curve', // curve / straight / square / step

        fixed: 0,
        displayStyle: 'NTnt',

        nodeHeight: 15,
        labelSpace: 10,
        circleRadius: 4.5,
        circleStroke: 'steelblue',
        openCircleFill: 'lightsteelblue',
        closedCircleFill: '#FFF',

        lineStroke : '#ccc',

        staticWidth : false,
        staticHeight : false,
        canShrinkWidth : true,
        chartRegion : 'chart',

        bias : "root",

    },

    _accessors: [
        'comparison',
    ],

    calculateNodeDepths : function(nodes) {
        //we need to know the distance of all nodes from a leaf, in order to use leaf bias. Dammit.
        nodes.forEach(function (node) {
            if (! node.children) {

                node.nodeDepth = 0;

                var parent = node.parent;
                var nodeDepth = 1;

                while (parent != undefined) {
                    if (parent.nodeDepth == undefined || parent.nodeDepth < nodeDepth) {
                        parent.nodeDepth = nodeDepth;
                    }

                    nodeDepth++;
                    parent = parent.parent;
                }
            }
        })
        //done calculating distances for leaf bias
    },

    afterInArray: function (val, array) {
        var idx = array.indexOf(val) + 1;
        if (idx >= array.length) {
            idx = 0;
        }

        return array[idx];
    },

    countVisibleLeaves: function (nodes) {
        var num = 0;
        if (nodes.children != undefined && (nodes.open == true || nodes.open == undefined)) {
            for (var idx = 0; idx < nodes.children.length; idx++) {
                num += this.countVisibleLeaves(nodes.children[idx]);
            }
        } else {
          num = 1;
        }

        return num;
    },

    findInChildren: function (target, search) {
        if (target == search) {
            return true;
        }
        if (search != undefined && search.children != undefined) {
            for (var idx = 0; idx < search.children.length; idx++) {
                if (this.findInChildren(target, search.children[idx])) {
                    return true;
                }
            }
        }

        return false;
    },

    redBlue: function (node, d) {
        var $tree = this;
        if ($tree.options.red == d) {
            $tree.options.red = undefined;
            $tree.options.redNode = undefined;
        }

        if ($tree.options.blue == d) {
            $tree.options.blue = undefined;
            $tree.options.blueNode = undefined;
        }

        var colors = ['red', 'black'];

        if ($tree.options.red != undefined && $tree.options.blue != undefined) {
            $tree.options.red.fill = 'black';
            d3.select($tree.options.redNode).attr('fill', $tree.options.red.fill);
            $tree.options.red = undefined;
            colors = ['red', 'black'];
        }
        else if ($tree.options.red != undefined) {
            colors = ['blue', 'black'];
        }

        else if ($tree.options.red == undefined && $tree.options.blue != undefined) {
            colors = ['red', 'black'];
        }

        d.fill = $tree.afterInArray(d.fill, colors);

        if (d.fill != 'black' && d.children != undefined
            && !$tree.findInChildren($tree.options.red, d) && !$tree.findInChildren($tree.options.blue, d)) {

            $tree.toggle(d);
            $tree.updateTree(d);

        }

        if (d.fill != 'black') {
            $tree.options[d.fill] = d;
            $tree.options[d.fill + 'Node'] = node;
        }

        d3.select(node).attr('fill', d.fill);

        if ($tree.options.red != undefined && $tree.options.blue != undefined) {
            $tree.comparison('Comparing ' + $tree.options.red.name + ' vs ' + $tree.options.blue.name);
        }
        else {
            $tree.comparison('');
        }
    },

    defaultNodeClick : function(d) {
        if (!this.findInChildren(this.options.red, d) && !this.findInChildren(this.options.blue, d)) {
                this.toggle(d);
                this.updateTree(d);
        }
    },

    defaultTextClick : function(d, node) {


            if (this.options.redBlue) {
                this.redBlue(node, d);
            }

    },

        nodeState : function(d) {
                if (d.children) {
                        return 'open';
                }
                else if (d._children) {
                        return 'closed';
                }
                else {
                        return 'leaf';
                }
        },

    depth : function(d, rootOffset, chartOffset) {
        if (this.options.depth) {
                return this.options.depth.call(this, d, rootOffset, chartOffset);
        }
        else {
                return this.defaultDepth(d, rootOffset, chartOffset);
        }
    },

    defaultDepth : function(d, rootOffset, chartOffset) {

        var distance = this.options.distance;
        if (d.distance != undefined) {
            distance *= d.distance;
        }
        ;

        if (d.parent != undefined) {
            distance += this.depth(d.parent, rootOffset, chartOffset);
        }
        else {
            distance = rootOffset + chartOffset;
        }

        return distance;
    },

    uniqueness : function (d) {

        if (d.id == undefined) {

            var name = d.name;
            if (name == undefined && this.options.nameFunction != undefined) {
                name = this.options.nameFunction.call(this, d);
            }

            if (d.parent != undefined) {
                name = this.uniqueness(d.parent) + '/' + name;
            }

            d.id = name;
        }

        return d.id;

    },

    updateTree: function (source) {
    console.log("CHART REGION IS ", this.region(this.options.chartRegion));
        var chart = this.D3svg().select(this.region(this.options.chartRegion));

        var $tree = this;

        var duration = this.initialized ? this.options.transitionTime : 0;

        var rootOffset = 0;

        var bounds = this.chartBounds();

        //okay. This is going to suck. Figure out the appropriate depth of the root element. Create a fake SVG element,
        // toss the root node into there, and yank out its width.
        var fakeDiv = document.createElement('div');

        var root = source;
        while (root.parent != undefined) {
            root = root.parent;
        }

        var rootText = chart.append('text')
            .attr('style', 'visibility : hidden; font-size : 11px;cursor : pointer;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;')
            .attr('class', 'fake')
            .text(root.name);
        rootOffset = rootText[0][0].getBBox().width + $tree.options.labelSpace + bounds.origin.x;

        var newHeight = this.options.nodeHeight * this.countVisibleLeaves(this.dataset());

        //this.$elem.animate({'height' : newHeight + this.options.yGutter + this.options.yPadding}, 500);
        //            this.$elem.height(newHeight);
        this.height(this.$elem.height());
        bounds.size.height = newHeight;
        this.treeLayout = this.layoutType()
            .size([bounds.size.height, bounds.size.width]);


        this.nodes = this.treeLayout.nodes(this.dataset()).reverse();
        this.calculateNodeDepths(this.nodes);

        var chartOffset = 0;



        var maxOffset = 0;
        var minOffset = 5000000000;

        function findWidth(text, d) {
            var box = text[0][0].getBBox();
            var right = d.children || d._children
                ? d.y + $tree.options.labelSpace
                : d.y + box.width + $tree.options.labelSpace;
            var left = d.children || d._children
                ? d.y + $tree.options.labelSpace - box.width
                : d.y + $tree.options.labelSpace;

            return [left, right, right - left];
        }

        $tree.options.fixedDepth = 0;

        this.nodes.forEach(
            function (d) {
                d.y = $tree.depth(d, rootOffset, chartOffset);

                if (d.y > $tree.options.fixedDepth) {
                    $tree.options.fixedDepth = d.y;
                }
            }
        );

        this.nodes.forEach(
            function (d) {
                d.y = $tree.depth(d, rootOffset, chartOffset);

                d.y = $tree.options.fixed && (!d.children || d.children.length == 0)
                    ? $tree.options.fixedDepth
                    : d.y;

                if (d.name == undefined && $tree.options.nameFunction) {
                    d.name = $tree.options.nameFunction.call($tree, d);
                }

                var fakeText = chart.append('text')
                    .attr('style', 'visibility : hidden;font-size : 11px;cursor : pointer;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;')
                    .attr('class', 'fake')
                    .text(d.name);

                var fakeBounds = findWidth(fakeText, d);
                var fakeLeft = fakeBounds[0];
                var fakeRight = fakeBounds[1];
                d.width = fakeBounds[2];

                if ($tree.options.labelWidth && d.width > $tree.options.labelWidth) {
                    var words = d.name.split(/\s+/);
                    var shortWords = [words.shift()];

                    fakeText.text(shortWords.join(' '));
                    var throttle = 0
                    while (findWidth(fakeText, d)[2] < $tree.options.labelWidth && throttle++ < 40) {
                        shortWords.push(words.shift());
                        fakeText.text(shortWords.join(' '));
                    }

                    words.push(shortWords.pop());

                    d.name_truncated = shortWords.join(' ');

                }

                if (fakeRight > maxOffset) {
                    maxOffset = fakeRight;
                }

                if (fakeLeft < minOffset) {
                    minOffset = fakeLeft;
                }

            }
        );

        var widthDelta = 0;
        if (minOffset < bounds.origin.x) {
            widthDelta += bounds.origin.x - minOffset;
            chartOffset = widthDelta;
        }
        if (maxOffset > bounds.origin.x + bounds.size.width) {
            widthDelta += maxOffset - bounds.size.width;
        }

        chart.selectAll('.fake').remove();

        var newWidth = this.options.xGutter + this.options.yGutter + widthDelta + bounds.size.width;

        if (newWidth < $tree.options.originalWidth && ! $tree.options.canShrinkWidth) {
            newWidth = $tree.options.originalWidth;
        }

        newWidth = this.options.staticWidth ? $tree.options.originalWidth : newWidth;
        newHeight = this.options.staticHeight ? $tree.options.originalHeight : newHeight + this.options.yGutter + this.options.yPadding;

                this.$elem.animate(
                    {
                        'width': newWidth,
                        'height': newHeight
                    },
                    duration
                );

        var node = chart.selectAll("g.tree-node")
            .data(this.nodes, function(d) { return $tree.uniqueness(d) });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
                .attr("class", "tree-node")
                .attr('data-node-id', function (d) { return $tree.uniqueness(d) } )
                .attr('opacity', 0)
                .attr("transform", function (d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            ;

                        nodeEnter.append("circle")
                                .attr("class", "circle")
                                .attr("r", 1e-6)
                                .attr('style', 'cursor : pointer;')
                                .attr('stroke', function(d) { return d.stroke || $tree.options.circleStroke})
                                .style("fill", function(d) { return d._children ? $tree.options.openCircleFill : $tree.options.closedCircleFill; })
                                .on("click", function(d) {

                if ($tree.oneClick) {

                    if ($tree.options.nodeDblClick) {
                        $tree.oneClick = false;
                        $tree.options.nodeDblClick.call($tree, d, this);
                    }
                }
                else {
                    $tree.oneClick = true;
                    setTimeout($.proxy(function () {
                        if ($tree.oneClick) {
                            $tree.oneClick = false;
                            if ($tree.options.nodeClick) {
                                return $tree.options.nodeClick.call($tree, d, this);
                            }
                            else {
                                $tree.defaultNodeClick(d, this);
                            }
                        }
                    }, this), 250)
                }

            })
            .on('mouseover', function (d) {
                if ($tree.options.nodeOver) {
                    $tree.options.nodeOver.call($tree, d, this);
                }
                else if (d.tooltip) {
                    $tree.showToolTip({label: d.tooltip})
                }
            })
            .on('mouseout', function (d) {
                if ($tree.options.nodeOut) {
                    $tree.options.nodeOut.call($tree, d, this);
                }
                else if (d.tooltip) {
                    $tree.hideToolTip()
                }
            })
        ;

        nodeEnter.append("text")
            //.attr('style', 'font-size : 11px')
            .attr('class', 'tree-nodeText')
            .attr('data-text-id', function (d) { return $tree.uniqueness(d) } )
            .attr('style', 'font-size : 11px;cursor : pointer;-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;')
            .attr("dy", ".35em")
            .text(function (d) {
                var name = d.name;
                if (d.width > $tree.options.labelWidth && $tree.options.truncationFunction) {
                    name = $tree.options.truncationFunction(d, this, $tree);
                }
                return name;
            })
            .style("fill-opacity", 1e-6)
            .attr('fill', function (d) { return d.fill || 'black'})
            .on("click", function (d) {

                if ($tree.oneClick) {

                    if ($tree.options.textDblClick) {
                        $tree.oneClick = false;
                        $tree.options.textDblClick.call($tree, d, this);
                    }
                }
                else {
                    $tree.oneClick = true;
                    setTimeout($.proxy(function () {
                        if ($tree.oneClick) {
                            $tree.oneClick = false;
                            if ($tree.options.textClick) {
                                return $tree.options.textClick.call($tree, d, this);
                            }
                            else {
                                return $tree.defaultTextClick(d, this);
                            }
                        }
                    }, this), 250)
                }

            })
            .on('mouseover', function (d) {
                if ($tree.options.textOver) {
                    $tree.options.textOver.call($tree, d, this);
                }
            })
            .on('mouseout', function (d) {
                if ($tree.options.textOut) {
                    $tree.options.textOut.call($tree, d, this);
                }
            })

        ;

        nodeEnter.each(function (d, i) {
            if ($tree.options.nodeEnterCallback) {
                $tree.options.nodeEnterCallback.call($tree, d, i, this, duration);
            }
        });


        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
                .duration(duration)
                .attr('opacity', 1)
                .attr("transform", function (d) {
                    var y = $tree.options.fixed && (!d.children || d.length == 0)
                        ? $tree.options.fixedDepth
                        : d.y;
                    if ($tree.options.bias == 'leaf' && d.parent != undefined) {
                        y = $tree.options.fixedDepth - d.nodeDepth * $tree.options.distance;
                    }
                    return "translate(" + y + "," + d.x + ")";
                })
            ;

        nodeUpdate.select("circle")
            .attr("r", function (d) { return d.radius || $tree.options.circleRadius})
            .attr('stroke', function (d) { return d.stroke || $tree.options.circleStroke})
            .style("fill", function (d) { return d._children ? $tree.options.openCircleFill : $tree.options.closedCircleFill; })

            .attr('visibility', function (d) {
                var isLeaf = true;
                if (d.children && d.children.length) {
                    isLeaf = false;
                }

                if (isLeaf && $tree.options.displayStyle.match(/n/)) {
                    return 'visible';
                }
                else if (!isLeaf && $tree.options.displayStyle.match(/N/)) {
                    return 'visible';
                }
                else if (isLeaf && $tree.options.displayStyle.match(/c/) && (d.name != undefined && d.name.length > 0)) {
                    return 'visible';
                }
                else if (!isLeaf && $tree.options.displayStyle.match(/C/) && (d.name != undefined && d.name.length > 0)) {
                    return 'visible';
                }
                else {
                    return 'hidden';
                }
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1)
            .attr("x", function (d) { return d.children ? 0 - $tree.options.labelSpace : $tree.options.labelSpace; })
            .attr("text-anchor", function (d) { return d.children ? "end" : "start"; })
            .attr('visibility', function (d) {
                var isLeaf = true;
                if (d.children && d.children.length) {
                    isLeaf = false;
                }

                if (isLeaf && $tree.options.displayStyle.match(/t/)) {
                    return 'visible';
                }
                else if (!isLeaf && $tree.options.displayStyle.match(/T/)) {
                    return 'visible';
                }
                else {
                    return 'hidden';
                }
            });

        nodeUpdate.each(function (d, i) {
            if ($tree.options.nodeUpdateCallback) {
                $tree.options.nodeUpdateCallback.call($tree, d, i, this, duration);
            }
        });

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
                .duration(duration)
                .attr('opacity', 0)
                .attr("transform", function (d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove()
            ;

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        nodeExit.each(function (d, i) {
            if ($tree.options.nodeExitCallback) {
                $tree.options.nodeExitCallback.call($tree, d, i, this, duration);
            }
        });

        // Update the links
        var link = chart.selectAll("path.tree-link")
            .data($tree.treeLayout.links($tree.nodes), function(d) { return $tree.uniqueness(d.target) });

                        // Enter any new links at the parent's previous position.
                        link.enter().insert("path", "g")
                                .attr("class", "tree-link")
                                .attr('data-link-id', function (d) { return $tree.uniqueness(d.target) } )
                                .attr('fill', 'none')
                                .attr('stroke', function (d) { return d.target.lineStroke || $tree.options.lineStroke})
                                .attr("d", function(d) {
                                    var o = {x: source.x0, y: source.y0};
                                    return $tree.diagonal({source: o, target: o});
                                })
                                .on('mouseover', function (d) {
                                    if ($tree.options.lineOver) {
                                        $tree.options.lineOver.call($tree, d, this);
                                    }
                                })
                                .on('mouseout', function (d) {
                                    if ($tree.options.lineOut) {
                                        $tree.options.lineOut.call($tree, d, this);
                                    }
                                })
                        .transition()
                                .duration(duration)
                                .attr("d", $tree.diagonal);

                        // Transition links to their new position.
                        link.transition()
                                .duration(duration)
                                .attr('stroke-width', function (d) {
                                        var weight = d.target.weight || $tree.options.strokeWidth;
                                        if (typeof(weight) === 'function') {
                                                weight = weight.call($tree, d);
                                        }

                                        return weight + 'px';
                                })
                                .attr("d", $tree.diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr('opacity', 0)
            .attr("d", function (d) {
                var o = {x: source.x, y: source.y};
                return $tree.diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        $tree.nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });


    },

    layoutType: function () {
        if (this.options.layout == 'cluster') {
            return d3.layout.cluster()
        }
        else if (this.options.layout == undefined) {
            return d3.layout.tree();
        }
        else {
            return this.options.layout;
        }
    },

    renderChart: function () {

        if (this.dataset() == undefined) {
            return;
        }

        //            this.$elem.height(30 * this.countVisibleNodes(this.dataset()));
        //            this.height(this.$elem.height());

        this.options.originalWidth = this.$elem.width();
        this.options.originalHeight = this.$elem.height();

        var i = 0;
        var bounds = this.chartBounds();

        if (this.treeLayout == undefined) {
            this.treeLayout = this.layoutType()
                .size([bounds.size.height, bounds.size.width]);
        }

        var $tree = this;

        var getYCoords = function(d) {
            var sourceY = d.source.y;
            var targetY = $tree.options.fixed && (! d.target.children || d.target.children.length == 0)
                ? $tree.options.fixedDepth
                : d.target.y;

            if ($tree.options.bias == 'leaf' && d.source.nodeDepth != undefined && d.target.nodeDepth != undefined) {
                //Sigh. This is gonna be a pain in the ass.

                //just blissfully assume that we should be at the end.
                targetY = $tree.options.fixedDepth - d.target.nodeDepth * $tree.options.distance;
                sourceY = $tree.options.fixedDepth - d.source.nodeDepth * $tree.options.distance;

                if (d.source.parent == undefined) {
                    sourceY = d.source.y;
                }

            }

            return { source : sourceY, target : targetY }
        }

        if (this.options.lineStyle == 'curve') {
            this.diagonal = d3.svg.diagonal()
                .projection(function(d) {
                    var y = $tree.options.fixed && (! d.children || d.length == 0)
                        ? $tree.options.fixedDepth
                        : d.y;
                    return [y, d.x];
                });
        }
        else if (this.options.lineStyle == 'straight') {
            this.diagonal = function(d) {

                var yCoords = getYCoords(d);

                return "M" + yCoords.source + ',' + d.source.x + 'L' + yCoords.target + ',' + d.target.x;
            }
        }
        else if (this.options.lineStyle == 'square') {
            this.diagonal = function(d) {

                var yCoords = getYCoords(d);

                return "M" + yCoords.source + ',' + d.source.x +
                       'L' + yCoords.source + ',' + d.target.x +
                       'L' + yCoords.target + ',' + d.target.x
                ;
            }
        }
        else if (this.options.lineStyle == 'step') {
            this.diagonal = function(d) {

                var yCoords = getYCoords(d);

                var halfY = (yCoords.target - yCoords.source ) / 2 + yCoords.source;

                return "M" + yCoords.source + ',' + d.source.x +
                       'L' + halfY + ',' + d.source.x +
                       'L' + halfY + ',' + d.target.x +
                       'L' + yCoords.target + ',' + d.target.x
                ;
            }
        }

        // Compute the new tree layout.
        this.nodes = this.treeLayout.nodes(this.dataset()).reverse();
        this.calculateNodeDepths(this.nodes);

        this.dataset().x0 = bounds.size.height / 2;
        this.dataset().y0 = 0;

        function toggleAll(d) {
            if (d.children) {
                d.children.forEach(toggleAll);
                if (d.open == false) {
                    $tree.toggle(d);
                }
            }
        }

        var root = this.dataset();
        if (root.children) {
            root.children.forEach(toggleAll);
        }


        this.updateTree(this.dataset());
        this.initialized = true;
    },


    toggle: function (d) {
        if (d.children != undefined) {
            d._children = d.children;
            d.children = null;
            d.open = false;
        } else {
            d.children = d._children;
            d._children = null;
            d.open = true;

        }
    },


});

} );
