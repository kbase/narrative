define([
    'kbwidget',
    'd3',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'underscore',
    'base/js/namespace',
    'kb_common/jsonRpc/genericClient',
    'widgets/common/LoadingMessage',
    'widgets/common/ErrorMessage',
    'widgets/common/jQueryUtils',
    'kbaseTabs',

    // For effect
    'css!ext_components/jquery.tipsy/css/jquery.tipsy.css',
    'bootstrap',
    'bootstrap-slider',
    'jquery-dataTables',
    'tipsy',
    'css!./kbaseExpressionVolcanoPlot.css'
], (
    KBWidget,
    d3,
    Config,
    KBaseAuthenticatedWidget,
    _,
    Jupyter,
    ServiceClient,
    $LoadingMessage,
    $ErrorMessage,
    jQueryUtils,
    KBaseTabs
) => {
    'use strict';

    const { $el, $row, $col } = jQueryUtils;

    const DEBOUNCE_INTERVAL = 25;
    const DEFAULT_LOG10_Q_VALUE = -Math.log10(0.05);
    const DEFAULT_FOLD_CHANGE_VALUE = 1;
    const EXPORT_PRECISION = 4;

    return KBWidget({
        name: 'kbaseExpressionVolcanoPlot',
        parent: KBaseAuthenticatedWidget,
        version: '1.0.0',
        token: null,
        width: 800,

        init: function (options) {
            this._super(options);

            // Holds table rows, aka genes, selected by the q-value and fold-change min/max and cutoffs
            this.selectedRows = [];

            // Constants
            this.svgWidth = 800;
            this.svgHeight = 350;
            this.padding = 100;

            return this;
        },

        loggedInCallback: function (event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function () {
            this.token = null;
            this.render();
            return this;
        },

        render: async function () {
            try {
                this.$elem.addClass('KBaseExpressionVolcanoPlot');
                this.$elem.html($LoadingMessage('Loading Differential Expression Matrix...'));
                this.renderData = await this.loadInitialData();
                this.renderLayout();
                this._rewireIds(this.$elem, this);
                this.renderSVG();
                this.$el('geneCountTotal').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.renderData.voldata.length));
                this.$el('originalCount').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.renderData.originalCount));
                this.$el('geneCountInRange').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.renderData.voldata.length));
            } catch (err) {
                this.$elem.html($ErrorMessage(err));
            }
        },

        renderLayout: function () {
            // The major pieces
            const $plotControls = this.$renderPlotControls();
            const $plotInfo = this.$renderPlotInfo();
            const $plot = this.$renderPlot();
            const $geneTable = this.$renderGeneTable();

            // this.$volcanoPlotTab = 

            const $tabs = $el('div');
            new KBaseTabs($tabs, {
                tabs: [{
                    tab: 'Volcano Plot',
                    content: $el('div')
                        .append($plotControls)
                        .append($el('div')
                            .addClass('content-section')
                            .html($plot)),
                    show: true
                }, {
                    tab: 'Gene Table',
                    content: $el('div').html($geneTable),
                    onShown: () => {
                        this.updateGeneTable();
                    }
                }]
            });

            const $layout = $el('div').addClass('PlotGrid')
                // NB: width of this column should match that of the plot
                .append($el('div').addClass('PlotColumn').append($tabs))
                .append($el('div').addClass('InfoColumn').append($plotInfo));
            this.$elem.html($layout);
        },

        loadInitialData: async function () {
            const workspaceClient = new ServiceClient({
                module: 'Workspace',
                url: Config.url('workspace'),
                token: this.token
            });

            const [result] = await workspaceClient
                .callFunc('get_objects2', [{
                    objects: [{
                        ref: this.options.ref
                    }]
                }]);

            const differentialExpressionMatrix = result.data[0].data;

            this.objectName = result.data[0].info[0][1];

            // TODO - fix; relies on ordering of object k-v pairs
            const [condition_1, condition_2] = Object.entries(differentialExpressionMatrix.condition_mapping)[0];

            let min_log_q = null;

            const missing = {
                gene: 0,
                log2fc_f: 0,
                p_value_f: 0,
                q_value: 0
            };

            const voldata = differentialExpressionMatrix.data.row_ids.map((gene, index) => {
                const [log2fc_f, p_value_f, q_value] = differentialExpressionMatrix.data.values[index];
                return {
                    gene, log2fc_f, p_value_f, q_value
                };
            })
                .filter(({ gene, log2fc_f, p_value_f, q_value }) => {
                    const somethingIsMissing = (gene === null || log2fc_f === null || p_value_f === null || q_value === null);
                    if (somethingIsMissing) {
                        if (gene === null) {
                            missing.gene += 1;
                        }
                        if (log2fc_f === null) {
                            missing.log2fc_f += 1;
                        }
                        if (p_value_f === null) {
                            missing.p_value_f += 1;
                        }
                        if (q_value === null) {
                            missing.q_value += 1;
                        }
                    }
                    return !somethingIsMissing;
                })
                .map((voldatum) => {
                    const log10_q_value = (() => {
                        if (voldatum.q_value === 0) {
                            return min_log_q;
                        } else {
                            const value = -Math.log10(voldatum.q_value);
                            min_log_q = Math.min(min_log_q, value);
                            return value;
                        }
                    })();

                    return {
                        ...voldatum,
                        log10_q_value
                    };
                });

            if (min_log_q === null) {
                throw new Error('no q_values available');
            }

            return { condition_1, condition_2, voldata, originalCount: differentialExpressionMatrix.data.row_ids.length, missing };
        },

        colorx: function (d, logQValue, foldChangeValue) {
            const x = d.log2fc_f;
            const y = d.log10_q_value;

            if (Math.abs(x) >= foldChangeValue && y >= logQValue) {
                if (x > 0) {
                    return 'red';
                } else {
                    return 'blue';
                }
            }
            return 'grey';
        },

        updateGeneTable: function () {
            this.$el('voltable').DataTable().draw();
        },

        $renderGeneTable: function () {
            const $geneTable = $el('div');

            // Then the table
            const $table = $el('table')
                .attr('id', 'voltable')
                .addClass('table table-striped table-bordered');
            $geneTable.html($table);

            function renderNumber(value) {
                return `
                    <div style="font-family: monospace;">
                        ${Intl.NumberFormat('en-US', { notation: 'scientific', maximumSignificantDigits: 6, minimumSignificantDigits: 6 }).format(value)}
                    </div>
                `;
            }

            const cachedTableData = {
                search: null,
                orderColumn: null,
                orderDirection: null,
                data: null
            };

            $table.DataTable({
                autoWidth: false,
                deferRender: true,
                columns: [
                    {
                        title: 'Gene',
                        width: '14%'
                    },
                    {
                        title: 'p-value',
                        width: '20%',
                        render: renderNumber
                    },
                    {
                        title: 'q-value',
                        width: '20%',
                        render: renderNumber
                    },
                    {
                        title: 'Significance (-Log10)',
                        width: '23%',
                        render: renderNumber
                    },
                    {
                        title: 'Fold Change (Log2)',
                        width: '23%',
                        render: renderNumber
                    }
                ],
                serverSide: true,
                ajax: (data, callback) => {
                    const { start, length, draw, search: { value: searchValue }, order } = data;
                    let cachedDataUsed = false;
                    const rows = (() => {
                        if (cachedTableData.searchValue !== null) {
                            if (cachedTableData.searchValue === searchValue && cachedTableData.data !== null) {
                                cachedDataUsed = true;
                                return cachedTableData.data;
                            }
                        }
                        cachedTableData.searchValue = searchValue;
                        if (searchValue) {
                            const searchRegex = new RegExp(searchValue, 'i');
                            return this.selectedRows.filter((row) => {
                                return searchRegex.test(row[0]);
                            });
                        } else {
                            return this.selectedRows;
                        }
                    })();

                    if (order.length > 0) {
                        const orderColumn = order[0].column;
                        const orderDirection = order[0].dir;

                        if (cachedTableData.orderColumn !== null) {
                            if (cachedTableData.orderColumn === orderColumn && cachedTableData.orderDirection === orderDirection && cachedDataUsed) {
                                return rows;
                            }
                        }
                        cachedTableData.orderColumn = orderColumn;
                        cachedTableData.orderDirection = orderDirection;

                        rows.sort((a, b) => {
                            let v1 = a[orderColumn];
                            let v2 = b[orderColumn];

                            if (orderDirection === 'desc') {
                                const t = v2;
                                v2 = v1;
                                v1 = t;
                            }

                            if (typeof v1 === 'string') {
                                return v1.localeCompare(v2);
                            } else {
                                return v1 - v2;
                            }
                        });
                    }
                    callback({
                        draw,
                        data: rows.slice(start, start + length),
                        recordsTotal: rows.length,
                        recordsFiltered: rows.length
                    });
                }
            });

            return $geneTable;
        },

        $renderPlotControls: function () {

            return $el('div').addClass('container-fluid PlotControls')
                // header row
                .append($row().append(
                    $col().addClass('title').text('Significance (-Log10)'),
                    $col().addClass('title').text('Fold Change (Log2)')
                ))
                // slider row
                .append($row()
                    .append($col()
                        .append($row()
                            .addClass('-slider-control')
                            .append(
                                $el('div')
                                    .addClass('-before')
                                    .attr('id', 'pv1')
                                    .append('0.0')

                            )
                            .append(
                                $el('input')
                                    .attr('type', 'text')
                                    .addClass('-slider')
                                    .attr('id', 'log10_q_value-slider')
                            )
                            .append(
                                $el('div')
                                    .addClass('-after')
                                    .attr('id', 'pv2')
                                    .append('1.0')
                            )
                        ))
                    .append($col()
                        .append($row()
                            .addClass('-slider-control')
                            .append(
                                $el('div')
                                    .addClass('-before')
                                    .attr('id', 'fc1')
                                    .append('0.0')

                            )
                            .append(
                                $el('input')
                                    .attr('type', 'text')
                                    .addClass('span2 -slider')
                                    .attr('id', 'fc-slider')
                            )
                            .append(
                                $el('div')
                                    .addClass('-after')
                                    .attr('id', 'fc2')
                                    .append('1.0')
                            )

                        )
                    ))
                // inputs row
                .append($row()
                    // significance column
                    .append($col()
                        // input title row
                        .append(
                            $row()
                                .append($col().addClass('title').text('min'))
                                .append($col().addClass('title').text('current'))
                                .append($col().addClass('title').text('max')))
                        // input control row
                        .append($row()
                            .append($col()
                                .append($el('input')
                                    .attr('id', 'minY')
                                    .addClass('form-control')
                                    .on('change', (e) => {
                                        this.options.ymin = parseFloat(e.target.value);
                                        this.renderSVG();
                                    })
                                )
                            )
                            .append($col()
                                .append($el('input')
                                    .attr('id', 'input-currentLogQValue')
                                    .addClass('form-control')
                                    .on('change', (e) => {
                                        this.setLogQValueSlider(parseFloat(e.target.value));
                                    })
                                )
                            )
                            .append($col()
                                .append($el('input')
                                    .addClass('form-control')
                                    .attr('id', 'maxY')
                                    .on('change', (e) => {
                                        this.options.ymax = parseFloat(e.target.value);
                                        this.renderSVG();
                                    })
                                )
                            )
                        ))
                    // fold col
                    .append($col()
                        // title col
                        .append(
                            $row()
                                .append($col().addClass('title').text('min'))
                                .append($col().addClass('title').text('current'))
                                .append($col().addClass('title').text('max')))
                        // inputs row
                        .append($row()
                            .append($col()
                                .append($el('input')
                                    .attr('id', 'minX')
                                    .addClass('form-control')
                                    .on('change', (e) => {
                                        this.options.xmin = parseFloat(e.target.value);
                                        this.renderSVG();
                                    })
                                )
                            )
                            .append($col()
                                .append(
                                    $el('input')
                                        .attr('id', 'input-currentFoldChangeValue')
                                        .addClass('form-control')
                                        .on('change', (e) => {
                                            this.setFoldChangeSlider(parseFloat(e.target.value));
                                        })
                                )
                            )
                            .append($col()
                                .append($el('input')
                                    .attr('id', 'maxX')
                                    .addClass('form-control')
                                    .on('change', (e) => {
                                        this.options.xmax = parseFloat(e.target.value);
                                        this.renderSVG();
                                    })
                                )
                            )
                        )
                    )
                );
        },

        $renderPlotInfo: function () {
            function $plotInfoRow(label, id) {
                return $row()
                    .append(
                        $col().text(label)
                    )
                    .append(
                        $col().attr('id', id)
                    );
            }
            const $plotInfo = $el('div').addClass('prop-table')
                .append($plotInfoRow('Condition 1', 'cond1'))
                .append($plotInfoRow('Condition 2', 'cond2'))
                .append($plotInfoRow('Total Genes', 'originalCount'))
                .append($plotInfoRow('w/ missing values removed', 'geneCountTotal'))
                .append($plotInfoRow('w/ min/max applied', 'geneCountInRange'))
                .append($plotInfoRow('Significance (-Log10)', 'statsDisplay-currentLogQValue'))
                .append($plotInfoRow('Fold Change (Log2)', 'statsDisplay-currentFoldChangeValue'))
                .append($plotInfoRow('Selected Genes', 'geneCountSelected'))
                .append(
                    $row()
                        .append(
                            $col().text('Export')
                        )
                        // Wrap button in a div to remove the flexbox.
                        .append(
                            $col().html($el('div').html(this.$renderExportButton()))
                        )
                );

            const $tabs = $el('div');
            new KBaseTabs($tabs, {
                tabs: [{
                    tab: 'Stats',
                    content: $plotInfo,
                    show: true
                }]
            });
            return $tabs;
        },

        $renderExportButton: function () {
            return $el('button')
                .addClass('btn btn-primary')
                .on('click', () => {
                    const fc = this.$el('fc-slider').bootstrapSlider('getValue');
                    const log10_q_value = this.$el('log10_q_value-slider').bootstrapSlider('getValue');

                    const q_value = Math.pow(10, -log10_q_value, 10);

                    const params = {
                        diff_expression_ref: this.options.setObjectName,
                        q_cutoff: parseFloat(q_value.toPrecision(EXPORT_PRECISION)),
                        fold_change_cutoff: parseFloat(fc.toPrecision(EXPORT_PRECISION)),
                    };

                    Jupyter.narrative.addAndPopulateApp(
                        'FeatureSetUtils/upload_featureset_from_diff_expr',
                        null,
                        params
                    );
                })
                .append('Export as Feature Set');
        },

        $renderPlot: function () {
            const $chart = $el('div');

            this.svg = d3
                .select($chart[0])
                .append('svg')
                .attr('width', this.svgWidth)
                .attr('height', this.svgHeight);

            this.svg
                .append('text')
                .attr('class', 'xlabel')
                .attr('text-anchor', 'end')
                .attr('x', this.svgWidth / 2)
                .attr('y', this.svgHeight - 40)
                .text('Fold Change (Log2)');

            this.svg
                .append('text')
                .attr('class', 'ylabel')
                .attr('text-anchor', 'end')
                .attr('y', 40)
                .attr('x', -this.svgHeight / 2 + 50)
                .attr('transform', 'rotate(-90)')
                .text('Significance (-Log10)');

            this.svg
                .append('g')
                .attr('class', 'xaxis axis')
                .attr('transform', 'translate(0,' + (this.svgHeight - this.padding + 20) + ')');

            this.svg
                .append('g')
                .attr('class', 'yaxis axis')
                .attr('transform', 'translate(' + (this.padding - 10) + ',0)');

            return $chart;
        },

        $el: function (idValue) {
            return this.$elem.find(`[data-id="${idValue}"]`);
        },

        setFoldChangeSlider: function (newValue) {
            this.$el('fc-slider')
                .bootstrapSlider('setValue', newValue, false, true);
        },

        setLogQValueSlider: function (newValue) {
            this.$el('log10_q_value-slider')
                .bootstrapSlider('setValue', newValue, false, true);
        },

        updateCurrentFoldChangeValue: function (newValue) {
            this.$el('input-currentFoldChangeValue').val(newValue.toFixed(6));
            this.$el('statsDisplay-currentFoldChangeValue').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(newValue));
        },

        updateCurrentLogQValue: function (newValue) {
            this.$el('input-currentLogQValue').val(newValue.toFixed(6));
            this.$el('statsDisplay-currentLogQValue').text(newValue.toFixed(6));
        },

        setupLogQSlider: function (svg, ymin, ymax) {
            const slider = this.$el('log10_q_value-slider')
                .bootstrapSlider({
                    tooltip_position: 'bottom',
                    step: 0.01,
                    precision: 17,
                    min: ymin,
                    max: ymax,
                });

            const logQValueSliderChange = _.debounce(({ value: { newValue } }) => {
                this.updateCurrentLogQValue(newValue);

                const fcValue = this.$el('fc-slider').bootstrapSlider('getValue');

                this.selectedRows = [];
                const circles = svg.selectAll('circle');
                circles
                    .transition()
                    .attr('fill', (d) => {
                        const cc = this.colorx(d, newValue, fcValue);
                        if (cc !== 'grey') {
                            this.selectedRows.push([
                                d.gene,
                                d.p_value_f,
                                d.q_value,
                                d.log10_q_value,
                                d.log2fc_f,
                            ]);
                        }
                        return cc;
                    });

                this.$el('geneCountInRange').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(circles.size()));
                this.$el('geneCountSelected').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.selectedRows.length));
            }, DEBOUNCE_INTERVAL);

            slider.on('change', logQValueSliderChange);

            slider.bootstrapSlider('setValue', DEFAULT_LOG10_Q_VALUE);
            this.updateCurrentLogQValue(DEFAULT_LOG10_Q_VALUE);
        },

        setupFoldChangeSlider: function (svg, xmin, xmax) {
            const slider = this.$el('fc-slider')
                .bootstrapSlider({
                    tooltip_position: 'bottom',
                    step: 0.01,
                    min: xmin,
                    precision: 17,
                    max: xmax,
                    formatter: (value) => {
                        return value.toFixed(2);
                    }
                });

            const fcSliderChange = _.debounce(({ value: { newValue } }) => {
                // const foldChangeValue = slider.bootstrapSlider('getValue');

                const log10QValue = this.$el('log10_q_value-slider').bootstrapSlider('getValue');

                this.updateCurrentFoldChangeValue(newValue);

                this.selectedRows = [];
                const circles = svg.selectAll('circle');
                circles
                    .transition()
                    .attr('fill', (d) => {
                        const cc = this.colorx(d, log10QValue, newValue);
                        if (cc !== 'grey') {
                            this.selectedRows.push([
                                d.gene,
                                d.p_value_f,
                                d.q_value,
                                d.log10_q_value,
                                d.log2fc_f,
                            ]);
                        }
                        return cc;
                    });

                this.$el('geneCountInRange').text(String(circles.size()));
                this.$el('geneCountSelected').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.selectedRows.length));
            }, DEBOUNCE_INTERVAL);

            slider.on('change', fcSliderChange);

            slider.bootstrapSlider('setValue', DEFAULT_FOLD_CHANGE_VALUE);
            this.updateCurrentFoldChangeValue(DEFAULT_FOLD_CHANGE_VALUE);
        },

        renderSVG: function () {
            const renderData = this.renderData;
            const padding = this.padding;
            const svg = this.svg;

            // TODO: see if we can stamp these out.
            let highlightElement = null;

            // function to show info callouts
            const info = function () {
                const element = d3.select(this);
                element
                    .transition()
                    .duration(100)
                    .attr('stroke', element.attr('fill'))
                    .attr('stroke-width', 5);

                if (highlightElement) {
                    highlightElement.transition().duration(100).attr('stroke', 'none');
                }

                highlightElement = element;
            };

            this.$el('cond1').text(renderData.condition_1);
            this.$el('cond2').text(renderData.condition_2);

            // Filter NO_TEST data

            // name = gene
            // f = significant
            // x = log2fc_fa
            // y = log10_q_value

            // tables contents
            // Gene
            // Locus
            // Value1
            // Value2
            // Log2fc
            // Pvalue
            // Qvalue

            const rawData = renderData.voldata;

            const xmin = this.options.xmin || d3.min(rawData, (d) => {
                return d.log2fc_f;
            });
            const xmax = this.options.xmax || d3.max(rawData, (d) => {
                return d.log2fc_f;
            });

            const ymin = this.options.ymin || d3.min(rawData, (d) => {
                return d.log10_q_value;
            });
            const ymax = this.options.ymax || d3.max(rawData, (d) => {
                return d.log10_q_value;
            });

            // Set the min/max labels for the slider
            this.$el('minX').val(xmin.toFixed(2));
            this.$el('maxX').val(xmax.toFixed(2));
            this.$el('minY').val(ymin.toFixed(2));
            this.$el('maxY').val(ymax.toFixed(2));

            const filteredData = rawData.filter((d) => {
                if (
                    !Number.isNaN(d.log2fc_f) &&
                    !Number.isNaN(d.log10_q_value) &&
                    d.log2fc_f >= xmin &&
                    d.log2fc_f <= xmax &&
                    d.log10_q_value >= ymin &&
                    d.log10_q_value <= ymax
                ) {
                    return true;
                } else {
                    return false;
                }
            });

            const sliderXMin = 0;
            const sliderXMax = Math.max(xmax, Math.abs(xmin));

            this.$el('fc1').text(sliderXMin.toFixed(2));
            this.$el('fc2').text(sliderXMax.toFixed(2));
            this.$el('pv1').text(ymin.toFixed(2));
            this.$el('pv2').text(ymax.toFixed(2));

            // Log q slider
            this.setupLogQSlider(svg, ymin, ymax);

            // Fold change slider
            this.setupFoldChangeSlider(svg, sliderXMin, sliderXMax);

            const pv = this.$el('log10_q_value-slider').bootstrapSlider('getValue');
            const fc = this.$el('fc-slider').bootstrapSlider('getValue');

            const xScale = d3.scale
                .linear()
                .domain([xmin, xmax])
                .range([padding, this.svgWidth - padding]);

            const yScale = d3.scale
                .linear()
                .domain([ymin, ymax])
                .range([this.svgHeight - padding, 10]);

            this.selectedRows = [];
            svg.selectAll('circle').data(filteredData).enter().append('svg:circle');
            svg.selectAll('circle')
                .data(filteredData)
                .attr('cx', (d) => {
                    return xScale(d.log2fc_f);
                })
                .attr('cy', (d) => {
                    return yScale(d.log10_q_value);
                })
                .attr('r', 3)
                .attr('fill', (d) => {
                    const cc = this.colorx(d, pv, fc);
                    if (cc !== 'grey') {
                        this.selectedRows.push([
                            d.gene,
                            d.p_value_f,
                            d.q_value,
                            d.log10_q_value,
                            d.log2fc_f,
                        ]);
                    }
                    return cc;
                })
                // NB: this and other d3 event handlers which operate on the selected element
                // need to use the "function" form rather than fat-arrow "=>" in order for this
                // version of d3 to set "this" for it.
                .on('mouseover', function () {
                    d3.select(this).transition().duration(100).attr('r', 7);
                })
                .on('mouseout', function () {
                    d3.select(this).transition().duration(100).attr('r', 3);
                })
                .on('click', info)
                .attr('id', (d) => {
                    return d.significant;
                });

            const allCircles = svg.selectAll('circle');

            this.$el('geneCountInRange').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(filteredData.length));
            this.$el('geneCountSelected').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.selectedRows.length));

            allCircles.data(filteredData).exit().remove();
            const xAxis = d3.svg.axis().scale(xScale).orient('bottom').ticks(10); //Set rough # of ticks
            const yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(10);
            svg.selectAll('.xaxis').call(xAxis);
            svg.selectAll('.yaxis').call(yAxis);
        },
    });
});
