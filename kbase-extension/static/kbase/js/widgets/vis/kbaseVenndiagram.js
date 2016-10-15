/*

Circles are:

    c1    c2

       c3


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

	    name: "kbaseVenndiagram",
	  parent : kbaseVisWidget,

        version: "1.0.0",
        options: {

            xGutter     : 0,
            xPadding    : 0,
            yPadding    : 0,

            xOffset : 0,
            yOffset : 0,
            overlap : 0.2,
            fillOpacity : 0.8,

            startAngle : 2 * Math.PI * 150 /360,

            strokeWidth : 2,
            strokeColor : function() { return 'black'},
            //fillColor : d3.scale.category20(),
            fillColor : function (idx, d, $venn) {

                if ($venn.fillScale == undefined) {
                    $venn.fillScale = d3.scale.category20();
                };
                if ($venn.circleColors == undefined) {
                    $venn.circleColors = [];
                }

                if (d.data.fillColor) {
                    $venn.circleColors[idx] = d.data.fillColor;
                    return d.data.fillColor;
                }

                if (d.fillColor) {
                    $venn.circleColors[idx] = d.fillColor;
                    return d.fillColor;
                }

                if ($.isArray(idx)) {

                    var colors = [];
                    $.each(
                        idx,
                        function (idx, val) {
                            colors.push( d3.rgb($venn.options.fillColor(val, d, $venn) ) );
                        }
                    );

                    var blend = d3.rgb();
                    var diminisher = 2;
                    $.each(
                        colors,
                        function (idx, color) {
                            blend.r += Math.floor(color.r / diminisher);
                            blend.g += Math.floor(color.g / diminisher);
                            blend.b += Math.floor(color.b / diminisher);
                        }
                    );

                    return blend.toString();

                }
                else {

                    var color = $venn.circleColors[idx];

                    if (color == undefined) {
                        color = $venn.circleColors[idx] = $venn.fillScale(idx);
                    }
                    return color;
                }
            },
            circleFontSize : '18pt',
            intersectFontSize : '24pt',

            drawLabels : true,
            tooltips : true,

            radiusScale : 1.00,

        },

        _accessors : [

        ],

        init : function(options) {
            this._super(options);

            return this;
        },

        intersectCircles : function (c1, c2) {
            //My life is pain.

            //First, we convert the polar coordinates into cartesian.

            var cc1 = {
                x : Math.cos(c1.angle) * c1.originDistance,
                y : - Math.sin(c1.angle) * c1.originDistance,
            };

            var cc2 = {
                x : Math.cos(c2.angle) * c1.originDistance,
                y : - Math.sin(c2.angle) * c1.originDistance,
            };

            var lowerLeftPoint = {
                x : Math.min(cc1.x, cc2.x),
                y : Math.min(cc1.y, cc2.y),
            };

            var midPoint = {
                x : lowerLeftPoint.x + Math.abs(cc1.x - cc2.x) / 2,
                y : lowerLeftPoint.y + Math.abs(cc1.y - cc2.y) / 2,
            };

            var width  = (cc1.x - cc2.x);
            var height = (cc1.y - cc2.y);


            //get the lower right angle. Assume that there is no width by default
            var lowerRightAngle = Math.PI / 2;
            if (width != 0) {
                lowerRightAngle = Math.atan(height / width);
            }

            //and the complement, in RADIANS.
            var complementAngle = (Math.PI / 2 - lowerRightAngle);

            var adjacentSide = Math.sqrt( Math.pow(midPoint.x - lowerLeftPoint.x, 2) + Math.pow(midPoint.y - lowerLeftPoint.y, 2) );


            var oppSide = Math.sin(Math.acos(adjacentSide / c2.r )) * c2.r;
            var distance = oppSide;

            var i1 = {
                x : midPoint.x + Math.cos(complementAngle) * distance,//c1.r * Math.sqrt(3) / 2,
                y : midPoint.y - Math.sin(complementAngle) * distance,//c1.r * Math.sqrt(3) / 2,
            };

            var i2 = {
                x : midPoint.x + Math.cos(complementAngle + Math.PI) * distance,//c1.r * Math.sqrt(3) / 2,
                y : midPoint.y - Math.sin(complementAngle + Math.PI) * distance,//c1.r * Math.sqrt(3) / 2,
            };

            var mag1 = Math.sqrt(Math.pow(i1.x, 2) + Math.pow(i1.y, 2));
            var mag2 = Math.sqrt(Math.pow(i2.x, 2) + Math.pow(i2.y, 2));

            var ret = mag1 > mag2
                ? [i1, i2, midPoint]
                : [i2, i1, midPoint];

            return ret;

            return [i1, i2, midPoint];

        },


        renderChart : function() {
            var bounds = this.chartBounds();
            var $venn  = this;
            var dataset = $venn.dataset();

            if (dataset == undefined) {
                return;
            }

            var radius = this.options.radius || Math.min(bounds.size.width, bounds.size.height) / 2;
            radius *= this.options.radiusScale;

            var venn = this.data('D3svg').select( this.region('chart') ).selectAll('.venn').data([0]);
            venn.enter().append('g')
                .attr('class', 'venn')
                .attr('transform',
                    'translate('
                        + (bounds.size.width / 2 + this.options.xOffset)
                        + ','
                        + (bounds.size.height / 2  + this.options.yOffset)
                        + ')'
                );

            radius = radius * .5;   //basically just guessing at a magic number that looks reasonably good

            radius = this.options.radius || radius;
            var overlap = this.options.overlap;

            var overlapRadius = radius * (1 - overlap);

            var numCircles = 3;

            var circleData = [

                {
                    id : 0,
                    angle : $venn.options.startAngle,
                    r : radius,
                    originDistance : overlapRadius,
                },
                {
                    id : 1,
                    angle : $venn.options.startAngle + (2 * Math.PI / numCircles),
                    r : radius,
                    originDistance : overlapRadius,
                },
                {
                    id : 2,
                    angle : $venn.options.startAngle + 2 * (2 * Math.PI / numCircles),
                    r : radius,
                    originDistance : overlapRadius,
                },

            ];


            var intersects = this.intersectCircles(circleData[0], circleData[1]);
            var intersects2 = this.intersectCircles(circleData[1], circleData[2]);
            var intersects3 = this.intersectCircles(circleData[0], circleData[2]);

            var necessary_keys = ['c1', 'c2', 'c3', 'c1c3', 'c1c2', 'c2c3', 'c1c2c3'];
            $.each(
              necessary_keys,
              function(i,v) {
                if (dataset[v] == undefined) {
                  dataset[v] = {value : 0, label : ''}
                }
              }
            );


            var labelData = [//];/*
                {
                    angle : circleData[0].angle,
                    label : dataset.c1.label,
                    value : dataset.c1.value,
                    radius : overlapRadius * 1.3,
                    anchor : 'end',
                    fontSize : this.options.circleFontSize,
                    dy : dataset.c1.ldy
                },
                {
                    angle : circleData[0].angle,
                    //label : dataset.c1.label,
                    value : dataset.c1.value,
                    radius : overlapRadius * 1.3,
                    anchor : 'end',
                    fontSize : this.options.circleFontSize,
                    dy : dataset.c1.vdy || '1.5em',
                },
                {
                    angle : circleData[1].angle,
                    label : dataset.c3.label,
                    value : dataset.c3.value,
                    radius : overlapRadius * 1.3,
                    anchor : 'start',
                    fontSize : this.options.circleFontSize,
                    dy : dataset.c3.ldy
                },
                {
                    angle : circleData[1].angle,
                    //label : dataset.c2.label,
                    value : dataset.c3.value,
                    radius : overlapRadius * 1.3,
                    anchor : 'start',
                    fontSize : this.options.circleFontSize,
                    dy : dataset.c3.vdy || '1.5em',

                },
                {
                    angle : circleData[2].angle,
                    label : dataset.c2.label,
                    value : dataset.c2.value,
                    radius : overlapRadius * 1.3,
                    anchor : 'middle',
                    fontSize : this.options.circleFontSize,
                    dy : dataset.c2.ldy
                },
                {
                    angle : circleData[2].angle,
                    //label : dataset.c3.label,
                    value : dataset.c2.value,
                    radius : overlapRadius * 1.3,
                    anchor : 'middle',
                    fontSize : this.options.circleFontSize,
                    dy : dataset.c2.vdy || '1.5em',
                },
                {
                    angle : 2 * Math.PI * 90 / 360,
                    //label : dataset.c1c2.label,
                    value : dataset.c1c2.value,
                    radius : overlapRadius * 0.7,
                    fontSize : this.options.intersectFontSize,
                    dy : dataset.c1c2.vdy
                },
                {
                    angle : 2 * Math.PI * 210 / 360,
                    //label : dataset.c1c3.label,
                    value : dataset.c1c3.value,
                    radius : overlapRadius * 0.7,
                    fontSize : this.options.intersectFontSize,
                    dy : dataset.c1c3.vdy
                },
                {
                    angle : 2 * Math.PI * 330 / 360,
                    //label : dataset.c2c3.label,
                    value : dataset.c2c3.value,
                    radius : overlapRadius * 0.7,
                    fontSize : this.options.intersectFontSize,
                    dy : dataset.c2c3.vdy
                },

                {
                    angle : 0,
                    //label : dataset.c1c2c3.label,
                    value : dataset.c1c2c3.value,
                    radius : 0,
                    fontSize : this.options.intersectFontSize,
                    dy : dataset.c1c2c3.vdy
                },
            ];

            var transitionTime = this.initialized
                ? this.options.transitionTime
                : 0;

            var circleAction = function(d) {

                this
                    .on('mouseover', function(d) {
                        d3.select(this).attr('fill-opacity', 1);


                        if ($venn.options.tooltips) {
                            var tooltip = $venn.tooltip(d);

                            if (tooltip) {
                                $venn.showToolTip(
                                    {
                                        label : tooltip,
                                        event : {
                                            pageX : $venn.options.cornerToolTip ? $venn.$elem.prop('offsetLeft') + 5 : d3.event.pageX,
                                            pageY : $venn.options.cornerToolTip ? $venn.$elem.prop('offsetTop') + 20 : d3.event.pageY
                                        }
                                    }
                                );
                            }
                        }

                    })
                    .on('mouseout', function(d) {

                        var target = d3.event.toElement;

                        //assume that if we've moused over text, that that means we're over the label.
                        if (target && target.tagName != 'text') {
                            d3.select(this).attr('fill-opacity', d.fillOpacity || $venn.options.fillOpacity);
                            if ($venn.options.tooltips) {
                                $venn.hideToolTip();
                            }
                        }
                    })
                    .on('click', function(d) {
                        if (d.data.action) {
                            var func = d.data.action;
                            if (typeof func == 'string') {
                                func = Function("d", func);
                            }

                            func.call(this, $venn, d.data);
                        }
                    })
            };


            /*filledCircles
                .call(circleAction)
                .transition().duration(transitionTime)
                //.attr('cx', function (d) { var x = return Math.cos(d.angle) * d.originDistance } )
                .attr('cx', function (d, idx) { var x =   Math.cos(d.angle) * d.originDistance; return d.cx || x; } )
                .attr('cy', function (d, idx) { var y = - Math.sin(d.angle) * d.originDistance; return d.cy || y; } )
                .attr('r', function (d) {return d.r} )
                //.attr('stroke', function(d, idx) { return d.strokeColor || $venn.options.strokeColor(idx, d) })
                //.attr('stroke-width', function (d) { return d.strokeWidth || $venn.options.strokeWidth } )
                .attr('fill', function(d, idx) { var c =  d.fillColor || $venn.options.fillColor(idx, d, $venn); return c; })
                .attr('fill-opacity', function (d) { return d.fillOpacity || $venn.options.fillOpacity })
                .call($venn.endall, function() {
                    $venn.initialized = true;
                })
            ;*/

var arcs = [
    { d : 'M ' + intersects3[0].x + ' ' + intersects3[0].y
        + ' A ' + radius + ' ' + radius + ' 0 1 0 ' + intersects[0].x + ' ' + intersects[0].y
        + ' A ' + radius + ' ' + radius + ' 0 0 1 ' + intersects2[1].x + ' ' + intersects2[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 1 ' + intersects3[0].x + ' ' + intersects3[0].y
        + ' Z',
    circle : 0, fillColor : '#F00', data : dataset.c1},
    { d : 'M ' + intersects3[0].x + ' ' + intersects3[0].y
        + ' A ' + radius + ' ' + radius + ' 0 1 1 ' + intersects2[0].x + ' ' + intersects2[0].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects[1].x + ' ' + intersects[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects3[0].x + ' ' + intersects3[0].y
        + ' Z',
    circle : 1, fillColor : '#00F', data : dataset.c2},
    { d : 'M ' + intersects2[0].x + ' ' + intersects2[0].y
        + ' A ' + radius + ' ' + radius + ' 0 1 1 ' + intersects[0].x + ' ' + intersects[0].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects3[1].x + ' ' + intersects3[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects2[0].x + ' ' + intersects2[0].y
        + ' Z',
    circle : 2, fillColor : '#0F0', data : dataset.c3},
    { d : 'M ' + intersects[1].x + ' ' + intersects[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects2[1].x + ' ' + intersects2[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects3[1].x + ' ' + intersects3[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects[1].x + ' ' + intersects[1].y
        + ' Z',
    circle : [0,1,2], data : dataset.c1c2c3},
    { d : 'M ' + intersects[0].x + ' ' + intersects[0].y
        + ' A ' + radius + ' ' + radius + ' 0 0 1 ' + intersects2[1].x + ' ' + intersects2[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects3[1].x + ' ' + intersects3[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 1 ' + intersects[0].x + ' ' + intersects[0].y
        + ' Z',
    circle : [0,2], data : dataset.c1c3},
    { d : 'M ' + intersects3[0].x + ' ' + intersects3[0].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects2[1].x + ' ' + intersects2[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 1 ' + intersects[1].x + ' ' + intersects[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects3[0].x + ' ' + intersects3[0].y
        + ' Z',
    circle : [0,1], data : dataset.c1c2},
    { d : 'M ' + intersects2[0].x + ' ' + intersects2[0].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects[1].x + ' ' + intersects[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 1 ' + intersects3[1].x + ' ' + intersects3[1].y
        + ' A ' + radius + ' ' + radius + ' 0 0 0 ' + intersects2[0].x + ' ' + intersects2[0].y
        + ' Z',
    circle : [1,2], data : dataset.c2c3},

];

var arcs = venn.selectAll('.arc').data(arcs)
arcs.enter()
    .append('path')
        .attr('class', 'arc')
;
arcs
    .call(function(d) {circleAction.call(this, d)})
    .transition().duration(transitionTime)
    .attr('d', function(d) { return d.d})
    .attr('fill', function(d, idx) { var c =  $venn.options.fillColor(d.circle, d, $venn); return c; })
    .attr('stroke', 'none')
    .attr('fill-opacity', function (d) { return d.fillOpacity || $venn.options.fillOpacity })
    .call($venn.endall, function() {
        $venn.initialized = true;
    })
;

arcs.exit().remove();

            //filledCircles.exit().remove();

            var strokedCircles = venn.selectAll('.strokedCircle').data(circleData );

            strokedCircles.enter()
                .append('circle')
                    .attr('class', 'strokedCircle')
            ;

            strokedCircles
                //.call(circleAction)
                .transition().duration(transitionTime)
                .attr('cx', function (d) { return d.cx || Math.cos(d.angle) * d.originDistance } )
                .attr('cy', function (d) { return d.cy || - Math.sin(d.angle) * d.originDistance } )
                .attr('r', function (d) {return d.r} )
                .attr('fill', 'none')
                .attr('stroke', function(d, idx) { return d.strokeColor || $venn.options.strokeColor(idx, d) })
                .attr('stroke-width', function (d) { return d.strokeWidth || $venn.options.strokeWidth } )
            ;

            strokedCircles.exit().remove();



            var labelTown = function( opacity ) {

                if (opacity == undefined) {
                    opacity = 1;
                }

                this
                    .attr("text-anchor", "middle")
                    .attr('dy', function (d) {return d.dy || '0.5em'} )
                    .attr('cursor', 'default')
                ;

                if (this.attrTween) {

                    this
                        .text(function(d) {
                            return d.label || d.value;
                        })
                        .attrTween("transform", function(d, idx) {
                            //this._current=  this._current || d;
                            if (this._current == undefined) {
                                this._current = d;
                            }

                            var endPoint = d;
                            if (endPoint.radius == undefined) {
                                endPoint.radius = overlapRadius * 0.7;
                            }

                            var interpolate = d3.interpolate(this._current, endPoint);

                            this._current = interpolate(0);

                            return function(t) {
                                var d2 = interpolate(t);
                                var pos = [Math.cos(d2.angle) * d2.radius, - Math.sin(d2.angle) * d2.radius];
                                return "translate("+ pos +")";
                            };

                        })
                        .attr('font-size', function(d) { return d.fontSize || '12pt'})

                    }


                return this;
            }

            if ($venn.options.labels) {

                var labels = venn.selectAll('text').data(labelData );

                labels.enter()
                    .append('text')
                ;

                labels
                    .transition().duration(transitionTime)
                    .call(labelTown)
                ;
                labels.exit().remove();
            }



        },

        tooltip : function(d) {
            if (d.data.tooltip != undefined) {
                return d.data.tooltip;
            }
            else if (d.data.label != undefined) {
                return d.data.label;
            }
            else {
                return undefined;
            }
        },

        renderXAxis : function() {},
        renderYAxis : function() {},


    });

} );
