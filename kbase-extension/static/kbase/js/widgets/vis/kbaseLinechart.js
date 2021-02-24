/*
                    var sin = [];
                    var sin2 = [];
                    for (var i = 20; i < 200; i++) {
                        sin.push(
                            {
                                x : i,
                                y : 100 + 50 * Math.sin(0.1 * i),
                                y2 : 50 + 50 * Math.sin(0.1 * i)
                            }
                        );
                        sin2.push(75 + 50 * Math.sin(0.1 * i));
                    }

                    var $line =  new kbaseLinechart($('#linechart').css({width : '800px', height : '500px'}), {
                            scaleAxes       : true,
                            //debug       : true,

                            xLabel      : 'Expression profile',
                            //yLabel      : 'Meaningful data',
                            hGrid : true,
                            xLabels : false,

                            pointOver : function(d) {
                                this.showToolTip({label : 'point over obj'});
                            },
                            pointOut : function(d) {
                                this.hideToolTip();
                            },

                            dataset : [
                                {
                                    strokeColor : 'red',
                                    fillColor : 'red',
                                    values : [
                                        { x : 10, y : 10, y2 : -10},
                                        { x : 20, y : 15, y2 : -20},
                                        { x : 30, y : 16, y2 : -5},
                                        { x : 40, y : 18, y2 : -2},
                                        { x : 50, y : 15, y2 : 5},
                                        { x : 60, y : 20, y2 : 8},
                                        { x : 70, y : 22, y2 : 3},
                                        { x : 80, y : 25, y2 : 4},
                                        { x : 90, y : 18, y2 : -5},
                                        { x : 100, y : 15, y2 : -10},
                                        { x : 110, y : 10, y2 : -12},
                                        { x : 120, y : 5, y2 : -20},
                                        { x : 130, y : 8, y2 : -30},
                                        { x : 140, y : 10, y2 : -100},
                                        { x : 150, y : 4, y2 : -10},
                                    ],
                                    label : 'area',
                                    width : 0,
                                    fillOpacity : 0.3,
                                },

                                {
                                    strokeColor : 'red',
                                    label : 'parabolic',
                                    values : [0,1,4,9,16,25,{x : 60, y : 36},49,64,81,100,121,144,169],
                                    width : 1,
                                    shape : 'circle',
                                    shapeArea : 64,
                                    //fillColor : 'red',
                                },
                                {
                                    strokeColor : 'orange',
                                    label : 'jagged',
                                    values : [{x : 0, y : 180}, {x : 10, y : 160}, {x : 20, y : 140}, {x : 30, y : 120}, {x : 40, y : 100}, {x : 50, y : 80},
                                        {x : 60, y : 60, label : 'label point 1'}, {x : 70, y : 40}, {x : 80, y : 20}, {x : 90, y : 0}, {x : 100, y : 20}, {x : 110, y : 40},
                                        {x : 120, y : 60}, {x : 130, y : 80}, {x : 140, y : 100, label : 'label point 2'} ],
                                    width : 2,
                                    shape : 'square',
                                    shapeArea : 64,
                                    //fillColor : 'red',
                                    pointOver : function(d) {
                                        this.showToolTip({label : 'point over line'});
                                    },
                                    pointOut : function(d) {
                                        this.hideToolTip();
                                    }
                                },
                                {
                                    strokeColor : 'blue',
                                    label : 'sin',
                                    values : sin,
                                    width : 1,
                                    fillColor : 'blue',
                                    strokeOpacity : 0.3,
                                    fillOpacity : 0.3,

                            ],

                        }

                    );
*/

define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'd3',
    'kbaseVisWidget',
    'RGBColor',
    'geometry_rectangle',
    'geometry_point',
    'geometry_size',
], (
    KBWidget,
    bootstrap,
    $,
    d3,
    kbaseVisWidget,
    RGBColor,
    geometry_rectangle,
    geometry_point,
    geometry_size
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseLinechart',
        parent: kbaseVisWidget,

        version: '1.0.0',
        options: {
            overColor: 'yellow',
            useOverLine: true,
            highlightToFront: false,
            useLineLabelToolTip: true,

            lineWidth: 3,
            lineCap: 'round',
            strokeColor: 'black',
            fillColor: 'none',
            strokeOpacity: 1.0,
            fillOpacity: 0.3,
            xIncrementor: function (xIdx) {
                return xIdx != undefined ? xIdx + 1 : 0;
            },

            useHighlightLine: true,
            highlightLineColor: 'red',
            highlightLineWidth: 1,
            shapeArea: 64,

            xInset: 0.0,
            yInset: 0.0,
        },

        _accessors: [],

        legendOver: function legendOver(d) {
            d.svg.parentNode.appendChild(d.svg);
        },
        legendOut: function legendOut(d) {},

        extractLegend: function (dataset) {
            const legend = [];
            dataset.forEach((line, idx) => {
                legend.push({
                    color: line.strokeColor,
                    label: line.label,
                    shape: line.shape,
                    represents: line,
                });
            });

            this.setLegend(legend);
        },

        setDataset: function (dataset) {
            const $line = this;

            dataset.forEach((line, idx) => {
                if (line.values) {
                    const revLine = [];

                    const numPoints = line.values.length;

                    const xInc = $line.options.xIncrementor;

                    let xIdx = xInc();

                    for (var i = 0; i < numPoints; i++) {
                        const point = line.values[i];

                        if (!$.isPlainObject(point)) {
                            line.values[i] = { x: xIdx, y: point };
                            xIdx = xInc(xIdx);
                        } else {
                            if (point.x) {
                                xIdx = xInc(point.x);
                            } else {
                                point.x = xIdx;
                            }
                            if (point.y2 != undefined) {
                                revLine.push({ x: point.x, y: point.y2 });
                                delete point.y2;
                            }
                        }
                    }

                    if (revLine.length) {
                        for (var i = revLine.length - 1; i >= 0; i--) {
                            line.values.push(revLine[i]);
                        }
                        line.values.push(line.values[0]);
                    }
                }
            });

            this._super(dataset);
        },

        defaultXDomain: function () {
            if (this.dataset() == undefined) {
                return [0, 0];
            }

            const ret = [
                d3.min(this.dataset(), (l) => {
                    return d3.min(
                        l.values.map((d) => {
                            return d.x;
                        })
                    );
                }),
                d3.max(this.dataset(), (l) => {
                    return d3.max(
                        l.values.map((d) => {
                            return d.x;
                        })
                    );
                }),
            ];

            const delta = Math.max(this.options.xInset * ret[0], this.options.xInset * ret[1]);
            ret[0] -= delta;
            ret[1] += delta;
            console.log('DXD', ret);
            return ret;
        },

        defaultYDomain: function () {
            if (this.dataset() == undefined) {
                return [0, 0];
            }

            const ret = [
                d3.min(this.dataset(), (l) => {
                    return d3.min(
                        l.values.map((d) => {
                            return d.y;
                        })
                    );
                }),
                d3.max(this.dataset(), (l) => {
                    return d3.max(
                        l.values.map((d) => {
                            return d.y;
                        })
                    );
                }),
            ];

            const delta = Math.max(this.options.yInset * ret[0], this.options.yInset * ret[1]);
            ret[0] -= delta;
            ret[1] += delta;
            console.log('DYD', ret);
            return ret;
        },

        renderChart: function () {
            if (this.dataset() == undefined) {
                return;
            }

            const bounds = this.chartBounds();
            const $line = this;
            console.log('BOUNDS ', bounds);
            const lineMaker = d3.svg
                .line()
                .x((d) => {
                    return $line.xScale()(d.x);
                })
                .y((d) => {
                    return $line.yScale()(d.y);
                });

            const funkyTown = function () {
                this.attr('d', (d) => {
                    return lineMaker(d.values);
                })
                    .attr('stroke', (d) => {
                        return d.strokeColor || $line.options.strokeColor;
                    })
                    .attr('fill', (d) => {
                        return d.fillColor || $line.options.fillColor;
                    })
                    .attr('fill-opacity', (d) => {
                        return d.fillOpacity || $line.options.fillOpacity;
                    })
                    .attr('stroke-opacity', (d) => {
                        return d.strokeOpacity || $line.options.strokeOpacity;
                    })
                    .attr('stroke-width', (d) => {
                        return d.width != undefined ? d.width : $line.options.lineWidth;
                    })
                    .attr('stroke-linecap', (d) => {
                        return d.linecap || $line.options.lineCap;
                    })
                    .attr('stroke-dasharray', (d) => {
                        return d.dasharray;
                    });

                return this;
            };

            const mouseAction = function () {
                //if (! $line.options.useOverLine) {
                //    return;
                //}

                this.on('mouseover', function (d) {
                    if ($line.options.useOverLine && $line.options.overColor) {
                        d3.select(this)
                            .attr('stroke', $line.options.overColor)
                            .attr('stroke-width', (d.width || $line.options.lineWidth) + 0.5);
                    }

                    if (d.label && $line.options.useLineLabelToolTip) {
                        $line.showToolTip({
                            label: d.label,
                        });
                    }

                    if ($line.options.highlightToFront) {
                        d.svg.parentNode.appendChild(d.svg);
                    }
                }).on('mouseout', function (d) {
                    if ($line.options.useOverLine && $line.options.overColor) {
                        d3.select(this)
                            .attr('stroke', (d) => {
                                return d.strokeColor || $line.options.strokeColor;
                            })
                            .attr('stroke-width', (d) => {
                                return d.width != undefined ? d.width : $line.options.lineWidth;
                            });
                    }

                    if ($line.options.useLineLabelToolTip) {
                        $line.hideToolTip();
                    }
                });
                return this;
            };

            if (this.options.hGrid && this.yScale) {
                const yAxis = d3.svg
                    .axis()
                    .scale(this.yScale())
                    .orient('left')
                    .tickSize(0 - bounds.size.width)
                    .outerTickSize(0)
                    .tickFormat('');

                let gyAxis = this.D3svg().select(this.region('chart')).select('.yAxis');

                if (gyAxis[0][0] == undefined) {
                    gyAxis = this.D3svg()
                        .select(this.region('chart'))
                        .append('g')
                        .attr('class', 'yAxis axis')
                        .attr('transform', 'translate(' + 0 + ',0)');
                }

                gyAxis.transition().call(yAxis);
                gyAxis.selectAll('line').style('stroke', 'lightgray');
            }

            const chart = this.data('D3svg')
                .select(this.region('chart'))
                .selectAll('.line')
                .data(this.dataset(), (d) => {
                    return d.label;
                });

            chart
                .enter()
                .append('path')
                .attr('class', 'line')
                .call(funkyTown)
                .call(mouseAction)
                .each(function (d) {
                    d.svg = this;
                });

            chart
                .call(mouseAction)
                .transition()
                .duration(this.options.transitionTime)
                .call(funkyTown);

            chart.exit().remove();

            const time = $line.linesDrawn ? $line.options.transitionTime : 0;

            const pointsData = [];
            this.dataset().forEach((line, i) => {
                line.values.forEach((point, i) => {
                    if (line.shape || point.shape) {
                        const newPoint = {};
                        for (const key in point) {
                            newPoint[key] = point[key];
                        }

                        newPoint.color =
                            point.color ||
                            line.fillColor ||
                            line.strokeColor ||
                            $line.options.fillColor;
                        newPoint.shape = point.shape || line.shape;
                        (newPoint.shapeArea =
                            point.shapeArea || line.shapeArea || $line.options.shapeArea),
                            (newPoint.pointOver =
                                point.pointOver || line.pointOver || $line.options.pointOver),
                            (newPoint.pointOut =
                                point.pointOut || line.pointOut || $line.options.pointOut),
                            (newPoint.id = [point.x, point.y, line.label].join('/')),
                            pointsData.push(newPoint);
                    }
                });
            });

            const points = $line
                .data('D3svg')
                .select($line.region('chart'))
                .selectAll('.point')
                .data(pointsData, (d) => {
                    return d.id;
                });

            points
                .enter()
                .append('path')
                .attr('class', 'point')
                .attr('opacity', 0)
                .attr('transform', (d) => {
                    return 'translate(' + $line.xScale()(d.x) + ',' + $line.yScale()(d.y) + ')';
                })
                .on('mouseover', function (d) {
                    if ($line.options.overColor) {
                        d3.select(this).attr('fill', $line.options.overColor);
                    }

                    if (d.label) {
                        $line.showToolTip({
                            label: d.label,
                        });
                    } else if (d.pointOver) {
                        d.pointOver.call($line, d);
                    }
                })
                .on('mouseout', function (d) {
                    if ($line.options.overColor) {
                        d3.select(this).attr('fill', (d) => {
                            return d.color;
                        });
                    }

                    if (d.label) {
                        $line.hideToolTip();
                    } else if (d.pointOut) {
                        d.pointOut.call($line, d);
                    }
                });

            points
                .transition()
                .duration(time)
                .attr('transform', (d) => {
                    return 'translate(' + $line.xScale()(d.x) + ',' + $line.yScale()(d.y) + ')';
                })
                .attr('d', (d) => {
                    return d3.svg.symbol().type(d.shape).size(d.shapeArea)();
                })
                .attr('fill', (d) => {
                    return d.color;
                })
                .attr('opacity', 1);

            points.exit().transition().duration(time).attr('opacity', 0).remove();

            if (this.options.useHighlightLine) {
                const highlight = this.data('D3svg')
                    .select(this.region('chart'))
                    .selectAll('.highlight')
                    .data([0]);

                highlight
                    .enter()
                    .append('line')
                    .attr('x1', bounds.size.width / 2)
                    .attr('x2', bounds.size.width / 2)
                    .attr('y1', 0)
                    .attr('y2', bounds.size.height)
                    .attr('opacity', 0)
                    .attr('stroke', this.options.highlightLineColor)
                    .attr('stroke-width', this.options.highlightLineWidth)
                    .attr('pointer-events', 'none');

                this.data('D3svg')
                    .select(this.region('chart'))
                    .on('mouseover', (d) => {
                        highlight.attr('opacity', 1);
                    })
                    .on('mousemove', function (d) {
                        const coords = d3.mouse(this);
                        highlight.attr('x1', coords[0]).attr('x2', coords[0]).attr('opacity', 1);
                    })
                    .on('mouseout', (d) => {
                        highlight.attr('opacity', 0);
                    });
            }

            this.linesDrawn = true;
        },

        setYScaleRange: function (range, yScale) {
            return this._super(range.reverse(), yScale);
        },
    });
});
