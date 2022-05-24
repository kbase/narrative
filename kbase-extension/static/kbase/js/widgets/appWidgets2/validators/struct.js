define([
    'bluebird',
    'widgets/appWidgets2/validators/resolver',
    'widgets/appWidgets2/validators/constants',
], (Promise, ValidationResolver, Constants) => {
    'use strict';

    function validate(value, spec) {
        return Promise.try(() => {
            // validate the struct itself.
            if (value === null) {
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

            // validate all params
            // NOTE: for now this is not async -- may need to be.
            const validationMap = {};
            Object.keys(spec.parameters.specs).forEach((id) => {
                const paramSpec = spec.parameters.specs[id];
                const paramValue = value[id];
                validationMap[id] = ValidationResolver.validate(paramValue, paramSpec);
            });
            return Promise.props(validationMap).then((subValidationResults) => {
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
                const validationResult = {
                    isValid: true,
                    diagnosis: Constants.DIAGNOSIS.VALID,
                };
                let resolved = false;
                let subFieldsEmpty = true;
                const subParamIds = Object.keys(subValidationResults);
                for (const element of subParamIds) {
                    const result = subValidationResults[element];
                    if (!result.isValid) {
                        validationResult.isValid = false;
                        if (result.diagnosis === Constants.DIAGNOSIS.REQUIRED_MISSING) {
                            validationResult.diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                            validationResult.messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                        } else {
                            validationResult.diagnosis = Constants.DIAGNOSIS.INVALID;
                            validationResult.messageId = 'subfield-invalid';
                            validationResult.message = 'A sub-field is invalid';
                        }
                        resolved = true;
                        break;
                    } else {
                        if (result.diagosis !== Constants.DIAGNOSIS.OPTIONAL_EMPTY) {
                            subFieldsEmpty = false;
                        }
                    }
                }

                if (!resolved && subFieldsEmpty) {
                    // For now, we need to inspect the sub validation results --
                    // if this struct is required any any sub-fields are invalid or
                    // required-missing, we are also required-missing...
                    // could also try to represent an error state...

                    validationResult.isValid = false;
                    if (spec.data.constraints.required) {
                        validationResult.diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        validationResult.messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                    } else {
                        validationResult.diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                        validationResult.messageId = Constants.MESSAGE_IDS.OPTIONAL_EMPTY;
                    }
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
