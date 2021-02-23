/*global define*/

/*
 * Provides app spec functionality.
 */

define([
    'require',
    'bluebird',
    'common/lang',
    'common/sdk',
    'common/specValidation',
    'widgets/appWidgets2/validators/resolver'
], (require, Promise, lang, sdk, Validation, validationResolver) => {
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

        /*
         * Make a "shell" model based on the spec. Recursively build an object
         * with properties as defined by the spec.
         * Effectively this means that only the top level is represented, since
         */
        function makeEmptyModel() {
            const model = {};
            spec.parameters.layout.forEach((id) => {
                model[id] = spec.parameters.specs[id].data.defaultValue || spec.parameters.specs[id].data.nullValue;
            });
            return model;
        }

        /*
        Makes a model (not a view model quite yet, really, because just data)
        from the given spec.
        It does this by:
        The top level spec is treated as a struct.
        The default value for each paramater is simply set as the value for the given parameter
        on a model object.
        One exception is that if a parameter is a
        */
        function makeDefaultedModel() {
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
                model[id] = modelValue;
            });
            return model;
        }

        const typeToValidatorModule = {
            string: 'text',
            int: 'int',
            float: 'float',
            sequence: 'sequence',
            struct: 'struct'
        }

        function getValidatorModule(fieldSpec) {
            const moduleName = typeToValidatorModule[fieldSpec.data.type];
            if (!moduleName) {
                throw new Error('No validator for type: ' + fieldSpec.data.type);
            }
            return moduleName;
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

        return Object.freeze({
            getSpec: getSpec,
            makeEmptyModel: makeEmptyModel,
            makeDefaultedModel: makeDefaultedModel,
            validateModel: validateModel
        });
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
