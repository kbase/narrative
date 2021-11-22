define([
    'kbwidget',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseHistogram',
    'kb_common/jsonRpc/genericClient',
    'narrativeConfig',
    'base/js/namespace',
    'widgets/common/jQueryUtils',
    'widgets/common/ErrorMessage',
    'widgets/common/LoadingMessage',

    // For effect
    'bootstrap',
    'jquery-dataTables',
    'css!./kbaseExpressionSample.css'
], (
    KBWidget,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    kbaseHistogram,
    ServiceClient,
    Config,
    Jupyter,
    jQueryUtils,
    $ErrorMessage,
    $LoadingMessage
) => {
    'use strict';

    const { $el } = jQueryUtils;

    const decimalPlaces = (value, places) => {
        const multiplier = Math.pow(10, places);
        return Math.round(value * multiplier) / multiplier;
    };

    return KBWidget({
        name: 'kbaseExpressionSample',
        parent: kbaseAuthenticatedWidget,

        version: '1.0.0',
        options: {
            numBins: 50,
            minCutoff: 0.001,
        },

        init: function (options) {
            this._super(options);

            const { ref } = options;
            this.ref = ref;

            this.workspaceClient = new ServiceClient({
                url: Config.url('workspace'),
                module: 'Workspace',
                token: Jupyter.narrative.getAuthToken()
            });

            this.render();

            return this;
        },

        render: async function () {
            try {
                this.$elem.addClass('KBaseExpressionSample');
                this.$elem.html($LoadingMessage('Loading Expression Sample...'));

                // NB init does not work as async function.
                const data = await this.fetchInitialData(this.ref);
                const dataset = this.makeDataset(data);
                const $tabset = this.$renderTabset(dataset);
                this.$elem.html($tabset);
            } catch (ex) {
                this.$elem.html($ErrorMessage(ex));
            }
        },

        $el: function (idValue) {
            return this.$elem.find(`[data-id="${idValue}"]`);
        },

        fetchInitialData: async function (ref) {
            const [result] = await this.workspaceClient.callFunc('get_objects2', [{
                objects: [{
                    ref
                }]
            }]);

            return result.data[0].data;
        },

        makeDataset: function (expressionSample) {
            const dataset = {
                expressionSample
            };

            const hasTPMExpressionLevels = 'tpm_expression_levels' in expressionSample;
            const rows = [];

            // Calculate bar data
            const barData = [];
            for (const key of Object.keys(expressionSample.expression_levels).sort()) {
                const value = decimalPlaces(expressionSample.expression_levels[key], 3);
                const row = [key, value];
                if (hasTPMExpressionLevels) {
                    row.push(decimalPlaces(expressionSample.tpm_expression_levels[key], 3));
                }
                rows.push(row);
                barData.push(value);
            }
            dataset.barData = barData;
            dataset.rows = rows;

            if (hasTPMExpressionLevels) {
                const tpmBarData = [];
                for (const key of Object.keys(expressionSample.tpm_expression_levels).sort()) {
                    tpmBarData.push(decimalPlaces(expressionSample.tpm_expression_levels[key], 3));
                }
                dataset.tpmBarData = tpmBarData;
            }
            return dataset;
        },

        renderHistogramPane: function () {
            const $element = $el('div').addClass('histogram-pane');
            const widget = new kbaseHistogram($element, {
                scaleAxes: true,
                xPadding: 60,
                yPadding: 120,

                xLabelRegion: 'yPadding',
                yLabelRegion: 'xPadding',

                xLabelOffset: 45,
                yLabelOffset: -10,

                yLabel: 'Number of Genes',
                xLabel: 'Gene Expression Level log2(FPKM + 1)',
                xAxisVerticalLabels: true,
                useUniqueID: true,
            });
            return { $element, widget };
        },

        renderTpmHistogramPane: function () {
            const $element = $el('div').addClass('histogram-pane');
            const widget = new kbaseHistogram($element, {
                scaleAxes: true,
                xPadding: 60,
                yPadding: 120,

                xLabelRegion: 'yPadding',
                yLabelRegion: 'xPadding',

                xLabelOffset: 45,
                yLabelOffset: -10,

                yLabel: 'Number of Genes',
                xLabel: 'Gene Expression Level TPM',
                xAxisVerticalLabels: true,
                useUniqueID: true,
            });
            return { $element, widget };
        },

        $renderTabset: function (dataset) {
            const $tabsetElem = $el('div')
                .attr('id', 'tabset');

            const tabs = [
                {
                    tab: 'Overview',
                    content: $el('div').append(this.$renderFeatureTable(dataset)),
                    show: true
                },
                {
                    tab: 'FPKM Histogram',
                    showContentCallback: ($elem) => {
                        const { $element, widget } = this.renderHistogramPane();
                        widget.setDataset(dataset.barData);
                        widget.renderXAxis();
                        setTimeout(() => {
                            widget.renderHistogram();
                        }, 300);
                        $elem.html($element);
                    }
                },
            ];

            if ('tpm_expression_levels' in dataset.expressionSample) {
                tabs.push({
                    tab: 'TPM Histogram',
                    showContentCallback: ($elem) => {
                        const { $element, widget } = this.renderTpmHistogramPane();
                        widget.setDataset(dataset.tpmBarData);
                        widget.renderXAxis();
                        setTimeout(() => {
                            widget.renderHistogram();
                        }, 300);
                        $elem.html($element);
                    }
                });
            }

            new kbaseTabs($tabsetElem, {
                tabs
            });

            return $tabsetElem;
        },

        $renderFeatureTable: function (dataset) {
            // NB data table must be rendered directly with a div parent.
            const $featureTable = $el('div');
            const $table = $el('table').addClass('table table-striped table-bordered');
            $featureTable.html($table);

            const columns = (() => {
                if ('tpm_expression_levels' in dataset.expressionSample) {
                    return [
                        { title: 'Feature ID', width: '33.33%' },
                        { title: 'Feature Value : log2(FPKM + 1)', width: '33.33%' },
                        { title: 'Feature Value : log2(TPM + 1)', width: '33.33%' }
                    ];
                } else {
                    return [
                        { title: 'Feature ID', width: '50%' },
                        { title: 'Feature Value : log2(FPKM + 1)', width: '50%' },
                    ];
                }
            })();
            $table.DataTable({
                autoWidth: false,
                columns,
            }).rows.add(dataset.rows).draw();
            return $featureTable;
        },
    });
});
