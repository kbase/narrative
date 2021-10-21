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

    const { $el } = jQueryUtils;

    const DEBOUNCE_INTERVAL = 25;
    const DEFAULT_LOG_Q_VALUE = 1;
    const DEFAULT_FOLD_CHANGE_VALUE = 0;
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

        renderLoading() {
            return $el('div')
                .css('margin', '20px auto')
                .append($LoadingMessage('Loading Differential Expression Matrix...'));
        },

        render: async function () {
            try {
                this.$elem.addClass('KBaseExpressionVolcanoPlot');
                this.$elem.html(this.renderLoading());
                this.renderData = await this.loadInitialData();
                this.renderLayout();
                this._rewireIds(this.$elem, this);
                this.renderSVG();
                this.dataId('geneCountTotal').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.renderData.voldata.length));
                this.dataId('geneCountInRange').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.renderData.voldata.length));
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
                    content: $el('div').css('margin-top', '10px').append($plotControls).append($plot),
                    show: true
                }, {
                    tab: 'Gene Table',
                    content: $el('div').css('margin-top', '10px').html($geneTable),
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

            const voldata = differentialExpressionMatrix.data.row_ids.map((gene, index) => {
                const [log2fc_f, p_value_f, q_value] = differentialExpressionMatrix.data.values[index];
                return {
                    gene, log2fc_f, p_value_f, q_value
                };
            })
                .filter(({ gene, log2fc_f, p_value_f, q_value }) => {
                    return gene && log2fc_f && p_value_f && q_value;
                })
                .map((voldatum) => {
                    const log_q_value = (() => {
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
                        log_q_value
                    };
                });

            if (min_log_q === null) {
                throw new Error('no q_values available');
            }

            return { condition_1, condition_2, voldata };
        },

        colorx: function (d, logQValue, foldChangeValue) {
            const x = d.log2fc_f;
            const y = d.log_q_value;

            if (Math.abs(x) >= foldChangeValue && y >= logQValue) {
                if (x > 0) {
                    return 'red';
                } else {
                    return 'blue';
                }
                // this condition is always true; leaving it here because
                // the intention seems to have been to use red if significant is 'yes'
                // if (true || d.significant === 'yes') {
                // return 'red';
            }
            return 'grey';
        },

        updateGeneTable: function () {
            const $table = this.data('voltable');
            $table.hide();
            const dtable = $table.DataTable();
            dtable.clear().draw();
            $table.show();
            dtable.rows.add(this.selectedRows).draw();
        },

        $renderGeneTable: function () {
            const $geneTable = $el('div');

            // Then the table
            const $table = $el('table')
                .attr('id', 'voltable')
                .addClass('table table-striped table-bordered');
            $geneTable.append($table);

            function renderNumber(value) {
                return `
                    <div style="font-family: monospace;">
                        ${Intl.NumberFormat('en-US', { maximumSignificantDigits: 6, minimumSignificantDigits: 6 }).format(value)}
                    </div>
                `;
            }

            $table.DataTable({
                autoWidth: false,
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
                ]
            });

            return $geneTable;
        },

        $renderPlotControls: function () {
            return $el('table').addClass('PlotControls')
                .append($el('thead').append(
                    $el('tr').append(
                        $el('th').css('text-align', 'center').text('Significance (-Log10)'),
                        $el('th').css('text-align', 'center').text('Fold Change (Log2)')
                    )
                ))
                .append($el('tbody')
                    .append(
                        $el('tr')
                            .append(
                                $el('td')
                                    .append(
                                        $el('div')
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
                                                    .addClass('span2 -slider')
                                                    .attr('id', 'log_q_value')
                                            )
                                            .append(
                                                $el('div')
                                                    .addClass('-after')
                                                    .attr('id', 'pv2')
                                                    .append('1.0')
                                            )
                                    )
                            )
                            .append(
                                $el('td')
                                    .append(
                                        $el('div')
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
                                                    .attr('id', 'fc')
                                            )
                                            .append(
                                                $el('div')
                                                    .addClass('-after')
                                                    .attr('id', 'fc2')
                                                    .append('1.0')
                                            )
                                    )
                            )
                    )
                    .append(
                        $el('tr')
                            .append(
                                $el('td')
                                    .append(
                                        $el('table')
                                            .append($el('thead')
                                                .append(
                                                    $el('tr')
                                                        .append(
                                                            $el('th').text('min')
                                                        )
                                                        .append(
                                                            $el('th').text('current')
                                                        )
                                                        .append(
                                                            $el('th')
                                                                .text('max')
                                                        )
                                                )
                                            )
                                            .append($el('tbody')
                                                .append(
                                                    $el('tr')
                                                        .append(
                                                            $el('td')
                                                                .append(
                                                                    $el('input')
                                                                        .attr('id', 'minY')
                                                                        .addClass('form-control')
                                                                        .on('change', (e) => {
                                                                            this.options.ymin = parseFloat(e.target.value);
                                                                            this.renderSVG();
                                                                        })
                                                                )
                                                        )
                                                        .append(
                                                            $el('td')
                                                                .append(
                                                                    $el('input')
                                                                        .attr('id', 'currentLogQValue')
                                                                        .addClass('form-control')
                                                                        .on('change', (e) => {
                                                                            this.setLogQValueSlider(parseFloat(e.target.value));
                                                                        })
                                                                )
                                                        )
                                                        .append(
                                                            $el('td')
                                                                .append(
                                                                    $el('input')
                                                                        .addClass('form-control')
                                                                        .attr('id', 'maxY')
                                                                        .on('change', (e) => {
                                                                            this.options.ymax = parseFloat(e.target.value);
                                                                            this.renderSVG();
                                                                        })
                                                                )
                                                        )
                                                )
                                            )
                                    )
                            )
                            .append(
                                $el('td')
                                    .append(
                                        $el('table')
                                            .append($el('thead')
                                                .append(
                                                    $el('tr')
                                                        .append(
                                                            $el('th').text('min')
                                                        )
                                                        .append(
                                                            $el('th').text('current')
                                                        )
                                                        .append(
                                                            $el('th')
                                                                .text('max')
                                                        )
                                                )
                                            )
                                            .append($el('tbody')
                                                .append(
                                                    $el('tr')
                                                        .append(
                                                            $el('td')
                                                                .append(
                                                                    $el('input')
                                                                        .attr('id', 'minX')
                                                                        .addClass('form-control')
                                                                        .on('change', (e) => {
                                                                            this.options.xmin = parseFloat(e.target.value);
                                                                            this.renderSVG();
                                                                        })
                                                                )
                                                        )
                                                        .append(
                                                            $el('td')
                                                                .append(
                                                                    $el('input')
                                                                        .attr('id', 'currentFoldChangeValue')
                                                                        .addClass('form-control')
                                                                        .on('change', (e) => {
                                                                            this.setFoldChangeSlider(parseFloat(e.target.value));
                                                                        })
                                                                )
                                                        )
                                                        .append(
                                                            $el('td')
                                                                .append(
                                                                    $el('input')
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
                                    )
                            )
                    ));
        },

        $renderPlotInfo: function () {
            const $plotInfo = $el('table')
                .addClass('table PropTable')
                .append(
                    $el('tr')
                        .append(
                            $el('th').text('Condition 1')
                        )
                        .append(
                            $el('td').attr('id', 'cond1')
                        )
                )
                .append(
                    $el('tr')
                        .append(
                            $el('th').text('Condition 2')
                        )
                        .append(
                            $el('td').attr('id', 'cond2')
                        )
                )
                .append(
                    $el('tr')
                        .append(
                            $el('th').text('Total Genes')
                        )
                        .append(
                            $el('td').attr('id', 'geneCountTotal')
                        )
                )
                .append(
                    $el('tr')
                        .append(
                            $el('th').text('Genes within range')
                        )
                        .append(
                            $el('td').attr('id', 'geneCountInRange')
                        )
                )
                .append(
                    $el('tr')
                        .append(
                            $el('th').text('Significance (-Log10)')
                        )
                        .append(
                            $el('td').attr('id', 'currentLogQValue2')
                        )
                )
                .append(
                    $el('tr')
                        .append(
                            $el('th').text('Fold Change (Log2)')
                        )
                        .append(
                            $el('td').attr('id', 'currentFoldChangeValue2')
                        )
                )
                .append(
                    $el('tr')
                        .append(
                            $el('th').text('Selected Genes')
                        )
                        .append(
                            $el('td').attr('id', 'geneCountSelected')
                        )
                )
                .append(
                    $el('tr')
                        .append(
                            $el('th').text('Export')
                        )
                        .append(
                            $el('td').append(this.$renderExportButton())
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
                    const fc = this.data('fc').bootstrapSlider('getValue');
                    const log_q_value = this.data('log_q_value').bootstrapSlider('getValue');

                    const params = {
                        diff_expression_ref: this.options.setObjectName,
                        q_cutoff: parseFloat(log_q_value.toPrecision(EXPORT_PRECISION)),
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

        dataId: function (idValue) {
            return this.$elem.find(`[data-id="${idValue}"]`);
        },

        setFoldChangeSlider: function (newValue) {
            this.dataId('fc')
                .bootstrapSlider('setValue', newValue, false, true);
        },

        setLogQValueSlider: function (newValue) {
            this.dataId('log_q_value')
                .bootstrapSlider('setValue', newValue, false, true);
        },

        updateCurrentFoldChangeValue: function (newValue) {
            this.data('currentFoldChangeValue').val(newValue.toFixed(2));
            this.data('currentFoldChangeValue2').text(newValue.toFixed(2));
        },

        updateCurrentLogQValue: function (newValue) {
            this.data('currentLogQValue').val(newValue.toFixed(2));
            this.data('currentLogQValue2').text(newValue.toFixed(2));
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


            this.data('cond1').text(renderData.condition_1);
            this.data('cond2').text(renderData.condition_2);

            // Filter NO_TEST data

            // name = gene
            // f = significant
            // x = log2fc_fa
            // y = log_q_value

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
                return d.log_q_value;
            });
            const ymax = this.options.ymax || d3.max(rawData, (d) => {
                return d.log_q_value;
            });

            // Set the min/max labels for the slider
            this.data('minX').val(xmin.toFixed(2));
            this.data('maxX').val(xmax.toFixed(2));
            this.data('minY').val(ymin.toFixed(2));
            this.data('maxY').val(ymax.toFixed(2));

            const filteredData = rawData.filter((d) => {
                if (
                    !Number.isNaN(d.log2fc_f) &&
                    !Number.isNaN(d.log_q_value) &&
                    d.log2fc_f >= xmin &&
                    d.log2fc_f <= xmax &&
                    d.log_q_value >= ymin &&
                    d.log_q_value <= ymax
                ) {
                    return true;
                } else {
                    return false;
                }
            });

            const sliderXMin = 0;
            const sliderXMax = Math.max(xmax, Math.abs(xmin));

            this.data('fc1').text(sliderXMin.toFixed(2));
            this.data('fc2').text(sliderXMax.toFixed(2));
            this.data('pv1').text(ymin.toFixed(2));
            this.data('pv2').text(ymax.toFixed(2));

            const fcSliderChange = _.debounce((ev) => {
                const { newValue } = ev.value;
                const foldChangeValue = newValue;
                const logQValue = loqQValueSlider.bootstrapSlider('getValue');

                this.updateCurrentFoldChangeValue(foldChangeValue);

                const circles = svg.selectAll('circle');
                this.selectedRows = [];

                circles
                    .transition()
                    .attr('fill', (d) => {
                        const cc = this.colorx(d, logQValue, foldChangeValue);
                        if (cc !== 'grey') {
                            this.selectedRows.push([
                                d.gene,
                                d.p_value_f,
                                d.q_value,
                                d.log2fc_f,
                                d.log_q_value,
                            ]);
                        }
                        return cc;
                    });

                this.dataId('geneCountInRange').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(circles.size()));
                this.data('geneCountSelected').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.selectedRows.length));
            }, DEBOUNCE_INTERVAL);

            const fcSlider = this.dataId('fc')
                .bootstrapSlider({
                    tooltip_position: 'bottom',
                    step: 0.01,
                    min: sliderXMin,
                    precision: 2,
                    max: sliderXMax,
                    formatter: (value) => {
                        return value.toFixed(2);
                    }
                });

            fcSlider.on('change', fcSliderChange);

            const logQValueSliderChange = _.debounce(({ value: { newValue } }) => {
                const pValue = newValue;
                const foldChangeValue = fcSlider.bootstrapSlider('getValue');

                this.updateCurrentLogQValue(pValue);

                const circles = svg.selectAll('circle');
                this.selectedRows = [];
                circles
                    .transition()
                    .attr('fill', (d) => {
                        const cc = this.colorx(d, pValue, foldChangeValue);
                        if (cc !== 'grey') {
                            this.selectedRows.push([
                                d.gene,
                                d.p_value_f,
                                d.q_value,
                                d.log2fc_f,
                                d.log_q_value,
                            ]);
                        }
                        return cc;
                    });

                this.dataId('gene-count-in-range').text(String(circles.size()));
                this.data('geneCountSelected').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.selectedRows.length));
            }, DEBOUNCE_INTERVAL);

            const loqQValueSlider = this.dataId('log_q_value')
                .bootstrapSlider({
                    tooltip_position: 'bottom',
                    step: 0.01,
                    precision: 2,
                    min: ymin,
                    max: ymax,
                })
                .on('change', logQValueSliderChange);

            fcSlider.bootstrapSlider('setValue', DEFAULT_FOLD_CHANGE_VALUE);
            loqQValueSlider.bootstrapSlider('setValue', DEFAULT_LOG_Q_VALUE);

            this.updateCurrentFoldChangeValue(fcSlider.bootstrapSlider('getValue'));
            this.updateCurrentLogQValue(loqQValueSlider.bootstrapSlider('getValue'));

            const pv = this.dataId('log_q_value').bootstrapSlider('getValue');
            const fc = this.dataId('fc').bootstrapSlider('getValue');

            const xScale = d3.scale
                .linear()
                .domain([xmin, xmax])
                .range([padding, this.svgWidth - padding]);

            const yScale = d3.scale
                .linear()
                .domain([ymin, ymax])
                .range([this.svgHeight - padding, 10]);

            svg.selectAll('circle').data(filteredData).enter().append('svg:circle');
            svg.selectAll('circle')
                .data(filteredData)
                .attr('cx', (d) => {
                    return xScale(d.log2fc_f);
                })
                .attr('cy', (d) => {
                    return yScale(d.log_q_value);
                })
                .attr('r', 3)
                .attr('fill', (d) => {
                    const cc = this.colorx(d, pv, fc);
                    if (cc !== 'grey') {
                        this.selectedRows.push([
                            d.gene,
                            d.p_value_f,
                            d.q_value,
                            d.log2fc_f,
                            d.log_q_value,
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

            this.dataId('geneCountInRange').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(filteredData.length));
            this.data('geneCountSelected').text(Intl.NumberFormat('en-US', { useGrouping: true }).format(this.selectedRows.length));

            allCircles.data(filteredData).exit().remove();
            const xAxis = d3.svg.axis().scale(xScale).orient('bottom').ticks(10); //Set rough # of ticks
            const yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(10);
            svg.selectAll('.xaxis').call(xAxis);
            svg.selectAll('.yaxis').call(yAxis);
        },
    });
});
