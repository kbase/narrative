define(['bluebird', 'util/string'], (Promise, StringUtil) => {
    'use strict';

    function importString(value) {
        if (value === undefined || value === null) {
            return null;
        }
        return value;
    }

    function applyConstraints(value, constraints, options) {
        let parsedValue,
            errorMessage,
            diagnosis = 'valid',
            regexps;

        const minLength = constraints.min_length,
            maxLength = constraints.max_length;

        if (constraints.regexp) {
            regexps = constraints.regexp.map((item) => {
                return {
                    regexpText: item.regex,
                    regexp: new RegExp(item.regex),
                    message: item.error_text,
                    invert: item.match ? false : true,
                };
            });
        }

        if (StringUtil.isEmptyString(value)) {
            parsedValue = '';
            if (constraints.required) {
                diagnosis = 'required-missing';
                errorMessage = 'value is required';
            } else {
                diagnosis = 'optional-empty';
            }
        } else if (typeof value !== 'string') {
            diagnosis = 'invalid';
            errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
        } else if (options.invalidValues && options.invalidValues.has(value)) {
            diagnosis = 'invalid';
            errorMessage = options.invalidError ? options.invalidError : 'value is invalid';
        } else {
            parsedValue = value;
            if (parsedValue.length < minLength) {
                diagnosis = 'invalid';
                errorMessage = 'the minimum length for this parameter is ' + minLength;
            } else if (parsedValue.length > maxLength) {
                diagnosis = 'invalid';
                errorMessage = 'the maximum length for this parameter is ' + maxLength;
            } else if (regexps) {
                const regexpErrorMessages = [];
                regexps.forEach((item) => {
                    let matches = item.regexp.test(parsedValue);
                    if (item.invert) {
                        matches = !matches;
                    }
                    if (!matches) {
                        regexpErrorMessages.push(
                            item.message || 'Failed regular expression "' + item.regexpText + '"'
                        );
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
            parsedValue: parsedValue,
        };
    }

    function validate(value, spec, options) {
        return Promise.try(() => {
            return applyConstraints(value, spec.data.constraints, options || {});
        });
    }

    return {
        importString,
        validate,
        applyConstraints,
    };
});
