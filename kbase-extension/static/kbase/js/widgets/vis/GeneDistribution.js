/*

*/

define(['kbwidget', 'bootstrap', 'jquery', 'd3', 'kbaseVisWidget'], (
    KBWidget,
    bootstrap,
    $,
    d3,
    kbaseVisWidget
) => {
    return KBWidget({
        name: 'GeneDistribution',
        parent: kbaseVisWidget,

        version: '1.0.0',
        options: {
            xScaleType: 'ordinal',
            overColor: 'yellow',
            strokeWidth: '2',

            xGutter: 0,
            yGutter: 0,
            xPadding: 0,
            yPadding: 0,
            debug: false,

            colorScale: function (idx) {
                const c1 = d3.scale.category20();
                const c2 = d3.scale.category20b();
                const c3 = d3.scale.category20c();

                return function (idx) {
                    if (idx < 20 || idx >= 60) {
                        const color = c1(idx % 20);
                        return color;
                    } else if (idx < 40) {
                        return c2(idx % 20);
                    } else if (idx < 60) {
                        return c3(idx % 20);
                    }
                };
            },

            inset: 5,
            colorDomain: [0, 100],

            transitionTime: 200,
        },

        _accessors: [],

        binColorScale: function (data, maxColor) {
            let max = 0;

            data.forEach((bin, idx) => {
                if (bin.results) {
                    if (bin.results.count > max) {
                        max = bin.results.count;
                    }
                }
            });

            return d3.scale.linear().domain([0, max]).range(['#FFFFFF', maxColor]);
        },

        renderXAxis: function () {},
        renderYAxis: function () {},

        domain: function (data) {
            let start = 1000000;
            let end = -1000000;

            for (let i = 0; i < data.length; i++) {
                if (data[i].end > end) {
                    end = data[i].end;
                }

                if (data[i].start < start) {
                    start = data[i].start;
                }
            }

            return [start, end];
        },

        regionDomain: function (data) {
            let length = 0;
            let lastVal = { end: 0 };
            data.forEach((val, idx) => {
                length += val.size;
                val.start = lastVal.end;
                val.end = val.start + val.size;
                lastVal = val;
            });

            return [0, length];
        },

        renderChart: function () {
            if (this.dataset() == undefined) {
                return;
            }
            const bounds = this.chartBounds();

            const regionDomain = this.regionDomain(this.dataset());

            const scale = d3.scale.linear().domain(regionDomain).range([0, bounds.size.width]);

            const $gd = this;

            const mouseAction = function (d, i) {
                this.on('mouseover', (b, j) => {
                    if ($gd.options.tooltip) {
                        $gd.options.tooltip(b);
                    } else if (b.start && b.regionObj.name) {
                        score = b.results ? b.results.count : 0;
                        if (score) {
                            $gd.showToolTip({
                                label:
                                    'bin starting at : ' +
                                    b.start +
                                    ' for ' +
                                    b.regionObj.name +
                                    ' score is ' +
                                    score,
                            });
                        }
                    }
                }).on('mouseout', (b, j) => {
                    $gd.hideToolTip();
                });
                return this;
            };

            const bins = [];

            this.dataset().forEach((region, idx) => {
                region._bins.forEach((bin, idx) => {
                    bin.regionObj = region;
                    bins.push(bin);
                });
            });

            const transitionTime = this.initialized ? this.options.transitionTime : 0;

            const regionsSelection = this.D3svg()
                .select(this.region('chart'))
                .selectAll('.regions')
                .data([0]);
            regionsSelection.enter().append('g').attr('class', 'regions');

            const regionSelection = regionsSelection
                .selectAll('.region')
                .data(this.dataset(), (d) => {
                    return d.name;
                });

            regionSelection
                .enter()
                .append('rect')
                .attr('class', 'region')
                .attr('opacity', 0)
                //                        .attr('transform', function (d) {return "translate(" + scale(d.start) + ",0)"})
                .attr('x', bounds.size.width)
                .attr('y', 0)
                .attr('width', 0)
                .attr('height', bounds.size.height);

            regionSelection
                .call(function (d) {
                    return mouseAction.call(this, d);
                })
                .transition()
                .duration(transitionTime)
                .attr('opacity', 1)
                .attr('x', (d) => {
                    return scale(d.start);
                })
                .attr('width', (d) => {
                    return scale(d.size);
                })
                .attr('fill', (d, i) => {
                    const colorScale = d3.scale
                        .linear()
                        .domain([0, 1])
                        .range(['#FFFFFF', $gd.colorForRegion(d.name)]);
                    return colorScale(0.25);
                });

            regionSelection
                .exit()
                .transition()
                .duration(transitionTime)
                .attr('opacity', 0)
                .attr('x', bounds.size.width + 1)
                .attr('width', 0)
                .each('end', function (d) {
                    d3.select(this).remove();
                });

            const binsSelection = this.D3svg()
                .select(this.region('chart'))
                .selectAll('.bins')
                .data([0]);
            binsSelection.enter().append('g').attr('class', 'bins');

            const binSelection = binsSelection.selectAll('.bin').data(bins);

            binSelection
                .enter()
                .append('rect')
                .attr('class', 'bin')
                .attr('opacity', 0)
                .attr('x', bounds.size.width)
                .attr('y', 0)
                .attr('width', 0)
                .attr('height', bounds.size.height);

            binSelection
                .call(function (d) {
                    return mouseAction.call(this, d);
                })
                .transition()
                .duration(transitionTime)
                .attr('opacity', (d) => {
                    return d.results ? 1 : 0;
                })
                .attr('x', (d) => {
                    return scale(d.start + d.regionObj.start);
                })
                .attr('width', (d) => {
                    return scale(d.end - d.start);
                })
                .attr('fill', (d, i) => {
                    return $gd.colorForRegion(d.region);
                });

            binSelection
                .exit()
                .transition()
                .duration(transitionTime)
                .attr('opacity', 0)
                .attr('x', bounds.size.width + 1)
                .attr('width', 0)
                .each('end', function (d) {
                    d3.select(this).remove();
                });

            this.initialized = true;
        },

        colorForRegion: function (region, colorScale) {
            let map = this.regionColors;
            if (map == undefined) {
                map = this.regionColors = { colorScale: this.options.colorScale() };
            }

            if (map[region] == undefined) {
                map[region] = map.colorScale(d3.keys(map).length);
            }

            return map[region];
        },
    });
});
