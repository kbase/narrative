define(['bluebird', './resolver', './constants'], (Promise, ValidationResolver, Constants) => {
    'use strict';

    function applyConstraints(value, constraints) {
        if (value === null || value.length === 0) {
            if (constraints.required) {
                return {
                    isValid: false,
                    diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                    messageId: Constants.MESSAGE_IDS.REQUIRED_MISSING,
                    errorMessage: 'value is required',
                };
            } else {
                return {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    messageId: Constants.MESSAGE_IDS.OPTIONAL_EMPTY,
                };
            }
        }
        return {
            isValid: 'true',
            diagnosis: Constants.DIAGNOSIS.VALID,
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
                    validationResult.messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                }
                return validationResult;
            } else {
                return Promise.all(
                    values.map((value) => {
                        // nb a sequence always has a param named "item".
                        const paramSpec = spec.parameters.specs.item;
                        const paramValue = value;
                        return ValidationResolver.validate(paramValue, paramSpec);
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
                                validationResult.messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
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
