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
            regexps;
            
        if (constraints.regexp) {
            regexps = constraints.regexp.map(function (item) {
                return {
                    regexpText: item.regex,
                    regexp: new RegExp(item.regex),
                    message: item.error_text,
                    invert: item.match ? false : true
                };
            });
        }

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
            parsedValue = value;
            if (parsedValue.length < minLength) {
                diagnosis = 'invalid';
                errorMessage = 'the minimum length for this parameter is ' + minLength;
            } else if (parsedValue.length > maxLength) {
                diagnosis = 'invalid';
                errorMessage = 'the maximum length for this parameter is ' + maxLength;
            } else if (regexps) {
                var regexpErrorMessages = [];
                regexps.forEach(function (item) {
                    var matches = item.regexp.test(parsedValue);
                    if (item.invert) {
                        matches = !matches;
                    }
                    if (!matches) {
                        regexpErrorMessages.push(item.message || 'Failed regular expression "' + item.regexpText + '"');
                    }
                });
                if (regexpErrorMessages.length > 0) {
                    diagnosis = 'invalid';
                    errorMessage = regexpErrorMessages.join('; ');
                }
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