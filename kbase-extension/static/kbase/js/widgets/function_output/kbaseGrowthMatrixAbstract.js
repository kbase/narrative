define([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseMatrix2DAbstract',
    'kbaseTabs',
    'jquery-dataTables',
], (KBWidget, bootstrap, $, kbaseMatrix2DAbstract, kbaseTabs, jquery_dataTables) => {
    return KBWidget({
        name: 'kbaseGrowthMatrixAbstract',
        parent: kbaseMatrix2DAbstract,
        version: '1.0.0',

        TYPE_SAMPLES: 'Samples',
        TYPE_SERIES: 'Series',

        getTimePoints: function (matrix) {
            return this.getNumericPropertyCourse(
                matrix.data.row_ids,
                matrix.metadata.row_metadata,
                'TimeSeries',
                'Time'
            );
        },

        groupAndFillGrowthParams: function (matrix, seriesList, timePoints) {
            const values = matrix.data.values;

            for (const si in seriesList) {
                const series = seriesList[si];
                const samples = series.samples;

                let maxRate = null;
                let maxRateTime = null;
                let maxOD = null;
                let maxODTime = null;

                let odPrev = null;
                let timePrev = null;
                for (const i in timePoints) {
                    const timePoint = timePoints[i];
                    const rIndex = timePoint.index;

                    const time = timePoint.value;

                    // calculate average od
                    let od = 0;
                    for (const j in samples) {
                        const cIndex = samples[j].columnIndex;
                        od += values[rIndex][cIndex];
                    }
                    od /= samples.length;

                    if (i > 0) {
                        let rate = 0;
                        if (od > 0 && odPrev > 0) {
                            rate = Math.log(od / odPrev) / (time - timePrev);
                        }
                        if (maxRate == null || rate > maxRate) {
                            maxRate = rate;
                            maxRateTime = time;
                        }
                    }

                    if (maxOD == null || od > maxOD) {
                        maxOD = od;
                        maxODTime = time;
                    }

                    timePrev = time;
                    odPrev = od;
                }

                series['maxRate'] = maxRate != null ? maxRate.toFixed(3) : 'ND';
                series['maxRateTime'] = maxRateTime != null ? maxRateTime.toFixed(1) : 'ND';
                series['maxOD'] = maxOD != null ? maxOD.toFixed(3) : 'ND';
                series['maxODTime'] = maxODTime != null ? maxODTime.toFixed(1) : 'ND';
            }
        },

        fillGrowthParams: function (matrix, sample, timePoints) {
            // Calculate growth curve parameters
            let maxRate = null;
            let maxRateTime = null;
            let maxOD = null;
            let maxODTime = null;

            const cIndex = sample.columnIndex;
            const values = matrix.data.values;

            let odPrev = null;
            let timePrev = null;
            for (const i in timePoints) {
                const timePoint = timePoints[i];
                const rIndex = timePoint.index;

                const time = timePoint.value;
                const od = values[rIndex][cIndex];

                if (i > 0) {
                    let rate = 0;
                    if (od > 0 && odPrev > 0) {
                        rate = (Math.log(od) - Math.log(odPrev)) / (time - timePrev);
                    }
                    if (maxRate == null || rate > maxRate) {
                        maxRate = rate;
                        maxRateTime = time;
                    }
                }

                if (maxOD == null || od > maxOD) {
                    maxOD = od;
                    maxODTime = time;
                }

                timePrev = time;
                odPrev = od;
            }

            // Populate conditions with growth params
            sample['maxRate'] = maxRate != null ? maxRate.toFixed(3) : 'ND';
            sample['maxRateTime'] = maxRateTime != null ? maxRateTime.toFixed(1) : 'ND';
            sample['maxOD'] = maxOD != null ? maxOD.toFixed(3) : 'ND';
            sample['maxODTime'] = maxODTime != null ? maxODTime.toFixed(1) : 'ND';
        },

        buildSamples: function (matrix, columnIds, timePoints) {
            const samples = [];

            const columnsMetadata = matrix.metadata.column_metadata;
            const columnIds2ColumnIndex = this.buildColumnIds2ColumnIndex(matrix);

            for (const i in columnIds) {
                const columnId = columnIds[i];
                const columnMetadata = columnsMetadata[columnId];
                const columnIndex = columnIds2ColumnIndex[columnId];
                const seriesId = this.getPropertyValue(columnMetadata, 'DataSeries', 'SeriesID');

                const sampleProperties = this.getProperties(columnMetadata, 'Condition');
                sampleProperties.sort((a, b) => {
                    return a.property_name > b.property_name
                        ? 1
                        : a.property_name < b.property_name
                        ? -1
                        : 0;
                });
                const sampleLabel = this.propertiesToString(sampleProperties);

                const sample = {
                    columnIndex: columnIndex,
                    columnId: columnId,
                    seriesId: seriesId,
                    label: sampleLabel,
                    properties: sampleProperties,

                    maxOD: null,
                    maxODTime: null,
                    maxRate: null,
                    maxRateTime: null,
                };

                this.fillGrowthParams(matrix, sample, timePoints);
                samples.push(sample);
            }

            return samples;
        },

        groupSamplesIntoSeries: function (matrix, samples, timePoints) {
            const seriesHash = {};
            for (const i in samples) {
                const sample = samples[i];
                var seriesId = sample.seriesId;
                var series = seriesHash[seriesId];
                if (series == null) {
                    series = {
                        seriesId: seriesId,
                        samples: [],
                        label: sample.label,

                        maxOD: null,
                        maxODTime: null,
                        maxRate: null,
                        maxRateTime: null,
                        samplesCount: 0,
                    };
                    seriesHash[seriesId] = series;
                }
                series.samples.push(sample);
            }

            // Convert hash into list and fill out the number of samples (to be used in the jtables)
            const seriesList = [];
            for (var seriesId in seriesHash) {
                var series = seriesHash[seriesId];
                series.samplesCount = series.samples.length;
                seriesList.push(series);
            }

            // Calulate average values across samples for each series and then
            // estimate maxOD and maxRate
            this.groupAndFillGrowthParams(matrix, seriesList, timePoints);

            return seriesList;
        },

        getSamplesSummary: function (samples) {
            const summary = {};

            // For each proprty we will collect all values, and also the property unit
            for (var i in samples) {
                const props = samples[i].properties;

                for (const j in props) {
                    const pv = props[j];
                    var propSummary = summary[pv.property_name];
                    if (propSummary == null) {
                        propSummary = {
                            propertyUnit: pv.property_unit,
                            valueSet: {},
                        };
                        summary[pv.property_name] = propSummary;
                    }
                    propSummary.valueSet[pv.property_value] = true;
                }
            }

            // Sort all values either alphabetically or numrecially,
            // and build a string representations

            const propNames = [];
            for (var propName in summary) {
                propNames.push(propName);
                var propSummary = summary[propName];
                const values = [];
                for (const val in propSummary.valueSet) {
                    values.push(val);
                }

                // Ugly...  if propertyUnit is defined => consider values as numeric
                if (propSummary.propertyUnit) {
                    values.sort((a, b) => {
                        return a - b;
                    });
                } else {
                    values.sort();
                }

                propSummary['values'] = values;
                propSummary['valuesString'] = values.join(', ');
            }

            // Sort property names and build a list of summary properties
            propNames.sort();

            const summaryList = [];
            for (var i in propNames) {
                var propName = propNames[i];
                var propSummary = summary[propName];
                summaryList.push({
                    propName: propName,
                    propertyUnit: propSummary.propertyUnit,
                    valuesString: propSummary.valuesString,
                });
            }

            return {
                samplesCount: samples.length,
                properties: summaryList,
            };
        },

        buildSamplesTable: function ($tab, samples) {
            this.buildTable(
                $tab,
                samples,
                [
                    { sTitle: 'Sample ID', mData: 'columnId' },
                    { sTitle: 'Series ID', mData: 'seriesId' },
                    { sTitle: 'Conditions', mData: 'label' },
                    { sTitle: 'Max rate', mData: 'maxRate' },
                    { sTitle: 'Max rate time', mData: 'maxRateTime' },
                    { sTitle: 'Max OD', mData: 'maxOD' },
                    { sTitle: 'Max OD time', mData: 'maxODTime' },
                ],
                'No conditions found!'
            );
        },

        buildSeriesTable: function ($tab, series) {
            this.buildTable(
                $tab,
                series,
                [
                    { sTitle: 'Series ID', mData: 'seriesId' },
                    { sTitle: 'Conditions', mData: 'label' },
                    { sTitle: 'Number of samples', mData: 'samplesCount' },
                    { sTitle: 'Max rate', mData: 'maxRate' },
                    { sTitle: 'Max rate time', mData: 'maxRateTime' },
                    { sTitle: 'Max OD', mData: 'maxOD' },
                    { sTitle: 'Max OD time', mData: 'maxODTime' },
                ],
                'No series found!'
            );
        },
    });
});
