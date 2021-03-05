define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'plotly',
    'kbaseMatrix2DAbstract',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'jquery-dataTables',
], (
    KBWidget,
    bootstrap,
    $,
    Plotly,
    kbaseMatrix2DAbstract,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    jquery_dataTables
) => {
    return KBWidget({
        name: 'kbaseChromatograms',
        parent: kbaseMatrix2DAbstract,
        version: '1.0.0',

        render: function () {
            this.loading(false);

            const $vizContainer = $('<div/>');
            this.$elem.append($vizContainer);
            this.buildWidget($vizContainer);
        },

        // To be overriden
        buildWidget: function ($containerDiv) {
            const self = this;
            const data = [];
            let timeUnit = '';
            let timeType = '';

            const rowIds = self.matrix.data.row_ids;
            const rowsMetadata = self.matrix.metadata.row_metadata;
            const columnIds = self.matrix.data.col_ids;
            const coulmnsMetadata = self.matrix.metadata.column_metadata;
            const values = self.matrix.data.values;

            for (const cIndex in columnIds) {
                const cId = columnIds[cIndex];
                const columnMetadata = coulmnsMetadata[cId];

                // Build xValues. It should be time series and the values should be in row metadata
                const xValues = [];
                for (var rIndex in rowIds) {
                    const rId = rowIds[rIndex];
                    const rowMetadata = rowsMetadata[rId];
                    for (var i in rowMetadata) {
                        var pv = rowMetadata[i];
                        if (pv.category == 'TimeSeries') {
                            xValues.push(pv.property_value);
                            timeType = pv.property_name;
                            timeUnit = pv.property_unit;
                        }
                    }
                }

                // Build yValues
                const yValues = [];
                for (var rIndex in rowIds) {
                    yValues.push(values[rIndex][cIndex]);
                }

                let label = '';
                for (var i in columnMetadata) {
                    var pv = columnMetadata[i];
                    if (pv.category == 'Measurement' && pv.property_name == 'Substance') {
                        label = pv.property_value;
                        break;
                    }
                }

                // Build track
                const dataTrack = {
                    x: xValues,
                    y: yValues,
                    name: label,
                };
                data.push(dataTrack);
            }

            const layout = {
                autosize: true,
                margin: {
                    l: 50,
                    r: 50,
                    b: 100,
                    t: 100,
                    pad: 4,
                },
                title: self.matrix.description,
                titlefont: {
                    color: 'rgb(33, 33, 33)',
                    family: '',
                    size: 0,
                },
                xaxis: {
                    title: timeType + ', ' + timeUnit,
                    titlefont: {
                        color: '',
                        family: '',
                        size: 0,
                    },
                },
                yaxis: {
                    title: '',
                    autorange: true,
                },
            };
            Plotly.plot($containerDiv[0], data, layout, { showLink: false });
        },
    });
});
