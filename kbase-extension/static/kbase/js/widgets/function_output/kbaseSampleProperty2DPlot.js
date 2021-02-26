define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'plotly',
    'kbaseSamplePropertyMatrix',
    'kbaseTabs',
    'jquery-dataTables',
], (KBWidget, bootstrap, $, Plotly, kbaseSamplePropertyMatrix, kbaseTabs, jquery_dataTables) => {
    return KBWidget({
        name: 'kbaseSampleProperty2DPlot',
        parent: kbaseSamplePropertyMatrix,
        version: '1.0.0',
        options: {
            propertySeriesX: null,
            propertySeriesY: null,
        },

        render: function () {
            const matrix = this.matrix;
            const data = matrix.data;
            const rowsMetadata = matrix.metadata.row_metadata;
            const columnsMetadata = matrix.metadata.column_metadata;
            const sampleIds = this.options.sampleIds;

            const samples = this.buildSamples(data.row_ids, rowsMetadata);
            const sampleProperties = this.buildConstrainedSampleProperties(
                data.col_ids,
                columnsMetadata,
                [this.options.propertySeriesX, this.options.propertySeriesY]
            );

            this.loading(false);
            const $vizContainer = $('<div/>');
            this.$elem.append($vizContainer);
            this.buildWidget($vizContainer, sampleProperties[0], sampleProperties[1]);
        },

        // To be overriden
        buildWidget: function ($containerDiv, samplePropertyX, samplePropertyY) {
            const data = this.matrix.data;
            const rowsMetadata = this.matrix.metadata.row_metadata;

            const x = [];
            const y = [];
            const propNames = [];

            for (const rIndex in data.row_ids) {
                const rowId = data.row_ids[rIndex];
                let propName = '';
                const rowMetadata = rowsMetadata[rowId];
                for (const i in rowMetadata) {
                    const pv = rowMetadata[i];
                    if (pv.category == 'Sample' && pv.property_name == 'Name') {
                        propName = pv.property_value;
                    }
                }

                // calcualte x value
                const xValue = this.getAvgValue(data.values, rIndex, samplePropertyX);
                const yValue = this.getAvgValue(data.values, rIndex, samplePropertyY);

                x.push(xValue);
                y.push(yValue);
                propNames.push(propName);
            }

            const traces = [
                {
                    x: x,
                    y: y,
                    mode: 'markers+text',
                    type: 'scatter',
                    name: '',
                    text: propNames,
                    textfont: {
                        family: 'Times New Roman',
                    },
                    textposition: 'bottom center',
                    marker: { size: 12 },
                },
            ];

            const layout = {
                title: this.matrix.description,

                xaxis: {
                    type: 'log',
                    autorange: true,
                    title: samplePropertyX.name + ' (' + samplePropertyX.unit + ')',
                },
                yaxis: {
                    type: 'log',
                    autorange: true,
                    title: samplePropertyY.name + ' (' + samplePropertyY.unit + ')',
                },
                legend: {
                    y: 0.5,
                    yref: 'paper',
                    font: {
                        family: 'Arial, sans-serif',
                        size: 20,
                        color: 'grey',
                    },
                },
            };

            Plotly.newPlot($containerDiv[0], traces, layout, { showLink: false });
        },

        getAvgValue: function (values, rIndex, sampleProperty) {
            const columns = sampleProperty.columns;
            let val = 0;
            for (const i in columns) {
                val += values[rIndex][columns[i].index];
            }
            val /= columns.length;
            return val;
        },
    });
});
