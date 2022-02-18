define([
    'bluebird',
    'kb_service/client/workspace',
    'kb_service/utils',
    'util/util',
    'util/string',
    './validators/constants',
], (Promise, Workspace, serviceUtils, Util, StringUtil, Constants) => {
    'use strict';

    function Validators() {
        /**
         * This validates a single value against a set of acceptable values. For example, if
         * value = 'a', and and options.values = ['a', 'b', 'c'], this will return
         * {isValid: true}, since all the elements of value are present in options.values.
         *
         * This doesn't do any parsing, but will set an errorMessage in the return if a required
         * value is undefined.
         * @param {Array} value - the value to validate
         * @param {Object} options
         *  - required = boolean (default false)
         *  - values = Array, the set of acceptable values
         */
        function validateSet(value, options) {
            let errorMessage, diagnosis;
            // values are raw, no parsing.

            // the only meaningful value for an empty value is 'undefined'.
            if (value === undefined) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else {
                if (
                    !options.values.some((setValue) => {
                        return setValue === value;
                    })
                ) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'Value not in the set';
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value,
                parsedValue: value,
            };
        }

        /**
         * Validates whether the value is a valid object data palette reference path,
         * consisting of only numerical values in the reference (e.g.: 1/2/3;4/5/6;7/8/9)
         * Note that this doesn't check to see if the path is real, just if it's syntactically
         * valid.
         * @param {string} value
         * @param {Object} options
         * - required - boolean
         * @returns {Object}
         */
        function validateWorkspaceDataPaletteRef(value, options) {
            let parsedValue, errorMessage, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string in data reference format';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length === 0) {
                    parsedValue = null;
                }

                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (!/^\d+\/\d+(\/\d+)?(;\d+\/\d+(\/\d+)?)*$/.test(value)) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'Invalid object reference path -  ( should be #/#/#;#/#/#;...)';
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
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

        /**
         * Validates whether the given string is a workspace object reference. In this case,
         * specifically, an UPA. That means it must have the format ##/##/## to be valid.
         *
         * It can also be valid if options.required == true and value is not present.
         * @param {string} value
         * @param {object} options
         * - required - boolean
         */
        function validateWorkspaceObjectRef(value, options) {
            let parsedValue, errorMessage, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string in workspace object reference format';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length === 0) {
                    parsedValue = null;
                }
                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (!/^\d+\/\d+\/\d+$/.test(value)) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'Invalid object reference format, should be #/#/#';
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

        function getObjectInfo(workspaceId, objectName, authToken, serviceUrl) {
            const workspace = new Workspace(serviceUrl, {
                token: authToken,
            });

            return workspace
                .get_object_info_new({
                    objects: [{ wsid: workspaceId, name: objectName }],
                    ignoreErrors: 1,
                })
                .then((data) => {
                    if (data[0]) {
                        return serviceUtils.objectInfoToObject(data[0]);
                    } else {
                        return null;
                    }
                });
        }

        /**
         * Validate that a workspace object name is syntactically valid, and exists as a real workspace
         * object.
         * @param {string} value
         * @param {object} options
         * - required - boolean
         * - shouldNotExist - boolean
         * - workspaceId - int
         * - workspaceServiceUrl - string(url),
         * - types - Array
         */
        function validateWorkspaceObjectName(value, options) {
            let parsedValue,
                messageId,
                shortMessage,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;

            return Promise.try(() => {
                ({ errorMessage, shortMessage, messageId, diagnosis, parsedValue } =
                    validateWorkspaceObjectNameString(value, options));
                if (errorMessage) {
                    return;
                }
                if (options.shouldNotExist) {
                    return getObjectInfo(
                        options.workspaceId,
                        parsedValue,
                        options.authToken,
                        options.workspaceServiceUrl
                    ).then((objectInfo) => {
                        if (objectInfo) {
                            const type = objectInfo.typeModule + '.' + objectInfo.typeName,
                                matchingType = options.types.some((typeId) => {
                                    if (typeId === type) {
                                        return true;
                                    }
                                    return false;
                                });
                            if (!matchingType) {
                                messageId = 'obj-overwrite-diff-type';
                                errorMessage =
                                    'an object already exists with this name and is not of the same type';
                                diagnosis = Constants.DIAGNOSIS.INVALID;
                            } else {
                                messageId = 'obj-overwrite-warning';
                                shortMessage = 'an object already exists with this name';
                                diagnosis = Constants.DIAGNOSIS.SUSPECT;
                            }
                        }
                    });
                }
            }).then(() => {
                return {
                    isValid: errorMessage ? false : true,
                    messageId,
                    errorMessage,
                    shortMessage,
                    diagnosis,
                    value,
                    parsedValue,
                };
            });
        }

        function validateInteger(value, min, max) {
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

        function validateIntString(value, constraints, options = {}) {
            let plainValue,
                parsedValue,
                errorObject,
                messageId,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;
            const min = constraints.min,
                max = constraints.max;

            if (StringUtil.isEmptyString(value)) {
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    messageId = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string' && typeof value !== 'number') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = 'incoming-value-not-string-or-number';
                errorMessage =
                    'value must be a string or number (it is of type "' + typeof value + '")';
            } else {
                plainValue = value;
                if (typeof plainValue === 'string') {
                    plainValue = plainValue.trim();
                }
                try {
                    parsedValue = Util.toInteger(plainValue);
                    errorObject = validateInteger(parsedValue, min, max);
                    if (errorObject) {
                        messageId = errorObject.id;
                        errorMessage = errorObject.message;
                    }
                } catch (error) {
                    messageId = 'internal-error';
                    errorMessage = options.nonIntError ? options.nonIntError : error.message;
                }
                if (errorMessage) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                messageId,
                errorMessage,
                message: errorMessage,
                diagnosis,
                value,
                plainValue,
                parsedValue,
            };
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

        function validateFloatString(value, constraints) {
            let normalizedValue, parsedValue, errorMessage, diagnosis;
            const min = constraints.min,
                max = constraints.max;

            if (StringUtil.isEmptyString(value)) {
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                try {
                    normalizedValue = value.trim();
                    parsedValue = parseFloat(normalizedValue);
                    errorMessage = validateFloat(parsedValue, min, max);
                } catch (error) {
                    errorMessage = error.message;
                }
                if (errorMessage) {
                    parsedValue = undefined;
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value,
                normalizedValue,
                parsedValue,
            };
        }

        function validateWorkspaceObjectNameString(value, options) {
            let parsedValue,
                messageId,
                shortMessage,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;

            if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string in workspace object name format';
            } else {
                parsedValue = value.trim();
                if (!parsedValue) {
                    if (options.required) {
                        messageId = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (/\s/.test(parsedValue)) {
                    messageId = 'obj-name-no-spaces';
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'an object name may not contain a space';
                } else if (/^[+-]*\d+$/.test(parsedValue)) {
                    messageId = 'obj-name-not-integer';
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'an object name may not be in the form of an integer';
                } else if (!/^[A-Za-z0-9|.|_-]+$/.test(parsedValue)) {
                    messageId = 'obj-name-invalid-characters';
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage =
                        'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"';
                } else if (parsedValue.length > 255) {
                    messageId = 'obj-name-too-long';
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'an object name may not exceed 255 characters in length';
                }
            }
            return {
                isValid: errorMessage ? false : true,
                messageId,
                errorMessage,
                shortMessage,
                diagnosis,
                value,
                parsedValue,
            };
        }

        /**
         * Validates a text string against a set of optional constraints. Will fail if:
         * - required and missing,
         * - has a min_length, and is shorter
         * - has a max_length, and is longer
         * - has a regexp and doesn't match it
         * - is a type option of "WorkspaceObjectName", and isn't a valid workspace object name
         * (ignoring all other constraints)
         *
         * @param {string} value
         * @param {object} constraints
         * - required - boolean
         * - min_length - int
         * - max_length - int
         * - regexp - regex (bare string of form /regex/)
         * - type - string, only available now is "WorkspaceObjectName" - if that's present, this
         *      gets validated as a workspace object name (meaning that string lengths and regexp
         *      are ignored)
         * @param {object} options (optional). if present, optional values are
         * - invalidValues {Set<string>} set of values that are always invalid
         * - invalidError {string} string to respond with if an invalid value is present
         * - validValues {Set<string>} set of allowed values - if present, and the value doesn't
         *   match one of these, it will resolve to invalid.
         */
        function validateTextString(value, constraints, options = {}) {
            let parsedValue,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;
            const minLength = constraints.min_length,
                maxLength = constraints.max_length;

            if (constraints.type) {
                switch (constraints.type) {
                    case 'WorkspaceObjectName':
                        return validateWorkspaceObjectNameString(value, constraints);
                }
            }

            if (StringUtil.isEmptyString(value)) {
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else if (
                (options.invalidValues && options.invalidValues.has(value)) ||
                (options.validValues && !options.validValues.has(value))
            ) {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = options.invalidError ? options.invalidError : 'value is invalid';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length < minLength) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'the minimum length for this parameter is ' + minLength;
                } else if (parsedValue.length > maxLength) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'the maximum length for this parameter is ' + maxLength;
                } else if (constraints.regexp) {
                    const regexps = constraints.regexp.map((item) => {
                        return {
                            regexp: new RegExp(item.regex),
                            message: item.error_text,
                            invert: item.match ? false : true,
                        };
                    });
                    const regexpErrorMessages = [];
                    regexps.forEach((item) => {
                        let matches = item.regexp.test(parsedValue);
                        if (item.invert) {
                            matches = !matches;
                        }
                        if (!matches) {
                            regexpErrorMessages.push(
                                item.message ||
                                    `Failed regular expression ${item.regexp.toString()}`
                            );
                        }
                    });
                    if (regexpErrorMessages.length) {
                        diagnosis = Constants.DIAGNOSIS.INVALID;
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
         * Validates that all values in the given "set" (an Array) are present in options.values.
         * If any are missing, this will not validate.
         * @param {Array} value
         * @param {*} options
         */
        function validateTextSet(set, options) {
            let errorMessage, diagnosis, parsedSet;
            // values are raw, no parsing.

            if (set === null) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (!(set instanceof Array)) {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be an array';
            } else {
                parsedSet = set.filter((setValue) => {
                    return !StringUtil.isEmptyString(setValue);
                });
                if (parsedSet.length === 0) {
                    if (options.required) {
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (options.values) {
                    const matchedSet = parsedSet.filter((setValue) => {
                        return options.values.indexOf(setValue) >= 0;
                    });
                    if (matchedSet.length !== parsedSet.length) {
                        diagnosis = Constants.DIAGNOSIS.INVALID;
                        errorMessage = 'Value not in the set';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.VALID;
                    }
                } else {
                    // no more validation, just having a set is ok.
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value: set,
                parsedValue: parsedSet,
            };
        }

        function stringToBoolean(value) {
            switch (value.toLowerCase(value)) {
                case 'true':
                case 't':
                case 'yes':
                case 'y':
                    return true;
                case 'false':
                case 'f':
                case 'no':
                case 'n':
                    return false;
                default:
                    throw new Error('Invalid format for boolean: ' + value);
            }
        }

        /**
         * As with all validators, the key is that this validates form input,
         * in its raw form. For booleans is a string taking the form of a boolean
         * symbol. E.g. a checkbox may have a value of "true" or falsy, or a boolean
         * may be represented as a two or three state dropdown or set of radio buttons,
         * etc.
         * @param {string|boolean} value
         * @param {*} options
         * - required - boolean
         */
        function validateBoolean(value, options) {
            let parsedValue,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;

            if (StringUtil.isEmptyString(value)) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                try {
                    parsedValue = stringToBoolean(value);
                } catch (ex) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = ex.message;
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

        function validateTrue(value) {
            return {
                isValid: true,
                errorMessage: null,
                diagnosis: Constants.DIAGNOSIS.VALID,
                value,
                parsedValue: value,
            };
        }

        function importTextString(value) {
            if (value === undefined || value === null) {
                return null;
            }
            return value;
        }

        function importIntString(value, nonIntError) {
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
            try {
                return Util.toInteger(plainValue);
            } catch (err) {
                if (nonIntError) {
                    throw new Error(nonIntError);
                }
                throw err;
            }
        }

        return {
            validateWorkspaceDataPaletteRef,
            validateWorkspaceObjectName,
            validateWorkspaceObjectRef,
            validateInteger,
            validateIntString,
            validateIntegerField: validateIntString,
            validateFloat,
            validateFloatString,
            validateTextString,
            validateSet,
            validateTextSet,
            validateStringSet: validateTextSet,
            validateBoolean,
            validateTrue,
            importTextString,
            importIntString,
        };
    }

    return Validators();
});
