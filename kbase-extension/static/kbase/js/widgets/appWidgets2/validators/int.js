define(['bluebird', 'util/util', './constants'], (Promise, Util, Constants) => {
    'use strict';

    function importString(value) {
        if (value === undefined || value === null) {
            return null;
        }

        if (typeof value !== 'string') {
            throw new Error('value must be a string (it is of type "' + typeof value + '")');
        }

        const plainValue = value.trim();
        if (plainValue === '') {
            return null;
        }
        return Util.toInteger(plainValue);
    }

    function validateInt(value, min, max) {
        if (typeof value !== 'number') {
            try {
                value = Util.toInteger(value);
            } catch (error) {
                return {
                    id: 'non-numeric',
                    message: 'value must be numeric',
                };
            }
        }
        if (isNaN(value)) {
            return {
                id: 'non-numeric',
                message: 'value must be numeric',
            };
        }
        if (value - Math.floor(value) !== 0) {
            return {
                id: 'non-integer',
                message: 'value is a number but not an integer',
            };
        }
        if (max && max < value) {
            return {
                id: 'int-above-maximum',
                message: 'the maximum value for this parameter is ' + max,
            };
        }
        if (min && min > value) {
            return {
                id: 'int-below-minimum',
                message: 'the minimum value for this parameter is ' + min,
            };
        }
    }

    function applyConstraints(value, constraints) {
        let messageId,
            errorMessage,
            diagnosis = Constants.DIAGNOSIS.VALID;

        if (value === null) {
            if (constraints.required) {
                diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                messageId = 'required-missing';
                errorMessage = 'value is required';
            } else {
                diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
            }
        } else {
            const error = validateInt(value, constraints.min, constraints.max);
            if (error) {
                errorMessage = error.message;
                messageId = error.id;
                diagnosis = Constants.DIAGNOSIS.INVALID;
            }
        }

        return {
            isValid: errorMessage ? false : true,
            messageId,
            errorMessage,
            diagnosis,
        };
    }

    function validate(value, spec) {
        return Promise.try(() => {
            return applyConstraints(value, spec.data.constraints);
        });
    }

    return {
        importString,
        applyConstraints,
        validate,
    };
});
