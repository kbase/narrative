define(['bluebird', 'util/string', './constants'], (Promise, StringUtil, Constants) => {
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
            diagnosis = Constants.DIAGNOSIS.VALID,
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
                diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                errorMessage = 'value is required';
            } else {
                diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
            }
        } else if (typeof value !== 'string') {
            diagnosis = Constants.DIAGNOSIS.INVALID;
            errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
        } else if (options.invalidValues && options.invalidValues.has(value)) {
            diagnosis = Constants.DIAGNOSIS.INVALID;
            errorMessage = options.invalidError ? options.invalidError : 'value is invalid';
        } else {
            parsedValue = value;
            if (parsedValue.length < minLength) {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'the minimum length for this parameter is ' + minLength;
            } else if (parsedValue.length > maxLength) {
                diagnosis = Constants.DIAGNOSIS.INVALID;
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
                    diagnosis = Constants.DIAGNOSIS.VALID;
                    errorMessage = regexpErrorMessages.join('; ');
                }
            } else {
                diagnosis = Constants.DIAGNOSIS.VALID;
            }
        }

        return {
            isValid: errorMessage ? false : true,
            errorMessage,
            diagnosis,
            value,
            parsedValue,
        };
    }

    /**
     *
     * @param {String} value the value to validate, expected to be a string
     * @param {Object} spec the parameter spec from the app spec
     * @param {Object} options can have the following keys, all optional:
     *   - invalidValues - {Set<string>} - any values in this set are automatically treated as
     *     invalid
     *   - invalidError - {String} - optional special error used if any of the invalidValues
     *     Set are encountered
     * @returns
     */
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
