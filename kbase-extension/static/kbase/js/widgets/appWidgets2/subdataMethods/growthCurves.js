define([], () => {
    'use strict';

    function factory() {
        function propertyValueToString(pv) {
            return (
                pv.property_name +
                ': ' +
                pv.property_value +
                (pv.property_unit ? ' ' + pv.property_unit : '')
            );
        }

        function propertiesToString(properties) {
            return properties
                .map((pv) => {
                    return propertyValueToString(pv);
                })
                .join(';');
        }

        function buildSamples(columnsMetadata) {
            return Object.keys(columnsMetadata).map((columnId) => {
                const columnMetadata = columnsMetadata[columnId],
                    conditions = [];
                let seriesId = null;

                columnMetadata.forEach((pv) => {
                    if (pv.category === 'Condition') {
                        conditions.push(pv);
                    } else if (pv.category === 'DataSeries' && pv.property_name === 'SeriesID') {
                        seriesId = pv.property_value;
                    }
                });
                conditions.sort((a, b) => {
                    return a.property_name > b.property_name
                        ? 1
                        : a.property_name < b.property_name
                        ? -1
                        : 0;
                });
                const sampleLabel = propertiesToString(conditions);

                return {
                    sampleId: columnId,
                    seriesId: seriesId,
                    label: sampleLabel,
                };
            });
        }

        function extractItems(result, params) {
            let sampleSeriesIds;
            const valueType = params.input_value_type;

            const samples = buildSamples(result[0].data.metadata.column_metadata);
            switch (valueType) {
                case 'Samples':
                    sampleSeriesIds = samples.map((sample) => {
                        return {
                            id: sample.sampleId,
                            text: sample.sampleId + ' - ' + sample.label,
                        };
                    });
                    break;
                case 'Series':
                    sampleSeriesIds = samples.map((series) => {
                        return {
                            id: series.seriesId,
                            text: series.seriesId + ' - ' + series.label,
                        };
                    });
                    break;
                default:
                // WHAT to do?
            }

            return sampleSeriesIds.sort((a, b) => {
                return a.text > b.text ? 1 : a.text < b.text ? -1 : 0;
            });
        }

        function getMethod() {
            return {
                params: {
                    referenceObject: 'input_growth_matrix',
                    dependencies: ['input_growth_matrix', 'input_value_type'],
                },
                included: ['metadata/column_metadata'],
                extractItems: extractItems,
            };
        }

        return {
            getMethod: getMethod,
        };
    }

    return {
        make: function () {
            return factory();
        },
    };
});
