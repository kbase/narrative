define([
    'bluebird',
    './common'
], function(Promise, common) {

    function importString(value) {
        if (value === undefined || value === null) {
            return null;
        }
        return value;
    }

    function applyConstraints(value, constraints) {
        var parsedValue,
            errorMessage, diagnosis = 'valid',
            minLength = constraints.min_length,
            maxLength = constraints.max_length,
            regexp = constraints.regexp ? new RegExp(constraints.regexp) : false;

        if (common.isEmptyString(value)) {
            parsedValue = '';
            if (constraints.required) {
                diagnosis = 'required-missing';
                errorMessage = 'value is required';
            } else {
                diagnosis = 'optional-empty';
            }
        } else if (typeof value !== 'string') {
            diagnosis = 'invalid';
            errorMessage = 'value must be a string (it is of type "' + (typeof value) + '")';
        } else {
            // parsedValue = value.trim();
            parsedValue = value;
            if (parsedValue.length < minLength) {
                diagnosis = 'invalid';
                errorMessage = 'the minimum length for this parameter is ' + minLength;
            } else if (parsedValue.length > maxLength) {
                diagnosis = 'invalid';
                errorMessage = 'the maximum length for this parameter is ' + maxLength;
            } else if (regexp && !regexp.test(parsedValue)) {
                diagnosis = 'invalid';
                errorMessage = 'The text value did not match the regular expression constraint ' + constraints.regexp;
            } else {
                diagnosis = 'valid';
            }
        }

        return {
            isValid: errorMessage ? false : true,
            errorMessage: errorMessage,
            diagnosis: diagnosis,
            value: value,
            parsedValue: parsedValue
        };
    }

    // function validate(value, constraints) {
    //     try {
    //         var nativeValue = value;
    //         return {
    //             value: {
    //                 original: value,
    //                 parsed: nativeValue
    //             },
    //             validation: applyConstraints(nativeValue, constraints)
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

    function validate(value, spec) {
        return Promise.try(function() {
            return applyConstraints(value, spec.data.constraints);
        });
    }

    /*
    Each validator must supply:
    validateText - validate a 
    */
    return {
        importString: importString,
        validate: validate,
        applyConstraints: applyConstraints
    };
});