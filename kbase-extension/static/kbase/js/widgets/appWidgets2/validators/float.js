define([
    'bluebird'
], function(
    Promise
) {
    'use strict';

    function importString(value) {
        var normalizedValue;

        if (value === undefined || value === null) {
            return null;
        }

        if (typeof value !== 'string') {
            throw new Error('value must be a string (it is of type "' + (typeof value) + '")');
        }
        normalizedValue = value.trim();
        if (value === '') {
            return null;
        }
        return parseFloat(normalizedValue);
    }

    function validateFloat(value, min, max) {
        if (isNaN(value)) {
            return 'value must be numeric';
        }
        if (!isFinite(value)) {
            return 'value must be a finite float';
        }
        if (max && max < value) {
            return 'the maximum value for this parameter is ' + max;
        }
        if (min && min > value) {
            return 'the minimum value for this parameter is ' + min;
        }
    }

    function applyConstraints(value, constraints) {
        var errorMessage, diagnosis;

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
            diagnosis: diagnosis
        };
    }

    function validate(value, spec) {
        return Promise.try(function() {
            return applyConstraints(value, spec.data.constraints);
        });
    }

    // For text values, there is 
    // function validate(value, spec) {
    //     try {
    //         var nativeValue = importString(value);
    //         return {
    //             value: {
    //                 original: value,
    //                 parsed: nativeValue
    //             },
    //             validation: applyConstraints(nativeValue, spec.data.constraints)
    //         };
    //     } catch (ex) {
    //         return {
    //             value: {
    //                 original: value
    //             },
    //             validation: {
    //                 isValid: false,
    //                 errorMessage: ex.message,
    //                 diagnosis: 'invalid'
    //             }
    //         };
    //     }
    // }

    return {
        importString: importString,
        applyConstraints: applyConstraints,
        validate: validate
    }
});