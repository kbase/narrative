define([
    'bluebird',
    'widgets/appWidgets2/validators/resolver',
    'widgets/appWidgets2/validators/constants',
], (Promise, ValidationResolver, Constants) => {
    'use strict';

    function validate(values, spec) {
        return Promise.try(() => {
            // validate the struct itself.
            if (values === null || values.length === 0) {
                if (spec.data.constraints.required) {
                    return {
                        isValid: false,
                        diagnosis: Constants.DIAGNOSIS.REQUIRED_MISSING,
                        messageId: Constants.MESSAGE_IDS.REQUIRED_MISSING,
                    };
                }
                return {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.OPTIONAL_EMPTY,
                    messageId: Constants.MESSAGE_IDS.OPTIONAL_EMPTY,
                };
            }
            return Promise.all(
                values.map((value) => {
                    // nb a sequence always has a param named "item".
                    const paramSpec = spec.parameters.specs.item;
                    const paramValue = value;
                    return ValidationResolver.validate(paramValue, paramSpec);
                })
            ).then((subValidationResults) => {
                const validationResult = {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                };
                if (spec.data.constraints.required) {
                    // Inspect the sub validation results --
                    // if this sequence is required and any sub-fields are invalid or
                    // required-missing, we are also required-missing
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
        });
    }

    return {
        validate,
    };
});
