/*global define*/
/*jslint white:true,browser:true*/

define([
], function () {
    'use strict';

    function factory(config) {
        // PRIVATE
        
        function getSampleProperties (columnsMetadata) {
            var samplePropertiesHash = {};
            console.log('column metadata', columnsMetadata);
            Object.keys(columnsMetadata).forEach(function (columnId) {                
                var columnMetadata = columnsMetadata[columnId],
                    seriesID = null,
                    propName = null;

                columnMetadata.forEach(function (pv) {
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

            return Object.keys(samplePropertiesHash).map(function (seriesId) {
                return {
                    id: seriesId,
                    text: samplePropertiesHash[seriesId]
                };
            }).sort(function (a, b) {
                return a.text > b.text ? 1 : -1;
            });
        }
        
        // PUBLIC
        
        function extractItems(result, params) {
            var columnMetadata = result[0].data.metadata.column_metadata;
            
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