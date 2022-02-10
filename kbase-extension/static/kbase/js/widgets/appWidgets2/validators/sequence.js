define(['bluebird', './resolver', './constants'], (Promise, resolver, Constants) => {
    'use strict';

    function applyConstraints(value, constraints) {
        if (value === null || value.length === 0) {
            if (constraints.required) {
                return {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    messageId: 'required-missing',
                    errorMessage: 'value is required',
                };
            } else {
                return {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    messageId: 'optional-empty',
                };
            }
        }
        return {
            isValid: 'true',
            diagnosis: 'valid',
        };
    }

    function validate(values, spec) {
        let validationResult;
        return Promise.try(() => {
            // validate the struct itself.
            validationResult = applyConstraints(values, spec);

            if (values === null || values.length === 0) {
                if (spec.data.constraints.required) {
                    validationResult.isValid = false;
                    validationResult.diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    validationResult.messageId = 'required-missing';
                }
                return validationResult;
            } else {
                return Promise.all(
                    values.map((value) => {
                        // nb a sequenc always has a param named "item".
                        const paramSpec = spec.parameters.specs.item;
                        const paramValue = value;
                        return resolver.validate(paramValue, paramSpec);
                    })
                ).then((subValidationResults) => {
                    if (spec.data.constraints.required) {
                        // For now, we need to inspect the sub validation results --
                        // if this struct is required any any sub-fields are invalid or
                        // required-missing, we are also required-missing...
                        // could also try to represent an error state...
                        Object.keys(subValidationResults).forEach((id) => {
                            const result = subValidationResults[id];
                            if (result.isValid === false) {
                                validationResult.isValid = false;
                                validationResult.diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                                validationResult.messageId = 'required-missing';
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
        applyConstraints,
        validate,
    };
});
