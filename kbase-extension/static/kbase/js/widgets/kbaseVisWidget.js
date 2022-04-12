/*
 kbaseVisWidget
 */

define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'd3',
    'RGBColor',
    'geometry_rectangle',
    'geometry_point',
    'geometry_size',
], (KBWidget, bootstrap, $, d3, RGBColor, geometry_rectangle, geometry_point, geometry_size) => {
    return KBWidget({
        name: 'kbaseVisWidget',
        version: '1.0.0',
        options: {
            xGutter: 20,
            xPadding: 30,
            yGutter: 20,
            yPadding: 30,

            yLabels: true,
            xLabels: true,

            xScaleType: 'linear',
            yScaleType: 'linear',
            useIDMapping: false,
            bgColor: 'white',
            scaleXAxis: false,
            scaleYAxis: false,
            scaleAxes: false,
            useUniqueID: false,
            transitionTime: 1750,
            ticker: 0,
            radialGradientStopColor: 'black',
            linearGradientStopColor: 'black',
            defaultDataset: function defaultDataset() {
                return [];
            },
            defaultLegend: function defaultLegend() {
                return [];
            },
            width: '100%',
            height: '100%',
            customRegions: {},

            xAxisColor: 'black',
            yAxisColor: 'black',

            xAxisRegion: 'yPadding',
            yAxisRegion: 'xPadding',

            xAxisOrientation: 'bottom',
            yAxisOrientation: 'left',

            shouldRenderXAxis: true,
            shouldRenderYAxis: true,

            xLabelRegion: 'yGutter',
            yLabelRegion: 'xGutter',

            xLabelOffset: 0,
            yLabelOffset: 0,

            xLabelSize: '8pt',
            yLabelSize: '8pt',

            legendRegion: 'chart',
            legendAlignment: 'TL',
            legendOffset: [0, 0],
            legendLineHeight: 13,
            legendSize: '7pt',
            legendTextXOffset: 6,
            legendTextYOffset: 3,

            aspectRatio: 'default',
        },
        shouldScaleAxis: function shouldScaleAxis(axis) {
            if (this.options.scaleAxes) {
                return true;
            } else if (axis == 'x' && this.options.scaleXAxis) {
                return true;
            } else if (axis == 'y' && this.options.scaleYAxis) {
                return true;
            } else {
                return false;
            }
        },
        _accessors: [
            'xGutter',
            'xPadding',
            'yGutter',
            'yPadding',
            'width',
            'height',
            { name: 'json_dataset', setter: 'setJSONDataset' },
            { name: 'dataset', setter: 'setDataset' },
            { name: 'legend', setter: 'setLegend' },
            { name: 'input', setter: 'setInput' },
            { name: 'xLabel', setter: 'setXLabel' },
            { name: 'yLabel', setter: 'setYLabel' },
            { name: 'xScale', setter: 'setXScale' },
            { name: 'yScale', setter: 'setYScale' },
            'xScaleType',
            'yScaleType',
            'yHeightScaleType',
            'xIDMap',
            'yIDMap',
            'radialGradients',
            'linearGradients',
            'children',
        ],
        input: function input() {
            return this.dataset();
        },
        setInput: function setInput(newInput) {
            if ($.isPlainObject(newInput) && newInput.dataset != undefined) {
                return this.setValuesForKeys(newInput);
            } else {
                return this.setDataset(newInput);
            }
        },
        setXLabel: function setXLabel(newXLabel) {
            this.setValueForKey('xLabel', newXLabel);
            this.render('xLabel');
        },
        setYLabel: function setYLabel(newYLabel) {
            this.setValueForKey('yLabel', newYLabel);
            this.render('yLabel');
        },
        setXScale: function setXScale(newXScale) {
            this.setValueForKey('xScale', newXScale);
            this.render('xAxis');
        },
        setYScale: function setYScale(newYScale) {
            this.setValueForKey('yScale', newYScale);
            this.render('yAxis');
        },
        createIDMapForDomain: function createIDMapForDomain(domain) {
            const map = {};
            $.each(domain, (idx, val) => {
                map[idx] = val;
            });
            return map;
        },
        setXScaleDomain: function setXScaleDomain(domain, scaleType) {
            let xScale = this.xScale();

            if (xScale == undefined) {
                if (scaleType == undefined) {
                    scaleType = this.xScaleType() || this.options.xScaleType;
                }
                xScale = d3.scale[scaleType]();

                this.setXScaleRange([0, this.chartBounds().size.width], xScale);
                this.setValueForKey('xScale', xScale);
            }

            xScale.domain(domain);

            if (this.options.useIDMapping && this.xIDMap() == undefined) {
                this.xIDMap(this.createIDMapForDomain(domain));
            }

            this.render('xAxis');

            return xScale;
        },
        setXScaleRange: function setXScaleRange(range, xScale) {
            if (xScale == undefined) {
                xScale = this.xScale();
            }
            xScale.range(range);

            return xScale;
        },
        setYScaleDomain: function setYScaleDomain(domain, scaleType) {
            let yScale = this.yScale();

            if (yScale == undefined) {
                if (scaleType == undefined) {
                    scaleType = this.yScaleType() || this.options.yScaleType;
                }
                yScale = d3.scale[scaleType]();

                this.setYScaleRange([0, this.chartBounds().size.height], yScale);
                this.setValueForKey('yScale', yScale);
            }

            yScale.domain(domain);

            if (this.options.useIDMapping && this.yIDMap() == undefined) {
                this.yIDMap(this.createIDMapForDomain(domain));
            }

            this.render('yAxis');

            return yScale;
        },
        setYScaleRange: function setYScaleRange(range, yScale) {
            if (yScale == undefined) {
                yScale = this.yScale();
            }
            yScale.range(range);

            return yScale;
        },

        init: function init(options) {
            this._super(options);

            if (this.children() == undefined) {
                this.children([]);
            }

            if (this.options.transformations == undefined) {
                this.options.transformations = {};
            }

            if (this.radialGradients() == undefined) {
                this.radialGradients({});
            }

            if (this.linearGradients() == undefined) {
                this.linearGradients({});
            }

            if (this.options.chartID == undefined) {
                this.options.chartID = this.uuid();
            }

            this.ticker = function () {
                return ++this.options.ticker;
            };

            this.uniqueID = $.proxy(function (d) {
                if (d.id == undefined) {
                    d.id = this.ticker();
                }
                return d.id;
            }, this);

            if (this.options.width != undefined && this.options.width.match(/px/)) {
                this.width(parseInt(this.options.width));
            } else {
                this.width(this.$elem.width());
            }

            if (this.options.height != undefined && this.options.height.match(/px/)) {
                this.height(parseInt(this.options.height));
            } else {
                this.height(this.$elem.height());
            }

            this.appendUI(this.$elem);

            if (this.xScale()) {
                this.setXScaleRange([0, this.chartBounds().size.width], this.xScale());
            }
            if (this.yScale()) {
                this.setYScaleRange([0, this.chartBounds().size.height], this.yScale());
            }

            this.callAfterInit(
                $.proxy(function () {
                    this.render();
                }, this)
            );

            return this;
        },
        render: function render(field) {
            if (!this._init) {
                return;
            }

            if (field == undefined || field == 'chart') {
                this.renderChart();
            }

            if (field == undefined || field == 'xAxis') {
                this.renderXAxis();
            }

            if (field == undefined || field == 'yAxis') {
                this.renderYAxis();
            }

            if (field == undefined || field == 'xLabel') {
                this.renderXLabel();
            }

            if (field == undefined || field == 'yLabel') {
                this.renderYLabel();
            }

            if (field == undefined || field == 'ulCorner') {
                this.renderULCorner();
            }

            if (field == undefined || field == 'legend') {
                this.renderLegend();
            }
        },

        fitTextToWidth: function fitTextToWidth(text, width) {
            const fakeText = this.D3svg()
                .append('text')
                .attr('opacity', 0)
                .attr('font-size', this.options.legendSize)
                .text(text);

            let box = fakeText[0][0].getBBox();

            let truncatedText = text;
            let truncated = false;
            const originalWidth = box.width;

            while (box.width + this.options.legendTextXOffset > width && truncatedText.length) {
                truncatedText = truncatedText.substring(0, truncatedText.length - 1);
                fakeText.text(truncatedText + '...');
                box = fakeText[0][0].getBBox();
                truncated = true;
            }

            fakeText.remove();

            return {
                truncated: truncated,
                text: text,
                truncatedText: text == truncatedText ? text : truncatedText + '...',
                width: originalWidth,
            };
        },

        legendOver: function legendOver() {},
        legendOut: function legendOut() {},

        renderLegend: function renderLegend() {
            if (this.legend() == undefined) {
                return;
            }

            const $vis = this;

            const shapeArea = {
                circle: 81,
                square: 81,
                'triangle-up': 49,
                'triangle-down': 49,
                diamond: 36,
                cross: 49,
            };

            const legendRectSize = 8;

            const legendRegionBounds = this[this.options.legendRegion + 'Bounds']();

            const legendWidth = Math.min(
                this.options.legendWidth || 1000000000,
                legendRegionBounds.size.width
            );

            let legendX = 0;
            let legendY = 0;

            const textXOffset = $vis.options.legendTextXOffset;
            const textYOffset = $vis.options.legendTextYOffset;

            if (this.options.legendAlignment.match(/B/)) {
                legendY =
                    legendRegionBounds.size.height -
                    $vis.options.legendLineHeight * this.legend().length;
            }

            if (this.options.legendAlignment.match(/R/)) {
                let actualWidth = 0;
                this.legend().forEach((item, i) => {
                    const trunc = $vis.fitTextToWidth(item.label, legendWidth);
                    actualWidth = Math.max(actualWidth, trunc.width);
                });

                legendX = legendRegionBounds.size.width - (actualWidth + textXOffset + 6);
            }

            const uniqueKey = function (d) {
                return d.label;
            };

            this.D3svg()
                .select(this.region(this.options.legendRegion))
                .selectAll('.legend')
                .data([0])
                .enter()
                .append('g')
                .attr('class', 'legend');

            const legend = this.D3svg()
                .select(this.region(this.options.legendRegion))
                .selectAll('.legend')
                .selectAll('g')
                .data(this.legend(), uniqueKey);

            const gTransform = function (b, j, i) {
                const horz = 6 + legendX + $vis.options.legendOffset[0];
                const vert =
                    6 + i * $vis.options.legendLineHeight + legendY + $vis.options.legendOffset[1];
                return 'translate(' + horz + ',' + vert + ')';
            };

            legend
                .enter()
                .append('g')
                .each(function (d, i) {
                    const g = d3.select(this);

                    g.attr('transform', (b, j) => {
                        return gTransform(b, j, i);
                    });

                    g.append('path').attr('opacity', 0);
                    g.append('text').attr('class', 'legend-text').attr('opacity', 0);
                });

            const time = this.drawnLegend ? this.options.transitionTime : 0;

            legend.each(function (d, i) {
                const g = d3.select(this);

                g.transition()
                    .duration(time)
                    .attr('transform', (b, j) => {
                        return gTransform(b, j, i);
                    });

                const truncationObj = $vis.fitTextToWidth(d.label, legendWidth);

                g.selectAll('path')
                    .transition()
                    .duration(time)
                    .attr('d', (b) => {
                        return d3.svg
                            .symbol()
                            .type(d.shape || 'square')
                            .size(shapeArea[d.shape] || 81)();
                    })
                    .style('fill', (b, j) => {
                        return d.color;
                    })
                    .style('stroke', (b, j) => {
                        return d.color;
                    })
                    .attr('opacity', 1);

                g.selectAll('text')
                    .transition()
                    .duration(time)
                    .attr('x', textXOffset) //magic numbers make things look pretty!
                    .attr('y', textYOffset)
                    .attr('font-size', $vis.options.legendSize)
                    .style('cursor', 'pointer')
                    .text(() => {
                        return truncationObj.truncatedText;
                    })
                    .attr('opacity', 1);

                g.selectAll('text')
                    .on('mouseover', (d) => {
                        if (truncationObj.truncated) {
                            $vis.showToolTip({ label: truncationObj.text });
                        }

                        if (d.represents) {
                            $vis.legendOver(d.represents);
                        }
                    })
                    .on('mouseout', (d) => {
                        if (truncationObj.truncated) {
                            $vis.hideToolTip();
                        }
                        if (d.represents) {
                            $vis.legendOut(d.represents);
                        }
                    });
            });

            legend.exit().each(function (d, i) {
                const g = d3.select(this);

                g.selectAll('path').transition().duration(time).attr('opacity', 0).remove();

                g.selectAll('text').transition().duration(time).attr('opacity', 0).remove();

                g.remove();
            });

            this.drawnLegend = true;

            return;
        },

        renderULCorner: function renderULCorner() {
            const ulBounds = this.ULBounds();

            const imgSize = new Size(ulBounds.size.width, ulBounds.size.height);

            const inset = 5;

            imgSize.width -= inset;
            imgSize.height -= inset;

            if (imgSize.width > imgSize.height) {
                imgSize.width = imgSize.height;
            } else if (imgSize.height > imgSize.width) {
                imgSize.height = imgSize.width;
            }

            if (imgSize.width < 25) {
                return;
            }

            const ulDataset = [this.options.ulIcon];

            if (this.options.ulIcon) {
                const ulLabel = this.D3svg().select(this.region('UL')).selectAll('.ULLabel');

                ulLabel
                    .data(ulDataset)
                    .enter()
                    .append('image')
                    .attr('x', inset / 2)
                    .attr('y', inset / 2)
                    .attr('width', imgSize.width)
                    .attr('height', imgSize.height)
                    .attr('xlink:href', (d) => {
                        return d;
                    });
            }
        },

        setLegend: function setLegend(newLegend) {
            if (newLegend == undefined) {
                newLegend = this.options.defaultLegend();
            }

            this.setValueForKey('legend', newLegend);

            this.render();
        },

        extractLegend: function extractLegend(dataset) {
            /* no op in the super class */
        },

        setJSONDataset: function (json_url) {
            const $vis = this;

            $.ajax(json_url, { dataType: 'json' })
                .then((d) => {
                    if (d.data && !d.dataset) {
                        d.dataset = d.data;
                    }

                    if (d.dataset) {
                        $vis.setDataset(d.dataset);

                        if (d.xLabel) {
                            $vis.setXLabel(d.xLabel);
                        }
                        if (d.yLabel) {
                            $vis.setYLabel(d.yLabel);
                        }
                    } else {
                        $vis.setDataset(d);
                    }
                })
                .fail((d) => {
                    $vis.$elem.empty();
                    $vis.$elem
                        .addClass('alert alert-danger')
                        .html('Could not load JSON ' + json_url + ' : ' + d.responseText);
                });
        },

        setDataset: function setDataset(newDataset) {
            if (newDataset == undefined) {
                newDataset = this.options.defaultDataset();
            }
            this.setValueForKey('dataset', newDataset);

            if (this.shouldScaleAxis('x')) {
                this.setXScaleDomain(this.defaultXDomain());
            }

            if (this.shouldScaleAxis('y')) {
                this.setYScaleDomain(this.defaultYDomain());
            }

            if (this.options.autoLegend) {
                this.extractLegend(newDataset);
            }

            this.render();
        },
        setDatasets: function setDatasets(newDatasets) {
            if (newDatasets == undefined) {
                newDatasets = [];
            }

            if (this.children() == undefined) {
                this.children([]);
            }

            //first, peel off our dataset
            const myDataset = newDatasets.shift();

            const $me = this;

            //the remaining children are datasets of this vis.
            const initKids = function () {
                $me.setDataset(myDataset);

                for (var i = 0; i < newDatasets.length; i++) {
                    var child;

                    if (i < $me.children().length) {
                        child = $me.children()[i];
                        child.reenter(i, newDatasets[i], $me);
                    } else {
                        const childOptions = $me.childOptions(
                            $me.children().length,
                            newDatasets[i]
                        );
                        childOptions.parent = $me;

                        child = new $me.constructor($.jqElem('div'), childOptions);
                        $me.children().push(child);
                    }

                    child.setDataset(newDatasets[i]);
                }

                for (var i = newDatasets.length; i < $me.children().length; i++) {
                    $me.children()[i].setDataset(undefined);
                }

                $me.render();
            };

            this.callAfterInit(initKids);
        },
        reenter: function reenter(idx, dataset, $parent) {},
        childOptions: function childOptions(idx, dataset) {
            return $.extend(true, {}, dataset.options || this.options.childOptions || this.options);
        },
        defaultXDomain: function defaultXDomain() {
            return [0, 100];
        },
        defaultYDomain: function defaultYDomain() {
            return [0, 100];
        },
        renderXLabel: function renderXLabel() {
            const labelRegionBounds = this[this.options.xLabelRegion + 'Bounds']();

            const xLabeldataset = [this.xLabel()];
            const yOffset = this.options.xLabelOffset;

            const xLabel = this.D3svg()
                .select(this.region(this.options.xLabelRegion))
                .selectAll('.xLabel');
            xLabel
                .data(xLabeldataset)
                .text(this.xLabel())
                .enter()
                .append('text')
                .attr('class', 'xLabel')
                .attr('x', labelRegionBounds.size.width / 2)
                .attr('y', labelRegionBounds.size.height / 2 + 3)
                .attr('text-anchor', 'middle')
                .attr('font-size', this.options.xLabelSize)
                .attr('font-family', 'sans-serif')
                .attr('fill', 'black')
                .attr('transform', 'translate(0,' + yOffset + ')')
                .text(this.xLabel());
        },
        renderYLabel: function renderYLabel() {
            const labelRegionBounds = this[this.options.yLabelRegion + 'Bounds']();

            const yLabeldataset = [this.yLabel()];

            const rotation = this.options.yLabelRegion == 'xPadding' ? -90 : 90;
            const xOffset = this.options.yLabelOffset;

            const yLabel = this.D3svg()
                .select(this.region(this.options.yLabelRegion))
                .selectAll('.yLabel');
            yLabel
                .data(yLabeldataset)
                .text(this.yLabel())
                .enter()
                .append('text')
                .attr('class', 'yLabel')
                .attr('x', labelRegionBounds.size.width / 2)
                .attr('y', labelRegionBounds.size.height / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', this.options.yLabelSize)
                .attr('font-family', 'sans-serif')
                .attr('fill', 'black')
                .attr(
                    'transform',
                    'translate(' +
                        xOffset +
                        ',0) rotate(' +
                        rotation +
                        ',' +
                        (labelRegionBounds.size.width / 2 - 7) +
                        ',' +
                        labelRegionBounds.size.height / 2 +
                        ')'
                )
                .text(this.yLabel());
        },
        xTickValues: function xTickValues() {
            return;
        },
        xTickLabel: function xTickLabel(val) {
            return val;
        },
        renderXAxis: function renderXAxis() {
            const $self = this;

            if (!this.options.shouldRenderXAxis) {
                return;
            }

            if (this.xScale() == undefined || this.xScale().domain == undefined) {
                return;
            }

            let axisTransform =
                this.options.xAxisRegion == 'yGutter' ? axisRegionBounds.size.height : 0;

            if (this.options.xAxisTransform) {
                axisTransform = this.options.xAxisTransform;
            }

            var axisRegionBounds = this[this.options.xAxisRegion + 'Bounds']();

            let xAxisOrientation = this.options.xAxisOrientation;

            if (xAxisOrientation == 'bottom' && axisTransform > axisRegionBounds.size.height - 30) {
                xAxisOrientation = 'top';
            }

            const xAxis = d3.svg.axis().scale(this.xScale()).orient(xAxisOrientation);

            const ticks = this.xTickValues();

            if (ticks != undefined) {
                xAxis
                    .tickValues(ticks)
                    .tickSubdivide(0)
                    .tickFormat((d) => {
                        return $self.xTickLabel.call($self, d);
                    });
            }

            if (!this.options.xLabels) {
                xAxis.tickFormat('');
            }

            let gxAxis = this.D3svg()
                .select(this.region(this.options.xAxisRegion))
                .select('.xAxis');

            if (gxAxis[0][0] == undefined) {
                gxAxis = this.D3svg()
                    .select(this.region(this.options.xAxisRegion))
                    .append('g')
                    .attr('class', 'xAxis axis')
                    .attr('fill', this.options.xAxisColor);
            }

            gxAxis[0][0].parentNode.appendChild(gxAxis[0][0]);

            this.D3svg()
                .select(this.region(this.options.xAxisRegion))
                .selectAll('.xAxis')
                .attr('transform', 'translate(0,' + axisTransform + ')');

            if (this.options.xAxisVerticalLabels) {
                gxAxis.selectAll('text').attr('transform', function (d, i) {
                    try {
                        const bounds = $self.yGutterBounds();

                        const textBounds = this.getBBox();
                        //bullshit magic numbers. Moving it over by 2/3rds of the width seems to line it up nicely, and down by the height.
                        return (
                            'rotate(90) translate(' +
                            (textBounds.width * 2) / 3 +
                            ',-' +
                            textBounds.height +
                            ')'
                        );
                    } catch (err) {
                        //firefox is stupid! the first call to getBBox fails because it's not attached yet. Tosses an exception.
                        return undefined;
                    }
                });
            }

            const transitionTime = this.renderedXAxis ? this.options.transitionTime : 0;

            gxAxis.transition().duration(transitionTime).call(xAxis);
            this.renderedXAxis = true;
        },
        svg2HTML: function svg2HTML() {
            const $container = $.jqElem('div').append(this.data('$svg'));

            return $container.html();
        },
        renderYAxis: function renderYAxis() {
            if (!this.options.shouldRenderYAxis) {
                return;
            }

            if (this.yScale() == undefined) {
                return;
            }

            const yAxis = d3.svg.axis().scale(this.yScale()).orient(this.options.yAxisOrientation);

            if (!this.options.yLabels) {
                yAxis.tickFormat('');
            }

            let gyAxis = this.D3svg()
                .select(this.region(this.options.yAxisRegion))
                .select('.yAxis');

            const axisRegionBounds = this[this.options.yAxisRegion + 'Bounds']();
            const axisTransform =
                this.options.yAxisRegion == 'xPadding' ? axisRegionBounds.size.width : 0;

            if (gyAxis[0][0] == undefined) {
                gyAxis = this.D3svg()
                    .select(this.region(this.options.yAxisRegion))
                    .append('g')
                    .attr('class', 'yAxis axis')
                    .attr('fill', this.options.yAxisColor)
                    .attr('transform', 'translate(' + axisTransform + ',0)');
            }

            const transitionTime = this.renderedYAxis ? this.options.transitionTime : 0;

            gyAxis.transition().duration(transitionTime).call(yAxis);
            this.renderedYAxis = true;
        },
        renderChart: function renderChart() {},
        setGutter: function setGutter(newGutter) {
            this.xGutter(newGutter);
            this.yGutter(newGutter);
        },
        setPadding: function setPadding(newPadding) {
            this.xPadding(newPadding);
            this.yPadding(newPadding);
        },
        /*
             +------------------------+
             | UL|   yGutter      |UR |
             +------------------------+
             | X |   chart        | X |
             | P |                | G |
             +------------------------+
             | LL|   yPadding     |LR |
             +------------------------+
             */

        appendUI: function appendUI($elem) {
            const $vis = this;

            const chartBounds = this.chartBounds();
            if (
                chartBounds.size.width != chartBounds.size.height &&
                this.options.aspectRatio != 'default'
            ) {
                const diff = Math.abs(chartBounds.size.width - chartBounds.size.height);
                let newHeight = $elem.height();
                let newWidth = $elem.width();

                if (this.options.aspectRatio == 'minSquare') {
                    if (chartBounds.size.width < chartBounds.size.height) {
                        newHeight -= diff;
                    } else if (chartBounds.size.height < chartBounds.size.width) {
                        newWidth -= diff;
                    }
                } else if (this.options.aspectRatio == 'maxSquare') {
                    if (chartBounds.size.height < chartBounds.size.width) {
                        newHeight += diff;
                    } else if (chartBounds.size.width < chartBounds.size.height) {
                        newWidth += diff;
                    }
                }

                $elem.animate(
                    {
                        width: newWidth,
                        height: newHeight,
                    },
                    0
                );
                this.width(newWidth);
                this.height(newHeight);
            }

            let D3svg;

            if (!this.options.parent) {
                $elem.append(
                    $.jqElem('style').html(
                        '.axis path, .axis line { fill : none; stroke : black; shape-rendering : crispEdges;} .axis text \
                            {font-family : sans-serif; font-size : 11px}'
                    )
                );

                D3svg = d3
                    .select($elem.get(0))
                    .append('svg')
                    .attr('xmlns', 'http://www.w3.org/2000/svg')
                    .attr(
                        'style',
                        'width : ' + this.options.width + '; height : ' + this.options.height
                    );

                const tooltip = d3
                    .select('body')
                    .selectAll('.visToolTip')
                    .data([0])
                    .enter()
                    .append('div')
                    .attr('class', 'visToolTip')
                    .style({
                        position: 'absolute',
                        'max-width': '300px',
                        height: 'auto',
                        padding: '10px',
                        'background-color': 'white',
                        '-webkit-border-radius': '10px',
                        '-moz-border-radius': '10px',
                        'border-radius': '10px',
                        '-webkit-box-shadow': '4px 4px 10px rgba(0, 0, 0, 0.4)',
                        '-moz-box-shadow': '4px 4px 10px rgba(0, 0, 0, 0.4)',
                        'box-shadow': '4px 4px 10px rgba(0, 0, 0, 0.4)',
                        'pointer-events': 'none',
                        display: 'none',
                        'font-family': 'sans-serif',
                        'font-size': '12px',
                        'line-height': '20px',
                    });
                this.data('D3svg', D3svg);
            }

            //XXX FUCK! D3svg is pointing to a reference to the parent's D3svg, but that might not yet exist. Which means that I need to rewire fucking everything
            //to use a goddamn method instead. Fuck my life.
            else {
                this.$elem = this.options.parent.$elem;
                this.width(this.$elem.width());
                this.height(this.$elem.height());
                D3svg = this.D3svg();
            }

            if (this.options.rootRegion) {
                const rootRegion = $vis.region('root', true);
                D3svg = D3svg.selectAll('.' + rootRegion).data([{ region: rootRegion }], (d) => {
                    return d.region;
                });
                D3svg.enter()
                    .append('g')
                    .attr('class', (d) => {
                        return d.region;
                    })
                    .attr(
                        'transform',
                        $.proxy((region) => {
                            return $vis.buildTransformation($vis.options.rootRegion);
                        }, this)
                    );
            }

            const regions = [
                'chart', //add the chart first, because we want it to be at the lowest level.
                'UL',
                'UR',
                'LL',
                'LR', //corners are low priority
                'yGutter',
                'xGutter',
                'yPadding',
                'xPadding', //labels win
            ];

            //used when debug is on.
            const colors = [
                'red',
                'green',
                'blue',
                'cyan',
                'magenta',
                'yellow',
                'purple',
                'orange',
                'gray',
            ];

            D3svg.selectAll('defs')
                .data([null])
                .enter()
                .append('defs')
                .attr('class', 'definitions');

            const regionG = D3svg.selectAll('g')
                .data(regions, (d) => {
                    return d;
                })
                .enter()
                .append('g')
                .attr('class', (region) => {
                    return region;
                })
                .attr(
                    'data-x',
                    $.proxy(function (region) {
                        const bounds = this[region + 'Bounds']();
                        return bounds.origin.x;
                    }, this)
                )
                .attr(
                    'data-y',
                    $.proxy(function (region) {
                        const bounds = this[region + 'Bounds']();
                        return bounds.origin.y;
                    }, this)
                )
                .attr(
                    'data-width',
                    $.proxy(function (region) {
                        const bounds = this[region + 'Bounds']();
                        return bounds.size.width;
                    }, this)
                )
                .attr(
                    'data-height',
                    $.proxy(function (region) {
                        const bounds = this[region + 'Bounds']();
                        return bounds.size.height;
                    }, this)
                )
                .attr(
                    'transform',
                    $.proxy(function (region) {
                        const bounds = this[region + 'Bounds']();
                        return 'translate(' + bounds.origin.x + ',' + bounds.origin.y + ')';
                    }, this)
                );

            regionG
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr(
                    'width',
                    $.proxy(function (region) {
                        const bounds = this[region + 'Bounds']();
                        return bounds.size.width;
                    }, this)
                )
                .attr(
                    'height',
                    $.proxy(function (region) {
                        const bounds = this[region + 'Bounds']();
                        return bounds.size.height;
                    }, this)
                )
                .attr('fill', (d) => {
                    return $vis.options.debug ? colors.shift() : $vis.options.bgColor;
                })
                .attr('class', 'background');

            $.each(regions, (idx, region) => {
                D3svg.selectAll('.' + region)
                    .selectAll('g')
                    .data([{ region: $vis.region(region, true), r: region }], (d) => {
                        return d.region;
                    })
                    .enter()
                    .append('g')
                    .attr('class', (d) => {
                        return d.region;
                    })
                    .attr('transform', (d) => {
                        return $vis.buildTransformation(
                            $vis.options.transformations[d.r] || $vis.options.transformations.global
                        );
                    });
            });
        },

        buildTransformation: function buildTransformation(transformation) {
            const transform = $.extend(
                true,
                { translate: { x: 0, y: 0 }, scale: { width: 1, height: 1 } },
                transformation
            );

            return (
                'translate(' +
                transform.translate.x +
                ',' +
                transform.translate.y +
                ')' +
                ' scale(' +
                transform.scale.width +
                ',' +
                transform.scale.height +
                ')'
            );
        },

        D3svg: function D3svg() {
            if (this.options.parent) {
                return this.options.parent.D3svg();
            } else {
                return this.data('D3svg');
            }
        },
        region: function _region(region, asName) {
            let dot = '';

            if (!asName) {
                dot = '.';
            }

            if (this.options.customRegions[region] != undefined) {
                return dot + this.options.customRegions[region];
            }

            return dot + region + '-' + this.options.chartID;
        },
        ULBounds: function ULBounds() {
            return new Rectangle(new Point(0, 0), new Size(this.xPadding(), this.yGutter()));
        },
        URBounds: function URBounds() {
            return new Rectangle(
                new Point(this.xPadding() + this.chartBounds().size.width, 0),
                new Size(this.xGutter(), this.yGutter())
            );
        },
        LLBounds: function LLBounds() {
            return new Rectangle(
                new Point(0, this.yGutter() + this.chartBounds().size.height),
                new Size(this.xPadding(), this.yPadding())
            );
        },
        LRBounds: function LRBounds() {
            return new Rectangle(
                new Point(
                    this.xPadding() + this.chartBounds().size.width,
                    this.yGutter() + this.chartBounds().size.height
                ),
                new Size(this.xPadding(), this.yPadding())
            );
        },
        xPaddingBounds: function xPaddingBounds() {
            return new Rectangle(
                new Point(0, this.yGutter()),
                new Size(this.xPadding(), this.chartBounds().size.height)
            );
        },
        xGutterBounds: function xGutterBounds() {
            return new Rectangle(
                new Point(this.xPadding() + this.chartBounds().size.width, this.yGutter()),
                new Size(this.xGutter(), this.chartBounds().size.height)
            );
        },
        yGutterBounds: function yGutterBounds() {
            return new Rectangle(
                new Point(this.xPadding(), 0),
                new Size(this.chartBounds().size.width, this.yGutter())
            );
        },
        yPaddingBounds: function yPaddingBounds() {
            return new Rectangle(
                new Point(this.xPadding(), this.yGutter() + this.chartBounds().size.height),
                new Size(this.chartBounds().size.width, this.yPadding())
            );
        },

        chartBounds: function chartBounds() {
            const widgetWidth = this.$elem.width();
            const widgetHeight = this.$elem.height();

            const chart = new Rectangle(
                new Point(this.xPadding(), this.yGutter()),
                new Size(
                    widgetWidth - this.xPadding() - this.xGutter(),
                    widgetHeight - this.yGutter() - this.yPadding()
                )
            );

            if (chart.size.width < 0) {
                chart.size.width = 0;
            }

            if (chart.size.height < 0) {
                chart.size.height = 0;
            }

            return chart;
        },

        showToolTip: function showToolTip(args) {
            if (args.event == undefined) {
                args.event = d3.event;
            }

            d3.selectAll('.visToolTip')
                .style('display', 'block')
                .html(args.label)
                .style('left', args.event.pageX + 10 + 'px')
                .style('top', args.event.pageY - 10 + 'px')
                .style('max-width', (args.maxWidth || '300') + 'px');
        },
        hideToolTip: function hideToolTip(args) {
            d3.selectAll('.visToolTip').style('display', 'none');
        },
        radialGradient: function radialGradient(grad) {
            grad = $.extend(
                true,
                {
                    cx: 0,
                    cy: 0,
                    stopColor: this.options.radialGradientStopColor,
                    r: this.chartBounds().size.width / 2,
                },
                grad
            );

            const gradKey = [grad.cx, grad.cy, grad.r, grad.startColor, grad.stopColor].join(',');

            if (this.radialGradients()[gradKey] != undefined && grad.id == undefined) {
                grad.id = this.radialGradients()[gradKey];
            }

            if (grad.id == undefined) {
                grad.id = this.uuid();
            }

            //I'd prefer to .select('.definitions').selectAll('radialGradient') and then just let
            //d3 figure out the one that appropriately maps to my given grad value...but I couldn't
            //get that to work for some inexplicable reason.
            const gradient = this.D3svg()
                .select('.definitions')
                .selectAll('#' + grad.id)
                .data([grad]);

            let newGrad = false;

            gradient
                .enter()
                .append('radialGradient')
                .attr(
                    'id',
                    //as brilliant as this hack is, it's also godawful. I might as well put a goto here.
                    //this just returns the grad's id, as usual. BUT it also invokes a side effect to set
                    //a global flag (well, enclosing context flag) to say that this is a newly created gradient
                    //so down below we don't use any transition time to set the values. There's gotta be a better
                    //way to do this, but I couldn't figure it out.
                    (d) => {
                        newGrad = true;
                        return d.id;
                    }
                )
                .attr('gradientUnits', 'userSpaceOnUse')
                .attr('cx', (d) => {
                    return d.cx;
                })
                .attr('cy', (d) => {
                    return d.cy;
                })
                .attr('r', (d) => {
                    return 2.5 * d.r;
                })
                .attr('spreadMethod', 'pad');

            const transitionTime = newGrad ? 0 : this.options.transitionTime;

            const stop0 = gradient.selectAll('stop[offset="0%"]').data([grad]);
            stop0.enter().append('stop').attr('offset', '0%');
            stop0
                .transition()
                .duration(transitionTime)
                .attr('stop-color', (d) => {
                    return d.startColor;
                });

            const stop30 = gradient.selectAll('stop[offset="30%"]').data([grad]);
            stop30.enter().append('stop').attr('offset', '30%').attr('stop-opacity', 1);
            stop30
                .transition()
                .duration(transitionTime)
                .attr('stop-color', (d) => {
                    return d.startColor;
                });

            const stop70 = gradient.selectAll('stop[offset="70%"]').data([grad]);
            stop70.enter().append('stop').attr('stop-opacity', 1).attr('offset', '70%');
            stop70
                .transition()
                .duration(transitionTime)
                .attr('stop-color', (d) => {
                    return d.stopColor;
                });

            return (this.radialGradients()[gradKey] = grad.id);
        },
        linearGradient: function linearGradient(grad) {
            const chartBounds = this.chartBounds();

            grad = $.extend(
                true,
                {
                    x1: 0, //chartBounds.origin.x,
                    x2: 0, //chartBounds.size.width,
                    y1: chartBounds.size.height, //chartBounds.origin.y,
                    y2: 0,
                    width: 0,
                    height: chartBounds.size.height,
                },
                grad
            );

            const gradKey = [
                grad.x1,
                grad.x2,
                grad.y1,
                grad.y2,
                grad.width,
                grad.height,
                grad.startColor,
                grad.stopColor,
            ].join(',');

            if (this.linearGradients()[gradKey] != undefined && grad.id == undefined) {
                grad.id = this.linearGradients()[gradKey];
            }

            if (grad.id == undefined) {
                grad.id = this.uuid();
            }

            //I'd prefer to .select('.definitions').selectAll('linearGradient') and then just let
            //d3 figure out the one that appropriately maps to my given grad value...but I couldn't
            //get that to work for some inexplicable reason.
            const gradient = this.D3svg()
                .select('.definitions')
                .selectAll('#' + grad.id)
                .data([grad]);

            let newGrad = false;

            gradient
                .enter()
                .append('linearGradient')
                .attr(
                    'id',
                    //as brilliant as this hack is, it's also godawful. I might as well put a goto here.
                    //this just returns the grad's id, as usual. BUT it also invokes a side effect to set
                    //a global flag (well, enclosing context flag) to say that this is a newly created gradient
                    //so down below we don't use any transition time to set the values. There's gotta be a better
                    //way to do this, but I couldn't figure it out.
                    (d) => {
                        newGrad = true;
                        return d.id;
                    }
                )
                .attr('gradientUnits', 'userSpaceOnUse')
                .attr('x1', (d) => {
                    return d.x1;
                })
                .attr('x2', (d) => {
                    return d.x2;
                })
                .attr('y1', (d) => {
                    return d.y1;
                })
                .attr('y2', (d) => {
                    return d.y2;
                })
                .attr('spreadMethod', 'pad');

            const transitionTime = newGrad ? 0 : this.options.transitionTime;

            const gradStops = gradient.selectAll('stop').data(grad.colors);

            gradStops.enter().append('stop');

            gradStops
                .transition()
                .duration(transitionTime)
                .attr('offset', (d, i) => {
                    if (grad.gradStops) {
                        return grad.gradStops[i];
                    } else {
                        let num = 0;
                        if (i == grad.colors.length - 1) {
                            num = 1;
                        } else if (i > 0) {
                            num = i / (grad.colors.length - 1);
                        }

                        return Math.round(10000 * num) / 100 + '%';
                    }
                })
                .attr('stop-color', (d) => {
                    return d;
                });

            return (this.linearGradients()[gradKey] = grad.id);
        },
        wrap: function wrap(text, width, xCoord) {
            if (xCoord == undefined) {
                xCoord = function () {
                    return 0;
                };
            }
            text.each(function () {
                let text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr('y'),
                    dy = parseFloat(text.attr('dy')) || 0,
                    tspan = text
                        .text(null)
                        .append('tspan')
                        .attr('x', xCoord)
                        .attr('y', y)
                        .attr('dy', dy + 'em');
                while ((word = words.pop())) {
                    line.push(word);
                    tspan.text(line.join(' '));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(' '));
                        line = [word];
                        tspan = text
                            .append('tspan')
                            .attr('x', xCoord)
                            .attr('y', y)
                            .attr('dy', lineHeight + 'em') //++lineNumber * lineHeight + dy + "em")
                            .text(word);
                    }
                }
            });
        },
        absPos: function absPos(obj) {
            const box = obj.getBBox();
            const matrix = obj.getScreenCTM();

            return { x: box.x + matrix.e, y: box.y + matrix.f };
        },
        endall: function endall(transition, callback) {
            let n = 0;
            transition
                .each(() => {
                    ++n;
                })
                .each('end', function () {
                    if (!--n) callback.apply(this, arguments);
                });
        },
        uniqueness: function uniqueness(uniqueFunc) {
            if (uniqueFunc == undefined) {
                uniqueFunc = this.options.uniqueFunc || this.uniqueID;
            }

            return this.options.useUniqueID ? uniqueFunc : undefined;
        },
    });
});
