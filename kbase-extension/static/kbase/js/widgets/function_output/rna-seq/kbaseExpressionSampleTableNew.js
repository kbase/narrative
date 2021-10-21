define([
    'kbwidget',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseHistogram',
    'kb_common/jsonRpc/genericClient',
    'narrativeConfig',
    'base/js/namespace',
    'widgets/common/jQueryUtils',

    // For effect
    'bootstrap',
    'jquery-dataTables'
], (
    KBWidget,
    $,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    kbaseHistogram,
    ServiceClient,
    Config,
    Jupyter,
    jQueryUtils
) => {
    'use strict';

    const { $el } = jQueryUtils;

    return KBWidget({
        name: 'kbaseExpressionSampleTableNew',
        parent: kbaseAuthenticatedWidget,

        version: '1.0.0',
        options: {
            numBins: 50,
            minCutoff: 0.001,
        },

        _accessors: [
            { name: 'dataset', setter: 'setDataset' },
        ],

        getState: function () {
            return this.data('histogram').getState();
        },

        loadState: function (state) {
            this.data('histogram').loadState(state);
            this.data('histogram').renderHistogram();
        },

        setDataset: function setDataset(newDataset) {
            const rows = [];
            const barData = [];

            let min = Number.MAX_VALUE;
            let max = Number.MIN_VALUE;

            let exprKeys = [];
            if (newDataset.expression_levels != undefined) {
                exprKeys = Object.keys(newDataset.expression_levels).sort();

                $.each(exprKeys, (i, k) => {
                    const val = Math.round(newDataset.expression_levels[k] * 1000) / 1000;

                    const row = [k, val];
                    if (newDataset.tpm_expression_levels != undefined) {
                        const tpm =
                            Math.round(newDataset.tpm_expression_levels[k] * 1000) / 1000 || 0;
                        row.push(tpm);
                    }

                    rows.push(row);

                    if (val < min) {
                        min = val;
                    }
                    if (val > max) {
                        max = val;
                    }
                    barData.push(val);
                });

                if (newDataset.tpm_expression_levels != undefined) {
                    if (!this.hasTPMTab) {
                        this.data('container').addTab({
                            tab: 'TPM Histogram',
                            content: this.data('tpmHistElem'),
                        });
                        this.hasTPMTab = true;
                    }
                    let tpm_min = Number.MAX_VALUE;
                    let tpm_max = Number.MIN_VALUE;
                    const tpmBarData = [];

                    exprKeys = Object.keys(newDataset.tpm_expression_levels).sort();

                    $.each(exprKeys, (i, k) => {
                        const val = Math.round(newDataset.tpm_expression_levels[k] * 1000) / 1000;

                        if (val < tpm_min) {
                            tpm_min = val;
                        }
                        if (val > tpm_max) {
                            tpm_max = val;
                        }
                        tpmBarData.push(val);
                    });
                    this.data('tpmHistogram').setDataset(tpmBarData);
                }

                this.data('histogram').setDataset(barData);

                let $dt = this.data('$dt');
                if ($dt == undefined) {

                    const columns = (() => {
                        if (typeof newDataset.tpm_expression_levels !== 'undefined') {
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

                    $dt = this.data('tableElem').DataTable({
                        autoWidth: false,
                        columns,
                    });

                    this.data('$dt', $dt);
                } else {
                    $dt.clear();
                }

                $dt.rows.add(rows).draw();
                this.data('loader').hide();
                this.data('containerElem').show();
            } else {
                this.loadExpression(newDataset.sample_expression_ids[0]);
                this.data('loader').hide();
                this.$elem.append(
                    $el('div')
                        .addClass('alert alert-danger')
                        .text('No expression levels available')
                );
            }
        },

        loadExpression: function (ref) {
            this.data('containerElem').hide();
            this.data('loader').show();

            const ws = new ServiceClient({
                url: Config.url('workspace'),
                module: 'Workspace',
                token: Jupyter.narrative.getAuthToken()
            });

            return ws.callFunc('get_objects2', [{
                objects: [{
                    ref: ref,
                }]
            }])
                .then(([result]) => {
                    this.setDataset(result.data[0].data);
                });
        },

        init: function init(options) {
            this._super(options);

            const ws = new ServiceClient({
                url: Config.url('workspace'),
                module: 'Workspace',
                token: Jupyter.narrative.getAuthToken()
            });

            ws.callFunc('get_objects2', [{
                objects: [{
                    ref: this.options.upas.output
                }]
            }])
                .then(([result]) => {
                    const dataObject = result.data[0].data;

                    if (dataObject.sample_expression_ids) {
                        this.options.output = dataObject;

                        if (this.options.output.sample_expression_ids.length === 0) {
                            // This should never occur, but handle it.
                            throw new Error('This set has no elements');
                        }

                        const objects = this.options.output.sample_expression_ids.map((ref) => {
                            return { ref };
                        });

                        return ws.callFunc('get_object_info3', [{ objects }])
                            .then((result) => {
                                this.options.output.sample_expression_names = [];
                                for (const objectInfo of result.infos) {
                                    this.options.output.sample_expression_names.push(objectInfo[1]);
                                }

                                // Preload the first one. 
                                return this.loadExpression(
                                    this.options.output.sample_expression_ids[0]
                                );
                            });
                    } else if (dataObject.items) {
                        this.options.output = dataObject;
                        dataObject.sample_expression_ids = [];

                        if (this.options.output.items.length === 0) {
                            throw new Error('This set has no elements');
                        }

                        const objects = this.options.output.items.map(({ ref }) => {
                            return { ref };
                        });

                        dataObject.sample_expression_ids = objects.map(({ ref }) => {
                            return ref;
                        });

                        return ws.callFunc('get_object_info3', [{ objects }])
                            .then(([result]) => {
                                this.options.output.sample_expression_names = result.infos.map((objectInfo) => {
                                    return objectInfo[1];
                                });

                                this.appendUI(this.$elem);

                                if (this.options.output.sample_expression_ids.length) {
                                    return this.loadExpression(
                                        this.options.output.sample_expression_ids[0]
                                    );
                                }
                            });
                    } else {
                        // TODO: what case does this handle???
                        this.appendUI(this.$elem);
                        this.setDataset(result.data[0].data);
                    }
                })
                .catch((err) => {
                    this.$elem.empty();
                    const message = (() => {
                        if (err instanceof Error) {
                            return err.message;
                        } else if (err.error && err.error.message) {
                            return err.error.message;
                        } else {
                            return 'Unknown error';
                        }
                    })();
                    this.$elem
                        .addClass('alert alert-danger')
                        .text(`Could not load object ${message}`);
                });

            return this;
        },

        appendUI: function appendUI($elem) {
            if (this.options.output.sample_expression_ids) {
                const $selector = $el('select')
                    .addClass('form-control')
                    .css('max-width', '500px')
                    .on('change', () => {
                        this.loadExpression($selector.val());
                    });

                $.each(this.options.output.sample_expression_ids, (i, v) => {
                    $selector.append(
                        $el('option')
                            .attr('value', v)
                            .append(this.options.output.sample_expression_names[i])
                    );
                });

                this.$elem
                    .append($el('div').addClass('form form-inline').css('margin-bottom', '1em')
                        .append($el('div').addClass('form-group')
                            .append($el('label').text('Please select expression level: '))
                            .append($selector)));
            }

            const $tableElem = $el('table').addClass('table');

            const $overviewPanel = $el('div')
                .css('margin-top', '10px')
                .append($tableElem);

            const $histElem = $el('div').css({ width: 800, height: 500 }).css('margin-top', '10px');

            const $containerElem = $el('div')
                .attr('id', 'containerElem')
                .css('display', 'none');

            const tabs = new kbaseTabs($containerElem, {
                tabs: [
                    {
                        tab: 'Overview',
                        content: $overviewPanel,
                        show: true
                    },
                    {
                        tab: 'FPKM Histogram',
                        content: $histElem,
                    },
                ],
                deleteTabCallback: function (tabName) {
                    if (tabName === 'TPM Histogram') {
                        delete this.tpmTab;
                    }
                },
            });

            const $tpmHistElem = $el('div').css({ width: 800, height: 500 }).css('margin-top', '10px');

            tabs.$elem.find('[data-tab=Histogram]').on('click', () => {
                $histogram.renderXAxis();
                setTimeout(() => {
                    $histogram.renderHistogram();
                }, 300);
            });

            $elem.append($containerElem).append(
                $el('div')
                    .attr('id', 'loader')
                    .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...')
                    .append($el('br'))
                    .append(
                        $el('div')
                            .attr('align', 'center')
                            .append(
                                $el('i')
                                    .addClass('fa fa-spinner')
                                    .addClass('fa fa-spin fa fa-4x')
                            )
                    )
            );

            this._rewireIds($elem, this);

            const $histogram = new kbaseHistogram($histElem, {
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
            const $tpmHistogram = new kbaseHistogram($tpmHistElem, {
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
            this.data('tableElem', $tableElem);
            this.data('histElem', $histElem);
            this.data('tpmHistElem', $tpmHistElem);
            this.data('container', tabs);
            this.data('histogram', $histogram);
            this.data('tpmHistogram', $tpmHistogram);
        },
    });
});
