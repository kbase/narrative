define(['bluebird'], (Promise) => {
    'use strict';

    function toInteger(value) {
        switch (typeof value) {
            case 'number':
                if (value !== Math.floor(value)) {
                    throw new Error('Integer is a non-integer number');
                }
                return value;
            case 'string':
                if (value.match(/^[-+]?[\d]+$/)) {
                    return parseInt(value, 10);
                }
                throw new Error('Invalid integer format');
            default:
                throw new Error('Type ' + typeof value + ' cannot be converted to integer');
        }
    }

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
        return toInteger(plainValue);
    }

    function validateInt(value, min, max) {
        if (typeof value !== 'number') {
            try {
                value = toInteger(value);
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
            diagnosis = 'valid';

        if (value === null) {
            if (constraints.required) {
                diagnosis = 'required-missing';
                messageId = 'required-missing';
                errorMessage = 'value is required';
            } else {
                diagnosis = 'optional-empty';
            }
        } else {
            const error = validateInt(value, constraints.min, constraints.max);
            if (error) {
                errorMessage = error.message;
                messageId = error.id;
                diagnosis = 'invalid';
            }
        }

        return {
            isValid: errorMessage ? false : true,
            messageId: messageId,
            errorMessage: errorMessage,
            diagnosis: diagnosis,
        };
    }

    function validate(value, spec) {
        return Promise.try(() => {
            return applyConstraints(value, spec.data.constraints);
        });
    }

    return {
        importString: importString,
        applyConstraints: applyConstraints,
        validate: validate,
    };
});
