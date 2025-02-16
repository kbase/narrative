define(['kbwidget', 'kbaseMatrix2DAbstract'], (KBWidget, kbaseMatrix2DAbstract) => {
    'use strict';
    return KBWidget({
        name: 'kbaseSamplePropertyMatrixAbstract',
        parent: kbaseMatrix2DAbstract,
        version: '1.0.0',

        TERM_SAMPLE: 'Sample',
        TERM_PROPERTY: 'Property',
        TERM_DATASERIES: 'DataSeries',

        TERM_MEASUREMENT: 'Measurement',
        TERM_NAME: 'Name',
        TERM_SERIES_ID: 'SeriesID',

        buildConstrainedSampleProperties: function (columnIds, columnMetadata, seriesIds, sorted) {
            const series2Columns = this.groupCrowsByPropertyValue(
                columnIds,
                columnMetadata,
                this.TERM_DATASERIES,
                this.TERM_SERIES_ID
            );

            const seriesColumns = [];
            for (const i in seriesIds) {
                const seriesId = seriesIds[i];
                const columns = series2Columns[seriesId];
                if (columns != null) {
                    seriesColumns.push({
                        seriesId: seriesId,
                        columns: columns,
                    });
                }
            }

            return this.buildSeriesSamplePorperties(seriesColumns, columnMetadata, sorted);
        },

        buildSampleProperties: function (columnIds, columnMetadata) {
            const series2Columns = this.groupCrowsByPropertyValue(
                columnIds,
                columnMetadata,
                this.TERM_DATASERIES,
                this.TERM_SERIES_ID
            );

            const seriesColumns = [];
            for (const seriesId in series2Columns) {
                const columns = series2Columns[seriesId];
                seriesColumns.push({
                    seriesId: seriesId,
                    columns: columns,
                });
            }

            return this.buildSeriesSamplePorperties(seriesColumns, columnMetadata, true);
        },

        buildSeriesSamplePorperties: function (seriesColumns, columnMetadata, sorted) {
            const sampleProperties = [];

            for (const i in seriesColumns) {
                const seriesId = seriesColumns[i].seriesId;
                const columns = seriesColumns[i].columns;

                // Build property name
                const samplePropertyNames = {};
                for (const i in columns) {
                    const val = this.getPropertyValue(
                        columns[i].properties,
                        this.TERM_PROPERTY,
                        this.TERM_NAME
                    );
                    if (val != null) {
                        samplePropertyNames[val] = true;
                    }
                }
                let samplePropertyName = '';
                for (const val in samplePropertyNames) {
                    if (samplePropertyName != '') {
                        samplePropertyName += '; ';
                    }
                    samplePropertyName += val;
                }

                // Build property units
                const samplePropertyUnits = {};
                for (const i in columns) {
                    const pv = this.getProperty(
                        columns[i].properties,
                        this.TERM_PROPERTY,
                        this.TERM_MEASUREMENT
                    );
                    if (pv != null) {
                        samplePropertyUnits[pv.property_unit] = true;
                    }
                }
                let samplePropertyUnit = '';
                for (const _val in samplePropertyUnits) {
                    if (_val == '') continue;
                    if (samplePropertyUnit != '') {
                        samplePropertyUnit += '; ';
                    }
                    samplePropertyUnit += _val;
                }

                // Build sampleProperty
                sampleProperties.push({
                    seriesId: seriesId,
                    name: samplePropertyName,
                    unit: samplePropertyUnit,
                    columns: columns,
                });
            }
            if (sorted) {
                sampleProperties.sort((a, b) => {
                    return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
                });
            }

            return sampleProperties;
        },

        buildSamples: function (rowIds, rowsMetadata) {
            const samples = [];
            for (const rIndex in rowIds) {
                const rowId = rowIds[rIndex];
                const rowMetadata = rowsMetadata[rowId];
                const sampleName = this.getPropertyValue(
                    rowMetadata,
                    this.TERM_SAMPLE,
                    this.TERM_NAME
                );
                if (sampleName != null) {
                    samples.push({
                        name: sampleName,
                        rIndex: rIndex,
                        rId: rowId,
                    });
                }
            }
            return samples;
        },

        buildConstrainedSamples: function (rowIds, rowsMetadata, sampleIds) {
            const samples = [];
            for (const sIndex in sampleIds) {
                const sampleName = sampleIds[sIndex];
                for (const rIndex in rowIds) {
                    const rowId = rowIds[rIndex];
                    const rowMetadata = rowsMetadata[rowId];
                    const val = this.getPropertyValue(
                        rowMetadata,
                        this.TERM_SAMPLE,
                        this.TERM_NAME
                    );
                    if (val != null && val == sampleName) {
                        samples.push({
                            name: sampleName,
                            rIndex: rIndex,
                            rId: rowId,
                        });
                        // Not perfect; It is because we have several samples for the same well....
                        break;
                    }
                }
            }
            return samples;
        },

        buildSamplePropertyStat: function (matrix, samples, sampleProperties) {
            const samplePropertyStat = [];

            const values = matrix.data.values;
            for (const i in sampleProperties) {
                const sampleProperty = sampleProperties[i];
                const columns = sampleProperty.columns;

                const n = samples.length;
                let s1 = 0;
                let s2 = 0;
                let count = 0;
                for (const j in samples) {
                    const sample = samples[j];
                    const rIndex = sample.rIndex;

                    let value = 0;
                    for (const k in columns) {
                        const cIndex = columns[k].index;
                        value += values[rIndex][cIndex];
                    }
                    value /= columns.length;

                    s1 += value;
                    s2 += value * value;
                    count++;
                }

                const avg = s1 / n;
                const std = n > 1 ? Math.sqrt((s2 * n - s1 * s1) / (n - 1) / n) : 0;
                const se = n > 1 ? Math.sqrt((s2 * n - s1 * s1) / (n - 1) / n / n) : 0;

                samplePropertyStat.push({
                    name: sampleProperty.name,
                    unit: sampleProperty.unit,
                    label:
                        sampleProperty.name +
                        (sampleProperty.unit != null ? ' (' + sampleProperty.unit + ')' : ''),
                    avg: avg.toFixed(3),
                    std: std.toFixed(3),
                    se: se.toFixed(3),
                    count: count,
                });
            }
            return samplePropertyStat;
        },

        buildSamplesStat: function (matrix, samples, sampleProperties) {
            const samplesStat = [];

            const values = matrix.data.values;
            for (const i in samples) {
                const sample = samples[i];
                const rIndex = sample.rIndex;

                let maxValue = null;
                let maxPropertyName = null;
                let maxPrpopertyUnit = null;
                let minValue = null;
                let minPropertyName = null;
                let minPrpopertyUnit = null;

                for (const j in sampleProperties) {
                    const sampleProperty = sampleProperties[j];
                    const columns = sampleProperty.columns;
                    let value = 0;
                    for (const k in columns) {
                        const cIndex = columns[k].index;
                        value += values[rIndex][cIndex];
                    }
                    value /= columns.length;

                    if (maxValue == null || value > maxValue) {
                        maxValue = value;
                        maxPropertyName = sampleProperty.name;
                        maxPrpopertyUnit = sampleProperty.unit;
                    }

                    if (minValue == null || value < minValue) {
                        minValue = value;
                        minPropertyName = sampleProperty.name;
                        minPrpopertyUnit = sampleProperty.unit;
                    }
                }
                samplesStat.push({
                    rIndex: rIndex,
                    rId: samples[i],
                    name: samples[i].name,
                    maxPropertyValue: maxValue.toFixed(3),
                    maxPropertyLabel:
                        maxPropertyName +
                        (maxPrpopertyUnit != '' ? ' (' + maxPrpopertyUnit + ')' : ''),
                    minPropertyValue: minValue.toFixed(3),
                    minPropertyLabel:
                        minPropertyName +
                        (minPrpopertyUnit != '' ? ' (' + minPrpopertyUnit + ')' : ''),
                });
            }
            return samplesStat;
        },
    });
});
