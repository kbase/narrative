/*
 * Provides app spec functionality.
 */

define([
    'bluebird',
    'common/lang',
    'common/sdk',
    'widgets/appWidgets2/validators/resolver',
], (Promise, lang, sdk, validationResolver) => {
    'use strict';

    function factory(config) {
        let spec;

        if (config.spec) {
            spec = config.spec;
        } else if (config.appSpec) {
            spec = sdk.convertAppSpec(config.appSpec);
        } else {
            throw new Error('Either a spec or appSpec must be provided');
        }

        function getSpec() {
            return spec;
        }

        /**
         * Makes a 'model' object (not a view model yet, really, because it's just data) from the
         * given spec.
         * It does this by:
         *  The top level spec is treated as a struct.
         *  The default value for each paraemter is simply set as the value for the given parameter
         *    on a model object.
         *  If appType = "bulkImport", this is further separated into "filePaths" and "params"
         *    sub-objects.
         * @param {string} appType
         */
        function makeDefaultedModel(appType) {
            const model = {};
            spec.parameters.layout.forEach((id) => {
                const paramSpec = spec.parameters.specs[id];
                let modelValue;
                if (paramSpec.data.type === 'struct') {
                    if (paramSpec.data.constraints.required) {
                        modelValue = lang.copy(paramSpec.data.defaultValue);
                    } else {
                        modelValue = paramSpec.data.nullValue;
                    }
                } else {
                    modelValue = lang.copy(paramSpec.data.defaultValue);
                }
                if (appType === 'bulkImport') {
                    model.params[id] = modelValue;
                }
                else {
                    model[id] = modelValue;
                }
            });
            return model;
        }

        function validateModel(model) {
            // TODO: spec at the top level should be a struct...
            // return;
            const validationMap = {};
            spec.parameters.layout.forEach((id) => {
                const fieldValue = model[id];
                const fieldSpec = spec.parameters.specs[id];
                validationMap[id] = validationResolver.validate(fieldValue, fieldSpec);
            });
            return Promise.props(validationMap);
        }

        /**
         * Returns an array of ids of file path params
         */
        function getFilePathParams() {
            return spec.parameters.layout.filter((id) => {
                const original = spec.parameters.specs[id].original;

                let isFilePathParam = false;

                if (original) {
                    //looking for file inputs via the dynamic_dropdown data source
                    if (original.dynamic_dropdown_options) {
                        isFilePathParam =
                            original.dynamic_dropdown_options.data_source === 'ftp_staging';
                    }

                    //looking for output fields - these should go in file paths
                    else if (original.text_options && original.text_options.is_output_name) {
                        isFilePathParam = true;
                    }
                }

                return isFilePathParam;
            });
        }

        return Object.freeze({
            getSpec,
            makeDefaultedModel,
            validateModel,
            getFilePathParams,
        });
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
