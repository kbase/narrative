define(['bluebird', './constants'], (Promise, Constants) => {
    'use strict';

    function importString(stringValue) {
        return stringValue.trim();
    }

    function validateWorkspaceObjectRef(value, constraints) {
        let messageId,
            shortMessage,
            errorMessage,
            diagnosis = Constants.DIAGNOSIS.VALID;

        return Promise.try(() => {
            if (value === null) {
                if (constraints.required) {
                    messageId = 'required-missing';
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else {
                // for now assume it is valid...
            }
        }).then(() => {
            return {
                isValid: errorMessage ? false : true,
                messageId,
                errorMessage,
                shortMessage,
                diagnosis,
            };
        });
    }

    function validate(value, spec, options) {
        return validateWorkspaceObjectRef(value, spec.data.constraints, options);
    }

    return {
        importString,
        validate,
    };
});
