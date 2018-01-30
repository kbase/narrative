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

	    name: "kbasePiechart",
	  parent : kbaseVisWidget,

        version: "1.0.0",
        options: {

            xGutter     : 0,
            xPadding    : 0,
            yPadding    : 0,

            overColor : 'blue',
            innerRadius : 0,
            outerRadius : 0,
            startAngle : 0,
            //endAngle : 2 * Math.PI,
            gradient : true,
            startingPosition : 'final',
            strokeWidth : 1,

            strokeColor : 'white',
            highlightColor : 'black',
            sliceOffset : 25,

            bgColor : 'rgba(0,0,0,0)',

            xOffset : 0,
            yOffset : 0,

            outsideLabels : true,
            labels : true,
            autoEndAngle : false,
            colorScale : d3.scale.category20(),
            outerArcOpacity : .4,
            cornerToolTip : false,
            draggable : true,
            tooltips : true,

            rescaleChildren : true,
            outerRadiusInset : 10,
        },

        _accessors : [

        ],

        init : function(options) {
            this._super(options);

            if (this.options.endAngle == undefined) {
                this.options.endAngle = this.options.startAngle + 2 * Math.PI;
            }

            this.pieSize = this.options.endAngle - this.options.startAngle;

            this.uniqueID = $.proxy( function(d) {
                if (d.data == undefined) {
                    d.data = {};
                }
                var ret = d.data.id || (d.data.id = this.ticker() );
                return ret;
            }, this);

            if (this.parent != undefined) {
                this.outerRadiusInset = 0;
            }

            return this;
        },

        childOptions : function(idx, dataset) {
            var options = this._super(idx, dataset);

            if (this.options.rescaleChildren) {
                options.outerRadius = this.options.innerRadius * (idx + 1);
                options.innerRadius = this.options.innerRadius;
            }

            return options;
        },

        reenter : function(idx, dataset, parent) {
            if (this.options.rescaleChildren) {
                this.options.outerRadius = parent.options.innerRadius * (idx + 1);
                this.options.innerRadius = parent.options.innerRadius;
            }

            return this;
        },

        startingPosition : function(d, idx) {

            if (this.initialized) {

                if (idx < this.lastPieData.length - 1) {
                    return {startAngle : this.lastPieData[idx + 1].startAngle, endAngle : this.lastPieData[idx + 1].startAngle};
                }
                else {
                    return {startAngle : this.options.endAngle, endAngle: this.options.endAngle};
                }
            }

            //the first line animates the wedges in place, the second animates from the top, the third draws them rendered
            else if (this.options.startingPosition == 'slice') {
                return {startAngle : d.startAngle, endAngle : d.startAngle};
            }
            else if (this.options.startingPosition == 'top') {
                return {startAngle : this.options.startAngle, endAngle : this.options.startAngle};
            }
            else if (this.options.startingPosition == 'final') {
                return {startAngle : d.startAngle, endAngle : d.endAngle};
            }

        },

        midAngle : function(d){
            var ret =  (d.startAngle + (d.endAngle - d.startAngle)/2);
            return ret;
        },

        midPosition : function(d) {
        var m1 = (this.midAngle(d)) ;//- this.options.startAngle);
            var midAngle = m1 % (2 * Math.PI);

            var ret =
                (0 < midAngle && midAngle < Math.PI) || midAngle < - Math.PI
                    ? 1
                    : -1;
            return ret;
        },

        useOutsideLabels : function(d) {
            // logic is:
            // if the global flag is set to true AND we haven't overridden it, then we use them outside
            // otherwise, if we have set a local value, then that has to be true, regardless of the global flag
            return (this.options.outsideLabels && d.data.outsideLabel == undefined) || d.data.outsideLabel;
        },

        setDataset : function(newDataset) {

            if (newDataset != undefined) {
                $.each(
                    newDataset,
                    function (idx, val) {

                    if (typeof val == 'number') {
                        newDataset[idx] = {value : val};
                    }
                    }
                );
            }

            this._super(newDataset);
        },

        outerRadius : function() {

            var bounds = this.chartBounds();

            var radius = this.options.outerRadius;
            if (radius <= 0) {
                var diameter = bounds.size.width < bounds.size.height
                    ? bounds.size.width
                    : bounds.size.height;

                radius = diameter / 2 + radius;

                if (diameter < 0) {
                    diameter = 0;
                }

                if (radius < 0) {
                    radius = diameter / 2;
                }
            }
            return radius;
        },

        innerRadius : function() {
            var innerRadius = this.options.innerRadius;
            if (innerRadius < 0) {
                innerRadius = this.outerRadius() + this.options.innerRadius;
            }

            if (innerRadius < 0) {
                innerRadius = 0;
            }

            return innerRadius;
        },

        sliceAction : function($pie) {

            return function() {
                var radius = $pie.outerRadius() - $pie.options.outerRadiusInset;

                var outerArcMaker = d3.svg.arc()
                    .innerRadius(radius)
                    .outerRadius(radius + 10);

                this.on('mouseover', function(d) {

                    if (d.data.gap) {
                        return;
                    }

                    var slice = this;

                    if ($pie.dragging) {
                        return;
                    }

                    $pie.outerArc
                        .transition()
                        .duration(0)
                        .attr('fill-opacity', $pie.options.outerArcOpacity)
                        .attr('fill', function (d2, idx) { return d.data.color || $pie.options.colorScale(idx, d.data, $pie) })
                        .attr('transform', function (d2) { return d3.select(slice).attr('transform') } )
                        .attr('d', function(d2) {
                            return outerArcMaker({startAngle : d.startAngle, endAngle : d.endAngle});
                        })
                    ;

                    var coordinates = [0, 0];
                    coordinates = d3.mouse(this);
                    var x = coordinates[0];
                    var y = coordinates[1];

                    if ($pie.options.tooltips) {
                        var tooltip = $pie.tooltip(d);
                        if (tooltip) {
                            $pie.showToolTip(
                                {
                                    label : tooltip,
                                    event : {
                                        pageX : $pie.options.cornerToolTip ? $pie.$elem.prop('offsetLeft') + 5 : d3.event.pageX,
                                        pageY : $pie.options.cornerToolTip ? $pie.$elem.prop('offsetTop') + 20 : d3.event.pageY
                                    }
                                }
                            );
                        }
                    }

                })
                .on('mouseout', function(d) {
                    if (d.data.gap) {
                        return;
                    }
                    if ($pie.options.tooltips) {
                        $pie.hideToolTip();
                    }
                    $pie.outerArc.attr('fill-opacity', 0);
                })
                .on('dblclick', function(d) {
                    if (d.data.gap) {
                        return;
                    }
                    if ($pie.options.draggable) {

                        $pie.options.startAngle = $pie.options.startAngle - d.startAngle;
                        $pie.renderChart();
                    }
                })
                ;
                return this;
            }
        },

        tooltip : function(d) {
            if (d.data.tooltip != undefined) {
                return d.data.tooltip;
            }
            else if (d.data.label != undefined) {
                return d.data.label + ' : ' + d.data.value;
            }
            else {
                return undefined;
            }
        },

        pieData : function(dataset) {
            this.pieLayout = d3.layout.pie()
                .sort(null)
                .startAngle(this.options.startAngle)
                .endAngle(this.options.endAngle)
                .value(function (d, idx) { return d.value ;});

            return this.pieLayout(dataset);
        },

        renderChart : function() {

            if (this.dataset() == undefined) {
                return;
            }

            if (this.dataset().length == 0) {
                this.initialized = false;
                this.lastPieData = undefined;
            }

            var startingOpacity = 0;
            if (this.options.startingPosition == 'final') {
                startingOpacity = 1;
            }

            var bounds = this.chartBounds();
            var $pie  = this;

            if (this.options.autoEndAngle) {
                var percent = 0;
                $.each(
                    $pie.dataset(),
                    function (idx, val) {
                        percent += val.value;
                    }
                );

                if (percent > 1) {
                    percent = 1;
                }
                this.options.endAngle = percent * 2 * Math.PI;

            }
            else {
                this.options.endAngle = this.options.startAngle + this.pieSize;
            }

            var pieData = this.pieData($pie.dataset());

            var radius = this.outerRadius() - this.options.outerRadiusInset;
            var innerRadius = this.innerRadius();

            var arcMaker = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(radius);

            var textArcMaker = d3.svg.arc()
                .innerRadius(innerRadius + (radius - innerRadius) * 8 / 10)
                .outerRadius(innerRadius + (radius - innerRadius) * 8 / 10);

            var smallArcMaker = d3.svg.arc()
                .innerRadius(innerRadius + (radius - innerRadius) / 2)
                .outerRadius(innerRadius + (radius - innerRadius) / 2);

            var funkyTown = function() {

                //this.attr('fill', function (d, idx) { return d.data.color });
                /*this.attr('transform',
                    function (d) {
                        var pos = arcMaker.centroid(d);
                        return "translate(" + pos + ")";
                    }
                );*/

                this
                    .attr('transform', function(d, idx) {
                        if (d.data.offset == undefined) {
                            return;
                        }

                        var sliceMover = d3.svg.arc()
                            .innerRadius(0)
                            .outerRadius(d.data.offset || 0);

                        var pos = sliceMover.centroid(d);

                        return 'translate(' + pos + ')';

                    })
                    .attr('fill-opacity', function(d) { return d.data.gap ? 0 : 1 })
                    .attr('stroke-opacity', function(d) { return d.data.gap ? 0 : 1 })
                ;


                if (! $pie.options.gradient) {
                    this.attr('fill', function(d, idx) {

                        if (d.data.color == undefined) {
                            d.data.color = $pie.options.colorScale(idx, d.data, $pie);
                        }

                        return d.data.color
                    });
                }

                if (this.attrTween) {
                    if ($pie.options.gradient) {
                        this
                            //*
                            .attrTween('fill',
                                function (d, idx) {
                                    var uniqueFunc = $pie.uniqueness();

                                    var currentID = uniqueFunc == undefined
                                        ? undefined
                                        : uniqueFunc(d);

                                    var gradID = d.data.gradID;
                                    if (gradID == undefined) {

                                        var newGradID;
                                        if ($pie.lastPieData != undefined && idx < $pie.lastPieData.length) {


                                            //no id? we're using indexes. Easy.
                                            if (currentID == undefined) {
                                                newGradID = $pie.lastPieData[idx].data.gradID;
                                            }
                                            //id? Shit. Iterate and look up by the id
                                            else {
                                                $.each(
                                                    $pie.lastPieData,
                                                    function (idx, val) {
                                                        var lastID = uniqueFunc(val);
                                                        if (lastID == currentID) {
                                                            newGradID = val.data.gradID;
                                                            return;
                                                        }
                                                    }
                                                );
                                            }

                                        }

                                        if (newGradID == undefined) {
                                            newGradID = $pie.uuid();
                                        }

                                        gradID = d.data.gradID = newGradID;
                                    }

                                    var gradient = d.data.color;

                                    if (d.data.color == undefined) {
                                        d.data.color = $pie.options.colorScale(idx, d.data, $pie);
                                    }

                                    gradient = 'url(#'
                                        + $pie.radialGradient(
                                            {
                                                startColor : d.data.color,
                                                stopColor : $pie.options.gradient ? $pie.options.radialGradientStopColor : d.data.color,
                                                id : gradID,
                                                r : radius
                                            }
                                        ) + ')';

                                    return function(t) { return gradient};
                                }
                           )//*/
                    }
                    this
                        .attrTween("d", function(d, idx) {

                            //this._current = this._current || d;//{startAngle : this.options.startAngle, endAngle : this.options.startAngle};
                            //this._current = this._current || {startAngle : d.startAngle, endAngle : d.startAngle};
//$pie.lastPieData = pieData;
                            if (this._current == undefined) {

                                this._current = $pie.startingPosition(d, idx);
                            }

                            //if (idx > 0) {
                            //    this._current = { startAngle : pieData[idx - 1].startAngle, endAngle : pieData[idx - 1].endAngle};
                            //}
                            var interpolate = d3.interpolate(this._current, d);

                            this._current = interpolate(0);
                            return function(t) {
                                return arcMaker(interpolate(t));
                            };
                        })
                    ;
                }

                return this;

            };

            var labelTown = function labelTown( opacity ) {

                if (opacity == undefined) {
                    opacity = 1;
                }

                this
                    .attr("text-anchor", "middle")
                ;

                if (this.attrTween) {

                    this
                        .text(function(d) {
                            return d.data.label;
                        })
                        .attrTween('fill-opacity', function (d, idx) {
                            if (this._currentOpacity == undefined) {
                                this._currentOpacity = $pie.initialized ? 0 : startingOpacity;
                            }
                            var interpolate = d3.interpolate(this._currentOpacity, opacity);
                            this._currentOpacity = interpolate(0);
                            var $me = this;
                            return function (t) {
                                return $me._currentOpacity = interpolate(t);
                            }
                        })
                        .attrTween("transform", function(d, idx) {
                            //this._current=  this._current || d;
                            if (this._current == undefined) {
                                this._current = $pie.startingPosition(d, idx);
                            }

                            var endPoint = d;
                            if (opacity == 0) {
                                endPoint = {startAngle : d.startAngle, endAngle : d.startAngle};
                                if (idx > 0 && pieData.length) {
                                    if (idx > pieData.length) {
                                        idx = pieData.length;
                                    }
                                    endPoint = {startAngle : pieData[idx - 1].endAngle, endAngle : pieData[idx - 1].endAngle};
                                }
                            }

                            var interpolate = d3.interpolate(this._current, endPoint);

                            this._current = interpolate(0);

                            var useOutsideLabels = $pie.useOutsideLabels(d);

                            var myArcMaker = useOutsideLabels
                                ? textArcMaker
                                : arcMaker;

                            return function(t) {
                                var d2 = interpolate(t);
                                var pos = myArcMaker.centroid(d2);
                                if (useOutsideLabels) {
                                    pos[0] = radius * 1.06 * $pie.midPosition(d2);
                                    pos[1] += 2;
                                }
                                return "translate("+ pos +")";
                            };

                        })
                        .styleTween("text-anchor", function(d){
                            this._current = this._current || d;
                            var interpolate = d3.interpolate(this._current, d);
                            this._current = interpolate(0);

                            var useOutsideLabels = $pie.useOutsideLabels(d);

                            return function(t) {
                                var d2 = interpolate(t);
                                if (useOutsideLabels) {
                                    return $pie.midPosition(d2) > 0 ? "start" : "end";
                                }
                                else {
                                    return 'middle';
                                }
                            };
                        });
                    }


                return this;
            }

            var drag = d3.behavior.drag();

                drag.on('dragstart', function(d) {
                    //d.__dragX = 0;
                    //d.__dragY = 0;
                    this.__delta = 0;
                    $pie.outerArc.attr('fill-opacity', 0);
                    $pie.dragging = true;
                })
                .on('drag', function(d) {

                    //d.__dragX += d3.event.dx;
                    //d.__dragY += d3.event.dy;

                    this.__delta +=  $pie.midPosition(d) * d3.event.dy;// + d3.event.dx;// - d3.event.dx;

                    var dragThrottle = 20;

                    if (this.__delta > dragThrottle || this.__delta < -1 * dragThrottle) {
                        var distance = this.__delta;

                        var currentStartAngle = $pie.options.startAngle;
                        var proposedStartAngle = currentStartAngle + Math.PI * (distance / 2) / radius;

                        $pie.options.startAngle = proposedStartAngle;
//XXX                        $pie.options.endAngle = $pie.options.startAngle + 2 * Math.PI;
                        $pie.renderChart();
                        this.__delta = 0;

                    }

                })
                .on('dragend', function(d) {
                    //delete d.__dragX;
                    delete this.__delta;
                    $pie.dragging = false;
                })
                ;

            //there is no mouse action on a pie chart for now.

            var labelAction = function() { return this };

            var pie = this.D3svg().select( this.region('chart') ).selectAll('.pie').data([0]);
            pie.enter().append('g')
                .attr('class', 'pie')
                .attr('transform',
                    'translate('
                        + (bounds.size.width / 2 + this.options.xOffset)
                        + ','
                        + (bounds.size.height / 2 + this.options.yOffset)
                        + ')'
                );
                $.each(
                    pieData,
                    function (idx, val) {
                        if (val.data.id != undefined) {
                            val.id = val.data.id;
                        }
                    }
                );

            if ($pie.options.pieColor != undefined) {
                var chartSelection = this.D3svg().select( this.region('chart') ).data([0]);

                var pieBG = chartSelection.selectAll('.pieBG').data([0]);

                var pieMaker = d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(radius);

                //var pieBG = this.D3svg().select( this.region('chart') ).select('.pie').selectAll('.pieBG').data([0]);
                pieBG.enter().insert('path', '.pie')
                    .attr('class', 'pieBG')
                    .attr('transform',
                        'translate('
                            + (bounds.size.width / 2 + this.options.xOffset)
                            + ','
                            + (bounds.size.height / 2 + this.options.yOffset)
                            + ')'
                    )
                    .attr('d', function(d) { return pieMaker({startAngle : 0, endAngle : 2 * Math.PI}) } )
                ;
                pieBG
                    .attr('fill', $pie.options.pieColor);
            }


            $pie.outerArc = pie.selectAll('.outerArc').data([0]);

            $pie.outerArc
                .enter()
                    .append('path')
                        .attr('class', 'outerArc')
            ;

            var slices = pie.selectAll('.slice').data(pieData, this.uniqueness());

            slices
                .enter()
                    .append('path')
                        .attr('class', 'slice')
                        .attr('fill', function (d, idx) {
                            if (d.data.color == undefined) {
                                d.data.color = $pie.options.colorScale(idx, d.data, $pie);
                            }
                            return d.data.color
                        } )
                        .attr('stroke', $pie.options.strokeColor)
                        .attr('stroke-width', $pie.options.strokeWidth)
                        .attr('stroke-linejoin', 'bevel')
                        //.call(funkyTown);
            ;

            var transitionTime = this.initialized || this.options.startingPosition != 'final'
                ? this.options.transitionTime
                : 0;

            //transitionTime = this.options.transitionTime;

            slices
                .call($pie.sliceAction($pie))
                .transition().duration(transitionTime)
                .call(funkyTown)
                .call($pie.endall, function() {
                    $pie.initialized = true;
                    $pie.lastPieData = pieData;
                });

            if ($pie.options.draggable) {
                slices.call(drag);
            }



            slices
                .exit()
                    //.remove();
                    .transition()
                    .duration(transitionTime)
                    .attrTween("d", function(d, idx) {

                            var endPoint = {startAngle : d.startAngle, endAngle : d.startAngle};
                            if (idx > 0 && pieData.length && idx <= pieData.length) {
                                endPoint = {startAngle : pieData[idx - 1].endAngle, endAngle : pieData[idx - 1].endAngle};
                            }

                            var interpolate = d3.interpolate(this._current, endPoint);

                            this._current = interpolate(0);
                            return function(t) {
                                return arcMaker(interpolate(t));
                            };
                        })
                    .each('end', function(d) { d3.select(this).remove() } )
                    ;

            var labelG = this.D3svg().select( this.region('chart') ).selectAll('.labelG').data([0]);
            labelG.enter().append('g')
                .attr('class', 'labelG')
                .attr('transform',
                    'translate('
                        + (bounds.size.width / 2 + this.options.xOffset)
                        + ','
                        + (bounds.size.height / 2 + this.options.yOffset)
                        + ')'
                );

            var labels = labelG.selectAll('.label')
                .data(
                    pieData.filter( function(d) {
                        return (
                               ($pie.options.labels || d.data.forceLabel)
                            && d.data.label != undefined
                            && d.data.label.length
                        )
                    }),
                    this.uniqueness()
                )

            ;

            labels
                .enter()
                    .append('text')
                        .attr('class', 'label')
                        .call(function() { labelTown.call(this, 1) } )
            ;

            labels
                    .call(labelAction)
                    .transition()
                    .duration(transitionTime)
                    .call(function() { labelTown.call(this, 1) } )
            ;

            labels
                .exit()
                    .transition()
                    .duration(transitionTime)
                    .call(function() { labelTown.call(this, 0) } )
                    .each('end', function(d) { d3.select(this).remove() } )
            ;

            var lineTown = function(opacity) {

                if (opacity == undefined) {
                    opacity = 1;
                }

                if (this.attrTween) {
                    this
                        .attrTween('stroke-opacity', function (d, idx) {
                            if (this._currentOpacity == undefined) {
                                this._currentOpacity = $pie.initialized ? 0 : startingOpacity;
                            }
                            var interpolate = d3.interpolate(this._currentOpacity, opacity);
                            this._currentOpacity = interpolate(0);
                            var $me = this;
                            return function (t) {
                                return $me._currentOpacity = interpolate(t);
                            }
                        })
                        .attrTween("points", function(d, idx){
                            this._current = this._current || $pie.startingPosition(d, idx);

                            var endPoint = d;
                            if (opacity == 0) {
                                endPoint = {startAngle : d.startAngle, endAngle : d.startAngle};
                                if (idx > 0 && pieData.length) {
                                    if (idx > pieData.length) {
                                        idx = pieData.length;
                                    }
                                    endPoint = {startAngle : pieData[idx - 1].endAngle, endAngle : pieData[idx - 1].endAngle};
                                }

                            }

                            var interpolate = d3.interpolate(this._current, endPoint);

                            var useOutsideLabels = $pie.useOutsideLabels(d);

                            var myArcMaker = useOutsideLabels
                                ? textArcMaker
                                : arcMaker;

                            this._current = interpolate(0);
                            return function(t) {
                                var d2 = interpolate(t);
                                var textAnchor = myArcMaker.centroid(d2);
                                if (useOutsideLabels) {
                                    textAnchor[0] = radius * 1.05 * $pie.midPosition(d2);
                                }
                                return [smallArcMaker.centroid(d2), myArcMaker.centroid(d2), textAnchor];
                            };
                        });
                }
                return this;
            };

            var lines = labelG
                .selectAll('polyline')
                .data(
                    pieData
                        .filter( function(d) {
                            return (
                                    ($pie.options.labels || d.data.forceLabel)
                                && ($pie.options.outsideLabels || d.data.outsideLabel)
                                && d.data.label != undefined
                                && d.data.label.length
                            )
                        })
                    ,
                    this.uniqueness()
                );

            lines
                .enter()
                    .append('polyline')
                        .attr('stroke', 'black')
                        .attr('stroke-width', 1)
                        .attr('fill', 'rgba(0,0,0,0)')
            ;

            lines
                .transition()
                .duration(transitionTime)
                .call(function() { lineTown.call(this, 1) } )
            ;

            lines
                .exit()
                    .transition()
                    .duration(transitionTime)
                    .call(function() { lineTown.call(this, 0) } )
                    .each('end', function(d) { d3.select(this).remove() } )
            ;

        },

        renderXAxis : function() {},
        renderYAxis : function() {},


    });

} );
