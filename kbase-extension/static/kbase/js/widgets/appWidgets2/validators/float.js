define(['bluebird'], (Promise) => {
    'use strict';

    function toFloat(value) {
        const valueType = typeof value;
        if (valueType === 'number') {
            return value;
        } else if (valueType === 'string') {
            const number = Number(value);
            if (isNaN(number)) {
                throw new Error('Invalid float format: ' + value);
            }
            return number;
        }
        throw new Error('Type ' + valueType + ' cannot be converted to float');
    }

    function importString(value) {
        if (value === undefined || value === null) {
            return null;
        }

        if (typeof value !== 'string') {
            throw new Error('value must be a string (it is of type "' + typeof value + '")');
        }
        const normalizedValue = value.trim();
        if (value === '') {
            return null;
        }
        return toFloat(normalizedValue);
    }

    function validateFloat(value, min, max) {
        if (typeof value !== 'number') {
            return 'value must be numeric';
        }
        if (!isFinite(value)) {
            return 'value must be a finite float';
        }
        if (typeof max === 'number' && value > max) {
            return 'the maximum value for this parameter is ' + max;
        }
        if (typeof min === 'number' && value < min) {
            return 'the minimum value for this parameter is ' + min;
        }
    }

    function applyConstraints(value, constraints) {
        let errorMessage, diagnosis;

        if (value === null) {
            if (constraints.required) {
                diagnosis = 'required-missing';
                errorMessage = 'value is required';
            } else {
                diagnosis = 'optional-empty';
            }
        } else {
            errorMessage = validateFloat(value, constraints.min, constraints.max);
            if (errorMessage) {
                diagnosis = 'invalid';
            } else {
                diagnosis = 'valid';
            }
        }
        return {
            isValid: errorMessage ? false : true,
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
