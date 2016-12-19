define([
    'bluebird',
    './resolver'
], function(Promise, resolver) {
    'use strict';

    function applyConstraints(value, constraints) {
        if (value === null) {
            if (constraints.required) {
                return {
                    isValid: false,
                    diagnosis: 'required-missing',
                    messageId: 'required-missing',
                    errorMessage: 'value is required'
                };
            } else {
                return {
                    isValid: true,
                    diagnosis: 'optional-empty',
                    messageId: 'optional-empty'
                };
            }
        }
        return {
            isValid: 'true',
            diagnosis: 'valid'
        };
    }

    function validate(value, spec) {
        var validationResult;
        return Promise.try(function() {

            // validate the struct itself.
            validationResult = applyConstraints(value, spec);

            // validate all params
            // NOTE: for now this is not async -- may need to be.

            if (value === null) {
                if (spec.data.constraints.required) {
                    validationResult.isValid = false;
                    validationResult.diagnosis = 'required-missing';
                    validationResult.messageId = 'required-missing';
                }
                return validationResult;
            } else {
                var validationMap = {};
                Object.keys(spec.parameters.specs).forEach(function(id) {
                    var paramSpec = spec.parameters.specs[id];
                    var paramValue = value[id];
                    validationMap[id] = resolver.validate(paramValue, paramSpec)
                });
                return Promise.props(validationMap)
                    .then(function(subValidationResults) {

                        if (spec.data.constraints.required) {
                            // For now, we need to inspect the sub validation results -- 
                            // if this struct is required any any sub-fields are invalid or
                            // required-missing, we are also required-missing...
                            // could also try to represent an error state...
                            Object.keys(subValidationResults).forEach(function(id) {
                                var result = subValidationResults[id];
                                if (result.isValid === false) {
                                    //if (result.diagnosis === 'required-missing') {
                                    validationResult.isValid = false;
                                    validationResult.diagnosis = 'required-missing';
                                    validationResult.messageId = 'required-missing';
                                    //}
                                }
                            });
                        }

                        // TODO: this .validations property for sub-validations should 
                        // be better thought out.
                        validationResult.validations = subValidationResults;
                        return validationResult;
                    });
            }
        });
    }

    return {
        applyConstraints: applyConstraints,
        validate: validate
    }
});