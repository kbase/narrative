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
                    validationMap[id] = resolver.validate(paramValue, paramSpec);
                });
                return Promise.props(validationMap)
                    .then(function(subValidationResults) {
                        /*
                            Propagation rules for struct validation:
                            optional:
                            if any subcontrol has an error, so do we, and the message
                            is just generic (Error in subcontrol).
                            if any are required and empty, don't do anything (upper context will
                            catch this)
                            if all are optional-empty, we are optional-empty

                            required:
                            if any is a validation error, this becomes error (like above)
                            otherwise, if any is required-missing, this becomes required-missing
                            otherwise, if all are optional-empty, we are required-missing
                        */
                        var resolved = false;
                        var subFieldsEmpty = true;
                        var subParamIds = Object.keys(subValidationResults);
                        for (var i = 0; i < subParamIds.length; i += 1) {
                            var result = subValidationResults[subParamIds[i]];
                            if (!result.isValid) {
                                validationResult.isValid = false;
                                if (result.diagnosis === 'required-missing') {
                                    validationResult.diagnosis = 'required-missing';
                                    validationResult.messageId = 'required-missing';
                                } else {
                                    validationResult.diagnosis = 'invalid';
                                    validationResult.messageId = 'subfield-invalid';
                                    validationResult.message = 'A sub-field is invalid';
                                }
                                resolved = true;
                                break;
                            } else {
                                if (result.diagosis !== 'optional-empty') {
                                    subFieldsEmpty = false;
                                }
                            }
                        }

                        if (spec.data.constraints.required) {
                            // For now, we need to inspect the sub validation results -- 
                            // if this struct is required any any sub-fields are invalid or
                            // required-missing, we are also required-missing...
                            // could also try to represent an error state...

                            if (!resolved && subFieldsEmpty) {
                                validationResult.isValid = false;
                                validationResult.diagnosis = 'required-missing';
                                validationResult.messageId = 'required-missing';
                            }
                        } else {
                           
                            if (!resolved && subFieldsEmpty) {
                                validationResult.isValid = false;
                                validationResult.diagnosis = 'optional-empty';
                                validationResult.messageId = 'optional-empty';
                            }
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
    };
});