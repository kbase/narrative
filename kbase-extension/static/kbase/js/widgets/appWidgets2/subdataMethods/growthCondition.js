define([], () => {
    'use strict';

    function factory(config) {
        // PRIVATE

        function getData(columnsMetadata) {
            const conditions = {};
            Object.keys(columnsMetadata).forEach((columnId) => {
                columnsMetadata[columnId].forEach((pv) => {
                    if (pv.category === 'Condition') {
                        conditions[pv.property_name] = true;
                    }
                });
            });
            return Object.keys(conditions).map((conditionParam) => {
                return {
                    id: conditionParam,
                    text: conditionParam,
                };
            });
        }

        // PUBLIC

        function extractItems(result, params) {
            const columnMetadata = result[0].data.metadata.column_metadata;

            return getData(columnMetadata);
        }

        function getMethod() {
            return {
                params: {
                    referenceObject: 'input_growth_parameters',
                    dependencies: ['input_growth_parameters'],
                },
                // use this if the reference object is not what we want
                // to query, but a sub object. For now we just support
                // one layer of indirection.
                // data is the result of workspace.get_objects
                // result is an object reference which will be consumed by
                //   worksoace.get_object_subset (ref property).
                getRef: function (data) {
                    return data[0].data.matrix_id;
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
        make: function (config) {
            return factory(config);
        },
    };
});
