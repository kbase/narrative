define(['kbwidget', 'bootstrap', 'jquery', 'plotly', 'kbaseSamplePropertyMatrixAbstract'], (
    KBWidget,
    bootstrap,
    $,
    Plotly,
    kbaseSamplePropertyMatrixAbstract
) => {
    'use strict';
    return KBWidget({
        name: 'kbaseSamplePropertyHistogram',
        parent: kbaseSamplePropertyMatrixAbstract,
        version: '1.0.0',
        options: {
            sampleIds: [],
            logScale: 1,
            showErrorBar: 0,
        },

        render: function () {
            this.loading(false);
            const $vizContainer = $('<div/>');
            this.$elem.append($vizContainer);
            this.buildWidget($vizContainer);
        },

        buildWidget: function ($containerDiv) {
            const matrix = this.matrix;
            const data = matrix.data;
            const rowsMetadata = matrix.metadata.row_metadata;
            const columnsMetadata = matrix.metadata.column_metadata;
            const sampleIds = this.options.sampleIds;

            const samples = this.buildConstrainedSamples(data.row_ids, rowsMetadata, sampleIds);
            const sampleProperties = this.buildSampleProperties(data.col_ids, columnsMetadata);

            const traces = [];
            for (const i in samples) {
                const sample = samples[i];
                const rIndex = sample.rIndex;
                const x = [];
                const y = [];
                const yErrors = [];
                for (const j in sampleProperties) {
                    const sampleProperty = sampleProperties[j];
                    const columns = sampleProperty.columns;

                    const n = columns.length;
                    let s1 = 0;
                    let s2 = 0;
                    for (const k in columns) {
                        const cIndex = columns[k].index;
                        s1 += data.values[rIndex][cIndex];
                        s2 += data.values[rIndex][cIndex] * data.values[rIndex][cIndex];
                    }
                    const avg = s1 / n;
                    const se = n > 1 ? Math.sqrt((s2 * n - s1 * s1) / (n - 1) / n / n) : 0;
                    x.push(sampleProperty.name);
                    y.push(avg);
                    yErrors.push(se);
                }

                const trace = {
                    x: x,
                    y: y,
                    name: sample.name,
                    type: 'bar',
                };

                if (this.options.showErrorBar == 1) {
                    trace['error_y'] = {
                        type: 'data',
                        array: yErrors,
                        visible: true,
                    };
                }
                traces.push(trace);
            }
            const layout = {
                barmode: 'group',
                title: matrix.description,
                yaxis: {
                    autorange: true,
                },
            };

            if (this.options.logScale == 1) {
                layout.yaxis.type = 'log';
            }
            Plotly.newPlot($containerDiv[0], traces, layout, { showLink: false });
        },
    });
});
