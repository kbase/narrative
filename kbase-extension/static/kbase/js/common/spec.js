/*
 * Provides app spec functionality.
 */

define(['bluebird', 'util/util', 'common/sdk', 'widgets/appWidgets2/validators/resolver'], (
    Promise,
    Util,
    sdk,
    ValidationResolver
) => {
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
            if (appType === 'bulkImport') {
                model['params'] = {};
            }
            spec.parameters.layout.forEach((id) => {
                const paramSpec = spec.parameters.specs[id];
                let modelValue;
                if (paramSpec.data.type === 'struct') {
                    if (paramSpec.data.constraints.required) {
                        modelValue = Util.copy(paramSpec.data.defaultValue);
                    } else {
                        modelValue = paramSpec.data.nullValue;
                    }
                } else {
                    modelValue = Util.copy(paramSpec.data.defaultValue);
                }
                if (appType === 'bulkImport') {
                    model.params[id] = modelValue;
                } else {
                    model[id] = modelValue;
                }
            });
            return model;
        }

        /**
         * Validates the model (object that maps from parameter id to current value) against
         * this spec. This returns a Promise that resolves into a map from parameter ids to
         * validations.
         * @param {object} model the object containing the data model to validate
         * should have key-value pairs for each parameter id.
         * @returns Promise that resolves into a mapping from parameter id -> validation
         * structure
         */
        function validateModel(model) {
            return validateParams(spec.parameters.layout, model, {});
        }

        /**
         * A trimmed version of validateModel that's specific for a few params.
         * Given an array of parameter ids and an object with key-value pairs from
         * paramId -> value, validate the set. Only the given parameter ids are validated.
         * Any others are ignored.
         *
         * This returns a Promise that resolves into key-value pairs of parameter id ->
         * validation response.
         * @param {array} paramIds - the array of parameter ids to validate
         * @param {object} values - an object where the key is the parameter id, and the value has
         *  both the value, and arbitrary options to be passed to the specific validator.
         * @param {object} options
         */
        function validateParams(paramIds, values, options) {
            const validationMap = {};
            options = options || {};
            paramIds.forEach((id) => {
                validationMap[id] = ValidationResolver.validate(
                    values[id],
                    spec.parameters.specs[id],
                    options[id] || {}
                );
            });
            return Promise.props(validationMap);
        }

        /**
         * This validates parameter sets by using a bulk form of validator for each parameter type.
         * If options are available for the parameter validation, they're expected to apply to all
         * parameters of that type.
         * This returns a batch of promises that resolves to a arrays of validations, keyed on
         * parameter id, matching the order of arrays in the paramValues structure.
         * This expects that paramValues is normalized - that is, each array is present and the
         * same length, otherwise unexpected behavior may occur.
         * @param {Array} paramIds parameter ids to validate.
         * @param {Object} paramValues keys = parameter ids, values = list of parameter values
         * @param {Object} options keys = parameter ids, values = set of options for that parameter
         */
        function validateMultipleParamsArray(paramIds, paramValues, options = {}) {
            const validationMap = {};
            for (const paramId of paramIds) {
                validationMap[paramId] = validateParamsArray(
                    paramId,
                    paramValues[paramId],
                    options[paramId]
                );
            }
            return Promise.props(validationMap);
        }

        /**
         *
         * @param {string} paramId
         * @param {Array} paramValues
         */
        function validateParamsArray(paramId, paramValues, options = {}) {
            return ValidationResolver.validateArray(
                paramValues,
                spec.parameters.specs[paramId],
                options
            );
        }

        return Object.freeze({
            getSpec,
            makeDefaultedModel,
            validateModel,
            validateParams,
            validateParamsArray,
            validateMultipleParamsArray,
        });
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
