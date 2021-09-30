define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'kbaseHistogram',
    'kbase-client-api',
    'kbaseTable',
    'jquery-dataTables',
], (
    KBWidget,
    bootstrap,
    $,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    kbaseHistogram,
    kbase_client_api,
    kbaseTable,
    jquery_dataTables
) => {
    'use strict';

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
            //{name: 'barchartDataset', setter: 'setBarchartDataset'},
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

                    /*var bin = Math.floor(newDataset.expression_levels[k]);

                      if (barData[bin] == undefined) {
                          barData[bin] = 0;
                      }
                      barData[bin]++;*/
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

                        //rows.push( [k, val] );

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

                //this.setBarchartDataset(barData);
                this.data('histogram').setDataset(barData);
                //this.renderHistogram(this.options.numBins);

                let $dt = this.data('$dt');
                if ($dt == undefined) {
                    const columns = [
                        { title: 'Feature ID' },
                        { title: 'Feature Value : log2(FPKM + 1)' },
                    ];
                    if (newDataset.tpm_expression_levels != undefined) {
                        this.data('tableElem').find('th').css('display', '');
                        columns.push({ title: 'Feature Value : log2(TPM + 1)' });
                    }

                    $dt = this.data('tableElem').DataTable({
                        columns: columns,
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
                    $.jqElem('div')
                        .addClass('alert alert-danger')
                        .html('No expression levels available')
                );
            }
        },

        loadExpression: function (ref) {
            const $sam = this;
            this.data('containerElem').hide();
            this.data('loader').show();
            const ws = new Workspace(window.kbconfig.urls.workspace, { token: $sam.authToken() });

            const ws_params = {
                ref: ref,
            };

            ws.get_objects([ws_params])
                .then((d) => {
                    $sam.setDataset(d[0].data);
                })
                .fail((d) => {
                    $sam.$elem.empty();
                    $sam.$elem
                        .addClass('alert alert-danger')
                        .html('Could not load object : ' + d.error.message);
                });
        },

        init: function init(options) {
            this._super(options);

            this._super(options);

            const $self = this;

            const ws = new Workspace(window.kbconfig.urls.workspace, { token: $self.authToken() });
            //var ws = new Workspace('https://ci.kbase.us/services/ws', {token : $self.authToken()});

            const ws_params = {
                workspace: this.options.workspace,
                wsid: this.options.wsid,
                name: this.options.output,
            };

            ws.get_objects([ws_params])
                .then((d) => {
                    const thing = d[0].data;
                    if (thing.sample_expression_ids) {
                        $self.options.output = thing;

                        var promises = [];
                        $.each($self.options.output.sample_expression_ids, (i, v) => {
                            promises.push(ws.get_object_info([{ ref: v }]));
                        });

                        $.when
                            .apply($, promises)
                            .then(function () {
                                const args = arguments;
                                $self.options.output.sample_expression_names = [];
                                $.each(arguments, (i, v) => {
                                    $self.options.output.sample_expression_names.push(v[0][1]);
                                });

                                $self.appendUI($self.$elem);

                                if ($self.options.output.sample_expression_ids.length) {
                                    $self.loadExpression(
                                        $self.options.output.sample_expression_ids[0]
                                    );
                                }
                            })
                            .fail((d) => {
                                $self.$elem.empty();
                                $self.$elem
                                    .addClass('alert alert-danger')
                                    .html('Could not load object : ' + d.error.message);
                            });
                    } else if (thing.items) {
                        $self.options.output = thing;
                        thing.sample_expression_ids = [];

                        var promises = [];
                        $.each($self.options.output.items, (i, v) => {
                            thing.sample_expression_ids.push(v.ref);
                            promises.push(ws.get_object_info([{ ref: v.ref }]));
                        });

                        $.when
                            .apply($, promises)
                            .then(function () {
                                const args = arguments;
                                $self.options.output.sample_expression_names = [];
                                $.each(arguments, (i, v) => {
                                    $self.options.output.sample_expression_names.push(v[0][1]);
                                });

                                $self.appendUI($self.$elem);

                                if ($self.options.output.sample_expression_ids.length) {
                                    $self.loadExpression(
                                        $self.options.output.sample_expression_ids[0]
                                    );
                                }
                            })
                            .fail((d) => {
                                $self.$elem.empty();
                                $self.$elem
                                    .addClass('alert alert-danger')
                                    .html('Could not load object : ' + d.error.message);
                            });
                    } else {
                        $self.appendUI($self.$elem);
                        $self.setDataset(d[0].data);
                    }
                })
                .fail((d) => {
                    $self.$elem.empty();
                    $self.$elem
                        .addClass('alert alert-danger')
                        .html('Could not load object : ' + d.error.message);
                });

            return this;
        },

        appendUI: function appendUI($elem) {
            const $me = this;

            if (this.options.output.sample_expression_ids) {
                var $selector = $.jqElem('select')
                    .css('width', '500px')
                    .on('change', (e) => {
                        $me.loadExpression($selector.val());
                    });

                $.each(this.options.output.sample_expression_ids, (i, v) => {
                    $selector.append(
                        $.jqElem('option')
                            .attr('value', v)
                            .append($me.options.output.sample_expression_names[i])
                    );
                });

                this.$elem
                    .append('<br>Please select expression level: ')
                    .append($selector)
                    .append('<br><br>');
            }

            const $tableElem = $.jqElem('table')
                .css('width', '95%')
                .append(
                    $.jqElem('thead').append(
                        $.jqElem('tr')
                            .append($.jqElem('th').append('Feature ID'))
                            .append($.jqElem('th').append('Feature Value : log2(FPKM + 1)'))
                            .append(
                                $.jqElem('th')
                                    .css('display', 'none')
                                    .append('Feature Value : log2(TPM + 1)')
                            )
                    )
                );
            const $histElem = $.jqElem('div').css({ width: 800, height: 500 });

            const $containerElem = $.jqElem('div')
                .attr('id', 'containerElem')
                .css('display', 'none');

            const $container = new kbaseTabs($containerElem, {
                tabs: [
                    {
                        tab: 'Overview',
                        content: $tableElem,
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

            const $tpmHistElem = $.jqElem('div').css({ width: 800, height: 500 });

            $container.$elem.find('[data-tab=Histogram]').on('click', (e) => {
                $histogram.renderXAxis();
                setTimeout(() => {
                    $histogram.renderHistogram();
                }, 300);
            });

            $elem.append($containerElem).append(
                $.jqElem('div')
                    .attr('id', 'loader')
                    .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...')
                    .append($.jqElem('br'))
                    .append(
                        $.jqElem('div')
                            .attr('align', 'center')
                            .append(
                                $.jqElem('i')
                                    .addClass('fa fa-spinner')
                                    .addClass('fa fa-spin fa fa-4x')
                            )
                    )
            );

            this._rewireIds($elem, this);

            var $histogram = new kbaseHistogram($histElem, {
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
            this.data('container', $container);
            this.data('histogram', $histogram);
            this.data('tpmHistogram', $tpmHistogram);
        },
    });
});
