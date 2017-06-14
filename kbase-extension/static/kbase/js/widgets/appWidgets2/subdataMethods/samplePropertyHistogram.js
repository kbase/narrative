/*global define*/
/*jslint white:true,browser:true*/

define([
], function () {
    'use strict';
    function factory(config) {
        function extractItems(result, params) {            
            if (result.length === 0) {
                return [];
            }
            var rowMetadata = result[0].data.metadata.row_metadata,
                wells = {};
            Object.keys(rowMetadata).forEach(function (rowId) {
                rowMetadata[rowId].forEach(function (prop) {
                    if (prop.category === 'Sample' && prop.property_name === 'Name') {
                        wells[prop.property_value] = prop.property_value;
                    }
                });
            });
            return Object.keys(wells).map(function (wellId) {
                return {
                    id: wellId,
                    text: wellId
                };
            }).sort(function (a, b) {
                return a.text > b.text ? 1 : -1;
            });            
        }

        function getMethod() {
            return {
                params: {
                    referenceObject: 'input_sample_property_matrix',
                    dependencies: ['input_sample_property_matrix']
                },
                included: ["metadata/row_metadata"],
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