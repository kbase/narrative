/*global define*/

define([
], () => {
    'use strict';

    function factory(config) {
        // PRIVATE

        function getSampleProperties (columnsMetadata) {
            const samplePropertiesHash = {};
            console.log('column metadata', columnsMetadata);
            Object.keys(columnsMetadata).forEach((columnId) => {
                let columnMetadata = columnsMetadata[columnId],
                    seriesID = null,
                    propName = null;

                columnMetadata.forEach((pv) => {
                    if (pv.category === 'DataSeries' && pv.property_name === 'SeriesID') {
                        seriesID = pv.property_value;
                    } else if (pv.category === 'Property' && pv.property_name === 'Name') {
                        propName = pv.property_value;
                    }
                });

                if (seriesID !== null && propName !== null) {
                    samplePropertiesHash[seriesID] = propName;
                }
            });

            return Object.keys(samplePropertiesHash).map((seriesId) => {
                return {
                    id: seriesId,
                    text: samplePropertiesHash[seriesId]
                };
            }).sort((a, b) => {
                return a.text > b.text ? 1 : -1;
            });
        }

        // PUBLIC

        function extractItems(result, params) {
            const columnMetadata = result[0].data.metadata.column_metadata;

            return getSampleProperties(columnMetadata);
        }

        function getMethod() {
            return {
                params: {
                    referenceObject: 'input_sample_property_matrix',
                    dependencies: ['input_sample_property_matrix']
                },
                included: ["metadata/column_metadata"],
                extractItems: extractItems
            };
        }

        return {
            getMethod: getMethod
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };

});
