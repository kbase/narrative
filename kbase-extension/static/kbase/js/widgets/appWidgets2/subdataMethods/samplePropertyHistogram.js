define([], () => {
    'use strict';
    function factory(config) {
        function extractItems(result, params) {
            if (result.length === 0) {
                return [];
            }
            const rowMetadata = result[0].data.metadata.row_metadata,
                wells = {};
            Object.keys(rowMetadata).forEach((rowId) => {
                rowMetadata[rowId].forEach((prop) => {
                    if (prop.category === 'Sample' && prop.property_name === 'Name') {
                        wells[prop.property_value] = prop.property_value;
                    }
                });
            });
            return Object.keys(wells)
                .map((wellId) => {
                    return {
                        id: wellId,
                        text: wellId,
                    };
                })
                .sort((a, b) => {
                    return a.text > b.text ? 1 : -1;
                });
        }

        function getMethod() {
            return {
                params: {
                    referenceObject: 'input_sample_property_matrix',
                    dependencies: ['input_sample_property_matrix'],
                },
                included: ['metadata/row_metadata'],
                extractItems: extractItems,
            };
        }

        return {
            getMethod: getMethod,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
